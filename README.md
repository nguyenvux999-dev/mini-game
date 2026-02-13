# 🎮 Web Minigame Platform

Hệ thống web minigame khuyến mãi cho quán ăn/cafe - Giải pháp marketing tương tác, tăng khách hàng quay lại.

## 📋 Tổng quan

Web Minigame Platform là giải pháp B2B đóng gói hoàn chỉnh, giúp các quán ăn/cafe tạo chương trình khuyến mãi tương tác thông qua minigame. Khách hàng chơi game để nhận voucher giảm giá và đổi quà tại quán.

### ✨ Tính năng chính

#### 👥 Phía khách hàng (End-user)
- 📱 Nhập số điện thoại để chơi game
- 🎯 4 loại minigame: Vòng quay may mắn, Lắc xì, Lật hình, Tap-tap
- 🎁 Nhận voucher ngay với QR code
- 💳 Đổi quà tại quán bằng cách quét QR

#### 🔧 Phía Admin
- 🎨 Quản lý thương hiệu (logo, banner, thông tin)
- 🎮 Cấu hình game và giao diện
- 🎁 Quản lý phần thưởng (tỉ lệ trúng, số lượng, thời hạn)
- 📅 Tạo chiến dịch khuyến mãi
- 📊 Thống kê chi tiết (lượt chơi, voucher phát hành/đã dùng)
- ✅ Xác nhận và trừ voucher khi khách đổi quà

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: SWR, Axios
- **Form Handling**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Charts**: Recharts
- **QR Code**: html5-qrcode, qrcode.react

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: JWT + Bcrypt
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit
- **File Upload**: Multer
- **QR Generation**: qrcode
- **Logging**: Winston + Morgan
- **Security**: Helmet, HPP, CORS

### DevOps
- **Containerization**: Docker + Docker Compose
- **Process Manager**: Nodemon (dev)
- **Reverse Proxy**: Nginx (production)

## 📁 Cấu trúc Project

```
Web_Minigame/
├── packages/
│   ├── backend/              # Backend API
│   │   ├── prisma/           # Database schema & migrations
│   │   ├── src/
│   │   │   ├── config/       # Configuration files
│   │   │   ├── controllers/  # Route controllers
│   │   │   ├── engines/      # Game engines & generators
│   │   │   ├── middlewares/  # Express middlewares
│   │   │   ├── routes/       # API routes
│   │   │   ├── services/     # Business logic
│   │   │   ├── validators/   # Request validators
│   │   │   └── utils/        # Utilities
│   │   └── uploads/          # Static file uploads
│   │
│   └── frontend/             # Frontend Next.js app
│       └── src/
│           ├── app/          # Next.js App Router
│           ├── components/   # React components
│           ├── hooks/        # Custom hooks
│           ├── lib/          # Libraries & utilities
│           ├── stores/       # Zustand stores
│           └── types/        # TypeScript types
│
└── docs/                     # Documentation
    ├── API_REFERENCE.md
    ├── DEPLOYMENT_GUIDE.md
    ├── SECURITY_IMPLEMENTATION.md
    └── SYSTEM_DESIGN.md
```

## 🚀 Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js >= 18.x
- npm hoặc yarn
- PostgreSQL (cho production)

### 1. Clone repository

```bash
git clone https://github.com/nguyenvux999-dev/mini-game.git
cd mini-game
```

### 2. Cài đặt Backend

```bash
cd packages/backend
npm install

# Setup environment variables
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Chạy development server
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3001`

### 3. Cài đặt Frontend

```bash
cd packages/frontend
npm install

# Setup environment variables
cp .env.example .env.local
# Chỉnh sửa .env.local với API URL

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 🐳 Chạy với Docker

```bash
# Build và start tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📝 Scripts hữu ích

### Backend
```bash
npm run dev           # Chạy development server
npm run build         # Build production
npm run start         # Chạy production server
npm run db:studio     # Mở Prisma Studio
npm run db:migrate    # Chạy migrations
npm run db:seed       # Seed database
npm run db:reset      # Reset database
```

### Frontend
```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run start        # Chạy production server
npm run lint         # Lint code
```

## 🔒 Bảo mật

Hệ thống được tích hợp đầy đủ các biện pháp bảo mật:
- ✅ JWT Authentication
- ✅ Bcrypt password hashing
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ HPP protection
- ✅ Input validation với Zod
- ✅ SQL injection prevention (Prisma)

Chi tiết: [SECURITY_IMPLEMENTATION.md](docs/SECURITY_IMPLEMENTATION.md)

## 📚 Documentation

- [System Design](docs/SYSTEM_DESIGN.md) - Thiết kế hệ thống tổng quan
- [API Reference](docs/API_REFERENCE.md) - Tài liệu API đầy đủ
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Hướng dẫn deployment
- [Security Implementation](docs/SECURITY_IMPLEMENTATION.md) - Chi tiết bảo mật
- [Rate Limiting](docs/RATE_LIMITING.md) - Cấu hình rate limiting

## 🎮 Game Types

1. **Vòng quay may mắn** - Spin wheel game
2. **Lắc xì** - Dice rolling game
3. **Lật hình** - Card flip game
4. **Tap-tap** - Quick tap game

Mỗi game có thể tùy chỉnh:
- Giao diện (màu sắc, hình ảnh)
- Phần thưởng và tỉ lệ trúng
- Giới hạn số lần chơi
- Điều kiện tham gia

## 🌟 Tính năng nổi bật

- ⚡ **Hiệu suất cao** - Cache thông minh, tối ưu query
- 🎨 **Tùy biến linh hoạt** - Admin có thể customize mọi thứ
- 📊 **Thống kê chi tiết** - Real-time analytics
- 📱 **Responsive** - Hoạt động tốt trên mọi thiết bị
- 🔐 **Bảo mật tốt** - Tuân thủ best practices
- 🚀 **Dễ deploy** - Docker support, cấu hình đơn giản

## 🤝 Contributing

Chúng tôi chào đón mọi đóng góp! Vui lòng:
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành dưới [MIT License](LICENSE).

## 👨‍💻 Author

**Nguyen Vu**
- GitHub: [@nguyenvux999-dev](https://github.com/nguyenvux999-dev)

## 📞 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue trên GitHub.

---

⭐ Nếu project này hữu ích, hãy cho một star nhé!
