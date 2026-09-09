export type JobStatus = 'draft' | 'applied' | 'interviewing' | 'offer' | 'rejected'

export type EmailDirection = 'sent' | 'received'

export type EmailType = 'cover_letter' | 'follow_up' | 'thank_you' | 'response' | 'other'

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  name?: string
  headline?: string
  narrative?: string
  skills: string[]
  timeline: any[] // JSON
  strengths: string[]
  resume_url?: string
  resume_parsed_at?: string
  voice_samples?: any // JSON
  created_at: string
  updated_at: string
}

export interface Industry {
  id: string
  user_id: string
  name: string
  emoji: string
  display_order: number
  is_open: boolean
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  industry_id: string
  user_id: string
  name: string
  role?: string
  location?: string
  salary?: string
  logo_url?: string
  status: JobStatus
  applied_at?: string
  status_changed_at: string
  jd_text?: string
  jd_url?: string
  interview_round?: number
  next_action?: string
  next_action_due?: string
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  company_id: string
  user_id: string
  direction: EmailDirection
  email_type?: EmailType
  subject?: string
  body?: string
  tone?: string
  to_address?: string
  from_address?: string
  authenticity_score?: number
  sent_at?: string
  created_at: string
}

export interface Note {
  id: string
  company_id: string
  user_id: string
  content: string
  created_at: string
}

export interface Contact {
  id: string
  company_id: string
  user_id: string
  name: string
  role?: string
  email?: string
  phone?: string
  initials?: string
  created_at: string
}

export interface InterviewPrep {
  id: string
  company_id: string
  user_id: string
  questions: any[] // JSON
  talking_points: any[] // JSON
  research_notes?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  company_id: string
  user_id: string
  action: string
  metadata: any // JSON
  created_at: string
}