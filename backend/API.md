# NETRUNNER Multiplayer API Documentation

Complete API reference for the NETRUNNER multiplayer backend server.

## Base URL

```
http://localhost:5000
```

## Authentication

Most endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via:
1. `/auth/register` - Create account with email/password
2. `/auth/login` - Login with email/password
3. `/auth/github` - OAuth with GitHub
4. `/auth/google` - OAuth with Google

Token expires in 7 days by default.

---

## Authentication Endpoints

### Register Account

**POST** `/auth/register`

Create a new player account with email and password.

**Request Body:**
```json
{
  "username": "netrunner_001",
  "email": "player@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}
```

**Response (201):**
```json
{
  "message": "Player registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "netrunner_001",
    "displayName": "netrunner_001",
    "avatar": null,
    "gameLevel": 1,
    "prestigeLevel": 0,
    "rank": 0,
    "winRate": 0,
    "isBot": false
  }
}
```

**Errors:**
- 400: Missing required fields, password mismatch, password too short
- 409: Username or email already taken

---

### Login

**POST** `/auth/login`

Login with email and password to get JWT token.

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "player": { ... }
}
```

**Errors:**
- 400: Missing email or password
- 401: Invalid credentials

---

### GitHub OAuth

**GET** `/auth/github`

Redirect to GitHub OAuth login page.

**Callback:** `/auth/github/callback`
- On success: Redirects to game with `?token=<jwt>&username=<username>`
- On failure: Redirects to game with `?error=<error_code>`

---

### Google OAuth

**GET** `/auth/google`

Redirect to Google OAuth login page.

**Callback:** `/auth/google/callback`
- On success: Redirects to game with `?token=<jwt>&username=<username>`
- On failure: Redirects to game with `?error=<error_code>`

---

### Get Current Player

**GET** `/auth/me`

Get the current logged-in player's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "netrunner_001",
    "email": "player@example.com",
    "displayName": "netrunner_001",
    "avatar": null,
    "gameLevel": 1,
    "prestigeLevel": 0,
    "rank": 0,
    "winRate": 0,
    "isBot": false
  }
}
```

**Errors:**
- 401: Invalid or missing token
- 404: Player not found

---

### Refresh Token

**POST** `/auth/refresh`

Get a new JWT token without re-authenticating.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Token refreshed",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Player Endpoints

### Get Player Profile

**GET** `/api/players/:id`

Get a player's profile and public stats.

**Parameters:**
- `id` (path): Player ID (MongoDB ObjectId)

**Response (200):**
```json
{
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "netrunner_001",
    "displayName": "Netrunner",
    "avatar": "https://...",
    "level": 25,
    "prestigeLevel": 0,
    "winRate": 55.5,
    "rank": 1250,
    "duelsWon": 11,
    "duelsLost": 9,
    "guildId": "507f1f77bcf86cd799439012",
    "bio": "Competitive netrunner"
  }
}
```

---

### Update Player Profile

**PUT** `/api/players/:id`

Update your own player profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "displayName": "Elite Netrunner",
  "bio": "Climbing the ranks",
  "avatar": "https://example.com/avatar.png"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "player": { ... }
}
```

**Errors:**
- 400: Invalid field length
- 403: Cannot update other players' profiles
- 404: Player not found

---

### Sync Game Progress

**POST** `/api/players/:id/sync`

Synchronize game progress from single-player save to multiplayer profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "gameData": {
    "level": 50,
    "totalXP": 5000000,
    "skills": { "intrusion": { "level": 50, "xp": 100000 }, ... },
    "inventory": { "data_shard": 50, "neural_implant": 10, ... },
    "equipment": {
      "weapon": { "id": "mantis_blade", "damage": 20 },
      "armor": { "id": "obsidian_plating", "defense": 15 },
      "cyberware": { "id": "godlike_implant", "damage": 10, "defense": 10 }
    },
    "currency": 50000,
    "prestige": { "level": 2, "points": 100, "totalResets": 2 },
    "achievements": ["first_duel", "level_50", ...],
    "playTime": 36000
  }
}
```

**Response (200):**
```json
{
  "message": "Game progress synced successfully",
  "lastSyncAt": "2026-04-09T12:00:00Z"
}
```

**Errors:**
- 400: Game data required
- 401: Not authenticated
- 403: Cannot sync other players' data
- 404: Player not found

---

### Get Player Stats

