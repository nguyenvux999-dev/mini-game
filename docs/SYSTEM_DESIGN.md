# 📋 THIẾT KẾ HỆ THỐNG WEB MINIGAME
## Phiên bản: 1.0 | Ngày: 04/02/2026

---

# 📑 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Thiết kế Database](#3-thiết-kế-database)
4. [Thiết kế API](#4-thiết-kế-api)
5. [Thiết kế Frontend](#5-thiết-kế-frontend)
6. [Thiết kế Backend](#6-thiết-kế-backend)
7. [Bảo mật & Performance](#7-bảo-mật--performance)
8. [Deployment](#8-deployment)
9. [Cấu trúc Project](#9-cấu-trúc-project)

---

# 1. TỔNG QUAN DỰ ÁN

## 1.1 Mục tiêu kinh doanh
- Website minigame khuyến mãi cho các quán ăn/cafe
- Sản phẩm đóng gói bán trọn gói cho khách hàng B2B
- Dễ cấu hình, dễ triển khai, chi phí thấp

## 1.2 Tính năng chính

### 👤 Phía khách hàng (End-user)
| Tính năng | Mô tả |
|-----------|-------|
| Nhập SĐT | Bắt buộc để chơi game, lưu DB |
| Chơi minigame | 4 loại: Vòng quay, Lắc xì, Lật hình, Tap-tap |
| Nhận voucher | Hiển thị ngay + QR code để lưu |
| Đổi quà | Quét QR tại quán |

### 🔧 Phía Admin (Quản trị)
| Tính năng | Mô tả |
|-----------|-------|
| Quản lý thương hiệu | Logo, banner, thông tin quán |
| Quản lý game | Chọn game, tùy chỉnh giao diện game |
| Quản lý phần thưởng | CRUD quà, tỉ lệ trúng, số lượng, thời hạn |
| Quản lý chiến dịch | Tạo chương trình khuyến mãi có thời hạn |
| Quét voucher | Xác nhận & trừ voucher khi khách đổi quà |
| Thống kê | Lượt chơi, voucher phát, voucher đã dùng |

## 1.3 Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        TECH STACK                           │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND        │  Next.js 14 + TypeScript + TailwindCSS  │
│  BACKEND         │  Node.js + Express + TypeScript         │
│  DATABASE        │  SQLite (dev) / PostgreSQL (prod)       │
│  ORM             │  Prisma                                  │
│  CACHE           │  Node-cache (simple)                     │
│  FILE STORAGE    │  Local / Cloudinary (optional)          │
│  DEPLOY          │  Docker + Docker Compose                 │
└─────────────────────────────────────────────────────────────┘
```

---

# 2. KIẾN TRÚC HỆ THỐNG

## 2.1 High-Level Architecture

```
                    ┌─────────────────────────────────────┐
                    │           INTERNET                   │
                    └──────────────────┬──────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │         NGINX / Reverse Proxy        │
                    │      (SSL Termination + Cache)       │
                    └──────────────────┬──────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│    FRONTEND         │   │      BACKEND        │   │    STATIC FILES     │
│    (Next.js)        │   │    (Express API)    │   │   (uploads/images)  │
│                     │   │                     │   │                     │
│  Port: 3000         │   │  Port: 4000         │   │                     │
│                     │   │                     │   │                     │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   └─────────────────────┘
│  │ Landing Page  │  │   │  │ Config API    │  │
│  │ Game Page     │  │   │  │ Game API      │  │
│  │ Voucher Modal │  │   │  │ Voucher API   │  │
│  │ Admin Panel   │  │   │  │ Campaign API  │  │
│  └───────────────┘  │   │  │ Admin API     │  │
│                     │   │  │ Auth API      │  │
└─────────────────────┘   │  └───────────────┘  │
                          │         │           │
                          │         ▼           │
                          │  ┌───────────────┐  │
                          │  │   Services    │  │
                          │  │ ─────────────│  │
                          │  │ GameEngine   │  │
                          │  │ VoucherGen   │  │
                          │  │ QRGenerator  │  │
                          │  │ RateLimiter  │  │
                          │  └───────────────┘  │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │      DATABASE       │
                          │  SQLite/PostgreSQL  │
                          └─────────────────────┘
```

## 2.2 Luồng hoạt động chính

### 🎮 Flow: Khách chơi game

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Khách      │     │   Frontend   │     │   Backend    │     │   Database   │
│   (Mobile)   │     │   (Next.js)  │     │   (Express)  │     │   (SQLite)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │  1. Quét QR/Link   │                    │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │  2. GET /api/config                     │
       │                    │───────────────────>│                    │
       │                    │                    │  3. Query config   │
       │                    │                    │───────────────────>│
       │                    │                    │<───────────────────│
       │                    │<───────────────────│                    │
       │                    │                    │                    │
       │  4. Hiện form SĐT  │                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
       │  5. Nhập SĐT       │                    │                    │
       │───────────────────>│                    │                    │
       │                    │  6. POST /api/players                   │
       │                    │───────────────────>│                    │
       │                    │                    │  7. Lưu player     │
       │                    │                    │───────────────────>│
       │                    │                    │<───────────────────│
       │                    │<───────────────────│  8. Return token   │
       │                    │                    │                    │
       │  9. Hiển thị game  │                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
       │  10. Chơi game     │                    │                    │
       │───────────────────>│                    │                    │
       │                    │  11. POST /api/play                     │
       │                    │───────────────────>│                    │
       │                    │                    │  12. Random result │
       │                    │                    │  13. Gen voucher   │
       │                    │                    │  14. Save log      │
       │                    │                    │───────────────────>│
       │                    │                    │<───────────────────│
       │                    │<───────────────────│  15. Return result │
       │                    │                    │                    │
       │  16. Show voucher  │                    │                    │
       │  + QR code         │                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
```

### 🎫 Flow: Đổi voucher tại quán

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Nhân viên  │     │   Admin App  │     │   Backend    │     │   Database   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │  1. Quét QR voucher│                    │                    │
       │───────────────────>│                    │                    │
       │                    │  2. GET /api/vouchers/:code             │
       │                    │───────────────────>│                    │
       │                    │                    │  3. Tìm voucher    │
       │                    │                    │───────────────────>│
       │                    │                    │<───────────────────│
       │                    │<───────────────────│  4. Voucher info   │
       │                    │                    │                    │
       │  5. Hiện thông tin │                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
       │  6. Xác nhận đổi   │                    │                    │
       │───────────────────>│                    │                    │
       │                    │  7. POST /api/vouchers/:code/redeem     │
       │                    │───────────────────>│                    │
       │                    │                    │  8. Mark used      │
       │                    │                    │───────────────────>│
       │                    │                    │<───────────────────│
       │                    │<───────────────────│  9. Success        │
       │                    │                    │                    │
       │  10. Thông báo OK  │                    │                    │
       │<───────────────────│                    │                    │
```

---

# 3. THIẾT KẾ DATABASE

## 3.1 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│   store_config    │       │     campaigns     │       │    admin_users    │
├───────────────────┤       ├───────────────────┤       ├───────────────────┤
│ id            PK  │       │ id            PK  │       │ id            PK  │
│ store_name        │       │ name              │       │ username          │
│ logo_url          │       │ description       │       │ password_hash     │
│ banner_url        │       │ start_date        │       │ role              │
│ primary_color     │       │ end_date          │       │ created_at        │
│ secondary_color   │       │ active_game       │       │ last_login        │
│ address           │       │ game_config       │       └───────────────────┘
│ hotline           │       │ is_active         │
│ fanpage_url       │       │ created_at        │
│ updated_at        │       │ updated_at        │
└───────────────────┘       └─────────┬─────────┘
                                      │
                                      │ 1:N
                                      │
                            ┌─────────▼─────────┐
                            │      rewards      │
                            ├───────────────────┤
                            │ id            PK  │
                            │ campaign_id   FK  │──────────────────┐
                            │ name              │                  │
                            │ description       │                  │
                            │ icon_url          │                  │
                            │ probability       │                  │
                            │ total_quantity    │                  │
                            │ remaining_qty     │                  │
                            │ is_active         │                  │
                            │ created_at        │                  │
                            └─────────┬─────────┘                  │
                                      │                            │
                                      │ 1:N                        │
                                      │                            │
┌───────────────────┐       ┌─────────▼─────────┐                  │
│     players       │       │     vouchers      │                  │
├───────────────────┤       ├───────────────────┤                  │
│ id            PK  │       │ id            PK  │                  │
│ phone             │◄──────│ player_id     FK  │                  │
│ name              │       │ reward_id     FK  │◄─────────────────┘
│ play_count        │       │ campaign_id   FK  │
│ last_play_at      │       │ code              │
│ created_at        │       │ qr_data           │
└─────────┬─────────┘       │ status            │
          │                 │ expires_at        │
          │                 │ used_at           │
          │                 │ used_by           │
          │                 │ created_at        │
          │                 └───────────────────┘
          │
          │ 1:N
          │
┌─────────▼─────────┐       ┌───────────────────┐
│    play_logs      │       │   game_assets     │
├───────────────────┤       ├───────────────────┤
│ id            PK  │       │ id            PK  │
│ player_id     FK  │       │ game_type         │
│ campaign_id   FK  │       │ asset_type        │
│ game_type         │       │ asset_url         │
│ reward_id     FK  │       │ asset_name        │
│ is_win            │       │ display_order     │
│ ip_address        │       │ is_active         │
│ user_agent        │       │ created_at        │
│ played_at         │       └───────────────────┘
└───────────────────┘
```

## 3.2 Chi tiết các bảng

### 📋 Bảng `store_config` - Cấu hình thương hiệu

```sql
CREATE TABLE store_config (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    store_name      TEXT NOT NULL,
    logo_url        TEXT,
    banner_url      TEXT,
    primary_color   TEXT DEFAULT '#FF6B35',
    secondary_color TEXT DEFAULT '#F7C59F',
    address         TEXT,
    hotline         TEXT,
    fanpage_url     TEXT,
    instagram_url   TEXT,
    zalo_url        TEXT,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER | Primary key |
| store_name | TEXT | Tên quán/thương hiệu |
| logo_url | TEXT | URL logo |
| banner_url | TEXT | URL banner khuyến mãi |
| primary_color | TEXT | Màu chủ đạo (hex) |
| secondary_color | TEXT | Màu phụ (hex) |
| address | TEXT | Địa chỉ quán |
| hotline | TEXT | Số điện thoại |
| fanpage_url | TEXT | Link Facebook |
| instagram_url | TEXT | Link Instagram |
| zalo_url | TEXT | Link Zalo OA |
| updated_at | DATETIME | Thời gian cập nhật |

---

### 📋 Bảng `campaigns` - Chiến dịch khuyến mãi

```sql
CREATE TABLE campaigns (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    description     TEXT,
    start_date      DATETIME NOT NULL,
    end_date        DATETIME NOT NULL,
    active_game     TEXT NOT NULL CHECK(active_game IN ('wheel', 'shake', 'memory', 'tap')),
    game_config     TEXT,  -- JSON config cho từng game
    max_plays_per_phone INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER | Primary key |
| name | TEXT | Tên chương trình (VD: "Quay là trúng") |
| description | TEXT | Mô tả chương trình |
| start_date | DATETIME | Ngày bắt đầu |
| end_date | DATETIME | Ngày kết thúc |
| active_game | TEXT | Loại game: wheel/shake/memory/tap |
| game_config | TEXT | JSON cấu hình riêng cho game |
| max_plays_per_phone | INTEGER | Số lượt chơi tối đa/SĐT |
| is_active | BOOLEAN | Đang hoạt động |
| created_at | DATETIME | Ngày tạo |
| updated_at | DATETIME | Ngày cập nhật |

**Ví dụ `game_config` JSON:**

```json
// Wheel game config
{
  "wheel": {
    "segments": 8,
    "colors": ["#FF6B35", "#F7C59F", "#2EC4B6", "#E71D36"],
    "spinDuration": 5000,
    "pointer": "top"
  }
}

// Shake game config
{
  "shake": {
    "theme": "tree",  // tree | santa | firework
    "fallingObject": "voucher_icon.png",
    "background": "tree_bg.png",
    "shakeSensitivity": 15,
    "duration": 3000
  }
}

// Memory game config
{
  "memory": {
    "gridSize": "4x4",  // 3x3 | 4x4
    "cardImages": ["item1.png", "item2.png", ...],
    "timeLimit": 60,
    "matchesToWin": 8
  }
}

// Tap game config
{
  "tap": {
    "variant": "cooking",  // cooking | eating
    "character": "chef.png",
    "targetItem": "dish.png",
    "perfectZones": 3,
    "timeLimit": 10,
    "targetTaps": 50  // for eating variant
  }
}
```

---

### 📋 Bảng `rewards` - Phần thưởng

```sql
CREATE TABLE rewards (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id     INTEGER NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    icon_url        TEXT,
    probability     INTEGER NOT NULL CHECK(probability >= 0 AND probability <= 100),
    total_quantity  INTEGER,  -- NULL = unlimited
    remaining_qty   INTEGER,
    value           INTEGER DEFAULT 0,  -- Giá trị voucher (VND)
    is_active       BOOLEAN DEFAULT TRUE,
    display_order   INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER | Primary key |
| campaign_id | INTEGER | FK -> campaigns.id |
| name | TEXT | Tên quà (VD: "Voucher 10k") |
| description | TEXT | Mô tả chi tiết |
| icon_url | TEXT | Icon hiển thị |
| probability | INTEGER | Tỉ lệ trúng (0-100%) |
| total_quantity | INTEGER | Tổng số lượng (NULL = không giới hạn) |
| remaining_qty | INTEGER | Số lượng còn lại |
| value | INTEGER | Giá trị tiền (VND) |
| is_active | BOOLEAN | Đang hoạt động |
| display_order | INTEGER | Thứ tự hiển thị |
| created_at | DATETIME | Ngày tạo |

---

### 📋 Bảng `players` - Người chơi

```sql
CREATE TABLE players (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    phone           TEXT NOT NULL UNIQUE,
    name            TEXT,
    email           TEXT,
    play_count      INTEGER DEFAULT 0,
    total_wins      INTEGER DEFAULT 0,
    last_play_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_phone ON players(phone);
```

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER | Primary key |
| phone | TEXT | Số điện thoại (unique) |
| name | TEXT | Tên khách (optional) |
| email | TEXT | Email (optional) |
| play_count | INTEGER | Tổng số lượt đã chơi |
| total_wins | INTEGER | Tổng số lần trúng |
| last_play_at | DATETIME | Lần chơi cuối |
| created_at | DATETIME | Ngày đăng ký |

---

### 📋 Bảng `vouchers` - Voucher đã phát

```sql
CREATE TABLE vouchers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id       INTEGER NOT NULL,
    reward_id       INTEGER NOT NULL,
    campaign_id     INTEGER NOT NULL,
    code            TEXT NOT NULL UNIQUE,
    qr_data         TEXT,  -- Base64 QR image hoặc URL
    status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'used', 'expired', 'cancelled')),
    expires_at      DATETIME,
    used_at         DATETIME,
    used_by         TEXT,  -- Username nhân viên xác nhận
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_player ON vouchers(player_id);
CREATE INDEX idx_vouchers_status ON vouchers(status);
```

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER | Primary key |
| player_id | INTEGER | FK -> players.id |
| reward_id | INTEGER | FK -> rewards.id |
| campaign_id | INTEGER | FK -> campaigns.id |
| code | TEXT | Mã voucher unique (VD: "ABC123") |
| qr_data | TEXT | QR code data |
| status | TEXT | Trạng thái: active/used/expired/cancelled |
| expires_at | DATETIME | Ngày hết hạn |
| used_at | DATETIME | Thời điểm sử dụng |
| used_by | TEXT | Nhân viên xác nhận |
| notes | TEXT | Ghi chú |
| created_at | DATETIME | Ngày tạo |

---

### 📋 Bảng `play_logs` - Lịch sử chơi game

```sql
CREATE TABLE play_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id       INTEGER NOT NULL,
    campaign_id     INTEGER NOT NULL,
    game_type       TEXT NOT NULL,
    reward_id       INTEGER,  -- NULL nếu không trúng
    is_win          BOOLEAN DEFAULT FALSE,
    ip_address      TEXT,
    user_agent      TEXT,
    device_info     TEXT,
    played_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
);

CREATE INDEX idx_play_logs_player ON play_logs(player_id);
CREATE INDEX idx_play_logs_campaign ON play_logs(campaign_id);
CREATE INDEX idx_play_logs_date ON play_logs(played_at);
```

---

### 📋 Bảng `game_assets` - Tài nguyên game

```sql
CREATE TABLE game_assets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type       TEXT NOT NULL CHECK(game_type IN ('wheel', 'shake', 'memory', 'tap')),
    asset_type      TEXT NOT NULL,  -- 'background', 'character', 'icon', 'sound'
    asset_name      TEXT NOT NULL,
    asset_url       TEXT NOT NULL,
    description     TEXT,
    display_order   INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| asset_type | Mô tả |
|------------|-------|
| background | Ảnh nền game |
| character | Nhân vật (tap game) |
| icon | Icon phần thưởng |
| card | Hình thẻ (memory game) |
| falling_object | Vật rơi (shake game) |
| sound | Âm thanh |

---

### 📋 Bảng `admin_users` - Tài khoản admin

```sql
CREATE TABLE admin_users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT DEFAULT 'staff' CHECK(role IN ('admin', 'staff')),
    display_name    TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Role | Quyền hạn |
|------|-----------|
| admin | Full quyền: config, rewards, campaigns, quét voucher |
| staff | Chỉ quét voucher |

---

## 3.3 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}

model StoreConfig {
  id             Int       @id @default(autoincrement())
  storeName      String    @map("store_name")
  logoUrl        String?   @map("logo_url")
  bannerUrl      String?   @map("banner_url")
  primaryColor   String    @default("#FF6B35") @map("primary_color")
  secondaryColor String    @default("#F7C59F") @map("secondary_color")
  address        String?
  hotline        String?
  fanpageUrl     String?   @map("fanpage_url")
  instagramUrl   String?   @map("instagram_url")
  zaloUrl        String?   @map("zalo_url")
  updatedAt      DateTime  @default(now()) @updatedAt @map("updated_at")

  @@map("store_config")
}

model Campaign {
  id               Int       @id @default(autoincrement())
  name             String
  description      String?
  startDate        DateTime  @map("start_date")
  endDate          DateTime  @map("end_date")
  activeGame       String    @map("active_game")
  gameConfig       String?   @map("game_config")
  maxPlaysPerPhone Int       @default(1) @map("max_plays_per_phone")
  isActive         Boolean   @default(true) @map("is_active")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @default(now()) @updatedAt @map("updated_at")

  rewards   Reward[]
  vouchers  Voucher[]
  playLogs  PlayLog[]

  @@map("campaigns")
}

model Reward {
  id            Int       @id @default(autoincrement())
  campaignId    Int       @map("campaign_id")
  name          String
  description   String?
  iconUrl       String?   @map("icon_url")
  probability   Int
  totalQuantity Int?      @map("total_quantity")
  remainingQty  Int?      @map("remaining_qty")
  value         Int       @default(0)
  isActive      Boolean   @default(true) @map("is_active")
  displayOrder  Int       @default(0) @map("display_order")
  createdAt     DateTime  @default(now()) @map("created_at")

  campaign  Campaign   @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  vouchers  Voucher[]
  playLogs  PlayLog[]

  @@map("rewards")
}

model Player {
  id          Int       @id @default(autoincrement())
  phone       String    @unique
  name        String?
  email       String?
  playCount   Int       @default(0) @map("play_count")
  totalWins   Int       @default(0) @map("total_wins")
  lastPlayAt  DateTime? @map("last_play_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  vouchers  Voucher[]
  playLogs  PlayLog[]

  @@map("players")
}

model Voucher {
  id          Int       @id @default(autoincrement())
  playerId    Int       @map("player_id")
  rewardId    Int       @map("reward_id")
  campaignId  Int       @map("campaign_id")
  code        String    @unique
  qrData      String?   @map("qr_data")
  status      String    @default("active")
  expiresAt   DateTime? @map("expires_at")
  usedAt      DateTime? @map("used_at")
  usedBy      String?   @map("used_by")
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at")

  player    Player    @relation(fields: [playerId], references: [id])
  reward    Reward    @relation(fields: [rewardId], references: [id])
  campaign  Campaign  @relation(fields: [campaignId], references: [id])

  @@map("vouchers")
}

model PlayLog {
  id          Int       @id @default(autoincrement())
  playerId    Int       @map("player_id")
  campaignId  Int       @map("campaign_id")
  gameType    String    @map("game_type")
  rewardId    Int?      @map("reward_id")
  isWin       Boolean   @default(false) @map("is_win")
  ipAddress   String?   @map("ip_address")
  userAgent   String?   @map("user_agent")
  deviceInfo  String?   @map("device_info")
  playedAt    DateTime  @default(now()) @map("played_at")

  player    Player    @relation(fields: [playerId], references: [id])
  campaign  Campaign  @relation(fields: [campaignId], references: [id])
  reward    Reward?   @relation(fields: [rewardId], references: [id])

  @@map("play_logs")
}

model GameAsset {
  id           Int      @id @default(autoincrement())
  gameType     String   @map("game_type")
  assetType    String   @map("asset_type")
  assetName    String   @map("asset_name")
  assetUrl     String   @map("asset_url")
  description  String?
  displayOrder Int      @default(0) @map("display_order")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("game_assets")
}

model AdminUser {
  id           Int       @id @default(autoincrement())
  username     String    @unique
  passwordHash String    @map("password_hash")
  role         String    @default("staff")
  displayName  String?   @map("display_name")
  isActive     Boolean   @default(true) @map("is_active")
  lastLogin    DateTime? @map("last_login")
  createdAt    DateTime  @default(now()) @map("created_at")

  @@map("admin_users")
}
```

---

# 4. THIẾT KẾ API

## 4.1 API Overview

| Module | Base Path | Mô tả |
|--------|-----------|-------|
| Config | `/api/config` | Cấu hình store |
| Campaign | `/api/campaigns` | Quản lý chiến dịch |
| Game | `/api/game` | Xử lý chơi game |
| Player | `/api/players` | Quản lý người chơi |
| Voucher | `/api/vouchers` | Quản lý voucher |
| Asset | `/api/assets` | Upload/quản lý tài nguyên |
| Auth | `/api/auth` | Xác thực admin |
| Stats | `/api/stats` | Thống kê |

## 4.2 Chi tiết API Endpoints

### 🔧 Config APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CONFIG MODULE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  GET    /api/config              │ Lấy config cho frontend (public)             │
│  GET    /api/config/admin        │ Lấy full config (admin only)                 │
│  PUT    /api/config              │ Cập nhật config (admin only)                 │
│  POST   /api/config/upload-logo  │ Upload logo (admin only)                     │
│  POST   /api/config/upload-banner│ Upload banner (admin only)                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### GET /api/config
**Response (Public):**
```json
{
  "success": true,
  "data": {
    "store": {
      "name": "Quán Trà Sữa ABC",
      "logo": "https://example.com/uploads/logo.png",
      "banner": "https://example.com/uploads/banner.jpg",
      "primaryColor": "#FF6B35",
      "secondaryColor": "#F7C59F"
    },
    "campaign": {
      "id": 1,
      "name": "Quay là trúng - Tháng 2",
      "activeGame": "wheel",
      "gameConfig": { ... },
      "endDate": "2026-02-28T23:59:59Z"
    },
    "rewards": [
      {
        "id": 1,
        "name": "Voucher 10k",
        "icon": "https://example.com/uploads/voucher10k.png",
        "displayOrder": 1
      },
      {
        "id": 2,
        "name": "Voucher 50k",
        "icon": "https://example.com/uploads/voucher50k.png",
        "displayOrder": 2
      }
    ],
    "contact": {
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "hotline": "0909123456",
      "fanpage": "https://fb.com/quanABC"
    }
  }
}
```

---

### 🎮 Game APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               GAME MODULE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  POST   /api/game/play           │ Chơi game và nhận kết quả                    │
│  GET    /api/game/check-eligible │ Kiểm tra còn lượt chơi không                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### POST /api/game/play
**Request:**
```json
{
  "playerId": 123,
  "gameType": "wheel",
  "gameData": {
    // Dữ liệu game (optional, tuỳ loại game)
    "taps": 52,           // cho tap game
    "matchedPairs": 8,    // cho memory game
    "perfectHits": 3      // cho tap cooking
  }
}
```

**Response (Thắng):**
```json
{
  "success": true,
  "data": {
    "isWin": true,
    "reward": {
      "id": 1,
      "name": "Voucher 10k",
      "description": "Giảm 10.000đ cho đơn từ 50.000đ",
      "icon": "https://example.com/uploads/voucher10k.png"
    },
    "voucher": {
      "code": "ABC123XY",
      "qrCode": "data:image/png;base64,...",
      "expiresAt": "2026-02-28T23:59:59Z"
    },
    "message": "Chúc mừng bạn đã trúng Voucher 10k!"
  }
}
```

**Response (Thua):**
```json
{
  "success": true,
  "data": {
    "isWin": false,
    "reward": null,
    "voucher": null,
    "message": "Chúc bạn may mắn lần sau!"
  }
}
```

---

### 👤 Player APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PLAYER MODULE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  POST   /api/players/register    │ Đăng ký/đăng nhập bằng SĐT                   │
│  GET    /api/players/:id         │ Lấy thông tin player                         │
│  GET    /api/players/:id/vouchers│ Lấy vouchers của player                      │
│  GET    /api/players             │ Danh sách players (admin)                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### POST /api/players/register
**Request:**
```json
{
  "phone": "0909123456",
  "name": "Nguyễn Văn A"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "player": {
      "id": 123,
      "phone": "0909123456",
      "name": "Nguyễn Văn A",
      "playCount": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "remainingPlays": 1,
    "message": "Đăng ký thành công!"
  }
}
```

---

### 🎫 Voucher APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             VOUCHER MODULE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  GET    /api/vouchers/:code      │ Lấy thông tin voucher bằng code              │
│  POST   /api/vouchers/:code/redeem│ Đổi voucher (admin/staff)                   │
│  GET    /api/vouchers            │ Danh sách vouchers (admin)                   │
│  PATCH  /api/vouchers/:id/cancel │ Huỷ voucher (admin)                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### GET /api/vouchers/:code
**Response:**
```json
{
  "success": true,
  "data": {
    "voucher": {
      "id": 456,
      "code": "ABC123XY",
      "status": "active",
      "reward": {
        "name": "Voucher 10k",
        "value": 10000
      },
      "player": {
        "phone": "0909***456",
        "name": "Nguyễn Văn A"
      },
      "campaign": {
        "name": "Quay là trúng - Tháng 2"
      },
      "expiresAt": "2026-02-28T23:59:59Z",
      "createdAt": "2026-02-04T10:30:00Z"
    },
    "canRedeem": true
  }
}
```

#### POST /api/vouchers/:code/redeem
**Request:**
```json
{
  "notes": "Khách đổi voucher"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Đã xác nhận đổi voucher thành công!",
    "voucher": {
      "code": "ABC123XY",
      "status": "used",
      "usedAt": "2026-02-04T15:30:00Z",
      "usedBy": "staff01"
    }
  }
}
```

---

### 📊 Campaign APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CAMPAIGN MODULE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  GET    /api/campaigns           │ Danh sách campaigns (admin)                  │
│  GET    /api/campaigns/:id       │ Chi tiết campaign                            │
│  POST   /api/campaigns           │ Tạo campaign mới                             │
│  PUT    /api/campaigns/:id       │ Cập nhật campaign                            │
│  DELETE /api/campaigns/:id       │ Xoá campaign                                 │
│  PATCH  /api/campaigns/:id/toggle│ Bật/tắt campaign                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🎁 Reward APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              REWARD MODULE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  GET    /api/rewards             │ Danh sách rewards theo campaign              │
│  POST   /api/rewards             │ Tạo reward mới                               │
│  PUT    /api/rewards/:id         │ Cập nhật reward                              │
│  DELETE /api/rewards/:id         │ Xoá reward                                   │
│  PATCH  /api/rewards/:id/toggle  │ Bật/tắt reward                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### POST /api/rewards
**Request:**
```json
{
  "campaignId": 1,
  "name": "Voucher 10k",
  "description": "Giảm 10.000đ cho đơn từ 50.000đ",
  "iconUrl": "https://example.com/uploads/voucher10k.png",
  "probability": 30,
  "totalQuantity": 100,
  "value": 10000
}
```

---

### 🔐 Auth APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               AUTH MODULE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  POST   /api/auth/login          │ Đăng nhập admin                              │
│  POST   /api/auth/logout         │ Đăng xuất                                    │
│  GET    /api/auth/me             │ Lấy thông tin user hiện tại                  │
│  PUT    /api/auth/password       │ Đổi mật khẩu                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📈 Stats APIs

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              STATS MODULE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  GET    /api/stats/dashboard     │ Dashboard tổng quan                          │
│  GET    /api/stats/plays         │ Thống kê lượt chơi                           │
│  GET    /api/stats/vouchers      │ Thống kê voucher                             │
│  GET    /api/stats/players       │ Thống kê người chơi                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### GET /api/stats/dashboard
**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "plays": 156,
      "wins": 78,
      "newPlayers": 45,
      "vouchersIssued": 78,
      "vouchersRedeemed": 23
    },
    "campaign": {
      "totalPlays": 1234,
      "totalWins": 567,
      "totalPlayers": 890,
      "vouchersIssued": 567,
      "vouchersRedeemed": 234,
      "winRate": "45.9%"
    },
    "rewardStats": [
      { "name": "Voucher 10k", "issued": 300, "redeemed": 120, "remaining": 50 },
      { "name": "Voucher 50k", "issued": 50, "redeemed": 30, "remaining": 20 }
    ]
  }
}
```

---

## 4.3 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VOUCHER_EXPIRED",
    "message": "Voucher đã hết hạn",
    "details": {
      "expiredAt": "2026-02-01T23:59:59Z"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Mô tả |
|------|-------------|-------|
| UNAUTHORIZED | 401 | Chưa đăng nhập |
| FORBIDDEN | 403 | Không có quyền |
| NOT_FOUND | 404 | Không tìm thấy |
| VALIDATION_ERROR | 400 | Dữ liệu không hợp lệ |
| CAMPAIGN_ENDED | 400 | Chương trình đã kết thúc |
| NO_PLAYS_LEFT | 400 | Hết lượt chơi |
| VOUCHER_EXPIRED | 400 | Voucher hết hạn |
| VOUCHER_USED | 400 | Voucher đã sử dụng |
| RATE_LIMITED | 429 | Quá nhiều request |
| SERVER_ERROR | 500 | Lỗi server |

---

# 5. THIẾT KẾ FRONTEND

## 5.1 Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (/)
│   ├── layout.tsx                # Root layout
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── layout.tsx            # Admin layout
│   │   ├── login/page.tsx        # Admin login
│   │   ├── config/page.tsx       # Store config
│   │   ├── campaigns/page.tsx    # Campaign management
│   │   ├── rewards/page.tsx      # Reward management
│   │   ├── vouchers/page.tsx     # Voucher management
│   │   ├── scan/page.tsx         # QR Scanner
│   │   └── stats/page.tsx        # Statistics
│   └── api/                      # API routes (if needed)
│
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Loading.tsx
│   │   ├── Modal.tsx
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   │
│   ├── landing/
│   │   ├── BrandHeader.tsx
│   │   ├── PromoBanner.tsx
│   │   ├── PhoneForm.tsx
│   │   ├── RewardList.tsx
│   │   └── FooterContact.tsx
│   │
│   ├── games/
│   │   ├── GameRenderer.tsx      # Main game container
│   │   ├── WheelGame/
│   │   │   ├── WheelGame.tsx
│   │   │   ├── WheelCanvas.tsx
│   │   │   └── useWheelAnimation.ts
│   │   ├── ShakeGame/
│   │   │   ├── ShakeGame.tsx
│   │   │   ├── FallingObjects.tsx
│   │   │   └── useShakeDetect.ts
│   │   ├── MemoryGame/
│   │   │   ├── MemoryGame.tsx
│   │   │   ├── CardGrid.tsx
│   │   │   ├── Card.tsx
│   │   │   └── useMemoryLogic.ts
│   │   └── TapGame/
│   │       ├── TapGame.tsx
│   │       ├── CookingVariant.tsx
│   │       ├── EatingVariant.tsx
│   │       └── useTapCounter.ts
│   │
│   ├── voucher/
│   │   ├── VoucherModal.tsx
│   │   ├── VoucherCard.tsx
│   │   └── QRDisplay.tsx
│   │
│   └── admin/
│       ├── Sidebar.tsx
│       ├── TopBar.tsx
│       ├── DataTable.tsx
│       ├── StatsCard.tsx
│       ├── QRScanner.tsx
│       ├── FileUploader.tsx
│       └── forms/
│           ├── ConfigForm.tsx
│           ├── CampaignForm.tsx
│           ├── RewardForm.tsx
│           └── GameConfigForm.tsx
│
├── hooks/
│   ├── useConfig.ts              # Fetch store config
│   ├── usePlayer.ts              # Player state
│   ├── useGame.ts                # Game logic
│   ├── useVoucher.ts             # Voucher operations
│   └── useAuth.ts                # Admin auth
│
├── lib/
│   ├── api.ts                    # API client
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # Constants
│
├── stores/
│   ├── playerStore.ts            # Zustand store for player
│   └── gameStore.ts              # Zustand store for game state
│
├── types/
│   ├── api.types.ts
│   ├── game.types.ts
│   └── admin.types.ts
│
└── styles/
    └── globals.css
```

## 5.2 Page Components

### Landing Page (/)

```
┌─────────────────────────────────────────┐
│            BrandHeader                   │
│  ┌─────────────────────────────────────┐│
│  │         [LOGO]                      ││
│  │     "Quán Trà Sữa ABC"              ││
│  │   "Quay là trúng - Tháng 2"         ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│            PromoBanner                   │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │     [BANNER IMAGE]                  ││
│  │                                     ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│     PhoneForm (if not registered)        │
│  ┌─────────────────────────────────────┐│
│  │  Nhập SĐT để tham gia:              ││
│  │  [___________0909123456___________] ││
│  │         [  CHƠI NGAY  ]             ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│            GameRenderer                  │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │         [WHEEL GAME]                ││
│  │              or                     ││
│  │         [SHAKE GAME]                ││
│  │              or                     ││
│  │         [MEMORY GAME]               ││
│  │              or                     ││
│  │         [TAP GAME]                  ││
│  │                                     ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│            RewardList                    │
│  ┌─────────────────────────────────────┐│
│  │  🎁 Phần thưởng hôm nay:            ││
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   ││
│  │  │ 10k │ │ 50k │ │Free │ │ 🍵 │   ││
│  │  └─────┘ └─────┘ └─────┘ └─────┘   ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│           FooterContact                  │
│  ┌─────────────────────────────────────┐│
│  │  📍 123 Đường ABC, Quận 1           ││
│  │  📞 0909 123 456                    ││
│  │  🌐 fb.com/quanABC                  ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Voucher Modal

```
┌─────────────────────────────────────────┐
│               ❌ Close                   │
├─────────────────────────────────────────┤
│                                         │
│            🎉 CHÚC MỪNG! 🎉             │
│                                         │
│          Bạn đã trúng thưởng:           │
│                                         │
│           ┌───────────────┐             │
│           │   [ICON]      │             │
│           │  VOUCHER 10K  │             │
│           └───────────────┘             │
│                                         │
│          Mã voucher của bạn:            │
│         ┌───────────────────┐           │
│         │    ABC123XY       │           │
│         └───────────────────┘           │
│                                         │
│              [QR CODE]                  │
│                                         │
│    Hạn sử dụng: 28/02/2026              │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  Đưa màn hình này cho nhân viên     ││
│  │  hoặc quét QR khi đổi quà           ││
│  └─────────────────────────────────────┘│
│                                         │
│    [  LƯU VOUCHER  ]  [  CHƠI LẠI  ]   │
│                                         │
└─────────────────────────────────────────┘
```

### Admin Dashboard

```
┌───────────────────────────────────────────────────────────────────────┐
│  [LOGO]  Web MiniGame Admin                    👤 Admin  │  Đăng xuất │
├─────────┬─────────────────────────────────────────────────────────────┤
│         │                                                             │
│  📊     │   Dashboard                                                 │
│Dashboard│   ─────────────────────────────────────────────────────     │
│         │                                                             │
│  ⚙️     │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ Cấu hình│   │ 156     │ │ 78      │ │ 45      │ │ 23      │          │
│         │   │ Lượt chơi│ │ Trúng   │ │ Người mới│ │ Đã đổi  │          │
│  🎯     │   │ hôm nay │ │ thưởng  │ │         │ │ voucher │          │
│Chiến dịch│   └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│         │                                                             │
│  🎁     │   ┌─────────────────────────────────────────────────────┐  │
│ Phần thưởng│   │                    Biểu đồ                          │  │
│         │   │                  lượt chơi theo ngày                 │  │
│  🎫     │   │     📈                                               │  │
│ Voucher │   │                                                      │  │
│         │   └─────────────────────────────────────────────────────┘  │
│  📷     │                                                             │
│Quét QR  │   Voucher cần xử lý:                                       │
│         │   ┌───────────────────────────────────────────────────────┐│
│  📈     │   │ Code     │ Quà      │ Khách    │ Ngày tạo │ Thao tác ││
│Thống kê │   │ ABC123XY │ 10k      │ 0909***  │ 04/02    │ [Đổi]    ││
│         │   │ DEF456ZZ │ 50k      │ 0912***  │ 04/02    │ [Đổi]    ││
│         │   └───────────────────────────────────────────────────────┘│
│         │                                                             │
└─────────┴─────────────────────────────────────────────────────────────┘
```

## 5.3 Game Components Detail

### 🎡 Wheel Game

```typescript
// components/games/WheelGame/WheelGame.tsx
interface WheelGameProps {
  rewards: Reward[];
  config: WheelConfig;
  onPlay: () => Promise<GameResult>;
  onComplete: (result: GameResult) => void;
}

interface WheelConfig {
  segments: number;
  colors: string[];
  spinDuration: number;  // ms
  pointer: 'top' | 'right';
}
```

**Animation Flow:**
1. User clicks "Quay"
2. Call API `/api/game/play`
3. Receive result (which segment to land on)
4. Calculate rotation angle
5. Animate wheel spin with easing
6. Stop at target segment
7. Show result modal

### 📱 Shake Game

```typescript
// components/games/ShakeGame/ShakeGame.tsx
interface ShakeGameProps {
  config: ShakeConfig;
  onPlay: () => Promise<GameResult>;
  onComplete: (result: GameResult) => void;
}

interface ShakeConfig {
  theme: 'tree' | 'santa' | 'firework';
  fallingObject: string;  // URL
  background: string;     // URL
  shakeSensitivity: number;
  duration: number;  // ms
}
```

**Features:**
- DeviceMotion API để detect shake trên mobile
- Fallback button "Lắc" cho desktop
- Animation particles rơi xuống
- Customizable theme (cây, ông già Noel, pháo hoa)

### 🧠 Memory Game

```typescript
// components/games/MemoryGame/MemoryGame.tsx
interface MemoryGameProps {
  config: MemoryConfig;
  onComplete: (success: boolean, time: number) => void;
}

interface MemoryConfig {
  gridSize: '3x3' | '4x4';
  cardImages: string[];  // URLs
  timeLimit: number;     // seconds
  matchesToWin: number;
}
```

**Game Logic:**
- Flip 2 cards at a time
- If match → keep revealed
- If not match → flip back
- Win if all pairs found before time runs out

### ⚡ Tap Game

```typescript
// components/games/TapGame/TapGame.tsx
interface TapGameProps {
  variant: 'cooking' | 'eating';
  config: TapConfig;
  onComplete: (success: boolean, score: number) => void;
}

interface TapConfig {
  // Cooking variant
  perfectZones: number;
  
  // Eating variant
  targetTaps: number;
  timeLimit: number;
  
  // Common
  character: string;     // URL
  targetItem: string;    // URL
}
```

**Cooking Variant:**
- Progress bar chạy liên tục
- Tap để dừng đúng "Perfect Zone"
- 3 lần perfect → Win

**Eating Variant:**
- Tap liên tục trong 10 giây
- Đạt target taps → Win

---

# 6. THIẾT KẾ BACKEND

## 6.1 Project Structure

```
backend/
├── src/
│   ├── index.ts                  # Entry point
│   ├── app.ts                    # Express app setup
│   │
│   ├── config/
│   │   ├── index.ts              # Config loader
│   │   ├── database.ts           # DB config
│   │   └── constants.ts          # App constants
│   │
│   ├── routes/
│   │   ├── index.ts              # Route aggregator
│   │   ├── config.routes.ts
│   │   ├── game.routes.ts
│   │   ├── player.routes.ts
│   │   ├── voucher.routes.ts
│   │   ├── campaign.routes.ts
│   │   ├── reward.routes.ts
│   │   ├── asset.routes.ts
│   │   ├── auth.routes.ts
│   │   └── stats.routes.ts
│   │
│   ├── controllers/
│   │   ├── config.controller.ts
│   │   ├── game.controller.ts
│   │   ├── player.controller.ts
│   │   ├── voucher.controller.ts
│   │   ├── campaign.controller.ts
│   │   ├── reward.controller.ts
│   │   ├── asset.controller.ts
│   │   ├── auth.controller.ts
│   │   └── stats.controller.ts
│   │
│   ├── services/
│   │   ├── config.service.ts
│   │   ├── game.service.ts
│   │   ├── player.service.ts
│   │   ├── voucher.service.ts
│   │   ├── campaign.service.ts
│   │   ├── reward.service.ts
│   │   └── stats.service.ts
│   │
│   ├── engines/
│   │   ├── GameEngine.ts         # Core game logic
│   │   ├── RandomEngine.ts       # Weighted random
│   │   ├── VoucherGenerator.ts   # Generate voucher codes
│   │   └── QRGenerator.ts        # Generate QR codes
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT verification
│   │   ├── player.middleware.ts  # Player token verification
│   │   ├── rateLimit.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── validators/
│   │   ├── config.validator.ts
│   │   ├── player.validator.ts
│   │   ├── game.validator.ts
│   │   └── voucher.validator.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.types.ts
│   │   ├── game.types.ts
│   │   └── database.types.ts
│   │
│   └── utils/
│       ├── response.ts           # Response helpers
│       ├── logger.ts             # Winston logger
│       ├── crypto.ts             # Hash, encrypt
│       └── helpers.ts            # Misc helpers
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── uploads/                      # Uploaded files
├── logs/                         # Log files
├── tests/                        # Test files
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 6.2 Core Services

### GameEngine - Logic chống gian lận

```typescript
// src/engines/GameEngine.ts

import { RandomEngine } from './RandomEngine';
import { VoucherGenerator } from './VoucherGenerator';
import { prisma } from '../config/database';

export class GameEngine {
  private randomEngine: RandomEngine;
  private voucherGenerator: VoucherGenerator;

  constructor() {
    this.randomEngine = new RandomEngine();
    this.voucherGenerator = new VoucherGenerator();
  }

  async play(playerId: number, campaignId: number, gameType: string) {
    // 1. Validate player eligibility
    const eligibility = await this.checkEligibility(playerId, campaignId);
    if (!eligibility.canPlay) {
      throw new Error(eligibility.reason);
    }

    // 2. Get active rewards with remaining quantity
    const rewards = await this.getAvailableRewards(campaignId);
    
    // 3. Random result (server-side, anti-cheat)
    const selectedReward = this.randomEngine.weightedRandom(rewards);
    
    // 4. Generate voucher if won
    let voucher = null;
    if (selectedReward && selectedReward.name !== 'Mất lượt') {
      voucher = await this.createVoucher(playerId, selectedReward, campaignId);
      
      // Decrease remaining quantity
      await this.decreaseRewardQuantity(selectedReward.id);
    }

    // 5. Log play
    await this.logPlay(playerId, campaignId, gameType, selectedReward);

    // 6. Update player stats
    await this.updatePlayerStats(playerId, !!selectedReward);

    return {
      isWin: !!selectedReward && selectedReward.name !== 'Mất lượt',
      reward: selectedReward,
      voucher
    };
  }

  private async checkEligibility(playerId: number, campaignId: number) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign || !campaign.isActive) {
      return { canPlay: false, reason: 'CAMPAIGN_NOT_ACTIVE' };
    }

    const now = new Date();
    if (now < campaign.startDate || now > campaign.endDate) {
      return { canPlay: false, reason: 'CAMPAIGN_NOT_IN_PERIOD' };
    }

    // Check play count
    const playCount = await prisma.playLog.count({
      where: {
        playerId,
        campaignId,
        playedAt: {
          gte: new Date(now.setHours(0, 0, 0, 0))
        }
      }
    });

    if (playCount >= campaign.maxPlaysPerPhone) {
      return { canPlay: false, reason: 'NO_PLAYS_LEFT' };
    }

    return { canPlay: true, remainingPlays: campaign.maxPlaysPerPhone - playCount };
  }

  private async getAvailableRewards(campaignId: number) {
    return prisma.reward.findMany({
      where: {
        campaignId,
        isActive: true,
        OR: [
          { totalQuantity: null },  // Unlimited
          { remainingQty: { gt: 0 } }
        ]
      }
    });
  }
}
```

### RandomEngine - Weighted Random

```typescript
// src/engines/RandomEngine.ts

export class RandomEngine {
  /**
   * Weighted random selection
   * Input: rewards with probability field
   * Output: selected reward or null
   */
  weightedRandom(rewards: Array<{ id: number; name: string; probability: number }>) {
    // Calculate total probability
    const total = rewards.reduce((sum, r) => sum + r.probability, 0);
    
    if (total === 0) return null;
    
    // Generate random number
    const random = Math.random() * total;
    
    // Find selected reward
    let cumulative = 0;
    for (const reward of rewards) {
      cumulative += reward.probability;
      if (random <= cumulative) {
        return reward;
      }
    }
    
    return rewards[rewards.length - 1];
  }
}
```

### VoucherGenerator

```typescript
// src/engines/VoucherGenerator.ts

import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

export class VoucherGenerator {
  /**
   * Generate unique voucher code
   * Format: ABC123XY (8 characters)
   */
  generateCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate QR code for voucher
   * Returns base64 data URL
   */
  async generateQR(voucherCode: string, baseUrl: string): Promise<string> {
    const url = `${baseUrl}/voucher/${voucherCode}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  }

  /**
   * Calculate expiry date based on campaign
   */
  calculateExpiry(campaignEndDate: Date, daysValid: number = 7): Date {
    const expiryFromNow = new Date();
    expiryFromNow.setDate(expiryFromNow.getDate() + daysValid);
    
    // Return earlier date
    return expiryFromNow < campaignEndDate ? expiryFromNow : campaignEndDate;
  }
}
```

## 6.3 Middleware

### Rate Limiting

```typescript
// src/middlewares/rateLimit.middleware.ts

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Quá nhiều request, vui lòng thử lại sau'
    }
  }
});

