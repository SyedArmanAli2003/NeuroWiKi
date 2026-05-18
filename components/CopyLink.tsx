'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { toast } from 'sonner'

export function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/wiki/${slug}`)
    setCopied(true)
    toast.success('Link copied')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 text-[10px] hover:opacity-100 transition-opacity"
      style={{ color: 'rgba(222,219,200,0.3)' }}>
      {copied ? <Check size={11} /> : <Link2 size={11} />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}
