"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEmployeeById, updateEmployee, getDepartments, getJobPositions } from "@/lib/api/employee";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { cn } from "@/lib/cn";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser, refreshUser } = useAuth();

  const [employee, setEmployee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "private" | "schedule" | "salary">("profile");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editPersonalEmail, setEditPersonalEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [editHobbies, setEditHobbies] = useState("");
  // Admin editable fields
  const [editDeptId, setEditDeptId] = useState("");
  const [editPosId, setEditPosId] = useState("");
  const [editWage, setEditWage] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editUan, setEditUan] = useState("");
  const [editBankAcc, setEditBankAcc] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editIfsc, setEditIfsc] = useState("");

  const [departments, setDepartments] = useState<any[]>([]);
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isSelf = currentUser?.employeeId === id || currentUser?.id === employee?.user?.id;
  const isAdminOrHr = currentUser?.role === "admin";

  async function loadEmployee() {
    setLoading(true);
    try {
      const data = await getEmployeeById(id);
      setEmployee(data);

      setEditPhone(data.phone || "");
      setEditPersonalEmail(data.personalEmail || "");
      setEditAddress(data.address || "");
      setEditAbout(data.about || "");
      setEditHobbies(data.interestsHobbies || "");
      setEditDeptId(data.departmentId || "");
      setEditPosId(data.jobPositionId || "");
      setEditWage(data.salaryStructure?.monthlyWage || "50000");
      setEditPan(data.panNumber || "");
      setEditUan(data.uanNumber || "");
      setEditBankAcc(data.bankDetails?.accountNumber || "");
      setEditBankName(data.bankDetails?.bankName || "");
      setEditIfsc(data.bankDetails?.ifscCode || "");
    } catch (err) {
      console.error("Failed to load employee details", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployee();
  }, [id]);

  useEffect(() => {
    if (isAdminOrHr) {
      Promise.all([getDepartments(), getJobPositions()]).then(([depts, pos]) => {
        setDepartments(depts || []);
        setJobPositions(pos || []);
      });
    }
  }, [isAdminOrHr]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setSaving(true);
    try {
      const payload: any = {
        phone: editPhone,
        personalEmail: editPersonalEmail,
        address: editAddress,
        about: editAbout,
        interestsHobbies: editHobbies,
      };

      if (isAdminOrHr) {
        payload.departmentId = editDeptId || undefined;
        payload.jobPositionId = editPosId || undefined;
        if (editWage) payload.monthlyWage = Number(editWage);
        payload.panNumber = editPan;
        payload.uanNumber = editUan;
        payload.accountNumber = editBankAcc;
        payload.bankName = editBankName;
        payload.ifscCode = editIfsc;
      }

      await updateEmployee(id, payload);
      setShowEditModal(false);
      await loadEmployee();
      if (isSelf) {
        refreshUser();
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update employee details");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-sm text-muted">
        Loading employee profile...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-muted">
        Employee profile not found.
      </div>
    );
  }

  const sal = employee.salaryStructure;
  const sched = employee.workingSchedule;
  const bank = employee.bankDetails;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Profile Card */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            firstName={employee.firstName}
            lastName={employee.lastName}
            profilePictureUrl={employee.profilePictureUrl}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {employee.firstName} {employee.lastName}
              </h1>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {employee.user?.role || "EMPLOYEE"}
              </span>
            </div>
            <p className="text-sm font-medium text-muted">
              {employee.jobPosition?.name || "Employee"} · {employee.department?.name || "General"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span>Code: <strong>{employee.employeeCode}</strong></span>
              <span>Login ID: <strong>{employee.loginId}</strong></span>
              {employee.manager && (
                <span>Manager: <strong>{employee.manager.firstName} {employee.manager.lastName}</strong></span>
              )}
            </div>
          </div>
        </div>

        {(isSelf || isAdminOrHr) && (
          <Button variant="secondary" onClick={() => setShowEditModal(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "pb-3 pt-1 border-b-2 transition-colors",
            activeTab === "profile" ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Overview &amp; Bio
        </button>
        <button
          onClick={() => setActiveTab("private")}
          className={cn(
            "pb-3 pt-1 border-b-2 transition-colors",
            activeTab === "private" ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Private &amp; Bank Info
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={cn(
            "pb-3 pt-1 border-b-2 transition-colors",
            activeTab === "schedule" ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Working Schedule
        </button>
        <button
          onClick={() => setActiveTab("salary")}
          className={cn(
            "pb-3 pt-1 border-b-2 transition-colors",
            activeTab === "salary" ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Salary &amp; Pay Structure
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Contact &amp; Work Info</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted">Work Email</p>
                <p className="font-medium text-foreground">{employee.user?.email || "—"}</p>
              </div>
              <div>
                <p className="text-muted">Personal Email</p>
                <p className="font-medium text-foreground">{employee.personalEmail || "—"}</p>
              </div>
              <div>
                <p className="text-muted">Phone Number</p>
                <p className="font-medium text-foreground">{employee.phone || "—"}</p>
              </div>
              <div>
                <p className="text-muted">Date of Joining</p>
                <p className="font-medium text-foreground">
                  {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted">Date of Birth</p>
                <p className="font-medium text-foreground">
                  {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted">Gender / Marital</p>
                <p className="font-medium text-foreground">
                  {employee.gender || "—"} / {employee.maritalStatus || "Single"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">About &amp; Interests</h3>
            <div>
              <p className="text-xs text-muted">About Bio</p>
              <p className="mt-1 text-xs text-foreground leading-relaxed">
                {employee.about || "No bio provided yet."}
              </p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted">Hobbies &amp; Interests</p>
              <p className="mt-1 text-xs text-foreground">
                {employee.interestsHobbies || "None listed."}
              </p>
            </div>
            {employee.address && (
              <div className="pt-2">
                <p className="text-xs text-muted">Residential Address</p>
                <p className="mt-1 text-xs text-foreground">{employee.address}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "private" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Government IDs</h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-muted">PAN Number</p>
                <p className="font-mono font-medium text-foreground">{employee.panNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted">UAN Number (PF)</p>
                <p className="font-mono font-medium text-foreground">{employee.uanNumber || "—"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Bank Details</h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-muted">Bank Name</p>
                <p className="font-medium text-foreground">{bank?.bankName || "—"}</p>
              </div>
              <div>
                <p className="text-muted">Account Number</p>
                <p className="font-mono font-medium text-foreground">{bank?.accountNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted">IFSC Code</p>
                <p className="font-mono font-medium text-foreground">{bank?.ifscCode || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-4 max-w-lg">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Official Working Schedule</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted">Schedule Name</p>
              <p className="font-medium text-foreground">{sched?.name || "Standard Schedule"}</p>
            </div>
            <div>
              <p className="text-muted">Working Days / Week</p>
              <p className="font-medium text-foreground">{sched?.workingDays || 5} Days</p>
            </div>
            <div>
              <p className="text-muted">Working Hours</p>
              <p className="font-medium text-foreground">
                {sched?.startTime || "09:00"} - {sched?.endTime || "18:00"}
              </p>
            </div>
            <div>
              <p className="text-muted">Break Duration</p>
              <p className="font-medium text-foreground">{sched?.breakMinutes || 60} mins</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "salary" && (
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground">Compensation Breakdown</h3>
            <span className="text-lg font-bold text-foreground">
              ₹{sal?.monthlyWage ? Number(sal.monthlyWage).toLocaleString() : "0"} / month
            </span>
          </div>

          {!sal ? (
            <p className="text-xs text-muted">No salary structure configured for this employee.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted bg-muted/20 p-2 rounded">
                <span>Component Name</span>
                <span className="text-right">Monthly Value (₹)</span>
              </div>
              <div className="divide-y divide-border text-xs">
                {sal.components?.map((c: any) => (
                  <div key={c.id || c.code} className="flex items-center justify-between py-2">
                    <span className="text-foreground">{c.name}</span>
                    <span className="font-mono font-medium text-foreground">
                      ₹{c.fixedAmount ? Number(c.fixedAmount).toLocaleString() : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Edit Employee Profile</h2>
            <p className="text-xs text-muted mb-4">Update contact and personal info.</p>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              {editError && (
                <p className="rounded bg-status-danger/10 p-2 text-xs text-status-danger">{editError}</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <TextField label="Phone Number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                <TextField label="Personal Email" value={editPersonalEmail} onChange={(e) => setEditPersonalEmail(e.target.value)} />
              </div>

              <TextField label="Residential Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              <TextField label="About Bio" value={editAbout} onChange={(e) => setEditAbout(e.target.value)} />
              <TextField label="Interests & Hobbies" value={editHobbies} onChange={(e) => setEditHobbies(e.target.value)} />

              {isAdminOrHr && (
                <>
                  <hr className="border-border my-2" />
                  <p className="text-xs font-bold text-primary uppercase">Admin Controls</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-foreground">Department</label>
                      <select
                        value={editDeptId}
                        onChange={(e) => setEditDeptId(e.target.value)}
                        className="h-10 rounded-md border border-border bg-surface px-3 text-xs text-foreground"
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
                        value={editPosId}
                        onChange={(e) => setEditPosId(e.target.value)}
                        className="h-10 rounded-md border border-border bg-surface px-3 text-xs text-foreground"
                      >
                        <option value="">Select Position</option>
                        {jobPositions.map((jp) => (
                          <option key={jp.id} value={jp.id}>{jp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <TextField label="Monthly Wage (₹)" type="number" value={editWage} onChange={(e) => setEditWage(e.target.value)} />

                  <div className="grid grid-cols-2 gap-2">
                    <TextField label="PAN Number" value={editPan} onChange={(e) => setEditPan(e.target.value)} />
                    <TextField label="UAN Number" value={editUan} onChange={(e) => setEditUan(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <TextField label="Bank Name" value={editBankName} onChange={(e) => setEditBankName(e.target.value)} />
                    <TextField label="Bank Account" value={editBankAcc} onChange={(e) => setEditBankAcc(e.target.value)} />
                    <TextField label="IFSC Code" value={editIfsc} onChange={(e) => setEditIfsc(e.target.value)} />
                  </div>
                </>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
