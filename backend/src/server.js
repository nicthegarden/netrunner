/**
 * NETRUNNER Multiplayer Backend Server
 * Main Express and Socket.io server initialization
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { config } from './config/index.js';
import { connectDB, getDBStatus } from './config/database.js';
import './config/passport.js'; // Initialize Passport strategies
import authRoutes from './routes/auth.js';
// import playerRoutes from './routes/players.js';
// import guildRoutes from './routes/guilds.js';
// import leaderboardRoutes from './routes/leaderboards.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: config.cors,
  transports: ['websocket', 'polling'],
});

// ===================
// Middleware
// ===================

// Security
app.use(helmet());
app.use(cors(config.cors));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Session management
app.use(
  session({
    secret: config.session.secret,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
    cookie: config.session.cookie,
  })
);

// Passport authentication
app.use(passport.initialize());
app.use(passport.session());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ===================
// Routes
// ===================

// Health check
app.get('/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'ok',
    server: {
      env: config.env,
      port: config.port,
      uptime: process.uptime(),
    },
    database: dbStatus,
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'operational',
    server: {
      env: config.env,
      port: config.port,
      uptime: process.uptime(),
    },
    database: dbStatus,
    features: config.features,
  });
});

// API Routes
app.use('/auth', authRoutes);
// app.use('/api/players', playerRoutes);
// app.use('/api/guilds', guildRoutes);
// app.use('/api/leaderboards', leaderboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.isDev && { stack: err.stack }),
  });
});

// ===================
// Socket.io Setup
// ===================

io.on('connection', (socket) => {
  console.log(`✓ Player connected: ${socket.id}`);

  // Connection event
  socket.emit('connected', { message: 'Welcome to NETRUNNER Multiplayer!' });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`✗ Player disconnected: ${socket.id}`);
  });

  // TODO: Add event handlers for:
  // - PvP duels (challenge, accept, fight)
  // - Guild wars (damage updates, victory)
  // - Player updates (game sync)
  // - Chat/notifications
});

// ===================
// Server Startup
// ===================

export async function startServer() {
  try {
    console.log('🚀 Starting NETRUNNER Multiplayer Backend...');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();

    // Start HTTP server
    return new Promise((resolve, reject) => {
      httpServer.listen(config.port, config.host, () => {
        console.log(`
╔═══════════════════════════════════════════════╗
║     NETRUNNER MULTIPLAYER BACKEND ONLINE      ║
║                                               ║
║  Server: http://${config.host}:${config.port}
║  Env: ${config.env.toUpperCase()}
║  WebSocket: Ready
║  Database: Connected
╚═══════════════════════════════════════════════╝
        `);
        resolve({ httpServer, io, app });
      });

      httpServer.on('error', reject);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    throw error;
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n⏹ Shutting down...');
  try {
    io.close();
    httpServer.close(() => {
      console.log('✓ HTTP server closed');
    });
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during shutdown:', error.message);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, httpServer, io };
