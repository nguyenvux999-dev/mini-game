-- CreateTable
CREATE TABLE "store_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "store_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#FF6B35',
    "secondary_color" TEXT NOT NULL DEFAULT '#F7C59F',
    "address" TEXT,
    "hotline" TEXT,
    "fanpage_url" TEXT,
    "instagram_url" TEXT,
    "zalo_url" TEXT,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "active_game" TEXT NOT NULL,
    "game_config" TEXT,
    "max_plays_per_phone" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaign_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "probability" INTEGER NOT NULL,
    "total_quantity" INTEGER,
    "remaining_qty" INTEGER,
    "value" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rewards_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "players" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "last_play_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "player_id" INTEGER NOT NULL,
    "reward_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "qr_data" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" DATETIME,
    "used_at" DATETIME,
    "used_by" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vouchers_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vouchers_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vouchers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "play_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "player_id" INTEGER NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "game_type" TEXT NOT NULL,
    "reward_id" INTEGER,
    "is_win" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_info" TEXT,
    "played_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "play_logs_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "play_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "play_logs_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "game_assets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "game_type" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "asset_url" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "display_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "rewards_campaign_id_idx" ON "rewards"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_phone_key" ON "players"("phone");

-- CreateIndex
CREATE INDEX "players_phone_idx" ON "players"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_code_idx" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "vouchers_player_id_idx" ON "vouchers"("player_id");

-- CreateIndex
CREATE INDEX "vouchers_status_idx" ON "vouchers"("status");

-- CreateIndex
CREATE INDEX "vouchers_campaign_id_idx" ON "vouchers"("campaign_id");

-- CreateIndex
CREATE INDEX "play_logs_player_id_idx" ON "play_logs"("player_id");

-- CreateIndex
CREATE INDEX "play_logs_campaign_id_idx" ON "play_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "play_logs_played_at_idx" ON "play_logs"("played_at");

-- CreateIndex
CREATE INDEX "game_assets_game_type_idx" ON "game_assets"("game_type");

-- CreateIndex
CREATE INDEX "game_assets_asset_type_idx" ON "game_assets"("asset_type");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "admin_users_username_idx" ON "admin_users"("username");
