# NETRUNNER Multiplayer Backend - Performance Optimization Guide
## Phase 7: Performance Tuning & Load Testing

This document covers performance optimization strategies, load testing procedures, and monitoring for the NETRUNNER multiplayer backend.

---

## Performance Goals

- **Response time**: < 200ms for 95% of requests
- **Throughput**: 500+ concurrent players
- **Availability**: 99.9% uptime
- **Database**: < 100ms query time for 95% of queries
- **WebSocket**: < 50ms message delivery

---

## Optimization Strategies

### 1. Request Rate Limiting

Prevent abuse and ensure fair resource allocation:

```javascript
import { authLimiter, pvpLimiter, apiLimiter } from './utils/performance.js';

// Apply to routes
app.post('/api/auth/login', authLimiter, authController.login);
app.post('/api/pvp/challenge', pvpLimiter, pvpController.challenge);
app.use('/api/', apiLimiter);
```

**Configuration:**
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes (per IP)
- PvP challenges: 20 challenges per hour (per player)
- API overall: 1000 requests per hour (per player)

### 2. Response Compression

Reduce bandwidth by compressing HTTP responses:

```javascript
import { setupCompression } from './utils/performance.js';

setupCompression(app);
// Compresses responses > 1KB with level 6 compression
// Reduces payload size by 70-80% for JSON responses
```

### 3. Data Sanitization

Prevent NoSQL injection attacks:

```javascript
import { setupSanitization } from './utils/performance.js';

setupSanitization(app);
// Automatically sanitizes MongoDB queries
// Replaces special characters in input
```

### 4. Response Caching

Cache frequently accessed data with appropriate headers:

```javascript
import { cacheHeaders } from './utils/performance.js';

// Cache leaderboards for 5 minutes
app.get('/api/leaderboards/xp', cacheHeaders.leaderboard, controller.getLeaderboard);

// Cache player profiles for 10 minutes
app.get('/api/players/:id', cacheHeaders.playerProfile, controller.getPlayer);

// Don't cache auth/PvP endpoints
app.post('/api/pvp/challenge', cacheHeaders.noCache, controller.challenge);
```

### 5. Database Optimization

#### Create Indexes

Indexes dramatically improve query performance:

```javascript
import { createDatabaseIndexes } from './utils/performance.js';

// Call during server startup
app.listen(PORT, async () => {
  await createDatabaseIndexes(db);
  console.log('Database indexes created');
});
```

**Critical Indexes:**
- `Players.username` - Fast player lookup
- `Players.totalXP` - XP leaderboard sorting
- `Players.eloRating` - ELO leaderboard sorting
- `PvPMatch.player1Id, player2Id` - Fast duel history
- `PvPMatch.expiresAt` - TTL for match cleanup
- `Events.startTime, endTime` - Event schedule queries

#### Connection Pooling

Optimize MongoDB connections:

```javascript
import mongoose from 'mongoose';
import { mongooseConfig } from './utils/performance.js';

// Configure connection pooling
mongoose.connect(MONGODB_URI, mongooseConfig);

// maxPoolSize: 10 concurrent connections
// minPoolSize: 5 minimum pool size
// retryWrites: true for reliability
```

#### Query Optimization

Use projection to return only needed fields:

```javascript
// BAD: Fetch all fields
const player = await Player.findById(id);

// GOOD: Only fetch needed fields
const player = await Player.findById(id, 'username totalXP eloRating');

// Use lean() for read-only queries
const leaderboard = await Player
  .find({})
  .sort({ totalXP: -1 })
  .limit(100)
  .lean(); // Skip Mongoose overhead
```

### 6. WebSocket Optimization

Tune Socket.io for high concurrency:

```javascript
import { socketIOConfig } from './utils/performance.js';

const io = new SocketIOServer(httpServer, socketIOConfig);

// Reduces memory per connection
// Enables compression
// Improves message throughput
```

---

## Load Testing

### Running Load Tests

#### 1. Light Load (10 concurrent players)

```bash
# Simulate 10 players for 60 seconds
npm run load-test:light

# Expected metrics:
# - Avg response time: < 100ms
# - p99 response time: < 500ms
# - Error rate: < 0.1%
```

#### 2. Medium Load (100 concurrent players)

```bash
# Simulate 100 players for 5 minutes
npm run load-test:medium

# Expected metrics:
# - Avg response time: < 150ms
# - p99 response time: < 800ms
# - Error rate: < 0.5%
```

#### 3. Heavy Load (500 concurrent players)

