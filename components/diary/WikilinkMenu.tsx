'use client'
import { motion, AnimatePresence } from 'framer-motion'

export interface WikiPage { slug: string; title: string; type: string }

interface Props {
  open: boolean
  pages: WikiPage[]
  activeIdx: number
  onPick: (p: WikiPage) => void
  onHover: (idx: number) => void
}

export function WikilinkMenu({ open, pages, activeIdx, onPick, onHover }: Props) {
  const pagesGroup = pages.filter(p => p.type !== 'diary')
  const capturesGroup = pages.filter(p => p.type === 'diary')
  const capturesStart = pagesGroup.length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
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
          {pages.length === 0 && (
            <div style={{ padding: '14px', fontSize: 'var(--fs-body-sm)', color: 'var(--ink-mute)' }}>
              No wiki pages yet. Add one via /ingest.
            </div>
          )}

          {pagesGroup.length > 0 && (
            <>
              <div className="kicker" style={{ padding: '10px 14px 6px' }}>Pages · {pagesGroup.length}</div>
              {pagesGroup.map((p, idx) => {
                const globalIdx = idx
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); onPick(p) }}
                    onMouseEnter={() => onHover(globalIdx)}
                    className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 transition-colors duration-75"
                    style={{ background: globalIdx === activeIdx ? 'rgba(222,219,200,0.05)' : 'transparent' }}
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
              <div
                className="kicker"
                style={{
                  padding: '10px 14px 6px',
                  borderTop: pagesGroup.length > 0 ? '1px solid var(--hair)' : 'none',
                  color: 'var(--warm-soft)',
                }}
              >
                ✦ Past captures · {capturesGroup.length}
              </div>
              {capturesGroup.map((p, idx) => {
                const globalIdx = capturesStart + idx
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); onPick(p) }}
                    onMouseEnter={() => onHover(globalIdx)}
                    className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 transition-colors duration-75"
                    style={{ background: globalIdx === activeIdx ? 'rgba(244,199,123,0.06)' : 'transparent' }}
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

          <div
            style={{
              padding: '8px 14px',
              fontSize: 'var(--fs-micro)',
              letterSpacing: '0.1em',
              color: 'var(--ink-faint)',
              borderTop: '1px solid var(--hair)',
            }}
          >
            ↑↓ navigate · ↵ select · esc close
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
