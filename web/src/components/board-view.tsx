"use client";

import { useState } from "react";
import { ChevronDown, Search, LayoutGrid } from "lucide-react";
import { DEMO_INDUSTRIES } from "@/lib/demo-data";
import type { Company, Industry } from "@/lib/database.types";
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

export function BoardView() {
  const [industries, setIndustries] = useState<Industry[]>(DEMO_INDUSTRIES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = industries
    .flatMap((i) => i.companies)
    .find((c) => c.id === selectedId);

  const toggleOpen = (id: string) => {
    setIndustries((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, open: !ind.open } : ind))
    );
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
                  className="add-company-btn flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[var(--text-dim)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text-muted)]"
                >
                  <LayoutGrid className="h-3 w-3" />
                  Add company
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer shrink-0 border-t border-[var(--border)] px-4 py-3">
          <button
            type="button"
            className="add-industry-btn flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border2)] bg-transparent py-2.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <LayoutGrid className="h-3 w-3" />
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
          <CompanyDetail company={selected} />
        )}
      </div>
    </div>
  );
}

function CompanyDetail({ company }: { company: Company }) {
  return (
    <div className="company-detail flex h-full flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
      <div className="detail-header shrink-0 border-b border-[var(--border)] px-7 pb-4 pt-5">
        <div className="detail-header-top mb-4 flex items-start gap-4">
          <div className="company-logo flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border2)] bg-[var(--surface2)] text-lg">
            {company.logo ?? "🌐"}
          </div>
          <div className="detail-title-row min-w-0 flex-1">
            <div className="detail-company-name font-serif text-[22px] font-normal tracking-tight text-[var(--text)]">
              {company.name}
            </div>
            <div className="detail-role flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
              <span>{company.role}</span>
              <span className="text-[var(--text-dim)]">·</span>
              <span className="text-[var(--text-dim)]">{company.location ?? "—"}</span>
              {company.salary && (
                <>
                  <span className="text-[var(--text-dim)]">·</span>
                  <input
                    type="text"
                    defaultValue={company.salary}
                    placeholder="Salary"
                    className="salary-input w-24 border-none bg-transparent text-[var(--text-dim)] outline-none placeholder:text-[var(--text-dim)]"
                  />
                </>
              )}
            </div>
          </div>
          <div className="detail-actions">
            <select
              className="status-select appearance-none rounded-full border border-[var(--border2)] bg-[var(--surface2)] px-2.5 py-1.5 pr-7 text-xs text-[var(--text)] outline-none"
              defaultValue={company.status}
            >
              <option value="draft">● Draft</option>
              <option value="applied">● Applied</option>
              <option value="screening">● Screening</option>
              <option value="round1">● Round 1</option>
              <option value="round2">● Round 2</option>
              <option value="offer">● Offer</option>
              <option value="rejected">● Rejected</option>
            </select>
          </div>
        </div>
        {/* Stage timeline */}
        <div className="detail-timeline flex items-center gap-0 overflow-x-auto pb-1">
          {["draft", "applied", "screening", "round1", "round2", "offer"].map((step) => (
            <div key={step} className="timeline-step flex shrink-0 items-center">
              <button
                type="button"
                className="timeline-node rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--text-dim)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] hover:text-[var(--accent)]"
              >
                {step === "round1" ? "Round 1" : step === "round2" ? "Round 2" : step.charAt(0).toUpperCase() + step.slice(1)}
              </button>
              <div className="timeline-connector h-px w-5 shrink-0 bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="email" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="detail-tabs shrink-0 justify-start gap-0 border-b border-[var(--border)] bg-transparent px-7 pb-0">
          <TabsTrigger
            value="email"
            className="rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] text-[var(--text-dim)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text)]"
          >
            Cover Letter / Email
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] text-[var(--text-dim)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text)]"
          >
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] text-[var(--text-dim)] data-[state=active]:border-[var(--accent)] data-[state=active]:text-[var(--text)]"
          >
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
                defaultValue={company.email_to ?? ""}
              />
            </div>
            <div className="email-field flex items-center gap-3 border-b border-[var(--border)] py-2.5">
              <div className="email-field-label w-10 shrink-0 text-xs uppercase tracking-wider text-[var(--text-dim)]">Subj</div>
              <Input
                className="email-field-input email-subject-input flex-1 border-none bg-transparent px-0 text-[15px] font-medium shadow-none focus-visible:ring-0"
                placeholder="Application for..."
                defaultValue={company.email_subject ?? ""}
              />
            </div>
            <div className="ai-toolbar flex flex-wrap items-center gap-2 border-b border-[var(--border)] py-2">
              <button type="button" className="ai-chip rounded-md border border-[var(--border)] bg-[var(--accent-glow)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]">
                Professional
              </button>
              <button type="button" className="ai-chip rounded-md border border-[var(--border)] bg-transparent px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:border-[var(--border2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]">
                Warm
              </button>
              <button type="button" className="ai-chip rounded-md border border-[var(--border)] bg-transparent px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                Bold
              </button>
              <div className="ai-chip-divider h-4 w-px bg-[var(--border)]" />
              <button type="button" className="ai-chip rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                Concise
              </button>
              <button type="button" className="ai-chip rounded-md border border-[var(--border)] bg-[var(--accent-glow)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]">
                Standard
              </button>
              <button type="button" className="ai-chip rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                Detailed
              </button>
            </div>
            <div className="email-body-area flex-1 overflow-y-auto">
              <textarea
                className="email-body min-h-[200px] w-full resize-none border-none bg-transparent py-1 text-sm leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]"
                placeholder="Your personalised email will appear here..."
              />
            </div>
            <div className="email-actions flex shrink-0 items-center gap-2 border-t border-[var(--border)] py-3.5">
              <Button size="sm" className="rounded-full bg-[var(--accent)] text-[#1a1508] hover:bg-[var(--accent2)]">
                Mark as Sent
              </Button>
              <Button size="sm" variant="outline" className="rounded-full">
                Copy
              </Button>
              <Button size="sm" variant="outline" className="rounded-full">
                Save Draft
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="notes" className="flex-1 overflow-y-auto px-7 py-5">
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)]"
            placeholder="Add a note about this company..."
          />
          <Button size="sm" className="mt-3 rounded-full">Save note</Button>
          <div className="mt-4 space-y-2">
            {(company.notes ?? []).map((n) => (
              <div
                key={n.id}
                className="rounded-lg border-l-2 border-[var(--accent)] bg-[var(--surface2)] p-3 text-sm"
              >
                {n.content}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="contacts" className="flex-1 overflow-y-auto px-7 py-5">
          <div className="space-y-2">
            {(company.contacts ?? []).length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No contacts yet.</p>
            ) : (
              (company.contacts ?? []).map((ct) => (
                <div
                  key={ct.id}
                  className="flex items-center gap-3 rounded-lg bg-[var(--surface2)] p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[#1a1508]">
                    {ct.initials ?? ct.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{ct.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{ct.role}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="ml-auto">Draft email</Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
