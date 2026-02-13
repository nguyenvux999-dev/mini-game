// src/app/admin/assets/page.tsx
// Asset Management — Upload, list, filter, toggle, delete game assets

'use client';

import React, { useState, useCallback, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import Image from 'next/image';
import PageHeader from '@/components/admin/PageHeader';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import { useToast } from '@/components/common/Toast';
import { assetApi, swrFetcher } from '@/lib/api';
import { SWR_KEYS } from '@/lib/constants';
import { formatDateTime, getAssetUrl } from '@/lib/utils';
import type { GameAsset, GameType, PaginationMeta } from '@/types/api.types';

// ── Constants ────────────────────────────────────────────────────────────────

const GAME_TYPE_OPTIONS: { value: GameType; label: string }[] = [
  { value: 'wheel', label: 'Vòng Quay' },
  { value: 'shake', label: 'Lắc Xì' },
  { value: 'memory', label: 'Lật Hình' },
  { value: 'tap', label: 'Tap Tap' },
];

const ASSET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'background', label: 'Background' },
  { value: 'character', label: 'Character' },
  { value: 'icon', label: 'Icon' },
  { value: 'card', label: 'Card' },
  { value: 'falling_object', label: 'Falling Object' },
  { value: 'sound', label: 'Sound' },
];

const UPLOAD_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'reward_icon', label: 'Icon phần thưởng' },
  { value: 'game_background', label: 'Background game' },
  { value: 'game_character', label: 'Character game' },
  { value: 'game_card', label: 'Card game' },
];

