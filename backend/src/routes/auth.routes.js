import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const registerSchema = {
  body: z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    currency: z.string().length(3).optional(),
    timezone: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
  }),
};

const loginSchema = {
  body: z.object({
    identifier: z.string().min(1, 'Email or Login ID is required'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
};

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/change-password', authenticateToken, validate(changePasswordSchema), AuthController.changePassword);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', AuthController.logout);

export default router;
