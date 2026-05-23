import { NextRequest, NextResponse } from 'next/server'
import { llm, loggedGenerateObject } from '@/lib/llm'
import { z } from 'zod'
import { hydra, ensureTenant, waitForIngestion } from '@/lib/hydra'
import { upsertPageHealth, upsertPageLinks, getAllPages } from '@/lib/db-helpers'
import { listPages, invalidateKnowledgeListCache } from '@/lib/hydra-fetch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

const PageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  type: z.enum(['concept', 'person', 'place', 'event', 'tool', 'organization']),
  summary: z.string(),
  content: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const tenantId = `user-${userId}`

  const { entities } = await req.json() as {
    entities: Array<{ entity: string; mentionedIn: string[] }>
  }

  if (!entities?.length) {
    return NextResponse.json({ error: 'entities required' }, { status: 400 })
  }

  try {
    await ensureTenant(tenantId)

    const allHydraPages = await listPages(tenantId)
    const slugToContent = new Map(allHydraPages.map((p) => [p.slug, p]))
    const existingHydraIds = getAllPages().map(p => p.hydra_doc_id).filter((id): id is string => !!id)
    const existingSlugs = allHydraPages.map(p => p.slug)

    const created: Array<{ slug: string; title: string; type: string }> = []
    const failed: Array<{ entity: string; error: string }> = []

    for (const { entity, mentionedIn } of entities) {
      const slug = slugify(entity)

      // Build context from source pages that mention this entity
      const sourcePagesContext = mentionedIn
        .map(s => slugToContent.get(s))
        .filter(Boolean)
        .map(p => `### ${p!.title} (${p!.slug})\n${p!.content.slice(0, 800)}`)
        .join('\n\n---\n\n')

      if (!sourcePagesContext) {
        failed.push({ entity, error: 'Source pages not found in wiki' })
        continue
      }

      try {
        const { object: page } = await loggedGenerateObject('wiki-breakdown', {
          model: llm(),
          schema: PageSchema,
          prompt: `You are a wiki compiler. Create a wiki page for the entity "${entity}" using ONLY the information present in the source pages below. Do not add anything from training knowledge.

ENTITY TO DOCUMENT: ${entity}
SUGGESTED SLUG: ${slug}

SOURCE PAGES THAT MENTION THIS ENTITY:
${sourcePagesContext}

EXISTING WIKI SLUGS (use [[slug]] wikilinks to link to these):
${existingSlugs.join(', ')}

Rules:
- slug: use "${slug}" exactly
- title: human-readable name for "${entity}"
- type: best fit — concept | person | place | event | tool | organization
- summary: one sentence describing what this entity is and its significance
- content: 150-250 word encyclopedic markdown. Use [[wikilinks]] to link back to source pages. Only facts from the source pages above.`,
        })

        const uploadResponse = await hydra.upload.knowledge({
          tenant_id: tenantId,
          upsert: true,
          app_knowledge: JSON.stringify([{
            tenant_id: tenantId,
            sub_tenant_id: 'default',
            id: page.slug,
            title: page.title,
            type: 'document',
            content: { markdown: `# ${page.title}\n\n${page.content}` },
            document_metadata: {
              category: page.type,
              summary: page.summary,
              verified: true,
              verifiedAt: new Date().toISOString(),
              slug: page.slug,
              breakdownSource: mentionedIn,
            },
            ...(existingHydraIds.length > 0 && {
              relations: { cortex_source_ids: existingHydraIds },
            }),
          }]),
        }) as any

        const realSourceId = uploadResponse?.results?.[0]?.source_id ?? page.slug
        const ready = await waitForIngestion(realSourceId, tenantId)

        upsertPageHealth({
          slug: page.slug,
          title: page.title,
          type: page.type,
          summary: page.summary,
          confidence: ready ? 100 : 60,
          hydra_doc_id: realSourceId,
        })

        const linkedSlugs = [...page.content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].trim())
        if (linkedSlugs.length) upsertPageLinks(page.slug, linkedSlugs)

        created.push({ slug: page.slug, title: page.title, type: page.type })
      } catch (e: any) {
        console.error(`[breakdown] Failed to create page for "${entity}":`, e)
        failed.push({ entity, error: e.message ?? 'Unknown error' })
      }
    }

    // Invalidate the cache for this user
    invalidateKnowledgeListCache(tenantId)

    return NextResponse.json({ created, failed })
  } catch (error: any) {
    console.error('[breakdown] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
