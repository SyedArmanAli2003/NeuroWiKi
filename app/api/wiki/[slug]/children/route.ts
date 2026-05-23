import { NextRequest, NextResponse } from 'next/server'
import { listAllKnowledgeRaw } from '@/lib/hydra-fetch'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const tenantId = `user-${userId}`

  const { slug } = await context.params

  try {
    const items = await listAllKnowledgeRaw(tenantId)

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
