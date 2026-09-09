'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import ParticleCanvas from '@/components/ui/ParticleCanvas';
import WombatMascot from '@/components/ui/WombatMascot';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
        <ParticleCanvas />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px', padding: '0 24px', textAlign: 'center', animation: 'up 0.4s ease both' }}>
          <div style={{ margin: '0 auto 20px', display: 'flex', justifyContent: 'center' }}><WombatMascot size={64} showBackground={true} /></div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '26px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-.03em' }}>Check your email</h2>
          <p style={{ color: 'var(--t2)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.65, fontWeight: 300 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--t1)', fontWeight: 500 }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" style={{ color: 'var(--gold)', fontSize: '12px', textDecoration: 'none', fontWeight: 500 }}>← Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px', padding: '0 24px', animation: 'up 0.5s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <WombatMascot size={72} showBackground={true} />
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '34px', fontWeight: 800, letterSpacing: '-.04em', margin: 0 }}>Candor</h1>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: '13px', fontWeight: 300 }}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="input-field" style={{ height: '42px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="input-field" style={{ height: '42px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: '6px' }}>Confirm password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" className="input-field" style={{ height: '42px' }} />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: 'var(--red)', padding: '7px 10px', background: 'var(--rdd)', borderRadius: '7px', border: '1px solid rgba(196,96,96,.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold"
            style={{ height: '42px', justifyContent: 'center', borderRadius: '100px', fontSize: '13px', marginTop: '4px', gap: '8px' }}
          >
            {loading ? (
              <>
                <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: 'var(--t3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
