import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { hydra } from '@/lib/hydra'

const EditSchema = z.object({
  content: z.string().describe('Full updated markdown content (without the # Title heading)'),
  summary: z.string().describe('One-sentence summary of the page after edits'),
})

async function fetchPageContent(slug: string): Promise<{ content: string; title: string; meta: any } | null> {
  try {
    const searchResponse = await hydra.recall.booleanRecall({
      tenant_id: 'default',
      query: slug,
      operator: 'and',
    }) as any

    const sources: any[] = searchResponse.sources ?? []
    let pageSource = sources.find(
      (s: any) => (s.additional_metadata?.slug as string) === slug || s.id === slug
    ) ?? sources[0] ?? null

    if (!pageSource) {
      const chunk = (searchResponse.chunks ?? []).find((c: any) => c.source_id === slug)
      if (chunk) {
        pageSource = {
          id: chunk.source_id,
          title: chunk.source_title,
          additional_metadata: chunk.additional_metadata ?? undefined,
        }
      }
    }

    if (!pageSource) return null

    const chunks = (searchResponse.chunks ?? []).filter((c: any) => c.source_id === pageSource.id)
    const firstChunk = chunks[0]
    const parsedDoc = firstChunk
      ? (() => { try { return JSON.parse(firstChunk.chunk_content) } catch { return null } })()
      : null

    const extractMarkdown = (c: string) => {
      try { return JSON.parse(c)?.content?.markdown ?? '' } catch { return c }
    }

    const content = parsedDoc?.content?.markdown
      || chunks.map((c: any) => extractMarkdown(c.chunk_content)).filter(Boolean).join('\n\n')
      || ''

    const meta = parsedDoc?.document_metadata ?? pageSource.additional_metadata ?? {}
    const title = parsedDoc?.title || pageSource.title || slug

    return { content, title, meta }
  } catch {
    return null
  }
}

async function getAllSlugs(): Promise<string[]> {
  try {
    const response = (await hydra.fetch.listData({
      tenant_id: 'default',
      kind: 'knowledge',
      page: 1,
      page_size: 100,
    })) as any
    return (response?.sources ?? []).map((i: any) => (i.document_metadata?.slug as string) || i.id)
  } catch {
    return []
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const { instruction } = await req.json()

  if (!instruction?.trim()) {
    return NextResponse.json({ error: 'instruction required' }, { status: 400 })
  }

  const [pageData, existingSlugs] = await Promise.all([
    fetchPageContent(slug),
    getAllSlugs(),
  ])

  if (!pageData) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  const { content, title } = pageData

  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    schema: EditSchema,
    prompt: `You are a wiki editor. Apply the following edit instruction to the wiki page below.

PAGE TITLE: ${title}
PAGE SLUG: ${slug}

EDIT INSTRUCTION: ${instruction}

CURRENT CONTENT (markdown, without title heading):
${content}

EXISTING WIKI SLUGS (use [[slug]] wikilinks when referencing these pages):
${existingSlugs.filter(s => s !== slug).join(', ')}

Rules:
- Return the full updated page content as markdown (do not include the "# ${title}" heading)
- Preserve all existing [[wikilinks]] unless they are incorrect
- Add new [[wikilinks]] where appropriate using the existing slugs list
- Keep encyclopedic tone, factual, concise
- Update summary to reflect the new content
- Do NOT add information not already present in the page unless the instruction explicitly asks to expand`,
  })

  return NextResponse.json({ content: object.content, summary: object.summary, title })
}
