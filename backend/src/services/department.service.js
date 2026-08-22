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

    const formatted = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      employeeCount: dept._count.employees,
      positionCount: dept._count.positions,
      positions: dept.positions,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    }));

    return formatted;
  }
}
