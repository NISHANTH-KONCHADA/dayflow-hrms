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

  /**
   * ==========================================
   * LEAVE REQUESTS
   * ==========================================
   */

  /**
   * Create a new leave request for the authenticated employee.
   */
  static async createLeaveRequest({
    requestingUser,
    leaveTypeId,
    startDate,
    endDate,
    requestedDays,
    reason,
    attachmentUrl,
    attachmentName,
  }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    const leaveType = await prisma.leaveType.findFirst({
      where: { id: leaveTypeId, companyId: requestingUser.companyId, isActive: true },
    });

    if (!leaveType) {
      throw new ApiError('Leave type not found or inactive', 404);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError('Invalid start date or end date format', 400);
    }

    const normalizedStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const normalizedEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    if (normalizedStart > normalizedEnd) {
      throw new ApiError('Start date cannot be after end date', 400);
    }

    // Calculate requested days if not explicitly provided
    let totalDays = requestedDays;
    if (!totalDays || totalDays <= 0) {
      const diffMs = normalizedEnd.getTime() - normalizedStart.getTime();
      totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    }

    // Check overlap with active (pending/approved) leave requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: normalizedEnd },
            endDate: { gte: normalizedStart },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ApiError('An active leave request already overlaps with this date range', 400);
    }

    // Check available leave allocation balance if leave type is paid or limited
    const reqYear = normalizedStart.getUTCFullYear();
    const allocation = await prisma.leaveAllocation.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year: reqYear,
        },
      },
    });

    if (allocation) {
      const remaining = Number(allocation.allocatedDays) - Number(allocation.usedDays);
      if (remaining < totalDays) {
        throw new ApiError(`Insufficient leave balance. Remaining: ${remaining} days, Requested: ${totalDays} days`, 400);
      }
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        requestedDays: totalDays,
        reason: reason || null,
        status: 'PENDING',
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
      include: {
        leaveType: {
          select: { id: true, code: true, name: true, isPaid: true },
        },
      },
    });

    return {
      ...leaveRequest,
      requestedDays: Number(leaveRequest.requestedDays),
    };
  }

  /**
   * Get personal leave history for logged in employee.
   */
  static async getPersonalLeaveRequests({ requestingUser, status, year, startDate, endDate, page = 1, limit = 20 }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      employeeId,
      ...(status && { status }),
    };

    if (year) {
      const y = parseInt(year, 10);
      where.startDate = {
        gte: new Date(Date.UTC(y, 0, 1)),
        lte: new Date(Date.UTC(y, 11, 31)),
      };
    } else if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [total, requests] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        include: {
          leaveType: {
            select: { id: true, code: true, name: true, isPaid: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formatted = requests.map((req) => ({
      ...req,
      requestedDays: Number(req.requestedDays),
    }));

    return {
      requests: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Admin view: Get all leave requests across company.
   */
  static async getAdminLeaveRequests({
    companyId,
    status,
    departmentId,
    employeeId,
    leaveTypeId,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      employee: {
        companyId,
        ...(departmentId && { departmentId }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      ...(employeeId && { employeeId }),
      ...(leaveTypeId && { leaveTypeId }),
      ...(status && { status }),
    };

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [total, requests] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
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
          leaveType: {
            select: { id: true, code: true, name: true, isPaid: true },
          },
          approvedBy: {
            select: { id: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formatted = requests.map((req) => ({
      ...req,
      requestedDays: Number(req.requestedDays),
    }));

    return {
      requests: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get single leave request by ID.
   */
  static async getLeaveRequestById({ requestingUser, id }) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            profilePictureUrl: true,
            department: { select: { id: true, name: true } },
            jobPosition: { select: { id: true, name: true } },
          },
        },
        leaveType: {
          select: { id: true, code: true, name: true, isPaid: true },
        },
        approvedBy: {
          select: { id: true, email: true },
        },
      },
    });

    if (!leaveRequest || leaveRequest.employee.companyId !== requestingUser.companyId) {
      throw new ApiError('Leave request not found', 404);
    }

    // Regular employee can only view their own leave request
    if (
      requestingUser.role === 'EMPLOYEE' &&
      leaveRequest.employeeId !== requestingUser.employeeId
    ) {
      throw new ApiError('Forbidden: Access denied', 403);
    }

    return {
      ...leaveRequest,
      requestedDays: Number(leaveRequest.requestedDays),
    };
  }

  /**
   * Approve a pending leave request.
   */
  static async approveLeaveRequest({ requestingUser, id, reviewerComment }) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    if (!leaveRequest || leaveRequest.employee.companyId !== requestingUser.companyId) {
      throw new ApiError('Leave request not found', 404);
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new ApiError(`Cannot approve leave request with status '${leaveRequest.status}'`, 400);
    }

    const requestedDays = Number(leaveRequest.requestedDays);
    const reqYear = new Date(leaveRequest.startDate).getUTCFullYear();

    return await prisma.$transaction(async (tx) => {
      // 1. Update leave request status
      const updatedRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: requestingUser.userId,
          reviewedAt: new Date(),
          reviewerComment: reviewerComment !== undefined ? reviewerComment : leaveRequest.reviewerComment,
        },
        include: {
          leaveType: { select: { id: true, code: true, name: true, isPaid: true } },
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
      });

      // 2. Increment usedDays in LeaveAllocation
      const allocation = await tx.leaveAllocation.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year: reqYear,
          },
        },
      });

      if (allocation) {
        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: {
            usedDays: { increment: requestedDays },
          },
        });
      }

      // 3. Update attendance records for the date range
      const curr = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);

      while (curr <= end) {
        const workDate = new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth(), curr.getUTCDate()));

        await tx.attendance.upsert({
          where: {
            employeeId_workDate: {
              employeeId: leaveRequest.employeeId,
              workDate,
            },
          },
          update: {
            status: 'LEAVE',
            notes: `Approved Leave: ${leaveRequest.leaveType.name}`,
          },
          create: {
            employeeId: leaveRequest.employeeId,
            workDate,
            status: 'LEAVE',
            notes: `Approved Leave: ${leaveRequest.leaveType.name}`,
          },
        });

        curr.setUTCDate(curr.getUTCDate() + 1);
      }

      return {
        ...updatedRequest,
        requestedDays: Number(updatedRequest.requestedDays),
      };
    });
  }

  /**
   * Reject a pending leave request.
   */
  static async rejectLeaveRequest({ requestingUser, id, reviewerComment }) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!leaveRequest || leaveRequest.employee.companyId !== requestingUser.companyId) {
      throw new ApiError('Leave request not found', 404);
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new ApiError(`Cannot reject leave request with status '${leaveRequest.status}'`, 400);
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: requestingUser.userId,
        reviewedAt: new Date(),
        reviewerComment: reviewerComment !== undefined ? reviewerComment : leaveRequest.reviewerComment,
      },
      include: {
        leaveType: { select: { id: true, code: true, name: true, isPaid: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    });

    return {
      ...updatedRequest,
      requestedDays: Number(updatedRequest.requestedDays),
    };
  }
}
