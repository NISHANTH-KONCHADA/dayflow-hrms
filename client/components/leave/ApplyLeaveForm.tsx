"use client";

import { useState, type FormEvent } from "react";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { applyLeave } from "@/lib/mock";
import type { LeaveType } from "@/lib/types";

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "paid", label: "Paid Time Off" },
  { value: "sick", label: "Sick Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

interface ApplyLeaveFormProps {
  userId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export default function ApplyLeaveForm({ userId, onSubmitted, onCancel }: ApplyLeaveFormProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Choose a start and end date.");
      return;
    }

    setSubmitting(true);
    const result = await applyLeave(userId, {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      {error && <p className="text-sm text-status-danger">{error}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="leaveType" className="text-sm font-medium text-foreground">
          Time Off Type
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Start Date"
          name="startDate"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <TextField
          label="End Date"
          name="endDate"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="remarks" className="text-sm font-medium text-foreground">
          Remarks
        </label>
        <textarea
          id="remarks"
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          rows={3}
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
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Discard
        </Button>
        <Button type="submit" loading={submitting}>
          Submit
        </Button>
      </div>
    </form>
  );
}
