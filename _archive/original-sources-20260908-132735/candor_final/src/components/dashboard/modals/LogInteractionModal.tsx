'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import RichEditor from '@/components/ui/RichEditor';
import type { InteractionChannel } from '@/types';

interface LogInteractionModalProps {
  jobId: string;
  onClose: () => void;
}

const CHANNELS: { value: InteractionChannel; label: string; icon: React.ReactNode }[] = [
  { value: 'email', label: 'Email', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91" /></svg> },
  { value: 'call', label: 'Call', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" /></svg> },
  { value: 'linkedin', label: 'LinkedIn', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="3" /><path d="M8 11v5M8 8v.01M12 16v-5c0-1.5 1-2 2-2s2 .5 2 2v5" /></svg> },
  { value: 'meeting', label: 'Meeting', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" /></svg> },
  { value: 'note', label: 'Note', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg> },
  { value: 'message', label: 'Message', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v4.018z" /></svg> },
  { value: 'portal', label: 'Portal', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 0 1 3 12c0-1.065.18-2.086.504-3.036" /></svg> },
  { value: 'file', label: 'File', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg> },
] as const;

export default function LogInteractionModal({ jobId, onClose }: LogInteractionModalProps) {
  const { addInteraction } = useAppStore();
  const { toast } = useToast();
  const [channel, setChannel] = useState<InteractionChannel>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await addInteraction(jobId, { channel, subject: subject.trim(), body: body.trim() });
    toast('Interaction logged');
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '420px' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '-.03em', marginBottom: '3px' }}>Log interaction</div>
        <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '16px' }}>Record a communication or note for this application.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', marginBottom: '14px' }}>
          {CHANNELS.map((ch) => (
            <button
              key={ch.value}
              onClick={() => setChannel(ch.value)}
              className="card-interactive"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 4px',
                borderColor: channel === ch.value ? 'rgba(201,170,126,.3)' : 'var(--b1)',
                background: channel === ch.value ? 'var(--glow)' : 'var(--s2)',
                color: channel === ch.value ? 'var(--gold)' : 'var(--t3)',
                fontSize: '9px',
                fontWeight: 500,
                transform: 'none',
              }}
            >
              {ch.icon}
              {ch.label}
            </button>
          ))}
        </div>

        {['email', 'call', 'meeting', 'linkedin'].includes(channel) && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: '4px' }}>Subject</div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Initial phone screen with Sarah"
              className="input-field"
            />
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: '4px' }}>Notes</div>
          <RichEditor
            defaultValue=""
            onChange={setBody}
            placeholder="What happened? Key takeaways, next steps... (⌘B bold, - bullets)"
            style={{
              padding: '9px 11px',
              background: 'var(--s2)',
              border: '1px solid var(--b1)',
              borderRadius: '8px',
              color: 'var(--t1)',
              fontSize: '13px',
              lineHeight: 1.6,
              minHeight: '96px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-gold" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Log interaction'}</button>
        </div>
      </div>
    </div>
  );
}
