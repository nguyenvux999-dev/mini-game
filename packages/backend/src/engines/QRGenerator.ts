// src/engines/QRGenerator.ts
// QR Code utility wrapper

import QRCode from 'qrcode';

/**
 * QR Generator
 * Utility class for QR code generation
 */
export class QRGenerator {
  /**
   * Generate QR code as Base64 PNG data URL
   */
  static async toDataURL(
    data: string,
    options?: QRCode.QRCodeToDataURLOptions
  ): Promise<string> {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      type: 'image/png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };

    return QRCode.toDataURL(data, { ...defaultOptions, ...options });
  }

  /**
   * Generate QR code as SVG string
   */
  static async toSVG(
    data: string,
    options?: QRCode.QRCodeToStringOptions
  ): Promise<string> {
    const defaultOptions: QRCode.QRCodeToStringOptions = {
      type: 'svg',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    };

    return QRCode.toString(data, { ...defaultOptions, ...options });
  }

  /**
   * Generate QR code and save to file
   */
  static async toFile(
    path: string,
    data: string,
    options?: QRCode.QRCodeToFileOptions
  ): Promise<void> {
    const defaultOptions: QRCode.QRCodeToFileOptions = {
      type: 'png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    };

    return QRCode.toFile(path, data, { ...defaultOptions, ...options });
  }
}

export default QRGenerator;
