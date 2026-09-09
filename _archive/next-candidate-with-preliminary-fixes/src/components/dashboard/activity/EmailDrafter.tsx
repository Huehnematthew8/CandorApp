'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { readGenerateEmailSseStream } from '@/lib/read-generate-email-stream';
import type { Job, Stage, Tone } from '@/types';

interface EmailDrafterProps {
  job: Job;
  stage: Stage | null;
  onBack?: () => void;
  onSent: (subject: string, body: string) => void;
}

const TONES: { label: string; value: Tone }[] = [
  { label: 'Professional', value: 'professional' },
  { label: 'Warm', value: 'warm' },
  { label: 'Assertive', value: 'assertive' },
  { label: 'Enthusiastic', value: 'enthusiastic' },
  { label: 'Grateful', value: 'grateful' },
];

export default function EmailDrafter({ job, stage, onBack, onSent }: EmailDrafterProps) {
  const { toast } = useToast();
  const [tone, setTone] = useState<Tone>('professional');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<'choose' | 'write' | 'ai'>('choose');
  const [personScore, setPersonScore] = useState(0);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (body.length > 50) {
      const companyMentions = (body.toLowerCase().match(new RegExp(job.company.toLowerCase(), 'g')) || []).length;
      const hasRole = body.toLowerCase().includes(job.role.toLowerCase());
      setPersonScore(Math.min(100, 30 + companyMentions * 15 + (hasRole ? 20 : 0) + Math.min(body.length / 20, 35)));
    } else {
      setPersonScore(0);
    }
  }, [body, job.company, job.role]);

  async function handleGenerate() {
    setMode('ai');
    setStreaming(true);
    setBody('');

    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          role: job.role,
          stage: job.status,
          tone,
          why: job.why || '',
          narrative: '',
          jd_summary: job.jd_summary || '',
          refinement: [
            subject ? `Subject context: ${subject}` : null,
            job.notes?.length ? `Additional context from my notes: ${job.notes.slice(0, 3).map((n) => n.html.replace(/<[^>]*>/g, '')).join(' | ')}` : null,
          ].filter(Boolean).join('\n') || undefined,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Generation failed');

      const reader = res.body.getReader();
      let result = '';
      const { error: streamErr } = await readGenerateEmailSseStream(reader, (delta) => {
        result += delta;
        setBody(result);
      });
      if (streamErr) toast(streamErr);
    } catch {
      toast('AI unavailable — check your model config');
    } finally {
      setStreaming(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(body);
    toast('Copied to clipboard');
  }

  function handleSendAndLog() {
    onSent(subject || `Email — ${job.company}`, body);
    toast('Email logged');
  }

  // ── Mode chooser (initial state) ─────────────────────────
  if (mode === 'choose' && !body && !streaming) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
          {onBack && (
            <button className="btn-icon" onClick={onBack} style={{ width: '28px', height: '28px', marginRight: '2px' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4.25-8 5-8-5V6l8 5 8-5v2.25z" />
          </svg>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 700 }}>Email Draft</span>
          <span style={{ fontSize: '11px', color: 'var(--t3)' }}>· {job.company} — {job.role}</span>
        </div>

        {/* Tone bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderBottom: '1px solid var(--b1)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 500, flexShrink: 0 }}>Tone:</span>
          {TONES.map((t) => (
            <button key={t.value} className={`pill${tone === t.value ? ' active' : ''}`} onClick={() => setTone(t.value)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Context bar */}
        {(job.jd_summary || job.why) && (
          <div style={{ padding: '7px 18px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--gold)"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span style={{ fontSize: '10px', color: 'var(--t3)' }}>
              Using: {[job.jd_summary && 'JD context', job.why && 'why this role'].filter(Boolean).join(' + ')}
            </span>
          </div>
        )}

        {/* Choose mode */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '4px', textAlign: 'center', color: 'var(--t1)' }}>
              How would you like to start?
            </div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '20px', textAlign: 'center' }}>
              You can switch between writing and AI assistance at any time.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Write yourself */}
              <StartCard
                title="Write yourself"
                desc="Start from scratch. Candor can refine or regenerate at any point."
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                }
                onClick={() => setMode('write')}
              />
              {/* AI generate */}
              <StartCard
                title="Generate with AI"
                desc="Candor drafts a tailored email using your job context and chosen tone."
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                onClick={handleGenerate}
                primary
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Composer (write or AI result) ────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stage + tone bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderBottom: '1px solid var(--b1)', flexWrap: 'wrap' }}>
        {onBack && (
          <button className="btn-icon" onClick={onBack} style={{ width: '28px', height: '28px', marginRight: '4px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}
        {stage && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '100px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', border: '1px solid var(--gold)', color: 'var(--gold)', background: 'var(--glow)' }}>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--gold)' }} />
            {stage.name}
          </span>
        )}
        <div style={{ height: '14px', width: '1px', background: 'var(--b2)' }} />
        <span style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 500 }}>Tone:</span>
        {TONES.map((t) => (
          <button key={t.value} className={`pill${tone === t.value ? ' active' : ''}`} onClick={() => setTone(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* JD context bar */}
      {job.jd_summary && (
        <div style={{ padding: '6px 18px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--gold)"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span style={{ fontSize: '10px', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.jd_summary.split('\n')[0].substring(0, 100)}
          </span>
        </div>
      )}

      {/* To/Subject */}
      <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--b1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--t3)', width: '42px', flexShrink: 0 }}>To</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={`recruiter@${job.company.toLowerCase().replace(/\s/g, '')}.com`} className="input-field" style={{ padding: '4px 8px', fontSize: '11px', border: 'none', background: 'transparent', borderRadius: 0 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--t3)', width: '42px', flexShrink: 0 }}>Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={`Application – ${job.role}`} className="input-field" style={{ padding: '4px 8px', fontSize: '11px', border: 'none', background: 'transparent', borderRadius: 0 }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px' }}>
        {streaming && !body ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--t3)', fontSize: '12px', padding: '20px 0' }}>
            <div style={{ width: '12px', height: '12px', border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            Drafting your email…
          </div>
        ) : (
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mode === 'write' ? `Hi [Name],\n\nI'm reaching out regarding the ${job.role} role at ${job.company}…` : ''}
            style={{ width: '100%', height: '100%', minHeight: '200px', background: 'transparent', border: 'none', color: 'var(--t1)', fontSize: '13px', lineHeight: 1.7, resize: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
            readOnly={streaming}
            autoFocus={mode === 'write'}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
        <button className="btn-gold" onClick={handleGenerate} disabled={streaming} style={{ fontSize: '11px', padding: '6px 12px' }}>
          {streaming ? (
            <><div style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Generating…</>
          ) : body ? '✦ Regenerate' : '✦ Generate'}
        </button>
        {body && (
          <button className="btn-ghost" onClick={handleCopy} style={{ padding: '6px 12px' }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            Copy
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {wordCount > 0 && <span style={{ fontSize: '10px', color: 'var(--t3)' }}>{wordCount} words</span>}
          {personScore > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '48px', height: '3px', borderRadius: '2px', background: 'var(--b1)', overflow: 'hidden' }}>
                <div style={{ width: `${personScore}%`, height: '100%', borderRadius: '2px', background: personScore >= 70 ? 'var(--green)' : personScore >= 40 ? 'var(--amber)' : 'var(--red)', transition: 'width .3s' }} />
              </div>
              <span style={{ fontSize: '9px', color: 'var(--t3)' }}>Personalisation</span>
            </div>
          )}
          <button className="btn-gold" onClick={handleSendAndLog} disabled={streaming || !body.trim()} style={{ padding: '6px 14px' }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            Send &amp; Log
          </button>
        </div>
      </div>
    </div>
  );
}

function StartCard({ title, desc, icon, onClick, primary }: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '18px 14px',
        borderRadius: '12px',
        border: `1px solid ${hovered ? 'var(--gold)' : primary ? 'rgba(94,92,230,0.25)' : 'var(--b2)'}`,
        background: hovered ? 'var(--glow)' : primary ? 'rgba(94,92,230,0.06)' : 'var(--s2)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 6px 20px rgba(94,92,230,.10)' : 'none',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: hovered ? 'rgba(94,92,230,0.15)' : primary ? 'rgba(94,92,230,0.10)' : 'var(--s3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered || primary ? 'var(--gold)' : 'var(--t3)',
        transition: 'all 0.15s ease',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'var(--t3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </button>
  );
}
