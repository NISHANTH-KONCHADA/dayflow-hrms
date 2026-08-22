import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';
import { LoginIdService } from './loginId.service.js';
import { EmailService } from './email.service.js';

export class AuthService {
  /**
   * Register a new Organization/Company along with its primary Admin account.
   */
  static async registerOrganization({
    companyName,
    firstName,
    lastName,
    email,
    phone,
    password,
    currency = 'INR',
    timezone = 'Asia/Kolkata',
    logoUrl,
  }) {
    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });
    if (existingUser) {
      throw new ApiError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const dateOfJoining = new Date();
    const currentYear = dateOfJoining.getFullYear();

    // Execute organization bootstrap in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: companyName.trim(),
          email: trimmedEmail,
          phone: phone || null,
          currency,
          timezone,
          logoUrl: logoUrl || null,
        },
      });

      // 2. Default Payroll Settings
      await tx.payrollSettings.create({
        data: {
          companyId: company.id,
          defaultEmployeePfRate: 12,
          defaultEmployerPfRate: 12,
          defaultProfessionalTax: 200,
        },
      });

      // 3. Default Leave Types
      const leaveTypes = await Promise.all([
        tx.leaveType.create({
          data: {
            companyId: company.id,
            code: 'PAID',
            name: 'Paid Time Off',
            defaultDays: 24,
            requiresProof: false,
            isPaid: true,
          },
        }),
        tx.leaveType.create({
          data: {
            companyId: company.id,
            code: 'SICK',
            name: 'Sick Leave',
            defaultDays: 7,
            requiresProof: true,
            isPaid: true,
          },
        }),
        tx.leaveType.create({
          data: {
            companyId: company.id,
            code: 'UNPAID',
            name: 'Unpaid Leave',
            defaultDays: 0,
            requiresProof: false,
            isPaid: false,
          },
        }),
      ]);

      // 4. Default Departments
      const hrDept = await tx.department.create({
        data: { companyId: company.id, name: 'Human Resources' },
      });
      const engDept = await tx.department.create({
        data: { companyId: company.id, name: 'Engineering' },
      });
      const finDept = await tx.department.create({
        data: { companyId: company.id, name: 'Finance' },
      });
      const genDept = await tx.department.create({
        data: { companyId: company.id, name: 'General Management' },
      });

      // 5. Default Job Positions
      const adminPos = await tx.jobPosition.create({
        data: { companyId: company.id, departmentId: genDept.id, name: 'Managing Director / Admin' },
      });
      await tx.jobPosition.create({
        data: { companyId: company.id, departmentId: hrDept.id, name: 'HR Manager' },
      });
      await tx.jobPosition.create({
        data: { companyId: company.id, departmentId: engDept.id, name: 'Software Engineer' },
      });

      // 6. Generate Admin Login ID
      const loginId = await LoginIdService.generate({
        companyId: company.id,
        firstName,
        lastName,
        dateOfJoining,
      });

      // 7. Create Admin Employee Record
      const adminEmployee = await tx.employee.create({
        data: {
          companyId: company.id,
          employeeCode: 'EMP001',
          loginId,
          firstName: firstName.trim(),
          lastName: lastName ? lastName.trim() : '',
          personalEmail: trimmedEmail,
          phone: phone || null,
          dateOfJoining,
          departmentId: genDept.id,
          jobPositionId: adminPos.id,
        },
      });

      // 8. Create Admin User Account
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          employeeId: adminEmployee.id,
          email: trimmedEmail,
          passwordHash,
          role: 'ADMIN',
          mustChangePassword: false,
          emailVerifiedAt: null,
        },
      });

      // 9. Standard Schedule
      await tx.workingSchedule.create({
        data: {
          companyId: company.id,
          employeeId: adminEmployee.id,
          name: 'Standard 5-Day Schedule',
          workingDays: 5,
          startTime: '09:00',
          endTime: '18:00',
          breakMinutes: 60,
        },
      });

      // 10. Default Leave Allocations
      for (const lt of leaveTypes) {
        if (lt.isPaid) {
          await tx.leaveAllocation.create({
            data: {
              employeeId: adminEmployee.id,
              leaveTypeId: lt.id,
              year: currentYear,
              allocatedDays: lt.defaultDays || 0,
              usedDays: 0,
            },
          });
        }
      }

      return { company, user, employee: adminEmployee };
    });

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'dayflow_hrms_super_secret_jwt_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.company.id,
        employeeId: result.employee.id,
      },
      secret,
      { expiresIn }
    );

    // Generate Email Verification Token and send verification email
    const verificationToken = EmailService.generateVerificationToken({
      userId: result.user.id,
      email: result.user.email,
    });

    try {
      await EmailService.sendVerificationEmail({
        to: result.user.email,
        name: firstName,
        token: verificationToken,
      });
    } catch (mailErr) {
      console.warn('Could not dispatch verification email upon registration:', mailErr.message);
    }

    return {
      token,
      company: result.company,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        mustChangePassword: result.user.mustChangePassword,
        isEmailVerified: false,
        emailVerifiedAt: null,
        employee: result.employee,
      },
      verificationToken,
    };
  }

  static async login({ identifier, password }) {
    if (!identifier || !password) {
      throw new ApiError('Identifier (email or login ID) and password are required', 400);
    }

    const trimmedIdentifier = identifier.trim();

    // Search by email or by employee.loginId
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

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError('Invalid email/login ID or password', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
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
        isEmailVerified: !!user.emailVerifiedAt,
        emailVerifiedAt: user.emailVerifiedAt,
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
      isEmailVerified: !!user.emailVerifiedAt,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      company: user.company,
      employee: user.employee,
    };
  }

  /**
   * Verify User Email Address using signed verification token
   */
  static async verifyEmail({ token }) {
    const decoded = EmailService.verifyVerificationToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, loginId: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new ApiError('User account not found', 404);
    }

    if (user.emailVerifiedAt) {
      return {
        message: 'Email address is already verified',
        isEmailVerified: true,
        emailVerifiedAt: user.emailVerifiedAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isEmailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt,
          company: user.company,
          employee: user.employee,
        },
      };
    }

    const verifiedDate = new Date();
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: verifiedDate },
    });

    return {
      message: 'Email address verified successfully',
      isEmailVerified: true,
      emailVerifiedAt: updatedUser.emailVerifiedAt,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        isEmailVerified: true,
        emailVerifiedAt: updatedUser.emailVerifiedAt,
        company: user.company,
        employee: user.employee,
      },
    };
  }

  /**
   * Resend Verification Email to a registered user
   */
  static async resendVerificationEmail({ email, userId }) {
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employee: true },
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: { employee: true },
      });
    }

    if (!user) {
      throw new ApiError('No user account found with this email address', 404);
    }

    if (user.emailVerifiedAt) {
      throw new ApiError('Email address is already verified', 400);
    }

    const token = EmailService.generateVerificationToken({
      userId: user.id,
      email: user.email,
    });

    await EmailService.sendVerificationEmail({
      to: user.email,
      name: user.employee?.firstName || 'User',
      token,
    });

    return {
      message: 'Verification email has been sent successfully',
      email: user.email,
      token,
    };
  }
}
