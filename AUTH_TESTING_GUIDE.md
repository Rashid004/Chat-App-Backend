# Authentication Flow Testing Guide

Complete guide to test all authentication endpoints in your chat application backend.

## Base URL

```
http://localhost:5000/api/auth
```

## 📋 Table of Contents

1. [User Registration](#1-user-registration)
2. [Email Verification](#2-email-verification)
3. [User Login](#3-user-login)
4. [Refresh Access Token](#4-refresh-access-token)
5. [Change Password (Protected)](#5-change-password-protected)
6. [Forgot Password](#6-forgot-password)
7. [Reset Password](#7-reset-password)
8. [Logout (Protected)](#8-logout-protected)

---

## 1. User Registration

**Endpoint:** `POST /api/auth/register`
**Rate Limit:** 4 requests/hour (production), 20 requests/hour (development)
**Authentication:** Not required

### Request

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

### Request Body

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password123"
}
```

### Validation Rules

- `username`: Minimum 3 characters
- `email`: Valid email format
- `password`: Minimum 6 characters

### Success Response (201)

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "testuser@example.com",
      "role": "user",
      "isEmailVerified": false,
      "avatarUrl": {
        "url": "https://via.placeholder.com/200x200.png",
        "localPath": ""
      },
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

### Error Responses

- **400** - Validation error or user already exists
- **429** - Too many registration attempts

---

## 2. Email Verification

**Endpoint:** `GET /api/auth/verify-email/:verificationToken`
**Authentication:** Not required

### Request

```bash
curl -X GET http://localhost:5000/api/auth/verify-email/{YOUR_TOKEN_HERE}
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "isEmailVerified": true
  },
  "message": "Email verified successfully"
}
```

### Error Responses

- **400** - Invalid or expired verification token

**Note:** In a production environment, the verification token would be sent via email. For testing, you'll need to retrieve it from the database or implement a dev endpoint to get it.

---

## 3. User Login

**Endpoint:** `POST /api/auth/login`
**Rate Limit:** 5 requests/15min (production), 20 requests/15min (development)
**Authentication:** Not required

### Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

### Request Body (Option 1: Email)

```json
{
  "email": "testuser@example.com",
  "password": "password123"
}
```

### Request Body (Option 2: Username)

```json
{
  "username": "testuser",
  "password": "password123"
}
```

### Validation Rules

- Either `email` OR `username` is required
- `password`: Minimum 6 characters

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "testuser@example.com",
      "role": "user",
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User logged in successfully"
}
```

### Cookies Set

- `accessToken` (httpOnly, secure in production, sameSite: strict)
- `refreshToken` (httpOnly, secure in production, sameSite: strict)

### Error Responses

- **400** - Validation error
- **401** - Invalid credentials
- **429** - Too many login attempts

---

## 4. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh-token`
**Authentication:** Requires refresh token (from cookie or body)

### Request (using cookies)

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt
```

### Request (using body)

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "testuser@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Access token refreshed successfully"
}
```

### Error Responses

- **401** - Missing, invalid, or expired refresh token

---

## 5. Change Password (Protected)

**Endpoint:** `POST /api/auth/change-password`
**Rate Limit:** 5 requests/15min (production), 50 requests/15min (development)
**Authentication:** Required (JWT)

### Request

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "oldPassword": "password123",
    "newPassword": "newpassword456"
  }'
```

### Request Body

```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

### Validation Rules

- `oldPassword`: Minimum 6 characters
- `newPassword`: Minimum 6 characters

### Success Response (200)

```json
{
  "statusCode": 200,
  "data": {
    "message": "Password changed successfully"
  },
  "message": "Password changed successfully",
  "success": true
}
```

### Error Responses

- **400** - Invalid old password or validation error
- **401** - Unauthorized (missing or invalid token)
- **404** - User not found
- **429** - Too many requests

**Note:** After password change, all refresh tokens are cleared for security. User must log in again.

---

## 6. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`
**Rate Limit:** 3 requests/hour (production), 10 requests/hour (development)
**Authentication:** Not required

### Request

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

### Request Body

```json
{
  "email": "testuser@example.com"
}
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Password reset token generated",
    "resetToken": "a1b2c3d4e5f6..." // Only in development - remove in production
  },
  "message": "Password reset instructions sent to email if it exists"
}
```

### Error Responses

- **400** - Email validation error
- **429** - Too many password reset attempts

**Security Note:** For security, the response is the same whether the email exists or not. In production, the reset token should be sent via email only.

---

## 7. Reset Password

**Endpoint:** `POST /api/auth/reset-password/:resetToken`
**Rate Limit:** 3 requests/hour (production), 10 requests/hour (development)
**Authentication:** Not required

### Request

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/a1b2c3d4e5f6 \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "newpassword789"
  }'
```

### Request Body

```json
{
  "newPassword": "newpassword789"
}
```

### Validation Rules

- `newPassword`: Minimum 6 characters
- Reset token must be valid and not expired (20 minutes validity)

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  },
  "message": "Password reset successfully"
}
```

### Error Responses

- **400** - Invalid/expired token or password validation error
- **429** - Too many password reset attempts

**Note:** After successful password reset, all refresh tokens are cleared. User must log in again with the new password.

---

## 8. Logout (Protected)

**Endpoint:** `POST /api/auth/logout`
**Rate Limit:** 5 requests/15min (production), 50 requests/15min (development)
**Authentication:** Required (JWT)

### Request

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

### Success Response (200)

```json
{
  "success": true,
  "data": null,
  "message": "User logged out successfully"
}
```

### Cookies Cleared

- `accessToken`
- `refreshToken`

### Error Responses

- **401** - Unauthorized (missing or invalid token)
- **500** - Server error during logout

---

## 🧪 Complete Testing Flow

Here's a complete test sequence using curl:

```bash
# 1. Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"password123"}'

# Save the accessToken from response for protected routes

# 3. Change password (protected)
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt \
  -d '{"oldPassword":"password123","newPassword":"newpass456"}'

# 4. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt

# 5. Forgot password
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 6. Reset password (use token from step 5)
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"finalpass789"}'

# 7. Login with new password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"finalpass789"}'

# 8. Refresh token
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

---

## 🔐 Authentication Headers

### For Protected Routes

**Option 1: Bearer Token (Recommended)**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Option 2: Cookie**

```
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Rate Limiting

All endpoints have rate limiting configured:

| Endpoint           | Development | Production | Window |
| ------------------ | ----------- | ---------- | ------ |
| `/register`        | 20 req      | 4 req      | 1 hour |
| `/login`           | 20 req      | 5 req      | 15 min |
| `/logout`          | 50 req      | 5 req      | 15 min |
| `/change-password` | 50 req      | 5 req      | 15 min |
| `/forgot-password` | 10 req      | 3 req      | 1 hour |
| `/reset-password`  | 10 req      | 3 req      | 1 hour |
| Global API         | 1000 req    | 100 req    | 15 min |

### Rate Limit Response (429)

```json
{
  "success": false,
  "message": "Too many requests, please try again later.",
  "retryAfter": 1736935800
}
```

---

## 🛠️ Testing Tools

### Postman Collection

Import these as a Postman collection for easier testing.

### Thunder Client (VS Code)

Save requests in Thunder Client for quick testing.

### REST Client (VS Code)

Create a `.http` file with all requests.

---

## 🐛 Common Issues

### 1. Cookies not being set

- Make sure `CORS_ORIGIN` is properly configured in `.env`
- Check that `credentials: true` is set in CORS config
- Use the same domain for frontend and API or configure CORS properly

### 2. Token expired

- Access tokens expire in 15 minutes (default)
- Use refresh token to get a new access token
- Refresh tokens expire in 7 days (default)

### 3. Rate limit exceeded

- Wait for the time specified in `retryAfter`
- Or restart the server in development

### 4. Password reset token not working

- Tokens expire in 20 minutes
- Request a new token if expired
- Make sure you're using the unhashed token sent via email (in dev, returned in response)

---

## 📝 Environment Variables

Make sure these are set in your `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_ACCESS_TOKEN_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
```

---

## ✅ Authentication Flow Summary

```
┌─────────────────────┐
│   1. REGISTER       │ ──> Creates user account
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ 2. VERIFY EMAIL     │ ──> Verifies email address (optional)
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│   3. LOGIN          │ ──> Get access & refresh tokens
└─────────────────────┘
          │
          ├──────────────────────────────┐
          │                              │
          ▼                              ▼
┌─────────────────────┐       ┌─────────────────────┐
│ 4. USE PROTECTED    │       │ 5. REFRESH TOKEN    │
│    ROUTES           │       │    (when expired)   │
└─────────────────────┘       └─────────────────────┘
          │                              │
          ▼                              │
┌─────────────────────┐                  │
│ 6. CHANGE PASSWORD  │ ←────────────────┘
│    (optional)       │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│   7. LOGOUT         │ ──> Clears tokens
└─────────────────────┘
```

**Forgot Password Flow (Alternative):**

```
┌─────────────────────┐
│ FORGOT PASSWORD     │ ──> Request reset token
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Check Email         │ ──> Get reset token
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ RESET PASSWORD      │ ──> Set new password
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ LOGIN (new pass)    │ ──> Login with new password
└─────────────────────┘
```
