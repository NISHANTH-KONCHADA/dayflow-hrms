"use client";

import { useState } from "react";
import Field from "@/components/ui/Field";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { updateUser } from "@/lib/mock";
import type { EmployeePrivateInfo, User } from "@/lib/types";

interface PrivateInfoTabProps {
  user: User;
  privateInfo: EmployeePrivateInfo | undefined;
  editable: boolean;
  onUpdated: (user: User) => void;
}

export default function PrivateInfoTab({ user, privateInfo, editable, onUpdated }: PrivateInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(user.address);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setAddress(user.address);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!address.trim()) {
      setError("Residing address can't be empty.");
      return;
    }
    setSaving(true);
    const updated = await updateUser(user.id, { address: address.trim() });
    setSaving(false);
    if (updated) {
      onUpdated(updated);
      setIsEditing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Personal Details</h2>
          {editable &&
            (isEditing ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={startEditing}>
                Edit Address
              </Button>
            ))}
        </div>

        {error && <p className="mb-3 text-sm text-status-danger">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date of Birth" value={user.dob} />
          <Field label="Personal Email" value={user.personalEmail} />
          <Field label="Gender" value={user.gender} />
          <Field label="Marital Status" value={user.maritalStatus} />
          <Field label="Nationality" value={user.nationality} />
          {isEditing ? (
            <TextField
              label="Residing Address"
              name="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          ) : (
            <Field label="Residing Address" value={user.address} />
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Identification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Emp Code" value={user.loginId} />
          <Field label="PAN No" value={privateInfo?.panNo} />
          <Field label="UAN No" value={privateInfo?.uanNo} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Bank Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Account Number" value={privateInfo?.bankAccountNo} />
          <Field label="Bank Name" value={privateInfo?.bankName} />
          <Field label="IFSC Code" value={privateInfo?.ifscCode} />
        </div>
      </div>
    </div>
  );
}
