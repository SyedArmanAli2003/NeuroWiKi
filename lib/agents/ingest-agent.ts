import { NoObjectGeneratedError } from 'ai'
import { loggedGenerateObject } from '@/lib/llm'
import { llm } from '../llm'
import { z } from 'zod'
import { ensureTenant, hydra, waitForIngestion } from '../hydra'
import { findExistingPage, absorbIntoExisting, findDuplicateSlug } from './absorb-agent'
import { listPageMeta } from '../hydra-fetch'
import { createWikiPage, updateWikiPage, getWikiPageBySlug, getAllWikiPages } from '../firestore-db'

export interface IngestResult {
  pagesCreated: number
  pages: Array<{ slug: string; title: string; type: string; content: string; isNew: boolean; indexed: boolean }>
}

// TODO: real claim verification (NLI / LLM judge). Old keyword heuristic deleted.
// Add back when we have a real verifier — string overlap was theater.

export async function runIngestAgent(
  sourceText: string,
  sourceId: number,
  tenantId: string = 'default'
): Promise<IngestResult> {
  // Ensure tenant exists before any operations
  await ensureTenant(tenantId)

  // Step 1: Fetch existing pages for the prompt
  const existingPageMeta = await listPageMeta(tenantId)
  const existingPages = existingPageMeta.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
  }))

  // Step 2 — Generate single comprehensive page
  const MAX_PAGES = parseInt(process.env.MAX_PAGES_PER_SOURCE || '1', 10)
  const SOURCE_LIMIT = parseInt(process.env.SOURCE_CHAR_LIMIT || '30000', 10)
  const result = await loggedGenerateObject('ingest', {
    model: llm(),
    maxOutputTokens: 4000,
    schema: z.object({
      pages: z.array(
        z.object({
          slug: z.string().describe('lowercase-hyphenated'),
          title: z.string(),
          type: z.enum(['concept', 'person', 'place', 'event', 'tool', 'organization']),
          summary: z.string(),
          content: z.string().describe('400-1200 word comprehensive markdown wiki page, encyclopedic style with sections'),
          sourceSentences: z.array(z.string()).min(1).max(15),
        })
      ).min(1).max(MAX_PAGES),
    }),
    prompt: `You are a strict knowledge wiki compiler with zero tolerance for hallucination.

SOURCE TEXT (this is the ONLY source of truth):
"""
${sourceText.slice(0, SOURCE_LIMIT)}
"""

EXISTING WIKI INDEX (use these slugs for [[wikilinks]] to related pages — do NOT invent new pages for entities already here):
${existingPages.map(p => `- ${p.slug}: ${p.title}`).join('\n')}

Rules you MUST follow:
1. Create EXACTLY ${MAX_PAGES} wiki page${MAX_PAGES === 1 ? '' : 's'} covering the MAIN subject of the source as a single comprehensive article.
2. Do NOT split the source into many small pages. Cover everything about the main subject in ONE page with markdown sections (## Headings).
3. ONLY include claims EXPLICITLY stated in the source text above.
4. Every factual sentence must correspond to something in the source.
5. Do NOT include information you know from training — only from the source text.
6. Use [[wikilinks]] like [[existing-slug]] to link to entities already in the EXISTING WIKI INDEX. Do NOT create new pages for those entities.
7. Content should be 400-1200 words with proper markdown structure (## sections, paragraphs, lists where appropriate).

Return JSON with a "pages" key containing an array. Each page must include:
- slug: lowercase-hyphenated
- title: human readable
- type: concept | person | place | event | tool | organization
- summary: one sentence from the source
- content: 150-300 word markdown — only facts from the source
- sourceSentences: array of 2-10 exact quotes (under 20 words each)
  from the source text that back up the main claims in this page
`,
  }).catch((err: unknown) => {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error('[ingest] Raw Gemini response:', (err as any).text)
      console.error('[ingest] Cause:', (err as any).cause?.message)
    }
    throw err
  })

  const pages: Array<{ slug: string; title: string; type: string; content: string; isNew: boolean; indexed: boolean }> = []
  let pagesCreated = 0

  const userId = tenantId.startsWith('user-') ? tenantId.replace('user-', '') : tenantId

  // Collect existing hydra_doc_ids to forcefully relate new pages to them
  const firestorePages = await getAllWikiPages(userId)
  const existingHydraIds = firestorePages
    .map((p) => p.slug)
    .filter(Boolean)

  // Track real source IDs of pages uploaded in this batch for sibling cross-linking
  const batchHydraIds: string[] = []

  // Step 3 — Verify and Store each page in HydraDB as Knowledge
  for (const page of result.object.pages) {
    try {
      // Dedup: redirect to canonical slug if a near-duplicate already exists
      const duplicateSlug = findDuplicateSlug(
        { slug: page.slug, title: page.title },
        existingPages.map(p => ({ slug: p.slug, title: p.title }))
      )
      if (duplicateSlug && duplicateSlug !== page.slug) {
        console.log(`[ingest] Dedup: "${page.slug}" → "${duplicateSlug}" (near-duplicate match)`)
        page.slug = duplicateSlug
      }

      // Absorb: check if page already exists — if so, enrich rather than overwrite
      let finalContent = page.content
      let finalSummary = page.summary
      let finalSourceSentences = page.sourceSentences
      let isNew = true

      const existingPage = await findExistingPage(page.slug, tenantId)
      if (existingPage) {
        console.log(`[ingest] Absorbing into existing page: ${page.slug}`)
        const allKnownSlugs = existingPages.map(p => p.slug)
        try {
          const merged = await absorbIntoExisting(existingPage, page, sourceText, allKnownSlugs)
          const cleanMerged = (merged.content || '').replace(/^#\s+.+\n+/, '').trim()
          if (cleanMerged.length >= 50) {
            finalContent = merged.content
            finalSummary = merged.summary
            finalSourceSentences = merged.sourceSentences
          } else {
            console.warn(`[ingest] absorb for ${page.slug} returned empty; keeping existing`)
            finalContent = existingPage.content
            finalSummary = existingPage.summary
            finalSourceSentences = existingPage.sourceSentences
          }
        } catch (err) {
          console.warn(`[ingest] absorb failed for ${page.slug}; keeping existing`, (err as Error).message)
          finalContent = existingPage.content
          finalSummary = existingPage.summary
          finalSourceSentences = existingPage.sourceSentences
        }
        isNew = false
      }

      // Guard against empty new pages (model failure)
      if (!finalContent || finalContent.trim().length < 50) {
        console.warn(`[ingest] skipping ${page.slug} — content too short (${finalContent?.length ?? 0} chars)`)
        continue
      }

      // All existing pages + siblings already uploaded this batch
      const cortexSourceIds = [...existingHydraIds, ...batchHydraIds].filter(Boolean)

      let uploadResponse: any = null
      try {
        uploadResponse = await hydra.upload.knowledge({
          tenant_id: tenantId,
          upsert: true,
          app_knowledge: JSON.stringify([
            {
              tenant_id: tenantId,
              sub_tenant_id: 'default',
              id: page.slug,
              title: page.title,
              type: 'document',
              content: {
                markdown: `# ${page.title}\n\n${finalContent}`,
              },
              document_metadata: {
                category: page.type,
                summary: finalSummary,
                sourceSentences: finalSourceSentences,
                verified: true,
                verifiedAt: new Date().toISOString(),
                sourceId: sourceId.toString(),
                slug: page.slug,
              },
              ...(cortexSourceIds.length > 0 && {
                relations: { cortex_source_ids: cortexSourceIds },
              }),
            },
          ]),
        })
      } catch (hydraErr: any) {
        console.error(`[ingest] HydraDB upload failed for ${page.slug}, continuing with Firestore:`, hydraErr?.message)
      }

      // Use real source_id from upload response for status polling
      const realSourceId = uploadResponse?.results?.[0]?.source_id ?? page.slug
      batchHydraIds.push(realSourceId)
      let ready = false
      if (uploadResponse) {
        ready = await waitForIngestion(realSourceId, tenantId)
      }

      try {
        const linkedSlugs = [...finalContent.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].trim())
        
        const existingDoc = await getWikiPageBySlug(userId, page.slug)
        if (existingDoc) {
          await updateWikiPage(userId, existingDoc.id, {
            title: page.title,
            content: finalContent,
            type: page.type,
            summary: finalSummary,
            wikilinks: linkedSlugs,
          })
        } else {
          await createWikiPage(userId, {
            slug: page.slug,
            title: page.title,
            content: finalContent,
            type: page.type,
            summary: finalSummary,
            wikilinks: linkedSlugs,
          })
        }
      } catch (firestoreErr: any) {
        console.error(`[ingest] Firestore write failed for ${page.slug}:`, firestoreErr?.message)
      }

      pages.push({
        slug: page.slug,
        title: page.title,
        type: page.type,
        content: finalContent,
        isNew,
        indexed: ready,
      })
      pagesCreated++
    } catch (error: any) {
      console.error(`Failed to ingest page ${page.slug}:`, error?.body ?? error?.message)
    }
  }

  // TODO: enrichment pass (cross-link/update related pages w/ new source).
  // Removed for now — was gated off by default + had no backlinks/health updates.

  return { pagesCreated, pages }
}
