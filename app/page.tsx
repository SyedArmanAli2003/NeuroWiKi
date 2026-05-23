'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { ArrowRight, Plus, Search, Sparkles, Brain, Network, MessageSquare, X, Lock } from 'lucide-react'
import { TypeBadge } from '@/components/TypeBadge'
import { Onboarding } from '@/components/Onboarding'

interface Page {
  slug: string
  title: string
  summary?: string
  type: string
  updated_at?: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pages,   setPages]   = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  // 5-second delay auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [countdown,     setCountdown]     = useState(5)

  // Start 5s countdown only for unauthenticated visitors
  useEffect(() => {
    if (status === 'unauthenticated') {
      const tick = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(tick)
            setShowAuthModal(true)
            return 0
          }
          return c - 1
        })
      }, 1000)
      return () => clearInterval(tick)
    }
  }, [status])

  // Fetch user-specific wiki pages
  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }
    fetch('/api/wiki')
      .then((r) => r.json())
      .then((data) => { if (data.pages) setPages(data.pages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status])

  // Guard: nav link clicks for unauthenticated
  function guardedNav(e: React.MouseEvent, href: string) {
    if (status !== 'authenticated') {
      e.preventDefault()
      setShowAuthModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Onboarding />

      {/* ── Auth Modal ──────────────────────────────── */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-8 text-center"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4"
              style={{ color: 'rgba(245,245,244,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(212,165,116,0.1)' }}
            >
              <Lock size={24} style={{ color: '#d4a574' }} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f5f5f4', marginBottom: 8 }}>
              Your knowledge awaits
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.45)', lineHeight: 1.6, marginBottom: 24 }}>
              Sign in to access your personal knowledge base, or create a free account to get started.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/auth/signup"
                className="auth-submit-btn"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              >
                <span>Create free account</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/auth/signin"
                style={{
                  padding: '11px', borderRadius: 10, textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(245,245,244,0.6)', fontSize: 14, textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(212,165,116,0.15) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <span className="kicker inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a574]" />
              Personal Memory Agent
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance"
            style={{ color: '#f5f5f4', lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            Your second brain,
            <br />
            <span className="font-serif italic" style={{ color: 'rgba(245,245,244,0.7)' }}>
              intelligently connected
            </span>
          </h1>

          <p
            className="mt-6 text-base sm:text-lg max-w-xl mx-auto text-balance"
            style={{ color: 'rgba(245,245,244,0.5)', lineHeight: 1.6 }}
          >
            Add any source. NeuroWiki transforms it into living knowledge
            that grows smarter with everything you add.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {status === 'authenticated' ? (
              <>
                <Link href="/ingest" className="btn-primary group">
                  <Plus size={16} />
                  <span>Add your first source</span>
                  <ArrowRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                </Link>
                <Link href="/search" className="btn-secondary">
                  <Search size={14} />
                  <span>Search your memory</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup" className="btn-primary group">
                  <Sparkles size={16} />
                  <span>Get started free</span>
                  <ArrowRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                </Link>
                <Link href="/auth/signin" className="btn-secondary">
                  <span>Sign in</span>
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-medium" style={{ color: '#f5f5f4' }}>
                {status === 'authenticated' ? pages.length : '∞'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245,245,244,0.35)' }}>
                {status === 'authenticated' ? 'memories stored' : 'knowledge capacity'}
              </p>
            </div>
            <div className="w-px h-8 bg-[rgba(255,255,255,0.1)]" />
            <div className="text-center">
              <p className="text-2xl font-medium flex items-center justify-center gap-1" style={{ color: '#f5f5f4' }}>
                <Sparkles size={16} className="text-[#d4a574]" />
                AI
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245,245,244,0.35)' }}>
                powered retrieval
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent Memories (authenticated only) ────── */}
      {status === 'authenticated' && (
        <section className="px-6 py-20 bg-[#09090b]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="kicker">Recent memories</span>
                <h2 className="section-title mt-2">Your knowledge at a glance</h2>
              </div>
              {pages.length > 0 && (
                <Link href="/wiki" className="btn-ghost text-sm">
                  View all <ArrowRight size={14} />
                </Link>
              )}
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="surface-card p-5">
                    <div className="h-4 w-16 bg-[rgba(255,255,255,0.05)] rounded mb-3" />
                    <div className="h-5 w-3/4 bg-[rgba(255,255,255,0.08)] rounded mb-2" />
                    <div className="h-4 w-full bg-[rgba(255,255,255,0.04)] rounded" />
                  </div>
                ))}
              </div>
            )}

            {!loading && pages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.slice(0, 6).map((page) => (
                  <Link key={page.slug} href={`/wiki/${page.slug}`}>
                    <article className="surface-card p-5 h-full group">
                      <TypeBadge type={page.type} />
                      <h3
                        className="text-base font-medium mt-3 mb-2 group-hover:text-[#f5f5f4] transition-colors duration-150 line-clamp-1"
                        style={{ color: 'rgba(245,245,244,0.9)' }}
                      >
                        {page.title}
                      </h3>
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(245,245,244,0.4)' }}>
                        {page.summary || 'No summary available.'}
                      </p>
                      <p className="text-xs mt-4" style={{ color: 'rgba(245,245,244,0.25)' }}>
                        {page.updated_at
                          ? new Date(page.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Recently added'}
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            )}

            {!loading && pages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Sparkles size={28} style={{ color: 'rgba(245,245,244,0.2)' }} />
                </div>
                <h3 className="text-xl font-medium mb-2" style={{ color: '#f5f5f4' }}>Your memory is empty</h3>
                <p className="text-sm mb-6 max-w-sm" style={{ color: 'rgba(245,245,244,0.4)' }}>
                  Start by adding your first source — an article, note, or any knowledge you want to remember.
                </p>
                <Link href="/ingest" className="btn-primary">
                  <Plus size={16} />
                  <span>Add your first source</span>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Features ──────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="kicker">How it works</span>
            <h2 className="section-title mt-2">Built for how you think</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Add anything',
                desc: 'Drop in articles, notes, PDFs, or any text. NeuroWiki extracts and structures the knowledge automatically.',
                Icon: Plus,
              },
              {
                title: 'Auto-connect',
                desc: 'Your memories form a knowledge graph. Related concepts link together, revealing patterns you might miss.',
                Icon: Network,
              },
              {
                title: 'Ask anything',
                desc: 'Query your entire memory with natural language. Get answers grounded in your own knowledge base.',
                Icon: Sparkles,
              },
            ].map(({ title, desc, Icon }) => (
              <div key={title} className="surface-card p-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212,165,116,0.1)', color: '#d4a574' }}>
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-medium mb-2" style={{ color: '#f5f5f4' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,244,0.5)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Motto Section ──────────────────── */}
      <section
        className="px-6 py-24 border-t border-[rgba(255,255,255,0.04)]"
        style={{ background: 'rgba(212,165,116,0.02)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: 'rgba(212,165,116,0.08)', border: '1px solid rgba(212,165,116,0.15)' }}>
            <Brain size={28} style={{ color: '#d4a574' }} />
          </div>

          <span className="kicker">About NeuroWiki</span>
          <h2
            className="mt-4 text-3xl sm:text-4xl font-medium tracking-tight"
            style={{ color: '#f5f5f4', letterSpacing: '-0.025em', lineHeight: 1.2 }}
          >
            Knowledge is only powerful
            <br />
            <span className="font-serif italic" style={{ color: 'rgba(245,245,244,0.6)' }}>when it&apos;s yours to own.</span>
          </h2>

          <p className="mt-6 text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(245,245,244,0.5)' }}>
            We built NeuroWiki because information overload is the defining problem of our age.
            Bookmarks pile up. Notes scatter. Insights slip away.
            NeuroWiki gives you a private, AI-powered second brain — one that reads everything you feed it,
            connects the dots automatically, and answers your questions in plain language.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { icon: '🔒', title: 'Private by design', desc: 'Your data is yours. Each account is fully isolated — no sharing, no leakage.' },
              { icon: '🧠', title: 'AI-native memory', desc: 'Not just storage. NeuroWiki reasons over your knowledge and surfaces connections.' },
              { icon: '⚡', title: 'Built to last', desc: 'Export everything at any time. Your knowledge is never locked in.' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#f5f5f4' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,245,244,0.45)' }}>{desc}</p>
              </div>
            ))}
          </div>

          <blockquote
            className="mt-12 text-xl font-serif italic"
            style={{ color: 'rgba(245,245,244,0.55)', borderLeft: '2px solid rgba(212,165,116,0.35)', paddingLeft: 20, textAlign: 'left', maxWidth: 480, margin: '48px auto 0' }}
          >
            &ldquo;The goal isn&apos;t to remember everything. It&apos;s to never lose what matters.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm" style={{ color: 'rgba(245,245,244,0.3)' }}>— The NeuroWiki team</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="bg-black text-[#888]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-8 py-16">
            
            {/* Left column - 40% */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#e8e4d8] text-black flex items-center justify-center font-bold text-xs rounded-sm">N</div>
                <span className="text-[#e8e4d8] font-bold tracking-widest text-sm uppercase">Neurowiki</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Your personal memory agent. Store, connect, and retrieve your knowledge with AI-powered intelligence.
              </p>
            </div>

            {/* Middle column - 30% */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">PRODUCT</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/wiki" className="text-sm hover:text-white transition-colors duration-200">Wiki</Link>
                <Link href="/ingest" className="text-sm hover:text-white transition-colors duration-200">Add Source</Link>
                <Link href="/search" className="text-sm hover:text-white transition-colors duration-200">Search</Link>
                <Link href="/graph" className="text-sm hover:text-white transition-colors duration-200">Graph</Link>
              </nav>
            </div>

            {/* Right column - 30% */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">RESOURCES</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/docs" className="text-sm hover:text-white transition-colors duration-200">Documentation</Link>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors duration-200 flex items-center gap-1">
                  GitHub <span className="text-[10px]">↗</span>
                </a>
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="px-8 pb-8">
            <div className="flex justify-between text-xs text-gray-600 border-t border-gray-800 pt-6">
              <span className="hidden sm:inline">Built with Hydra DB and AI</span>
              <span className="text-center w-full sm:w-auto">© {new Date().getFullYear()} NeuroWiki. Your knowledge. Your control.</span>
              <span className="hidden sm:inline">MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
