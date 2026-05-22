import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { HoverSidebar } from '@/components/layout/HoverSidebar'
import { BackButton } from '@/components/layout/BackButton'
import { Topbar } from '@/components/layout/Topbar'
import { PageTransition } from '@/components/PageTransition'
import { Footer } from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'NeuroWiki — Your Personal Memory Agent',
  description: 'An AI-powered personal knowledge base that stores, connects, and retrieves your memories intelligently.',
  keywords: ['memory', 'AI', 'knowledge base', 'personal wiki', 'second brain'],
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="bg-[#09090b] text-[#f5f5f4] antialiased">
        <HoverSidebar />
        <Topbar />
        <BackButton />
        <main className="min-h-screen flex flex-col">
          <PageTransition>
            <div className="flex-1">
              {children}
            </div>
          </PageTransition>
          <Footer />
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#f5f5f4',
              fontSize: '13px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            },
          }}
        />
      </body>
    </html>
  )
}
