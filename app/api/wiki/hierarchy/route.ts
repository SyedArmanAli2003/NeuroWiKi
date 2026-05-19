import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { listPageMeta } from '@/lib/hydra-fetch'

export const revalidate = 60

export async function GET() {
  try {
    const items = await listPageMeta()

    // Link counts from SQLite
    const backlinkRows = db.prepare(
      `SELECT target_slug, COUNT(*) as cnt FROM page_links GROUP BY target_slug`
    ).all() as Array<{ target_slug: string; cnt: number }>
    const backlinkMap = new Map(backlinkRows.map((r) => [r.target_slug, r.cnt]))

    const slugSet = new Set(items.map((i) => i.slug))

    // outlinks → only count those pointing to existing pages
    const outlinkRows = db.prepare(
      `SELECT source_slug, target_slug FROM page_links`
    ).all() as Array<{ source_slug: string; target_slug: string }>
    const outlinkExistingMap = new Map<string, number>()
    for (const row of outlinkRows) {
      if (!slugSet.has(row.target_slug)) continue
      outlinkExistingMap.set(row.source_slug, (outlinkExistingMap.get(row.source_slug) ?? 0) + 1)
    }

    // breakdown children: items whose breakdownSource contains parent slug
    const breakdownChildrenMap = new Map<string, number>()
    const isBreakdownChild = new Set<string>()
    for (const item of items) {
      const bs = item.breakdownSource ?? []
      if (bs.length > 0) {
        isBreakdownChild.add(item.slug)
        for (const parent of bs) {
          breakdownChildrenMap.set(parent, (breakdownChildrenMap.get(parent) ?? 0) + 1)
        }
      }
    }

    // Parent set: pages that aren't breakdown children (unless high-centrality hub).
    const parents = items
      .filter((item) => {
        const backlinkCount = backlinkMap.get(item.slug) ?? 0
        return !isBreakdownChild.has(item.slug) || backlinkCount >= 3
      })
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        type: item.type,
        summary: item.summary,
        breakdownChildCount: breakdownChildrenMap.get(item.slug) ?? 0,
        outlinkCount: outlinkExistingMap.get(item.slug) ?? 0,
        backlinkCount: backlinkMap.get(item.slug) ?? 0,
        updated_at: item.verifiedAt || item.timestamp || '',
      }))

    // Sort: pages w/ structural children first, then by centrality
    parents.sort((a, b) =>
      (b.breakdownChildCount - a.breakdownChildCount) ||
      (b.backlinkCount - a.backlinkCount) ||
      (b.outlinkCount - a.outlinkCount)
    )

    return NextResponse.json({ parents })
  } catch (error: any) {
    console.error('Error fetching hierarchy:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
