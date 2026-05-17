import type { Metadata } from 'next'
import './globals.css'
import { HoverSidebar } from '@/components/layout/HoverSidebar'

export const metadata: Metadata = {
  title: 'NeuroWiki',
  description: 'Your personal AI-powered Wikipedia',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <HoverSidebar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
