import { PrivateInfoService } from '../services/privateInfo.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class PrivateInfoController {
  /**
   * GET /api/employees/:id/private-info
   */
  static async get(req, res, next) {
    try {
      const { id } = req.params;
      const privateInfo = await PrivateInfoService.getPrivateInfo({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Private information retrieved successfully',
        data: privateInfo,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH/PUT /api/employees/:id/private-info
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await PrivateInfoService.updatePrivateInfo({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Private information updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
