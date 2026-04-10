import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import PlayerModel from '../models/player.js';

const router = express.Router();

/**
 * POST /api/register
 * Register a new player with just a username
 */
router.post('/register', async (req, res) => {
  try {
    const { username } = req.body;

    // Validate
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Username must be 3-32 characters' });
    }

    // Check if username already exists
    const existing = await PlayerModel.getByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create player
    const player = await PlayerModel.create(username);

    // Generate simple token (stored in localStorage)
    const token = uuidv4();

    // Store token in memory (in production, could use Redis)
    // For now, token is just UUID that client stores
    if (!global.playerTokens) {
      global.playerTokens = new Map();
    }
    global.playerTokens.set(token, {
      playerId: player.id,
      username: player.username,
      createdAt: Date.now()
    });

    res.status(201).json({
      status: 'success',
      player_id: player.id,
      username: player.username,
      token,
      message: 'Player registered successfully'
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/players/me
 * Get current player profile (requires token)
 */
router.get('/players/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = global.playerTokens?.get(token);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const player = await PlayerModel.getById(tokenData.playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const guild = await PlayerModel.getGuild(player.id);

    res.json({
      status: 'success',
      player_id: player.id,
      username: player.username,
      total_xp: player.total_xp || 0,
      prestige_level: player.prestige_level || 0,
      avg_level: player.avg_level || 1,
      playtime_seconds: player.playtime_seconds || 0,
      guild_id: guild?.id || null,
      guild_name: guild?.name || null,
      last_sync: player.last_sync
    });

  } catch (err) {
    console.error('Get player error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
