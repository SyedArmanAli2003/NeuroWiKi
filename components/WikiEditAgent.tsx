'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  slug: string
  title: string
  type: string
  currentContent: string
}

interface Proposal {
  content: string
  summary: string
  title: string
}

export function WikiEditAgent({ slug, title, type }: Props) {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [committed, setCommitted] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!instruction.trim() || loading) return
    setLoading(true)
    setProposal(null)
    setCommitted(false)
    setError(null)

    try {
      const res = await fetch(`/api/wiki/${slug}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setProposal(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!proposal) return
    setCommitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/wiki/${slug}/edit/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: proposal.content,
          summary: proposal.summary,
          title: proposal.title || title,
          type,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Commit failed')
      }
      setCommitted(true)
      setInstruction('')
      setTimeout(() => window.location.reload(), 800)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCommitting(false)
    }
  }

  function handleDiscard() {
    setProposal(null)
    setInstruction('')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 transition"
        style={{ color: 'rgba(222,219,200,0.4)' }}
      >
        <Sparkles size={10} />
        Edit with AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div
            className="relative w-full max-w-md bg-[#0D0D0D] border-l border-white/8 flex flex-col"
            style={{ height: '100dvh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: 'rgba(222,219,200,0.5)' }} />
                <span className="text-[11px] tracking-wider uppercase" style={{ color: 'rgba(222,219,200,0.5)' }}>
                  AI Edit — {title}
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="opacity-40 hover:opacity-100 transition">
                <X size={14} style={{ color: '#DEDBC8' }} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Instruction form */}
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    placeholder="Describe your edit... (e.g. Add a section on why it matters)"
                    rows={3}
                    disabled={loading || committing}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any)
                    }}
                    className="w-full bg-[#181818] border border-white/8 rounded-xl px-4 py-3 text-[12px] resize-none outline-none"
                    style={{ color: '#DEDBC8' }}
                  />
                  <button
                    type="submit"
                    disabled={!instruction.trim() || loading || committing}
                    className="absolute bottom-3 right-3 opacity-50 hover:opacity-100 disabled:opacity-20 transition"
                  >
                    <Send size={13} style={{ color: '#DEDBC8' }} />
                  </button>
                </div>
                <p className="text-[9px] mt-1.5" style={{ color: 'rgba(222,219,200,0.2)' }}>
                  ⌘↵ to submit
                </p>
              </form>

              {/* Loading */}
              {loading && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full animate-bounce"
                        style={{ backgroundColor: 'rgba(222,219,200,0.4)', animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px]" style={{ color: 'rgba(222,219,200,0.3)' }}>
                    Agent editing...
                  </span>
                </div>
              )}

              {/* Proposal */}
              {proposal && !committed && (
                <div className="space-y-3">
                  {proposal.summary && (
                    <div className="bg-[#181818] rounded-xl p-3">
                      <p className="text-[9px] tracking-wider uppercase mb-1.5" style={{ color: 'rgba(222,219,200,0.3)' }}>
                        New Summary
                      </p>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(222,219,200,0.7)' }}>
                        {proposal.summary}
                      </p>
                    </div>
                  )}

                  <div className="bg-[#181818] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDiff(!showDiff)}
                      className="w-full flex items-center justify-between px-3 py-2.5"
                    >
                      <span className="text-[9px] tracking-wider uppercase" style={{ color: 'rgba(222,219,200,0.3)' }}>
                        Proposed Content
                      </span>
                      {showDiff
                        ? <ChevronUp size={11} style={{ color: 'rgba(222,219,200,0.3)' }} />
                        : <ChevronDown size={11} style={{ color: 'rgba(222,219,200,0.3)' }} />
                      }
                    </button>
                    {showDiff && (
                      <div className="px-3 pb-3 max-h-72 overflow-y-auto">
                        <pre
                          className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono"
                          style={{ color: 'rgba(222,219,200,0.55)' }}
                        >
                          {proposal.content}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={committing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] tracking-wider uppercase border border-white/15 hover:bg-white/5 disabled:opacity-40 transition"
                      style={{ color: '#DEDBC8' }}
                    >
                      <Check size={11} />
                      {committing ? 'Saving...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscard}
                      disabled={committing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] tracking-wider uppercase border border-white/8 hover:bg-white/5 disabled:opacity-40 transition"
                      style={{ color: 'rgba(222,219,200,0.4)' }}
                    >
                      <RotateCcw size={11} />
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {committed && (
                <div className="flex items-center gap-2 py-2">
                  <Check size={13} style={{ color: '#86efac' }} />
                  <span className="text-[11px]" style={{ color: '#86efac' }}>
                    Saved. Reloading...
                  </span>
                </div>
              )}

              {error && (
                <div className="text-[10px] rounded-xl px-3 py-2 bg-red-950/30 border border-red-900/30" style={{ color: '#fca5a5' }}>
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[9px]" style={{ color: 'rgba(222,219,200,0.2)' }}>
                Accept re-ingests into HydraDB and refreshes wikilinks.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
