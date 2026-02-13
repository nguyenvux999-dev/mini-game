# 📡 API REFERENCE

## Base URL
```
Development: http://localhost:4000/api
Production:  https://your-domain.com/api
```

## Authentication
- **Admin APIs**: Bearer Token (JWT) trong header `Authorization`
- **Player APIs**: Player Token trong header `X-Player-Token`

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }  // Optional
  }
}
```

---

# 📌 PUBLIC APIs (Không cần auth)

## 1. Config API

### GET /api/config
Lấy cấu hình store và campaign hiện tại cho frontend.

**Response:**
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
      "description": "Mua 1 tặng 1",
      "activeGame": "wheel",
      "gameConfig": {
        "wheel": {
          "segments": 8,
          "colors": ["#FF6B35", "#F7C59F", "#2EC4B6", "#E71D36"],
          "spinDuration": 5000
        }
      },
      "startDate": "2026-02-01T00:00:00Z",
      "endDate": "2026-02-28T23:59:59Z",
      "maxPlaysPerPhone": 1
    },
    "rewards": [
      {
        "id": 1,
        "name": "Voucher 10k",
        "description": "Giảm 10.000đ",
        "icon": "https://example.com/uploads/voucher10k.png",
        "displayOrder": 1
      },
      {
        "id": 2,
        "name": "Voucher 50k",
        "icon": "https://example.com/uploads/voucher50k.png",
        "displayOrder": 2
      },
      {
        "id": 3,
        "name": "Chúc bạn may mắn lần sau",
        "icon": "https://example.com/uploads/lose.png",
        "displayOrder": 3
      }
    ],
    "contact": {
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "hotline": "0909123456",
      "fanpage": "https://fb.com/quanABC",
      "zalo": "https://zalo.me/quanABC"
    }
  }
}
```

---

## 2. Player API

### POST /api/players/register
Đăng ký hoặc đăng nhập player bằng số điện thoại.

**Request:**
```json
{
  "phone": "0909123456",
  "name": "Nguyễn Văn A"  // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "player": {
      "id": 123,
      "phone": "0909123456",
      "name": "Nguyễn Văn A",
      "playCount": 0,
      "totalWins": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "campaign": {
      "id": 1,
      "remainingPlays": 1,
      "maxPlays": 1
    }
  },
  "message": "Đăng ký thành công! Bạn có 1 lượt chơi."
}
```

**Response (Already registered):**
```json
{
  "success": true,
  "data": {
    "player": {
      "id": 123,
      "phone": "0909123456",
      "name": "Nguyễn Văn A",
      "playCount": 1,
      "totalWins": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "campaign": {
      "id": 1,
      "remainingPlays": 0,
      "maxPlays": 1
    }
  },
  "message": "Chào mừng trở lại!"
}
```

**Errors:**
| Code | Message |
|------|---------|
| INVALID_PHONE | Số điện thoại không hợp lệ |
| CAMPAIGN_NOT_ACTIVE | Chương trình chưa bắt đầu hoặc đã kết thúc |

---

### GET /api/players/:id/eligibility
Kiểm tra player còn lượt chơi không.

**Headers:**
```
X-Player-Token: <player_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "canPlay": true,
    "remainingPlays": 1,
    "maxPlays": 1,
    "nextPlayAt": null
  }
}
```

```json
{
  "success": true,
  "data": {
    "canPlay": false,
    "remainingPlays": 0,
    "maxPlays": 1,
    "reason": "NO_PLAYS_LEFT",
    "message": "Bạn đã hết lượt chơi hôm nay. Quay lại vào ngày mai nhé!"
  }
}
```

---

## 3. Game API

### POST /api/game/play
Chơi game và nhận kết quả. **Đây là API quan trọng nhất.**

**Headers:**
```
X-Player-Token: <player_token>
```

**Request:**
```json
{
  "gameType": "wheel",
  "gameData": {
    // Optional - dữ liệu game
    // Memory: { "matchedPairs": 8, "timeSpent": 45 }
    // Tap: { "taps": 52, "perfectHits": 3 }
    // Shake: { "shakeCount": 10 }
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
      "icon": "https://example.com/uploads/voucher10k.png",
      "value": 10000
    },
    "voucher": {
      "id": 456,
      "code": "ABC123XY",
      "qrCode": "data:image/png;base64,iVBORw0KGgo...",
      "expiresAt": "2026-02-28T23:59:59Z"
    },
    "player": {
      "remainingPlays": 0,
      "totalWins": 1
    }
  },
  "message": "🎉 Chúc mừng bạn đã trúng Voucher 10k!"
}
```

