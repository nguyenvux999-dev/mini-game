// src/components/admin/GameConfigForm.tsx
// Dynamic game configuration form — renders fields based on selected game type.
// Supports asset-picker fields that load images from the game_assets API.

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Input from '@/components/common/Input';
import { assetApi } from '@/lib/api';
import { getAssetUrl } from '@/lib/utils';
import type { GameType, GameAsset } from '@/types/api.types';
import { DEFAULT_GAME_CONFIGS } from '@/types/game.types';

// ── Field definition registry ────────────────────────────────────────────────

type FieldType = 'number' | 'select' | 'color-list' | 'text' | 'asset-picker' | 'asset-picker-multi';

interface FieldDef {
  /** Key in the config object */
  key: string;
  /** Display label */
  label: string;
  /** Field type */
  type: FieldType;
  /** For select fields */
  options?: { value: string; label: string }[];
  /** For number fields */
  min?: number;
  max?: number;
  step?: number;
  /** Unit suffix displayed next to input */
  suffix?: string;
  /** Help text */
  hint?: string;
  /** For asset-picker: which asset_type to filter (background, character, icon, card, falling_object) */
  assetType?: string;
}

/**
 * Central registry of config fields per game type.
 * To add a new game, add an entry here — no other changes needed in this component.
 */
const FIELD_DEFINITIONS: Record<GameType, FieldDef[]> = {
  // ── Wheel ──────────────────────────────────────────────────────────
  wheel: [
    {
      key: 'spinDuration',
      label: 'Thời gian quay',
      type: 'number',
      min: 2000,
      max: 10000,
      step: 500,
      suffix: 'ms',
      hint: 'Thời gian quay vòng (2000–10000ms)',
    },
    {
      key: 'pointer',
      label: 'Vị trí kim chỉ',
      type: 'select',
      options: [
        { value: 'top', label: 'Trên' },
        { value: 'right', label: 'Phải' },
      ],
    },
    {
      key: 'colors',
      label: 'Màu ô (hex, phân cách bằng dấu phẩy)',
      type: 'color-list',
      hint: 'VD: #FF6B35, #F7C59F, #2EC4B6, #E71D36',
    },
  ],

  // ── Shake ──────────────────────────────────────────────────────────
  shake: [
    {
      key: 'theme',
      label: 'Chủ đề',
      type: 'select',
      options: [
        { value: 'tree', label: '🌳 Cây may mắn' },
        { value: 'santa', label: '🎅 Ông già Noel' },
        { value: 'firework', label: '🎆 Pháo hoa' },
      ],
    },
    {
      key: 'shakeSensitivity',
      label: 'Độ nhạy lắc',
      type: 'number',
      min: 5,
      max: 30,
      step: 1,
      hint: 'Giá trị nhỏ = nhạy hơn (5–30)',
    },
    {
      key: 'duration',
      label: 'Thời gian chơi',
      type: 'number',
      min: 5,
      max: 30,
      step: 1,
      suffix: 'giây',
    },
    {
      key: 'fallingObject',
      label: 'Hình vật rơi',
      type: 'asset-picker',
      assetType: 'falling_object',
      hint: 'Chọn ảnh vật rơi khi lắc (từ thư viện tài nguyên)',
    },
    {
      key: 'background',
      label: 'Ảnh nền game',
      type: 'asset-picker',
      assetType: 'background',
      hint: 'Chọn ảnh nền cho game Lắc Xì',
    },
  ],

  // ── Memory ─────────────────────────────────────────────────────────
  memory: [
    {
      key: 'gridSize',
      label: 'Kích thước lưới',
      type: 'select',
      options: [
        { value: '3x3', label: '3×3 (4 cặp)' },
        { value: '4x4', label: '4×4 (8 cặp)' },
      ],
    },
    {
      key: 'timeLimit',
      label: 'Giới hạn thời gian',
      type: 'number',
      min: 15,
      max: 120,
      step: 5,
      suffix: 'giây',
    },
    {
      key: 'matchesToWin',
      label: 'Số cặp cần ghép đúng',
      type: 'number',
      min: 2,
      max: 8,
      step: 1,
      hint: '3×3 tối đa 4, 4×4 tối đa 8',
    },
    {
      key: 'cardImages',
      label: 'Hình mặt thẻ',
      type: 'asset-picker-multi',
      assetType: 'card',
      hint: 'Chọn ảnh cho mặt trước thẻ bài (từ thư viện tài nguyên)',
    },
  ],

  // ── Tap ────────────────────────────────────────────────────────────
  tap: [
    {
      key: 'variant',
      label: 'Kiểu chơi',
      type: 'select',
      options: [
        { value: 'eating', label: '🍔 Ăn nhanh (nhấn đủ số lần)' },
        { value: 'cooking', label: '🍳 Nấu ăn (dừng đúng vùng xanh)' },
      ],
    },
    {
      key: 'targetTaps',
      label: 'Số tap cần đạt',
      type: 'number',
      min: 10,
      max: 200,
      step: 5,
      hint: 'Áp dụng cho kiểu "Ăn nhanh"',
    },
    {
      key: 'perfectZones',
      label: 'Số vùng hoàn hảo',
      type: 'number',
      min: 1,
      max: 10,
      step: 1,
      hint: 'Áp dụng cho kiểu "Nấu ăn"',
    },
    {
      key: 'timeLimit',
      label: 'Giới hạn thời gian',
      type: 'number',
      min: 5,
      max: 60,
      step: 1,
      suffix: 'giây',
    },
    {
      key: 'character',
      label: 'Nhân vật',
      type: 'asset-picker',
      assetType: 'character',
      hint: 'Chọn ảnh nhân vật (đầu bếp, người ăn...)',
    },
    {
      key: 'targetItem',
      label: 'Vật phẩm mục tiêu',
      type: 'asset-picker',
      assetType: 'icon',
      hint: 'Chọn ảnh món ăn / vật phẩm cần tương tác',
    },
  ],
};

