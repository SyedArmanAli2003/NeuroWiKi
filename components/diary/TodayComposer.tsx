'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KindChip, type EntryKind } from './KindChip'
import { useWikiPages } from '@/lib/use-wiki-pages'

const KINDS: EntryKind[] = ['thought', 'link', 'note', 'decision', 'question']

interface WikiPage { slug: string; title: string; type: string }

interface TodayComposerProps {
  date: string
  onEntry: (entry: any, synced: boolean) => void
}

export function TodayComposer({ date, onEntry }: TodayComposerProps) {
  const [kind, setKind] = useState<EntryKind>('thought')
  const [text, setText] = useState('')
  const [filedUnder, setFiledUnder] = useState<{ slug: string; title: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState(false)

  // Wikilink autocomplete state — fetch both wiki pages and past captures
  const wikiPages = useWikiPages('pages') as WikiPage[]
  const captures = useWikiPages('captures') as WikiPage[]
  const pages: WikiPage[] = [...wikiPages, ...captures]
  const [query, setQuery] = useState('')
  const [triggerPos, setTriggerPos] = useState(-1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuIdx, setMenuIdx] = useState(0)

  const ref = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [text])

  const filtered = query
    ? pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 7)
    : pages.slice(0, 7)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setText(val)

    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const lastOpen = before.lastIndexOf('[[')
    const lastClose = before.lastIndexOf(']]')

    if (lastOpen !== -1 && lastOpen > lastClose) {
      setTriggerPos(lastOpen)
      setQuery(before.slice(lastOpen + 2))
      setMenuOpen(true)
      setMenuIdx(0)
    } else {
      setMenuOpen(false)
      setTriggerPos(-1)
      setQuery('')
    }
  }

  function selectPage(page: WikiPage) {
    const before = text.slice(0, triggerPos)
    const after = text.slice(triggerPos + 2 + query.length)
    const linked = `[[${page.title}]]`
    setText(before + linked + after)
    setFiledUnder({ slug: page.slug, title: page.title })
    setMenuOpen(false)
    setQuery('')
    setTriggerPos(-1)
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus()
        const pos = before.length + linked.length
        ref.current.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (menuOpen && filtered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIdx(i => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMenuIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); selectPage(filtered[menuIdx]); return }
      if (e.key === 'Escape')    { setMenuOpen(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  async function submit() {
    const trimmed = text.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
    const res = await fetch('/api/diary/today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'entry', date, time, kind, text: trimmed, filed_under: filedUnder?.slug ?? null }),
    })
    const { entry, synced } = await res.json()
    onEntry({ ...entry, justAdded: true }, !!synced)
    setText('')
    setFiledUnder(null)
    setSubmitting(false)
    ref.current?.focus()
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()

  return (
    <div className="relative">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${focused ? 'var(--hair-strong)' : 'var(--hair)'}`,
          boxShadow: focused ? '0 0 0 4px rgba(222,219,200,0.02)' : 'none',
        }}
      >
        {/* Top row: time + textarea */}
        <div className="grid gap-4 p-5" style={{ gridTemplateColumns: '64px 1fr' }}>
          <span
            className="font-mono pt-1"
            style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink-mute)', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}
          >
            {timeStr}
          </span>
          <div className="flex flex-col gap-2">
            <textarea
              ref={ref}
              rows={1}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="What's on your mind?"
              className="bg-transparent resize-none outline-none w-full serif"
              style={{
                fontSize: 'var(--fs-body-lg)',
                lineHeight: 1.55,
                color: 'var(--ink-strong)',
                minHeight: '24px',
                letterSpacing: '-0.005em',
              }}
            />
            {filedUnder && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <span className="kicker">filing under</span>
                <span
                  className="flex items-center gap-1.5 rounded-full"
                  style={{ padding: '2px 10px', fontSize: 'var(--fs-kicker)', color: 'var(--ink)', background: 'rgba(222,219,200,0.06)', border: '1px solid var(--hair-strong)' }}
                >
                  <span style={{ color: 'var(--ink-soft)' }}>↪</span>
                  {filedUnder.title}
                  <button
                    type="button"
                    onClick={() => setFiledUnder(null)}
                    className="hover:text-white transition-colors"
                    style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mute)', marginLeft: '2px' }}
                  >
                    ✕
                  </button>
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-wrap gap-3"
          style={{ borderTop: '1px solid var(--hair)' }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {KINDS.map((k) => (
              <KindChip key={k} kind={k} active={kind === k} onClick={() => setKind(k)} />
            ))}
          </div>
          <span style={{ fontSize: 'var(--fs-kicker)', letterSpacing: '0.06em', color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>
            <kbd style={{ fontSize: 'var(--fs-micro)', padding: '2px 6px', border: '1px solid var(--hair)', borderRadius: '4px', marginRight: '4px' }}>↵</kbd>
            save · <kbd style={{ fontSize: 'var(--fs-micro)', padding: '2px 6px', border: '1px solid var(--hair)', borderRadius: '4px', margin: '0 2px' }}>[[</kbd> link · ✦ echoes
          </span>
        </div>
      </div>

      {/* Wikilink dropdown */}
      <AnimatePresence>
        {menuOpen && filtered.length > 0 && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 w-full rounded-2xl overflow-hidden"
            style={{
              top: 'calc(100% + 8px)',
              background: 'var(--surface-hi)',
              border: '1px solid var(--hair-strong)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            }}
          >
            {(() => {
              const pagesGroup = filtered.filter(p => p.type !== 'diary')
              const capturesGroup = filtered.filter(p => p.type === 'diary')
              const groupStart = { pages: 0, captures: pagesGroup.length }
              return (
                <>
                  {pagesGroup.length > 0 && (
                    <>
                      <div className="kicker" style={{ padding: '10px 14px 6px' }}>Pages · {pagesGroup.length}</div>
                      {pagesGroup.map((p, idx) => {
                        const globalIdx = groupStart.pages + idx
                        return (
                          <button
                            key={p.slug}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectPage(p) }}
                            className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 transition-colors duration-75"
                            style={{ background: globalIdx === menuIdx ? 'rgba(222,219,200,0.05)' : 'transparent' }}
                            onMouseEnter={() => setMenuIdx(globalIdx)}
                          >
                            <span
                              className="rounded capitalize shrink-0"
                              style={{
                                padding: '2px 7px',
                                fontSize: 'var(--fs-micro)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--ink-soft)',
                                border: '1px solid var(--hair-strong)',
                              }}
                            >
                              {p.type}
                            </span>
                            <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-strong)' }}>{p.title}</span>
                          </button>
                        )
                      })}
                    </>
                  )}
                  {capturesGroup.length > 0 && (
                    <>
                      <div className="kicker" style={{ padding: '10px 14px 6px', borderTop: pagesGroup.length > 0 ? '1px solid var(--hair)' : 'none', color: 'var(--warm-soft)' }}>
                        ✦ Past captures · {capturesGroup.length}
                      </div>
                      {capturesGroup.map((p, idx) => {
                        const globalIdx = groupStart.captures + idx
                        return (
                          <button
                            key={p.slug}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectPage(p) }}
                            className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 transition-colors duration-75"
                            style={{ background: globalIdx === menuIdx ? 'rgba(244,199,123,0.06)' : 'transparent' }}
                            onMouseEnter={() => setMenuIdx(globalIdx)}
                          >
                            <span
                              className="rounded shrink-0"
                              style={{
                                padding: '2px 7px',
                                fontSize: 'var(--fs-micro)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--warm-soft)',
                                background: 'rgba(244,199,123,0.06)',
                                border: '1px solid rgba(244,199,123,0.2)',
                              }}
                            >
                              capture
                            </span>
                            <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-strong)' }}>{p.title}</span>
                          </button>
                        )
                      })}
                    </>
                  )}
                </>
              )
            })()}
            <div style={{ padding: '8px 14px', fontSize: 'var(--fs-micro)', letterSpacing: '0.1em', color: 'var(--ink-faint)', borderTop: '1px solid var(--hair)' }}>
              ↑↓ navigate · ↵ select · esc close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
