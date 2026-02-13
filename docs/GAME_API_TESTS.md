# Game API Test Examples

## 1. Register Player (Get Token First)
```bash
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0909123456",
    "name": "Test Player"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "player": {
      "id": 1,
      "phone": "0909123456",
      "name": "Test Player"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "campaign": {
      "id": 1,
      "remainingPlays": 1,
      "maxPlays": 1
    }
  }
}
```

**Important:** Save the `token` value for next requests.

---

## 2. Check Eligibility
```bash
curl -X GET http://localhost:4000/api/game/eligibility \
  -H "X-Player-Token: YOUR_PLAYER_TOKEN_HERE"
```

**Response (Can Play):**
```json
{
  "success": true,
  "data": {
    "canPlay": true,
    "remainingPlays": 1,
    "maxPlays": 1
  }
}
```

**Response (Cannot Play):**
```json
{
  "success": true,
  "data": {
    "canPlay": false,
    "remainingPlays": 0,
    "maxPlays": 1,
    "reason": "NO_PLAYS_LEFT",
    "message": "Bạn đã hết lượt chơi"
  }
}
```

---

## 3. Play Game - Wheel
```bash
curl -X POST http://localhost:4000/api/game/play \
  -H "Content-Type: application/json" \
  -H "X-Player-Token: YOUR_PLAYER_TOKEN_HERE" \
  -d '{
    "gameType": "wheel",
    "gameData": {}
  }'
```

**Response (Win):**
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
      "id": 1,
      "code": "ABC123XY",
      "qrCode": "data:image/png;base64,iVBORw0KGgo...",
      "expiresAt": "2026-02-28T23:59:59.000Z"
    },
    "player": {
      "remainingPlays": 0,
      "totalWins": 1
    }
  },
  "message": "🎉 Chúc mừng bạn đã trúng Voucher 10k!"
}
```

**Response (Lose):**
```json
{
  "success": true,
  "data": {
    "isWin": false,
    "reward": {
      "id": 3,
      "name": "Chúc bạn may mắn lần sau",
      "description": null,
      "icon": null,
      "value": null
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

---

## 4. Play Game - Memory
```bash
curl -X POST http://localhost:4000/api/game/play \
  -H "Content-Type: application/json" \
  -H "X-Player-Token: YOUR_PLAYER_TOKEN_HERE" \
  -d '{
    "gameType": "memory",
    "gameData": {
      "matchedPairs": 8,
      "timeSpent": 45
    }
  }'
```

---

## 5. Play Game - Shake
```bash
curl -X POST http://localhost:4000/api/game/play \
  -H "Content-Type: application/json" \
  -H "X-Player-Token: YOUR_PLAYER_TOKEN_HERE" \
  -d '{
    "gameType": "shake",
    "gameData": {
      "shakeCount": 10
    }
  }'
```

---

## 6. Play Game - Tap
```bash
curl -X POST http://localhost:4000/api/game/play \
  -H "Content-Type: application/json" \
  -H "X-Player-Token: YOUR_PLAYER_TOKEN_HERE" \
  -d '{
    "gameType": "tap",
    "gameData": {
      "taps": 52,
      "perfectHits": 3
    }
  }'
```

---

## Error Responses

### No Token Provided
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Player token không được cung cấp"
  }
}
```

### Invalid Token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "jwt malformed"
  }
}
```

### Campaign Not Active
```json
{
  "success": false,
  "error": {
    "code": "CAMPAIGN_NOT_ACTIVE",
    "message": "Không có chương trình nào đang hoạt động"
  }
}
```

### No Plays Left
```json
{
  "success": false,
  "error": {
    "code": "NO_PLAYS_LEFT",
    "message": "Bạn đã hết lượt chơi. Cảm ơn bạn đã tham gia!"
  }
}
```

### Rate Limited
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Bạn đang chơi quá nhanh. Vui lòng chờ một chút."
  }
}
```

### Wrong Game Type
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Game type không khớp. Chương trình hiện tại đang chơi game: wheel"
  }
}
```

---

## PowerShell Examples (Windows)

### Register
```powershell
$body = @{
    phone = "0909123456"
    name = "Test Player"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/players/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Play Game
```powershell
$headers = @{
    "X-Player-Token" = "YOUR_PLAYER_TOKEN_HERE"
}

$body = @{
    gameType = "wheel"
    gameData = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/game/play" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

---

## Notes

1. **Rate Limiting**: The `/api/game/play` endpoint is rate-limited to 5 requests per minute per IP.
2. **Token Expiry**: Player tokens expire after 30 days.
3. **Game Type Validation**: The game type must match the campaign's activeGame setting.
4. **Transaction Safety**: All game operations use database transactions to ensure data integrity.
5. **QR Code**: The QR code in the response is a Base64-encoded PNG image (data URL format).
