'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-md p-8 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-[var(--accent)] mb-2">Candor</h1>
          <p className="text-[var(--text-muted)]">Authenticity-first job applications</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Create a password"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[var(--accent)] text-[var(--bg)] rounded-md font-medium hover:bg-[var(--accent)]/90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 px-4 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] font-medium hover:bg-[var(--surface3)] disabled:opacity-50"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full py-2 px-4 bg-[var(--surface2)] border border-[var(--border)] rounded-md text-[var(--text)] font-medium hover:bg-[var(--surface3)]"
          >
            Already have an account? Sign in
          </button>
        </div>

        <p className="mt-6 text-center text-[var(--text-muted)]">
          Already have an account?{' '}
          <a href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}