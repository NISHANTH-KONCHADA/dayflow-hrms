"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";

const DEMO_ACCOUNTS = [
  { label: "Super Admin", identifier: "admin@dayflow.com", pass: "Admin@123456" },
  { label: "Employee (John Doe)", identifier: "john.doe@dayflow.com", pass: "Password@123" },
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

  function handleQuickFill(acc: typeof DEMO_ACCOUNTS[0]) {
    setIdentifier(acc.identifier);
    setPassword(acc.pass);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
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
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-sm"
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
          <p className="mb-2 font-medium text-foreground">Quick test login:</p>
          <div className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.identifier}
                type="button"
                onClick={() => handleQuickFill(account)}
                className="flex items-center justify-between rounded px-2 py-1 text-left text-xs bg-muted/20 hover:bg-muted/40 text-foreground transition-colors"
              >
                <span>{account.label}</span>
                <span className="text-[10px] text-muted">{account.identifier}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
