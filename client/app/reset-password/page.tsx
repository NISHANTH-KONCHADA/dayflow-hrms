"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { changePassword } from "@/lib/api/auth";
import { validatePassword } from "@/lib/validation";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const { user, loading: sessionLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      router.replace("/sign-in");
    } else if (!user.mustResetPassword) {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  if (sessionLoading || !user || !user.mustResetPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading…</div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!user) return;

    const passwordCheck = validatePassword(newPassword);
    const nextErrors: FieldErrors = {};
    if (!currentPassword) nextErrors.currentPassword = "Enter your current password.";
    if (!passwordCheck.valid) nextErrors.newPassword = passwordCheck.message;
    if (confirmPassword !== newPassword) nextErrors.confirmPassword = "Passwords don't match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      await refreshUser();
      router.replace("/dashboard");
    } catch (err: any) {
      setFormError(err.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <h1 className="text-lg font-semibold text-foreground">Set a new password</h1>
          <p className="text-sm text-muted">This is your first sign-in — choose a password only you know.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          {formError && (
            <p role="alert" className="rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
              {formError}
            </p>
          )}

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
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
          />
          <Button type="submit" loading={submitting}>
            Set Password &amp; Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
