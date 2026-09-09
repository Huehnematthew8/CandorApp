'use client';

import { useAppStore } from '@/store/useAppStore';
import type { Stage, StageType } from '@/types';

interface StageTrackProps {
  stages: Stage[];
  activeStageId: string | null;
  jobId: string;
  onAddStage: () => void;
}

export default function StageTrack({ stages, activeStageId, jobId, onAddStage }: StageTrackProps) {
  const { setActiveStage } = useAppStore();
  const activeIdx = stages.findIndex((s) => s.id === activeStageId);

  return (
    <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', gap: 0, padding: '8px 24px', borderBottom: '1px solid var(--b1)' }}>
      {stages.map((stage, i) => {
        const isActive = stage.id === activeStageId;
        const isDone = activeIdx >= 0 && i < activeIdx;
        const isTask = stage.type === 'task';
        const isTest = stage.type === 'test';
        const isNeutral = !isActive && !isDone && !isTask && !isTest;

        const borderColor = isActive ? 'var(--gold)' : isDone ? 'var(--green)' : isTask ? 'var(--purple)' : isTest ? 'var(--amber)' : 'var(--b1)';
        const textColor = isActive ? 'var(--gold)' : isDone ? 'var(--green)' : isTask ? 'var(--purple)' : isTest ? 'var(--amber)' : 'var(--t3)';
        const bgColor = isActive ? 'var(--glow)' : isDone ? 'var(--gd)' : isTask ? 'var(--pd)' : isTest ? 'var(--ad)' : 'transparent';

        const style: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          padding: '4px 10px',
          borderRadius: '100px',
          fontSize: '9px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          cursor: 'pointer',
          transition: 'all .15s ease',
          border: '1px solid ' + borderColor,
          color: textColor,
          background: bgColor,
        };

        return (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ width: '12px', height: '1px', background: isDone ? 'rgba(78,163,117,.35)' : 'var(--b1)', flexShrink: 0 }} />
            )}
            <button
              onClick={() => setActiveStage(jobId, stage.id)}
              style={style}
              onMouseEnter={(e) => {
                if (isNeutral) {
                  e.currentTarget.style.borderColor = 'var(--b3)';
                  e.currentTarget.style.color = 'var(--t1)';
                  e.currentTarget.style.background = 'var(--s2)';
                } else if (!isActive) {
                  e.currentTarget.style.transform = 'scale(1.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (isNeutral) {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.color = textColor;
                  e.currentTarget.style.background = bgColor;
                } else if (!isActive) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
              {stage.name}
            </button>
          </div>
        );
      })}
      <button
        onClick={onAddStage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          padding: '3px 8px',
          borderRadius: '100px',
          fontSize: '9px',
          border: '1.5px dashed var(--b2)',
          color: 'var(--t3)',
          cursor: 'pointer',
          transition: 'all .14s',
          background: 'transparent',
          flexShrink: 0,
          marginLeft: stages.length ? '6px' : 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--t3)'; }}
      >
        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>
        {stages.length ? 'Add stage' : 'Add first stage'}
      </button>
    </div>
  );
}
