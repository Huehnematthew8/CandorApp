import type { Group } from '@/types';

export const WORKSPACE_KEY = 'candor.workspace.v1';
export const BACKUP_KEY = `${WORKSPACE_KEY}.backup`;
export interface MasterEvidence { body: string; source: string; revision: string; history: Array<{body: string; source: string; revision: string}> }
export const emptyMaster = (): MasterEvidence => ({body: '', source: '', revision: '', history: []});
export interface Workspace { version: 1; savedAt: string; groups: Group[]; master: MasterEvidence }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const fail = (message: string): never => { throw new Error(`Workspace data: ${message}`); };
function strings(record: Record<string, unknown>, keys: string[], nullable = false) {
  for (const key of keys) if (typeof record[key] !== 'string' && !(nullable && record[key] == null)) fail(`${key} must be text${nullable ? ' or empty' : ''}.`);
}
function list(value: unknown, label: string): unknown[] { if (!Array.isArray(value)) fail(`${label} must be a list.`); return value as unknown[]; }
function unique(items: unknown[], label: string, visit: (item: Record<string, unknown>) => void) {
  const ids = new Set<string>();
  for (const item of items) {
    if (!object(item) || typeof item.id !== 'string' || !item.id.trim()) fail(`${label} needs an ID.`);
    const row = item as Record<string, unknown>;
    if (ids.has(row.id as string)) fail(`Duplicate ${label} ID.`);
    ids.add(row.id as string); visit(row);
  }
}
export function validateWorkspace(input: unknown): Workspace {
  if (!object(input) || input.version !== 1) fail('This is not a supported Candor version 1 export. Nothing was replaced.');
  const data = input as Record<string, unknown>;
  strings(data, ['savedAt']);
  if (!object(data.master)) fail('Master evidence is required.');
  strings(data.master as Record<string, unknown>, ['body','source','revision']);
  for (const item of list((data.master as Record<string, unknown>).history, 'Master history')) { if (!object(item)) fail('Invalid master history.'); strings(item as Record<string, unknown>, ['body','source','revision']); }
  const jobIds = new Set<string>();
  unique(list(data.groups, 'Groups'), 'group', group => {
    strings(group, ['name', 'emoji', 'created_at', 'user_id']);
    if (typeof group.position !== 'number' || !Number.isFinite(group.position)) fail('Invalid group position.');
    unique(list(group.jobs, 'Jobs'), 'job', job => {
      if (jobIds.has(job.id as string)) fail('Duplicate job ID across groups.');
      jobIds.add(job.id as string);
      if (job.group_id !== group.id) fail('A job belongs to a different group.');
      strings(job, ['company', 'role', 'logo', 'status', 'user_id', 'created_at', 'updated_at', 'saved_tone']);
      if (!(job.company as string).trim() || !(job.role as string).trim()) fail('Company and role are required.');
      if (!['saved','found','researching','ready','applied','screening','interview','interviewing','round1','round2','offer','rejected','withdrawn','closed'].includes(job.status as string)) fail('Unknown application status.');
      strings(job, ['location','salary','why','applied_at','active_stage_id','jd_summary','archived_at'], true);
      if (typeof job.fit !== 'number' || !Number.isFinite(job.fit)) fail('Invalid fit value.');
      for (const note of list(job.notes, 'Notes')) { if (!object(note)) fail('Invalid note.'); strings(note as Record<string, unknown>, ['html', 'ts']); }
      for (const key of ['stages','contacts','interactions']) {
        unique(list(job[key] ?? [], key), key, row => {
          if (row.job_id !== job.id) fail(`${key} belongs to a different job.`);
          if (key === 'contacts') { strings(row, ['name']); strings(row, ['role','email','phone','initials'], true); }
          if (key === 'stages') {
            strings(row, ['name','type']);
            if (!['default','screening','interview','test','task','call','portal','offer','custom','other'].includes(row.type as string) || typeof row.position !== 'number') fail('Invalid stage.');
          }
          if (key === 'interactions') {
            strings(row, ['channel','interacted_at']); strings(row, ['subject','body','stage_id'], true);
            if (!['email','call','message','linkedin','meeting','note','portal','file'].includes(row.channel as string)) fail('Invalid interaction channel.');
          }
        });
      }
      if (job.workflow !== undefined) {
        if (!object(job.workflow)) fail('Invalid workflow.');
        const workflow = job.workflow as Record<string, unknown>;
        // Preserve all version-1 workflow fields, while guarding structures consumed by the UI.
        for (const [key, value] of Object.entries(workflow)) {
          if (['documents','evidence','contacts','history'].includes(key)) { if (!Array.isArray(value)) fail(`${key} must be a list.`); }
          else if (value !== null && typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number' && !Array.isArray(value) && !object(value)) fail(`Invalid workflow ${key}.`);
        }
        if (workflow.documents !== undefined) unique(list(workflow.documents, 'Documents'), 'document', doc => {
          strings(doc, ['title','body','source','masterRevision']);
          if (!['draft','submitted'].includes(doc.state as string)) fail('Invalid document state.');
          list(doc.history, 'Document history');
          if (doc.state === 'submitted' && (typeof doc.submittedAt !== 'string' || !doc.submittedAt)) fail('Submitted documents need their recorded submission date.');
        });
      }
    });
  });
  return input as Workspace;
}
export function parseWorkspace(raw: string): Workspace {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Saved workspace is not valid JSON. Export recovery data or restore a backup. Existing data was not changed.'); }
  return validateWorkspace(parsed);
}
function storage(): Storage {
  if (typeof window === 'undefined') throw new Error('Local workspace is available in your browser.');
  try { return window.localStorage; } catch { throw new Error('Browser storage is unavailable. Your changes have not been saved.'); }
}
export function readRawWorkspace(): string | null { return storage().getItem(WORKSPACE_KEY); }
export function emptyWorkspace(): Group[] {
  return ['Australia', 'International'].map((name, position) => ({id: position === 0 ? 'australia' : 'international', user_id: 'local', name, emoji: position === 0 ? '🇦🇺' : '🌏', position, created_at: new Date().toISOString(), jobs: []}));
}
export function serialiseWorkspace(groups: Group[], master: MasterEvidence): string {
  const raw = JSON.stringify({ version: 1, savedAt: new Date().toISOString(), groups, master });
  parseWorkspace(raw); return raw;
}
/** Compare-before-write prevents silently replacing another tab's changes. Backup is written first. */
export function saveWorkspace(groups: Group[], master: MasterEvidence, expectedRaw: string | null, explicitReplacement = false): string {
  const raw = serialiseWorkspace(groups, master);
  const target = storage();
  const existing = target.getItem(WORKSPACE_KEY);
  if (existing !== expectedRaw) throw new Error('This workspace changed in another tab. Reload before saving; your stored data is unchanged.');
  if (existing !== null) {
    let valid = true;
    try { parseWorkspace(existing); } catch { valid = false; }
    if (!valid && !explicitReplacement) throw new Error('Saved data needs recovery before editing. Export recovery data first.');
    if (valid) target.setItem(BACKUP_KEY, existing);
    else target.setItem(`${WORKSPACE_KEY}.recovery.${crypto.randomUUID()}`, existing);
  }
  try { target.setItem(WORKSPACE_KEY, raw); }
  catch { throw new Error('Browser storage could not save this change (it may be full or blocked). Your previous workspace is unchanged. Export a backup before retrying.'); }
  return raw;
}
export function backupWorkspace(): Workspace {
  const raw = storage().getItem(BACKUP_KEY);
  if (!raw) throw new Error('No saved backup is available in this browser.');
  return parseWorkspace(raw);
}
export function exportRecoveryData(): string {
  const target = storage();
  const records: Record<string, string | null> = {};
  for (let i = 0; i < target.length; i++) { const key = target.key(i); if (key === WORKSPACE_KEY || key === BACKUP_KEY || key?.startsWith(`${WORKSPACE_KEY}.recovery.`)) records[key] = target.getItem(key); }
  return JSON.stringify({ kind: 'candor-raw-recovery', exportedAt: new Date().toISOString(), records }, null, 2);
}
