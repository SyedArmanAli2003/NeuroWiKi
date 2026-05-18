import { hydra } from '@/lib/hydra'
import { db } from '@/lib/db'

interface EchoItem {
  quote: string
  source: string
  sourceType: 'diary' | 'wiki'
  date: string | null
  daysAgo: number | null
  reason: string
  href?: string
}

function daysBetween(a: string, b: string): number {
  const ta = new Date(a + 'T12:00:00').getTime()
  const tb = new Date(b + 'T12:00:00').getTime()
  return Math.round(Math.abs(ta - tb) / 86400000)
}

function relTime(days: number | null): string {
  if (days == null) return ''
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.round(days / 7)} weeks ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  return `${Math.round(days / 365)} years ago`
}

function snippetReason(query: string): string {
  const cleaned = query.replace(/\s+/g, ' ').trim().slice(0, 60)
  if (!cleaned) return 'related to today'
  return `because you wrote "${cleaned}${query.length > 60 ? '…' : ''}"`
}

export async function POST(req: Request) {
  const { query, excludeDate } = await req.json()
  if (!query?.trim()) return Response.json({ items: [] })

  const today = excludeDate ?? new Date().toISOString().split('T')[0]
  const items: EchoItem[] = []

  // 1. Search past diary entries from SQLite (keyword match)
  const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 8)
  if (keywords.length > 0) {
    const likeClauses = keywords.map(() => `LOWER(text) LIKE ?`).join(' OR ')
    const params = keywords.map((k: string) => `%${k}%`)
    const pastEntries = db.prepare(`
      SELECT id, date, time, kind, text
      FROM diary_entries
      WHERE date < ? AND (${likeClauses})
      ORDER BY date DESC
      LIMIT 5
    `).all(today, ...params) as any[]

    for (const e of pastEntries) {
      items.push({
        quote: e.text,
        source: `${e.kind} from ${e.date}`,
        sourceType: 'diary',
        date: e.date,
        daysAgo: daysBetween(today, e.date),
        reason: snippetReason(query),
      })
    }
  }

  // 2. Search wiki via HydraDB
  try {
    const res = await hydra.recall.fullRecall({
      tenant_id: 'default',
      query,
      max_results: 4,
    })
    const chunks = (res?.chunks ?? []) as any[]
    for (const c of chunks) {
      const meta: any = c.metadata ?? {}
      if (meta.category === 'diary' && meta.date === today) continue
      const isWikiDiary = meta.category === 'diary'
      const content: string = String(c.chunk_content ?? c.content ?? '')

      items.push({
        quote: content.slice(0, 220),
        source: String(c.source_title ?? meta.slug ?? 'Memory'),
        sourceType: isWikiDiary ? 'diary' : 'wiki',
        date: meta.date ?? null,
        daysAgo: meta.date ? daysBetween(today, String(meta.date)) : null,
        reason: snippetReason(query),
        href: !isWikiDiary && meta.slug ? `/wiki/${meta.slug}` : undefined,
      })
    }
  } catch {
    // ignore
  }

  // Dedupe + cap at 3
  const seen = new Set<string>()
  const deduped = items.filter((it) => {
    const key = it.quote.slice(0, 80)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 3)

  return Response.json({ items: deduped })
}

export async function GET(req: Request) {
  // Legacy GET — empty fallback
  return Response.json({ items: [] })
}
