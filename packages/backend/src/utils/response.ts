// src/utils/response.ts
// API Response helpers

import { Response } from 'express';
import { ApiResponse, ApiError, ErrorCode } from '../types/api.types';

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode: number = 400,
  details?: Record<string, any>
): Response {
  const error: ApiError = {
    code,
    message,
  };
  
  if (details) {
    error.details = details;
  }
  
  const response: ApiResponse = {
    success: false,
    error,
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Send created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): Response {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

/**
 * HTTP Status codes mapping for error codes
 */
export const errorStatusCodes: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_TOKEN: 401,
  NOT_FOUND: 404,
  VOUCHER_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INVALID_PHONE: 400,
  CAMPAIGN_NOT_ACTIVE: 400,
  CAMPAIGN_ENDED: 400,
  NO_PLAYS_LEFT: 400,
  VOUCHER_EXPIRED: 400,
  VOUCHER_USED: 400,
  VOUCHER_CANCELLED: 400,
  FILE_TOO_LARGE: 400,
  INVALID_FILE_TYPE: 400,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
};

/**
 * Get HTTP status code for error code
 */
export function getErrorStatusCode(code: string): number {
  return errorStatusCodes[code] || 500;
}
