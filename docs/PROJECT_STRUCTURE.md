# 📁 CẤU TRÚC PROJECT CHI TIẾT

## Tổng quan Monorepo

```
Web_MiniGame/
│
├── 📁 packages/
│   ├── 📁 frontend/          # Next.js 14 Application
│   └── 📁 backend/           # Express.js API Server
│
├── 📁 docker/                # Docker configurations
├── 📁 docs/                  # Documentation
├── 📁 scripts/               # Utility scripts
│
├── 📄 package.json           # Root workspace config
├── 📄 .env.example           # Environment template
├── 📄 .gitignore
└── 📄 README.md
```

---

## 📁 FRONTEND (Next.js 14)

```
packages/frontend/
│
├── 📁 src/
│   │
│   ├── 📁 app/                           # Next.js App Router
│   │   ├── 📄 layout.tsx                 # Root layout
│   │   ├── 📄 page.tsx                   # Landing page (/)
│   │   ├── 📄 loading.tsx                # Loading UI
│   │   ├── 📄 error.tsx                  # Error UI
│   │   ├── 📄 not-found.tsx              # 404 page
│   │   │
│   │   ├── 📁 (game)/                    # Game group routes
│   │   │   └── 📄 page.tsx               # Game page
│   │   │
│   │   ├── 📁 voucher/
│   │   │   └── 📁 [code]/
│   │   │       └── 📄 page.tsx           # Voucher detail page
│   │   │
│   │   └── 📁 admin/                     # Admin panel
│   │       ├── 📄 layout.tsx             # Admin layout
│   │       ├── 📄 page.tsx               # Dashboard
│   │       │
│   │       ├── 📁 login/
│   │       │   └── 📄 page.tsx           # Admin login
│   │       │
│   │       ├── 📁 config/
│   │       │   └── 📄 page.tsx           # Store configuration
│   │       │
│   │       ├── 📁 campaigns/
│   │       │   ├── 📄 page.tsx           # Campaign list
│   │       │   ├── 📁 new/
│   │       │   │   └── 📄 page.tsx       # Create campaign
│   │       │   └── 📁 [id]/
│   │       │       ├── 📄 page.tsx       # Edit campaign
│   │       │       └── 📁 rewards/
│   │       │           └── 📄 page.tsx   # Manage rewards
│   │       │
│   │       ├── 📁 vouchers/
│   │       │   └── 📄 page.tsx           # Voucher management
│   │       │
│   │       ├── 📁 scan/
│   │       │   └── 📄 page.tsx           # QR Scanner
│   │       │
│   │       ├── 📁 players/
│   │       │   └── 📄 page.tsx           # Player list
│   │       │
│   │       └── 📁 stats/
│   │           └── 📄 page.tsx           # Statistics
│   │
│   ├── 📁 components/
│   │   │
│   │   ├── 📁 common/                    # Shared components
│   │   │   ├── 📄 Button.tsx
│   │   │   ├── 📄 Input.tsx
│   │   │   ├── 📄 Modal.tsx
│   │   │   ├── 📄 Loading.tsx
│   │   │   ├── 📄 Toast.tsx
│   │   │   ├── 📄 Card.tsx
│   │   │   └── 📄 index.ts
│   │   │
│   │   ├── 📁 layout/                    # Layout components
│   │   │   ├── 📄 Header.tsx
│   │   │   ├── 📄 Footer.tsx
│   │   │   ├── 📄 Container.tsx
│   │   │   └── 📄 index.ts
│   │   │
│   │   ├── 📁 landing/                   # Landing page components
│   │   │   ├── 📄 BrandHeader.tsx
│   │   │   ├── 📄 PromoBanner.tsx
│   │   │   ├── 📄 PhoneForm.tsx
│   │   │   ├── 📄 RewardList.tsx
│   │   │   ├── 📄 FooterContact.tsx
│   │   │   ├── 📄 CampaignInfo.tsx
│   │   │   └── 📄 index.ts
│   │   │
│   │   ├── 📁 games/                     # Game components
│   │   │   │
│   │   │   ├── 📄 GameRenderer.tsx       # Main game container
│   │   │   ├── 📄 GameResult.tsx         # Result display
│   │   │   ├── 📄 PlayButton.tsx
│   │   │   │
│   │   │   ├── 📁 wheel/                 # Wheel game
│   │   │   │   ├── 📄 WheelGame.tsx
│   │   │   │   ├── 📄 WheelCanvas.tsx
│   │   │   │   ├── 📄 WheelPointer.tsx
│   │   │   │   ├── 📄 useWheelAnimation.ts
│   │   │   │   └── 📄 index.ts
│   │   │   │
│   │   │   ├── 📁 shake/                 # Shake game
│   │   │   │   ├── 📄 ShakeGame.tsx
│   │   │   │   ├── 📄 FallingObjects.tsx
│   │   │   │   ├── 📄 ShakeButton.tsx
│   │   │   │   ├── 📄 useShakeDetect.ts
│   │   │   │   └── 📄 index.ts
│   │   │   │
│   │   │   ├── 📁 memory/                # Memory game
│   │   │   │   ├── 📄 MemoryGame.tsx
│   │   │   │   ├── 📄 CardGrid.tsx
│   │   │   │   ├── 📄 MemoryCard.tsx
│   │   │   │   ├── 📄 Timer.tsx
│   │   │   │   ├── 📄 useMemoryLogic.ts
│   │   │   │   └── 📄 index.ts
│   │   │   │
│   │   │   ├── 📁 tap/                   # Tap game
│   │   │   │   ├── 📄 TapGame.tsx
│   │   │   │   ├── 📄 CookingVariant.tsx
│   │   │   │   ├── 📄 EatingVariant.tsx
│   │   │   │   ├── 📄 ProgressBar.tsx
│   │   │   │   ├── 📄 TapCounter.tsx
│   │   │   │   ├── 📄 useTapLogic.ts
│   │   │   │   └── 📄 index.ts
│   │   │   │
│   │   │   └── 📄 index.ts
│   │   │
│   │   ├── 📁 voucher/                   # Voucher components
│   │   │   ├── 📄 VoucherModal.tsx
│   │   │   ├── 📄 VoucherCard.tsx
│   │   │   ├── 📄 VoucherDetail.tsx
│   │   │   ├── 📄 QRDisplay.tsx
│   │   │   ├── 📄 SaveVoucherButton.tsx
│   │   │   └── 📄 index.ts
│   │   │
│   │   └── 📁 admin/                     # Admin components
│   │       │
│   │       ├── 📁 layout/
│   │       │   ├── 📄 AdminSidebar.tsx
│   │       │   ├── 📄 AdminTopBar.tsx
│   │       │   ├── 📄 AdminLayout.tsx
│   │       │   └── 📄 index.ts
│   │       │
│   │       ├── 📁 dashboard/
│   │       │   ├── 📄 StatsCard.tsx
│   │       │   ├── 📄 PlayChart.tsx
│   │       │   ├── 📄 RecentVouchers.tsx
│   │       │   └── 📄 index.ts
│   │       │
│   │       ├── 📁 forms/
│   │       │   ├── 📄 StoreConfigForm.tsx
│   │       │   ├── 📄 CampaignForm.tsx
│   │       │   ├── 📄 RewardForm.tsx
│   │       │   ├── 📄 GameConfigForm.tsx
│   │       │   ├── 📄 WheelConfigForm.tsx
│   │       │   ├── 📄 ShakeConfigForm.tsx
│   │       │   ├── 📄 MemoryConfigForm.tsx
│   │       │   ├── 📄 TapConfigForm.tsx
│   │       │   └── 📄 index.ts
│   │       │
│   │       ├── 📁 tables/
│   │       │   ├── 📄 DataTable.tsx
│   │       │   ├── 📄 VoucherTable.tsx
│   │       │   ├── 📄 PlayerTable.tsx
│   │       │   ├── 📄 CampaignTable.tsx
│   │       │   └── 📄 index.ts
│   │       │
│   │       ├── 📁 scanner/
│   │       │   ├── 📄 QRScanner.tsx
│   │       │   ├── 📄 VoucherVerify.tsx
│   │       │   ├── 📄 RedeemConfirm.tsx
│   │       │   └── 📄 index.ts
│   │       │
│   │       ├── 📁 upload/
│   │       │   ├── 📄 FileUploader.tsx
│   │       │   ├── 📄 ImagePreview.tsx
│   │       │   └── 📄 index.ts
│   │       │
│   │       └── 📄 index.ts
│   │
│   ├── 📁 hooks/                         # Custom hooks
│   │   ├── 📄 useConfig.ts               # Fetch store config
│   │   ├── 📄 usePlayer.ts               # Player state management
│   │   ├── 📄 useGame.ts                 # Game logic
│   │   ├── 📄 useVoucher.ts              # Voucher operations
│   │   ├── 📄 useAuth.ts                 # Admin authentication
│   │   ├── 📄 useCampaign.ts             # Campaign operations
│   │   ├── 📄 useStats.ts                # Statistics
│   │   ├── 📄 useMediaQuery.ts           # Responsive
│   │   ├── 📄 useLocalStorage.ts         # Local storage
│   │   └── 📄 index.ts
│   │
│   ├── 📁 lib/                           # Libraries & utilities
│   │   ├── 📄 api.ts                     # Axios API client
│   │   ├── 📄 utils.ts                   # Helper functions
│   │   ├── 📄 constants.ts               # App constants
│   │   ├── 📄 validators.ts              # Form validations
│   │   └── 📄 cn.ts                      # classnames helper
│   │
│   ├── 📁 stores/                        # Zustand stores
│   │   ├── 📄 playerStore.ts
│   │   ├── 📄 gameStore.ts
│   │   ├── 📄 configStore.ts
│   │   └── 📄 authStore.ts
│   │
│   ├── 📁 types/                         # TypeScript types
│   │   ├── 📄 api.types.ts
│   │   ├── 📄 game.types.ts
│   │   ├── 📄 admin.types.ts
│   │   ├── 📄 voucher.types.ts
│   │   └── 📄 index.ts
│   │
│   └── 📁 styles/
│       └── 📄 globals.css                # Global styles + Tailwind
│
├── 📁 public/
│   ├── 📁 images/
│   │   ├── 📁 games/                     # Default game assets
│   │   │   ├── 📁 wheel/
│   │   │   ├── 📁 shake/
│   │   │   ├── 📁 memory/
│   │   │   └── 📁 tap/
│   │   └── 📁 icons/
│   ├── 📁 sounds/                        # Game sounds
│   ├── 📄 favicon.ico
│   └── 📄 manifest.json
│
├── 📄 package.json
├── 📄 next.config.js
├── 📄 tailwind.config.ts
├── 📄 tsconfig.json
├── 📄 postcss.config.js
├── 📄 .env.local
└── 📄 Dockerfile
```

