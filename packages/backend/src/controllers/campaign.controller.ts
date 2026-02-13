// src/controllers/campaign.controller.ts
// Campaign API controllers

import { Request, Response, NextFunction } from 'express';
import { campaignService } from '../services/campaign.service';
import { sendSuccess, sendCreated } from '../utils/response';

/**
 * GET /api/campaigns
 * Admin: List campaigns with pagination & filters
 */
export const listCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await campaignService.listCampaigns(req.query as any);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/:id
 * Admin: Get campaign detail
 */
export const getCampaignById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await campaignService.getCampaignById(id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/campaigns
 * Admin: Create new campaign
 */
export const createCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await campaignService.createCampaign(req.body);
    return sendCreated(res, result, 'Tạo chương trình thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/campaigns/:id
 * Admin: Update campaign
 */
export const updateCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await campaignService.updateCampaign(id, req.body);
    return sendSuccess(res, result, 'Cập nhật chương trình thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/campaigns/:id
 * Admin: Delete campaign
 */
export const deleteCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    await campaignService.deleteCampaign(id);
    return sendSuccess(res, { id }, 'Đã xoá chương trình');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/campaigns/:id/toggle
 * Admin: Toggle campaign active status
 */
export const toggleCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await campaignService.toggleCampaign(id);
    const message = result.isActive
      ? 'Đã bật chương trình'
      : 'Đã tắt chương trình';
    return sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
};
