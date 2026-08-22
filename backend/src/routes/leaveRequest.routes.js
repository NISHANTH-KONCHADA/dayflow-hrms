import { Router } from 'express';
import { z } from 'zod';
import { LeaveController } from '../controllers/leave.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const createLeaveRequestSchema = {
  body: z.object({
    leaveTypeId: z.string().uuid('Invalid leave type ID'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    requestedDays: z.number().positive().optional(),
    reason: z.string().optional().nullable(),
    attachmentUrl: z.string().optional().nullable(),
    attachmentName: z.string().optional().nullable(),
  }),
};

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid leave request ID'),
  }),
};

const reviewSchema = {
  params: z.object({
    id: z.string().uuid('Invalid leave request ID'),
  }),
  body: z.object({
    reviewerComment: z.string().optional().nullable(),
  }),
};

const attachmentSchema = {
  params: z.object({
    id: z.string().uuid('Invalid leave request ID'),
  }),
  body: z.object({
    attachmentUrl: z.string().min(1, 'Attachment URL is required'),
    attachmentName: z.string().optional(),
  }),
};

const getListSchema = {
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
    departmentId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
    leaveTypeId: z.string().uuid().optional(),
    search: z.string().optional(),
    year: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

// Employee personal leave request endpoints
router.post('/', validate(createLeaveRequestSchema), LeaveController.createLeaveRequest);
router.get('/me', validate(getListSchema), LeaveController.getPersonalLeaveRequests);
router.post('/:id/attachment', validate(attachmentSchema), LeaveController.uploadLeaveAttachment);

// Admin/HR endpoints
router.get('/', requireRole('ADMIN', 'HR_OFFICER'), validate(getListSchema), LeaveController.getAdminLeaveRequests);
router.get('/:id', validate(getByIdSchema), LeaveController.getLeaveRequestById);
router.patch('/:id/approve', requireRole('ADMIN', 'HR_OFFICER'), validate(reviewSchema), LeaveController.approveLeaveRequest);
router.patch('/:id/reject', requireRole('ADMIN', 'HR_OFFICER'), validate(reviewSchema), LeaveController.rejectLeaveRequest);

export default router;
