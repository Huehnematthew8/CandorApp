'use client';

import { useState, useMemo, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import type { Job, JobStatus } from '@/types';
import { daysSince } from '@/lib/utils';

type SortKey = 'company' | 'group' | 'status' | 'days' | 'location' | 'salary' | 'last' | 'fit';
type SortDir = 'asc' | 'desc';

const FILTER_OPTIONS: { label: string; value: JobStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Saved', value: 'saved' },
  { label: 'Applied', value: 'applied' },
  { label: 'Interview', value: 'interview' },
  { label: 'Offer', value: 'offer' },
  { label: 'Rejected', value: 'rejected' },
];

interface EditingCell {
  jobId: string;
  field: 'company' | 'role' | 'location' | 'salary' | 'fit';
}

interface TableViewProps {
  onAddGroup?: () => void;
}

const cellInput: CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--gold)',
  borderRadius: '5px',
  color: 'var(--t1)',
  fontSize: '12px',
  padding: '3px 6px',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
};

export default function TableView({ onAddGroup }: TableViewProps = {}) {
  const { groups, selectJob, updateJob, updateJobStatus, deleteJob } = useAppStore();
  const { toast } = useToast();
  const allJobs = useMemo(() => groups.flatMap((g) => g.jobs || []), [groups]);
  const [filter, setFilter] = useState<JobStatus | ''>('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('company');
  const [sortAsc, setSortAsc] = useState(true);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [statusDropOpen, setStatusDropOpen] = useState<string | null>(null);
  const [groupDropOpen, setGroupDropOpen] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const realGroups = useMemo(() => groups.filter((g) => g.id !== '__ungrouped'), [groups]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!statusDropOpen && !groupDropOpen) return;
    function handleClick() { setStatusDropOpen(null); setGroupDropOpen(null); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [statusDropOpen, groupDropOpen]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = useMemo(() => {
    let list = allJobs;
    if (filter) {
      if (filter === 'interview') {
        list = list.filter((j) => ['interview', 'round1', 'round2', 'screening'].includes(j.status));
      } else {
        list = list.filter((j) => j.status === filter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) => j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q));
    }
    return list;
  }, [allJobs, filter, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string | number, bv: string | number;
      const grpA = groups.find((g) => g.id === a.group_id);
      const grpB = groups.find((g) => g.id === b.group_id);
      switch (sortKey) {
        case 'company': av = a.company.toLowerCase(); bv = b.company.toLowerCase(); break;
        case 'group': av = (grpA?.name || '').toLowerCase(); bv = (grpB?.name || '').toLowerCase(); break;
        case 'status': av = a.status; bv = b.status; break;
        case 'days': av = a.applied_at ? daysSince(a.applied_at) ?? 999 : 999; bv = b.applied_at ? daysSince(b.applied_at) ?? 999 : 999; break;
        case 'location': av = a.location || ''; bv = b.location || ''; break;
        case 'salary': av = a.salary || ''; bv = b.salary || ''; break;
        case 'last': av = a.interactions?.[0]?.interacted_at || ''; bv = b.interactions?.[0]?.interacted_at || ''; break;
        case 'fit': av = a.fit || 0; bv = b.fit || 0; break;
        default: av = ''; bv = '';
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortAsc, groups]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = useCallback((job: Job, field: EditingCell['field']) => {
    let val = '';
    switch (field) {
      case 'company': val = job.company; break;
      case 'role': val = job.role; break;
      case 'location': val = job.location || ''; break;
      case 'salary': val = job.salary || ''; break;
      case 'fit': val = String(job.fit || 0); break;
    }
    setEditValue(val);
    setEditing({ jobId: job.id, field });
  }, []);

  const commitEdit = useCallback(async (overrideValue?: string) => {
    if (!editing) return;
    const { jobId, field } = editing;
    setEditing(null);

    const val = (overrideValue !== undefined ? overrideValue : editValue).trim();
    switch (field) {
      case 'company':
        if (val) await updateJob(jobId, { company: val });
        break;
      case 'role':
        if (val) await updateJob(jobId, { role: val });
        break;
      case 'location':
        await updateJob(jobId, { location: val || null });
        break;
      case 'salary':
        await updateJob(jobId, { salary: val || null });
        break;
      case 'fit': {
        const n = Math.max(0, Math.min(100, parseInt(val) || 0));
        await updateJob(jobId, { fit: n });
        break;
      }
    }
  }, [editing, editValue, updateJob, updateJobStatus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(null);
  }, [commitEdit]);

  async function handleDelete(jobId: string) {
    await deleteJob(jobId);
    setConfirmDelete(null);
    toast('Application removed');
  }

  const colMap: SortKey[] = ['company', 'group', 'status', 'days', 'location', 'salary', 'last', 'fit'];
  const colLabels = ['Company', 'Group', 'Status', 'Days', 'Location', 'Salary', 'Last Activity', 'Fit'];

  function renderCell(job: Job, col: SortKey) {
    const group = groups.find((g) => g.id === job.group_id);
    const isEditing = editing?.jobId === job.id;

    switch (col) {
      case 'company': {
        if (isEditing && editing?.field === 'company') {
          return (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit()}
              onKeyDown={handleKeyDown}
              style={cellInput}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
        if (isEditing && editing?.field === 'role') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{job.logo}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{job.company}</div>
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit()}
                  onKeyDown={handleKeyDown}
                  style={{ ...cellInput, fontSize: '11px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{job.logo}</span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px', cursor: 'text', borderRadius: '3px', padding: '0 2px', transition: 'background .15s' }}
                onClick={(e) => { e.stopPropagation(); startEdit(job, 'company'); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {job.company}
              </div>
              <div
                style={{ fontSize: '11px', color: 'var(--t3)', cursor: 'text', borderRadius: '3px', padding: '0 2px', transition: 'background .15s' }}
                onClick={(e) => { e.stopPropagation(); startEdit(job, 'role'); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {job.role}
              </div>
            </div>
          </div>
        );
      }

      case 'group': {
        const isGroupOpen = groupDropOpen === job.id;
        return (
          <div
            style={{ position: 'relative', display: 'inline-block' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          >
            <div
              onClick={() => { setGroupDropOpen(isGroupOpen ? null : job.id); setStatusDropOpen(null); }}
              style={{ cursor: 'pointer', borderRadius: '4px', padding: '2px 4px', transition: 'background .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {group && group.id !== '__ungrouped' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '100px', fontSize: '10px', background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                  {group.emoji} {group.name}
                </span>
              ) : <span style={{ color: 'var(--t3)', fontSize: '11px' }}>—</span>}
            </div>
            {isGroupOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                minWidth: '170px',
                background: 'var(--s1)',
                border: '1px solid var(--b3)',
                borderRadius: '10px',
                padding: '4px',
                boxShadow: '0 12px 40px rgba(0,0,0,.55)',
                zIndex: 60,
                animation: 'dropdown-in .15s ease both',
              }}>
                {realGroups.length === 0 ? (
                  <div style={{ padding: '10px 10px 6px', fontSize: '11px', color: 'var(--t3)', textAlign: 'center' }}>No groups yet</div>
                ) : (
                  <>
                    {realGroups.map((g) => (
                      <button
                        key={g.id}
                        onClick={async () => {
                          setGroupDropOpen(null);
                          await updateJob(job.id, { group_id: g.id });
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          width: '100%', padding: '7px 10px', borderRadius: '7px',
                          background: job.group_id === g.id ? 'var(--s3)' : 'none',
                          border: 'none', color: job.group_id === g.id ? 'var(--t1)' : 'var(--t2)',
                          fontSize: '11px', cursor: 'pointer', textAlign: 'left', transition: 'all .1s ease',
                        }}
                        onMouseEnter={(e) => { if (job.group_id !== g.id) { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--t1)'; } }}
                        onMouseLeave={(e) => { if (job.group_id !== g.id) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t2)'; } }}
                      >
                        {g.emoji && <span>{g.emoji}</span>}
                        <span style={{ flex: 1 }}>{g.name}</span>
                        {job.group_id === g.id && (
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--gold)" style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
                        )}
                      </button>
                    ))}
                    {/* Remove from group */}
                    {job.group_id && (
                      <button
                        onClick={async () => {
                          setGroupDropOpen(null);
                          await updateJob(job.id, { group_id: null });
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          width: '100%', padding: '7px 10px', borderRadius: '7px',
                          background: 'none', border: 'none', color: 'var(--t3)',
                          fontSize: '11px', cursor: 'pointer', textAlign: 'left', transition: 'all .1s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--t2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t3)'; }}
                      >
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        <span>Remove from group</span>
                      </button>
                    )}
                  </>
                )}
                {/* Divider + Create group */}
                <div style={{ height: '1px', background: 'var(--b1)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    setGroupDropOpen(null);
                    onAddGroup?.();
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    width: '100%', padding: '7px 10px', borderRadius: '7px',
                    background: 'none', border: 'none', color: 'var(--gold)',
                    fontSize: '11px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all .1s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glow)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>
                  <span>Create group</span>
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'status': {
        const isStatusOpen = statusDropOpen === job.id;
        const STATUS_ORDER_LOCAL = ['saved', 'applied', 'screening', 'interview', 'round1', 'round2', 'offer', 'rejected'] as const;
        const STATUS_COLOURS_LOCAL: Record<string, string> = {
          saved: 'var(--t3)', applied: 'var(--blue)', screening: 'var(--teal)',
          interview: 'var(--amber)', round1: 'var(--amber)', round2: 'var(--purple)',
          offer: 'var(--green)', rejected: 'var(--red)',
        };
        const STATUS_LABELS_LOCAL: Record<string, string> = {
          saved: 'Saved', applied: 'Applied', screening: 'Screening',
          interview: 'Interview', round1: 'Round 1', round2: 'Round 2',
          offer: 'Offer', rejected: 'Rejected',
        };
        return (
          <div
            style={{ position: 'relative', display: 'inline-block' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
          >
            <div
              onClick={() => { setStatusDropOpen(isStatusOpen ? null : job.id); setGroupDropOpen(null); }}
              style={{ cursor: 'pointer', borderRadius: '4px', padding: '2px 4px', transition: 'background .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <StatusBadge status={job.status} />
            </div>
            {isStatusOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                minWidth: '150px',
                background: 'var(--s1)',
                border: '1px solid var(--b3)',
                borderRadius: '10px',
                padding: '4px',
                boxShadow: '0 12px 40px rgba(0,0,0,.55)',
                zIndex: 60,
                animation: 'dropdown-in .15s ease both',
              }}>
                {STATUS_ORDER_LOCAL.map((s) => (
                  <button
                    key={s}
                    onClick={async () => {
                      setStatusDropOpen(null);
                      await updateJobStatus(job.id, s);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '7px 10px', borderRadius: '7px',
                      background: job.status === s ? 'var(--s3)' : 'none',
                      border: 'none', color: job.status === s ? 'var(--t1)' : 'var(--t2)',
                      fontSize: '11px', cursor: 'pointer', textAlign: 'left', transition: 'all .1s ease',
                    }}
                    onMouseEnter={(e) => { if (job.status !== s) { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--t1)'; } }}
                    onMouseLeave={(e) => { if (job.status !== s) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t2)'; } }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLOURS_LOCAL[s], flexShrink: 0 }} />
                    {STATUS_LABELS_LOCAL[s]}
                    {job.status === s && (
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--gold)" style={{ marginLeft: 'auto' }}><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'days': {
        const days = daysSince(job.applied_at);
        const overdue = job.status === 'applied' && days !== null && days >= 10;
        return (
          <span style={{ fontSize: '11px', color: overdue ? 'var(--amber)' : 'var(--t3)', fontWeight: overdue ? 500 : 400 }}>
            {days !== null ? `${days}d` : '—'}{overdue ? ' ⚠' : ''}
          </span>
        );
      }

      case 'location': {
        if (isEditing && editing?.field === 'location') {
          return (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit()}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add location"
              style={{ ...cellInput, fontSize: '11px' }}
            />
          );
        }
        return (
          <div
            onClick={(e) => { e.stopPropagation(); startEdit(job, 'location'); }}
            style={{ fontSize: '12px', color: job.location ? 'var(--t2)' : 'var(--t3)', cursor: 'text', borderRadius: '3px', padding: '1px 3px', transition: 'background .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {job.location || '—'}
          </div>
        );
      }

      case 'salary': {
        if (isEditing && editing?.field === 'salary') {
          return (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit()}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add salary"
              style={{ ...cellInput, fontSize: '11px' }}
            />
          );
        }
        return (
          <div
            onClick={(e) => { e.stopPropagation(); startEdit(job, 'salary'); }}
            style={{ fontSize: '12px', color: job.salary ? 'var(--gold)' : 'var(--t3)', fontWeight: job.salary ? 500 : 400, cursor: 'text', borderRadius: '3px', padding: '1px 3px', transition: 'background .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {job.salary || '—'}
          </div>
        );
      }

      case 'last': {
        const lastInt = job.interactions?.[0];
        return (
          <span style={{ fontSize: '11px', color: 'var(--t3)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
            {lastInt
              ? `${new Date(lastInt.interacted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · ${(lastInt.subject || lastInt.channel).substring(0, 36)}…`
              : 'No activity yet'}
          </span>
        );
      }

      case 'fit': {
        const fitCls = job.fit >= 80 ? 'high' : job.fit >= 60 ? 'mid' : job.fit > 0 ? 'low' : 'none';
        const fitColors = { high: { bg: 'var(--gd)', color: 'var(--green)' }, mid: { bg: 'var(--ad)', color: 'var(--amber)' }, low: { bg: 'var(--rdd)', color: 'var(--red)' }, none: { bg: 'var(--s3)', color: 'var(--t3)' } };
        if (isEditing && editing?.field === 'fit') {
          return (
            <input
              ref={inputRef}
              type="number"
              min={0}
              max={100}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit()}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{ ...cellInput, width: '50px', textAlign: 'center', fontSize: '10px' }}
            />
          );
        }
        return (
          <div
            onClick={(e) => { e.stopPropagation(); startEdit(job, 'fit'); }}
            style={{ cursor: 'pointer', borderRadius: '4px', padding: '1px', transition: 'background .15s', display: 'inline-block' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--s3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '20px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              background: fitColors[fitCls].bg,
              color: fitColors[fitCls].color,
            }}>
              {job.fit > 0 ? `${job.fit}%` : '—'}
            </span>
          </div>
        );
      }

      default:
        return null;
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'up .22s ease both' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px 12px', borderBottom: '1px solid var(--b1)', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '-.03em', flexShrink: 0 }}>Applications</span>
        <span style={{ fontSize: '11px', color: 'var(--t3)', background: 'var(--s3)', padding: '2px 8px', borderRadius: '100px', flexShrink: 0 }}>{allJobs.length}</span>
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                style={{
                  padding: '4px 11px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 500,
                  border: '1px solid ' + (isActive ? 'rgba(201,170,126,.25)' : 'var(--b1)'),
                  background: isActive ? 'var(--glow)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--t3)',
                  cursor: 'pointer',
                  transition: 'all .15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--b3)';
                    e.currentTarget.style.color = 'var(--t1)';
                    e.currentTarget.style.background = 'var(--s2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--b1)';
                    e.currentTarget.style.color = 'var(--t3)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <svg style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="var(--t3)">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              padding: '6px 12px 6px 28px',
              borderRadius: '100px',
              background: 'var(--s2)',
              border: '1px solid var(--b1)',
              color: 'var(--t1)',
              fontSize: '11px',
              outline: 'none',
              width: '180px',
              transition: 'border-color .2s',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
          <thead>
            <tr>
              {/* Expand column */}
              <th style={{ width: '36px', padding: '10px 4px 10px 16px', borderBottom: '1px solid var(--b1)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }} />
              {colLabels.map((label, i) => {
                const isSorted = sortKey === colMap[i];
                return (
                  <th
                    key={colMap[i]}
                    onClick={() => toggleSort(colMap[i])}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.09em',
                      color: isSorted ? 'var(--gold)' : 'var(--t3)',
                      borderBottom: '1px solid var(--b1)',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      top: 0,
                      background: 'var(--bg)',
                      zIndex: 1,
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'color .15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSorted) e.currentTarget.style.color = 'var(--t1)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSorted) e.currentTarget.style.color = 'var(--t3)';
                    }}
                  >
                    {label}
                    <span style={{ opacity: isSorted ? 1 : 0.35, marginLeft: '3px', fontStyle: 'normal' }}>↕</span>
                  </th>
                );
              })}
              {/* Delete column */}
              <th style={{ width: '40px', padding: '10px 16px 10px 4px', borderBottom: '1px solid var(--b1)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }} />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', fontSize: '13px' }}>
                  No applications yet — paste a URL above or click Add Job to get started.
                </td>
              </tr>
            ) : (
              sorted.map((job) => (
                <tr
                  key={job.id}
                  className="table-row"
                  onClick={() => selectJob(job.id)}
                >
                  {/* Expand button */}
                  <td style={{ padding: '12px 4px 12px 16px', verticalAlign: 'middle' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); selectJob(job.id); }}
                      title="Open detail view"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--t3)',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all .15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--s3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none'; }}
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </button>
                  </td>

                  {colMap.map((col) => (
                    <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      {renderCell(job, col)}
                    </td>
                  ))}

                  {/* Delete button */}
                  <td style={{ padding: '12px 16px 12px 4px', verticalAlign: 'middle' }}>
                    {confirmDelete === job.id ? (
                      <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(job.id)}
                          style={{
                            background: 'var(--rdd)',
                            border: '1px solid var(--red)',
                            borderRadius: '4px',
                            color: 'var(--red)',
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '3px 6px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={{
                            background: 'var(--s3)',
                            border: '1px solid var(--b2)',
                            borderRadius: '4px',
                            color: 'var(--t3)',
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '3px 6px',
                            cursor: 'pointer',
                          }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(job.id); }}
                        title="Delete application"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--t3)',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all .15s ease',
                          opacity: 0.4,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--rdd)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'none'; }}
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
