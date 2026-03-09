"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Search, Plus, Send, Copy, Save, FileText, Mail, Loader2, Folder, File, Trash2 } from "lucide-react";
import { useIndustriesContext } from "@/lib/IndustriesContext";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";
import { fetchWithAuth } from "@/lib/api";
import type { Company, Industry, JobStatus, CompanyFolder, CompanyFile, EmailThreadEntry, InterviewPrep } from "@/lib/database.types";
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

const INDUSTRY_EMOJIS = [
  "💻", "📱", "🖥️", "⚙️", "🔧", "🤖", "📡", "💡", "🔬", "🧪",
  "🎨", "✨", "🎭", "🎬", "📸", "🎵", "🎸", "🎯", "🖌️", "📐",
  "📊", "💼", "📈", "🏦", "💰", "📉", "📋", "📁", "🗂️", "📌",
  "🚀", "🌟", "⭐", "✦", "♦", "🔮", "🏆", "🎪", "🌈", "🔥",
  "🏥", "💊", "🧬", "📚", "🎓", "🏫", "🏭", "🛒", "🍳", "☕",
  "🌍", "✈️", "🏠", "🛠️", "📦", "🔐", "📧", "💬", "🎮", "🏃",
];

const COMMS_STAGE_LABELS: Record<JobStatus, string> = {
  draft: "Cover Letter",
  applied: "Follow-up",
  screening: "Pre-interview note",
  round1: "Thank you — Round 1",
  round2: "Thank you — Round 2",
  offer: "Negotiation email",
  rejected: "Keep the door open",
};

function getAISuggestions(company: Company): { label: string; text: string }[] {
  const name = (company.name ?? "").toLowerCase();
  const role = (company.role ?? "").toLowerCase();
  if (name.includes("notion")) {
    return [
      { label: "HIGHLIGHT", text: "Mention your collaboration redesign — directly relevant to Notion\'s team-first product direction." },
      { label: "ANGLE", text: "Position yourself as a systems thinker who operates at the intersection of IA and scalable UI." },
      { label: "CULTURE FIT", text: "Notion values builders. Reference any side projects or personal tools you\'ve created." },
    ];
  }
  if (name.includes("linear")) {
    return [
      { label: "TONE", text: "Linear values precision. Keep the email tight and purposeful — no fluff." },
      { label: "HOOK", text: "Open with a specific thing you love about Linear\'s interface — it signals you\'re a real user, not just applying." },
    ];
  }
  return [
    { label: "TIP", text: "Research recent company announcements or product launches to personalise your opening." },
    { label: "EXPERIENCE MATCH", text: `Your experience in ${role || "this space"} is highly relevant — lead with it.` },
    { label: "CULTURE FIT", text: "Briefly mention what draws you to the company; it shows you\'ve done your research." },
  ];
}

