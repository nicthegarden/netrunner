/**
 * NETRUNNER Multiplayer Backend - Performance Optimization
 * Phase 7: Load Testing & Performance Monitoring
 * 
 * Tools and utilities for optimizing backend performance,
 * load testing, caching, and monitoring.
 */

import rateLimit from 'express-rate-limit';
import compression from 'compression';
import mongoSanitize from 'mongo-sanitize';
import helmet from 'helmet';

/**
 * Rate limiter configurations
 */

// General API rate limiter (100 requests per 15 minutes)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limiter (5 requests per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
});

// PvP rate limiter (20 challenges per hour per player)
export const pvpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.player?.id || req.ip,
  message: 'Too many duel challenges, cool down and try later',
});

// API endpoint rate limiter (1000 requests per hour per player)
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.player?.id || req.ip,
});

/**
 * Response compression middleware
 */
export function setupCompression(app) {
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress if > 1KB
  }));
}

/**
 * Data sanitization middleware
 */
export function setupSanitization(app) {
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Potential injection attempt in ${key}`);
    },
  }));
}

/**
 * Response caching headers
 */
export const cacheHeaders = {
  // Cache leaderboards for 5 minutes
  leaderboard: (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300');
    next();
  },

  // Cache player profiles for 10 minutes
  playerProfile: (req, res, next) => {
    res.set('Cache-Control', 'private, max-age=600');
    next();
  },

  // Cache guild info for 5 minutes
  guild: (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300');
    next();
  },

  // Cache events for 1 minute
  events: (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=60');
    next();
  },

  // Don't cache auth/PvP endpoints
  noCache: (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    next();
  },
};

/**
 * Database query optimization
 */

// Create indexes for frequently queried fields
export async function createDatabaseIndexes(db) {
  try {
    // Players collection
    db.collection('players').createIndex({ username: 1 });
    db.collection('players').createIndex({ email: 1 });
    db.collection('players').createIndex({ totalXP: -1 });
    db.collection('players').createIndex({ eloRating: -1 });
    db.collection('players').createIndex({ createdAt: -1 });

    // Guilds collection
    db.collection('guilds').createIndex({ members: 1 });
    db.collection('guilds').createIndex({ level: -1 });
    db.collection('guilds').createIndex({ treasury: -1 });

    // PvP Matches
    db.collection('pvpmatches').createIndex({ player1Id: 1, player2Id: 1 });
    db.collection('pvpmatches').createIndex({ completedAt: -1 });
    db.collection('pvpmatches').createIndex({ 'status': 1, 'expiresAt': 1 });
    db.collection('pvpmatches').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 } // TTL index
    );

    // Events collection
    db.collection('events').createIndex({ startTime: 1, endTime: 1 });
    db.collection('events').createIndex({ 'participants.guildId': 1 });

    console.log('✓ Database indexes created successfully');
  } catch (error) {
    console.warn('Warning: Could not create all indexes:', error.message);
  }
}

/**
 * Connection pooling configuration
 */
export const mongooseConfig = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  familySetupTimeoutMS: 10000,
  autoCreate: true,
  autoIndex: true,
};

/**
 * Performance monitoring utilities
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  /**
   * Record endpoint response time
   */
  recordEndpoint(route, method, duration, statusCode) {
    const key = `${method} ${route}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0,
        statusCodes: {},
      });
    }

    const metric = this.metrics.get(key);
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);

    if (statusCode >= 400) {
      metric.errors++;
    }

    if (!metric.statusCodes[statusCode]) {
      metric.statusCodes[statusCode] = 0;
    }
    metric.statusCodes[statusCode]++;
  }

  /**
   * Get performance report
   */
  getReport() {
    const uptime = Date.now() - this.startTime;
    const endpoints = [];

    for (const [route, stats] of this.metrics.entries()) {
      endpoints.push({
        route,
        requests: stats.count,
        avgTime: stats.totalTime / stats.count,
        minTime: stats.minTime,
        maxTime: stats.maxTime,
        errorRate: stats.errors / stats.count,
        statusCodes: stats.statusCodes,
      });
    }

    return {
      uptime,
      totalRequests: endpoints.reduce((sum, e) => sum + e.requests, 0),
      endpoints: endpoints.sort((a, b) => b.requests - a.requests),
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.clear();
    this.startTime = Date.now();
  }
}

/**
 * Middleware to track response times
 */
export function performanceTrackingMiddleware(monitor) {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      monitor.recordEndpoint(req.route?.path || req.path, req.method, duration, res.statusCode);
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }
    });

    next();
  };
}

/**
 * Load testing scenario definitions
 */

