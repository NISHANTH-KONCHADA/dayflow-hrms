import { Router } from 'express';
import { z } from 'zod';
import { LeaveController } from '../controllers/leave.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const getMeAllocationsSchema = {
  query: z.object({
    year: z.string().optional(),
  }),
};

router.get('/me', validate(getMeAllocationsSchema), LeaveController.getPersonalAllocations);

export default router;
