'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { readGenerateEmailSseStream } from '@/lib/read-generate-email-stream';
import RichEditor from '@/components/ui/RichEditor';
import type { Job } from '@/types';

interface CallPrepProps {
  job: Job;
  onBack: () => void;
  onComplete: (notes: string) => void;
}

export default function CallPrep({ job, onBack, onComplete }: CallPrepProps) {
  const { toast } = useToast();
  const [talkingPoints, setTalkingPoints] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [contactName, setContactName] = useState('');

  async function handleGenerate() {
    setGenerating(true);
    setTalkingPoints('');

    const context = [
      job.jd_summary && `Job context: ${job.jd_summary}`,
      job.why && `Interest: ${job.why}`,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          role: job.role,
          stage: job.status,
          tone: 'professional',
          why: job.why || '',
          narrative: '',
          jd_summary: job.jd_summary || '',
          refinement: `Generate TALKING POINTS for a phone/video call (not an email). Format as bullet points. Include:
1. Opening — how to introduce yourself and state purpose (2-3 bullets)
2. Key points — your relevant experience and fit (3-4 bullets)
3. Questions to ask — thoughtful questions about the role/team (2-3 bullets)
4. Closing — next steps and thank you (1-2 bullets)

${contactName ? `The call is with: ${contactName}` : ''}
${context}

Keep each bullet concise (1 sentence). Use — dashes for sub-points.`,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Generation failed');

      const reader = res.body.getReader();
      let result = '';
      const { error: streamErr } = await readGenerateEmailSseStream(reader, (delta) => {
        result += delta;
        setTalkingPoints(result);
      });
      if (streamErr) toast(streamErr);
    } catch {
      toast('AI unavailable — check your model config');
    } finally {
      setGenerating(false);
    }
  }

  function handleComplete() {
    const summary = [
      `Call Prep — ${job.company} ${job.role}`,
      contactName ? `Contact: ${contactName}` : '',
      talkingPoints ? `\nTalking Points:\n${talkingPoints}` : '',
      notes ? `\nCall Notes:\n${notes}` : '',
    ].filter(Boolean).join('\n');
    onComplete(summary);
    toast('Call prep logged');
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slidein 0.2s ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <button className="btn-icon" onClick={onBack} style={{ width: '28px', height: '28px' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="var(--gold)"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" /></svg>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px' }}>Call Prep</span>
        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>· {job.company}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', gap: '20px' }}>
        {/* Left: Talking points */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="section-label" style={{ flex: 1 }}>Talking Points</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--t3)', flexShrink: 0 }}>Calling:</span>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name (optional)"
              className="input-field"
              style={{ flex: 1, padding: '6px 10px', fontSize: '11px', borderRadius: '6px' }}
            />
            <button className="btn-gold" onClick={handleGenerate} disabled={generating} style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}>
              {generating ? (
                <><div style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Generating...</>
              ) : '✦ Generate'}
            </button>
          </div>

          {!talkingPoints && !generating ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
              <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--glow)', border: '1px solid rgba(201,170,126,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="var(--gold)"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" /></svg>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Prepare for your call</div>
                <div style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.6 }}>
                  Hit Generate to get AI-powered talking points tailored to this role.
                </div>
              </div>
            </div>
          ) : (
            <textarea
              value={talkingPoints}
              onChange={(e) => setTalkingPoints(e.target.value)}
              readOnly={generating}
              style={{ flex: 1, width: '100%', minHeight: '300px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: '8px', padding: '12px 14px', color: 'var(--t1)', fontSize: '12px', lineHeight: 1.7, resize: 'none', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          )}
        </div>

        {/* Right: Notes */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-label">Call Notes</div>
          <RichEditor
            defaultValue={notes}
            onChange={setNotes}
            placeholder="Key takeaways, next steps... (- for bullets, ⌘B to bold)"
            style={{
              flex: 1, minHeight: '250px', lineHeight: 1.7, fontSize: '12px',
              padding: '9px 11px', background: 'var(--s2)',
              border: '1px solid var(--b1)', borderRadius: '8px',
              color: 'var(--t1)', fontFamily: 'inherit',
            }}
          />

          {(job.contacts?.length ?? 0) > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: '6px', fontSize: '9px' }}>Contacts</div>
              {job.contacts!.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', background: 'var(--s2)', border: '1px solid var(--b1)', marginBottom: '4px', cursor: 'pointer', transition: 'all 0.12s ease' }} onClick={() => setContactName(c.name)}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'var(--gold)' }}>
                    {c.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 500 }}>{c.name}</div>
                    {c.role && <div style={{ fontSize: '10px', color: 'var(--t3)' }}>{c.role}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
        <button className="btn-gold" onClick={handleComplete} style={{ marginLeft: 'auto', padding: '7px 16px' }}>
          Complete &amp; Log
        </button>
      </div>
    </div>
  );
}
