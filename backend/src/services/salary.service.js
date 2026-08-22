import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export class SalaryService {
  /**
   * Pure salary calculation engine.
   * Calculates Basic, HRA, Bonus, LTA, Standard Allowance, Fixed Allowance (remainder),
   * Employee PF, Employer PF, Professional Tax, Gross, and Net salary.
   */
  static calculateBreakdown({
    monthlyWage,
    basicPct = 50,
    hraPct = 50,
    performanceBonusPct = 8.33,
    ltaPct = 8.33,
    standardAllowance = 4167,
    employeePfRate = 12,
    employerPfRate = 12,
    professionalTax = 200,
  }) {
    const wageNum = round2(monthlyWage);
    if (isNaN(wageNum) || wageNum <= 0) {
      throw new ApiError('Monthly wage must be a positive number', 400);
    }

    const bPct = Number(basicPct);
    const hPct = Number(hraPct);
    const pbPct = Number(performanceBonusPct);
    const lPct = Number(ltaPct);
    const stdAmount = round2(standardAllowance);
    const empPfRate = Number(employeePfRate);
    const emprPfRate = Number(employerPfRate);
    const pTax = round2(professionalTax);

    // 1. Basic amount = (basicPct % of Monthly Wage)
    const basicAmount = round2((bPct / 100) * wageNum);

    // 2. HRA amount = (hraPct % of Basic)
    const hraAmount = round2((hPct / 100) * basicAmount);

    // 3. Performance Bonus amount = (performanceBonusPct % of Basic)
    const performanceBonusAmount = round2((pbPct / 100) * basicAmount);

    // 4. LTA amount = (ltaPct % of Basic)
    const ltaAmount = round2((lPct / 100) * basicAmount);

    // 5. Total allocated earnings before remainder
    const allocatedEarnings = round2(basicAmount + hraAmount + performanceBonusAmount + ltaAmount + stdAmount);

    // Validate if components exceed monthly wage
    const exceedsWage = allocatedEarnings > wageNum;

    // 6. Fixed Allowance (Remainder)
    const fixedAllowanceAmount = round2(Math.max(0, wageNum - allocatedEarnings));

    // 7. Gross Monthly Salary
    const grossMonthly = round2(allocatedEarnings + fixedAllowanceAmount);

    // 8. Deductions: PF & Professional Tax
    const pfEmployeeAmount = round2((empPfRate / 100) * basicAmount);
    const pfEmployerAmount = round2((emprPfRate / 100) * basicAmount);
    const totalDeductions = round2(pfEmployeeAmount + pTax);

    // 9. Net Monthly Salary
    const netMonthly = round2(grossMonthly - totalDeductions);

    return {
      monthlyWage: wageNum,
      basicPct: bPct,
      basicAmount,
      hraPct: hPct,
      hraAmount,
      performanceBonusPct: pbPct,
      performanceBonusAmount,
      ltaPct: lPct,
      ltaAmount,
      standardAllowance: stdAmount,
      fixedAllowanceAmount,
      grossMonthly,
      employeePfRate: empPfRate,
      employerPfRate: emprPfRate,
      pfEmployeeAmount,
      pfEmployerAmount,
      professionalTax: pTax,
      totalDeductions,
      netMonthly,
      annualWage: round2(grossMonthly * 12),
      annualNet: round2(netMonthly * 12),
      exceedsWage,
    };
  }

  /**
   * Preview salary calculation without saving to DB.
   */
  static previewSalary(data) {
    const breakdown = this.calculateBreakdown(data);
    if (breakdown.exceedsWage) {
      throw new ApiError(
        `Defined components (${breakdown.monthlyWage - breakdown.fixedAllowanceAmount}) exceed the total monthly wage (${breakdown.monthlyWage})`,
        400
      );
    }
    return breakdown;
  }

  /**
   * Get salary structure for an employee.
   */
  static async getSalaryStructure({ companyId, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        OR: [
          { id: employeeId },
          { user: { id: employeeId } },
        ],
      },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const structure = await prisma.salaryStructure.findUnique({
      where: { employeeId: employee.id },
      include: {
        components: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!structure) {
      throw new ApiError('Salary structure not configured for this employee', 404);
    }

    // Extract component values or fall back to defaults
    const basicComp = structure.components.find((c) => c.code === 'BASIC');
    const hraComp = structure.components.find((c) => c.code === 'HRA');
    const bonusComp = structure.components.find((c) => c.code === 'PERFORMANCE_BONUS');
    const ltaComp = structure.components.find((c) => c.code === 'LTA');
    const stdComp = structure.components.find((c) => c.code === 'STANDARD_ALLOWANCE');

    const breakdown = this.calculateBreakdown({
      monthlyWage: Number(structure.monthlyWage),
      basicPct: basicComp ? Number(basicComp.percentage) : 50,
      hraPct: hraComp ? Number(hraComp.percentage) : 50,
      performanceBonusPct: bonusComp ? Number(bonusComp.percentage) : 8.33,
      ltaPct: ltaComp ? Number(ltaComp.percentage) : 8.33,
      standardAllowance: stdComp ? Number(stdComp.fixedAmount) : 4167,
      employeePfRate: Number(structure.employeePfRate),
      employerPfRate: Number(structure.employerPfRate),
      professionalTax: Number(structure.professionalTax),
    });

    return {
      id: structure.id,
      companyId: structure.companyId,
      employeeId: structure.employeeId,
      wageType: structure.wageType,
      monthlyWage: Number(structure.monthlyWage),
      currency: structure.currency,
      employeePfRate: Number(structure.employeePfRate),
      employerPfRate: Number(structure.employerPfRate),
      professionalTax: Number(structure.professionalTax),
      effectiveFrom: structure.effectiveFrom,
      breakdown,
      components: structure.components.map((c) => ({
        ...c,
        percentage: c.percentage ? Number(c.percentage) : null,
        fixedAmount: c.fixedAmount ? Number(c.fixedAmount) : null,
      })),
    };
  }

  /**
   * Create salary structure for an employee.
   */
  static async createSalaryStructure({ companyId, employeeId, data }) {
    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        OR: [
          { id: employeeId },
          { user: { id: employeeId } },
        ],
      },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const existing = await prisma.salaryStructure.findUnique({
      where: { employeeId: employee.id },
    });

    if (existing) {
      throw new ApiError('Salary structure already exists for this employee. Use update (PATCH) instead', 400);
    }

    const breakdown = this.calculateBreakdown(data);
    if (breakdown.exceedsWage) {
      throw new ApiError('Defined salary components exceed the total monthly wage', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const structure = await tx.salaryStructure.create({
        data: {
          companyId,
          employeeId: employee.id,
          wageType: 'FIXED',
          monthlyWage: breakdown.monthlyWage,
          currency: data.currency || 'INR',
          employeePfRate: breakdown.employeePfRate,
          employerPfRate: breakdown.employerPfRate,
          professionalTax: breakdown.professionalTax,
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        },
      });

      await tx.salaryComponent.createMany({
        data: [
          {
            salaryStructureId: structure.id,
            code: 'BASIC',
            name: 'Basic Salary',
            computationType: 'PERCENTAGE',
            percentageBase: 'WAGE',
            percentage: breakdown.basicPct,
            sequence: 1,
            isEarning: true,
          },
          {
            salaryStructureId: structure.id,
            code: 'HRA',
            name: 'House Rent Allowance',
            computationType: 'PERCENTAGE',
            percentageBase: 'BASIC',
            percentage: breakdown.hraPct,
            sequence: 2,
            isEarning: true,
          },
          {
            salaryStructureId: structure.id,
            code: 'STANDARD_ALLOWANCE',
            name: 'Standard Allowance',
            computationType: 'FIXED',
            fixedAmount: breakdown.standardAllowance,
            sequence: 3,
            isEarning: true,
          },
          {
            salaryStructureId: structure.id,
            code: 'PERFORMANCE_BONUS',
            name: 'Performance Bonus',
            computationType: 'PERCENTAGE',
            percentageBase: 'BASIC',
            percentage: breakdown.performanceBonusPct,
            sequence: 4,
            isEarning: true,
          },
          {
            salaryStructureId: structure.id,
            code: 'LTA',
            name: 'Leave Travel Allowance',
            computationType: 'PERCENTAGE',
            percentageBase: 'BASIC',
            percentage: breakdown.ltaPct,
            sequence: 5,
            isEarning: true,
          },
          {
            salaryStructureId: structure.id,
            code: 'FIXED_ALLOWANCE',
            name: 'Fixed Allowance (Remainder)',
            computationType: 'REMAINDER',
            fixedAmount: breakdown.fixedAllowanceAmount,
            sequence: 6,
            isEarning: true,
          },
        ],
      });

      return {
        ...structure,
        monthlyWage: Number(structure.monthlyWage),
        employeePfRate: Number(structure.employeePfRate),
        employerPfRate: Number(structure.employerPfRate),
        professionalTax: Number(structure.professionalTax),
        breakdown,
      };
    });
  }

  /**
   * Update salary structure for an employee.
   */
  static async updateSalaryStructure({ companyId, employeeId, updateData }) {
    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        OR: [
          { id: employeeId },
          { user: { id: employeeId } },
        ],
      },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    let existingStructure = await prisma.salaryStructure.findUnique({
      where: { employeeId: employee.id },
      include: { components: true },
    });

    // If structure doesn't exist yet, delegate to create
    if (!existingStructure) {
      return this.createSalaryStructure({ companyId, employeeId: employee.id, data: updateData });
    }

    const basicComp = existingStructure.components.find((c) => c.code === 'BASIC');
    const hraComp = existingStructure.components.find((c) => c.code === 'HRA');
    const bonusComp = existingStructure.components.find((c) => c.code === 'PERFORMANCE_BONUS');
    const ltaComp = existingStructure.components.find((c) => c.code === 'LTA');
    const stdComp = existingStructure.components.find((c) => c.code === 'STANDARD_ALLOWANCE');

    const mergedData = {
      monthlyWage: updateData.monthlyWage ?? Number(existingStructure.monthlyWage),
      basicPct: updateData.basicPct ?? (basicComp ? Number(basicComp.percentage) : 50),
      hraPct: updateData.hraPct ?? (hraComp ? Number(hraComp.percentage) : 50),
      performanceBonusPct: updateData.performanceBonusPct ?? (bonusComp ? Number(bonusComp.percentage) : 8.33),
      ltaPct: updateData.ltaPct ?? (ltaComp ? Number(ltaComp.percentage) : 8.33),
      standardAllowance: updateData.standardAllowance ?? (stdComp ? Number(stdComp.fixedAmount) : 4167),
      employeePfRate: updateData.employeePfRate ?? Number(existingStructure.employeePfRate),
      employerPfRate: updateData.employerPfRate ?? Number(existingStructure.employerPfRate),
      professionalTax: updateData.professionalTax ?? Number(existingStructure.professionalTax),
    };

    const breakdown = this.calculateBreakdown(mergedData);
    if (breakdown.exceedsWage) {
      throw new ApiError('Defined salary components exceed the total monthly wage', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const updatedStructure = await tx.salaryStructure.update({
        where: { id: existingStructure.id },
        data: {
          monthlyWage: breakdown.monthlyWage,
          employeePfRate: breakdown.employeePfRate,
          employerPfRate: breakdown.employerPfRate,
          professionalTax: breakdown.professionalTax,
          ...(updateData.effectiveFrom && { effectiveFrom: new Date(updateData.effectiveFrom) }),
        },
      });

      // Update individual component definitions
      const updates = [
        { code: 'BASIC', percentage: breakdown.basicPct, fixedAmount: null },
        { code: 'HRA', percentage: breakdown.hraPct, fixedAmount: null },
        { code: 'STANDARD_ALLOWANCE', percentage: null, fixedAmount: breakdown.standardAllowance },
        { code: 'PERFORMANCE_BONUS', percentage: breakdown.performanceBonusPct, fixedAmount: null },
        { code: 'LTA', percentage: breakdown.ltaPct, fixedAmount: null },
        { code: 'FIXED_ALLOWANCE', percentage: null, fixedAmount: breakdown.fixedAllowanceAmount },
      ];

      for (const item of updates) {
        await tx.salaryComponent.upsert({
          where: {
            salaryStructureId_code: {
              salaryStructureId: existingStructure.id,
              code: item.code,
            },
          },
          update: {
            percentage: item.percentage,
            fixedAmount: item.fixedAmount,
          },
          create: {
            salaryStructureId: existingStructure.id,
            code: item.code,
            name: item.code.replace('_', ' '),
            computationType: item.code === 'FIXED_ALLOWANCE' ? 'REMAINDER' : (item.percentage !== null ? 'PERCENTAGE' : 'FIXED'),
            percentageBase: item.code === 'BASIC' ? 'WAGE' : (item.percentage !== null ? 'BASIC' : null),
            percentage: item.percentage,
            fixedAmount: item.fixedAmount,
            isEarning: true,
          },
        });
      }

      return {
        ...updatedStructure,
        monthlyWage: Number(updatedStructure.monthlyWage),
        employeePfRate: Number(updatedStructure.employeePfRate),
        employerPfRate: Number(updatedStructure.employerPfRate),
        professionalTax: Number(updatedStructure.professionalTax),
        breakdown,
      };
    });
  }
}
