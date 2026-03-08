"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { DEMO_INDUSTRIES } from "@/lib/demo-data";
import type { Company, Industry } from "@/lib/database.types";

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
}

const IndustriesContext = createContext<IndustriesContextValue | null>(null);

export function IndustriesProvider({ children }: { children: ReactNode }) {
  const [industries, setIndustries] = useState<Industry[]>(DEMO_INDUSTRIES);

  const updateCompany = useCallback((companyId: string, patch: CompanyPatch) => {
    setIndustries((prev) =>
      prev.map((ind) => ({
        ...ind,
        companies: ind.companies.map((c) =>
          c.id === companyId ? { ...c, ...patch } : c
        ),
      }))
    );
  }, []);

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

  const addNote = useCallback((companyId: string, content: string) => {
    const note = {
      id: `n-${Date.now()}`,
      company_id: companyId,
      content,
      created_at: new Date().toISOString(),
    };
    setIndustries((prev) =>
      prev.map((ind) => ({
        ...ind,
        companies: ind.companies.map((c) =>
          c.id === companyId
            ? { ...c, notes: [...(c.notes ?? []), note] }
            : c
        ),
      }))
    );
  }, []);

  const addContact = useCallback(
    (companyId: string, name: string, role: string | null) => {
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
      setIndustries((prev) =>
        prev.map((ind) => ({
          ...ind,
          companies: ind.companies.map((c) =>
            c.id === companyId
              ? { ...c, contacts: [...(c.contacts ?? []), contact] }
              : c
          ),
        }))
      );
    },
    []
  );

  const addCompany = useCallback(
    (
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
      setIndustries((prev) =>
        prev.map((ind) =>
          ind.id === industryId
            ? { ...ind, companies: [...ind.companies, company] }
            : ind
        )
      );
    },
    []
  );

  const addIndustry = useCallback((name: string, emoji: string) => {
    setIndustries((prev) => {
      const industry: Industry = {
        id: `ind-${Date.now()}`,
        name: name.trim(),
        emoji: emoji || "💻",
        open: true,
        order: prev.length,
        companies: [],
      };
      return [...prev, industry];
    });
  }, []);

  const value: IndustriesContextValue = {
    industries,
    setIndustries,
    updateCompany,
    moveCompanyToIndustry,
    addNote,
    addContact,
    addCompany,
    addIndustry,
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