```bash
# Simulate 500 players for 10 minutes
npm run load-test:heavy

# Expected metrics:
# - Avg response time: < 200ms
# - p99 response time: < 1000ms
# - Error rate: < 1%
```

#### 4. Stress Test (1000 concurrent players)

```bash
# Push to maximum capacity
npm run load-test:stress

# Find breaking point and recovery behavior
```

### Load Test Configuration

Edit `package.json` scripts:

```json
{
  "scripts": {
    "load-test:light": "artillery quick --count 10 --num 100 http://localhost:3000/api/players/leaderboard",
    "load-test:medium": "artillery run tests/load-medium.yml",
    "load-test:heavy": "artillery run tests/load-heavy.yml",
    "load-test:stress": "artillery run tests/load-stress.yml"
  }
}
```

### Using Artillery.io

Create `tests/load-medium.yml`:

```yaml
config:
  target: "http://localhost:3000/api"
  phases:
    - duration: 30
      arrivalRate: 3
      name: "Warm up"
    - duration: 240
      arrivalRate: 10
      name: "Sustained load"
    - duration: 30
      arrivalRate: 3
      name: "Cool down"
  processor: "./tests/load-processor.js"
  variables:
    playerIds:
      - "player1"
      - "player2"
      - "player3"

scenarios:
  - name: "Read Operations (80%)"
    weight: 80
    flow:
      - get:
          url: "/players/leaderboard"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/guilds"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/events/current"
          expect:
            - statusCode: 200

  - name: "Write Operations (20%)"
    weight: 20
    flow:
      - post:
          url: "/pvp/challenge"
          json:
            opponentId: "{{ $randomNumber(1, 1000) }}"
            stakes: 5000
          expect:
            - statusCode: 201
            - statusCode: 400
      - think: 5
```

---

## Performance Monitoring

### Real-Time Metrics

Track performance during operation:

```javascript
import { PerformanceMonitor, performanceTrackingMiddleware } from './utils/performance.js';

const monitor = new PerformanceMonitor();

// Apply middleware
app.use(performanceTrackingMiddleware(monitor));

// Get metrics
app.get('/admin/metrics', (req, res) => {
  const report = monitor.getReport();
  res.json(report);
});

// Example output:
{
  "uptime": 3600000,
  "totalRequests": 15234,
  "endpoints": [
    {
      "route": "GET /players/leaderboard",
      "requests": 5234,
      "avgTime": 145,
      "minTime": 12,
      "maxTime": 2341,
      "errorRate": 0.002,
      "statusCodes": { "200": 5218, "500": 16 }
    }
  ]
}
```

### Database Metrics

Monitor connection pool health:

```javascript
import { DBConnectionPool } from './utils/performance.js';

const pool = new DBConnectionPool(MONGODB_URI);

// Track metrics
app.get('/admin/db-metrics', (req, res) => {
  res.json(pool.getMetrics());
});

// Example output:
{
  "totalConnections": 847,
  "activeConnections": 8,
  "failedAttempts": 2,
  "reconnections": 0
}
```

### Cache Statistics

Monitor caching effectiveness:

```javascript
import { CacheManager } from './utils/performance.js';

const cache = new CacheManager(redisClient);

// Get cache hit rate
app.get('/admin/cache-stats', (req, res) => {
  res.json(cache.getStats());
});

// Example output:
{
  "cacheHits": 12345,
  "cacheMisses": 2341,
  "hitRate": 0.84
}
```

### Prometheus Integration (Production)

Export metrics for Prometheus scraping:

```javascript
import promClient from 'prom-client';

// Create custom metrics
const requestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new promClient.Gauge({
  name: 'db_active_connections',
  help: 'Number of active database connections',
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

---

## Bottleneck Identification

### Common Performance Issues

#### 1. Slow Database Queries

**Symptoms:**
- Response time > 500ms
- High CPU on MongoDB server
- Database error rate increasing

**Solutions:**
```javascript
// Use explain() to analyze query performance
const explain = await Player.find().explain('executionStats');
console.log(explain); // Check if using index

// Add missing indexes
db.players.createIndex({ totalXP: -1 });

// Use aggregation for complex queries
const topPlayers = await Player.aggregate([
  { $match: { level: { $gte: 50 } } },
  { $sort: { totalXP: -1 } },
  { $limit: 100 },
  { $project: { username: 1, totalXP: 1, eloRating: 1 } }
]);
```

#### 2. High Memory Usage

**Symptoms:**
- Process memory > 500MB
- Garbage collection pauses
- OOM kills

**Solutions:**
```javascript
// Use lean() for read-only queries
const players = await Player.find().lean();

