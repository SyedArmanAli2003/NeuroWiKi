import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getAllWikiPages } from '@/lib/firestore-db'
import { hydra } from '@/lib/hydra'
import { llm, loggedStreamText } from '@/lib/llm'

export async function POST(req: Request) {
  const reqStart = Date.now()
  let question = ''
  try {
    const body = await req.json()
    question = body.question
  } catch (err) {
    console.error('[query] bad json body', err)
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!question?.trim()) return Response.json({ error: 'No question' }, { status: 400 })

  // Require auth — answers are scoped to the user's wiki
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const tenantId = `user-${userId}`
  console.log(`[query] userId=${userId} tenantId=${tenantId} q="${question.slice(0, 100)}"`)

  let contextChunks: any[] = []
  let recallStrategy = 'vector'

  // Strategy 1: HydraDB graph-aware recall (user-scoped tenant)
  try {
    const res = await hydra.recall.fullRecall({
      tenant_id: tenantId,
      query: question,
      max_results: 8,
      graph_context: true,
    })
    if (res?.chunks && res.chunks.length > 0) {
      contextChunks = res.chunks
      recallStrategy = 'graph_context'
    }
  } catch (err) {
    console.warn('[query] graph recall failed', (err as Error)?.message)
  }

  // Strategy 2: HydraDB pure vector recall
  if (contextChunks.length === 0) {
    try {
      const res = await hydra.recall.fullRecall({
        tenant_id: tenantId,
        query: question,
        max_results: 6,
      })
      contextChunks = res?.chunks ?? []
      recallStrategy = 'vector_fallback'
    } catch (err) {
      console.warn('[query] vector recall failed', (err as Error)?.message)
    }
  }

  // Strategy 3: Firestore keyword search (always user-scoped, replaces SQLite fallback)
  if (contextChunks.length === 0) {
    try {
      const allPages = await getAllWikiPages(userId)
      const words = question.toLowerCase().split(' ').filter((w: string) => w.length > 2)
      console.log(`[query] Firestore fallback: ${allPages.length} pages, words=${words.join(',')}`)
      contextChunks = allPages
        .filter((p) => words.some((w) =>
          p.title?.toLowerCase().includes(w) ||
          p.summary?.toLowerCase().includes(w) ||
          p.content?.toLowerCase().includes(w)
        ))
        .slice(0, 6)
        .map((p) => ({ chunk_content: p.content, source_title: p.title }))
      recallStrategy = 'firestore_fallback'
    } catch (fsErr) {
      console.warn('[query] Firestore fallback failed', (fsErr as Error)?.message)
    }
  }

  console.log(`[query] strategy=${recallStrategy} chunks=${contextChunks.length} userId=${userId}`)

  if (contextChunks.length === 0) {
    return Response.json({
      error: 'No relevant pages found in your wiki. Try adding more sources first.',
      strategy: recallStrategy
    }, { status: 404 })
  }

  const context = contextChunks
    .map((c: any, i: number) =>
      `[Page ${i + 1}${c.source_title ? ` — ${c.source_title}` : ''}]:\n${c.chunk_content || c.content || ''}`
    )
    .join('\n\n---\n\n')

  const systemPrompt = `You are a wiki assistant that ONLY answers from the provided wiki pages below.
Never use outside knowledge.
Always cite which page your answer comes from using format: (Source: Page N — Title)
If the answer is not in the wiki, say "This isn't covered in your wiki yet. Try adding more sources."
Keep answers concise and factual.
If the user's input is a single word or short topic (not a full question), treat it as a request to summarize what the wiki says about that topic, drawing from every relevant page in the context. Do not ask the user to clarify — answer directly using the wiki pages.`

  const wordCount = question.trim().split(/\s+/).length
  const userTurn = wordCount <= 3
    ? `Topic: "${question}"\n\nUsing only the wiki pages above, summarize what is known about this topic. Pull from every relevant page. Cite sources.`
    : `Question: ${question}\n\nUsing only the wiki pages above, answer the question. Cite sources.`

  console.log(`[query] llm call strategy=${recallStrategy} chunks=${contextChunks.length} contextLen=${context.length} prep=${Date.now() - reqStart}ms`)

  const stream = loggedStreamText('query', {
    model: llm(),
    system: systemPrompt,
    prompt: `WIKI PAGES (your only source of truth):\n\n${context}\n\n---\n\n${userTurn}`,
    maxOutputTokens: 500,
  })

  return stream.toTextStreamResponse()
}