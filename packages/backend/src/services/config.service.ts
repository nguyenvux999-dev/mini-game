// src/services/config.service.ts
// Service layer for Config API - handles all database operations

import prisma from '../config/database';
import { 
  ConfigResponse, 
  StoreInfo, 
  CampaignInfo, 
  RewardInfo, 
  ContactInfo 
} from '../types/api.types';
import { AppError, NotFoundError, ValidationError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';

/**
 * Config Service
 * Handles all business logic for store configuration
 */
export class ConfigService {
  
  /**
   * Get public config for frontend
   * Includes store info, active campaign, rewards, and contact
   */
  async getPublicConfig(): Promise<ConfigResponse> {
    // Fetch store config
    const storeConfig = await prisma.storeConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!storeConfig) {
      throw new NotFoundError('Store configuration not found');
    }

    // Build store info
    const store: StoreInfo = {
      name: storeConfig.storeName,
      logo: storeConfig.logoUrl,
      banner: storeConfig.bannerUrl,
      primaryColor: storeConfig.primaryColor,
      secondaryColor: storeConfig.secondaryColor,
    };

    // Build contact info
    const contact: ContactInfo = {
      address: storeConfig.address,
      hotline: storeConfig.hotline,
      fanpage: storeConfig.fanpageUrl,
      instagram: storeConfig.instagramUrl,
      zalo: storeConfig.zaloUrl,
    };

    // Fetch active campaign with rewards
    const now = new Date();
    const activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        rewards: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    let campaign: CampaignInfo | null = null;
    let rewards: RewardInfo[] = [];

    if (activeCampaign) {
      // Build campaign info
      campaign = {
        id: activeCampaign.id,
        name: activeCampaign.name,
        description: activeCampaign.description,
        activeGame: activeCampaign.activeGame,
        gameConfig: activeCampaign.gameConfig
          ? (() => { try { return JSON.parse(activeCampaign.gameConfig); } catch { return null; } })()
          : null,
        startDate: activeCampaign.startDate.toISOString(),
        endDate: activeCampaign.endDate.toISOString(),
        maxPlaysPerPhone: activeCampaign.maxPlaysPerPhone,
      };

      // Build rewards list (public info only)
      rewards = activeCampaign.rewards.map((reward: {
        id: number;
        name: string;
        description: string | null;
        iconUrl: string | null;
        displayOrder: number;
      }) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        icon: reward.iconUrl,
        displayOrder: reward.displayOrder,
      }));
    }

    return {
      store,
      campaign,
      rewards,
      contact,
    };
  }

  /**
   * Get full store config for admin
   */
  async getAdminConfig(): Promise<any> {
    const storeConfig = await prisma.storeConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!storeConfig) {
      throw new NotFoundError('Store configuration not found');
    }

    return storeConfig;
  }

  /**
   * Update store config
   */
  async updateConfig(data: {
    storeName?: string;
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    address?: string;
    hotline?: string;
    fanpageUrl?: string;
    instagramUrl?: string;
    zaloUrl?: string;
  }): Promise<any> {
    // Find existing config
    const existingConfig = await prisma.storeConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!existingConfig) {
      // Create new config if none exists
      return prisma.storeConfig.create({
        data: {
          storeName: data.storeName || 'My Store',
          primaryColor: data.primaryColor || '#FF6B35',
          secondaryColor: data.secondaryColor || '#F7C59F',
          ...data,
        },
      });
    }

    // Update existing config
    return prisma.storeConfig.update({
      where: { id: existingConfig.id },
      data,
    });
  }

  /**
   * Upload and update logo
   */
  async uploadLogo(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new ValidationError('Không có file được upload');
    }

    // Generate logo URL (relative path from uploads/)
    const logoUrl = file.path.replace(/\\/g, '/').split('/uploads/')[1];
    const fullLogoUrl = `/uploads/${logoUrl}`;

    // Update store config with new logo URL
    await this.updateConfig({ logoUrl: fullLogoUrl });

    return { url: fullLogoUrl };
  }

  /**
   * Upload and update banner
   */
  async uploadBanner(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new ValidationError('Không có file được upload');
    }

    // Generate banner URL (relative path from uploads/)
    const bannerUrl = file.path.replace(/\\/g, '/').split('/uploads/')[1];
    const fullBannerUrl = `/uploads/${bannerUrl}`;

    // Update store config with new banner URL
    await this.updateConfig({ bannerUrl: fullBannerUrl });

    return { url: fullBannerUrl };
  }
}

// Export singleton instance
export const configService = new ConfigService();
export default configService;
