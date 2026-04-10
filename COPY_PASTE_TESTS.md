# 🎯 COPY & PASTE THESE COMMANDS TO TEST

## The server is running! Try these commands in your terminal:

### Test 1: Simple Health Check
```
curl http://localhost:3000/health
```

### Test 2: Get Player Leaderboard
```
curl http://localhost:3000/api/players/leaderboard
```

### Test 3: Get All Guilds
```
curl http://localhost:3000/api/guilds
```

### Test 4: Get ELO Rankings (PvP)
```
curl http://localhost:3000/api/leaderboards/elo
```

### Test 5: Get Wealth Leaderboard
```
curl http://localhost:3000/api/leaderboards/wealth
```

### Test 6: Get Events
```
curl http://localhost:3000/api/events
```

### Test 7: Get Single Player (ID: 1)
```
curl http://localhost:3000/api/players/1
```

### Test 8: Get Player Stats (ID: 1)
```
curl http://localhost:3000/api/pvp/stats/1
```

### Test 9: Create New Guild (POST)
```
curl -X POST http://localhost:3000/api/guilds \
  -H "Content-Type: application/json" \
  -d '{"name":"My New Guild","tag":"MNG"}'
```

### Test 10: Challenge Player to Duel (POST)
```
curl -X POST http://localhost:3000/api/pvp/challenge \
  -H "Content-Type: application/json" \
  -d '{"challenger":"TestPlayer1","opponent":"TestPlayer2","wager":5000}'
```

### Test 11: Get PvP History (ID: 1)
```
curl http://localhost:3000/api/pvp/history/1
```

### Test 12: Join Event (POST)
```
curl -X POST http://localhost:3000/api/events/1/join \
  -H "Content-Type: application/json" \
  -d '{"playerId":"1"}'
```

### Test 13: Get Current Event
```
curl http://localhost:3000/api/events/current
```

### Test 14: Get XP Leaderboard (with limit)
```
curl "http://localhost:3000/api/leaderboards/xp?limit=10"
```

### Test 15: Get Specific Guild (ID: 1)
```
curl http://localhost:3000/api/guilds/1
```

---

## How to Use These Commands

1. **Open a terminal**
2. **Copy one of the commands above**
3. **Paste it and press Enter**
4. **See the JSON response!**

---

## Expected Responses

All commands should return JSON with `2xx` status codes.

Example response from Test 1:
```json
{"status":"ok","timestamp":"2026-04-10T01:44:20.915Z"}
```

Example response from Test 2:
```json
{
  "leaderboard": [
    {"rank": 1, "id": "3", "username": "TestPlayer3", "level": 60, "xp": 180000, "elo": 1600, "eurodollar": 75000, "playtime": 5400},
    {"rank": 2, "id": "1", "username": "TestPlayer1", "level": 50, "xp": 125000, "elo": 1500, "eurodollar": 50000, "playtime": 3600},
    {"rank": 3, "id": "2", "username": "TestPlayer2", "level": 45, "xp": 95000, "elo": 1400, "eurodollar": 35000, "playtime": 2800}
  ]
}
```

---

## Test Data Info

**Players:**
- TestPlayer1 (ID: 1)
- TestPlayer2 (ID: 2)
- TestPlayer3 (ID: 3)

**Guilds:**
- Netrunners United (ID: 1)
- Code Breakers (ID: 2)
- Street Legends (ID: 3)

**Events:**
- Guild War: Black ICE (ID: 1)
- Tournament: PvP Elite (ID: 2)

---

## Troubleshooting

**"Connection refused"?**
- Make sure server is running
- Server should be on port 3000
- Check with: `ps aux | grep node`

**"curl: command not found"?**
- Install curl or use another HTTP client
- Or use a REST client like Postman/Thunder Client

**No response?**
- Wait a few seconds and try again
- Check terminal for the test server process

---

## More Information

See `LIVE_TESTING.md` for complete details about all endpoints!
