// src/middlewares/auth.middleware.ts
// JWT authentication middleware for admin routes

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError, UnauthorizedError } from './error.middleware';
import { ERROR_CODES } from '../types/api.types';
import prisma from '../config/database';

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

/**
 * Admin authentication middleware
 * Verifies JWT token and attaches admin info to request
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from header
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('Token không được cung cấp');
    }

    // Verify token
    const payload = authService.verifyToken(token);

    // Fetch admin from database to ensure still exists and active
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedError('Admin không tồn tại');
    }

    // Attach admin to request
    req.admin = admin;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional admin authentication
 * Attaches admin info if token provided, but doesn't fail if not
 */
export async function optionalAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (token) {
      const payload = authService.verifyToken(token);
      
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.adminId },
        select: {
          id: true,
          username: true,
          displayName: true,
          role: true,
        },
      });

      if (admin) {
        req.admin = admin;
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}

/**
 * Role-based access control middleware
 * Use after requireAdmin middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new UnauthorizedError('Unauthorized'));
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      next(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          'Bạn không có quyền thực hiện hành động này',
          403
        )
      );
      return;
    }

    next();
  };
}

export default {
  requireAdmin,
  optionalAdmin,
  requireRole,
};
