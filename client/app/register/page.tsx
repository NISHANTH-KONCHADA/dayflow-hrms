"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { registerOrganization } from "@/lib/api/auth";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!companyName || !firstName || !email || !password) {
      setFormError("Company Name, First Name, Work Email, and Password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await registerOrganization({
        companyName,
        firstName,
        lastName,
        email,
        phone,
        password,
      });

      await refreshUser();
      router.replace("/dashboard");
    } catch (err: any) {
      setFormError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <h1 className="text-xl font-bold text-foreground">Register New Organization</h1>
          <p className="text-sm text-muted">Set up your company and Super Admin / HR account.</p>
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
            label="Company / Organization Name"
            name="companyName"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Admin First Name"
              name="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
            <TextField
              label="Admin Last Name"
              name="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>

          <TextField
            label="Work Email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <TextField
            label="Phone Number"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Button type="submit" loading={submitting}>
            Register &amp; Create Workspace
          </Button>

          <p className="text-center text-xs text-muted mt-2">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
