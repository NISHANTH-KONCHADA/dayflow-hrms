import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

/**
 * Normalizes a date string or Date object to UTC midnight (00:00:00.000Z).
 */
function normalizeWorkDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Helper to calculate workMinutes, extraMinutes, and AttendanceStatus.
 */
function calculateAttendanceMetrics(checkIn, checkOut, schedule = null, hasApprovedLeave = false) {
  if (hasApprovedLeave) {
    return {
      workMinutes: 0,
      extraMinutes: 0,
      status: 'LEAVE',
    };
  }

  if (!checkIn) {
    return {
      workMinutes: 0,
      extraMinutes: 0,
      status: 'ABSENT',
    };
  }

  if (!checkOut) {
    return {
      workMinutes: 0,
      extraMinutes: 0,
      status: 'PRESENT',
    };
  }

  // Calculate gross duration in minutes
  const grossMinutes = Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60)));

  // Break duration from schedule or default 60 minutes (only apply break if shift is >= 4 hours)
  const configuredBreak = schedule?.breakMinutes ?? 60;
  const actualBreak = grossMinutes >= 240 ? configuredBreak : 0;

  const workMinutes = Math.max(0, grossMinutes - actualBreak);

  // Expected work minutes (default 8 hours = 480 mins)
  let expectedWorkMinutes = 480;
  if (schedule?.startTime && schedule?.endTime) {
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const grossScheduleMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (grossScheduleMinutes > 0) {
      expectedWorkMinutes = Math.max(0, grossScheduleMinutes - configuredBreak);
    }
  }

  const extraMinutes = Math.max(0, workMinutes - expectedWorkMinutes);

  // Status threshold calculation
  let status = 'ABSENT';
  if (workMinutes >= expectedWorkMinutes * 0.75) {
    status = 'PRESENT';
  } else if (workMinutes >= expectedWorkMinutes * 0.25) {
    status = 'HALF_DAY';
  }

  return {
    workMinutes,
    extraMinutes,
    status,
  };
}

