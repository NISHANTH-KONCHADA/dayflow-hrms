import { EmployeeService } from '../services/employee.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class EmployeeController {
  static async create(req, res, next) {
    try {
      const result = await EmployeeService.createEmployee({
        requestingUser: req.user,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Employee created and onboarded successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { search, departmentId, status, page, limit } = req.query;
      const result = await EmployeeService.getEmployees({
        companyId: req.user.companyId,
        search,
        departmentId,
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

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await EmployeeService.getEmployeeById({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: employee,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await EmployeeService.updateEmployee({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        updateData: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Employee details updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await EmployeeService.deleteEmployee({
        companyId: req.user.companyId,
        employeeId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}
