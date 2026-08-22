import { SkillService } from '../services/skill.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class SkillController {
  /**
   * GET /api/skills
   * List skills with employee count
   */
  static async getAll(req, res, next) {
    try {
      const queryParams = req.validatedQuery || req.query || {};
      const { search, sortBy, sortOrder } = queryParams;

      const skills = await SkillService.getSkills({
        companyId: req.user.companyId,
        search,
        sortBy,
        sortOrder,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Skills retrieved successfully',
        data: skills,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/skills
   * Create skill (Admin / HR)
   */
  static async create(req, res, next) {
    try {
      const skill = await SkillService.createSkill({
        companyId: req.user.companyId,
        name: req.body.name,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Skill created successfully',
        data: skill,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/skills/:id
   * Delete skill (Admin / HR)
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await SkillService.deleteSkill({
        companyId: req.user.companyId,
        skillId: id,
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

  /**
   * GET /api/employees/:id/skills
   * List skills of an employee
   */
  static async getEmployeeSkills(req, res, next) {
    try {
      const { id } = req.params;
      const skills = await SkillService.getEmployeeSkills({
        companyId: req.user.companyId,
        employeeId: id,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Employee skills retrieved successfully',
        data: skills,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/employees/:id/skills
   * Assign a skill to an employee
   */
  static async assignSkill(req, res, next) {
    try {
      const { id } = req.params;
      const { skillId, name } = req.body;

      const result = await SkillService.assignSkillToEmployee({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        skillId,
        name,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: result.message,
        data: result.skill,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/employees/:id/skills/:skillId
   * Remove a skill from an employee
   */
  static async removeSkill(req, res, next) {
    try {
      const { id, skillId } = req.params;
      const result = await SkillService.removeSkillFromEmployee({
        companyId: req.user.companyId,
        requestingUser: req.user,
        employeeId: id,
        skillId,
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
