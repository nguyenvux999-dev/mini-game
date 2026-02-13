// src/types/api.types.ts
// TypeScript types mirroring backend API responses

// ============================================================================
// BASE API TYPES
// ============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/** Standard API error */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface StoreInfo {
  name: string;
  logo: string | null;
  banner: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface CampaignInfo {
  id: number;
  name: string;
  description: string | null;
  activeGame: GameType;
  gameConfig: Record<string, unknown> | null;
  startDate: string;
  endDate: string;
  maxPlaysPerPhone: number;
}

export interface RewardInfo {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
}

export interface ContactInfo {
  address: string | null;
  hotline: string | null;
  fanpage: string | null;
  instagram: string | null;
  zalo: string | null;
}

export interface PublicConfig {
  store: StoreInfo;
  campaign: CampaignInfo | null;
  rewards: RewardInfo[];
  contact: ContactInfo;
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

export interface Player {
  id: number;
  phone: string;
  name: string | null;
  playCount: number;
  totalWins: number;
}

export interface RegisterPlayerInput {
  phone: string;
  name: string;
}

export interface RegisterResponse {
  player: Player;
  token: string;
  campaign: {
    id: number;
    remainingPlays: number;
    maxPlays: number;
  } | null;
}

export interface PlayerDetail extends Player {
  email: string | null;
  lastPlayAt: string | null;
  createdAt: string;
}

export interface PlayerListItem {
  id: number;
  phone: string;
  name: string | null;
  playCount: number;
  totalWins: number;
  lastPlayAt: string | null;
  createdAt: string;
}

export interface PlayerDetailResponse {
  player: PlayerDetail;
  vouchers: VoucherWithRelations[];
  playHistory: PlayLogItem[];
}

// ============================================================================
// PLAY LOG TYPE
// ============================================================================

export interface PlayLogItem {
  id: number;
  gameType: string;
  isWin: boolean;
  playedAt: string;
  reward: {
    id: number;
    name: string;
    value: number;
  } | null;
  campaign: {
    id: number;
    name: string;
  };
}

// ============================================================================
// GAME TYPES
// ============================================================================

export type GameType = 'wheel' | 'shake' | 'memory' | 'tap';

export interface GameData {
  matchedPairs?: number;
  timeSpent?: number;
  taps?: number;
  perfectHits?: number;
  shakeCount?: number;
}

export interface PlayGameInput {
  gameType: GameType;
  gameData?: GameData;
}

export interface PlayResult {
  isWin: boolean;
  reward: {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    value: number | null;
  } | null;
  voucher: {
    id: number;
    code: string;
    qrCode: string;
    expiresAt: string | null;
  } | null;
  player: {
    remainingPlays: number;
    totalWins: number;
  };
}

export interface EligibilityResult {
  canPlay: boolean;
  remainingPlays: number;
  maxPlays: number;
  reason?: string;
  message?: string;
  nextPlayAt?: string | null;
}

// ============================================================================
// VOUCHER TYPES
// ============================================================================

export type VoucherStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface Voucher {
  id: number;
  playerId: number;
  rewardId: number;
  campaignId: number;
  code: string;
  qrData: string | null;
  status: VoucherStatus;
  expiresAt: string | null;
  usedAt: string | null;
  usedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VoucherWithRelations extends Voucher {
  reward: {
    id: number;
    name: string;
    value: number;
    iconUrl: string | null;
  };
  campaign: {
    id: number;
    name: string;
  };
  player?: {
    id: number;
    phone: string;
    name: string | null;
  };
}

export interface VoucherListQuery {
  page?: number;
  limit?: number;
  status?: VoucherStatus;
  campaignId?: number;
  playerId?: number;
  search?: string;
}

export interface VoucherVerifyResult {
  isValid: boolean;
  voucher: {
    id: number;
    code: string;
    status: VoucherStatus;
    createdAt?: string;
    expiresAt?: string | null;
    usedAt?: string | null;
    usedBy?: string | null;
    reward?: { name: string; value: number };
    player?: { phone: string; name: string | null };
    campaign?: { id: number; name: string };
  };
  message?: string;
  canRedeem?: boolean;
  reason?: string;
}

// ============================================================================
// CAMPAIGN TYPES (Admin)
// ============================================================================

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  activeGame: GameType;
  gameConfig: string | null;
  maxPlaysPerPhone: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  activeGame: GameType;
  gameConfig?: Record<string, unknown> | null;
  maxPlaysPerPhone?: number;
  isActive?: boolean;
}

export interface CampaignWithStats extends Campaign {
  _count?: {
    rewards: number;
    vouchers: number;
    playLogs: number;
  };
}

// ============================================================================
// REWARD TYPES (Admin)
// ============================================================================

export interface Reward {
  id: number;
  campaignId: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  probability: number;
  totalQuantity: number | null;
  remainingQty: number | null;
  value: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface RewardInput {
  campaignId: number;
  name: string;
  description?: string;
  iconUrl?: string;
  probability: number;
  totalQuantity?: number | null;
  value?: number;
  isActive?: boolean;
  displayOrder?: number;
}

// ============================================================================
// AUTH TYPES (Admin)
// ============================================================================

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminUser;
}

export interface AdminUser {
  id: number;
  username: string;
  displayName: string | null;
  role: 'admin' | 'staff';
  lastLogin: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// STATS TYPES (Admin)
// ============================================================================

export interface DashboardStats {
  today: {
    plays: number;
    wins: number;
    newPlayers: number;
    vouchersIssued: number;
    vouchersRedeemed: number;
    winRate: string;
  };
  campaign: {
    id: number;
    name: string;
    daysRemaining: number;
    totalPlays: number;
    totalWins: number;
    totalPlayers: number;
    vouchersIssued: number;
    vouchersRedeemed: number;
    winRate: string;
  };
  rewardStats: Array<{
    id: number;
    name: string;
    issued: number;
    redeemed: number;
    remaining: number;
    redeemRate: string;
  }>;
}

export interface PlayStatsQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  campaignId?: number;
}

export interface PlayStatsItem {
  date: string;
  plays: number;
  wins: number;
  winRate: number;
}

export interface PlayStatsResponse {
  summary: {
    totalPlays: number;
    totalWins: number;
    winRate: string;
  };
  chart: PlayStatsItem[];
}

export interface VoucherStats {
  byStatus: {
    active: number;
    used: number;
    expired: number;
    cancelled: number;
  };
  byReward: Array<{
    rewardId: number;
    rewardName: string;
    total: number;
    used: number;
  }>;
}

// ============================================================================
// ASSET TYPES (Admin)
// ============================================================================

export interface GameAsset {
  id: number;
  gameType: GameType;
  assetType: string;
  assetName: string;
  assetUrl: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface AssetListQuery {
  gameType?: GameType;
  assetType?: string;
}

// ============================================================================
// STORE CONFIG (Admin)
// ============================================================================

export interface StoreConfig {
  id: number;
  storeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string | null;
  hotline: string | null;
  fanpageUrl: string | null;
  instagramUrl: string | null;
  zaloUrl: string | null;
  updatedAt: string;
}

export interface UpdateConfigInput {
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
}

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PHONE: 'INVALID_PHONE',
  CAMPAIGN_NOT_ACTIVE: 'CAMPAIGN_NOT_ACTIVE',
  CAMPAIGN_ENDED: 'CAMPAIGN_ENDED',
  NO_PLAYS_LEFT: 'NO_PLAYS_LEFT',
  VOUCHER_NOT_FOUND: 'VOUCHER_NOT_FOUND',
  VOUCHER_EXPIRED: 'VOUCHER_EXPIRED',
  VOUCHER_USED: 'VOUCHER_USED',
  VOUCHER_CANCELLED: 'VOUCHER_CANCELLED',
  NOT_FOUND: 'NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
