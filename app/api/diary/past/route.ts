import { getPastDays } from '@/lib/diary-db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '14', 10)
  const days = getPastDays(limit)
  return Response.json({ days })
}
