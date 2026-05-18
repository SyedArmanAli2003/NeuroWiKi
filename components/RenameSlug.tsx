'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function RenameSlug({ slug, title }: { slug: string; title: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [slugValue, setSlugValue] = useState(slug)
  const [titleValue, setTitleValue] = useState(title)
  const [busy, setBusy] = useState(false)

  async function submit() {
    const normalizedSlug = slugValue.trim().toLowerCase()
    const normalizedTitle = titleValue.trim()
    if (!normalizedSlug) return

    const slugChanged  = normalizedSlug !== slug
    const titleChanged = normalizedTitle !== title

    if (!slugChanged && !titleChanged) {
      setOpen(false)
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/wiki/${slug}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSlug: normalizedSlug,
          newTitle: titleChanged ? normalizedTitle : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Rename failed')
        setBusy(false)
        return
      }
      toast.success(
        slugChanged && titleChanged ? `Renamed to "${normalizedTitle}" at /${data.newSlug}`
        : slugChanged ? `Slug → ${data.newSlug}`
        : `Title → "${normalizedTitle}"`
      )
      setOpen(false)
      if (slugChanged) router.push(`/wiki/${data.newSlug}`)
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
      className="flex flex-col gap-2 rounded-2xl"
      style={{
        padding: '12px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--hair-strong)',
        minWidth: '320px',
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="kicker">Title</span>
        <input
          autoFocus
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') { setOpen(false); setSlugValue(slug); setTitleValue(title) }
          }}
          disabled={busy}
          className="bg-transparent outline-none"
          style={{
            fontSize: 'var(--fs-body)',
            color: 'var(--ink-strong)',
            borderBottom: '1px dashed var(--hair-strong)',
            paddingBottom: '4px',
          }}
        />
      </label>

      <label className="flex items-center gap-2 mt-1">
        <span className="kicker" style={{ whiteSpace: 'nowrap' }}>/wiki/</span>
        <input
          value={slugValue}
          onChange={(e) => setSlugValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') { setOpen(false); setSlugValue(slug); setTitleValue(title) }
          }}
          disabled={busy}
          spellCheck={false}
          className="bg-transparent outline-none flex-1"
          style={{
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--ink)',
            borderBottom: '1px dashed var(--hair)',
            paddingBottom: '3px',
            letterSpacing: '-0.003em',
          }}
        />
      </label>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-full transition-all hover:scale-[1.02]"
          style={{
            padding: '5px 14px',
            fontSize: 'var(--fs-kicker)',
            letterSpacing: '0.06em',
            color: 'var(--warm)',
            background: 'rgba(244,199,123,0.1)',
            border: '1px solid rgba(244,199,123,0.3)',
          }}
        >
          {busy ? '…' : 'save'}
        </button>
        <button
          onClick={() => { setOpen(false); setSlugValue(slug); setTitleValue(title) }}
          disabled={busy}
          style={{ fontSize: 'var(--fs-kicker)', color: 'var(--ink-mute)', padding: '5px 10px' }}
        >
          cancel
        </button>
        <span className="kicker ml-auto" style={{ fontSize: 'var(--fs-micro)' }}>↵ save · esc cancel</span>
      </div>
    </div>
  )
}
