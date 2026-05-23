import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { listAllKnowledgeRaw } from '@/lib/hydra-fetch'
import { ensureTenant } from '@/lib/hydra'

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
    const items = await listAllKnowledgeRaw(tenantId)

    const allPages = items.map((item: any) => ({
      slug:       (item.document_metadata?.slug  as string) || item.id,
      title:      (item.title                    as string) || '',
      type:       (item.document_metadata?.category as string) || 'concept',
      summary:    (item.document_metadata?.summary  as string) || '',
      updated_at: (item.document_metadata?.verifiedAt as string) || (item.timestamp as string) || '',
      hydra_id:   item.id as string,
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
