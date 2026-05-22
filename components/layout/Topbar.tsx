'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Search, Command, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { CommandModal } from '@/components/CommandModal'

const navItems = [
  { label: 'Diary',  href: '/diary'  },
  { label: 'Wiki',   href: '/wiki'   },
  { label: 'Search', href: '/search' },
  { label: 'Graph',  href: '/graph'  },
]

export function Topbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [cmdOpen,  setCmdOpen]  = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ⌘K shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Hide on auth pages entirely
  if (pathname?.startsWith('/auth')) return null

  const isHome = pathname === '/'

  return (
    <>
      <header
        style={{
          position: isHome ? 'absolute' : 'sticky',
          top: 0, left: 0, right: 0,
          zIndex: 30,
          height: 52,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '0 20px',
          background: isHome ? 'transparent' : 'rgba(9,9,11,0.88)',
          backdropFilter: isHome ? 'none' : 'blur(16px)',
          WebkitBackdropFilter: isHome ? 'none' : 'blur(16px)',
          borderBottom: isHome ? 'none' : '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* ── Left: Brand ───────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 1, transition: 'opacity .15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <span style={{ fontSize: 17, fontWeight: 500, color: '#f5f5f4' }}>N</span>
            <span
              style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(245,245,244,0.45)',
              }}
              className="hidden sm:inline"
            >
              NeuroWiki
            </span>
          </Link>
        </div>

        {/* ── Center: Nav ───────────────────────────────── */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hidden md:flex">
          {navItems.map(({ label, href }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: active ? '#f5f5f4' : 'rgba(245,245,244,0.42)',
                  transition: 'all .15s',
                  textDecoration: 'none',
                  background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* ── Right: Search + Auth ──────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>

          {/* Search pill */}
          <button
            onClick={() => setCmdOpen(true)}
            aria-label="Open search"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(245,245,244,0.45)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Search size={13} />
            <span className="hidden sm:inline">Search</span>
            <span
              className="hidden sm:flex"
              style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'rgba(245,245,244,0.25)', marginLeft: 2 }}
            >
              <Command size={10} />K
            </span>
          </button>

          {/* Auth section */}
          {status === 'loading' ? (
            <div style={{ width: 72, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
          ) : status === 'authenticated' ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '4px 10px 4px 5px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                aria-label="User menu"
              >
                {/* Avatar initial */}
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(212,165,116,0.15)',
                  color: '#d4a574',
                  fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {session.user?.name?.[0]?.toUpperCase() ?? '?'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(245,245,244,0.75)' }} className="hidden sm:inline">
                  {session.user?.name}
                </span>
              </button>

              {userOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  width: 200, borderRadius: 12, overflow: 'hidden',
                  background: '#111113',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                  zIndex: 99,
                }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#f5f5f4', margin: 0 }}>{session.user?.name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(245,245,244,0.38)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setUserOpen(false); signOut({ callbackUrl: '/auth/signin' }) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px', background: 'transparent', border: 'none',
                      color: 'rgba(245,245,244,0.55)', fontSize: 13, cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Signed-out: Sign In + Sign Up */
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link
                href="/auth/signin"
                style={{
                  padding: '5px 12px', borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(245,245,244,0.55)', fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', transition: 'all .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                style={{
                  padding: '5px 14px', borderRadius: 999,
                  background: 'rgba(212,165,116,0.12)',
                  border: '1px solid rgba(212,165,116,0.22)',
                  color: '#d4a574', fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', transition: 'all .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,165,116,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,165,116,0.12)')}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <CommandModal open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}
