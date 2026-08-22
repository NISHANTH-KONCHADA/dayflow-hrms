"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import { checkIn, checkOut, getPersonalSummary } from "@/lib/api/attendance";
import { getPersonalLeaveRequests } from "@/lib/api/leave";
import { getStatusMeta } from "@/lib/attendanceStatus";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/Button";
import type { AttendanceStatus } from "@/lib/types";

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();

  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [todayStatus, setTodayStatus] = useState<AttendanceStatus | null>(null);
  const [recentLeave, setRecentLeave] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const todayDateStr = new Date().toISOString().split("T")[0];

  async function loadActivity() {
    if (!user) return;
    try {
      const [summary, leaveRes] = await Promise.all([
        getPersonalSummary(),
        getPersonalLeaveRequests({ limit: 5 }),
      ]);

      if (summary) {
        const att = summary.todayAttendance;
        setTodayAttendance(att);
        if (att && att.checkIn) {
          setTodayStatus("present");
        } else {
          setTodayStatus("absent");
        }
      }

      if (leaveRes) {
        const requests = Array.isArray(leaveRes) ? leaveRes : leaveRes.requests || leaveRes.leaveRequests || [];
        setRecentLeave(requests.slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to load dashboard activity", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, [user]);

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      await checkIn();
      await loadActivity();
    } catch (err: any) {
      alert(err.message || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      await checkOut();
      await loadActivity();
    } catch (err: any) {
      alert(err.message || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (!user) return null;

  const statusMeta = getStatusMeta(todayStatus);
  const isCheckedIn = Boolean(todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut);
  const isCheckedOut = Boolean(todayAttendance && todayAttendance.checkOut);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Welcome back, {user.firstName}</h1>
          <p className="text-sm text-muted">Here&apos;s your daily workday overview.</p>
        </div>

        {/* Live Attendance Quick Action Card */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
          <div className="text-xs">
            <span className="text-muted">Today&apos;s Status: </span>
            <span className="font-semibold text-foreground">
              {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Not Checked In"}
            </span>
          </div>
          {isCheckedIn ? (
            <Button size="sm" variant="secondary" onClick={handleCheckOut} loading={actionLoading}>
              Check Out
            </Button>
          ) : isCheckedOut ? (
            <span className="rounded bg-muted/20 px-2.5 py-1 text-xs text-muted font-medium">
              Completed
            </span>
          ) : (
            <Button size="sm" onClick={handleCheckIn} loading={actionLoading}>
              Check In
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAccessCard title="My Profile" description="View details, bank info & schedule" href="/profile" />
        <QuickAccessCard title="Attendance" description="Check in/out & view log history" href="/attendance" />
        <QuickAccessCard title="Time Off" description="Leave balances & apply for leave" href="/time-off" />
        <QuickAccessCard title="Log Out" description="End active session" onClick={logout} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>

        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading activity...</p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-sm">
              <span className={cn("h-2.5 w-2.5 rounded-full", statusMeta.dotClassName)} />
              <span className="text-foreground">
                Today ({todayDateStr}): <span className="font-medium">{statusMeta.label}</span>
                {todayAttendance?.checkIn && (
                  <span className="text-xs text-muted ml-2">
                    (In: {new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {todayAttendance.checkOut ? ` - Out: ${new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''})
                  </span>
                )}
              </span>
            </div>

            {recentLeave.length === 0 ? (
              <p className="text-sm text-muted">No leave requests yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Leave Requests</p>
                <ul className="flex flex-col gap-2">
                  {recentLeave.map((request) => (
                    <li key={request.id} className="flex items-center justify-between rounded-md border border-border/50 bg-background/50 p-2.5 text-sm">
                      <span className="text-foreground font-medium">
                        {request.leaveType?.name || request.leaveType || "Leave"} · {request.startDate ? new Date(request.startDate).toLocaleDateString() : ""}
                        {request.startDate !== request.endDate ? ` to ${new Date(request.endDate).toLocaleDateString()}` : ""}
                      </span>
                      <span className={cn("text-xs font-medium capitalize px-2 py-0.5 rounded", leaveStatusColor(request.status))}>
                        {request.status?.toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function leaveStatusColor(status: string): string {
  const s = status?.toLowerCase();
  switch (s) {
    case "approved":
      return "bg-status-present/10 text-status-present";
    case "rejected":
      return "bg-status-danger/10 text-status-danger";
    default:
      return "bg-status-absent/10 text-status-absent";
  }
}
