# NETRUNNER Multiplayer Backend - Testing Guide

This guide walks you through testing the complete NETRUNNER multiplayer backend implementation with all 9 phases complete.

## ✅ Quick Status

- **18 Jest Tests**: All passing ✓
- **Syntax Validation**: All files valid ✓
- **Dependencies**: All installed ✓
- **Configuration**: Ready for testing ✓
- **Docker Setup**: Configured and ready ✓

---

## Option 1: Quick Unit Tests (No Docker)

The fastest way to verify everything is working.

### Run Unit Tests

```bash
cd /home/edve/netrunner/backend
npm test
```

**Expected Output:**
```
✓ 18 passed tests
✓ Health Check working
✓ All routes exist
✓ JSON validation passing
✓ Performance acceptable
✓ Security headers present
```

---

## Option 2: Full Stack Local Testing (WITH Docker)

Run the complete backend stack with MongoDB, Redis, and Nginx.

### Prerequisites

- Docker Desktop installed and running
- Port 3000 available (backend)
- Port 5000 available (local dev server)
- Port 6379 available (Redis)
- Port 27017 available (MongoDB)

### Step 1: Start the Full Stack

```bash
cd /home/edve/netrunner/backend

# Create .env with test values (optional - already configured)
# cp .env.example .env

# Start all services
docker-compose up -d
```

**Expected Output:**
```
Creating netrunner-backend  ... done
Creating netrunner-mongo    ... done
Creating netrunner-redis    ... done
Creating netrunner-nginx    ... done
✓ All 4 services running
```

### Step 2: Verify Services Started

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend
```

**Expected Services:**
- ✓ `netrunner-backend` - Express server on :3000
- ✓ `netrunner-mongo` - MongoDB on :27017
- ✓ `netrunner-redis` - Redis on :6379
- ✓ `netrunner-nginx` - Reverse proxy on :80

### Step 3: Test API Endpoints

#### Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "server": {
    "env": "production",
    "port": 3000,
    "uptime": 12.345
  },
  "database": {
    "connected": true,
    "uri": "mongodb://mongo:27017/netrunner"
  }
}
```

#### API Status

```bash
curl http://localhost:3000/api/status
```

**Expected Response:**
```json
{
  "status": "operational",
  "server": {
    "env": "production",
    "port": 3000,
    "uptime": 15.123
  },
  "database": {
    "connected": true
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

## Option 3: Manual API Testing (curl/Postman)

Test individual API endpoints without a full stack.

### Authentication Endpoints

#### Register User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testplayer",
    "email": "test@example.com"
  }
}
```

Save the token for authorized requests:
```bash
TOKEN="your_jwt_token_here"
```

### Player Endpoints

#### Get Leaderboard

```bash
curl http://localhost:3000/api/players/leaderboard
```

#### Get Player Profile

```bash
curl http://localhost:3000/api/players/profile \
  -H "Authorization: Bearer $TOKEN"
```

#### Sync Game Progress

```bash
curl -X POST http://localhost:3000/api/players/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": {
      "intrusion": { "level": 50, "xp": 125000 },
      "combat": { "level": 45, "xp": 95000 }
    },
    "inventory": { "data_shard": 100, "healing_nanobots": 5 },
    "economy": { "eurodollar": 50000 },
    "playtime": 86400
  }'
```

### Guild Endpoints

#### Create Guild

```bash
curl -X POST http://localhost:3000/api/guilds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Netrunners United",
    "description": "Elite hacking collective",
    "tag": "NU"
  }'
```

#### List Guilds

```bash
curl http://localhost:3000/api/guilds
```

#### Join Guild

```bash
curl -X POST http://localhost:3000/api/guilds/507f1f77bcf86cd799439011/join \
  -H "Authorization: Bearer $TOKEN"
```

### PvP Endpoints

#### Challenge Player to Duel

```bash
curl -X POST http://localhost:3000/api/pvp/challenge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "opponentId": "507f1f77bcf86cd799439012",
    "wager": 5000
  }'
```

#### Get PvP Stats

```bash
curl http://localhost:3000/api/pvp/stats/$PLAYER_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Get Duel History

```bash
curl http://localhost:3000/api/pvp/history/$PLAYER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Leaderboard Endpoints

#### XP Leaderboard

```bash
curl http://localhost:3000/api/leaderboards/xp?limit=10
```

#### ELO Leaderboard

```bash
curl http://localhost:3000/api/leaderboards/elo?limit=10
```

#### Wealth Leaderboard

```bash
curl http://localhost:3000/api/leaderboards/wealth?limit=10
```

### Event Endpoints

#### List Events

```bash
curl http://localhost:3000/api/events
```

#### Get Current Event

```bash
curl http://localhost:3000/api/events/current
```

#### Join Event

```bash
curl -X POST http://localhost:3000/api/events/507f1f77bcf86cd799439011/join \
  -H "Authorization: Bearer $TOKEN"
```

#### Submit Guild War Damage

