"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Search, Plus, Send, Copy, Save, FileText, Mail } from "lucide-react";
import { useIndustriesContext } from "@/lib/IndustriesContext";
import type { Company, Industry, JobStatus } from "@/lib/database.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const statusDotClass: Record<string, string> = {
  draft: "bg-[var(--text-dim)]",
  applied: "bg-[var(--blue)]",
  screening: "bg-[var(--amber)]",
  round1: "bg-[var(--purple)]",
  round2: "bg-[var(--accent)]",
  offer: "bg-[var(--green)] animate-[pulse_2s_ease_infinite]",
  rejected: "bg-[var(--red)]",
};

const statusSelectClass: Record<JobStatus, string> = {
  draft: "border-[var(--border2)] bg-[var(--surface2)] text-[var(--text-muted)]",
  applied: "border-[var(--blue)]/30 bg-[var(--blue-dim)] text-[var(--blue)]",
  screening: "border-[var(--amber)]/30 bg-[var(--amber-dim)] text-[var(--amber)]",
  round1: "border-[var(--purple)]/30 bg-[var(--purple-dim)] text-[var(--purple)]",
  round2: "border-[var(--accent)]/30 bg-[var(--accent-glow)] text-[var(--accent)]",
  offer: "border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]",
  rejected: "border-[var(--red)]/30 bg-[var(--red-dim)] text-[var(--red)]",
};

const statusChevronClass: Record<JobStatus, string> = {
  draft: "text-[var(--text-muted)]",
  applied: "text-[var(--blue)]",
  screening: "text-[var(--amber)]",
  round1: "text-[var(--purple)]",
  round2: "text-[var(--accent)]",
  offer: "text-[var(--green)]",
  rejected: "text-[var(--red)]",
};

