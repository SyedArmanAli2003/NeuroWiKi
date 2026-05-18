import { NextRequest, NextResponse } from 'next/server'
import { hydra } from '@/lib/hydra'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  try {
    const items: any[] = []
    let page = 1
    try {
      while (true) {
        const response = (await hydra.fetch.listData({
          tenant_id: 'default',
          kind: 'knowledge',
          page,
          page_size: 100,
        })) as any
        const batch: any[] = response?.sources ?? []
        items.push(...batch)
        if (batch.length < 100) break
        page++
      }
    } catch (e: any) {
      if (!e.message?.includes('Tenant default does not exist') && e.status !== 404) {
        throw e
      }
    }

    const slugSet = new Set(items.map((i: any) => (i.document_metadata?.slug as string) || i.id))
    const childSlugs = new Set<string>()

    // (a) Breakdown-derived children
    for (const item of items) {
      const meta = item.document_metadata ?? {}
      const bs = meta.breakdownSource
      if (bs) {
        const sources = Array.isArray(bs) ? bs : [bs]
        if (sources.includes(slug)) {
          childSlugs.add((meta.slug as string) || item.id)
        }
      }
    }

    // (b) Outlinks from page_links
    const linkedRows = db.prepare(
      `SELECT target_slug FROM page_links WHERE source_slug = ?`
    ).all(slug) as Array<{ target_slug: string }>
    for (const r of linkedRows) {
      if (slugSet.has(r.target_slug) && r.target_slug !== slug) {
        childSlugs.add(r.target_slug)
      }
    }

    const itemMap = new Map(
      items.map((i: any) => [(i.document_metadata?.slug as string) || i.id, i])
    )

    const children = Array.from(childSlugs)
      .map(s => {
        const item = itemMap.get(s)
        if (!item) return null
        const meta = item.document_metadata ?? {}
        return {
          slug: s,
          title: (item.title as string) || s,
          type: (meta.category as string) || 'concept',
          summary: (meta.summary as string) || '',
        }
      })
      .filter(Boolean)

    return NextResponse.json({ children })
  } catch (error: any) {
    console.error(`Error fetching children for ${slug}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
