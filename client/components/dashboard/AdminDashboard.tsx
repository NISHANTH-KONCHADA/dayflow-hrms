"use client";

import { useEffect, useState } from "react";
import EmployeeCard from "@/components/dashboard/EmployeeCard";
import { getEmployees, createEmployee, getDepartments, getJobPositions } from "@/lib/api/employee";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import type { AttendanceStatus, User } from "@/lib/types";

interface EmployeeWithStatus {
  user: User;
  status: AttendanceStatus | null;
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [jobPositions, setJobPositions] = useState<any[]>([]);

  // Add Employee Form State
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newPosId, setNewPosId] = useState("");
  const [newWage, setNewWage] = useState("50000");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);

  async function loadEmployees() {
    setLoading(true);
    try {
      const data = await getEmployees({ search: search || undefined });
      const rawList = data.employees || [];

      const mapped: EmployeeWithStatus[] = rawList.map((emp: any) => {
        const u: User = {
          id: emp.id,
          employeeId: emp.id,
          loginId: emp.loginId || "",
          employeeCode: emp.employeeCode || "",
          email: emp.user?.email || emp.personalEmail || "",
          role: emp.user?.role === "ADMIN" || emp.user?.role === "HR_OFFICER" ? "admin" : "employee",
          rawRole: emp.user?.role || "EMPLOYEE",
          mustResetPassword: false,
          firstName: emp.firstName,
          lastName: emp.lastName || "",
          phone: emp.phone || "",
          personalEmail: emp.personalEmail || "",
          dob: emp.dateOfBirth || "",
          gender: emp.gender || "",
          maritalStatus: emp.maritalStatus || "",
          nationality: emp.nationality || "",
          address: emp.address || "",
          department: emp.department?.name || "Unassigned",
          departmentId: emp.departmentId,
          jobPosition: emp.jobPosition?.name || "Employee",
          jobPositionId: emp.jobPositionId,
          managerId: emp.managerId,
          managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null,
          company: "Dayflow Technologies",
          location: "India",
          dateOfJoining: emp.dateOfJoining || "",
          profilePictureUrl: emp.profilePictureUrl || null,
          about: emp.about || "",
          interests: emp.interestsHobbies || "",
        };

        const statusStr = emp.status?.toLowerCase();
        let attStatus: AttendanceStatus = "absent";
        if (statusStr === "present") attStatus = "present";
        else if (statusStr === "leave") attStatus = "leave";

        return {
          user: u,
          status: attStatus,
        };
      });

      setEmployees(mapped);
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [search]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [depts, pos] = await Promise.all([getDepartments(), getJobPositions()]);
        setDepartments(depts || []);
        setJobPositions(pos || []);
      } catch (e) {
        console.error("Failed to load departments/positions", e);
      }
    }
    loadMetadata();
  }, []);

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!newFirstName || !newEmail) {
      setAddError("First Name and Work/Personal Email are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createEmployee({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        personalEmail: newEmail,
        departmentId: newDeptId || undefined,
        jobPositionId: newPosId || undefined,
        monthlyWage: Number(newWage) || 50000,
      });

      setCreatedCredentials(res.initialCredentials);
      loadEmployees();
    } catch (err: any) {
      setAddError(err.message || "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }

  const presentCount = employees.filter((e) => e.status === "present").length;
  const leaveCount = employees.filter((e) => e.status === "leave").length;
  const absentCount = employees.filter((e) => e.status === "absent").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Employee Directory</h1>
          <p className="text-sm text-muted">
            {loading
              ? "Updating live status…"
              : `${employees.length} total · ${presentCount} present · ${leaveCount} on leave · ${absentCount} absent today`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={() => { setShowAddModal(true); setCreatedCredentials(null); }}>
            + Add Employee
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted">
          Loading employees from backend...
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted">
          No employees found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {employees.map(({ user, status }) => (
            <EmployeeCard key={user.employeeId || user.id} user={user} status={status} />
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Add New Employee</h2>
            <p className="text-xs text-muted mb-4">Auto-provisions login credentials, leave allocations, &amp; payroll.</p>

            {createdCredentials ? (
              <div className="flex flex-col gap-3 rounded-md bg-status-present/10 p-4 text-sm text-foreground">
                <p className="font-semibold text-status-present">🎉 Employee created successfully!</p>
                <div className="space-y-1 text-xs font-mono bg-surface p-3 rounded border border-border">
                  <p><strong>Login ID:</strong> {createdCredentials.loginId}</p>
                  <p><strong>Email:</strong> {createdCredentials.email}</p>
                  <p><strong>Temp Password:</strong> {createdCredentials.temporaryPassword}</p>
                </div>
                <Button className="mt-2" onClick={() => { setShowAddModal(false); setCreatedCredentials(null); }}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateEmployee} className="flex flex-col gap-3">
                {addError && (
                  <p className="rounded bg-status-danger/10 p-2 text-xs text-status-danger">{addError}</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="First Name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                  />
                  <TextField
                    label="Last Name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                </div>

                <TextField
                  label="Work Email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-foreground">Department</label>
                    <select
                      value={newDeptId}
                      onChange={(e) => setNewDeptId(e.target.value)}
                      className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
                    >
                      <option value="">Select Dept</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-foreground">Job Position</label>
                    <select
                      value={newPosId}
                      onChange={(e) => setNewPosId(e.target.value)}
                      className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
                    >
                      <option value="">Select Position</option>
                      {jobPositions.map((jp) => (
                        <option key={jp.id} value={jp.id}>{jp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <TextField
                  label="Monthly Wage (₹)"
                  type="number"
                  value={newWage}
                  onChange={(e) => setNewWage(e.target.value)}
                />

                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Create Employee
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
