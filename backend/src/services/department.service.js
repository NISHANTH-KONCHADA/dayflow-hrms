import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class DepartmentService {
  /**
   * Get all departments for a company with employee & position counts
   */
  static async getDepartments({ companyId, search, sortBy = 'name', sortOrder = 'asc' }) {
    const where = { companyId };

    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const orderBy = {
      [sortBy === 'createdAt' ? 'createdAt' : 'name']: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
    };

    const departments = await prisma.department.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            employees: { where: { user: { isActive: true } } },
            positions: true,
          },
        },
        positions: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: { select: { employees: true } },
          },
        },
      },
    });

    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      employeeCount: dept._count.employees,
      positionCount: dept._count.positions,
      positions: dept.positions,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    }));
  }

  /**
   * Get department by ID
   */
  static async getDepartmentById({ companyId, departmentId }) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, companyId },
      include: {
        _count: {
          select: {
            employees: { where: { user: { isActive: true } } },
            positions: true,
          },
        },
        positions: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: { select: { employees: true } },
          },
        },
        employees: {
          where: { user: { isActive: true } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            loginId: true,
            profilePictureUrl: true,
            jobPosition: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!dept) {
      throw new ApiError('Department not found', 404);
    }

    return {
      id: dept.id,
      name: dept.name,
      description: dept.description,
      employeeCount: dept._count.employees,
      positionCount: dept._count.positions,
      positions: dept.positions,
      employees: dept.employees,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    };
  }

  /**
   * Create new department (Admin/HR only)
   */
  static async createDepartment({ companyId, data }) {
    const { name, description } = data;
    if (!name || !name.trim()) {
      throw new ApiError('Department name is required', 400);
    }

    const trimmedName = name.trim();

    const exists = await prisma.department.findUnique({
      where: { companyId_name: { companyId, name: trimmedName } },
    });
    if (exists) {
      throw new ApiError(`Department '${trimmedName}' already exists`, 409);
    }

    const department = await prisma.department.create({
      data: {
        companyId,
        name: trimmedName,
        description: description ? description.trim() : null,
      },
      include: {
        _count: { select: { employees: true, positions: true } },
        positions: true,
      },
    });

    return {
      id: department.id,
      name: department.name,
      description: department.description,
      employeeCount: department._count.employees,
      positionCount: department._count.positions,
      positions: department.positions,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }

  /**
   * Update department (Admin/HR only)
   */
  static async updateDepartment({ companyId, departmentId, data }) {
    const existing = await prisma.department.findFirst({
      where: { id: departmentId, companyId },
    });

    if (!existing) {
      throw new ApiError('Department not found', 404);
    }

    const updatePayload = {};

    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (!trimmedName) throw new ApiError('Department name cannot be empty', 400);

      if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await prisma.department.findUnique({
          where: { companyId_name: { companyId, name: trimmedName } },
        });
        if (duplicate) {
          throw new ApiError(`Department '${trimmedName}' already exists`, 409);
        }
      }
      updatePayload.name = trimmedName;
    }

    if (data.description !== undefined) {
      updatePayload.description = data.description ? data.description.trim() : null;
    }

    const updated = await prisma.department.update({
      where: { id: departmentId },
      data: updatePayload,
      include: {
        _count: { select: { employees: true, positions: true } },
        positions: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      employeeCount: updated._count.employees,
      positionCount: updated._count.positions,
      positions: updated.positions,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete department (Admin only)
   */
  static async deleteDepartment({ companyId, departmentId }) {
    const existing = await prisma.department.findFirst({
      where: { id: departmentId, companyId },
      include: {
        _count: { select: { employees: true, positions: true } },
      },
    });

    if (!existing) {
      throw new ApiError('Department not found', 404);
    }

    if (existing._count.employees > 0) {
      throw new ApiError(
        `Cannot delete department '${existing.name}' because ${existing._count.employees} employee(s) are currently assigned to it. Please reassign them first.`,
        400
      );
    }

    await prisma.$transaction(async (tx) => {
      // Unlink or delete job positions assigned to this department
      await tx.jobPosition.updateMany({
        where: { departmentId },
        data: { departmentId: null },
      });

      await tx.department.delete({
        where: { id: departmentId },
      });
    });

    return {
      message: `Department '${existing.name}' deleted successfully`,
      departmentId,
    };
  }
}
