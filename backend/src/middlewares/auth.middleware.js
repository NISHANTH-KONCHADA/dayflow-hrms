import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js';
import prisma from '../config/db.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new ApiError('Authentication token required', 401);
    }

    const secret = process.env.JWT_SECRET || 'dayflow_hrms_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        employee: true,
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError('User account not found or inactive', 401);
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      employeeId: user.employeeId,
      employee: user.employee,
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError('Forbidden: Insufficient privileges', 403));
    }

    next();
  };
}

export function requireSameUserOrAdmin(getUserIdFromReq = (req) => req.params.id) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    const targetUserId = getUserIdFromReq(req);
    const isOwner = req.user.userId === targetUserId || req.user.employeeId === targetUserId;
    const isAdminOrHr = req.user.role === 'ADMIN' || req.user.role === 'HR_OFFICER';

    if (!isOwner && !isAdminOrHr) {
      return next(new ApiError('Forbidden: Access denied to this resource', 403));
    }

    next();
  };
}
