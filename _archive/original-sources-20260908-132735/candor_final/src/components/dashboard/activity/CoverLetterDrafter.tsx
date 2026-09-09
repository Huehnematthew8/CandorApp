'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { readGenerateEmailSseStream } from '@/lib/read-generate-email-stream';
import type { Job, Tone } from '@/types';

interface CoverLetterDrafterProps {
  job: Job;
  onBack: () => void;
  onSent: (subject: string, body: string) => void;
}

const TONES: { label: string; value: Tone }[] = [
  { label: 'Professional', value: 'professional' },
  { label: 'Warm', value: 'warm' },
  { label: 'Assertive', value: 'assertive' },
  { label: 'Enthusiastic', value: 'enthusiastic' },
];

export default function CoverLetterDrafter({ job, onBack, onSent }: CoverLetterDrafterProps) {
  const { toast } = useToast();
  const [tone, setTone] = useState<Tone>('professional');
  const [recipientName, setRecipientName] = useState('Hiring Manager');
  const [recipientTitle, setRecipientTitle] = useState('');
  const [body, setBody] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState<'choose' | 'write' | 'ai'>('choose');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  async function handleGenerate() {
    setMode('ai');
    setStreaming(true);
    setBody('');

    const context = [
      job.jd_summary && `Job context: ${job.jd_summary}`,
      job.why && `Why this role: ${job.why}`,
      job.notes?.length && `My notes: ${job.notes.slice(0, 3).map((n) => n.html.replace(/<[^>]*>/g, '')).join(' | ')}`,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          role: job.role,
          stage: 'saved',
          tone,
          why: job.why || '',
          narrative: '',
          jd_summary: job.jd_summary || '',
          refinement: `Write a FORMAL COVER LETTER (not email). Include: opening paragraph explaining interest, 2 body paragraphs connecting experience to requirements, closing with call to action. Address to ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ''}. ${context}`,
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
    toast('Cover letter copied to clipboard');
  }

  function handleSendAndLog() {
    onSent(`Cover Letter — ${job.company} ${job.role}`, body);
    toast('Cover letter logged');
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Cover Letter - ${job.company}</title>
      <style>body{font-family:Georgia,serif;max-width:650px;margin:40px auto;font-size:14px;line-height:1.8;color:#222;}
      .header{margin-bottom:32px;}.date{color:#666;margin-bottom:16px;}.recipient{margin-bottom:24px;line-height:1.6;}
      .body{white-space:pre-wrap;}.closing{margin-top:32px;}</style></head>
      <body><div class="header"><div class="date">${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="recipient">${recipientName}${recipientTitle ? '<br>' + recipientTitle : ''}<br>${job.company}</div></div>
      <div class="body">${body}</div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  // ── Mode chooser (initial state) ──────────────────────────
  if (mode === 'choose' && !body && !streaming) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
          <button className="btn-icon" onClick={onBack} style={{ width: '28px', height: '28px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 1.5L19.5 8H14V3.5z" />
          </svg>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 700 }}>Cover Letter</span>
          <span style={{ fontSize: '11px', color: 'var(--t3)' }}>· {job.company} — {job.role}</span>
        </div>

        {/* Tone bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderBottom: '1px solid var(--b1)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 500, flexShrink: 0 }}>Tone:</span>
          {TONES.map((t) => (
            <button key={t.value} className={`pill${tone === t.value ? ' active' : ''}`} onClick={() => setTone(t.value)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Context bar */}
        {(job.jd_summary || job.why) && (
          <div style={{ padding: '7px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--gold)"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span style={{ fontSize: '10px', color: 'var(--t3)' }}>
              Using: {[job.jd_summary && 'JD context', job.why && 'why this role'].filter(Boolean).join(' + ')}
            </span>
          </div>
        )}

        {/* Choose mode */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '4px', textAlign: 'center' }}>How would you like to start?</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '20px', textAlign: 'center' }}>You can refine or regenerate at any point.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <CoverStartCard
                title="Write yourself"
                desc="Draft your own letter — Candor can polish or regenerate later."
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>}
                onClick={() => setMode('write')}
              />
              <CoverStartCard
                title="Generate with AI"
                desc="Candor writes a full letter using your context and chosen tone."
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                onClick={handleGenerate}
                primary
              />
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'var(--s2)', border: '1px solid var(--b1)' }}>
              <span style={{ fontSize: '10px', color: 'var(--t3)' }}>Addressed to:</span>
              <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Hiring Manager" className="input-field" style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} />
              <input value={recipientTitle} onChange={(e) => setRecipientTitle(e.target.value)} placeholder="Title (optional)" className="input-field" style={{ flex: 1, padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slidein 0.2s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <button className="btn-icon" onClick={onBack} style={{ width: '28px', height: '28px' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 1.5L19.5 8H14V3.5z" /></svg>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 700 }}>Cover Letter</span>
        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>· {job.company} — {job.role}</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {body && (
            <button className="btn-ghost" onClick={() => setShowPreview(!showPreview)} style={{ padding: '5px 10px' }}>
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          )}
        </div>
      </div>

      {/* Tone + recipient */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderBottom: '1px solid var(--b1)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 500 }}>Tone:</span>
        {TONES.map((t) => (
          <button key={t.value} className={`pill${tone === t.value ? ' active' : ''}`} onClick={() => setTone(t.value)}>
            {t.label}
          </button>
        ))}
        <div style={{ height: '16px', width: '1px', background: 'var(--b2)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--t3)' }}>To:</span>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Hiring Manager"
            className="input-field"
            style={{ width: '140px', padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
          />
          <input
            value={recipientTitle}
            onChange={(e) => setRecipientTitle(e.target.value)}
            placeholder="Title (optional)"
            className="input-field"
            style={{ width: '130px', padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* JD context bar */}
      {job.jd_summary && (
        <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gold)', flexShrink: 0 }}>JD Context</span>
          <span style={{ fontSize: '10px', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.jd_summary.split('\n')[0].substring(0, 120)}
          </span>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {streaming && !body ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--t3)', fontSize: '12px', padding: '20px 0' }}>
            <div style={{ width: '12px', height: '12px', border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            Drafting your cover letter…
          </div>
        ) : showPreview ? (
          <div style={{ maxWidth: '620px', margin: '0 auto', padding: '32px 40px', background: '#fefefe', borderRadius: '4px', color: '#222', fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.8, boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
            <div style={{ marginBottom: '24px', color: '#666' }}>
              {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ marginBottom: '20px', lineHeight: 1.6 }}>
              {recipientName}{recipientTitle && <><br />{recipientTitle}</>}<br />{job.company}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{body}</div>
          </div>
        ) : (
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mode === 'write' ? `Dear ${recipientName},\n\nI am writing to express my interest in the ${job.role} role at ${job.company}…` : ''}
            style={{ width: '100%', height: '100%', minHeight: '240px', background: 'transparent', border: 'none', color: 'var(--t1)', fontSize: '13px', lineHeight: 1.75, resize: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", maxWidth: '640px' }}
            readOnly={streaming}
            autoFocus={mode === 'write' && !body}
          />
        )}
      </div>

      {/* Bottom bar */}
      {(body || streaming) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
          <button className="btn-gold" onClick={handleGenerate} disabled={streaming} style={{ fontSize: '11px', padding: '6px 12px' }}>
            {streaming ? (
              <><div style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Generating...</>
            ) : '✦ Regenerate'}
          </button>
          <button className="btn-ghost" onClick={handleCopy} style={{ padding: '6px 12px' }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            Copy
          </button>
          <button className="btn-ghost" onClick={handlePrint} style={{ padding: '6px 12px' }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
            Export PDF
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {wordCount > 0 && <span style={{ fontSize: '10px', color: 'var(--t3)' }}>{wordCount} words</span>}
            <button className="btn-gold" onClick={handleSendAndLog} disabled={streaming || !body.trim()} style={{ padding: '6px 14px' }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              Send &amp; Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CoverStartCard({ title, desc, icon, onClick, primary }: {
  title: string; desc: string; icon: React.ReactNode; onClick: () => void; primary?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '18px 14px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        border: `1px solid ${hovered ? 'var(--gold)' : primary ? 'rgba(94,92,230,0.25)' : 'var(--b2)'}`,
        background: hovered ? 'var(--glow)' : primary ? 'rgba(94,92,230,0.06)' : 'var(--s2)',
        cursor: 'pointer', transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 6px 20px rgba(94,92,230,.10)' : 'none',
      }}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: hovered ? 'rgba(94,92,230,0.15)' : primary ? 'rgba(94,92,230,0.10)' : 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: hovered || primary ? 'var(--gold)' : 'var(--t3)', transition: 'all 0.15s ease' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'var(--t3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </button>
  );
}
