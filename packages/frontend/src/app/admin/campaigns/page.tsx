// src/app/admin/campaigns/page.tsx
// Campaign Management — CRUD with DataTable + Modal form

'use client';

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/admin/PageHeader';
import DataTable from '@/components/admin/DataTable';
import GameConfigForm from '@/components/admin/GameConfigForm';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import { useToast } from '@/components/common/Toast';
import { campaignApi, swrFetcher } from '@/lib/api';
import { SWR_KEYS, GAME_TYPE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { DEFAULT_GAME_CONFIGS } from '@/types/game.types';
import type { CampaignWithStats, GameType, PaginationMeta } from '@/types/api.types';

// ── Validation Schema ────────────────────────────────────────────────────────

const campaignSchema = z.object({
  name: z.string().min(1, 'Tên chiến dịch không được để trống').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  startDate: z.string().min(1, 'Bắt buộc'),
  endDate: z.string().min(1, 'Bắt buộc'),
  activeGame: z.enum(['wheel', 'shake', 'memory', 'tap']),
  maxPlaysPerPhone: z.coerce.number().int().min(1).max(100),
  isActive: z.boolean(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function CampaignsPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [gameConfig, setGameConfig] = useState<Record<string, unknown>>({});

  // ── Data fetching ──────────────────────────────────────────────────────

  const { data, isLoading } = useSWR<{
    campaigns: CampaignWithStats[];
    pagination: PaginationMeta;
  }>(
    `${SWR_KEYS.CAMPAIGNS}?page=${page}&limit=10&status=${statusFilter}`,
    swrFetcher
  );

  const campaigns = data?.campaigns || [];
  const pagination = data?.pagination;

  // ── Form ───────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      activeGame: 'wheel',
      maxPlaysPerPhone: 1,
      isActive: false,
    },
  });

  const watchedGame = watch('activeGame') as GameType;

  const openCreateModal = () => {
    setEditingId(null);
    reset({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      activeGame: 'wheel',
      maxPlaysPerPhone: 1,
      isActive: false,
    });
    setGameConfig({ ...(DEFAULT_GAME_CONFIGS.wheel as unknown as Record<string, unknown>) });
    setModalOpen(true);
  };

  const openEditModal = useCallback(
    async (id: number) => {
      try {
        const campaign = await campaignApi.getById(id);
        setEditingId(id);
        reset({
          name: campaign.name,
          description: campaign.description || '',
          startDate: campaign.startDate.slice(0, 16),
          endDate: campaign.endDate.slice(0, 16),
          activeGame: campaign.activeGame,
          maxPlaysPerPhone: campaign.maxPlaysPerPhone,
          isActive: campaign.isActive,
        });
        // Parse gameConfig: backend returns wrapped format { "wheel": { ... } }
        const rawConfig = campaign.gameConfig;
        const parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
        // Unwrap: extract the inner config for the game type
        const innerConfig = parsed?.[campaign.activeGame] ?? parsed ?? {};
        const defaults = DEFAULT_GAME_CONFIGS[campaign.activeGame];
        setGameConfig({ ...(defaults as unknown as Record<string, unknown>), ...innerConfig });
        setModalOpen(true);
      } catch {
        addToast('error', 'Không thể tải dữ liệu chiến dịch');
      }
    },
    [reset, addToast]
  );

  const onSubmit = async (formData: CampaignFormData) => {
    setSaving(true);
    try {
      // Wrap gameConfig with game type key per SYSTEM_DESIGN format:
      // { "wheel": { segments: 8, ... } }
      const wrappedConfig = { [formData.activeGame]: gameConfig };

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        activeGame: formData.activeGame as GameType,
        gameConfig: wrappedConfig,
        maxPlaysPerPhone: formData.maxPlaysPerPhone,
        isActive: formData.isActive,
      };

      if (editingId) {
        await campaignApi.update(editingId, payload);
        addToast('success', 'Cập nhật chiến dịch thành công!');
      } else {
        await campaignApi.create(payload);
        addToast('success', 'Tạo chiến dịch thành công!');
      }

      setModalOpen(false);
      mutate((key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.CAMPAIGNS));
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Lỗi khi lưu';
      addToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle & Delete ────────────────────────────────────────────────────

  const handleToggle = async (id: number) => {
    try {
      await campaignApi.toggle(id);
      mutate((key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.CAMPAIGNS));
      addToast('success', 'Đã thay đổi trạng thái chiến dịch');
    } catch (err: unknown) {
      addToast('error', (err as { message?: string })?.message || 'Lỗi');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await campaignApi.delete(id);
      setDeleteConfirm(null);
      mutate((key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.CAMPAIGNS));
      addToast('success', 'Đã xoá chiến dịch');
    } catch (err: unknown) {
      addToast('error', (err as { message?: string })?.message || 'Lỗi khi xoá');
    }
  };

  // ── Campaign status helper ─────────────────────────────────────────────

  const getCampaignStatus = (c: CampaignWithStats) => {
    if (!c.isActive) return { label: 'Tắt', variant: 'default' as const };
    const now = new Date();
    if (new Date(c.endDate) < now) return { label: 'Kết thúc', variant: 'error' as const };
    if (new Date(c.startDate) > now) return { label: 'Sắp diễn ra', variant: 'warning' as const };
    return { label: 'Đang chạy', variant: 'success' as const };
  };

  // ── Table columns ──────────────────────────────────────────────────────

  const columns = [
    {
      key: 'name',
      label: 'Tên chiến dịch',
      render: (c: CampaignWithStats) => (
        <div>
          <p className="font-medium text-gray-900">{c.name}</p>
          {c.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
              {c.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'activeGame',
      label: 'Game',
      render: (c: CampaignWithStats) => (
        <Badge variant="info">
          {GAME_TYPE_LABELS[c.activeGame] || c.activeGame}
        </Badge>
      ),
    },
    {
      key: 'dates',
      label: 'Thời gian',
      render: (c: CampaignWithStats) => (
        <div className="text-xs text-gray-600">
          <div>{formatDate(c.startDate)}</div>
          <div className="text-gray-400">→ {formatDate(c.endDate)}</div>
        </div>
      ),
    },
    {
      key: 'maxPlaysPerPhone',
      label: 'Lượt/SĐT',
      render: (c: CampaignWithStats) => (
        <span className="text-gray-700">{c.maxPlaysPerPhone}</span>
      ),
    },
    {
      key: 'stats',
      label: 'Thống kê',
      render: (c: CampaignWithStats) =>
        c._count ? (
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>{c._count.rewards} phần thưởng</div>
            <div>{c._count.playLogs} lượt chơi</div>
            <div>{c._count.vouchers} voucher</div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (c: CampaignWithStats) => {
        const s = getCampaignStatus(c);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (c: CampaignWithStats) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggle(c.id)}
            title={c.isActive ? 'Tắt' : 'Bật'}
          >
            {c.isActive ? '⏸' : '▶'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEditModal(c.id)}>
            ✏️
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirm(c.id)}
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quản lý chiến dịch"
        description="Tạo và quản lý các chiến dịch minigame"
        breadcrumbs={[{ label: 'Chiến dịch' }]}
        actions={
          <Button size="sm" onClick={openCreateModal}>
            + Tạo chiến dịch
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'ended'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'Tất cả' : s === 'active' ? 'Đang chạy' : 'Kết thúc'}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={campaigns}
        keyExtractor={(c) => c.id}
        loading={isLoading}
        emptyMessage="Chưa có chiến dịch nào"
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Tổng: {pagination.total} chiến dịch
          </span>
          <div className="flex gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    page === p
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Create/Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Sửa chiến dịch' : 'Tạo chiến dịch mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tên chiến dịch *"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bắt đầu *"
              type="datetime-local"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <Input
              label="Kết thúc *"
              type="datetime-local"
              error={errors.endDate?.message}
              {...register('endDate')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại game *
              </label>
              <Controller
                name="activeGame"
                control={control}
                render={({ field }) => (
                  <select
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    value={field.value}
                    onChange={(e) => {
                      const newGame = e.target.value as GameType;
                      field.onChange(newGame);
                      // Reset config to defaults when game type changes
                      setGameConfig({ ...(DEFAULT_GAME_CONFIGS[newGame] as unknown as Record<string, unknown>) });
                    }}
                  >
                    <option value="wheel">Vòng Quay</option>
                    <option value="shake">Lắc Xì</option>
                    <option value="memory">Lật Hình</option>
                    <option value="tap">Tap Tap</option>
                  </select>
                )}
              />
            </div>
            <Input
              label="Số lượt chơi / SĐT *"
              type="number"
              error={errors.maxPlaysPerPhone?.message}
              {...register('maxPlaysPerPhone')}
            />
          </div>

          {/* ── Game Config Section ──────────────────────────────────── */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              ⚙️ Cấu hình game ({GAME_TYPE_LABELS[watchedGame] || watchedGame})
            </h4>
            <GameConfigForm
              gameType={watchedGame}
              value={gameConfig}
              onChange={setGameConfig}
            />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Kích hoạt ngay</span>
                </label>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Xoá chiến dịch"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Bạn có chắc muốn xoá chiến dịch này? Hành động này không thể hoàn tác.
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
