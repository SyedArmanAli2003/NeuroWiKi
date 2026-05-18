function isQuotaError(err: unknown): boolean {
  const msg = (err as any)?.message ?? (err as any)?.toString() ?? ''
  const status = (err as any)?.status ?? (err as any)?.statusCode ?? 0
  return status === 429 || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')
}

export async function withGeminiRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [2000, 4000, 8000]
  let lastErr: unknown
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isQuotaError(err) || i === delays.length) break
      await new Promise(r => setTimeout(r, delays[i]))
    }
  }
  if (isQuotaError(lastErr)) {
    throw new Error('AI quota reached — please wait a moment and try again.')
  }
  throw lastErr
}
