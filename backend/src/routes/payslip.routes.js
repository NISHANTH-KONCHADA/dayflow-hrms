import { Router } from 'express';
import { z } from 'zod';
import { PayrollController } from '../controllers/payroll.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(authenticateToken);

const getByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid payslip ID'),
  }),
};

const getListSchema = {
  query: z.object({
    employeeId: z.string().uuid().optional(),
    payrollRunId: z.string().uuid().optional(),
    status: z.enum(['DRAFT', 'GENERATED', 'PAID', 'CANCELLED']).optional(),
    year: z.string().optional(),
    month: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
};

// Employee self payslips endpoint
router.get('/me', validate(getListSchema), PayrollController.getPersonalPayslips);

// Admin/HR list endpoint
router.get('/', requireRole('ADMIN', 'HR_OFFICER'), validate(getListSchema), PayrollController.getPayslipsAdmin);

// Single payslip details endpoint (Owner or Admin/HR)
router.get('/:id', validate(getByIdSchema), PayrollController.getPayslipById);

export default router;