**Response (Thua):**
```json
{
  "success": true,
  "data": {
    "isWin": false,
    "reward": {
      "id": 3,
      "name": "Chúc bạn may mắn lần sau",
      "icon": "https://example.com/uploads/lose.png"
    },
    "voucher": null,
    "player": {
      "remainingPlays": 0,
      "totalWins": 0
    }
  },
  "message": "Chúc bạn may mắn lần sau! 🍀"
}
```

**Errors:**
| Code | Message |
|------|---------|
| INVALID_TOKEN | Token không hợp lệ |
| NO_PLAYS_LEFT | Đã hết lượt chơi |
| CAMPAIGN_ENDED | Chương trình đã kết thúc |
| RATE_LIMITED | Bạn đang chơi quá nhanh |

---

## 4. Voucher API (Public)

### GET /api/vouchers/:code
Lấy thông tin voucher bằng mã code (cho trang voucher detail).

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
        "id": 1,
        "name": "Voucher 10k",
        "description": "Giảm 10.000đ cho đơn từ 50.000đ",
        "icon": "https://example.com/uploads/voucher10k.png",
        "value": 10000
      },
      "campaign": {
        "name": "Quay là trúng - Tháng 2"
      },
      "expiresAt": "2026-02-28T23:59:59Z",
      "createdAt": "2026-02-04T10:30:00Z"
    },
    "store": {
      "name": "Quán Trà Sữa ABC",
      "address": "123 Đường ABC, Quận 1",
      "hotline": "0909123456"
    }
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| NOT_FOUND | Không tìm thấy voucher |
| VOUCHER_EXPIRED | Voucher đã hết hạn |
| VOUCHER_USED | Voucher đã được sử dụng |

---

# 🔐 ADMIN APIs (Yêu cầu Bearer Token)

## 1. Auth API

### POST /api/auth/login
Đăng nhập admin.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "username": "admin",
      "displayName": "Admin",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

---

### GET /api/auth/me
Lấy thông tin admin hiện tại.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "displayName": "Admin",
    "role": "admin",
    "lastLogin": "2026-02-04T08:00:00Z"
  }
}
```

---

### POST /api/auth/logout
Đăng xuất admin.

**Response:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

### PUT /api/auth/password
Đổi mật khẩu.

**Request:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

---

## 2. Config API (Admin)

### GET /api/config/admin
Lấy full config (bao gồm cả thông tin sensitive).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "storeName": "Quán Trà Sữa ABC",
    "logoUrl": "https://example.com/uploads/logo.png",
    "bannerUrl": "https://example.com/uploads/banner.jpg",
    "primaryColor": "#FF6B35",
    "secondaryColor": "#F7C59F",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "hotline": "0909123456",
    "fanpageUrl": "https://fb.com/quanABC",
    "instagramUrl": "https://instagram.com/quanABC",
    "zaloUrl": "https://zalo.me/quanABC",
    "updatedAt": "2026-02-04T10:00:00Z"
  }
}
```

---

### PUT /api/config
Cập nhật store config.

**Request:**
```json
{
  "storeName": "Quán Trà Sữa ABC",
  "primaryColor": "#FF6B35",
  "secondaryColor": "#F7C59F",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "hotline": "0909123456",
  "fanpageUrl": "https://fb.com/quanABC"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Cập nhật cấu hình thành công"
}
```

---

### POST /api/config/upload-logo
Upload logo.

**Request:** `multipart/form-data`
```
file: <image file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/logos/logo_1707123456.png"
  },
  "message": "Upload logo thành công"
}
```

---

### POST /api/config/upload-banner
Upload banner.

**Request:** `multipart/form-data`
```
file: <image file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/banners/banner_1707123456.jpg"
  },
  "message": "Upload banner thành công"
}
```

---

## 3. Campaign API

