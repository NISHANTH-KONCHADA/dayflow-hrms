import { SalaryService } from '../services/salary.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class SalaryController {
  static async getSalaryStructure(req, res, next) {
    try {
      const { employeeId } = req.params;
      const result = await SalaryService.getSalaryStructure({
        companyId: req.user.companyId,
        employeeId,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createSalaryStructure(req, res, next) {
    try {
      const { employeeId } = req.params;
      const result = await SalaryService.createSalaryStructure({
        companyId: req.user.companyId,
        employeeId,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Salary structure configured successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSalaryStructure(req, res, next) {
    try {
      const { employeeId } = req.params;
      const result = await SalaryService.updateSalaryStructure({
        companyId: req.user.companyId,
        employeeId,
        updateData: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Salary structure updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async previewSalary(req, res, next) {
    try {
      const result = SalaryService.previewSalary(req.body);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Salary breakdown preview generated',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
