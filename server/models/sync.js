import { db } from '../db.js';
import crypto from 'crypto';

/**
 * Sync model - validation and processing
 * All methods are async to work with sqlite3 package
 */

export class SyncModel {
  /**
   * Calculate checksum of player state (for validation)
   */
  static calculateChecksum(playerState) {
    const json = JSON.stringify(playerState);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /**
   * Validate player state format
   */
  static validatePlayerState(playerState) {
    const required = ['skills', 'inventory', 'equipment', 'currency', 'prestige_level', 'playtime_seconds'];
    for (const field of required) {
      if (playerState[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return true;
  }

  /**
   * Process sync log entries and record them
   */
  static async processSyncLog(playerId, syncLog, lastSyncTime) {
    if (!Array.isArray(syncLog)) return { totalXpGained: 0, logsProcessed: 0 };

    // Process XP gains - prevent duplicates
    let totalXpGained = 0;
    const xpGains = syncLog.filter(log => log.action === 'xp_gain');
    
    for (const log of xpGains) {
      // Prevent duplicate XP from same offline period
      const existing = await db.get(`
        SELECT COUNT(*) as count FROM sync_log
        WHERE player_id = ? 
          AND action = 'xp_gain'
          AND skill_id = ?
          AND amount = ?
          AND client_timestamp = ?
      `, [playerId, log.skill_id, log.amount, log.timestamp]);

      if ((existing?.count || 0) === 0) {
        totalXpGained += log.amount || 0;
      }
    }

    // Record all sync log entries
    for (const log of syncLog) {
      await db.run(`
        INSERT INTO sync_log (player_id, action, skill_id, amount, details, client_timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        playerId,
        log.action,
        log.skill_id || null,
        log.amount || 0,
        JSON.stringify(log.details || {}),
        log.timestamp ? new Date(log.timestamp).toISOString() : null
      ]);
    }

    return {
      totalXpGained,
      logsProcessed: syncLog.length
    };
  }

  /**
   * Get sync statistics for player
   */
  static async getLastSync(playerId) {
    return await db.get(`
      SELECT server_timestamp FROM sync_log
      WHERE player_id = ?
      ORDER BY server_timestamp DESC
      LIMIT 1
    `, [playerId]);
  }

  /**
   * Calculate guild contribution from sync logs
   */
  static async calculateGuildContribution(playerId, guildId) {
    const result = await db.get(`
      SELECT COALESCE(SUM(sl.amount), 0) as total_xp
      FROM sync_log sl
      WHERE sl.player_id = ?
        AND sl.action = 'xp_gain'
        AND sl.server_timestamp >= (
          SELECT joined_at FROM guild_members
          WHERE guild_id = ? AND player_id = ?
        )
    `, [playerId, guildId, playerId]);
    return result?.total_xp || 0;
  }

  /**
   * Auto-join player to active events
   */
  static async autoJoinEvents(playerId) {
    const now = new Date().toISOString();
    
    // Get all active events
    const events = await db.all(`
      SELECT id FROM events
      WHERE status = 'active'
        AND start_time <= ?
        AND end_time > ?
    `, [now, now]);

    const joined = [];
    for (const event of events) {
      // Check if already joined
      const existing = await db.get(`
        SELECT id FROM event_participation
        WHERE event_id = ? AND player_id = ?
      `, [event.id, playerId]);

      if (!existing) {
        await db.run(`
          INSERT INTO event_participation (event_id, player_id, score)
          VALUES (?, ?, 0)
        `, [event.id, playerId]);
        joined.push(event.id);
      }
    }

    return joined;
  }
}

export default SyncModel;
