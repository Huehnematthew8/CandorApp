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

export const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  applied: "Applied",
  screening: "Screening",
  round1: "Round 1",
  round2: "Round 2",
  offer: "Offer",
  rejected: "Rejected",
};

export const PROFILE_DATA = {
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
