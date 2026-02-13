// src/middlewares/validation.middleware.ts
// Request validation middleware using Zod

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error.middleware';

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Replace with parsed/transformed data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.reduce((acc, err) => {
          const key = err.path.join('.');
          acc[key] = err.message;
          return acc;
        }, {} as Record<string, string>);

        next(new ValidationError('Dữ liệu không hợp lệ', details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request query against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.reduce((acc, err) => {
          const key = err.path.join('.');
          acc[key] = err.message;
          return acc;
        }, {} as Record<string, string>);

        next(new ValidationError('Query parameters không hợp lệ', details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request params against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      req.params = result as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.reduce((acc, err) => {
          const key = err.path.join('.');
          acc[key] = err.message;
          return acc;
        }, {} as Record<string, string>);

        next(new ValidationError('Tham số URL không hợp lệ', details));
      } else {
        next(error);
      }
    }
  };
}

export default {
  validateBody,
  validateQuery,
  validateParams,
};
