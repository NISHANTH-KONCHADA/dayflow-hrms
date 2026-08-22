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
}
