import type { LeaveBalance } from "@/lib/types";

const LABELS: Record<string, string> = {
  paid: "Paid Time Off",
  sick: "Sick Time Off",
};

export default function LeaveBalanceCards({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) {
    return <p className="text-sm text-muted">No leave balances configured yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {balances.map((balance) => (
        <div key={balance.leaveType} className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm font-medium text-foreground">{LABELS[balance.leaveType] ?? balance.leaveType}</p>
          <p className="text-xs text-muted">{balance.daysAvailable} Days Available</p>
        </div>
      ))}
    </div>
  );
}
