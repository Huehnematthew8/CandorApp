export type JobStatus =
  | "draft"
  | "applied"
  | "screening"
  | "round1"
  | "round2"
  | "offer"
  | "rejected";

export interface Industry {
  id: string;
  name: string;
  emoji: string;
  open: boolean;
  order: number;
  companies: Company[];
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