export class AttendanceService {
  /**
   * Check in employee for a work date.
   */
  static async checkIn({ requestingUser, workDate, checkInTime, notes }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    const normalizedWorkDate = normalizeWorkDate(workDate);
    const actualCheckIn = checkInTime ? new Date(checkInTime) : new Date();

    let record = await prisma.attendance.findUnique({
      where: {
        employeeId_workDate: {
          employeeId,
          workDate: normalizedWorkDate,
        },
      },
    });

    if (record) {
      if (record.checkIn) {
        throw new ApiError('Already checked in for today', 400);
      }
      record = await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkIn: actualCheckIn,
          status: record.status === 'ABSENT' ? 'PRESENT' : record.status,
          notes: notes !== undefined ? notes : record.notes,
        },
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          employeeId,
          workDate: normalizedWorkDate,
          checkIn: actualCheckIn,
          status: 'PRESENT',
          notes: notes || null,
        },
      });
    }

    return record;
  }

  /**
   * Check out employee for a work date.
   */
  static async checkOut({ requestingUser, workDate, checkOutTime, notes }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    const normalizedWorkDate = normalizeWorkDate(workDate);
    const actualCheckOut = checkOutTime ? new Date(checkOutTime) : new Date();

    const record = await prisma.attendance.findUnique({
      where: {
        employeeId_workDate: {
          employeeId,
          workDate: normalizedWorkDate,
        },
      },
    });

    if (!record || !record.checkIn) {
      throw new ApiError('Cannot check out without checking in first', 400);
    }

    if (record.checkOut) {
      throw new ApiError('Already checked out for today', 400);
    }

    // Fetch employee schedule if available
    const schedule = await prisma.workingSchedule.findUnique({
      where: { employeeId },
    });

    // Check if there is an approved leave for this date
    const approvedLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: normalizedWorkDate },
        endDate: { gte: normalizedWorkDate },
      },
    });

    const metrics = calculateAttendanceMetrics(
      record.checkIn,
      actualCheckOut,
      schedule,
      Boolean(approvedLeave)
    );

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: actualCheckOut,
        workMinutes: metrics.workMinutes,
        extraMinutes: metrics.extraMinutes,
        status: metrics.status,
        notes: notes !== undefined ? notes : record.notes,
      },
    });

    return updated;
  }

  /**
   * Get personal attendance history for current logged in employee.
   */
  static async getPersonalAttendance({ requestingUser, startDate, endDate, status, page = 1, limit = 20 }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    return this.getEmployeeAttendance({
      companyId: requestingUser.companyId,
      targetEmployeeId: employeeId,
      startDate,
      endDate,
      status,
      page,
      limit,
    });
  }

  /**
   * Get personal attendance summary for current logged in employee.
   */
  static async getPersonalSummary({ requestingUser, month, year, startDate, endDate }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    return this.getEmployeeSummary({
      companyId: requestingUser.companyId,
      targetEmployeeId: employeeId,
      month,
      year,
      startDate,
      endDate,
    });
  }

  /**
   * Admin view: Get attendance records across company with filters.
   */
  static async getAdminAttendance({
    companyId,
    startDate,
    endDate,
    departmentId,
    employeeId,
    status,
    search,
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
      ...(status && { status }),
    };

    if (startDate || endDate) {
      where.workDate = {};
      if (startDate) {
        where.workDate.gte = normalizeWorkDate(startDate);
      }
      if (endDate) {
        where.workDate.lte = normalizeWorkDate(endDate);
      }
    }

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              profilePictureUrl: true,
              department: {
                select: { id: true, name: true },
              },
              jobPosition: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { workDate: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formattedRecords = records.map((record) => ({
      ...record,
      workHours: Math.round((record.workMinutes / 60) * 100) / 100,
      extraHours: Math.round((record.extraMinutes / 60) * 100) / 100,
    }));

    return {
      records: formattedRecords,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get attendance history for a specific employee.
   */
  static async getEmployeeAttendance({
    companyId,
    targetEmployeeId,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 20,
  }) {
    // Verify employee exists in company
    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      employeeId: targetEmployeeId,
      ...(status && { status }),
    };

    if (startDate || endDate) {
      where.workDate = {};
      if (startDate) {
        where.workDate.gte = normalizeWorkDate(startDate);
      }
      if (endDate) {
        where.workDate.lte = normalizeWorkDate(endDate);
      }
    }

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        orderBy: { workDate: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const formattedRecords = records.map((record) => ({
      ...record,
      workHours: Math.round((record.workMinutes / 60) * 100) / 100,
      extraHours: Math.round((record.extraMinutes / 60) * 100) / 100,
    }));

    return {
      records: formattedRecords,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get summary for a specific employee.
   */
  static async getEmployeeSummary({ companyId, targetEmployeeId, month, year, startDate, endDate }) {
    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const where = { employeeId: targetEmployeeId };

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const startOfMonth = new Date(Date.UTC(y, m - 1, 1));
      const endOfMonth = new Date(Date.UTC(y, m, 0));
      where.workDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (startDate || endDate) {
      where.workDate = {};
      if (startDate) where.workDate.gte = normalizeWorkDate(startDate);
      if (endDate) where.workDate.lte = normalizeWorkDate(endDate);
    }

    const records = await prisma.attendance.findMany({
      where,
    });

    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let leaveDays = 0;
    let totalWorkMinutes = 0;
    let totalExtraMinutes = 0;

    for (const r of records) {
      if (r.status === 'PRESENT') presentDays++;
      else if (r.status === 'ABSENT') absentDays++;
      else if (r.status === 'HALF_DAY') halfDays++;
      else if (r.status === 'LEAVE') leaveDays++;

      totalWorkMinutes += r.workMinutes || 0;
      totalExtraMinutes += r.extraMinutes || 0;
    }

    return {
      employeeId: targetEmployeeId,
      totalDays: records.length,
      presentDays,
      absentDays,
      halfDays,
      leaveDays,
      totalWorkMinutes,
      totalExtraMinutes,
      totalWorkHours: Math.round((totalWorkMinutes / 60) * 100) / 100,
      totalExtraHours: Math.round((totalExtraMinutes / 60) * 100) / 100,
    };
  }

  /**
   * Get employee working schedule.
   */
  static async getWorkingSchedule({ companyId, targetEmployeeId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const schedule = await prisma.workingSchedule.findUnique({
      where: { employeeId: targetEmployeeId },
    });

    if (!schedule) {
      return {
        employeeId: targetEmployeeId,
        name: 'Standard 5-Day Schedule',
        workingDays: 5,
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        weeklyHours: 40.0,
        effectiveFrom: null,
      };
    }

    return schedule;
  }

  /**
   * Update or create employee working schedule.
   */
  static async updateWorkingSchedule({ companyId, targetEmployeeId, updateData }) {
    const employee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found in company', 404);
    }

    const existingSchedule = await prisma.workingSchedule.findUnique({
      where: { employeeId: targetEmployeeId },
    });

    const workingDays = updateData.workingDays ?? existingSchedule?.workingDays ?? 5;
    const startTime = updateData.startTime ?? existingSchedule?.startTime ?? '09:00';
    const endTime = updateData.endTime ?? existingSchedule?.endTime ?? '18:00';
    const breakMinutes = updateData.breakMinutes ?? existingSchedule?.breakMinutes ?? 60;
    const name = updateData.name ?? existingSchedule?.name ?? 'Standard 5-Day Schedule';

    // Calculate weeklyHours
    let weeklyHours = updateData.weeklyHours;
    if (weeklyHours === undefined || weeklyHours === null) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const grossMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      const netDailyMinutes = Math.max(0, grossMinutes - breakMinutes);
      weeklyHours = Math.round(((netDailyMinutes / 60) * workingDays) * 100) / 100;
    }

    const effectiveFrom = updateData.effectiveFrom
      ? new Date(updateData.effectiveFrom)
      : (existingSchedule?.effectiveFrom ?? new Date());

    const upsertedSchedule = await prisma.workingSchedule.upsert({
      where: { employeeId: targetEmployeeId },
      update: {
        name,
        workingDays,
        startTime,
        endTime,
        breakMinutes,
        weeklyHours,
        effectiveFrom,
      },
      create: {
        companyId,
        employeeId: targetEmployeeId,
        name,
        workingDays,
        startTime,
        endTime,
        breakMinutes,
        weeklyHours,
        effectiveFrom,
      },
    });

    return upsertedSchedule;
  }
}
