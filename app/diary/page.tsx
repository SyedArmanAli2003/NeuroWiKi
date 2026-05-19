'use client'
import { useEffect, useState, lazy, Suspense } from 'react'
import Link from 'next/link'
import { DayHeader } from '@/components/diary/DayHeader'
import { TodayComposer } from '@/components/diary/TodayComposer'
import { TodayLog } from '@/components/diary/TodayLog'

const DiarySpine = lazy(() => import('@/components/diary/DiarySpine').then(m => ({ default: m.DiarySpine })))

export default function DiaryPage() {
  const today = new Date().toISOString().split('T')[0]

  const [entries, setEntries] = useState<any[]>([])
  const [todayLoaded, setTodayLoaded] = useState(false)
  const [showBelowFold, setShowBelowFold] = useState(false)

  useEffect(() => {
    fetch(`/api/diary/today?date=${today}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries ?? [])
        setTodayLoaded(true)
      })
      .catch(() => setTodayLoaded(true))

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

        <DayHeader />

        <section style={{ marginTop: '32px' }}>
          <TodayComposer date={today} onEntry={addEntry} />
          {todayLoaded ? (
            <TodayLog entries={entries} onUpdate={updateEntry} />
          ) : (
            <p className="kicker" style={{ paddingTop: '14px' }}>loading today…</p>
          )}
        </section>

        {showBelowFold && (
          <Suspense fallback={null}>
            <DiarySpine />
          </Suspense>
        )}

        <footer
          className="flex items-center justify-between flex-wrap gap-4"
          style={{ marginTop: '80px', paddingTop: '24px', paddingBottom: '60px', borderTop: '1px solid var(--hair)' }}
        >
          <span className="kicker">◐ NeuroWiki · diary</span>
          <Link href="/wiki" className="kicker" style={{ opacity: 0.7 }}>
            browse library →
          </Link>
        </footer>
      </div>
    </div>
  )
}
