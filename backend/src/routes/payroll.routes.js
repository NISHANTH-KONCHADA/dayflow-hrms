import { Router } from 'express';
import { z } from 'zod';
import { PayrollController } from '../controllers/payroll.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN', 'HR_OFFICER'));

const createRunSchema = {
  body: z.object({
    periodStart: z.string().min(1, 'Period start date is required'),
    periodEnd: z.string().min(1, 'Period end date is required'),
  }),
};

const runIdSchema = {
  params: z.object({
    runId: z.string().uuid('Invalid payroll run ID'),
  }),
};

const getListSchema = {
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

router.get('/', validate(getListSchema), PayrollController.getPayrollRuns);
router.post('/runs', validate(createRunSchema), PayrollController.createPayrollRun);
router.get('/runs/:runId', validate(runIdSchema), PayrollController.getPayrollRunById);

export default router;
