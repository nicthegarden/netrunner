import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
console.log('Initializing database...');
initializeDatabase();

// Global storage for tokens (in-memory, for this week)
// TODO: Move to Redis or persistent storage
global.playerTokens = new Map();

// Routes
app.use('/api', authRoutes);
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
  console.log('║  NETRUNNER Multiplayer Server (Week 1)         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Database: game.db`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  POST   /api/register           - Register new player`);
  console.log(`  GET    /api/players/me         - Get player profile`);
  console.log(`  POST   /api/sync               - Sync offline changes`);
  console.log(`  GET    /api/sync/status        - Check sync status`);
  console.log(`  GET    /health                 - Health check`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

export default app;
