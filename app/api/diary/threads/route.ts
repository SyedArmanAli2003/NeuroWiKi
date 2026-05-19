import { db } from '@/lib/db'

export async function GET() {
  // Build threads from pages that have both outgoing and incoming links (interconnected = open threads)
  const pages = db.prepare(`
    SELECT p.slug, p.title, p.type, p.summary, p.updated_at,
           COUNT(DISTINCT pl_out.target_slug) as out_links,
           COUNT(DISTINCT pl_in.source_slug) as in_links
    FROM pages p
    LEFT JOIN page_links pl_out ON pl_out.source_slug = p.slug
    LEFT JOIN page_links pl_in ON pl_in.target_slug = p.slug
    GROUP BY p.slug
    HAVING out_links > 0 OR in_links > 0
    ORDER BY p.updated_at DESC
    LIMIT 6
  `).all() as any[]

  const threads = pages.map((p, i) => {
    const heat = Math.min(1, (p.out_links + p.in_links) / 10)
    const sources: string[] = []
    if (p.type) sources.push(p.type)

    return {
      id: p.slug,
      question: p.title,
      note: p.summary ?? '',
      pages: p.out_links + p.in_links,
      lastTouched: p.updated_at ?? 'recently',
      heat,
      sources,
    }
  })

  return Response.json({ threads })
}
