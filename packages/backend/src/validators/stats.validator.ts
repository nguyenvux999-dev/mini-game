// src/validators/stats.validator.ts
// Zod validation schemas for Stats API requests

import { z } from 'zod';

/**
 * Schema for GET /api/stats/plays query params
 * Validates date range and groupBy aggregation
 */
export const playsQuerySchema = z.object({
  startDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'startDate must be a valid date string (YYYY-MM-DD)' }
    ),
  endDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'endDate must be a valid date string (YYYY-MM-DD)' }
    ),
  groupBy: z
    .enum(['day', 'week', 'month'])
    .optional()
    .default('day'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate'],
  }
);

export type PlaysQueryInput = z.infer<typeof playsQuerySchema>;
