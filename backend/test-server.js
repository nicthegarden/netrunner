/**
 * NETRUNNER Test Server - Mock Backend for Testing
 * Simulates all endpoints without needing MongoDB/Redis
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Store data in memory for testing
const testData = {
  players: [
    { id: '1', username: 'TestPlayer1', level: 50, xp: 125000, elo: 1500, eurodollar: 50000, playtime: 3600 },
    { id: '2', username: 'TestPlayer2', level: 45, xp: 95000, elo: 1400, eurodollar: 35000, playtime: 2800 },
    { id: '3', username: 'TestPlayer3', level: 60, xp: 180000, elo: 1600, eurodollar: 75000, playtime: 5400 },
  ],
  guilds: [
    { id: '1', name: 'Netrunners United', tag: 'NU', members: 12, level: 10 },
    { id: '2', name: 'Code Breakers', tag: 'CB', members: 8, level: 7 },
    { id: '3', name: 'Street Legends', tag: 'SL', members: 15, level: 12 },
  ],
  events: [
    { id: '1', name: 'Guild War: Black ICE', type: 'guild_war', status: 'active', boss: 'Rogue Netrunner' },
    { id: '2', name: 'Tournament: PvP Elite', type: 'tournament', status: 'upcoming', participants: 24 },
  ],
  duels: [
    { id: '1', player1: 'TestPlayer1', player2: 'TestPlayer2', winner: 'TestPlayer1', wager: 5000, status: 'completed' },
  ],
};

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: {
      env: 'test',
      port: 3000,
      uptime: process.uptime(),
    },
    database: {
      connected: true,
      type: 'in-memory (test)',
    },
  });
});

// API Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    server: {
      env: 'test',
      port: 3000,
      uptime: process.uptime(),
    },
    features: {
      pvp: true,
      guilds: true,
      events: true,
      bots: true,
      websocket: true,
    },
    totalPlayers: testData.players.length,
    totalGuilds: testData.guilds.length,
    totalEvents: testData.events.length,
  });
});

// ==================
// Player Endpoints
// ==================

app.get('/api/players/leaderboard', (req, res) => {
  const sorted = [...testData.players].sort((a, b) => b.xp - a.xp);
  res.json({
    leaderboard: sorted.map((p, i) => ({ rank: i + 1, ...p })),
  });
});

app.get('/api/players/:id', (req, res) => {
  const player = testData.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

app.get('/api/players/profile', (req, res) => {
  res.json(testData.players[0]);
});

// ==================
// Guild Endpoints
// ==================

app.get('/api/guilds', (req, res) => {
  res.json({
    guilds: testData.guilds,
  });
});

app.get('/api/guilds/:id', (req, res) => {
  const guild = testData.guilds.find(g => g.id === req.params.id);
  if (!guild) return res.status(404).json({ error: 'Guild not found' });
  res.json(guild);
});

app.post('/api/guilds', (req, res) => {
  const newGuild = {
    id: String(testData.guilds.length + 1),
    name: req.body.name || 'New Guild',
    tag: req.body.tag || 'NG',
    members: 1,
    level: 1,
  };
  testData.guilds.push(newGuild);
  res.status(201).json(newGuild);
});

// ==================
// Leaderboard Endpoints
// ==================

app.get('/api/leaderboards/xp', (req, res) => {
  const limit = req.query.limit || 10;
  const sorted = [...testData.players].sort((a, b) => b.xp - a.xp).slice(0, limit);
  res.json({
    leaderboard: 'XP',
    entries: sorted.map((p, i) => ({ rank: i + 1, ...p })),
  });
});

app.get('/api/leaderboards/elo', (req, res) => {
  const limit = req.query.limit || 10;
  const sorted = [...testData.players].sort((a, b) => b.elo - a.elo).slice(0, limit);
  res.json({
    leaderboard: 'ELO',
    entries: sorted.map((p, i) => ({ rank: i + 1, ...p })),
  });
});

app.get('/api/leaderboards/wealth', (req, res) => {
  const limit = req.query.limit || 10;
  const sorted = [...testData.players].sort((a, b) => b.eurodollar - a.eurodollar).slice(0, limit);
  res.json({
    leaderboard: 'Wealth',
    entries: sorted.map((p, i) => ({ rank: i + 1, ...p })),
  });
});

// ==================
// PvP Endpoints
// ==================

app.post('/api/pvp/challenge', (req, res) => {
  const challenge = {
    id: String(testData.duels.length + 1),
    challenger: req.body.challenger || 'TestPlayer1',
    opponent: req.body.opponent || 'TestPlayer2',
    wager: req.body.wager || 5000,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  testData.duels.push(challenge);
  res.status(201).json(challenge);
});

app.get('/api/pvp/history/:id', (req, res) => {
  const playerDuels = testData.duels.filter(
    d => d.player1 === req.params.id || d.player2 === req.params.id
  );
  res.json({ history: playerDuels });
});

app.get('/api/pvp/stats/:id', (req, res) => {
  const player = testData.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json({
    ...player,
    duelsWon: testData.duels.filter(d => d.winner === player.username).length,
    duelsLost: testData.duels.filter(d => d.winner && d.winner !== player.username).length,
    winRate: '67%',
  });
});

// ==================
// Event Endpoints
// ==================

app.get('/api/events', (req, res) => {
  res.json({ events: testData.events });
});

app.get('/api/events/current', (req, res) => {
  const current = testData.events.find(e => e.status === 'active');
  res.json(current || { error: 'No active event' });
});

app.post('/api/events/:id/join', (req, res) => {
  const event = testData.events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ message: 'Joined event', event });
});

// ==================
// Error Handlers
// ==================

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     NETRUNNER MULTIPLAYER BACKEND - TEST SERVER ✓         ║
║                                                            ║
║  🚀 Server running on http://localhost:${port}
║  📝 Mode: Test/Mock (In-Memory)
║  ✓ Health: http://localhost:${port}/health
║  ✓ Status: http://localhost:${port}/api/status
║  ✓ Leaderboard: http://localhost:${port}/api/players/leaderboard
║                                                            ║
║  Ready for testing! 🎮                                    ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
