import type { Industry, JobStatus } from "./database.types";

export const DEMO_INDUSTRIES: Industry[] = [
  {
    id: "tech",
    name: "Product & Tech",
    emoji: "💻",
    open: true,
    order: 0,
    companies: [
      {
        id: "c1",
        name: "Notion",
        role: "Senior Product Designer",
        location: "Remote",
        salary: "$140k–$160k",
        status: "round1",
        logo: "🌐",
        email_to: "design@notion.so",
        email_subject: "Senior Product Designer — Jordan Davis",
        email_draft: null,
        contacts: [
          { id: "ct1", company_id: "c1", name: "Sarah Chen", role: "Design Lead", initials: "SC" },
        ],
        notes: [
          { id: "n1", company_id: "c1", content: "Focus on systems thinking in interview", created_at: "" },
        ],
      },
      {
        id: "c2",
        name: "Linear",
        role: "Product Designer",
        location: "San Francisco",
        salary: "$130k–$150k",
        status: "applied",
        logo: "⚡",
        email_to: "careers@linear.app",
        email_subject: "Product Designer Application",
        email_draft: null,
        contacts: [],
        notes: [],
      },
      {
        id: "c3",
        name: "Vercel",
        role: "Design Engineer",
        location: "Remote",
        salary: null,
        status: "draft",
        logo: "▲",
        email_to: "",
        email_subject: "",
        email_draft: null,
        contacts: [],
        notes: [],
      },
    ],
  },
  {
    id: "design",
    name: "Design Studios",
    emoji: "🎨",
    open: true,
    order: 1,
    companies: [
      {
        id: "c4",
        name: "IDEO",
        role: "Senior Designer",
        location: "Sydney",
        salary: "$120k–$135k",
        status: "screening",
        logo: "✦",
        email_to: "talent@ideo.com",
        email_subject: "Senior Designer — Jordan Davis",
        email_draft: null,
        contacts: [],
        notes: [],
      },
      {
        id: "c5",
        name: "Fjord",
        role: "UX Lead",
        location: "Melbourne",
        salary: "$150k + equity",
        status: "offer",
        logo: "🌊",
        email_to: "hello@fjordnet.com",
        email_subject: "UX Lead Role",
        email_draft: null,
        contacts: [],
        notes: [],
      },
    ],
  },
];

export const STATUS_ORDER: JobStatus[] = ["draft", "applied", "screening", "round1", "round2", "offer", "rejected"];

export const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  applied: "Applied",
  screening: "In process",
  round1: "Interview 1",
  round2: "Interview 2+",
  offer: "Offer",
  rejected: "Archived",
};

/** Status dot (sidebar list) and select/chevron (dropdowns) - shared by board and tracker */
export const statusDotClass: Record<JobStatus, string> = {
  draft: "bg-[var(--text-dim)]",
  applied: "bg-[var(--blue)]",
  screening: "bg-[var(--amber)]",
  round1: "bg-[var(--purple)]",
  round2: "bg-[var(--accent)]",
  offer: "bg-[var(--green)] animate-[pulse_2s_ease_infinite]",
  rejected: "bg-[var(--red)]",
};

export const statusSelectClass: Record<JobStatus, string> = {
  draft: "border-[var(--border2)] bg-[var(--surface2)] text-[var(--text-muted)]",
  applied: "border-[var(--blue)]/30 bg-[var(--blue-dim)] text-[var(--blue)]",
  screening: "border-[var(--amber)]/30 bg-[var(--amber-dim)] text-[var(--amber)]",
  round1: "border-[var(--purple)]/30 bg-[var(--purple-dim)] text-[var(--purple)]",
  round2: "border-[var(--accent)]/30 bg-[var(--accent-glow)] text-[var(--accent)]",
  offer: "border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]",
  rejected: "border-[var(--red)]/30 bg-[var(--red-dim)] text-[var(--red)]",
};

