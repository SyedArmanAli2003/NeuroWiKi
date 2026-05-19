'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import {
  Brain, BookOpen, Plus, Search,
  Network, ShieldCheck, User, X,
  GitBranch, LogIn, ChevronRight, Database, Info
} from 'lucide-react'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Home',            href: '/',        icon: Brain       },
  { label: 'Browse Wiki',     href: '/wiki',    icon: BookOpen    },
  { label: 'Add Source',      href: '/ingest',  icon: Plus        },
  { label: 'Source Manager',  href: '/sources', icon: Database    },
  { label: 'Search & Ask',    href: '/search',  icon: Search      },
  { label: 'Knowledge Graph', href: '/graph',   icon: Network     },
  { label: 'Wiki Health',     href: '/audit',   icon: ShieldCheck },
  { label: 'How to Use',      href: '/docs',    icon: Info        },
]

const PANEL_OPEN_KEY = 'nw_nav_opened'
const HINT_SEEN_KEY  = 'nav_hint_seen'

export function HoverSidebar() {
  const pathname                        = usePathname()
  const [panelOpen,    setPanelOpen]    = useState(false)
  const [showAbout,    setShowAbout]    = useState(false)
  const [sliverHover,  setSliverHover]  = useState(false)
  const [showTooltip,  setShowTooltip]  = useState(false)
  const [hasOpened,    setHasOpened]    = useState(false)
  const [pulseActive,  setPulseActive]  = useState(true)
  const [pulseSlow,    setPulseSlow]    = useState(false)

  const closeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseControls = useAnimation()

  // ── On mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if user has opened panel before
    const opened = localStorage.getItem(PANEL_OPEN_KEY)
    if (opened) {
      setHasOpened(true)
      setPulseActive(false)
      return
    }

    // Slow pulse after 3s
    pulseTimer.current = setTimeout(() => {
      setPulseSlow(true)
    }, 3000)

    // Show tooltip after 1.5s (let user see the page first)
    const hintSeen = localStorage.getItem(HINT_SEEN_KEY)
    if (!hintSeen) {
      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(true)
        // Auto-hide after 3s
        setTimeout(() => {
          setShowTooltip(false)
          localStorage.setItem(HINT_SEEN_KEY, '1')
        }, 3000)
      }, 1500)
    }

    return () => {
      if (pulseTimer.current)  clearTimeout(pulseTimer.current)
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    }
  }, [])

  // ── Panel open/close handlers ────────────────────────────────────────────────
  const openPanel = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setPanelOpen(true)

    // First time opening — stop pulse forever
    if (!hasOpened) {
      setHasOpened(true)
      setPulseActive(false)
      setShowTooltip(false)
      localStorage.setItem(PANEL_OPEN_KEY, '1')
      localStorage.setItem(HINT_SEEN_KEY,  '1')
    }
  }, [hasOpened])

  const closePanel = useCallback(() => {
    // Delay close by 250ms so accidental mouse-outs don't snap it shut
    closeTimer.current = setTimeout(() => {
      setPanelOpen(false)
      setShowAbout(false)
    }, 250)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  // ── Keyboard shortcut: "[" opens / closes ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '[' && !e.metaKey && !e.ctrlKey) {
        if (panelOpen) { setPanelOpen(false); setShowAbout(false) }
        else openPanel()
      }
      if (e.key === 'Escape' && panelOpen) {
        setPanelOpen(false)
        setShowAbout(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [panelOpen, openPanel])

  // ── Pulse animation values ───────────────────────────────────────────────────
  const pulseAnimation = pulseActive
    ? {
        opacity:   pulseSlow ? [0.15, 0.45, 0.15] : [0.2, 0.7, 0.2],
        scaleX:    pulseSlow ? [1, 1.3, 1]         : [1, 1.8, 1],
        boxShadow: pulseSlow
          ? ['0 0 4px rgba(222,219,200,0.1)',  '0 0 10px rgba(222,219,200,0.25)', '0 0 4px rgba(222,219,200,0.1)']
          : ['0 0 4px rgba(222,219,200,0.15)', '0 0 18px rgba(222,219,200,0.5)', '0 0 4px rgba(222,219,200,0.15)'],
      }
    : { opacity: 0, scaleX: 1, boxShadow: 'none' }

  const pulseTransition = {
    duration:   pulseSlow ? 2.8 : 1.4,
    repeat:     pulseActive ? Infinity : 0,
    ease:       'easeInOut' as const,
  }

  return (
    <>
      {/* ── SLIVER / PEEK INDICATOR ─────────────────────────────────────── */}
      <AnimatePresence>
        {!panelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 h-full z-50 flex items-center"
            style={{ width: 20 }}
            onMouseEnter={() => { setSliverHover(true); openPanel() }}
            onMouseLeave={() => setSliverHover(false)}
          >
            {/* Sliver bar */}
            <motion.div
              className="absolute left-0 top-0 h-full origin-left"
              style={{
                width: sliverHover ? 14 : 6,
                background: 'rgba(222,219,200,0.28)',
                boxShadow: '2px 0 8px rgba(222,219,200,0.12)',
                transition: 'width 80ms ease-out',
                borderRadius: '0 3px 3px 0',
              }}
              animate={pulseAnimation}
              transition={pulseTransition}
            />

            {/* Brand text — vertical, visible when not animating */}
            {!sliverHover && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: pulseActive ? 0 : 0.3 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ gap: 3, writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                <span style={{
                  fontSize: 7,
                  letterSpacing: '0.2em',
                  color: '#DEDBC8',
                  fontFamily: 'Almarai, sans-serif',
                  userSelect: 'none',
                }}>
                  N·W
                </span>
              </motion.div>
            )}

            {/* Chevron — always visible centered */}
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ width: sliverHover ? 14 : 6 }}
              animate={{ x: sliverHover ? 1 : 0 }}
              transition={{ duration: 0.08 }}
            >
              <ChevronRight
                size={sliverHover ? 10 : 7}
                style={{
                  color: 'rgba(222,219,200,0.6)',
                  transition: 'all 80ms ease-out',
                  flexShrink: 0,
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FIRST-VISIT TOOLTIP ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showTooltip && !panelOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(20,20,20,0.95)',
                border: '1px solid rgba(222,219,200,0.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Arrow pointing left toward sliver */}
              <div
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45"
                style={{
                  background: 'rgba(20,20,20,0.95)',
                  border: '1px solid rgba(222,219,200,0.15)',
                  borderRight: 'none',
                  borderTop: 'none',
                }}
              />
              <span
                className="text-[11px] tracking-wider whitespace-nowrap"
                style={{ color: 'rgba(222,219,200,0.8)', fontFamily: 'Almarai, sans-serif' }}
              >
                Navigation
              </span>
              <span
                className="text-[10px]"
                style={{ color: 'rgba(222,219,200,0.5)' }}
              >
                →
              </span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(222,219,200,0.08)',
                  color: 'rgba(222,219,200,0.4)',
                  border: '1px solid rgba(222,219,200,0.1)',
                  fontFamily: 'monospace',
                }}
              >
                [
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BACKDROP ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => { setPanelOpen(false); setShowAbout(false) }}
          />
        )}
      </AnimatePresence>

      {/* ── SLIDE-IN PANEL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            data-sidebar-panel
            initial={{ x: -280 }}
            animate={{ x: 0, transition: { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 } }}
            exit={{ x: -280, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
            className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
            style={{
              background: '#0a0a0a',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              willChange: 'transform',
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={closePanel}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <span
                  className="text-xs tracking-[0.3em] uppercase"
                  style={{ color: '#DEDBC8' }}
                >
                  N · W
                </span>
                <p
                  className="text-[9px] tracking-widest opacity-30 mt-0.5 uppercase"
                  style={{ fontFamily: 'Almarai, sans-serif' }}
                >
                  NeuroWiki
                </p>
              </div>
              <button
                onClick={() => { setPanelOpen(false); setShowAbout(false) }}
                className="opacity-25 hover:opacity-60 transition-opacity"
              >
                <X size={13} color="#DEDBC8" />
              </button>
            </div>

            {/* Navigation */}
            {!showAbout && (
              <nav className="flex-1 py-4 overflow-y-auto">
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href ||
                    (href !== '/' && pathname.startsWith(href))
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setPanelOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-[11px] tracking-wider uppercase transition-all duration-150 border-l-2"
                      style={{
                        borderLeftColor: active ? '#DEDBC8' : 'transparent',
                        color: active ? '#DEDBC8' : 'rgba(225,224,204,0.38)',
                      }}
                      onMouseEnter={e =>
                        !active && ((e.currentTarget as HTMLElement).style.color = '#DEDBC8')
                      }
                      onMouseLeave={e =>
                        !active && ((e.currentTarget as HTMLElement).style.color = 'rgba(225,224,204,0.38)')
                      }
                    >
                      <Icon size={13} />
                      {label}
                    </Link>
                  )
                })}

                {/* Divider */}
                <div className="mx-5 my-3 border-t border-white/5" />

                {/* About button */}
                <button
                  onClick={() => setShowAbout(true)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-[11px] tracking-wider uppercase transition-all duration-150 border-l-2 border-transparent"
                  style={{ color: 'rgba(225,224,204,0.38)' }}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLElement).style.color = '#DEDBC8')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.color = 'rgba(225,224,204,0.38)')
                  }
                >
                  <User size={13} />
                  About this project
                </button>

                {/* Auth - Hardcoded Sign In for now */}
                <div className="mx-5 my-3 border-t border-white/5" />
                <Link
                  href="/auth/signin"
                  onClick={() => setPanelOpen(false)}
                  className="flex items-center gap-3 px-5 py-2.5 text-[11px] tracking-wider uppercase transition-all duration-150 border-l-2 border-transparent"
                  style={{ color: 'rgba(225,224,204,0.35)' }}
                  onMouseEnter={e =>
                    ((e.currentTarget as HTMLElement).style.color = '#DEDBC8')
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.color = 'rgba(225,224,204,0.35)')
                  }
                >
                  <LogIn size={13} />
                  Sign In
                </Link>
              </nav>
            )}

            {/* About panel */}
            {showAbout && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <button
                  onClick={() => setShowAbout(false)}
                  className="text-[10px] tracking-wider uppercase mb-6 flex items-center gap-2 hover:opacity-100 transition-opacity"
                  style={{ color: 'rgba(222,219,200,0.35)' }}
                >
                  ← Back
                </button>

                <p className="text-[9px] tracking-[0.3em] uppercase mb-3"
                  style={{ color: 'rgba(222,219,200,0.25)' }}>
                  About
                </p>
                <h3 className="text-base font-medium mb-3" style={{ color: '#E1E0CC' }}>
                  NeuroWiki
                </h3>
                <p className="text-[11px] leading-relaxed mb-5"
                  style={{ color: 'rgba(222,219,200,0.5)' }}>
                  An AI-powered personal Wikipedia built for a hackathon —
                  inspired by Karpathy's LLM Wiki pattern. Add any source,
                  watch it compile into connected knowledge.
                </p>
                <div className="space-y-2 mb-6">
                  {[
                    'Next.js 15 + TypeScript',
                    'Google Gemini (multi-model)',
                    'HydraDB Knowledge Graph',
                    'Framer Motion',
                    'Cloud Run deployment',
                  ].map(tech => (
                    <div key={tech} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(222,219,200,0.3)' }} />
                      <span className="text-[10px]" style={{ color: 'rgba(222,219,200,0.4)' }}>
                        {tech}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <p className="text-[9px] tracking-[0.3em] uppercase"
                    style={{ color: 'rgba(222,219,200,0.25)' }}>Author</p>
                  <p className="text-sm font-medium" style={{ color: '#E1E0CC' }}>
                    Your Name
                  </p>
                  
                  <a
                    href="https://github.com/YOUR_USERNAME/neurowiki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] hover:opacity-100 transition-opacity"
                    style={{ color: 'rgba(222,219,200,0.4)' }}
                  >
                    <GitBranch size={11} />
                    GitHub
                  </a>
                </div>
              </motion.div>
            )}

            {/* Footer hint */}
            {!showAbout && (
              <div className="p-5 border-t border-white/5">
                <p className="text-[9px] flex items-center gap-2"
                  style={{ color: 'rgba(222,219,200,0.18)' }}>
                  <span
                    className="px-1 py-0.5 rounded text-[8px]"
                    style={{
                      background: 'rgba(222,219,200,0.06)',
                      border: '1px solid rgba(222,219,200,0.1)',
                      fontFamily: 'monospace',
                    }}
                  >
                    [
                  </span>
                  to toggle
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
