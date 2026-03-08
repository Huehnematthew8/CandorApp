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
import type { Company, Industry } from "@/lib/database.types";

function normalizeCompany(c: Record<string, unknown>): Company {
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
    | "role"
    | "location"
    | "salary"
  >
>;

interface IndustriesContextValue {
  industries: Industry[];
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
    salary: string | null
  ) => void;
  addIndustry: (name: string, emoji: string) => void;
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
        const res = await fetchWithAuth(`/api/applications/companies/${companyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          token,
        });
        if (res.ok) doUpdate();
      } catch {
        doUpdate();
      }
    } else {
      doUpdate();
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
      salary: string | null
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
        email_subject: null,
        email_draft: null,
        contacts: [],
        notes: [],
      };
      const doAdd = (c: Company) => setIndustries((prev) =>
        prev.map((ind) =>
          ind.id === industryId
            ? { ...ind, companies: [...ind.companies, c] }
            : ind
        )
      );
      if (token) {
        try {
          const res = await fetchWithAuth(`/api/applications/industries/${industryId}/companies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: company.name,
              role: company.role,
              location: company.location,
              salary: company.salary,
            }),
            token,
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.id) {
            doAdd(normalizeCompany(data));
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
    [token]
  );

  const addIndustry = useCallback(async (name: string, emoji: string) => {
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
        } else {
          doAdd(industry);
        }
      } catch {
        doAdd(industry);
      }
    } else {
      doAdd(industry);
    }
  }, [token, industries.length]);

  const value: IndustriesContextValue = {
    industries,
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
