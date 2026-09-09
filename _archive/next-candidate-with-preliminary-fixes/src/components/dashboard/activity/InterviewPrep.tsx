'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import RichEditor from '@/components/ui/RichEditor';
import type { Job } from '@/types';

interface InterviewPrepProps {
  job: Job;
  onBack: () => void;
  onComplete: (notes: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function InterviewPrep({ job, onBack, onComplete }: InterviewPrepProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const completedCount = checklist.filter((c) => c.checked).length;
  const progress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const toggleItem = useCallback((id: string) => {
    setChecklist((prev) =>
      prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  }, []);

  function addItem() {
    if (!newItem.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, label: newItem.trim(), checked: false },
    ]);
    setNewItem('');
  }

  function removeItem(id: string) {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  }

  function handleComplete() {
    const checklistSummary = checklist.length > 0
      ? `Completed: ${completedCount}/${checklist.length} checklist items`
      : '';
    const summary = [
      `Interview Prep — ${job.company} ${job.role}`,
      checklistSummary,
      notes ? `\nNotes:\n${notes}` : '',
    ].filter(Boolean).join('\n');
    onComplete(summary);
    toast('Interview prep logged');
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slidein 0.2s ease both' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <button className="btn-icon" onClick={onBack} style={{ width: '28px', height: '28px' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="var(--gold)">
          <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75" />
        </svg>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px' }}>Interview Prep</span>
        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>· {job.company}</span>

        {/* Progress bar — only shown when checklist has items */}
        {checklist.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '60px', height: '3px', borderRadius: '2px', background: 'var(--b1)', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`, height: '100%', borderRadius: '2px',
                background: progress === 100 ? 'var(--green)' : 'var(--gold)',
                transition: 'all 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '10px', color: progress === 100 ? 'var(--green)' : 'var(--t3)' }}>
              {completedCount}/{checklist.length}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: '0' }}>

        {/* ── Left: Notes (primary) ───────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '20px', gap: '10px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="section-label">Notes</div>
            <span style={{ fontSize: '10px', color: 'var(--t3)' }}>- for bullets · ⌘B to bold</span>
          </div>
          <RichEditor
            defaultValue={notes}
            onChange={setNotes}
            placeholder="Jot down talking points, STAR stories, questions to ask, key achievements..."
            style={{
              flex: 1,
              minHeight: '300px',
              lineHeight: 1.8,
              fontSize: '13px',
              padding: '14px 16px',
              background: 'var(--s2)',
              border: '1px solid var(--b1)',
              borderRadius: '10px',
              color: 'var(--t1)',
              fontFamily: 'inherit',
            }}
          />
          {job.jd_summary && (
            <div>
              <div className="section-label" style={{ marginBottom: '6px', fontSize: '9px' }}>Role Context</div>
              <div style={{
                padding: '10px 12px', borderRadius: '8px',
                background: 'var(--s2)', border: '1px solid var(--b1)',
                fontSize: '11px', color: 'var(--t2)', lineHeight: 1.6,
                whiteSpace: 'pre-line', maxHeight: '160px', overflowY: 'auto',
              }}>
                {job.jd_summary}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Checklist (secondary) ────────────────────── */}
        <div style={{
          width: '248px',
          flexShrink: 0,
          borderLeft: '1px solid var(--b1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 16px 10px', flexShrink: 0 }}>
            <div className="section-label" style={{ marginBottom: '10px' }}>Checklist</div>

            {/* Add item input */}
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="Add an item..."
                className="input-field"
                style={{ flex: 1, fontSize: '11px', padding: '6px 9px' }}
              />
              <button
                className="btn-ghost"
                onClick={addItem}
                style={{ padding: '5px 9px', fontSize: '10px', flexShrink: 0 }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Items list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {checklist.length === 0 && (
              <div style={{
                padding: '24px 0', textAlign: 'center',
                fontSize: '11px', color: 'var(--t3)', lineHeight: 1.6,
              }}>
                No checklist items yet.
                <br />Add what matters to you.
              </div>
            )}
            {checklist.map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  background: item.checked ? 'var(--gd)' : hoveredItemId === item.id ? 'var(--s2)' : 'transparent',
                  border: `1px solid ${item.checked ? 'rgba(78,163,117,.2)' : hoveredItemId === item.id ? 'var(--b2)' : 'transparent'}`,
                  cursor: 'default',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Checkbox */}
                <div
                  onClick={() => toggleItem(item.id)}
                  style={{
                    width: '16px', height: '16px',
                    borderRadius: '4px',
                    border: `2px solid ${item.checked ? 'var(--green)' : 'var(--b3)'}`,
                    background: item.checked ? 'var(--green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '1px', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.checked && (
                    <svg width="9" height="9" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="#fff">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <span style={{
                  flex: 1,
                  fontSize: '11px',
                  color: item.checked ? 'var(--green)' : 'var(--t1)',
                  textDecoration: item.checked ? 'line-through' : 'none',
                  opacity: item.checked ? 0.65 : 1,
                  lineHeight: 1.5,
                  paddingRight: hoveredItemId === item.id ? '18px' : '0',
                  transition: 'padding .12s',
                }}>
                  {item.label}
                </span>

                {/* Remove button — visible on hover */}
                <button
                  onClick={() => removeItem(item.id)}
                  title="Remove item"
                  style={{
                    position: 'absolute', right: '6px', top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--t3)',
                    opacity: hoveredItemId === item.id ? 1 : 0,
                    transition: 'opacity .12s, color .12s',
                    padding: 0,
                    borderRadius: '3px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; }}
                >
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderTop: '1px solid var(--b1)', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
          {checklist.length === 0
            ? 'Ready to log when you are'
            : progress === 100
            ? '✓ All items complete'
            : `${checklist.length - completedCount} item${checklist.length - completedCount !== 1 ? 's' : ''} remaining`}
        </span>
        <button className="btn-gold" onClick={handleComplete} style={{ marginLeft: 'auto', padding: '7px 16px' }}>
          Complete &amp; Log
        </button>
      </div>

    </div>
  );
}
