'use client'
import { useEffect, useMemo, useState } from 'react'
import { SectionHeader } from './SectionHeader'

interface PastDay {
  date: string
  weekday: string
  rel: string
  captures: number
  decisions: number
  mood: string | null
  headline: string | null
  quiet: boolean
}

interface DiaryEntry {
  id: number
  date: string
  time: string
  kind: string
  title: string | null
  text: string
}

type Range = 'day' | 'week' | 'month'

interface Bucket {
  key: string
  label: string
  sublabel: string
  from: string
  to: string
  captures: number
  decisions: number
  headline: string | null
  quiet: boolean
}

function startOfWeek(d: Date): Date {
  const out = new Date(d)
  const day = out.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  out.setDate(out.getDate() + diff)
  out.setHours(12, 0, 0, 0)
  return out
}

function fmtMonthDay(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function rollup(days: PastDay[], range: Range): Bucket[] {
  if (range === 'day') {
    return days.map((d) => ({
      key: d.date,
      label: d.weekday,
      sublabel: d.date,
      from: d.date,
      to: d.date,
      captures: d.captures,
      decisions: d.decisions,
      headline: d.quiet ? null : (d.headline ?? null),
      quiet: d.quiet,
    }))
  }

  const groups = new Map<string, PastDay[]>()
  for (const d of days) {
    const dt = new Date(d.date + 'T12:00:00')
    let key: string
    if (range === 'week') {
      key = toISO(startOfWeek(dt))
    } else {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(d)
  }

  const ordered = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))

  return ordered.map(([key, items]) => {
    const captures = items.reduce((s, x) => s + x.captures, 0)
    const decisions = items.reduce((s, x) => s + x.decisions, 0)
    const headline = items.find((x) => x.headline)?.headline ?? null

    let label = ''
    let sublabel = ''
    let from = ''
    let to = ''
    if (range === 'week') {
      const start = new Date(key + 'T12:00:00')
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      label = `${fmtMonthDay(start)} – ${fmtMonthDay(end)}`
      sublabel = `week of ${key}`
      from = toISO(start)
      to = toISO(end)
    } else {
      const [y, m] = key.split('-').map(Number)
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0)
      label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      sublabel = key
      from = toISO(new Date(Date.UTC(y, m - 1, 1)))
      to = toISO(new Date(Date.UTC(y, m - 1, end.getDate())))
    }

    return { key, label, sublabel, from, to, captures, decisions, headline, quiet: captures === 0 }
  })
}

