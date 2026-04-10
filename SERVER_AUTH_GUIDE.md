# NETRUNNER Authentication & Admin System (v0.8.0)

## Overview

This document describes the complete authentication system, server-side save persistence, and admin panel for NETRUNNER. The system provides:

- **User Accounts**: Registration and login with password protection
- **Persistent Saves**: Game state stored on server, survives client reset
- **Remember Me**: Extended session duration option
- **Admin Panel**: IP-restricted management of players and server
- **Audit Logging**: Track all admin actions
- **IP Blocking**: Ban problematic IPs from the network
- **Player Moderation**: Ban, reset progress, nerf stats

---

## Architecture

### Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens) + Refresh Tokens
- **Password Security**: SHA-256 hashing
- **Port**: 3000 (default)

### Database Schema

#### Users & Authentication

```sql
users
  - id (PK)
  - username (UNIQUE)
  - password_hash (SHA-256)
  - email (optional)
  - created_at
  - last_login
  - is_banned (bool)
  - ban_reason
  - is_admin (bool)

sessions
  - id (PK)
  - user_id (FK)
  - access_token (JWT)
  - refresh_token (JWT)
  - expires_at
  - remember_me (bool)
  - created_at
  - ip_address
  - user_agent
```

#### Game Data

```sql
game_saves
  - id (PK)
  - user_id (FK)
  - save_data (JSON string)
  - version
  - save_timestamp
  - is_latest (bool)
  - is_backup (bool)
  - playtime_seconds
  - client_checksum

player_profiles
  - id (PK)
  - user_id (FK, UNIQUE)
  - total_xp
  - prestige_level
  - playtime_seconds
  - currency_earned
  - currency_spent
```

#### Admin & Moderation

```sql
admin_actions
  - id (PK)
  - admin_id (FK)
  - target_user_id (FK)
  - action_type (BAN, UNBAN, RESET, NERF, etc.)
  - description
  - details (JSON)
  - created_at

blocked_ips
  - id (PK)
  - ip_address (UNIQUE)
  - reason
  - blocked_by_admin (FK)
  - created_at
  - expires_at (NULL = permanent)

player_flags
  - id (PK)
  - user_id (FK)
  - flag_type (SUSPICIOUS_XP, SPEED_HACK, etc.)
  - reason
  - severity (LOW, MEDIUM, HIGH)
  - resolved (bool)
  - created_at
```

---

## API Endpoints

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "CyberRunner",
  "password": "SecurePass123",
  "email": "runner@example.com"  // optional
}

Response (201):
{
  "status": "success",
  "message": "Account created successfully",
  "user": { "id": 1, "username": "CyberRunner" },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "CyberRunner",
  "password": "SecurePass123",
  "rememberMe": true  // optional, extends session to 30 days
}

Response (200):
{
  "status": "success",
  "message": "Login successful",
  "user": { "id": 1, "username": "CyberRunner" },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "rememberMe": true
}
```

#### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "status": "success",
  "accessToken": "eyJhbGc..." // new access token
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "message": "Logged out"
}
```

#### Get Profile
```
GET /api/auth/me
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "user": {
    "id": 1,
    "username": "CyberRunner",
    "email": "runner@example.com",
    "isAdmin": false,
    "createdAt": "2026-04-10T...",
    "lastLogin": "2026-04-10T...",
    "stats": {
      "totalXP": 500000,
      "prestigeLevel": 3,
      "playtimeSeconds": 86400,
      "currencyEarned": 1000000
    }
  }
}
```

### Save Management Endpoints

#### Upload Save
```
POST /api/saves/upload
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "saveData": "{\"player\":{...},\"skills\":{...},...}",  // Full game state as JSON string
  "playtimeSeconds": 86400,
  "checksum": "abc123def456..."  // optional, for integrity checking
}

Response (200):
{
  "status": "success",
  "message": "Save uploaded successfully",
  "saveId": 42,
  "timestamp": "2026-04-10T10:00:00Z"
}
```

#### Download Latest Save
```
GET /api/saves/latest
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "save": {
    "id": 42,
    "data": { "player": {...}, "skills": {...}, ... },  // Parsed JSON
    "timestamp": "2026-04-10T10:00:00Z",
    "playtimeSeconds": 86400,
    "checksum": "abc123def456..."
  }
}
```

