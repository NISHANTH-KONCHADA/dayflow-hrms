"use client";

import { useEffect, useState } from "react";
import EmployeeCard from "@/components/dashboard/EmployeeCard";
import { getTodayStatus, getUsers } from "@/lib/mock";
import type { AttendanceStatus, User } from "@/lib/types";

interface EmployeeWithStatus {
  user: User;
  status: AttendanceStatus | null;
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      const users = await getUsers();
      const withStatus = await Promise.all(
        users.map(async (user) => ({ user, status: await getTodayStatus(user.id) })),
      );
      if (!cancelled) {
        setEmployees(withStatus);
        setLoading(false);
      }
    }

    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, []);

  const presentCount = employees.filter((employee) => employee.status === "present").length;
  const leaveCount = employees.filter((employee) => employee.status === "leave").length;
  const absentCount = employees.filter((employee) => employee.status === "absent").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">Employees</h1>
        <p className="text-sm text-muted">
          {loading
            ? "Loading today's attendance…"
            : `${presentCount} present · ${leaveCount} on leave · ${absentCount} absent today`}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading employees…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {employees.map(({ user, status }) => (
            <EmployeeCard key={user.id} user={user} status={status} />
          ))}
        </div>
      )}
    </div>
  );
}
