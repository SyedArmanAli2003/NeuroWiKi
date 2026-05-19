'use client'

interface DayHeaderProps {
  streak?: number
  mood?: string | null
}

export function DayHeader({}: DayHeaderProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="pt-16 pb-6 hairline">
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
    </header>
  )
}
