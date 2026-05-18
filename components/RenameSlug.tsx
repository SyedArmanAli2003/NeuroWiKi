'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function RenameSlug({ slug }: { slug: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(slug)
  const [busy, setBusy] = useState(false)

  async function submit() {
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized === slug) { setOpen(false); return }
    setBusy(true)
    try {
      const res = await fetch(`/api/wiki/${slug}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSlug: normalized }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Rename failed')
        setBusy(false)
        return
      }
      toast.success(`Renamed to ${data.newSlug}`)
      setOpen(false)
      router.push(`/wiki/${data.newSlug}`)
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Rename failed')
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full transition-all duration-200 hover:bg-white/[0.04]"
        style={{
          padding: '6px 14px',
          fontSize: 'var(--fs-kicker)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-mute)',
          border: '1px solid var(--hair)',
        }}
      >
        ⇄ Rename
      </button>
    )
  }

  return (
    <div
      className="flex items-center gap-1.5 rounded-full"
      style={{
        padding: '3px 4px 3px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--hair-strong)',
      }}
    >
      <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>/wiki/</span>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') { setOpen(false); setValue(slug) }
        }}
        disabled={busy}
        spellCheck={false}
        className="bg-transparent outline-none"
        style={{
          fontSize: 'var(--fs-body-sm)',
          color: 'var(--ink-strong)',
          width: `${Math.max(value.length, 8)}ch`,
          letterSpacing: '-0.003em',
        }}
      />
      <button
        onClick={submit}
        disabled={busy}
        className="rounded-full transition-all hover:scale-[1.03]"
        style={{
          padding: '4px 10px',
          fontSize: 'var(--fs-micro)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--warm)',
          background: 'rgba(244,199,123,0.1)',
          border: '1px solid rgba(244,199,123,0.3)',
        }}
      >
        {busy ? '…' : 'save'}
      </button>
      <button
        onClick={() => { setOpen(false); setValue(slug) }}
        disabled={busy}
        style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-mute)', padding: '4px 8px' }}
      >
        ✕
      </button>
    </div>
  )
}
