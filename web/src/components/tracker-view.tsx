"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ExternalLink, ChevronDown } from "lucide-react";
import { useIndustriesContext } from "@/lib/IndustriesContext";
import { STATUS_LABELS } from "@/lib/demo-data";
import type { JobStatus } from "@/lib/database.types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

type SortCol = "company" | "role" | "industry" | "location" | "salary" | "status";

interface Row {
  id: string;
  company: string;
  role: string;
  industry: string;
  industryId: string;
  location: string;
  salary: string;
  status: JobStatus;
  fileCount: number;
  updated: string;
}

function getRowsFromIndustries(industries: { id: string; name: string; companies: { id: string; name: string; role: string; location: string | null; salary: string | null; status: JobStatus }[] }[]): Row[] {
  const rows: Row[] = [];
  industries.forEach((ind) => {
    ind.companies.forEach((c) => {
      rows.push({
        id: c.id,
        company: c.name,
        role: c.role,
        industry: ind.name,
        industryId: ind.id,
        location: c.location ?? "—",
        salary: c.salary ?? "—",
        status: c.status,
        fileCount: 0,
        updated: "—",
      });
    });
  });
  return rows;
}

export function TrackerView() {
  const { industries, updateCompany, moveCompanyToIndustry } = useIndustriesContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [sortCol, setSortCol] = useState<SortCol>("company");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [toast, setToast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => {
    if (selectedIds.size === rows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(rows.map((r) => r.id)));
  };
  const bulkSetStatus = (status: JobStatus) => {
    selectedIds.forEach((id) => updateCompany(id, { status }));
    setSelectedIds(new Set());
    showToast(`Updated ${selectedIds.size} to ${STATUS_LABELS[status]}`);
  };

  const rows = useMemo(() => {
    let r = getRowsFromIndustries(industries);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (row) =>
          row.company.toLowerCase().includes(q) ||
          row.role.toLowerCase().includes(q) ||
          row.industry.toLowerCase().includes(q)
      );
    }
    if (statusFilter) r = r.filter((row) => row.status === statusFilter);
    r.sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sortCol] ?? "").toLowerCase();
      const bv = String((b as Record<string, unknown>)[sortCol] ?? "").toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [industries, search, statusFilter, sortCol, sortDir]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCellChange = (companyId: string, field: "name" | "role" | "location" | "salary" | "status", value: string) => {
    if (field === "status") {
      updateCompany(companyId, { status: value as JobStatus });
    } else if (field === "name") {
      updateCompany(companyId, { name: value });
    } else if (field === "role") {
      updateCompany(companyId, { role: value });
    } else if (field === "location") {
      updateCompany(companyId, { location: value || null });
    } else if (field === "salary") {
      updateCompany(companyId, { salary: value || null });
    }
    showToast("Updated");
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search all jobs..."
            className="w-60 bg-[var(--candor-surface2)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {(["", "draft", "applied", "screening", "round1", "round2", "offer", "rejected"] as const).map(
              (s) => (
                <button
                  key={s || "all"}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === s
                      ? "bg-[var(--candor-surface3)] text-[var(--candor-text)]"
                      : "text-[var(--candor-muted)] hover:text-[var(--candor-text)]"
                  )}
                >
                  {s ? STATUS_LABELS[s] : "All"}
                </button>
              )
            )}
          </div>
        </div>
        <span className="text-xs text-[var(--candor-dim)]">
          {rows.length} job{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--candor-border)] bg-[var(--candor-surface2)] px-3 py-2">
          <span className="text-xs text-[var(--candor-muted)]">{selectedIds.size} selected</span>
          <button type="button" onClick={() => bulkSetStatus("applied")} className="rounded-full bg-[var(--blue)]/20 px-3 py-1.5 text-xs font-medium text-[var(--blue)] hover:bg-[var(--blue)]/30">Move to Applied</button>
          <button type="button" onClick={() => bulkSetStatus("rejected")} className="rounded-full bg-[var(--red)]/20 px-3 py-1.5 text-xs font-medium text-[var(--red)] hover:bg-[var(--red)]/30">Archive</button>
          <button type="button" onClick={() => setSelectedIds(new Set())} className="rounded-full border border-[var(--candor-border)] px-3 py-1.5 text-xs text-[var(--candor-muted)] hover:bg-[var(--candor-surface3)]">Clear</button>
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-[var(--candor-border)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--candor-surface)]">
            <tr>
              <th className="w-10 border-b border-[var(--candor-border)] px-2 py-3 text-left text-xs font-semibold uppercase text-[var(--candor-dim)]">
                <input type="checkbox" checked={rows.length > 0 && selectedIds.size === rows.length} onChange={selectAll} aria-label="Select all" className="rounded border-[var(--candor-border)]" />
              </th>
              <th className="w-10 border-b border-[var(--candor-border)] px-2 py-3 text-left text-xs font-semibold uppercase text-[var(--candor-dim)]" aria-label="Open" />
              {[
                ["company", "Company"],
                ["role", "Role"],
                ["industry", "Industry"],
                ["location", "Location"],
                ["salary", "Salary"],
                ["status", "Status"],
              ].map(([col, label]) => (
                <th
                  key={col}
                  className="cursor-pointer border-b border-[var(--candor-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--candor-dim)] hover:text-[var(--candor-muted)]"
                  onClick={() => toggleSort(col as SortCol)}
                >
                  {label}{" "}
                  {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                </th>
              ))}
              <th className="border-b border-[var(--candor-border)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--candor-dim)]">Files</th>
              <th className="border-b border-[var(--candor-border)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--candor-dim)]">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-sm text-[var(--candor-dim)]">
                  No jobs match your filter
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-b border-[var(--candor-border)] transition-colors hover:bg-[var(--candor-surface)]", selectedIds.has(row.id) && "bg-[var(--candor-surface2)]")}
                >
                  <td className="w-10 px-2 py-2">
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} aria-label={`Select ${row.company}`} className="rounded border-[var(--candor-border)]" onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="w-10 px-2 py-2">
                    <Link
                      href={`/dashboard?company=${row.id}`}
                      title="Open in board"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--candor-muted)] transition-colors hover:bg-[var(--candor-surface2)] hover:text-[var(--candor-gold)]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.company}
                      onChange={(e) => handleCellChange(row.id, "name", e.target.value)}
                      className="h-8 min-w-[120px] border-0 border-b border-transparent bg-transparent px-0 py-1 text-[var(--candor-text)] shadow-none focus-visible:ring-0 focus-visible:border-[var(--candor-border)] hover:border-[var(--candor-border)]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.role}
                      onChange={(e) => handleCellChange(row.id, "role", e.target.value)}
                      className="h-8 min-w-[100px] border-0 border-b border-transparent bg-transparent px-0 py-1 text-[var(--candor-muted)] shadow-none focus-visible:ring-0 focus-visible:border-[var(--candor-border)] hover:border-[var(--candor-border)]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative inline-block min-w-[120px]">
                      <select
                        value={row.industryId}
                        onChange={(e) => moveCompanyToIndustry(row.id, row.industryId, e.target.value)}
                        className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 pr-8 text-xs text-[var(--text-muted)] outline-none transition-colors focus:ring-2 focus:ring-[var(--accent)]/20 focus:ring-offset-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {industries.map((ind) => (
                          <option key={ind.id} value={ind.id}>
                            {ind.emoji} {ind.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-[var(--text-muted)] opacity-70" aria-hidden />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.location === "—" ? "" : row.location}
                      onChange={(e) => handleCellChange(row.id, "location", e.target.value)}
                      placeholder="—"
                      className="h-8 min-w-[80px] border-0 border-b border-transparent bg-transparent px-0 py-1 text-[var(--candor-dim)] shadow-none focus-visible:ring-0 focus-visible:border-[var(--candor-border)] hover:border-[var(--candor-border)]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.salary === "—" ? "" : row.salary}
                      onChange={(e) => handleCellChange(row.id, "salary", e.target.value)}
                      placeholder="—"
                      className="h-8 min-w-[80px] border-0 border-b border-transparent bg-transparent px-0 py-1 text-[var(--candor-dim)] shadow-none focus-visible:ring-0 focus-visible:border-[var(--candor-border)] hover:border-[var(--candor-border)]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className={cn("relative inline-block min-w-[110px]", statusChevronClass[row.status])}>
                      <select
                        value={row.status}
                        onChange={(e) => handleCellChange(row.id, "status", e.target.value)}
                        className={cn(
                          "h-8 w-full cursor-pointer appearance-none rounded-lg border px-3 pr-8 text-xs font-medium outline-none transition-colors focus:ring-2 focus:ring-[var(--accent)]/20 focus:ring-offset-0",
                          statusSelectClass[row.status]
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(["draft", "applied", "screening", "round1", "round2", "offer", "rejected"] as const).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 opacity-70"
                        aria-hidden
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--candor-dim)]">—</td>
                  <td className="px-4 py-3 text-[var(--candor-dim)]">{row.updated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--border2)] bg-[var(--surface2)] px-4 py-2 text-[13px] text-[var(--text)] shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
