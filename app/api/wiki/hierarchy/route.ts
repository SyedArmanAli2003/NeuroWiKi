import { NextResponse } from 'next/server'
import { hydra } from '@/lib/hydra'
import { db } from '@/lib/db'

export const revalidate = 60

export async function GET() {
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

    // Backlink counts from SQLite
    const backlinkRows = db.prepare(
      `SELECT target_slug, COUNT(*) as cnt FROM page_links GROUP BY target_slug`
    ).all() as Array<{ target_slug: string; cnt: number }>
    const backlinkMap = new Map(backlinkRows.map(r => [r.target_slug, r.cnt]))

    // Outlink counts (how many children each parent has via page_links)
    const outlinkRows = db.prepare(
      `SELECT source_slug, COUNT(*) as cnt FROM page_links GROUP BY source_slug`
    ).all() as Array<{ source_slug: string; cnt: number }>
    const outlinkMap = new Map(outlinkRows.map(r => [r.source_slug, r.cnt]))

    const allSlugs = items.map((item: any) => (item.document_metadata?.slug as string) || item.id)
    const slugSet = new Set(allSlugs)

    // Build breakdown-child set: slugs that have breakdownSource set
    const childSlugs = new Set<string>()
    for (const item of items) {
      const meta = item.document_metadata ?? {}
      const bs = meta.breakdownSource
      if (bs && (Array.isArray(bs) ? bs.length > 0 : true)) {
        const slug = (meta.slug as string) || item.id
        childSlugs.add(slug)
      }
    }

    const parents: any[] = []

    for (const item of items) {
      const meta = item.document_metadata ?? {}
      const slug = (meta.slug as string) || item.id
      const backlinkCount = backlinkMap.get(slug) ?? 0
      const bs = meta.breakdownSource

      const isBreakdownChild = bs && (Array.isArray(bs) ? bs.length > 0 : true)
      const isHighCentrality = backlinkCount >= 3

      if (!isBreakdownChild || isHighCentrality) {
        // Count children: breakdown pages that reference this slug + outlinks
        let childCount = 0
        for (const ci of items) {
          const cmeta = ci.document_metadata ?? {}
          const cbs = cmeta.breakdownSource
          if (cbs) {
            const sources = Array.isArray(cbs) ? cbs : [cbs]
            if (sources.includes(slug)) childCount++
          }
        }
        // Also add outlinks to pages that exist
        const outlinkCount = outlinkMap.get(slug) ?? 0
        const linkedSlugs = db.prepare(
          `SELECT target_slug FROM page_links WHERE source_slug = ?`
        ).all(slug) as Array<{ target_slug: string }>
        const linkedExisting = linkedSlugs.filter(r => slugSet.has(r.target_slug)).length
        childCount = Math.max(childCount, linkedExisting)

        parents.push({
          slug,
          title: (item.title as string) || '',
          type: (meta.category as string) || 'concept',
          summary: (meta.summary as string) || '',
          childCount,
          backlinkCount,
          updated_at: (meta.verifiedAt as string) || (item.timestamp as string) || '',
        })
      }
    }

    // Sort: most children first, then backlinks
    parents.sort((a, b) => (b.childCount - a.childCount) || (b.backlinkCount - a.backlinkCount))

    return NextResponse.json({ parents })
  } catch (error: any) {
    console.error('Error fetching hierarchy:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
