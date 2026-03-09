"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { DEMO_INDUSTRIES } from "@/lib/demo-data";
import { useAuth } from "@/lib/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import type { Company, Industry, EmailThreadEntry } from "@/lib/database.types";

function normalizeInterviewPrep(v: unknown): import("@/lib/database.types").InterviewPrep | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return {
    likelyQuestions: Array.isArray(o.likelyQuestions) ? o.likelyQuestions.filter((x): x is string => typeof x === "string") : undefined,
    answers: Array.isArray(o.answers) ? o.answers.map((a) => (a && typeof a === "object" ? { q: String((a as Record<string, unknown>).q ?? ""), a: String((a as Record<string, unknown>).a ?? "") } : { q: "", a: "" })) : undefined,
    talkingPoints: Array.isArray(o.talkingPoints) ? o.talkingPoints.filter((x): x is string => typeof x === "string") : undefined,
    researchNotes: typeof o.researchNotes === "string" ? o.researchNotes : undefined,
    questionsToAsk: Array.isArray(o.questionsToAsk) ? o.questionsToAsk.filter((x): x is string => typeof x === "string") : undefined,
  };
}

function normalizeThreadEntry(t: unknown): EmailThreadEntry | null {
  if (!t || typeof t !== "object") return null;
  const o = t as Record<string, unknown>;
  const direction = (o.direction as "sent" | "received") || "sent";
  return {
    id: String(o.id ?? ""),
    direction,
    stage: (o.stage as Company["status"]) ?? "draft",
    type: (o.type as EmailThreadEntry["type"]) ?? "cover_letter",
    subject: String(o.subject ?? ""),
    body: String(o.body ?? ""),
    tone: String(o.tone ?? "professional"),
    sentAt: String(o.sentAt ?? ""),
    receivedAt: o.receivedAt != null ? String(o.receivedAt) : undefined,
    wordCount: o.wordCount != null ? Number(o.wordCount) : undefined,
    from: o.from != null ? String(o.from) : undefined,
  };
}

function normalizeCompany(c: Record<string, unknown>): Company {
  const rawThread = c.emailThread as unknown[] | undefined;
  const emailThread = Array.isArray(rawThread)
    ? rawThread.map(normalizeThreadEntry).filter((e): e is EmailThreadEntry => e !== null)
    : [];
  const rawJd = c.jdAnalysis as Record<string, unknown> | undefined;
  const jd_analysis = rawJd && typeof rawJd === "object" && rawJd.matchScore != null
    ? {
        matchScore: Number(rawJd.matchScore) || 0,
        matchedKeywords: Array.isArray(rawJd.matchedKeywords) ? rawJd.matchedKeywords.filter((k): k is string => typeof k === "string") : [],
        missingKeywords: Array.isArray(rawJd.missingKeywords) ? rawJd.missingKeywords.filter((k): k is string => typeof k === "string") : [],
        suggestedAngle: String(rawJd.suggestedAngle ?? ""),
        redFlags: Array.isArray(rawJd.redFlags) ? rawJd.redFlags.filter((r): r is string => typeof r === "string") : [],
      }
    : null;
  return {
    id: c.id as string,
    name: c.name as string,
    role: c.role as string,
    location: (c.location as string) ?? null,
    salary: (c.salary as string) ?? null,
    status: (c.status as Company["status"]) ?? "draft",
    logo: (c.logo as string) ?? null,
    email_to: (c.emailTo as string) ?? null,
    email_subject: (c.emailSubject as string) ?? null,
    email_draft: (c.emailDraft as string) ?? null,
    email_thread: emailThread,
    saved_tone: (c.savedTone as string) ?? null,
    applied_at: c.appliedAt != null ? new Date(c.appliedAt as string).toISOString() : null,
    jd_text: (c.jdText as string) ?? null,
    jd_analysis,
    country: (c.country as string) ?? null,
    visa_required: c.visaRequired != null ? Boolean(c.visaRequired) : null,
    work_rights: (c.workRights as string) ?? null,
    interview_prep: normalizeInterviewPrep(c.interviewPrep),
    contacts: ((c.contacts as Record<string, unknown>[]) ?? []).map((ct) => ({
      id: ct.id as string,
      company_id: ct.companyId as string,
      name: ct.name as string,
      role: (ct.role as string) ?? null,
      initials: (ct.initials as string) ?? null,
    })),
    notes: ((c.notes as Record<string, unknown>[]) ?? []).map((n) => ({
      id: n.id as string,
      company_id: n.companyId as string,
      content: n.content as string,
      created_at: (n.createdAt as string) ?? new Date().toISOString(),
    })),
  };
}

