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
}
