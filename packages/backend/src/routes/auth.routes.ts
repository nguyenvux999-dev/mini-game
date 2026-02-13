// src/routes/auth.routes.ts
// Routes for Auth API

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { loginLimiter } from '../middlewares/rateLimit.middleware';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin info
 * @access  Admin (requires Bearer token)
 */
router.get(
  '/me',
  requireAdmin,
  (req, res, next) => authController.getMe(req, res, next)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout admin
 * @access  Admin (requires Bearer token)
 */
router.post(
  '/logout',
  requireAdmin,
  (req, res, next) => authController.logout(req, res, next)
);

/**
 * @route   PUT /api/auth/password
 * @desc    Change admin password
 * @access  Admin (requires Bearer token)
 */
router.put(
  '/password',
  requireAdmin,
  validateBody(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next)
);

export default router;
