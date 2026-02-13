// src/lib/api.ts
// API Client — Type-safe Axios wrapper for all backend endpoints

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  ApiResponse,
  ApiError,
  PublicConfig,
  RegisterPlayerInput,
  RegisterResponse,
  EligibilityResult,
  PlayGameInput,
  PlayResult,
  Voucher,
  VoucherWithRelations,
  VoucherListQuery,
  VoucherVerifyResult,
  Campaign,
  CampaignInput,
  CampaignWithStats,
  Reward,
  RewardInput,
  LoginInput,
  LoginResponse,
  AdminUser,
  ChangePasswordInput,
  DashboardStats,
  PlayStatsQuery,
  PlayStatsResponse,
  VoucherStats,
  GameAsset,
  AssetListQuery,
  StoreConfig,
  UpdateConfigInput,
  PaginationMeta,
  PlayerListItem,
  PlayerDetailResponse,
} from '@/types/api.types';
import { API_URL, STORAGE_KEYS } from './constants';

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach auth tokens ──────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Admin token (Bearer)
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      if (adminToken && config.url?.includes('/auth/')) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
      // Admin routes: campaigns, rewards, vouchers (admin), stats, assets, config/admin, players/admin
      if (adminToken && isAdminRoute(config.url || '')) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }

      // Player token (X-Player-Token)
      const playerToken = localStorage.getItem(STORAGE_KEYS.PLAYER_TOKEN);
      if (playerToken && isPlayerRoute(config.url || '')) {
        config.headers['X-Player-Token'] = playerToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: unwrap data, handle errors ─────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;

      // Auto-logout on invalid token
      if (
        apiError.code === 'UNAUTHORIZED' ||
        apiError.code === 'INVALID_TOKEN'
      ) {
        if (typeof window !== 'undefined') {
          // Determine which token is invalid based on the current URL
          const url = error.config?.url || '';
          if (isAdminRoute(url)) {
            localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
            // Redirect to admin login if on admin page
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            }
          }
        }
      }

      return Promise.reject(apiError);
    }

    // Network or unknown error
    const networkError: ApiError = {
      code: 'NETWORK_ERROR',
      message: error.message || 'Lỗi kết nối. Vui lòng thử lại.',
    };
    return Promise.reject(networkError);
  }
);

// ── Route detection helpers ──────────────────────────────────────────────────

function isAdminRoute(url: string): boolean {
  const adminPatterns = [
    '/auth/me',
    '/auth/logout',
    '/auth/password',
    '/campaigns',
    '/rewards',
    '/vouchers',
    '/stats',
    '/assets',
    '/config/admin',
  ];

  // Handle /players routes: admin endpoints only (not register, eligibility, vouchers)
  if (url.includes('/players')) {
    // Exclude public and player-specific routes
    if (
      url.includes('/register') ||
      url.includes('/eligibility') ||
      url.includes('/vouchers')
    ) {
      return false;
    }
    return true;
  }

  return adminPatterns.some((pattern) => url.includes(pattern));
}

function isPlayerRoute(url: string): boolean {
  const playerPatterns = ['/game/', '/players/'];
  return playerPatterns.some((pattern) => url.includes(pattern));
}

// ============================================================================
// HELPER: Extract data from ApiResponse
// ============================================================================

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise;
  if (!response.data.success) {
    throw response.data.error;
  }
  return response.data.data as T;
}

async function unwrapWithMessage<T>(
  promise: Promise<{ data: ApiResponse<T> }>
): Promise<{ data: T; message?: string }> {
  const response = await promise;
  if (!response.data.success) {
    throw response.data.error;
  }
  return {
    data: response.data.data as T,
    message: response.data.message,
  };
}

// ============================================================================
// PUBLIC API — Config
// ============================================================================

export const configApi = {
  /** GET /api/config — Public config (store, campaign, rewards, contact) */
  getPublic: () => unwrap<PublicConfig>(apiClient.get('/config')),

  /** GET /api/config/admin — Full store config (admin) */
  getAdmin: () => unwrap<StoreConfig>(apiClient.get('/config/admin')),

  /** PUT /api/config — Update store config (admin) */
  update: (data: UpdateConfigInput) =>
    unwrap<StoreConfig>(apiClient.put('/config', data)),
};

