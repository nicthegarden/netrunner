/**
 * PvP Routes
 * Handles duel challenges, acceptance, and completion
 */

import express from 'express';
import { requireAuth, requireActive } from '../middleware/auth.js';
import { Player } from '../models/Player.js';
import { PvPMatch } from '../models/PvPMatch.js';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * POST /api/pvp/challenge
 * Challenge another player to a duel
 */
router.post('/challenge', requireAuth, requireActive, async (req, res) => {
  try {
    const { opponentId, stakes } = req.body;

    if (!opponentId) {
      return res.status(400).json({ error: 'Opponent ID required' });
    }

    if (!config.features.pvp) {
      return res.status(403).json({ error: 'PvP is disabled' });
    }

    // Validate stakes
    const stakeAmount = stakes || config.game.duel.currencyMin;
    if (stakeAmount < config.game.duel.currencyMin || stakeAmount > config.game.duel.currencyMax) {
      return res.status(400).json({
        error: `Stakes must be between ${config.game.duel.currencyMin} and ${config.game.duel.currencyMax}`,
      });
    }

    // Get challenger and opponent
    const challenger = await Player.findById(req.player.id);
    if (!challenger || challenger.isBanned) {
      return res.status(404).json({ error: 'Challenger not found' });
    }

    if (challenger.gameData.currency < stakeAmount) {
      return res.status(400).json({ error: 'Insufficient currency for stakes' });
    }

    const opponent = await Player.findById(opponentId);
    if (!opponent || opponent.isBanned) {
      return res.status(404).json({ error: 'Opponent not found' });
    }

    if (opponent.gameData.currency < stakeAmount) {
      return res.status(400).json({ error: 'Opponent has insufficient currency' });
    }

    // Cannot challenge yourself
    if (challenger._id.toString() === opponent._id.toString()) {
      return res.status(400).json({ error: 'Cannot challenge yourself' });
    }

    // Create match
    const match = new PvPMatch({
      challenger: {
        playerId: challenger._id,
        username: challenger.username,
        hp: 100,
        maxHp: 100,
      },
      wager: {
        stakes: stakeAmount,
      },
      matchType: 'duel',
    });

    await match.save();

    res.status(201).json({
      message: 'Challenge sent',
      match: {
        id: match._id,
        challengerId: challenger._id,
        challengerName: challenger.username,
        stakes: stakeAmount,
        status: 'pending',
        expiresAt: match.expiresAt,
      },
    });
  } catch (error) {
    console.error('Challenge error:', error.message);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

/**
 * POST /api/pvp/challenge/:matchId/accept
 * Accept a duel challenge
 */
router.post('/challenge/:matchId/accept', requireAuth, requireActive, async (req, res) => {
  try {
    const match = await PvPMatch.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'pending') {
      return res.status(400).json({ error: 'Match is not available' });
    }

    if (match.expiresAt < new Date()) {
      match.status = 'cancelled';
      await match.save();
      return res.status(400).json({ error: 'Challenge has expired' });
    }

    const opponent = await Player.findById(req.player.id);
    if (!opponent || opponent.isBanned) {
      return res.status(404).json({ error: 'Opponent not found' });
    }

    if (opponent.gameData.currency < match.wager.stakes) {
      return res.status(400).json({ error: 'Insufficient currency for stakes' });
    }

    // Accept match
    match.accept(opponent._id, opponent.username);
    await match.save();

    res.json({
      message: 'Challenge accepted',
      match: {
        id: match._id,
        status: 'accepted',
        startTime: new Date(Date.now() + 5000), // Start in 5 seconds
      },
    });
  } catch (error) {
    console.error('Accept challenge error:', error.message);
    res.status(500).json({ error: 'Failed to accept challenge' });
  }
});

/**
 * POST /api/pvp/challenge/:matchId/decline
 * Decline a duel challenge
 */
router.post('/challenge/:matchId/decline', requireAuth, async (req, res) => {
  try {
    const match = await PvPMatch.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'pending') {
      return res.status(400).json({ error: 'Match is not available' });
    }

    match.status = 'cancelled';
    await match.save();

    res.json({ message: 'Challenge declined' });
  } catch (error) {
    console.error('Decline challenge error:', error.message);
    res.status(500).json({ error: 'Failed to decline challenge' });
  }
});

/**
 * GET /api/pvp/pending
 * Get pending challenges for current player
 */
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const matches = await PvPMatch.find({
      'challenger.playerId': { $ne: player._id },
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      count: matches.length,
      challenges: matches.map((m) => ({
        id: m._id,
        challengerId: m.challenger.playerId,
        challengerName: m.challenger.username,
        stakes: m.wager.stakes,
        createdAt: m.createdAt,
        expiresAt: m.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Get pending challenges error:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending challenges' });
  }
});

/**
 * GET /api/pvp/history/:playerId
 * Get duel history for a player
 */
router.get('/history/:playerId', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const matches = await PvPMatch.find(
      {
        $or: [{ 'challenger.playerId': req.params.playerId }, { 'opponent.playerId': req.params.playerId }],
        status: 'completed',
      },
      'challenger opponent result.winnerId result.reason result.currencyWon result.currencyLost completedAt'
    )
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));

    const history = matches.map((m) => ({
      matchId: m._id,
      challenger: m.challenger.username,
      opponent: m.opponent.username,
      winner: m.result.winnerId.toString() === req.params.playerId ? 'won' : 'lost',
      reason: m.result.reason,
      currencyWon: m.result.winnerId.toString() === req.params.playerId ? m.result.currencyWon : 0,
      currencyLost: m.result.loserId.toString() === req.params.playerId ? m.result.currencyLost : 0,
      completedAt: m.completedAt,
    }));

    res.json({
      playerId: req.params.playerId,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Get duel history error:', error.message);
    res.status(500).json({ error: 'Failed to fetch duel history' });
  }
});

/**
 * GET /api/pvp/stats/:playerId
 * Get PvP statistics for a player
 */
router.get('/stats/:playerId', async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const totalDuels = player.multiplayer.duelsWon + player.multiplayer.duelsLost;
    const winRate = totalDuels > 0 ? (player.multiplayer.duelsWon / totalDuels) * 100 : 0;

    res.json({
      playerId: player._id,
      username: player.username,
      stats: {
        duelsWon: player.multiplayer.duelsWon,
        duelsLost: player.multiplayer.duelsLost,
        totalDuels,
        winRate,
        eloRating: player.multiplayer.rank,
        currencyWon: player.multiplayer.currencyWon,
        currencyLost: player.multiplayer.currencyLost,
        netProfit: player.multiplayer.currencyWon - player.multiplayer.currencyLost,
      },
    });
  } catch (error) {
    console.error('Get PvP stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch PvP stats' });
  }
});

export default router;
