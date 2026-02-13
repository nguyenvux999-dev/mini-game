// src/controllers/voucher.controller.ts
// Voucher API controllers

import { Request, Response, NextFunction } from 'express';
import { voucherService } from '../services/voucher.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';

/**
 * GET /api/vouchers/:code
 * Public: Get voucher detail by code
 */
export const getVoucherByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const result = await voucherService.getVoucherByCode(code);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vouchers/:code/verify
 * Admin: Verify voucher validity (for scanner)
 */
export const verifyVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const result = await voucherService.verifyVoucher(code);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vouchers/:code/redeem
 * Admin: Redeem (mark as used) a voucher
 */
export const redeemVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    const admin = req.admin;

    if (!admin) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Admin authentication required',
        401
      );
    }

    const { notes } = req.body;
    const result = await voucherService.redeemVoucher(
      code,
      admin.username,
      notes
    );

    return sendSuccess(res, result, 'Đã xác nhận đổi voucher thành công!');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vouchers
 * Admin: List all vouchers with pagination & filters
 */
export const listVouchers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await voucherService.listVouchers(req.query as any);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/vouchers/:id/cancel
 * Admin: Cancel a voucher
 */
export const cancelVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { reason } = req.body;
    const result = await voucherService.cancelVoucher(id, reason);
    return sendSuccess(res, result, 'Đã huỷ voucher');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/:id/vouchers
 * Player: Get own vouchers
 */
export const getPlayerVouchers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const player = req.player;
    if (!player) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Player authentication required',
        401
      );
    }

    const playerId = parseInt(req.params.id, 10);

    // Players can only view their own vouchers
    if (player.id !== playerId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Bạn chỉ có thể xem voucher của mình',
        403
      );
    }

    const result = await voucherService.getPlayerVouchers(
      playerId,
      req.query as any
    );
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
