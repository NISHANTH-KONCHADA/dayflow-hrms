import { CompanyService } from '../services/company.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class CompanyController {
  static async getDepartments(req, res, next) {
    try {
      const data = await CompanyService.getDepartments(req.user.companyId);
      return ApiResponse.success(res, { data });
    } catch (err) {
      next(err);
    }
  }

  static async createDepartment(req, res, next) {
    try {
      const data = await CompanyService.createDepartment(req.user.companyId, req.body);
      return ApiResponse.success(res, { statusCode: 201, message: 'Department created', data });
    } catch (err) {
      next(err);
    }
  }

  static async getJobPositions(req, res, next) {
    try {
      const { departmentId } = req.query;
      const data = await CompanyService.getJobPositions(req.user.companyId, departmentId);
      return ApiResponse.success(res, { data });
    } catch (err) {
      next(err);
    }
  }

  static async createJobPosition(req, res, next) {
    try {
      const data = await CompanyService.createJobPosition(req.user.companyId, req.body);
      return ApiResponse.success(res, { statusCode: 201, message: 'Job Position created', data });
    } catch (err) {
      next(err);
    }
  }

  static async getSkills(req, res, next) {
    try {
      const data = await CompanyService.getSkills(req.user.companyId);
      return ApiResponse.success(res, { data });
    } catch (err) {
      next(err);
    }
  }

  static async createSkill(req, res, next) {
    try {
      const data = await CompanyService.createSkill(req.user.companyId, req.body);
      return ApiResponse.success(res, { statusCode: 201, message: 'Skill created', data });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaveTypes(req, res, next) {
    try {
      const data = await CompanyService.getLeaveTypes(req.user.companyId);
      return ApiResponse.success(res, { data });
    } catch (err) {
      next(err);
    }
  }
}