---

## 📁 BACKEND (Express.js)

```
packages/backend/
│
├── 📁 src/
│   │
│   ├── 📄 index.ts                       # Entry point
│   ├── 📄 app.ts                         # Express app setup
│   │
│   ├── 📁 config/                        # Configuration
│   │   ├── 📄 index.ts                   # Config loader
│   │   ├── 📄 database.ts                # Prisma client
│   │   ├── 📄 constants.ts               # App constants
│   │   └── 📄 cors.ts                    # CORS config
│   │
│   ├── 📁 routes/                        # API Routes
│   │   ├── 📄 index.ts                   # Route aggregator
│   │   ├── 📄 config.routes.ts
│   │   ├── 📄 game.routes.ts
│   │   ├── 📄 player.routes.ts
│   │   ├── 📄 voucher.routes.ts
│   │   ├── 📄 campaign.routes.ts
│   │   ├── 📄 reward.routes.ts
│   │   ├── 📄 asset.routes.ts
│   │   ├── 📄 auth.routes.ts
│   │   └── 📄 stats.routes.ts
│   │
│   ├── 📁 controllers/                   # Request handlers
│   │   ├── 📄 config.controller.ts
│   │   ├── 📄 game.controller.ts
│   │   ├── 📄 player.controller.ts
│   │   ├── 📄 voucher.controller.ts
│   │   ├── 📄 campaign.controller.ts
│   │   ├── 📄 reward.controller.ts
│   │   ├── 📄 asset.controller.ts
│   │   ├── 📄 auth.controller.ts
│   │   └── 📄 stats.controller.ts
│   │
│   ├── 📁 services/                      # Business logic
│   │   ├── 📄 config.service.ts
│   │   ├── 📄 game.service.ts
│   │   ├── 📄 player.service.ts
│   │   ├── 📄 voucher.service.ts
│   │   ├── 📄 campaign.service.ts
│   │   ├── 📄 reward.service.ts
│   │   ├── 📄 asset.service.ts
│   │   └── 📄 stats.service.ts
│   │
│   ├── 📁 engines/                       # Core game logic
│   │   ├── 📄 GameEngine.ts              # Main game processor
│   │   ├── 📄 RandomEngine.ts            # Weighted random
│   │   ├── 📄 VoucherGenerator.ts        # Voucher code gen
│   │   ├── 📄 QRGenerator.ts             # QR code gen
│   │   └── 📄 index.ts
│   │
│   ├── 📁 middlewares/                   # Express middlewares
│   │   ├── 📄 auth.middleware.ts         # JWT verification
│   │   ├── 📄 player.middleware.ts       # Player token
│   │   ├── 📄 rateLimit.middleware.ts    # Rate limiting
│   │   ├── 📄 validation.middleware.ts   # Request validation
│   │   ├── 📄 upload.middleware.ts       # File upload
│   │   ├── 📄 error.middleware.ts        # Error handling
│   │   └── 📄 index.ts
│   │
│   ├── 📁 validators/                    # Request validators (Zod)
│   │   ├── 📄 config.validator.ts
│   │   ├── 📄 player.validator.ts
│   │   ├── 📄 game.validator.ts
│   │   ├── 📄 voucher.validator.ts
│   │   ├── 📄 campaign.validator.ts
│   │   ├── 📄 reward.validator.ts
│   │   ├── 📄 auth.validator.ts
│   │   └── 📄 index.ts
│   │
│   ├── 📁 types/                         # TypeScript types
│   │   ├── 📄 index.ts
│   │   ├── 📄 api.types.ts
│   │   ├── 📄 game.types.ts
│   │   ├── 📄 express.d.ts               # Express type extensions
│   │   └── 📄 database.types.ts
│   │
│   └── 📁 utils/                         # Utilities
│       ├── 📄 response.ts                # API response helpers
│       ├── 📄 logger.ts                  # Winston logger
│       ├── 📄 crypto.ts                  # Hash, encrypt
│       ├── 📄 helpers.ts                 # Misc helpers
│       └── 📄 cache.ts                   # Node-cache wrapper
│
├── 📁 prisma/
│   ├── 📄 schema.prisma                  # Database schema
│   ├── 📄 seed.ts                        # Database seeder
│   └── 📁 migrations/                    # Migration files
│
├── 📁 uploads/                           # Uploaded files
│   ├── 📁 logos/
│   ├── 📁 banners/
│   ├── 📁 rewards/
│   └── 📁 games/
│
├── 📁 logs/                              # Log files
│   ├── 📄 error.log
│   └── 📄 combined.log
│
├── 📁 tests/                             # Test files
│   ├── 📁 unit/
│   ├── 📁 integration/
│   └── 📄 setup.ts
│
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 nodemon.json
├── 📄 jest.config.js
├── 📄 .env
└── 📄 Dockerfile
```