function normalizeIndustry(ind: Record<string, unknown>): Industry {
  return {
    id: ind.id as string,
    name: ind.name as string,
    emoji: (ind.emoji as string) ?? "💻",
    open: (ind.open as boolean) ?? true,
    order: (ind.order as number) ?? 0,
    companies: ((ind.companies as Record<string, unknown>[]) ?? []).map(normalizeCompany),
  };
}

type CompanyPatch = Partial<
  Pick<
    Company,
    | "name"
    | "status"
    | "email_to"
    | "email_subject"
    | "email_draft"
    | "email_thread"
    | "saved_tone"
    | "applied_at"
    | "jd_text"
    | "jd_analysis"
    | "country"
    | "visa_required"
    | "work_rights"
    | "interview_prep"
    | "role"
    | "location"
    | "salary"
  >
>;

interface IndustriesContextValue {
  industries: Industry[];
  loading: boolean;
  setIndustries: React.Dispatch<React.SetStateAction<Industry[]>>;
  updateCompany: (companyId: string, patch: CompanyPatch) => void;
  moveCompanyToIndustry: (companyId: string, fromIndustryId: string, toIndustryId: string) => void;
  addNote: (companyId: string, content: string) => void;
  addContact: (companyId: string, name: string, role: string | null) => void;
  addCompany: (
    industryId: string,
    name: string,
    role: string,
    location: string | null,
    salary: string | null,
    jdText?: string | null,
    jdAnalysis?: import("@/lib/database.types").JdAnalysis | null,
    template?: { subject?: string; body: string }
  ) => void;
  addIndustry: (name: string, emoji: string) => Promise<string | undefined>;
  openAddCompanyModal: () => void;
  addCompanyModalRequested: boolean;
  setAddCompanyModalRequested: (v: boolean) => void;
}

const IndustriesContext = createContext<IndustriesContextValue | null>(null);

