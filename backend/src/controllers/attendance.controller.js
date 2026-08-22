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

  static async checkOut(req, res, next) {
    try {
      const { workDate, checkOutTime, notes } = req.body || {};
      const result = await AttendanceService.checkOut({
        requestingUser: req.user,
        workDate,
        checkOutTime,
        notes,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Checked out successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPersonalAttendance(req, res, next) {
    try {
      const { startDate, endDate, status, page, limit } = req.query;
      const result = await AttendanceService.getPersonalAttendance({
        requestingUser: req.user,
        startDate,
        endDate,
        status,
        page,
        limit,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPersonalSummary(req, res, next) {
    try {
      const { month, year, startDate, endDate } = req.query;
      const result = await AttendanceService.getPersonalSummary({
        requestingUser: req.user,
        month,
        year,
        startDate,
        endDate,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAdminAttendance(req, res, next) {
    try {
      const { startDate, endDate, departmentId, employeeId, status, search, page, limit } = req.query;
      const result = await AttendanceService.getAdminAttendance({
        companyId: req.user.companyId,
        startDate,
        endDate,
        departmentId,
        employeeId,
        status,
        search,
        page,
        limit,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate, status, page, limit } = req.query;

      const result = await AttendanceService.getEmployeeAttendance({
        companyId: req.user.companyId,
        targetEmployeeId: id,
        startDate,
        endDate,
        status,
        page,
        limit,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeSummary(req, res, next) {
    try {
      const { id } = req.params;
      const { month, year, startDate, endDate } = req.query;

      const result = await AttendanceService.getEmployeeSummary({
        companyId: req.user.companyId,
        targetEmployeeId: id,
        month,
        year,
        startDate,
        endDate,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkingSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AttendanceService.getWorkingSchedule({
        companyId: req.user.companyId,
        targetEmployeeId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateWorkingSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AttendanceService.updateWorkingSchedule({
        companyId: req.user.companyId,
        targetEmployeeId: id,
        updateData: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Working schedule updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