---

## 📁 DOCKER

```
docker/
│
├── 📄 docker-compose.yml                 # Production compose
├── 📄 docker-compose.dev.yml             # Development compose
├── 📄 docker-compose.test.yml            # Testing compose
│
└── 📁 nginx/
    ├── 📄 nginx.conf                     # Nginx config
    ├── 📄 nginx.dev.conf                 # Dev config
    └── 📁 ssl/                           # SSL certificates
        ├── 📄 cert.pem
        └── 📄 key.pem
```

---

## 📁 DOCUMENTATION

```
docs/
│
├── 📄 SYSTEM_DESIGN.md                   # System architecture
├── 📄 PROJECT_STRUCTURE.md               # This file
├── 📄 API_REFERENCE.md                   # API documentation
├── 📄 DATABASE_SCHEMA.md                 # Database details
├── 📄 DEPLOYMENT.md                      # Deployment guide
├── 📄 USER_GUIDE.md                      # End-user guide
├── 📄 ADMIN_GUIDE.md                     # Admin guide
│
└── 📁 diagrams/
    ├── 📄 architecture.png
    ├── 📄 erd.png
    └── 📄 flow.png
```

---

## 📁 SCRIPTS

```
scripts/
│
├── 📄 setup.ps1                          # Windows setup script
├── 📄 setup.sh                           # Linux/Mac setup
├── 📄 seed-db.ts                         # Database seeder
├── 📄 backup.sh                          # Backup script
├── 📄 restore.sh                         # Restore script
└── 📄 generate-types.ts                  # Generate TS types
```

