import { Router } from 'express';
import { z } from 'zod';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Require authentication for all attendance endpoints
router.use(authenticateToken);

const checkInSchema = {
  body: z.object({
    workDate: z.string().optional(),
    checkInTime: z.string().optional(),
    notes: z.string().optional().nullable(),
  }),
};

const checkOutSchema = {
  body: z.object({
    workDate: z.string().optional(),
    checkOutTime: z.string().optional(),
    notes: z.string().optional().nullable(),
  }),
};

const getHistorySchema = {
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

const getSummarySchema = {
  query: z.object({
    month: z.string().optional(),
    year: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
};

const getAdminAttendanceSchema = {
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']).optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

// Employee self routes
router.post('/check-in', validate(checkInSchema), AttendanceController.checkIn);
router.post('/check-out', validate(checkOutSchema), AttendanceController.checkOut);
router.get('/me', validate(getHistorySchema), AttendanceController.getPersonalAttendance);
router.get('/me/summary', validate(getSummarySchema), AttendanceController.getPersonalSummary);

// Admin/HR route
router.get('/', requireRole('ADMIN', 'HR_OFFICER'), validate(getAdminAttendanceSchema), AttendanceController.getAdminAttendance);

export default router;