// Play game rate limit (stricter)
export const playLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 plays per minute max
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Bạn đang chơi quá nhanh, vui lòng chờ một chút'
    }
  },
  keyGenerator: (req: Request) => {
    // Use player ID or IP
    return req.body.playerId?.toString() || req.ip;
  }
});
```

### Authentication

```typescript
// src/middlewares/auth.middleware.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  admin?: {
    id: number;
    username: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.id }
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tài khoản không tồn tại' }
      });
    }

    req.admin = {
      id: admin.id,
      username: admin.username,
      role: admin.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token hết hạn' }
    });
  }
};

// Role-based authorization
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Không có quyền truy cập' }
      });
    }
    next();
  };
};
```

---

# 7. BẢO MẬT & PERFORMANCE

## 7.1 Security Checklist

### Backend Security

| Aspect | Implementation |
|--------|----------------|
| **Authentication** | JWT tokens với expiry |
| **Password** | bcrypt hash với salt rounds = 12 |
| **Input Validation** | Joi/Zod schema validation |
| **SQL Injection** | Prisma ORM (parameterized queries) |
| **XSS** | helmet middleware, sanitize inputs |
| **CORS** | Whitelist allowed origins |
| **Rate Limiting** | express-rate-limit |
| **Anti-Cheat** | Server-side random, không trust client |
| **File Upload** | Validate MIME type, limit size |
| **HTTPS** | Bắt buộc trên production |

### Frontend Security

| Aspect | Implementation |
|--------|----------------|
| **Token Storage** | httpOnly cookies hoặc secure localStorage |
| **CSRF** | SameSite cookies |
| **Content Security Policy** | CSP headers |
| **Sensitive Data** | Không hiển thị full phone number |

## 7.2 Performance Optimization

### Backend

```typescript
// Caching config (thay đổi ít)
import NodeCache from 'node-cache';

