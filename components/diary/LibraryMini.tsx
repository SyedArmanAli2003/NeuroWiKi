'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SectionHeader } from './SectionHeader'
import { useWikiPages } from '@/lib/use-wiki-pages'

const TYPE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  concept:      { color: '#C7B8FF', bg: 'rgba(199,184,255,0.06)', border: 'rgba(199,184,255,0.22)' },
  person:       { color: '#9BDCAA', bg: 'rgba(155,220,170,0.06)', border: 'rgba(155,220,170,0.22)' },
  place:        { color: '#F4C77B', bg: 'rgba(244,199,123,0.06)', border: 'rgba(244,199,123,0.22)' },
  event:        { color: '#F49B9B', bg: 'rgba(244,155,155,0.06)', border: 'rgba(244,155,155,0.22)' },
  tool:         { color: '#7BD0E8', bg: 'rgba(123,208,232,0.06)', border: 'rgba(123,208,232,0.22)' },
  organization: { color: '#B4B0F0', bg: 'rgba(180,176,240,0.06)', border: 'rgba(180,176,240,0.22)' },
}

const ALL_TYPES = ['concept', 'person', 'place', 'event', 'tool', 'organization']

export function LibraryMini() {
  const pages = useWikiPages() as any[]
  const [filter, setFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = pages.filter((p) => {
    if (filter && p.type !== filter) return false
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const visible = showAll ? filtered : filtered.slice(0, 6)

  const counts: Record<string, number> = {}
  for (const p of pages) counts[p.type] = (counts[p.type] ?? 0) + 1

  return (
    <section style={{ marginTop: '56px' }}>
      <SectionHeader
        kicker="Library"
        title={<>{pages.length} pages, <em>filed and threaded</em></>}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className="rounded-full transition-all duration-150"
            style={{
              padding: '4px 11px',
              fontSize: 'var(--fs-kicker)',
              letterSpacing: '0.04em',
              color: !filter ? 'var(--ink-strong)' : 'var(--ink-mute)',
              background: !filter ? 'rgba(222,219,200,0.06)' : 'transparent',
              border: `1px solid ${!filter ? 'var(--hair-strong)' : 'var(--hair)'}`,
            }}
          >
            All <span className="font-mono ml-1" style={{ fontSize: 'var(--fs-micro)', opacity: 0.6 }}>{pages.length}</span>
          </button>
          {ALL_TYPES.filter((t) => counts[t]).map((t) => {
            const tc = TYPE_COLORS[t] ?? TYPE_COLORS.concept
            const active = filter === t
            return (
              <button
                key={t}
                onClick={() => setFilter(active ? null : t)}
                className="rounded-full transition-all duration-150 capitalize"
                style={{
                  padding: '4px 11px',
                  fontSize: 'var(--fs-kicker)',
                  letterSpacing: '0.03em',
                  color: active ? tc.color : 'var(--ink-mute)',
                  background: active ? tc.bg : 'transparent',
                  border: `1px solid ${active ? tc.border : 'var(--hair)'}`,
                }}
              >
                {t} <span className="font-mono ml-1" style={{ fontSize: 'var(--fs-micro)', opacity: 0.7 }}>{counts[t]}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 rounded-full" style={{ padding: '5px 12px', border: '1px solid var(--hair)', minWidth: '200px' }}>
          <span style={{ fontSize: 'var(--fs-kicker)', color: 'var(--ink-faint)' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search"
            className="bg-transparent outline-none flex-1"
            style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
        {visible.map((p) => {
          const tc = TYPE_COLORS[p.type] ?? TYPE_COLORS.concept
          return (
            <Link
              key={p.slug}
              href={`/wiki/${p.slug}`}
              className="rounded-2xl flex flex-col transition-all duration-200"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--hair)',
                minHeight: '152px',
                padding: '14px',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hi)'
                e.currentTarget.style.borderColor = 'var(--hair-strong)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)'
                e.currentTarget.style.borderColor = 'var(--hair)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div className="flex items-center">
                <span
                  className="rounded capitalize"
                  style={{
                    padding: '2px 7px',
                    fontSize: 'var(--fs-micro)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: tc.color,
                    background: tc.bg,
                    border: `1px solid ${tc.border}`,
                  }}
                >
                  {p.type}
                </span>
              </div>

              <p style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 500, color: 'var(--ink-strong)', lineHeight: 1.3, letterSpacing: '-0.005em' }}>
                {p.title}
              </p>

              {p.summary && (
                <p
                  style={{
                    fontSize: 'var(--fs-meta)',
                    color: 'var(--ink-soft)',
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  {p.summary}
                </p>
              )}

              <div className="flex items-center justify-between mt-auto" style={{ fontFamily: 'monospace', fontSize: 'var(--fs-micro)', color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>
                <span>↪ {p.links ?? 0}</span>
                <span>{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length > 6 && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setShowAll(!showAll)} className="more-pill">
            {showAll ? 'show fewer' : `show all ${filtered.length}`}
          </button>
        </div>
      )}
    </section>
  )
}
