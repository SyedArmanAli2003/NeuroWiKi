import { NextResponse, type NextRequest } from 'next/server'
import { llm, loggedGenerateObject } from '@/lib/llm'
import { z } from 'zod'
import { fetchPage, listPageMeta } from '@/lib/hydra-fetch'

const EditSchema = z.object({
  content: z.string().describe('Full updated markdown content (without the # Title heading)'),
  summary: z.string().describe('One-sentence summary of the page after edits'),
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const { instruction } = await req.json()

  if (!instruction?.trim()) {
    return NextResponse.json({ error: 'instruction required' }, { status: 400 })
  }

  const [pageData, allPages] = await Promise.all([
    fetchPage(slug),
    listPageMeta(),
  ])

  if (!pageData) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  const { content, title } = pageData
  const existingSlugs = allPages.map((p) => p.slug)

  const { object } = await loggedGenerateObject('wiki-edit', {
    model: llm(),
    schema: EditSchema,
    prompt: `You are a wiki editor. Apply the following edit instruction to the wiki page below.

PAGE TITLE: ${title}
PAGE SLUG: ${slug}

EDIT INSTRUCTION: ${instruction}

CURRENT CONTENT (markdown, without title heading):
${content}

EXISTING WIKI SLUGS (use [[slug]] wikilinks when referencing these pages):
${existingSlugs.filter((s: string) => s !== slug).join(', ')}

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
