'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import RichEditor from '@/components/ui/RichEditor';
import type { Note } from '@/types';
import { sanitizeHtml } from '@/lib/utils';

interface NotesSectionProps {
  jobId: string;
  notes: Note[];
}

function formatNoteTs(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function NotesSection({ jobId, notes }: NotesSectionProps) {
  const { addNote, updateJob } = useAppStore();
  const { toast } = useToast();
  const [editorKey, setEditorKey] = useState(0);
  const [draftHtml, setDraftHtml] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editHtml, setEditHtml] = useState('');
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  function handleSave() {
    const plain = stripHtml(draftHtml).trim();
    if (!plain) return;
    addNote(jobId, draftHtml.trim());
    setDraftHtml('');
    setEditorKey((k) => k + 1);
    toast('Note saved');
  }

  function startEdit(i: number) {
    setEditingIdx(i);
    setEditHtml(notes[i].html);
    setConfirmDeleteIdx(null);
  }

  function commitEdit(i: number) {
    const plain = stripHtml(editHtml).trim();
    if (!plain) return;
    const updated = notes.map((n, idx) =>
      idx === i ? { ...n, html: editHtml.trim() } : n
    );
    updateJob(jobId, { notes: updated });
    setEditingIdx(null);
    toast('Note updated');
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditHtml('');
  }

  function deleteNote(i: number) {
    const updated = notes.filter((_, idx) => idx !== i);
    updateJob(jobId, { notes: updated });
    setConfirmDeleteIdx(null);
    toast('Note deleted');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      {/* Add note input */}
      <div style={{ position: 'relative' }}>
        <RichEditor
          key={editorKey}
          defaultValue=""
          onChange={setDraftHtml}
          onEnterSave={handleSave}
          placeholder="Add a note... (- for bullets, ⌘B bold, ⌘I italic)"
          style={{
            width: '100%',
            padding: '9px 11px 32px',
            background: 'var(--s2)',
            border: '1px solid var(--b1)',
            borderRadius: '7px',
            color: 'var(--t1)',
            fontSize: '12px',
            lineHeight: 1.6,
            minHeight: '72px',
            transition: 'border-color .2s',
            fontFamily: 'inherit',
          }}
          onBlur={(html) => setDraftHtml(html)}
        />
        <div style={{ position: 'absolute', bottom: '7px', right: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: 'var(--t3)' }}>↵ to save</span>
          <SaveButton active={!!stripHtml(draftHtml).trim()} onSave={handleSave} />
        </div>
      </div>

      {notes.map((note, i) => (
        <div
          key={i}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            padding: '10px 12px',
            borderRadius: '7px',
            background: hoveredIdx === i ? 'var(--s2)' : 'var(--s1)',
            border: '1px solid ' + (editingIdx === i ? 'var(--gold)' : 'var(--b1)'),
            transition: 'all .15s ease',
            position: 'relative',
          }}
        >
          {editingIdx === i ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <RichEditor
                key={`edit-${i}`}
                defaultValue={note.html}
                onChange={setEditHtml}
                onBlur={setEditHtml}
                autoFocus
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--t1)',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  minHeight: '48px',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <ConfirmSaveButton active={!!stripHtml(editHtml).trim()} onSave={() => commitEdit(i)} />
                <SmallGhostButton onClick={cancelEdit} label="Cancel" />
              </div>
            </div>
          ) : confirmDeleteIdx === i ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--t2)', flex: 1 }}>Delete this note?</span>
              <DeleteConfirmButton onDelete={() => deleteNote(i)} onCancel={() => setConfirmDeleteIdx(null)} />
            </div>
          ) : (
            <>
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.html) }}
                style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6, paddingRight: hoveredIdx === i ? '52px' : '0', transition: 'padding .15s' }}
              />
              <div style={{ marginTop: '5px', fontSize: '10px', color: 'var(--t3)' }}>
                {formatNoteTs(note.ts)}
              </div>
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                display: 'flex', gap: '2px',
                opacity: hoveredIdx === i ? 1 : 0,
                transition: 'opacity .15s ease',
              }}>
                <NoteIconBtn onClick={() => startEdit(i)} title="Edit note" color="var(--t3)" hoverColor="var(--t1)">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </NoteIconBtn>
                <NoteIconBtn onClick={() => setConfirmDeleteIdx(i)} title="Delete note" color="var(--t3)" hoverColor="var(--red)" hoverBg="var(--rdd)" hoverBorder="rgba(196,96,96,.3)">
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </NoteIconBtn>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function stripHtml(html: string) {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? '';
}

