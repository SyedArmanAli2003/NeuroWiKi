'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)

  // Password strength
  const pwStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
  const pwOk     = password.length >= 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!pwOk) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error ?? 'Registration failed.')
      return
    }

    // Auto sign-in after registration
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (result?.error) {
      router.push('/auth/signin')
    } else {
      window.location.href = '/'
    }
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

        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-subheading">Start building your personal knowledge base</p>

        <div className="auth-card">
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {/* Name */}
            <div className="auth-field">
              <label htmlFor="signup-name" className="auth-label">Full name</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                className="auth-input"
              />
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="signup-email" className="auth-label">Email</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="auth-input"
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="signup-password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="signup-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                  className="auth-input auth-input-pr"
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="auth-pw-strength">
                  <div className={`auth-pw-bar ${pwStrong ? 'auth-pw-strong' : pwOk ? 'auth-pw-ok' : 'auth-pw-weak'}`} />
                  <span className="auth-pw-label">
                    {pwStrong ? 'Strong' : pwOk ? 'Good — add uppercase & numbers' : 'Too short'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="auth-field">
              <label htmlFor="signup-confirm" className="auth-label">Confirm password</label>
              <div className="auth-input-wrap">
                <input
                  id="signup-confirm"
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  autoComplete="new-password"
                  className="auth-input auth-input-pr"
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowConf(v => !v)} aria-label="Toggle confirm">
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {confirm.length > 0 && password === confirm && (
                  <CheckCircle2 size={15} className="auth-check-icon" />
                )}
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            <button id="signup-submit" type="submit" disabled={loading} className="auth-submit-btn">
              {loading
                ? <span className="auth-btn-spinner" />
                : <><span>Create account</span><ArrowRight size={14} /></>
              }
            </button>
          </form>
        </div>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link href="/auth/signin" className="auth-switch-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
