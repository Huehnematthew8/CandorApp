"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, ChevronDown, Trash2, Plus } from "lucide-react";
import { useIndustriesContext } from "@/lib/IndustriesContext";
import { STATUS_LABELS, statusSelectClass, statusChevronClass } from "@/lib/demo-data";
import type { JobStatus } from "@/lib/database.types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TRACKER_TH_BASE = "border-b border-[var(--candor-border)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--candor-dim)]";
const TRACKER_TH_SORTABLE = "relative cursor-pointer hover:text-[var(--candor-muted)]";
const TRACKER_RESIZE_HANDLE_CLASS = "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-[var(--accent)]/30";
const TRACKER_CELL_INPUT = "h-8 w-full min-w-0 border-0 border-b border-transparent bg-transparent px-0 py-1 shadow-none focus-visible:ring-0 focus-visible:border-[var(--candor-border)] hover:border-[var(--candor-border)]";
const TRACKER_CHECKBOX_CLASS = "tracker-checkbox h-4 w-4 cursor-pointer rounded border border-[var(--candor-border)] bg-[var(--candor-surface2)] shadow-none outline-none focus-visible:ring-1 focus-visible:ring-[var(--candor-gold)] focus-visible:ring-offset-0 accent-[var(--candor-gold)]";

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

const emptyNewRow = (defaultIndustryId: string) => ({
  company: "",
  role: "",
  industryId: defaultIndustryId,
  location: "",
  salary: "",
});

