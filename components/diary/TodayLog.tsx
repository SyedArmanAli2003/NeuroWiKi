'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { KindBox, type EntryKind } from './KindChip'

interface Entry {
  id: number
  time: string
  kind: EntryKind
  title?: string | null
  text: string
  filed_under?: string | null
  justAdded?: boolean
  synced?: boolean
}

interface EchoItem {
  quote: string
  source: string
  sourceType: 'diary' | 'wiki'
  date: string | null
  daysAgo: number | null
  reason: string
  href?: string
}

interface TodayLogProps {
  entries: Entry[]
  onUpdate: (id: number, text: string) => void
}

function relTimeLabel(days: number | null): string {
  if (days == null) return ''
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.round(days / 7)} wks ago`
  if (days < 365) return `${Math.round(days / 30)} mo ago`
  return `${Math.round(days / 365)} yr ago`
}

function EntryRow({ entry, onUpdate, date }: { entry: Entry; onUpdate: (id: number, text: string) => void; date: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.text)
  const [echoes, setEchoes] = useState<EchoItem[] | null>(null)
  const [echoLoading, setEchoLoading] = useState(false)
  const [echoOpen, setEchoOpen] = useState(false)

  async function save() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === entry.text) { setEditing(false); return }
    await fetch('/api/diary/today', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entry.id, text: trimmed }),
    })
    onUpdate(entry.id, trimmed)
    // entry.text local update handled by parent
    setEditing(false)
  }

  async function toggleEchoes() {
    if (echoOpen) { setEchoOpen(false); return }
    if (echoes) { setEchoOpen(true); return }
    setEchoLoading(true)
    setEchoOpen(true)
    try {
      const res = await fetch('/api/diary/resurface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: entry.text, excludeDate: date }),
      })
      const d = await res.json()
      setEchoes(d.items ?? [])
    } catch {
      setEchoes([])
    } finally {
      setEchoLoading(false)
    }
  }

  return (
    <motion.div
      key={entry.id}
      initial={entry.justAdded ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-4 items-start group"
      style={{ gridTemplateColumns: '64px 22px 1fr' }}
    >
      <span
        className="font-mono"
        style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink-mute)', whiteSpace: 'nowrap', paddingTop: '3px', letterSpacing: '0.02em' }}
      >
        {entry.time}
      </span>

      <div style={{ paddingTop: '1px' }}>
        <KindBox kind={entry.kind} />
      </div>

      <div>
        {editing ? (
          <div>
            <textarea
              autoFocus
              className="w-full bg-transparent resize-none outline-none"
              style={{
                fontFamily: 'var(--font-reading)',
                fontSize: 'var(--fs-body)',
                lineHeight: 'var(--lh-roomy)',
                color: 'var(--ink-strong)',
                borderBottom: '1px dashed var(--hair-strong)',
                paddingBottom: '4px',
                minHeight: '24px',
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() }
                if (e.key === 'Escape') { setEditing(false); setDraft(entry.text) }
              }}
              onBlur={save}
              rows={Math.max(1, draft.split('\n').length)}
            />
            <p className="kicker" style={{ fontSize: 'var(--fs-micro)', marginTop: '4px' }}>
              ↵ save · esc cancel
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                {entry.title && (
                  <p style={{
                    fontSize: 'var(--fs-title)',
                    fontWeight: 500,
                    lineHeight: 1.25,
                    letterSpacing: '-0.015em',
                    color: 'var(--ink-strong)',
                    marginBottom: '6px',
                  }}>
                    {entry.title}
                  </p>
                )}
                <p style={{ fontFamily: 'var(--font-reading)', fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-roomy)', color: entry.title ? 'var(--ink-soft)' : 'var(--ink-strong)', letterSpacing: '-0.003em' }}>
                  {entry.text}
                </p>
                {entry.filed_under && (
                  <p className="serif" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-soft)', marginTop: '4px' }}>
                    → filed under <span style={{ color: 'var(--ink)' }}>{entry.filed_under}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2.5 shrink-0" style={{ paddingTop: '2px' }}>
                <button
                  onClick={toggleEchoes}
                  className={`transition-all duration-150 ${echoOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  style={{ fontSize: 'var(--fs-meta)', color: echoOpen ? 'var(--warm)' : 'var(--ink-mute)' }}
                  title="Find echoes from your past"
                >
                  ✦
                </button>
                <span
                  title={entry.synced ? 'Synced to HydraDB memory' : 'Not synced to memory'}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ fontSize: 'var(--fs-kicker)', color: entry.synced ? 'var(--warm-soft)' : 'rgba(255,120,120,0.55)' }}
                >
                  {entry.synced ? '◈' : '○'}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ fontSize: 'var(--fs-kicker)', color: 'var(--ink-mute)' }}
                  title="Edit entry"
                >
                  ✎
                </button>
              </div>
            </div>

            <AnimatePresence>
              {echoOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-4"
                    style={{
                      borderLeft: '1px solid rgba(244,199,123,0.25)',
                      paddingLeft: '16px',
                    }}
                  >
                    <p className="kicker" style={{ color: 'var(--warm-soft)', marginBottom: '12px' }}>
                      ✦ echoes from your past
                    </p>

                    {echoLoading && (
                      <p className="serif" style={{ fontSize: 'var(--fs-nav)', color: 'var(--ink-mute)' }}>
                        listening for echoes…
                      </p>
                    )}

                    {!echoLoading && echoes && echoes.length === 0 && (
                      <p className="serif" style={{ fontSize: 'var(--fs-nav)', color: 'var(--ink-mute)' }}>
                        (no echoes yet — your past is still gathering)
                      </p>
                    )}

                    {!echoLoading && echoes && echoes.length > 0 && (
                      <div className="flex flex-col" style={{ gap: '14px' }}>
                        {echoes.map((echo, i) => {
                          const body = (
                            <>
                              <p className="serif" style={{ fontSize: 'var(--fs-body)', lineHeight: 1.5, color: 'var(--ink-strong)', letterSpacing: '-0.003em' }}>
                                {echo.quote}
                              </p>
                              <p style={{ fontSize: 'var(--fs-kicker)', letterSpacing: '0.12em', color: 'var(--ink-mute)', marginTop: '5px', textTransform: 'uppercase' }}>
                                <span style={{ color: echo.sourceType === 'diary' ? 'var(--warm-soft)' : 'var(--ink-soft)' }}>
                                  {echo.sourceType === 'diary' ? 'past diary' : 'wiki'}
                                </span>
                                {echo.daysAgo != null && (
                                  <>
                                    <span style={{ color: 'var(--ink-faint)', margin: '0 6px' }}>·</span>
                                    <em className="serif" style={{ letterSpacing: 0, textTransform: 'none', fontSize: 'var(--fs-meta)', color: 'var(--ink-soft)' }}>
                                      {relTimeLabel(echo.daysAgo)}
                                    </em>
                                  </>
                                )}
                                <span style={{ color: 'var(--ink-faint)', margin: '0 6px' }}>·</span>
                                <em className="serif" style={{ letterSpacing: 0, textTransform: 'none', fontSize: 'var(--fs-meta)', color: 'var(--ink-mute)' }}>
                                  {echo.source}
                                </em>
                              </p>
                            </>
                          )

                          return echo.href ? (
                            <Link key={i} href={echo.href} className="block hover:opacity-80 transition-opacity">
                              {body}
                            </Link>
                          ) : (
                            <div key={i}>{body}</div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function TodayLog({ entries, onUpdate }: TodayLogProps) {
  const today = new Date().toISOString().split('T')[0]

  if (!entries.length) {
    return (
      <p
        className="serif"
        style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-faint)', paddingTop: '14px', paddingLeft: '4px' }}
      >
        (Nothing yet today. The field above is waiting.)
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <EntryRow key={e.id} entry={e} onUpdate={onUpdate} date={today} />
        ))}
      </AnimatePresence>
    </div>
  )
}
