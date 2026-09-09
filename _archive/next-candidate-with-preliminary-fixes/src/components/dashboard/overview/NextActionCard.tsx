'use client';

import type { Job } from '@/types';
import { daysSince } from '@/lib/utils';

interface NextActionCardProps {
  job: Job;
  onAction: () => void;
}

export default function NextActionCard({ job, onAction }: NextActionCardProps) {
  const days = daysSince(job.applied_at);
  let message = '', button = '', show = false;

  switch (job.status) {
    case 'saved':
      message = "You haven't applied yet. Ready to write your cover letter?";
      button = 'Draft now'; show = true; break;
    case 'applied':
      if (days !== null && days >= 10) {
        message = `${days} days since you applied — time to send a follow-up.`;
        button = 'Draft follow-up'; show = true;
      } break;
    case 'interview': case 'round1': case 'round2':
      message = 'Interview stage — review your notes and prep a thank you email.';
      button = 'View activity'; show = true; break;
    case 'offer':
      message = 'You have an offer. Time to negotiate or confirm.';
      button = 'Draft response'; show = true; break;
  }

  if (!show) return null;

  return (
    <div style={{ background: 'var(--glow2)', border: '1px solid rgba(201,170,126,.14)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '13px' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--glow)', border: '1px solid rgba(201,170,126,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="var(--gold)">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gold)', marginBottom: '2px' }}>Next action</div>
        <div style={{ fontSize: '12px', color: 'var(--t1)', lineHeight: 1.5 }}>{message}</div>
      </div>
      <button
        onClick={onAction}
        style={{ padding: '7px 14px', borderRadius: '100px', background: 'var(--gold)', color: '#ffffff', border: 'none', fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all .15s ease', whiteSpace: 'nowrap', flexShrink: 0 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--gold2)';
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(201,170,126,.25)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--gold)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      >
        {button}
      </button>
    </div>
  );
}
