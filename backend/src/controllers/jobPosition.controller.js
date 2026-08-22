import { JobPositionService } from '../services/jobPosition.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class JobPositionController {
  /**
   * GET /api/job-positions
   * List job positions with department & employee count
   */
  static async getAll(req, res, next) {
    try {
      const queryParams = req.validatedQuery || req.query || {};
      const { departmentId, search, sortBy, sortOrder } = queryParams;

      const positions = await JobPositionService.getJobPositions({
        companyId: req.user.companyId,
        departmentId,
        search,
        sortBy,
        sortOrder,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Job positions retrieved successfully',
        data: positions,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/job-positions/:id
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const position = await JobPositionService.getJobPositionById({
        companyId: req.user.companyId,
        positionId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: position,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/job-positions
   * Create position (Admin / HR)
   */
  static async create(req, res, next) {
    try {
      const position = await JobPositionService.createJobPosition({
        companyId: req.user.companyId,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Job position created successfully',
        data: position,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT/PATCH /api/job-positions/:id
   * Update position (Admin / HR)
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await JobPositionService.updateJobPosition({
        companyId: req.user.companyId,
        positionId: id,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Job position updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/job-positions/:id
   * Delete position (Admin only)
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await JobPositionService.deleteJobPosition({
        companyId: req.user.companyId,
        positionId: id,
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
