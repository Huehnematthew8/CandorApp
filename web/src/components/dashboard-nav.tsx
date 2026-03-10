"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, List, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Board", icon: LayoutGrid },
  { href: "/dashboard/tracker", label: "All Jobs", icon: List },
  { href: "/dashboard/profile", label: "My Story", icon: User },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-view-switcher flex gap-0.5 rounded-[var(--radius-lg)] p-0.5" aria-label="Main navigation">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "nav-view-btn flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium",
              isActive
                ? "bg-[var(--surface2)] text-[var(--text)] shadow-sm"
                : "text-[var(--text-muted)] hover:bg-[var(--surface2)]/60 hover:text-[var(--text)]"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
