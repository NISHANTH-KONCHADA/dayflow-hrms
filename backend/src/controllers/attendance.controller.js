import { AttendanceService } from '../services/attendance.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AttendanceController {
  static async checkIn(req, res, next) {
    try {
      const { workDate, checkInTime, notes } = req.body || {};
      const result = await AttendanceService.checkIn({
        requestingUser: req.user,
        workDate,
        checkInTime,
        notes,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Checked in successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