#### List All Saves
```
GET /api/saves/list
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "saves": [
    { "id": 42, "timestamp": "...", "playtimeSeconds": 86400, "isLatest": true, "isBackup": false },
    { "id": 41, "timestamp": "...", "playtimeSeconds": 82000, "isLatest": false, "isBackup": false },
    ...
  ]
}
```

#### Restore from Save
```
POST /api/saves/:saveId/restore
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "message": "Save restored successfully",
  "save": { "id": 41, "data": {...} }
}
```

### Admin Endpoints (192.168.1.X only)

#### List Users
```
GET /api/admin/users
Authorization: Bearer <accessToken>

Note: Must be admin AND from 192.168.1.X IP

Response (200):
{
  "status": "success",
  "count": 5,
  "users": [
    {
      "id": 1,
      "username": "CyberRunner",
      "email": "...",
      "isAdmin": true,
      "isBanned": false,
      "createdAt": "...",
      "lastLogin": "...",
      "stats": { "totalXP": 500000, "prestigeLevel": 3, ... }
    },
    ...
  ]
}
```

#### Get User Details
```
GET /api/admin/users/:userId
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "user": { ... },
  "adminActions": [
    { "action_type": "...", "description": "...", "created_at": "..." },
    ...
  ],
  "recentSaves": [ ... ]
}
```

#### Ban User
```
POST /api/admin/users/:userId/ban
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "reason": "Suspected botting - XP gain 2x expected rate"
}

Response (200):
{
  "status": "success",
  "message": "User CyberRunner has been banned",
  "user": { "id": 5, "username": "CyberRunner" }
}
```

#### Reset Player Progress
```
POST /api/admin/users/:userId/reset-progress
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "message": "Player CyberRunner's progress has been reset"
}
```

#### Nerf Player Stats
```
POST /api/admin/users/:userId/nerf
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "xpMultiplier": 0.5,          // Reduce XP to 50%
  "currencyMultiplier": 0.5,    // Reduce currency to 50%
  "reason": "Abnormal progression pattern detected"
}

Response (200):
{
  "status": "success",
  "message": "Player CyberRunner has been nerfed",
  "multipliers": { "xpMultiplier": 0.5, "currencyMultiplier": 0.5 }
}
```

#### Block IP
```
POST /api/admin/ips/block
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "ipAddress": "192.168.1.105",
  "reason": "Distributed hacking attempts",
  "expiresIn": 604800000  // 7 days in milliseconds (optional)
}

Response (200):
{
  "status": "success",
  "message": "IP 192.168.1.105 has been blocked",
  "expiresAt": "2026-04-17T10:00:00Z"
}
```

#### List Blocked IPs
```
GET /api/admin/ips/blocked
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "count": 2,
  "blockedIPs": [
    { "ip_address": "192.168.1.105", "reason": "...", "created_at": "...", "expires_at": "..." },
    ...
  ]
}
```

#### Admin Actions Audit Log
```
GET /api/admin/actions
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "count": 10,
  "actions": [
    { "admin_name": "admin", "target_name": "player", "action_type": "BAN", "description": "...", "created_at": "..." },
    ...
  ]
}
```

#### Server Statistics
```
GET /api/admin/stats
Authorization: Bearer <accessToken>

Response (200):
{
  "status": "success",
  "stats": {
    "totalUsers": 15,
    "bannedUsers": 2,
    "totalGameSaves": 150,
    "totalPlaytimeHours": 1200,
    "serverTime": "2026-04-10T10:00:00Z"
  }
}
```

---

## Deployment

### Start Server (Development)

```bash
cd /home/edve/netrunner/server
npm install  # First time only
npm run dev  # Watch mode with auto-reload
```

### Start Server (Production)

```bash
cd /home/edve/netrunner/server
npm install
npm run server
```

Server will listen on `http://0.0.0.0:3000` and serve both API and static files.

### Environment Variables

Create `.env` file in `/server/` directory:

```bash
PORT=3000
JWT_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=production
```

---

## Security Considerations

### Password Security