export const loadTestScenarios = {
  /**
   * Light load: 10 concurrent players
   */
  light: {
    concurrency: 10,
    duration: 60,
    rampUp: 10,
    requests: [
      { method: 'GET', path: '/players/leaderboard', weight: 5 },
      { method: 'GET', path: '/guilds', weight: 3 },
      { method: 'GET', path: '/events/current', weight: 2 },
    ],
  },

  /**
   * Medium load: 100 concurrent players
   */
  medium: {
    concurrency: 100,
    duration: 300,
    rampUp: 30,
    requests: [
      { method: 'GET', path: '/players/leaderboard', weight: 20 },
      { method: 'GET', path: '/guilds', weight: 15 },
      { method: 'GET', path: '/events/current', weight: 15 },
      { method: 'POST', path: '/pvp/challenge', weight: 10, authRequired: true },
      { method: 'GET', path: '/pvp/history/{playerId}', weight: 10 },
      { method: 'POST', path: '/events/current/damage', weight: 10, authRequired: true },
    ],
  },

  /**
   * Heavy load: 500 concurrent players
   */
  heavy: {
    concurrency: 500,
    duration: 600,
    rampUp: 60,
    requests: [
      { method: 'GET', path: '/players/leaderboard', weight: 25 },
      { method: 'GET', path: '/guilds', weight: 20 },
      { method: 'GET', path: '/events/current', weight: 20 },
      { method: 'POST', path: '/pvp/challenge', weight: 15, authRequired: true },
      { method: 'GET', path: '/pvp/history/{playerId}', weight: 10 },
      { method: 'POST', path: '/events/current/damage', weight: 15, authRequired: true },
      { method: 'GET', path: '/players/{playerId}', weight: 10 },
      { method: 'POST', path: '/guilds/{guildId}/join', weight: 5, authRequired: true },
    ],
  },

  /**
   * Stress test: Maximum load
   */
  stress: {
    concurrency: 1000,
    duration: 900,
    rampUp: 120,
    requests: [
      // All request types to stress all systems
      { method: 'GET', path: '/players/leaderboard', weight: 20 },
      { method: 'GET', path: '/guilds', weight: 15 },
      { method: 'GET', path: '/events/current', weight: 15 },
      { method: 'POST', path: '/pvp/challenge', weight: 15, authRequired: true },
      { method: 'GET', path: '/pvp/history/{playerId}', weight: 10 },
      { method: 'POST', path: '/events/current/damage', weight: 15, authRequired: true },
      { method: 'GET', path: '/players/{playerId}', weight: 10 },
      { method: 'POST', path: '/guilds/{guildId}/join', weight: 5, authRequired: true },
      { method: 'PATCH', path: '/players/{playerId}', weight: 5, authRequired: true },
    ],
  },
};

/**
 * WebSocket performance tuning
 */
export const socketIOConfig = {
  // Reduce memory usage
  maxHttpBufferSize: 1e5, // 100KB max message size

  // Increase throughput
  pingInterval: 30000,
  pingTimeout: 60000,

  // Connection pooling
  transports: ['websocket', 'polling'],

  // Compression
  serveClient: false, // Don't serve Socket.io client lib
  cookie: {
    name: 'io',
    path: '/socket.io',
    httpOnly: true,
    secure: true, // HTTPS only in production
    sameSite: 'strict',
  },

  // Adapter configuration for multi-instance deployments
  adapter: {
    key: 'io',
    namespace: '/',
  },
};

/**
 * Database connection pooling and monitoring
 */
export class DBConnectionPool {
  constructor(mongoUri, config = {}) {
    this.mongoUri = mongoUri;
    this.config = { ...mongooseConfig, ...config };
    this.connection = null;
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      failedAttempts: 0,
      reconnections: 0,
    };
  }

  /**
   * Get pool metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Record connection event
   */
  recordConnection() {
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
  }

  /**
   * Record disconnection
   */
  recordDisconnection() {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  /**
   * Record failed connection
   */
  recordFailedAttempt() {
    this.metrics.failedAttempts++;
  }

  /**
   * Record reconnection
   */
  recordReconnection() {
    this.metrics.reconnections++;
  }
}

/**
 * Redis caching (optional, for scaling)
 */
export class CacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get cached value
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.cacheHits++;
        return JSON.parse(value);
      }
      this.cacheMisses++;
      return null;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key, value, expirySeconds = 300) {
    try {
      await this.redis.setex(key, expirySeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
    }
  }

  /**
   * Invalidate cache
   */
  async invalidate(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      console.error(`Cache invalidate error:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
    };
  }
}

export default {
  generalLimiter,
  authLimiter,
  pvpLimiter,
  apiLimiter,
  setupCompression,
  setupSanitization,
  cacheHeaders,
  createDatabaseIndexes,
  mongooseConfig,
  PerformanceMonitor,
  performanceTrackingMiddleware,
  loadTestScenarios,
  socketIOConfig,
  DBConnectionPool,
  CacheManager,
};