**GET** `/api/players/:id/stats`

Get detailed multiplayer statistics for a player.

**Response (200):**
```json
{
  "stats": {
    "playerId": "507f1f77bcf86cd799439011",
    "username": "netrunner_001",
    "level": 50,
    "prestigeLevel": 2,
    "playTime": 86400,
    "achievements": 24,
    "rank": 1250,
    "winRate": 55.5,
    "duelsWon": 11,
    "duelsLost": 9,
    "currencyWon": 25000,
    "currencyLost": 15000,
    "guildId": "507f1f77bcf86cd799439012",
    "createdAt": "2026-01-01T00:00:00Z",
    "lastLoginAt": "2026-04-09T10:00:00Z",
    "lastSyncAt": "2026-04-09T12:00:00Z"
  }
}
```

---

### Get Player's Guild

**GET** `/api/players/:id/guild`

Get information about the player's current guild.

**Response (200):**
```json
{
  "guild": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Neon Shadows",
    "description": "Elite PvP guild",
    "icon": "🌙",
    "leader": { ... },
    "memberCount": 25,
    "level": 5,
    "joinPolicy": "invite_only",
    "treasury": {
      "currency": 50000,
      "totalContributed": 100000
    },
    "wars": {
      "consecutiveWins": 8,
      "totalWarsWon": 15,
      "totalWarsLost": 3
    },
    "bonuses": {
      "xpMultiplier": 1.05,
      "currencyMultiplier": 1.03,
      "lootBonus": 0.10
    },
    "perks": {
      "bankSlots": 20,
      "memberLimit": 50,
      "warReward": 1.5
    }
  }
}
```

**Errors:**
- 404: Player not found, player has no guild, or guild not found

---

### Leave Guild

**POST** `/api/players/:id/guild/leave`

Leave the player's current guild.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Left guild successfully"
}
```

**Errors:**
- 400: Player is not in a guild
- 403: Cannot modify other players' guild membership
- 404: Player not found

---

### Search Players

**GET** `/api/players/search/:query`

Search for players by username or display name.

**Parameters:**
- `query` (path): Search string (min 2 characters)
- `limit` (query): Maximum results (default 10, max 100)

**Example:** `GET /api/players/search/neon?limit=20`

**Response (200):**
```json
{
  "query": "neon",
  "count": 3,
  "players": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "neon_blade",
      "displayName": "Neon Blade",
      "avatar": "https://...",
      "level": 75,
      "rank": 850
    },
    { ... }
  ]
}
```

---

## Guild Endpoints

### Create Guild

**POST** `/api/guilds`

Create a new guild.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Neon Shadows",
  "description": "Elite competitive guild",
  "icon": "🌙",
  "joinPolicy": "invite_only"
}
```

**Response (201):**
```json
{
  "message": "Guild created successfully",
  "guild": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Neon Shadows",
    "leaderId": "507f1f77bcf86cd799439011",
    "memberCount": 1
  }
}
```

**Errors:**
- 400: Invalid guild name length, player already in guild
- 409: Guild name already taken

---

### Get Guild Info

**GET** `/api/guilds/:id`

Get detailed information about a guild.

**Parameters:**
- `id` (path): Guild ID (MongoDB ObjectId)

**Response (200):**
```json
{
  "guild": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Neon Shadows",
    "description": "Elite competitive guild",
    "icon": "🌙",
    "leader": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "netrunner_001"
    },
    "memberCount": 25,
    "level": 5,
    "joinPolicy": "invite_only",
    "treasury": {
      "currency": 50000,
      "totalContributed": 100000
    },
    "wars": {
      "consecutiveWins": 8,
      "totalWarsWon": 15,
      "totalWarsLost": 3
    },
    "bonuses": { ... },
    "perks": { ... }
  }
}
```

---

### Update Guild Settings

**PUT** `/api/guilds/:id`

