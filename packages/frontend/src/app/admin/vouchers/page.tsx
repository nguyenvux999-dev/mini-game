// src/app/admin/vouchers/page.tsx
// Voucher Management — List with filters (status, campaign, search), cancel action

'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/admin/PageHeader';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import { useToast } from '@/components/common/Toast';
import { voucherApi, swrFetcher } from '@/lib/api';
import {
  SWR_KEYS,
  VOUCHER_STATUS_LABELS,
} from '@/lib/constants';
import { formatDateTime, obfuscatePhone } from '@/lib/utils';
import type {
  VoucherWithRelations,
  VoucherStatus,
  PaginationMeta,
  CampaignWithStats,
} from '@/types/api.types';

const STATUS_BADGE_MAP: Record<VoucherStatus, 'success' | 'info' | 'default' | 'error'> = {
  active: 'success',
  used: 'info',
  expired: 'default',
  cancelled: 'error',
};

export default function VouchersPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cancelModal, setCancelModal] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [detailModal, setDetailModal] = useState<VoucherWithRelations | null>(null);

  // ── Build query params ─────────────────────────────────────────────────

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '15');
  if (statusFilter !== 'all') params.set('status', statusFilter);
  if (campaignFilter) params.set('campaignId', campaignFilter);
  if (search) params.set('search', search);

  const { data, isLoading } = useSWR<{
    vouchers: VoucherWithRelations[];
    pagination: PaginationMeta;
  }>(`${SWR_KEYS.VOUCHERS}?${params.toString()}`, swrFetcher);

  const vouchers = data?.vouchers || [];
  const pagination = data?.pagination;

  // Campaign list for filter
  const { data: campaignsData } = useSWR<{
    campaigns: CampaignWithStats[];
    pagination: PaginationMeta;
  }>(`${SWR_KEYS.CAMPAIGNS}?limit=100`, swrFetcher);
  const campaigns = campaignsData?.campaigns || [];

  // ── Actions ────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (cancelModal === null) return;
    try {
      await voucherApi.cancel(cancelModal, cancelReason || undefined);
      setCancelModal(null);
      setCancelReason('');
      mutate((key: string) => typeof key === 'string' && key.startsWith(SWR_KEYS.VOUCHERS));
      addToast('success', 'Đã huỷ voucher');
    } catch (err: unknown) {
      addToast('error', (err as { message?: string })?.message || 'Lỗi');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // ── Table columns ──────────────────────────────────────────────────────

  const columns = [
    {
      key: 'code',
      label: 'Mã voucher',
      render: (v: VoucherWithRelations) => (
        <button
          onClick={() => setDetailModal(v)}
          className="font-mono font-bold text-orange-600 hover:underline"
        >
          {v.code}
        </button>
      ),
    },
    {
      key: 'reward',
      label: 'Phần thưởng',
      render: (v: VoucherWithRelations) => (
        <span className="text-gray-900">{v.reward?.name || '—'}</span>
      ),
    },
    {
      key: 'player',
      label: 'Người chơi',
      render: (v: VoucherWithRelations) =>
        v.player ? (
          <div className="text-sm">
            <p className="text-gray-900">{v.player.name || 'N/A'}</p>
            <p className="text-gray-500 text-xs">
              {obfuscatePhone(v.player.phone)}
            </p>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'campaign',
      label: 'Chiến dịch',
      render: (v: VoucherWithRelations) => (
        <span className="text-gray-600 text-xs">{v.campaign?.name || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (v: VoucherWithRelations) => (
        <Badge variant={STATUS_BADGE_MAP[v.status]}>
          {VOUCHER_STATUS_LABELS[v.status] || v.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (v: VoucherWithRelations) => (
        <span className="text-gray-600 text-xs">{formatDateTime(v.createdAt)}</span>
      ),
    },
    {
      key: 'expiresAt',
      label: 'Hết hạn',
      render: (v: VoucherWithRelations) => (
        <span className="text-gray-600 text-xs">
          {v.expiresAt ? formatDateTime(v.expiresAt) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (v: VoucherWithRelations) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDetailModal(v)}
          >
            👁️
          </Button>
          {v.status === 'active' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCancelModal(v.id)}
              title="Huỷ voucher"
            >
              ✕
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quản lý Voucher"
        description="Xem, tìm kiếm và quản lý voucher đã phát hành"
        breadcrumbs={[{ label: 'Voucher' }]}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Trạng thái
            </label>
            <div className="flex gap-1">
              {['all', 'active', 'used', 'expired', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? 'Tất cả' : VOUCHER_STATUS_LABELS[s] || s}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Chiến dịch
            </label>
            <select
              value={campaignFilter}
              onChange={(e) => { setCampaignFilter(e.target.value); setPage(1); }}
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

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Tìm theo mã hoặc SĐT..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="!py-1.5 text-sm"
            />
            <Button type="submit" size="sm">
              Tìm
            </Button>
            {search && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              >
                Xoá
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={vouchers}
        keyExtractor={(v) => v.id}
        loading={isLoading}
        emptyMessage="Không tìm thấy voucher nào"
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Tổng: {pagination.total} voucher
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              ← Trước
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={detailModal !== null}
        onClose={() => setDetailModal(null)}
        title="Chi tiết Voucher"
        size="md"
      >
        {detailModal && (
          <div className="space-y-3">
            <div className="text-center py-3">
              <p className="font-mono text-2xl font-bold text-orange-600">
                {detailModal.code}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Phần thưởng</p>
                <p className="font-medium">{detailModal.reward?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Trạng thái</p>
                <Badge variant={STATUS_BADGE_MAP[detailModal.status]}>
                  {VOUCHER_STATUS_LABELS[detailModal.status]}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Người chơi</p>
                <p className="font-medium">
                  {detailModal.player?.name || '—'}{' '}
                  {detailModal.player?.phone && `(${detailModal.player.phone})`}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Chiến dịch</p>
                <p className="font-medium">{detailModal.campaign?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày tạo</p>
                <p>{formatDateTime(detailModal.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Hết hạn</p>
                <p>
                  {detailModal.expiresAt
                    ? formatDateTime(detailModal.expiresAt)
                    : 'Không giới hạn'}
                </p>
              </div>
              {detailModal.usedAt && (
                <>
                  <div>
                    <p className="text-gray-500">Sử dụng lúc</p>
                    <p>{formatDateTime(detailModal.usedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Sử dụng bởi</p>
                    <p>{detailModal.usedBy || '—'}</p>
                  </div>
                </>
              )}
              {detailModal.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500">Ghi chú</p>
                  <p>{detailModal.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Cancel Confirm ────────────────────────────────────────────────── */}
      <Modal
        isOpen={cancelModal !== null}
        onClose={() => { setCancelModal(null); setCancelReason(''); }}
        title="Huỷ voucher"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Xác nhận huỷ voucher này? Hành động không thể hoàn tác.
          </p>
          <Input
            label="Lý do (tuỳ chọn)"
            placeholder="Nhập lý do huỷ..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => { setCancelModal(null); setCancelReason(''); }}
            >
              Đóng
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Xác nhận huỷ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