export function TrackerView() {
  const { industries, updateCompany, moveCompanyToIndustry, deleteCompany, addCompany, addIndustry } = useIndustriesContext();
  const defaultIndustryId = industries[0]?.id ?? "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [sortCol, setSortCol] = useState<SortCol>("company");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [toast, setToast] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState(() => emptyNewRow(defaultIndustryId));
  const addRowCompanyRef = useRef<HTMLInputElement>(null);
  const defaultWidths: Record<string, number> = { company: 160, role: 180, industry: 120, location: 100, salary: 100, status: 120, files: 80, updated: 90 };
  const [colWidths, setColWidths] = useState<Record<string, number>>(defaultWidths);
  const resizeRef = useRef<{ key: string; startX: number; startW: number } | null>(null);

  useEffect(() => {
    if (isAddingRow) addRowCompanyRef.current?.focus();
  }, [isAddingRow]);

  useEffect(() => {
    if (!isAddingRow) setNewRow(emptyNewRow(defaultIndustryId));
  }, [isAddingRow, defaultIndustryId]);
  const handleResizeStart = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { key, startX: e.clientX, startW: colWidths[key] ?? defaultWidths[key] };
  }, [colWidths]);
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeRef.current) return;
    const { key, startX, startW } = resizeRef.current;
    const delta = e.clientX - startX;
    setColWidths((w) => ({ ...w, [key]: Math.max(80, Math.min(400, startW + delta)) }));
  }, []);
  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
    if (typeof document !== "undefined") {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [handleResizeMove]);
  const onResizeMouseDown = (key: string, e: React.MouseEvent) => {
    handleResizeStart(key, e);
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

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
  const bulkDelete = () => {
    const n = selectedIds.size;
    if (n === 0) return;
    if (!window.confirm(`Delete ${n} job${n === 1 ? "" : "s"}?`)) return;
    selectedIds.forEach((id) => deleteCompany(id));
    setSelectedIds(new Set());
    showToast("Deleted");
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

  const saveNewRow = useCallback(async () => {
    const company = newRow.company.trim();
    const role = newRow.role.trim();
    if (!company || !role) return;
    let industryId = newRow.industryId || industries[0]?.id;
    if (!industryId) {
      const id = await addIndustry("Uncategorised", "📋");
      industryId = id ?? "";
    }
    if (!industryId) return;
    await addCompany(
      industryId,
      company,
      role,
      newRow.location.trim() || null,
      newRow.salary.trim() || null
    );
    setNewRow(emptyNewRow(industryId));
    setIsAddingRow(false);
    showToast("Job added");
  }, [newRow, industries, addCompany, addIndustry]);

  const cancelNewRow = useCallback(() => {
    setIsAddingRow(false);
    setNewRow(emptyNewRow(defaultIndustryId));
  }, [defaultIndustryId]);

  const onAddRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancelNewRow();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNewRow();
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

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--candor-border)] bg-[var(--candor-surface2)] px-3 py-2">
          <span className="text-xs text-[var(--candor-muted)]">{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={() => bulkSetStatus("rejected")}
            className="rounded-full bg-[var(--red)]/20 px-3 py-1.5 text-xs font-medium text-[var(--red)] hover:bg-[var(--red)]/30"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={bulkDelete}
            className="rounded-full bg-[var(--red)]/20 px-3 py-1.5 text-xs font-medium text-[var(--red)] hover:bg-[var(--red)]/30"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded-full border border-[var(--candor-border)] px-3 py-1.5 text-xs text-[var(--candor-muted)] hover:bg-[var(--candor-surface3)]"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-[var(--candor-border)]">
        <table className="w-full border-collapse text-sm table-fixed">
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: colWidths.company }} />
            <col style={{ width: colWidths.role }} />
            <col style={{ width: colWidths.industry }} />
            <col style={{ width: colWidths.location }} />
            <col style={{ width: colWidths.salary }} />
            <col style={{ width: colWidths.status }} />
            <col style={{ width: colWidths.files ?? 80 }} />
            <col style={{ width: colWidths.updated ?? 90 }} />
            <col style={{ width: 40 }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-[var(--candor-surface)]">
            <tr>
              <th className="w-10 border-b border-[var(--candor-border)] px-2 py-3 text-left text-xs font-semibold uppercase text-[var(--candor-dim)]">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedIds.size === rows.length}
                  onChange={selectAll}
                  aria-label="Select all"
                  className={TRACKER_CHECKBOX_CLASS}
                />
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
                  className={cn(TRACKER_TH_BASE, TRACKER_TH_SORTABLE, "tracking-wider")}
                  onClick={() => toggleSort(col as SortCol)}
                >
                  <span className="block truncate pr-4">{label}{" "}{sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
                  <div role="separator" aria-orientation="vertical" className={TRACKER_RESIZE_HANDLE_CLASS} onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown(col, e); }} style={{ marginRight: -2 }} />
                </th>
              ))}
              <th className={cn(TRACKER_TH_BASE, "relative")}>
                <span className="block truncate pr-4">Files</span>
                <div role="separator" aria-orientation="vertical" className={TRACKER_RESIZE_HANDLE_CLASS} onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown("files", e); }} style={{ marginRight: -2 }} />
              </th>
              <th className={cn(TRACKER_TH_BASE, "relative")}>
                <span className="block truncate pr-4">Updated</span>
                <div role="separator" aria-orientation="vertical" className={TRACKER_RESIZE_HANDLE_CLASS} onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown("updated", e); }} style={{ marginRight: -2 }} />
              </th>
              <th className="w-10 border-b border-[var(--candor-border)] px-2 py-3 text-left text-xs font-semibold uppercase text-[var(--candor-dim)]" aria-label="Delete" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-sm text-[var(--candor-dim)]">
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
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      aria-label={`Select ${row.company}`}
                      className={TRACKER_CHECKBOX_CLASS}
                      onClick={(e) => e.stopPropagation()}
                    />
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
                  <td className="overflow-hidden px-4 py-2" title={row.company}>
                    <Input
                      value={row.company}
                      onChange={(e) => handleCellChange(row.id, "name", e.target.value)}
                      className={cn(TRACKER_CELL_INPUT, "text-[var(--candor-text)]")}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="overflow-hidden px-4 py-2" title={row.role}>
                    <Input
                      value={row.role}
                      onChange={(e) => handleCellChange(row.id, "role", e.target.value)}
                      className={cn(TRACKER_CELL_INPUT, "text-[var(--candor-muted)]")}
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
                      className={cn(TRACKER_CELL_INPUT, "min-w-[80px] text-[var(--candor-dim)]")}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={row.salary === "—" ? "" : row.salary}
                      onChange={(e) => handleCellChange(row.id, "salary", e.target.value)}
                      placeholder="—"
                      className={cn(TRACKER_CELL_INPUT, "min-w-[80px] text-[var(--candor-dim)]")}
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
                  <td className="w-10 px-2 py-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${row.company}" — ${row.role}?`)) {
                          deleteCompany(row.id);
                          showToast("Deleted");
                        }
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--candor-muted)] transition-colors hover:bg-[var(--red)]/10 hover:text-[var(--red)]"
                      aria-label={`Delete ${row.company}`}
                      title="Delete job"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
            {!isAddingRow ? (
              <tr className="border-b border-[var(--candor-border)]">
                <td colSpan={11} className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingRow(true)}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--candor-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--candor-dim)] transition-colors hover:border-[var(--candor-gold)]/40 hover:bg-[var(--candor-surface)] hover:text-[var(--candor-muted)]"
                  >
                    <Plus className="h-4 w-4" />
                    Add job
                  </button>
                </td>
              </tr>
            ) : (
              <tr className="border-b border-[var(--candor-border)] bg-[var(--candor-surface)]/60">
                <td className="w-10 px-2 py-2" />
                <td className="w-10 px-2 py-2" />
                <td className="overflow-hidden px-4 py-2">
                  <Input
                    ref={addRowCompanyRef}
                    value={newRow.company}
                    onChange={(e) => setNewRow((r) => ({ ...r, company: e.target.value }))}
                    onKeyDown={onAddRowKeyDown}
                    placeholder="Company"
                    className="h-8 w-full min-w-0 border-0 border-b border-[var(--candor-border)] bg-transparent px-0 py-1 text-[var(--candor-text)] shadow-none focus-visible:ring-0"
                  />
                </td>
                <td className="overflow-hidden px-4 py-2">
                  <Input
                    value={newRow.role}
                    onChange={(e) => setNewRow((r) => ({ ...r, role: e.target.value }))}
                    onKeyDown={onAddRowKeyDown}
                    placeholder="Role"
                    className="h-8 w-full min-w-0 border-0 border-b border-[var(--candor-border)] bg-transparent px-0 py-1 text-[var(--candor-muted)] shadow-none focus-visible:ring-0"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="relative inline-block min-w-[120px]">
                    <select
                      value={newRow.industryId || (industries[0]?.id ?? "")}
                      onChange={(e) => setNewRow((r) => ({ ...r, industryId: e.target.value }))}
                      onKeyDown={onAddRowKeyDown}
                      className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 pr-8 text-xs text-[var(--text-muted)] outline-none transition-colors focus:ring-2 focus:ring-[var(--accent)]/20 focus:ring-offset-0"
                    >
                      {industries.length === 0 ? (
                        <option value="">Uncategorised</option>
                      ) : (
                        industries.map((ind) => (
                          <option key={ind.id} value={ind.id}>
                            {ind.emoji} {ind.name}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-[var(--text-muted)] opacity-70" aria-hidden />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={newRow.location}
                    onChange={(e) => setNewRow((r) => ({ ...r, location: e.target.value }))}
                    onKeyDown={onAddRowKeyDown}
                    placeholder="Location"
                    className="h-8 min-w-[80px] border-0 border-b border-[var(--candor-border)] bg-transparent px-0 py-1 text-[var(--candor-dim)] shadow-none focus-visible:ring-0"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={newRow.salary}
                    onChange={(e) => setNewRow((r) => ({ ...r, salary: e.target.value }))}
                    onKeyDown={onAddRowKeyDown}
                    placeholder="Salary"
                    className="h-8 min-w-[80px] border-0 border-b border-[var(--candor-border)] bg-transparent px-0 py-1 text-[var(--candor-dim)] shadow-none focus-visible:ring-0"
                  />
                </td>
                <td className="px-4 py-2 text-xs text-[var(--candor-dim)]">Draft</td>
                <td className="px-4 py-3 text-[var(--candor-dim)]">—</td>
                <td className="px-4 py-3 text-[var(--candor-dim)]">—</td>
                <td className="w-10 px-2 py-2">
                  <button
                    type="button"
                    onClick={cancelNewRow}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--candor-muted)] transition-colors hover:bg-[var(--candor-surface2)] hover:text-[var(--candor-dim)]"
                    aria-label="Cancel"
                    title="Cancel (Esc)"
                  >
                    ×
                  </button>
                </td>
              </tr>
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
