'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const { status } = useSession()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      router.push('/')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-[#d4a574] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Subtle radial glow — same as landing hero */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(212,165,116,0.08) 0%, transparent 70%)' }}
      />

      {/* Grid overlay — same as landing page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">

        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Sparkles size={16} style={{ color: '#d4a574' }} />
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(245,245,244,0.5)' }}>
            NeuroWiki
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-3xl font-medium tracking-tight text-center mb-2"
          style={{ color: '#f5f5f4', letterSpacing: '-0.025em' }}
        >
          Welcome back
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: 'rgba(245,245,244,0.4)' }}>
          Sign in to your personal memory agent
        </p>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(245,245,244,0.4)' }}>
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f5f5f4',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(212,165,116,0.4)'
                  e.target.style.background = 'rgba(212,165,116,0.04)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.08)'
                  e.target.style.background = 'rgba(255,255,255,0.04)'
                }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(245,245,244,0.4)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all duration-150"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f5f5f4',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(212,165,116,0.4)'
                    e.target.style.background = 'rgba(212,165,116,0.04)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.08)'
                    e.target.style.background = 'rgba(255,255,255,0.04)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(245,245,244,0.35)' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                role="alert"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs mt-5" style={{ color: 'rgba(245,245,244,0.25)' }}>
          Demo &mdash;{' '}
          <code className="rounded px-1 py-0.5" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(212,165,116,0.8)' }}>
            admin@neurowiki.ai
          </code>{' '}
          /{' '}
          <code className="rounded px-1 py-0.5" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(212,165,116,0.8)' }}>
            neurowiki2024
          </code>
        </p>
      </div>
    </div>
  )
}
