// src/engines/VoucherGenerator.ts
// Voucher Code Generator và QR Code Generator

import { customAlphabet } from 'nanoid';
import QRCode from 'qrcode';

/**
 * Voucher code alphabet - uppercase letters and numbers, excluding confusing chars
 * Excluded: 0, O, I, L, 1 (để tránh nhầm lẫn khi đọc)
 */
const VOUCHER_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate voucher code using nanoid
 */
const generateCode = customAlphabet(VOUCHER_ALPHABET, 8);

/**
 * QR Code options
 */
interface QROptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Voucher Generator
 * Handles voucher code generation and QR code creation
 */
export class VoucherGenerator {
  /**
   * Generate unique voucher code
   * Format: 8 characters uppercase alphanumeric
   * 
   * @returns Voucher code string (e.g., "ABC123XY")
   */
  static generateCode(): string {
    return generateCode();
  }

  /**
   * Generate QR code as Base64 data URL
   * 
   * @param data - Data to encode in QR code
   * @param options - QR code options
   * @returns Base64 data URL string
   */
  static async generateQRCode(
    data: string,
    options: QROptions = {}
  ): Promise<string> {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M' as const,
    };

    const qrOptions = {
      ...defaultOptions,
      ...options,
      color: {
        ...defaultOptions.color,
        ...options.color,
      },
    };

    try {
      // Generate QR code as Data URL (base64 PNG)
      const dataUrl = await QRCode.toDataURL(data, qrOptions);
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate voucher with code and QR code
   * QR code contains the voucher URL for scanning
   * 
   * @param baseUrl - Base URL for voucher page
   * @param code - Voucher code (optional, will generate if not provided)
   * @returns Object with code and qrCode base64
   */
  static async generateVoucher(
    baseUrl: string,
    code?: string
  ): Promise<{ code: string; qrCode: string; qrData: string }> {
    const voucherCode = code || this.generateCode();
    
    // QR data contains full voucher URL
    const qrData = `${baseUrl}/voucher/${voucherCode}`;
    
    const qrCode = await this.generateQRCode(qrData);

    return {
      code: voucherCode,
      qrCode,
      qrData,
    };
  }

  /**
   * Generate simple QR code for voucher code only
   * 
   * @param code - Voucher code
   * @returns Base64 QR code data URL
   */
  static async generateSimpleQR(code: string): Promise<string> {
    return this.generateQRCode(code, {
      width: 200,
      margin: 1,
    });
  }

  /**
   * Validate voucher code format
   * 
   * @param code - Voucher code to validate
   * @returns true if valid format
   */
  static isValidCode(code: string): boolean {
    if (!code || code.length !== 8) return false;
    const validChars = new RegExp(`^[${VOUCHER_ALPHABET}]+$`);
    return validChars.test(code.toUpperCase());
  }
}

export default VoucherGenerator;
