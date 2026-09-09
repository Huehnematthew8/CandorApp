'use client';

import type { Job } from '@/types';
import WombatMascot from '@/components/ui/WombatMascot';

interface AIInsightsStripProps {
  job: Job;
  onRefine: (instruction: string) => void;
}

const INSIGHTS = [
  { label: 'Shorten by 20%', icon: '✂️' },
  { label: 'Add company values', icon: '🎯' },
  { label: 'More confident tone', icon: '💪' },
  { label: 'Add portfolio link', icon: '🔗' },
];

export default function AIInsightsStrip({ job, onRefine }: AIInsightsStripProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'linear-gradient(135deg, #5E5CE6, #7B79F7)', marginBottom: '4px' }}>
        <WombatMascot size={32} showBackground={true} />
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: '#ffffff', fontWeight: 400 }}>Wommy&apos;s Insight</span>
      </div>

      {INSIGHTS.map((ins) => (
        <button
          key={ins.label}
          onClick={() => onRefine(ins.label)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 10px',
            borderRadius: '7px',
            background: 'var(--s2)',
            border: '1px solid var(--b1)',
            color: 'var(--t2)',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all .12s',
            textAlign: 'left',
            width: '100%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.color = 'var(--t1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)'; }}
        >
          <span>{ins.icon}</span>
          {ins.label}
        </button>
      ))}

      <div style={{ height: '1px', background: 'var(--b1)', margin: '4px 0' }} />

      <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginBottom: '2px' }}>
        Context
      </div>

      <div style={{ padding: '8px 10px', borderRadius: '7px', background: 'var(--s2)', border: '1px solid var(--b1)', fontSize: '11px', color: 'var(--t3)', lineHeight: 1.5 }}>
        {job.why
          ? <span style={{ color: 'var(--t2)', fontStyle: 'italic' }}>&ldquo;{job.why.substring(0, 120)}{job.why.length > 120 ? '...' : ''}&rdquo;</span>
          : 'No "Why this role" written yet. Add one on the Overview tab to improve AI drafts.'
        }
      </div>

      {(job.contacts?.length ?? 0) > 0 && (
        <>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginTop: '4px' }}>
            Contacts
          </div>
          {job.contacts!.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderRadius: '7px', background: 'var(--s2)', border: '1px solid var(--b1)' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--glow)', border: '1px solid rgba(201,170,126,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                {c.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 500 }}>{c.name}</div>
                {c.role && <div style={{ fontSize: '10px', color: 'var(--t3)' }}>{c.role}</div>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
