// Auth group layout — strips the global Topbar/Sidebar so sign-in is a clean full-page
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In · NeuroWiki',
  description: 'Sign in to NeuroWiki — your personal memory agent',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Deliberately render nothing extra — the sign-in page owns its full layout
  return <>{children}</>
}
