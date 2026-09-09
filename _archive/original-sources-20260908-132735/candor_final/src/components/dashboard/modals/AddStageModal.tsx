'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import type { StageType } from '@/types';

interface AddStageModalProps {
  jobId: string;
  onClose: () => void;
}

const PRESET_STAGES: { name: string; type: StageType; desc: string; emoji: string }[] = [
  { name: 'Recruiter Screen',      type: 'screening', desc: 'Phone or video with recruiter',      emoji: '📞' },
  { name: 'Hiring Manager Chat',   type: 'interview', desc: 'Informal intro with the manager',    emoji: '💬' },
  { name: 'Interview',             type: 'interview', desc: 'Formal interview round',             emoji: '🎙️' },
  { name: 'Panel Interview',       type: 'interview', desc: 'Multiple interviewers at once',      emoji: '👥' },
  { name: 'Technical Interview',   type: 'test',      desc: 'Coding or technical assessment',     emoji: '💻' },
  { name: 'Take-home Task',        type: 'task',      desc: 'Assignment to complete off-site',    emoji: '📋' },
  { name: 'Psychometric Test',     type: 'test',      desc: 'Aptitude or personality assessment', emoji: '🧠' },
  { name: 'Reference Check',       type: 'other',     desc: 'Employer contacts your referees',    emoji: '🔍' },
  { name: 'Offer',                 type: 'other',     desc: 'Offer received — time to negotiate', emoji: '🤝' },
];

export default function AddStageModal({ jobId, onClose }: AddStageModalProps) {
  const { addStage } = useAppStore();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (selected === null) return;
    const stage = PRESET_STAGES[selected];
    setSaving(true);
    await addStage(jobId, { type: stage.type, name: stage.name });
    toast(`${stage.name} added`);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '420px' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '18px', marginBottom: '3px', letterSpacing: '-0.02em' }}>
          Add stage
        </div>
        <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '18px' }}>
          Select the next step in your hiring process.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '20px' }}>
          {PRESET_STAGES.map((stage, i) => {
            const active = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="card-interactive"
                style={{
                  padding: '10px 8px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  borderColor: active ? 'rgba(94,92,230,.4)' : 'var(--b1)',
                  background: active ? 'var(--glow)' : 'var(--s2)',
                  transform: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{stage.emoji}</span>
                <div style={{ fontSize: '11px', fontWeight: 600, color: active ? 'var(--gold)' : 'var(--t1)', marginTop: '2px' }}>{stage.name}</div>
                <div style={{ fontSize: '9px', color: active ? 'rgba(94,92,230,.7)' : 'var(--t3)', lineHeight: 1.4 }}>{stage.desc}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-gold"
            onClick={handleSave}
            disabled={saving || selected === null}
            style={{ opacity: selected === null ? 0.5 : 1 }}
          >
            {saving ? 'Adding…' : 'Add stage'}
          </button>
        </div>
      </div>
    </div>
  );
}