export function BoardView() {
  const { industries, setIndustries, updateCompany, moveCompanyToIndustry, addNote, addContact, addCompany, addIndustry } = useIndustriesContext();
  const searchParams = useSearchParams();
  const companyFromUrl = searchParams.get("company");
  const [selectedId, setSelectedId] = useState<string | null>(companyFromUrl);

  useEffect(() => {
    if (companyFromUrl && industries.some((i) => i.companies.some((c) => c.id === companyFromUrl))) {
      setSelectedId(companyFromUrl);
    }
  }, [companyFromUrl, industries]);
  const [toast, setToast] = useState<string | null>(null);
  const [addCompanyIndustryId, setAddCompanyIndustryId] = useState<string | null>(null);
  const [addIndustryOpen, setAddIndustryOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyRole, setNewCompanyRole] = useState("");
  const [newCompanyLocation, setNewCompanyLocation] = useState("");
  const [newCompanySalary, setNewCompanySalary] = useState("");
  const [newIndustryName, setNewIndustryName] = useState("");
  const [newIndustryEmoji, setNewIndustryEmoji] = useState("💻");

  const selected = industries
    .flatMap((i) => i.companies)
    .find((c) => c.id === selectedId);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const toggleOpen = (id: string) => {
    setIndustries((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, open: !ind.open } : ind))
    );
  };

  const handleAddNote = (companyId: string, content: string) => {
    addNote(companyId, content);
    showToast("Note saved");
  };

  const handleAddContact = (companyId: string, name: string, role: string | null) => {
    addContact(companyId, name, role);
    showToast("Contact added");
  };

  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCompanyIndustryId || !newCompanyName.trim() || !newCompanyRole.trim()) return;
    addCompany(addCompanyIndustryId, newCompanyName.trim(), newCompanyRole.trim(), newCompanyLocation.trim() || null, newCompanySalary.trim() || null);
    setAddCompanyIndustryId(null);
    setNewCompanyName("");
    setNewCompanyRole("");
    setNewCompanyLocation("");
    setNewCompanySalary("");
    showToast("Company added");
  };

  const handleAddIndustrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndustryName.trim()) return;
    addIndustry(newIndustryName.trim(), newIndustryEmoji);
    setAddIndustryOpen(false);
    setNewIndustryName("");
    setNewIndustryEmoji("💻");
    showToast("Industry group added");
  };

  return (
    <div className="dashboard-body flex flex-1 overflow-hidden">
      {/* Sidebar - match original */}
      <aside className="sidebar relative flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]">
        <button
          type="button"
          className="sidebar-toggle absolute right-[-12px] top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border2)] bg-[var(--surface2)] transition-colors hover:bg-[var(--surface3)]"
          title="Toggle sidebar"
        >
          <ChevronDown className="h-3 w-3 stroke-[var(--text-muted)]" />
        </button>
        <div className="sidebar-header shrink-0 border-b border-[var(--border)] px-4 pb-3 pt-4">
          <div className="search-wrap relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 stroke-[var(--text-dim)]" />
            <input
              type="text"
              placeholder="Search companies..."
              className="sidebar-search w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] py-2 pl-8 pr-3 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--border2)]"
            />
          </div>
        </div>
        <div className="sidebar-scroll flex-1 overflow-y-auto p-2">
          {industries.map((ind) => (
            <div key={ind.id} className={cn("industry-group mb-1", ind.open && "open")}>
              <button
                type="button"
                onClick={() => toggleOpen(ind.id)}
                className="industry-header flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface2)]"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform stroke-[#a0a0b0] hover:stroke-[var(--text)]",
                    !ind.open && "rotate-[-90deg]",
                    ind.open && "stroke-[var(--text)]"
                  )}
                />
                <span className="industry-label flex-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {ind.emoji} {ind.name}
                </span>
                <span className="industry-count rounded-full bg-[var(--surface3)] px-1.5 py-0.5 text-[11px] text-[var(--text-dim)]">
                  {ind.companies.length}
                </span>
              </button>
              <div
                className={cn(
                  "company-list overflow-hidden pl-2 transition-all",
                  ind.open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {ind.companies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "company-item relative flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                      selectedId === c.id
                        ? "bg-[var(--surface3)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-[var(--accent)] before:content-['']"
                        : "hover:bg-[var(--surface2)]"
                    )}
                  >
                    <span
                      className={cn(
                        "status-dot h-2 w-2 shrink-0 rounded-full",
                        statusDotClass[c.status] ?? "bg-[var(--text-dim)]"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="company-name truncate text-[13px] font-normal text-[var(--text)]">
                        {c.name}
                      </div>
                      <div className="company-role text-[11px] text-[var(--text-dim)] leading-snug">
                        {c.role}
                        {c.salary ? ` · ${c.salary}` : ""}
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAddCompanyIndustryId(ind.id)}
                  className="add-company-btn flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[var(--text-dim)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text-muted)]"
                >
                  <Plus className="h-3 w-3" />
                  Add company
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer shrink-0 border-t border-[var(--border)] px-4 py-3">
          <button
            type="button"
            onClick={() => setAddIndustryOpen(true)}
            className="add-industry-btn flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border2)] bg-transparent py-2.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <Plus className="h-3 w-3" />
            Add Industry Group
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content flex flex-1 flex-col overflow-hidden bg-[var(--bg)]">
        {!selected ? (
          <div className="empty-state flex flex-1 flex-col items-center justify-center gap-3 text-[var(--text-dim)]">
            <svg
              className="h-10 w-10 opacity-40 stroke-[var(--text-dim)]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <p className="text-sm">Select a company to begin drafting</p>
          </div>
        ) : (
          <CompanyDetail
            company={selected}
            industries={industries}
            onUpdateCompany={updateCompany}
            onMoveCompanyToIndustry={moveCompanyToIndustry}
            onAddNote={handleAddNote}
            onAddContact={handleAddContact}
            showToast={showToast}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--border2)] bg-[var(--surface2)] px-4 py-2 text-[13px] text-[var(--text)] shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}

      {/* Add company modal */}
      {addCompanyIndustryId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            setAddCompanyIndustryId(null);
            setNewCompanyName("");
            setNewCompanyRole("");
            setNewCompanyLocation("");
            setNewCompanySalary("");
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 font-serif text-lg text-[var(--text)]">Add company</h2>
            <p className="mb-4 text-[13px] text-[var(--text-muted)]">
              {industries.find((i) => i.id === addCompanyIndustryId)?.emoji}{" "}
              {industries.find((i) => i.id === addCompanyIndustryId)?.name}
            </p>
            <form onSubmit={handleAddCompanySubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Company name</span>
                <Input
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Notion"
                  className="w-full bg-[var(--surface2)]"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Role</span>
                <Input
                  value={newCompanyRole}
                  onChange={(e) => setNewCompanyRole(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className="w-full bg-[var(--surface2)]"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Location</span>
                <Input
                  value={newCompanyLocation}
                  onChange={(e) => setNewCompanyLocation(e.target.value)}
                  placeholder="e.g. Remote"
                  className="w-full bg-[var(--surface2)]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Salary</span>
                <Input
                  value={newCompanySalary}
                  onChange={(e) => setNewCompanySalary(e.target.value)}
                  placeholder="e.g. $120k–$140k"
                  className="w-full bg-[var(--surface2)]"
                />
              </label>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setAddCompanyIndustryId(null);
                    setNewCompanyName("");
                    setNewCompanyRole("");
                    setNewCompanyLocation("");
                    setNewCompanySalary("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-full bg-[var(--accent)] text-[#1a1508] hover:bg-[var(--accent2)]">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add company
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add industry modal */}
      {addIndustryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            setAddIndustryOpen(false);
            setNewIndustryName("");
            setNewIndustryEmoji("💻");
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 font-serif text-lg text-[var(--text)]">Add industry group</h2>
            <form onSubmit={handleAddIndustrySubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Name</span>
                <Input
                  value={newIndustryName}
                  onChange={(e) => setNewIndustryName(e.target.value)}
                  placeholder="e.g. Product & Tech"
                  className="w-full bg-[var(--surface2)]"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Emoji</span>
                <div className="flex gap-2">
                  {["💻", "🎨", "📊", "🚀", "✦"].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewIndustryEmoji(em)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
                        newIndustryEmoji === em ? "border-[var(--accent)] bg-[var(--accent-glow)]" : "border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--border2)]"
                      )}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </label>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setAddIndustryOpen(false);
                    setNewIndustryName("");
                    setNewIndustryEmoji("💻");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-full bg-[var(--accent)] text-[#1a1508] hover:bg-[var(--accent2)]">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const STAGE_ORDER: JobStatus[] = ["draft", "applied", "screening", "round1", "round2", "offer"];

function CompanyDetail({
  company,
  industries,
  onUpdateCompany,
  onMoveCompanyToIndustry,
  onAddNote,
  onAddContact,
  showToast,
}: {
  company: Company;
  industries: Industry[];
  onUpdateCompany: (id: string, patch: Partial<Pick<Company, "name" | "status" | "email_to" | "email_subject" | "email_draft" | "role" | "location" | "salary">>) => void;
  onMoveCompanyToIndustry: (companyId: string, fromIndustryId: string, toIndustryId: string) => void;
  onAddNote: (companyId: string, content: string) => void;
  onAddContact: (companyId: string, name: string, role: string | null) => void;
  showToast: (msg: string) => void;
}) {
  const [companyName, setCompanyName] = useState(company.name);
  const [role, setRole] = useState(company.role);
  const [location, setLocation] = useState(company.location ?? "");
  const [emailTo, setEmailTo] = useState(company.email_to ?? "");
  const [emailSubject, setEmailSubject] = useState(company.email_subject ?? "");
  const [emailBody, setEmailBody] = useState(company.email_draft ?? "");
  const [emailTone, setEmailTone] = useState<"professional" | "warm" | "bold">("professional");
  const [emailLength, setEmailLength] = useState<"concise" | "standard" | "detailed">("standard");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactRole, setNewContactRole] = useState("");
  const [salary, setSalary] = useState(company.salary ?? "");

  const currentIndustryId = industries.find((ind) => ind.companies.some((c) => c.id === company.id))?.id ?? "";

  useEffect(() => {
    setCompanyName(company.name);
    setRole(company.role);
    setLocation(company.location ?? "");
    setEmailTo(company.email_to ?? "");
    setEmailSubject(company.email_subject ?? "");
    setEmailBody(company.email_draft ?? "");
    setSalary(company.salary ?? "");
  }, [company.id, company.name, company.role, company.location, company.email_to, company.email_subject, company.email_draft, company.salary]);

  const currentStageIndex = STAGE_ORDER.indexOf(company.status);

  return (
    <div className="company-detail flex h-full flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
      <div className="detail-header shrink-0 border-b border-[var(--border)] px-7 pb-4 pt-5">
        <div className="detail-header-top mb-4 flex items-start gap-4">
          <div className="company-logo flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border2)] bg-[var(--surface2)] text-lg">
            {company.logo ?? "🌐"}
          </div>
          <div className="detail-title-row min-w-0 flex-1">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onBlur={() => companyName.trim() !== company.name && onUpdateCompany(company.id, { name: companyName.trim() || company.name })}
              className="detail-company-name mb-1 block w-full font-serif text-[22px] font-normal tracking-tight text-[var(--text)] border-none bg-transparent outline-none placeholder:text-[var(--text-dim)] focus:rounded focus:ring-1 focus:ring-[var(--border2)]"
              placeholder="Company name"
            />
            <div className="detail-role flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[var(--text-muted)]">
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onBlur={() => role.trim() !== company.role && onUpdateCompany(company.id, { role: role.trim() || company.role })}
                placeholder="Role"
                className="min-w-[100px] max-w-[200px] border-none bg-transparent py-0.5 text-[var(--text-muted)] outline-none placeholder:text-[var(--text-dim)] focus:rounded focus:bg-[var(--surface2)] focus:px-1.5"
              />
              <span className="text-[var(--text-dim)]">·</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => location !== (company.location ?? "") && onUpdateCompany(company.id, { location: location.trim() || null })}
                placeholder="Location"
                className="min-w-[80px] max-w-[140px] border-none bg-transparent py-0.5 text-[var(--text-muted)] outline-none placeholder:text-[var(--text-dim)] focus:rounded focus:bg-[var(--surface2)] focus:px-1.5"
              />
              <span className="text-[var(--text-dim)]">·</span>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                onBlur={() => salary !== (company.salary ?? "") && onUpdateCompany(company.id, { salary: salary.trim() || null })}
                placeholder="Salary"
                className="min-w-[80px] max-w-[120px] border-none bg-transparent py-0.5 text-[var(--text-dim)] outline-none placeholder:text-[var(--text-dim)] focus:rounded focus:bg-[var(--surface2)] focus:px-1.5"
              />
            </div>
            <div className="mt-2">
              <div className="relative inline-block min-w-[140px]">
                <select
                  value={currentIndustryId}
                  onChange={(e) => onMoveCompanyToIndustry(company.id, currentIndustryId, e.target.value)}
                  className="h-7 w-full cursor-pointer appearance-none rounded-md border border-[var(--border2)] bg-[var(--surface2)] px-2.5 pr-7 text-xs text-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent)]/20"
                >
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.emoji} {ind.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 shrink-0 text-[var(--text-muted)] opacity-70" aria-hidden />
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <div className={cn("relative inline-block min-w-[110px]", statusChevronClass[company.status])}>
              <select
                value={company.status}
                onChange={(e) => onUpdateCompany(company.id, { status: e.target.value as JobStatus })}
                className={cn(
                  "h-8 w-full cursor-pointer appearance-none rounded-lg border px-3 pr-8 text-xs font-medium outline-none transition-colors focus:ring-2 focus:ring-[var(--accent)]/20 focus:ring-offset-0",
                  statusSelectClass[company.status]
                )}
              >
                <option value="draft">Draft</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="round1">Round 1</option>
                <option value="round2">Round 2</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 opacity-70"
                aria-hidden
              />
            </div>
          </div>
        </div>
        <div className="detail-timeline flex items-center gap-0 overflow-x-auto pb-1">
          {STAGE_ORDER.map((step, index) => {
            const isActive = company.status === step;
            const isDone = currentStageIndex >= 0 && index < currentStageIndex;
            return (
              <div key={step} className="timeline-step flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => onUpdateCompany(company.id, { status: step })}
                  className={cn(
                    "timeline-node rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                    isActive && "border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent)]",
                    isDone && "border-[var(--green)] bg-[var(--green)]/10 text-[var(--green)]",
                    !isActive && !isDone && "border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] hover:text-[var(--accent)]"
                  )}
                >
                  {step === "round1" ? "Round 1" : step === "round2" ? "Round 2" : step.charAt(0).toUpperCase() + step.slice(1)}
                </button>
                <div className={cn("timeline-connector h-px w-5 shrink-0 bg-[var(--border)]", isDone && "bg-[var(--green)] opacity-50")} />
              </div>
            );
          })}
        </div>
      </div>

      <Tabs defaultValue="email" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="detail-tabs shrink-0 justify-start gap-0 border-b border-[var(--border)] bg-transparent px-7 pb-0">
          <TabsTrigger value="email" className="rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] text-[var(--text-dim)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text)]">
            Cover Letter / Email
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] text-[var(--text-dim)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text)]">
            Notes
          </TabsTrigger>
          <TabsTrigger value="contacts" className="rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] text-[var(--text-dim)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text)]">
            Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="email-editor flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
          <div className="email-main flex flex-1 flex-col gap-3 overflow-hidden px-7 py-5">
            <div className="email-field flex items-center gap-3 border-b border-[var(--border)] py-2.5">
              <div className="email-field-label w-10 shrink-0 text-xs uppercase tracking-wider text-[var(--text-dim)]">To</div>
              <Input
                className="email-field-input flex-1 border-none bg-transparent px-0 text-[13px] shadow-none focus-visible:ring-0"
                placeholder="hiring@company.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                onBlur={() => onUpdateCompany(company.id, { email_to: emailTo.trim() || null })}
              />
            </div>
            <div className="email-field flex items-center gap-3 border-b border-[var(--border)] py-2.5">
              <div className="email-field-label w-10 shrink-0 text-xs uppercase tracking-wider text-[var(--text-dim)]">Subj</div>
              <Input
                className="email-field-input email-subject-input flex-1 border-none bg-transparent px-0 text-[15px] font-medium shadow-none focus-visible:ring-0"
                placeholder="Application for..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                onBlur={() => onUpdateCompany(company.id, { email_subject: emailSubject.trim() || null })}
              />
            </div>
            <div className="ai-toolbar flex flex-wrap items-center gap-2 border-b border-[var(--border)] py-2">
              {(["professional", "warm", "bold"] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setEmailTone(tone)}
                  className={cn(
                    "ai-chip rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    emailTone === tone ? "border-[var(--border)] bg-[var(--accent-glow)] text-[var(--accent)]" : "border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                  )}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </button>
              ))}
              <div className="ai-chip-divider h-4 w-px bg-[var(--border)]" />
              {(["concise", "standard", "detailed"] as const).map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setEmailLength(len)}
                  className={cn(
                    "ai-chip rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    emailLength === len ? "border-[var(--border)] bg-[var(--accent-glow)] text-[var(--accent)]" : "border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                  )}
                >
                  {len.charAt(0).toUpperCase() + len.slice(1)}
                </button>
              ))}
            </div>
            <div className="email-body-area flex-1 overflow-y-auto">
              <textarea
                className="email-body min-h-[200px] w-full resize-none border-none bg-transparent py-1 text-sm leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]"
                placeholder="Your personalised email will appear here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
            <div className="email-actions flex shrink-0 items-center gap-2 border-t border-[var(--border)] py-3.5">
              <Button
                size="sm"
                className="rounded-full bg-[var(--accent)] text-[#1a1508] hover:bg-[var(--accent2)]"
                onClick={() => {
                  onUpdateCompany(company.id, { status: "applied" });
                  showToast("Marked as sent");
                }}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Mark as Sent
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  if (!emailBody.trim()) {
                    showToast("Nothing to copy");
                    return;
                  }
                  navigator.clipboard.writeText(emailBody);
                  showToast("Copied to clipboard");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  onUpdateCompany(company.id, { email_draft: emailBody });
                  showToast("Draft saved");
                }}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save Draft
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="notes" className="flex-1 overflow-y-auto px-7 pt-3 pb-5">
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)]"
            placeholder="Add a note about this company..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
          <Button
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => {
              if (newNoteContent.trim()) {
                onAddNote(company.id, newNoteContent);
                setNewNoteContent("");
              } else {
                showToast("Enter a note first");
              }
            }}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Save note
          </Button>
          <div className="mt-4 space-y-2">
            {(company.notes ?? []).map((n) => (
              <div key={n.id} className="rounded-lg border-l-2 border-[var(--accent)] bg-[var(--surface2)] p-3 text-sm">
                {n.content}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="contacts" className="flex-1 overflow-y-auto px-7 pt-3 pb-5">
          <div className="shrink-0 mb-3 flex flex-wrap items-end gap-2">
            <Input
              placeholder="Name"
              className="w-40 bg-[var(--surface2)] border-[var(--border2)]"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
            />
            <Input
              placeholder="Role (optional)"
              className="w-40 bg-[var(--surface2)] border-[var(--border2)]"
              value={newContactRole}
              onChange={(e) => setNewContactRole(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                if (newContactName.trim()) {
                  onAddContact(company.id, newContactName.trim(), newContactRole.trim() || null);
                  setNewContactName("");
                  setNewContactRole("");
                } else {
                  showToast("Enter a name");
                }
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Contact
            </Button>
          </div>
          <div className="space-y-2">
            {(company.contacts ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No contacts yet.</p>
            ) : (
              (company.contacts ?? []).map((ct) => (
                <div key={ct.id} className="flex items-center gap-3 rounded-lg bg-[var(--surface2)] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[#1a1508]">
                    {ct.initials ?? ct.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{ct.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{ct.role}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => showToast(`Drafting email to ${ct.name}…`)}
                  >
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    Draft email
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
