export type JobStatus =
  | "draft"
  | "applied"
  | "screening"
  | "round1"
  | "round2"
  | "offer"
  | "rejected";

export type EmailThreadType =
  | "cover_letter"
  | "followup"
  | "thankyou"
  | "negotiation"
  | "other";

export interface EmailThreadEntry {
  id: string;
  kind?: "email";
  direction?: "sent" | "received";
  stage?: JobStatus;
  type?: EmailThreadType;
  subject: string;
  body: string;
  tone?: string;
  sentAt?: string;
  receivedAt?: string;
  wordCount?: number;
  from?: string;
}

export type ActivityType = "call" | "meeting" | "message" | "other";

export interface ActivityEntry {
  id: string;
  kind: "activity";
  activityType: ActivityType;
  occurredAt: string;
  title: string;
  notes?: string | null;
  contactId?: string | null;
}

export type ActivityFeedItem = EmailThreadEntry | ActivityEntry;

export interface Industry {
  id: string;
  name: string;
  emoji: string;
  open: boolean;
  order: number;
  companies: Company[];
}

export interface JdAnalysis {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestedAngle: string;
  redFlags: string[];
}

export interface InterviewPrep {
  likelyQuestions?: string[];
  answers?: { q: string; a: string }[];
  talkingPoints?: string[];
  researchNotes?: string;
  questionsToAsk?: string[];
}

export interface Company {
  id: string;
  industry_id?: string;
  name: string;
  role: string;
  location: string | null;
  salary: string | null;
  status: JobStatus;
  logo: string | null;
  email_to: string | null;
  email_subject: string | null;
  email_draft: string | null;
  email_thread?: ActivityFeedItem[];
  saved_tone?: string | null;
  applied_at?: string | null;
  jd_text?: string | null;
  job_url?: string | null;
  jd_analysis?: JdAnalysis | null;
  country?: string | null;
  visa_required?: boolean | null;
  work_rights?: string | null;
  interview_prep?: InterviewPrep | null;
  contacts?: Contact[];
  notes?: Note[];
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  role: string | null;
  initials: string | null;
}

export interface Note {
  id: string;
  company_id: string;
  content: string;
  created_at: string;
}

export interface CompanyFolder {
  id: string;
  companyId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface CompanyFile {
  id: string;
  companyId: string;
  name: string;
  folderId: string | null;
  size?: number;
  mimeType?: string;
  createdAt: string;
}
