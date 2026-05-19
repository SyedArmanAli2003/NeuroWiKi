'use client'
import { ReactNode } from 'react'

interface SectionHeaderProps {
  kicker: string
  title: ReactNode
  meta?: ReactNode
}

export function SectionHeader({ kicker, title, meta }: SectionHeaderProps) {
  return (
    <div
      className="grid items-baseline gap-4 mb-6"
      style={{ gridTemplateColumns: 'auto 1fr auto' }}
    >
      <span className="kicker kicker-rule">{kicker}</span>
      <h2 className="sec-title">{title}</h2>
      {meta ? <span className="sec-meta">{meta}</span> : <span />}
    </div>
  )
}
