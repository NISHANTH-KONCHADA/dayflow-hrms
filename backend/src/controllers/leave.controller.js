import { LeaveService } from '../services/leave.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class LeaveController {
  /**
   * ==========================================
   * LEAVE TYPES
   * ==========================================
   */

  static async getLeaveTypes(req, res, next) {
    try {
      const { isActive } = req.query;
      const result = await LeaveService.getLeaveTypes({
        companyId: req.user.companyId,
        isActive,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createLeaveType(req, res, next) {
    try {
      const { code, name, defaultDays, requiresProof, isPaid, isActive } = req.body;
      const result = await LeaveService.createLeaveType({
        companyId: req.user.companyId,
        code,
        name,
        defaultDays,
        requiresProof,
        isPaid,
        isActive,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Leave type created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateLeaveType(req, res, next) {
    try {
      const { id } = req.params;
      const { name, defaultDays, requiresProof, isPaid, isActive } = req.body;

      const result = await LeaveService.updateLeaveType({
        companyId: req.user.companyId,
        id,
        name,
        defaultDays,
        requiresProof,
        isPaid,
        isActive,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Leave type updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteLeaveType(req, res, next) {
    try {
      const { id } = req.params;
      const result = await LeaveService.deleteLeaveType({
        companyId: req.user.companyId,
        id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * ==========================================
   * LEAVE ALLOCATIONS
   * ==========================================
   */

  static async getPersonalAllocations(req, res, next) {
    try {
      const { year } = req.query;
      const result = await LeaveService.getPersonalAllocations({
        requestingUser: req.user,
        year,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeAllocations(req, res, next) {
    try {
      const { id } = req.params;
      const { year } = req.query;

      const result = await LeaveService.getEmployeeAllocations({
        companyId: req.user.companyId,
        targetEmployeeId: id,
        year,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createEmployeeAllocation(req, res, next) {
    try {
      const { id } = req.params;
      const { leaveTypeId, year, allocatedDays } = req.body;

      const result = await LeaveService.createEmployeeAllocation({
        companyId: req.user.companyId,
        targetEmployeeId: id,
        leaveTypeId,
        year,
        allocatedDays,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Leave allocated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEmployeeAllocation(req, res, next) {
    try {
      const { id, allocationId } = req.params;
      const { allocatedDays, usedDays } = req.body;

      const result = await LeaveService.updateEmployeeAllocation({
        companyId: req.user.companyId,
        targetEmployeeId: id,
        allocationId,
        allocatedDays,
        usedDays,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Leave allocation updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