Update guild settings (leader only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Neon Shadows Elite",
  "description": "Ultra-competitive guild",
  "icon": "⚡",
  "joinPolicy": "application",
  "pvpEnabled": true
}
```

**Response (200):**
```json
{
  "message": "Guild updated successfully",
  "guild": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Neon Shadows Elite",
    "description": "Ultra-competitive guild"
  }
}
```

**Errors:**
- 403: Only guild leader can update
- 404: Guild not found
- 409: New guild name already taken

---

### Get Guild Members

**GET** `/api/guilds/:id/members`

Get list of all guild members with stats.

**Response (200):**
```json
{
  "guildId": "507f1f77bcf86cd799439012",
  "memberCount": 25,
  "maxMembers": 50,
  "members": [
    {
      "playerId": "507f1f77bcf86cd799439011",
      "username": "netrunner_001",
      "displayName": "Netrunner",
      "avatar": "https://...",
      "role": "leader",
      "joinedAt": "2026-01-01T00:00:00Z",
      "contributedDamage": 50000,
      "level": 75,
      "rank": 850
    },
    { ... }
  ]
}
```

---

### Invite Player to Guild

**POST** `/api/guilds/:id/invite`

Invite a player to the guild (leader/officer only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "targetPlayerId": "507f1f77bcf86cd799439013"
}
```

**Response (200):**
```json
{
  "message": "Player invited to guild successfully",
  "memberCount": 26
}
```

**Errors:**
- 400: Guild is full, target already in guild, target already a member
- 403: Only leaders/officers can invite
- 404: Guild not found, target player not found

---

### Remove Guild Member

**DELETE** `/api/guilds/:id/members/:memberId`

Remove a member from the guild (leader/officer only).

**Headers:** `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Guild ID
- `memberId` (path): Member's Player ID to remove

**Response (200):**
```json
{
  "message": "Member removed from guild",
  "memberCount": 24
}
```

**Errors:**
- 400: Cannot remove guild leader
- 403: Only leaders/officers can remove members
- 404: Guild not found

---

### Contribute to Guild Treasury

**POST** `/api/guilds/:id/treasury/contribute`

Contribute currency to guild treasury.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 5000
}
```

**Response (200):**
```json
{
  "message": "Contributed to guild treasury",
  "playerCurrency": 45000,
  "guildTreasury": 55000
}
```

**Errors:**
- 400: Invalid amount, player not in guild, insufficient currency
- 404: Guild not found

---

## Leaderboard Endpoints

### Get Top Players

**GET** `/api/leaderboards/players`

Get top players ranked by ELO rating.

**Query Parameters:**
- `limit` (default 100, max 1000): Number of players to return
- `offset` (default 0): Number of players to skip for pagination

**Example:** `GET /api/leaderboards/players?limit=50&offset=0`

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "playerId": "507f1f77bcf86cd799439011",
      "username": "netrunner_001",
      "displayName": "Netrunner",
      "avatar": "https://...",
      "level": 99,
      "prestigeLevel": 5,
      "eloRating": 2500,
      "winRate": 68.5,
      "duelsWon": 68,
      "duelsLost": 31,
      "joinedAt": "2026-01-01T00:00:00Z"
    },
    { ... }
  ],
  "pagination": {
    "total": 1250,
    "limit": 50,
    "offset": 0,
    "pages": 25
  }
}
```

---

### Get Period Leaderboard

**GET** `/api/leaderboards/players/:period`

Get leaderboard for a specific time period.

**Parameters:**
- `period` (path): One of `daily`, `weekly`, `monthly`
- `limit` (query): Maximum results (default 50)

**Response (200):**
```json
{
  "period": "weekly",
  "leaderboard": [
    {
      "rank": 1,
      "playerId": "507f1f77bcf86cd799439011",
      "username": "netrunner_001",
      "displayName": "Netrunner",
      "avatar": "https://...",
      "level": 99,
      "eloRating": 2500,
      "winRate": 68.5,
      "duelsWon": 68
    },
    { ... }
  ]
}
```

---

### Get Top Guilds

**GET** `/api/leaderboards/guilds`

Get top guilds ranked by consecutive wins or other metrics.

**Query Parameters:**
- `limit` (default 50, max 500): Number of guilds to return
- `offset` (default 0): Number of guilds to skip
- `sortBy`: One of `consecutiveWins` (default), `totalWarsWon`, `level`

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "guildId": "507f1f77bcf86cd799439012",
      "name": "Neon Shadows",
      "icon": "🌙",
      "leaderId": "507f1f77bcf86cd799439011",
      "leaderName": "netrunner_001",
      "level": 8,
      "memberCount": 45,
      "consecutiveWins": 15,
      "totalWarsWon": 42,
      "totalWarsLost": 8,
      "treasury": 500000,
      "createdAt": "2026-01-01T00:00:00Z"
    },
    { ... }
  ],
  "pagination": {
    "total": 325,
    "limit": 50,
    "offset": 0,
    "pages": 7
  }
}
```