// ============================================================================
// PUBLIC API — Player
// ============================================================================

export const playerApi = {
  /** POST /api/players/register — Register or login with phone */
  register: (data: RegisterPlayerInput) =>
    unwrapWithMessage<RegisterResponse>(apiClient.post('/players/register', data)),

  /** GET /api/players/:id/vouchers — Player's vouchers */
  getMyVouchers: (playerId: number, query?: { status?: string; page?: number }) =>
    unwrap<{ vouchers: VoucherWithRelations[]; pagination: PaginationMeta }>(
      apiClient.get(`/players/${playerId}/vouchers`, { params: query })
    ),

  /** GET /api/players — List players (admin) */
  list: (query?: { page?: number; limit?: number; search?: string }) =>
    unwrap<{ players: PlayerListItem[]; pagination: PaginationMeta }>(
      apiClient.get('/players', { params: query })
    ),

  /** GET /api/players/:id — Player detail (admin) */
  getDetail: (id: number) =>
    unwrap<PlayerDetailResponse>(apiClient.get(`/players/${id}`)),
};

// ============================================================================
// PUBLIC API — Game
// ============================================================================

export const gameApi = {
  /** POST /api/game/play — Play the game */
  play: (data: PlayGameInput) =>
    unwrapWithMessage<PlayResult>(apiClient.post('/game/play', data)),

  /** GET /api/game/eligibility — Check if player can play */
  checkEligibility: () =>
    unwrap<EligibilityResult>(apiClient.get('/game/eligibility')),
};

// ============================================================================
// ADMIN API — Auth
// ============================================================================

export const authApi = {
  /** POST /api/auth/login */
  login: (data: LoginInput) =>
    unwrap<LoginResponse>(apiClient.post('/auth/login', data)),

  /** GET /api/auth/me */
  getMe: () => unwrap<AdminUser>(apiClient.get('/auth/me')),

  /** POST /api/auth/logout */
  logout: () => unwrap<null>(apiClient.post('/auth/logout')),

  /** PUT /api/auth/password */
  changePassword: (data: ChangePasswordInput) =>
    unwrap<null>(apiClient.put('/auth/password', data)),
};

// ============================================================================
// ADMIN API — Campaigns
// ============================================================================

export const campaignApi = {
  /** GET /api/campaigns */
  list: (query?: { page?: number; limit?: number; status?: string }) =>
    unwrap<{ campaigns: CampaignWithStats[]; pagination: PaginationMeta }>(
      apiClient.get('/campaigns', { params: query })
    ),

  /** GET /api/campaigns/:id */
  getById: (id: number) =>
    unwrap<CampaignWithStats>(apiClient.get(`/campaigns/${id}`)),

  /** POST /api/campaigns */
  create: (data: CampaignInput) =>
    unwrap<Campaign>(apiClient.post('/campaigns', data)),

  /** PUT /api/campaigns/:id */
  update: (id: number, data: Partial<CampaignInput>) =>
    unwrap<Campaign>(apiClient.put(`/campaigns/${id}`, data)),

  /** PATCH /api/campaigns/:id/toggle */
  toggle: (id: number) =>
    unwrap<Campaign>(apiClient.patch(`/campaigns/${id}/toggle`)),

  /** DELETE /api/campaigns/:id */
  delete: (id: number) =>
    unwrap<null>(apiClient.delete(`/campaigns/${id}`)),
};

// ============================================================================
// ADMIN API — Rewards
// ============================================================================

