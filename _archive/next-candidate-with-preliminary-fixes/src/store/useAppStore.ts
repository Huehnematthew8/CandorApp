'use client';

import { create } from 'zustand';
import type { Group, Job, Note, StageType, JobStatus, Interaction, Contact } from '@/types';
import { backupWorkspace, emptyMaster, emptyWorkspace, exportRecoveryData, parseWorkspace, readRawWorkspace, saveWorkspace, serialiseWorkspace, type MasterEvidence } from '@/lib/local-workspace';

interface AppState {
  groups: Group[];
  master: MasterEvidence;
  selectedJobId: string | null;
  loading: boolean;
  error: string | null;
  contactsHaveEmailPhone: boolean | null;
  loadAllData: () => Promise<void>;
  addGroup: (name: string, emoji?: string) => Promise<boolean>;
  addJob: (groupId: string, data: Partial<Job>) => Promise<string>;
  deleteJob: (id: string) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  updateJobStatus: (id: string, status: JobStatus) => Promise<void>;
  updateJobWhy: (id: string, why: string) => Promise<void>;
  updateJobSalary: (id: string, salary: string) => Promise<void>;
  updateJobFit: (id: string, fit: number) => Promise<void>;
  addNote: (jobId: string, note: string) => Promise<void>;
  addStage: (jobId: string, data: { name: string; type: StageType }) => Promise<void>;
  setActiveStage: (jobId: string, stageId: string) => Promise<void>;
  addInteraction: (jobId: string, data: Partial<Interaction>) => Promise<void>;
  updateInteraction: (jobId: string, interactionId: string, data: Partial<Pick<Interaction, 'subject' | 'body'>>) => Promise<void>;
  addContact: (jobId: string, data: Partial<Contact>) => Promise<{ ok: boolean; missingSchema?: boolean }>;
  updateContact: (jobId: string, contactId: string, data: Partial<Contact>) => Promise<boolean>;
  deleteContact: (jobId: string, contactId: string) => Promise<boolean>;
  selectJob: (id: string | null) => void;
  getAllJobs: () => Job[];
  getJob: (id: string) => Job | undefined;
  exportWorkspace: () => string;
  exportRecovery: () => string;
  importWorkspace: (raw: string) => Promise<boolean>;
  recoverWorkspace: () => Promise<boolean>;
  updateMaster: (body: string, source: string) => Promise<boolean>;
}

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const normalise = (s: string | null | undefined) => (s ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const duplicateKey = (job: Partial<Job>) => [job.company, job.role, job.location].map(normalise).join('\u0000');

export const useAppStore = create<AppState>((set, get) => {
  let loadedRaw: string | null | undefined;
  let validLoaded = false;
  const error = (value: unknown) => { set({error: value instanceof Error ? value.message : String(value)}); return false; };
  function commit(groups: Group[], master = get().master): boolean {
    try {
      if (!validLoaded || loadedRaw === undefined) throw new Error('Load or recover your saved workspace before editing.');
      loadedRaw = saveWorkspace(groups, master, loadedRaw);
      set({ groups, master, error: null }); return true;
    } catch (err) { return error(err); }
  }
  function replaceJob(jobId: string, updates: Partial<Job>): boolean {
    const previous = get().getJob(jobId);
    if (!previous) return error(new Error('That opportunity no longer exists.'));
    const updated: Job = {...previous, ...updates, id: previous.id, user_id: previous.user_id, created_at: previous.created_at, updated_at: now()};
    const target = updated.group_id || get().groups[0]?.id;
    if (!target || !get().groups.some(g => g.id === target)) return error(new Error('Choose an existing group.'));
    updated.group_id = target;
    if (!updated.company.trim() || !updated.role.trim()) return error(new Error('Company and opportunity name are required.'));
    if (get().getAllJobs().some(j => j.id !== jobId && duplicateKey(j) === duplicateKey(updated))) return error(new Error('This company, opportunity and location already exist, including in the archive. Open or restore the existing record.'));
    const oldDocuments = previous.workflow?.documents || [];
    for (const document of oldDocuments) {
      if (document.state === 'submitted') {
        const next = updated.workflow?.documents?.find(d => d.id === document.id);
        if (JSON.stringify(next) !== JSON.stringify(document)) return error(new Error('Submitted documents are historical records. Create a new draft instead of changing or removing the sent copy.'));
      }
    }
    return commit(get().groups.map(group => ({...group, jobs: group.id === target
      ? (group.jobs || []).some(j => j.id === jobId) ? (group.jobs || []).map(j => j.id === jobId ? updated : j) : [updated, ...(group.jobs || [])]
      : (group.jobs || []).filter(j => j.id !== jobId)})));
  }
  return {
    groups: [], master: emptyMaster(), selectedJobId: null, loading: false, error: null, contactsHaveEmailPhone: true,
    loadAllData: async () => {
      set({loading: true, error: null});
      try {
        loadedRaw = readRawWorkspace();
        const data = loadedRaw === null ? {groups: emptyWorkspace(), master: emptyMaster()} : parseWorkspace(loadedRaw);
        validLoaded = true;
        set({groups: data.groups, master: data.master, selectedJobId: null, loading: false});
      } catch (err) { validLoaded = false; set({loading: false}); error(err); }
    },
    addGroup: async (name, emoji = '📁') => {
      if (!name.trim()) return error(new Error('Enter a group name.'));
      if (get().groups.some(g => normalise(g.name) === normalise(name))) return error(new Error('That group already exists.'));
      return commit([...get().groups, {id: id(), user_id: 'local', name: name.trim(), emoji, position: get().groups.length, created_at: now(), jobs: []}]);
    },
    addJob: async (groupId, data) => {
      const target = groupId || get().groups[0]?.id;
      if (!target || !get().groups.some(g => g.id === target)) { error(new Error('Choose an existing group.')); return ''; }
      if (!data.company?.trim() || !data.role?.trim()) { error(new Error('Company and opportunity name are required.')); return ''; }
      if (get().getAllJobs().some(j => duplicateKey(j) === duplicateKey(data))) { error(new Error('This opportunity already exists, including in the archive. Open or restore the existing record.')); return ''; }
      const jobId = id();
      const job: Job = {
        location: null, salary: null, logo: '🏢', status: 'saved', why: null, applied_at: null, saved_tone: 'professional', fit: 0, active_stage_id: null, jd_summary: null,
        ...data, company: data.company.trim(), role: data.role.trim(), id: jobId, user_id: 'local', group_id: target, created_at: now(), updated_at: now(),
        notes: data.notes ?? [], stages: (data.stages ?? []).map(s => ({...s, job_id: jobId})), contacts: (data.contacts ?? []).map(c => ({...c, job_id: jobId})), interactions: (data.interactions ?? []).map(i => ({...i, job_id: jobId})),
      };
      return commit(get().groups.map(g => g.id === target ? {...g, jobs: [job, ...(g.jobs || [])]} : g)) ? job.id : '';
    },
    deleteJob: async jobId => { if (replaceJob(jobId, {archived_at: now()})) set({selectedJobId: get().selectedJobId === jobId ? null : get().selectedJobId}); },
    updateJob: async (jobId, updates) => { replaceJob(jobId, updates); },
    updateJobStatus: async (jobId, status) => { replaceJob(jobId, {status}); },
    updateJobWhy: async (jobId, why) => { replaceJob(jobId, {why}); },
    updateJobSalary: async (jobId, salary) => { replaceJob(jobId, {salary}); },
    updateJobFit: async (jobId, fit) => { replaceJob(jobId, {fit}); },
    addNote: async (jobId, html) => {
      const job = get().getJob(jobId);
      if (!html.trim()) { error(new Error('Enter a note before saving.')); return; }
      const note: Note = {html, ts: now()}; replaceJob(jobId, {notes: [note, ...(job?.notes ?? [])]});
    },
    addStage: async (jobId, data) => {
      const job = get().getJob(jobId);
      if (!data.name.trim()) { error(new Error('Enter a stage name.')); return; }
      if (job?.stages?.some(s => normalise(s.name) === normalise(data.name))) { error(new Error('That stage already exists.')); return; }
      replaceJob(jobId, {stages: [...(job?.stages || []), {id: id(), job_id: jobId, name: data.name.trim(), type: data.type, position: job?.stages?.length || 0}]});
    },
    setActiveStage: async (jobId, stageId) => {
      if (!get().getJob(jobId)?.stages?.some(s => s.id === stageId)) { error(new Error('Choose a stage belonging to this opportunity.')); return; }
      replaceJob(jobId, {active_stage_id: stageId});
    },
    addInteraction: async (jobId, data) => {
      const job = get().getJob(jobId);
      replaceJob(jobId, {interactions: [{channel: 'note', subject: null, body: null, stage_id: null, interacted_at: now(), ...data, id: id(), job_id: jobId}, ...(job?.interactions || [])]});
    },
    updateInteraction: async (jobId, interactionId, data) => {
      const job = get().getJob(jobId);
      if (!job?.interactions?.some(i => i.id === interactionId)) { error(new Error('That interaction no longer exists.')); return; }
      replaceJob(jobId, {interactions: job.interactions.map(i => i.id === interactionId ? {...i, ...data, id: i.id, job_id: jobId} : i)});
    },
    addContact: async (jobId, data) => {
      if (!data.name?.trim()) return {ok: error(new Error('Enter a contact name.'))};
      const job = get().getJob(jobId);
      const contact: Contact = {role: null, email: null, phone: null, initials: data.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2), ...data, id: id(), job_id: jobId, name: data.name.trim()};
      return {ok: replaceJob(jobId, {contacts: [...(job?.contacts || []), contact]})};
    },
    updateContact: async (jobId, contactId, data) => {
      const job = get().getJob(jobId);
      if (!job?.contacts?.some(c => c.id === contactId)) return error(new Error('That contact no longer exists.'));
      if (data.name !== undefined && !data.name.trim()) return error(new Error('Enter a contact name.'));
      return replaceJob(jobId, {contacts: job.contacts.map(c => c.id === contactId ? {...c, ...data, id: c.id, job_id: jobId} : c)});
    },
    deleteContact: async (jobId, contactId) => {
      const job = get().getJob(jobId);
      if (!job?.contacts?.some(c => c.id === contactId)) return error(new Error('That contact no longer exists.'));
      return replaceJob(jobId, {contacts: job.contacts.filter(c => c.id !== contactId)});
    },
    selectJob: selectedJobId => set({selectedJobId}),
    getAllJobs: () => get().groups.flatMap(g => g.jobs || []),
    getJob: jobId => get().getAllJobs().find(j => j.id === jobId),
    exportWorkspace: () => {
      if (!validLoaded) throw new Error('Use Export recovery to preserve unreadable stored data.');
      return serialiseWorkspace(get().groups, get().master);
    },
    exportRecovery: () => exportRecoveryData(),
    importWorkspace: async raw => {
      try {
        const imported = parseWorkspace(raw);
        const existing = readRawWorkspace();
        if (validLoaded && loadedRaw !== existing) throw new Error('Workspace changed in another tab. Reload before importing.');
        loadedRaw = saveWorkspace(imported.groups, imported.master, existing, true);
        validLoaded = true;
        set({groups: imported.groups, master: imported.master, selectedJobId: null, error: null}); return true;
      } catch (err) { return error(err); }
    },
    recoverWorkspace: async () => {
      try { const backup = backupWorkspace(); return await get().importWorkspace(JSON.stringify(backup)); }
      catch (err) { return error(err); }
    },
    updateMaster: async (body, source) => {
      const master = get().master;
      if (body === master.body && source === master.source) { set({error: null}); return true; }
      const history = master.revision ? [...master.history, {body: master.body, source: master.source, revision: master.revision}] : master.history;
      return commit(get().groups, {body, source, revision: id(), history});
    },
  };
});
