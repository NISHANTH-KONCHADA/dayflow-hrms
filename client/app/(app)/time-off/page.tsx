"use client";

import { useAuth } from "@/context/AuthContext";
import EmployeeTimeOffView from "@/components/leave/EmployeeTimeOffView";

export default function TimeOffPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold text-foreground">Time Off</h1>
        <p className="mt-1 text-sm text-muted">Admin approval queue — coming next.</p>
      </div>
    );
  }

  return <EmployeeTimeOffView />;
}
