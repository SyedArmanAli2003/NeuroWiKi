import { WikiRenderer } from '@/components/WikiRenderer'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { StickyTitle } from '@/components/StickyTitle'
import { WikiEditAgent } from '@/components/WikiEditAgent'
import { WikiActionsMenu } from '@/components/WikiActionsMenu'
import { resolveSlugAlias } from '@/lib/db-helpers'

const TYPE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  concept:      { color: '#C7B8FF', bg: 'rgba(199,184,255,0.07)', border: 'rgba(199,184,255,0.22)' },
  person:       { color: '#9BDCAA', bg: 'rgba(155,220,170,0.07)', border: 'rgba(155,220,170,0.22)' },
  place:        { color: '#F4C77B', bg: 'rgba(244,199,123,0.07)', border: 'rgba(244,199,123,0.22)' },
  event:        { color: '#F49B9B', bg: 'rgba(244,155,155,0.07)', border: 'rgba(244,155,155,0.22)' },
  tool:         { color: '#7BD0E8', bg: 'rgba(123,208,232,0.07)', border: 'rgba(123,208,232,0.22)' },
  organization: { color: '#B4B0F0', bg: 'rgba(180,176,240,0.07)', border: 'rgba(180,176,240,0.22)' },
  diary:        { color: '#DEDBC8', bg: 'rgba(222,219,200,0.05)', border: 'rgba(222,219,200,0.16)' },
}

function TypePill({ type }: { type: string }) {
  const tc = TYPE_COLORS[type] ?? TYPE_COLORS.concept
  return (
    <span
      className="rounded capitalize"
      style={{
        padding: '3px 10px',
        fontSize: 'var(--fs-micro)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: tc.color,
        background: tc.bg,
        border: `1px solid ${tc.border}`,
      }}
    >
      {type}
    </span>
  )
}

function readingTime(content: string): string {
  const words = content.split(/\s+/).length
  const mins = Math.max(1, Math.ceil(words / 200))
  return `~${mins} min read`
}

