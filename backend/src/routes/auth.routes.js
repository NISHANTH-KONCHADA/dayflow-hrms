import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

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

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/change-password', authenticateToken, validate(changePasswordSchema), AuthController.changePassword);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', AuthController.logout);

export default router;
