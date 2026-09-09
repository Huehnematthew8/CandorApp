'use client';

import { useState, useRef, useEffect, CSSProperties } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  prefix?: string;
}

interface ThemedSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  style?: CSSProperties;
  small?: boolean;
}

export default function ThemedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  style,
  small,
}: ThemedSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
  }

  const fs = small ? '11px' : '13px';
  const py = small ? '5px' : '8px';

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: `${py} 10px`,
          background: open ? 'var(--bg)' : 'var(--s2)',
          border: '1px solid ' + (open ? 'var(--gold)' : 'var(--b1)'),
          borderRadius: '8px',
          color: selected ? 'var(--t1)' : 'var(--t3)',
          fontSize: fs,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all .15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--b3)';
            e.currentTarget.style.background = 'var(--s3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--b1)';
            e.currentTarget.style.background = 'var(--s2)';
          }
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? (
            <>
              {selected.prefix && <span style={{ marginRight: '5px' }}>{selected.prefix}</span>}
              {selected.label}
            </>
          ) : placeholder}
        </span>
        <svg
          width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--t3)"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .15s ease' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--s1)',
          border: '1px solid var(--b3)',
          borderRadius: '10px',
          padding: '4px',
          boxShadow: '0 12px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04)',
          zIndex: 60,
          animation: 'dropdown-in .15s ease both',
          maxHeight: '220px',
          overflowY: 'auto',
        }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                width: '100%',
                padding: '7px 10px',
                borderRadius: '7px',
                background: opt.value === value ? 'var(--s3)' : 'none',
                border: 'none',
                color: opt.value === value ? 'var(--t1)' : 'var(--t2)',
                fontSize: fs,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .1s ease',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) {
                  e.currentTarget.style.background = 'var(--s2)';
                  e.currentTarget.style.color = 'var(--t1)';
                }
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'var(--t2)';
                }
              }}
            >
              {opt.prefix && <span>{opt.prefix}</span>}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
              {opt.value === value && (
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--gold)" style={{ flexShrink: 0 }}>
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
