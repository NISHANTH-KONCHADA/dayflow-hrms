"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getPersonalPayslips,
  getPayslipsAdmin,
  getPayrollRuns,
  createPayrollRun,
  getPayslipById,
} from "@/lib/api/payroll";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { cn } from "@/lib/cn";

export default function PayrollPage() {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"personal" | "runs" | "all">("personal");

  // Personal state
  const [personalPayslips, setPersonalPayslips] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);

  // Admin state
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [adminPayslips, setAdminPayslips] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Run Payroll Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [submittingRun, setSubmittingRun] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Payslip detail modal
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  async function loadPersonal() {
    setLoadingPersonal(true);
    try {
      const data = await getPersonalPayslips();
      setPersonalPayslips(Array.isArray(data) ? data : data?.payslips || []);
    } catch (err) {
      console.error("Failed to load personal payslips", err);
    } finally {
      setLoadingPersonal(false);
    }
  }

  async function loadAdmin() {
    setLoadingAdmin(true);
    try {
      const [runs, payslips] = await Promise.all([
        getPayrollRuns(),
        getPayslipsAdmin(),
      ]);
      setPayrollRuns(Array.isArray(runs) ? runs : runs?.payrollRuns || []);
      setAdminPayslips(Array.isArray(payslips) ? payslips : payslips?.payslips || []);
    } catch (err) {
      console.error("Failed to load admin payroll data", err);
    } finally {
      setLoadingAdmin(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadPersonal();
    }
  }, [user]);

  useEffect(() => {
    if ((activeTab === "runs" || activeTab === "all") && isAdminOrHr) {
      loadAdmin();
    }
  }, [activeTab]);

  async function handleCreateRun(e: React.FormEvent) {
    e.preventDefault();
    setRunError(null);
    if (!periodStart || !periodEnd) {
      setRunError("Please select both period start and end dates.");
      return;
    }

    setSubmittingRun(true);
    try {
      await createPayrollRun({ periodStart, periodEnd });
      setShowRunModal(false);
      setPeriodStart("");
      setPeriodEnd("");
      await loadAdmin();
      await loadPersonal();
    } catch (err: any) {
      setRunError(err.message || "Failed to execute payroll run");
    } finally {
      setSubmittingRun(false);
    }
  }

  async function viewPayslip(id: string) {
    try {
      const ps = await getPayslipById(id);
      setSelectedPayslip(ps);
    } catch (err: any) {
      alert(err.message || "Failed to fetch payslip detail");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payroll &amp; Payslips</h1>
          <p className="text-sm text-muted">Access monthly salary slips, earnings breakdown, and payroll runs.</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdminOrHr && (
            <>
              <div className="flex rounded-md border border-border bg-surface p-1">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={cn(
                    "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "personal" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
                  )}
                >
                  My Payslips
                </button>
                <button
                  onClick={() => setActiveTab("runs")}
                  className={cn(
                    "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "runs" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
                  )}
                >
                  Payroll Runs
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                    activeTab === "all" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
                  )}
                >
                  All Payslips
                </button>
              </div>
              <Button onClick={() => setShowRunModal(true)}>+ Run Payroll</Button>
            </>
          )}
        </div>
      </div>

      {activeTab === "personal" ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">My Monthly Payslips</h3>
          </div>
          {loadingPersonal ? (
            <div className="p-6 text-center text-sm text-muted">Loading payslips...</div>
          ) : personalPayslips.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">No payslips have been generated for you yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="border-b border-border bg-muted/20 text-xs font-semibold text-muted">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3">Gross Wage</th>
                    <th className="p-3">Net Pay</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {personalPayslips.map((ps) => (
                    <tr key={ps.id} className="hover:bg-muted/10">
                      <td className="p-3 font-medium">
                        {new Date(ps.periodStart).toLocaleDateString()} - {new Date(ps.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono">₹{Number(ps.grossWage || 0).toLocaleString()}</td>
                      <td className="p-3 font-mono font-semibold text-status-present">
                        ₹{Number(ps.netPay || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-status-present/10 px-2 py-0.5 text-xs font-medium text-status-present">
                          {ps.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="secondary" onClick={() => viewPayslip(ps.id)}>
                          View Breakdown
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === "runs" ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Company Payroll Batch Runs</h3>
          </div>
          {loadingAdmin ? (
            <div className="p-6 text-center text-sm text-muted">Loading payroll runs...</div>
          ) : payrollRuns.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">No payroll runs executed yet. Click &quot;+ Run Payroll&quot; to compute.</div>
          ) : (
            <div className="divide-y divide-border">
              {payrollRuns.map((run) => (
                <div key={run.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      Period: {new Date(run.periodStart).toLocaleDateString()} — {new Date(run.periodEnd).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted">
                      Executed at: {new Date(run.createdAt).toLocaleString()} · Employees processed: {run.payslips?.length || 0}
                    </p>
                  </div>
                  <span className="rounded bg-status-present/10 px-3 py-1 text-xs font-bold text-status-present">
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">All Generated Employee Payslips</h3>
          </div>
          {loadingAdmin ? (
            <div className="p-6 text-center text-sm text-muted">Loading payslips...</div>
          ) : adminPayslips.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">No payslips generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="border-b border-border bg-muted/20 text-xs font-semibold text-muted">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Gross Wage</th>
                    <th className="p-3">Net Pay</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adminPayslips.map((ps) => {
                    const empName = ps.employee
                      ? `${ps.employee.firstName} ${ps.employee.lastName || ""}`
                      : "Employee";
                    return (
                      <tr key={ps.id} className="hover:bg-muted/10">
                        <td className="p-3 font-medium">{empName}</td>
                        <td className="p-3">
                          {new Date(ps.periodStart).toLocaleDateString()} - {new Date(ps.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-mono">₹{Number(ps.grossWage || 0).toLocaleString()}</td>
                        <td className="p-3 font-mono font-semibold text-status-present">
                          ₹{Number(ps.netPay || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-status-present/10 px-2 py-0.5 text-xs font-medium text-status-present">
                            {ps.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <Button size="sm" variant="secondary" onClick={() => viewPayslip(ps.id)}>
                            View Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Run Payroll Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Run Monthly Payroll</h2>
            <p className="text-xs text-muted mb-4">Compute wages, attendance deductions, PF &amp; tax for all active employees.</p>

            <form onSubmit={handleCreateRun} className="flex flex-col gap-4">
              {runError && (
                <p className="rounded bg-status-danger/10 p-2 text-xs text-status-danger">{runError}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Period Start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
                <TextField
                  label="Period End"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="secondary" onClick={() => setShowRunModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submittingRun}>
                  Process Payroll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Itemized Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Itemized Payslip</h2>
                <p className="text-xs text-muted">
                  {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName} ({selectedPayslip.employee?.employeeCode})
                </p>
              </div>
              <span className="rounded bg-status-present/10 px-2 py-0.5 text-xs font-semibold text-status-present">
                {selectedPayslip.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Pay Period:</span>
                <span className="font-medium text-foreground">
                  {new Date(selectedPayslip.periodStart).toLocaleDateString()} - {new Date(selectedPayslip.periodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted">Monthly Gross Wage:</span>
                <span className="font-mono font-medium text-foreground">₹{Number(selectedPayslip.grossWage || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-status-danger">
                <span>Deductions (PF + PT):</span>
                <span className="font-mono font-medium">-₹{Number(selectedPayslip.totalDeductions || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-border font-bold text-sm text-status-present">
                <span>Net Pay Transfer:</span>
                <span className="font-mono">₹{Number(selectedPayslip.netPay || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setSelectedPayslip(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
