'use client';

import { useState, useRef, useEffect } from 'react';
import type { JobStatus } from '@/types';

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  round1: 'Round 1',
  round2: 'Round 2',
  offer: 'Offer',
  rejected: 'Rejected',
};

const STATUS_COLOURS: Record<JobStatus, string> = {
  saved: 'var(--t3)',
  applied: 'var(--blue)',
  screening: 'var(--teal)',
  interview: 'var(--amber)',
  round1: 'var(--amber)',
  round2: 'var(--purple)',
  offer: 'var(--green)',
  rejected: 'var(--red)',
};

const STATUS_CLASS: Record<JobStatus, string> = {
  saved: 'sb-saved',
  applied: 'sb-applied',
  screening: 'sb-screening',
  interview: 'sb-interview',
  round1: 'sb-round1',
  round2: 'sb-round2',
  offer: 'sb-offer',
  rejected: 'sb-rejected',
};

const STATUS_BG: Record<string, { bg: string }> = {
  'sb-saved': { bg: 'var(--s3)' },
  'sb-applied': { bg: 'var(--bd)' },
  'sb-screening': { bg: 'var(--td)' },
  'sb-interview': { bg: 'var(--ad)' },
  'sb-round1': { bg: 'var(--ad)' },
  'sb-round2': { bg: 'var(--pd)' },
  'sb-offer': { bg: 'var(--gd)' },
  'sb-rejected': { bg: 'var(--rdd)' },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const cls = STATUS_CLASS[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 8px',
        borderRadius: '100px',
        fontSize: '9px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        whiteSpace: 'nowrap',
        background: STATUS_BG[cls]?.bg,
        color: STATUS_COLOURS[status],
      }}
    >
      <span
        style={{
          width: '3px',
          height: '3px',
          borderRadius: '50%',
          background: 'currentColor',
        }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

const STATUS_ORDER: JobStatus[] = [
  'saved', 'applied', 'screening', 'interview', 'round1', 'round2', 'offer', 'rejected',
];

export function StatusDropdown({
  status,
  onChange,
}: {
  status: JobStatus;
  onChange: (s: JobStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelect(s: JobStatus) {
    onChange(s);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px 5px 8px',
          borderRadius: '100px',
          border: '1px solid ' + (open ? 'var(--gold)' : 'var(--b2)'),
          background: open ? 'var(--s1)' : 'var(--s2)',
          color: 'var(--t1)',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--b3)';
            e.currentTarget.style.background = 'var(--s3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--b2)';
            e.currentTarget.style.background = 'var(--s2)';
          }
        }}
      >
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: STATUS_COLOURS[status], flexShrink: 0 }} />
        {STATUS_LABELS[status]}
        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--t3)"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .15s ease', marginLeft: '1px' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          right: 0,
          minWidth: '140px',
          background: 'var(--s1)',
          border: '1px solid var(--b3)',
          borderRadius: '10px',
          padding: '4px',
          boxShadow: '0 12px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04)',
          zIndex: 50,
          animation: 'dropdown-in .15s ease both',
        }}>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 10px',
                borderRadius: '7px',
                background: s === status ? 'var(--s3)' : 'none',
                border: 'none',
                color: s === status ? 'var(--t1)' : 'var(--t2)',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .1s ease',
              }}
              onMouseEnter={(e) => {
                if (s !== status) {
                  e.currentTarget.style.background = 'var(--s2)';
                  e.currentTarget.style.color = 'var(--t1)';
                }
              }}
              onMouseLeave={(e) => {
                if (s !== status) {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'var(--t2)';
                }
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLOURS[s], flexShrink: 0 }} />
              {STATUS_LABELS[s]}
              {s === status && (
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--gold)" style={{ marginLeft: 'auto' }}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatusSequence({
  status,
  onChange,
}: {
  status: JobStatus;
  onChange: (s: JobStatus) => void;
}) {
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
      {STATUS_ORDER.map((s, i) => {
        const isCurrent = s === status;
        const isPast = i < currentIdx;
        const color = STATUS_COLOURS[s];
        const bgMap: Record<string, string> = {
          saved: 'var(--s3)',
          applied: 'var(--bd)',
          screening: 'var(--td)',
          interview: 'var(--ad)',
          round1: 'var(--ad)',
          round2: 'var(--pd)',
          offer: 'var(--gd)',
          rejected: 'var(--rdd)',
        };

        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '100px',
              fontSize: '10px',
              fontWeight: isCurrent ? 700 : 500,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all .15s ease',
              border: `1px solid ${isCurrent ? color : isPast ? 'transparent' : 'var(--b1)'}`,
              background: isCurrent ? bgMap[s] : isPast ? 'transparent' : 'transparent',
              color: isCurrent ? color : isPast ? 'var(--t3)' : 'var(--t3)',
              opacity: isPast ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.color = color;
                e.currentTarget.style.background = bgMap[s];
                e.currentTarget.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) {
                e.currentTarget.style.borderColor = isPast ? 'transparent' : 'var(--b1)';
                e.currentTarget.style.color = 'var(--t3)';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.opacity = isPast ? '0.5' : '1';
              }
            }}
          >
            {isCurrent && (
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
            )}
            {STATUS_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}

export { STATUS_LABELS, STATUS_COLOURS };
