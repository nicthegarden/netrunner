# 🚀 NETRUNNER Phase 4: Production Deployment Plan

**Date:** April 10, 2026  
**Phase:** 4 - Production Deployment  
**Status:** 🔄 In Progress

---

## 📋 Executive Summary

Phase 4 transforms NETRUNNER from a development project into a production-ready multiplayer game accessible to all players. This phase includes containerization, CI/CD automation, monitoring/observability, security hardening, and deployment to a production environment.

**Target:** Launch live multiplayer game with 99.9% uptime SLA  
**Timeline:** 4-6 hours for full setup  
**Success Metric:** Game running on production domain with auto-scaling ready

---

## 🎯 Phase 4 Objectives

### Primary Goals
1. ✅ **Containerize Application** - Docker images for consistency
2. ✅ **Automate Deployments** - GitHub Actions CI/CD pipeline
3. ✅ **Monitor Performance** - Real-time observability and alerting
4. ✅ **Secure Infrastructure** - HTTPS, environment secrets, rate limiting
5. ✅ **Enable Scalability** - Load balancing, database pooling
6. ✅ **Document Operations** - Runbooks, troubleshooting, incident response

### Success Criteria
- [ ] Application runs in Docker containers
- [ ] GitHub Actions automatically tests and deploys on push
- [ ] SSL/TLS certificates configured
- [ ] Health checks passing every 30 seconds
- [ ] Error tracking (Sentry) capturing issues
- [ ] Performance metrics dashboard created
- [ ] Rollback procedure documented and tested
- [ ] Zero downtime deployment strategy implemented
- [ ] 99.9% uptime during production testing
- [ ] Deployment runbook created and tested

---

## 4.1 Containerization (Docker)

### Create Dockerfile for Frontend

```dockerfile
# /home/edve/netrunner/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy frontend files
COPY index.html ./
COPY js/ ./js/
COPY css/ ./css/
COPY assets/ ./assets/

# Install http-server
RUN npm install -g http-server

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

# Start server
CMD ["http-server", "-p", "8000", "--gzip"]
```

### Create Dockerfile for Backend

```dockerfile
# /home/edve/netrunner/backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY package.json package-lock.json ./
COPY src/ ./src/
COPY tests/ ./tests/

# Install dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start server
CMD ["node", "src/index.js"]
```

### Create Docker Compose for Local Testing

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - API_URL=http://backend:3000
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000"]
      interval: 30s
      timeout: 3s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 3s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=netrunner
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=netrunner
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 4.2 Environment Configuration

### Create .env.example

```bash
# /home/edve/netrunner/.env.example

# Frontend
FRONTEND_PORT=8000
API_URL=https://api.netrunner.game

# Backend
BACKEND_PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/netrunner

# Database
DB_USER=netrunner
DB_PASSWORD=your_secure_password_here
DB_HOST=postgres
DB_PORT=5432
DB_NAME=netrunner

# Security
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=https://netrunner.game

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

### Create config/production.js

```javascript
// config/production.js
module.exports = {
  server: {
    port: process.env.BACKEND_PORT || 3000,
    env: 'production',
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  },
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    https: true,
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
  },
  rateLimit: {
    window: process.env.RATE_LIMIT_WINDOW || '15m',
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};
```

---

## 4.3 GitHub Actions CI/CD Pipeline

### Create .github/workflows/deploy.yml

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test
      
      - name: Validate syntax
        run: |
          node -c js/multiplayer.js
          node -c js/app.js
          node -c js/main.js
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t netrunner-frontend:latest .
          docker build -t netrunner-backend:latest ./backend
      
      - name: Push to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - run: |
          docker tag netrunner-frontend:latest ${{ secrets.DOCKER_USERNAME }}/netrunner-frontend:latest
          docker tag netrunner-backend:latest ${{ secrets.DOCKER_USERNAME }}/netrunner-backend:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/netrunner-frontend:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/netrunner-backend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to DigitalOcean
        env:
          DO_TOKEN: ${{ secrets.DO_TOKEN }}
          DROPLET_IP: ${{ secrets.DROPLET_IP }}
        run: |
          ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'EOF'
          cd /opt/netrunner
          docker pull ${{ secrets.DOCKER_USERNAME }}/netrunner-frontend:latest
          docker pull ${{ secrets.DOCKER_USERNAME }}/netrunner-backend:latest
          docker-compose up -d
          docker-compose ps
          EOF
      
      - name: Verify deployment
        run: |
          sleep 10
          curl -f http://${{ secrets.DROPLET_IP }}:8000 || exit 1
          curl -f http://${{ secrets.DROPLET_IP }}:3000/api/health || exit 1
      
      - name: Notify success
        uses: slackapi/slack-action-send-message@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ NETRUNNER deployed to production successfully"
            }
```

