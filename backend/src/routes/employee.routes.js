import { Router } from 'express';
import { z } from 'zod';
import { EmployeeController } from '../controllers/employee.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Apply auth to all employee routes
router.use(authenticateToken);

const listEmployeesSchema = {
  query: z.object({
    search: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    jobPositionId: z.string().uuid().optional(),
    role: z.enum(['ADMIN', 'HR_OFFICER', 'EMPLOYEE', 'admin', 'hr_officer', 'employee']).optional(),
    status: z.enum(['present', 'leave', 'absent', 'PRESENT', 'LEAVE', 'ABSENT']).optional(),
    sortBy: z.enum(['name', 'dateOfJoining', 'employeeCode', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

const createEmployeeSchema = {
  body: z
    .object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().optional(),
      email: z.string().email('Invalid email address').optional(),
      personalEmail: z.string().email('Invalid personal email address').optional(),
      phone: z.string().optional(),
      dateOfJoining: z.string().optional(),
      departmentId: z.string().uuid().optional(),
      jobPositionId: z.string().uuid().optional(),
      managerId: z.string().uuid().optional(),
      role: z.enum(['EMPLOYEE', 'HR_OFFICER']).optional(),
      // Private Info
      dateOfBirth: z.string().optional(),
      gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
      maritalStatus: z.string().optional(),
      nationality: z.string().optional(),
      address: z.string().optional(),
      panNumber: z.string().optional(),
      uanNumber: z.string().optional(),
      // Bank Info
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      ifscCode: z.string().optional(),
      // Schedule
      workingDays: z.number().int().min(1).max(7).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      breakMinutes: z.number().int().optional(),
      // Salary Info
      monthlyWage: z.number().positive().optional(),
      employeePfRate: z.number().min(0).max(100).optional(),
      employerPfRate: z.number().min(0).max(100).optional(),
      professionalTax: z.number().min(0).optional(),
      // Skills & Info
      skillIds: z.array(z.string().uuid()).optional(),
      about: z.string().optional(),
      interestsHobbies: z.string().optional(),
      profilePictureUrl: z.string().optional(),
    })
    .refine((data) => data.email || data.personalEmail, {
      message: 'Either work email or personal email is required',
      path: ['email'],
    }),
};

const updateEmployeeSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().optional(),
    personalEmail: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    maritalStatus: z.string().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    panNumber: z.string().optional(),
    uanNumber: z.string().optional(),
    departmentId: z.string().uuid().optional().nullable(),
    jobPositionId: z.string().uuid().optional().nullable(),
    managerId: z.string().uuid().optional().nullable(),
    role: z.enum(['EMPLOYEE', 'HR_OFFICER', 'ADMIN']).optional(),
    dateOfJoining: z.string().optional(),
    // Bank Info
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    ifscCode: z.string().optional(),
    // Salary Info
    monthlyWage: z.number().positive().optional(),
    employeePfRate: z.number().min(0).max(100).optional(),
    employerPfRate: z.number().min(0).max(100).optional(),
    professionalTax: z.number().min(0).optional(),
    // Info
    about: z.string().optional(),
    interestsHobbies: z.string().optional(),
    profilePictureUrl: z.string().optional(),
  }),
};

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
};

// Routes
router.get('/', validate(listEmployeesSchema), EmployeeController.getAll);
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), validate(createEmployeeSchema), EmployeeController.create);
router.get('/:id', validate(getByIdSchema), EmployeeController.getById);
router.put('/:id', validate(updateEmployeeSchema), EmployeeController.update);
router.delete('/:id', requireRole('ADMIN'), validate(getByIdSchema), EmployeeController.delete);

export default router;