function extractHeadings(content: string) {
  const lines = content.split('\n')
  return lines
    .filter((l) => l.startsWith('## ') || l.startsWith('### '))
    .map((l) => ({
      level: l.startsWith('### ') ? 3 : 2,
      text: l.replace(/^#{2,3}\s/, ''),
      id: l.replace(/^#{2,3}\s/, '').toLowerCase().replace(/\s+/g, '-'),
    }))
}

async function getPage(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/wiki/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function getChildren(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/wiki/${slug}/children`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.children ?? []
  } catch { return [] }
}

function SidebarSection({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="kicker kicker-rule" style={{ marginBottom: '14px' }}>{kicker}</p>
      {children}
    </div>
  )
}

function SidebarLink({ href, label, type }: { href: string; label: string; type?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 py-2 group transition-colors duration-150"
    >
      {type && <TypePill type={type} />}
      <span
        className="group-hover:text-white transition-colors"
        style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-soft)', letterSpacing: '-0.003em' }}
      >
        {label}
      </span>
    </Link>
  )
}

export default async function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [data, children] = await Promise.all([getPage(slug), getChildren(slug)])
  if (!data) {
    const aliasTarget = resolveSlugAlias(slug)
    if (aliasTarget && aliasTarget !== slug) redirect(`/wiki/${aliasTarget}`)
    notFound()
  }

  const { page, relatedPages = [], backlinks = [] } = data
  const headings = extractHeadings(page.content)

  return (
    <div className="app-canvas min-h-screen" style={{ background: '#000' }}>
      <StickyTitle title={page.title} />

      <div className="mx-auto px-7 lg:px-10" style={{ maxWidth: '1200px' }}>
        {/* Hero */}
        <header style={{ paddingTop: '72px', paddingBottom: '32px', borderBottom: '1px solid var(--hair)' }}>
          <div className="flex items-start justify-between gap-6 mb-6">
            <TypePill type={page.type} />
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Link
                href={`/wiki/${page.slug}/edit`}
                className="rounded-full transition-all duration-200 hover:bg-white/[0.04]"
                style={{
                  padding: '6px 14px',
                  fontSize: 'var(--fs-kicker)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-mute)',
                  border: '1px solid var(--hair)',
                }}
              >
                ✎ Edit
              </Link>
              <WikiEditAgent slug={page.slug} title={page.title} type={page.type} currentContent={page.content} />
              <WikiActionsMenu slug={page.slug} title={page.title} />
            </div>
          </div>

          <h1
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'var(--ink-strong)',
              marginBottom: '16px',
            }}
          >
            {page.title}
          </h1>

          <p className="serif" style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-mute)', letterSpacing: 0 }}>
            {readingTime(page.content)}
          </p>

          {page.summary && (
            <p
              className="serif"
              style={{
                fontSize: 'var(--fs-quote)',
                lineHeight: 1.45,
                color: 'var(--ink-soft)',
                letterSpacing: '-0.005em',
                marginTop: '24px',
                maxWidth: '58ch',
              }}
            >
              {page.summary}
            </p>
          )}
        </header>

        {/* Two column body */}
        <div
          className="grid gap-12 py-12"
          style={{ gridTemplateColumns: '1fr', alignItems: 'start' }}
        >
          {/* Mobile sidebar — collapsed */}
          <div className="lg:hidden flex flex-col gap-2 mb-8">
            {headings.length > 1 && (
              <details style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surface)' }}>
                <summary className="kicker" style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', userSelect: 'none' }}>
                  Contents · {headings.length}
                </summary>
                <div className="flex flex-col gap-1.5" style={{ padding: '4px 14px 12px' }}>
                  {headings.map((h) => (
                    <a key={h.id} href={`#${h.id}`} style={{
                      fontSize: 'var(--fs-body-sm)', color: 'var(--ink-mute)',
                      paddingLeft: h.level === 3 ? '14px' : '0',
                    }}>{h.text}</a>
                  ))}
                </div>
              </details>
            )}
            {children?.length > 0 && (
              <details style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surface)' }}>
                <summary className="kicker" style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', userSelect: 'none' }}>
                  Pages in this topic · {children.length}
                </summary>
                <div className="flex flex-col" style={{ padding: '4px 14px 10px' }}>
                  {children.map((c: { slug: string; title: string; type: string }) => (
                    <SidebarLink key={c.slug} href={`/wiki/${c.slug}`} label={c.title} type={c.type} />
                  ))}
                </div>
              </details>
            )}
            {relatedPages?.length > 0 && (
              <details style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surface)' }}>
                <summary className="kicker" style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', userSelect: 'none' }}>
                  Related · {relatedPages.length}
                </summary>
                <div className="flex flex-col" style={{ padding: '4px 14px 10px' }}>
                  {relatedPages.map((r: { slug: string; title: string; type: string }) => (
                    <SidebarLink key={r.slug} href={`/wiki/${r.slug}`} label={r.title} type={r.type} />
                  ))}
                </div>
              </details>
            )}
            {backlinks?.length > 0 && (
              <details style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surface)' }}>
                <summary className="kicker" style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--ink-soft)', userSelect: 'none' }}>
                  Referenced by · {backlinks.length}
                </summary>
                <div className="flex flex-col gap-1.5" style={{ padding: '4px 14px 10px' }}>
                  {backlinks.map((b: { slug: string; title: string }) => (
                    <Link key={b.slug} href={`/wiki/${b.slug}`} style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-mute)' }}>← {b.title}</Link>
                  ))}
                </div>
              </details>
            )}
          </div>

          <div className="lg:grid lg:gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
            {/* Main content */}
            <article style={{ minWidth: 0 }}>
              <div className="wiki-prose-enhanced">
                {page.content?.trim() ? (
                  <WikiRenderer content={page.content} />
                ) : (
                  <div
                    className="serif"
                    style={{
                      padding: '32px',
                      border: '1px dashed var(--hair)',
                      borderRadius: '6px',
                      color: 'var(--ink-mute)',
                      fontSize: 'var(--fs-body-sm)',
                      lineHeight: 1.6,
                    }}
                  >
                    This page has no content yet. It may have been created as a stub from a wikilink or an enrichment pass that failed. Re-ingest the source or use <span style={{ color: 'var(--ink-soft)' }}>Edit with AI</span> to fill it in.
                  </div>
                )}
              </div>

              {/* Sources */}
              {page.sources?.length > 0 && (
                <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--hair)' }}>
                  <p className="kicker kicker-rule mb-4">Built from</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {page.sources.map((s: { title: string; url?: string }, i: number) => (
                      <span
                        key={i}
                        className="rounded-full"
                        style={{
                          padding: '4px 11px',
                          fontSize: 'var(--fs-kicker)',
                          color: 'var(--ink-soft)',
                          background: 'var(--surface)',
                          border: '1px solid var(--hair)',
                        }}
                      >
                        {s.title || 'Source'}
                      </span>
                    ))}
                  </div>

                  {page.sources.some((s: { raw_content?: string }) => s.raw_content) && (
                    <div className="flex flex-col gap-3">
                      {page.sources.map((s: { title: string; raw_content?: string }, i: number) => (
                        s.raw_content ? (
                          <details
                            key={i}
                            style={{
                              border: '1px solid var(--hair)',
                              borderRadius: '6px',
                              background: 'var(--surface)',
                            }}
                          >
                            <summary
                              className="kicker"
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                color: 'var(--ink-soft)',
                                userSelect: 'none',
                              }}
                            >
                              View raw source — {s.title || 'Source'} ({s.raw_content.length.toLocaleString()} chars)
                            </summary>
                            <pre
                              className="serif"
                              style={{
                                padding: '16px 18px',
                                borderTop: '1px solid var(--hair)',
                                fontSize: 'var(--fs-body-sm)',
                                lineHeight: 1.7,
                                color: 'var(--ink-soft)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '60vh',
                                overflowY: 'auto',
                                fontFamily: 'inherit',
                              }}
                            >
                              {s.raw_content}
                            </pre>
                          </details>
                        ) : null
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col gap-8 lg:sticky lg:top-24 h-fit">
              {headings.length > 1 && (
                <SidebarSection kicker="Contents">
                  <div className="flex flex-col gap-1.5">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="transition-opacity hover:opacity-100"
                        style={{
                          fontSize: 'var(--fs-body-sm)',
                          color: 'var(--ink-mute)',
                          paddingLeft: h.level === 3 ? '14px' : '0',
                          letterSpacing: '-0.003em',
                          lineHeight: 1.5,
                        }}
                      >
                        {h.text}
                      </a>
                    ))}
                  </div>
                </SidebarSection>
              )}

              {children?.length > 0 && (
                <SidebarSection kicker="Pages in this topic">
                  <div className="flex flex-col">
                    {children.map((c: { slug: string; title: string; type: string }) => (
                      <SidebarLink key={c.slug} href={`/wiki/${c.slug}`} label={c.title} type={c.type} />
                    ))}
                  </div>
                </SidebarSection>
              )}

              {relatedPages?.length > 0 && (
                <SidebarSection kicker="Related pages">
                  <div className="flex flex-col">
                    {relatedPages.map((r: { slug: string; title: string; type: string }) => (
                      <SidebarLink key={r.slug} href={`/wiki/${r.slug}`} label={r.title} type={r.type} />
                    ))}
                  </div>
                </SidebarSection>
              )}

              {backlinks?.length > 0 && (
                <SidebarSection kicker="Referenced by">
                  <div className="flex flex-col gap-1.5">
                    {backlinks.map((b: { slug: string; title: string }) => (
                      <Link
                        key={b.slug}
                        href={`/wiki/${b.slug}`}
                        className="transition-opacity hover:opacity-100"
                        style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-mute)', letterSpacing: '-0.003em' }}
                      >
                        ← {b.title}
                      </Link>
                    ))}
                  </div>
                </SidebarSection>
              )}

              <SidebarSection kicker="Last updated">
                <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-soft)' }}>
                  {(() => {
                    const d = new Date(page.created_at)
                    return page.created_at && !isNaN(d.getTime())
                      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'
                  })()}
                </p>
              </SidebarSection>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
