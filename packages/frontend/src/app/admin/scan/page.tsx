// src/app/admin/scan/page.tsx
// QR Scanner — Scan voucher QR codes or enter code manually to verify & redeem
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageHeader } from '@/components/admin';
import { Button, Badge, Loading } from '@/components/common';
import { voucherApi } from '@/lib/api';
import { VOUCHER_STATUS_LABELS } from '@/lib/constants';
import { formatDateTime, obfuscatePhone } from '@/lib/utils';
import type { VoucherVerifyResult } from '@/types/api.types';

type ScanState = 'idle' | 'scanning' | 'verifying' | 'result' | 'error';

/**
 * Extract voucher code from URL or plain code
 * Handles both formats:
 * - URL: https://domain.com/voucher/CODE -> CODE
 * - Plain: CODE -> CODE
 */
function extractVoucherCode(input: string): string {
  const trimmed = input.trim();
  
  // Check if input is a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      // Extract code from path: /voucher/CODE
      const pathParts = url.pathname.split('/');
      const voucherIndex = pathParts.indexOf('voucher');
      if (voucherIndex !== -1 && pathParts[voucherIndex + 1]) {
        return pathParts[voucherIndex + 1].toUpperCase();
      }
    } catch {
      // If URL parsing fails, treat as plain code
    }
  }
  
  // Return as plain code
  return trimmed.toUpperCase();
}

