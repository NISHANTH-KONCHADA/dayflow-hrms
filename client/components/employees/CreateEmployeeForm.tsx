"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { createEmployee, getUsers, MOCK_TODAY } from "@/lib/mock";
import type { Role, User } from "@/lib/types";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  jobPosition?: string;
}

interface CreatedAccount {
  userId: string;
  name: string;
  loginId: string;
  tempPassword: string;
}

export default function CreateEmployeeForm() {
  const [managers, setManagers] = useState<User[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [department, setDepartment] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [managerId, setManagerId] = useState("");
  const [company, setCompany] = useState("Dayflow Technologies");
  const [location, setLocation] = useState("Bengaluru");
  const [dateOfJoining, setDateOfJoining] = useState(MOCK_TODAY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  useEffect(() => {
    getUsers().then(setManagers);
  }, [created]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("employee");
    setDepartment("");
    setJobPosition("");
    setManagerId("");
    setDateOfJoining(MOCK_TODAY);
    setErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: FieldErrors = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!email.trim() || !email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (!department.trim()) nextErrors.department = "Department is required.";
    if (!jobPosition.trim()) nextErrors.jobPosition = "Job position is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await createEmployee({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
      department: department.trim(),
      jobPosition: jobPosition.trim(),
      managerId: managerId || null,
      company: company.trim(),
      location: location.trim(),
      dateOfJoining,
    });
    setSubmitting(false);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    setCreated({
      userId: result.user.id,
      name: `${result.user.firstName} ${result.user.lastName}`,
      loginId: result.user.loginId,
      tempPassword: result.tempPassword,
    });
    resetForm();
  }

  if (created) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-foreground">Account created for {created.name}</h2>
        <p className="text-sm text-muted">
          Share these credentials with the employee — they&apos;ll be asked to set a new password on
          first sign-in.
        </p>
        <div className="rounded-md border border-dashed border-border bg-background p-4 text-sm">
          <p>
            <span className="text-muted">Login ID:</span>{" "}
            <span className="font-mono text-foreground">{created.loginId}</span>
          </p>
          <p className="mt-1">
            <span className="text-muted">Temporary Password:</span>{" "}
            <span className="font-mono text-foreground">{created.tempPassword}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCreated(null)}>
            Add Another
          </Button>
          <Link href={`/employees/${created.userId}`}>
            <Button type="button">View Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
    >
      {formError && <p className="text-sm text-status-danger">{formError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="First Name"
          name="firstName"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          error={errors.firstName}
        />
        <TextField
          label="Last Name"
          name="lastName"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          error={errors.lastName}
        />
      </div>

      <TextField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin / HR</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="manager" className="text-sm font-medium text-foreground">
            Manager
          </label>
          <select
            id="manager"
            value={managerId}
            onChange={(event) => setManagerId(event.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">No manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.firstName} {manager.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Department"
          name="department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          error={errors.department}
        />
        <TextField
          label="Job Position"
          name="jobPosition"
          value={jobPosition}
          onChange={(event) => setJobPosition(event.target.value)}
          error={errors.jobPosition}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          label="Company"
          name="company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
        <TextField
          label="Location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <TextField
          label="Date of Joining"
          name="dateOfJoining"
          type="date"
          value={dateOfJoining}
          onChange={(event) => setDateOfJoining(event.target.value)}
        />
      </div>

      <Button type="submit" loading={submitting}>
        Create Employee
      </Button>
    </form>
  );
}
