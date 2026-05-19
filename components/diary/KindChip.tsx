'use client'

export type EntryKind = 'thought' | 'link' | 'note' | 'decision' | 'question'

export const KIND_META: Record<EntryKind, { glyph: string; label: string; color: string; bg: string; border: string }> = {
  thought:  { glyph: '✎', label: 'Thought',  color: '#DEDBC8', bg: 'rgba(222,219,200,0.07)', border: 'rgba(222,219,200,0.22)' },
  link:     { glyph: '⌘', label: 'Link',     color: '#7BD0E8', bg: 'rgba(123,208,232,0.07)', border: 'rgba(123,208,232,0.22)' },
  note:     { glyph: '▤', label: 'Note',     color: '#9BDCAA', bg: 'rgba(155,220,170,0.07)', border: 'rgba(155,220,170,0.22)' },
  decision: { glyph: '✓', label: 'Decision', color: '#F4C77B', bg: 'rgba(244,199,123,0.07)', border: 'rgba(244,199,123,0.22)' },
  question: { glyph: '?', label: 'Question', color: '#C7B8FF', bg: 'rgba(199,184,255,0.07)', border: 'rgba(199,184,255,0.22)' },
}

interface KindChipProps {
  kind: EntryKind
  active?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

export function KindChip({ kind, active, onClick, size = 'md' }: KindChipProps) {
  const m = KIND_META[kind]
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex items-center gap-1.5 rounded-full transition-all duration-150"
      style={{
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        fontSize: size === 'sm' ? '10px' : '11px',
        letterSpacing: '0.04em',
        color: active ? m.color : 'rgba(222,219,200,0.42)',
        background: active ? m.bg : 'transparent',
        border: `1px solid ${active ? m.border : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <span style={{ fontSize: size === 'sm' ? '11px' : '12px', opacity: active ? 1 : 0.7 }}>{m.glyph}</span>
      <span>{m.label}</span>
    </button>
  )
}

export function KindBox({ kind }: { kind: EntryKind }) {
  const m = KIND_META[kind]
  return (
    <div
      className="flex items-center justify-center rounded-md flex-shrink-0"
      style={{
        width: 22,
        height: 22,
        fontSize: 'var(--fs-meta)',
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.border}`,
      }}
    >
      {m.glyph}
    </div>
  )
}
