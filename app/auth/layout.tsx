import type { Metadata } from 'next'
import { SessionProvider } from '@/components/auth/SessionProvider'

export const metadata: Metadata = {
  title: 'Sign In · NeuroWiki',
  description: 'Sign in to your NeuroWiki account',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
