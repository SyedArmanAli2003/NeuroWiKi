'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { WikiLinkPreview } from './WikiLinkPreview'

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

function transformWikilinks(content: string) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, name) => {
    const slug = slugify(name)
    return `[${name}](/wiki/${slug})`
  })
}

export function WikiRenderer({ content }: { content: string }) {
  const transformed = transformWikilinks(content)
  return (
    <div className="wiki-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('/wiki/')) {
              const slug = href.split('/').pop() || ''
              return (
                <WikiLinkPreview href={href} slug={slug}>
                  {children}
                </WikiLinkPreview>
              )
            }
            return (
              <a href={href || '#'} target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/20 underline-offset-4 hover:decoration-primary/80 transition-all duration-200">
                {children}
              </a>
            )
          },
        }}
      >
        {transformed}
      </ReactMarkdown>
    </div>
  )
}
