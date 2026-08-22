import { Router } from 'express';
import { z } from 'zod';
import { SkillController } from '../controllers/skill.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const listSkillsSchema = {
  query: z.object({
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
};

const createSkillSchema = {
  body: z.object({
    name: z.string().min(1, 'Skill name is required'),
  }),
};

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid skill ID'),
  }),
};

router.get('/', validate(listSkillsSchema), SkillController.getAll);
router.post('/', requireRole('ADMIN', 'HR_OFFICER'), validate(createSkillSchema), SkillController.create);
router.delete('/:id', requireRole('ADMIN', 'HR_OFFICER'), validate(getByIdSchema), SkillController.delete);

export default router;
