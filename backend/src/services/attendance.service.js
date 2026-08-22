import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export class AttendanceService {
  /**
   * Check in employee for a work date.
   */
  static async checkIn({ requestingUser, workDate, checkInTime, notes }) {
    const employeeId = requestingUser.employeeId;
    if (!employeeId) {
      throw new ApiError('No employee profile associated with this user account', 400);
    }

    const targetDate = workDate ? new Date(workDate) : new Date();
    const normalizedWorkDate = new Date(
      Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate())
    );

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
}
