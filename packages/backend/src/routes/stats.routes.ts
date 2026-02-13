// src/routes/stats.routes.ts
// Routes for Stats API - Admin dashboard analytics

import { Router } from 'express';
import { getDashboard, getPlays, getVouchers } from '../controllers/stats.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import { validateQuery } from '../middlewares/validation.middleware';
import { playsQuerySchema } from '../validators/stats.validator';
import { statsLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

/**
 * Apply middlewares:
 * - statsLimiter: 30 requests per 5 minutes
 * - requireAdmin: Only admin users can access stats
 */
router.use(statsLimiter);
router.use(requireAdmin);

/**
 * GET /api/stats/dashboard
 * Get dashboard overview with today's stats, campaign summary, and reward breakdown
 * 
 * Response:
 * {
 *   today: { plays, wins, newPlayers, vouchersIssued, vouchersRedeemed, winRate },
 *   campaign: { id, name, daysRemaining, totalPlays, totalWins, totalPlayers, ... },
 *   rewardStats: [{ id, name, issued, redeemed, remaining, redeemRate }, ...]
 * }
 */
router.get('/dashboard', getDashboard);

/**
 * GET /api/stats/plays
 * Get play statistics with date range filtering and grouping
 * 
 * Query params:
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 * - groupBy: day | week | month (default: day)
 * 
 * Response:
 * {
 *   summary: { totalPlays, totalWins, winRate },
 *   chart: [{ date, plays, wins }, ...]
 * }
 */
router.get('/plays', validateQuery(playsQuerySchema), getPlays);

/**
 * GET /api/stats/vouchers
 * Get voucher statistics with breakdown by reward
 * 
 * Response:
 * {
 *   summary: { totalIssued, totalRedeemed, totalExpired, totalActive, redeemRate },
 *   byReward: [{ reward, issued, redeemed }, ...]
 * }
 */
router.get('/vouchers', getVouchers);

export default router;
