// src/controllers/config.controller.ts
// Controller for Config API endpoints

import { Request, Response, NextFunction } from 'express';
import { configService } from '../services/config.service';
import { sendSuccess } from '../utils/response';

/**
 * Config Controller
 * Handles HTTP requests for configuration endpoints
 */
export class ConfigController {
  
  /**
   * GET /api/config
   * Get public configuration for frontend (store, campaign, rewards, contact)
   */
  async getPublicConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const config = await configService.getPublicConfig();
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/config/admin
   * Get full configuration for admin panel
   */
  async getAdminConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const config = await configService.getAdminConfig();
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/config
   * Update store configuration
   */
  async updateConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedConfig = await configService.updateConfig(req.body);
      sendSuccess(res, updatedConfig, 'Cập nhật cấu hình thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/config/upload-logo
   * Upload store logo
   */
  async uploadLogo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: { message: 'Không có file được upload' } });
        return;
      }
      const data = await configService.uploadLogo(file);
      sendSuccess(res, data, 'Upload logo thành công');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/config/upload-banner
   * Upload store banner
   */
  async uploadBanner(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: { message: 'Không có file được upload' } });
        return;
      }
      const data = await configService.uploadBanner(file);
      sendSuccess(res, data, 'Upload banner thành công');
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const configController = new ConfigController();
export default configController;
