import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const productLinks = [
  { label: 'Wiki', href: '/wiki' },
  { label: 'Add Source', href: '/ingest' },
  { label: 'Search', href: '/search' },
  { label: 'Graph', href: '/graph' },
]

const resourceLinks = [
  { label: 'Documentation', href: '/docs' },
  { label: 'GitHub', href: 'https://github.com/SyedArmanAli2003/NeuroWiKi', external: true },
]

export function Footer() {
  return (
    <footer 
      className="border-t mt-auto"
      style={{ 
        background: '#09090b',
        borderColor: 'rgba(255,255,255,0.04)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-xl font-medium" style={{ color: '#f5f5f4' }}>N</span>
              <span 
                className="text-sm font-medium tracking-widest uppercase"
                style={{ color: 'rgba(245, 245, 244, 0.5)' }}
              >
                NeuroWiki
              </span>
            </Link>
            <p 
              className="text-sm leading-relaxed max-w-sm"
              style={{ color: 'rgba(245, 245, 244, 0.4)' }}
            >
              Your personal memory agent. Store, connect, and retrieve your 
              knowledge with AI-powered intelligence.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 
              className="text-[11px] font-medium tracking-wider uppercase mb-4"
              style={{ color: 'rgba(245, 245, 244, 0.3)' }}
            >
              Product
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map(link => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-[13px] transition-colors hover:text-[#f5f5f4]"
                    style={{ color: 'rgba(245, 245, 244, 0.5)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 
              className="text-[11px] font-medium tracking-wider uppercase mb-4"
              style={{ color: 'rgba(245, 245, 244, 0.3)' }}
            >
              Resources
            </h3>
            <ul className="space-y-2.5">
              {resourceLinks.map(link => (
                <li key={link.href}>
                  {link.external ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] transition-colors hover:text-[#f5f5f4]"
                      style={{ color: 'rgba(245, 245, 244, 0.5)' }}
                    >
                      {link.label}
                      <ArrowUpRight size={12} />
                    </a>
                  ) : (
                    <Link 
                      href={link.href}
                      className="text-[13px] transition-colors hover:text-[#f5f5f4]"
                      style={{ color: 'rgba(245, 245, 244, 0.5)' }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div 
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <p className="text-[11px]" style={{ color: 'rgba(245, 245, 244, 0.25)' }}>
            Built with Hydra DB and AI
          </p>
          <p className="text-[11px] text-center" style={{ color: 'rgba(245, 245, 244, 0.25)' }}>
            &copy; {new Date().getFullYear()} NeuroWiki. Your knowledge. Your control.
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(245, 245, 244, 0.25)' }}>
            MIT License
          </p>
        </div>
      </div>
    </footer>
  )
}
