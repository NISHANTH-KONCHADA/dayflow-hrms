"use client";

import { useAuth } from "@/context/AuthContext";
import EmployeeAttendanceView from "@/components/attendance/EmployeeAttendanceView";

export default function AttendancePage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
        <p className="mt-1 text-sm text-muted">Admin attendance list view — coming next.</p>
      </div>
    );
  }

  return <EmployeeAttendanceView />;
}
