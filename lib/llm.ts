import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export const nvidia = createOpenAICompatible({
  name: 'nvidia',
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

export const LLM_MODEL = process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash'

export const llm = () => nvidia.languageModel(LLM_MODEL, { supportsStructuredOutputs: true })
