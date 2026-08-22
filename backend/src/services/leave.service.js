import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export class LeaveService {
  /**
   * ==========================================
   * LEAVE TYPES
   * ==========================================
   */

  /**
   * Get all leave types for user's company.
   */
  static async getLeaveTypes({ companyId, isActive }) {
    const where = { companyId };
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    const leaveTypes = await prisma.leaveType.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return leaveTypes.map((lt) => ({
      ...lt,
      defaultDays: lt.defaultDays ? Number(lt.defaultDays) : null,
    }));
  }

  /**
   * Create a new leave type.
   */
  static async createLeaveType({ companyId, code, name, defaultDays, requiresProof, isPaid, isActive }) {
    const existing = await prisma.leaveType.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });

    if (existing) {
      throw new ApiError(`Leave type with code '${code}' already exists for this company`, 400);
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        companyId,
        code,
        name,
        defaultDays: defaultDays !== undefined ? defaultDays : null,
        requiresProof: requiresProof ?? false,
        isPaid: isPaid ?? (code !== 'UNPAID'),
        isActive: isActive ?? true,
      },
    });

    return {
      ...leaveType,
      defaultDays: leaveType.defaultDays ? Number(leaveType.defaultDays) : null,
    };
  }

  /**
   * Update an existing leave type.
   */
  static async updateLeaveType({ companyId, id, name, defaultDays, requiresProof, isPaid, isActive }) {
    const leaveType = await prisma.leaveType.findFirst({
      where: { id, companyId },
    });

    if (!leaveType) {
      throw new ApiError('Leave type not found', 404);
    }

    const updated = await prisma.leaveType.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(defaultDays !== undefined && { defaultDays }),
        ...(requiresProof !== undefined && { requiresProof }),
        ...(isPaid !== undefined && { isPaid }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return {
      ...updated,
      defaultDays: updated.defaultDays ? Number(updated.defaultDays) : null,
    };
  }

  /**
   * Delete or deactivate a leave type.
   */
  static async deleteLeaveType({ companyId, id }) {
    const leaveType = await prisma.leaveType.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { allocations: true, requests: true },
        },
      },
    });

    if (!leaveType) {
      throw new ApiError('Leave type not found', 404);
    }

    // If leave type is associated with allocations or requests, deactivate it instead of hard deleting
    if (leaveType._count.allocations > 0 || leaveType._count.requests > 0) {
      await prisma.leaveType.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Leave type deactivated because existing records depend on it' };
    }

    await prisma.leaveType.delete({
      where: { id },
    });

    return { message: 'Leave type deleted successfully' };
  }

  /**
   * ==========================================
   * LEAVE ALLOCATIONS
   * ==========================================
   */

  /**
   * Get personal leave allocations for logged-in employee.
   */
  static async getPersonalAllocations({ requestingUser, year }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    return this.getEmployeeAllocations({
      companyId: requestingUser.companyId,
      targetEmployeeId: employeeId,
      year,
    });
  }

  /**
   * Get leave allocations for a target employee.
   */
  static async getEmployeeAllocations({ companyId, targetEmployeeId, year }) {
    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const allocations = await prisma.leaveAllocation.findMany({
      where: {
        employeeId: targetEmployeeId,
        year: currentYear,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true,
            isPaid: true,
            requiresProof: true,
          },
        },
      },
      orderBy: { leaveType: { name: 'asc' } },
    });

    return allocations.map((alloc) => {
      const allocated = Number(alloc.allocatedDays);
      const used = Number(alloc.usedDays);
      return {
        ...alloc,
        allocatedDays: allocated,
        usedDays: used,
        remainingDays: Math.max(0, Math.round((allocated - used) * 100) / 100),
      };
    });
  }

  /**
   * Create or upsert a leave allocation for an employee.
   */
  static async createEmployeeAllocation({ companyId, targetEmployeeId, leaveTypeId, year, allocatedDays }) {
    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const leaveType = await prisma.leaveType.findFirst({
      where: { id: leaveTypeId, companyId },
    });

    if (!leaveType) {
      throw new ApiError('Leave type not found in company', 404);
    }

    const allocYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const upserted = await prisma.leaveAllocation.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: targetEmployeeId,
          leaveTypeId,
          year: allocYear,
        },
      },
      update: {
        allocatedDays,
      },
      create: {
        employeeId: targetEmployeeId,
        leaveTypeId,
        year: allocYear,
        allocatedDays,
        usedDays: 0,
      },
      include: {
        leaveType: {
          select: { id: true, code: true, name: true, isPaid: true },
        },
      },
    });

    const allocated = Number(upserted.allocatedDays);
    const used = Number(upserted.usedDays);

    return {
      ...upserted,
      allocatedDays: allocated,
      usedDays: used,
      remainingDays: Math.max(0, Math.round((allocated - used) * 100) / 100),
    };
  }

  /**
   * Update an existing leave allocation by allocationId.
   */
  static async updateEmployeeAllocation({ companyId, targetEmployeeId, allocationId, allocatedDays, usedDays }) {
    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const allocation = await prisma.leaveAllocation.findFirst({
      where: {
        id: allocationId,
        employeeId: targetEmployeeId,
      },
    });

    if (!allocation) {
      throw new ApiError('Leave allocation record not found', 404);
    }

    const updated = await prisma.leaveAllocation.update({
      where: { id: allocationId },
      data: {
        ...(allocatedDays !== undefined && { allocatedDays }),
        ...(usedDays !== undefined && { usedDays }),
      },
      include: {
        leaveType: {
          select: { id: true, code: true, name: true, isPaid: true },
        },
      },
    });

    const allocated = Number(updated.allocatedDays);
    const used = Number(updated.usedDays);

    return {
      ...updated,
      allocatedDays: allocated,
      usedDays: used,
      remainingDays: Math.max(0, Math.round((allocated - used) * 100) / 100),
    };
  }
}
