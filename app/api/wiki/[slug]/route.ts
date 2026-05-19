import { NextRequest, NextResponse } from 'next/server'
import { hydra, ensureTenant, waitForIngestion } from '@/lib/hydra'
import { db } from '@/lib/db'
import { upsertPageHealth, upsertPageLinks, getSourceById } from '@/lib/db-helpers'
import { fetchPage } from '@/lib/hydra-fetch'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  try {
    const page = await fetchPage(slug)
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Resolve sources from SQLite
    const sourceIds: number[] = []
    if (page.sourceId !== undefined && page.sourceId !== null) {
      const n = parseInt(String(page.sourceId), 10)
      if (!isNaN(n)) sourceIds.push(n)
    }
    const pageSources = sourceIds
      .map((id) => getSourceById(id))
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => ({
        title: s.title ?? 'Source',
        url: s.url ?? undefined,
        raw_content: s.raw_content ?? '',
      }))

    // Related pages via fullRecall (still vector search — this is its actual job)
    let relatedPages: any[] = []
    try {
      const relatedResponse = (await hydra.recall.fullRecall({
        tenant_id: 'default',
        query: page.title,
        max_results: 6,
        graph_context: true,
      })) as any
      relatedPages = (relatedResponse.sources ?? [])
        .filter((s: any) => ((s.document_metadata?.slug as string) || s.id) !== page.slug)
        .slice(0, 5)
        .map((s: any) => ({
          slug: (s.document_metadata?.slug as string) || s.id,
          title: s.title ?? 'Unknown',
          summary: (s.document_metadata?.summary as string) || '',
          type: (s.document_metadata?.category as string) || 'concept',
        }))
    } catch (e) {
      console.warn(`[wiki:${slug}] related recall failed:`, (e as Error)?.message)
    }

    // Backlinks from SQLite
    const backlinkRows = db.prepare(`
      SELECT pl.source_slug, p.title
      FROM page_links pl
      LEFT JOIN pages p ON p.slug = pl.source_slug
      WHERE pl.target_slug = ?
    `).all(slug) as Array<{ source_slug: string; title: string | null }>
    const backlinks = backlinkRows.map((r) => ({
      slug: r.source_slug,
      title: r.title ?? r.source_slug,
    }))

    return NextResponse.json({
      page: {
        slug: page.slug,
        title: page.title || 'Unknown Title',
        type: page.type,
        summary: page.summary,
        content: page.content.replace(/^#\s+.+\n+/, ''),
        sources: pageSources,
        created_at: page.timestamp || '',
      },
      relatedPages,
      backlinks,
    })
  } catch (error: any) {
    console.error(`Error fetching page ${slug}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { title, content, summary, type } = await req.json()

  try {
    await ensureTenant('default')
    const cleanedContent = content.replace(/^#\s+.+\n+/, '')

    const uploadResponse = (await hydra.upload.knowledge({
      tenant_id: 'default',
      upsert: true,
      app_knowledge: JSON.stringify([
        {
          tenant_id: 'default',
          sub_tenant_id: 'default',
          id: slug,
          title,
          type: 'document',
          content: { markdown: `# ${title}\n\n${cleanedContent}` },
          document_metadata: {
            category: type ?? 'concept',
            summary: summary ?? '',
            slug,
            verified: true,
            verifiedAt: new Date().toISOString(),
            manuallyEdited: true,
          },
        },
      ]),
    })) as any

    const realSourceId = uploadResponse?.results?.[0]?.source_id ?? slug
    const ready = await waitForIngestion(realSourceId, 'default')

    upsertPageHealth({
      slug,
      title,
      type: type ?? 'concept',
      summary: summary ?? '',
      confidence: ready ? 100 : 60,
      stale_reason: ready ? undefined : 'Indexing may be incomplete',
      hydra_doc_id: realSourceId,
    })

    db.prepare(`DELETE FROM page_links WHERE source_slug = ?`).run(slug)
    const linkedSlugs = [...cleanedContent.matchAll(/\[\[([^\]]+)\]\]/g)].map((m: any) => m[1].trim())
    if (linkedSlugs.length) upsertPageLinks(slug, linkedSlugs)

    return NextResponse.json({ page: { slug, title, content: cleanedContent, summary, type } })
  } catch (error: any) {
    console.error(`Error updating page ${slug}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
