import { Router } from 'express';
import { z } from 'zod';
import { SalaryController } from '../controllers/salary.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// Apply auth and admin/HR role checks
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'HR_OFFICER'));

const salaryParamsSchema = {
  params: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
};

const createSalarySchema = {
  params: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    monthlyWage: z.number().positive('Monthly wage must be positive'),
    currency: z.string().length(3).optional(),
    basicPct: z.number().min(0).max(100).optional(),
    hraPct: z.number().min(0).max(100).optional(),
    performanceBonusPct: z.number().min(0).max(100).optional(),
    ltaPct: z.number().min(0).max(100).optional(),
    standardAllowance: z.number().min(0).optional(),
    employeePfRate: z.number().min(0).max(100).optional(),
    employerPfRate: z.number().min(0).max(100).optional(),
    professionalTax: z.number().min(0).optional(),
    effectiveFrom: z.string().optional(),
  }),
};

const updateSalarySchema = {
  params: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    monthlyWage: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    basicPct: z.number().min(0).max(100).optional(),
    hraPct: z.number().min(0).max(100).optional(),
    performanceBonusPct: z.number().min(0).max(100).optional(),
    ltaPct: z.number().min(0).max(100).optional(),
    standardAllowance: z.number().min(0).optional(),
    employeePfRate: z.number().min(0).max(100).optional(),
    employerPfRate: z.number().min(0).max(100).optional(),
    professionalTax: z.number().min(0).optional(),
    effectiveFrom: z.string().optional(),
  }),
};

const previewSalarySchema = {
  params: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    monthlyWage: z.number().positive('Monthly wage must be positive'),
    basicPct: z.number().min(0).max(100).optional(),
    hraPct: z.number().min(0).max(100).optional(),
    performanceBonusPct: z.number().min(0).max(100).optional(),
    ltaPct: z.number().min(0).max(100).optional(),
    standardAllowance: z.number().min(0).optional(),
    employeePfRate: z.number().min(0).max(100).optional(),
    employerPfRate: z.number().min(0).max(100).optional(),
    professionalTax: z.number().min(0).optional(),
  }),
};

router.get('/:employeeId/salary', validate(salaryParamsSchema), SalaryController.getSalaryStructure);
router.post('/:employeeId/salary', validate(createSalarySchema), SalaryController.createSalaryStructure);
router.patch('/:employeeId/salary', validate(updateSalarySchema), SalaryController.updateSalaryStructure);
router.post('/:employeeId/salary/preview', validate(previewSalarySchema), SalaryController.previewSalary);

export default router;
