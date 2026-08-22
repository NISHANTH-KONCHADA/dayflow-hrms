"use client";

import { useState } from "react";
import Field from "@/components/ui/Field";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { updateUser } from "@/lib/mock";
import type { User } from "@/lib/types";

interface MyProfileTabProps {
  user: User;
  editable: boolean;
  onUpdated: (user: User) => void;
}

export default function MyProfileTab({ user, editable, onUpdated }: MyProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(user.phone);
  const [profilePictureUrl, setProfilePictureUrl] = useState(user.profilePictureUrl ?? "");
  const [about, setAbout] = useState(user.about);
  const [whatILoveAboutMyJob, setWhatILoveAboutMyJob] = useState(user.whatILoveAboutMyJob);
  const [interests, setInterests] = useState(user.interests);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setPhone(user.phone);
    setProfilePictureUrl(user.profilePictureUrl ?? "");
    setAbout(user.about);
    setWhatILoveAboutMyJob(user.whatILoveAboutMyJob);
    setInterests(user.interests);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!phone.trim()) {
      setError("Mobile number can't be empty.");
      return;
    }
    setSaving(true);
    const updated = await updateUser(user.id, {
      phone: phone.trim(),
      profilePictureUrl: profilePictureUrl.trim() || null,
      about: about.trim(),
      whatILoveAboutMyJob: whatILoveAboutMyJob.trim(),
      interests: interests.trim(),
    });
    setSaving(false);
    if (updated) {
      onUpdated(updated);
      setIsEditing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      {editable && (
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Save
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={startEditing}>
              Edit
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name" value={`${user.firstName} ${user.lastName}`} />
        {isEditing ? (
          <TextField label="Mobile" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        ) : (
          <Field label="Mobile" value={user.phone} />
        )}
        <Field label="Email" value={user.email} />
        <Field label="Department" value={user.department} />
        <Field label="Job Position" value={user.jobPosition} />
        <Field label="Manager" value={user.managerName} />
        <Field label="Company" value={user.company} />
        <Field label="Location" value={user.location} />
        <Field label="Since" value={user.dateOfJoining} />
      </div>

      {isEditing && (
        <TextField
          label="Profile Picture URL"
          name="profilePictureUrl"
          placeholder="https://…"
          value={profilePictureUrl}
          onChange={(event) => setProfilePictureUrl(event.target.value)}
        />
      )}

      <NarrativeField
        label="About"
        value={about}
        displayValue={user.about}
        isEditing={isEditing}
        rows={3}
        onChange={setAbout}
      />

      <NarrativeField
        label="What I Love About My Job"
        value={whatILoveAboutMyJob}
        displayValue={user.whatILoveAboutMyJob}
        isEditing={isEditing}
        rows={2}
        onChange={setWhatILoveAboutMyJob}
      />

      <NarrativeField
        label="Interests & Hobbies"
        value={interests}
        displayValue={user.interests}
        isEditing={isEditing}
        rows={2}
        onChange={setInterests}
      />
    </div>
  );
}

interface NarrativeFieldProps {
  label: string;
  value: string;
  displayValue: string;
  isEditing: boolean;
  rows: number;
  onChange: (value: string) => void;
}

function NarrativeField({ label, value, displayValue, isEditing, rows, onChange }: NarrativeFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      {isEditing ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      ) : (
        <p className="text-sm text-foreground">{displayValue || "—"}</p>
      )}
    </div>
  );
}
