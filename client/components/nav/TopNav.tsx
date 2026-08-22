"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import UserMenu from "@/components/nav/UserMenu";
import CheckInOutWidget from "@/components/attendance/CheckInOutWidget";

export default function TopNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = [
    { href: "/dashboard", label: user.role === "admin" ? "Employees" : "Dashboard" },
    { href: "/attendance", label: "Attendance" },
    { href: "/time-off", label: "Time Off" },
  ];

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

          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-background hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CheckInOutWidget />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
