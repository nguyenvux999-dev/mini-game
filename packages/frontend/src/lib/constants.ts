// src/lib/constants.ts
// Application constants

/** Backend API base URL */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** API endpoints prefix */
export const API_PREFIX = '/api';

/** Full API URL */
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

/** Token storage keys */
export const STORAGE_KEYS = {
  PLAYER_TOKEN: 'minigame_player_token',
  ADMIN_TOKEN: 'minigame_admin_token',
  PLAYER_DATA: 'minigame_player_data',
} as const;

/** SWR cache keys */
export const SWR_KEYS = {
  CONFIG: '/config',
  ELIGIBILITY: '/game/eligibility',
  ADMIN_ME: '/auth/me',
  CAMPAIGNS: '/campaigns',
  REWARDS: '/rewards',
  VOUCHERS: '/vouchers',
  STATS_OVERVIEW: '/stats/dashboard',
  STATS_PLAYS: '/stats/plays',
  STATS_VOUCHERS: '/stats/vouchers',
  PLAYERS: '/players',
  ASSETS: '/assets',
} as const;

/** Game types */
export const GAME_TYPES = {
  WHEEL: 'wheel',
  SHAKE: 'shake',
  MEMORY: 'memory',
  TAP: 'tap',
} as const;

/** Game type display names */
export const GAME_TYPE_LABELS: Record<string, string> = {
  wheel: 'Vòng Quay',
  shake: 'Lắc Xì',
  memory: 'Lật Hình',
  tap: 'Tap Tap',
};

/** Voucher status display */
export const VOUCHER_STATUS_LABELS: Record<string, string> = {
  active: 'Chưa dùng',
  used: 'Đã dùng',
  expired: 'Hết hạn',
  cancelled: 'Đã huỷ',
};

/** Voucher status colors (Tailwind classes) */
export const VOUCHER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  used: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800',
};

/** Vietnam phone regex */
export const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

/** Max file upload size (5MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Accepted image types */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