---

## 📁 ROOT FILES

```
Web_MiniGame/
│
├── 📄 package.json                       # Workspace root
├── 📄 pnpm-workspace.yaml                # PNPM workspaces (if using pnpm)
├── 📄 turbo.json                         # Turborepo config (optional)
├── 📄 .env.example                       # Environment template
├── 📄 .gitignore                         # Git ignore rules
├── 📄 .prettierrc                        # Prettier config
├── 📄 .eslintrc.js                       # ESLint config
├── 📄 README.md                          # Project readme
└── 📄 LICENSE                            # License file
```

---

## 🔧 Package.json (Root)

```json
{
  "name": "web-minigame",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm -w packages/frontend run dev",
    "dev:backend": "npm -w packages/backend run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:frontend": "npm -w packages/frontend run build",
    "build:backend": "npm -w packages/backend run build",
    "start": "npm run start:backend & npm run start:frontend",
    "lint": "npm run lint -ws",
    "test": "npm run test -ws",
    "db:migrate": "npm -w packages/backend run db:migrate",
    "db:seed": "npm -w packages/backend run db:seed",
    "docker:dev": "docker-compose -f docker/docker-compose.dev.yml up",
    "docker:prod": "docker-compose -f docker/docker-compose.yml up -d"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "prettier": "^3.0.0",
    "eslint": "^8.50.0",
    "typescript": "^5.2.0"
  }
}
```

---

## 📋 Key Files Description

### Frontend

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page với form SĐT và game |
| `components/games/GameRenderer.tsx` | Container chính render game dựa trên config |
| `hooks/useGame.ts` | Logic chơi game, gọi API, xử lý kết quả |
| `stores/playerStore.ts` | Zustand store lưu thông tin player |
| `lib/api.ts` | Axios instance với interceptors |

### Backend

| File | Purpose |
|------|---------|
| `engines/GameEngine.ts` | Core logic xử lý chơi game, random kết quả |
| `engines/VoucherGenerator.ts` | Tạo mã voucher unique + QR code |
| `middlewares/rateLimit.middleware.ts` | Chống spam requests |
| `services/game.service.ts` | Business logic cho game |
| `prisma/schema.prisma` | Database schema |

---

**Document Version:** 1.0  
**Last Updated:** 04/02/2026
