"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useIndustriesContext } from "@/lib/IndustriesContext";
import { Search, LayoutGrid, List, Columns3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { id: "board", label: "Go to Board", href: "/dashboard", icon: LayoutGrid },
  { id: "tracker", label: "All Jobs", href: "/dashboard/tracker", icon: List },
  { id: "kanban", label: "Kanban", href: "/dashboard/kanban", icon: Columns3 },
  { id: "profile", label: "My Story", href: "/dashboard/profile", icon: User },
];

export function CommandPalette() {
  const router = useRouter();
  const { industries } = useIndustriesContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allCompanies = industries.flatMap((i) => i.companies);
  const filteredCompanies = query.trim()
    ? allCompanies.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.role.toLowerCase().includes(query.toLowerCase())
      )
    : allCompanies.slice(0, 8);
  type ListItem = { id: string; label: string; href: string; icon?: React.ComponentType<{ className?: string }> };
  const companyItems: ListItem[] = filteredCompanies.map((c) => ({ id: c.id, label: `${c.name} · ${c.role}`, href: `/dashboard?company=${c.id}` }));
  const filteredItems: ListItem[] = query.trim()
    ? [...QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase())), ...companyItems]
    : [...QUICK_ACTIONS, ...companyItems];
  const total = filteredItems.length;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setSelectedIndex(0);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % total);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + total) % total);
        return;
      }
      if (e.key === "Enter" && total > 0) {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          router.push(item.href);
          close();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, total, selectedIndex, filteredItems, router, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]"
      onClick={close}
      role="dialog"
      aria-label="Search"
    >
      <div
        className="w-full max-w-xl rounded-xl border border-[var(--border2)] bg-[var(--surface)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search companies or go to..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-dim)]"
            autoFocus
          />
          <kbd className="rounded border border-[var(--border2)] px-1.5 py-0.5 text-[10px] text-[var(--text-dim)]">Esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--text-dim)]">No results</p>
          ) : (
            filteredItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { router.push(item.href); close(); }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                    i === selectedIndex ? "bg-[var(--surface3)] text-[var(--text)]" : "text-[var(--text-muted)] hover:bg-[var(--surface2)]"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-[var(--text-dim)]" />}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--text-dim)]">
          ↑↓ navigate · Enter select · ⌘K toggles
        </div>
      </div>
    </div>
  );
}
