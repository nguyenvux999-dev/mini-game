// src/types/api.types.ts
// TypeScript types cho API responses

/**
 * Base API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/**
 * API Error format
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Pagination response
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// CONFIG API TYPES
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
  activeGame: string;
  gameConfig: Record<string, any> | null;
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

export interface ConfigResponse {
  store: StoreInfo;
  campaign: CampaignInfo | null;
  rewards: RewardInfo[];
  contact: ContactInfo;
}

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PHONE: 'INVALID_PHONE',
  
  // Campaign
  CAMPAIGN_NOT_ACTIVE: 'CAMPAIGN_NOT_ACTIVE',
  CAMPAIGN_ENDED: 'CAMPAIGN_ENDED',
  NO_PLAYS_LEFT: 'NO_PLAYS_LEFT',
  
  // Voucher
  VOUCHER_NOT_FOUND: 'VOUCHER_NOT_FOUND',
  VOUCHER_EXPIRED: 'VOUCHER_EXPIRED',
  VOUCHER_USED: 'VOUCHER_USED',
  VOUCHER_CANCELLED: 'VOUCHER_CANCELLED',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  
  // File
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Rate limit
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
