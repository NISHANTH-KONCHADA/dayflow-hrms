"use client";

import { useEffect, useState } from "react";
import { getAttendanceForDate, getUsers, MOCK_TODAY } from "@/lib/mock";
import { subscribeMockEvent } from "@/lib/mock/events";
import { formatDateLabel, shiftDate } from "@/lib/date";
import { getStatusMeta } from "@/lib/attendanceStatus";
import SummaryStat from "@/components/attendance/SummaryStat";
import TextField from "@/components/ui/TextField";
import { cn } from "@/lib/cn";
import type { AttendanceRecord, User } from "@/lib/types";

interface AttendanceRow {
  user: User;
  record: AttendanceRecord | undefined;
}

export default function AdminAttendanceView() {
  const [date, setDate] = useState(MOCK_TODAY);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load() {
      Promise.all([getUsers(), getAttendanceForDate(date)]).then(([users, records]) => {
        if (cancelled) return;
        setRows(
          users.map((user) => ({
            user,
            record: records.find((record) => record.userId === user.id),
          })),
        );
        setLoading(false);
      });
    }

    setLoading(true);
    load();
    const unsubscribe = subscribeMockEvent("attendance:update", load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [date]);

  const filteredRows = rows.filter((row) =>
    `${row.user.firstName} ${row.user.lastName}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const presentCount = rows.filter(
    (row) => row.record?.status === "present" || row.record?.status === "half_day",
  ).length;
  const leaveCount = rows.filter((row) => row.record?.status === "leave").length;
  const absentCount = rows.length - presentCount - leaveCount;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
        <button
          type="button"
          onClick={() => setDate((current) => shiftDate(current, -1))}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-background"
          aria-label="Previous day"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-foreground">{formatDateLabel(date)}</span>
        <button
          type="button"
          onClick={() => setDate((current) => shiftDate(current, 1))}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-background"
          aria-label="Next day"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryStat label="Present" value={presentCount} />
        <SummaryStat label="On Leave" value={leaveCount} />
        <SummaryStat label="Absent / Not Marked" value={absentCount} />
      </div>

      <TextField
        label="Search Employees"
        name="search"
        placeholder="Search by name…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        {loading ? (
          <p className="p-4 text-sm text-muted">Loading attendance…</p>
        ) : filteredRows.length === 0 ? (
          <p className="p-4 text-sm text-muted">No employees match your search.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Check In</th>
                <th className="px-4 py-2 font-medium">Check Out</th>
                <th className="px-4 py-2 font-medium">Work Hours</th>
                <th className="px-4 py-2 font-medium">Extra Hours</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ user, record }) => {
                const meta = getStatusMeta(record?.status ?? null);
                return (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-foreground">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-2 text-foreground">{record?.checkInTime ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{record?.checkOutTime ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{record?.workHours ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{record?.extraHours ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", meta.dotClassName)} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