export function DiarySpine() {
  const [days, setDays] = useState<PastDay[]>([])
  const [range, setRange] = useState<Range>('day')
  const [showAll, setShowAll] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [entriesCache, setEntriesCache] = useState<Record<string, DiaryEntry[]>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/diary/past?limit=120')
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? []))
      .catch(() => {})
  }, [])

  const buckets = useMemo(() => rollup(days, range), [days, range])

  if (!days.length) return null

  const limit = range === 'day' ? 7 : 6
  const visible = showAll ? buckets : buckets.slice(0, limit)

  async function toggle(b: Bucket) {
    if (b.quiet) return
    if (openKey === b.key) { setOpenKey(null); return }
    setOpenKey(b.key)
    if (entriesCache[b.key]) return
    setLoadingKey(b.key)
    try {
      const r = await fetch(`/api/diary/range?from=${b.from}&to=${b.to}`)
      const d = await r.json()
      setEntriesCache((prev) => ({ ...prev, [b.key]: d.entries ?? [] }))
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <section style={{ marginTop: '56px' }}>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <SectionHeader kicker="Diary" title={<><em>Past</em>, written through</>} />
        <RangeTabs value={range} onChange={(r) => { setRange(r); setShowAll(false); setOpenKey(null) }} />
      </div>

      <div style={{ borderTop: '1px solid var(--hair)' }}>
        {visible.map((b) => {
          const open = openKey === b.key
          const entries = entriesCache[b.key]
          return (
            <div key={b.key} style={{ borderBottom: '1px solid var(--hair)' }}>
              <button
                type="button"
                onClick={() => toggle(b)}
                disabled={b.quiet}
                className="grid items-baseline w-full text-left"
                style={{
                  gridTemplateColumns: '180px 1fr auto',
                  gap: '24px',
                  padding: '18px 0',
                  background: 'transparent',
                  border: 'none',
                  cursor: b.quiet ? 'default' : 'pointer',
                  opacity: b.quiet ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span className="serif" style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--ink-strong)', letterSpacing: '-0.005em' }}>{b.label}</span>
                  <span className="font-mono" style={{ fontSize: 'var(--fs-kicker)', color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>{b.sublabel}</span>
                </div>

                <p style={{ fontSize: 'var(--fs-body)', lineHeight: 1.5, color: b.quiet ? 'var(--ink-mute)' : 'var(--ink-strong)', letterSpacing: '-0.003em' }}>
                  {b.quiet
                    ? <em style={{ color: 'var(--ink-soft)' }}>(quiet)</em>
                    : (b.headline ?? <em style={{ color: 'var(--ink-soft)' }}>—</em>)
                  }
                </p>

                <p style={{ fontSize: 'var(--fs-kicker)', letterSpacing: '0.06em', color: 'var(--ink-mute)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {b.quiet
                    ? <em className="serif" style={{ letterSpacing: 0 }}>quiet</em>
                    : <>
                        <span>
                          {b.captures} captures
                          {b.decisions > 0 && <> · {b.decisions} decision{b.decisions > 1 ? 's' : ''}</>}
                        </span>
                        <span style={{ transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', color: 'var(--ink-soft)' }}>›</span>
                      </>
                  }
                </p>
              </button>

              {open && !b.quiet && (
                <div style={{ padding: '4px 0 20px 0' }}>
                  {loadingKey === b.key && !entries ? (
                    <p className="kicker" style={{ paddingLeft: '180px' }}>loading…</p>
                  ) : (
                    <CaptureList entries={entries ?? []} range={range} />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {buckets.length > limit && (
        <div className="flex justify-center mt-6">
          <button onClick={() => setShowAll(!showAll)} className="more-pill">
            {showAll ? 'show fewer' : 'show earlier'}
          </button>
        </div>
      )}
    </section>
  )
}

function CaptureList({ entries, range }: { entries: DiaryEntry[]; range: Range }) {
  if (!entries.length) return <p className="kicker" style={{ paddingLeft: '180px' }}>no captures</p>

  if (range === 'day') {
    return (
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '180px' }}>
        {entries.map((e) => <CaptureRow key={e.id} entry={e} showDate={false} />)}
      </ul>
    )
  }

  const byDate = new Map<string, DiaryEntry[]>()
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, [])
    byDate.get(e.date)!.push(e)
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {dates.map((d) => (
        <div key={d} className="grid" style={{ gridTemplateColumns: '180px 1fr', gap: '24px' }}>
          <span className="font-mono" style={{ fontSize: 'var(--fs-kicker)', color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>{d}</span>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {byDate.get(d)!.map((e) => <CaptureRow key={e.id} entry={e} showDate={false} />)}
          </ul>
        </div>
      ))}
    </div>
  )
}

function CaptureRow({ entry }: { entry: DiaryEntry; showDate: boolean }) {
  return (
    <li style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
      <span className="font-mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mute)', minWidth: '56px', letterSpacing: '0.02em' }}>{entry.time}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {entry.title && (
          <div className="serif" style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-strong)', letterSpacing: '-0.005em' }}>{entry.title}</div>
        )}
        <p style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 1.5, color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {entry.text}
        </p>
      </div>
    </li>
  )
}

function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const opts: Range[] = ['day', 'week', 'month']
  return (
    <div
      className="flex items-center"
      style={{
        gap: '2px',
        padding: '3px',
        border: '1px solid var(--hair)',
        borderRadius: '999px',
        background: 'var(--surface)',
      }}
    >
      {opts.map((o) => {
        const active = o === value
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: 'var(--fs-kicker)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: active ? 'var(--ink-strong)' : 'var(--ink-mute)',
              background: active ? 'rgba(222,219,200,0.08)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}
