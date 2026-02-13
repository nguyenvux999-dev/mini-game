# 🧪 Security Testing Guide

## Hướng dẫn test các tính năng bảo mật đã implement

---

## 📋 Setup

### 1. Khởi động Backend Server
```bash
cd packages/backend
npm run dev
```

Server chạy tại: `http://localhost:4000`

---

## 🔬 Test Cases

### Test 1: XSS Protection - HTML Entity Escaping

**Mục đích:** Kiểm tra name field có escape HTML entities không

**Request:**
```bash
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0909111111",
    "name": "<script>alert(\"XSS\")</script>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "player": {
      "id": 1,
      "phone": "0909111111",
      "name": "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
      "playCount": 0,
      "totalWins": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "campaign": { ... }
  },
  "message": "Đăng ký thành công! Bạn có 1 lượt chơi."
}
```

✅ **Pass if:** Script tag được convert thành HTML entities

---

### Test 2: XSS với nhiều ký tự đặc biệt

**Request:**
```bash
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0909222222",
    "name": "Test<>&\"'/User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "player": {
      "name": "Test&lt;&gt;&amp;&quot;&#x27;&#x2F;User"
    }
  }
}
```

✅ **Pass if:** Tất cả ký tự đặc biệt được escape

---

### Test 3: Phone Validation - Invalid Format

**Request:**
```bash
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": {
      "phone": "Số điện thoại không hợp lệ (phải bắt đầu bằng 03|05|07|08|09 và có 10 chữ số)"
    }
  }
}
```

✅ **Pass if:** Status 400 và error message rõ ràng

---

### Test 4: Valid Vietnam Phone Numbers

**Các format hợp lệ:**

```bash
# Format 1: 03x
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "0301234567", "name": "User 1"}'

# Format 2: 05x
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "0501234567", "name": "User 2"}'

# Format 3: 07x
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "0701234567", "name": "User 3"}'

# Format 4: 08x
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "0801234567", "name": "User 4"}'

# Format 5: 09x
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "0901234567", "name": "User 5"}'
```

✅ **Pass if:** Tất cả đều thành công (status 200/201)

---

### Test 5: Missing Required Field (name)

**Request:**
```bash
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0909333333"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": {
      "name": "Vui lòng nhập tên"
    }
  }
}
```

✅ **Pass if:** Status 400, name field required

---

### Test 6: Whitespace Trimming

**Request:**
```bash
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "  0909444444  ",
    "name": "  Test User  "
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "player": {
      "phone": "0909444444",
      "name": "Test User"
    }
  }
}
```

✅ **Pass if:** Whitespace bị loại bỏ

---

### Test 7: DoS Attack - Large Payload

**Request:**
```bash
# Tạo payload > 10kb
curl -X POST http://localhost:4000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0909555555",
    "name": "'$(python3 -c "print('A'*50000)")'"
  }'
```

**Expected Response:**
```
Request Entity Too Large
```

✅ **Pass if:** Status 413, request rejected

---

### Test 8: Parameter Pollution

**Request:**
```bash
curl -X GET "http://localhost:4000/api/campaigns?status=active&status=ended"
```

**Expected Behavior:**
- HPP middleware tự động loại bỏ duplicate
- Backend chỉ nhận `status=ended` (giá trị cuối)

**Debug:**
```typescript
// Thêm log trong campaign.controller.ts
console.log('Received status:', req.query.status);
// Output: "ended" (không phải array)
```

✅ **Pass if:** Không bị confuse bởi multiple values

---

### Test 9: CORS - Unauthorized Origin

