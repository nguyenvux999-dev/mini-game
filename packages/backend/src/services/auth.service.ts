// src/services/auth.service.ts
// Service layer for Auth API - handles authentication logic

import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import config from '../config';
import { AppError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';
import { LoginInput, ChangePasswordInput } from '../validators/auth.validator';

// JWT payload type
interface JwtPayload {
  adminId: number;
  username: string;
  role: string;
}

// Admin response type (without password)
interface AdminResponse {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  lastLogin?: Date | null;
}

// Login response type
interface LoginResponse {
  admin: AdminResponse;
  token: string;
  expiresIn: string;
}

/**
 * Auth Service
 * Handles all authentication business logic
 */
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Login admin user
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    const { username, password } = input;

    // Find admin by username
    const admin = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!admin) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Tên đăng nhập hoặc mật khẩu không đúng',
        401
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Tên đăng nhập hoặc mật khẩu không đúng',
        401
      );
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const payload: JwtPayload = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    };

    const token = jwt.sign(
      payload, 
      config.jwt.secret as Secret, 
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
      },
      token,
      expiresIn: config.jwt.expiresIn,
    };
  }

  /**
   * Get current admin info
   */
  async getMe(adminId: number): Promise<AdminResponse> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        'Admin không tồn tại',
        404
      );
    }

    return {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
      lastLogin: admin.lastLogin,
    };
  }

  /**
   * Change admin password
   */
  async changePassword(
    adminId: number,
    input: ChangePasswordInput
  ): Promise<void> {
    const { currentPassword, newPassword } = input;

    // Find admin
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        'Admin không tồn tại',
        404
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Mật khẩu hiện tại không đúng',
        401
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash: newPasswordHash },
    });
  }

  /**
   * Verify JWT token and return payload
   */
  verifyToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          ERROR_CODES.UNAUTHORIZED,
          'Token đã hết hạn',
          401
        );
      }
      throw new AppError(
        ERROR_CODES.INVALID_TOKEN,
        'Token không hợp lệ',
        401
      );
    }
  }

  /**
   * Create admin user (for seeding/setup)
   */
  async createAdmin(data: {
    username: string;
    password: string;
    displayName: string;
    role?: string;
  }): Promise<AdminResponse> {
    // Check if username already exists
    const existing = await prisma.adminUser.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Username đã tồn tại',
        400
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create admin
    const admin = await prisma.adminUser.create({
      data: {
        username: data.username,
        passwordHash,
        displayName: data.displayName,
        role: data.role || 'admin',
      },
    });

    return {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
