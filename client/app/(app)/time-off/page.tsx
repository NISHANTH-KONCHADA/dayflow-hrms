"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getLeaveTypes,
  getPersonalLeaveAllocations,
  getPersonalLeaveRequests,
  createLeaveRequest,
  getAdminLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/lib/api/leave";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { cn } from "@/lib/cn";

export default function TimeOffPage() {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"me" | "queue">("me");

  // Leave data
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaveAllocations, setLeaveAllocations] = useState<any[]>([]);
  const [personalRequests, setPersonalRequests] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);

  // Apply Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Admin Queue state
  const [adminQueue, setAdminQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [reviewComment, setReviewComment] = useState<{ [id: string]: string }>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  async function loadPersonalData() {
    setLoadingPersonal(true);
    try {
      const [types, allocs, reqs] = await Promise.all([
        getLeaveTypes(),
        getPersonalLeaveAllocations(),
        getPersonalLeaveRequests(),
      ]);

      setLeaveTypes(types || []);
      setLeaveAllocations(allocs || []);
      const rList = Array.isArray(reqs) ? reqs : reqs?.leaveRequests || [];
      setPersonalRequests(rList);

      if (types && types.length > 0) {
        setSelectedTypeId(types[0].id);
      }
    } catch (err) {
      console.error("Failed to load time-off data", err);
    } finally {
      setLoadingPersonal(false);
    }
  }

  async function loadAdminQueue() {
    setLoadingQueue(true);
    try {
      const reqs = await getAdminLeaveRequests({ status: "PENDING" });
      const rList = Array.isArray(reqs) ? reqs : reqs?.leaveRequests || [];
      setAdminQueue(rList);
    } catch (err) {
      console.error("Failed to load leave approval queue", err);
    } finally {
      setLoadingQueue(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadPersonalData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "queue" && isAdminOrHr) {
      loadAdminQueue();
    }
  }, [activeTab]);

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    setApplyError(null);

    if (!selectedTypeId || !startDate || !endDate) {
      setApplyError("Please select a leave type, start date, and end date.");
      return;
    }

    setSubmitting(true);
    try {
      await createLeaveRequest({
        leaveTypeId: selectedTypeId,
        startDate,
        endDate,
        reason: reason || undefined,
      });

      setShowApplyModal(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      await loadPersonalData();
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    setReviewingId(id);
    try {
      await approveLeaveRequest(id, reviewComment[id]);
      await loadAdminQueue();
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setReviewingId(null);
    }
  }

  async function handleReject(id: string) {
    setReviewingId(id);
    try {
      await rejectLeaveRequest(id, reviewComment[id]);
      await loadAdminQueue();
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Time Off &amp; Leave Management</h1>
          <p className="text-sm text-muted">View balances, apply for leaves, and manage approvals.</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdminOrHr && (
            <div className="flex rounded-md border border-border bg-surface p-1">
              <button
                onClick={() => setActiveTab("me")}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "me" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
                )}
              >
                My Leaves
              </button>
              <button
                onClick={() => setActiveTab("queue")}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "queue" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
                )}
              >
                Approval Queue
              </button>
            </div>
          )}

          <Button onClick={() => setShowApplyModal(true)}>+ Apply for Leave</Button>
        </div>
      </div>

      {activeTab === "me" ? (
        <>
          {/* Leave Balances Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {leaveAllocations.length === 0 ? (
              <div className="col-span-3 rounded-lg border border-border bg-surface p-4 text-center text-sm text-muted">
                No leave allocations configured for this year.
              </div>
            ) : (
              leaveAllocations.map((alloc) => {
                const available = alloc.allocatedDays - alloc.usedDays;
                return (
                  <div key={alloc.id || alloc.leaveTypeId} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {alloc.leaveType?.name || "Leave Type"}
                      </p>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {available} days available
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-foreground">{available}</span>
                      <span className="text-xs text-muted">
                        {alloc.usedDays} used / {alloc.allocatedDays} total
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/20">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (alloc.usedDays / (alloc.allocatedDays || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Personal Leave Requests Table */}
          <div className="rounded-lg border border-border bg-surface shadow-sm">
            <div className="border-b border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">My Leave Request History</h3>
            </div>
            {loadingPersonal ? (
              <div className="p-6 text-center text-sm text-muted">Loading leave requests...</div>
            ) : personalRequests.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">You have not submitted any leave requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead className="border-b border-border bg-muted/20 text-xs font-semibold text-muted">
                    <tr>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">End Date</th>
                      <th className="p-3">Requested Days</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Reviewer Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {personalRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/10">
                        <td className="p-3 font-medium">{req.leaveType?.name || req.leaveType || "Leave"}</td>
                        <td className="p-3">{new Date(req.startDate).toLocaleDateString()}</td>
                        <td className="p-3">{new Date(req.endDate).toLocaleDateString()}</td>
                        <td className="p-3 font-medium">{req.requestedDays || req.days || "—"}</td>
                        <td className="p-3 text-xs text-muted max-w-xs truncate">{req.reason || "—"}</td>
                        <td className="p-3">
                          <span className={cn("text-xs font-medium capitalize px-2.5 py-0.5 rounded", getStatusBadge(req.status))}>
                            {req.status?.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted italic max-w-xs truncate">
                          {req.reviewerComment || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Admin Leave Approval Queue */
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Pending Leave Approval Queue</h3>
          </div>

          {loadingQueue ? (
            <div className="p-6 text-center text-sm text-muted">Loading pending queue...</div>
          ) : adminQueue.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">🎉 No pending leave requests to review!</div>
          ) : (
            <div className="divide-y divide-border">
              {adminQueue.map((req) => {
                const empName = req.employee
                  ? `${req.employee.firstName} ${req.employee.lastName || ""}`
                  : req.user
                  ? `${req.user.firstName} ${req.user.lastName || ""}`
                  : "Employee";

                return (
                  <div key={req.id} className="p-4 flex flex-col gap-3 md:flex-row md:items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{empName}</span>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {req.leaveType?.name || "Leave"}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Dates: <span className="font-medium text-foreground">{new Date(req.startDate).toLocaleDateString()}</span> to{" "}
                        <span className="font-medium text-foreground">{new Date(req.endDate).toLocaleDateString()}</span> ({req.requestedDays} days)
                      </p>
                      {req.reason && <p className="text-xs text-muted italic">Reason: &quot;{req.reason}&quot;</p>}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add review comment..."
                        value={reviewComment[req.id] || ""}
                        onChange={(e) => setReviewComment({ ...reviewComment, [req.id]: e.target.value })}
                        className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req.id)}
                        loading={reviewingId === req.id}
                        className="bg-status-present text-white hover:bg-status-present/90"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReject(req.id)}
                        loading={reviewingId === req.id}
                        className="text-status-danger border-status-danger/30 hover:bg-status-danger/10"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Apply for Leave</h2>
            <p className="text-xs text-muted mb-4">Submit a formal time-off request for review.</p>

            <form onSubmit={handleApplyLeave} className="flex flex-col gap-4">
              {applyError && (
                <p className="rounded bg-status-danger/10 p-2 text-xs text-status-danger">{applyError}</p>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Leave Type</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Reason for Leave</label>
                <textarea
                  rows={3}
                  placeholder="Explain brief context for request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-md border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadge(status?: string): string {
  const s = status?.toUpperCase();
  switch (s) {
    case "APPROVED":
      return "bg-status-present/10 text-status-present font-semibold";
    case "REJECTED":
      return "bg-status-danger/10 text-status-danger font-semibold";
    case "PENDING":
      return "bg-amber-500/10 text-amber-600 font-semibold";
    default:
      return "bg-muted/20 text-muted";
  }
}
