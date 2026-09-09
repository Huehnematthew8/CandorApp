'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import NextActionCard from './NextActionCard';
import JDAnalysis from './JDAnalysis';
import NotesSection from './NotesSection';
import RichEditor from '@/components/ui/RichEditor';
import type { Job } from '@/types';
import { daysSince, formatShortDate } from '@/lib/utils';

interface OverviewTabProps {
  job: Job;
  onSwitchToActivity: () => void;
}

export default function OverviewTab({ job, onSwitchToActivity }: OverviewTabProps) {
  const { updateJobWhy } = useAppStore();
  const [jdExpanded, setJdExpanded] = useState(false);
  const days = daysSince(job.applied_at);
  const showFollowUp = job.status === 'applied' && days !== null && days >= 10;

  function handleWhyBlur(html: string) {
    if (html !== (job.why || '')) updateJobWhy(job.id, html);
  }

  // Short JD preview (first 280 chars)
  const jdPreview = job.jd_summary ? job.jd_summary.substring(0, 280) : '';
  const jdLong = job.jd_summary && job.jd_summary.length > 280;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 36px', display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Metadata chips ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        <StatusBadge status={job.status} />

        {job.applied_at ? (
          <MetaChip>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Applied {formatShortDate(job.applied_at)}{days !== null ? ` · ${days}d ago` : ''}
          </MetaChip>
        ) : (
          <MetaChip muted>Not yet applied</MetaChip>
        )}

        {job.location && (
          <MetaChip>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {job.location}
          </MetaChip>
        )}

        {job.salary && (
          <MetaChip accent>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            {job.salary}
          </MetaChip>
        )}
      </div>

      {/* ── Next action ─────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <NextActionCard job={job} onAction={onSwitchToActivity} />
      </div>

      {/* ── Follow-up reminder ──────────────────────────────── */}
      {showFollowUp && (
        <div
          onClick={onSwitchToActivity}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'var(--ad)', border: '1px solid rgba(214,144,92,.2)', fontSize: '11px', color: 'var(--amber)', cursor: 'pointer', marginBottom: '20px', transition: 'all 0.15s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(214,144,92,.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ad)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          {days} days since you applied.&nbsp;<span style={{ textDecoration: 'underline' }}>Send a follow-up →</span>
        </div>
      )}

      {/* ══ Role Intelligence ══════════════════════════════════ */}
      <Divider label="Role intelligence" />

      {/* JD Summary */}
      {job.jd_summary ? (
        <div style={{ marginTop: '10px', marginBottom: '6px' }}>
          <JDSummaryBlock text={jdExpanded ? job.jd_summary : jdPreview} />
          {jdLong && (
            <button
              onClick={() => setJdExpanded(!jdExpanded)}
              style={{ marginTop: '4px', fontSize: '10px', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              {jdExpanded ? '↑ Show less' : '↓ Show more'}
            </button>
          )}
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--gold)', flexShrink: 0 }}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span style={{ fontSize: '9px', color: 'var(--t3)', fontWeight: 500 }}>Imported · used by AI when drafting communications</span>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '10px', marginBottom: '4px', padding: '12px', borderRadius: '8px', border: '1.5px dashed var(--b2)', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--t3)', lineHeight: 1.6 }}>
            No job description yet. Paste the job URL in the top bar to auto-import role details and improve AI accuracy.
          </div>
        </div>
      )}

      {/* Fit analysis */}
      <div style={{ marginTop: '10px', marginBottom: '20px' }}>
        <JDAnalysis jobId={job.id} fit={job.fit} company={job.company} role={job.role} jdSummary={job.jd_summary} />
      </div>

      {/* ══ Why this role ════════════════════════════════════ */}
      <Divider label="Why this role" />

      <div style={{ marginTop: '12px', marginBottom: '20px' }}>
        <RichEditor
          key={job.id}
          defaultValue={job.why || ''}
          onBlur={handleWhyBlur}
          placeholder="What draws you to this opportunity? Be honest — this context shapes every communication Candor drafts for you."
          style={{
            fontSize: '13px',
            color: 'var(--t1)',
            lineHeight: 1.75,
            minHeight: '56px',
            padding: '2px 0',
          }}
        />
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--gold)', flexShrink: 0 }}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span style={{ fontSize: '9px', color: 'var(--t3)', fontWeight: 500 }}>Used by AI to personalise cover letters and emails</span>
        </div>
      </div>

      {/* ══ Notes & AI context ═══════════════════════════════ */}
      <Divider label="Notes" />
      <div style={{ marginTop: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--gold)', flexShrink: 0 }}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <span style={{ fontSize: '9px', color: 'var(--t3)', fontWeight: 500 }}>Notes are included by AI when drafting your communications</span>
      </div>

      <div style={{ marginTop: '0' }}>
        <NotesSection jobId={job.id} notes={job.notes} />
      </div>
    </div>
  );
}

/* ── Shared sub-components ──────────────────────────────────── */

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--b1)' }} />
    </div>
  );
}

/* ── JD Summary renderer with bold headers ──────────────────── */
function JDSummaryBlock({ text }: { text: string }) {
  const HEADER_PATTERNS = [
    'Key requirements',
    'Nice to have',
    'Benefits',
    'Team',
    'Reports to',
    'Type',
    'Level',
    'About the company',
    'Tech stack',
    'Culture',
    'Description',
  ];

  const lines = text.split('\n');
  return (
    <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.75 }}>
      {lines.map((line, i) => {
        // Check if line starts with a known header pattern
        const matchedHeader = HEADER_PATTERNS.find((h) =>
          line.trim().toLowerCase().startsWith(h.toLowerCase() + ':')
        );
        if (matchedHeader) {
          const rest = line.trim().slice(matchedHeader.length + 1).trim();
          return (
            <div key={i} style={{ marginBottom: '2px' }}>
              <strong style={{ fontWeight: 700, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '11px' }}>
                {matchedHeader}:
              </strong>{' '}
              <span>{rest}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} style={{ height: '4px' }} />;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

function MetaChip({ children, accent, muted }: { children: React.ReactNode; accent?: boolean; muted?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 9px',
      borderRadius: '100px',
      background: accent ? 'rgba(94,92,230,0.08)' : 'var(--s2)',
      border: `1px solid ${accent ? 'rgba(94,92,230,0.18)' : 'var(--b1)'}`,
      fontSize: '11px',
      color: accent ? 'var(--gold)' : muted ? 'var(--t3)' : 'var(--t2)',
      fontWeight: accent ? 500 : 400,
    }}>
      {children}
    </div>
  );
}
