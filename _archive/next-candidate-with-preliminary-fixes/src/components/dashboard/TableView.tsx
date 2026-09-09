'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge, STATUS_LABELS, STATUS_ORDER } from '@/components/ui/StatusBadge';
import type { Job, JobStatus } from '@/types';

type Market = 'australia' | 'international' | 'unknown';
const ENDED = new Set(['closed', 'rejected', 'withdrawn']);
const PROGRESS: Record<string, number> = { offer: 8, round2: 7, round1: 6, interviewing: 6, interview: 6, screening: 5, applied: 4, ready: 3, researching: 2, saved: 1, found: 1 };

export default function TableView({ onAddGroup }: { onAddGroup?: () => void } = {}) {
  const { groups, selectJob, updateJob } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState('all');
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState('all');
  const [archived, setArchived] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  function marketFor(job: Job): Market {
    const groupName = groups.find((g) => g.id === job.group_id)?.name || '';
    if (/international|overseas/i.test(groupName)) return 'international';
    if (/australia/i.test(groupName)) return 'australia';
    if (/\b(australia|sydney|melbourne|brisbane|perth|adelaide|canberra|hobart|darwin|nsw|qld|vic)\b/i.test(job.location || '')) return 'australia';
    if (/\b(international|overseas|singapore|london|new york|san francisco|united states|united kingdom|new zealand|auckland|wellington|dubai|hong kong)\b/i.test(job.location || '')) return 'international';
    return 'unknown';
  }

  const jobs = useMemo(() => groups.flatMap((g) => g.jobs || []), [groups]);
  const visible = jobs.filter((job) => {
    if (Boolean(job.archived_at) !== archived) return false;
    if (status !== 'all' && job.status !== status) return false;
    if (group !== 'all' && (job.group_id || '__ungrouped') !== group) return false;
    if (market !== 'all' && marketFor(job) !== market) return false;
    const searchable = [job.company, job.role, job.location, job.workflow?.nextAction, ...(job.contacts || []).map((c) => c.name)].join(' ').toLocaleLowerCase();
    return searchable.includes(search.trim().toLocaleLowerCase());
  }).sort((a, b) => {
    const ended = Number(ENDED.has(a.status)) - Number(ENDED.has(b.status));
    if (ended) return ended;
    const local = Number(marketFor(b) === 'australia') - Number(marketFor(a) === 'australia');
    if (local) return local;
    const progress = (PROGRESS[b.status] || 0) - (PROGRESS[a.status] || 0);
    if (progress) return progress;
    const contacts = (b.contacts?.length || 0) - (a.contacts?.length || 0);
    return contacts || a.company.localeCompare(b.company) || a.role.localeCompare(b.role);
  });

  async function changeArchive(job: Job) {
    if (busy) return;
    setBusy(job.id);
    try {
      await updateJob(job.id, { archived_at: job.archived_at ? null : new Date().toISOString() });
      const error = useAppStore.getState().error;
      if (error) toast(error);
      else toast(job.archived_at ? 'Role restored' : 'Role archived — restore it from Archived');
    } catch { toast('Could not save. Your role is still available.'); }
    finally { setBusy(null); }
  }

  function dueLabel(value: string) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : value;
  }

  return <section className="role-list" aria-labelledby="applications-title">
    <div className="list-heading">
      <div><h1 id="applications-title">{archived ? 'Archived roles' : 'Applications'}</h1><p>Authenticity over volume. Keep the context and follow through.</p></div>
      <label className="archive-toggle"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} /> Archived</label>
    </div>
    <div className="list-filters">
      <label className="search-label">Search roles or contacts<input className="input-field" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company, role, contact or next action" /></label>
      <label>Location<select className="input-field" value={market} onChange={(e) => setMarket(e.target.value)}><option value="all">All locations</option><option value="australia">Australia</option><option value="international">International</option><option value="unknown">Location to confirm</option></select></label>
      <label>Group<select className="input-field" value={group} onChange={(e) => setGroup(e.target.value)}><option value="all">All groups</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.id === '__ungrouped' ? 'Ungrouped' : g.name}</option>)}</select></label>
      <label>Status<select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{STATUS_ORDER.map((s: JobStatus) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
      {onAddGroup && <button className="btn-ghost" onClick={onAddGroup}>+ Group</button>}
    </div>
    <p className="list-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'role' : 'roles'} · Active Australian opportunities first, then progress and contacts.</p>
    {visible.length === 0 ? <div className="empty-list"><h2>{jobs.length ? 'No roles match these filters' : 'Start with one worthwhile opportunity'}</h2><p>{jobs.length ? 'Try another location, group or status, or switch between active and archived roles.' : 'Use Add role to save a vacancy or a company you want to explore. You can add contacts and evidence as you go.'}</p></div> : <table>
      <caption className="sr-only">Tracked roles, status, contacts and next action</caption>
      <thead><tr><th scope="col">Company / role</th><th scope="col">Status</th><th scope="col">Contacts</th><th scope="col">Next action</th><th scope="col">Manage</th></tr></thead>
      <tbody>{visible.map((job) => <tr key={job.id}>
        <td data-label="Company / role"><button className="role-link" onClick={() => selectJob(job.id)}><span aria-hidden="true">{job.logo || '🏢'}</span><span><strong>{job.company}</strong><span>{job.role}</span></span></button><div className="location">{job.location || 'Location to confirm'}{job.workflow?.kind === 'target' ? ' · Company to explore' : ''}</div></td>
        <td data-label="Status"><StatusBadge status={job.status} /></td>
        <td data-label="Contacts">{job.contacts?.length ? <><strong>{job.contacts.length}</strong><div className="contact-names">{job.contacts.map((c) => c.name).join(', ')}</div></> : <span className="muted">No contacts yet</span>}</td>
        <td data-label="Next action"><span>{job.workflow?.nextAction || 'Choose a next action'}</span>{job.workflow?.nextActionDue && <div className="due">Due {dueLabel(job.workflow.nextActionDue)}</div>}</td>
        <td data-label="Manage"><button className="btn-ghost" disabled={busy === job.id} onClick={() => changeArchive(job)} aria-label={`${archived ? 'Restore' : 'Archive'} ${job.company} ${job.role}`}>{busy === job.id ? 'Saving…' : archived ? 'Restore' : 'Archive'}</button></td>
      </tr>)}</tbody>
    </table>}
    <style jsx>{`
      .role-list { flex:1; overflow:auto; padding:24px; }
      h1 { font-size:25px; font-weight:750; letter-spacing:-.035em; margin:0 0 6px; }
      h2 { font-size:18px; margin:0 0 8px; }
      p { color:var(--t2); font-size:13px; line-height:1.6; }
      .list-heading { display:flex; justify-content:space-between; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
      .archive-toggle { display:flex; gap:8px; align-items:center; font-size:13px; }
      .archive-toggle input { width:18px; height:18px; accent-color:var(--gold); }
      .list-filters { display:flex; gap:12px; flex-wrap:wrap; align-items:end; }
      .list-filters label { display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--t2); }
      .search-label { flex:1; min-width:220px; }
      .list-count { font-size:12px; margin:16px 0; }
      table { width:100%; border-collapse:collapse; background:var(--s1); border:1px solid var(--b1); }
      th { font-size:11px; text-align:left; color:var(--t2); background:var(--s2); }
      th, td { padding:14px; border-bottom:1px solid var(--b1); }
      td { font-size:13px; vertical-align:top; overflow-wrap:anywhere; }
      .role-link { display:flex; gap:10px; text-align:left; background:none; border:none; color:var(--t1); cursor:pointer; padding:2px; }
      .role-link strong { display:block; font-size:14px; margin-bottom:4px; }
      .role-link span span { display:block; font-size:12px; }
      .role-link:hover strong { color:var(--gold); text-decoration:underline; }
      .location, .contact-names, .due { font-size:11px; color:var(--t2); margin-top:6px; line-height:1.5; }
      .contact-names { max-width:170px; }
      .muted { color:var(--t2); font-size:12px; }
      .empty-list { max-width:600px; text-align:center; margin:60px auto; }
      .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }
      .role-list :global(:focus-visible) { outline:3px solid var(--gold); outline-offset:3px; }
      @media(max-width:720px) { .role-list { padding:16px 12px; } .list-filters > label { flex:1; min-width:130px; } .list-filters .search-label { flex-basis:100%; } table, tbody { display:block; border:0; background:none; } thead { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); } tr { display:block; padding:8px; margin-bottom:12px; border:1px solid var(--b1); border-radius:12px; background:var(--s1); } td { display:block; padding:9px; border:0; } td:not(:first-child)::before { content:attr(data-label); display:block; font-size:10px; color:var(--t2); margin-bottom:5px; } .contact-names { max-width:none; } }
    `}</style>
  </section>;
}
