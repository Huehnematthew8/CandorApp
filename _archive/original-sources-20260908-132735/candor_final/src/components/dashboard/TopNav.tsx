'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import WombatMascot from '@/components/ui/WombatMascot';
import { daysSince } from '@/lib/utils';

interface TopNavProps {
  onAddJob: () => void;
  onAddGroup: () => void;
  onImportUrl: (url: string) => Promise<void>;
  onBulkImport: () => void;
  importing: boolean;
  groupCount: number;
}

/* ── Gmail scan row type ── */
type GmailRow = {
  jobId: string;
  company: string;
  role: string;
  logo: string;
  insight: string;
  action: 'follow-up' | 'update-status' | 'log-activity';
  newStatus?: string;
  daysSince: number;
  status: 'checking' | 'found' | 'skipped';
};

export default function TopNav({ onAddJob, onAddGroup, onImportUrl, onBulkImport, importing, groupCount }: TopNavProps) {
  const { selectJob, getAllJobs, addInteraction, updateJobStatus } = useAppStore();
  const { toast } = useToast();
  const [urlInput, setUrlInput] = useState('');
  const [urlFocused, setUrlFocused] = useState(false);
  const [showGmailOverlay, setShowGmailOverlay] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gmailRows, setGmailRows] = useState<GmailRow[]>([]);
  const [gmailDone, setGmailDone] = useState(false);
  const [applyingUpdates, setApplyingUpdates] = useState(false);
  const [userInitials, setUserInitials] = useState('');
  const avRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Fetch user initials from auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata;
      const name = meta?.full_name || meta?.name || user.email || '';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        setUserInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
      } else if (parts[0]) {
        setUserInitials(parts[0].slice(0, 2).toUpperCase());
      }
    });
  }, [supabase]);

  const jobs = getAllJobs();
  const savedCount = jobs.filter((j) => j.status === 'saved').length;
  const appliedCount = jobs.filter((j) =>
    ['applied', 'screening', 'interview', 'round1', 'round2'].includes(j.status)
  ).length;
  const interviewCount = jobs.filter((j) =>
    ['interview', 'round1', 'round2'].includes(j.status)
  ).length;
  const offerCount = jobs.filter((j) => j.status === 'offer').length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avRef.current && !avRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  function handleGmail() {
    setShowGmailOverlay(true);
    setGmailDone(false);
    setGmailRows([]);
    runSmartScan();
  }

  function runSmartScan() {
    const allJobs = getAllJobs();
    const activeJobs = allJobs.filter((j) =>
      ['applied', 'screening', 'interview', 'round1', 'round2'].includes(j.status)
    );

    // Build insight rows for active jobs
    const rawRows: GmailRow[] = activeJobs.map((j) => {
      const interactions = j.interactions || [];
      const lastInteraction = interactions[0]; // sorted newest first
      const lastDate = lastInteraction?.interacted_at || j.applied_at;
      const days = daysSince(lastDate) ?? 999;

      let insight = '';
      let action: GmailRow['action'] = 'follow-up';
      let newStatus: string | undefined;

      if (j.status === 'applied' && days >= 14) {
        insight = `No reply in ${days} days. Consider sending a follow-up.`;
        action = 'follow-up';
      } else if (j.status === 'applied' && days >= 7) {
        insight = `Applied ${days} days ago — good time to follow up.`;
        action = 'follow-up';
      } else if (j.status === 'screening') {
        insight = 'Screening stage — log your latest update.';
        action = 'log-activity';
      } else if (j.status === 'interview') {
        insight = 'Interview in progress — track your prep notes.';
        action = 'log-activity';
      } else if (j.status === 'round1' || j.status === 'round2') {
        const round = j.status === 'round1' ? '1' : '2';
        insight = `Round ${round} stage — keep momentum, log your latest.`;
        action = 'log-activity';
      } else {
        insight = `Active application, ${days}d since last activity.`;
        action = 'log-activity';
      }

      return {
        jobId: j.id,
        company: j.company,
        role: j.role,
        logo: j.logo || '🏢',
        insight,
        action,
        newStatus,
        daysSince: days,
        status: 'checking' as const,
      };
    });

    // Limit to 5 most actionable (prioritise older with no activity)
    const sorted = rawRows.sort((a, b) => b.daysSince - a.daysSince).slice(0, 5);

    if (sorted.length === 0) {
      setGmailRows([]);
      setGmailDone(true);
      return;
    }

    setGmailRows(sorted);

    // Animate each row sequentially
    sorted.forEach((_, i) => {
      setTimeout(() => {
        setGmailRows((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'found' as const } : r
          )
        );
        if (i === sorted.length - 1) {
          setTimeout(() => setGmailDone(true), 350);
        }
      }, (i + 1) * 400);
    });
  }

  async function handleApplyUpdates() {
    setApplyingUpdates(true);
    const followUpRows = gmailRows.filter((r) => r.action === 'follow-up' && r.status === 'found');
    for (const row of followUpRows) {
      await addInteraction(row.jobId, {
        channel: 'note' as const,
        subject: 'Follow-up reminder',
        body: `Candor Activity Scan: ${row.insight}`,
      });
    }
    setApplyingUpdates(false);
    setShowGmailOverlay(false);
    toast(`Activity scan logged — ${followUpRows.length} follow-up reminder${followUpRows.length !== 1 ? 's' : ''} added`);
  }

  async function handleImport() {
    const raw = urlInput.trim();
    if (!raw) return;
    try {
      const u = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
      if (!u.hostname.includes('.')) throw new Error('invalid');
    } catch {
      toast('Please enter a valid job listing URL');
      return;
    }
    await onImportUrl(raw.startsWith('http') ? raw : 'https://' + raw);
    setUrlInput('');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const followUpCount = gmailRows.filter((r) => r.action === 'follow-up' && r.status === 'found').length;

  return (
    <>
      <nav
        style={{
          height: '52px',
          borderBottom: '1px solid var(--b1)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '10px',
          flexShrink: 0,
          background: 'var(--bg)',
          zIndex: 20,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        {/* Brand */}
        <a
          onClick={() => selectJob(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '0px', cursor: 'pointer', textDecoration: 'none', flexShrink: 0, padding: '4px 0' }}
        >
          <WombatMascot size={42} style={{ marginRight: '-4px' }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--t1)' }}>Candor</span>
        </a>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', background: 'var(--b1)', flexShrink: 0 }} />

        {/* URL import bar */}
        <div
          style={{
            flex: 1,
            maxWidth: '420px',
            display: 'flex',
            alignItems: 'center',
            background: importing ? 'var(--gold3)' : (urlFocused ? 'var(--s2)' : 'var(--s1)'),
            border: '1px solid ' + (importing ? 'rgba(94,92,230,0.4)' : urlFocused ? 'var(--b3)' : 'var(--b1)'),
            borderRadius: '8px',
            overflow: 'hidden',
            transition: 'border-color .2s ease, background .2s ease',
            animation: importing ? 'import-pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px 0 10px', color: importing ? 'var(--gold)' : 'var(--t3)', flexShrink: 0 }}>
            {importing ? (
              <div style={{ width: '12px', height: '12px', border: '1.5px solid rgba(94,92,230,0.25)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .75s linear infinite', flexShrink: 0 }} />
            ) : (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !importing && handleImport()}
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setUrlFocused(false)}
            placeholder={importing ? 'Fetching job details…' : 'Paste a job URL to import'}
            disabled={importing}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: importing ? 'var(--gold)' : 'var(--t1)',
              fontSize: '11px',
              padding: '7px 0',
              outline: 'none',
            }}
          />
          {importing && (
            <span style={{ fontSize: '10px', color: 'var(--gold)', paddingRight: '10px', flexShrink: 0, fontWeight: 600 }}>
              Importing…
            </span>
          )}
          {urlInput.trim() && !importing && (
            <button
              onClick={handleImport}
              style={{
                padding: '5px 10px',
                margin: '3px 3px 3px 0',
                background: 'var(--gold)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all .15s ease',
              }}
            >
              Import
            </button>
          )}
        </div>

        {/* Bulk import */}
        <button
          onClick={onBulkImport}
          title="Bulk import jobs"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 9px', borderRadius: '7px', flexShrink: 0,
            border: '1px solid var(--b1)', background: 'transparent',
            color: 'var(--t3)', fontSize: '10px', fontWeight: 500,
            cursor: 'pointer', transition: 'all .15s ease', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(94,92,230,.25)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--glow2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Bulk import
        </button>

        {/* Right section */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '6px' }}>
            <Stat dot="var(--t3)" count={savedCount} label="Saved" />
            <Stat dot="var(--blue)" count={appliedCount} label="Applied" />
            <Stat dot="var(--amber)" count={interviewCount} label="Interviews" />
            <Stat dot="var(--green)" count={offerCount} label="Offers" />
          </div>

          <div style={{ width: '1px', height: '18px', background: 'var(--b1)', margin: '0 4px', flexShrink: 0 }} />

          {/* Activity Scan */}
          <NavButton
            onClick={handleGmail}
            icon={
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.012-.13-1.995-.382-2.932z" />
              </svg>
            }
            label="Scan"
          />

          {/* Groups */}
          <NavButton
            onClick={onAddGroup}
            icon={
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z" />
              </svg>
            }
            label="Groups"
            badge={groupCount > 0 ? groupCount : undefined}
          />

          <div style={{ width: '1px', height: '18px', background: 'var(--b1)', margin: '0 4px', flexShrink: 0 }} />

          {/* Add Job — primary CTA */}
          <button
            onClick={onAddJob}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 12px',
              borderRadius: '7px',
              background: 'var(--gold)',
              color: '#ffffff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .15s cubic-bezier(.16,1,.3,1)',
              flexShrink: 0,
              letterSpacing: '-.01em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gold2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 3px 10px rgba(94,92,230,.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          >
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>

          {/* Avatar */}
          <div ref={avRef} style={{ position: 'relative', marginLeft: '4px' }}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold), var(--purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all .15s ease',
                border: '2px solid transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {userInitials || '??'}
            </div>
            {showDropdown && (
              <div className="dropdown-menu" style={{ position: 'absolute', top: '34px', right: 0, minWidth: '160px', zIndex: 100 }}>
                <button className="dropdown-item" onClick={() => { setShowDropdown(false); router.push('/story'); }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                  My Story
                </button>
                <div style={{ height: '1px', background: 'var(--b1)', margin: '2px 4px' }} />
                <button className="dropdown-item" onClick={() => { setShowDropdown(false); router.push('/settings'); }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                  Settings
                </button>
                <div style={{ height: '1px', background: 'var(--b1)', margin: '2px 4px' }} />
                <button className="dropdown-item" onClick={() => { setShowDropdown(false); handleSignOut(); }} style={{ color: 'var(--t3)' }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Activity Scan overlay */}
      {showGmailOverlay && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGmailOverlay(false); }}>
          <div className="modal-content" style={{ width: '460px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--glow)', border: '1px solid rgba(94,92,230,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="var(--gold)">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.012-.13-1.995-.382-2.932z" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '17px', fontWeight: 700, lineHeight: 1.2, color: 'var(--t1)' }}>Activity Scan</div>
                <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '2px' }}>Reviewing your active applications for follow-up opportunities</div>
              </div>
            </div>

            {/* Rows */}
            {gmailRows.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                {gmailRows.map((row, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--s2)',
                    border: '1px solid var(--b1)',
                    animation: 'up .2s ease both',
                    animationDelay: `${i * 0.06}s`,
                    opacity: row.status === 'checking' ? 0.65 : 1,
                    transition: 'opacity .3s ease',
                  }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{row.logo}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t1)' }}>{row.company}</span>
                        <span style={{ fontSize: '10px', color: 'var(--t3)' }}>·</span>
                        <span style={{ fontSize: '10px', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{row.role}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--t2)', lineHeight: 1.4 }}>{row.insight}</div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {row.status === 'checking' ? (
                        <div style={{ width: '10px', height: '10px', border: '1.5px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                      ) : (
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: '100px',
                          fontSize: '9px',
                          fontWeight: 600,
                          background: row.action === 'follow-up' ? 'var(--ad)' : 'var(--glow)',
                          color: row.action === 'follow-up' ? 'var(--amber)' : 'var(--gold)',
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                        }}>
                          {row.action === 'follow-up' ? 'Follow up' : 'Active'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : gmailDone ? (
              <div style={{ textAlign: 'center', padding: '24px', marginBottom: '14px', color: 'var(--t3)', fontSize: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                <div style={{ fontWeight: 600, color: 'var(--t1)', marginBottom: '4px' }}>All caught up!</div>
                <div>No active applications need immediate attention.</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', marginBottom: '14px', color: 'var(--t3)', fontSize: '12px' }}>
                <div style={{ width: '18px', height: '18px', border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
                Scanning your applications…
              </div>
            )}

            {/* Summary card */}
            {gmailDone && gmailRows.length > 0 && (
              <div style={{
                background: 'var(--glow)',
                border: '1px solid rgba(94,92,230,.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                animation: 'up .2s ease both',
              }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gold)', marginBottom: '6px' }}>Summary</div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <SummaryChip
                    count={gmailRows.filter((r) => r.action === 'follow-up').length}
                    label="Need follow-up"
                    color="var(--amber)"
                  />
                  <SummaryChip
                    count={gmailRows.filter((r) => r.action === 'log-activity').length}
                    label="Active stages"
                    color="var(--gold)"
                  />
                  <SummaryChip
                    count={gmailRows.filter((r) => r.daysSince >= 14).length}
                    label="14+ days idle"
                    color="var(--red)"
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowGmailOverlay(false)}>Dismiss</button>
              {gmailDone && followUpCount > 0 && (
                <button
                  className="btn-gold"
                  onClick={handleApplyUpdates}
                  disabled={applyingUpdates}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {applyingUpdates && <span style={{ width: '10px', height: '10px', border: '1.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />}
                  Log {followUpCount} follow-up reminder{followUpCount !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SummaryChip({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
      <span style={{ fontSize: '18px', fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{count}</span>
      <span style={{ fontSize: '9px', color: 'var(--t3)', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function NavButton({ onClick, icon, label, active, activeColor, badge }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        background: 'transparent',
        border: 'none',
        color: active ? activeColor : 'var(--t3)',
        fontSize: '10px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all .15s cubic-bezier(.16,1,.3,1)',
        flexShrink: 0,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--s2)';
        e.currentTarget.style.color = active ? activeColor! : 'var(--t1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = active ? activeColor! : 'var(--t3)';
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.95)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && (
        <span style={{ fontSize: '9px', color: 'var(--t3)', marginLeft: '-1px' }}>{badge}</span>
      )}
    </button>
  );
}

function Stat({ dot, count, label }: { dot: string; count: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--t3)' }}>
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <span style={{ color: 'var(--t1)', fontWeight: 500, fontSize: '11px' }}>{count}</span>
      <span>{label}</span>
    </div>
  );
}
