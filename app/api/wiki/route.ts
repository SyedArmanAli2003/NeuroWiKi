import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { ensureTenant } from '@/lib/hydra'
import { getAllWikiPages } from '@/lib/firestore-db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  const tenantId = `user-${userId}`
  await ensureTenant(tenantId)

  const { searchParams } = new URL(req.url)
  const includeDiary = searchParams.get('includeDiary') === '1'
  const onlyDiary    = searchParams.get('onlyDiary')    === '1'

  try {
    const firestorePages = await getAllWikiPages(userId)

    const allPages = firestorePages.map((item) => ({
      slug:       item.slug,
      title:      item.title,
      type:       item.type || 'concept',
      summary:    item.summary || '',
      updated_at: item.updatedAt || item.createdAt || '',
      hydra_id:   item.id, // using firestore document ID as hydra_id equivalent
    }))

    let pages = allPages
    if (onlyDiary)        pages = allPages.filter((p) => p.type === 'diary')
    else if (!includeDiary) pages = allPages.filter((p) => p.type !== 'diary')

    return NextResponse.json({ pages })
  } catch (error: any) {
    console.error('Error fetching wiki pages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
