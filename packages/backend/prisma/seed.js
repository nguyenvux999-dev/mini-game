"use strict";
// prisma/seed.ts
// Script tạo dữ liệu mẫu cho Web MiniGame
// Chạy: npx prisma db seed
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Hash password với bcrypt
 */
async function hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}
/**
 * Tạo ngày trong tương lai
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
/**
 * Tạo ngày trong quá khứ
 */
function subDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}
// ============================================================================
// SEED DATA
// ============================================================================
async function main() {
    console.log('🌱 Bắt đầu seed database...\n');
    // --------------------------------------------------------------------------
    // 1. TẠO ADMIN USER
    // --------------------------------------------------------------------------
    console.log('👤 Tạo Admin User...');
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminPassword,
            role: 'admin',
            displayName: 'Quản trị viên',
            isActive: true,
        },
    });
    console.log(`   ✅ Admin: ${admin.username} (role: ${admin.role})`);
    console.log(`   📝 Password: admin123\n`);
    // --------------------------------------------------------------------------
    // 2. TẠO STORE CONFIG
    // --------------------------------------------------------------------------
    console.log('🏪 Tạo Store Config...');
    const storeConfig = await prisma.storeConfig.upsert({
        where: { id: 1 },
        update: {},
        create: {
            storeName: 'Quán Trà Sữa ABC',
            logoUrl: '/images/logo-sample.png',
            bannerUrl: '/images/banner-sample.jpg',
            primaryColor: '#FF6B35',
            secondaryColor: '#F7C59F',
            address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
            hotline: '0909 123 456',
            fanpageUrl: 'https://facebook.com/quanABC',
            instagramUrl: 'https://instagram.com/quanABC',
            zaloUrl: 'https://zalo.me/quanABC',
        },
    });
    console.log(`   ✅ Store: ${storeConfig.storeName}`);
    console.log(`   📍 Địa chỉ: ${storeConfig.address}\n`);
    // --------------------------------------------------------------------------
    // 3. TẠO CAMPAIGN "QUAY LÀ TRÚNG"
    // --------------------------------------------------------------------------
    console.log('🎯 Tạo Campaign "Quay là trúng"...');
    const now = new Date();
    const campaignStartDate = subDays(now, 5); // Bắt đầu 5 ngày trước
    const campaignEndDate = addDays(now, 25); // Kết thúc sau 25 ngày
    // Game config cho Wheel
    const wheelGameConfig = JSON.stringify({
        wheel: {
            segments: 8,
            colors: ['#FF6B35', '#F7C59F', '#2EC4B6', '#E71D36', '#FF6B35', '#F7C59F', '#2EC4B6', '#E71D36'],
            spinDuration: 5000,
            pointer: 'top',
        },
    });
    const campaign = await prisma.campaign.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Quay là trúng - Tháng 2',
            description: 'Chương trình khuyến mãi đặc biệt tháng 2! Mua 1 ly trà sữa bất kỳ, quay vòng quay may mắn nhận ngay voucher giảm giá.',
            startDate: campaignStartDate,
            endDate: campaignEndDate,
            activeGame: 'wheel',
            gameConfig: wheelGameConfig,
            maxPlaysPerPhone: 1,
            isActive: true,
        },
    });
    console.log(`   ✅ Campaign: ${campaign.name}`);
    console.log(`   📅 Thời gian: ${campaign.startDate.toLocaleDateString('vi-VN')} - ${campaign.endDate.toLocaleDateString('vi-VN')}`);
    console.log(`   🎮 Game: ${campaign.activeGame}\n`);
    // --------------------------------------------------------------------------
    // 4. TẠO 3 REWARDS
    // --------------------------------------------------------------------------
    console.log('🎁 Tạo Rewards...');
    const rewardsData = [
        {
            campaignId: campaign.id,
            name: 'Voucher 10K',
            description: 'Giảm 10.000đ cho đơn hàng từ 50.000đ',
            iconUrl: '/images/rewards/voucher-10k.png',
            probability: 40, // 40% trúng
            totalQuantity: 100,
            remainingQty: 100,
            value: 10000,
            isActive: true,
            displayOrder: 1,
        },
        {
            campaignId: campaign.id,
            name: 'Voucher 50K',
            description: 'Giảm 50.000đ cho đơn hàng từ 150.000đ',
            iconUrl: '/images/rewards/voucher-50k.png',
            probability: 10, // 10% trúng
            totalQuantity: 20,
            remainingQty: 20,
            value: 50000,
            isActive: true,
            displayOrder: 2,
        },
        {
            campaignId: campaign.id,
            name: 'Chúc bạn may mắn lần sau',
            description: 'Rất tiếc, bạn chưa trúng thưởng. Hãy thử lại lần sau nhé!',
            iconUrl: '/images/rewards/no-luck.png',
            probability: 50, // 50% không trúng
            totalQuantity: null, // Unlimited
            remainingQty: null,
            value: 0,
            isActive: true,
            displayOrder: 3,
        },
    ];
    for (const rewardData of rewardsData) {
        const reward = await prisma.reward.create({
            data: rewardData,
        });
        console.log(`   ✅ Reward: ${reward.name} (${reward.probability}%)`);
    }
    console.log('');
    // --------------------------------------------------------------------------
    // 5. TẠO 5 PLAYERS MẪU
    // --------------------------------------------------------------------------
    console.log('👥 Tạo Players mẫu...');
    const playersData = [
        {
            phone: '0909111111',
            name: 'Nguyễn Văn An',
            email: 'nguyenvanan@gmail.com',
            playCount: 3,
            totalWins: 2,
            lastPlayAt: subDays(now, 1),
        },
        {
            phone: '0909222222',
            name: 'Trần Thị Bình',
            email: 'tranthibinh@gmail.com',
            playCount: 1,
            totalWins: 1,
            lastPlayAt: subDays(now, 2),
        },
        {
            phone: '0909333333',
            name: 'Lê Văn Cường',
            email: null,
            playCount: 2,
            totalWins: 0,
            lastPlayAt: subDays(now, 3),
        },
        {
            phone: '0909444444',
            name: 'Phạm Thị Dung',
            email: 'phamthidung@gmail.com',
            playCount: 5,
            totalWins: 3,
            lastPlayAt: now,
        },
        {
            phone: '0909555555',
            name: 'Hoàng Văn Em',
            email: null,
            playCount: 0,
            totalWins: 0,
            lastPlayAt: null,
        },
    ];
    const createdPlayers = [];
    for (const playerData of playersData) {
        const player = await prisma.player.create({
            data: playerData,
        });
        createdPlayers.push(player);
        console.log(`   ✅ Player: ${player.name} (${player.phone})`);
    }
    console.log('');
    // --------------------------------------------------------------------------
    // 6. TẠO MỘT SỐ VOUCHER MẪU
    // --------------------------------------------------------------------------
    console.log('🎫 Tạo Vouchers mẫu...');
    // Lấy rewards đã tạo
    const rewards = await prisma.reward.findMany({
        where: { campaignId: campaign.id },
    });
    const voucher10k = rewards.find(r => r.name === 'Voucher 10K');
    const voucher50k = rewards.find(r => r.name === 'Voucher 50K');
    if (voucher10k && voucher50k) {
        const vouchersData = [
            {
                playerId: createdPlayers[0].id,
                rewardId: voucher10k.id,
                campaignId: campaign.id,
                code: 'ABC12345',
                status: 'active',
                expiresAt: campaignEndDate,
            },
            {
                playerId: createdPlayers[0].id,
                rewardId: voucher50k.id,
                campaignId: campaign.id,
                code: 'XYZ67890',
                status: 'used',
                expiresAt: campaignEndDate,
                usedAt: subDays(now, 1),
                usedBy: 'admin',
                notes: 'Khách đổi voucher thành công',
            },
            {
                playerId: createdPlayers[1].id,
                rewardId: voucher10k.id,
                campaignId: campaign.id,
                code: 'DEF11111',
                status: 'active',
                expiresAt: campaignEndDate,
            },
            {
                playerId: createdPlayers[3].id,
                rewardId: voucher10k.id,
                campaignId: campaign.id,
                code: 'GHI22222',
                status: 'active',
                expiresAt: campaignEndDate,
            },
            {
                playerId: createdPlayers[3].id,
                rewardId: voucher50k.id,
                campaignId: campaign.id,
                code: 'JKL33333',
                status: 'active',
                expiresAt: campaignEndDate,
            },
        ];
        for (const voucherData of vouchersData) {
            const voucher = await prisma.voucher.create({
                data: voucherData,
            });
            console.log(`   ✅ Voucher: ${voucher.code} (${voucher.status})`);
        }
    }
    console.log('');
    // --------------------------------------------------------------------------
    // 7. TẠO MỘT SỐ PLAY LOGS MẪU
    // --------------------------------------------------------------------------
    console.log('📊 Tạo Play Logs mẫu...');
    const playLogsData = [
        {
            playerId: createdPlayers[0].id,
            campaignId: campaign.id,
            gameType: 'wheel',
            rewardId: voucher10k?.id,
            isWin: true,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
            deviceInfo: 'iPhone 13',
            playedAt: subDays(now, 3),
        },
        {
            playerId: createdPlayers[0].id,
            campaignId: campaign.id,
            gameType: 'wheel',
            rewardId: voucher50k?.id,
            isWin: true,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
            deviceInfo: 'iPhone 13',
            playedAt: subDays(now, 2),
        },
        {
            playerId: createdPlayers[0].id,
            campaignId: campaign.id,
            gameType: 'wheel',
            rewardId: null,
            isWin: false,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
            deviceInfo: 'iPhone 13',
            playedAt: subDays(now, 1),
        },
        {
            playerId: createdPlayers[1].id,
            campaignId: campaign.id,
            gameType: 'wheel',
            rewardId: voucher10k?.id,
            isWin: true,
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Android 12; Samsung Galaxy S21)',
            deviceInfo: 'Samsung Galaxy S21',
            playedAt: subDays(now, 2),
        },
        {
            playerId: createdPlayers[2].id,
            campaignId: campaign.id,
            gameType: 'wheel',
            rewardId: null,
            isWin: false,
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (Android 11; Xiaomi)',
            deviceInfo: 'Xiaomi Redmi Note 10',
            playedAt: subDays(now, 3),
        },
        {
            playerId: createdPlayers[2].id,
            campaignId: campaign.id,
            gameType: 'wheel',
            rewardId: null,
            isWin: false,
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (Android 11; Xiaomi)',
            deviceInfo: 'Xiaomi Redmi Note 10',
            playedAt: subDays(now, 2),
        },
        {
            playerId: createdPlayers[3].id,
            campaignId: campaign.id,
            gameType: 'wheel',
            rewardId: voucher10k?.id,
            isWin: true,
            ipAddress: '192.168.1.103',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
            deviceInfo: 'iPhone 14 Pro',
            playedAt: subDays(now, 1),
        },
    ];
    for (const logData of playLogsData) {
        await prisma.playLog.create({
            data: logData,
        });
    }
    console.log(`   ✅ Đã tạo ${playLogsData.length} play logs\n`);
    // --------------------------------------------------------------------------
    // 8. TẠO GAME ASSETS MẪU
    // --------------------------------------------------------------------------
    console.log('🎨 Tạo Game Assets mẫu...');
    const gameAssetsData = [
        // Wheel game assets
        {
            gameType: 'wheel',
            assetType: 'background',
            assetName: 'Wheel Background Default',
            assetUrl: '/images/games/wheel/bg-default.png',
            description: 'Background mặc định cho vòng quay',
            displayOrder: 1,
            isActive: true,
        },
        {
            gameType: 'wheel',
            assetType: 'icon',
            assetName: 'Pointer Arrow',
            assetUrl: '/images/games/wheel/pointer.png',
            description: 'Mũi tên chỉ vòng quay',
            displayOrder: 1,
            isActive: true,
        },
        // Shake game assets
        {
            gameType: 'shake',
            assetType: 'background',
            assetName: 'Tree Background',
            assetUrl: '/images/games/shake/tree-bg.png',
            description: 'Background cây cho game lắc',
            displayOrder: 1,
            isActive: true,
        },
        {
            gameType: 'shake',
            assetType: 'falling_object',
            assetName: 'Voucher Icon',
            assetUrl: '/images/games/shake/voucher-falling.png',
            description: 'Voucher rơi xuống',
            displayOrder: 1,
            isActive: true,
        },
        // Memory game assets
        {
            gameType: 'memory',
            assetType: 'card',
            assetName: 'Card Back',
            assetUrl: '/images/games/memory/card-back.png',
            description: 'Mặt sau của thẻ',
            displayOrder: 1,
            isActive: true,
        },
        // Tap game assets
        {
            gameType: 'tap',
            assetType: 'character',
            assetName: 'Chef Character',
            assetUrl: '/images/games/tap/chef.png',
            description: 'Nhân vật đầu bếp',
            displayOrder: 1,
            isActive: true,
        },
        {
            gameType: 'tap',
            assetType: 'background',
            assetName: 'Kitchen Background',
            assetUrl: '/images/games/tap/kitchen-bg.png',
            description: 'Background nhà bếp',
            displayOrder: 1,
            isActive: true,
        },
    ];
    for (const assetData of gameAssetsData) {
        await prisma.gameAsset.create({
            data: assetData,
        });
    }
    console.log(`   ✅ Đã tạo ${gameAssetsData.length} game assets\n`);
    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    🎉 SEED HOÀN TẤT!                          ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Tổng kết:');
    console.log(`   • Admin Users: 1`);
    console.log(`   • Store Config: 1`);
    console.log(`   • Campaigns: 1`);
    console.log(`   • Rewards: ${rewardsData.length}`);
    console.log(`   • Players: ${playersData.length}`);
    console.log(`   • Vouchers: 5`);
    console.log(`   • Play Logs: ${playLogsData.length}`);
    console.log(`   • Game Assets: ${gameAssetsData.length}`);
    console.log('');
    console.log('🔐 Đăng nhập Admin:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
}
// ============================================================================
// EXECUTE
// ============================================================================
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error('❌ Lỗi khi seed database:', e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map