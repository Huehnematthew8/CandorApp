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
    <nav className="nav-view-switcher flex rounded-lg bg-[var(--surface2)] p-1">
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
              "nav-view-btn flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--surface3)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
