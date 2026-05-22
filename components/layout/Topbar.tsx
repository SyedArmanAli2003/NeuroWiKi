'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Search, Command, LogOut, User } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { CommandModal } from '@/components/CommandModal'

const navItems = [
  { label: 'Diary',  href: '/diary'  },
  { label: 'Wiki',   href: '/wiki'   },
  { label: 'Search', href: '/search' },
  { label: 'Graph',  href: '/graph'  },
]

export function Topbar() {
  const pathname            = usePathname()
  const router              = useRouter()
  const { data: session, status } = useSession()
  const [cmdOpen, setCmdOpen]   = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const dropdownRef             = useRef<HTMLDivElement>(null)

  // Keyboard shortcut
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Don't show topbar on auth pages
  if (pathname?.startsWith('/auth')) return null

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
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <span className="text-lg font-medium" style={{ color: '#f5f5f4' }}>N</span>
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
                style={{ color: active ? '#f5f5f4' : 'rgba(245, 245, 244, 0.45)' }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side: search + auth pill */}
        <div className="flex items-center gap-2">
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
              style={{ fontSize: 11, color: 'rgba(245, 245, 244, 0.3)' }}
            >
              <Command size={10} />K
            </span>
          </button>

          {/* ── Auth pill ────────────────────────────────── */}
          {status === 'loading' ? (
            /* skeleton pill while session loads */
            <div
              className="h-8 w-20 rounded-full animate-pulse"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          ) : status === 'authenticated' ? (
            /* Signed-in: avatar + dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full transition-all duration-150 hover:bg-[rgba(255,255,255,0.06)]"
                style={{
                  padding: '5px 10px 5px 6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f5f5f4',
                }}
                aria-label="User menu"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                  style={{ background: 'rgba(212,165,116,0.18)', color: '#d4a574' }}
                >
                  {session.user?.name?.[0]?.toUpperCase() ?? <User size={12} />}
                </span>
                <span className="text-[13px] hidden sm:inline" style={{ color: 'rgba(245,245,244,0.7)' }}>
                  {session.user?.name ?? session.user?.email}
                </span>
              </button>

              {/* Dropdown */}
              {userOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50"
                  style={{
                    background: '#111113',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="px-3 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
                    <p className="text-xs font-medium" style={{ color: '#f5f5f4' }}>
                      {session.user?.name}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(245,245,244,0.4)' }}>
                      {session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUserOpen(false)
                      signOut({ callbackUrl: '/auth/signin' })
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                    style={{ color: 'rgba(245,245,244,0.6)' }}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Signed-out: Sign In pill */
            <Link
              href="/auth/signin"
              className="flex items-center gap-1.5 rounded-full text-[13px] font-medium transition-all duration-150 hover:opacity-85"
              style={{
                padding: '6px 14px',
                background: 'rgba(212,165,116,0.12)',
                border: '1px solid rgba(212,165,116,0.25)',
                color: '#d4a574',
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <CommandModal open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}
