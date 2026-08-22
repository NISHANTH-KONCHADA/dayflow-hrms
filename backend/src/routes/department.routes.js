import { Router } from 'express';
import { z } from 'zod';
import { DepartmentController } from '../controllers/department.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const listDepartmentsSchema = {
  query: z.object({
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
};

const createDepartmentSchema = {
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    description: z.string().optional(),
  }),
};

const updateDepartmentSchema = {
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Department name cannot be empty').optional(),
    description: z.string().optional(),
  }),
};

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
};

router.get('/', validate(listDepartmentsSchema), DepartmentController.getAll);
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), validate(createDepartmentSchema), DepartmentController.create);
router.get('/:id', validate(getByIdSchema), DepartmentController.getById);
router.put('/:id', requireRole('ADMIN', 'HR_OFFICER'), validate(updateDepartmentSchema), DepartmentController.update);
router.patch('/:id', requireRole('ADMIN', 'HR_OFFICER'), validate(updateDepartmentSchema), DepartmentController.update);
router.delete('/:id', requireRole('ADMIN'), validate(getByIdSchema), DepartmentController.delete);

export default router;
