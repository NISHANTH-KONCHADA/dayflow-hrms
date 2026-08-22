"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full outline-none ring-primary/40 focus-visible:ring-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          profilePictureUrl={user.profilePictureUrl}
          size="sm"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-muted">{user.jobPosition}</p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-foreground hover:bg-background"
          >
            My Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="block w-full px-3 py-2 text-left text-sm text-status-danger hover:bg-background"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
