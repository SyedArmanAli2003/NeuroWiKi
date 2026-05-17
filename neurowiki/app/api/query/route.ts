import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { hydra } from '@/lib/hydra'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // 1. Smart Retrieval with HydraDB
    const recallResponse = await hydra.recall.fullRecall({
      tenant_id: 'default',
      query: question,
      max_results: 5,
      graph_context: true,
    })

    const sources: any[] = recallResponse.sources ?? []

    // Format context for Gemini
    let contextText = ''
    const citations: Array<{ slug: string; title: string }> = []

    for (const source of sources) {
      const title = source.title ?? 'Unknown'
      const slug = (source.additional_metadata?.slug as string) ?? source.id
      const content = source.description ?? ''

      contextText += `\n\n--- Source: ${title} ---\n${content}`
      citations.push({ slug, title })
    }

    // Also pull text from chunks if sources description is empty
    const chunks = recallResponse.chunks ?? []
    if (!contextText.trim() && chunks.length > 0) {
      for (const chunk of chunks) {
        contextText += `\n\n--- ${chunk.source_title ?? 'Source'} ---\n${chunk.chunk_content}`
        const slug = (chunk.additional_metadata?.slug as string) ?? chunk.source_id
        citations.push({ slug, title: chunk.source_title ?? 'Source' })
      }
    }

    // 2. Build Prompt
    const systemPrompt = `You are a helpful knowledge wiki assistant. 
Answer the user's question using ONLY the provided context. 
If the context doesn't contain the answer, say "I don't have enough information in the wiki to answer this."
When you use information from the context, naturally weave in the source titles.

Context:
${contextText}
`

    // 3. Stream Gemini Answer Back
    const result = streamText({
      model: google('gemini-1.5-pro'),
      system: systemPrompt,
      prompt: question,
    })

    return result.toTextStreamResponse({
      headers: {
        'x-citations': JSON.stringify(citations),
      },
    })
  } catch (error: any) {
    console.error('Error in query route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

