// src/controllers/auth.controller.ts
// Controller for Auth API endpoints

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { LoginInput, ChangePasswordInput } from '../validators/auth.validator';

/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * POST /api/auth/login
   * Admin login
   */
  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input: LoginInput = req.body;
      const result = await authService.login(input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current admin info
   */
  async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminId = req.admin!.id;
      const admin = await authService.getMe(adminId);
      sendSuccess(res, admin);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout admin (client-side token removal)
   */
  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // JWT is stateless, so logout is handled client-side
      // Here we just return success
      // In a more complex system, you might blacklist the token
      sendSuccess(res, null, 'Đăng xuất thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/password
   * Change admin password
   */
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminId = req.admin!.id;
      const input: ChangePasswordInput = req.body;
      
      await authService.changePassword(adminId, input);
      
      sendSuccess(res, null, 'Đổi mật khẩu thành công');
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
export default authController;
