"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { checkIn, checkOut, getAttendanceForUser, MOCK_TODAY } from "@/lib/mock";
import { cn } from "@/lib/cn";
import type { AttendanceRecord } from "@/lib/types";

export default function CheckInOutWidget() {
  const { user } = useAuth();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getAttendanceForUser(user.id).then((records) => {
      if (!cancelled) {
        setRecord(records.find((candidate) => candidate.date === MOCK_TODAY) ?? null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || loading) return null;

  const isCheckedIn = Boolean(record?.checkInTime) && !record?.checkOutTime;
  const isCheckedOut = Boolean(record?.checkOutTime);

  async function handleClick() {
    if (!user) return;
    setPending(true);
    const updated = isCheckedIn ? await checkOut(user.id) : await checkIn(user.id);
    setPending(false);
    setRecord(updated ?? null);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
      <span
        title={isCheckedOut ? "Checked out" : isCheckedIn ? "Checked in" : "Not checked in"}
        className={cn("h-2.5 w-2.5 rounded-full", isCheckedIn || isCheckedOut ? "bg-status-present" : "bg-status-danger")}
      />
      {isCheckedOut ? (
        <span className="pr-1 text-xs text-muted">Checked out · {record?.checkOutTime}</span>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className="rounded-full px-1 text-xs font-medium text-primary hover:underline disabled:opacity-60"
        >
          {pending ? "…" : isCheckedIn ? "Check Out" : "Check In"}
        </button>
      )}
    </div>
  );
}
