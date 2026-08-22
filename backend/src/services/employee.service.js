import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';
import { LoginIdService } from './loginId.service.js';

export class EmployeeService {
  /**
   * Helper to compute today's live status for employees
   */
  static getTodayDateOnly() {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  /**
   * Admin / HR creates a new employee.
   * Auto-provisions Login ID, User Account, Leave Balances, Schedule, and Salary Structure.
   */
  static async createEmployee({ requestingUser, data }) {
    const {
      firstName,
      lastName,
      email,
      personalEmail,
      phone,
      dateOfJoining,
      departmentId,
      jobPositionId,
      managerId,
      role = 'EMPLOYEE',
      // Private Info
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      address,
      panNumber,
      uanNumber,
      // Bank Info
      accountNumber,
      bankName,
      ifscCode,
      // Working Schedule
      workingDays = 5,
      startTime = '09:00',
      endTime = '18:00',
      breakMinutes = 60,
      // Salary Info
      monthlyWage = 50000,
      employeePfRate = 12,
      employerPfRate = 12,
      professionalTax = 200,
      // Skills
      skillIds = [],
      about,
      interestsHobbies,
      profilePictureUrl,
    } = data;

    const companyId = requestingUser.companyId;
    const workEmail = (email || personalEmail).trim().toLowerCase();

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: workEmail },
    });
    if (existingUser) {
      throw new ApiError('An account with this email already exists', 409);
    }

    const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();
    const joiningYear = joiningDate.getFullYear();

    // Generate Login ID (e.g. OIJODO20260001)
    const loginId = await LoginIdService.generate({
      companyId,
      firstName,
      lastName,
      dateOfJoining: joiningDate,
    });

    // Auto-generate employeeCode if not provided (EMP + 4-digit serial)
    const totalEmployees = await prisma.employee.count({ where: { companyId } });
    const employeeCode = `EMP${(totalEmployees + 1).toString().padStart(3, '0')}`;

    // Generate temporary password
    const temporaryPassword = `Pass@${crypto.randomBytes(3).toString('hex')}!`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Employee Record
      const employee = await tx.employee.create({
        data: {
          companyId,
          employeeCode,
          loginId,
          firstName: firstName.trim(),
          lastName: lastName ? lastName.trim() : '',
          personalEmail: personalEmail ? personalEmail.trim() : workEmail,
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          maritalStatus: maritalStatus || null,
          nationality: nationality || null,
          address: address || null,
          panNumber: panNumber || null,
          uanNumber: uanNumber || null,
          departmentId: departmentId || null,
          jobPositionId: jobPositionId || null,
          managerId: managerId || null,
          createdById: requestingUser.userId,
          dateOfJoining: joiningDate,
          about: about || null,
          interestsHobbies: interestsHobbies || null,
          profilePictureUrl: profilePictureUrl || null,
        },
      });

      // 2. Create User Account
      const user = await tx.user.create({
        data: {
          companyId,
          employeeId: employee.id,
          email: workEmail,
          passwordHash,
          role: role === 'HR_OFFICER' ? 'HR_OFFICER' : 'EMPLOYEE',
          mustChangePassword: true,
          emailVerifiedAt: new Date(),
        },
      });

      // 3. Create Bank Details if provided
      if (accountNumber && bankName && ifscCode) {
        await tx.bankDetails.create({
          data: {
            employeeId: employee.id,
            accountNumber,
            bankName,
            ifscCode,
          },
        });
      }

      // 4. Create Working Schedule
      await tx.workingSchedule.create({
        data: {
          companyId,
          employeeId: employee.id,
          name: 'Standard Working Schedule',
          workingDays: Number(workingDays),
          startTime,
          endTime,
          breakMinutes: Number(breakMinutes),
        },
      });

      // 5. Allocate Leave Balances for all company leave types for the joining year
      const companyLeaveTypes = await tx.leaveType.findMany({
        where: { companyId, isActive: true },
      });

      for (const lt of companyLeaveTypes) {
        if (lt.isPaid) {
          await tx.leaveAllocation.create({
            data: {
              employeeId: employee.id,
              leaveTypeId: lt.id,
              year: joiningYear,
              allocatedDays: lt.defaultDays || 0,
              usedDays: 0,
            },
          });
        }
      }

      // 6. Create Salary Structure & Standard Components
      const wageNum = Number(monthlyWage);
      const salaryStructure = await tx.salaryStructure.create({
        data: {
          companyId,
          employeeId: employee.id,
          wageType: 'FIXED',
          monthlyWage: wageNum,
          currency: 'INR',
          employeePfRate: Number(employeePfRate),
          employerPfRate: Number(employerPfRate),
          professionalTax: Number(professionalTax),
        },
      });

      // Calculate component breakdown:
      // Basic = 50% of Wage, HRA = 50% of Basic, Standard = 4167, PB = 8.33% of Basic, LTA = 8.33% of Basic, Fixed = remainder
      const basicAmount = wageNum * 0.5;
      const hraAmount = basicAmount * 0.5;
      const standardAllowance = 4167;
      const performanceBonus = basicAmount * 0.0833;
      const lta = basicAmount * 0.0833;
      const totalOther = basicAmount + hraAmount + standardAllowance + performanceBonus + lta;
      const fixedAllowance = Math.max(0, wageNum - totalOther);

      await tx.salaryComponent.createMany({
        data: [
          {
            salaryStructureId: salaryStructure.id,
            code: 'BASIC',
            name: 'Basic Salary',
            computationType: 'PERCENTAGE',
            percentageBase: 'WAGE',
            percentage: 50.0,
            sequence: 1,
            isEarning: true,
          },
          {
            salaryStructureId: salaryStructure.id,
            code: 'HRA',
            name: 'House Rent Allowance',
            computationType: 'PERCENTAGE',
            percentageBase: 'BASIC',
            percentage: 50.0,
            sequence: 2,
            isEarning: true,
          },
          {
            salaryStructureId: salaryStructure.id,
            code: 'STANDARD_ALLOWANCE',
            name: 'Standard Allowance',
            computationType: 'FIXED',
            fixedAmount: standardAllowance,
            sequence: 3,
            isEarning: true,
          },
          {
            salaryStructureId: salaryStructure.id,
            code: 'PERFORMANCE_BONUS',
            name: 'Performance Bonus',
            computationType: 'PERCENTAGE',
            percentageBase: 'BASIC',
            percentage: 8.33,
            sequence: 4,
            isEarning: true,
          },
          {
            salaryStructureId: salaryStructure.id,
            code: 'LTA',
            name: 'Leave Travel Allowance',
            computationType: 'PERCENTAGE',
            percentageBase: 'BASIC',
            percentage: 8.33,
            sequence: 5,
            isEarning: true,
          },
          {
            salaryStructureId: salaryStructure.id,
            code: 'FIXED_ALLOWANCE',
            name: 'Fixed Allowance (Remainder)',
            computationType: 'REMAINDER',
            fixedAmount: fixedAllowance,
            sequence: 6,
            isEarning: true,
          },
        ],
      });

      // 7. Associate Skills if provided
      if (Array.isArray(skillIds) && skillIds.length > 0) {
        await tx.employeeSkill.createMany({
          data: skillIds.map((sId) => ({
            employeeId: employee.id,
            skillId: sId,
          })),
        });
      }

      return {
        employee,
        user,
        salaryStructure,
      };
    });

    return {
      employee: result.employee,
      initialCredentials: {
        email: workEmail,
        loginId,
        temporaryPassword,
        note: 'The employee must reset this temporary password upon initial login.',
      },
    };
  }

  /**
   * Get all employees with dynamic today status (present, leave, absent)
   */
  static async getEmployees({ companyId, search, departmentId, status, page = 1, limit = 50 }) {
    const where = {
      companyId,
      user: { isActive: true },
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { loginId: { contains: q, mode: 'insensitive' } },
        { personalEmail: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const today = EmployeeService.getTodayDateOnly();

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, role: true, isActive: true },
          },
          department: { select: { id: true, name: true } },
          jobPosition: { select: { id: true, name: true } },
          manager: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, loginId: true },
          },
          attendances: {
            where: { workDate: today },
            select: { id: true, checkIn: true, checkOut: true, status: true, workMinutes: true },
          },
          leaveRequests: {
            where: {
              status: 'APPROVED',
              startDate: { lte: today },
              endDate: { gte: today },
            },
            select: { id: true, leaveType: { select: { name: true, code: true } } },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    // Map calculated live status
    const formatted = employees.map((emp) => {
      let currentStatus = 'absent'; // 🟡
      let statusDetail = 'Not checked in';

      if (emp.attendances && emp.attendances.length > 0 && emp.attendances[0].checkIn) {
        currentStatus = 'present'; // 🟢
        statusDetail = 'Checked in';
      } else if (emp.leaveRequests && emp.leaveRequests.length > 0) {
        currentStatus = 'leave'; // ✈️
        statusDetail = `On leave (${emp.leaveRequests[0].leaveType.name})`;
      }

      const { attendances, leaveRequests, ...rest } = emp;

      return {
        ...rest,
        status: currentStatus,
        statusDetail,
        todayAttendance: attendances[0] || null,
      };
    });

    // If filtered by status
    const filtered = status ? formatted.filter((e) => e.status === status.toLowerCase()) : formatted;

    return {
      employees: filtered,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get single employee by ID
   */
  static async getEmployeeById({ companyId, requestingUser, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        user: {
          select: { id: true, email: true, role: true, isActive: true, mustChangePassword: true },
        },
        department: true,
        jobPosition: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, loginId: true, personalEmail: true },
        },
        directReports: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, loginId: true, profilePictureUrl: true },
        },
        bankDetails: true,
        workingSchedule: true,
        skills: {
          include: { skill: true },
        },
        certifications: true,
        documents: true,
        salaryStructure: {
          include: {
            components: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
        leaveAllocations: {
          where: { year: new Date().getFullYear() },
          include: { leaveType: true },
        },
      },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    // Role-based filtering: hide salary and sensitive private info from regular peers
    const isOwner = requestingUser.employeeId === employee.id || requestingUser.userId === employee.user?.id;
    const isAdminOrHr = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR_OFFICER';

    if (!isOwner && !isAdminOrHr) {
      // Redact private info & salary
      const sanitized = {
        ...employee,
        panNumber: undefined,
        uanNumber: undefined,
        bankDetails: null,
        salaryStructure: null,
        dateOfBirth: undefined,
      };
      return sanitized;
    }

    return employee;
  }

  /**
   * Update employee details (enforces field permissions based on caller role)
   */
  static async updateEmployee({ companyId, requestingUser, employeeId, updateData }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { user: true, bankDetails: true, salaryStructure: true },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    const isOwner = requestingUser.employeeId === employee.id || requestingUser.userId === employee.user?.id;
    const isAdminOrHr = requestingUser.role === 'ADMIN' || requestingUser.role === 'HR_OFFICER';

    if (!isOwner && !isAdminOrHr) {
      throw new ApiError('Forbidden: Access denied', 403);
    }

    // Employees can only edit self-service fields
    if (!isAdminOrHr && isOwner) {
      const allowedSelfFields = {
        phone: updateData.phone !== undefined ? updateData.phone : employee.phone,
        personalEmail: updateData.personalEmail !== undefined ? updateData.personalEmail : employee.personalEmail,
        address: updateData.address !== undefined ? updateData.address : employee.address,
        profilePictureUrl: updateData.profilePictureUrl !== undefined ? updateData.profilePictureUrl : employee.profilePictureUrl,
        about: updateData.about !== undefined ? updateData.about : employee.about,
        interestsHobbies: updateData.interestsHobbies !== undefined ? updateData.interestsHobbies : employee.interestsHobbies,
      };

      const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: allowedSelfFields,
      });

      return updated;
    }

    // Admin / HR can update all fields
    const updatedEmployee = await prisma.$transaction(async (tx) => {
      const employeeUpdate = {
        firstName: updateData.firstName !== undefined ? updateData.firstName.trim() : employee.firstName,
        lastName: updateData.lastName !== undefined ? updateData.lastName.trim() : employee.lastName,
        personalEmail: updateData.personalEmail !== undefined ? updateData.personalEmail : employee.personalEmail,
        phone: updateData.phone !== undefined ? updateData.phone : employee.phone,
        dateOfBirth: updateData.dateOfBirth !== undefined ? new Date(updateData.dateOfBirth) : employee.dateOfBirth,
        gender: updateData.gender !== undefined ? updateData.gender : employee.gender,
        maritalStatus: updateData.maritalStatus !== undefined ? updateData.maritalStatus : employee.maritalStatus,
        nationality: updateData.nationality !== undefined ? updateData.nationality : employee.nationality,
        address: updateData.address !== undefined ? updateData.address : employee.address,
        panNumber: updateData.panNumber !== undefined ? updateData.panNumber : employee.panNumber,
        uanNumber: updateData.uanNumber !== undefined ? updateData.uanNumber : employee.uanNumber,
        departmentId: updateData.departmentId !== undefined ? updateData.departmentId : employee.departmentId,
        jobPositionId: updateData.jobPositionId !== undefined ? updateData.jobPositionId : employee.jobPositionId,
        managerId: updateData.managerId !== undefined ? updateData.managerId : employee.managerId,
        about: updateData.about !== undefined ? updateData.about : employee.about,
        interestsHobbies: updateData.interestsHobbies !== undefined ? updateData.interestsHobbies : employee.interestsHobbies,
        profilePictureUrl: updateData.profilePictureUrl !== undefined ? updateData.profilePictureUrl : employee.profilePictureUrl,
      };

      if (updateData.dateOfJoining) {
        employeeUpdate.dateOfJoining = new Date(updateData.dateOfJoining);
      }

      const emp = await tx.employee.update({
        where: { id: employeeId },
        data: employeeUpdate,
      });

      // Update Bank Details if supplied
      if (updateData.accountNumber || updateData.bankName || updateData.ifscCode) {
        await tx.bankDetails.upsert({
          where: { employeeId },
          update: {
            accountNumber: updateData.accountNumber || employee.bankDetails?.accountNumber,
            bankName: updateData.bankName || employee.bankDetails?.bankName,
            ifscCode: updateData.ifscCode || employee.bankDetails?.ifscCode,
          },
          create: {
            employeeId,
            accountNumber: updateData.accountNumber,
            bankName: updateData.bankName,
            ifscCode: updateData.ifscCode,
          },
        });
      }

      // Update Salary Structure if wage is updated
      if (updateData.monthlyWage !== undefined) {
        const newWage = Number(updateData.monthlyWage);
        const salaryStructure = await tx.salaryStructure.upsert({
          where: { employeeId },
          update: {
            monthlyWage: newWage,
            employeePfRate: updateData.employeePfRate !== undefined ? Number(updateData.employeePfRate) : undefined,
            employerPfRate: updateData.employerPfRate !== undefined ? Number(updateData.employerPfRate) : undefined,
            professionalTax: updateData.professionalTax !== undefined ? Number(updateData.professionalTax) : undefined,
          },
          create: {
            companyId,
            employeeId,
            monthlyWage: newWage,
            employeePfRate: updateData.employeePfRate !== undefined ? Number(updateData.employeePfRate) : 12,
            employerPfRate: updateData.employerPfRate !== undefined ? Number(updateData.employerPfRate) : 12,
            professionalTax: updateData.professionalTax !== undefined ? Number(updateData.professionalTax) : 200,
          },
        });

        // Update remainder component (Fixed Allowance)
        const basic = newWage * 0.5;
        const hra = basic * 0.5;
        const standard = 4167;
        const pb = basic * 0.0833;
        const lta = basic * 0.0833;
        const remainder = Math.max(0, newWage - (basic + hra + standard + pb + lta));

        await tx.salaryComponent.updateMany({
          where: { salaryStructureId: salaryStructure.id, code: 'FIXED_ALLOWANCE' },
          data: { fixedAmount: remainder },
        });
      }

      // Update Role if requested by Admin
      if (updateData.role && employee.user) {
        await tx.user.update({
          where: { id: employee.user.id },
          data: { role: updateData.role },
        });
      }

      return emp;
    });

    return updatedEmployee;
  }

  /**
   * Deactivate an employee (Admin only)
   */
  static async deleteEmployee({ companyId, employeeId }) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { user: true },
    });

    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: { dateOfLeaving: new Date() },
      });

      if (employee.user) {
        await tx.user.update({
          where: { id: employee.user.id },
          data: { isActive: false },
        });
      }
    });

    return { message: 'Employee deactivated successfully' };
  }
}
