"use client";

import { useMemo, useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { applyLeave } from "@/lib/mock";
import type { LeaveType, User } from "@/lib/types";

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "paid", label: "Paid Time Off" },
  { value: "sick", label: "Sick Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

interface ApplyLeaveModalProps {
  user: User;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ApplyLeaveModal({ user, onClose, onSubmitted }: ApplyLeaveModalProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allocationDays = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    const diff = Math.round(
      (new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86_400_000,
    );
    return diff + 1;
  }, [startDate, endDate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Choose a start and end date.");
      return;
    }

    setSubmitting(true);
    const result = await applyLeave(user.id, {
      leaveType,
      startDate,
      endDate,
      remarks: remarks.trim(),
      attachmentUrl: leaveType === "sick" ? attachmentUrl.trim() || null : null,
    });
    setSubmitting(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    onSubmitted();
  }

  return (
    <Modal title="Time off Type Request" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {error && <p className="text-sm text-status-danger">{error}</p>}

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Employee</span>
          <p className="text-sm text-muted">
            {user.firstName} {user.lastName}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="leaveType" className="text-sm font-medium text-foreground">
            Time off Type
          </label>
          <select
            id="leaveType"
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value as LeaveType)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            {LEAVE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Validity Period</span>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="From"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <TextField
              label="To"
              name="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
          <span className="text-muted">Allocation</span>
          <span className="font-medium text-foreground">
            {allocationDays !== null ? `${allocationDays.toFixed(2)} Days` : "—"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="remarks" className="text-sm font-medium text-foreground">
            Remarks
          </label>
          <textarea
            id="remarks"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={2}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        {leaveType === "sick" && (
          <TextField
            label="Attachment (sick leave certificate link)"
            name="attachmentUrl"
            placeholder="https://…"
            value={attachmentUrl}
            onChange={(event) => setAttachmentUrl(event.target.value)}
          />
        )}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Discard
          </Button>
          <Button type="submit" loading={submitting}>
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