**Request từ browser console:**
```javascript
// Mở https://malicious-site.com
// Paste vào console:

fetch('http://localhost:4000/api/players/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://malicious-site.com'
  },
  body: JSON.stringify({
    phone: '0909666666',
    name: 'Hacker'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected Result:**
```
Access to fetch at 'http://localhost:4000/api/players/register' 
from origin 'https://malicious-site.com' has been blocked by CORS policy
```

✅ **Pass if:** CORS error, request blocked

---

### Test 10: CORS - Authorized Origin

**Request từ localhost:3000:**
```javascript
// Mở http://localhost:3000
fetch('http://localhost:4000/api/players/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '0909777777',
    name: 'Legit User'
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected Result:**
```json
{
  "success": true,
  "data": { ... }
}
```

✅ **Pass if:** Request thành công

---

### Test 11: Rate Limiting

**Request: Spam 15 requests in 1 minute:**
```bash
for i in {1..15}; do
  curl -X POST http://localhost:4000/api/players/register \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"090988800$i\", \"name\": \"User $i\"}"
  echo "Request $i completed"
done
```

**Expected Behavior:**
- First 10 requests: Success (200)
- Request 11-15: Rate limited (429)

**Expected Response (after 10th request):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Quá nhiều lần đăng ký. Vui lòng thử lại sau."
  }
}
```

✅ **Pass if:** Status 429 after 10 requests/minute

---

### Test 12: Security Headers

**Request:**
```bash
curl -I http://localhost:4000/api/config
```

**Expected Headers:**
```
HTTP/1.1 200 OK
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

✅ **Pass if:** Có đầy đủ security headers

---

## 🛠️ Automated Testing với Postman

### Import Collection

**File:** `security-tests.postman_collection.json`

```json
{
  "info": {
    "name": "Security Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "XSS - Script Tag",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"phone\":\"0909111111\",\"name\":\"<script>alert('XSS')</script>\"}"
        },
        "url": "http://localhost:4000/api/players/register"
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Name escaped HTML entities', function() {",
            "  const jsonData = pm.response.json();",
            "  pm.expect(jsonData.data.player.name).to.include('&lt;script&gt;');",
            "});"
          ]
        }
      }]
    },
    {
      "name": "Invalid Phone Format",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"phone\":\"1234567890\",\"name\":\"Test\"}"
        },
        "url": "http://localhost:4000/api/players/register"
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('Status is 400', function() {",
            "  pm.response.to.have.status(400);",
            "});",
            "pm.test('Error code is VALIDATION_ERROR', function() {",
            "  const jsonData = pm.response.json();",
            "  pm.expect(jsonData.error.code).to.eql('VALIDATION_ERROR');",
            "});"
          ]
        }
      }]
    }
  ]
}
```

### Chạy Tests
```bash
# Install Newman (CLI)
npm install -g newman

# Run collection
newman run security-tests.postman_collection.json
```

---

## 📊 Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| XSS - Script Tag | ✅ / ❌ | |
| XSS - Special Chars | ✅ / ❌ | |
| Phone Invalid Format | ✅ / ❌ | |
| Phone Valid Formats | ✅ / ❌ | |
| Missing Required Field | ✅ / ❌ | |
| Whitespace Trimming | ✅ / ❌ | |
| DoS Large Payload | ✅ / ❌ | |
| Parameter Pollution | ✅ / ❌ | |
| CORS Unauthorized | ✅ / ❌ | |
| CORS Authorized | ✅ / ❌ | |
| Rate Limiting | ✅ / ❌ | |
| Security Headers | ✅ / ❌ | |

---

## 🐛 Debugging Tips

### 1. Log Validation Errors
```typescript
// src/middlewares/validation.middleware.ts
catch (error) {
  if (error instanceof ZodError) {
    console.log('Validation failed:', error.errors); // Debug log
    // ...
  }
}
```

### 2. Log CORS Requests
```typescript
// src/app.ts
app.use(cors({
  origin: (origin, callback) => {
    console.log('Request from origin:', origin); // Debug log
    // ...
  }
}));
```

### 3. Test HPP Effectiveness
```typescript
// src/app.ts
app.use((req, res, next) => {
  console.log('Query params:', req.query); // Debug log
  next();
});
app.use(hpp({ whitelist: ['page', 'limit', 'status'] }));
```

---

## ✅ Checklist trước khi Deploy Production

- [ ] Tất cả 12 test cases đều pass
- [ ] Security headers xuất hiện đầy đủ
- [ ] CORS chỉ cho phép production domain
- [ ] Body limit = 10kb (trừ file upload)
- [ ] Rate limiting hoạt động
- [ ] Validation errors có format chuẩn
- [ ] XSS protection enabled
- [ ] HPP middleware enabled
- [ ] HTTPS được enable (production)
- [ ] Environment variables được set đúng

---

**Happy Testing! 🚀**
