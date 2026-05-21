'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Sparkles, Clock, Copy, Check, 
  ArrowRight, Loader2, BookmarkPlus, Send
} from 'lucide-react'
import { toast } from 'sonner'
import { TypeBadge } from '@/components/TypeBadge'

interface Page {
  slug: string
  title: string
  summary: string
  type: string
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark 
        key={i} 
        style={{ 
          background: 'rgba(212, 165, 116, 0.2)', 
          color: '#f5f5f4', 
          borderRadius: 2,
          padding: '0 2px',
        }}
      >
        {part}
      </mark>
    ) : part
  )
}

const MAX_HISTORY = 5

export default function SearchPage() {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'search' | 'ask'>('ask')
  const [query, setQuery] = useState('')
  const [allPages, setAllPages] = useState<Page[]>([])
  const [filtered, setFiltered] = useState<Page[]>([])
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [savingToWiki, setSavingToWiki] = useState(false)
  const [savedSlug, setSavedSlug] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    fetch('/api/wiki').then(r => r.json()).then(data => setAllPages(data.pages || [])).catch(() => {})
    try {
      const saved = localStorage.getItem('nw-query-history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (mode !== 'search' || !query.trim()) { setFiltered([]); return }
    const q = query.toLowerCase()
    setFiltered(
      allPages
        .filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.summary || '').toLowerCase().includes(q)
        )
        .slice(0, 6)
    )
  }, [query, allPages, mode])

  const saveToHistory = (q: string) => {
    const next = [q, ...history.filter(h => h !== q)].slice(0, MAX_HISTORY)
    setHistory(next)
    localStorage.setItem('nw-query-history', JSON.stringify(next))
  }

  const handleAsk = async (q = query) => {
    if (!q.trim()) return
    setQuery(q)
    setLoading(true)
    setAnswer('')
    setSavedSlug(null)
    saveToHistory(q)

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) setAnswer(prev => prev + chunk)
      }
    } catch (err) {
      toast.error('Failed to get answer. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToWiki = async () => {
    if (!answer || !query || savingToWiki) return
    setSavingToWiki(true)
    try {
      const res = await fetch('/api/wiki/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, answer })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSavedSlug(data.slug)
      toast.success('Saved to your Wiki!')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSavingToWiki(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mode === 'ask' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4">
        <div className="w-6 h-6 border-2 border-[rgba(245,245,244,0.2)] border-t-[#f5f5f4] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 
            className="text-3xl sm:text-4xl font-medium tracking-tight mb-3"
            style={{ color: '#f5f5f4' }}
          >
            Ask your memory
          </h1>
          <p className="text-sm" style={{ color: 'rgba(245, 245, 244, 0.5)' }}>
            Search your knowledge or ask AI to synthesize an answer
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center mb-6"
        >
          <div 
            className="inline-flex p-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {(['ask', 'search'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setAnswer(''); setFiltered([]) }}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-150"
                style={{
                  background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: mode === m ? '#f5f5f4' : 'rgba(245, 245, 244, 0.4)',
                }}
              >
                {m === 'ask' ? <Sparkles size={14} /> : <Search size={14} />}
                {m === 'ask' ? 'Ask AI' : 'Search'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div
            className="flex items-center gap-3 rounded-xl transition-all duration-150"
            style={{
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {mode === 'ask' ? (
              <Sparkles size={18} style={{ color: 'rgba(212, 165, 116, 0.6)', flexShrink: 0 }} />
            ) : (
              <Search size={18} style={{ color: 'rgba(245, 245, 244, 0.3)', flexShrink: 0 }} />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'ask' ? 'What would you like to know?' : 'Search your memories...'}
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ color: '#f5f5f4' }}
              autoFocus
            />
            {mode === 'ask' && (
              <button
                onClick={() => handleAsk()}
                disabled={loading || !query.trim()}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-30"
                style={{ 
                  background: query.trim() ? '#f5f5f4' : 'rgba(255,255,255,0.05)',
                }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: '#09090b' }} />
                ) : (
                  <Send size={14} style={{ color: query.trim() ? '#09090b' : 'rgba(245,245,244,0.3)' }} />
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Search results */}
        <AnimatePresence mode="wait">
          {mode === 'search' && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 space-y-2"
            >
              {filtered.map((page, i) => (
                <motion.div
                  key={page.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={`/wiki/${page.slug}`}>
                    <div
                      className="surface-card p-4 group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TypeBadge type={page.type} />
                      </div>
                      <h3 
                        className="text-[14px] font-medium mb-1 group-hover:text-[#f5f5f4] transition-colors"
                        style={{ color: 'rgba(245, 245, 244, 0.9)' }}
                      >
                        {highlightText(page.title, query)}
                      </h3>
                      <p 
                        className="text-[12px] leading-relaxed line-clamp-2"
                        style={{ color: 'rgba(245, 245, 244, 0.4)' }}
                      >
                        {highlightText(page.summary || '', query)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No search results */}
        {mode === 'search' && query && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-[13px]" style={{ color: 'rgba(245, 245, 244, 0.4)' }}>
              No memories found. Try asking AI instead.
            </p>
          </motion.div>
        )}

        {/* Query history */}
        {mode === 'ask' && !query && !answer && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8"
          >
            <p 
              className="text-[11px] font-medium tracking-wider uppercase mb-3"
              style={{ color: 'rgba(245, 245, 244, 0.3)' }}
            >
              Recent questions
            </p>
            <div className="space-y-1">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(h)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <Clock size={14} style={{ color: 'rgba(245, 245, 244, 0.2)', flexShrink: 0 }} />
                  <span 
                    className="text-[13px] truncate"
                    style={{ color: 'rgba(245, 245, 244, 0.5)' }}
                  >
                    {h}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Answer */}
        <AnimatePresence mode="wait">
          {mode === 'ask' && (answer || loading) && (
            <motion.div
              ref={answerRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6"
            >
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: '#d4a574' }} />
                    <span 
                      className="text-[11px] font-medium tracking-wider uppercase"
                      style={{ color: 'rgba(245, 245, 244, 0.4)' }}
                    >
                      Answer
                    </span>
                  </div>
                  {answer && !loading && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-[11px] transition-opacity hover:opacity-80"
                      style={{ color: 'rgba(245, 245, 244, 0.4)' }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>

                {/* Loading state */}
                {loading && !answer && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#d4a574]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[12px]" style={{ color: 'rgba(245, 245, 244, 0.4)' }}>
                      Thinking...
                    </span>
                  </div>
                )}

                {/* Answer content */}
                {answer && (
                  <p
                    className="text-[14px] leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'rgba(245, 245, 244, 0.8)' }}
                  >
                    {answer}
                  </p>
                )}
              </div>

              {/* Save to Wiki */}
              {!loading && answer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4"
                >
                  <div 
                    className="rounded-xl p-4 flex items-center justify-between"
                    style={{ 
                      background: 'rgba(212, 165, 116, 0.05)',
                      border: '1px solid rgba(212, 165, 116, 0.15)',
                    }}
                  >
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: '#f5f5f4' }}>
                        Save to Wiki
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(245, 245, 244, 0.5)' }}>
                        Turn this into a permanent memory
                      </p>
                    </div>
                    {savedSlug ? (
                      <Link
                        href={`/wiki/${savedSlug}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
                        style={{ 
                          background: 'rgba(212, 165, 116, 0.15)',
                          color: '#d4a574',
                        }}
                      >
                        View <ArrowRight size={12} />
                      </Link>
                    ) : (
                      <button
                        onClick={handleSaveToWiki}
                        disabled={savingToWiki}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all disabled:opacity-50"
                        style={{ 
                          background: '#f5f5f4',
                          color: '#09090b',
                        }}
                      >
                        {savingToWiki ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <BookmarkPlus size={14} />
                            Save
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* New question */}
              {answer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 text-center"
                >
                  <button
                    onClick={() => { setAnswer(''); setQuery(''); inputRef.current?.focus() }}
                    className="text-[12px] transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(245, 245, 244, 0.4)' }}
                  >
                    Ask another question
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
