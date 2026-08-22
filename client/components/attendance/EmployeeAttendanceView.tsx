"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAttendanceForUser, MOCK_TODAY } from "@/lib/mock";
import { subscribeMockEvent } from "@/lib/mock/events";
import { formatMonthLabel, formatWeekday, shiftMonth } from "@/lib/date";
import { getStatusMeta } from "@/lib/attendanceStatus";
import SummaryStat from "@/components/attendance/SummaryStat";
import { cn } from "@/lib/cn";
import type { AttendanceRecord } from "@/lib/types";

const CURRENT_MONTH = MOCK_TODAY.slice(0, 7);

export default function EmployeeAttendanceView() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function load() {
      getAttendanceForUser(user!.id).then((data) => {
        if (!cancelled) {
          setRecords(data);
          setLoading(false);
        }
      });
    }

    load();
    const unsubscribe = subscribeMockEvent("attendance:update", load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  if (!user) return null;

  const monthRecords = records
    .filter((record) => record.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));

  const presentCount = monthRecords.filter((r) => r.status === "present" || r.status === "half_day").length;
  const leaveCount = monthRecords.filter((r) => r.status === "leave").length;
  const totalWorkingDays = monthRecords.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
        <button
          type="button"
          onClick={() => setMonth((current) => shiftMonth(current, -1))}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-background"
          aria-label="Previous month"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-foreground">{formatMonthLabel(month)}</span>
        <button
          type="button"
          onClick={() => setMonth((current) => shiftMonth(current, 1))}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-background"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryStat label="Days Present" value={presentCount} />
        <SummaryStat label="Leaves" value={leaveCount} />
        <SummaryStat label="Total Working Days" value={totalWorkingDays} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        {loading ? (
          <p className="p-4 text-sm text-muted">Loading attendance…</p>
        ) : monthRecords.length === 0 ? (
          <p className="p-4 text-sm text-muted">No attendance records for this month.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 font-medium">Check In</th>
                <th className="px-4 py-2 font-medium">Check Out</th>
                <th className="px-4 py-2 font-medium">Work Hours</th>
                <th className="px-4 py-2 font-medium">Extra Hours</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.map((record) => {
                const meta = getStatusMeta(record.status);
                return (
                  <tr key={record.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-foreground">{record.date}</td>
                    <td className="px-4 py-2 text-muted">{formatWeekday(record.date)}</td>
                    <td className="px-4 py-2 text-foreground">{record.checkInTime ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{record.checkOutTime ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{record.workHours ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{record.extraHours ?? "—"}</td>
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
