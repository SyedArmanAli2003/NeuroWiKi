import { NextRequest, NextResponse } from 'next/server'
import { hydra, ensureTenant, waitForIngestion } from '@/lib/hydra'
import { db } from '@/lib/db'
import { upsertPageHealth, upsertPageLinks } from '@/lib/db-helpers'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const { content, summary, title, type } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }

  try {
    await ensureTenant('default')

    const cleanedContent = content.replace(/^#\s+.+\n+/, '')

    const uploadResponse = await hydra.upload.knowledge({
      tenant_id: 'default',
      upsert: true,
      app_knowledge: JSON.stringify([{
        tenant_id: 'default',
        sub_tenant_id: 'default',
        id: slug,
        title: title || slug,
        type: 'document',
        content: { markdown: `# ${title || slug}\n\n${cleanedContent}` },
        document_metadata: {
          category: type ?? 'concept',
          summary: summary ?? '',
          slug,
          verified: true,
          verifiedAt: new Date().toISOString(),
          aiEdited: true,
        },
      }]),
    }) as any

    const realSourceId = uploadResponse?.results?.[0]?.source_id ?? slug
    const ready = await waitForIngestion(realSourceId, 'default')

    upsertPageHealth({
      slug,
      title: title || slug,
      type: type ?? 'concept',
      summary: summary ?? '',
      confidence: ready ? 100 : 60,
      hydra_doc_id: realSourceId,
    })

    // Refresh wikilinks
    db.prepare(`DELETE FROM page_links WHERE source_slug = ?`).run(slug)
    const linkedSlugs = [...cleanedContent.matchAll(/\[\[([^\]]+)\]\]/g)].map((m: any) => m[1].trim())
    if (linkedSlugs.length) upsertPageLinks(slug, linkedSlugs)

    return NextResponse.json({ ok: true, slug })
  } catch (error: any) {
    console.error(`[edit/commit] Error for ${slug}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
