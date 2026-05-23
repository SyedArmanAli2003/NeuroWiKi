import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { hydra, ensureTenant, waitForIngestion } from '@/lib/hydra'
import {
  renamePageSlug,
  pageSlugExists,
  upsertPageHealth,
  upsertPageLinks,
  getPageBySlug,
} from '@/lib/db-helpers'
import { db } from '@/lib/db'

function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(s)
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug: oldSlug } = await context.params
  const { newSlug, newTitle } = await req.json()

  if (!newSlug || typeof newSlug !== 'string') {
    return NextResponse.json({ error: 'newSlug required' }, { status: 400 })
  }
  const normalized = newSlug.trim().toLowerCase()
  const titleOverride = typeof newTitle === 'string' && newTitle.trim() ? newTitle.trim() : null
  if (!isValidSlug(normalized)) {
    return NextResponse.json({ error: 'Invalid slug: lowercase letters, digits, hyphens; must start alphanumeric' }, { status: 400 })
  }
  if (normalized === oldSlug && !titleOverride) {
    return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
  }
  if (normalized !== oldSlug && pageSlugExists(normalized)) {
    return NextResponse.json({ error: 'A page with that slug already exists' }, { status: 409 })
  }

  const existingPage = getPageBySlug(oldSlug)
  if (!existingPage) {
    return NextResponse.json({ error: 'Page not found in local index' }, { status: 404 })
  }

  try {
    await ensureTenant('default')

    // Fetch content from HydraDB by direct source_id (more reliable than recall)
    let markdown = ''
    let title = existingPage.title
    let type = existingPage.type ?? 'concept'
    let summary = existingPage.summary ?? ''
    let meta: any = {}

    try {
      const res = await hydra.fetch.listData({
        tenant_id: 'default',
        kind: 'knowledge',
        source_ids: [existingPage.hydra_doc_id!],
      }) as any
      const source = (res?.sources ?? [])[0]
      if (source) {
        markdown = source.content?.markdown ?? source.description ?? ''
        title = source.title ?? title
        meta = source.document_metadata ?? {}
        type = meta.category ?? type
        summary = meta.summary ?? summary
      }
    } catch (e) {
      console.warn('[rename] Failed to fetch existing page from HydraDB, proceeding with SQLite snapshot:', e)
    }

    // Apply title override + rewrite the H1 in the markdown body
    if (titleOverride) {
      const oldTitle = title
      title = titleOverride
      // Replace the leading "# {oldTitle}" or any leading "# ..." line with the new title
      if (markdown) {
        markdown = markdown.replace(/^#\s+.+\n?/, `# ${title}\n`)
        // Also replace inline occurrences of old title verbatim (safe-ish: only first to avoid clobbering)
        if (oldTitle && oldTitle !== title) {
          markdown = markdown.replace(oldTitle, title)
        }
      }
    }

    if (!markdown) {
      markdown = `# ${title}\n\n${summary}`
    }

    // Re-upload under new id. HydraDB assigns a fresh source_id.
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
        document_metadata: {
          ...meta,
          category: type,
          summary,
          slug: normalized,
          renamedFrom: oldSlug,
          renamedAt: new Date().toISOString(),
        },
      }]),
    }) as any
    const newSourceId = uploadResponse?.results?.[0]?.source_id
    if (!newSourceId) {
      return NextResponse.json({ error: 'HydraDB upload returned no source_id' }, { status: 500 })
    }
    await waitForIngestion(newSourceId, 'default')

    // Delete old doc only if the slug changed (otherwise we just title-updated the same id)
    if (normalized !== oldSlug) {
      try {
        await hydra.upload.deleteMemory({
          tenant_id: 'default',
          memory_id: existingPage.hydra_doc_id!,
        })
      } catch (e) {
        console.warn('[rename] Failed to delete old hydra memory; orphan possible:', e)
      }
    }

    // Update SQLite atomically: pages.slug, page_links, slug_aliases (only when slug changed)
    if (normalized !== oldSlug) renamePageSlug(oldSlug, normalized)
    upsertPageHealth({
      slug: normalized,
      title,
      type,
      summary,
      confidence: 100,
      hydra_doc_id: newSourceId,
    })

    // Refresh wikilink graph from current content
    db.prepare(`DELETE FROM page_links WHERE source_slug = ?`).run(normalized)
    const linkedSlugs = [...markdown.matchAll(/\[\[([^\]]+)\]\]/g)].map((m: any) => m[1].trim())
    if (linkedSlugs.length) upsertPageLinks(normalized, linkedSlugs)

    // Bust Next.js fetch + page caches so /wiki list and /wiki/[slug] reflect the rename
    revalidatePath('/wiki')
    revalidatePath(`/wiki/${oldSlug}`)
    revalidatePath(`/wiki/${normalized}`)

    return NextResponse.json({ oldSlug, newSlug: normalized, hydra_doc_id: newSourceId })
  } catch (error: any) {
    console.error(`[rename] Failed ${oldSlug} → ${normalized}:`, error)
    return NextResponse.json({ error: error?.message ?? 'Rename failed' }, { status: 500 })
  }
}