const configCache = new NodeCache({ 
  stdTTL: 300,  // 5 minutes
  checkperiod: 60 
});

// Trong ConfigService
async getConfig() {
  const cached = configCache.get('store_config');
  if (cached) return cached;
  
  const config = await prisma.storeConfig.findFirst();
  configCache.set('store_config', config);
  return config;
}
```

### Frontend

| Technique | Description |
|-----------|-------------|
| **Image Optimization** | next/image với lazy loading |
| **Code Splitting** | Dynamic imports cho games |
| **Caching** | SWR/React Query với stale-while-revalidate |
| **Bundle Size** | Tree shaking, analyze với webpack-bundle-analyzer |
| **Fonts** | next/font với font-display: swap |

## 7.3 Logging & Monitoring

```typescript
// src/utils/logger.ts

import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

# 8. DEPLOYMENT

## 8.1 Docker Setup

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist
COPY uploads ./uploads

ENV NODE_ENV production

EXPOSE 4000

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api
    restart: unless-stopped

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=file:./data/minigame.db
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api
    restart: unless-stopped

volumes:
  data:
  uploads:
```

### Nginx Config

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream api {
        server api:4000;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API
        location /api {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Static uploads
        location /uploads {
            alias /app/uploads;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 8.2 Package Structure (Giao cho khách)

```
minigame-package/
├── docker-compose.yml
├── .env.example
├── frontend/
│   ├── Dockerfile
│   └── (source code)
├── backend/
│   ├── Dockerfile
│   └── (source code)
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── data/
│   └── .gitkeep
├── uploads/
│   └── .gitkeep
├── scripts/
│   ├── setup.sh
│   ├── backup.sh
│   └── restore.sh
├── docs/
│   ├── README.pdf
│   ├── HUONG_DAN_CAI_DAT.pdf
│   ├── HUONG_DAN_SU_DUNG.pdf
│   └── video/
│       └── huong_dan.mp4
└── LICENSE
```

---

# 9. CẤU TRÚC PROJECT

## 9.1 Monorepo Structure

```
Web_MiniGame/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── packages/
│   ├── frontend/                 # Next.js app
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   └── backend/                  # Express API
│       ├── src/
│       ├── prisma/
│       ├── uploads/
│       ├── logs/
│       ├── package.json
│       ├── tsconfig.json
│       └── Dockerfile
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── nginx/
│       └── nginx.conf
│
├── docs/
│   ├── SYSTEM_DESIGN.md          # This document
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT.md
│   └── USER_GUIDE.md
│
├── scripts/
│   ├── setup.ps1                 # Windows setup
│   ├── setup.sh                  # Linux/Mac setup
│   └── seed-db.ts
│
├── .gitignore
├── .env.example
├── package.json                  # Root package (workspaces)
├── README.md
└── LICENSE
```

## 9.2 Development Workflow

```bash
# 1. Clone & Install
git clone <repo>
cd Web_MiniGame
npm install