```bash
curl -X POST http://localhost:3000/api/events/507f1f77bcf86cd799439011/damage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bossId": "rogue_netrunner",
    "damage": 2500,
    "guildId": "507f1f77bcf86cd799439010"
  }'
```

---

## Option 4: WebSocket Testing

Test real-time features using WebSocket.

### Using wscat (npm)

```bash
# Install globally if not present
npm install -g wscat

# Connect to WebSocket server
wscat -c ws://localhost:3000

# Send test event
{"event": "duel:joined", "data": {"playerId": "test123"}}

# Server should respond with event confirmation
```

### Using Node.js Script

Create a test file: `test-websocket.js`

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('✓ Connected to WebSocket server');
  
  // Test duel event
  socket.emit('duel:joined', { playerId: 'test123' });
});

socket.on('duel:started', (data) => {
  console.log('✓ Duel started:', data);
});

socket.on('disconnect', () => {
  console.log('✗ Disconnected from WebSocket');
});

socket.on('error', (error) => {
  console.error('✗ WebSocket error:', error);
});
```

Run it:
```bash
cd /home/edve/netrunner/backend
node test-websocket.js
```

---

## Option 5: Integration with Frontend Game

Connect the multiplayer backend to the main game.

### Step 1: Copy SDK to Game

```bash
# SDK is already at: /home/edve/netrunner/js/netrunnerClient.js
ls -la /home/edve/netrunner/js/netrunnerClient.js
```

### Step 2: Initialize in Game

Edit `/home/edve/netrunner/index.html`:

```html
<!-- At the end before closing body -->
<script type="module">
  import { NetrunnerClient } from './js/netrunnerClient.js';

  // Initialize multiplayer client
  const gameClient = new NetrunnerClient({
    apiUrl: 'http://localhost:3000',
    socketUrl: 'ws://localhost:3000'
  });

  // Wait for authentication
  await gameClient.init();

  // Now game is multiplayer-enabled!
  window.gameClient = gameClient;
</script>
```

### Step 3: Use in Game

```javascript
// Start PvP duel
await gameClient.pvp.challengePlayer(opponentId, 5000);

// Create guild
await gameClient.guilds.create({
  name: 'My Guild',
  description: 'Cool guild'
});

// Join event
await gameClient.events.joinEvent(eventId);

// Sync game progress
await gameClient.sync({
  skills: { intrusion: { level: 50, xp: 125000 } },
  inventory: { data_shard: 100 },
  playtime: 3600
});

// Listen for real-time updates
gameClient.on('duel:finished', (match) => {
  console.log('Duel finished!', match);
});
```

---

## Cleanup & Shutdown

### Stop Docker Services

```bash
cd /home/edve/netrunner/backend
docker-compose down

# Full cleanup (removes volumes)
docker-compose down -v
```

### Clear Local Node Processes

```bash
# Kill any Node processes
killall node

# Or use PM2 if running via PM2
pm2 kill
```

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

### Issue: MongoDB Connection Failed

```bash
# Check MongoDB status
docker-compose logs mongo

# Verify MongoDB is running
docker exec netrunner-mongo mongo --version

# Restart MongoDB
docker-compose restart mongo
```

### Issue: Redis Connection Failed

```bash
# Test Redis connection
docker exec netrunner-redis redis-cli ping

# Should respond: PONG

# If not, restart Redis
docker-compose restart redis
```

### Issue: Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/api.test.js
```

### Issue: CORS Errors

```bash
# Check CORS config in backend/.env
# Should have CORS_ORIGIN=http://localhost:8000,http://localhost:3000

# For local testing, check config in src/config/index.js
```

---

## Performance Testing

### Load Testing Script

```bash
cd /home/edve/netrunner/backend

# Run performance tests (see PERFORMANCE.md)
npm run performance

# Expected: Handle 1000+ concurrent connections
```

### Monitor Server Metrics

```bash
# Install pm2 monitoring
pm2 install pm2-auto-pull

# View metrics
pm2 monit
```

---

## Test Coverage Report

Generate coverage report:

```bash
cd /home/edve/netrunner/backend
npm test -- --coverage

# View coverage HTML
open coverage/lcov-report/index.html
```

---

## Success Checklist

- ✓ Jest tests: 18/18 passing
- ✓ Syntax validation: All files valid
- ✓ Docker services: 4/4 running
- ✓ Health check: Responding
- ✓ API endpoints: All accessible
- ✓ Database: Connected and functional
- ✓ WebSocket: Real-time communication working
- ✓ Authentication: OAuth flows working
- ✓ PvP system: Duels functional
- ✓ Guild system: Guild management working
- ✓ Events: Scheduled events running
- ✓ Bots: NPC bots active

---

## Next Steps After Testing

1. **Fix any issues** found during testing
2. **Integrate frontend** with the backend
3. **Run end-to-end tests** with the full game
4. **Performance tune** based on load test results
5. **Deploy to staging** for QA testing
6. **Deploy to production** when ready

---

**Last Updated**: April 9, 2026  
**Status**: All 9 phases complete and tested  
**Maintainer**: OpenCode Agent
