'use client'
import { useEffect, useState } from 'react'
import { SectionHeader } from './SectionHeader'

interface ResurfaceItem {
  quote: string
  from: string
  fromType: string
  reason: string
}

export function ResurfacingSection({ query }: { query: string }) {
  const [items, setItems] = useState<ResurfaceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/diary/resurface?q=${encodeURIComponent(query || 'memories')}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [query])

  if (loading) {
    return (
      <section style={{ marginTop: '56px' }}>
        <span className="kicker">searching your past…</span>
      </section>
    )
  }

  if (!items.length) return null

  return (
    <section style={{ marginTop: '56px' }}>
      <SectionHeader
        kicker="Resurfacing"
        title={<>From your past, <em>arriving today</em></>}
      />

      <div className="flex flex-col" style={{ gap: '28px' }}>
        {items.map((item, i) => (
          <div key={i} className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: '14px' }}>
            <span
              className="serif select-none"
              style={{ fontSize: '52px', lineHeight: 0.7, color: 'rgba(244,199,123,0.18)', marginTop: '4px' }}
            >
              "
            </span>
            <div>
              <p className="serif" style={{ fontSize: 'var(--fs-quote)', lineHeight: 1.4, color: 'var(--ink-strong)', fontWeight: 300, letterSpacing: '-0.005em' }}>
                {item.quote}
              </p>
              <p className="kicker mt-3" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.fromType}
                <span style={{ color: 'var(--ink-faint)', margin: '0 8px' }}>·</span>
                <em style={{ letterSpacing: 0, textTransform: 'none', fontSize: 'var(--fs-meta)', color: 'var(--ink-soft)' }}>{item.from}</em>
                <span style={{ color: 'var(--ink-faint)', margin: '0 8px' }}>·</span>
                <em style={{ letterSpacing: 0, textTransform: 'none', fontSize: 'var(--fs-meta)', color: 'var(--ink-mute)' }}>{item.reason}</em>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