export function IndustriesProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const [industries, setIndustries] = useState<Industry[]>(DEMO_INDUSTRIES);
  const [addCompanyModalRequested, setAddCompanyModalRequested] = useState(false);
  const [loading, setLoading] = useState(!!token);
  const openAddCompanyModal = useCallback(() => setAddCompanyModalRequested(true), []);

  useEffect(() => {
    if (!token) {
      setIndustries(DEMO_INDUSTRIES);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWithAuth("/api/applications/industries", { token })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return null;
        }
        return res.json();
      })
      .then((data: Record<string, unknown>[] | null) => {
        if (cancelled) return;
        if (data === null) return; // 401 already handled
        if (Array.isArray(data)) {
          setIndustries(data.map(normalizeIndustry));
        }
      })
      .catch(() => {
        if (!cancelled) setIndustries(DEMO_INDUSTRIES);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, logout]);

  const updateCompany = useCallback(async (companyId: string, patch: CompanyPatch) => {
    const doUpdate = () => setIndustries((prev) =>
      prev.map((ind) => ({
        ...ind,
        companies: ind.companies.map((c) =>
          c.id === companyId ? { ...c, ...patch } : c
        ),
      }))
    );
    // Optimistic update so UI responds immediately (status dropdown/buttons)
    doUpdate();
    if (token) {
      try {
        const body: Record<string, unknown> = {};
        if (patch.name != null) body.name = patch.name;
        if (patch.role != null) body.role = patch.role;
        if (patch.location != null) body.location = patch.location;
        if (patch.salary != null) body.salary = patch.salary;
        if (patch.status != null) body.status = patch.status;
        if (patch.email_to != null) body.emailTo = patch.email_to;
        if (patch.email_subject != null) body.emailSubject = patch.email_subject;
        if (patch.email_draft != null) body.emailDraft = patch.email_draft;
        if (patch.email_thread != null) body.emailThread = patch.email_thread;
        if (patch.saved_tone != null) body.savedTone = patch.saved_tone;
        if (patch.applied_at != null) body.appliedAt = patch.applied_at;
        if (patch.jd_text != null) body.jdText = patch.jd_text;
        if (patch.jd_analysis != null) body.jdAnalysis = patch.jd_analysis;
        if (patch.country != null) body.country = patch.country;
        if (patch.visa_required != null) body.visaRequired = patch.visa_required;
        if (patch.work_rights != null) body.workRights = patch.work_rights;
        if (patch.interview_prep != null) body.interviewPrep = patch.interview_prep;
        const res = await fetchWithAuth(`/api/applications/companies/${companyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          token,
        });
        if (!res.ok) {
          // Revert on failure: refetch industries to restore server state
          const data = await fetchWithAuth("/api/applications/industries", { token }).then((r) => r.json().catch(() => null));
          if (Array.isArray(data)) setIndustries(data.map(normalizeIndustry));
        }
      } catch {
        // On network error, refetch to sync with server
        const data = await fetchWithAuth("/api/applications/industries", { token }).then((r) => r.json().catch(() => null));
        if (Array.isArray(data)) setIndustries(data.map(normalizeIndustry));
      }
    }
  }, [token]);

  const moveCompanyToIndustry = useCallback(
    (companyId: string, fromIndustryId: string, toIndustryId: string) => {
      if (fromIndustryId === toIndustryId) return;
      setIndustries((prev) => {
        let company: Company | null = null;
        const without = prev.map((ind) => {
          if (ind.id !== fromIndustryId) return ind;
          const idx = ind.companies.findIndex((c) => c.id === companyId);
          if (idx === -1) return ind;
          company = ind.companies[idx];
          return {
            ...ind,
            companies: ind.companies.filter((c) => c.id !== companyId),
          };
        });
        if (!company) return prev;
        return without.map((ind) =>
          ind.id === toIndustryId
            ? { ...ind, companies: [...ind.companies, company!] }
            : ind
        );
      });
    },
    []
  );

  const addNote = useCallback(async (companyId: string, content: string) => {
    const note = {
      id: `n-${Date.now()}`,
      company_id: companyId,
      content,
      created_at: new Date().toISOString(),
    };
    const doAdd = () => setIndustries((prev) =>
      prev.map((ind) => ({
        ...ind,
        companies: ind.companies.map((c) =>
          c.id === companyId
            ? { ...c, notes: [...(c.notes ?? []), note] }
            : c
        ),
      }))
    );
    if (token) {
      try {
        const res = await fetchWithAuth(`/api/applications/companies/${companyId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          token,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.id) {
          note.id = data.id;
          note.created_at = data.createdAt ?? note.created_at;
          doAdd();
        } else {
          doAdd();
        }
      } catch {
        doAdd();
      }
    } else {
      doAdd();
    }
  }, [token]);

  const addContact = useCallback(
    async (companyId: string, name: string, role: string | null) => {
      const initials = name
        .trim()
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const contact = {
        id: `ct-${Date.now()}`,
        company_id: companyId,
        name: name.trim(),
        role: role?.trim() || null,
        initials: initials || name.slice(0, 2).toUpperCase(),
      };
      const doAdd = () => setIndustries((prev) =>
        prev.map((ind) => ({
          ...ind,
          companies: ind.companies.map((c) =>
            c.id === companyId
              ? { ...c, contacts: [...(c.contacts ?? []), contact] }
              : c
          ),
        }))
      );
      if (token) {
        try {
          const res = await fetchWithAuth(`/api/applications/companies/${companyId}/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: contact.name, role: contact.role, initials: contact.initials }),
            token,
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.id) {
            contact.id = data.id;
            doAdd();
          } else {
            doAdd();
          }
        } catch {
          doAdd();
        }
      } else {
        doAdd();
      }
    },
    [token]
  );

  const addCompany = useCallback(
    async (
      industryId: string,
      name: string,
      role: string,
      location: string | null,
      salary: string | null,
      jdText?: string | null,
      jdAnalysis?: import("@/lib/database.types").JdAnalysis | null,
      template?: { subject?: string; body: string }
    ) => {
      const company: Company = {
        id: `c-${Date.now()}`,
        name: name.trim(),
        role: role.trim(),
        location: location?.trim() || null,
        salary: salary?.trim() || null,
        status: "draft",
        logo: null,
        email_to: null,
        email_subject: template?.subject ?? null,
        email_draft: template?.body ?? null,
        email_thread: [],
        saved_tone: null,
        applied_at: null,
        jd_text: jdText ?? null,
        jd_analysis: jdAnalysis ?? null,
        country: null,
        visa_required: null,
        work_rights: null,
        interview_prep: null,
        contacts: [],
        notes: [],
      };
      const doAdd = (c: Company) => setIndustries((prev) => {
        const ind = prev.find((i) => i.id === industryId);
        if (ind) return prev.map((i) => (i.id === industryId ? { ...i, companies: [...i.companies, c] } : i));
        return [...prev, { id: industryId, name: "Uncategorised", emoji: "📋", open: true, order: prev.length, companies: [c] }];
      });
      if (token) {
        try {
          const body: Record<string, unknown> = {
            name: company.name,
            role: company.role,
            location: company.location,
            salary: company.salary,
          };
          if (jdText !== undefined) body.jdText = jdText;
          if (jdAnalysis !== undefined) body.jdAnalysis = jdAnalysis;
          const res = await fetchWithAuth(`/api/applications/industries/${industryId}/companies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            token,
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.id) {
            const normalized = normalizeCompany(data);
            doAdd({ ...normalized, email_subject: template?.subject ?? null, email_draft: template?.body ?? null });
            if (template) await updateCompany(data.id, { email_subject: template.subject ?? null, email_draft: template.body });
          } else {
            doAdd(company);
          }
        } catch {
          doAdd(company);
        }
      } else {
        doAdd(company);
      }
    },
    [token, updateCompany]
  );

  const addIndustry = useCallback(async (name: string, emoji: string): Promise<string | undefined> => {
    const industry: Industry = {
      id: `ind-${Date.now()}`,
      name: name.trim(),
      emoji: emoji || "💻",
      open: true,
      order: industries.length,
      companies: [],
    };
    const doAdd = (ind: Industry) => setIndustries((prev) => [...prev, ind]);
    if (token) {
      try {
        const res = await fetchWithAuth("/api/applications/industries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: industry.name, emoji: industry.emoji }),
          token,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.id) {
          doAdd(normalizeIndustry({ ...data, companies: [] }));
          return data.id;
        }
        doAdd(industry);
        return industry.id;
      } catch {
        doAdd(industry);
        return industry.id;
      }
    }
    doAdd(industry);
    return industry.id;
  }, [token, industries.length]);

  const value: IndustriesContextValue = {
    industries,
    loading,
    setIndustries,
    updateCompany,
    moveCompanyToIndustry,
    addNote,
    addContact,
    addCompany,
    addIndustry,
    openAddCompanyModal,
    addCompanyModalRequested,
    setAddCompanyModalRequested,
  };

  return (
    <IndustriesContext.Provider value={value}>
      {children}
    </IndustriesContext.Provider>
  );
}

export function useIndustriesContext(): IndustriesContextValue {
  const ctx = useContext(IndustriesContext);
  if (!ctx) {
    throw new Error("useIndustriesContext must be used within IndustriesProvider");
  }
  return ctx;
}
