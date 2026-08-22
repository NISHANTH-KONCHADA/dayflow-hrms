import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

export class AuthService {
  static async login({ identifier, password }) {
    if (!identifier || !password) {
      throw new ApiError('Identifier (email or login ID) and password are required', 400);
    }

    const trimmedIdentifier = identifier.trim();

    // 1. Search by email or by employee.loginId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmedIdentifier, mode: 'insensitive' } },
          { employee: { loginId: { equals: trimmedIdentifier, mode: 'insensitive' } } },
        ],
      },
      include: {
        company: {
          select: { id: true, name: true, currency: true, timezone: true, logoUrl: true },
        },
        employee: {
          include: {
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError('Invalid email/login ID or password', 401);
    }

    if (!user.isActive) {
      throw new ApiError('Account is disabled. Please contact your administrator.', 403);
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError('Invalid email/login ID or password', 401);
    }

    // 3. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 4. Generate JWT
    const secret = process.env.JWT_SECRET || 'dayflow_hrms_super_secret_jwt_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        employeeId: user.employeeId,
      },
      secret,
      { expiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        company: user.company,
        employee: user.employee,
      },
    };
  }

  static async changePassword({ userId, currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw new ApiError('Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw new ApiError('New password must be at least 8 characters long', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ApiError('Current password is incorrect', 400);
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return { message: 'Password updated successfully' };
  }

  static async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: { id: true, name: true, currency: true, timezone: true, logoUrl: true },
        },
        employee: {
          include: {
            department: true,
            jobPosition: true,
            manager: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true, loginId: true },
            },
            skills: {
              include: { skill: true },
            },
            workingSchedule: true,
            bankDetails: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      company: user.company,
      employee: user.employee,
    };
  }
}
