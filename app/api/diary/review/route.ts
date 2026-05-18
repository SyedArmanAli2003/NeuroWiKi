import { llm } from '@/lib/llm'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { entries, date } = await req.json()

  if (!entries?.length) {
    return Response.json({ error: 'No entries to review' }, { status: 400 })
  }

  const log = entries
    .map((e: any) => `[${e.time}] (${e.kind}) ${e.text}${e.filed_under ? ` → filed under ${e.filed_under}` : ''}`)
    .join('\n')

  const stream = streamText({
    model: llm(),
    system: `You are a calm, reflective writing assistant. You help the user synthesize their day into a brief personal journal entry.`,
    prompt: `Here are my captures from ${date}:\n\n${log}\n\nWrite 3–4 sentences synthesizing this day in first person. Be calm and observational. Surface any decisions made and hint at tomorrow's intention. Sound like a thoughtful person writing in their own journal — not a summary or bullet list.`,
    maxOutputTokens: 300,
  })

  return stream.toTextStreamResponse()
}
