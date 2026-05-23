import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { hydra } from '@/lib/hydra'
import { invalidateKnowledgeListCache } from '@/lib/hydra-fetch'
import { deleteWikiPageBySlug } from '@/lib/firestore-db'

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
    }
  }

  try {
    await deleteWikiPageBySlug(userId, slug)
  } catch (e) {
    console.warn('[wiki/delete] Firestore cleanup error:', e)
  }

  // Bust the list cache so next load reflects deletion
  invalidateKnowledgeListCache(tenantId)

  return NextResponse.json({ ok: true })
}
