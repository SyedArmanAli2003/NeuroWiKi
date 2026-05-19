'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface EveningReviewProps {
  date: string
  entries: any[]
  savedReview: string | null
  onSave: (review: string) => void
}

type ReviewState = 'idle' | 'loading' | 'drafted' | 'editing' | 'saved'

export function EveningReview({ date, entries, savedReview, onSave }: EveningReviewProps) {
  const [state, setState] = useState<ReviewState>(savedReview ? 'saved' : 'idle')
  const [draft, setDraft] = useState(savedReview ?? '')
  const [editValue, setEditValue] = useState('')

  async function generateDraft() {
    if (!entries.length) return
    setState('loading')
    try {
      const res = await fetch('/api/diary/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, date }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setDraft(text)
      }
      setState('drafted')
    } catch {
      setState('idle')
    }
  }

  async function saveReview(text: string) {
    setDraft(text)
    setState('saved')
    onSave(text)
    await fetch('/api/diary/today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'meta', date, review: text }),
    })
  }

  return (
    <div
      className="rounded-2xl mt-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(150deg, rgba(244,199,123,0.07) 0%, rgba(18,17,16,0.95) 70%)',
        border: '1px solid rgba(244,199,123,0.14)',
        padding: '24px 26px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 24,
          right: 24,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(244,199,123,0.4), transparent)',
        }}
      />

      <p
        style={{
          fontSize: 'var(--fs-kicker)',
          letterSpacing: '0.24em',
          color: 'var(--warm)',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        ✦ Tonight's Review
      </p>

      {state === 'idle' && (
        <div>
          <button
            onClick={generateDraft}
            disabled={!entries.length}
            className="rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              padding: '8px 18px',
              fontSize: 'var(--fs-kicker)',
              letterSpacing: '0.06em',
              color: 'var(--warm)',
              border: '1px solid rgba(244,199,123,0.35)',
              background: 'rgba(244,199,123,0.08)',
            }}
          >
            draft from today
          </button>
          <p className="serif mt-4" style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 1.5, color: 'var(--ink-soft)', maxWidth: '54ch' }}>
            At the end of the day, draft a synthesis from your captures. Then edit it until it sounds like you.
          </p>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-3.5">
          <p className="serif" style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-soft)' }}>reading back through your day</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block rounded-full"
                style={{ width: 5, height: 5, background: 'var(--warm)' }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      )}

      {(state === 'drafted' || state === 'saved') && (
        <div>
          <p className="serif" style={{ fontSize: 'var(--fs-quote)', lineHeight: 1.6, color: 'var(--ink-strong)', letterSpacing: '-0.005em' }}>
            {draft}
          </p>
          <div className="flex items-center gap-2 mt-5">
            {state === 'drafted' && (
              <button
                onClick={() => { setEditValue(draft); setState('editing') }}
                className="rounded-full transition-all duration-200 hover:bg-white/[0.04]"
                style={{ padding: '6px 14px', fontSize: 'var(--fs-kicker)', letterSpacing: '0.06em', color: 'var(--ink-soft)', border: '1px solid var(--hair-strong)' }}
              >
                ✎ make it yours
              </button>
            )}
            {state === 'saved' && (
              <span className="kicker" style={{ color: 'var(--warm-soft)' }}>
                ✓ saved to tonight
              </span>
            )}
          </div>
        </div>
      )}

      {state === 'editing' && (
        <div>
          <textarea
            className="w-full bg-transparent resize-none outline-none serif"
            style={{
              fontSize: 'var(--fs-quote)',
              lineHeight: 1.6,
              color: 'var(--ink-strong)',
              minHeight: '140px',
              letterSpacing: '-0.005em',
              borderBottom: '1px dashed var(--hair-strong)',
              paddingBottom: '8px',
            }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => saveReview(editValue)}
              className="rounded-full transition-all duration-200 hover:scale-[1.02]"
              style={{ padding: '7px 18px', fontSize: 'var(--fs-kicker)', letterSpacing: '0.06em', color: 'var(--warm)', border: '1px solid rgba(244,199,123,0.35)', background: 'rgba(244,199,123,0.1)' }}
            >
              save
            </button>
            <button
              onClick={() => setState('drafted')}
              className="rounded-full transition-all duration-200"
              style={{ padding: '7px 14px', fontSize: 'var(--fs-kicker)', letterSpacing: '0.06em', color: 'var(--ink-mute)' }}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
