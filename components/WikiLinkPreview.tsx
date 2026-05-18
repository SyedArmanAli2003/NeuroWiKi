'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  href: string; slug: string; children: React.ReactNode
}

export function WikiLinkPreview({ href, slug, children }: Props) {
  const [preview, setPreview] = useState<{ title: string; summary: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPreview = async () => {
    if (preview) return
    try {
      const res = await fetch(`/api/wiki/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setPreview({ title: data.page?.title, summary: data.page?.summary })
      }
    } catch {}
  }

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      fetchPreview()
      setShowPreview(true)
    }, 400)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setShowPreview(false)
  }

  return (
    <span className="relative inline" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link href={href}
        className="text-primary underline decoration-primary/20 underline-offset-4 hover:decoration-primary/70 transition-all">
        {children}
      </Link>
      <AnimatePresence>
        {showPreview && preview && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl p-3 pointer-events-none"
            style={{
              background: '#151515',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <p className="text-[11px] font-medium mb-1" style={{ color: '#E1E0CC' }}>
              {preview.title}
            </p>
            <p className="text-[10px] leading-relaxed line-clamp-3"
              style={{ color: 'rgba(222,219,200,0.5)' }}>
              {preview.summary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
