"use client";

import { useEffect, useState } from "react";
import { getSalaryStructure, updateSalaryStructure } from "@/lib/mock";
import { computeSalaryBreakdown, exceedsWage } from "@/lib/payroll";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import type { SalaryStructure } from "@/lib/types";

interface SalaryInfoTabProps {
  userId: string;
  /** Only Admin/HR can edit a wage structure — everyone else sees the breakdown read-only. */
  canEdit: boolean;
}

type PercentField = "basicPct" | "hraPct" | "performanceBonusPct" | "ltaPct";

const PERCENT_FIELDS: { key: PercentField; label: string }[] = [
  { key: "basicPct", label: "Basic (% of Wage)" },
  { key: "hraPct", label: "HRA (% of Basic)" },
  { key: "performanceBonusPct", label: "Performance Bonus (% of Basic)" },
  { key: "ltaPct", label: "Leave Travel Allowance (% of Basic)" },
];

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function SalaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={bold ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}

export default function SalaryInfoTab({ userId, canEdit }: SalaryInfoTabProps) {
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [draft, setDraft] = useState<SalaryStructure | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getSalaryStructure(userId).then((data) => {
      if (!cancelled) {
        setStructure(data ?? null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-muted">Loading salary information…</p>;
  }

  if (!structure) {
    return <p className="text-sm text-muted">No salary structure configured for this employee.</p>;
  }

  const active = draft ?? structure;
  const breakdown = computeSalaryBreakdown(active);
  const over = exceedsWage(active);

  function startEditing() {
    setDraft(structure);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(null);
    setError(null);
    setIsEditing(false);
  }

  function updateField<K extends keyof Omit<SalaryStructure, "userId">>(key: K, value: number) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!draft) return;
    if (exceedsWage(draft)) {
      setError("Salary components exceed the defined wage. Reduce a percentage or increase the wage.");
      return;
    }
    setError(null);

    setSaving(true);
    const updated = await updateSalaryStructure(userId, draft);
    setSaving(false);

    if (updated) {
      setStructure(updated);
      setDraft(null);
      setIsEditing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Salary Components</h2>
        {canEdit &&
          (isEditing ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={cancelEditing} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={startEditing}>
              Edit
            </Button>
          ))}
      </div>

      {error && <p className="text-sm text-status-danger">{error}</p>}
      {isEditing && over && !error && (
        <p className="text-sm text-status-danger">
          Components currently exceed the wage — Fixed Allowance would be negative.
        </p>
      )}

      {isEditing ? (
        <TextField
          label="Monthly Wage (₹)"
          name="wage"
          type="number"
          value={active.wage}
          onChange={(event) => updateField("wage", Number(event.target.value))}
        />
      ) : (
        <SalaryRow label="Monthly Wage" value={formatCurrency(active.wage)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isEditing ? (
          <TextField
            label="No of Working Days in a Week"
            name="workingDaysPerWeek"
            type="number"
            value={active.workingDaysPerWeek}
            onChange={(event) => updateField("workingDaysPerWeek", Number(event.target.value))}
          />
        ) : (
          <SalaryRow label="No of Working Days in a Week" value={String(active.workingDaysPerWeek)} />
        )}
        {isEditing ? (
          <TextField
            label="Break Time (hrs)"
            name="breakTimeHours"
            type="number"
            step="0.5"
            value={active.breakTimeHours}
            onChange={(event) => updateField("breakTimeHours", Number(event.target.value))}
          />
        ) : (
          <SalaryRow label="Break Time" value={`${active.breakTimeHours} hrs`} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERCENT_FIELDS.map((field) =>
          isEditing ? (
            <TextField
              key={field.key}
              label={field.label}
              name={field.key}
              type="number"
              step="0.01"
              value={active[field.key]}
              onChange={(event) => updateField(field.key, Number(event.target.value))}
            />
          ) : (
            <SalaryRow key={field.key} label={field.label} value={`${active[field.key]}%`} />
          ),
        )}
        {isEditing ? (
          <TextField
            label="Standard Allowance (₹/month)"
            name="standardAllowance"
            type="number"
            value={active.standardAllowance}
            onChange={(event) => updateField("standardAllowance", Number(event.target.value))}
          />
        ) : (
          <SalaryRow label="Standard Allowance" value={formatCurrency(active.standardAllowance)} />
        )}
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Computed Breakdown</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SalaryRow label="Basic" value={formatCurrency(breakdown.basicAmount)} />
          <SalaryRow label="HRA" value={formatCurrency(breakdown.hraAmount)} />
          <SalaryRow label="Standard Allowance" value={formatCurrency(breakdown.standardAllowance)} />
          <SalaryRow label="Performance Bonus" value={formatCurrency(breakdown.performanceBonusAmount)} />
          <SalaryRow label="Leave Travel Allowance" value={formatCurrency(breakdown.ltaAmount)} />
          <SalaryRow label="Fixed Allowance" value={formatCurrency(breakdown.fixedAllowanceAmount)} />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Deductions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isEditing ? (
            <>
              <TextField
                label="PF — Employee (%)"
                name="pfEmployeePct"
                type="number"
                step="0.01"
                value={active.pfEmployeePct}
                onChange={(event) => updateField("pfEmployeePct", Number(event.target.value))}
              />
              <TextField
                label="PF — Employer (%)"
                name="pfEmployerPct"
                type="number"
                step="0.01"
                value={active.pfEmployerPct}
                onChange={(event) => updateField("pfEmployerPct", Number(event.target.value))}
              />
              <TextField
                label="Professional Tax (₹/month)"
                name="professionalTax"
                type="number"
                value={active.professionalTax}
                onChange={(event) => updateField("professionalTax", Number(event.target.value))}
              />
            </>
          ) : (
            <>
              <SalaryRow
                label="PF — Employee"
                value={`${formatCurrency(breakdown.pfEmployeeAmount)} (${active.pfEmployeePct}%)`}
              />
              <SalaryRow
                label="PF — Employer"
                value={`${formatCurrency(breakdown.pfEmployerAmount)} (${active.pfEmployerPct}%)`}
              />
              <SalaryRow label="Professional Tax" value={formatCurrency(active.professionalTax)} />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-4">
        <SalaryRow label="Gross Monthly" value={formatCurrency(breakdown.grossMonthly)} bold />
        <SalaryRow label="Net Monthly (after PF + tax)" value={formatCurrency(breakdown.netMonthly)} bold />
      </div>
    </div>
  );
}
