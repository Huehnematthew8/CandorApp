'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { ToastProvider } from '@/components/ui/Toast';
import WombatMascot from '@/components/ui/WombatMascot';

function SettingsInner() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      setLoading(false);
    });
  }, [supabase, router]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });
    setSaving(false);
    if (error) { toast('Failed to save'); return; }
    toast('Settings saved');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-ghost"
          style={{ padding: '6px 10px', fontSize: '11px' }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M15 19l-7-7 7-7" /></svg>
          Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WombatMascot size={24} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 700, letterSpacing: '-.02em' }}>Settings</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Account section */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-label" style={{ marginBottom: '16px' }}>Account</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: '4px', display: 'block' }}>Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: '4px', display: 'block' }}>Email</label>
              <input
                value={email}
                disabled
                className="input-field"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '4px' }}>Email cannot be changed here</div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button className="btn-gold" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-label" style={{ marginBottom: '16px' }}>Quick links</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SettingsLink
              label="My Story / Profile"
              description="Your professional narrative used by AI for drafts"
              onClick={() => router.push('/story')}
              icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>}
            />
            <SettingsLink
              label="Dashboard"
              description="Back to your job applications"
              onClick={() => router.push('/dashboard')}
              icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
            />
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <div className="section-label" style={{ marginBottom: '16px', color: 'var(--red)' }}>Account</div>
          <button
            onClick={handleSignOut}
            style={{
              padding: '10px 16px',
              background: 'var(--rdd)',
              color: 'var(--red)',
              border: '1px solid rgba(231,76,60,.2)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(231,76,60,.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--rdd)'; }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsLink({ label, description, onClick, icon }: {
  label: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="card-interactive"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        width: '100%',
        textAlign: 'left',
        background: 'var(--s1)',
      }}
    >
      <div style={{ color: 'var(--gold)', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t1)' }}>{label}</div>
        <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{description}</div>
      </div>
      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="var(--t3)" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M9 5l7 7-7 7" /></svg>
    </button>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsInner />
    </ToastProvider>
  );
}
