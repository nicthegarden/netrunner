import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import savesRoutes from './routes/saves.js';
import adminRoutes from './routes/admin.js';
import syncRoutes from './routes/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000', 'http://192.168.1.*'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
console.log('Initializing database...');
initializeDatabase();

// Routes
app.use('/api', authRoutes);
app.use('/api', savesRoutes);
app.use('/api', adminRoutes);
app.use('/api', syncRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file serving (serve client files)
const clientDir = path.join(__dirname, '..');
app.use(express.static(clientDir, {
  setHeaders: (res, filepath) => {
    // No cache for index.html
    if (filepath.endsWith('index.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  NETRUNNER Server with Auth + Admin Panel      ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Database: game.db`);
  console.log('');
  console.log('Authentication Endpoints:');
  console.log(`  POST   /api/auth/register           - Register new account`);
  console.log(`  POST   /api/auth/login              - Login with username/password`);
  console.log(`  POST   /api/auth/refresh            - Refresh access token`);
  console.log(`  POST   /api/auth/logout             - Logout`);
  console.log(`  GET    /api/auth/me                 - Get user profile`);
  console.log('');
  console.log('Save/Load Endpoints:');
  console.log(`  POST   /api/saves/upload            - Upload game save`);
  console.log(`  GET    /api/saves/latest            - Download latest save`);
  console.log(`  GET    /api/saves/list              - List all saves`);
  console.log(`  GET    /api/saves/:saveId           - Download specific save`);
  console.log(`  POST   /api/saves/:saveId/restore   - Restore from save`);
  console.log('');
  console.log('Admin Endpoints (192.168.1.X only):');
  console.log(`  GET    /api/admin/users             - List all users`);
  console.log(`  GET    /api/admin/users/:userId     - Get user details`);
  console.log(`  POST   /api/admin/users/:userId/ban - Ban user`);
  console.log(`  POST   /api/admin/users/:userId/unban - Unban user`);
  console.log(`  POST   /api/admin/users/:userId/reset-progress - Reset player progress`);
  console.log(`  POST   /api/admin/users/:userId/nerf - Nerf player stats`);
  console.log(`  POST   /api/admin/ips/block         - Block IP address`);
  console.log(`  GET    /api/admin/ips/blocked       - List blocked IPs`);
  console.log(`  POST   /api/admin/ips/:ip/unblock   - Unblock IP`);
  console.log(`  GET    /api/admin/actions           - Audit log`);
  console.log(`  GET    /api/admin/stats             - Server statistics`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

export default app;

