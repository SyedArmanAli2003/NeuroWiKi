'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Search, Command } from 'lucide-react'
import { CommandModal } from '@/components/CommandModal'

const navItems = [
  { label: 'Diary',  href: '/diary'  },
  { label: 'Wiki',   href: '/wiki'   },
  { label: 'Search', href: '/search' },
  { label: 'Graph',  href: '/graph'  },
]

export function Topbar() {
  const pathname = usePathname()
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const isHome = pathname === '/'

  return (
    <>
      <header
        className={`${isHome ? 'absolute' : 'sticky'} top-0 left-0 right-0 z-30 flex items-center justify-between`}
        style={{
          height: 56,
          padding: '0 24px',
          background: isHome ? 'transparent' : 'rgba(9, 9, 11, 0.85)',
          backdropFilter: isHome ? 'none' : 'blur(16px)',
          WebkitBackdropFilter: isHome ? 'none' : 'blur(16px)',
          borderBottom: isHome ? 'none' : '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span 
            className="text-lg font-medium"
            style={{ color: '#f5f5f4' }}
          >
            N
          </span>
          <span
            className="hidden sm:inline text-xs font-medium tracking-widest uppercase"
            style={{ color: 'rgba(245, 245, 244, 0.5)' }}
          >
            NeuroWiki
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ label, href }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 hover:bg-[rgba(255,255,255,0.04)]"
                style={{
                  color: active ? '#f5f5f4' : 'rgba(245, 245, 244, 0.45)',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Search trigger */}
        <button
          onClick={() => setCmdOpen(true)}
          className="flex items-center gap-2 rounded-full transition-all duration-150 hover:bg-[rgba(255,255,255,0.04)]"
          style={{
            padding: '6px 12px',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(245, 245, 244, 0.5)',
          }}
          aria-label="Open command palette"
        >
          <Search size={14} />
          <span className="text-[13px] hidden sm:inline">Search</span>
          <span
            className="hidden sm:flex items-center gap-0.5 ml-1"
            style={{ 
              fontSize: 11, 
              color: 'rgba(245, 245, 244, 0.3)',
            }}
          >
            <Command size={10} />K
          </span>
        </button>
      </header>

      <CommandModal open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}
