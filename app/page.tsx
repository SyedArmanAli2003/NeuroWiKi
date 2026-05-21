'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, Search, Sparkles } from 'lucide-react'
import { TypeBadge } from '@/components/TypeBadge'
import { Onboarding } from '@/components/Onboarding'

interface Page {
  slug: string
  title: string
  summary?: string
  type: string
  created_at?: string
}

export default function Home() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wiki')
      .then((res) => res.json())
      .then((data) => {
        if (data.pages) {
          setPages(data.pages)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch pages', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Onboarding />
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b] to-[#09090b]" />
        
        {/* Noise texture */}
        <div className="noise-overlay absolute inset-0" />
        
        {/* Radial gradient accent */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212, 165, 116, 0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Kicker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="kicker inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a574] animate-pulse-subtle" />
              Personal Memory Agent
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance"
            style={{ 
              color: '#f5f5f4',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            Your second brain,
            <br />
            <span className="font-serif-italic" style={{ color: 'rgba(245, 245, 244, 0.7)' }}>
              intelligently connected
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg max-w-xl mx-auto text-balance"
            style={{ color: 'rgba(245, 245, 244, 0.5)', lineHeight: 1.6 }}
          >
            Add any source. NeuroWiki transforms it into living knowledge
            that grows smarter with everything you add.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/ingest" className="btn-primary group">
              <Plus size={16} />
              <span>Add your first source</span>
              <ArrowRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </Link>
            <Link href="/search" className="btn-secondary">
              <Search size={14} />
              <span>Search your memory</span>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex items-center justify-center gap-8"
          >
            <div className="text-center">
              <p className="text-2xl font-medium" style={{ color: '#f5f5f4' }}>
                {pages.length}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245, 245, 244, 0.35)' }}>
                memories stored
              </p>
            </div>
            <div className="w-px h-8 bg-[rgba(255,255,255,0.1)]" />
            <div className="text-center">
              <p className="text-2xl font-medium flex items-center justify-center gap-1" style={{ color: '#f5f5f4' }}>
                <Sparkles size={16} className="text-[#d4a574]" />
                AI
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245, 245, 244, 0.35)' }}>
                powered retrieval
              </p>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs" style={{ color: 'rgba(245, 245, 244, 0.25)' }}>
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-5 h-8 rounded-full border border-[rgba(255,255,255,0.15)] flex items-start justify-center p-1.5"
            >
              <div className="w-1 h-2 rounded-full bg-[rgba(255,255,255,0.3)]" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Recent Memories Section */}
      <section className="px-6 py-20 bg-[#09090b]">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="kicker">Recent memories</span>
              <h2 className="section-title mt-2">Your knowledge at a glance</h2>
            </div>
            {pages.length > 0 && (
              <Link href="/wiki" className="btn-ghost text-sm">
                View all
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="surface-card p-5 animate-pulse">
                  <div className="h-4 w-16 bg-[rgba(255,255,255,0.05)] rounded mb-3" />
                  <div className="h-5 w-3/4 bg-[rgba(255,255,255,0.08)] rounded mb-2" />
                  <div className="h-4 w-full bg-[rgba(255,255,255,0.04)] rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Pages grid */}
          {!loading && pages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.slice(0, 6).map((page, index) => (
                <motion.div
                  key={page.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link href={`/wiki/${page.slug}`}>
                    <article className="surface-card p-5 h-full group">
                      <TypeBadge type={page.type} />
                      <h3 
                        className="text-base font-medium mt-3 mb-2 group-hover:text-[#f5f5f4] transition-colors line-clamp-1"
                        style={{ color: 'rgba(245, 245, 244, 0.9)' }}
                      >
                        {page.title}
                      </h3>
                      <p 
                        className="text-sm leading-relaxed line-clamp-2"
                        style={{ color: 'rgba(245, 245, 244, 0.4)' }}
                      >
                        {page.summary || 'No summary available for this memory.'}
                      </p>
                      <p 
                        className="text-xs mt-4"
                        style={{ color: 'rgba(245, 245, 244, 0.25)' }}
                      >
                        {page.created_at 
                          ? new Date(page.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Recently added'
                        }
                      </p>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && pages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Sparkles size={28} style={{ color: 'rgba(245, 245, 244, 0.2)' }} />
              </div>
              <h3 className="text-xl font-medium mb-2" style={{ color: '#f5f5f4' }}>
                Your memory is empty
              </h3>
              <p className="text-sm mb-6 max-w-sm" style={{ color: 'rgba(245, 245, 244, 0.4)' }}>
                Start by adding your first source. It could be an article, a note, 
                or any piece of knowledge you want to remember.
              </p>
              <Link href="/ingest" className="btn-primary">
                <Plus size={16} />
                <span>Add your first source</span>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
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
                description: 'Drop in articles, notes, PDFs, or any text. NeuroWiki extracts and structures the knowledge automatically.',
                icon: Plus,
              },
              {
                title: 'Auto-connect',
                description: 'Your memories form a knowledge graph. Related concepts link together, revealing patterns you might miss.',
                icon: () => (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="6" r="3" />
                    <circle cx="18" cy="18" r="3" />
                    <line x1="9" y1="12" x2="15" y2="7" />
                    <line x1="9" y1="12" x2="15" y2="17" />
                  </svg>
                ),
              },
              {
                title: 'Ask anything',
                description: 'Query your entire memory with natural language. Get answers grounded in your own knowledge base.',
                icon: Sparkles,
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="surface-card p-6"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'rgba(212, 165, 116, 0.1)', color: '#d4a574' }}
                >
                  <feature.icon size={20} />
                </div>
                <h3 className="text-base font-medium mb-2" style={{ color: '#f5f5f4' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245, 245, 244, 0.5)' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
