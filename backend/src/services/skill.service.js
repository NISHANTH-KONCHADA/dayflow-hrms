import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class SkillService {
  /**
   * Get all skills for a company with employee count
   */
  static async getSkills({ companyId, search, sortBy = 'name', sortOrder = 'asc' }) {
    const where = { companyId };

    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const orderBy = {
      [sortBy === 'createdAt' ? 'createdAt' : 'name']: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
    };

    const skills = await prisma.skill.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            employees: { where: { employee: { user: { isActive: true } } } },
          },
        },
      },
    });

    return skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      employeeCount: skill._count.employees,
      createdAt: skill.createdAt,
    }));
  }

  /**
   * Create new skill (Admin / HR)
   */
  static async createSkill({ companyId, name }) {
    if (!name || !name.trim()) {
      throw new ApiError('Skill name is required', 400);
    }

    const trimmedName = name.trim();

    const exists = await prisma.skill.findUnique({
      where: { companyId_name: { companyId, name: trimmedName } },
    });
    if (exists) {
      throw new ApiError(`Skill '${trimmedName}' already exists`, 409);
    }

    const skill = await prisma.skill.create({
      data: {
        companyId,
        name: trimmedName,
      },
    });

    return {
      id: skill.id,
      name: skill.name,
      employeeCount: 0,
      createdAt: skill.createdAt,
    };
  }

  /**
   * Delete skill (Admin / HR)
   */
  static async deleteSkill({ companyId, skillId }) {
    const skill = await prisma.skill.findFirst({
      where: { id: skillId, companyId },
    });

    if (!skill) {
      throw new ApiError('Skill not found', 404);
    }

    await prisma.skill.delete({
      where: { id: skillId },
    });

    return {
      message: `Skill '${skill.name}' deleted successfully`,
      skillId,
    };
  }
}
