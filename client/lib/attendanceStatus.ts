import type { AttendanceStatus } from "@/lib/types";

export interface StatusMeta {
  label: string;
  dotClassName: string;
  /** Set for statuses that render as an icon instead of a plain dot (e.g. on leave). */
  icon?: string;
}

/**
 * Central place for the attendance status → color/icon mapping, matching
 * the wireframe legend: green dot = present, yellow dot = absent,
 * airplane = on leave.
 */
export function getStatusMeta(status: AttendanceStatus | null): StatusMeta {
  switch (status) {
    case "present":
      return { label: "Present", dotClassName: "bg-status-present" };
    case "absent":
      return { label: "Absent", dotClassName: "bg-status-absent" };
    case "half_day":
      return { label: "Half Day", dotClassName: "bg-sky-500" };
    case "leave":
      return { label: "On Leave", dotClassName: "bg-status-leave", icon: "✈️" };
    default:
      return { label: "Not marked", dotClassName: "bg-gray-300" };
  }
}
