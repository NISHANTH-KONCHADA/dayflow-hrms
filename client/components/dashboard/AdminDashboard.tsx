"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EmployeeCard from "@/components/dashboard/EmployeeCard";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { getTodayStatus, getUsers } from "@/lib/mock";
import { subscribeMockEvent } from "@/lib/mock/events";
import type { AttendanceStatus, User } from "@/lib/types";

interface EmployeeWithStatus {
  user: User;
  status: AttendanceStatus | null;
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [search, setSearch] = useState("");
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
    const unsubscribeAttendance = subscribeMockEvent("attendance:update", loadEmployees);
    const unsubscribeUsers = subscribeMockEvent("users:update", loadEmployees);

    return () => {
      cancelled = true;
      unsubscribeAttendance();
      unsubscribeUsers();
    };
  }, []);

  const presentCount = employees.filter((employee) => employee.status === "present").length;
  const leaveCount = employees.filter((employee) => employee.status === "leave").length;
  const absentCount = employees.filter((employee) => employee.status === "absent").length;

  const filteredEmployees = employees.filter(({ user }) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">Employees</h1>
          <p className="text-sm text-muted">
            {loading
              ? "Loading today's attendance…"
              : `${presentCount} present · ${leaveCount} on leave · ${absentCount} absent today`}
          </p>
        </div>
        <Link href="/employees/new">
          <Button type="button">+ New Employee</Button>
        </Link>
      </div>

      <TextField
        label="Search"
        name="search"
        placeholder="Search employees…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-xs"
      />

      {loading ? (
        <p className="text-sm text-muted">Loading employees…</p>
      ) : filteredEmployees.length === 0 ? (
        <p className="text-sm text-muted">No employees match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filteredEmployees.map(({ user, status }) => (
            <EmployeeCard key={user.id} user={user} status={status} />
          ))}
        </div>
      )}
    </div>
  );
}
