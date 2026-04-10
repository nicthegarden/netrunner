import express from 'express';
import { db } from '../db.js';
import PlayerModel from '../models/player.js';
import SyncModel from '../models/sync.js';

const router = express.Router();

/**
 * POST /api/sync
 * Core multiplayer sync endpoint - processes offline changes
 */
router.post('/sync', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = global.playerTokens?.get(token);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const playerId = tokenData.playerId;
    const { player_state, sync_log, last_sync, client_checksum } = req.body;

    // Validate player state
    if (!player_state) {
      return res.status(400).json({ error: 'Missing player_state' });
    }

    try {
      SyncModel.validatePlayerState(player_state);
    } catch (err) {
      return res.status(422).json({ error: err.message });
    }

    // Process sync - all async operations
    // Update player stats
    await PlayerModel.updateStats(playerId, player_state);

    // Process sync log entries
    const syncResult = await SyncModel.processSyncLog(playerId, sync_log || [], last_sync);

    // Auto-join events
    const eventIds = await SyncModel.autoJoinEvents(playerId);

    // Calculate leaderboard position
    const allPlayers = await PlayerModel.getAllForLeaderboard();
    const playerRank = allPlayers.findIndex(p => p.id === playerId) + 1;

    // Update guild contribution if member
    const guild = await PlayerModel.getGuild(playerId);
    if (guild && syncResult.totalXpGained > 0) {
      await PlayerModel.updateGuildContribution(playerId, guild.id, syncResult.totalXpGained);
    }

    const now = new Date().toISOString();

    res.json({
      status: 'success',
      server_timestamp: now,
      updates: {
        leaderboard_position: playerRank,
        total_players: allPlayers.length,
        xp_recorded: syncResult.totalXpGained,
        sync_logs_processed: syncResult.logsProcessed,
        guild_updates: {
          guild_id: guild?.id || null,
          contribution_recorded: syncResult.totalXpGained,
          treasury_now: guild?.treasury_eurodollars || 0
        },
        events_auto_joined: eventIds
      }
    });

  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

/**
 * GET /api/sync/status
 * Check sync status (for debugging)
 */
router.get('/sync/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = global.playerTokens?.get(token);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const playerId = tokenData.playerId;
    const lastSync = await SyncModel.getLastSync(playerId);
    const player = await PlayerModel.getById(playerId);

    res.json({
      status: 'ok',
      player_id: playerId,
      username: player?.username,
      last_sync: lastSync?.server_timestamp || null,
      last_sync_age_seconds: lastSync ? 
        Math.floor((Date.now() - new Date(lastSync.server_timestamp)) / 1000) : 
        'never'
    });

  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Status check failed' });
  }
});

export default router;
