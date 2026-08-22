import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.registerOrganization(req.body);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Organization and Admin account registered successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login({ identifier, password });

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      const result = await AuthService.changePassword({ userId, currentPassword, newPassword });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await AuthService.getMe(userId);

      return ApiResponse.success(res, {
        statusCode: 200,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    res.clearCookie('token');
    return ApiResponse.success(res, {
      statusCode: 200,
      message: 'Logged out successfully',
    });
  }

  static async verifyEmail(req, res, next) {
    try {
      const token = req.body?.token || req.query?.token;
      const result = await AuthService.verifyEmail({ token });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resendVerification(req, res, next) {
    try {
      const email = req.body?.email;
      const userId = req.user?.userId;
      const result = await AuthService.resendVerificationEmail({ email, userId });

      return ApiResponse.success(res, {
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
