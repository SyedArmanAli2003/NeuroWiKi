'use client'
import { useEffect, useState } from 'react'
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

export function DiarySpine() {
  const [days, setDays] = useState<PastDay[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/diary/past?limit=21')
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? []))
      .catch(() => {})
  }, [])

  if (!days.length) return null

  const visible = showAll ? days : days.slice(0, 7)

  return (
    <section style={{ marginTop: '56px' }}>
      <SectionHeader
        kicker="Diary"
        title={<><em>Past days</em>, written through</>}
      />

      <div style={{ borderTop: '1px solid var(--hair)' }}>
        {visible.map((day) => (
          <div
            key={day.date}
            className="grid items-baseline"
            style={{
              gridTemplateColumns: '160px 1fr auto',
              gap: '24px',
              padding: '18px 0',
              borderBottom: '1px solid var(--hair)',
              opacity: day.quiet ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span className="serif" style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--ink-strong)', letterSpacing: '-0.005em' }}>{day.weekday}</span>
              <span className="font-mono" style={{ fontSize: 'var(--fs-kicker)', color: 'var(--ink-mute)', letterSpacing: '0.02em' }}>{day.date}</span>
            </div>

            <p style={{ fontSize: 'var(--fs-body)', lineHeight: 1.5, color: day.quiet ? 'var(--ink-mute)' : 'var(--ink-strong)', letterSpacing: '-0.003em' }}>
              {day.quiet
                ? <em style={{ color: 'var(--ink-soft)' }}>(quiet day)</em>
                : (day.headline ?? <em style={{ color: 'var(--ink-soft)' }}>no intention set</em>)
              }
            </p>

            <p style={{ fontSize: 'var(--fs-kicker)', letterSpacing: '0.06em', color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>
              {day.quiet
                ? <em className="serif" style={{ letterSpacing: 0 }}>a quiet day</em>
                : <>
                    {day.captures} captures
                    {day.decisions > 0 && <> · {day.decisions} decision{day.decisions > 1 ? 's' : ''}</>}
                    {day.mood && <> · <em className="serif" style={{ letterSpacing: 0 }}>{day.mood}</em></>}
                  </>
              }
            </p>
          </div>
        ))}
      </div>

      {days.length > 7 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="more-pill"
          >
            {showAll ? 'show fewer weeks' : 'show earlier weeks'}
          </button>
        </div>
      )}
    </section>
  )
}
