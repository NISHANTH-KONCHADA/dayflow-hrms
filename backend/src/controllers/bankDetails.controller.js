import { BankDetailsService } from '../services/bankDetails.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class BankDetailsController {
  /**
   * GET /api/employees/:id/bank-details
   */
  static async get(req, res, next) {
    try {
      const { id } = req.params;
      const bankDetails = await BankDetailsService.getBankDetails({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: bankDetails ? 'Bank details retrieved successfully' : 'No bank details configured',
        data: bankDetails,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH/PUT /api/employees/:id/bank-details
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await BankDetailsService.updateBankDetails({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Bank details updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
