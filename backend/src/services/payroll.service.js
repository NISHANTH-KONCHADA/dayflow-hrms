import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';
import { SalaryService } from './salary.service.js';

function round2(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

export class PayrollService {
  /**
   * Helper: Calculates payable days for an employee over a date range
   * based on attendance records and approved leave requests.
   */
  static async calculatePayableDays({ employeeId, companyId, periodStart, periodEnd }) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const normStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const normEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    const totalPeriodDays = Math.round((normEnd.getTime() - normStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Fetch attendance records in period
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        workDate: {
          gte: normStart,
          lte: normEnd,
        },
      },
    });

    // Fetch approved leave requests overlapping period
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: normEnd },
        endDate: { gte: normStart },
      },
      include: {
        leaveType: true,
      },
    });

    let presentCount = 0;
    let halfDayCount = 0;
    let paidLeaveCount = 0;
    let unpaidLeaveCount = 0;
    let absentCount = 0;

    // Map workDates to attendance status
    const attendanceMap = new Map();
    for (const att of attendances) {
      const dateStr = att.workDate.toISOString().split('T')[0];
      attendanceMap.set(dateStr, att.status);
    }

    // Map workDates to leave status
    const leaveMap = new Map();
    for (const leave of approvedLeaves) {
      const curr = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      while (curr <= leaveEnd) {
        if (curr >= normStart && curr <= normEnd) {
          const dateStr = curr.toISOString().split('T')[0];
          leaveMap.set(dateStr, leave.leaveType);
        }
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }

    const currDate = new Date(normStart);
    while (currDate <= normEnd) {
      const dateStr = currDate.toISOString().split('T')[0];
      const leaveType = leaveMap.get(dateStr);
      const attStatus = attendanceMap.get(dateStr);

      if (leaveType) {
        if (leaveType.isPaid) {
          paidLeaveCount++;
        } else {
          unpaidLeaveCount++;
        }
      } else if (attStatus === 'PRESENT') {
        presentCount++;
      } else if (attStatus === 'HALF_DAY') {
        halfDayCount++;
      } else if (attStatus === 'LEAVE') {
        paidLeaveCount++;
      } else if (attStatus === 'ABSENT') {
        absentCount++;
      } else {
        // If no record exists for a day in the period, check if working schedule or weekend. Default to present/working day if no negative mark.
        presentCount++;
      }

      currDate.setUTCDate(currDate.getUTCDate() + 1);
    }

    const payableDays = round2(presentCount + (halfDayCount * 0.5) + paidLeaveCount);
    const unpaidDays = round2(totalPeriodDays - payableDays);

    return {
      totalPeriodDays,
      presentCount,
      halfDayCount,
      paidLeaveCount,
      unpaidLeaveCount,
      absentCount,
      payableDays,
      unpaidDays,
    };
  }

  /**
   * Calculates payslip items for an employee based on salary structure and attendance.
   */
  static async calculateEmployeePayslip({ employeeId, companyId, periodStart, periodEnd }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        salaryStructure: {
          include: { components: true },
        },
      },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    if (!employee.salaryStructure) {
      throw new ApiError(`Salary structure not configured for employee ${employee.firstName} ${employee.lastName}`, 400);
    }

    const daysCalc = await this.calculatePayableDays({ employeeId, companyId, periodStart, periodEnd });
    const salary = await SalaryService.getSalaryStructure({ companyId, employeeId });

    const payFactor = daysCalc.payableDays / daysCalc.totalPeriodDays;

    const proRatedBasic = round2(salary.breakdown.basicAmount * payFactor);
    const proRatedHra = round2(salary.breakdown.hraAmount * payFactor);
    const proRatedBonus = round2(salary.breakdown.performanceBonusAmount * payFactor);
    const proRatedLta = round2(salary.breakdown.ltaAmount * payFactor);
    const proRatedStandardAllowance = round2(salary.breakdown.standardAllowance * payFactor);
    const proRatedFixedAllowance = round2(salary.breakdown.fixedAllowanceAmount * payFactor);

    const grossSalary = round2(
      proRatedBasic + proRatedHra + proRatedBonus + proRatedLta + proRatedStandardAllowance + proRatedFixedAllowance
    );

    const employeePf = round2((salary.breakdown.employeePfRate / 100) * proRatedBasic);
    const employerPf = round2((salary.breakdown.employerPfRate / 100) * proRatedBasic);
    const professionalTax = daysCalc.payableDays > 0 ? round2(salary.breakdown.professionalTax) : 0;
    const otherDeductions = 0;

    const totalDeductions = round2(employeePf + professionalTax + otherDeductions);
    const netSalary = round2(grossSalary - totalDeductions);

    const lines = [
      { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', amount: proRatedBasic, sequence: 1 },
      { code: 'HRA', name: 'House Rent Allowance', type: 'EARNING', amount: proRatedHra, sequence: 2 },
      { code: 'STANDARD_ALLOWANCE', name: 'Standard Allowance', type: 'EARNING', amount: proRatedStandardAllowance, sequence: 3 },
      { code: 'PERFORMANCE_BONUS', name: 'Performance Bonus', type: 'EARNING', amount: proRatedBonus, sequence: 4 },
      { code: 'LTA', name: 'Leave Travel Allowance', type: 'EARNING', amount: proRatedLta, sequence: 5 },
      { code: 'FIXED_ALLOWANCE', name: 'Fixed Allowance', type: 'EARNING', amount: proRatedFixedAllowance, sequence: 6 },
      { code: 'EMPLOYEE_PF', name: 'Employee PF', type: 'DEDUCTION', amount: employeePf, sequence: 7 },
      { code: 'PROFESSIONAL_TAX', name: 'Professional Tax', type: 'DEDUCTION', amount: professionalTax, sequence: 8 },
      { code: 'EMPLOYER_PF', name: 'Employer PF Contribution', type: 'EMPLOYER_CONTRIBUTION', amount: employerPf, sequence: 9 },
    ];

    return {
      employeeId,
      employeeCode: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName || ''}`.trim(),
      monthlyWage: Number(employee.salaryStructure.monthlyWage),
      daysCalc,
      grossSalary,
      employeePf,
      employerPf,
      professionalTax,
      otherDeductions,
      totalDeductions,
      netSalary,
      lines,
    };
  }

  /**
   * Create a new payroll run for all active employees in the company.
   */
  static async createPayrollRun({ requestingUser, periodStart, periodEnd }) {
    const companyId = requestingUser.companyId;

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const normStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const normEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    if (normStart > normEnd) {
      throw new ApiError('Period start date cannot be after period end date', 400);
    }

    const existingRun = await prisma.payrollRun.findUnique({
      where: {
        companyId_periodStart_periodEnd: {
          companyId,
          periodStart: normStart,
          periodEnd: normEnd,
        },
      },
    });

    if (existingRun) {
      throw new ApiError('A payroll run for this period already exists', 400);
    }

    // Fetch all active employees with salary structure configured
    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        dateOfLeaving: null,
      },
      include: {
        salaryStructure: true,
      },
    });

    if (employees.length === 0) {
      throw new ApiError('No active employees found for payroll processing', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const payrollRun = await tx.payrollRun.create({
        data: {
          companyId,
          periodStart: normStart,
          periodEnd: normEnd,
          status: 'GENERATED',
          generatedAt: new Date(),
        },
      });

      const payslips = [];

      for (const emp of employees) {
        if (!emp.salaryStructure) continue;

        const calc = await this.calculateEmployeePayslip({
          employeeId: emp.id,
          companyId,
          periodStart: normStart,
          periodEnd: normEnd,
        });

        const payslip = await tx.payslip.create({
          data: {
            payrollRunId: payrollRun.id,
            employeeId: emp.id,
            createdById: requestingUser.userId,
            status: 'GENERATED',
            currency: 'INR',
            monthlyWage: calc.monthlyWage,
            payableDays: calc.daysCalc.payableDays,
            unpaidDays: calc.daysCalc.unpaidDays,
            grossSalary: calc.grossSalary,
            employeePf: calc.employeePf,
            professionalTax: calc.professionalTax,
            otherDeductions: calc.otherDeductions,
            totalDeductions: calc.totalDeductions,
            netSalary: calc.netSalary,
            employerPf: calc.employerPf,
            generatedAt: new Date(),
            lines: {
              create: calc.lines.map((line) => ({
                code: line.code,
                name: line.name,
                type: line.type,
                amount: line.amount,
                sequence: line.sequence,
              })),
            },
          },
          include: {
            lines: true,
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true },
            },
          },
        });

        payslips.push(payslip);
      }

      return {
        ...payrollRun,
        totalEmployeesProcessed: payslips.length,
        payslips: payslips.map((p) => ({
          ...p,
          monthlyWage: Number(p.monthlyWage),
          payableDays: Number(p.payableDays),
          unpaidDays: Number(p.unpaidDays),
          grossSalary: Number(p.grossSalary),
          totalDeductions: Number(p.totalDeductions),
          netSalary: Number(p.netSalary),
        })),
      };
    });
  }

  /**
   * Admin view: Get all payroll runs for the company.
   */
  static async getPayrollRuns({ companyId, page = 1, limit = 20 }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, runs] = await Promise.all([
      prisma.payrollRun.count({ where: { companyId } }),
      prisma.payrollRun.findMany({
        where: { companyId },
        include: {
          _count: {
            select: { payslips: true },
          },
          payslips: {
            select: {
              grossSalary: true,
              netSalary: true,
              totalDeductions: true,
            },
          },
        },
        orderBy: { periodStart: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formattedRuns = runs.map((run) => {
      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;

      for (const ps of run.payslips) {
        totalGross += Number(ps.grossSalary);
        totalNet += Number(ps.netSalary);
        totalDeductions += Number(ps.totalDeductions);
      }

      const { payslips, ...rest } = run;
      return {
        ...rest,
        payslipsCount: run._count.payslips,
        totalGrossSalary: round2(totalGross),
        totalNetSalary: round2(totalNet),
        totalDeductions: round2(totalDeductions),
      };
    });

    return {
      runs: formattedRuns,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get single payroll run details with all payslips.
   */
  static async getPayrollRunById({ companyId, runId }) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, companyId },
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                profilePictureUrl: true,
                department: { select: { id: true, name: true } },
                jobPosition: { select: { id: true, name: true } },
              },
            },
            lines: { orderBy: { sequence: 'asc' } },
          },
        },
      },
    });

    if (!run) {
      throw new ApiError('Payroll run not found', 404);
    }

    const formattedPayslips = run.payslips.map((p) => ({
      ...p,
      monthlyWage: Number(p.monthlyWage),
      payableDays: Number(p.payableDays),
      unpaidDays: Number(p.unpaidDays),
      grossSalary: Number(p.grossSalary),
      employeePf: Number(p.employeePf),
      professionalTax: Number(p.professionalTax),
      otherDeductions: Number(p.otherDeductions),
      totalDeductions: Number(p.totalDeductions),
      netSalary: Number(p.netSalary),
      employerPf: Number(p.employerPf),
      lines: p.lines.map((l) => ({
        ...l,
        amount: Number(l.amount),
      })),
    }));

    return {
      ...run,
      payslips: formattedPayslips,
    };
  }

  /**
   * Get payroll & payslips history for a specific employee.
   */
  static async getEmployeePayroll({ companyId, employeeId, year, month, page = 1, limit = 20 }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = { employeeId };

    if (year || month) {
      where.payrollRun = {};
      if (year && month) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const start = new Date(Date.UTC(y, m - 1, 1));
        const end = new Date(Date.UTC(y, m, 0));
        where.payrollRun.periodStart = { gte: start, lte: end };
      } else if (year) {
        const y = parseInt(year, 10);
        where.payrollRun.periodStart = {
          gte: new Date(Date.UTC(y, 0, 1)),
          lte: new Date(Date.UTC(y, 11, 31)),
        };
      }
    }

    const [total, payslips] = await Promise.all([
      prisma.payslip.count({ where }),
      prisma.payslip.findMany({
        where,
        include: {
          payrollRun: true,
          lines: { orderBy: { sequence: 'asc' } },
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formatted = payslips.map((p) => ({
      ...p,
      monthlyWage: Number(p.monthlyWage),
      payableDays: Number(p.payableDays),
      unpaidDays: Number(p.unpaidDays),
      grossSalary: Number(p.grossSalary),
      employeePf: Number(p.employeePf),
      professionalTax: Number(p.professionalTax),
      otherDeductions: Number(p.otherDeductions),
      totalDeductions: Number(p.totalDeductions),
      netSalary: Number(p.netSalary),
      employerPf: Number(p.employerPf),
      lines: p.lines.map((l) => ({ ...l, amount: Number(l.amount) })),
    }));

    return {
      payslips: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }
}
