"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  checkIn,
  checkOut,
  getPersonalAttendance,
  getPersonalSummary,
  getAdminAttendance,
} from "@/lib/api/attendance";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { cn } from "@/lib/cn";

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"me" | "admin">("me");

  // Personal state
  const [personalSummary, setPersonalSummary] = useState<any | null>(null);
  const [personalLogs, setPersonalLogs] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Admin state
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("");

  const todayDateStr = new Date().toISOString().split("T")[0];

  async function loadPersonalData() {
    setLoadingPersonal(true);
    try {
      const [sum, history] = await Promise.all([
        getPersonalSummary(),
        getPersonalAttendance({ limit: 30 }),
      ]);
      setPersonalSummary(sum);
      setPersonalLogs(Array.isArray(history) ? history : history?.attendances || history?.data || []);
    } catch (err) {
      console.error("Failed to fetch personal attendance data", err);
    } finally {
      setLoadingPersonal(false);
    }
  }

  async function loadAdminData() {
    setLoadingAdmin(true);
    try {
      const data = await getAdminAttendance({
        search: adminSearch || undefined,
        status: adminStatusFilter || undefined,
      });
      setAdminLogs(Array.isArray(data) ? data : data?.attendances || data?.records || []);
    } catch (err) {
      console.error("Failed to fetch admin attendance data", err);
    } finally {
      setLoadingAdmin(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadPersonalData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "admin" && isAdminOrHr) {
      loadAdminData();
    }
  }, [activeTab, adminSearch, adminStatusFilter]);

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      await checkIn({ notes: notes || undefined });
      setNotes("");
      await loadPersonalData();
    } catch (err: any) {
      alert(err.message || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      await checkOut({ notes: notes || undefined });
      setNotes("");
      await loadPersonalData();
    } catch (err: any) {
      alert(err.message || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  }

  const todayAtt = personalSummary?.todayAttendance;
  const isCheckedIn = Boolean(todayAtt && todayAtt.checkIn && !todayAtt.checkOut);
  const isCheckedOut = Boolean(todayAtt && todayAtt.checkOut);

  const metrics = personalSummary?.metrics || {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Attendance Tracker</h1>
          <p className="text-sm text-muted">Monitor check-in/out times, work duration, and attendance history.</p>
        </div>

        {isAdminOrHr && (
          <div className="flex rounded-md border border-border bg-surface p-1">
            <button
              onClick={() => setActiveTab("me")}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "me" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              )}
            >
              My Attendance
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === "admin" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              )}
            >
              All Employees
            </button>
          </div>
        )}
      </div>

      {activeTab === "me" ? (
        <>
          {/* Check-In / Check-Out Punch Box */}
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    isCheckedIn ? "bg-status-present animate-pulse" : isCheckedOut ? "bg-primary" : "bg-status-absent"
                  )}
                />
                <h2 className="text-lg font-semibold text-foreground">
                  Today ({todayDateStr})
                </h2>
              </div>
              <p className="text-sm text-muted">
                {isCheckedOut
                  ? `Completed workday. Checked in at ${formatTime(todayAtt.checkIn)} and checked out at ${formatTime(todayAtt.checkOut)}.`
                  : isCheckedIn
                  ? `Currently Checked In (started at ${formatTime(todayAtt.checkIn)})`
                  : "You have not checked in today."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isCheckedOut && (
                <input
                  type="text"
                  placeholder="Optional work notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}

              {isCheckedIn ? (
                <Button variant="secondary" onClick={handleCheckOut} loading={actionLoading}>
                  Check Out Now
                </Button>
              ) : isCheckedOut ? (
                <span className="inline-flex items-center justify-center rounded-md bg-muted/20 px-4 py-2 text-sm font-medium text-muted">
                  Checked Out
                </span>
              ) : (
                <Button onClick={handleCheckIn} loading={actionLoading}>
                  Check In Now
                </Button>
              )}
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted font-medium">Present Days</p>
              <p className="mt-1 text-2xl font-bold text-status-present">{metrics.presentDays ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted font-medium">Leave Days</p>
              <p className="mt-1 text-2xl font-bold text-primary">{metrics.leaveDays ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted font-medium">Absent Days</p>
              <p className="mt-1 text-2xl font-bold text-status-danger">{metrics.absentDays ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-muted font-medium">Total Work Hours</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {metrics.totalWorkHours ? Number(metrics.totalWorkHours).toFixed(1) : "0.0"} hrs
              </p>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="rounded-lg border border-border bg-surface shadow-sm">
            <div className="border-b border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Personal Attendance History</h3>
            </div>
            {loadingPersonal ? (
              <div className="p-6 text-center text-sm text-muted">Loading attendance logs...</div>
            ) : personalLogs.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">No attendance records found yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead className="border-b border-border bg-muted/20 text-xs font-semibold text-muted">
                    <tr>
                      <th className="p-3">Work Date</th>
                      <th className="p-3">Check In</th>
                      <th className="p-3">Check Out</th>
                      <th className="p-3">Work Hours</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {personalLogs.map((log) => {
                      const workDateStr = log.workDate ? new Date(log.workDate).toISOString().split("T")[0] : log.date;
                      return (
                        <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-medium">{workDateStr}</td>
                          <td className="p-3">{formatTime(log.checkIn || log.checkInTime)}</td>
                          <td className="p-3">{formatTime(log.checkOut || log.checkOutTime)}</td>
                          <td className="p-3">
                            {log.workMinutes != null
                              ? (log.workMinutes / 60).toFixed(1) + " hrs"
                              : log.workHours != null
                              ? log.workHours + " hrs"
                              : "—"}
                          </td>
                          <td className="p-3">
                            <span className={cn("text-xs font-medium capitalize px-2 py-0.5 rounded", getBadgeStyle(log.status))}>
                              {log.status?.toLowerCase().replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted truncate max-w-xs">{log.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Admin View of All Employees */
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-foreground">Company Attendance Records</h3>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Filter by employee name..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="LEAVE">On Leave</option>
              </select>
            </div>
          </div>

          {loadingAdmin ? (
            <div className="p-6 text-center text-sm text-muted">Loading company attendance...</div>
          ) : adminLogs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="border-b border-border bg-muted/20 text-xs font-semibold text-muted">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Work Date</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adminLogs.map((log) => {
                    const empName = log.employee
                      ? `${log.employee.firstName} ${log.employee.lastName || ""}`
                      : log.user
                      ? `${log.user.firstName} ${log.user.lastName || ""}`
                      : "Employee";
                    const workDateStr = log.workDate ? new Date(log.workDate).toISOString().split("T")[0] : log.date;
                    return (
                      <tr key={log.id} className="hover:bg-muted/10">
                        <td className="p-3 font-medium">{empName}</td>
                        <td className="p-3">{workDateStr}</td>
                        <td className="p-3">{formatTime(log.checkIn || log.checkInTime)}</td>
                        <td className="p-3">{formatTime(log.checkOut || log.checkOutTime)}</td>
                        <td className="p-3">
                          {log.workMinutes != null
                            ? (log.workMinutes / 60).toFixed(1) + " hrs"
                            : log.workHours != null
                            ? log.workHours + " hrs"
                            : "—"}
                        </td>
                        <td className="p-3">
                          <span className={cn("text-xs font-medium capitalize px-2 py-0.5 rounded", getBadgeStyle(log.status))}>
                            {log.status?.toLowerCase().replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(isoOrTime?: string | null): string {
  if (!isoOrTime) return "—";
  if (isoOrTime.includes("T")) {
    return new Date(isoOrTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return isoOrTime;
}

function getBadgeStyle(status?: string): string {
  const s = status?.toUpperCase();
  switch (s) {
    case "PRESENT":
      return "bg-status-present/10 text-status-present";
    case "ABSENT":
      return "bg-status-danger/10 text-status-danger";
    case "HALF_DAY":
      return "bg-amber-500/10 text-amber-600";
    case "LEAVE":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted/20 text-muted";
  }
}
