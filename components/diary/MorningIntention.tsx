'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MorningIntentionProps {
  date: string
  initial: string | null
  initialTime: string | null
}

export function MorningIntention({ date, initial, initialTime }: MorningIntentionProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial ?? '')
  const [time, setTime] = useState(initialTime ?? '')
  const [saved, setSaved] = useState(!!initial)

  async function save(v: string) {
    const trimmed = v.trim()
    if (!trimmed) { setEditing(false); return }
    const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
    setValue(trimmed)
    setTime(t)
    setSaved(true)
    setEditing(false)
    await fetch('/api/diary/today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'meta', date, intention: trimmed, intention_time: t }),
    })
  }

  const labelText = saved && time ? `This morning, at ${time}` : 'Morning intention'

  return (
    <div className="pt-6 pb-2 flex items-start gap-4 flex-wrap">
      <span className="kicker" style={{ paddingTop: '8px' }}>
        {labelText} <span style={{ color: 'var(--ink-faint)', marginLeft: '4px' }}>·</span>
      </span>

      <div className="flex-1 min-w-0" style={{ paddingTop: '2px' }}>
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <input
                autoFocus
                className="w-full bg-transparent outline-none serif"
                style={{
                  fontSize: 'var(--fs-quote)',
                  lineHeight: 1.4,
                  color: 'var(--ink-strong)',
                  borderBottom: '1px dashed var(--hair-strong)',
                  paddingBottom: '4px',
                  letterSpacing: '-0.005em',
                }}
                defaultValue={value}
                placeholder="What do you want to carry into today?"
                onBlur={(e) => save(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save((e.target as HTMLInputElement).value)
                  if (e.key === 'Escape') setEditing(false)
                }}
              />
            </motion.div>
          ) : (
            <motion.button
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setEditing(true)}
              className="text-left flex items-start justify-between gap-3 w-full group"
            >
              <span
                className="serif"
                style={{
                  fontSize: 'var(--fs-quote)',
                  lineHeight: 1.4,
                  color: saved ? 'var(--ink-strong)' : 'var(--ink-faint)',
                  letterSpacing: '-0.005em',
                  textWrap: 'pretty' as any,
                }}
              >
                {saved ? value : 'Set a morning intention…'}
              </span>
              <span
                className="opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0"
                style={{ fontSize: 'var(--fs-kicker)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', paddingTop: '8px' }}
              >
                ✎ edit
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