function AIInsightsPanel({
  company,
  showToast,
  currentEmail,
  onRefineEmail,
  token,
}: {
  company: Company;
  showToast: (msg: string) => void;
  currentEmail: string;
  onRefineEmail: (prompt: string) => Promise<void>;
  token: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string; text: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setSuggestions(getAISuggestions(company));
      setLoading(false);
    }, 900);
    return () => clearTimeout(t);
  }, [company.id]);

  const quickPrompts: { label: string; prompt: string }[] = [
    { label: "More company-specific", prompt: "Make it more specific to the company culture" },
    { label: "Stronger experience hook", prompt: "Highlight my most relevant experience more strongly" },
    { label: "Stronger opening", prompt: "Add a compelling opening line" },
    { label: "Confident close", prompt: "Make the closing more confident and action-oriented" },
  ];

  const handleQuickEdit = async (prompt: string) => {
    if (!token) {
      showToast("Sign in to use AI edits");
      return;
    }
    if (!currentEmail.trim()) {
      showToast("Generate or write an email first");
      return;
    }
    setRefining(true);
    try {
      await onRefineEmail(prompt);
      showToast("Email updated");
    } catch {
      showToast("Refine failed. Check API and ANTHROPIC_API_KEY.");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="ai-side-panel flex w-[240px] shrink-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="ai-panel-header shrink-0 border-b border-[var(--border)] px-4 py-4">
        <div className="ai-panel-title flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          AI Insights
          <span className="ai-badge rounded border border-[var(--accent)]/20 bg-[var(--accent-glow)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--accent)]">LIVE</span>
        </div>
      </div>
      <div className="ai-panel-scroll flex-1 overflow-y-auto p-3 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
        {loading ? (
          <div className="ai-generating flex flex-col gap-1.5 px-1 py-2">
            {[80, 95, 60].map((w, i) => (
              <div
                key={i}
                className="skeleton-line h-2.5 rounded bg-[var(--surface2)]"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : (
          suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                showToast("Suggestion applied to draft");
              }}
              className="ai-suggestion mb-2 block w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-2.5 text-left text-xs leading-snug text-[var(--text-muted)] transition-all hover:border-[var(--border2)] hover:bg-[var(--surface3)] hover:text-[var(--text)]"
            >
              <div className="ai-suggestion-label mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">{s.label}</div>
              {s.text}
            </button>
          ))
        )}
      </div>
      <div className="ai-quick-prompts shrink-0 border-t border-[var(--border)] p-3">
        <div className="ai-quick-label mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">Quick Edits</div>
        {quickPrompts.map(({ label, prompt }, i) => (
          <button
            key={i}
            type="button"
            disabled={refining || !token}
            onClick={() => handleQuickEdit(prompt)}
            className="ai-prompt-btn mb-1 block w-full rounded-md border border-transparent px-2.5 py-1.5 text-left text-[11px] leading-snug text-[var(--text-muted)] transition-colors hover:bg-[var(--surface2)] hover:border-[var(--border)] hover:text-[var(--text)] disabled:opacity-50"
          >
            → {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BoardView() {
  const { industries, setIndustries, updateCompany, moveCompanyToIndustry, addNote, addContact, addCompany, addIndustry, addCompanyModalRequested, setAddCompanyModalRequested } = useIndustriesContext();
  const { token } = useAuth();
  const { profile } = useProfile();
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
  const [quickAddInput, setQuickAddInput] = useState("");
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "followup" | null>(null);
  const [newCompanyTemplateId, setNewCompanyTemplateId] = useState<string | "">("");

  const allCompanies = industries.flatMap((i) => i.companies);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const progressStats = (() => {
    const applied = allCompanies.filter((c) => c.status === "applied");
    const appliedWithDate = applied.filter((c) => c.applied_at);
    const followUpDue = appliedWithDate.filter((c) => {
      const appliedAt = new Date(c.applied_at!).getTime();
      const days = (now - appliedAt) / day;
      return days >= 8;
    });
    const interviews = allCompanies.filter((c) => ["screening", "round1", "round2"].includes(c.status));
    const responseRate = applied.length > 0 ? Math.round((interviews.length + allCompanies.filter((c) => c.status === "offer").length) / applied.length * 100) : 0;
    return {
      tracked: allCompanies.length,
      draft: allCompanies.filter((c) => c.status === "draft").length,
      applied: applied.length,
      interviews: interviews.length,
      offer: allCompanies.filter((c) => c.status === "offer").length,
      rejected: allCompanies.filter((c) => c.status === "rejected").length,
      responseRate,
      followUpDue: followUpDue.length,
    };
  })();

  const filteredIndustries = filterStatus === "followup"
    ? industries.map((ind) => ({ ...ind, companies: ind.companies.filter((c) => c.status === "applied" && c.applied_at && (now - new Date(c.applied_at).getTime()) / day >= 8) })).filter((ind) => ind.companies.length > 0)
    : filterStatus
      ? industries.map((ind) => ({ ...ind, companies: ind.companies.filter((c) => c.status === filterStatus) })).filter((ind) => ind.companies.length > 0)
      : industries;

  useEffect(() => {
    if (!addCompanyModalRequested || addCompanyIndustryId) return;
    if (industries.length > 0) {
      setAddCompanyIndustryId(industries[0].id);
      setAddCompanyModalRequested(false);
      return;
    }
    addIndustry("Uncategorised", "📋").then((id) => {
      if (id) {
        setAddCompanyIndustryId(id);
        setAddCompanyModalRequested(false);
      }
    });
  }, [addCompanyModalRequested, industries, addCompanyIndustryId, setAddCompanyModalRequested, addIndustry]);

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
    const template = newCompanyTemplateId ? (profile.templates ?? []).find((t) => t.id === newCompanyTemplateId) : null;
    addCompany(
      addCompanyIndustryId,
      newCompanyName.trim(),
      newCompanyRole.trim(),
      newCompanyLocation.trim() || null,
      newCompanySalary.trim() || null,
      undefined,
      undefined,
      template ? { subject: template.subject, body: template.body } : undefined
    );
    setAddCompanyIndustryId(null);
    setNewCompanyName("");
    setNewCompanyRole("");
    setNewCompanyLocation("");
    setNewCompanySalary("");
    setNewCompanyTemplateId("");
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
        <div className="sidebar-header shrink-0 border-b border-[var(--border)] px-4 pb-3 pt-4 space-y-2">
          <form
            className="quick-add flex gap-1.5"
            onSubmit={async (e) => {
              e.preventDefault();
              const raw = quickAddInput.trim();
              if (!raw) return;
              setQuickAddLoading(true);
              try {
                let industryId = industries[0]?.id;
                if (!industryId) {
                  industryId = await addIndustry("Uncategorised", "📋");
                }
                if (!industryId) {
                  setToast("Could not create industry");
                  setQuickAddLoading(false);
                  return;
                }
                const isUrl = /^https?:\/\//i.test(raw) || (raw.includes(".") && raw.includes("/"));
                if (isUrl && token) {
                  const res = await fetchWithAuth("/api/parse-jd", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: raw }),
                    token,
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) {
                    addCompany(
                      industryId,
                      data.companyName || "New Company",
                      data.role || "",
                      null,
                      null,
                      data.jdText || null,
                      undefined
                    );
                    setToast("Company added from URL");
                  } else {
                    setToast(data.error || "Failed to parse URL");
                  }
                } else if (isUrl && !token) {
                  setToast("Sign in to add from URL");
                } else {
                  addCompany(industryId, raw, "", null, null);
                  setToast("Company added");
                }
                setQuickAddInput("");
              } catch {
                setToast("Something went wrong");
              } finally {
                setQuickAddLoading(false);
              }
            }}
            aria-label="Quick add company"
          >
            <label className="sr-only" htmlFor="quick-add-input">Add company: type name or paste job URL, then Enter or click +</label>
            <input
              id="quick-add-input"
              type="text"
              name="quickAdd"
              autoComplete="off"
              placeholder="Add company (name or URL)"
              value={quickAddInput}
              onChange={(e) => setQuickAddInput(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface2)] py-2 px-3 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--border2)]"
              disabled={quickAddLoading}
              aria-describedby="quick-add-hint"
            />
            <span id="quick-add-hint" className="sr-only">Press Enter or click + to add to first group. Paste a job URL when signed in to add with details.</span>
            <Button type="submit" size="sm" className="shrink-0 rounded-lg h-[34px] px-3" disabled={quickAddLoading} aria-label="Add company">
              {quickAddLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </form>
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
          {filteredIndustries.map((ind) => (
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
                {ind.companies.map((c) => {
                  const appliedAt = c.status === "applied" && c.applied_at ? new Date(c.applied_at).getTime() : 0;
                  const daysSinceApplied = appliedAt ? (now - appliedAt) / day : 0;
                  const followUpAmber = daysSinceApplied >= 8 && daysSinceApplied < 14;
                  const followUpBadge = daysSinceApplied >= 14 && daysSinceApplied < 30;
                  const considerClosing = daysSinceApplied >= 30;
                  return (
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
                          considerClosing && c.status === "applied" ? "bg-[var(--text-dim)]" : followUpAmber && c.status === "applied" ? "bg-[var(--amber)]" : statusDotClass[c.status] ?? "bg-[var(--text-dim)]"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="company-name flex items-center gap-1 truncate text-[13px] font-normal text-[var(--text)]">
                          <span className="truncate">{c.name}</span>
                          {followUpBadge && <span className="shrink-0 text-[9px] font-medium text-[var(--amber)]" title="14+ days since applied">Follow up?</span>}
                          {considerClosing && <span className="shrink-0 text-[9px] text-[var(--text-dim)]" title="30+ days">Consider closing</span>}
                        </div>
                        <div className="company-role truncate text-[11px] text-[var(--text-dim)] leading-snug">
                          {c.role}{c.salary ? ` · ${c.salary}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
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
          {filterStatus && (
            <button
              type="button"
              onClick={() => setFilterStatus(null)}
              className="mt-2 w-full rounded-lg border border-[var(--border2)] py-1.5 text-xs text-[var(--text-dim)] hover:bg-[var(--surface2)]"
            >
              Clear filter
            </button>
          )}
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
        <div className="progress-stats shrink-0 flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
          <button
            type="button"
            onClick={() => setFilterStatus(null)}
            className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors", !filterStatus ? "bg-[var(--accent-glow)] text-[var(--accent)]" : "bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]")}
          >
            All {progressStats.tracked}
          </button>
          <button type="button" onClick={() => setFilterStatus("draft")} className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors", filterStatus === "draft" ? "bg-[var(--surface3)] text-[var(--text)]" : "bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]")}>Draft {progressStats.draft}</button>
          <button type="button" onClick={() => setFilterStatus("applied")} className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors", filterStatus === "applied" ? "bg-[var(--blue-dim)] text-[var(--blue)]" : "bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]")}>Applied {progressStats.applied}</button>
          <button type="button" onClick={() => setFilterStatus("screening")} className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", filterStatus === "screening" ? "bg-[var(--amber-dim)] text-[var(--amber)]" : "bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]")}>Interviews {progressStats.interviews}</button>
          <button type="button" onClick={() => setFilterStatus("offer")} className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", filterStatus === "offer" ? "bg-[var(--green-dim)] text-[var(--green)]" : "bg-[var(--surface2)] text-[var(--text-dim)] hover:text-[var(--text)]")}>Offer {progressStats.offer}</button>
          <span className="text-[11px] text-[var(--text-dim)]">Response {progressStats.responseRate}%</span>
          {progressStats.followUpDue > 0 && (
            <button type="button" onClick={() => setFilterStatus("followup")} className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", filterStatus === "followup" ? "bg-[var(--amber-dim)] text-[var(--amber)]" : "bg-[var(--amber-dim)]/80 text-[var(--amber)] hover:opacity-90")}>Follow-up {progressStats.followUpDue}</button>
          )}
        </div>
        {!selected ? (
          <div className="empty-state flex flex-1 flex-col items-center justify-center gap-3 text-[var(--text-dim)] px-4 text-center">
            <svg
              className="h-10 w-10 opacity-40 stroke-[var(--text-dim)]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <p className="text-sm">
              {industries.length === 0
                ? "Add your first industry group using the button below, then add companies to get started."
                : "Select a company to begin drafting"}
            </p>
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
            setNewCompanyTemplateId("");
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
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Apply a template? (optional)</span>
                <select
                  value={newCompanyTemplateId}
                  onChange={(e) => setNewCompanyTemplateId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  <option value="">None</option>
                  {(profile.templates ?? []).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
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
                    setNewCompanyTemplateId("");
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
                <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--border2)] bg-[var(--surface2)] p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {INDUSTRY_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewIndustryEmoji(em)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-[var(--surface3)]",
                          newIndustryEmoji === em ? "bg-[var(--accent-glow)] ring-1 ring-[var(--accent)]" : ""
                        )}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function FilesTabPanel({
  companyId,
  companyFiles,
  setCompanyFiles,
  currentFolderId,
  setCurrentFolderId,
  newFolderName,
  setNewFolderName,
  addingFolder,
  setAddingFolder,
  showToast,
}: {
  companyId: string;
  companyFiles: Record<string, { folders: CompanyFolder[]; files: CompanyFile[] }>;
  setCompanyFiles: React.Dispatch<React.SetStateAction<Record<string, { folders: CompanyFolder[]; files: CompanyFile[] }>>>;
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  newFolderName: string;
  setNewFolderName: (s: string) => void;
  addingFolder: boolean;
  setAddingFolder: (b: boolean) => void;
  showToast: (msg: string) => void;
}) {
  const data = companyFiles[companyId] ?? { folders: [], files: [] };
  const folders = data.folders.filter((f) => f.parentId === currentFolderId);
  const files = data.files.filter((f) => f.folderId === currentFolderId);
  const currentFolder = currentFolderId ? data.folders.find((f) => f.id === currentFolderId) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFolder = () => {
    const name = newFolderName.trim() || "New folder";
    const folder: CompanyFolder = {
      id: `folder-${Date.now()}`,
      companyId,
      name,
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
    };
    setCompanyFiles((prev) => ({
      ...prev,
      [companyId]: {
        folders: [...(prev[companyId]?.folders ?? []), folder],
        files: prev[companyId]?.files ?? [],
      },
    }));
    setNewFolderName("");
    setAddingFolder(false);
    showToast(`Folder "${name}" created`);
  };

  const removeFolder = (id: string) => {
    const inner = (data.folders.filter((f) => f.parentId === id).length + data.files.filter((f) => f.folderId === id).length);
    if (inner > 0) {
      showToast("Folder is not empty. Remove or move items first.");
      return;
    }
    setCompanyFiles((prev) => ({
      ...prev,
      [companyId]: {
        folders: (prev[companyId]?.folders ?? []).filter((f) => f.id !== id),
        files: prev[companyId]?.files ?? [],
      },
    }));
    if (currentFolderId === id) setCurrentFolderId(null);
    showToast("Folder removed");
  };

  const removeFile = (id: string) => {
    setCompanyFiles((prev) => ({
      ...prev,
      [companyId]: {
        folders: prev[companyId]?.folders ?? [],
        files: (prev[companyId]?.files ?? []).filter((f) => f.id !== id),
      },
    }));
    showToast("File removed");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const companyFile: CompanyFile = {
        id: `file-${Date.now()}-${i}`,
        companyId,
        name: file.name,
        folderId: currentFolderId,
        size: file.size,
        mimeType: file.type || undefined,
        createdAt: new Date().toISOString(),
      };
      setCompanyFiles((prev) => ({
        ...prev,
        [companyId]: {
          folders: prev[companyId]?.folders ?? [],
          files: [...(prev[companyId]?.files ?? []), companyFile],
        },
      }));
    }
    showToast("File(s) added");
    e.target.value = "";
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-7 pt-2 pb-5" role="tabpanel">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentFolderId(null)}
          className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          All files
        </button>
        {currentFolder && (
          <>
            <span className="text-[var(--text-dim)]">/</span>
            <span className="text-[13px] text-[var(--text)]">{currentFolder.name}</span>
          </>
        )}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
        {addingFolder ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFolder()}
              className="h-8 w-48 bg-[var(--surface2)] text-sm"
              autoFocus
            />
            <Button size="sm" className="h-8 rounded-full" onClick={addFolder}>
              Create
            </Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => { setAddingFolder(false); setNewFolderName(""); }}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAddingFolder(true)}>
            <Folder className="mr-1.5 h-3.5 w-3.5" />
            New folder
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          aria-hidden
        />
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <File className="mr-1.5 h-3.5 w-3.5" />
          Upload
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface2)]">
            <tr>
              <th className="py-2.5 pl-4 font-medium text-[var(--text-dim)]">Name</th>
              <th className="w-24 py-2.5 font-medium text-[var(--text-dim)]">Size</th>
              <th className="w-28 py-2.5 font-medium text-[var(--text-dim)]">Modified</th>
              <th className="w-10 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {folders.map((folder) => (
              <tr
                key={folder.id}
                className="group border-b border-[var(--border)]/50 transition-colors hover:bg-[var(--surface2)]"
              >
                <td className="py-2 pl-4">
                  <button
                    type="button"
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="flex items-center gap-2 text-[var(--text)]"
                  >
                    <Folder className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <span>{folder.name}</span>
                  </button>
                </td>
                <td className="py-2 text-[var(--text-muted)]">—</td>
                <td className="py-2 text-[var(--text-muted)]">{formatDate(folder.createdAt)}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => removeFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-[var(--text-dim)] hover:bg-[var(--surface3)] hover:text-[var(--red)]"
                    title="Remove folder"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {files.map((file) => (
              <tr
                key={file.id}
                className="group border-b border-[var(--border)]/50 transition-colors hover:bg-[var(--surface2)]"
              >
                <td className="py-2 pl-4">
                  <div className="flex items-center gap-2 text-[var(--text)]">
                    <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                    <span>{file.name}</span>
                  </div>
                </td>
                <td className="py-2 text-[var(--text-muted)]">{file.size != null ? formatFileSize(file.size) : "—"}</td>
                <td className="py-2 text-[var(--text-muted)]">{formatDate(file.createdAt)}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-[var(--text-dim)] hover:bg-[var(--surface3)] hover:text-[var(--red)]"
                    title="Remove file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {folders.length === 0 && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)]">
            <Folder className="mb-2 h-10 w-10 opacity-50" />
            <p className="text-sm">No files or folders yet</p>
            <p className="mt-1 text-xs">Create a folder or upload a file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

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
  onUpdateCompany: (id: string, patch: Partial<Pick<Company, "name" | "status" | "email_to" | "email_subject" | "email_draft" | "email_thread" | "saved_tone" | "applied_at" | "jd_text" | "jd_analysis" | "country" | "visa_required" | "work_rights" | "interview_prep" | "role" | "location" | "salary">>) => void;
  onMoveCompanyToIndustry: (companyId: string, fromIndustryId: string, toIndustryId: string) => void;
  onAddNote: (companyId: string, content: string) => void;
  onAddContact: (companyId: string, name: string, role: string | null) => void;
  showToast: (msg: string) => void;
}) {
  const { token } = useAuth();
  const { profile, setProfile, saveProfile } = useProfile();
  const [companyName, setCompanyName] = useState(company.name);
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [role, setRole] = useState(company.role);
  const [location, setLocation] = useState(company.location ?? "");
  const [emailTo, setEmailTo] = useState(company.email_to ?? "");
  const [emailSubject, setEmailSubject] = useState(company.email_subject ?? "");
  const [emailBody, setEmailBody] = useState(company.email_draft ?? "");
  const savedTone = (company.saved_tone as "professional" | "warm" | "bold") || "professional";
  const [emailTone, setEmailTone] = useState<"professional" | "warm" | "bold">(savedTone);
  const [emailLength, setEmailLength] = useState<"concise" | "standard" | "detailed">("standard");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactRole, setNewContactRole] = useState("");
  const [salary, setSalary] = useState(company.salary ?? "");
  const [detailTab, setDetailTab] = useState<"email" | "notes" | "contacts" | "files" | "prep">("email");
  const [companyFiles, setCompanyFiles] = useState<Record<string, { folders: CompanyFolder[]; files: CompanyFile[] }>>({});
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null);
  const [subjectLinesGenerating, setSubjectLinesGenerating] = useState(false);
  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [showAddReceived, setShowAddReceived] = useState(false);
  const [receivedFrom, setReceivedFrom] = useState("");
  const [receivedSubject, setReceivedSubject] = useState("");
  const [receivedBody, setReceivedBody] = useState("");
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const currentIndustryId = industries.find((ind) => ind.companies.some((c) => c.id === company.id))?.id ?? "";
  const emailThread = company.email_thread ?? [];
  const sortedThread = [...emailThread].sort((a, b) => {
    const ta = a.receivedAt || a.sentAt || "";
    const tb = b.receivedAt || b.sentAt || "";
    return tb.localeCompare(ta);
  });

  useEffect(() => {
    setCompanyName(company.name);
    setRole(company.role);
    setLocation(company.location ?? "");
    setEmailTo(company.email_to ?? "");
    setEmailSubject(company.email_subject ?? "");
    setEmailBody(company.email_draft ?? "");
    setSalary(company.salary ?? "");
    setCurrentFolderId(null);
    const tone = (company.saved_tone as "professional" | "warm" | "bold") || "professional";
    setEmailTone(tone);
  }, [company.id, company.name, company.role, company.location, company.email_to, company.email_subject, company.email_draft, company.salary, company.saved_tone]);

  const currentStageIndex = STAGE_ORDER.indexOf(company.status);

  const handleGenerateEmail = async () => {
    if (!token) {
      showToast("Sign in to generate emails");
      return;
    }
    setEmailGenerating(true);
    try {
      const res = await fetchWithAuth("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          role: company.role,
          tone: emailTone,
          length: emailLength,
          profile: profile || undefined,
          stage: company.status,
          jdText: company.jd_text || undefined,
          jdAnalysis: company.jd_analysis || undefined,
          companyCountry: company.country || undefined,
          companyVisaRequired: company.visa_required ?? undefined,
          templateBody: emailBody.trim().length > 80 ? emailBody.trim() : undefined,
        }),
        token,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Generate failed");
        return;
      }
      if (data.email && String(data.email).trim()) {
        setEmailBody(data.email);
        showToast("Email generated");
      } else {
        showToast(data.error || "AI returned no content. Check server .env has GEMINI_API_KEY.");
      }
    } catch (e) {
      showToast("Could not reach API. Is the server running on port 4000?");
    } finally {
      setEmailGenerating(false);
    }
  };

  const handleRefineEmail = async (prompt: string) => {
    if (!token) return;
    const res = await fetchWithAuth("/api/email/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentEmail: emailBody, prompt }),
      token,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.email) {
      setEmailBody(data.email);
    } else {
      throw new Error(data.error || "Refine failed");
    }
  };

  const handleToneChange = (tone: "professional" | "warm" | "bold") => {
    setEmailTone(tone);
    onUpdateCompany(company.id, { saved_tone: tone });
  };

  const handleSendToThread = () => {
    const subject = emailSubject.trim() || "(No subject)";
    const body = emailBody.trim();
    if (!body) {
      showToast("Add email body first");
      return;
    }
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    const typeMap: Record<JobStatus, EmailThreadEntry["type"]> = {
      draft: "cover_letter",
      applied: "followup",
      screening: "other",
      round1: "thankyou",
      round2: "thankyou",
      offer: "negotiation",
      rejected: "other",
    };
    const entry: EmailThreadEntry = {
      id: "e-" + Date.now(),
      direction: "sent" as const,
      stage: company.status,
      type: typeMap[company.status],
      subject,
      body,
      tone: emailTone,
      sentAt: new Date().toISOString(),
      wordCount,
    };
    const nextThread = [...emailThread, entry];
    onUpdateCompany(company.id, {
      email_thread: nextThread,
      email_subject: "",
      email_draft: "",
      ...(company.status === "draft" ? { status: "applied", applied_at: new Date().toISOString() } : {}),
    });
    setEmailSubject("");
    setEmailBody("");
    showToast("Added to thread");
  };

  const handleGenerateSubjectLines = async () => {
    if (!token) return;
    setSubjectLinesGenerating(true);
    setSubjectLines([]);
    try {
      const res = await fetchWithAuth("/api/email/subject-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          role: company.role,
          profile: profile || undefined,
        }),
        token,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.subjectLines)) {
        setSubjectLines(data.subjectLines);
        showToast("Pick a subject line below");
      }
    } catch {
      showToast("Failed to generate subject lines");
    } finally {
      setSubjectLinesGenerating(false);
    }
  };

  const draftWordCount = emailBody.trim().split(/\s+/).filter(Boolean).length;
  const draftReadMins = Math.max(1, Math.ceil(draftWordCount / 200));

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
            <div className="mt-2 flex items-center gap-2">
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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="detail-tabs flex shrink-0 justify-start gap-0 border-b border-[var(--border)] bg-transparent px-7 pb-0" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "email"}
            onClick={() => setDetailTab("email")}
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] transition-colors",
              detailTab === "email" ? "border-[var(--accent)] text-[var(--text)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            )}
          >
            Comms
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "notes"}
            onClick={() => setDetailTab("notes")}
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] transition-colors",
              detailTab === "notes" ? "border-[var(--accent)] text-[var(--text)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            )}
          >
            Notes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "contacts"}
            onClick={() => setDetailTab("contacts")}
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] transition-colors",
              detailTab === "contacts" ? "border-[var(--accent)] text-[var(--text)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            )}
          >
            Contacts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "files"}
            onClick={() => setDetailTab("files")}
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] transition-colors",
              detailTab === "files" ? "border-[var(--accent)] text-[var(--text)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            )}
          >
            Files
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={detailTab === "prep"}
            onClick={() => setDetailTab("prep")}
            className={cn(
              "rounded-none border-b-2 border-transparent px-4 py-3 text-[13px] transition-colors",
              detailTab === "prep" ? "border-[var(--accent)] text-[var(--text)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
            )}
          >
            Interview Prep
          </button>
        </div>

        {detailTab === "email" && (
        <div className="comms-hub flex min-h-0 flex-1 flex-col overflow-hidden pt-0" role="tabpanel">
          {company.status === "applied" && company.applied_at && (() => {
            const days = Math.floor((Date.now() - new Date(company.applied_at).getTime()) / (24 * 60 * 60 * 1000));
            return days >= 10 ? (
              <div className="comms-followup-banner shrink-0 flex items-center justify-between gap-3 border-b border-[var(--amber)]/30 bg-[var(--amber-dim)]/50 px-4 py-2 text-sm">
                <span className="text-[var(--text)]">It's been {days} days since you applied. Send a follow-up?</span>
                <Button size="sm" className="rounded-full bg-[var(--amber)] text-[#1a1508] hover:opacity-90" onClick={() => { setEmailLength("concise"); handleGenerateEmail(); }} disabled={emailGenerating || !token}>
                  {emailGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate follow-up"}
                </Button>
              </div>
            ) : null;
          })()}
          <div className="comms-hub flex min-h-0 flex-1 flex-row overflow-hidden">
          <div className="comms-thread flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]">
            <div className="comms-thread-header flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Comms</span>
              <button
                type="button"
                onClick={() => setShowAddReceived(true)}
                className="text-[11px] text-[var(--accent)] hover:underline"
              >
                + Add received
              </button>
            </div>
            <div className="comms-thread-list flex-1 overflow-y-auto p-2">
              {sortedThread.length === 0 ? (
                <p className="px-2 py-4 text-xs text-[var(--text-dim)]">No emails yet. Send one from the drafter or add a received email.</p>
              ) : (
                sortedThread.map((e) => {
                  const isReceived = e.direction === "received";
                  const dateStr = isReceived ? (e.receivedAt || "") : (e.sentAt || "");
                  return (
                    <div key={e.id} className="mb-2 rounded-lg border border-[var(--border2)] bg-[var(--surface2)] p-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          isReceived ? "bg-[var(--blue-dim)] text-[var(--blue)]" : statusSelectClass[e.stage ?? "draft"]
                        )}>
                          {isReceived ? "In" : e.stage === "round1" ? "R1" : e.stage === "round2" ? "R2" : (e.stage ?? "draft").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-[var(--text-dim)]">{formatDate(dateStr)}</span>
                      </div>
                      <div className="mt-1 truncate text-xs font-medium text-[var(--text)]">{e.subject}</div>
                      {isReceived && e.from && <div className="truncate text-[10px] text-[var(--text-dim)]">From: {e.from}</div>}
                      <div className="mt-0.5 truncate text-[11px] text-[var(--text-dim)]">{e.body.split("\n")[0] || ""}</div>
                      <button
                        type="button"
                        onClick={() => setViewingThreadId(e.id)}
                        className="mt-1.5 text-[11px] text-[var(--accent)] hover:underline"
                      >
                        View
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="comms-drafter flex min-w-0 flex-1 flex-col overflow-hidden px-7 py-5">
            <div className="comms-stage-header mb-2 text-sm font-medium text-[var(--accent)]">
              {COMMS_STAGE_LABELS[company.status]}
            </div>
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
            {subjectLines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 py-2">
                {subjectLines.map((line, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setEmailSubject(line); setSubjectLines([]); }}
                    className="rounded-md border border-[var(--border2)] bg-[var(--surface2)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface3)] hover:text-[var(--text)]"
                  >
                    {line}
                  </button>
                ))}
              </div>
            )}
            <div className="ai-toolbar flex flex-wrap items-center gap-2 border-b border-[var(--border)] py-2">
              {(["professional", "warm", "bold"] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleToneChange(tone)}
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
              <div className="ai-chip-divider h-4 w-px bg-[var(--border)]" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-md border-[var(--border)] px-2.5 py-1 text-[11px] font-medium h-auto"
                disabled={emailGenerating || !token}
                onClick={handleGenerateEmail}
              >
                {emailGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Generate"}
              </Button>
            </div>
            <div className="email-body-area flex-1 overflow-y-auto">
              <textarea
                className="email-body min-h-[200px] w-full resize-none border-none bg-transparent py-1 text-sm leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]"
                placeholder="Your personalised email will appear here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-[var(--border)] py-2 text-[11px] text-[var(--text-dim)]">
              <span>{draftWordCount} words · ~{draftReadMins}m read</span>
            </div>
            <div className="email-actions flex shrink-0 items-center gap-2 border-t border-[var(--border)] py-3.5">
              <Button size="sm" className="rounded-full bg-[var(--accent)] text-[#1a1508] hover:bg-[var(--accent2)]" onClick={handleSendToThread}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Send
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  if (!emailBody.trim()) { showToast("Nothing to copy"); return; }
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
                onClick={() => { onUpdateCompany(company.id, { email_draft: emailBody }); showToast("Draft saved"); }}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save Draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={!emailBody.trim()}
                onClick={() => setShowSaveTemplate(true)}
              >
                Save as template
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={subjectLinesGenerating || !token}
                onClick={handleGenerateSubjectLines}
              >
                {subjectLinesGenerating ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                Generate 3 subject lines
              </Button>
            </div>
          </div>

          {viewingThreadId && (() => {
            const entry = emailThread.find((e) => e.id === viewingThreadId);
            if (!entry) return null;
            const isReceived = entry.direction === "received";
            const dateStr = isReceived ? (entry.receivedAt || "") : (entry.sentAt || "");
            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                onClick={() => setViewingThreadId(null)}
              >
                <div
                  className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border2)] bg-[var(--surface)] p-4 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{entry.subject}</div>
                      {(isReceived && entry.from) && <div className="text-xs text-[var(--text-dim)]">From: {entry.from}</div>}
                      <div className="text-[11px] text-[var(--text-dim)]">{formatDate(dateStr)}</div>
                    </div>
                    <button type="button" onClick={() => setViewingThreadId(null)} className="ml-2 text-[var(--text-dim)] hover:text-[var(--text)]">×</button>
                  </div>
                  <div className="mt-2 overflow-y-auto whitespace-pre-wrap text-sm text-[var(--text)]" style={{ maxHeight: "60vh" }}>{entry.body}</div>
                </div>
              </div>
            );
          })()}

          {showAddReceived && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setShowAddReceived(false)}
            >
              <div
                className="w-full max-w-md rounded-xl border border-[var(--border2)] bg-[var(--surface)] p-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-3 text-sm font-medium">Add received email</h3>
                <div className="space-y-2">
                  <Input placeholder="From (email or name)" value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)} className="bg-[var(--surface2)]" />
                  <Input placeholder="Subject" value={receivedSubject} onChange={(e) => setReceivedSubject(e.target.value)} className="bg-[var(--surface2)]" />
                  <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm" />
                  <textarea placeholder="Body" value={receivedBody} onChange={(e) => setReceivedBody(e.target.value)} rows={6} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm resize-none" />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddReceived(false)}>Cancel</Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!receivedSubject.trim() || !receivedBody.trim()) {
                        showToast("Subject and body required");
                        return;
                      }
                      const receivedAt = receivedDate ? new Date(receivedDate + "T12:00:00").toISOString() : new Date().toISOString();
                      const newEntry: EmailThreadEntry = {
                        id: "e-" + Date.now(),
                        direction: "received",
                        subject: receivedSubject.trim(),
                        body: receivedBody.trim(),
                        from: receivedFrom.trim() || undefined,
                        receivedAt,
                      };
                      onUpdateCompany(company.id, { email_thread: [...emailThread, newEntry] });
                      setReceivedFrom(""); setReceivedSubject(""); setReceivedBody(""); setReceivedDate(new Date().toISOString().slice(0, 10));
                      setShowAddReceived(false);
                      showToast("Received email added");
                    }}
                  >
                    Add to thread
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showSaveTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowSaveTemplate(false)}>
              <div className="w-full max-w-sm rounded-xl border border-[var(--border2)] bg-[var(--surface)] p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-3 text-sm font-medium">Save as template</h3>
                <Input placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="mb-3 bg-[var(--surface2)]" />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}>Cancel</Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const name = templateName.trim();
                      if (!name) { showToast("Enter a name"); return; }
                      const newTemplate = { id: "t-" + Date.now(), name, subject: emailSubject.trim() || undefined, body: emailBody.trim() };
                      const next = { ...profile, templates: [...(profile.templates ?? []), newTemplate] };
                      setProfile(next);
                      saveProfile(next);
                      setShowSaveTemplate(false);
                      setTemplateName("");
                      showToast("Template saved");
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          <AIInsightsPanel
            company={company}
            showToast={showToast}
            currentEmail={emailBody}
            onRefineEmail={handleRefineEmail}
            token={token}
          />
          </div>
        </div>
        )}

        {detailTab === "notes" && (
        <div className="flex flex-1 flex-col overflow-y-auto px-7 pt-2 pb-5" role="tabpanel">
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
        </div>
        )}

        {detailTab === "contacts" && (
        <div className="flex flex-1 flex-col overflow-y-auto px-7 pt-2 pb-5" role="tabpanel">
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
        </div>
        )}

        {detailTab === "files" && (
        <FilesTabPanel
          companyId={company.id}
          companyFiles={companyFiles}
          setCompanyFiles={setCompanyFiles}
          currentFolderId={currentFolderId}
          setCurrentFolderId={setCurrentFolderId}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          addingFolder={addingFolder}
          setAddingFolder={setAddingFolder}
          showToast={showToast}
        />
        )}

        {detailTab === "prep" && (() => {
          const prep: InterviewPrep = {
            likelyQuestions: company.interview_prep?.likelyQuestions ?? [],
            answers: company.interview_prep?.answers ?? [],
            talkingPoints: company.interview_prep?.talkingPoints ?? [],
            researchNotes: company.interview_prep?.researchNotes ?? "",
            questionsToAsk: company.interview_prep?.questionsToAsk ?? [],
          };
          const savePrep = (next: InterviewPrep) => onUpdateCompany(company.id, { interview_prep: next });
          return (
            <div className="flex flex-1 flex-col overflow-y-auto px-7 py-5" role="tabpanel">
              <h3 className="mb-3 text-sm font-medium text-[var(--accent)]">Interview Prep</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Likely questions (from JD / experience)</label>
                  <div className="space-y-1">
                    {(prep.likelyQuestions ?? []).map((q, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={q}
                          onChange={(e) => {
                            const list = [...(prep.likelyQuestions ?? [])];
                            list[i] = e.target.value;
                            savePrep({ ...prep, likelyQuestions: list });
                          }}
                          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => savePrep({ ...prep, likelyQuestions: (prep.likelyQuestions ?? []).filter((_, j) => j !== i) })}>Remove</Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => savePrep({ ...prep, likelyQuestions: [...(prep.likelyQuestions ?? []), ""] })}>+ Add question</Button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Your answers</label>
                  <div className="space-y-2">
                    {(prep.answers ?? []).map((a, i) => (
                      <div key={i} className="rounded-lg border border-[var(--border2)] bg-[var(--surface2)] p-2">
                        <input value={a.q} onChange={(e) => { const list = [...(prep.answers ?? [])]; list[i] = { ...list[i], q: e.target.value }; savePrep({ ...prep, answers: list }); }} placeholder="Question" className="mb-1 w-full rounded border border-[var(--border)] bg-transparent px-2 py-1 text-sm" />
                        <textarea value={a.a} onChange={(e) => { const list = [...(prep.answers ?? [])]; list[i] = { ...list[i], a: e.target.value }; savePrep({ ...prep, answers: list }); }} placeholder="Your answer" rows={2} className="w-full rounded border border-[var(--border)] bg-transparent px-2 py-1 text-sm resize-none" />
                        <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={() => savePrep({ ...prep, answers: (prep.answers ?? []).filter((_, j) => j !== i) })}>Remove</Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => savePrep({ ...prep, answers: [...(prep.answers ?? []), { q: "", a: "" }] })}>+ Add answer</Button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Talking points</label>
                  <textarea value={(prep.talkingPoints ?? []).join("\n")} onChange={(e) => savePrep({ ...prep, talkingPoints: e.target.value.split("\n").filter(Boolean) })} placeholder="One per line" rows={3} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Company research notes</label>
                  <textarea value={prep.researchNotes ?? ""} onChange={(e) => savePrep({ ...prep, researchNotes: e.target.value })} placeholder="Notes about the company, team, product..." rows={4} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm resize-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Questions to ask them</label>
                  <textarea value={(prep.questionsToAsk ?? []).join("\n")} onChange={(e) => savePrep({ ...prep, questionsToAsk: e.target.value.split("\n").filter(Boolean) })} placeholder="One per line" rows={3} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm resize-none" />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
