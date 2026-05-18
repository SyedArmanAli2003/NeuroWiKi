'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

export default function EditPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [page, setPage] = useState<{ title: string; content: string; summary: string; type: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/wiki/${slug}`)
      .then(r => r.json())
      .then(d => setPage(d.page))
  }, [slug])

  const handleSave = async () => {
    if (!page) return
    setSaving(true)
    try {
      const res = await fetch(`/api/wiki/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Page saved')
      router.push(`/wiki/${slug}`)
    } catch {
      toast.error('Could not save page')
    } finally {
      setSaving(false)
    }
  }

  if (!page) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader2 className="animate-spin" style={{ color: 'rgba(222,219,200,0.4)' }} />
    </div>
  )

  return (
    <div className="bg-black min-h-screen px-6 md:px-12 py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium" style={{ color: '#E1E0CC' }}>Edit page</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#DEDBC8] text-black font-medium text-sm px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.3em] uppercase block mb-2"
            style={{ color: 'rgba(222,219,200,0.35)' }}>Title</label>
          <input
            value={page.title}
            onChange={e => setPage({ ...page, title: e.target.value })}
            className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition"
            style={{ color: '#DEDBC8' }}
          />
        </div>

        <div>
          <label className="text-[10px] tracking-[0.3em] uppercase block mb-2"
            style={{ color: 'rgba(222,219,200,0.35)' }}>Summary</label>
          <input
            value={page.summary || ''}
            onChange={e => setPage({ ...page, summary: e.target.value })}
            className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition"
            style={{ color: '#DEDBC8' }}
          />
        </div>

        <div>
          <label className="text-[10px] tracking-[0.3em] uppercase block mb-2"
            style={{ color: 'rgba(222,219,200,0.35)' }}>Content (Markdown)</label>
          <textarea
            value={page.content}
            onChange={e => setPage({ ...page, content: e.target.value })}
            rows={20}
            className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition font-mono resize-none"
            style={{ color: 'rgba(222,219,200,0.85)', lineHeight: 1.7 }}
          />
        </div>
      </div>
    </div>
  )
}
