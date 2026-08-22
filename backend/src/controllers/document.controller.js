import { DocumentService } from '../services/document.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class DocumentController {
  /**
   * GET /api/employees/:id/documents
   */
  static async getAll(req, res, next) {
    try {
      const { id } = req.params;
      const { type } = req.query;

      const documents = await DocumentService.getEmployeeDocuments({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        type,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Employee documents retrieved successfully',
        data: documents,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/employees/:id/documents
   */
  static async create(req, res, next) {
    try {
      const { id } = req.params;
      const document = await DocumentService.addDocument({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        data: req.body,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Document uploaded successfully',
        data: document,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/employees/:id/documents/:documentId
   */
  static async delete(req, res, next) {
    try {
      const { id, documentId } = req.params;
      const result = await DocumentService.deleteDocument({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        documentId,
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
