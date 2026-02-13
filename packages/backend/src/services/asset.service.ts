// src/services/asset.service.ts
// Business logic for asset management and file uploads

import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../middlewares/error.middleware';
import { deleteFile, getFilePath } from '../middlewares/upload.middleware';
import type { ListAssetsQuery, UploadAssetBody } from '../validators/asset.validator';

/**
 * AssetService
 * Handles asset CRUD operations and file management
 */
export class AssetService {
  /**
   * List assets with optional filtering and pagination
   */
  async listAssets(query: ListAssetsQuery) {
    const { gameType, assetType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (gameType) {
      where.gameType = gameType;
    }

    if (assetType) {
      where.assetType = assetType;
    }

    const [assets, total] = await Promise.all([
      prisma.gameAsset.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.gameAsset.count({ where }),
    ]);

    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: number) {
    const asset = await prisma.gameAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundError('Không tìm thấy asset');
    }

    return asset;
  }

  /**
   * Upload new asset
   * Creates database record for uploaded file
   */
  async uploadAsset(
    file: Express.Multer.File,
    body: UploadAssetBody
  ) {
    if (!file) {
      throw new ValidationError('Không có file được upload');
    }

    // Map upload type to assetType
    const assetTypeMap: Record<string, string> = {
      reward_icon: 'icon',
      game_background: 'background',
      game_character: 'character',
      game_card: 'card',
    };

    const assetType = assetTypeMap[body.type] || 'icon';

    // Generate asset URL (relative path from uploads/)
    const assetUrl = file.path.replace(/\\/g, '/').split('/uploads/')[1];
    const fullAssetUrl = `/uploads/${assetUrl}`;

    // Determine asset name
    const assetName = body.assetName || file.originalname;

    // Create database record
    const asset = await prisma.gameAsset.create({
      data: {
        gameType: body.gameType || 'wheel', // Default to wheel if not specified
        assetType,
        assetName,
        assetUrl: fullAssetUrl,
        description: body.description,
        displayOrder: body.displayOrder || 0,
        isActive: true,
      },
    });

    return asset;
  }

  /**
   * Delete asset
   * Removes database record and deletes file from disk
   */
  async deleteAsset(id: number) {
    const asset = await this.getAssetById(id);

    // Delete file from disk
    const filePath = getFilePath(asset.assetUrl);
    const fileDeleted = deleteFile(filePath);

    // Delete database record
    await prisma.gameAsset.delete({
      where: { id },
    });

    return {
      asset,
      fileDeleted,
    };
  }

  /**
   * Update asset metadata (without changing file)
   */
  async updateAsset(id: number, data: Partial<UploadAssetBody>) {
    const asset = await this.getAssetById(id);

    const updated = await prisma.gameAsset.update({
      where: { id },
      data: {
        ...(data.assetName && { assetName: data.assetName }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.gameType && { gameType: data.gameType }),
      },
    });

    return updated;
  }

  /**
   * Toggle asset active status
   */
  async toggleAsset(id: number) {
    const asset = await this.getAssetById(id);

    const updated = await prisma.gameAsset.update({
      where: { id },
      data: {
        isActive: !asset.isActive,
      },
    });

    return updated;
  }
}
