import { NextResponse } from 'next/server'
import { hydra } from '@/lib/hydra'

export const revalidate = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const includeDiary = searchParams.get('includeDiary') === '1'
  const onlyDiary = searchParams.get('onlyDiary') === '1'

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
      if (e.message?.includes('Tenant default does not exist') || e.status === 404) {
        console.warn('Tenant default does not exist yet.')
      } else {
        throw e
      }
    }

    const allPages = items.map((item: any) => ({
      slug: (item.document_metadata?.slug as string) || item.id,
      title: (item.title as string) || '',
      type: (item.document_metadata?.category as string) || 'concept',
      summary: (item.document_metadata?.summary as string) || '',
      updated_at: (item.document_metadata?.verifiedAt as string) || (item.timestamp as string) || '',
    }))

    let pages = allPages
    if (onlyDiary) {
      pages = allPages.filter((p) => p.type === 'diary')
    } else if (!includeDiary) {
      pages = allPages.filter((p) => p.type !== 'diary')
    }

    return NextResponse.json({ pages })
  } catch (error: any) {
    console.error('Error fetching wiki pages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
