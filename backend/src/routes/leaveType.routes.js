import { Router } from 'express';
import { z } from 'zod';
import { LeaveController } from '../controllers/leave.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const createLeaveTypeSchema = {
  body: z.object({
    code: z.enum(['PAID', 'SICK', 'UNPAID']),
    name: z.string().min(1, 'Leave type name is required'),
    defaultDays: z.number().nonnegative().optional(),
    requiresProof: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
};

const updateLeaveTypeSchema = {
  params: z.object({
    id: z.string().uuid('Invalid leave type ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    defaultDays: z.number().nonnegative().optional().nullable(),
    requiresProof: z.boolean().optional(),
    isPaid: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
};

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid leave type ID'),
  }),
};

router.get('/', LeaveController.getLeaveTypes);
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), validate(createLeaveTypeSchema), LeaveController.createLeaveType);
router.patch('/:id', requireRole('ADMIN', 'HR_OFFICER'), validate(updateLeaveTypeSchema), LeaveController.updateLeaveType);
router.delete('/:id', requireRole('ADMIN', 'HR_OFFICER'), validate(getByIdSchema), LeaveController.deleteLeaveType);

export default router;
