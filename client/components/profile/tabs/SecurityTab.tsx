"use client";

import { useState, type FormEvent } from "react";
import Field from "@/components/ui/Field";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { changePassword } from "@/lib/mock/auth";
import { validatePassword } from "@/lib/validation";
import type { User } from "@/lib/types";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function SecurityTab({ user }: { user: User }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccess(false);

    const nextErrors: FieldErrors = {};
    if (!currentPassword) nextErrors.currentPassword = "Enter your current password.";
    const strength = validatePassword(newPassword);
    if (!strength.valid) nextErrors.newPassword = strength.message;
    if (confirmPassword !== newPassword) nextErrors.confirmPassword = "Passwords don't match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await changePassword(user.id, currentPassword, newPassword);
    setSubmitting(false);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      <Field label="Login ID" value={user.loginId} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 border-t border-border pt-4">
        <h2 className="text-sm font-semibold text-foreground">Change Password</h2>

        {formError && <p className="text-sm text-status-danger">{formError}</p>}
        {success && <p className="text-sm text-status-present">Password updated.</p>}

        <TextField
          label="Current Password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={errors.currentPassword}
        />
        <TextField
          label="New Password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={errors.newPassword}
        />
        <TextField
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />

        <div>
          <Button type="submit" loading={submitting}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
