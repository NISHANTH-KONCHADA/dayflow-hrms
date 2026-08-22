"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";

const DEMO_ACCOUNTS = [
  { label: "Admin / HR", identifier: "admin@dayflow.local" },
  { label: "Employee", identifier: "john.doe@dayflow.local" },
  { label: "Employee (forced reset)", identifier: "riya.shah@dayflow.local" },
];

interface FieldErrors {
  identifier?: string;
  password?: string;
}

export default function SignInPage() {
  const { user, loading: sessionLoading, login } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace(user.mustResetPassword ? "/reset-password" : "/dashboard");
    }
  }, [sessionLoading, user, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors: FieldErrors = {};
    if (!identifier.trim()) errors.identifier = "Enter your Login ID or email.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    router.replace(result.user.mustResetPassword ? "/reset-password" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <h1 className="text-lg font-semibold text-foreground">Sign in to Dayflow</h1>
          <p className="text-sm text-muted">Every workday, perfectly aligned.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
        >
          {formError && (
            <p role="alert" className="rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
              {formError}
            </p>
          )}

          <TextField
            label="Login ID or Email"
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            error={fieldErrors.identifier}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />

          <Button type="submit" loading={submitting}>
            Sign In
          </Button>
        </form>

        <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs text-muted">
          <p className="mb-1 font-medium text-foreground">Demo accounts (password: Password@123)</p>
          <ul className="space-y-0.5">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.identifier}>
                {account.label} — {account.identifier}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
