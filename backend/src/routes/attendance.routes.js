import { Router } from 'express';
import { z } from 'zod';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Apply auth middleware to all attendance routes
router.use(authenticateToken);

const checkInSchema = {
  body: z.object({
    workDate: z.string().optional(),
    checkInTime: z.string().optional(),
    notes: z.string().optional().nullable(),
  }),
};

router.post('/check-in', validate(checkInSchema), AttendanceController.checkIn);

export default router;
