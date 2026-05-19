'use client'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { WikilinkMenu, type WikiPage } from './WikilinkMenu'
import { useWikiPages } from '@/lib/use-wiki-pages'
import { useWikilinkTrigger } from '@/lib/use-wikilink-trigger'

interface TodayComposerProps {
  date: string
  onEntry: (entry: any, synced: boolean) => void
}

export function TodayComposer({ date, onEntry }: TodayComposerProps) {
  const kind = 'thought'
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [filedUnder, setFiledUnder] = useState<{ slug: string; title: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState(false)

  const wikiPages = useWikiPages('pages') as WikiPage[]
  const captures  = useWikiPages('captures') as WikiPage[]
  const pages: WikiPage[] = [...wikiPages, ...captures]

  const link = useWikilinkTrigger()
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [text])

  const filtered = link.state.query
    ? pages.filter(p => p.title.toLowerCase().includes(link.state.query.toLowerCase())).slice(0, 7)
    : pages.slice(0, 7)

  // Reorder so non-diary first to match WikilinkMenu groups
  const sortedFiltered = [
    ...filtered.filter(p => p.type !== 'diary'),
    ...filtered.filter(p => p.type === 'diary'),
  ]

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setText(val)
    link.onChange(val, e.target.selectionStart ?? val.length)
  }

  function selectPage(page: WikiPage) {
    const before = text.slice(0, link.state.triggerPos)
    const after = text.slice(link.state.triggerPos + 2 + link.state.query.length)
    const linked = `[[${page.title}]]`
    setText(before + linked + after)
    setFiledUnder({ slug: page.slug, title: page.title })
    link.close()
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus()
        const pos = before.length + linked.length
        ref.current.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (link.state.open && sortedFiltered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); link.setActive(i => Math.min(i + 1, sortedFiltered.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); link.setActive(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); selectPage(sortedFiltered[link.state.activeIdx]); return }
      if (e.key === 'Escape')    { link.close(); return }
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
      body: JSON.stringify({
        action: 'entry',
        date,
        time,
        kind,
        title: title.trim() || null,
        text: trimmed,
        filed_under: filedUnder?.slug ?? null,
      }),
    })
    const { entry, synced } = await res.json()
    onEntry({ ...entry, justAdded: true }, !!synced)
    setTitle('')
    setText('')
    setFiledUnder(null)
    setSubmitting(false)
    ref.current?.focus()
  }

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()

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
        <div className="grid gap-4 p-5" style={{ gridTemplateColumns: '64px 1fr' }}>
          <span
            className="font-mono pt-1"
            style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink-mute)', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}
          >
            {timeStr}
          </span>
          <div className="flex flex-col gap-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); ref.current?.focus() }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Title (optional)"
              className="bg-transparent outline-none w-full"
              style={{
                fontSize: 'var(--fs-title)',
                fontWeight: 400,
                lineHeight: 1.2,
                color: 'var(--ink-strong)',
                letterSpacing: '-0.015em',
              }}
            />
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
                lineHeight: 1.6,
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
      </div>

      <WikilinkMenu
        open={link.state.open}
        pages={sortedFiltered}
        activeIdx={link.state.activeIdx}
        onPick={selectPage}
        onHover={(idx) => link.setActive(idx)}
      />
    </div>
  )
}
