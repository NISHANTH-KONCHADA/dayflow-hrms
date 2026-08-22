"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllLeaveRequests, getUsers, reviewLeaveRequest } from "@/lib/mock";
import { subscribeMockEvent } from "@/lib/mock/events";
import { cn } from "@/lib/cn";
import type { LeaveRequest, User } from "@/lib/types";

function statusClassName(status: LeaveRequest["status"]): string {
  switch (status) {
    case "approved":
      return "text-status-present";
    case "rejected":
      return "text-status-danger";
    default:
      return "text-status-absent";
  }
}

export default function AdminLeaveQueue() {
  const { user: viewer } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load() {
      Promise.all([getAllLeaveRequests(), getUsers()]).then(([nextRequests, nextUsers]) => {
        if (!cancelled) {
          setRequests(nextRequests);
          setUsers(nextUsers);
          setLoading(false);
        }
      });
    }

    load();
    const unsubscribe = subscribeMockEvent("leave:update", load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  function userName(userId: string): string {
    const user = users.find((candidate) => candidate.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  }

  async function handleDecision(requestId: string, decision: "approved" | "rejected") {
    if (!viewer) return;
    setPendingAction(`${requestId}:${decision}`);
    await reviewLeaveRequest(requestId, decision, comments[requestId] ?? "", viewer.id);
    setPendingAction(null);
  }

  if (loading) return <p className="text-sm text-muted">Loading requests…</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-foreground">Time Off — Approvals</h1>

      {requests.length === 0 ? (
        <p className="text-sm text-muted">No time off requests yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => {
            const isPending = request.status === "pending";
            const isBusy = pendingAction?.startsWith(request.id);

            return (
              <div key={request.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{userName(request.userId)}</p>
                    <p className="text-xs capitalize text-muted">
                      {request.leaveType} leave · {request.startDate}
                      {request.startDate !== request.endDate ? ` to ${request.endDate}` : ""}
                    </p>
                    {request.remarks && <p className="mt-1 text-xs text-muted">&quot;{request.remarks}&quot;</p>}
                    {request.attachmentUrl && (
                      <a
                        href={request.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-primary hover:underline"
                      >
                        View attachment
                      </a>
                    )}
                  </div>
                  <span className={cn("text-xs font-medium capitalize", statusClassName(request.status))}>
                    {request.status}
                  </span>
                </div>

                {isPending ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="Optional comment…"
                      value={comments[request.id] ?? ""}
                      onChange={(event) =>
                        setComments((prev) => ({ ...prev, [request.id]: event.target.value }))
                      }
                      className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecision(request.id, "rejected")}
                        disabled={isBusy}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-status-danger hover:bg-status-danger/10 disabled:opacity-60"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(request.id, "approved")}
                        disabled={isBusy}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ) : (
                  request.reviewerComment && (
                    <p className="mt-2 text-xs text-muted">Reviewer: &quot;{request.reviewerComment}&quot;</p>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
