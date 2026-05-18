'use client'
import { useEffect, useState } from 'react'

export interface WikiPage {
  slug: string
  title: string
  type: string
  summary?: string
  updated_at?: string
}

type Mode = 'pages' | 'captures' | 'all'

interface CacheEntry {
  data: WikiPage[]
  at: number
}
const cache: Record<Mode, CacheEntry | null> = { pages: null, captures: null, all: null }
const inflight: Record<Mode, Promise<WikiPage[]> | null> = { pages: null, captures: null, all: null }
const TTL_MS = 60_000

function urlFor(mode: Mode): string {
  if (mode === 'captures') return '/api/wiki?onlyDiary=1'
  if (mode === 'all')      return '/api/wiki?includeDiary=1'
  return '/api/wiki'
}

async function fetchPages(mode: Mode): Promise<WikiPage[]> {
  const c = cache[mode]
  if (c && Date.now() - c.at < TTL_MS) return c.data
  if (inflight[mode]) return inflight[mode] as Promise<WikiPage[]>

  inflight[mode] = fetch(urlFor(mode))
    .then((r) => r.json())
    .then((d) => {
      const data: WikiPage[] = d.pages ?? []
      cache[mode] = { data, at: Date.now() }
      inflight[mode] = null
      return data
    })
    .catch(() => {
      inflight[mode] = null
      return cache[mode]?.data ?? []
    })

  return inflight[mode] as Promise<WikiPage[]>
}

export function useWikiPages(mode: Mode = 'pages'): WikiPage[] {
  const [pages, setPages] = useState<WikiPage[]>(cache[mode]?.data ?? [])

  useEffect(() => {
    let cancelled = false
    fetchPages(mode).then((data) => {
      if (!cancelled) setPages(data)
    })
    return () => { cancelled = true }
  }, [mode])

  return pages
}

export function invalidateWikiCache() {
  cache.pages = null
  cache.captures = null
  cache.all = null
}