export default function QRScannerPage() {
  const [state, setState] = useState<ScanState>('idle');
  const [manualCode, setManualCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<VoucherVerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

  // ── Cleanup camera on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // Already stopped
      }
      html5QrCodeRef.current = null;
    }
    setAvailableCameras([]);
    setSelectedCameraId('');
  }, []);

  // ── Verify a voucher code ────────────────────────────────────────────────
  const handleVerify = useCallback(async (input: string) => {
    const code = extractVoucherCode(input);
    if (!code) return;

    setState('verifying');
    setVerifyResult(null);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await voucherApi.verify(code);
      setVerifyResult(result);
      setState('result');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      const msg = apiErr?.message || 'Không thể xác thực voucher';
      setErrorMsg(msg);
      setState('error');
    }
  }, []);

  // ── Start camera & scanning ──────────────────────────────────────────────
  const startCamera = useCallback(async (preferredCameraId?: string) => {
    setCameraError('');
    setState('scanning');

    // Wait for DOM to render the scanner div
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Initialize Html5Qrcode
      const html5QrCode = new Html5Qrcode(scannerDivId);
      html5QrCodeRef.current = html5QrCode;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        throw new Error('Không tìm thấy camera trên thiết bị');
      }

      // Store available cameras
      setAvailableCameras(devices);

      // Select camera
      let cameraId: string;
      if (preferredCameraId && devices.some(d => d.id === preferredCameraId)) {
        // Use preferred camera if provided and exists
        cameraId = preferredCameraId;
      } else {
        // Auto-select: prioritize rear camera (environment) for mobile
        // Try multiple detection methods for better rear camera detection
        const rearCamera = devices.find(device => {
          const label = device.label.toLowerCase();
          return (
            label.includes('back') || 
            label.includes('rear') ||
            label.includes('environment') ||
            label.includes('facing back') ||
            // Additional patterns for better detection
            (label.includes('camera') && label.includes('0')) || // Often camera 0 is rear
            label.includes('후면') || // Korean
            label.includes('trasera') || // Spanish
            label.includes('arrière') // French
          );
        });
        
        // If no rear camera found by label, use last camera (often rear on mobile)
        cameraId = rearCamera ? rearCamera.id : devices[devices.length - 1].id;
      }

      setSelectedCameraId(cameraId);

      // Start scanning with selected camera
      await html5QrCode.start(
        cameraId,
        {
          fps: 10, // Scan 10 frames per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        (decodedText) => {
          // Success callback - QR code detected
          if (decodedText) {
            stopCamera();
            handleVerify(decodedText);
          }
        },
        () => {
          // Error callback - no QR detected (ignore)
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setState('idle');
      const error = err as Error;
      if (error.message?.includes('NotAllowedError') || error.message?.includes('Permission')) {
        setCameraError('Vui lòng cấp quyền truy cập camera để quét QR.');
      } else if (error.message?.includes('NotFoundError') || error.message?.includes('không tìm thấy')) {
        setCameraError('Không tìm thấy camera. Vui lòng kiểm tra kết nối camera.');
      } else {
        setCameraError(`Không thể mở camera: ${error.message || 'Lỗi không xác định'}. Vui lòng nhập mã voucher thủ công.`);
      }
    }
  }, [stopCamera, handleVerify, scannerDivId]);

  // ── Switch camera ────────────────────────────────────────────────────────
  const switchCamera = useCallback(async (newCameraId: string) => {
    if (state === 'scanning') {
      await stopCamera();
      await startCamera(newCameraId);
    }
  }, [state, stopCamera, startCamera]);

  // ── Redeem the verified voucher ──────────────────────────────────────────
  const handleRedeem = useCallback(async () => {
    if (!verifyResult?.voucher?.code) return;
    setRedeemLoading(true);
    try {
      const result = await voucherApi.redeem(verifyResult.voucher.code);
      setSuccessMsg(result.message || 'Đổi voucher thành công!');
      // Update the local verify result to reflect used status
      setVerifyResult((prev) =>
        prev ? { ...prev, voucher: { ...prev.voucher, status: 'used' }, isValid: false, canRedeem: false } : prev
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đổi voucher thất bại';
      setErrorMsg(msg);
    } finally {
      setRedeemLoading(false);
    }
  }, [verifyResult]);

  // ── Reset to initial ─────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    stopCamera();
    setState('idle');
    setManualCode('');
    setVerifyResult(null);
    setErrorMsg('');
    setSuccessMsg('');
  }, [stopCamera]);

  // ── Manual submit ────────────────────────────────────────────────────────
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopCamera();
    handleVerify(manualCode);
  };

  const statusVariant: Record<string, 'success' | 'info' | 'default' | 'error'> = {
    active: 'success',
    used: 'info',
    expired: 'default',
    cancelled: 'error',
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Quét QR Voucher"
        description="Quét mã QR hoặc nhập mã voucher để xác thực và đổi thưởng"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Quét QR' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Scanner ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Camera panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">📷 Quét mã QR</h3>
            </div>
            <div className="p-5">
              {state === 'scanning' ? (
                <div className="space-y-3">
                  {/* Camera selector */}
                  {availableCameras.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 whitespace-nowrap">Camera:</label>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => switchCamera(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {availableCameras.map((camera) => (
                          <option key={camera.id} value={camera.id}>
                            {camera.label || `Camera ${camera.id.substring(0, 8)}...`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* QR Scanner container */}
                  <div id={scannerDivId} className="rounded-lg overflow-hidden" />
                  <Button variant="secondary" className="w-full" onClick={async () => { await stopCamera(); setState('idle'); }}>
                    Dừng quét
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="aspect-[4/3] bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                    <span className="text-4xl mb-2">📷</span>
                    <p className="text-sm">Nhấn nút bên dưới để bắt đầu quét</p>
                  </div>
                  <Button className="w-full" onClick={() => startCamera()}>
                    Bắt đầu quét QR
                  </Button>
                </div>
              )}

              {cameraError && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                  ⚠️ {cameraError}
                </div>
              )}
            </div>
          </div>

          {/* Manual input */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">⌨️ Nhập mã voucher</h3>
            </div>
            <form onSubmit={handleManualSubmit} className="p-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="VD: VCHR-ABCD1234"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono uppercase"
                />
                <Button type="submit" disabled={!manualCode.trim() || state === 'verifying'}>
                  Kiểm tra
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: Result ──────────────────────────────────────────────── */}
        <div>
          {state === 'verifying' && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center min-h-[300px]">
              <Loading size="lg" text="Đang xác thực voucher..." />
            </div>
          )}

          {state === 'error' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-8 text-center">
                <span className="text-5xl mb-4 block">❌</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không hợp lệ</h3>
                <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
                <Button onClick={handleReset}>Quét lại</Button>
              </div>
            </div>
          )}

          {state === 'result' && verifyResult && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Thông tin Voucher</h3>
                <Badge variant={statusVariant[verifyResult.voucher.status] || 'default'}>
                  {VOUCHER_STATUS_LABELS[verifyResult.voucher.status] || verifyResult.voucher.status}
                </Badge>
              </div>

              <div className="p-5 space-y-4">
                {/* Success message */}
                {successMsg && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
                    ✅ {successMsg}
                  </div>
                )}

                {/* Error message */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    ❌ {errorMsg}
                  </div>
                )}

                {/* Voucher details */}
                <div className="space-y-3">
                  <InfoRow label="Mã voucher" value={verifyResult.voucher.code} mono />
                  <InfoRow
                    label="Phần thưởng"
                    value={
                      verifyResult.voucher.reward
                        ? `${verifyResult.voucher.reward.name}${verifyResult.voucher.reward.value ? ` (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(verifyResult.voucher.reward.value)})` : ''}`
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Chiến dịch"
                    value={verifyResult.voucher.campaign?.name || '—'}
                  />
                  <InfoRow
                    label="Người chơi"
                    value={
                      verifyResult.voucher.player
                        ? `${verifyResult.voucher.player.name || 'N/A'} — ${obfuscatePhone(verifyResult.voucher.player.phone)}`
                        : '—'
                    }
                  />
                  {verifyResult.voucher.createdAt && (
                    <InfoRow
                      label="Ngày tạo"
                      value={formatDateTime(verifyResult.voucher.createdAt)}
                    />
                  )}
                  {verifyResult.voucher.expiresAt && (
                    <InfoRow
                      label="Hạn sử dụng"
                      value={formatDateTime(verifyResult.voucher.expiresAt)}
                    />
                  )}
                  {verifyResult.voucher.usedAt && (
                    <InfoRow
                      label="Đã đổi lúc"
                      value={formatDateTime(verifyResult.voucher.usedAt)}
                    />
                  )}
                  {verifyResult.message && (
                    <InfoRow label="Trạng thái" value={verifyResult.message} />
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  {verifyResult.isValid && verifyResult.canRedeem && !successMsg && (
                    <Button
                      onClick={handleRedeem}
                      disabled={redeemLoading}
                      className="flex-1"
                    >
                      {redeemLoading ? 'Đang xử lý...' : '🎁 Đổi voucher ngay'}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={handleReset} className="flex-1">
                    Quét mã khác
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state === 'idle' && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <span className="text-5xl mb-4">🎟️</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sẵn sàng quét</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Quét mã QR trên voucher hoặc nhập mã voucher để kiểm tra tính hợp lệ và thực hiện đổi thưởng
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper: Info row ─────────────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-900 ${mono ? 'font-mono font-medium' : ''}`}>
        {value}
      </span>
    </div>
  );
}
