'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'

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
      setError('Invalid email or password.')
    } else {
      window.location.href = '/'
    }
  }

  if (status === 'loading') {
    return (
      <div className="auth-page-root">
        <div className="auth-spinner-lg" />
      </div>
    )
  }

  return (
    <div className="auth-page-root">
      <div className="auth-glow" />
      <div className="auth-grid" />

      <div className="auth-card-wrap">
        {/* Brand */}
        <Link href="/" className="auth-brand">
          <Sparkles size={14} style={{ color: '#d4a574' }} />
          <span>NeuroWiki</span>
        </Link>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">Sign in to your personal memory agent</p>

        <div className="auth-card">
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="auth-field">
              <label htmlFor="signin-email" className="auth-label">Email</label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="auth-input"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signin-password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="signin-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="auth-input auth-input-pr"
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            <button id="signin-submit" type="submit" disabled={loading} className="auth-submit-btn">
              {loading
                ? <span className="auth-btn-spinner" />
                : <><span>Sign in</span><ArrowRight size={14} /></>
              }
            </button>
          </form>
        </div>

        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="auth-switch-link">Create one</Link>
        </p>
      </div>
    </div>
  )
}
