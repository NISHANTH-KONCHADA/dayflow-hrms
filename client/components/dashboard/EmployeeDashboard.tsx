"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import { getLeaveRequestsForUser, getTodayStatus, MOCK_TODAY } from "@/lib/mock";
import { subscribeMockEvent } from "@/lib/mock/events";
import { getStatusMeta } from "@/lib/attendanceStatus";
import { cn } from "@/lib/cn";
import type { AttendanceStatus, LeaveRequest } from "@/lib/types";

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();

  const [todayStatus, setTodayStatus] = useState<AttendanceStatus | null>(null);
  const [recentLeave, setRecentLeave] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadActivity() {
      const [status, leaveRequests] = await Promise.all([
        getTodayStatus(user!.id),
        getLeaveRequestsForUser(user!.id),
      ]);
      if (!cancelled) {
        setTodayStatus(status);
        setRecentLeave(leaveRequests.slice(0, 3));
        setLoading(false);
      }
    }

    loadActivity();
    const unsubscribe = subscribeMockEvent("attendance:update", loadActivity);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  if (!user) return null;

  const statusMeta = getStatusMeta(todayStatus);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Welcome back, {user.firstName}</h1>
        <p className="text-sm text-muted">Here&apos;s what&apos;s happening with your workday.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAccessCard title="My Profile" description="View and edit your details" href="/profile" />
        <QuickAccessCard title="Attendance" description="Check in/out, view history" href="/attendance" />
        <QuickAccessCard title="Leave Requests" description="Apply and track time off" href="/time-off" />
        <QuickAccessCard title="Log Out" description="End your session" onClick={logout} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>

        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("h-2.5 w-2.5 rounded-full", statusMeta.dotClassName)} />
              <span className="text-foreground">
                Today ({MOCK_TODAY}): <span className="font-medium">{statusMeta.label}</span>
              </span>
            </div>

            {recentLeave.length === 0 ? (
              <p className="text-sm text-muted">No leave requests yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentLeave.map((request) => (
                  <li key={request.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">
                      {request.leaveType} leave · {request.startDate}
                      {request.startDate !== request.endDate ? ` to ${request.endDate}` : ""}
                    </span>
                    <span className={cn("text-xs font-medium capitalize", leaveStatusColor(request.status))}>
                      {request.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function leaveStatusColor(status: LeaveRequest["status"]): string {
  switch (status) {
    case "approved":
      return "text-status-present";
    case "rejected":
      return "text-status-danger";
    default:
      return "text-status-absent";
  }
}
