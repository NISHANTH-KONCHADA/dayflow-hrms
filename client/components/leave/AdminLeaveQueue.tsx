"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllLeaveRequests, getUsers, reviewLeaveRequest } from "@/lib/mock";
import { subscribeMockEvent } from "@/lib/mock/events";
import TextField from "@/components/ui/TextField";
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
  const [search, setSearch] = useState("");
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

  const filteredRequests = requests.filter((request) =>
    userName(request.userId).toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (loading) return <p className="text-sm text-muted">Loading requests…</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-foreground">Time Off — Approvals</h1>

      <TextField
        label="Search Employees"
        name="search"
        placeholder="Search by name…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        {filteredRequests.length === 0 ? (
          <p className="p-4 text-sm text-muted">No time off requests match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Start Date</th>
                <th className="px-4 py-2 font-medium">End Date</th>
                <th className="px-4 py-2 font-medium">Time Off Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => {
                const isPending = request.status === "pending";
                const isBusy = pendingAction?.startsWith(request.id);

                return (
                  <tr key={request.id} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-2 text-foreground">{userName(request.userId)}</td>
                    <td className="px-4 py-2 text-foreground">{request.startDate}</td>
                    <td className="px-4 py-2 text-foreground">{request.endDate}</td>
                    <td className="px-4 py-2">
                      <span className="capitalize text-foreground">{request.leaveType}</span>
                      {request.remarks && <p className="mt-0.5 text-xs text-muted">&quot;{request.remarks}&quot;</p>}
                      {request.attachmentUrl && (
                        <a
                          href={request.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block text-xs text-primary hover:underline"
                        >
                          View attachment
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isPending ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Optional comment…"
                            value={comments[request.id] ?? ""}
                            onChange={(event) =>
                              setComments((prev) => ({ ...prev, [request.id]: event.target.value }))
                            }
                            className="w-full max-w-[180px] rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecision(request.id, "rejected")}
                              disabled={isBusy}
                              className="rounded-md border border-border px-2 py-1 text-xs font-medium text-status-danger hover:bg-status-danger/10 disabled:opacity-60"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(request.id, "approved")}
                              disabled={isBusy}
                              className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className={cn("text-xs font-medium capitalize", statusClassName(request.status))}>
                            {request.status}
                          </span>
                          {request.reviewerComment && (
                            <p className="mt-0.5 text-xs text-muted">&quot;{request.reviewerComment}&quot;</p>
                          )}
                        </div>
                      )}
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
