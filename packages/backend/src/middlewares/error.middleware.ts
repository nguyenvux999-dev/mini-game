// src/middlewares/error.middleware.ts
// Global error handling middleware

import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ApiError, ERROR_CODES, ErrorCode } from '../types/api.types';
import { getErrorStatusCode } from '../utils/response';
import logger from '../utils/logger';

/**
 * Custom API Error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode || getErrorStatusCode(code);
    this.details = details;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(ERROR_CODES.NOT_FOUND, message, 404);
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(ERROR_CODES.FORBIDDEN, message, 403);
  }
}

/**
 * Handle 404 - Route not found
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new NotFoundError(`Cannot ${req.method} ${req.path}`);
  next(error);
}

/**
 * Global Error Handler Middleware
 * Returns standardized JSON error response
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response {
  // Default values
  let statusCode = 500;
  let code: string = ERROR_CODES.SERVER_ERROR;
  let message = 'Internal server error';
  let details: Record<string, any> | undefined;

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;

    // Log operational errors as warnings
    logger.warn(`[${code}] ${message}`, {
      path: req.path,
      method: req.method,
      details,
    });
  } else {
    // Unknown/unexpected errors - log full stack
    logger.error('Unexpected error:', err);

    // In development, expose error message
    if (process.env.NODE_ENV === 'development') {
      message = err.message;
    }
  }

  // Build error response matching API_REFERENCE.md format
  const errorResponse: ApiError = {
    code,
    message,
  };

  if (details) {
    errorResponse.details = details;
  }

  const response: ApiResponse = {
    success: false,
    error: errorResponse,
  };

  return res.status(statusCode).json(response);
}

export default {
  errorHandler,
  notFoundHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
};