function SaveButton({ active, onSave }: { active: boolean; onSave: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSave}
      disabled={!active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '3px 10px',
        borderRadius: '100px',
        background: !active ? 'var(--s3)' : hovered ? 'var(--gold2)' : 'var(--gold)',
        color: !active ? 'var(--t3)' : '#ffffff',
        border: 'none',
        fontSize: '10px',
        fontWeight: 600,
        cursor: active ? 'pointer' : 'default',
        transition: 'all .15s ease',
        transform: hovered && active ? 'translateY(-1px)' : 'none',
      }}
    >
      Save
    </button>
  );
}

function ConfirmSaveButton({ active, onSave }: { active: boolean; onSave: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSave}
      disabled={!active}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 12px', borderRadius: '100px',
        background: !active ? 'var(--s3)' : hovered ? 'var(--gold2)' : 'var(--gold)',
        color: !active ? 'var(--t3)' : '#ffffff',
        border: 'none', fontSize: '10px', fontWeight: 600,
        cursor: active ? 'pointer' : 'default',
        opacity: active ? 1 : 0.4,
        transition: 'all .15s ease',
        transform: hovered && active ? 'translateY(-1px)' : 'none',
      }}
    >
      Save
    </button>
  );
}

function SmallGhostButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 10px', borderRadius: '100px',
        background: hovered ? 'var(--s3)' : 'none',
        color: hovered ? 'var(--t1)' : 'var(--t3)',
        border: `1px solid ${hovered ? 'var(--b3)' : 'var(--b1)'}`,
        fontSize: '10px', cursor: 'pointer',
        transition: 'all .15s ease',
      }}
    >
      {label}
    </button>
  );
}

function DeleteConfirmButton({ onDelete, onCancel }: { onDelete: () => void; onCancel: () => void }) {
  const [hovDel, setHovDel] = useState(false);
  const [hovCancel, setHovCancel] = useState(false);
  return (
    <>
      <button
        onClick={onDelete}
        onMouseEnter={() => setHovDel(true)}
        onMouseLeave={() => setHovDel(false)}
        style={{
          padding: '4px 12px', borderRadius: '100px',
          background: hovDel ? 'rgba(196,96,96,.22)' : 'var(--rdd)',
          color: 'var(--red)',
          border: `1px solid ${hovDel ? 'rgba(196,96,96,.45)' : 'rgba(196,96,96,.3)'}`,
          fontSize: '10px', fontWeight: 600, cursor: 'pointer',
          transition: 'all .15s ease',
          transform: hovDel ? 'translateY(-1px)' : 'none',
        }}
      >
        Delete
      </button>
      <button
        onClick={onCancel}
        onMouseEnter={() => setHovCancel(true)}
        onMouseLeave={() => setHovCancel(false)}
        style={{
          padding: '4px 10px', borderRadius: '100px',
          background: hovCancel ? 'var(--s3)' : 'none',
          color: hovCancel ? 'var(--t1)' : 'var(--t3)',
          border: `1px solid ${hovCancel ? 'var(--b3)' : 'var(--b1)'}`,
          fontSize: '10px', cursor: 'pointer',
          transition: 'all .15s ease',
        }}
      >
        Cancel
      </button>
    </>
  );
}

function NoteIconBtn({ onClick, title, color, hoverColor, hoverBg, hoverBorder, children }: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  color: string;
  hoverColor: string;
  hoverBg?: string;
  hoverBorder?: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '24px', height: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hovered && hoverBg ? hoverBg : hovered ? 'var(--s4)' : 'var(--s3)',
        border: `1px solid ${hovered && hoverBorder ? hoverBorder : hovered ? 'var(--b3)' : 'var(--b2)'}`,
        borderRadius: '5px', cursor: 'pointer',
        color: hovered ? hoverColor : color,
        transition: 'all .12s ease',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      {children}
    </button>
  );
}