// ── Asset Picker Sub-Component ────────────────────────────────────────────────

interface AssetPickerFieldProps {
  gameType: GameType;
  assetType: string;
  /** Currently selected asset URL (single) */
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
}

function AssetPickerField({ gameType, assetType, value, onChange, label, hint }: AssetPickerFieldProps) {
  const [assets, setAssets] = useState<GameAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await assetApi.list({ gameType, assetType });
        if (!cancelled) {
          const list = Array.isArray(result) ? result : (result?.assets ?? []);
          setAssets(list.filter((a: GameAsset) => a.isActive));
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setAssets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [gameType, assetType]);

  const selectedUrl = value || '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {loading && (
        <div className="flex items-center gap-2 py-3">
          <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-gray-400">Đang tải tài nguyên...</span>
        </div>
      )}

      {loaded && assets.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">
          Chưa có tài nguyên nào. Hãy upload ảnh trong mục &quot;Tài nguyên game&quot; trước.
        </p>
      )}

      {loaded && assets.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-1">
          {/* None option */}
          <button
            type="button"
            onClick={() => onChange('')}
            className={`relative aspect-square rounded-lg border-2 flex items-center justify-center text-xs text-gray-400 transition-colors ${
              !selectedUrl ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Không
          </button>

          {assets.map((asset) => {
            const url = asset.assetUrl;
            const imgSrc = getAssetUrl(url);
            const isSelected = selectedUrl === url;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onChange(url)}
                className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-colors ${
                  isSelected ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-200 hover:border-gray-300'
                }`}
                title={asset.assetName}
              >
                {imgSrc && (
                  <Image
                    src={imgSrc}
                    alt={asset.assetName}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
                {isSelected && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Multi Asset Picker (for cardImages) ──────────────────────────────────────

interface AssetPickerMultiFieldProps {
  gameType: GameType;
  assetType: string;
  /** Currently selected asset URLs */
  value: string[];
  onChange: (urls: string[]) => void;
  label: string;
  hint?: string;
}

function AssetPickerMultiField({ gameType, assetType, value, onChange, label, hint }: AssetPickerMultiFieldProps) {
  const [assets, setAssets] = useState<GameAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await assetApi.list({ gameType, assetType });
        if (!cancelled) {
          const list = Array.isArray(result) ? result : (result?.assets ?? []);
          setAssets(list.filter((a: GameAsset) => a.isActive));
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setAssets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [gameType, assetType]);

  const selected = Array.isArray(value) ? value : [];

  const toggleAsset = (url: string) => {
    if (selected.includes(url)) {
      onChange(selected.filter((u) => u !== url));
    } else {
      onChange([...selected, url]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {selected.length > 0 && (
          <span className="ml-2 text-xs text-orange-500 font-normal">
            ({selected.length} đã chọn)
          </span>
        )}
      </label>

      {loading && (
        <div className="flex items-center gap-2 py-3">
          <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-gray-400">Đang tải tài nguyên...</span>
        </div>
      )}

      {loaded && assets.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">
          Chưa có tài nguyên nào. Hãy upload ảnh trong mục &quot;Tài nguyên game&quot; trước.
        </p>
      )}

      {loaded && assets.length > 0 && (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-1">
            {assets.map((asset) => {
              const url = asset.assetUrl;
              const imgSrc = getAssetUrl(url);
              const isSelected = selected.includes(url);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleAsset(url)}
                  className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-colors ${
                    isSelected ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={asset.assetName}
                >
                  {imgSrc && (
                    <Image
                      src={imgSrc}
                      alt={asset.assetName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1.5 text-xs text-red-500 hover:text-red-600"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </>
      )}

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface GameConfigFormProps {
  /** Currently selected game type */
  gameType: GameType;
  /** Current config values (partial — merged with defaults on read) */
  value: Record<string, unknown>;
  /** Called when any field changes */
  onChange: (config: Record<string, unknown>) => void;
}

export default function GameConfigForm({ gameType, value, onChange }: GameConfigFormProps) {
  const fields = FIELD_DEFINITIONS[gameType] ?? [];
  const defaults = DEFAULT_GAME_CONFIGS[gameType] as unknown as Record<string, unknown>;

  /** Get resolved value for a field (config → default) */
  const getVal = useCallback(
    (key: string) => {
      return value[key] ?? defaults[key] ?? '';
    },
    [value, defaults],
  );

  /** Update a single key in the config object */
  const setField = useCallback(
    (key: string, val: unknown) => {
      onChange({ ...value, [key]: val });
    },
    [value, onChange],
  );

  if (fields.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        Chưa có cấu hình cho loại game này.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const fieldKey = field.key as string;

        // ── SELECT ─────────────────────────────────────────────────
        if (field.type === 'select' && field.options) {
          return (
            <div key={fieldKey}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <select
                value={String(getVal(fieldKey))}
                onChange={(e) => setField(fieldKey, e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {field.hint && (
                <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
              )}
            </div>
          );
        }

        // ── NUMBER ─────────────────────────────────────────────────
        if (field.type === 'number') {
          return (
            <div key={fieldKey}>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label={field.label}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={Number(getVal(fieldKey)) || 0}
                    onChange={(e) => setField(fieldKey, Number(e.target.value))}
                  />
                </div>
                {field.suffix && (
                  <span className="pb-2.5 text-sm text-gray-500 whitespace-nowrap">
                    {field.suffix}
                  </span>
                )}
              </div>
              {field.hint && (
                <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
              )}
            </div>
          );
        }

        // ── COLOR-LIST (comma-separated hex) ───────────────────────
        if (field.type === 'color-list') {
          const colorArr = Array.isArray(getVal(fieldKey))
            ? (getVal(fieldKey) as string[])
            : [];
          const colorStr = colorArr.join(', ');

          return (
            <div key={fieldKey}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <textarea
                rows={2}
                value={colorStr}
                onChange={(e) => {
                  const colors = e.target.value
                    .split(',')
                    .map((c) => c.trim())
                    .filter((c) => c.length > 0);
                  setField(fieldKey, colors);
                }}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-sm"
                placeholder="#FF6B35, #F7C59F, #2EC4B6"
              />
              {/* Color preview */}
              {colorArr.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {colorArr.map((c, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              )}
              {field.hint && (
                <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
              )}
            </div>
          );
        }

        // ── ASSET-PICKER (single) ──────────────────────────────────
        if (field.type === 'asset-picker' && field.assetType) {
          return (
            <AssetPickerField
              key={fieldKey}
              gameType={gameType}
              assetType={field.assetType}
              value={String(getVal(fieldKey) || '')}
              onChange={(url) => setField(fieldKey, url)}
              label={field.label}
              hint={field.hint}
            />
          );
        }

        // ── ASSET-PICKER-MULTI (multiple) ──────────────────────────
        if (field.type === 'asset-picker-multi' && field.assetType) {
          const currentArr = Array.isArray(getVal(fieldKey)) ? (getVal(fieldKey) as string[]) : [];
          return (
            <AssetPickerMultiField
              key={fieldKey}
              gameType={gameType}
              assetType={field.assetType}
              value={currentArr}
              onChange={(urls) => setField(fieldKey, urls)}
              label={field.label}
              hint={field.hint}
            />
          );
        }

        // ── TEXT (fallback) ────────────────────────────────────────
        return (
          <div key={fieldKey}>
            <Input
              label={field.label}
              value={String(getVal(fieldKey))}
              onChange={(e) => setField(fieldKey, e.target.value)}
            />
            {field.hint && (
              <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
