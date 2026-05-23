import { NextRequest, NextResponse } from 'next/server'
import { hydra, ensureTenant, waitForIngestion } from '@/lib/hydra'
import { getWikiPageBySlug, updateWikiPage, createWikiPage, getAllWikiPages } from '@/lib/firestore-db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getDb } from '@/lib/firebase-admin'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params

  const t0 = Date.now()
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const tenantId = `user-${userId}`

  try {
    const page = await getWikiPageBySlug(userId, slug)
    
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const relatedPromise = hydra.recall.fullRecall({
      tenant_id: tenantId,
      query: slug.replace(/-/g, ' '),
      max_results: 6,
    }).catch((e: any) => {
      console.warn(`[wiki:${slug}] related recall failed:`, e?.message)
      return null
    })

    const backlinksSnapshot = await getDb().collection('wiki_pages')
      .where('userId', '==', userId)
      .where('wikilinks', 'array-contains', slug)
      .get()

    const backlinks = backlinksSnapshot.docs.map((doc) => ({
      slug: doc.data().slug,
      title: doc.data().title ?? doc.data().slug,
    }))

    const relatedResponse = await relatedPromise

    const pageSources: any[] = [] // Simplified for now since sources moved to Firestore

    const relatedPages = ((relatedResponse as any)?.sources ?? [])
      .filter((s: any) => ((s.document_metadata?.slug as string) || s.id) !== page.slug)
      .slice(0, 5)
      .map((s: any) => ({
        slug: (s.document_metadata?.slug as string) || s.id,
        title: s.title ?? 'Unknown',
        summary: (s.document_metadata?.summary as string) || '',
        type: (s.document_metadata?.category as string) || 'concept',
      }))

    console.log(`[wiki:${slug}] total=${Date.now() - t0}ms`)

    return NextResponse.json({
      page: {
        slug: page.slug,
        title: page.title || 'Unknown Title',
        type: page.type,
        summary: page.summary,
        content: page.content.replace(/^#\s+.+\n+/, ''),
        sources: pageSources,
        created_at: page.createdAt || '',
      },
      relatedPages,
      backlinks,
    })
  } catch (error: any) {
    console.error(`Error fetching page ${slug}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { title, content, summary, type } = await req.json()

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const tenantId = `user-${userId}`

  try {
    await ensureTenant(tenantId)
    const cleanedContent = content.replace(/^#\s+.+\n+/, '')

    try {
      const uploadResponse = (await hydra.upload.knowledge({
        tenant_id: tenantId,
        upsert: true,
        app_knowledge: JSON.stringify([
          {
            tenant_id: tenantId,
            sub_tenant_id: 'default',
            id: slug,
            title,
            type: 'document',
            content: { markdown: `# ${title}\n\n${cleanedContent}` },
            document_metadata: {
              category: type ?? 'concept',
              summary: summary ?? '',
              slug,
              verified: true,
              verifiedAt: new Date().toISOString(),
              manuallyEdited: true,
            },
          },
        ]),
      })) as any

      const realSourceId = uploadResponse?.results?.[0]?.source_id ?? slug
      await waitForIngestion(realSourceId, tenantId)
    } catch (hydraErr: any) {
      console.error(`[wiki:${slug}] HydraDB update failed:`, hydraErr?.message)
    }

    const linkedSlugs = [...cleanedContent.matchAll(/\[\[([^\]]+)\]\]/g)].map((m: any) => m[1].trim())
    
    const existingDoc = await getWikiPageBySlug(userId, slug)
    if (existingDoc) {
      await updateWikiPage(userId, existingDoc.id, {
        title,
        content: cleanedContent,
        summary: summary ?? '',
        type: type ?? 'concept',
        wikilinks: linkedSlugs,
      })
    } else {
      await createWikiPage(userId, {
        slug,
        title,
        content: cleanedContent,
        summary: summary ?? '',
        type: type ?? 'concept',
        wikilinks: linkedSlugs,
      })
    }

    return NextResponse.json({ page: { slug, title, content: cleanedContent, summary, type } })
  } catch (error: any) {
    console.error(`Error updating page ${slug}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
