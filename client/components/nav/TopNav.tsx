"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import UserMenu from "@/components/nav/UserMenu";
import CheckInOutWidget from "@/components/attendance/CheckInOutWidget";

export default function TopNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const links = [
    { href: "/dashboard", label: user.role === "admin" ? "Employees" : "Dashboard" },
    { href: "/attendance", label: "Attendance" },
    { href: "/time-off", label: "Time Off" },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              D
            </span>
            <span className="hidden sm:inline">Dayflow</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-background hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <CheckInOutWidget />
          <UserMenu />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="rounded-md p-2 text-lg leading-none text-muted hover:bg-background sm:hidden"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-2 sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-background hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
