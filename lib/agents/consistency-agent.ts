import { llm, loggedGenerateObject } from '@/lib/llm'
import { z } from 'zod'
import { hydra, waitForIngestion } from '@/lib/hydra'
import { fetchPage, type WikiPage } from '@/lib/hydra-fetch'
import { upsertPageHealth, upsertPageLinks } from '@/lib/db-helpers'

const ContradictionSchema = z.object({
  contradictions: z.array(z.object({
    existingPageSlug: z.string(),
    existingClaim: z.string(),
    newClaim: z.string(),
    severity: z.enum(['minor', 'major', 'critical']),
    recommendation: z.enum(['update_existing', 'add_note', 'flag_for_review']),
    suggestedUpdate: z.string().optional(),
  })),
  stalePagesSlug: z.array(z.string()),
  consistencyScore: z.number().min(0).max(100),
})

// Re-upload page preserving ALL existing metadata. Caller passes the merged-in fields.
async function persistRewrite(
  existing: WikiPage,
  newContent: string,
  tenantId: string = 'default'
): Promise<void> {
  // Skip if user has manually edited — don't auto-overwrite their work
  if (existing.manuallyEdited) {
    console.log(`[consistency] skip ${existing.slug} — manuallyEdited`)
    return
  }

  const cleanedContent = newContent.replace(/^#\s+.+\n+/, '')

  const uploadResponse = (await hydra.upload.knowledge({
    tenant_id: tenantId,
    upsert: true,
    app_knowledge: JSON.stringify([{
      tenant_id: tenantId,
      sub_tenant_id: 'default',
      id: existing.slug,
      title: existing.title,
      type: 'document',
      content: { markdown: `# ${existing.title}\n\n${cleanedContent}` },
      document_metadata: {
        category: existing.type,
        summary: existing.summary,
        sourceSentences: existing.sourceSentences,
        sourceId: existing.sourceId,
        verified: true,
        verifiedAt: new Date().toISOString(),
        slug: existing.slug,
        ...(existing.breakdownSource ? { breakdownSource: existing.breakdownSource } : {}),
        consistencyUpdatedAt: new Date().toISOString(),
      },
    }]),
  })) as any

  const realSourceId = uploadResponse?.results?.[0]?.source_id ?? existing.slug
  const ready = await waitForIngestion(realSourceId, tenantId)

  upsertPageHealth({
    slug: existing.slug,
    title: existing.title,
    type: existing.type,
    summary: existing.summary,
    source_id: existing.sourceId ? parseInt(existing.sourceId, 10) || undefined : undefined,
    confidence: ready ? 100 : 60,
    stale_reason: ready ? undefined : 'Indexing may be incomplete',
    hydra_doc_id: realSourceId,
  })

  // Refresh wikilink graph from rewritten content
  const linkedSlugs = [...cleanedContent.matchAll(/\[\[([^\]]+)\]\]/g)].map((m: any) => m[1].trim())
  if (linkedSlugs.length) upsertPageLinks(existing.slug, linkedSlugs)
}

export async function runConsistencyCheck(
  newPages: Array<{ slug: string; title: string; content: string }>,
  existingPageSlugs: string[]
): Promise<{
  contradictions: number
  updated: number
  flagged: string[]
}> {
  // Fetch existing pages in parallel (cap to keep prompt size sane)
  const slugsToCheck = existingPageSlugs.slice(0, 20)
  const relatedPages = (await Promise.all(slugsToCheck.map((s) => fetchPage(s))))
    .filter((p): p is WikiPage => p !== null)

  if (relatedPages.length === 0 || newPages.length === 0) {
    return { contradictions: 0, updated: 0, flagged: [] }
  }

  const prompt = `
You are a knowledge base consistency checker.

NEW PAGES JUST INGESTED:
${newPages.map((p) => `[${p.title}]\n${p.content}`).join('\n\n---\n\n')}

EXISTING WIKI PAGES:
${relatedPages.map((p) => `[${p.title}] (slug: ${p.slug})\n${p.content}`).join('\n\n---\n\n')}

Tasks:
1. Find any factual contradictions between new pages and existing pages
2. Identify existing pages that are now stale or outdated
3. Rate the overall consistency score (100 = perfect, 0 = major conflicts)
4. For each contradiction, suggest whether to update the existing page or flag for review

Be conservative — only flag genuine contradictions, not just different phrasings.

Return ONLY a JSON object with EXACTLY these keys (use these exact names, NOT variants like "factual_contractions" or "consistency_score"):
{
  "contradictions": Array<{
    "existingPageSlug": string,
    "existingClaim": string,
    "newClaim": string,
    "severity": "minor" | "major" | "critical",
    "recommendation": "update_existing" | "add_note" | "flag_for_review",
    "suggestedUpdate"?: string
  }>,
  "stalePagesSlug": string[],
  "consistencyScore": number (0-100)
}
Output the JSON object only. No markdown fences, no commentary.
`

  const { object } = await loggedGenerateObject('consistency', {
    model: llm(),
    schema: ContradictionSchema,
    prompt,
  })

  const flagged: string[] = []
  let updated = 0
  const slugToPage = new Map(relatedPages.map((p) => [p.slug, p]))

  for (const contradiction of object.contradictions) {
    if (contradiction.severity === 'critical' || contradiction.severity === 'major') {
      flagged.push(contradiction.existingPageSlug)
    }

    // Only auto-update on minor severity w/ explicit suggestion. Major/critical require human review.
    if (
      contradiction.recommendation === 'update_existing' &&
      contradiction.suggestedUpdate &&
      contradiction.severity === 'minor'
    ) {
      const existing = slugToPage.get(contradiction.existingPageSlug)
      if (!existing) continue
      if (existing.manuallyEdited) {
        console.log(`[consistency] skip rewrite ${existing.slug} — manuallyEdited`)
        continue
      }

      try {
        const { object: rewritten } = await loggedGenerateObject('consistency-rewrite', {
          model: llm(),
          schema: z.object({ content: z.string() }),
          prompt: `You are a wiki editor. Update this page to incorporate a correction.

EXISTING CONTENT:
"""
${existing.content}
"""

CORRECTION TO INTEGRATE:
"${contradiction.suggestedUpdate}"

Rules:
- Integrate the correction naturally into the relevant section — do not append it at the end
- Keep all other content intact
- Preserve all existing [[wikilinks]]
- Do not add headers or notes about the update
- Return only the updated content`,
        })

        // Guard: don't overwrite with garbage (LLM failure)
        const cleanNew = (rewritten.content || '').trim()
        if (cleanNew.length < Math.max(50, existing.content.length * 0.5)) {
          console.warn(`[consistency] rewrite for ${existing.slug} too short (${cleanNew.length}); skip`)
          continue
        }

        await persistRewrite(existing, rewritten.content)
        updated++
      } catch (e) {
        console.warn(`[consistency] rewrite failed for ${contradiction.existingPageSlug}:`, (e as Error)?.message)
      }
    }
  }

  return {
    contradictions: object.contradictions.length,
    updated,
    flagged,
  }
}
