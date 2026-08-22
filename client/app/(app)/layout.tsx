import type { ReactNode } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/nav/AppShell";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
