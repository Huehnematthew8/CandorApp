"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DEMO_INDUSTRIES, STATUS_LABELS } from "@/lib/demo-data";
import type { JobStatus } from "@/lib/database.types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const statusClass: Record<JobStatus, string> = {
  draft: "bg-[var(--candor-dim)]",
  applied: "bg-[var(--candor-blue)]",
  screening: "bg-[var(--candor-amber)]",
  round1: "bg-[var(--candor-purple)]",
  round2: "bg-[var(--candor-gold)]",
  offer: "bg-[var(--candor-green)]",
  rejected: "bg-[var(--candor-red)]",
};

type SortCol = "company" | "role" | "industry" | "location" | "salary" | "status";

interface Row {
  id: string;
  company: string;
  role: string;
  industry: string;
  location: string;
  salary: string;
  status: JobStatus;
  fileCount: number;
  updated: string;
}

function getRows(): Row[] {
  const rows: Row[] = [];
  DEMO_INDUSTRIES.forEach((ind) => {
    ind.companies.forEach((c) => {
      rows.push({
        id: c.id,
        company: c.name,
        role: c.role,
        industry: ind.name,
        location: c.location ?? "—",
        salary: c.salary ?? "—",
        status: c.status,
        fileCount: 0,
        updated: "2 days ago",
      });
    });
  });
  return rows;
}

export function TrackerView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [sortCol, setSortCol] = useState<SortCol>("company");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    let r = getRows();
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
  }, [search, statusFilter, sortCol, sortDir]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
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

      <div className="flex-1 overflow-auto rounded-xl border border-[var(--candor-border)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--candor-surface)]">
            <tr>
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
                <td colSpan={8} className="py-12 text-center text-sm text-[var(--candor-dim)]">
                  No jobs match your filter
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-[var(--candor-border)] transition-colors hover:bg-[var(--candor-surface)]"
                  onClick={() => {}}
                >
                  <td className="px-4 py-3">
                    <Link href="/dashboard" className="flex items-center gap-2 font-medium hover:underline">
                      {row.company}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--candor-muted)]">{row.role}</td>
                  <td className="px-4 py-3 text-[var(--candor-muted)]">{row.industry}</td>
                  <td className="px-4 py-3 text-[var(--candor-dim)]">{row.location}</td>
                  <td className="px-4 py-3 text-[var(--candor-dim)]">{row.salary}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                        statusClass[row.status]
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--candor-dim)]">—</td>
                  <td className="px-4 py-3 text-[var(--candor-dim)]">{row.updated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
