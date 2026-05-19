import { llm, loggedGenerateObject } from '@/lib/llm'
import { z } from 'zod'
import { fetchPage } from '@/lib/hydra-fetch'

export interface ExistingPage {
  slug: string
  title: string
  content: string
  summary: string
  type: string
  sourceSentences: string[]
}

const MergeSchema = z.object({
  content: z.string().describe('Merged markdown, encyclopedic style'),
  summary: z.string().describe('Updated one sentence summary'),
  sourceSentences: z.array(z.string()).describe(
    'Array combining ALL previous source sentences PLUS new exact quotes from the new source backing new claims'
  ),
})

// Dedup: find a near-duplicate slug among existing pages.
// Matches on (a) normalized slug equality (`open-ai` ↔ `openai`)
// or (b) high title-token Jaccard similarity.
export function findDuplicateSlug(
  candidate: { slug: string; title: string },
  existing: Array<{ slug: string; title: string }>,
  jaccardThreshold = 0.7
): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const tokens = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2))
  const candNormSlug = norm(candidate.slug)
  const candTitleToks = tokens(candidate.title)

  let best: { slug: string; score: number } | null = null
  for (const p of existing) {
    if (norm(p.slug) === candNormSlug) return p.slug
    const pToks = tokens(p.title)
    if (candTitleToks.size === 0 || pToks.size === 0) continue
    let inter = 0
    for (const t of candTitleToks) if (pToks.has(t)) inter++
    const union = candTitleToks.size + pToks.size - inter
    const jaccard = union === 0 ? 0 : inter / union
    if (jaccard >= jaccardThreshold && (!best || jaccard > best.score)) {
      best = { slug: p.slug, score: jaccard }
    }
  }
  return best?.slug ?? null
}

export async function findExistingPage(
  slug: string,
  tenantId: string = 'default'
): Promise<ExistingPage | null> {
  const p = await fetchPage(slug, tenantId)
  if (!p) return null
  return {
    slug: p.slug,
    title: p.title,
    content: p.content,
    summary: p.summary,
    type: p.type,
    sourceSentences: p.sourceSentences,
  }
}

export async function absorbIntoExisting(
  existingPage: ExistingPage,
  newPage: { title: string; content: string; sourceSentences: string[] },
  sourceText: string,
  availableSlugs: string[] = []
): Promise<{ content: string; summary: string; sourceSentences: string[] }> {
  const existingCitations = existingPage.sourceSentences.length > 0
    ? existingPage.sourceSentences.map(s => `- "${s}"`).join('\n')
    : '- None'

  const slugList = availableSlugs.length > 0
    ? availableSlugs.join(', ')
    : '(no slugs available — do not add wikilinks)'

  const { object } = await loggedGenerateObject('absorb', {
    model: llm(),
    schema: MergeSchema,
    prompt: `You are an expert wiki editor updating an existing knowledge base page with new information.

=== EXISTING PAGE STATE ===
Summary: ${existingPage.summary}
Content:
"""
${existingPage.content}
"""
Existing Citations (MUST BE RETAINED in output):
${existingCitations}

=== NEW INFORMATION EXTRACTED ===
"""
${newPage.content}
"""

=== NEW RAW SOURCE TEXT (GROUND TRUTH FOR NEW CLAIMS) ===
"""
${sourceText.slice(0, 4000)}
"""

=== AVAILABLE WIKI LINKS ===
You may ONLY create new [[wikilinks]] using these exact slugs:
${slugList}

=== MERGE RULES ===
1. PRESERVE FACTS: Keep existing facts unless explicitly contradicted by the new source text.
2. CONTRADICTION HANDLING: If the new source explicitly updates or contradicts the existing page, prioritize the new source but frame chronologically (e.g., "Previously X; as of [context], Y").
3. NO HALLUCINATION: Every new sentence MUST trace to the new raw source text above.
4. NO DUPLICATION: Weave new facts naturally — do not repeat existing information.
5. WIKILINKS: Preserve all existing [[wikilinks]]. Only add NEW wikilinks if the slug appears in the AVAILABLE WIKI LINKS list.
6. CITATIONS: Your 'sourceSentences' output MUST include ALL existing citations listed above PLUS 1-4 new exact quotes from the new raw source text backing newly added claims.

Return ONLY a JSON object with EXACTLY these three keys (use these exact key names, no other variants like "updatedContent" or "updatedSummary"):
{
  "content": string — the merged markdown body,
  "summary": string — one updated sentence,
  "sourceSentences": string[] — ALL existing citations plus new quotes
}
Output the JSON object only. No markdown fences, no commentary.`,
  })

  return {
    content: object.content,
    summary: object.summary,
    sourceSentences: object.sourceSentences,
  }
}

// enrichRelatedPage removed — see ingest-agent TODO.
