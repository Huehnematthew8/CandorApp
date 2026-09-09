export type JobStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'round1'
  | 'round2'
  | 'offer'
  | 'rejected';

export type StageType =
  | 'default'
  | 'screening'
  | 'interview'
  | 'test'
  | 'task'
  | 'call'
  | 'portal'
  | 'offer'
  | 'custom'
  | 'other';

export type InteractionChannel =
  | 'email'
  | 'call'
  | 'message'
  | 'linkedin'
  | 'meeting'
  | 'note'
  | 'portal'
  | 'file';

export type Tone = 'professional' | 'warm' | 'bold' | 'assertive' | 'enthusiastic' | 'grateful';

export interface Group {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  position: number;
  created_at: string;
  jobs?: Job[];
}

export interface JobImportData {
  description: string | null;
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  team: string | null;
  reports_to: string | null;
  job_type: string | null;
  experience_level: string | null;
  deadline: string | null;
  company_about: string | null;
  culture_keywords: string[];
  tech_stack: string[];
}

export interface Note {
  html: string;
  ts: string;
}

export interface Job {
  id: string;
  user_id: string;
  group_id: string | null;
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  logo: string;
  status: JobStatus;
  why: string | null;
  applied_at: string | null;
  saved_tone: Tone;
  fit: number;
  active_stage_id: string | null;
  notes: Note[];
  jd_summary: string | null;
  created_at: string;
  updated_at: string;
  group?: Group;
  stages?: Stage[];
  interactions?: Interaction[];
  contacts?: Contact[];
}

export type CommunicationType = 'email' | 'cover-letter' | 'interview-prep' | 'call-prep';

export interface Stage {
  id: string;
  job_id: string;
  name: string;
  type: StageType;
  position: number;
}

export interface Interaction {
  id: string;
  job_id: string;
  channel: InteractionChannel;
  subject: string | null;
  body: string | null;
  interacted_at: string;
  stage_id: string | null;
}

export interface Contact {
  id: string;
  job_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  initials: string | null;
}
