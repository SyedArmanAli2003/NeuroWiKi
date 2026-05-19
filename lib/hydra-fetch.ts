import { hydra } from './hydra'

export interface WikiPage {
  slug: string
  title: string
  content: string
  summary: string
  type: string
  sourceSentences: string[]
  sourceId?: string
  verifiedAt?: string
  manuallyEdited?: boolean
  breakdownSource?: string[]
  timestamp?: string
  raw: any
}

// HydraDB stores knowledge body in chunks (chunk_content = JSON of the uploaded doc).
// Metadata lives on the source row (listData). We use both.

function parseChunkDoc(chunkContent: string): any {
  if (!chunkContent) return null
  try {
    const parsed = JSON.parse(chunkContent)
    return Array.isArray(parsed) ? parsed[0] : parsed
  } catch {
    // Truncated/partial JSON — regex fallback for "markdown": "..."
    const m = chunkContent.match(/"markdown"\s*:\s*"((?:[^"\\]|\\.)*)/)
    if (m?.[1]) {
      try {
        const md = JSON.parse(`"${m[1]}"`)
        return { content: { markdown: md } }
      } catch {
        return { content: { markdown: m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') } }
      }
    }
    return null
  }
}

function buildPage(slug: string, sourceItem: any | null, chunkDoc: any | null): WikiPage | null {
  if (!sourceItem && !chunkDoc) return null
  const meta = chunkDoc?.document_metadata ?? sourceItem?.document_metadata ?? sourceItem?.additional_metadata ?? {}
  const md = chunkDoc?.content?.markdown ?? chunkDoc?.markdown ?? sourceItem?.content?.markdown ?? ''
  const bs = meta.breakdownSource
  return {
    slug: (meta.slug as string) || sourceItem?.id || slug,
    title: sourceItem?.title ?? chunkDoc?.title ?? meta.title ?? '',
    content: md || '',
    summary: meta.summary ?? '',
    type: meta.category ?? 'concept',
    sourceSentences: Array.isArray(meta.sourceSentences) ? meta.sourceSentences : [],
    sourceId: meta.sourceId,
    verifiedAt: meta.verifiedAt,
    manuallyEdited: meta.manuallyEdited === true,
    breakdownSource: Array.isArray(bs) ? bs : bs ? [bs] : undefined,
    timestamp: chunkDoc?.timestamp ?? sourceItem?.timestamp,
    raw: { sourceItem, chunkDoc },
  }
}

// Single canonical fetch by slug. Combines listData (meta) + fullRecall chunks (body).
export async function fetchPage(slug: string, tenantId: string = 'default'): Promise<WikiPage | null> {
  let sourceItem: any | null = null
  let chunkDoc: any | null = null

  // Metadata
  try {
    const res = (await hydra.fetch.listData({
      tenant_id: tenantId,
      kind: 'knowledge',
      source_ids: [slug],
    })) as any
    sourceItem = (res?.sources ?? [])[0] ?? null
  } catch (e: any) {
    if (e?.statusCode !== 404) console.warn(`[hydra-fetch] listData(${slug}):`, e?.message)
  }

  // Body — fullRecall returns chunks w/ chunk_content (JSON of original upload doc)
  try {
    const recall = (await hydra.recall.fullRecall({
      tenant_id: tenantId,
      query: slug,
      max_results: 20,
    })) as any
    const chunks: any[] = recall?.chunks ?? []
    const match = chunks.find((c) => c.source_id === slug) ?? chunks.find((c) => {
      const d = parseChunkDoc(c.chunk_content)
      return d?.document_metadata?.slug === slug || d?.id === slug
    })
    if (match) chunkDoc = parseChunkDoc(match.chunk_content)
  } catch (e: any) {
    console.warn(`[hydra-fetch] fullRecall(${slug}):`, e?.message)
  }

  return buildPage(slug, sourceItem, chunkDoc)
}

// Bulk meta listing (no content body). Use for indexes/hierarchy.
export async function listPageMeta(tenantId: string = 'default'): Promise<Array<Pick<WikiPage, 'slug' | 'title' | 'summary' | 'type' | 'timestamp' | 'verifiedAt' | 'breakdownSource'>>> {
  const out: any[] = []
  let page = 1
  try {
    while (true) {
      const res = (await hydra.fetch.listData({
        tenant_id: tenantId,
        kind: 'knowledge',
        page,
        page_size: 100,
      })) as any
      const batch: any[] = res?.sources ?? []
      for (const item of batch) {
        const meta = item?.document_metadata ?? {}
        const bs = meta.breakdownSource
        out.push({
          slug: (meta.slug as string) || item?.id || '',
          title: item?.title ?? '',
          summary: meta.summary ?? '',
          type: meta.category ?? 'concept',
          timestamp: item?.timestamp,
          verifiedAt: meta.verifiedAt,
          breakdownSource: Array.isArray(bs) ? bs : bs ? [bs] : undefined,
        })
      }
      if (batch.length < 100) break
      page++
      if (page > 50) break
    }
  } catch (e: any) {
    if (e?.statusCode !== 404) console.warn('[hydra-fetch] listPageMeta:', e?.message)
  }
  return out
}

// Bulk pages WITH content (slower — calls fetchPage per slug in parallel batches).
// Use only when callers genuinely need body for many pages (lint, breakdown context).
export async function listPages(tenantId: string = 'default', limit?: number): Promise<WikiPage[]> {
  const metas = await listPageMeta(tenantId)
  const slugs = limit ? metas.slice(0, limit).map((m) => m.slug) : metas.map((m) => m.slug)

  const out: WikiPage[] = []
  const BATCH = 5
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH)
    const pages = await Promise.all(batch.map((s) => fetchPage(s, tenantId)))
    for (const p of pages) if (p) out.push(p)
  }
  return out
}
