// src/controllers/reward.controller.ts
// Reward API controllers

import { Request, Response, NextFunction } from 'express';
import { rewardService } from '../services/reward.service';
import { sendSuccess, sendCreated } from '../utils/response';

/**
 * GET /api/rewards
 * Admin: List rewards with optional campaign filter
 */
export const listRewards = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await rewardService.listRewards(req.query as any);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rewards/:id
 * Admin: Get reward detail
 */
export const getRewardById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await rewardService.getRewardById(id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rewards
 * Admin: Create new reward
 */
export const createReward = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await rewardService.createReward(req.body);
    return sendCreated(res, result, 'Tạo phần thưởng thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rewards/:id
 * Admin: Update reward
 */
export const updateReward = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await rewardService.updateReward(id, req.body);
    return sendSuccess(res, result, 'Cập nhật phần thưởng thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rewards/:id
 * Admin: Delete reward
 */
export const deleteReward = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    await rewardService.deleteReward(id);
    return sendSuccess(res, { id }, 'Đã xoá phần thưởng');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/rewards/:id/toggle
 * Admin: Toggle reward active status
 */
export const toggleReward = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await rewardService.toggleReward(id);
    const message = result.isActive
      ? 'Đã bật phần thưởng'
      : 'Đã tắt phần thưởng';
    return sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
};
