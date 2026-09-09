'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import EmojiPicker from '@/components/ui/EmojiPicker';

interface AddGroupModalProps {
  onClose: () => void;
}

export default function AddGroupModal({ onClose }: AddGroupModalProps) {
  const { addGroup, groups } = useAppStore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📂');
  const [saving, setSaving] = useState(false);

  const realGroups = groups.filter((g) => g.id !== '__ungrouped');

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const success = await addGroup(name.trim(), emoji);
    setSaving(false);
    if (success) {
      toast('Group created');
      onClose();
    } else {
      toast('Failed to create group — check your connection');
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '400px' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 700, letterSpacing: '-.03em', color: 'var(--t1)', marginBottom: '2px' }}>Manage groups</div>
        <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '20px', lineHeight: 1.4 }}>Organise your applications into groups.</div>

        {/* Existing groups */}
        {realGroups.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <div className="section-label" style={{ marginBottom: '8px' }}>Your groups</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {realGroups.map((g) => (
                <div key={g.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--s2)',
                  border: '1px solid var(--b1)',
                  transition: 'all 0.12s ease',
                }}>
                  <span style={{ fontSize: '16px' }}>{g.emoji}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, flex: 1, color: 'var(--t1)' }}>{g.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--t3)', fontWeight: 500 }}>{g.jobs?.length || 0} jobs</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section-label" style={{ marginBottom: '10px' }}>New group</div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
          <EmojiPicker
            value={emoji}
            onChange={setEmoji}
            triggerStyle={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--s2)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--b2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            triggerHoverStyle={{
              borderColor: 'var(--gold)',
              background: 'var(--s3)',
            }}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dream Companies"
            className="input-field"
            style={{ flex: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--b1)', paddingTop: '16px' }}>
          <button className="btn-ghost" onClick={onClose}>Done</button>
          <button className="btn-gold" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Creating...' : 'Create group'}
          </button>
        </div>
      </div>
    </div>
  );
}
