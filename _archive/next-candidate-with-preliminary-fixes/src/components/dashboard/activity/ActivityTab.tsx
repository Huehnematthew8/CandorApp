'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import InteractionLog from './InteractionLog';
import EmailDrafter from './EmailDrafter';
import CoverLetterDrafter from './CoverLetterDrafter';
import InterviewPrep from './InterviewPrep';
import CallPrep from './CallPrep';
import LogView from './LogView';
import ContactsSection from './ContactsSection';
import type { Job, CommunicationType } from '@/types';

interface ActivityTabProps {
  job: Job;
  onLogInteraction: () => void;
  initialMode?: CommunicationType | null;
}

/* ── Solid/filled SVG icons ───────────────────────────── */
function CoverLetterIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 1.5L19.5 8H14V3.5zM8 17h8v1.25H8V17zm0-3h8v1.25H8V14zm0-3h5v1.25H8V11z" />
    </svg>
  );
}

function EmailDraftIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4.25-8 5-8-5V6l8 5 8-5v2.25z" />
    </svg>
  );
}

function InterviewPrepIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V7h2v4zm0 4h-2v-2h2v2z" />
    </svg>
  );
}

function CallPrepIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

type CommOption = {
  type: CommunicationType;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  desc: string;
};

const COMM_OPTIONS: CommOption[] = [
  { type: 'cover-letter', label: 'Cover Letter', Icon: CoverLetterIcon, desc: 'Formal application letter' },
  { type: 'email', label: 'Email Draft', Icon: EmailDraftIcon, desc: 'Follow-up or outreach' },
  { type: 'interview-prep', label: 'Interview Prep', Icon: InterviewPrepIcon, desc: 'Notes & checklist' },
  { type: 'call-prep', label: 'Call Prep', Icon: CallPrepIcon, desc: 'Talking points' },
];

export default function ActivityTab({ job, onLogInteraction, initialMode }: ActivityTabProps) {
  const { addInteraction } = useAppStore();
  const interactions = job.interactions || [];
  const contacts = job.contacts || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<CommunicationType | null>(initialMode || null);
  const selectedInteraction = interactions.find((i) => i.id === selectedId);
  const activeStage = (job.stages || []).find((s) => s.id === job.active_stage_id) || null;

  const handleSent = useCallback(async (subject: string, body: string, channel: string = 'email') => {
    await addInteraction(job.id, {
      channel: channel as import('@/types').InteractionChannel,
      subject,
      body,
    });
    setActiveMode(null);
  }, [addInteraction, job.id]);

  function handleSelectMode(type: CommunicationType) {
    setSelectedId(null);
    setActiveMode(type);
  }

  function handleBack() { setActiveMode(null); }

  function handleSelectInteraction(id: string) {
    setActiveMode(null);
    setSelectedId(id);
  }

  function renderCenter() {
    if (activeMode === 'cover-letter') {
      return <CoverLetterDrafter job={job} onBack={handleBack} onSent={(s, b) => handleSent(s, b, 'email')} />;
    }
    if (activeMode === 'email') {
      return <EmailDrafter job={job} stage={activeStage} onBack={handleBack} onSent={(s, b) => handleSent(s, b, 'email')} />;
    }
    if (activeMode === 'interview-prep') {
      return <InterviewPrep job={job} onBack={handleBack} onComplete={(notes) => handleSent('Interview Prep', notes, 'note')} />;
    }
    if (activeMode === 'call-prep') {
      return <CallPrep job={job} onBack={handleBack} onComplete={(notes) => handleSent('Call Prep', notes, 'call')} />;
    }
    if (selectedInteraction) {
      return <LogView interaction={selectedInteraction} jobId={job.id} />;
    }

    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ marginBottom: '6px', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            What would you like to work on?
          </div>
          <div style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: 1.6, marginBottom: '22px' }}>
            Candor uses your job context, profile, and &ldquo;why this role&rdquo; to help you draft and prepare.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {COMM_OPTIONS.map((opt) => (
              <QuadrantButton key={opt.type} opt={opt} onSelect={handleSelectMode} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left sidebar: Interaction log */}
      <div style={{ width: '210px', borderRight: '1px solid var(--b1)', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
          <span className="section-label" style={{ fontSize: '9px' }}>Timeline</span>
          <button onClick={onLogInteraction} className="btn-ghost" style={{ padding: '3px 8px', fontSize: '9px', borderRadius: '6px' }}>
            <svg width="8" height="8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>
            Log
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <InteractionLog interactions={interactions} selectedId={selectedId} onSelect={handleSelectInteraction} />
        </div>
        <div style={{ borderTop: '1px solid var(--b1)' }}>
          <ContactsSection jobId={job.id} contacts={contacts} />
        </div>
      </div>

      {/* Center: Active communication or empty state */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderCenter()}
      </div>
    </div>
  );
}

function QuadrantButton({ opt, onSelect }: { opt: CommOption; onSelect: (type: CommunicationType) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onSelect(opt.type)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '18px 14px 16px',
        textAlign: 'center',
        borderRadius: '12px',
        border: `1px solid ${hovered ? 'var(--gold)' : 'var(--b2)'}`,
        background: hovered ? 'var(--glow)' : 'var(--s2)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 6px 20px rgba(94,92,230,.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '11px',
        background: hovered ? 'rgba(94,92,230,0.15)' : 'var(--s3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered ? 'var(--gold)' : 'var(--t2)',
        transition: 'all 0.15s ease',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        flexShrink: 0,
      }}>
        <opt.Icon size={20} />
      </div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.01em' }}>
        {opt.label}
      </div>
      <div style={{ fontSize: '10px', color: hovered ? 'var(--t2)' : 'var(--t3)', transition: 'color 0.15s ease', lineHeight: 1.4 }}>
        {opt.desc}
      </div>
    </button>
  );
}