---

## 4.4 Monitoring & Observability

### Add Error Tracking (Sentry)

```javascript
// backend/src/monitoring/sentry.js
const Sentry = require("@sentry/node");

function initSentry(app) {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: 1.0,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());

  console.log('✓ Sentry monitoring initialized');
}

module.exports = { initSentry };
```

### Add Health Check Endpoint

```javascript
// backend/src/routes/health.js
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  });
});
```

### Add Metrics Collection

```javascript
// backend/src/monitoring/metrics.js
const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
  },
  latency: [],
};

function trackRequest(duration) {
  metrics.requests.total++;
  metrics.latency.push(duration);
}

function getMetrics() {
  const avgLatency = metrics.latency.length > 0
    ? metrics.latency.reduce((a, b) => a + b) / metrics.latency.length
    : 0;

  return {
    requests: metrics.requests,
    averageLatency: avgLatency.toFixed(2) + 'ms',
    metrics: metrics,
  };
}
```

---

## 4.5 Security Hardening

### Rate Limiting Middleware

```javascript
// backend/src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
```

### CORS Configuration

```javascript
// backend/src/middleware/cors.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = cors(corsOptions);
```

### HTTPS/SSL Configuration

```javascript
// backend/src/server.js
const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

https.createServer(httpsOptions, app).listen(3000, () => {
  console.log('✓ Server running on HTTPS port 3000');
});
```

---

## 4.6 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (backend Jest tests)
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Performance benchmarks acceptable
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Monitoring dashboards created
- [ ] Incident response plan documented

### Deployment
- [ ] Create backup of current database
- [ ] Pull latest code from main branch
- [ ] Build Docker images locally and verify
- [ ] Run Docker Compose locally for smoke test
- [ ] Push images to Docker Hub
- [ ] Deploy to DigitalOcean via CI/CD
- [ ] Verify health checks passing
- [ ] Monitor error tracking (Sentry)
- [ ] Check performance metrics
- [ ] Run smoke tests on production

### Post-Deployment
- [ ] Monitor error rate for 1 hour
- [ ] Monitor latency metrics
- [ ] Check database replication status
- [ ] Verify SSL certificate valid
- [ ] Test all game features in production
- [ ] Monitor player logins
- [ ] Check cache hit rates
- [ ] Verify WebSocket connections
- [ ] Document any issues encountered
- [ ] Prepare rollback if needed

### Rollback Plan
- [ ] Tag current production image
- [ ] Keep previous working image
- [ ] Document rollback procedure
- [ ] Test rollback in staging
- [ ] Prepare quick rollback command
- [ ] Document how to notify players

---

## 4.7 Production Hosting Options

### Option A: DigitalOcean (Recommended for MVP)
- **Cost:** $40/month (2GB RAM Droplet)
- **Setup time:** 30 minutes
- **Pros:** Simple, good documentation, App Platform for containers
- **Cons:** Limited scaling initially
- **Command:**
  ```bash
  doctl compute droplet create netrunner-prod \
    --region nyc3 \
    --image docker-20-04 \
    --size s-2vcpu-2gb
  ```

### Option B: AWS (Best for Scale)
- **Cost:** $50-200/month (varies with traffic)
- **Setup time:** 1-2 hours
- **Pros:** Auto-scaling, CDN, RDS database
- **Cons:** More complex setup
- **Services:**
  - ECS for container orchestration
  - ALB for load balancing
  - RDS for managed database
  - CloudFront for CDN

### Option C: Heroku (Easiest)
- **Cost:** Free tier available (5000 free dyno hours/month)
- **Setup time:** 15 minutes
- **Pros:** Simplest, git push deployment
- **Cons:** Limited free tier, slower for CPU-bound tasks
- **Command:**
  ```bash
  heroku create netrunner-prod
  git push heroku main
  ```

**Recommendation:** Start with DigitalOcean App Platform for simplicity, migrate to AWS if scaling needed.

