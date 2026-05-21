'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  BookOpen, Plus, Network, ShieldCheck, Search, X, 
  FileText, Home, ArrowRight, Sparkles 
} from 'lucide-react'

interface Page {
  slug: string
  title: string
  type: string
  summary?: string
}

const quickActions = [
  { label: 'Home',           href: '/',       icon: Home,        kbd: 'H' },
  { label: 'Browse Wiki',    href: '/wiki',   icon: BookOpen,    kbd: 'W' },
  { label: 'Add Source',     href: '/ingest', icon: Plus,        kbd: 'A' },
  { label: 'Search & Ask',   href: '/search', icon: Sparkles,    kbd: 'S' },
  { label: 'Knowledge Graph',href: '/graph',  icon: Network,     kbd: 'G' },
  { label: 'Diary',          href: '/diary',  icon: FileText,    kbd: 'D' },
  { label: 'Health Check',   href: '/audit',  icon: ShieldCheck, kbd: null },
]

export function CommandModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [allPages, setAllPages] = useState<Page[]>([])
  const [results, setResults] = useState<Page[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (open && allPages.length === 0) {
      fetch('/api/wiki?includeDiary=1')
        .then(r => r.json())
        .then((d: any) => setAllPages(Array.isArray(d) ? d : (d.pages ?? [])))
        .catch(() => {})
    }
    if (open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open, allPages.length])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }
    const q = query.toLowerCase()
    setResults(
      allPages
        .filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.summary ?? '').toLowerCase().includes(q)
        )
        .slice(0, 6)
    )
    setSelectedIndex(0)
  }, [query, allPages])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query ? results : quickActions
    const maxIndex = items.length - 1

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, maxIndex))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (query && results[selectedIndex]) {
        window.location.href = `/wiki/${results[selectedIndex].slug}`
        onClose()
      } else if (!query && quickActions[selectedIndex]) {
        window.location.href = quickActions[selectedIndex].href
        onClose()
      }
    }
  }, [query, results, selectedIndex, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div
          className="w-full rounded-xl overflow-hidden"
          style={{
            background: '#111113',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
          }}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
            <Search size={16} style={{ color: 'rgba(245, 245, 244, 0.3)', flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search memories or type a command..."
              className="flex-1 bg-transparent outline-none text-[14px]"
              style={{ color: '#f5f5f4' }}
            />
            <button 
              onClick={onClose} 
              className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150"
              aria-label="Close"
            >
              <X size={14} style={{ color: 'rgba(245, 245, 244, 0.3)' }} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto py-2">
            {query && results.length > 0 && (
              <div className="px-2">
                <p 
                  className="px-2 py-1.5 text-[10px] font-medium tracking-wider uppercase"
                  style={{ color: 'rgba(245, 245, 244, 0.3)' }}
                >
                  Memories
                </p>
                {results.map((page, index) => (
                  <Link
                    key={page.slug}
                    href={`/wiki/${page.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150"
                    style={{
                      background: selectedIndex === index ? 'rgba(255,255,255,0.05)' : 'transparent',
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <BookOpen size={14} style={{ color: 'rgba(245, 245, 244, 0.3)', flexShrink: 0 }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate" style={{ color: '#f5f5f4' }}>
                        {page.title}
                      </p>
                      {page.summary && (
                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(245, 245, 244, 0.4)' }}>
                          {page.summary}
                        </p>
                      )}
                    </div>
                    <ArrowRight size={12} style={{ color: 'rgba(245, 245, 244, 0.2)' }} />
                  </Link>
                ))}
              </div>
            )}

            {query && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px]" style={{ color: 'rgba(245, 245, 244, 0.4)' }}>
                  No memories found for &quot;{query}&quot;
                </p>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] transition-opacity duration-150 hover:opacity-80"
                  style={{ color: 'rgba(245, 245, 244, 0.6)' }}
                >
                  <Sparkles size={12} />
                  Ask AI instead
                </Link>
              </div>
            )}

            {!query && (
              <div className="px-2">
                <p 
                  className="px-2 py-1.5 text-[10px] font-medium tracking-wider uppercase"
                  style={{ color: 'rgba(245, 245, 244, 0.3)' }}
                >
                  Quick actions
                </p>
                {quickActions.map(({ label, href, icon: Icon, kbd }, index) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150"
                    style={{
                      background: selectedIndex === index ? 'rgba(255,255,255,0.05)' : 'transparent',
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon size={14} style={{ color: 'rgba(245, 245, 244, 0.3)', flexShrink: 0 }} />
                    <span className="text-[13px] flex-1" style={{ color: 'rgba(245, 245, 244, 0.7)' }}>
                      {label}
                    </span>
                    {kbd && (
                      <span 
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ 
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(245, 245, 244, 0.3)',
                        }}
                      >
                        {kbd}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 flex items-center gap-4 border-t border-[rgba(255,255,255,0.04)]">
            <span className="text-[10px]" style={{ color: 'rgba(245, 245, 244, 0.25)' }}>
              ESC to close
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(245, 245, 244, 0.25)' }}>
              Enter to select
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
