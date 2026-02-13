// src/controllers/stats.controller.ts
// Controller handlers for Stats API endpoints

import type { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/stats.service';
import { sendSuccess } from '../utils/response';
import type { PlaysQueryInput } from '../validators/stats.validator';

const statsService = new StatsService();

/**
 * GET /api/stats/dashboard
 * Get dashboard overview with today's stats and campaign summary
 */
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await statsService.getDashboard();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats/plays
 * Get play statistics with date range filtering and grouping
 */
export const getPlays = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query as PlaysQueryInput;
    const data = await statsService.getPlays(query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats/vouchers
 * Get voucher statistics with breakdown by reward
 */
export const getVouchers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await statsService.getVouchers();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
