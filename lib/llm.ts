import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { generateObject, streamText, generateText } from 'ai'

export const nvidia = createOpenAICompatible({
  name: 'nvidia',
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

export const LLM_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct'

export const llm = () => nvidia.languageModel(LLM_MODEL, { supportsStructuredOutputs: false })

// ─── Logging helpers ────────────────────────────────────────────────────────

function extractErr(err: unknown) {
  const e = err as any
  return {
    name: e?.name,
    message: e?.message,
    status: e?.status ?? e?.statusCode,
    code: e?.code,
    cause: e?.cause?.message ?? e?.cause,
    body: typeof e?.responseBody === 'string' ? e.responseBody.slice(0, 800) : e?.responseBody,
    data: e?.data,
    url: e?.url,
  }
}

type GenObjParams = Parameters<typeof generateObject>[0]
type GenTextParams = Parameters<typeof generateText>[0]
type StreamParams = Parameters<typeof streamText>[0]

export async function loggedGenerateObject<T extends GenObjParams>(
  label: string,
  params: T
): Promise<ReturnType<typeof generateObject<any, any, any>>> {
  const start = Date.now()
  const promptLen = typeof (params as any).prompt === 'string' ? (params as any).prompt.length : 0
  console.log(`[llm:${label}] generateObject start model=${LLM_MODEL} promptLen=${promptLen}`)
  try {
    const result = await (generateObject as any)(params)
    console.log(`[llm:${label}] generateObject ok ${Date.now() - start}ms usage=`, (result as any)?.usage)
    return result
  } catch (err) {
    console.error(`[llm:${label}] generateObject FAIL ${Date.now() - start}ms`, extractErr(err))
    throw err
  }
}

export async function loggedGenerateText(label: string, params: GenTextParams) {
  const start = Date.now()
  console.log(`[llm:${label}] generateText start model=${LLM_MODEL}`)
  try {
    const result = await generateText(params)
    console.log(`[llm:${label}] generateText ok ${Date.now() - start}ms usage=`, (result as any)?.usage)
    return result
  } catch (err) {
    console.error(`[llm:${label}] generateText FAIL ${Date.now() - start}ms`, extractErr(err))
    throw err
  }
}

export function loggedStreamText(label: string, params: StreamParams) {
  const start = Date.now()
  const promptLen = typeof (params as any).prompt === 'string' ? (params as any).prompt.length : 0
  console.log(`[llm:${label}] streamText start model=${LLM_MODEL} promptLen=${promptLen}`)

  return streamText({
    ...params,
    onError: (event: any) => {
      const err = event?.error ?? event
      console.error(`[llm:${label}] streamText FAIL ${Date.now() - start}ms`, extractErr(err))
      ;(params as any).onError?.(event)
    },
    onFinish: (event: any) => {
      console.log(`[llm:${label}] streamText finish ${Date.now() - start}ms finishReason=${event?.finishReason} usage=`, event?.usage)
      ;(params as any).onFinish?.(event)
    },
  })
}
