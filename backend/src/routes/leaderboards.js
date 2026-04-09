/**
 * Leaderboard Routes
 * Handles ranking and leaderboard queries
 */

import express from 'express';
import { Player } from '../models/Player.js';
import { Guild } from '../models/Guild.js';

const router = express.Router();

/**
 * GET /api/leaderboards/players
 * Get top players by rank (ELO rating)
 */
router.get('/players', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const skip = Math.max(0, parseInt(offset) || 0);
    const take = Math.min(1000, parseInt(limit) || 100);

    const players = await Player.find(
      { isActive: true, isBanned: false },
      'username displayName avatar gameData.level gameData.prestige.level multiplayer.rank multiplayer.winRate multiplayer.duelsWon multiplayer.duelsLost createdAt'
    )
      .sort({ 'multiplayer.rank': -1 })
      .skip(skip)
      .limit(take);

    const total = await Player.countDocuments({ isActive: true, isBanned: false });

    const leaderboard = players.map((p, idx) => ({
      rank: skip + idx + 1,
      playerId: p._id,
      username: p.username,
      displayName: p.displayName,
      avatar: p.avatar,
      level: p.gameData.level,
      prestigeLevel: p.gameData.prestige.level,
      eloRating: p.multiplayer.rank,
      winRate: p.multiplayer.winRate,
      duelsWon: p.multiplayer.duelsWon,
      duelsLost: p.multiplayer.duelsLost,
      joinedAt: p.createdAt,
    }));

    res.json({
      leaderboard,
      pagination: {
        total,
        limit: take,
        offset: skip,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get player leaderboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/leaderboards/players/:period
 * Get top players for a specific period (daily, weekly, monthly)
 */
router.get('/players/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { limit = 50 } = req.query;

    const validPeriods = ['daily', 'weekly', 'monthly'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }

    // Calculate time cutoff
    const now = new Date();
    let cutoffDate = new Date(now);

    switch (period) {
      case 'daily':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case 'weekly':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'monthly':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
    }

    // For period-based rankings, we'd need to track match history
    // For now, return regular rankings with a note
    const players = await Player.find(
      { isActive: true, isBanned: false, createdAt: { $gte: cutoffDate } },
      'username displayName avatar gameData.level multiplayer.rank multiplayer.winRate multiplayer.duelsWon'
    )
      .sort({ 'multiplayer.rank': -1 })
      .limit(parseInt(limit));

    const leaderboard = players.map((p, idx) => ({
      rank: idx + 1,
      playerId: p._id,
      username: p.username,
      displayName: p.displayName,
      avatar: p.avatar,
      level: p.gameData.level,
      eloRating: p.multiplayer.rank,
      winRate: p.multiplayer.winRate,
      duelsWon: p.multiplayer.duelsWon,
    }));

    res.json({
      period,
      leaderboard,
    });
  } catch (error) {
    console.error('Get period leaderboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/leaderboards/guilds
 * Get top guilds by consecutive wins or war stats
 */
router.get('/guilds', async (req, res) => {
  try {
    const { limit = 50, offset = 0, sortBy = 'consecutiveWins' } = req.query;
    const skip = Math.max(0, parseInt(offset) || 0);
    const take = Math.min(500, parseInt(limit) || 50);

    const validSortFields = ['consecutiveWins', 'totalWarsWon', 'level'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'consecutiveWins';
    const sortOrder = { [`wars.${sortField}`]: -1 };

    const guilds = await Guild.find({ isActive: true, disbandedAt: { $exists: false } })
      .sort(sortOrder)
      .skip(skip)
      .limit(take)
      .populate('leaderId', 'username displayName avatar');

    const total = await Guild.countDocuments({ isActive: true, disbandedAt: { $exists: false } });

    const leaderboard = guilds.map((g, idx) => ({
      rank: skip + idx + 1,
      guildId: g._id,
      name: g.name,
      icon: g.icon,
      leaderId: g.leaderId._id,
      leaderName: g.leaderId.username,
      level: g.level,
      memberCount: g.members.length,
      consecutiveWins: g.wars.consecutiveWins,
      totalWarsWon: g.wars.totalWarsWon,
      totalWarsLost: g.wars.totalWarsLost,
      treasury: g.treasury.currency,
      createdAt: g.createdAt,
    }));

    res.json({
      leaderboard,
      pagination: {
        total,
        limit: take,
        offset: skip,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get guild leaderboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch guild leaderboard' });
  }
});

/**
 * GET /api/leaderboards/player/:id/rank
 * Get a specific player's rank and nearby players
 */
router.get('/player/:id/rank', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Count players with higher rank
    const betterCount = await Player.countDocuments({
      'multiplayer.rank': { $gt: player.multiplayer.rank },
      isActive: true,
    });

    const rank = betterCount + 1;

    // Get nearby players (5 above, 5 below)
    const nearby = await Player.find(
      { isActive: true },
      'username displayName avatar gameData.level multiplayer.rank multiplayer.winRate'
    )
      .sort({ 'multiplayer.rank': -1 })
      .skip(Math.max(0, rank - 6))
      .limit(11);

    res.json({
      playerId: player._id,
      username: player.username,
      rank,
      eloRating: player.multiplayer.rank,
      winRate: player.multiplayer.winRate,
      nearby: nearby.map((p, idx) => ({
        rank: rank - 6 + idx,
        username: p.username,
        displayName: p.displayName,
        eloRating: p.multiplayer.rank,
      })),
    });
  } catch (error) {
    console.error('Get player rank error:', error.message);
    res.status(500).json({ error: 'Failed to fetch player rank' });
  }
});

/**
 * GET /api/leaderboards/stats
 * Get overall leaderboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalPlayers, activePlayers, totalGuilds, totalDuels, totalWarWins] = await Promise.all([
      Player.countDocuments({}),
      Player.countDocuments({ isActive: true, isBanned: false }),
      Guild.countDocuments({ isActive: true }),
      Player.aggregate([{ $group: { _id: null, total: { $sum: { $add: ['$multiplayer.duelsWon', '$multiplayer.duelsLost'] } } } }]),
      Guild.aggregate([{ $group: { _id: null, total: { $sum: '$wars.totalWarsWon' } } }]),
    ]);

    const topPlayer = await Player.findOne({ isActive: true }, 'username multiplayer.rank')
      .sort({ 'multiplayer.rank': -1 });

    const topGuild = await Guild.findOne({ isActive: true }, 'name wars.consecutiveWins')
      .sort({ 'wars.consecutiveWins': -1 });

    res.json({
      players: {
        total: totalPlayers,
        active: activePlayers,
        topPlayer: topPlayer
          ? {
              username: topPlayer.username,
              eloRating: topPlayer.multiplayer.rank,
            }
          : null,
      },
      guilds: {
        total: totalGuilds,
        topGuild: topGuild
          ? {
              name: topGuild.name,
              consecutiveWins: topGuild.wars.consecutiveWins,
            }
          : null,
      },
      global: {
        totalDuels: totalDuels[0]?.total || 0,
        totalGuildWarWins: totalWarWins[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get leaderboard stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