---

### Get Player Rank

**GET** `/api/leaderboards/player/:id/rank`

Get a specific player's rank with nearby competitors.

**Parameters:**
- `id` (path): Player ID

**Response (200):**
```json
{
  "playerId": "507f1f77bcf86cd799439011",
  "username": "netrunner_001",
  "rank": 42,
  "eloRating": 1850,
  "winRate": 55.5,
  "nearby": [
    {
      "rank": 37,
      "username": "rival_001",
      "displayName": "Rival",
      "eloRating": 1900
    },
    { ... },
    {
      "rank": 47,
      "username": "up_and_coming",
      "displayName": "Rising Star",
      "eloRating": 1800
    }
  ]
}
```

---

### Get Leaderboard Statistics

**GET** `/api/leaderboards/stats`

Get global leaderboard statistics.

**Response (200):**
```json
{
  "players": {
    "total": 5230,
    "active": 1850,
    "topPlayer": {
      "username": "netrunner_001",
      "eloRating": 2500
    }
  },
  "guilds": {
    "total": 325,
    "topGuild": {
      "name": "Neon Shadows",
      "consecutiveWins": 15
    }
  },
  "global": {
    "totalDuels": 45230,
    "totalGuildWarWins": 8425
  }
}
```

---

## Health Check & Status

### Server Health Check

**GET** `/health`

Check server health and database connectivity.

**Response (200):**
```json
{
  "status": "ok",
  "server": {
    "env": "development",
    "port": 5000,
    "uptime": 3600.5
  },
  "database": {
    "connected": true,
    "state": "connected",
    "host": "localhost",
    "database": "netrunner"
  }
}
```

---

### Server Status

**GET** `/api/status`

Get detailed server status.

**Response (200):**
```json
{
  "status": "operational",
  "server": {
    "env": "development",
    "port": 5000,
    "uptime": 3600.5
  },
  "database": {
    "connected": true,
    "state": "connected",
    "host": "localhost",
    "database": "netrunner"
  },
  "features": {
    "pvp": true,
    "guilds": true,
    "events": true,
    "bots": true
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (name taken) |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

Rate limiting is enabled in production:
- 100 requests per 15 minutes per IP
- 50 requests per 15 minutes per authenticated user

---

## Pagination

Paginated endpoints return consistent pagination info:

```json
{
  "pagination": {
    "total": 1250,
    "limit": 50,
    "offset": 0,
    "pages": 25
  }
}
```

Use `offset` and `limit` query parameters to navigate:
- Get page 2: `offset=50&limit=50`
- Get page 3: `offset=100&limit=50`

---

## WebSocket Events (Coming Soon)

WebSocket support will be added in Phase 2 for:
- Real-time PvP duel updates
- Guild war damage tracking
- Player presence/status
- Chat and notifications

See [MULTIPLAYER_PLAN.md](../MULTIPLAYER_PLAN.md) for WebSocket event specifications.

---

## Integration Guide

### Syncing Game Progress

The multiplayer system uses a **unified progress model** where a single character is used for both single-player and multiplayer:

1. Player completes activity in single-player
2. Game saves progress to localStorage
3. When multiplayer is enabled, call `POST /api/players/:id/sync` to upload progress
4. Server stores multiplayer-relevant data (level, XP, prestige, achievements)
5. Next session fetches latest data and applies multiplayer bonuses
6. Equipment special effects (XP boost, loot boost, etc.) apply to single-player activities

### Setting Up OAuth

1. Create GitHub OAuth app at https://github.com/settings/developers
2. Create Google OAuth app at https://console.cloud.google.com/
3. Set callback URLs to match your deployment domain
4. Add CLIENT_ID and CLIENT_SECRET to `.env`
5. Users can login via `/auth/github` or `/auth/google`

### Getting Player Equipment

Call `POST /api/players/:id/sync` with full game data to persist equipment:

```json
{
  "gameData": {
    "equipment": {
      "weapon": { "id": "mantis_blade", "damage": 20 },
      "armor": { "id": "obsidian_plating", "defense": 15 },
      "cyberware": { "id": "godlike_implant" }
    }
  }
}
```

---

## Support

For questions or issues, see:
- [Backend README](./README.md)
- [Implementation Guide](../MULTIPLAYER_IMPLEMENTATION.md)
- [Game Design](../MULTIPLAYER_PLAN.md)