### GET /api/campaigns
Lấy danh sách campaigns.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 10 | Số item mỗi trang |
| status | string | all | all/active/ended |

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": 1,
        "name": "Quay là trúng - Tháng 2",
        "activeGame": "wheel",
        "startDate": "2026-02-01T00:00:00Z",
        "endDate": "2026-02-28T23:59:59Z",
        "isActive": true,
        "stats": {
          "totalPlays": 1234,
          "totalWins": 567,
          "vouchersIssued": 567,
          "vouchersRedeemed": 234
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/campaigns/:id
Lấy chi tiết campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Quay là trúng - Tháng 2",
    "description": "Mua 1 tặng 1",
    "activeGame": "wheel",
    "gameConfig": {
      "wheel": {
        "segments": 8,
        "colors": ["#FF6B35", "#F7C59F"],
        "spinDuration": 5000
      }
    },
    "startDate": "2026-02-01T00:00:00Z",
    "endDate": "2026-02-28T23:59:59Z",
    "maxPlaysPerPhone": 1,
    "isActive": true,
    "rewards": [
      {
        "id": 1,
        "name": "Voucher 10k",
        "probability": 30,
        "totalQuantity": 100,
        "remainingQty": 50,
        "isActive": true
      }
    ],
    "stats": {
      "totalPlays": 1234,
      "totalWins": 567
    }
  }
}
```

---

### POST /api/campaigns
Tạo campaign mới.

**Request:**
```json
{
  "name": "Quay là trúng - Tháng 3",
  "description": "Chương trình khuyến mãi tháng 3",
  "activeGame": "wheel",
  "gameConfig": {
    "wheel": {
      "segments": 8,
      "colors": ["#FF6B35", "#F7C59F", "#2EC4B6", "#E71D36"],
      "spinDuration": 5000
    }
  },
  "startDate": "2026-03-01T00:00:00Z",
  "endDate": "2026-03-31T23:59:59Z",
  "maxPlaysPerPhone": 1,
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    ...
  },
  "message": "Tạo chương trình thành công"
}
```

---

### PUT /api/campaigns/:id
Cập nhật campaign.

**Request:**
```json
{
  "name": "Quay là trúng - Tháng 2 (Updated)",
  "gameConfig": { ... }
}
```

---

### PATCH /api/campaigns/:id/toggle
Bật/tắt campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "isActive": false
  },
  "message": "Đã tắt chương trình"
}
```

---

### DELETE /api/campaigns/:id
Xoá campaign.

**Response:**
```json
{
  "success": true,
  "message": "Đã xoá chương trình"
}
```

---

## 4. Reward API

### GET /api/rewards
Lấy danh sách rewards.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| campaignId | number | Filter theo campaign |

**Response:**
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": 1,
        "campaignId": 1,
        "name": "Voucher 10k",
        "description": "Giảm 10.000đ",
        "iconUrl": "https://example.com/uploads/voucher10k.png",
        "probability": 30,
        "totalQuantity": 100,
        "remainingQty": 50,
        "value": 10000,
        "isActive": true,
        "displayOrder": 1
      }
    ]
  }
}
```

---

### POST /api/rewards
Tạo reward mới.

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

### PUT /api/rewards/:id
Cập nhật reward.

---

### DELETE /api/rewards/:id
Xoá reward.

---

### PATCH /api/rewards/:id/toggle
Bật/tắt reward.

---

## 5. Voucher API (Admin)

### GET /api/vouchers
Lấy danh sách vouchers.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Trang |
| limit | number | Số item |
| status | string | active/used/expired/cancelled |
| campaignId | number | Filter theo campaign |
| search | string | Tìm theo code hoặc SĐT |

**Response:**
```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "id": 456,
        "code": "ABC123XY",
        "status": "active",
        "reward": {
          "id": 1,
          "name": "Voucher 10k",
          "value": 10000
        },
        "player": {
          "id": 123,
          "phone": "0909***456",
          "name": "Nguyễn Văn A"
        },
        "campaign": {
          "id": 1,
          "name": "Quay là trúng"
        },
        "expiresAt": "2026-02-28T23:59:59Z",
        "createdAt": "2026-02-04T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100
    }
  }
}
```

---

### GET /api/vouchers/:code/verify
Xác thực voucher (cho scanner).

**Response (Valid):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "voucher": {
      "id": 456,
      "code": "ABC123XY",
      "status": "active",
      "reward": {
        "name": "Voucher 10k",
        "value": 10000
      },
      "player": {
        "phone": "0909123456",
        "name": "Nguyễn Văn A"
      },
      "expiresAt": "2026-02-28T23:59:59Z"
    },
    "canRedeem": true
  }
}
```

**Response (Invalid):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "reason": "VOUCHER_USED",
    "message": "Voucher này đã được sử dụng",
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

### POST /api/vouchers/:code/redeem
Đổi voucher (mark as used).

**Request:**
```json
{
  "notes": "Khách đổi voucher"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "voucher": {
      "id": 456,
      "code": "ABC123XY",
      "status": "used",
      "usedAt": "2026-02-04T15:30:00Z",
      "usedBy": "staff01"
    }
  },
  "message": "Đã xác nhận đổi voucher thành công!"
}
```

---

### PATCH /api/vouchers/:id/cancel
Huỷ voucher.

**Request:**
```json
{
  "reason": "Khách yêu cầu huỷ"
}
```

---

## 6. Player API (Admin)

### GET /api/players
Lấy danh sách players.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Trang |
| limit | number | Số item |
| search | string | Tìm theo SĐT hoặc tên |

**Response:**
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "id": 123,
        "phone": "0909123456",
        "name": "Nguyễn Văn A",
        "playCount": 5,
        "totalWins": 3,
        "lastPlayAt": "2026-02-04T10:30:00Z",
        "createdAt": "2026-02-01T08:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /api/players/:id
