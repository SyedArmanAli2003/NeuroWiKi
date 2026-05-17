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
