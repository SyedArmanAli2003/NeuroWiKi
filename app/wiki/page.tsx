'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Download, ArrowRight, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Page {
  slug: string
  title: string
  summary: string
  type: string
  updated_at: string
}

const TYPE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  concept:      { color: '#C7B8FF', bg: 'rgba(199,184,255,0.07)', border: 'rgba(199,184,255,0.22)' },
  person:       { color: '#9BDCAA', bg: 'rgba(155,220,170,0.07)', border: 'rgba(155,220,170,0.22)' },
  place:        { color: '#F4C77B', bg: 'rgba(244,199,123,0.07)', border: 'rgba(244,199,123,0.22)' },
  event:        { color: '#F49B9B', bg: 'rgba(244,155,155,0.07)', border: 'rgba(244,155,155,0.22)' },
  tool:         { color: '#7BD0E8', bg: 'rgba(123,208,232,0.07)', border: 'rgba(123,208,232,0.22)' },
  organization: { color: '#B4B0F0', bg: 'rgba(180,176,240,0.07)', border: 'rgba(180,176,240,0.22)' },
  diary:        { color: '#DEDBC8', bg: 'rgba(222,219,200,0.05)', border: 'rgba(222,219,200,0.16)' },
}

const TYPE_ORDER = ['concept', 'person', 'place', 'event', 'tool', 'organization']

function relDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const days = Math.round(diffMs / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.round(days / 7)}w ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PageCard({ page, index, onDelete }: { page: Page; index: number; onDelete: (slug: string) => void }) {
  const tc = TYPE_COLORS[page.type] ?? TYPE_COLORS.concept
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/wiki/${page.slug}/delete`, { method: 'DELETE' })
      if (res.ok) onDelete(page.slug)
      else alert('Failed to delete. Please try again.')
    } catch {
      alert('Failed to delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.18), ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative group/card">
        <Link href={`/wiki/${page.slug}`} className="block app-card flex flex-col" style={{ minHeight: '160px', height: '100%' }}>
          <div className="flex items-center justify-between mb-3">
            <span
              className="rounded capitalize"
              style={{
                padding: '2px 8px',
                fontSize: 'var(--fs-micro)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: tc.color,
                background: tc.bg,
                border: `1px solid ${tc.border}`,
              }}
            >
              {page.type}
            </span>
          </div>

          <h3 style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 500, color: 'var(--ink-strong)', lineHeight: 1.3, letterSpacing: '-0.005em', marginBottom: '6px' }}>
            {page.title}
          </h3>

          {page.summary && (
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
              {page.summary}
            </p>
          )}

          <div
            className="flex items-center justify-between font-mono mt-auto pt-3"
            style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mute)', letterSpacing: '0.02em', borderTop: '1px solid var(--hair)' }}
          >
            <span>{relDate(page.updated_at)}</span>
            <span style={{ color: 'var(--ink-soft)' }}>→</span>
          </div>
        </Link>

        {/* Delete button — shown on hover */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete this wiki entry"
          aria-label="Delete"
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 28, height: 28,
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.06)',
            color: '#f87171',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="group-hover/card:opacity-100"
        >
          {deleting ? <span style={{ width: 10, height: 10, border: '1.5px solid #f87171', borderTopColor: 'transparent', borderRadius: '50%', animation: 'auth-spin 0.6s linear infinite', display: 'block' }} /> : <Trash2 size={12} />}
        </button>
      </div>
    </motion.div>
  )
}

export default function WikiBrowserPage() {
  const { data: session } = useSession()
  const [pages, setPages]       = useState<Page[]>([])
  const [captures, setCaptures] = useState<Page[]>([])
  const [tab, setTab]           = useState<'pages' | 'captures'>('pages')
  const [filter, setFilter]     = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  function handleDelete(slug: string) {
    setPages((p) => p.filter((x) => x.slug !== slug))
    setCaptures((p) => p.filter((x) => x.slug !== slug))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/wiki').then((r) => r.json()),
      fetch('/api/wiki?onlyDiary=1').then((r) => r.json()),
    ])
      .then(([all, diary]) => {
        setPages(all.pages ?? [])
        setCaptures(diary.pages ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const source = tab === 'captures' ? captures : pages

  const counts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of source) c[p.type] = (c[p.type] ?? 0) + 1
    return c
  }, [source])

  const filtered = useMemo(
    () =>
      source.filter((p) => {
        if (filter && p.type !== filter) return false
        if (search) {
          const q = search.toLowerCase()
          if (!p.title.toLowerCase().includes(q) && !(p.summary || '').toLowerCase().includes(q)) return false
        }
        return true
      }),
    [source, filter, search],
  )

  // Auto-group by type when on Pages tab with no filter and no search
  const grouped = useMemo(() => {
    if (tab !== 'pages' || filter || search) return null
    const buckets: Record<string, Page[]> = {}
    for (const p of filtered) {
      const t = p.type || 'concept'
      if (!buckets[t]) buckets[t] = []
      buckets[t].push(p)
    }
    return TYPE_ORDER.filter((t) => buckets[t]?.length).map((t) => ({ type: t, items: buckets[t] }))
  }, [filtered, tab, filter, search])

  return (
    <div className="app-canvas min-h-screen" style={{ background: '#000' }}>
      <div className="mx-auto px-7 lg:px-10" style={{ maxWidth: '1200px' }}>
        {/* Hero */}
        <header style={{ paddingTop: '80px', paddingBottom: '40px', borderBottom: '1px solid var(--hair)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1
                style={{
                  fontSize: 'var(--fs-h1)',
                  fontWeight: 400,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  color: 'var(--ink-strong)',
                }}
              >
                Everything you know.
              </h1>
              <p className="serif mt-3" style={{ fontSize: 'var(--fs-quote)', color: 'var(--ink-soft)', letterSpacing: '-0.005em' }}>
                {session?.user?.name ? `${session.user.name}'s wiki` : 'Compiled. Connected. Yours.'}
              </p>
            </div>

            <a
              href="/api/export"
              download="neurowiki-export.zip"
              className="flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-white/[0.04] shrink-0"
              style={{
                padding: '7px 14px',
                fontSize: 'var(--fs-kicker)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-mute)',
                border: '1px solid var(--hair)',
              }}
            >
              <Download size={12} />
              Export
            </a>
          </div>

          {/* <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6" style={{ fontSize: 'var(--fs-kicker)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
            <span><span style={{ color: 'var(--ink-strong)' }}>{pages.length}</span> pages</span>
            <span style={{ color: 'var(--ink-faint)' }}>·</span>
            <span><span style={{ color: 'var(--ink-strong)' }}>{captures.length}</span> captures</span>
            {tab === 'pages' && TYPE_ORDER.filter((t) => counts[t]).map((t) => (
              <span key={t} className="flex items-center gap-x-4">
                <span style={{ color: 'var(--ink-faint)' }}>·</span>
                <span><span style={{ color: 'var(--ink-soft)' }}>{counts[t]}</span> {t}{counts[t] > 1 ? 's' : ''}</span>
              </span>
            ))}
          </div> */}
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-6 pt-7" style={{ borderBottom: '1px solid var(--hair)' }}>
          {[
            { id: 'pages', label: 'Pages', count: pages.length },
            { id: 'captures', label: 'Captures', count: captures.length },
          ].map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id as 'pages' | 'captures'); setFilter(null); setSearch('') }}
                className="relative"
                style={{
                  fontSize: 'var(--fs-nav)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--ink-strong)' : 'var(--ink-mute)',
                  paddingBottom: '12px',
                }}
              >
                {t.label}
                <span className="font-mono ml-2" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-soft)' }}>{t.count}</span>
                {active && (
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '1px', background: 'var(--ink-strong)' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Filter row */}
        <div className="flex items-center justify-between gap-3 flex-wrap mt-5 mb-7">
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
              All <span className="font-mono ml-1" style={{ fontSize: 'var(--fs-micro)', opacity: 0.6 }}>{source.length}</span>
            </button>
            {TYPE_ORDER.filter((t) => counts[t]).map((t) => {
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

          <div className="flex items-center gap-2 rounded-full" style={{ padding: '5px 14px', border: '1px solid var(--hair)', minWidth: '220px' }}>
            <span style={{ fontSize: 'var(--fs-kicker)', color: 'var(--ink-faint)' }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter pages…"
              className="bg-transparent outline-none flex-1"
              style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink)' }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="app-card animate-pulse" style={{ minHeight: '160px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            {source.length === 0 ? (
              <>
                <p className="serif" style={{ fontSize: 'var(--fs-quote)', color: 'var(--ink-soft)', marginBottom: '6px' }}>
                  {tab === 'captures' ? 'No captures yet.' : 'Wiki is empty.'}
                </p>
                <p className="kicker mb-6">
                  {tab === 'captures' ? 'Visit /diary to start writing.' : 'Feed it a source to get started.'}
                </p>
                {tab === 'pages' && (
                  <Link
                    href="/ingest"
                    className="group inline-flex items-center gap-2 rounded-full pl-5 pr-1.5 py-1.5 transition-opacity hover:opacity-90"
                    style={{ background: 'var(--ink)' }}
                  >
                    <span style={{ color: '#000', fontWeight: 500, fontSize: 'var(--fs-body-sm)' }}>Feed the wiki</span>
                    <div className="rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ width: 30, height: 30, background: '#000' }}>
                      <ArrowRight size={13} color="var(--ink)" />
                    </div>
                  </Link>
                )}
              </>
            ) : (
              <p className="serif" style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--ink-mute)' }}>No pages match.</p>
            )}
          </div>
        ) : grouped ? (
          <div className="flex flex-col gap-10 pb-20">
            {grouped.map(({ type, items }) => (
              <section key={type}>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="kicker kicker-rule capitalize">{type}</span>
                  <span className="kicker" style={{ color: 'var(--ink-faint)' }}>{items.length}</span>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                  {items.map((p, i) => (
                    <PageCard key={p.slug} page={p} index={i} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 pb-20" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {filtered.map((p, i) => (
              <PageCard key={p.slug} page={p} index={i} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
