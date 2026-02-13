// src/middlewares/rateLimit.middleware.ts
// Rate limiting middleware configurations

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * General API rate limiter
 * Applied to all API endpoints
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Quá nhiều request, vui lòng thử lại sau',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Play game rate limiter (strictest)
 * 5 requests per 1 minute
 * Uses player ID from req.player or IP address
 */
export const playLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Bạn đang chơi quá nhanh. Vui lòng chờ một chút.',
    },
  },
  keyGenerator: (req: Request) => {
    // Use player ID if available, otherwise use IP
    if (req.player?.id) {
      return `player:${req.player.id}`;
    }
    return req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth login rate limiter
 * 5 requests per 15 minutes
 * Prevents brute force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
    },
  },
  keyGenerator: (req: Request) => {
    // Use username from body or IP
    const username = req.body?.username;
    if (username) {
      return `login:${username}`;
    }
    return `login-ip:${req.ip}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Player registration rate limiter
 * 10 requests per 1 minute
 * Prevents spam registrations
 */
export const registerLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Quá nhiều lần đăng ký. Vui lòng thử lại sau.',
    },
  },
  keyGenerator: (req: Request) => {
    // Use phone number from body or IP
    const phone = req.body?.phone;
    if (phone) {
      return `register:${phone}`;
    }
    return `register-ip:${req.ip}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 * 20 requests per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Quá nhiều lần upload. Vui lòng thử lại sau.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * QR Scanner rate limiter
 * 50 requests per 5 minutes
 * For staff scanning vouchers
 */
export const scanLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Quá nhiều lần quét. Vui lòng thử lại sau.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stats API rate limiter
 * 30 requests per 5 minutes
 * For dashboard and analytics
 */
export const statsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Quá nhiều request thống kê. Vui lòng thử lại sau.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
