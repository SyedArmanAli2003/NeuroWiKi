'use client'

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

interface DayHeaderProps {
  streak: number
  mood: string | null
}

export function DayHeader({ streak, mood }: DayHeaderProps) {
  const now = new Date()
  const dayOfYear = getDayOfYear(now)

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pt-16 pb-5 hairline"
    >
      <div>
        <h1
          style={{
            fontSize: 'var(--fs-h1)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontWeight: 400,
            color: 'var(--ink-strong)',
          }}
        >
          {dateStr}
        </h1>
        <p
          className="flex flex-wrap items-center mt-3"
          style={{ gap: '10px', fontSize: 'var(--fs-kicker)', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}
        >
          <span>Day {dayOfYear} of 365</span>
          <span style={{ color: 'var(--ink-faint)' }}>·</span>
          {streak > 0 ? (
            <em style={{ fontSize: 'var(--fs-body-sm)', letterSpacing: '0.005em', textTransform: 'none', color: 'var(--warm-soft)' }}>
              {streak}-day streak
            </em>
          ) : (
            <em style={{ fontSize: 'var(--fs-body-sm)', letterSpacing: '0.005em', textTransform: 'none', color: 'var(--ink-soft)' }}>
              begin a streak today
            </em>
          )}
        </p>
      </div>

      <div className="flex flex-col items-start sm:items-end" style={{ maxWidth: '320px', gap: '4px' }}>
        <span className="kicker">today you feel</span>
        <span className="serif" style={{ fontSize: 'var(--fs-body-lg)', lineHeight: 1.3, color: mood ? 'var(--ink)' : 'var(--ink-faint)' }}>
          {mood ?? 'something to name…'}
        </span>
      </div>
    </header>
  )
}
