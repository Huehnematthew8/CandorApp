'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import EmojiPicker from '@/components/ui/EmojiPicker';
import ThemedSelect from '@/components/ui/ThemedSelect';
import type { JobStatus } from '@/types';

const STATUS_PILL_OPTIONS: { value: JobStatus; label: string; color: string }[] = [
  { value: 'saved', label: 'Saved', color: 'var(--t3)' },
  { value: 'applied', label: 'Applied', color: 'var(--blue)' },
  { value: 'screening', label: 'Screening', color: 'var(--teal)' },
  { value: 'interview', label: 'Interview', color: 'var(--amber)' },
  { value: 'offer', label: 'Offer', color: 'var(--green)' },
];

interface AddJobModalProps {
  onClose: () => void;
  prefill?: Record<string, unknown> | null;
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26,43,60,0.45)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'fade 0.15s ease both',
};

const panel: CSSProperties = {
  width: '480px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'var(--s1)',
  border: '1px solid var(--b2)',
  borderRadius: '16px',
  padding: '28px',
  boxShadow: '0 8px 40px rgba(26,43,60,0.14), 0 2px 8px rgba(26,43,60,0.06)',
  animation: 'modal-in 0.2s ease both',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  backgroundColor: 'var(--s2)',
  border: '1px solid var(--b1)',
  borderRadius: '8px',
  color: 'var(--t1)',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s ease, background-color 0.15s ease',
};


const goldBtn: CSSProperties = {
  padding: '8px 16px',
  background: 'var(--gold)',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '12px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

const ghostBtn: CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  color: 'var(--t2)',
  fontWeight: 500,
  fontSize: '12px',
  borderRadius: '8px',
  border: '1px solid var(--b1)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const label: CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--t3)',
  marginBottom: '5px',
};

