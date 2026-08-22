import { cn } from "@/lib/cn";
import { getStatusMeta } from "@/lib/attendanceStatus";
import type { AttendanceStatus } from "@/lib/types";

export default function StatusDot({ status }: { status: AttendanceStatus | null }) {
  const meta = getStatusMeta(status);

  return (
    <span
      title={meta.label}
      className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-surface shadow-sm"
    >
      {meta.icon ? (
        <span className="text-[10px] leading-none">{meta.icon}</span>
      ) : (
        <span className={cn("h-2.5 w-2.5 rounded-full", meta.dotClassName)} />
      )}
    </span>
  );
}
