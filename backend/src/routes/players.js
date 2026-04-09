/**
 * Player Routes
 * Handles player profile, stats, game progress synchronization, and multiplayer management
 */

import express from 'express';
import { requireAuth, requireActive } from '../middleware/auth.js';
import { Player } from '../models/Player.js';
import { Guild } from '../models/Guild.js';

const router = express.Router();

/**
 * GET /api/players/:id
 * Get player profile information
 */
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Don't expose sensitive info to other players
    const profile = player.fullProfile;
    profile.level = player.gameData.level;
    profile.prestigeLevel = player.gameData.prestige.level;
    profile.winRate = player.multiplayer.winRate;
    profile.rank = player.multiplayer.rank;
    profile.duelsWon = player.multiplayer.duelsWon;
    profile.duelsLost = player.multiplayer.duelsLost;
    profile.guildId = player.multiplayer.guildId;
    profile.bio = player.bio;

    res.json({ player: profile });
  } catch (error) {
    console.error('Get player error:', error.message);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

/**
 * PUT /api/players/:id
 * Update player profile (requires authentication)
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    // Only allow players to update their own profile
    if (req.player.id !== req.params.id && !req.player.isAdmin) {
      return res.status(403).json({ error: 'Cannot update other players' profiles' });
    }

    const { displayName, bio, avatar } = req.body;

    // Validation
    if (displayName && displayName.length > 50) {
      return res.status(400).json({ error: 'Display name too long' });
    }

    if (bio && bio.length > 200) {
      return res.status(400).json({ error: 'Bio too long' });
    }

    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update allowed fields
    if (displayName) player.displayName = displayName;
    if (bio !== undefined) player.bio = bio;
    if (avatar) player.avatar = avatar;

    await player.save();

    res.json({
      message: 'Profile updated successfully',
      player: player.fullProfile,
    });
  } catch (error) {
    console.error('Update player error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/players/:id/sync
 * Sync game progress from single-player save file
 */
router.post('/:id/sync', requireAuth, requireActive, async (req, res) => {
  try {
    // Only allow players to sync their own data
    if (req.player.id !== req.params.id) {
      return res.status(403).json({ error: 'Cannot sync other players data' });
    }

    const { gameData } = req.body;

    if (!gameData) {
      return res.status(400).json({ error: 'Game data required' });
    }

    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update game data with unified progress model
    // Only level, totalXP, and prestige are multiplayer-relevant
    player.gameData.level = gameData.level || player.gameData.level;
    player.gameData.totalXP = gameData.totalXP || player.gameData.totalXP;
    player.gameData.skills = gameData.skills || player.gameData.skills;
    player.gameData.inventory = gameData.inventory || player.gameData.inventory;
    player.gameData.equipment = gameData.equipment || player.gameData.equipment;
    player.gameData.currency = gameData.currency || player.gameData.currency;
    player.gameData.prestige = gameData.prestige || player.gameData.prestige;
    player.gameData.achievements = gameData.achievements || player.gameData.achievements;
    player.gameData.playTime = gameData.playTime || player.gameData.playTime;

    player.lastSyncAt = new Date();
    await player.save();

    res.json({
      message: 'Game progress synced successfully',
      lastSyncAt: player.lastSyncAt,
    });
  } catch (error) {
    console.error('Sync game data error:', error.message);
    res.status(500).json({ error: 'Failed to sync game progress' });
  }
});

/**
 * GET /api/players/:id/stats
 * Get player multiplayer statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const stats = {
      playerId: player._id,
      username: player.username,
      level: player.gameData.level,
      prestigeLevel: player.gameData.prestige.level,
      playTime: player.gameData.playTime,
      achievements: player.gameData.achievements.length,

      // Multiplayer stats
      rank: player.multiplayer.rank,
      winRate: player.multiplayer.winRate,
      duelsWon: player.multiplayer.duelsWon,
      duelsLost: player.multiplayer.duelsLost,
      currencyWon: player.multiplayer.currencyWon,
      currencyLost: player.multiplayer.currencyLost,
      guildId: player.multiplayer.guildId,

      // Timestamps
      createdAt: player.createdAt,
      lastLoginAt: player.lastLoginAt,
      lastSyncAt: player.lastSyncAt,
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get player stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

/**
 * POST /api/players/:id/guild/leave
 * Leave current guild
 */
router.post('/:id/guild/leave', requireAuth, requireActive, async (req, res) => {
  try {
    // Only allow players to affect their own guild membership
    if (req.player.id !== req.params.id) {
      return res.status(403).json({ error: 'Cannot modify other players guild membership' });
    }

    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!player.multiplayer.guildId) {
      return res.status(400).json({ error: 'Player is not in a guild' });
    }

    // Remove from guild
    const guild = await Guild.findById(player.multiplayer.guildId);
    if (guild) {
      guild.removeMember(player._id);
      await guild.save();
    }

    // Clear player's guild reference
    player.multiplayer.guildId = null;
    await player.save();

    res.json({ message: 'Left guild successfully' });
  } catch (error) {
    console.error('Leave guild error:', error.message);
    res.status(500).json({ error: 'Failed to leave guild' });
  }
});

/**
 * GET /api/players/:id/guild
 * Get player's guild information
 */
router.get('/:id/guild', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!player.multiplayer.guildId) {
      return res.status(404).json({ error: 'Player is not in a guild' });
    }

    const guild = await Guild.findById(player.multiplayer.guildId).populate('members.playerId');
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json({ guild });
  } catch (error) {
    console.error('Get player guild error:', error.message);
    res.status(500).json({ error: 'Failed to fetch guild' });
  }
});

/**
 * GET /api/players/search/:query
 * Search for players by username
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    if (query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const players = await Player.find(
      { $or: [{ username: new RegExp(query, 'i') }, { displayName: new RegExp(query, 'i') }] },
      'username displayName avatar gameData.level multiplayer.rank'
    )
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      query,
      count: players.length,
      players: players.map((p) => ({
        id: p._id,
        username: p.username,
        displayName: p.displayName,
        avatar: p.avatar,
        level: p.gameData.level,
        rank: p.multiplayer.rank,
      })),
    });
  } catch (error) {
    console.error('Search players error:', error.message);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

export default router;
