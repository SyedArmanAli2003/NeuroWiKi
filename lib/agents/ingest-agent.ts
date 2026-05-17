import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { hydra } from '../hydra'

export interface IngestResult {
  pagesCreated: number
  pages: Array<{ slug: string; title: string; isNew: boolean }>
}

/**
 * Takes raw source text and:
 * 1. Uses Gemini to generate wiki pages (structured JSON)
 * 2. Stores each page in HydraDB as a Knowledge document
 * 3. HydraDB automatically builds the context graph
 */
export async function runIngestAgent(
  sourceText: string,
  sourceId: number,
  tenantId: string = 'default_tenant'
): Promise<IngestResult> {
  // Step 1 — Generate pages with Gemini
  const result = await generateObject({
    model: google('gemini-1.5-pro'),
    schema: z.object({
      pages: z.array(
        z.object({
          slug: z.string().describe('lowercase-hyphenated'),
          title: z.string(),
          type: z.enum(['concept', 'person', 'place', 'event', 'tool', 'organization']),
          summary: z.string(),
          content: z.string().describe('150-300 word markdown, encyclopedic style'),
        })
      ),
    }),
    prompt: `You are a knowledge wiki compiler. Read the source text and generate 2-5 
wiki pages about the key concepts, people, tools, or ideas mentioned.
Write in Wikipedia style: factual, encyclopedic, no fluff.
Each page should naturally reference other pages by mentioning their names.
Return JSON only.

Source Text:
${sourceText}`,
  })

  const pagesCreated = result.object.pages.length
  const pages: Array<{ slug: string; title: string; isNew: boolean }> = []

  // Step 2 — Store each page in HydraDB as Knowledge
  for (const page of result.object.pages) {
    try {
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
            },
            additional_metadata: {
              sourceId: sourceId.toString(),
              type: page.type,
              slug: page.slug,
            },
          },
        ]),
      })

      pages.push({
        slug: page.slug,
        title: page.title,
        isNew: true, // Assuming creation succeeds if it doesn't throw
      })
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
