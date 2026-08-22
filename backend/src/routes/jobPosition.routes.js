import { Router } from 'express';
import { z } from 'zod';
import { JobPositionController } from '../controllers/jobPosition.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const listPositionsSchema = {
  query: z.object({
    departmentId: z.string().uuid('Invalid department ID').optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
};

router.get('/', validate(listPositionsSchema), JobPositionController.getAll);

export default router;
