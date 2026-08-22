import { Router } from 'express';
import { z } from 'zod';
import { DepartmentController } from '../controllers/department.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
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

router.get('/', validate(listDepartmentsSchema), DepartmentController.getAll);

export default router;
