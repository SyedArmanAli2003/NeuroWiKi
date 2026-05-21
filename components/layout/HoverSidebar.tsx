'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Home, BookOpen, Plus, Search,
  Network, ShieldCheck, FileText, X,
  ChevronRight, Settings, Info
} from 'lucide-react'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Home',        href: '/',        icon: Home       },
  { label: 'Wiki',        href: '/wiki',    icon: BookOpen   },
  { label: 'Add Source',  href: '/ingest',  icon: Plus       },
  { label: 'Search',      href: '/search',  icon: Search     },
  { label: 'Graph',       href: '/graph',   icon: Network    },
  { label: 'Diary',       href: '/diary',   icon: FileText   },
  { label: 'Health',      href: '/audit',   icon: ShieldCheck },
]

const SECONDARY_ITEMS = [
  { label: 'Sources',  href: '/sources', icon: Settings },
  { label: 'Docs',     href: '/docs',    icon: Info },
]

export function HoverSidebar() {
  const pathname = usePathname()
  const [panelOpen, setPanelOpen] = useState(false)
  const [sliverHover, setSliverHover] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openPanel = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setPanelOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setPanelOpen(false)
    }, 200)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setPanelOpen(prev => !prev)
      }
      if (e.key === 'Escape' && panelOpen) {
        setPanelOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [panelOpen])

  return (
    <>
      {/* Sliver indicator */}
      {!panelOpen && (
        <div
          className="fixed left-0 top-0 h-full z-50 flex items-center"
          style={{ width: 16 }}
          onMouseEnter={() => { setSliverHover(true); openPanel() }}
          onMouseLeave={() => setSliverHover(false)}
        >
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-150"
            style={{
              width: sliverHover ? 12 : 4,
              height: 48,
              background: sliverHover 
                ? 'rgba(245, 245, 244, 0.15)' 
                : 'rgba(245, 245, 244, 0.08)',
              borderRadius: '0 4px 4px 0',
            }}
          >
            {sliverHover && (
              <ChevronRight
                size={12}
                style={{ color: 'rgba(245, 245, 244, 0.5)' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-150"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        data-sidebar-panel
        className="fixed left-0 top-0 h-full w-60 z-50 flex flex-col transition-transform duration-200 ease-out"
        style={{
          background: '#0c0c0e',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transform: panelOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        onMouseEnter={cancelClose}
        onMouseLeave={closePanel}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.04)]">
          <Link 
            href="/" 
            onClick={() => setPanelOpen(false)}
            className="flex items-center gap-2"
          >
            <span className="text-lg" style={{ color: '#f5f5f4' }}>N</span>
            <span 
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: 'rgba(245, 245, 244, 0.5)' }}
            >
              NeuroWiki
            </span>
          </Link>
          <button
            onClick={() => setPanelOpen(false)}
            className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150"
            style={{ color: 'rgba(245, 245, 244, 0.4)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Primary navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || 
                (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setPanelOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150"
                  style={{
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: active ? '#f5f5f4' : 'rgba(245, 245, 244, 0.5)',
                  }}
                >
                  <Icon size={16} style={{ opacity: active ? 1 : 0.6 }} />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="my-4 mx-3 border-t border-[rgba(255,255,255,0.04)]" />

          <div className="space-y-0.5">
            {SECONDARY_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setPanelOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150"
                  style={{
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: active ? '#f5f5f4' : 'rgba(245, 245, 244, 0.4)',
                  }}
                >
                  <Icon size={16} style={{ opacity: active ? 1 : 0.5 }} />
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2">
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(245, 245, 244, 0.35)',
              }}
            >
              [
            </span>
            <span className="text-[11px]" style={{ color: 'rgba(245, 245, 244, 0.25)' }}>
              to toggle
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
