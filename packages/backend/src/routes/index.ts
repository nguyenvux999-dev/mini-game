// src/routes/index.ts
// Route aggregator - combines all API routes

import { Router } from 'express';
import configRoutes from './config.routes';
import authRoutes from './auth.routes';
import playerRoutes from './player.routes';
import gameRoutes from './game.routes';
import voucherRoutes from './voucher.routes';
import campaignRoutes from './campaign.routes';
import rewardRoutes from './reward.routes';
import statsRoutes from './stats.routes';
import assetRoutes from './asset.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// API Routes
router.use('/config', configRoutes);
router.use('/auth', authRoutes);
router.use('/players', playerRoutes);
router.use('/game', gameRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/rewards', rewardRoutes);
router.use('/stats', statsRoutes);
router.use('/assets', assetRoutes);

export default router;
