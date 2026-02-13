// src/app/admin/rewards/page.tsx
// Reward Management — CRUD with campaign filter, probability validation

'use client';

import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/admin/PageHeader';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import { useToast } from '@/components/common/Toast';
import { rewardApi, swrFetcher } from '@/lib/api';
import { SWR_KEYS } from '@/lib/constants';
import { formatNumber, getAssetUrl } from '@/lib/utils';
import type {
  Reward,
  CampaignWithStats,
  PaginationMeta,
} from '@/types/api.types';
import Image from 'next/image';

// ── Validation Schema ────────────────────────────────────────────────────────

const rewardSchema = z.object({
  campaignId: z.coerce.number().int().positive('Chọn chiến dịch'),
  name: z.string().min(1, 'Tên không được để trống').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  iconUrl: z.string().max(500).optional().or(z.literal('')),
  probability: z.coerce.number().int().min(0).max(100, 'Tối đa 100%'),
  totalQuantity: z.coerce
    .number()
    .int()
    .positive('Phải > 0')
    .optional()
    .or(z.literal(0).transform(() => undefined))
    .or(z.nan().transform(() => undefined)),
  value: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean(),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

type RewardFormData = z.infer<typeof rewardSchema>;

export default function RewardsPage() {
  const { addToast } = useToast();
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────

  const rewardsKey = campaignFilter
    ? `${SWR_KEYS.REWARDS}?campaignId=${campaignFilter}`
    : SWR_KEYS.REWARDS;

  const { data, isLoading } = useSWR<{
    rewards: Reward[];
    pagination: PaginationMeta;
  }>(rewardsKey, swrFetcher);

  const rewards = data?.rewards || [];

  // Fetch campaigns for filter & form dropdown
  const { data: campaignsData } = useSWR<{
    campaigns: CampaignWithStats[];
    pagination: PaginationMeta;
  }>(`${SWR_KEYS.CAMPAIGNS}?limit=100`, swrFetcher);
  const campaigns = campaignsData?.campaigns || [];

  // ── Probability sum check ──────────────────────────────────────────────

  const probabilitySum = rewards
    .filter((r) => r.isActive)
    .reduce((sum, r) => sum + r.probability, 0);

  // ── Form ───────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      probability: 0,
      value: 0,
      isActive: true,
      displayOrder: 0,
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    reset({
      campaignId: campaignFilter ? Number(campaignFilter) : undefined,
      name: '',
      description: '',
      iconUrl: '',
      probability: 0,
      totalQuantity: undefined,
      value: 0,
      isActive: true,
      displayOrder: 0,
    });
    setModalOpen(true);
  };

  const openEditModal = useCallback(
    async (id: number) => {
      try {
        const reward = await rewardApi.getById(id);
        setEditingId(id);
        reset({
          campaignId: reward.campaignId,
          name: reward.name,
          description: reward.description || '',
          iconUrl: reward.iconUrl || '',
          probability: reward.probability,
          totalQuantity: reward.totalQuantity ?? undefined,
          value: reward.value,
          isActive: reward.isActive,
          displayOrder: reward.displayOrder,
        });
        setModalOpen(true);
      } catch {
        addToast('error', 'Không thể tải dữ liệu phần thưởng');
      }
    },
    [reset, addToast]
  );

  const onSubmit = async (formData: RewardFormData) => {
    setSaving(true);
    try {
      const payload = {
        campaignId: formData.campaignId,
        name: formData.name,
        description: formData.description || undefined,
        iconUrl: formData.iconUrl || undefined,
        probability: formData.probability,
        totalQuantity: formData.totalQuantity ?? null,
        value: formData.value,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      };

      if (editingId) {
        await rewardApi.update(editingId, payload);
        addToast('success', 'Cập nhật phần thưởng thành công!');
      } else {
        await rewardApi.create(payload);
        addToast('success', 'Tạo phần thưởng thành công!');
      }

      setModalOpen(false);
      mutate((key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.REWARDS));
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
      await rewardApi.toggle(id);
      mutate((key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.REWARDS));
      addToast('success', 'Đã thay đổi trạng thái');
    } catch (err: unknown) {
      addToast('error', (err as { message?: string })?.message || 'Lỗi');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await rewardApi.delete(id);
      setDeleteConfirm(null);
      mutate((key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.REWARDS));
      addToast('success', 'Đã xoá phần thưởng');
    } catch (err: unknown) {
      addToast('error', (err as { message?: string })?.message || 'Lỗi khi xoá');
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────

  const columns = [
    {
      key: 'displayOrder',
      label: '#',
      render: (r: Reward) => (
        <span className="text-gray-400 text-xs">{r.displayOrder}</span>
      ),
    },
    {
      key: 'name',
      label: 'Phần thưởng',
      render: (r: Reward) => (
        <div className="flex items-center gap-3">
          {r.iconUrl ? (
            <Image
              src={getAssetUrl(r.iconUrl) || ''}
              alt={r.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded object-cover"
              unoptimized
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
              🎁
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{r.name}</p>
            {r.description && (
              <p className="text-xs text-gray-500 truncate max-w-[180px]">
                {r.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'probability',
      label: 'Tỉ lệ',
      render: (r: Reward) => (
        <span className="font-medium text-orange-600">{r.probability}%</span>
      ),
    },
    {
      key: 'quantity',
      label: 'Số lượng',
      render: (r: Reward) =>
        r.totalQuantity !== null ? (
          <div className="text-sm">
            <span className="text-gray-900">{formatNumber(r.remainingQty ?? 0)}</span>
            <span className="text-gray-400"> / {formatNumber(r.totalQuantity)}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">Không giới hạn</span>
        ),
    },
    {
      key: 'value',
      label: 'Giá trị',
      render: (r: Reward) => (
        <span className="text-gray-700">
          {r.value > 0 ? formatNumber(r.value) + 'đ' : '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      render: (r: Reward) => (
        <Badge variant={r.isActive ? 'success' : 'default'}>
          {r.isActive ? 'Hoạt động' : 'Tắt'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (r: Reward) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => handleToggle(r.id)}>
            {r.isActive ? '⏸' : '▶'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEditModal(r.id)}>
            ✏️
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirm(r.id)}
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
        title="Quản lý phần thưởng"
        description="Cấu hình phần thưởng cho từng chiến dịch"
        breadcrumbs={[{ label: 'Phần thưởng' }]}
        actions={
          <Button size="sm" onClick={openCreateModal}>
            + Thêm phần thưởng
          </Button>
        }
      />

      {/* Probability warning */}
      {probabilitySum > 0 && (
        <div
          className={`p-3 rounded-lg text-sm ${
            probabilitySum > 100
              ? 'bg-red-50 text-red-700 border border-red-200'
              : probabilitySum === 100
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}
        >
          Tổng tỉ lệ trúng (phần thưởng đang bật):{' '}
          <strong>{probabilitySum}%</strong>
          {probabilitySum > 100 && ' — Vượt quá 100%!'}
          {probabilitySum < 100 &&
            ` — Còn ${100 - probabilitySum}% không trúng`}
        </div>
      )}

      {/* Campaign filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Chiến dịch:</label>
        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="">Tất cả</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={rewards}
        keyExtractor={(r) => r.id}
        loading={isLoading}
        emptyMessage="Chưa có phần thưởng nào"
      />

      {/* ── Create/Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Sửa phần thưởng' : 'Thêm phần thưởng mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chiến dịch *
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              {...register('campaignId')}
            >
              <option value="">Chọn chiến dịch</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.campaignId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.campaignId.message}
              </p>
            )}
          </div>

          <Input
            label="Tên phần thưởng *"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              rows={2}
              {...register('description')}
            />
          </div>

          <Input
            label="Icon URL"
            placeholder="/uploads/rewards/icon.png"
            error={errors.iconUrl?.message}
            {...register('iconUrl')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tỉ lệ trúng (%) *"
              type="number"
              error={errors.probability?.message}
              {...register('probability')}
            />
            <Input
              label="Tổng số lượng (trống = vô hạn)"
              type="number"
              error={errors.totalQuantity?.message}
              {...register('totalQuantity')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Giá trị (VNĐ)"
              type="number"
              error={errors.value?.message}
              {...register('value')}
            />
            <Input
              label="Thứ tự hiển thị"
              type="number"
              error={errors.displayOrder?.message}
              {...register('displayOrder')}
            />
          </div>

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
                <span className="text-sm text-gray-700">Kích hoạt</span>
              </label>
            )}
          />

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
        title="Xoá phần thưởng"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Bạn có chắc muốn xoá phần thưởng này?
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
