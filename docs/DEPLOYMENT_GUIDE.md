# 🚀 HƯỚNG DẪN DEPLOY DEMO - FREE TIER ARCHITECTURE

> **Kiến trúc triển khai hoàn toàn miễn phí cho demo/MVP**
>
> - **Database**: Supabase (PostgreSQL miễn phí)
> - **Backend**: Render.com (Free Node.js hosting)
> - **Frontend**: Vercel (Free Next.js hosting)

---

## 📋 MỤC LỤC

1. [Chuẩn bị Database (Supabase)](#bước-1-chuẩn-bị-database-supabase)
2. [Deploy Backend (Render.com)](#bước-2-deploy-backend-rendercom)
3. [Deploy Frontend (Vercel)](#bước-3-deploy-frontend-vercel)
4. [Cấu hình CORS](#bước-4-cấu-hình-cors)
5. [Test hệ thống](#bước-5-test-hệ-thống)
6. [Tối ưu Free Tier](#bước-6-tối-ưu-free-tier)
7. [Troubleshooting](#troubleshooting)

---

## 📋 BƯỚC 1: CHUẨN BỊ DATABASE (SUPABASE)

### 1.1. Tạo Project Supabase

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng ký/đăng nhập → Click **New Project**
3. Điền thông tin:
   - **Name**: `minigame-demo`
   - **Database Password**: Tạo password mạnh (lưu lại!)
   - **Region**: Singapore (gần VN nhất)
   - **Pricing Plan**: Free
4. Click **Create new project**
5. Chờ ~2 phút để project khởi tạo

### 1.2. Lấy Database Connection String

1. Vào project vừa tạo
2. Click **Settings** (icon bánh răng) → **Database**
3. Scroll xuống mục **Connection string**
4. Tab **URI** → Copy URL:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
5. Thay `[YOUR-PASSWORD]` bằng password bạn vừa tạo ở bước 1.1

### 1.3. Cấu hình Backend cho PostgreSQL

**Bước 1: Cài thêm PostgreSQL Prisma adapter**

```bash
cd packages/backend
npm install @prisma/client@latest
```

**Bước 2: Sửa file `.env`**

```env
# Database - Thay bằng connection string từ Supabase
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"

# JWT Secret - ĐỔI MỚI cho production!
JWT_SECRET="change-this-to-random-string-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
NODE_ENV="production"

# Admin mặc định (dùng cho seed)
ADMIN_EMAIL="admin@minigame.com"
ADMIN_PASSWORD="Admin@12345"
```

**Bước 3: Cập nhật Prisma schema**

Mở `packages/backend/prisma/schema.prisma`, sửa provider:

```prisma
datasource db {
  provider = "postgresql"  // Đổi từ "sqlite" sang "postgresql"
  url      = env("DATABASE_URL")
}
```

**Bước 4: Generate Prisma Client mới**

```bash
npx prisma generate
```

### 1.4. Chạy Migration lên Supabase

```bash
# Push schema lên Supabase
npx prisma db push

# Seed dữ liệu mẫu (admin user, campaign, rewards)
npm run seed
```

**✅ Kiểm tra:**
- Vào Supabase Dashboard → **Table Editor**
- Phải thấy các bảng: `AdminUser`, `StoreConfig`, `Campaign`, `Reward`, `Player`, `Voucher`, `PlayLog`, `GameAsset`

---

## 📋 BƯỚC 2: DEPLOY BACKEND (RENDER.COM)

### 2.1. Chuẩn bị Git Repository

```bash
# Tại thư mục gốc project (Web_Minigame)
git init
git add .
git commit -m "Initial commit for deployment"

# Tạo repo trên GitHub (github.com/new)
# Sau đó push:
git remote add origin https://github.com/YOUR_USERNAME/minigame-demo.git
git branch -M main
git push -u origin main
```

> **Lưu ý**: Tạo file `.gitignore` nếu chưa có:

```gitignore
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
*.db
*.db-journal
uploads/
```

### 2.2. Tạo Web Service trên Render

1. Truy cập [https://render.com](https://render.com)
2. Đăng ký/đăng nhập → Click **New** → **Web Service**
3. Chọn **Connect** với GitHub repository `minigame-demo`
4. Cấu hình service:

| Field | Value |
|-------|-------|
| **Name** | `minigame-backend` |
| **Region** | Singapore |
| **Root Directory** | `packages/backend` |
| **Environment** | Node |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

5. Click **Advanced** → Scroll xuống

### 2.3. Thêm Environment Variables

Trong phần **Environment Variables**, thêm:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=4000
ADMIN_EMAIL=admin@minigame.com
ADMIN_PASSWORD=Admin@12345
```

> **⚠️ Quan trọng**: Thay `DATABASE_URL` và `JWT_SECRET` bằng giá trị thật!

### 2.4. Deploy Backend

1. Click **Create Web Service**
2. Chờ ~5-10 phút để Render build + deploy
3. Theo dõi logs trong Dashboard
4. Khi thấy "✓ Deployed", lấy URL: `https://minigame-backend.onrender.com`

**✅ Test API Backend:**

```bash
# Test health check
curl https://minigame-backend.onrender.com/api/config

# Phải trả về JSON config cửa hàng
```

---

## 📋 BƯỚC 3: DEPLOY FRONTEND (VERCEL)

### 3.1. Cấu hình Frontend

**Tạo file `packages/frontend/.env.production`:**

```env
NEXT_PUBLIC_API_URL=https://minigame-backend.onrender.com/api
```

**Commit thay đổi:**

```bash
git add packages/frontend/.env.production
git commit -m "Add production environment config"
git push
```

### 3.2. Tạo Project trên Vercel

1. Truy cập [https://vercel.com](https://vercel.com)
2. Đăng ký/đăng nhập → Click **Add New** → **Project**
3. Click **Import** GitHub repository `minigame-demo`
4. Cấu hình project:

| Field | Value |
|-------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `packages/frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

### 3.3. Thêm Environment Variables

Trong **Environment Variables**, thêm:

```
NEXT_PUBLIC_API_URL=https://minigame-backend.onrender.com/api
```

> **Lưu ý**: Phải có prefix `NEXT_PUBLIC_` để Next.js expose biến ra client-side!

### 3.4. Deploy Frontend

1. Click **Deploy**
2. Chờ ~3-5 phút để Vercel build + deploy
3. Khi xong, lấy URL: `https://minigame-demo.vercel.app`

**✅ Test Frontend:**
- Mở trình duyệt: `https://minigame-demo.vercel.app`
- Trang landing page phải load được

---

## 📋 BƯỚC 4: CẤU HÌNH CORS

### 4.1. Whitelist Frontend URL trong Backend

Mở file `packages/backend/src/app.ts`, tìm phần CORS config:

```typescript
// Before
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);

// After - Thêm Vercel URL
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://minigame-demo.vercel.app', // ← Thêm domain Vercel
    ],
    credentials: true,
  })
);
```

### 4.2. Redeploy Backend

```bash
git add packages/backend/src/app.ts
git commit -m "Add Vercel domain to CORS whitelist"
git push
```

Render sẽ tự động phát hiện commit mới và redeploy (~3 phút).

---

## 📋 BƯỚC 5: TEST HỆ THỐNG

### 5.1. Test Player Flow (User-facing)

1. Mở `https://minigame-demo.vercel.app`
2. Nhập số điện thoại (VD: `0909123456`) + tên
3. Click **Bắt đầu chơi**
4. Chơi game → Quay vòng quay
5. Nhận voucher (nếu trúng thưởng)
6. Xem voucher trong modal

### 5.2. Test Admin Panel

1. Truy cập `https://minigame-demo.vercel.app/admin/login`
2. Đăng nhập:
   - **Email**: `admin@minigame.com`
   - **Password**: `Admin@12345`
3. Test các trang:
   - ✅ Dashboard: Xem thống kê tổng quan
   - ✅ Cấu hình: Upload logo, banner, đổi màu
   - ✅ Chiến dịch: CRUD campaigns
   - ✅ Phần thưởng: CRUD rewards, check tỉ lệ
   - ✅ Voucher: Xem danh sách, filter, cancel
   - ✅ Người chơi: Xem danh sách, detail
   - ✅ Quét QR: Scan voucher QR code
   - ✅ Thống kê: Xem charts

### 5.3. Test API trực tiếp (Backend)

```bash
# 1. Get public config
curl https://minigame-backend.onrender.com/api/config

# 2. Admin login
curl -X POST https://minigame-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@12345"
  }'

# 3. Register player
curl -X POST https://minigame-backend.onrender.com/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0909123456",
    "name": "Nguyen Van A"
  }'
```

---

## 📋 BƯỚC 6: TỐI ỨU FREE TIER

### 6.1. Render Free Tier Limitations

| Hạn chế | Giải pháp |
|---------|-----------|
| ⚠️ **Auto-sleep sau 15 phút không dùng** → Cold start ~30s | Dùng UptimeRobot ping mỗi 5 phút |
| ⚠️ **750 giờ/tháng** = 31 ngày × 24h | Đủ cho 1 instance chạy 24/7 |
| ⚠️ **512MB RAM** | Đủ cho Node.js app nhỏ |

**Giải pháp Keep-Alive (UptimeRobot):**

1. Đăng ký [https://uptimerobot.com](https://uptimerobot.com) (miễn phí)
2. Dashboard → **Add New Monitor**
3. Cấu hình:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Minigame Backend`
   - **URL**: `https://minigame-backend.onrender.com/api/config`
   - **Monitoring Interval**: 5 minutes
4. Click **Create Monitor**

→ Backend sẽ được ping mỗi 5 phút, tránh sleep mode.

### 6.2. Supabase Free Tier

| Resource | Limit | Đủ cho |
|----------|-------|--------|
| Database | 500MB | ~5,000 players + 50,000 plays |
| Storage | 1GB | ~10,000 ảnh rewards/assets |
| Bandwidth | 2GB/tháng | ~50,000 requests |

**Tips tối ưu:**
- Nén ảnh trước khi upload (dùng TinyPNG)
- Dùng cache SWR ở frontend để giảm API calls
- Xoá dữ liệu test/demo định kỳ

### 6.3. Vercel Free Tier

| Resource | Limit |
|----------|-------|
| Bandwidth | 100GB/tháng |
| Build time | 6,000 phút/tháng |
| Serverless Functions | 100GB-Hrs |

→ Quá đủ cho demo, không cần lo.

---

## 🐛 TROUBLESHOOTING

### ❌ Lỗi: Backend trả về 503 Service Unavailable

**Nguyên nhân**: Render đang cold start (ngủ quá 15 phút).

**Giải pháp**: 
1. Chờ 30 giây - 1 phút để backend khởi động
2. Setup UptimeRobot như hướng dẫn ở 6.1

---

### ❌ Lỗi: CORS policy blocked

**Nguyên nhân**: Backend chưa whitelist domain Vercel.

**Giải pháp**:
1. Kiểm tra `packages/backend/src/app.ts`:
   ```typescript
   origin: [
     'http://localhost:3000',
     'https://minigame-demo.vercel.app', // ← Phải có dòng này
   ]
   ```
2. Commit + push → Render sẽ tự redeploy

---

### ❌ Lỗi: Prisma - Can't reach database server

**Nguyên nhân**: `DATABASE_URL` sai hoặc Supabase chặn IP.

**Giải pháp**:
1. Kiểm tra `DATABASE_URL` trong Render environment variables
2. Vào Supabase → Settings → Database → **Connection pooling**
3. Copy lại URI mới, paste vào Render
4. Restart Render service

---

### ❌ Lỗi: Frontend không kết nối được API

**Nguyên nhân**: Biến môi trường `NEXT_PUBLIC_API_URL` chưa đúng.

**Giải pháp**:
1. Vào Vercel project → Settings → Environment Variables
2. Kiểm tra `NEXT_PUBLIC_API_URL` = `https://minigame-backend.onrender.com/api`
3. Redeploy: Deployments → Latest → **Redeploy**

---

### ❌ Lỗi: Admin login 401 Unauthorized

**Nguyên nhân**: Database chưa seed admin user.

**Giải pháp**:
```bash
# Local: Connect DB rồi seed lại
cd packages/backend
npx prisma db push
npm run seed
```

Hoặc vào Supabase → SQL Editor, chạy:
```sql
INSERT INTO "AdminUser" (username, email, "passwordHash", "displayName", role)
VALUES (
  'admin',
  'admin@minigame.com',
  '$2b$10$hashed_password_here', -- Dùng bcrypt hash
  'Administrator',
  'admin'
);
```

---

### ❌ Lỗi: Image upload failed (413 Payload Too Large)

**Nguyên nhân**: File quá lớn (>5MB).

**Giải pháp**:
1. Nén ảnh trước khi upload (TinyPNG)
2. Hoặc tăng limit trong `packages/backend/src/middlewares/upload.middleware.ts`:
   ```typescript
   limits: {
     fileSize: 10 * 1024 * 1024, // 10MB
   }
   ```

---

## 📊 GIÁM SÁT & BẢO TRÌ

### Logs & Monitoring

**Render Logs:**
- Dashboard → Service → **Logs** tab
- Xem real-time logs, filter by keyword

**Supabase Logs:**
- Dashboard → **Logs** → Query logs, Error logs

**Vercel Logs:**
- Project → **Deployments** → Click deployment → **Function Logs**

### Database Backup

**Supabase tự backup hàng ngày** (Free tier giữ 7 ngày gần nhất).

**Manual backup:**
```bash
# Export SQL dump
pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" > backup.sql

# Restore
psql "postgresql://..." < backup.sql
```

---

## 🎉 HOÀN THÀNH!

**🌐 URLs triển khai:**
- **Frontend**: `https://minigame-demo.vercel.app`
- **Backend API**: `https://minigame-backend.onrender.com/api`
- **Admin Panel**: `https://minigame-demo.vercel.app/admin`

**🔑 Admin Account:**
- **Email**: `admin@minigame.com`
- **Password**: `Admin@12345`

**📦 Resources:**
- Database: Supabase (Singapore)
- Backend: Render.com (Singapore)
- Frontend: Vercel (Global CDN)

**💰 Chi phí:**
- **$0/tháng** cho demo/MVP
- Upgrade khi cần: Render $7/tháng, Supabase $25/tháng

---

## 📚 THAM KHẢO

- [Supabase Documentation](https://supabase.com/docs)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

---

**📝 Cập nhật lần cuối**: 10/02/2026
