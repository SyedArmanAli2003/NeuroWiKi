import { WikiRenderer } from '@/components/WikiRenderer'
import { TypeBadge } from '@/components/TypeBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyLink } from '@/components/CopyLink'
import { StickyTitle } from '@/components/StickyTitle'
import { WikiEditAgent } from '@/components/WikiEditAgent'

function readingTime(content: string): string {
  const words = content.split(/\s+/).length
  const mins = Math.ceil(words / 200)
  return `~${mins} min read`
}

function extractHeadings(content: string) {
  const lines = content.split('\n')
  return lines
    .filter(l => l.startsWith('## ') || l.startsWith('### '))
    .map(l => ({
      level: l.startsWith('### ') ? 3 : 2,
      text: l.replace(/^#{2,3}\s/, ''),
      id: l.replace(/^#{2,3}\s/, '').toLowerCase().replace(/\s+/g, '-'),
    }))
}

async function getPage(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/wiki/${slug}`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getChildren(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/wiki/${slug}/children`, {
      cache: 'no-store'
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.children ?? []
  } catch {
    return []
  }
}

export default async function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [data, children] = await Promise.all([getPage(slug), getChildren(slug)])
  if (!data) notFound()

  const { page, relatedPages = [], backlinks = [] } = data
  const headings = extractHeadings(page.content)

  return (
    <div className="bg-black min-h-screen relative">
      <StickyTitle title={page.title} />
      
      {/* Hero bar */}
      <div className="pt-24 pb-12 px-8 md:px-16 border-b border-white/5">
        <div className="mb-3 flex items-center justify-between">
          <TypeBadge type={page.type} />
          <div className="flex items-center gap-3">
            <Link href={`/wiki/${page.slug}/edit`}
              className="text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 transition"
              style={{ color: 'rgba(222,219,200,0.4)' }}>
              Edit page
            </Link>
            <WikiEditAgent
              slug={page.slug}
              title={page.title}
              type={page.type}
              currentContent={page.content}
            />
            <CopyLink slug={slug} />
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-medium leading-[0.9]"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: '#E1E0CC' }}>
            {page.title}
          </h1>
        </div>
        
        <span className="text-[10px] block mb-4" style={{ color: 'rgba(222,219,200,0.3)' }}>
          {readingTime(page.content)}
        </span>
        
        {page.summary && (
          <p className="font-serif-italic text-lg max-w-2xl" style={{ color: 'rgba(222,219,200,0.55)' }}>
            {page.summary}
          </p>
        )}
      </div>

      {/* Two column layout */}
      <div className="px-8 md:px-16 py-12 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12">

        {/* Main content */}
        <div>
          <WikiRenderer content={page.content} />

          {/* Sources */}
          {page.sources?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="text-[9px] tracking-[0.3em] uppercase mb-4" style={{ color: 'rgba(222,219,200,0.3)' }}>
                Built From
              </p>
              <div className="flex flex-wrap gap-2">
                {page.sources.map((s: { title: string; url?: string }, i: number) => (
                  <span key={i} className="bg-[#181818] rounded-full px-3 py-1 text-[10px]"
                    style={{ color: 'rgba(222,219,200,0.5)' }}>
                    {s.title || 'Source'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-8 h-fit">
          {headings.length > 1 && (
            <div className="mb-8">
              <p className="text-[9px] tracking-[0.3em] uppercase mb-3"
                style={{ color: 'rgba(222,219,200,0.3)' }}>Contents</p>
              <div className="space-y-1.5">
                {headings.map(h => (
                  <a key={h.id} href={`#${h.id}`}
                    className="block text-[11px] hover:opacity-100 transition-opacity"
                    style={{
                      color: 'rgba(222,219,200,0.45)',
                      paddingLeft: h.level === 3 ? '0.75rem' : '0',
                    }}>
                    {h.text}
                  </a>
                ))}
              </div>
            </div>
          )}

          {children?.length > 0 && (
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(222,219,200,0.3)' }}>
                Pages in this topic
              </p>
              <div className="space-y-2">
                {children.map((c: { slug: string; title: string; type: string }) => (
                  <Link key={c.slug} href={`/wiki/${c.slug}`}
                    className="flex items-center gap-2 py-1.5 group">
                    <TypeBadge type={c.type} />
                    <span className="text-[11px] transition-opacity group-hover:opacity-100"
                      style={{ color: 'rgba(222,219,200,0.5)' }}>
                      {c.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {relatedPages?.length > 0 && (
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(222,219,200,0.3)' }}>
                Related Pages
              </p>
              <div className="space-y-2">
                {relatedPages.map((r: { slug: string; title: string; type: string }) => (
                  <Link key={r.slug} href={`/wiki/${r.slug}`}
                    className="flex items-center gap-2 py-1.5 group">
                    <TypeBadge type={r.type} />
                    <span className="text-[11px] transition-opacity group-hover:opacity-100"
                      style={{ color: 'rgba(222,219,200,0.5)' }}>
                      {r.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {backlinks?.length > 0 && (
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(222,219,200,0.3)' }}>
                Referenced By
              </p>
              <div className="space-y-1.5">
                {backlinks.map((b: { slug: string; title: string }) => (
                  <Link key={b.slug} href={`/wiki/${b.slug}`}
                    className="block text-[11px] transition-opacity hover:opacity-100"
                    style={{ color: 'rgba(222,219,200,0.45)' }}>
                    ← {b.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(222,219,200,0.3)' }}>
              Last Updated
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(222,219,200,0.4)' }}>
              {(() => { const d = new Date(page.created_at); return page.created_at && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