// Stream large datasets instead of loading all at once
const stream = Player.find().stream();
stream.on('data', (player) => {
  // Process one player at a time
});

// Limit WebSocket message size
const io = new SocketIOServer(httpServer, {
  maxHttpBufferSize: 1e5, // 100KB max
});
```

#### 3. Slow WebSocket Messages

**Symptoms:**
- Duel updates delayed
- Players reporting lag
- High latency on presence updates

**Solutions:**
```javascript
// Reduce message frequency
socket.on('presence:update', throttle(() => {
  io.emit('presence:changed', userData);
}, 5000)); // Only emit every 5 seconds

// Compress message payloads
socket.on('duel:round', (data) => {
  // Send only changed fields
  io.to(roomId).emit('duel:round', {
    roundNumber: data.roundNumber,
    p1Hp: data.p1Hp,
    p2Hp: data.p2Hp,
  });
});
```

#### 4. Database Connection Issues

**Symptoms:**
- "ECONNREFUSED" errors
- Timeout errors
- Spike in failed requests

**Solutions:**
```javascript
// Increase pool size for high concurrency
mongoose.connect(uri, {
  maxPoolSize: 20,
  minPoolSize: 10,
});

// Add connection retry logic
const maxRetries = 5;
for (let i = 0; i < maxRetries; i++) {
  try {
    await mongoose.connect(uri);
    break;
  } catch (err) {
    console.log(`Connection attempt ${i + 1} failed, retrying...`);
    await delay(1000 * (i + 1));
  }
}
```

---

## Scaling Strategies

### Horizontal Scaling (Multiple Instances)

For multiple backend instances, use:

1. **Load Balancer (Nginx)**
   ```nginx
   upstream backend {
     server localhost:3000;
     server localhost:3001;
     server localhost:3002;
   }
   
   server {
     listen 80;
     location /api {
       proxy_pass http://backend;
     }
   }
   ```

2. **Socket.io Adapter**
   ```javascript
   import { createAdapter } from '@socket.io/redis-adapter';
   import { createClient } from 'redis';
   
   const pubClient = createClient();
   const subClient = pubClient.duplicate();
   
   io.adapter(createAdapter(pubClient, subClient));
   ```

3. **Session Sharing**
   ```javascript
   import RedisStore from 'connect-redis';
   
   app.use(session({
     store: new RedisStore({ client: redisClient }),
     // ... other config
   }));
   ```

### Caching Layer (Redis)

Reduce database load with Redis caching:

```javascript
const leaderboard = await cache.get('leaderboard:xp');
if (!leaderboard) {
  leaderboard = await Player
    .find()
    .sort({ totalXP: -1 })
    .limit(100)
    .lean();
  await cache.set('leaderboard:xp', leaderboard, 300); // Cache 5 mins
}
```

### CDN for Static Assets

Serve static files from a CDN:

```bash
# Upload to Cloudflare, AWS CloudFront, or similar
# Configure origin: https://your-server.com
# Files automatically cached and served from edge locations
```

---

## Monitoring Checklist

Daily:
- [ ] Check error rate (should be < 0.1%)
- [ ] Verify average response time (should be < 200ms)
- [ ] Monitor active connections (should be < max pool size)
- [ ] Check database query times
- [ ] Review WebSocket message latency

Weekly:
- [ ] Run performance benchmarks
- [ ] Analyze slowlog for problematic queries
- [ ] Review memory usage trends
- [ ] Check disk space for logs

Monthly:
- [ ] Load test new features
- [ ] Review and optimize slow endpoints
- [ ] Update database statistics
- [ ] Analyze cost vs. performance
- [ ] Plan capacity for growth

---

## Performance Tuning Checklist

- [ ] Enable response compression
- [ ] Configure rate limiting
- [ ] Create database indexes
- [ ] Implement response caching
- [ ] Optimize WebSocket config
- [ ] Set up connection pooling
- [ ] Add monitoring/metrics
- [ ] Run load tests
- [ ] Configure CDN (production)
- [ ] Set up alerting
- [ ] Document performance baselines
- [ ] Plan scaling strategy

---

## Further Reading

- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance/)
- [MongoDB Performance Tuning](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Socket.io Scaling Guide](https://socket.io/docs/v4/scaling/#socket-io-adapter)
- [Artillery Load Testing](https://artillery.io/docs)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)