export const rewardApi = {
  /** GET /api/rewards */
  list: (query?: { campaignId?: number; page?: number; limit?: number }) =>
    unwrap<{ rewards: Reward[]; pagination: PaginationMeta }>(
      apiClient.get('/rewards', { params: query })
    ),

  /** GET /api/rewards/:id */
  getById: (id: number) => unwrap<Reward>(apiClient.get(`/rewards/${id}`)),

  /** POST /api/rewards */
  create: (data: RewardInput) =>
    unwrap<Reward>(apiClient.post('/rewards', data)),

  /** PUT /api/rewards/:id */
  update: (id: number, data: Partial<RewardInput>) =>
    unwrap<Reward>(apiClient.put(`/rewards/${id}`, data)),

  /** PATCH /api/rewards/:id/toggle */
  toggle: (id: number) =>
    unwrap<Reward>(apiClient.patch(`/rewards/${id}/toggle`)),

  /** PATCH /api/rewards/:id/quantity */
  updateQuantity: (id: number, data: { totalQuantity: number; remainingQty: number }) =>
    unwrap<Reward>(apiClient.patch(`/rewards/${id}/quantity`, data)),

  /** DELETE /api/rewards/:id */
  delete: (id: number) => unwrap<null>(apiClient.delete(`/rewards/${id}`)),
};

// ============================================================================
// ADMIN API — Vouchers
// ============================================================================

export const voucherApi = {
  /** GET /api/vouchers — List all vouchers */
  list: (query?: VoucherListQuery) =>
    unwrap<{ vouchers: VoucherWithRelations[]; pagination: PaginationMeta }>(
      apiClient.get('/vouchers', { params: query })
    ),

  /** GET /api/vouchers/:code — Get voucher by code */
  getByCode: (code: string) =>
    unwrap<VoucherWithRelations>(apiClient.get(`/vouchers/${code}`)),

  /** GET /api/vouchers/:code/verify — Verify voucher validity */
  verify: (code: string) =>
    unwrap<VoucherVerifyResult>(apiClient.get(`/vouchers/${code}/verify`)),

  /** POST /api/vouchers/:code/redeem — Redeem a voucher */
  redeem: (code: string, notes?: string) =>
    unwrapWithMessage<Voucher>(
      apiClient.post(`/vouchers/${code}/redeem`, { notes })
    ),

  /** PATCH /api/vouchers/:id/cancel — Cancel a voucher */
  cancel: (id: number, reason?: string) =>
    unwrap<Voucher>(apiClient.patch(`/vouchers/${id}/cancel`, { reason })),
};

// ============================================================================
// ADMIN API — Stats
// ============================================================================

export const statsApi = {
  /** GET /api/stats/dashboard */
  getOverview: () =>
    unwrap<DashboardStats>(apiClient.get('/stats/dashboard')),

  /** GET /api/stats/plays */
  getPlayStats: (query?: PlayStatsQuery) =>
    unwrap<PlayStatsResponse>(apiClient.get('/stats/plays', { params: query })),

  /** GET /api/stats/vouchers */
  getVoucherStats: () =>
    unwrap<VoucherStats>(apiClient.get('/stats/vouchers')),
};

// ============================================================================
// ADMIN API — Assets
// ============================================================================

export const assetApi = {
  /** GET /api/assets */
  list: (query?: AssetListQuery) =>
    unwrap<{ assets: GameAsset[]; pagination: PaginationMeta }>(apiClient.get('/assets', { params: query })),

  /** GET /api/assets/:id */
  getById: (id: number) =>
    unwrap<GameAsset>(apiClient.get(`/assets/${id}`)),

  /** POST /api/assets/upload — Upload a file */
  upload: (formData: FormData) =>
    unwrap<GameAsset>(
      apiClient.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),

  /** PUT /api/assets/:id — Update asset metadata */
  update: (id: number, data: Partial<GameAsset>) =>
    unwrap<GameAsset>(apiClient.put(`/assets/${id}`, data)),

  /** PATCH /api/assets/:id/toggle */
  toggle: (id: number) =>
    unwrap<GameAsset>(apiClient.patch(`/assets/${id}/toggle`)),

  /** DELETE /api/assets/:id */
  delete: (id: number) => unwrap<null>(apiClient.delete(`/assets/${id}`)),
};

// ============================================================================
// EXPORT RAW CLIENT (for SWR fetcher)
// ============================================================================

/** SWR fetcher that handles ApiResponse unwrapping */
export const swrFetcher = async <T>(url: string): Promise<T> => {
  const response = await apiClient.get<ApiResponse<T>>(url);
  if (!response.data.success) {
    throw response.data.error;
  }
  return response.data.data as T;
};

export default apiClient;
