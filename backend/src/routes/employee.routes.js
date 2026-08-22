import { Router } from 'express';
import { z } from 'zod';
import { EmployeeController } from '../controllers/employee.controller.js';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { LeaveController } from '../controllers/leave.controller.js';
import { authenticateToken, requireRole, requireSameUserOrAdmin } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Apply auth to all employee routes
router.use(authenticateToken);

const createEmployeeSchema = {
  body: z.object({
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
  }).refine((data) => data.email || data.personalEmail, {
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

const updateWorkingScheduleSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    name: z.string().optional(),
    workingDays: z.number().int().min(1).max(7).optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:mm').optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:mm').optional(),
    breakMinutes: z.number().int().min(0).optional(),
    weeklyHours: z.number().optional(),
    effectiveFrom: z.string().optional(),
  }),
};

const createAllocationSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    leaveTypeId: z.string().uuid('Invalid leave type ID'),
    year: z.number().int().optional(),
    allocatedDays: z.number().nonnegative('Allocated days must be a non-negative number'),
  }),
};

const updateAllocationSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
    allocationId: z.string().uuid('Invalid allocation ID'),
  }),
  body: z.object({
    allocatedDays: z.number().nonnegative().optional(),
    usedDays: z.number().nonnegative().optional(),
  }),
};

// Employee leave allocation endpoints
router.get('/:id/leave-allocations', requireSameUserOrAdmin(), validate(getByIdSchema), LeaveController.getEmployeeAllocations);
router.post('/:id/leave-allocations', requireRole('ADMIN', 'HR_OFFICER'), validate(createAllocationSchema), LeaveController.createEmployeeAllocation);
router.patch('/:id/leave-allocations/:allocationId', requireRole('ADMIN', 'HR_OFFICER'), validate(updateAllocationSchema), LeaveController.updateEmployeeAllocation);

// Employee working schedule endpoints
router.get('/:id/working-schedule', requireSameUserOrAdmin(), validate(getByIdSchema), AttendanceController.getWorkingSchedule);
router.patch('/:id/working-schedule', requireRole('ADMIN', 'HR_OFFICER'), validate(updateWorkingScheduleSchema), AttendanceController.updateWorkingSchedule);

// Employee attendance endpoints
router.get('/:id/attendance', requireSameUserOrAdmin(), validate(getByIdSchema), AttendanceController.getEmployeeAttendance);
router.get('/:id/attendance/summary', requireSameUserOrAdmin(), validate(getByIdSchema), AttendanceController.getEmployeeSummary);

// Routes
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), validate(createEmployeeSchema), EmployeeController.create);
router.get('/', EmployeeController.getAll);
router.get('/:id', validate(getByIdSchema), EmployeeController.getById);
router.put('/:id', validate(updateEmployeeSchema), EmployeeController.update);
router.delete('/:id', requireRole('ADMIN'), validate(getByIdSchema), EmployeeController.delete);

export default router;
