'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface JDAnalysisProps {
  jobId: string;
  fit: number;
  company: string;
  role: string;
  jdSummary?: string | null;
}

interface AnalysisResult {
  fitScore: number;
  matched: string[];
  gaps: string[];
  angle: string;
}

export default function JDAnalysis({ jobId, fit, company, role, jdSummary }: JDAnalysisProps) {
  const { updateJobFit } = useAppStore();
  const hasImported = !!jdSummary;
  const [state, setState] = useState<'empty' | 'imported' | 'input' | 'result'>(
    fit > 0 ? 'result' : (hasImported ? 'imported' : 'empty')
  );
  const [loading, setLoading] = useState(false);
  const [jd, setJd] = useState(jdSummary || '');
  const [result, setResult] = useState<AnalysisResult | null>(
    fit > 0 ? { fitScore: fit, matched: [], gaps: [], angle: '' } : null
  );
  const [error, setError] = useState('');

  async function handleAnalyse() {
    if (!jd.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/analyse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, company, role }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResult(data);
      setState('result');
      updateJobFit(jobId, data.fitScore);
    } catch {
      setError('AI analysis unavailable. Check that Ollama is running, or add an Anthropic API key.');
      setState(state === 'imported' ? 'imported' : 'input');
    } finally {
      setLoading(false);
    }
  }

  if (state === 'empty') {
    return (
      <div
        onClick={() => setState('input')}
        style={{ border: '1.5px dashed var(--b2)', borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--b3)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--b2)')}
      >
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '3px' }}>Paste the job description</div>
        <div style={{ fontSize: '11px', color: 'var(--t3)' }}>Get a fit score, keyword match, and suggested application angle</div>
        <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '8px' }}>Add JD →</div>
      </div>
    );
  }

  if (state === 'imported') {
    return (
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '10px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--glow)', border: '1px solid rgba(201,170,126,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="var(--gold)"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>JD imported from URL</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.5 }}>
              {jdSummary!.split('\n')[0].substring(0, 120)}{jdSummary!.length > 120 ? '…' : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAnalyse}
            disabled={loading}
            style={{ padding: '7px 16px', borderRadius: '100px', background: 'var(--gold)', color: '#ffffff', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s ease', display: 'flex', alignItems: 'center', gap: '5px', opacity: loading ? 0.5 : 1 }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--gold2)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(201,170,126,.25)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {loading ? (
              <><div style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Analysing...</>
            ) : (
              <><svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Analyse against my profile</>
            )}
          </button>
          <button
            onClick={() => setState('input')}
            style={{ padding: '7px 12px', borderRadius: '100px', background: 'none', color: 'var(--t3)', border: '1px solid var(--b1)', fontSize: '11px', cursor: 'pointer', transition: 'all .15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--b3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--b1)'; }}
          >
            Edit JD
          </button>
        </div>
      </div>
    );
  }

  if (state === 'input') {
    return (
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '10px', padding: '14px' }}>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={6}
          style={{ width: '100%', padding: '10px 12px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: '8px', color: 'var(--t1)', fontSize: '12px', lineHeight: 1.6, resize: 'none', outline: 'none', marginBottom: '10px' }}
        />
        {error && <div style={{ fontSize: '11px', color: 'var(--red)', marginBottom: '8px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAnalyse}
            disabled={loading || !jd.trim()}
            style={{ padding: '7px 16px', borderRadius: '100px', background: 'var(--gold)', color: '#ffffff', border: 'none', fontSize: '11px', fontWeight: 500, cursor: 'pointer', opacity: loading || !jd.trim() ? 0.5 : 1, transition: 'all .15s ease', display: 'flex', alignItems: 'center', gap: '5px' }}
            onMouseEnter={(e) => {
              if (!loading && jd.trim()) {
                e.currentTarget.style.background = 'var(--gold2)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(201,170,126,.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <><div style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Analysing...</>
            ) : 'Analyse against my profile'}
          </button>
          {hasImported && (
            <button
              onClick={() => setState('imported')}
              style={{ padding: '7px 12px', borderRadius: '100px', background: 'none', color: 'var(--t3)', border: '1px solid var(--b1)', fontSize: '11px', cursor: 'pointer', transition: 'all .15s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--b3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--b1)'; }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (result.fitScore / 100) * circumference;
  const fitColor = result.fitScore >= 80 ? 'var(--green)' : result.fitScore >= 60 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '10px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
        {/* Fit score ring — read-only, click for info */}
        <FitRing fitScore={result.fitScore} fitColor={fitColor} circumference={circumference} offset={offset} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {result.matched.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--green)', marginBottom: '4px' }}>Matched</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {result.matched.map((k) => (
                  <span key={k} style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', background: 'var(--gd)', color: 'var(--green)' }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {result.gaps.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--red)', marginBottom: '4px' }}>Gaps</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {result.gaps.map((k) => (
                  <span key={k} style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', background: 'var(--rdd)', color: 'var(--red)' }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {result.angle && (
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gold)', marginBottom: '4px' }}>Suggested angle</div>
              <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.6 }}>{result.angle}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => { setState(hasImported ? 'imported' : 'input'); setResult(null); }}
          style={{ fontSize: '10px', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color .13s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t3)')}
        >
          Re-analyse
        </button>
      </div>
    </div>
  );
}

/* ── Fit ring — read-only with info popover ───────────── */
function FitRing({ fitScore, fitColor, circumference, offset }: {
  fitScore: number; fitColor: string; circumference: number; offset: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <div
        onClick={() => setOpen(!open)}
        title="Click to see how this score is calculated"
        style={{ position: 'relative', width: '88px', height: '88px', cursor: 'pointer' }}
      >
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r="36" fill="none" stroke="var(--b1)" strokeWidth="5" />
          <circle cx="44" cy="44" r="36" fill="none" stroke={fitColor} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ animation: 'gw .7s ease both' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: fitColor, lineHeight: 1 }}>{fitScore}%</span>
          <span style={{ fontSize: '7px', color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Fit</span>
        </div>
        {/* Info dot */}
        <div style={{ position: 'absolute', top: 4, right: 4, width: '14px', height: '14px', borderRadius: '50%', background: 'var(--s2)', border: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--t3)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
        </div>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '96px', left: 0, zIndex: 50, width: '240px', background: 'var(--s1)', border: '1px solid var(--b2)', borderRadius: '10px', padding: '12px 14px', boxShadow: '0 8px 24px rgba(26,43,60,.12)', animation: 'up .15s ease both' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t1)', marginBottom: '8px' }}>How fit is calculated</div>
          {[
            { label: 'Skills & keyword match', desc: 'Your profile skills vs. JD requirements' },
            { label: 'Role & title alignment', desc: 'How closely the role matches your experience' },
            { label: 'Experience level', desc: 'Seniority match against the JD' },
            { label: 'Requirements coverage', desc: 'Percentage of must-have criteria met' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold)', marginTop: '5px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t1)' }}>{item.label}</div>
                <div style={{ fontSize: '9px', color: 'var(--t3)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--b1)', fontSize: '9px', color: 'var(--t3)', lineHeight: 1.5 }}>
            AI-generated · Re-analyse to update · Not editable
          </div>
        </div>
      )}
    </div>
  );
}
