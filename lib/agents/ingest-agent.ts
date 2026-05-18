import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { hydra, waitForIngestion } from '../hydra'
import { upsertPageHealth } from '../db-helpers'

export interface IngestResult {
  pagesCreated: number
  pages: Array<{ slug: string; title: string; content: string; isNew: boolean; indexed: boolean }>
}

/**
 * Takes raw source text and:
 * 1. Uses Gemini to generate wiki pages (structured JSON)
 * 2. Stores each page in HydraDB as a Knowledge document
 * 3. HydraDB automatically builds the context graph
 */
async function verifyClaims(
  page: { content: string; sourceSentences: string[] },
  sourceText: string
): Promise<boolean> {
  // Check each source sentence actually exists in the source
  for (const sentence of page.sourceSentences) {
    const words = sentence.toLowerCase().split(' ').filter(w => w.length > 4)
    if (words.length === 0) continue
    const matches = words.filter(w => sourceText.toLowerCase().includes(w))
    const matchRate = matches.length / words.length
    if (matchRate < 0.6) {
      console.warn(`Possible hallucination detected: "${sentence}" not found in source`)
      return false
    }
  }
  return true
}

export async function runIngestAgent(
  sourceText: string,
  sourceId: number,
  tenantId: string = 'default'
): Promise<IngestResult> {
  // Step 1: Fetch existing pages for the prompt
  let existingPages: any[] = []
  try {
    const res = (await hydra.fetch.listData({
      tenant_id: tenantId,
      kind: 'knowledge',
      page: 1,
      page_size: 100,
    })) as any
    const items: any[] = res?.results ?? res?.data ?? res?.items ?? []
    existingPages = items.map((item: any) => ({
      slug: (item.additional_metadata?.slug as string) || item.id,
      title: item.title || '',
      summary: (item.metadata?.summary as string) || '',
    }))
  } catch (e) {
    console.warn("Failed to fetch existing pages for prompt index", e)
  }

  // Step 2 — Generate pages with Gemini
  const result = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: z.object({
      pages: z.array(
        z.object({
          slug: z.string().describe('lowercase-hyphenated'),
          title: z.string(),
          type: z.enum(['concept', 'person', 'place', 'event', 'tool', 'organization']),
          summary: z.string(),
          content: z.string().describe('150-300 word markdown, encyclopedic style'),
          sourceSentences: z.array(z.string()).min(1).max(5),
        })
      ),
    }),
    prompt: `You are a strict knowledge wiki compiler with zero tolerance for hallucination.

SOURCE TEXT (this is the ONLY source of truth):
"""
${sourceText.slice(0, 6000)}
"""

EXISTING WIKI INDEX:
${existingPages.map(p => `- ${p.slug}: ${p.title} — ${p.summary}`).join('\n')}

Rules you MUST follow:
1. ONLY include claims that are EXPLICITLY stated in the source text above
2. NEVER infer connections that aren't directly stated
3. Every factual sentence in content must correspond to something in the source
4. If something is uncertain, write "According to this source..." not as fact
5. Do NOT include information you know from training — only from the source text
6. Create 2-5 wiki pages about key concepts from this specific source
7. Use [[wikilinks]] to link to related pages by their slug

Return a JSON array of pages. Each page must include:
- slug: lowercase-hyphenated
- title: human readable
- type: concept | person | place | event | tool | organization
- summary: one sentence from the source
- content: 150-300 word markdown — only facts from the source
- sourceSentences: array of 2-5 exact quotes (under 20 words each) 
  from the source text that back up the main claims in this page
`,
  })

  const pages: Array<{ slug: string; title: string; content: string; isNew: boolean; indexed: boolean }> = []
  let pagesCreated = 0

  // Step 3 — Verify and Store each page in HydraDB as Knowledge
  for (const page of result.object.pages) {
    try {
      const isVerified = await verifyClaims(page, sourceText)
      if (!isVerified) {
        console.warn(`Skipping page ${page.slug} — claims could not be verified against source`)
        continue
      }
      // NOTE: Using the official @hydradb/sdk signature 'upload.knowledge()' and mapping your
      // 'hydra.knowledge.add()' metadata intention into the correct 'app_knowledge' payload structure.
      await hydra.upload.knowledge({
        tenant_id: tenantId,
        app_knowledge: JSON.stringify([
          {
            tenant_id: tenantId,
            sub_tenant_id: 'default',
            id: page.slug,
            title: page.title,
            type: 'webpage', // Maps to valid HydraDB ingestion type
            content: {
              text: `# ${page.title}\n\n${page.content}`,
            },
            metadata: {
              category: page.type, // Map our wiki type to HydraDB metadata
              summary: page.summary,
              sourceSentences: page.sourceSentences,
              verified: true,
              verifiedAt: new Date().toISOString(),
            },
            additional_metadata: {
              sourceId: sourceId.toString(),
              type: page.type,
              slug: page.slug,
            },
          },
        ]),
      })

      const ready = await waitForIngestion(page.slug, tenantId)
      if (!ready) {
        console.warn(`Page ${page.slug} may have incomplete graph links — ingested but not fully indexed`)
        upsertPageHealth({
          slug: page.slug,
          title: page.title,
          type: page.type,
          confidence: 60,
          stale_reason: 'Indexing may be incomplete',
          hydra_doc_id: page.slug
        })
      } else {
        upsertPageHealth({
          slug: page.slug,
          title: page.title,
          type: page.type,
          hydra_doc_id: page.slug
        })
      }

      pages.push({
        slug: page.slug,
        title: page.title,
        content: page.content,
        isNew: true, // Assuming creation succeeds if it doesn't throw
        indexed: ready,
      })
      pagesCreated++
    } catch (error) {
      console.error(`Failed to ingest generated page ${page.slug} to HydraDB:`, error)
    }
  }

  // Step 3 — Return result
  return {
    pagesCreated,
    pages,
  }
}
