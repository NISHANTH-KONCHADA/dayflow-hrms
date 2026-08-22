import { Router } from 'express';
import { z } from 'zod';
import { CompanyController } from '../controllers/company.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const createDeptSchema = {
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    description: z.string().optional(),
  }),
};

const createPosSchema = {
  body: z.object({
    name: z.string().min(1, 'Position name is required'),
    departmentId: z.string().uuid().optional(),
    description: z.string().optional(),
  }),
};

const createSkillSchema = {
  body: z.object({
    name: z.string().min(1, 'Skill name is required'),
  }),
};

router.get('/departments', CompanyController.getDepartments);
router.post('/departments', requireRole('ADMIN', 'HR_OFFICER'), validate(createDeptSchema), CompanyController.createDepartment);

router.get('/job-positions', CompanyController.getJobPositions);
router.post('/job-positions', requireRole('ADMIN', 'HR_OFFICER'), validate(createPosSchema), CompanyController.createJobPosition);

router.get('/skills', CompanyController.getSkills);
router.post('/skills', requireRole('ADMIN', 'HR_OFFICER'), validate(createSkillSchema), CompanyController.createSkill);

router.get('/leave-types', CompanyController.getLeaveTypes);

export default router;
