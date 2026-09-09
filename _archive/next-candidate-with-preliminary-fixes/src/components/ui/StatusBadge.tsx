'use client';

import type { JobStatus } from '@/types';

export const STATUS_LABELS: Record<JobStatus, string> = {
  found: 'Found', saved: 'Saved', researching: 'Researching', ready: 'Ready to apply',
  applied: 'Applied', screening: 'Screening', interviewing: 'Interviewing', interview: 'Interview',
  round1: 'Round 1', round2: 'Round 2', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn', closed: 'Closed / unavailable',
};
export const STATUS_COLOURS: Record<JobStatus, string> = {
  found: 'var(--t2)', saved: 'var(--t2)', researching: 'var(--purple)', ready: 'var(--blue)',
  applied: 'var(--blue)', screening: 'var(--teal)', interviewing: 'var(--amber)', interview: 'var(--amber)',
  round1: 'var(--amber)', round2: 'var(--purple)', offer: 'var(--green)', rejected: 'var(--red)', withdrawn: 'var(--t3)', closed: 'var(--t3)',
};
export const STATUS_ORDER: JobStatus[] = ['found', 'saved', 'researching', 'ready', 'applied', 'screening', 'interviewing', 'interview', 'round1', 'round2', 'offer', 'rejected', 'withdrawn', 'closed'];

export function StatusBadge({ status }: { status: JobStatus }) {
  return <span style={{ display: 'inline-block', padding: '4px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'var(--s2)', color: STATUS_COLOURS[status] || 'var(--t2)' }}>{STATUS_LABELS[status] || status}</span>;
}

export function StatusDropdown({ status, onChange, label = 'Application status' }: { status: JobStatus; onChange: (s: JobStatus) => void; label?: string }) {
  return <select aria-label={label} value={status} onChange={(e) => onChange(e.target.value as JobStatus)} className="input-field" style={{ width: 'auto', maxWidth: '100%', minHeight: 38, color: STATUS_COLOURS[status] }}>
    {STATUS_ORDER.map((s) => <option value={s} key={s}>{STATUS_LABELS[s]}</option>)}
  </select>;
}

export function StatusSequence(props: { status: JobStatus; onChange: (s: JobStatus) => void }) {
  return <StatusDropdown {...props} />;
}