export const statusChevronClass: Record<JobStatus, string> = {
  draft: "text-[var(--text-muted)]",
  applied: "text-[var(--blue)]",
  screening: "text-[var(--amber)]",
  round1: "text-[var(--purple)]",
  round2: "text-[var(--accent)]",
  offer: "text-[var(--green)]",
  rejected: "text-[var(--red)]",
};

export type ProfileTimelineItem = {
  /** Start date (e.g. "2020", "Jan 2020") */
  year: string;
  /** End date (e.g. "2022", "Present", or empty if current) */
  endDate?: string;
  type: string;
  title: string;
  sub: string;
  desc: string;
  highlight: boolean;
};
export type ProfileStrength = { label: string; score: number };
export type ProfileObservation = { type: string; icon: string; title: string; text: string };

/** Saved email/cover letter template for "Apply a template" when adding companies */
export type EmailTemplate = { id: string; name: string; subject?: string; body: string };

export type ProfileData = {
  name: string;
  headline: string;
  narrative: string;
  lookingFor: string;
  skills: string[];
  timeline: ProfileTimelineItem[];
  strengths: ProfileStrength[];
  observations: ProfileObservation[];
  /** Work rights / visa (e.g. "Australian citizen", "UK work permit") */
  workRights?: string;
  /** Based in (e.g. "Sydney, Australia") */
  basedIn?: string;
  /** Open to relocate (e.g. "Yes", "Remote only") */
  openToRelocate?: string;
  /** Target countries for roles */
  targetCountries?: string[];
  /** Saved email templates (packs) for applying when adding a company */
  templates?: EmailTemplate[];
  /** ISO date string when resume was last uploaded; set by server */
  resumeUploadedAt?: string;
};

export const DEFAULT_PROFILE: ProfileData = {
  name: "",
  headline: "",
  narrative: "",
  lookingFor: "",
  skills: [],
  timeline: [],
  strengths: [],
  observations: [],
  workRights: "",
  basedIn: "",
  openToRelocate: "",
  targetCountries: [],
  templates: [],
};

/** Demo profile (e.g. for tests or placeholder). Not used by app. */
const PROFILE_DATA: ProfileData = {
  name: "Jordan Davis",
  headline: "Senior Product Designer · 6 years experience",
  narrative:
    "A designer who bridges the gap between craft and systems thinking. Career has moved deliberately — from early-stage startup work at Xero through Atlassian where scale demanded rigour, to Canva where both had to coexist. The thread: a genuine belief that great design makes complexity disappear.",
  lookingFor:
    "A product-led company where design has real influence on strategy. Ideally remote-friendly, with a team that moves fast but cares deeply about quality.",
  skills: ["Figma", "Design Systems", "UX Research", "Prototyping", "React", "Information Architecture"],
  timeline: [
    { year: "2016", type: "edu", title: "Bachelor of Design", sub: "UTS", desc: "Majored in Interaction Design.", highlight: false },
    { year: "2018", type: "work", title: "Junior Product Designer", sub: "Xero", desc: "Shipped mobile invoicing redesign.", highlight: false },
    { year: "2020", type: "work", title: "Product Designer", sub: "Atlassian", desc: "Confluence editor redesign, 10M+ users.", highlight: true },
    { year: "2022", type: "work", title: "Senior Product Designer", sub: "Canva", desc: "Team collaboration layer, 40% context-switch reduction.", highlight: true },
  ],
  workRights: "",
  basedIn: "Sydney, Australia",
  openToRelocate: "Yes, for the right role",
  targetCountries: [],
  templates: [],
  strengths: [
    { label: "Systems thinking", score: 92 },
    { label: "Visual craft", score: 87 },
    { label: "User research", score: 78 },
  ],
  observations: [
    { type: "strength", icon: "✦", title: "Strong narrative arc", text: "Career shows clear upward trajectory with measurable impact." },
    { type: "gap", icon: "△", title: "Leadership evidence", text: "Management or mentoring could be documented more clearly." },
    { type: "tip", icon: "→", title: "Tailor for startup vs enterprise", text: "Atlassian/Canva signal enterprise comfort; lean into Xero for startups." },
  ],
};
