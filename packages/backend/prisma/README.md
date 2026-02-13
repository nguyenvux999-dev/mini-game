# 🗄️ Prisma Database Setup

## Hướng dẫn cài đặt và chạy Prisma

### 1. Cài đặt dependencies

```bash
cd packages/backend
npm install
```

### 2. Tạo database và chạy migration

```bash
# Generate Prisma Client
npm run db:generate

# Chạy migration (tạo database + tables)
npm run db:migrate

# Hoặc dùng db push cho development
npm run db:push
```

### 3. Seed dữ liệu mẫu

```bash
npm run db:seed
```

Sau khi seed, bạn sẽ có:
- **1 Admin**: username `admin`, password `admin123`
- **1 Store Config**: Quán Trà Sữa ABC
- **1 Campaign**: "Quay là trúng - Tháng 2"
- **3 Rewards**: Voucher 10K (40%), Voucher 50K (10%), Không trúng (50%)
- **5 Players**: Nguyễn Văn An, Trần Thị Bình, Lê Văn Cường, Phạm Thị Dung, Hoàng Văn Em
- **5 Vouchers**: Mẫu vouchers cho các players
- **7 Play Logs**: Lịch sử chơi game mẫu
- **7 Game Assets**: Assets mặc định cho các game

### 4. Mở Prisma Studio (GUI quản lý database)

```bash
npm run db:studio
```

Truy cập: http://localhost:5555

### 5. Reset database (xóa và seed lại)

```bash
npm run db:reset
```

---

## 📋 Các lệnh Prisma thường dùng

| Lệnh | Mô tả |
|------|-------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Chạy migration (development) |
| `npm run db:migrate:prod` | Chạy migration (production) |
| `npm run db:push` | Push schema changes (không tạo migration) |
| `npm run db:seed` | Seed dữ liệu mẫu |
| `npm run db:studio` | Mở Prisma Studio GUI |
| `npm run db:reset` | Reset database và seed lại |

---

## 🔧 Cấu trúc Database

```
├── store_config      # Cấu hình thương hiệu
├── campaigns         # Chiến dịch khuyến mãi
├── rewards           # Phần thưởng
├── players           # Người chơi
├── vouchers          # Voucher đã phát
├── play_logs         # Lịch sử chơi game
├── game_assets       # Tài nguyên game
└── admin_users       # Tài khoản admin
```

---

## 🔐 Tài khoản mặc định

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |

⚠️ **Lưu ý**: Đổi mật khẩu admin trước khi deploy production!
