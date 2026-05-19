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
  { label: 'Ingest', href: '/ingest' },
  { label: 'Health', href: '/audit'  },
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
        className={isHome ? "absolute top-0 left-0 right-0 z-30 flex items-center justify-between" : "sticky top-0 z-30 flex items-center justify-between"}
        style={{
          height: '60px',
          padding: '0 32px',
          background: isHome ? 'transparent' : 'rgba(0,0,0,0.86)',
          backdropFilter: isHome ? 'none' : 'blur(12px)',
          WebkitBackdropFilter: isHome ? 'none' : 'blur(12px)',
          borderBottom: isHome ? 'none' : '1px solid rgba(222,219,200,0.08)',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          style={{ color: '#DEDBC8' }}
        >
          <span style={{ fontSize: '18px', opacity: 0.85 }}>◐</span>
          <span
            style={{
              fontSize: 'var(--fs-nav)',
              letterSpacing: '0.22em',
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            NeuroWiki
          </span>
        </Link>

        {/* Nav */}
        <nav
          className="hidden md:flex items-center"
          style={{ gap: '28px' }}
        >
          {navItems.map(({ label, href }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="transition-colors duration-150 hover:opacity-100"
                style={{
                  fontSize: 'var(--fs-nav)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: active ? '#DEDBC8' : 'rgba(222,219,200,0.45)',
                  position: 'relative',
                  paddingBottom: '5px',
                }}
              >
                {label}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: '1px',
                      background: '#DEDBC8',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ⌘K */}
        <button
          onClick={() => setCmdOpen(true)}
          className="flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-white/[0.04]"
          style={{
            padding: '7px 14px',
            border: '1px solid rgba(222,219,200,0.12)',
            color: 'rgba(222,219,200,0.55)',
          }}
          aria-label="Open command palette"
        >
          <Search size={13} />
          <span style={{ fontSize: 'var(--fs-kicker)', letterSpacing: '0.04em' }}>Search</span>
          <span
            className="hidden sm:flex items-center gap-0.5"
            style={{ fontSize: 'var(--fs-micro)', color: 'rgba(222,219,200,0.35)', marginLeft: '4px' }}
          >
            <Command size={10} />K
          </span>
        </button>
      </header>

      <CommandModal open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}
