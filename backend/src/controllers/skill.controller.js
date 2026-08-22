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
}
