import { PayrollService } from '../services/payroll.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class PayrollController {
  static async getPayrollRuns(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await PayrollService.getPayrollRuns({
        companyId: req.user.companyId,
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

  static async getEmployeePayroll(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { year, month, page, limit } = req.query;

      const result = await PayrollService.getEmployeePayroll({
        companyId: req.user.companyId,
        employeeId,
        year,
        month,
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

  static async createPayrollRun(req, res, next) {
    try {
      const { periodStart, periodEnd } = req.body;
      const result = await PayrollService.createPayrollRun({
        requestingUser: req.user,
        periodStart,
        periodEnd,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Payroll run generated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPayrollRunById(req, res, next) {
    try {
      const { runId } = req.params;
      const result = await PayrollService.getPayrollRunById({
        companyId: req.user.companyId,
        runId,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPayslipsAdmin(req, res, next) {
    try {
      const { employeeId, payrollRunId, status, year, month, search, page, limit } = req.query;
      const result = await PayrollService.getPayslipsAdmin({
        companyId: req.user.companyId,
        employeeId,
        payrollRunId,
        status,
        year,
        month,
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

  static async getPersonalPayslips(req, res, next) {
    try {
      const { year, month, page, limit } = req.query;
      const result = await PayrollService.getPersonalPayslips({
        requestingUser: req.user,
        year,
        month,
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

  static async getPayslipById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await PayrollService.getPayslipById({
        requestingUser: req.user,
        id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
