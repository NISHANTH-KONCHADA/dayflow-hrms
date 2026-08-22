import { EmployeeService } from '../services/employee.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class EmployeeController {
  /**
   * GET /api/employees
   * List employees with search, filters, pagination, and calculated work status
   */
  static async getAll(req, res, next) {
    try {
      const queryParams = req.validatedQuery || req.query || {};
      const {
        search,
        departmentId,
        jobPositionId,
        role,
        status,
        sortBy,
        sortOrder,
        page,
        limit,
      } = queryParams;

      const result = await EmployeeService.getEmployees({
        companyId: req.user.companyId,
        search,
        departmentId,
        jobPositionId,
        role,
        status,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Employees retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/employees
   * Create new employee with auto-provisioning
   */
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

  /**
   * GET /api/employees/:id
   */
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

  /**
   * PUT /api/employees/:id
   */
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

  /**
   * DELETE /api/employees/:id
   */
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
