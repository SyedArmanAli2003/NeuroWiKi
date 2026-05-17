/**
 * lib/hydra.ts
 *
 * Singleton HydraDB Client wrapper using the official @hydradb/sdk package.
 * Graph data and wiki pages are managed by HydraDB, while SQLite is used for
 * local scraping sources and operations logging.
 */

import { HydraDBClient } from '@hydradb/sdk'

if (!process.env.HYDRADB_API_KEY) {
  console.warn('Warning: HYDRADB_API_KEY is not defined in the environment.')
}

export const hydra = new HydraDBClient({
  token: process.env.HYDRADB_API_KEY || '',
})

export async function waitForIngestion(
  documentId: string,
  tenantId: string = 'default',
  maxWaitMs = 30000,
  intervalMs = 1500
): Promise<boolean> {
  const start = Date.now()
  
  while (Date.now() - start < maxWaitMs) {
    try {
      const response = await hydra.fetch.content({
        tenant_id: tenantId,
        source_id: documentId
      })
      const status = response as any
      if (status?.graph_creation === 'complete' || 
          status?.status === 'ready' ||
          status?.indexed === true) {
        return true
      }
    } catch {
      // still processing
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  
  console.warn(`HydraDB: document ${documentId} did not complete indexing within ${maxWaitMs}ms`)
  return false
}
