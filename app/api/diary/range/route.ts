import { getEntriesInRange } from '@/lib/diary-db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (!from || !to) {
    return Response.json({ error: 'Missing from/to' }, { status: 400 })
  }
  const entries = getEntriesInRange(from, to)
  return Response.json({ entries })
}
