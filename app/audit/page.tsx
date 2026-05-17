'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WordsPullUp } from '@/components/animations/WordsPullUp'
import { FadeUp } from '@/components/animations/FadeUp'

export default function AuditPage() {
  const [audit, setAudit] = useState<{
    totalPages: number
    stalePages: number
    flaggedPages: number
    healthScore: number
    syncWarning: string | null
    stale: Array<{ slug: string; title: string; last_validated: string }>
    flagged: Array<{ slug: string; title: string; stale_reason: string; confidence: number }>
  } | null>(null)

  useEffect(() => {
    fetch('/api/audit').then(r => r.json()).then(setAudit)
  }, [])

  return (
    <div className="bg-black min-h-screen p-8 pt-16">
      <h1 className="font-medium mb-2"
        style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: '#E1E0CC' }}>
        <WordsPullUp text="Wiki Health." />
      </h1>
      <FadeUp delay={0.3}>
        <p className="font-serif-italic text-lg mb-12" style={{ color: 'rgba(222,219,200,0.5)' }}>
          What needs pruning. What needs updating.
        </p>
      </FadeUp>

      {audit && (
        <>
          {audit.syncWarning && (
            <FadeUp delay={0.35}>
              <div className="mb-8 bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
                <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  {audit.syncWarning}
                </p>
              </div>
            </FadeUp>
          )}

          {/* Health score */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {[
              { label: 'Total Pages', value: audit.totalPages },
              { label: 'Health Score', value: `${audit.healthScore}%` },
              { label: 'Stale Pages', value: audit.stalePages },
              { label: 'Flagged Pages', value: audit.flaggedPages },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="bg-[#111] rounded-2xl p-5">
                  <p className="text-[9px] tracking-[0.3em] uppercase mb-2"
                    style={{ color: 'rgba(222,219,200,0.3)' }}>{stat.label}</p>
                  <p className="text-3xl font-medium" style={{ color: '#E1E0CC' }}>{stat.value}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Stale pages */}
          {audit.stale.length > 0 && (
            <div className="mb-8">
              <p className="text-[9px] tracking-[0.3em] uppercase mb-4"
                style={{ color: 'rgba(222,219,200,0.3)' }}>
                STALE PAGES (not validated in 30+ days)
              </p>
              <div className="space-y-2">
                {audit.stale.map(page => (
                  <div key={page.slug}
                    className="bg-[#111] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: '#E1E0CC' }}>{page.title}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'rgba(222,219,200,0.35)' }}>
                        Last validated: {new Date(page.last_validated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/wiki/${page.slug}`}
                        className="text-[10px] px-3 py-1 rounded-full border border-white/10 hover:border-white/30 transition"
                        style={{ color: 'rgba(222,219,200,0.5)' }}>
                        Review →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flagged pages */}
          {audit.flagged.length > 0 && (
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-4"
                style={{ color: 'rgba(222,219,200,0.3)' }}>
                FLAGGED FOR REVIEW
              </p>
              <div className="space-y-2">
                {audit.flagged.map(page => (
                  <div key={page.slug}
                    className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm" style={{ color: '#E1E0CC' }}>{page.title}</p>
                      <span className="text-[9px] px-2 py-0.5 bg-red-950 text-red-400 rounded-full">
                        confidence: {page.confidence}%
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgba(222,219,200,0.45)' }}>
                      {page.stale_reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audit.stale.length === 0 && audit.flagged.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4" style={{ color: 'rgba(255,255,255,0.1)' }}>✓</p>
              <p className="text-sm" style={{ color: 'rgba(222,219,200,0.4)' }}>
                Wiki is healthy. No stale or flagged pages.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