export default function AddJobModal({ onClose, prefill }: AddJobModalProps) {
  const { groups, addJob, addGroup } = useAppStore();
  const { toast } = useToast();

  const [company, setCompany] = useState((prefill?.company as string) || '');
  const [role, setRole] = useState((prefill?.role as string) || '');
  const [location, setLocation] = useState((prefill?.location as string) || '');
  const [salary, setSalary] = useState((prefill?.salary as string) || '');
  const [status, setStatus] = useState<JobStatus>('saved');
  const [groupId, setGroupId] = useState('');
  const [logo, setLogo] = useState('');
  const [url, setUrl] = useState((prefill?.url as string) || '');
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importData, setImportData] = useState<Record<string, unknown> | null>(prefill || null);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('📂');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const realGroups = groups.filter((g) => g.id !== '__ungrouped');

  useEffect(() => {
    if (realGroups.length > 0 && !groupId) {
      setGroupId(realGroups[0].id);
    }
  }, [groups, groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    const success = await addGroup(newGroupName.trim(), newGroupEmoji);
    setCreatingGroup(false);
    if (success) {
      toast('Group created');
      setShowNewGroup(false);
      setNewGroupName('');
      const updatedGroups = useAppStore.getState().groups.filter((g) => g.id !== '__ungrouped');
      if (updatedGroups.length > 0) {
        setGroupId(updatedGroups[updatedGroups.length - 1].id);
      }
    } else {
      toast('Failed to create group — check your connection');
    }
  }

  async function handleImportUrl() {
    if (!url.trim()) return;
    setImporting(true);
    try {
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (data.role) setRole(data.role);
        if (data.location) setLocation(data.location);
        if (data.salary) setSalary(data.salary);
        setImportData(data);
        toast('Job details imported — review and save');
      } else {
        toast('Could not fetch that URL');
      }
    } catch {
      toast('Import failed — try again');
    }
    setImporting(false);
  }

  async function handleSave() {
    if (!company.trim() || !role.trim()) return;
    setSaving(true);

    let targetGroupId = groupId;
    if (!targetGroupId && realGroups.length === 0) {
      await addGroup('Applications', '📋');
      const updated = useAppStore.getState().groups.filter((g) => g.id !== '__ungrouped');
      targetGroupId = updated[0]?.id || '';
    }

    const jobId = await addJob(targetGroupId, {
      company: company.trim(),
      role: role.trim(),
      location: location.trim() || null,
      salary: salary.trim() || null,
      status,
      logo: logo || '🏢',
    });

    if (jobId && importData) {
      const parts: string[] = [];
      if (importData.description) parts.push(importData.description as string);
      const reqs = importData.requirements as string[] | undefined;
      if (reqs?.length) parts.push('Key requirements: ' + reqs.join(', '));
      const niceToHave = importData.nice_to_have as string[] | undefined;
      if (niceToHave?.length) parts.push('Nice to have: ' + niceToHave.join(', '));
      const benefits = importData.benefits as string[] | undefined;
      if (benefits?.length) parts.push('Benefits: ' + benefits.join(', '));
      if (importData.team) parts.push('Team: ' + importData.team);
      if (importData.reports_to) parts.push('Reports to: ' + importData.reports_to);
      if (importData.job_type) parts.push('Type: ' + importData.job_type);
      if (importData.experience_level) parts.push('Level: ' + importData.experience_level);
      if (importData.company_about) parts.push('About the company: ' + importData.company_about);
      const techStack = importData.tech_stack as string[] | undefined;
      if (techStack?.length) parts.push('Tech stack: ' + techStack.join(', '));
      const culture = importData.culture_keywords as string[] | undefined;
      if (culture?.length) parts.push('Culture: ' + culture.join(', '));

      if (parts.length > 0) {
        const { updateJob } = useAppStore.getState();
        await updateJob(jobId, { jd_summary: parts.join('\n\n') } as Partial<import('@/types').Job>);
      }
    }

    setSaving(false);
    if (jobId) {
      toast('Job added');
      onClose();
    } else {
      const storeError = useAppStore.getState().error;
      toast(storeError || 'Failed to add job — check your connection');
    }
  }

  function getFocusedInput(name: string): CSSProperties {
    return {
      ...inputStyle,
      borderColor: focusedField === name ? 'var(--gold)' : 'var(--b1)',
      backgroundColor: focusedField === name ? 'var(--bg)' : 'var(--s2)',
    };
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panel}>
        {/* Header */}
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', color: 'var(--t1)', marginBottom: '2px' }}>
          Add application
        </div>
        <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '20px', lineHeight: 1.4 }}>
          Paste a URL to auto-fill, or add details manually.
        </div>

        {/* URL import bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
            onFocus={() => setFocusedField('url')}
            onBlur={() => setFocusedField(null)}
            placeholder="Paste job URL (LinkedIn, Seek, Greenhouse...)"
            style={{ ...getFocusedInput('url'), flex: 1 }}
          />
          <button
            onClick={handleImportUrl}
            disabled={importing || !url.trim()}
            style={{
              ...goldBtn,
              opacity: importing || !url.trim() ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {importing ? (
              <>
                <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                Fetching...
              </>
            ) : 'Import'}
          </button>
        </div>

        {/* Import data pills */}
        {importData && ((importData.description as string) || (importData.requirements as string[])?.length > 0) && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--glow2)',
            border: '1px solid rgba(201,170,126,.12)',
            marginBottom: '16px',
            animation: 'up .2s ease both',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gold)', marginBottom: '8px' }}>
              Extracted from JD
            </div>
            {(importData.description as string) && (
              <div style={{
                borderLeft: '2px solid var(--gold)',
                paddingLeft: '10px',
                marginBottom: '10px',
                color: 'var(--t2)',
                fontSize: '11px',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}>
                {(importData.description as string).slice(0, 140)}
              </div>
            )}
            {(importData.requirements as string[])?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(importData.requirements as string[]).slice(0, 6).map((r, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: '100px', fontSize: '10px', background: 'var(--gd)', color: 'var(--green)' }}>{r}</span>
                ))}
                {(importData.tech_stack as string[])?.slice(0, 4).map((t, i) => (
                  <span key={`t-${i}`} style={{ padding: '3px 8px', borderRadius: '100px', fontSize: '10px', background: 'var(--bd)', color: 'var(--blue)' }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* Company */}
          <div>
            <div style={label}>Company</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <EmojiPicker value={logo || '🏢'} onChange={setLogo} />
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onFocus={() => setFocusedField('company')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. Atlassian"
                style={{ ...getFocusedInput('company'), flex: 1 }}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <div style={label}>Role</div>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onFocus={() => setFocusedField('role')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Senior Product Designer"
              style={getFocusedInput('role')}
            />
          </div>

          {/* Location */}
          <div>
            <div style={label}>Location</div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setFocusedField('location')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Sydney, AU (Hybrid)"
              style={getFocusedInput('location')}
            />
          </div>

          {/* Salary */}
          <div>
            <div style={label}>Salary</div>
            <input
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              onFocus={() => setFocusedField('salary')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. $150-180k"
              style={getFocusedInput('salary')}
            />
          </div>

          {/* Status pills */}
          <div>
            <div style={label}>Status</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {STATUS_PILL_OPTIONS.map((opt) => {
                const isActive = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      borderRadius: '100px',
                      fontSize: '11px',
                      fontWeight: 500,
                      border: '1px solid ' + (isActive ? 'rgba(201,170,126,.25)' : 'var(--b1)'),
                      background: isActive ? 'var(--glow)' : 'var(--s2)',
                      color: isActive ? 'var(--gold)' : 'var(--t2)',
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'var(--b3)';
                        e.currentTarget.style.color = 'var(--t1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'var(--b1)';
                        e.currentTarget.style.color = 'var(--t2)';
                      }
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group */}
          <div>
            <div style={label}>Group</div>
            {!showNewGroup ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                {realGroups.length > 0 ? (
                  <ThemedSelect
                    value={groupId}
                    onChange={setGroupId}
                    options={realGroups.map((g) => ({ value: g.id, label: g.name, prefix: g.emoji }))}
                    placeholder="Select group…"
                    style={{ flex: 1 }}
                  />
                ) : (
                  <div style={{
                    ...inputStyle,
                    flex: 1,
                    color: 'var(--t3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    No groups yet
                  </div>
                )}
                <button
                  onClick={() => setShowNewGroup(true)}
                  style={{
                    ...ghostBtn,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--b3)';
                    e.currentTarget.style.color = 'var(--t1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--b1)';
                    e.currentTarget.style.color = 'var(--t2)';
                  }}
                >
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>
                  New
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--s2)',
                border: '1px solid var(--b2)',
                animation: 'up .15s ease both',
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <EmojiPicker value={newGroupEmoji} onChange={setNewGroupEmoji} />
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onFocus={() => setFocusedField('newGroup')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Group name"
                    style={{ ...getFocusedInput('newGroup'), flex: 1 }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowNewGroup(false)}
                    style={{ ...ghostBtn, padding: '5px 12px', fontSize: '11px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.color = 'var(--t1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)'; }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={creatingGroup || !newGroupName.trim()}
                    style={{
                      ...goldBtn,
                      padding: '5px 12px',
                      fontSize: '11px',
                      opacity: creatingGroup || !newGroupName.trim() ? 0.4 : 1,
                    }}
                  >
                    {creatingGroup ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--b1)', paddingTop: '16px' }}>
          <button
            onClick={onClose}
            style={ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--b3)'; e.currentTarget.style.color = 'var(--t1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !company.trim() || !role.trim()}
            style={{
              ...goldBtn,
              opacity: saving || !company.trim() || !role.trim() ? 0.4 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Add application'}
          </button>
        </div>
      </div>
    </div>
  );
}
