// src/app/admin/players/page.tsx
// Player Management — List with search + detail modal (play history, vouchers)

'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import PageHeader from '@/components/admin/PageHeader';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import Loading from '@/components/common/Loading';
import { useToast } from '@/components/common/Toast';
import { playerApi, swrFetcher } from '@/lib/api';
import {
  SWR_KEYS,
  VOUCHER_STATUS_LABELS,
  GAME_TYPE_LABELS,
} from '@/lib/constants';
import { formatDateTime, formatNumber, obfuscatePhone } from '@/lib/utils';
import type {
  PlayerListItem,
  PlayerDetailResponse,
  PaginationMeta,
  VoucherStatus,
} from '@/types/api.types';

const STATUS_BADGE_MAP: Record<VoucherStatus, 'success' | 'info' | 'default' | 'error'> = {
  active: 'success',
  used: 'info',
  expired: 'default',
  cancelled: 'error',
};

export default function PlayersPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PlayerDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '15');
  if (search) params.set('search', search);

  const { data, isLoading } = useSWR<{
    players: PlayerListItem[];
    pagination: PaginationMeta;
  }>(`${SWR_KEYS.PLAYERS}?${params.toString()}`, swrFetcher);

  const players = data?.players || [];
  const pagination = data?.pagination;

  // ── Search ─────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // ── Detail modal ───────────────────────────────────────────────────────

  const openDetail = async (id: number) => {
    setDetailId(id);
    setLoadingDetail(true);
    try {
      const data = await playerApi.getDetail(id);
      setDetail(data);
    } catch {
      addToast('error', 'Không thể tải chi tiết người chơi');
      setDetailId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  // ── Table columns ──────────────────────────────────────────────────────

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (p: PlayerListItem) => (
        <span className="text-gray-400 text-xs">#{p.id}</span>
      ),
    },
    {
      key: 'name',
      label: 'Người chơi',
      render: (p: PlayerListItem) => (
        <button
          onClick={() => openDetail(p.id)}
          className="text-left hover:text-orange-600 transition-colors"
        >
          <p className="font-medium text-gray-900">{p.name || 'Chưa đặt tên'}</p>
          <p className="text-xs text-gray-500">{obfuscatePhone(p.phone)}</p>
        </button>
      ),
    },
    {
      key: 'playCount',
      label: 'Lượt chơi',
      render: (p: PlayerListItem) => (
        <span className="font-medium text-gray-700">
          {formatNumber(p.playCount)}
        </span>
      ),
    },
    {
      key: 'totalWins',
      label: 'Trúng',
      render: (p: PlayerListItem) => (
        <span className="text-green-600 font-medium">
          {formatNumber(p.totalWins)}
        </span>
      ),
    },
    {
      key: 'winRate',
      label: 'Tỉ lệ trúng',
      render: (p: PlayerListItem) => {
        const rate = p.playCount > 0 ? ((p.totalWins / p.playCount) * 100).toFixed(1) : '0';
        return <span className="text-gray-600">{rate}%</span>;
      },
    },
    {
      key: 'lastPlayAt',
      label: 'Chơi lần cuối',
      render: (p: PlayerListItem) => (
        <span className="text-gray-600 text-xs">
          {p.lastPlayAt ? formatDateTime(p.lastPlayAt) : 'Chưa chơi'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ngày tham gia',
      render: (p: PlayerListItem) => (
        <span className="text-gray-600 text-xs">{formatDateTime(p.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (p: PlayerListItem) => (
        <Button size="sm" variant="ghost" onClick={() => openDetail(p.id)}>
          Chi tiết →
        </Button>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quản lý người chơi"
        description="Xem thông tin và lịch sử người chơi"
        breadcrumbs={[{ label: 'Người chơi' }]}
      />

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Tìm theo SĐT hoặc tên..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="!py-1.5 text-sm"
            />
          </div>
          <Button type="submit" size="sm">
            Tìm kiếm
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={players}
        keyExtractor={(p) => p.id}
        loading={isLoading}
        emptyMessage="Không tìm thấy người chơi nào"
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Tổng: {pagination.total} người chơi
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

      {/* ── Player Detail Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={detailId !== null}
        onClose={closeDetail}
        title="Chi tiết người chơi"
        size="xl"
      >
        {loadingDetail ? (
          <Loading text="Đang tải..." />
        ) : detail ? (
          <div className="space-y-6">
            {/* Player info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Tên</p>
                <p className="font-medium">{detail.player.name || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">SĐT</p>
                <p className="font-medium">{detail.player.phone}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Lượt chơi</p>
                <p className="font-medium text-orange-600">
                  {formatNumber(detail.player.playCount)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Trúng thưởng</p>
                <p className="font-medium text-green-600">
                  {formatNumber(detail.player.totalWins)}
                </p>
              </div>
            </div>

            {/* Play History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Lịch sử chơi ({detail.playHistory.length})
              </h4>
              {detail.playHistory.length === 0 ? (
                <p className="text-sm text-gray-400">Chưa có lượt chơi nào</p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Thời gian</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Game</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Kết quả</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Phần thưởng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.playHistory.map((play) => (
                        <tr key={play.id}>
                          <td className="px-3 py-2 text-gray-600">
                            {formatDateTime(play.playedAt)}
                          </td>
                          <td className="px-3 py-2">
                            {GAME_TYPE_LABELS[play.gameType] || play.gameType}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={play.isWin ? 'success' : 'default'}>
                              {play.isWin ? 'Trúng' : 'Trượt'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {play.reward?.name || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Vouchers */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Voucher ({detail.vouchers.length})
              </h4>
              {detail.vouchers.length === 0 ? (
                <p className="text-sm text-gray-400">Chưa có voucher nào</p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Mã</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Phần thưởng</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Trạng thái</th>
                        <th className="text-left px-3 py-2 text-xs text-gray-500">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.vouchers.map((v) => (
                        <tr key={v.id}>
                          <td className="px-3 py-2 font-mono text-orange-600 font-medium">
                            {v.code}
                          </td>
                          <td className="px-3 py-2">{v.reward?.name || '—'}</td>
                          <td className="px-3 py-2">
                            <Badge variant={STATUS_BADGE_MAP[v.status]}>
                              {VOUCHER_STATUS_LABELS[v.status]}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {formatDateTime(v.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
