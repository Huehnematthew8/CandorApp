'use client';

import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';

interface RowJob {
  _id: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  url: string;
  why: string;
  status: 'pending' | 'fetching' | 'ready' | 'error';
  errorMsg?: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ── CSV helpers ─────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += c; }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text: string): RowJob[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
  const pick = (...keys: string[]) => (row: string[]) => {
    for (const k of keys) {
      const i = headers.indexOf(k);
      if (i >= 0 && row[i]) return row[i].replace(/^["']|["']$/g, '').trim();
    }
    return '';
  };

  return lines.slice(1).map(line => {
    const row = parseCSVLine(line);
    return {
      _id: uid(),
      company:  pick('company', 'company name', 'employer', 'organization')(row),
      role:     pick('role', 'title', 'job title', 'position', 'job')(row),
      location: pick('location', 'city', 'place', 'region')(row),
      salary:   pick('salary', 'salary range', 'compensation', 'pay', 'wage')(row),
      url:      pick('url', 'link', 'href', 'job url', 'job link')(row),
      why:      pick('why', 'description', 'notes', 'note', 'details', 'summary')(row),
      status: 'ready' as const,
    };
  }).filter(r => r.company || r.role || r.url);
}

function parseURLList(text: string): RowJob[] {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.startsWith('http'))
    .map(url => ({ _id: uid(), company: '', role: '', location: '', salary: '', url, why: '', status: 'pending' as const }));
}

// ── Component ────────────────────────────────────────────────────
interface BulkImportModalProps {
  onClose: () => void;
}

type Stage = 'upload' | 'review' | 'adding' | 'done';

export default function BulkImportModal({ onClose }: BulkImportModalProps) {
  const { addJob } = useAppStore();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>('upload');
  const [jobs, setJobs] = useState<RowJob[]>([]);
  const [pasteVal, setPasteVal] = useState('');
  const [addedCount, setAddedCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateRow = useCallback((id: string, patch: Partial<RowJob>) => {
    setJobs(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r));
  }, []);

  // ── Parse file or text ─────────────────────────────────────────
  function ingest(text: string, filename = '') {
    const isCSV = filename.endsWith('.csv') || (text.includes(',') && !text.trim().startsWith('http'));
    const rows = isCSV ? parseCSV(text) : parseURLList(text);
    if (!rows.length) { toast('No jobs found — check the file format'); return; }
    setJobs(rows);
    setStage('review');
    if (!isCSV) extractURLs(rows);
  }

  function handleFile(file: File) {
    file.text().then(t => ingest(t, file.name));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Fetch each URL through import-url ──────────────────────────
  async function extractURLs(rows: RowJob[]) {
    const pending = rows.filter(r => r.status === 'pending');
    const BATCH = 3;
    for (let i = 0; i < pending.length; i += BATCH) {
      const batch = pending.slice(i, i + BATCH);
      await Promise.all(batch.map(async row => {
        updateRow(row._id, { status: 'fetching' });
        try {
          const res = await fetch('/api/import-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: row.url }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          updateRow(row._id, {
            company:  data.company  || row.company,
            role:     data.role     || row.role,
            location: data.location || row.location,
            salary:   data.salary   || row.salary,
            why:      data.description || row.why,
            status: 'ready',
          });
        } catch {
          updateRow(row._id, { status: 'error', errorMsg: 'Could not fetch' });
        }
      }));
    }
  }

  // ── Add all ready jobs ─────────────────────────────────────────
  async function handleAddAll() {
    const ready = jobs.filter(r => r.status === 'ready');
    setStage('adding');
    let added = 0;
    for (const job of ready) {
      try {
        await addJob('', {
          company: job.company || 'Unknown',
          role: job.role || 'Unknown role',
          location: job.location || null,
          salary: job.salary || null,
          why: job.why || null,
          status: 'saved',
          logo: '🏢',
        });
        added++;
        setAddedCount(added);
      } catch {
        // continue with others
      }
    }
    setStage('done');
    toast(`${added} job${added !== 1 ? 's' : ''} added to your list`);
  }

  const readyCount  = jobs.filter(r => r.status === 'ready').length;
  const fetchingCount = jobs.filter(r => r.status === 'fetching' || r.status === 'pending').length;
  const errorCount  = jobs.filter(r => r.status === 'error').length;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ width: '620px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', marginBottom: '3px' }}>
            Bulk import
          </div>
          <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
            Upload a list of job URLs or a CSV with company, role, location, salary, description.
          </div>
        </div>

        {/* ── Upload stage ── */}
        {stage === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--b2)'}`,
                borderRadius: '10px',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'var(--glow2)' : 'var(--s2)',
                transition: 'all .15s ease',
              }}
            >
              <input ref={fileRef} type="file" accept=".txt,.csv" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', marginBottom: '4px' }}>
                Drop a file or click to browse
              </div>
              <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
                <strong>.txt</strong> — one URL per line &nbsp;·&nbsp; <strong>.csv</strong> — company, role, location, salary, url, description columns
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--b1)' }} />
              <span style={{ fontSize: '10px', color: 'var(--t3)' }}>or paste</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--b1)' }} />
            </div>

            {/* Paste area */}
            <textarea
              value={pasteVal}
              onChange={e => setPasteVal(e.target.value)}
              placeholder={'Paste URLs (one per line):\nhttps://jobs.company.com/role-1\nhttps://jobs.company.com/role-2\n\nOr paste CSV rows…'}
              rows={6}
              className="input-field"
              style={{ resize: 'vertical', fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.5 }}
            />

            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn-gold"
                disabled={!pasteVal.trim()}
                style={{ opacity: pasteVal.trim() ? 1 : 0.5 }}
                onClick={() => ingest(pasteVal)}
              >
                Process
              </button>
            </div>
          </div>
        )}

        {/* ── Review stage ── */}
        {stage === 'review' && (
          <>
            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexShrink: 0 }}>
              {fetchingCount > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 10, height: 10, border: '1.5px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                  Fetching {fetchingCount} job{fetchingCount !== 1 ? 's' : ''}…
                </span>
              )}
              {readyCount > 0 && <span style={{ fontSize: '11px', color: 'var(--green)' }}>✓ {readyCount} ready</span>}
              {errorCount > 0 && <span style={{ fontSize: '11px', color: 'var(--red)' }}>✗ {errorCount} failed</span>}
            </div>

            {/* Job list */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {jobs.map(job => (
                <div key={job._id} style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr 1fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: job.status === 'error' ? 'var(--rdd)' : 'var(--s2)',
                  border: `1px solid ${job.status === 'error' ? 'rgba(196,96,96,.2)' : job.status === 'ready' ? 'rgba(78,163,117,.15)' : 'var(--b1)'}`,
                  opacity: job.status === 'error' ? 0.7 : 1,
                  transition: 'all .2s ease',
                }}>
                  {/* Status icon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {job.status === 'fetching' && (
                      <span style={{ width: 10, height: 10, border: '1.5px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                    )}
                    {job.status === 'pending' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--b2)', display: 'inline-block' }} />}
                    {job.status === 'ready'   && <span style={{ fontSize: '12px', color: 'var(--green)' }}>✓</span>}
                    {job.status === 'error'   && <span style={{ fontSize: '12px', color: 'var(--red)' }}>✗</span>}
                  </div>

                  {/* Company */}
                  <input
                    value={job.company}
                    onChange={e => updateRow(job._id, { company: e.target.value })}
                    placeholder="Company"
                    style={{ fontSize: '11px', fontWeight: 600, background: 'transparent', border: 'none', outline: 'none', color: 'var(--t1)', width: '100%' }}
                  />

                  {/* Role */}
                  <input
                    value={job.role}
                    onChange={e => updateRow(job._id, { role: e.target.value })}
                    placeholder="Role"
                    style={{ fontSize: '11px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--t2)', width: '100%' }}
                  />

                  {/* Location */}
                  <input
                    value={job.location}
                    onChange={e => updateRow(job._id, { location: e.target.value })}
                    placeholder="Location"
                    style={{ fontSize: '11px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--t3)', width: '100%' }}
                  />

                  {/* Remove */}
                  <button
                    onClick={() => setJobs(prev => prev.filter(r => r._id !== job._id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; }}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn-gold"
                onClick={handleAddAll}
                disabled={readyCount === 0 || fetchingCount > 0}
                style={{ opacity: readyCount > 0 && fetchingCount === 0 ? 1 : 0.5 }}
              >
                Add {readyCount} job{readyCount !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {/* ── Adding stage ── */}
        {stage === 'adding' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid var(--b2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '13px', color: 'var(--t1)', fontWeight: 500 }}>Adding jobs…</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '4px' }}>{addedCount} of {jobs.filter(r => r.status === 'ready').length} added</div>
          </div>
        )}

        {/* ── Done stage ── */}
        {stage === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--t1)', marginBottom: '6px' }}>{addedCount} job{addedCount !== 1 ? 's' : ''} added</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '20px' }}>They&apos;re in your list as Saved — open each to add your why.</div>
            <button className="btn-gold" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
