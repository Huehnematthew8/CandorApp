'use client';

import { useState, useRef, useEffect } from 'react';
import type { CommunicationType } from '@/types';

interface CommunicationMenuProps {
  onSelect: (type: CommunicationType) => void;
}

const OPTIONS: { type: CommunicationType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'cover-letter',
    label: 'Cover Letter',
    desc: 'Formal letter with AI drafting',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg>,
  },
  {
    type: 'email',
    label: 'Email Draft',
    desc: 'Follow-up, thank you, or outreach',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91" /></svg>,
  },
  {
    type: 'interview-prep',
    label: 'Interview Prep',
    desc: 'Checklist and notes for your interview',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75" /><path d="M6 12.75H4.5a2.25 2.25 0 0 1-2.25-2.25V4.5A2.25 2.25 0 0 1 4.5 2.25h5.09" /></svg>,
  },
  {
    type: 'call-prep',
    label: 'Call Prep',
    desc: 'Talking points and notes for calls',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" /></svg>,
  },
];

export default function CommunicationMenu({ onSelect }: CommunicationMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn-gold"
        onClick={() => setOpen(!open)}
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>
        New
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ marginLeft: '-2px', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s ease' }}><path d="m19 9-7 7-7-7" /></svg>
      </button>

      {open && (
        <div className="dropdown-menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: '260px', zIndex: 50 }}>
          {OPTIONS.map((opt) => (
            <CommOption key={opt.type} opt={opt} onSelect={(type) => { onSelect(type); setOpen(false); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommOption({ opt, onSelect }: { opt: typeof OPTIONS[number]; onSelect: (type: CommunicationType) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(opt.type)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        color: hovered ? 'var(--t1)' : 'var(--t2)',
        cursor: 'pointer',
        background: hovered ? 'var(--s2)' : 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'left' as const,
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: hovered ? 'var(--glow)' : 'var(--s3)',
          border: `1px solid ${hovered ? 'rgba(201,170,126,.25)' : 'var(--b1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold)',
          flexShrink: 0,
          transition: 'all .15s ease',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        {opt.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 500 }}>{opt.label}</div>
        <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '1px' }}>{opt.desc}</div>
      </div>
    </button>
  );
}
