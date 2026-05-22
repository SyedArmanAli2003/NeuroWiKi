'use client'
import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { RenameSlug } from './RenameSlug'
import { CopyLink } from './CopyLink'

export function WikiActionsMenu({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        className="flex items-center justify-center rounded-full transition-all duration-200 hover:bg-white/[0.04]"
        style={{
          width: 34,
          height: 34,
          color: 'var(--ink-mute)',
          border: '1px solid var(--hair)',
        }}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 flex flex-col gap-2 rounded-xl z-50"
          style={{
            padding: '10px',
            minWidth: 240,
            background: 'var(--surface)',
            border: '1px solid var(--hair-strong)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <RenameSlug slug={slug} title={title} />
          </div>
          <div className="pt-2" style={{ borderTop: '1px solid var(--hair)' }}>
            <CopyLink slug={slug} />
          </div>
        </div>
      )}
    </div>
  )
}
