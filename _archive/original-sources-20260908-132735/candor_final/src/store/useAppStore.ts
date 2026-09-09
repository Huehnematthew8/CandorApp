'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase';
import type { Group, Job, Note, Stage, JobStatus, StageType, Interaction, Contact } from '@/types';

interface AppState {
  groups: Group[];
  selectedJobId: string | null;
  loading: boolean;
  error: string | null;

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
  contactsHaveEmailPhone: boolean | null;
  addContact: (jobId: string, data: Partial<Contact>) => Promise<{ ok: boolean; missingSchema?: boolean }>;
  updateContact: (jobId: string, contactId: string, data: Partial<Contact>) => Promise<boolean>;
  deleteContact: (jobId: string, contactId: string) => Promise<boolean>;
  selectJob: (id: string | null) => void;

  getAllJobs: () => Job[];
  getJob: (id: string) => Job | undefined;
}

export const useAppStore = create<AppState>((set, get) => {
  const supabase = createClient();

  return {
    groups: [],
    selectedJobId: null,
    loading: false,
    contactsHaveEmailPhone: null,
    error: null,

    loadAllData: async () => {
      set({ loading: true, error: null });
      try {
        const { data: groups, error: gErr } = await supabase
          .from('groups')
          .select('*')
          .order('position');
        if (gErr) throw gErr;

        const { data: jobs, error: jErr } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });
        if (jErr) throw jErr;

        const jobIds = (jobs || []).map((j: Job) => j.id);

        let stages: Stage[] = [];
        let interactions: Interaction[] = [];
        let contacts: Contact[] = [];

        if (jobIds.length > 0) {
          const { data: s } = await supabase
            .from('stages')
            .select('*')
            .in('job_id', jobIds)
            .order('position');
          stages = (s || []) as Stage[];

          const { data: i } = await supabase
            .from('interactions')
            .select('*')
            .in('job_id', jobIds)
            .order('interacted_at', { ascending: false });
          interactions = (i || []) as Interaction[];

          const { data: c } = await supabase
            .from('contacts')
            .select('*')
            .in('job_id', jobIds);
          contacts = (c || []) as Contact[];
        }

        const enrichedJobs: Job[] = (jobs || []).map((job: Job) => ({
          ...job,
          // Normalise legacy string notes to Note objects
          notes: ((job.notes || []) as unknown[]).map((n) =>
            typeof n === 'string' ? { html: n, ts: job.created_at } : n as Note
          ),
          stages: stages.filter((s) => s.job_id === job.id),
          interactions: interactions.filter((i) => i.job_id === job.id),
          contacts: contacts.filter((c) => c.job_id === job.id),
        }));

        const enrichedGroups = (groups || []).map((g: Group) => ({
          ...g,
          jobs: enrichedJobs.filter((j) => j.group_id === g.id),
        }));

        const ungroupedJobs = enrichedJobs.filter((j) => !j.group_id);
        if (ungroupedJobs.length > 0) {
          enrichedGroups.push({
            id: '__ungrouped',
            user_id: '',
            name: 'Ungrouped',
            emoji: '📋',
            position: 999,
            created_at: '',
            jobs: ungroupedJobs,
          });
        }

        set({ groups: enrichedGroups, loading: false });
      } catch (err) {
        set({ error: (err as Error).message, loading: false });
      }
    },

    addGroup: async (name, emoji = '📁') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'Not authenticated' });
        return false;
      }
      const currentGroups = get().groups.filter((g) => g.id !== '__ungrouped');
      const { data, error } = await supabase
        .from('groups')
        .insert({ name, emoji, user_id: user.id, position: currentGroups.length })
        .select()
        .single();
      if (error || !data) {
        set({ error: error?.message || 'Failed to create group' });
        return false;
      }
      set((s) => ({
        groups: [...s.groups.filter((g) => g.id !== '__ungrouped'), { ...data, jobs: [] }, ...s.groups.filter((g) => g.id === '__ungrouped')],
      }));
      return true;
    },

    addJob: async (groupId, data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'Not authenticated' });
        return '';
      }

      const jobData: Record<string, unknown> = {
        user_id: user.id,
        company: data.company || '',
        role: data.role || '',
        status: data.status || 'saved',
        logo: data.logo || '🏢',
      };
      if (groupId) jobData.group_id = groupId;
      if (data.location) jobData.location = data.location;
      if (data.salary) jobData.salary = data.salary;
      if (data.why) jobData.why = data.why;
      if (data.status === 'applied') jobData.applied_at = new Date().toISOString().split('T')[0];

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (error || !newJob) {
        set({ error: error?.message || 'Failed to add job' });
        return '';
      }

      const enriched: Job = { ...newJob, stages: [], interactions: [], contacts: [] };
      set((s) => {
        const groups = s.groups.map((g) => {
          if (g.id === (groupId || '__ungrouped')) {
            return { ...g, jobs: [enriched, ...(g.jobs || [])] };
          }
          return g;
        });

        if (!groupId) {
          const hasUngrouped = groups.some((g) => g.id === '__ungrouped');
          if (!hasUngrouped) {
            groups.push({
              id: '__ungrouped',
              user_id: '',
              name: 'Ungrouped',
              emoji: '📋',
              position: 999,
              created_at: '',
              jobs: [enriched],
            });
          }
        }

        return { groups };
      });

      return newJob.id;
    },

    deleteJob: async (id) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) {
        set({ error: error.message });
        return;
      }
      set((s) => ({
        groups: s.groups
          .map((g) => ({ ...g, jobs: (g.jobs || []).filter((j) => j.id !== id) }))
          .filter((g) => g.id !== '__ungrouped' || (g.jobs && g.jobs.length > 0)),
        selectedJobId: s.selectedJobId === id ? null : s.selectedJobId,
      }));
    },

    updateJob: async (id, updates) => {
      const validCols = ['company', 'role', 'location', 'salary', 'logo', 'status', 'why', 'applied_at', 'saved_tone', 'fit', 'active_stage_id', 'notes', 'group_id', 'jd_summary'];
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const key of validCols) {
        if (key in updates) {
          dbUpdates[key] = (updates as Record<string, unknown>)[key];
        }
      }
      const { error } = await supabase
        .from('jobs')
        .update(dbUpdates)
        .eq('id', id);
      if (error) {
        set({ error: error.message });
        return;
      }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) => (j.id === id ? { ...j, ...updates } : j)),
        })),
      }));
    },

    updateJobStatus: async (id, status) => {
      const updates: Partial<Job> = { status };
      if (status === 'applied') {
        const job = get().getJob(id);
        if (job && !job.applied_at) {
          updates.applied_at = new Date().toISOString().split('T')[0];
        }
      }
      await get().updateJob(id, updates);
    },

    updateJobWhy: async (id, why) => {
      await get().updateJob(id, { why });
    },

    updateJobSalary: async (id, salary) => {
      await get().updateJob(id, { salary });
    },

    updateJobFit: async (id, fit) => {
      await get().updateJob(id, { fit });
    },

    addNote: async (jobId, note) => {
      const job = get().getJob(jobId);
      if (!job) return;
      const newNote: Note = { html: note, ts: new Date().toISOString() };
      const newNotes = [newNote, ...job.notes];
      const { error } = await supabase
        .from('jobs')
        .update({ notes: newNotes, updated_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) {
        set({ error: error.message });
        return;
      }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId ? { ...j, notes: newNotes } : j
          ),
        })),
      }));
    },

    addStage: async (jobId, data) => {
      const job = get().getJob(jobId);
      const position = (job?.stages?.length || 0);
      const { data: newStage, error } = await supabase
        .from('stages')
        .insert({ job_id: jobId, name: data.name, type: data.type, position })
        .select()
        .single();
      if (error) {
        set({ error: error.message });
        return;
      }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId ? { ...j, stages: [...(j.stages || []), newStage] } : j
          ),
        })),
      }));
    },

    setActiveStage: async (jobId, stageId) => {
      const { error } = await supabase
        .from('jobs')
        .update({ active_stage_id: stageId, updated_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) {
        set({ error: error.message });
        return;
      }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId ? { ...j, active_stage_id: stageId } : j
          ),
        })),
      }));
    },

    addInteraction: async (jobId, data) => {
      const { data: newInt, error } = await supabase
        .from('interactions')
        .insert({
          job_id: jobId,
          channel: data.channel || 'email',
          subject: data.subject || null,
          body: data.body || null,
          stage_id: data.stage_id || null,
        })
        .select()
        .single();
      if (error) {
        set({ error: error.message });
        return;
      }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId
              ? { ...j, interactions: [newInt, ...(j.interactions || [])] }
              : j
          ),
        })),
      }));
    },

    updateInteraction: async (jobId, interactionId, data) => {
      const { error } = await supabase
        .from('interactions')
        .update({ ...data })
        .eq('id', interactionId);
      if (error) {
        set({ error: error.message });
        return;
      }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  interactions: (j.interactions || []).map((i) =>
                    i.id === interactionId ? { ...i, ...data } : i
                  ),
                }
              : j
          ),
        })),
      }));
    },

    addContact: async (jobId, data) => {
      const initials = (data.name || '')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const withEmailPhone = get().contactsHaveEmailPhone !== false;
      const insertPayload: Record<string, unknown> = {
        job_id: jobId,
        name: data.name || '',
        role: data.role || null,
        initials,
      };
      if (withEmailPhone) {
        insertPayload.email = data.email || null;
        insertPayload.phone = data.phone || null;
      }

      let { data: newContact, error } = await supabase
        .from('contacts')
        .insert(insertPayload)
        .select()
        .single();

      // If email/phone columns don't exist yet, fall back to basic insert
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
        set({ contactsHaveEmailPhone: false });
        const fallback = await supabase
          .from('contacts')
          .insert({ job_id: jobId, name: data.name || '', role: data.role || null, initials })
          .select()
          .single();
        if (fallback.error) { set({ error: fallback.error.message }); return { ok: false }; }
        if (fallback.data) {
          set((s) => ({
            groups: s.groups.map((g) => ({
              ...g,
              jobs: (g.jobs || []).map((j) =>
                j.id === jobId
                  ? { ...j, contacts: [...(j.contacts || []), fallback.data!] }
                  : j
              ),
            })),
          }));
        }
        return { ok: true, missingSchema: true };
      }

      if (error) {
        set({ error: error.message });
        return { ok: false };
      }

      if (!newContact) return { ok: false };

      if (get().contactsHaveEmailPhone === null) set({ contactsHaveEmailPhone: true });

      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId
              ? { ...j, contacts: [...(j.contacts || []), newContact!] }
              : j
          ),
        })),
      }));
      return { ok: true };
    },

    updateContact: async (jobId, contactId, data) => {
      const withEmailPhone = get().contactsHaveEmailPhone !== false;
      const updatePayload: Record<string, unknown> = {
        name: data.name,
        role: data.role ?? null,
      };
      if (withEmailPhone) {
        updatePayload.email = data.email ?? null;
        updatePayload.phone = data.phone ?? null;
      }

      const { error } = await supabase
        .from('contacts')
        .update(updatePayload)
        .eq('id', contactId);

      if (error) { set({ error: error.message }); return false; }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  contacts: (j.contacts || []).map((c) =>
                    c.id === contactId ? { ...c, ...data } : c
                  ),
                }
              : j
          ),
        })),
      }));
      return true;
    },

    deleteContact: async (jobId, contactId) => {
      const { error } = await supabase.from('contacts').delete().eq('id', contactId);
      if (error) { set({ error: error.message }); return false; }
      set((s) => ({
        groups: s.groups.map((g) => ({
          ...g,
          jobs: (g.jobs || []).map((j) =>
            j.id === jobId
              ? { ...j, contacts: (j.contacts || []).filter((c) => c.id !== contactId) }
              : j
          ),
        })),
      }));
      return true;
    },

    selectJob: (id) => set({ selectedJobId: id }),

    getAllJobs: () => {
      return get().groups.flatMap((g) => g.jobs || []);
    },

    getJob: (id) => {
      return get().getAllJobs().find((j) => j.id === id);
    },
  };
});