# 2. Setup database
cd packages/backend
npx prisma migrate dev
npx prisma db seed

# 3. Start development
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev

# 4. Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
# Admin:    http://localhost:3000/admin
```

## 9.3 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

---

# 📋 CHECKLIST IMPLEMENTATION

## Phase 1: Foundation (Week 1)
- [ ] Setup monorepo structure
- [ ] Initialize Next.js frontend
- [ ] Initialize Express backend
- [ ] Setup Prisma + SQLite
- [ ] Create database schema
- [ ] Seed initial data

## Phase 2: Core APIs (Week 2)
- [ ] Config API
- [ ] Player registration API
- [ ] Game play API
- [ ] Voucher API
- [ ] Auth API

## Phase 3: Frontend Landing (Week 3)
- [ ] Landing page layout
- [ ] Phone registration form
- [ ] Wheel game component
- [ ] Voucher modal
- [ ] QR code display

## Phase 4: Other Games (Week 4)
- [ ] Shake game
- [ ] Memory game
- [ ] Tap game (2 variants)

## Phase 5: Admin Panel (Week 5)
- [ ] Admin login
- [ ] Dashboard
- [ ] Config management
- [ ] Campaign management
- [ ] Reward management
- [ ] Voucher management
- [ ] QR Scanner

## Phase 6: Polish & Deploy (Week 6)
- [ ] Testing
- [ ] Performance optimization
- [ ] Docker setup
- [ ] Documentation
- [ ] Package for delivery

---

**Document Version:** 1.0  
**Author:** System Architect  
**Last Updated:** 04/02/2026
