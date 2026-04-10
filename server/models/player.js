import { db } from '../db.js';

/**
 * Player model - database queries
 * All methods are async to work with sqlite3 package
 */

export class PlayerModel {
  /**
   * Get player by ID
   */
  static async getById(playerId) {
    return await db.get(`
      SELECT p.*, ps.* FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      WHERE p.id = ?
    `, [playerId]);
  }

  /**
   * Get player by username
   */
  static async getByUsername(username) {
    return await db.get(`
      SELECT p.*, ps.* FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      WHERE p.username = ?
    `, [username]);
  }

  /**
   * Create new player
   */
  static async create(username) {
    const result = await db.run(`INSERT INTO players (username) VALUES (?)`, [username]);
    
    // Create player_stats row
    await db.run(`
      INSERT INTO player_stats (player_id, total_xp, prestige_level, avg_level)
      VALUES (?, 0, 0, 1)
    `, [result.lastID]);

    return this.getById(result.lastID);
  }

  /**
   * Update player stats on sync
   */
  static async updateStats(playerId, playerState) {
    await db.run(`
      UPDATE player_stats
      SET total_xp = ?,
          prestige_level = ?,
          avg_level = ?,
          playtime_seconds = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE player_id = ?
    `, [
      playerState.total_xp || 0,
      playerState.prestige_level || 0,
      playerState.avg_level || 1,
      playerState.playtime_seconds || 0,
      playerId
    ]);

    // Update last_sync timestamp
    await db.run(`
      UPDATE players SET last_sync = CURRENT_TIMESTAMP WHERE id = ?
    `, [playerId]);

    return this.getById(playerId);
  }

  /**
   * Get player's guild (if member)
   */
  static async getGuild(playerId) {
    return await db.get(`
      SELECT g.* FROM guilds g
      JOIN guild_members gm ON g.id = gm.guild_id
      WHERE gm.player_id = ? LIMIT 1
    `, [playerId]);
  }

  /**
   * Get all players with stats (for leaderboard)
   */
  static async getAllForLeaderboard() {
    return await db.all(`
      SELECT p.id, p.username, ps.total_xp, ps.prestige_level, ps.avg_level
      FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      ORDER BY ps.total_xp DESC
    `);
  }

  /**
   * Record sync log entry
   */
  static async recordSync(playerId, action, skillId, amount, details, clientTimestamp) {
    await db.run(`
      INSERT INTO sync_log (player_id, action, skill_id, amount, details, client_timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [playerId, action, skillId, amount, details, clientTimestamp]);
  }

  /**
   * Get contribution XP for player in guild
   */
  static async getGuildContribution(playerId, guildId) {
    const result = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total_xp FROM sync_log
      WHERE player_id = ? 
        AND action = 'xp_gain'
        AND server_timestamp >= (
          SELECT joined_at FROM guild_members 
          WHERE guild_id = ? AND player_id = ?
        )
    `, [playerId, guildId, playerId]);
    return result?.total_xp || 0;
  }

  /**
   * Update guild member contribution
   */
  static async updateGuildContribution(playerId, guildId, xpAmount) {
    await db.run(`
      UPDATE guild_members
      SET contribution_xp = contribution_xp + ?
      WHERE player_id = ? AND guild_id = ?
    `, [xpAmount, playerId, guildId]);
  }
}

export default PlayerModel;