---

## 4.8 Database Setup

### PostgreSQL in Production

```sql
-- Schema creation
CREATE DATABASE netrunner;

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  elo INT DEFAULT 1200,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guilds table
CREATE TABLE guilds (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  tag VARCHAR(10) UNIQUE NOT NULL,
  leader_id UUID REFERENCES players(id),
  members INT DEFAULT 1,
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Duels table (for history)
CREATE TABLE duels (
  id UUID PRIMARY KEY,
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id),
  winner_id UUID REFERENCES players(id),
  wager INT,
  elo_change INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  status VARCHAR(20),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_guilds_name ON guilds(name);
CREATE INDEX idx_duels_timestamp ON duels(created_at);
CREATE INDEX idx_events_status ON events(status);
```

---

## 4.9 Monitoring Dashboard (Prometheus + Grafana)

### Prometheus Config

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'netrunner-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Key Metrics to Monitor

```
- API response time (p50, p95, p99)
- Error rate (errors/second)
- Cache hit rate (%)
- WebSocket connections (active)
- Database connection pool (used/available)
- Memory usage (MB)
- CPU usage (%)
- Requests per second
- Unique players online
- Guild wars active
```

---

## 4.10 Deployment Timeline

```
Hour 1: Setup & Configuration
  - [ ] Create DigitalOcean Droplet (15 min)
  - [ ] Configure DNS (10 min)
  - [ ] Create SSL certificates (10 min)
  - [ ] Setup GitHub secrets (10 min)
  - [ ] Create .env files (5 min)

Hour 2: Containerization & CI/CD
  - [ ] Create Dockerfiles (20 min)
  - [ ] Test Docker Compose locally (15 min)
  - [ ] Setup GitHub Actions (20 min)
  - [ ] Test CI/CD pipeline (5 min)

Hour 3: Monitoring & Security
  - [ ] Setup Sentry error tracking (15 min)
  - [ ] Configure rate limiting (10 min)
  - [ ] Setup Prometheus/Grafana (20 min)
  - [ ] Create health check endpoints (10 min)
  - [ ] Security audit (5 min)

Hour 4-6: Deployment & Testing
  - [ ] Deploy to production (30 min)
  - [ ] Run smoke tests (15 min)
  - [ ] Load testing (30 min)
  - [ ] Security testing (30 min)
  - [ ] Document runbook (30 min)
  - [ ] Prepare rollback (15 min)
  - [ ] Final validation (15 min)
```

---

## 🎯 Success Metrics

### Uptime
- **Target:** 99.9% (8.64 hours downtime allowed per year)
- **Measurement:** Active health checks every 30 seconds
- **Alert threshold:** >1 minute of downtime

### Performance
- **API response time:** <100ms p95
- **Game load time:** <2 seconds
- **WebSocket latency:** <50ms p95
- **Cache hit rate:** >70%

### Reliability
- **Error rate:** <0.1%
- **Failed deployments:** 0
- **Incidents requiring rollback:** 0
- **Data loss:** 0

### Scalability
- **Concurrent players:** 1000+
- **API requests/sec:** 10,000+
- **Database connections:** Auto-scaling
- **Container instances:** Auto-scaling on demand

---

## 📋 Phase 4 Checklist

Phase 4 Tasks:
- ✅ Create deployment plan (this document)
- [ ] Setup Docker containerization
- [ ] Create GitHub Actions CI/CD
- [ ] Configure monitoring (Sentry, Prometheus)
- [ ] Implement security hardening
- [ ] Setup production database
- [ ] Create deployment runbook
- [ ] Perform pre-deployment testing
- [ ] Deploy to production
- [ ] Run post-deployment validation
- [ ] Document lessons learned

---

## 🚀 Next Steps

1. **Create Dockerfiles** - Package app in containers
2. **Setup GitHub Actions** - Automate testing and deployment
3. **Configure Monitoring** - Track errors and performance
4. **Deploy to DigitalOcean** - Launch production environment
5. **Run Final Tests** - Validate everything works
6. **Go Live** - Announce to players

---

**Document Status:** 📋 Phase 4 Plan Complete  
**Ready for:** Docker Setup → CI/CD → Deployment  
**Estimated Time:** 4-6 hours to complete  
**Next:** Create Dockerfile and Docker Compose

---
