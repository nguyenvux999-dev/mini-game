// src/controllers/asset.controller.ts
// Controller handlers for Asset API endpoints

import type { Request, Response, NextFunction } from 'express';
import { AssetService } from '../services/asset.service';
import { sendSuccess, sendCreated } from '../utils/response';
import type { ListAssetsQuery, UploadAssetBody } from '../validators/asset.validator';

const assetService = new AssetService();

/**
 * GET /api/assets
 * List assets with filtering by gameType/assetType and pagination
 */
export const listAssets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query as unknown as ListAssetsQuery;
    const data = await assetService.listAssets(query);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assets/:id
 * Get asset by ID
 */
export const getAssetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const data = await assetService.getAssetById(id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/assets/upload
 * Upload new asset file and create database record
 */
export const uploadAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    const body = req.body as UploadAssetBody;

    const data = await assetService.uploadAsset(file!, body);
    
    return sendCreated(res, data, 'Upload asset thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/assets/:id
 * Delete asset and remove file from disk
 */
export const deleteAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    await assetService.deleteAsset(id);
    
    return sendSuccess(res, null, 'Đã xoá asset');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/assets/:id
 * Update asset metadata (not file)
 */
export const updateAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body as Partial<UploadAssetBody>;
    
    const data = await assetService.updateAsset(id, body);
    
    return sendSuccess(res, data, 'Cập nhật asset thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/assets/:id/toggle
 * Toggle asset active status
 */
export const toggleAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const data = await assetService.toggleAsset(id);
    
    const message = data.isActive
      ? 'Đã kích hoạt asset'
      : 'Đã vô hiệu hoá asset';
    
    return sendSuccess(res, data, message);
  } catch (error) {
    next(error);
  }
};
