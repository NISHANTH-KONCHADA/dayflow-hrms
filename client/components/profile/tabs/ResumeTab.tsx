"use client";

import { useState } from "react";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { updateUser } from "@/lib/mock";
import type { User } from "@/lib/types";

interface ResumeTabProps {
  user: User;
  editable: boolean;
  onUpdated: (user: User) => void;
}

export default function ResumeTab({ user, editable, onUpdated }: ResumeTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(user.resumeUrl ?? "");
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setResumeUrl(user.resumeUrl ?? "");
    setIsEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const updated = await updateUser(user.id, { resumeUrl: resumeUrl.trim() || undefined });
    setSaving(false);
    if (updated) {
      onUpdated(updated);
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        <TextField
          label="Resume Link"
          name="resumeUrl"
          placeholder="https://…"
          value={resumeUrl}
          onChange={(event) => setResumeUrl(event.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-6">
      {user.resumeUrl ? (
        <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
          View uploaded resume
        </a>
      ) : (
        <p className="text-sm text-muted">No resume uploaded yet.</p>
      )}
      {editable && (
        <Button variant="secondary" onClick={startEditing}>
          {user.resumeUrl ? "Update" : "Add Resume Link"}
        </Button>
      )}
    </div>
  );
}
