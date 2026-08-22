import { DepartmentService } from '../services/department.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class DepartmentController {
  /**
   * GET /api/departments
   * List departments with employee & position counts
   */
  static async getAll(req, res, next) {
    try {
      const queryParams = req.validatedQuery || req.query || {};
      const { search, sortBy, sortOrder } = queryParams;

      const departments = await DepartmentService.getDepartments({
        companyId: req.user.companyId,
        search,
        sortBy,
        sortOrder,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Departments retrieved successfully',
        data: departments,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/departments/:id
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const department = await DepartmentService.getDepartmentById({
        companyId: req.user.companyId,
        departmentId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/departments
   * Create department (Admin / HR)
   */
  static async create(req, res, next) {
    try {
      const department = await DepartmentService.createDepartment({
        companyId: req.user.companyId,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Department created successfully',
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT/PATCH /api/departments/:id
   * Update department (Admin / HR)
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await DepartmentService.updateDepartment({
        companyId: req.user.companyId,
        departmentId: id,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Department updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/departments/:id
   * Delete department (Admin only)
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await DepartmentService.deleteDepartment({
        companyId: req.user.companyId,
        departmentId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
