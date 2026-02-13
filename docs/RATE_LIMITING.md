# Rate Limiting Configuration

## Overview

The backend implements comprehensive rate limiting to protect against abuse, DDoS attacks, and to ensure fair resource usage across all clients. We use `express-rate-limit` middleware with different configurations for different endpoints.

---

## Global Rate Limit

Applied to all `/api/*` endpoints.

**Configuration:**
- **Window:** 15 minutes
- **Max Requests:** 100 per window
- **Scope:** Per IP address

```typescript
// Applied in src/app.ts
app.use('/api', apiLimiter);
```

**Response when exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Quá nhiều request, vui lòng thử lại sau"
  }
}
```

---

## Endpoint-Specific Rate Limits

### 1. Game Play (`/api/game/play`)

**Most restrictive** - Prevents rapid game playing.

- **Window:** 1 minute
- **Max Requests:** 5 per window
- **Key:** Player ID (from token) or IP address
- **Applied:** `src/routes/game.routes.ts`

```typescript
router.post('/play', playLimiter, requirePlayer, validateBody(playGameSchema), playGame);
```

**Use case:** Prevent automated bots from playing games rapidly.

---

### 2. Player Registration (`/api/players/register`)

Prevents spam account creation.

- **Window:** 1 minute
- **Max Requests:** 10 per window
- **Key:** Phone number (from body) or IP address
- **Applied:** `src/routes/player.routes.ts`

```typescript
router.post('/register', registerLimiter, validateBody(registerPlayerSchema), register);
```

**Use case:** Prevent mass account creation from single source.

---

### 3. Admin Login (`/api/auth/login`)

Prevents brute force password attacks.

- **Window:** 15 minutes
- **Max Requests:** 5 per window
- **Key:** Username (from body) or IP address
- **Skip:** Successful logins don't count
- **Applied:** `src/routes/auth.routes.ts`

```typescript
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
```

**Use case:** Protect against brute force login attempts.

---

### 4. File Upload (`/api/assets/upload`, `/api/config/upload-*`)

Prevents upload spam.

- **Window:** 15 minutes
- **Max Requests:** 20 per window
- **Key:** IP address
- **Applied:** Upload routes

```typescript
// Usage example:
router.post('/upload', uploadLimiter, upload.single('file'), handleUpload);
```

**Use case:** Prevent storage abuse from excessive uploads.

---

### 5. QR Scanner (`/api/vouchers/:code/verify`, `/api/vouchers/:code/redeem`)

For staff scanning vouchers at store.

- **Window:** 5 minutes
- **Max Requests:** 50 per window
- **Key:** IP address
- **Applied:** Voucher routes

```typescript
// Usage example:
router.post('/:code/redeem', scanLimiter, requireAdmin, redeemVoucher);
```

**Use case:** Allow staff to scan multiple vouchers but prevent abuse.

---

### 6. Stats API (`/api/stats/*`)

Dashboard and analytics endpoints.

- **Window:** 5 minutes
- **Max Requests:** 30 per window
- **Key:** IP address
- **Applied:** Stats routes

```typescript
// Usage example:
router.get('/dashboard', statsLimiter, requireAdmin, getDashboard);
```

**Use case:** Prevent excessive stats queries that may be expensive.

---

## Rate Limit Headers

All rate limiters include standard rate limit headers in responses:

```
RateLimit-Limit: 100           # Maximum requests allowed
RateLimit-Remaining: 95        # Requests remaining in window
RateLimit-Reset: 1707123456    # Unix timestamp when window resets
```

**Example response headers:**
```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1707123456
Content-Type: application/json
```

---

## Key Generation Strategies

### 1. IP-based (Default)
```typescript
keyGenerator: (req) => req.ip || 'unknown'
```
Used when no user context is available.

### 2. Player ID-based
```typescript
keyGenerator: (req) => {
  if (req.player?.id) {
    return `player:${req.player.id}`;
  }
  return req.ip || 'unknown';
}
```
Used for authenticated player actions (game play).

### 3. Username-based
```typescript
keyGenerator: (req) => {
  const username = req.body?.username;
  if (username) {
    return `login:${username}`;
  }
  return `login-ip:${req.ip}`;
}
```
Used for login attempts to prevent targeted attacks.

### 4. Phone-based
```typescript
keyGenerator: (req) => {
  const phone = req.body?.phone;
  if (phone) {
    return `register:${phone}`;
  }
  return `register-ip:${req.ip}`;
}
```
Used for registration to prevent spam from same phone.

---

## Testing Rate Limits

### Test Play Game Rate Limit

```bash
# This should fail on the 6th request within 1 minute
for i in {1..6}; do
  echo "Request $i"
  curl -X POST http://localhost:4000/api/game/play \
    -H "Content-Type: application/json" \
    -H "X-Player-Token: YOUR_TOKEN" \
    -d '{"gameType":"wheel","gameData":{}}' \
    && echo ""
done
```

### Test Registration Rate Limit

```bash
# Should fail on 11th request within 1 minute
for i in {1..11}; do
  echo "Request $i"
  curl -X POST http://localhost:4000/api/players/register \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"090912345$i\",\"name\":\"Test $i\"}" \
    && echo ""
  sleep 1
done
```

### Test Login Rate Limit

```bash
# Should fail on 6th failed login within 15 minutes
for i in {1..6}; do
  echo "Attempt $i"
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong_password"}' \
    && echo ""
done
```

---

## Monitoring Rate Limits

### Check Current Limits in Code

All rate limiters are exported from `src/middlewares/rateLimit.middleware.ts`:

```typescript
import {
  apiLimiter,       // General API
  playLimiter,      // Game play
  loginLimiter,     // Admin login
  registerLimiter,  // Player registration
  uploadLimiter,    // File upload
  scanLimiter,      // QR scanner
  statsLimiter,     // Stats API
} from './middlewares/rateLimit.middleware';
```

### Production Monitoring

In production, you should monitor:

1. **Rate limit hits** - How often users hit limits
2. **Common offenders** - IPs/users frequently hitting limits
3. **Legitimate traffic** - Ensure limits aren't too restrictive

Consider using Redis store for distributed rate limiting:

```typescript
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const client = new Redis();

export const playLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:play:',
  }),
  // ... other config
});
```

---

## Adjusting Limits

To adjust rate limits, edit values in `src/middlewares/rateLimit.middleware.ts`:

```typescript
// Example: Increase play limit to 10 per minute
export const playLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,  // Changed from 5 to 10
  // ...
});
```

After changes:
1. Restart server
2. Test new limits
3. Monitor for issues

---

## Best Practices

### ✅ DO:
- Use stricter limits for expensive operations (game play, database writes)
- Use user-specific keys (ID, username) when possible
- Skip successful operations (like `skipSuccessfulRequests` for login)
- Include rate limit headers for client transparency
- Monitor and adjust based on real usage patterns

### ❌ DON'T:
- Don't set limits too low - frustrates legitimate users
- Don't use only IP-based limits - users behind NAT share IPs
- Don't forget to test limits in staging before production
- Don't apply same limits to all endpoints - use appropriate granularity

---

## Security Considerations

1. **Proxy Trust:** Ensure `app.set('trust proxy', 1)` if behind proxy/load balancer
2. **Key Leakage:** Don't expose user IDs in rate limit keys to clients
3. **Bypass:** Rate limits are not authentication - always validate credentials
4. **DDoS:** Rate limiting alone won't stop DDoS - use CDN/WAF as well
5. **Storage:** In-memory limits reset on server restart - use Redis for persistence

---

## Summary Table

| Endpoint | Window | Max | Key Strategy |
|----------|--------|-----|--------------|
| `/api/*` (global) | 15 min | 100 | IP |
| `/api/game/play` | 1 min | 5 | Player ID or IP |
| `/api/players/register` | 1 min | 10 | Phone or IP |
| `/api/auth/login` | 15 min | 5 | Username or IP |
| `/api/assets/upload` | 15 min | 20 | IP |
| `/api/vouchers/*/redeem` | 5 min | 50 | IP |
| `/api/stats/*` | 5 min | 30 | IP |

---

**Last Updated:** February 7, 2026  
**Version:** 1.0
