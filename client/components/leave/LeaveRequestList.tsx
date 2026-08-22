import { cn } from "@/lib/cn";
import type { LeaveRequest } from "@/lib/types";

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

interface LeaveRequestListProps {
  requests: LeaveRequest[];
  loading: boolean;
}

export default function LeaveRequestList({ requests, loading }: LeaveRequestListProps) {
  if (loading) {
    return <p className="text-sm text-muted">Loading requests…</p>;
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted">No time off requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Start Date</th>
            <th className="px-4 py-2 font-medium">End Date</th>
            <th className="px-4 py-2 font-medium">Remarks</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-b border-border align-top last:border-0">
              <td className="px-4 py-2 capitalize text-foreground">{request.leaveType}</td>
              <td className="px-4 py-2 text-foreground">{request.startDate}</td>
              <td className="px-4 py-2 text-foreground">{request.endDate}</td>
              <td className="px-4 py-2 text-muted">{request.remarks || "—"}</td>
              <td className="px-4 py-2">
                <span className={cn("font-medium capitalize", statusClassName(request.status))}>
                  {request.status}
                </span>
                {request.reviewerComment && (
                  <p className="mt-0.5 text-xs text-muted">&quot;{request.reviewerComment}&quot;</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
