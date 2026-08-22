import type { SalaryBreakdown, SalaryStructure } from "@/lib/types";

/**
 * Mirrors the calculation the backend payroll engine will own (see
 * docs/IMPLEMENTATION_PLAN.md #3 Payroll). Kept here only so the frontend
 * can render a live preview against mock data — once `/api/payroll/:userId`
 * exists, components should use its response instead of calling this.
 */
export function computeSalaryBreakdown(structure: SalaryStructure): SalaryBreakdown {
  const basicAmount = round2((structure.basicPct / 100) * structure.wage);
  const hraAmount = round2((structure.hraPct / 100) * basicAmount);
  const performanceBonusAmount = round2((structure.performanceBonusPct / 100) * basicAmount);
  const ltaAmount = round2((structure.ltaPct / 100) * basicAmount);
  const standardAllowance = round2(structure.standardAllowance);

  const allocated = basicAmount + hraAmount + performanceBonusAmount + ltaAmount + standardAllowance;
  const fixedAllowanceAmount = round2(Math.max(structure.wage - allocated, 0));

  const pfEmployeeAmount = round2((structure.pfEmployeePct / 100) * basicAmount);
  const pfEmployerAmount = round2((structure.pfEmployerPct / 100) * basicAmount);

  const grossMonthly = round2(allocated + fixedAllowanceAmount);
  const netMonthly = round2(grossMonthly - pfEmployeeAmount - structure.professionalTax);

  return {
    ...structure,
    basicAmount,
    hraAmount,
    performanceBonusAmount,
    ltaAmount,
    fixedAllowanceAmount,
    pfEmployeeAmount,
    pfEmployerAmount,
    grossMonthly,
    netMonthly,
  };
}

/** True when the defined components already consume the full wage (Fixed Allowance would be 0 or negative). */
export function exceedsWage(structure: SalaryStructure): boolean {
  const basicAmount = (structure.basicPct / 100) * structure.wage;
  const hraAmount = (structure.hraPct / 100) * basicAmount;
  const performanceBonusAmount = (structure.performanceBonusPct / 100) * basicAmount;
  const ltaAmount = (structure.ltaPct / 100) * basicAmount;
  const allocated = basicAmount + hraAmount + performanceBonusAmount + ltaAmount + structure.standardAllowance;
  return allocated > structure.wage;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
