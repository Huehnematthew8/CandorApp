'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ParticleCanvas from '@/components/ui/ParticleCanvas';
import WombatMascot from '@/components/ui/WombatMascot';

const LOADING_MESSAGES = [
  'Signing you in…',
  'Loading your applications…',
  'Almost there…',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingMsg(LOADING_MESSAGES[0]);

    // cycle through messages while waiting
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, LOADING_MESSAGES.length - 1);
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 900);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    clearInterval(msgInterval);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoadingMsg('Setting up your workspace…');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas />

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(238,240,245,0.95)',
          backdropFilter: 'blur(6px)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px',
          animation: 'fade .2s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '4px' }}>
            <WombatMascot size={42} style={{ marginRight: '-4px' }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--t1)' }}>Candor</span>
          </div>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <p style={{ fontSize: '13px', color: 'var(--t1)', animation: 'fade .3s ease both' }}>{loadingMsg}</p>
        </div>
      )}

      {/* Form */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px', padding: '0 24px', animation: 'up 0.5s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <WombatMascot size={80} showBackground={true} />
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '34px', fontWeight: 800, letterSpacing: '-.04em', margin: 0 }}>Candor</h1>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: '13px', fontWeight: 300 }}>Apply with intention, not volume.</p>
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
            Sign in
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: 'var(--t3)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
