'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import RichEditor from '@/components/ui/RichEditor';
import type { Interaction } from '@/types';
import { sanitizeHtml } from '@/lib/utils';

interface LogViewProps {
  interaction: Interaction;
  jobId: string;
}

function isHtml(str: string) {
  return /<[a-z][\s\S]*>/i.test(str);
}

export default function LogView({ interaction, jobId }: LogViewProps) {
  const { updateInteraction } = useAppStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState(interaction.subject || '');
  const [editBody, setEditBody] = useState(interaction.body || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateInteraction(jobId, interaction.id, {
      subject: editSubject.trim() || null,
      body: editBody.trim() || null,
    });
    setSaving(false);
    setEditing(false);
    toast('Interaction updated');
  }

  function handleCancel() {
    setEditSubject(interaction.subject || '');
    setEditBody(interaction.body || '');
    setEditing(false);
  }

  const bodyIsHtml = interaction.body ? isHtml(interaction.body) : false;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', animation: 'fade .18s ease' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ padding: '3px 9px', borderRadius: '100px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--t2)' }}>
            {interaction.channel}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
            {new Date(interaction.interacted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            {editing ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-ghost" onClick={handleCancel} style={{ fontSize: '11px', padding: '4px 10px' }}>Cancel</button>
                <button className="btn-gold" onClick={handleSave} disabled={saving} style={{ fontSize: '11px', padding: '4px 12px' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                className="btn-ghost"
                onClick={() => setEditing(true)}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {interaction.subject !== undefined && (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: '4px' }}>Subject</div>
                <input
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '13px' }}
                />
              </div>
            )}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: '4px' }}>Notes</div>
              <RichEditor
                key={interaction.id}
                defaultValue={interaction.body || ''}
                onChange={setEditBody}
                placeholder="What happened? Key takeaways, next steps..."
                style={{
                  padding: '10px 12px',
                  background: 'var(--s2)',
                  border: '1px solid var(--b2)',
                  borderRadius: '8px',
                  color: 'var(--t1)',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  minHeight: '120px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {interaction.subject && (
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', marginBottom: '12px' }}>
                {interaction.subject}
              </div>
            )}
            {interaction.body ? (
              bodyIsHtml ? (
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(interaction.body) }}
                  style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.7 }}
                />
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {interaction.body}
                </div>
              )
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--t3)', fontStyle: 'italic' }}>No content recorded for this interaction.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
