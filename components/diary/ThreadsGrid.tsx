'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SectionHeader } from './SectionHeader'

interface Thread {
  id: string
  question: string
  note: string
  pages: number
  lastTouched: string
  heat: number
  sources: string[]
}

export function ThreadsGrid() {
  const [threads, setThreads] = useState<Thread[]>([])

  useEffect(() => {
    fetch('/api/diary/threads')
      .then((r) => r.json())
      .then((d) => setThreads(d.threads ?? []))
      .catch(() => {})
  }, [])

  if (!threads.length) return null

  return (
    <section style={{ marginTop: '56px' }}>
      <SectionHeader
        kicker="Threads"
        title={<>Open <em>thought chains</em></>}
        meta={`${threads.length} active`}
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {threads.map((t) => (
          <Link
            key={t.id}
            href={`/wiki/${t.id}`}
            className="rounded-2xl flex flex-col transition-all duration-200"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              minHeight: '172px',
              padding: '16px 16px 14px',
              gap: '10px',
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
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: '2px', background: 'rgba(244,199,123,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(t.heat * 100)}%`, background: 'var(--warm)' }}
                />
              </div>
              <span className="font-mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>{t.lastTouched}</span>
            </div>

            <p className="serif flex-1" style={{ fontSize: 'var(--fs-body-lg)', lineHeight: 1.3, color: 'var(--ink-strong)', letterSpacing: '-0.005em' }}>
              {t.question}
            </p>

            {t.note && (
              <p
                style={{
                  fontSize: 'var(--fs-meta)',
                  lineHeight: 1.55,
                  color: 'var(--ink-soft)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {t.note}
              </p>
            )}

            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: '1px solid var(--hair)', marginTop: 'auto' }}
            >
              <span className="kicker">{t.pages} pages</span>
              <div className="flex gap-1">
                {t.sources.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '2px 7px',
                      fontSize: 'var(--fs-micro)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-mute)',
                      border: '1px solid var(--hair-strong)',
                      borderRadius: '4px',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
