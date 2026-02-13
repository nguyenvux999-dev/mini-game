// src/scripts/regenerate-qr.ts
// Script to regenerate QR codes for existing vouchers
// Run: npx ts-node src/scripts/regenerate-qr.ts

import prisma from '../config/database';
import { VoucherGenerator } from '../engines/VoucherGenerator';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function regenerateQRCodes() {
  console.log('🔄 Starting QR code regeneration...\n');

  try {
    // Get all vouchers that have qrData as URL (not base64)
    const vouchers = await prisma.voucher.findMany({
      where: {
        AND: [
          { qrData: { not: null } },
          { NOT: { qrData: { startsWith: 'data:' } } },
        ],
      },
      select: {
        id: true,
        code: true,
        qrData: true,
      },
    });

    console.log(`📊 Found ${vouchers.length} vouchers to update\n`);

    if (vouchers.length === 0) {
      console.log('✅ All vouchers already have base64 QR codes!');
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const voucher of vouchers) {
      try {
        // Generate new QR code from URL
        const url = `${BASE_URL}/voucher/${voucher.code}`;
        const qrCode = await VoucherGenerator.generateQRCode(url);

        // Update voucher
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { qrData: qrCode },
        });

        updated++;
        console.log(`✓ Updated voucher ${voucher.code}`);
      } catch (error) {
        failed++;
        console.error(`✗ Failed to update voucher ${voucher.code}:`, error);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ Success: ${updated} vouchers updated`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} vouchers`);
    }
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
regenerateQRCodes()
  .then(() => {
    console.log('🎉 QR code regeneration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
