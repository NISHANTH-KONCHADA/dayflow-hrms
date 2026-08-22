import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class JobPositionService {
  /**
   * Get all job positions for a company with department & employee count
   */
  static async getJobPositions({ companyId, departmentId, search, sortBy = 'name', sortOrder = 'asc' }) {
    const where = { companyId };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy = {
      [sortBy === 'createdAt' ? 'createdAt' : 'name']: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
    };

    const positions = await prisma.jobPosition.findMany({
      where,
      orderBy,
      include: {
        department: {
          select: { id: true, name: true, description: true },
        },
        _count: {
          select: {
            employees: { where: { user: { isActive: true } } },
          },
        },
      },
    });

    return positions.map((pos) => ({
      id: pos.id,
      name: pos.name,
      description: pos.description,
      departmentId: pos.departmentId,
      department: pos.department,
      employeeCount: pos._count.employees,
      createdAt: pos.createdAt,
      updatedAt: pos.updatedAt,
    }));
  }

  /**
   * Get job position by ID
   */
  static async getJobPositionById({ companyId, positionId }) {
    const position = await prisma.jobPosition.findFirst({
      where: { id: positionId, companyId },
      include: {
        department: true,
        _count: {
          select: {
            employees: { where: { user: { isActive: true } } },
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
          },
        },
      },
    });

    if (!position) {
      throw new ApiError('Job position not found', 404);
    }

    return {
      id: position.id,
      name: position.name,
      description: position.description,
      departmentId: position.departmentId,
      department: position.department,
      employeeCount: position._count.employees,
      employees: position.employees,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }

  /**
   * Create new job position (Admin / HR)
   */
  static async createJobPosition({ companyId, data }) {
    const { name, departmentId, description } = data;
    if (!name || !name.trim()) {
      throw new ApiError('Job position name is required', 400);
    }

    const trimmedName = name.trim();

    // Check duplicate name
    const exists = await prisma.jobPosition.findUnique({
      where: { companyId_name: { companyId, name: trimmedName } },
    });
    if (exists) {
      throw new ApiError(`Job position '${trimmedName}' already exists`, 409);
    }

    // Verify department belongs to this company if supplied
    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, companyId },
      });
      if (!dept) {
        throw new ApiError('Specified department does not exist in your organization', 404);
      }
    }

    const position = await prisma.jobPosition.create({
      data: {
        companyId,
        departmentId: departmentId || null,
        name: trimmedName,
        description: description ? description.trim() : null,
      },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    return {
      id: position.id,
      name: position.name,
      description: position.description,
      departmentId: position.departmentId,
      department: position.department,
      employeeCount: position._count.employees,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }

  /**
   * Update job position (Admin / HR)
   */
  static async updateJobPosition({ companyId, positionId, data }) {
    const existing = await prisma.jobPosition.findFirst({
      where: { id: positionId, companyId },
    });

    if (!existing) {
      throw new ApiError('Job position not found', 404);
    }

    const updatePayload = {};

    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (!trimmedName) throw new ApiError('Job position name cannot be empty', 400);

      if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await prisma.jobPosition.findUnique({
          where: { companyId_name: { companyId, name: trimmedName } },
        });
        if (duplicate) {
          throw new ApiError(`Job position '${trimmedName}' already exists`, 409);
        }
      }
      updatePayload.name = trimmedName;
    }

    if (data.departmentId !== undefined) {
      if (data.departmentId) {
        const dept = await prisma.department.findFirst({
          where: { id: data.departmentId, companyId },
        });
        if (!dept) {
          throw new ApiError('Specified department does not exist in your organization', 404);
        }
        updatePayload.departmentId = data.departmentId;
      } else {
        updatePayload.departmentId = null;
      }
    }

    if (data.description !== undefined) {
      updatePayload.description = data.description ? data.description.trim() : null;
    }

    const updated = await prisma.jobPosition.update({
      where: { id: positionId },
      data: updatePayload,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      departmentId: updated.departmentId,
      department: updated.department,
      employeeCount: updated._count.employees,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete job position (Admin only)
   */
  static async deleteJobPosition({ companyId, positionId }) {
    const existing = await prisma.jobPosition.findFirst({
      where: { id: positionId, companyId },
      include: {
        _count: { select: { employees: true } },
      },
    });

    if (!existing) {
      throw new ApiError('Job position not found', 404);
    }

    if (existing._count.employees > 0) {
      throw new ApiError(
        `Cannot delete job position '${existing.name}' because ${existing._count.employees} employee(s) are currently assigned to it. Please reassign them first.`,
        400
      );
    }

    await prisma.jobPosition.delete({
      where: { id: positionId },
    });

    return {
      message: `Job position '${existing.name}' deleted successfully`,
      positionId,
    };
  }
}
