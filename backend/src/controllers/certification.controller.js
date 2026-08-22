import { CertificationService } from '../services/certification.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class CertificationController {
  /**
   * GET /api/employees/:id/certifications
   */
  static async getAll(req, res, next) {
    try {
      const { id } = req.params;
      const certifications = await CertificationService.getEmployeeCertifications({
        companyId: req.user.companyId,
        employeeId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Employee certifications retrieved successfully',
        data: certifications,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/employees/:id/certifications
   */
  static async create(req, res, next) {
    try {
      const { id } = req.params;
      const certification = await CertificationService.addCertification({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Certification added successfully',
        data: certification,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH/PUT /api/employees/:id/certifications/:certificationId
   */
  static async update(req, res, next) {
    try {
      const { id, certificationId } = req.params;
      const updated = await CertificationService.updateCertification({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        certificationId,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Certification updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/employees/:id/certifications/:certificationId
   */
  static async delete(req, res, next) {
    try {
      const { id, certificationId } = req.params;
      const result = await CertificationService.deleteCertification({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        certificationId,
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