Lấy chi tiết player.

**Response:**
```json
{
  "success": true,
  "data": {
    "player": {
      "id": 123,
      "phone": "0909123456",
      "name": "Nguyễn Văn A",
      "playCount": 5,
      "totalWins": 3
    },
    "vouchers": [
      {
        "id": 456,
        "code": "ABC123XY",
        "status": "active",
        "reward": { "name": "Voucher 10k" }
      }
    ],
    "playHistory": [
      {
        "id": 789,
        "gameType": "wheel",
        "isWin": true,
        "reward": { "name": "Voucher 10k" },
        "playedAt": "2026-02-04T10:30:00Z"
      }
    ]
  }
}
```

---

## 7. Stats API

### GET /api/stats/dashboard
Dashboard tổng quan.

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
      "vouchersRedeemed": 23,
      "winRate": "50%"
    },
    "campaign": {
      "id": 1,
      "name": "Quay là trúng - Tháng 2",
      "daysRemaining": 24,
      "totalPlays": 1234,
      "totalWins": 567,
      "totalPlayers": 890,
      "vouchersIssued": 567,
      "vouchersRedeemed": 234,
      "winRate": "45.9%"
    },
    "rewardStats": [
      {
        "id": 1,
        "name": "Voucher 10k",
        "issued": 300,
        "redeemed": 120,
        "remaining": 50,
        "redeemRate": "40%"
      },
      {
        "id": 2,
        "name": "Voucher 50k",
        "issued": 50,
        "redeemed": 30,
        "remaining": 20,
        "redeemRate": "60%"
      }
    ]
  }
}
```

---

### GET /api/stats/plays
Thống kê lượt chơi.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| startDate | string | Ngày bắt đầu (YYYY-MM-DD) |
| endDate | string | Ngày kết thúc |
| groupBy | string | day/week/month |

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPlays": 1234,
      "totalWins": 567,
      "winRate": "45.9%"
    },
    "chart": [
      { "date": "2026-02-01", "plays": 100, "wins": 45 },
      { "date": "2026-02-02", "plays": 120, "wins": 55 },
      { "date": "2026-02-03", "plays": 80, "wins": 35 }
    ]
  }
}
```

---

### GET /api/stats/vouchers
Thống kê vouchers.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIssued": 567,
      "totalRedeemed": 234,
      "totalExpired": 50,
      "totalActive": 283,
      "redeemRate": "41.3%"
    },
    "byReward": [
      { "reward": "Voucher 10k", "issued": 300, "redeemed": 120 },
      { "reward": "Voucher 50k", "issued": 50, "redeemed": 30 }
    ]
  }
}
```

---

## 8. Asset API

### POST /api/assets/upload
Upload asset (image, icon).

**Request:** `multipart/form-data`
```
file: <file>
type: "reward_icon" | "game_background" | "game_character" | "game_card"
gameType: "wheel" | "shake" | "memory" | "tap"  // Optional
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "url": "https://example.com/uploads/rewards/icon_123.png",
    "type": "reward_icon"
  }
}
```

---

### GET /api/assets
Lấy danh sách assets.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | Filter theo type |
| gameType | string | Filter theo game |

---

### DELETE /api/assets/:id
Xoá asset.

---

# ⚠️ Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Token không hợp lệ hoặc hết hạn |
| FORBIDDEN | 403 | Không có quyền truy cập |
| NOT_FOUND | 404 | Không tìm thấy resource |
| VALIDATION_ERROR | 400 | Dữ liệu không hợp lệ |
| INVALID_PHONE | 400 | Số điện thoại không hợp lệ |
| CAMPAIGN_NOT_ACTIVE | 400 | Chương trình chưa hoạt động |
| CAMPAIGN_ENDED | 400 | Chương trình đã kết thúc |
| NO_PLAYS_LEFT | 400 | Hết lượt chơi |
| VOUCHER_NOT_FOUND | 404 | Không tìm thấy voucher |
| VOUCHER_EXPIRED | 400 | Voucher hết hạn |
| VOUCHER_USED | 400 | Voucher đã sử dụng |
| VOUCHER_CANCELLED | 400 | Voucher đã bị huỷ |
| FILE_TOO_LARGE | 400 | File quá lớn |
| INVALID_FILE_TYPE | 400 | Loại file không hỗ trợ |
| RATE_LIMITED | 429 | Quá nhiều request |
| SERVER_ERROR | 500 | Lỗi server |

---

# 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/game/play` | 5 requests | 1 minute |
| `/api/players/register` | 10 requests | 1 minute |
| `/api/*` (general) | 100 requests | 15 minutes |
| `/api/auth/login` | 5 requests | 15 minutes |

---

**Document Version:** 1.0  
**Last Updated:** 04/02/2026
