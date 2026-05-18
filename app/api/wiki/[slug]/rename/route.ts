import { NextRequest, NextResponse } from 'next/server'
import { hydra, ensureTenant, waitForIngestion } from '@/lib/hydra'
import { renamePageSlug, pageSlugExists, upsertPageHealth, upsertPageLinks } from '@/lib/db-helpers'
import { db } from '@/lib/db'

function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(s)
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug: oldSlug } = await context.params
  const { newSlug } = await req.json()

  if (!newSlug || typeof newSlug !== 'string') {
    return NextResponse.json({ error: 'newSlug required' }, { status: 400 })
  }
  const normalized = newSlug.trim().toLowerCase()
  if (!isValidSlug(normalized)) {
    return NextResponse.json({ error: 'Invalid slug: lowercase letters, digits, hyphens; must start alphanumeric' }, { status: 400 })
  }
  if (normalized === oldSlug) {
    return NextResponse.json({ error: 'New slug is same as old' }, { status: 400 })
  }
  if (pageSlugExists(normalized)) {
    return NextResponse.json({ error: 'A page with that slug already exists' }, { status: 409 })
  }

  try {
    await ensureTenant('default')

    // Fetch existing page content from HydraDB
    const searchResponse = await hydra.recall.booleanRecall({
      tenant_id: 'default',
      query: oldSlug,
      operator: 'and',
    }) as any
    const sources: any[] = searchResponse.sources ?? []
    const pageSource = sources.find(s => (s.additional_metadata?.slug as string) === oldSlug || s.id === oldSlug) ?? sources[0]
    if (!pageSource) {
      return NextResponse.json({ error: 'Source page not found in HydraDB' }, { status: 404 })
    }
    const chunk = (searchResponse.chunks ?? []).find((c: any) => c.source_id === pageSource.id)
    let parsed: any = null
    try { parsed = chunk?.chunk_content ? JSON.parse(chunk.chunk_content) : null } catch {}
    const markdown: string = parsed?.content?.markdown ?? chunk?.chunk_content ?? ''
    const meta = parsed?.document_metadata ?? pageSource.additional_metadata ?? {}
    const title = parsed?.title || pageSource.title || normalized
    const type = meta.category ?? 'concept'
    const summary = meta.summary ?? ''

    // Re-upload to HydraDB with new ID
    const uploadResponse = await hydra.upload.knowledge({
      tenant_id: 'default',
      upsert: true,
      app_knowledge: JSON.stringify([{
        tenant_id: 'default',
        sub_tenant_id: 'default',
        id: normalized,
        title,
        type: 'document',
        content: { markdown },
        document_metadata: { ...meta, slug: normalized, renamedFrom: oldSlug, renamedAt: new Date().toISOString() },
      }]),
    }) as any
    const newSourceId = uploadResponse?.results?.[0]?.source_id ?? normalized
    await waitForIngestion(newSourceId, 'default')

    // Delete old HydraDB doc — best effort
    try {
      await hydra.upload.deleteMemory({ tenant_id: 'default', memory_id: oldSlug })
    } catch (e) {
      console.warn('[rename] Failed to delete old hydra memory; orphan possible:', e)
    }

    // Update SQLite
    renamePageSlug(oldSlug, normalized)
    upsertPageHealth({
      slug: normalized,
      title,
      type,
      summary,
      confidence: 100,
      hydra_doc_id: newSourceId,
    })
    db.prepare(`DELETE FROM page_links WHERE source_slug = ?`).run(normalized)
    const linkedSlugs = [...markdown.matchAll(/\[\[([^\]]+)\]\]/g)].map((m: any) => m[1].trim())
    if (linkedSlugs.length) upsertPageLinks(normalized, linkedSlugs)

    return NextResponse.json({ oldSlug, newSlug: normalized })
  } catch (error: any) {
    console.error(`[rename] Failed ${oldSlug} → ${normalized}:`, error)
    return NextResponse.json({ error: error?.message ?? 'Rename failed' }, { status: 500 })
  }
}
