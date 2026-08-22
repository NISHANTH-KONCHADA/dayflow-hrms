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
}
