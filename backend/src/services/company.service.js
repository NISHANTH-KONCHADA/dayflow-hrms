import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export class CompanyService {
  static async getDepartments(companyId) {
    return prisma.department.findMany({
      where: { companyId },
      include: {
        _count: { select: { employees: true } },
        positions: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createDepartment(companyId, { name, description }) {
    if (!name) throw new ApiError('Department name is required', 400);

    const exists = await prisma.department.findUnique({
      where: { companyId_name: { companyId, name: name.trim() } },
    });
    if (exists) throw new ApiError('Department with this name already exists', 409);

    return prisma.department.create({
      data: { companyId, name: name.trim(), description: description || null },
    });
  }

  static async getJobPositions(companyId, departmentId) {
    const where = { companyId };
    if (departmentId) where.departmentId = departmentId;

    return prisma.jobPosition.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createJobPosition(companyId, { name, departmentId, description }) {
    if (!name) throw new ApiError('Position name is required', 400);

    const exists = await prisma.jobPosition.findUnique({
      where: { companyId_name: { companyId, name: name.trim() } },
    });
    if (exists) throw new ApiError('Position with this name already exists', 409);

    return prisma.jobPosition.create({
      data: {
        companyId,
        name: name.trim(),
        departmentId: departmentId || null,
        description: description || null,
      },
    });
  }

  static async getSkills(companyId) {
    return prisma.skill.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  static async createSkill(companyId, { name }) {
    if (!name) throw new ApiError('Skill name is required', 400);

    const exists = await prisma.skill.findUnique({
      where: { companyId_name: { companyId, name: name.trim() } },
    });
    if (exists) throw new ApiError('Skill already exists', 409);

    return prisma.skill.create({
      data: { companyId, name: name.trim() },
    });
  }

  static async getLeaveTypes(companyId) {
    return prisma.leaveType.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