1. **Never store plaintext passwords** — All passwords hashed with SHA-256
2. **No password logging** — Passwords not logged or dumped
3. **HTTPS recommended** — Use HTTPS in production (not covered in this setup)

### JWT Security

1. **Short-lived access tokens** — 15 minutes, must refresh for longer sessions
2. **Refresh tokens separate** — Stored in secure session table
3. **Token verification** — Every protected endpoint verifies token
4. **Session binding** — Tokens tied to specific session record

### Admin Access

1. **IP-based filtering** — Admin endpoints require 192.168.1.X IP
2. **Never accessible from internet** — By design, only works on local network
3. **Audit logging** — Every admin action logged with timestamp and details

### IP Blocking

1. **Temporary bans** — Can set expiration for temporary IP blocks
2. **Permanent bans** — NULL expiration = never expires
3. **Checked on every request** — Blocked IPs denied access immediately

---

## Client-Side Integration (TODO)

The client UI needs to be updated to use this authentication system:

### Login Page
- Username input
- Password input
- Remember Me checkbox
- Register link
- Login button

### Registration Page
- Username input (3-32 chars)
- Password input (6+ chars)
- Email input (optional)
- Password strength indicator
- Register button

### Game UI Updates
- Auto-save game state to `/api/saves/upload` every 30 seconds
- Load latest save from `/api/saves/latest` on startup
- Show "Logged in as: <username>" in header
- Add logout button
- Add "Download Save" button for local backup
- Add "Restore Save" dialog

### Admin Panel (192.168.1.X only)
- User list with search/filter
- Player detail view with action buttons
- Ban/unban controls
- Reset progress confirmation
- Nerf stats dialog
- IP blocking interface
- Audit log viewer

---

## Troubleshooting

### "No token provided" Error
- Make sure `Authorization: Bearer <token>` header is sent
- Token must be from `/api/auth/login` response

### "Invalid token" Error
- Token may be expired (access tokens last 15 min)
- Use refresh token endpoint to get new access token
- Re-login if refresh token expired

### "Admin access restricted to 192.168.1.X" Error
- Admin endpoints only accessible from local network
- Your IP must be in 192.168.1.0/24 range
- Contact network admin if you need access

### IP Blocked Error
- Your IP address has been blocked
- Wait for block to expire or contact admin to unblock
- Temporary blocks have expiration timestamp

### Save Upload Failed
- Check that `saveData` is valid JSON string
- Game state may be corrupted
- Try downloading latest save first

---

## Next Steps

1. **Install dependencies**: `npm install` in server directory
2. **Start server**: `npm run dev` for development
3. **Test endpoints**: Use curl/Postman to test API
4. **Create admin account**: Register user, manually set `is_admin=1` in SQLite
5. **Integrate client**: Update game UI for login/register
6. **Test full flow**: Register → Login → Play → Auto-save → Logout → Login → Load save
7. **Test admin panel**: Access `/api/admin/users` from 192.168.1.X IP
8. **Test living world**: Verify contracts/leaderboards persist across sessions

---

## File Structure

```
server/
├── server.js                 # Express app + route setup
├── db.js                     # SQLite initialization + promisified wrapper
├── package.json              # Dependencies
├── middleware/
│   └── auth.js              # JWT + IP checking middleware
├── routes/
│   ├── auth.js              # Register, login, refresh, logout
│   ├── saves.js             # Save/load endpoints
│   ├── admin.js             # User management + admin actions
│   └── sync.js              # Existing multiplayer sync
├── models/
│   ├── player.js            # Existing player model
│   └── sync.js              # Existing sync model
└── game.db                  # SQLite database
```

---

## Version Information

- **Version**: 0.8.0 (April 10, 2026)
- **Backend**: Node.js + Express + SQLite3
- **Auth Method**: JWT tokens + Refresh tokens
- **Session Duration**: 7 days (30 with Remember Me)
- **Token Expiry**: 15 min access, 7 days refresh

---

## Support

For issues or questions:
1. Check error message in response JSON
2. Review admin actions audit log
3. Check server console output for errors
4. Verify IP address is in 192.168.1.X range for admin
5. Ensure all dependencies installed (`npm install`)
