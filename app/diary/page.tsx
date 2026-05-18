'use client'
import { useEffect, useState, lazy, Suspense } from 'react'
import { DayHeader } from '@/components/diary/DayHeader'
import { MorningIntention } from '@/components/diary/MorningIntention'
import { TodayComposer } from '@/components/diary/TodayComposer'
import { TodayLog } from '@/components/diary/TodayLog'
import { EveningReview } from '@/components/diary/EveningReview'
import { SectionHeader } from '@/components/diary/SectionHeader'

// Below-fold sections lazy-loaded — speeds up first paint
const ThreadsGrid  = lazy(() => import('@/components/diary/ThreadsGrid').then(m => ({ default: m.ThreadsGrid })))
const DiarySpine   = lazy(() => import('@/components/diary/DiarySpine').then(m => ({ default: m.DiarySpine })))
const LibraryMini  = lazy(() => import('@/components/diary/LibraryMini').then(m => ({ default: m.LibraryMini })))

export default function DiaryPage() {
  const today = new Date().toISOString().split('T')[0]

  const [entries, setEntries] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [todayLoaded, setTodayLoaded] = useState(false)
  const [showBelowFold, setShowBelowFold] = useState(false)

  useEffect(() => {
    fetch(`/api/diary/today?date=${today}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries ?? [])
        setMeta(d.meta ?? null)
        setStreak(d.streak ?? 0)
        setTodayLoaded(true)
      })
      .catch(() => setTodayLoaded(true))

    // Defer below-fold render until after initial paint
    const idle = (window as any).requestIdleCallback ?? ((cb: any) => setTimeout(cb, 200))
    const handle = idle(() => setShowBelowFold(true))
    return () => {
      const cancel = (window as any).cancelIdleCallback ?? clearTimeout
      cancel(handle)
    }
  }, [today])

  function addEntry(entry: any, synced: boolean) {
    setEntries((prev) => [...prev, { ...entry, synced }])
  }

  function updateEntry(id: number, text: string) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, text } : e))
  }

  return (
    <div className="diary min-h-screen" style={{ background: '#000' }}>
      <div className="mx-auto px-7" style={{ maxWidth: '680px' }}>

        <DayHeader streak={streak} mood={meta?.mood ?? null} />

        <MorningIntention
          date={today}
          initial={meta?.intention ?? null}
          initialTime={meta?.intention_time ?? null}
        />

        <section style={{ marginTop: '40px' }}>
          <SectionHeader
            kicker="Today"
            title={<>What's <em>on your mind?</em></>}
            meta={todayLoaded ? `${entries.length} capture${entries.length !== 1 ? 's' : ''}` : '…'}
          />

          <TodayComposer date={today} onEntry={addEntry} />
          {todayLoaded ? (
            <TodayLog entries={entries} onUpdate={updateEntry} />
          ) : (
            <p className="kicker" style={{ paddingTop: '14px' }}>loading today…</p>
          )}
          <EveningReview
            date={today}
            entries={entries}
            savedReview={meta?.review ?? null}
            onSave={(review) => setMeta((m: any) => ({ ...(m ?? {}), review }))}
          />
        </section>

        {showBelowFold && (
          <Suspense fallback={null}>
            <ThreadsGrid />
            <DiarySpine />
            <LibraryMini />
          </Suspense>
        )}

        <footer
          className="flex items-center justify-between flex-wrap gap-4"
          style={{ marginTop: '80px', paddingTop: '24px', paddingBottom: '60px', borderTop: '1px solid var(--hair)' }}
        >
          <span className="kicker">◐ NeuroWiki · diary</span>
          <span className="kicker" style={{ opacity: 0.7 }}>
            local-first · <em style={{ letterSpacing: 0, textTransform: 'none', fontSize: 'var(--fs-meta)' }}>last synced just now</em> · v0.1
          </span>
        </footer>
      </div>
    </div>
  )
}
