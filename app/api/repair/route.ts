import { NextRequest } from 'next/server'
import { hydra } from '@/lib/hydra'
import { getAllPages, upsertPageHealth } from '@/lib/db-helpers'

export async function POST(_req: NextRequest) {
  const errors: string[] = []
  let repaired = 0

  let hydraItems: any[] = []
  try {
    const res = await hydra.fetch.listData({
      tenant_id: 'default',
      kind: 'knowledge',
      page: 1,
      page_size: 100,
    }) as any
    hydraItems = res?.sources ?? []
  } catch (e: any) {
    return Response.json({ error: `Failed to fetch HydraDB: ${e.message}` }, { status: 500 })
  }

  const total = hydraItems.length
  const existingSlugs = new Set(getAllPages().map(p => p.slug))

  for (const item of hydraItems) {
    const slug = (item.document_metadata?.slug as string) || item.id
    if (existingSlugs.has(slug)) continue

    try {
      upsertPageHealth({
        slug,
        title: item.title || slug,
        type: item.document_metadata?.category ?? 'concept',
        summary: item.document_metadata?.summary ?? undefined,
        source_id: item.document_metadata?.sourceId
          ? parseInt(item.document_metadata.sourceId, 10)
          : undefined,
        confidence: 100,
        hydra_doc_id: item.id,
      })
      repaired++
    } catch (e: any) {
      errors.push(`${slug}: ${e.message}`)
    }
  }

  return Response.json({ repaired, total, errors })
}
