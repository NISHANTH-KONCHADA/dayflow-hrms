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

  /**
   * Get all skills assigned to a specific employee
   */
  static async getEmployeeSkills({ companyId, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    const employeeSkills = await prisma.employeeSkill.findMany({
      where: { employeeId },
      include: {
        skill: true,
      },
      orderBy: { addedAt: 'desc' },
    });

    return employeeSkills.map((es) => ({
      skillId: es.skill.id,
      name: es.skill.name,
      addedAt: es.addedAt,
    }));
  }

  /**
   * Assign a skill to an employee (Admin/HR or self-service)
   */
  static async assignSkillToEmployee({ companyId, requestingUser, employeeId, skillId, name }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { user: true },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    const isOwner = requestingUser.employeeId === employeeId || requestingUser.userId === employee.user?.id;
    const isAdminOrHr = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR_OFFICER';

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot modify skills for this employee', 403);
    }

    let targetSkillId = skillId;

    // If skillName provided instead of skillId, find or create the skill in this company
    if (!targetSkillId && name && name.trim()) {
      const trimmedName = name.trim();
      let existingSkill = await prisma.skill.findUnique({
        where: { companyId_name: { companyId, name: trimmedName } },
      });

      if (!existingSkill) {
        existingSkill = await prisma.skill.create({
          data: { companyId, name: trimmedName },
        });
      }
      targetSkillId = existingSkill.id;
    }

    if (!targetSkillId) {
      throw new ApiError('Either skillId or skill name is required', 400);
    }

    // Verify skill belongs to company
    const skill = await prisma.skill.findFirst({
      where: { id: targetSkillId, companyId },
    });

    if (!skill) {
      throw new ApiError('Skill not found in your organization', 404);
    }

    // Upsert employee skill assignment
    const assignment = await prisma.employeeSkill.upsert({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId: targetSkillId,
        },
      },
      update: {},
      create: {
        employeeId,
        skillId: targetSkillId,
      },
      include: {
        skill: true,
      },
    });

    return {
      message: `Skill '${assignment.skill.name}' assigned successfully`,
      skill: {
        skillId: assignment.skill.id,
        name: assignment.skill.name,
        addedAt: assignment.addedAt,
      },
    };
  }

  /**
   * Remove a skill from an employee (Admin/HR or self-service)
   */
  static async removeSkillFromEmployee({ companyId, requestingUser, employeeId, skillId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { user: true },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    const isOwner = requestingUser.employeeId === employeeId || requestingUser.userId === employee.user?.id;
    const isAdminOrHr = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR_OFFICER';

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: You cannot remove skills for this employee', 403);
    }

    const existing = await prisma.employeeSkill.findUnique({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId,
        },
      },
      include: { skill: true },
    });

    if (!existing) {
      throw new ApiError('Skill is not assigned to this employee', 404);
    }

    await prisma.employeeSkill.delete({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId,
        },
      },
    });

    return {
      message: `Skill '${existing.skill.name}' removed from employee successfully`,
      skillId,
    };
  }
}
