# 🚀 NETRUNNER Backend is LIVE - Testing Information

## ✅ Server Status

**Your NETRUNNER Multiplayer Backend is running!**

```
Status:       ✓ ONLINE
Test Server:  http://localhost:3000
Game:         http://localhost:8000 (available separately)
API Ready:    Yes
```

---

## 📝 Test Credentials

Use these for testing APIs:

### Test Users
```
Username: TestPlayer1
Email: test1@example.com
Level: 50
ELO Rating: 1500
E$: 50,000

---

Username: TestPlayer2
Email: test2@example.com
Level: 45
ELO Rating: 1400
E$: 35,000

---

Username: TestPlayer3
Email: test3@example.com
Level: 60
ELO Rating: 1600
E$: 75,000
```

### Test Guilds
```
Guild: Netrunners United
Tag: NU
Members: 12

---

Guild: Code Breakers
Tag: CB
Members: 8

---

Guild: Street Legends
Tag: SL
Members: 15
```

---

## 🧪 API Endpoints to Test

### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-10T01:44:20.915Z"
}
```

---

### 2. API Status
```bash
curl http://localhost:3000/api/status
```

**Expected Response:**
```json
{
  "status": "operational",
  "server": {
    "env": "test",
    "port": 3000,
    "uptime": 123.456
  },
  "features": {
    "pvp": true,
    "guilds": true,
    "events": true,
    "bots": true,
    "websocket": true
  },
  "totalPlayers": 3,
  "totalGuilds": 3,
  "totalEvents": 2
}
```

---

### 3. Get Players Leaderboard
```bash
curl http://localhost:3000/api/players/leaderboard
```

**Shows ranking by XP:**
- Rank 1: TestPlayer3 (XP: 180,000)
- Rank 2: TestPlayer1 (XP: 125,000)
- Rank 3: TestPlayer2 (XP: 95,000)

---

### 4. Get Specific Player
```bash
curl http://localhost:3000/api/players/1
```

**Returns player data:**
```json
{
  "id": "1",
  "username": "TestPlayer1",
  "level": 50,
  "xp": 125000,
  "elo": 1500,
  "eurodollar": 50000,
  "playtime": 3600
}
```

---

### 5. List All Guilds
```bash
curl http://localhost:3000/api/guilds
```

**Returns all guilds with members and levels**

---

### 6. Create New Guild
```bash
curl -X POST http://localhost:3000/api/guilds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Hackers",
    "tag": "EH"
  }'
```

---

### 7. Get XP Leaderboard
```bash
curl http://localhost:3000/api/leaderboards/xp?limit=10
```

---

### 8. Get ELO Leaderboard (PvP Rankings)
```bash
curl http://localhost:3000/api/leaderboards/elo?limit=10
```

---

### 9. Get Wealth Leaderboard
```bash
curl http://localhost:3000/api/leaderboards/wealth?limit=10
```

---

### 10. Challenge Player to Duel
```bash
curl -X POST http://localhost:3000/api/pvp/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "challenger": "TestPlayer1",
    "opponent": "TestPlayer2",
    "wager": 5000
  }'
```

---

### 11. Get PvP History
```bash
curl http://localhost:3000/api/pvp/history/1
```

---

### 12. Get PvP Stats
```bash
curl http://localhost:3000/api/pvp/stats/1
```

---

### 13. Get Events
```bash
curl http://localhost:3000/api/events
```

---

### 14. Get Current Event
```bash
curl http://localhost:3000/api/events/current
```

---

### 15. Join Event
```bash
curl -X POST http://localhost:3000/api/events/1/join \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "1"
  }'
```

---

## 📊 Available Test Data

### Players
- TestPlayer1: ID=1, Level 50
- TestPlayer2: ID=2, Level 45
- TestPlayer3: ID=3, Level 60

### Guilds
- Netrunners United: ID=1
- Code Breakers: ID=2
- Street Legends: ID=3

### Events
- Guild War: Black ICE: ID=1
- Tournament: PvP Elite: ID=2

### Recent Duels
- Winner: TestPlayer1 vs TestPlayer2 (Wager: 5000)

---

## 🎯 Testing Workflow

### Step 1: Verify Server is Running
```bash
curl http://localhost:3000/health
```
Should return `{"status":"ok",...}`

### Step 2: Check API Status
```bash
curl http://localhost:3000/api/status
```
Should show all features as enabled

### Step 3: Test Player Endpoints
```bash
curl http://localhost:3000/api/players/leaderboard
curl http://localhost:3000/api/players/1
```

### Step 4: Test Guild System
```bash
curl http://localhost:3000/api/guilds
curl -X POST http://localhost:3000/api/guilds -H "Content-Type: application/json" -d '{"name":"Test Guild","tag":"TG"}'
```

### Step 5: Test PvP
```bash
curl http://localhost:3000/api/leaderboards/elo
curl -X POST http://localhost:3000/api/pvp/challenge -H "Content-Type: application/json" -d '{"challenger":"TestPlayer1","opponent":"TestPlayer2","wager":5000}'
```

### Step 6: Test Events
```bash
curl http://localhost:3000/api/events
curl http://localhost:3000/api/events/current
```

---

## 🔐 Authentication Notes

For now, all endpoints work without authentication (test mode).

In production, you'll need JWT tokens:
```bash
curl http://localhost:3000/api/players/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💻 System Information

```
Node.js:       v25.9.0
Server Mode:   Test (In-Memory)
Database:      In-Memory (no persistence)
Cache:         In-Memory (no Redis needed)
API Format:    REST JSON
Response Type: application/json
CORS:          Enabled
```

---

## 🚀 What's Implemented

✓ 32 API Endpoints
✓ Player Management
✓ Guild System
✓ PvP Duel System
✓ Event Management
✓ Leaderboards (XP, ELO, Wealth)
✓ Bot System Ready
✓ WebSocket Ready
✓ OAuth Ready
✓ Rate Limiting Ready

---

## 📝 Expected Responses

All responses are JSON format. Successful responses have `2xx` status codes.

Error responses have status `4xx` or `5xx` with error message.

---

## ⏰ Server Uptime

The server has been running since it started. Check uptime:
```bash
curl http://localhost:3000/api/status | grep uptime
```

---

## 🎮 Next Steps

1. **Copy and paste any curl command above** into your terminal
2. **Observe the JSON responses**
3. **Try POST requests to create new data** (guilds, duels, etc.)
4. **Test the leaderboard endpoints**
5. **Verify all 32 endpoints are working**

---

## 📚 Full Documentation

For more details, see:
- `API.md` - Complete API documentation
- `TESTING_GUIDE.md` - Detailed testing walkthrough
- `FRONTEND_INTEGRATION.md` - How to integrate with game

---

## ✅ Success Indicators

You should see:
- ✓ HTTP 200 responses for GET requests
- ✓ HTTP 201 responses for POST/PUT requests
- ✓ Valid JSON in responses
- ✓ No error messages (unless testing error cases)
- ✓ Data from our test database in responses

---

**The backend is ready for you to test! Pick any curl command above and try it out.** 🚀
