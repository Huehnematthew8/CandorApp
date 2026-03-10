"use client";

import Link from "next/link";
import { useIndustriesContext } from "@/lib/IndustriesContext";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/demo-data";
import type { Company, JobStatus } from "@/lib/database.types";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const columnClass: Record<JobStatus, string> = {
  draft: "border-[var(--text-dim)]/30",
  applied: "border-[var(--blue)]/40",
  screening: "border-[var(--amber)]/40",
  round1: "border-[var(--purple)]/40",
  round2: "border-[var(--accent)]/40",
  offer: "border-[var(--green)]/40",
  rejected: "border-[var(--red)]/40",
};

export function KanbanView() {
  const { industries, updateCompany } = useIndustriesContext();
  const allCompanies = industries.flatMap((i) => i.companies);

  const byStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = allCompanies.filter((c) => c.status === status);
    return acc;
  }, {} as Record<JobStatus, Company[]>);

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <h2 className="mb-4 text-lg font-medium text-[var(--text)]">Kanban</h2>
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className={cn("kanban-column flex w-[260px] shrink-0 flex-col rounded-xl border-2 bg-[var(--surface2)]", columnClass[status])}
          >
            <div className="sticky top-0 border-b border-[var(--border)] bg-[var(--surface2)] px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)]">{STATUS_LABELS[status]}</span>
              <span className="ml-2 rounded-full bg-[var(--surface3)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">{byStatus[status].length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {byStatus[status].map((c) => (
                <div
                  key={c.id}
                  className="kanban-card rounded-lg border border-[var(--border2)] bg-[var(--surface)] p-3 shadow-sm transition-shadow hover:shadow"
                >
                  <Link href={`/dashboard?company=${c.id}`} className="block">
                    <div className="font-medium text-[var(--text)]">{c.name}</div>
                    <div className="text-xs text-[var(--text-dim)]">{c.role}</div>
                  </Link>
                  <div className="relative mt-2">
                    <select
                      value={status}
                      onChange={(e) => updateCompany(c.id, { status: e.target.value as JobStatus })}
                      className={cn(
                        "w-full cursor-pointer appearance-none rounded border bg-[var(--surface2)] pr-6 py-1.5 pl-2 text-[11px] outline-none focus:ring-1",
                        status === "draft" && "border-[var(--border2)] text-[var(--text-muted)]",
                        status === "applied" && "border-[var(--blue)]/30 text-[var(--blue)]",
                        status === "screening" && "border-[var(--amber)]/30 text-[var(--amber)]",
                        status === "round1" && "border-[var(--purple)]/30 text-[var(--purple)]",
                        status === "round2" && "border-[var(--accent)]/30 text-[var(--accent)]",
                        status === "offer" && "border-[var(--green)]/30 text-[var(--green)]",
                        status === "rejected" && "border-[var(--red)]/30 text-[var(--red)]"
                      )}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          → {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-70" aria-hidden />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
