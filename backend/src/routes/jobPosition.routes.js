import { Router } from 'express';
import { z } from 'zod';
import { JobPositionController } from '../controllers/jobPosition.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
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

const createPositionSchema = {
  body: z.object({
    name: z.string().min(1, 'Position name is required'),
    departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
    description: z.string().optional(),
  }),
};

const updatePositionSchema = {
  params: z.object({
    id: z.string().uuid('Invalid position ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Position name cannot be empty').optional(),
    departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
    description: z.string().optional(),
  }),
};

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid position ID'),
  }),
};

router.get('/', validate(listPositionsSchema), JobPositionController.getAll);
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), validate(createPositionSchema), JobPositionController.create);
router.get('/:id', validate(getByIdSchema), JobPositionController.getById);
router.put('/:id', requireRole('ADMIN', 'HR_OFFICER'), validate(updatePositionSchema), JobPositionController.update);
router.patch('/:id', requireRole('ADMIN', 'HR_OFFICER'), validate(updatePositionSchema), JobPositionController.update);
router.delete('/:id', requireRole('ADMIN'), validate(getByIdSchema), JobPositionController.delete);

export default router;
