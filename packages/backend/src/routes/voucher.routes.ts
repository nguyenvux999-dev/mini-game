// src/routes/voucher.routes.ts
// Voucher API routes

import { Router } from 'express';
import {
  getVoucherByCode,
  verifyVoucher,
  redeemVoucher,
  listVouchers,
  cancelVoucher,
} from '../controllers/voucher.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import {
  validateParams,
  validateBody,
  validateQuery,
} from '../middlewares/validation.middleware';
import { scanLimiter } from '../middlewares/rateLimit.middleware';
import {
  voucherCodeParamSchema,
  voucherIdParamSchema,
  redeemVoucherSchema,
  cancelVoucherSchema,
  listVouchersQuerySchema,
} from '../validators/voucher.validator';

const router = Router();

// ==========================================================================
// ADMIN ROUTES (must be before /:code to avoid route conflicts)
// ==========================================================================

/**
 * @route   GET /api/vouchers
 * @desc    List all vouchers with pagination & filters
 * @access  Admin (Bearer Token required)
 */
router.get(
  '/',
  requireAdmin,
  validateQuery(listVouchersQuerySchema),
  listVouchers
);

// ==========================================================================
// PUBLIC ROUTES
// ==========================================================================

/**
 * @route   GET /api/vouchers/:code
 * @desc    Get voucher detail by code (for voucher page)
 * @access  Public
 */
router.get(
  '/:code',
  validateParams(voucherCodeParamSchema),
  getVoucherByCode
);

/**
 * @route   GET /api/vouchers/:code/verify
 * @desc    Verify voucher validity (for scanner)
 * @access  Admin (Bearer Token required)
 */
router.get(
  '/:code/verify',
  requireAdmin,
  scanLimiter,
  validateParams(voucherCodeParamSchema),
  verifyVoucher
);

/**
 * @route   POST /api/vouchers/:code/redeem
 * @desc    Redeem voucher (mark as used)
 * @access  Admin (Bearer Token required)
 */
router.post(
  '/:code/redeem',
  requireAdmin,
  scanLimiter,
  validateParams(voucherCodeParamSchema),
  validateBody(redeemVoucherSchema),
  redeemVoucher
);

// ==========================================================================
// ADMIN ROUTES (by ID)
// ==========================================================================

/**
 * @route   PATCH /api/vouchers/:id/cancel
 * @desc    Cancel a voucher
 * @access  Admin (Bearer Token required)
 */
router.patch(
  '/:id/cancel',
  requireAdmin,
  validateParams(voucherIdParamSchema),
  validateBody(cancelVoucherSchema),
  cancelVoucher
);

export default router;