const GAME_TYPE_LABELS: Record<string, string> = {
  wheel: 'Vòng Quay',
  shake: 'Lắc Xì',
  memory: 'Lật Hình',
  tap: 'Tap Tap',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  background: 'Background',
  character: 'Character',
  icon: 'Icon',
  card: 'Card',
  falling_object: 'Falling Object',
  sound: 'Sound',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build SWR key from filters */
function buildAssetsKey(
  gameType: string,
  assetType: string,
  page: number,
): string {
  const params = new URLSearchParams();
  if (gameType) params.set('gameType', gameType);
  if (assetType) params.set('assetType', assetType);
  params.set('page', String(page));
  params.set('limit', '20');
  const qs = params.toString();
  return qs ? `${SWR_KEYS.ASSETS}?${qs}` : SWR_KEYS.ASSETS;
}

/** Revalidate all asset SWR keys */
function revalidateAssets() {
  mutate(
    (key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.ASSETS),
    undefined,
    { revalidate: true },
  );
}

// ── Page Component ───────────────────────────────────────────────────────────

export default function AssetsPage() {
  const { addToast } = useToast();

  // ── Filter state ─────────────────────────────────────────────────────
  const [gameTypeFilter, setGameTypeFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<GameAsset | null>(null);
  const [editAsset, setEditAsset] = useState<GameAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // ── Upload form state ────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('reward_icon');
  const [uploadGameType, setUploadGameType] = useState<GameType>('wheel');
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadOrder, setUploadOrder] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Edit form state ──────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  const [editGameType, setEditGameType] = useState<GameType>('wheel');

  // ── Data fetching ────────────────────────────────────────────────────
  const swrKey = buildAssetsKey(gameTypeFilter, assetTypeFilter, page);

  const { data, isLoading } = useSWR<{
    assets: GameAsset[];
    pagination: PaginationMeta;
  }>(swrKey, swrFetcher);

  const assets = data?.assets ?? [];
  const pagination = data?.pagination;

  // ── File selection ───────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'File vượt quá 5MB');
        return;
      }

      setSelectedFile(file);

      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    [addToast],
  );

  // ── Upload handler ───────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) {
      addToast('error', 'Chọn file để upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', uploadType);
      formData.append('gameType', uploadGameType);
      if (uploadName.trim()) formData.append('assetName', uploadName.trim());
      if (uploadDescription.trim()) formData.append('description', uploadDescription.trim());
      formData.append('displayOrder', String(uploadOrder));

      await assetApi.upload(formData);
      addToast('success', 'Upload asset thành công!');

      // Reset form
      resetUploadForm();
      setUploadModalOpen(false);
      revalidateAssets();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Lỗi khi upload';
      addToast('error', message);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadType('reward_icon');
    setUploadGameType('wheel');
    setUploadName('');
    setUploadDescription('');
    setUploadOrder(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Edit handler ─────────────────────────────────────────────────────
  const openEditModal = useCallback((asset: GameAsset) => {
    setEditAsset(asset);
    setEditName(asset.assetName);
    setEditDescription(asset.description || '');
    setEditOrder(asset.displayOrder);
    setEditGameType(asset.gameType);
  }, []);

  const handleSaveEdit = async () => {
    if (!editAsset) return;

    setSaving(true);
    try {
      await assetApi.update(editAsset.id, {
        assetName: editName.trim() || undefined,
        description: editDescription.trim() || undefined,
        displayOrder: editOrder,
        gameType: editGameType,
      } as Partial<GameAsset>);

      addToast('success', 'Cập nhật asset thành công!');
      setEditAsset(null);
      revalidateAssets();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Lỗi khi cập nhật';
      addToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle handler ───────────────────────────────────────────────────
  const handleToggle = async (id: number) => {
    try {
      await assetApi.toggle(id);
      revalidateAssets();
      addToast('success', 'Đã thay đổi trạng thái');
    } catch (err: unknown) {
      addToast('error', (err as { message?: string })?.message || 'Lỗi');
    }
  };

  // ── Delete handler ───────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await assetApi.delete(id);
      setDeleteConfirm(null);
      revalidateAssets();
      addToast('success', 'Đã xoá asset');
    } catch (err: unknown) {
      addToast('error', (err as { message?: string })?.message || 'Lỗi khi xoá');
    }
  };

  // ── Table columns ────────────────────────────────────────────────────

  const columns = [
    {
      key: 'preview',
      label: 'Ảnh',
      render: (asset: GameAsset) => {
        const url = getAssetUrl(asset.assetUrl);
        return url ? (
          <button
            type="button"
            onClick={() => setPreviewAsset(asset)}
            className="group relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors"
          >
            <Image
              src={url}
              alt={asset.assetName}
              fill
              className="object-cover group-hover:scale-110 transition-transform"
              unoptimized
            />
          </button>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">
            🖼️
          </div>
        );
      },
    },
    {
      key: 'assetName',
      label: 'Tên',
      render: (asset: GameAsset) => (
        <div className="min-w-[120px]">
          <p className="font-medium text-gray-900 truncate max-w-[200px]">
            {asset.assetName}
          </p>
          {asset.description && (
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {asset.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'gameType',
      label: 'Game',
      render: (asset: GameAsset) => (
        <Badge variant="info">
          {GAME_TYPE_LABELS[asset.gameType] || asset.gameType}
        </Badge>
      ),
    },
    {
      key: 'assetType',
      label: 'Loại',
      render: (asset: GameAsset) => (
        <span className="text-sm text-gray-600">
          {ASSET_TYPE_LABELS[asset.assetType] || asset.assetType}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Thứ tự',
      render: (asset: GameAsset) => (
        <span className="text-gray-500 tabular-nums">{asset.displayOrder}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      render: (asset: GameAsset) => (
        <Badge variant={asset.isActive ? 'success' : 'default'}>
          {asset.isActive ? 'Hoạt động' : 'Tắt'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (asset: GameAsset) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDateTime(asset.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (asset: GameAsset) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleToggle(asset.id)}>
            {asset.isActive ? '⏸' : '▶'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEditModal(asset)}>
            ✏️
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirm(asset.id)}
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quản lý tài nguyên"
        description="Upload và quản lý hình ảnh game"
        breadcrumbs={[{ label: 'Tài nguyên' }]}
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetUploadForm();
              setUploadModalOpen(true);
            }}
          >
            + Upload asset
          </Button>
        }
      />

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Game:
          </label>
          <select
            value={gameTypeFilter}
            onChange={(e) => {
              setGameTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Tất cả</option>
            {GAME_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Loại:
          </label>
          <select
            value={assetTypeFilter}
            onChange={(e) => {
              setAssetTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Tất cả</option>
            {ASSET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Result count */}
        {pagination && (
          <span className="text-xs text-gray-500 sm:ml-auto">
            Tổng: {pagination.total} asset
          </span>
        )}
      </div>

      {/* ── Data Table ──────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={assets}
        keyExtractor={(a) => a.id}
        loading={isLoading}
        emptyMessage="Chưa có asset nào"
      />

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </Button>
        </div>
      )}

      {/* ── Upload Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload asset mới"
        size="lg"
      >
        <div className="space-y-4">
          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn file *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100
                file:cursor-pointer cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG, GIF, WebP — Tối đa 5MB
            </p>
          </div>

          {/* File preview */}
          {filePreview && (
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Image
                src={filePreview}
                alt="Preview"
                width={200}
                height={200}
                className="max-h-[200px] w-auto rounded-lg object-contain"
                unoptimized
              />
            </div>
          )}

          {/* Type selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại upload *
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {UPLOAD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game
              </label>
              <select
                value={uploadGameType}
                onChange={(e) => setUploadGameType(e.target.value as GameType)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {GAME_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metadata */}
          <Input
            label="Tên asset"
            placeholder="Để trống sẽ lấy tên file"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Mô tả ngắn gọn về asset..."
            />
          </div>

          <Input
            label="Thứ tự hiển thị"
            type="number"
            value={uploadOrder}
            onChange={(e) => setUploadOrder(Number(e.target.value) || 0)}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUploadModalOpen(false)}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={!selectedFile}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Image Preview Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={previewAsset !== null}
        onClose={() => setPreviewAsset(null)}
        title={previewAsset?.assetName ?? 'Xem ảnh'}
        size="lg"
      >
        {previewAsset && (
          <div className="space-y-4">
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <Image
                src={getAssetUrl(previewAsset.assetUrl) || ''}
                alt={previewAsset.assetName}
                width={480}
                height={480}
                className="max-h-[400px] w-auto rounded-lg object-contain"
                unoptimized
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Game: </span>
                <span className="font-medium">
                  {GAME_TYPE_LABELS[previewAsset.gameType] || previewAsset.gameType}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Loại: </span>
                <span className="font-medium">
                  {ASSET_TYPE_LABELS[previewAsset.assetType] || previewAsset.assetType}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Thứ tự: </span>
                <span className="font-medium">{previewAsset.displayOrder}</span>
              </div>
              <div>
                <span className="text-gray-500">Trạng thái: </span>
                <Badge variant={previewAsset.isActive ? 'success' : 'default'}>
                  {previewAsset.isActive ? 'Hoạt động' : 'Tắt'}
                </Badge>
              </div>
              {previewAsset.description && (
                <div className="col-span-2">
                  <span className="text-gray-500">Mô tả: </span>
                  <span className="text-gray-700">{previewAsset.description}</span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-gray-500">URL: </span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                  {previewAsset.assetUrl}
                </code>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={editAsset !== null}
        onClose={() => setEditAsset(null)}
        title="Chỉnh sửa asset"
        size="lg"
      >
        {editAsset && (
          <div className="space-y-4">
            {/* Current image preview */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Image
                src={getAssetUrl(editAsset.assetUrl) || ''}
                alt={editAsset.assetName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-cover"
                unoptimized
              />
              <div className="text-sm">
                <p className="text-gray-500">
                  {ASSET_TYPE_LABELS[editAsset.assetType] || editAsset.assetType}
                </p>
                <p className="text-xs text-gray-400">{editAsset.assetUrl}</p>
              </div>
            </div>

            <Input
              label="Tên asset"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game
              </label>
              <select
                value={editGameType}
                onChange={(e) => setEditGameType(e.target.value as GameType)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {GAME_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <Input
              label="Thứ tự hiển thị"
              type="number"
              value={editOrder}
              onChange={(e) => setEditOrder(Number(e.target.value) || 0)}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditAsset(null)}
              >
                Huỷ
              </Button>
              <Button onClick={handleSaveEdit} loading={saving}>
                Cập nhật
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Xoá asset"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Bạn có chắc muốn xoá asset này? File sẽ bị xoá khỏi máy chủ.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Huỷ
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Xoá
          </Button>
        </div>
      </Modal>
    </div>
  );
}
