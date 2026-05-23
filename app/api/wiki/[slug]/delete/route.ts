import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { hydra } from '@/lib/hydra'
import { invalidateKnowledgeListCache } from '@/lib/hydra-fetch'
import { db } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId   = (session.user as any).id as string
  const tenantId = `user-${userId}`
  const { slug } = params

  try {
    // Delete from HydraDB
    await hydra.delete.deleteSource({
      tenant_id: tenantId,
      source_id: slug,
    })
  } catch (err: any) {
    // 404 = already gone, that's fine
    if (err?.statusCode !== 404) {
      console.error('[wiki/delete] HydraDB error:', err?.message)
      return NextResponse.json({ error: 'Failed to delete from knowledge base.' }, { status: 500 })
    }
  }

  // Also clean up local SQLite references
  try {
    db.prepare(`DELETE FROM pages WHERE slug = ?`).run(slug)
    db.prepare(`DELETE FROM page_links WHERE source_slug = ? OR target_slug = ?`).run(slug, slug)
    db.prepare(`DELETE FROM reindex_queue WHERE hydra_id = ?`).run(slug)
  } catch (e) {
    console.warn('[wiki/delete] SQLite cleanup error:', e)
  }

  // Bust the list cache so next load reflects deletion
  invalidateKnowledgeListCache(tenantId)

  return NextResponse.json({ ok: true })
}
