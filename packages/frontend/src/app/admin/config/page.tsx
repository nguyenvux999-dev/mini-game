// src/app/admin/config/page.tsx
// Store Config Management — Edit store info, colors, contact

'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import PageHeader from '@/components/admin/PageHeader';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import { useToast } from '@/components/common/Toast';
import { configApi, assetApi, swrFetcher } from '@/lib/api';
import { formatDateTime, getAssetUrl } from '@/lib/utils';
import type { StoreConfig } from '@/types/api.types';
import Image from 'next/image';

// ── Validation Schema ────────────────────────────────────────────────────────

const configSchema = z.object({
  storeName: z.string().min(1, 'Tên cửa hàng không được để trống').max(200),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu không hợp lệ'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu không hợp lệ'),
  address: z.string().max(500).optional().or(z.literal('')),
  hotline: z.string().max(20).optional().or(z.literal('')),
  fanpageUrl: z.string().url('URL không hợp lệ').max(500).optional().or(z.literal('')),
  instagramUrl: z.string().url('URL không hợp lệ').max(500).optional().or(z.literal('')),
  zaloUrl: z.string().url('URL không hợp lệ').max(500).optional().or(z.literal('')),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function ConfigPage() {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const { data: config, isLoading, error } = useSWR<StoreConfig>(
    '/config/admin',
    swrFetcher
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  });

  // Reset form when data loads
  useEffect(() => {
    if (config) {
      reset({
        storeName: config.storeName,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        address: config.address || '',
        hotline: config.hotline || '',
        fanpageUrl: config.fanpageUrl || '',
        instagramUrl: config.instagramUrl || '',
        zaloUrl: config.zaloUrl || '',
      });
    }
  }, [config, reset]);

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  // ── Save config ──────────────────────────────────────────────────────────

  const onSubmit = async (data: ConfigFormData) => {
    setSaving(true);
    try {
      await configApi.update({
        storeName: data.storeName,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        address: data.address || undefined,
        hotline: data.hotline || undefined,
        fanpageUrl: data.fanpageUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        zaloUrl: data.zaloUrl || undefined,
      });
      mutate('/config/admin');
      addToast('success', 'Cập nhật cấu hình thành công!');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Lỗi khi cập nhật';
      addToast('error', message);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload handlers ──────────────────────────────────────────────────────

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type === 'logo' ? 'reward_icon' : 'game_background');
      formData.append('assetName', `store-${type}`);
      formData.append('gameType', 'wheel');

      const asset = await assetApi.upload(formData);

      // Update config with new URL
      await configApi.update(
        type === 'logo'
          ? { logoUrl: asset.assetUrl }
          : { bannerUrl: asset.assetUrl }
      );
      mutate('/config/admin');
      addToast('success', `Upload ${type === 'logo' ? 'logo' : 'banner'} thành công!`);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Lỗi upload';
      addToast('error', message);
    } finally {
      setUploading(false);
    }
    // Reset input
    e.target.value = '';
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6">
        <Loading text="Đang tải cấu hình..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          Không thể tải cấu hình. Vui lòng thử lại.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Cấu hình cửa hàng"
        description="Quản lý thông tin cửa hàng, hình ảnh và liên hệ"
        breadcrumbs={[{ label: 'Cấu hình' }]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Store Info ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin cửa hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Tên cửa hàng *"
                error={errors.storeName?.message}
                {...register('storeName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Màu chính *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  {...register('primaryColor')}
                />
                <Input
                  className="flex-1"
                  placeholder="#FF6B35"
                  error={errors.primaryColor?.message}
                  {...register('primaryColor')}
                />
                {primaryColor && (
                  <div
                    className="h-10 w-10 rounded-lg border"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Màu phụ *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  {...register('secondaryColor')}
                />
                <Input
                  className="flex-1"
                  placeholder="#F7C59F"
                  error={errors.secondaryColor?.message}
                  {...register('secondaryColor')}
                />
                {secondaryColor && (
                  <div
                    className="h-10 w-10 rounded-lg border"
                    style={{ backgroundColor: secondaryColor }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Images ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Hình ảnh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo cửa hàng
              </label>
              {config?.logoUrl && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg inline-block">
                  <Image
                    src={getAssetUrl(config.logoUrl) || ''}
                    alt="Logo"
                    width={80}
                    height={80}
                    className="h-20 w-auto object-contain"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={uploadingLogo}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {uploadingLogo ? 'Đang upload...' : 'Chọn logo'}
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                  />
                </label>
              </div>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner
              </label>
              {config?.bannerUrl && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <Image
                    src={getAssetUrl(config.bannerUrl) || ''}
                    alt="Banner"
                    width={400}
                    height={80}
                    className="h-20 w-full object-cover rounded"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={uploadingBanner}
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    {uploadingBanner ? 'Đang upload...' : 'Chọn banner'}
                  </Button>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'banner')}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Contact Info ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin liên hệ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Địa chỉ"
                error={errors.address?.message}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                {...register('address')}
              />
            </div>
            <Input
              label="Hotline"
              error={errors.hotline?.message}
              placeholder="1900xxxx"
              {...register('hotline')}
            />
            <Input
              label="Fanpage URL"
              error={errors.fanpageUrl?.message}
              placeholder="https://facebook.com/..."
              {...register('fanpageUrl')}
            />
            <Input
              label="Instagram URL"
              error={errors.instagramUrl?.message}
              placeholder="https://instagram.com/..."
              {...register('instagramUrl')}
            />
            <Input
              label="Zalo URL"
              error={errors.zaloUrl?.message}
              placeholder="https://zalo.me/..."
              {...register('zaloUrl')}
            />
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">
            {config?.updatedAt && (
              <span>Cập nhật lần cuối: {formatDateTime(config.updatedAt)}</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => config && reset({
                storeName: config.storeName,
                primaryColor: config.primaryColor,
                secondaryColor: config.secondaryColor,
                address: config.address || '',
                hotline: config.hotline || '',
                fanpageUrl: config.fanpageUrl || '',
                instagramUrl: config.instagramUrl || '',
                zaloUrl: config.zaloUrl || '',
              })}
              disabled={!isDirty}
            >
              Huỷ thay đổi
            </Button>
            <Button type="submit" loading={saving} disabled={!isDirty}>
              Lưu cấu hình
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
