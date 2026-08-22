import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { ApiError } from '../utils/apiResponse.js';

export class CredentialService {
  /**
   * Generates Login ID in format: [CompanyCode][2 letters First][2 letters Last][Year][4 digit Serial]
   * Example: OIJODO20260001
   */
  static async generateLoginId({ companyId, firstName, lastName, dateOfJoining }) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    let companyCode = 'OI';
    if (company && company.name) {
      const words = company.name.trim().split(/\s+/);
      if (words.length >= 2) {
        companyCode = (words[0][0] + words[1][0]).toUpperCase();
      } else if (words[0].length >= 2) {
        companyCode = words[0].slice(0, 2).toUpperCase();
      }
    }

    const cleanFirst = (firstName || 'EM').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const cleanLast = (lastName || 'XX').replace(/[^a-zA-Z]/g, '').toUpperCase();

    const fn2 = (cleanFirst + 'XX').slice(0, 2);
    const ln2 = (cleanLast + 'XX').slice(0, 2);
    const nameCode = fn2 + ln2;

    const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();
    const year = joiningDate.getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const countInYear = await prisma.employee.count({
      where: {
        companyId,
        dateOfJoining: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    const serialNum = (countInYear + 1).toString().padStart(4, '0');
    let loginId = `${companyCode}${nameCode}${year}${serialNum}`;

    let exists = await prisma.employee.findFirst({
      where: { loginId },
    });

    let extraIncrement = 1;
    while (exists) {
      const altSerial = (countInYear + 1 + extraIncrement).toString().padStart(4, '0');
      loginId = `${companyCode}${nameCode}${year}${altSerial}`;
      exists = await prisma.employee.findFirst({
        where: { loginId },
      });
      extraIncrement++;
    }

    return loginId;
  }

  /**
   * Generates standard Employee Code (e.g. EMP001, EMP002)
   */
  static async generateEmployeeCode({ companyId }) {
    const totalEmployees = await prisma.employee.count({ where: { companyId } });
    return `EMP${(totalEmployees + 1).toString().padStart(3, '0')}`;
  }

  /**
   * Generates secure temporary password with uppercase, lowercase, numbers, and special symbols
   */
  static generateTemporaryPassword() {
    const randomHex = crypto.randomBytes(3).toString('hex');
    return `Pass@${randomHex}!`;
  }

  /**
   * Re-generate / reset initial credentials for an employee (Admin/HR action)
   */
  static async resetEmployeeCredentials({ companyId, requestingUser, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        OR: [
          { id: employeeId },
          { userId: employeeId },
          { user: { id: employeeId } },
        ],
      },
      include: { user: true },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    if (!employee.user) {
      throw new ApiError('No user account linked to this employee', 400);
    }

    const temporaryPassword = CredentialService.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: { id: employee.user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    return {
      message: 'Employee credentials have been reset successfully',
      employeeId: employee.id,
      email: employee.user.email,
      loginId: employee.loginId,
      temporaryPassword,
      mustChangePassword: true,
      note: 'The employee must reset this temporary password upon next login.',
    };
  }
}
