import express from 'express';
import { db, hashPassword } from '../db.js';
import {
  authenticateToken,
  requireAdmin,
  checkAdminIP,
  generateAccessToken
} from '../middleware/auth.js';

const router = express.Router();

// All admin routes require IP check and authentication
router.use(checkAdminIP);
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users with stats
 */
router.get('/admin/users', async (req, res) => {
  try {
    const users = await db.all(
      `SELECT u.id, u.username, u.email, u.created_at, u.last_login, u.is_banned, u.is_admin,
              p.total_xp, p.prestige_level, p.playtime_seconds, p.currency_earned
       FROM users u
       LEFT JOIN player_profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC`,
      []
    );

    res.json({
      status: 'success',
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        isAdmin: u.is_admin === 1,
        isBanned: u.is_banned === 1,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        stats: {
          totalXP: u.total_xp || 0,
          prestigeLevel: u.prestige_level || 0,
          playtimeSeconds: u.playtime_seconds || 0,
          currencyEarned: u.currency_earned || 0
        }
      }))
    });

  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get detailed user info
 */
router.get('/admin/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await db.get(
      `SELECT u.*, p.* FROM users u
       LEFT JOIN player_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const actions = await db.all(
      `SELECT * FROM admin_actions WHERE target_user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    const saves = await db.all(
      `SELECT id, save_timestamp, playtime_seconds FROM game_saves 
       WHERE user_id = ? ORDER BY save_timestamp DESC LIMIT 10`,
      [userId]
    );

    res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin === 1,
        isBanned: user.is_banned === 1,
        banReason: user.ban_reason,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        stats: {
          totalXP: user.total_xp || 0,
          prestigeLevel: user.prestige_level || 0,
          playtimeSeconds: user.playtime_seconds || 0
        }
      },
      adminActions: actions,
      recentSaves: saves
    });

  } catch (err) {
    console.error('Get user detail error:', err);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

/**
 * POST /api/admin/users/:userId/ban
 * Ban a user account
 * Body: { reason }
 */
router.post('/admin/users/:userId/ban', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Can't ban yourself
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ban user
    await db.run(
      `UPDATE users SET is_banned = 1, ban_reason = ?, banned_at = datetime('now') WHERE id = ?`,
      [reason || 'Banned by admin', userId]
    );

    // Log action
    await db.run(
      `INSERT INTO admin_actions (admin_id, target_user_id, action_type, description, created_at)
       VALUES (?, ?, 'BAN', ?, datetime('now'))`,
      [adminId, userId, reason || 'No reason provided']
    );

    // Delete all active sessions
    await db.run(
      'DELETE FROM sessions WHERE user_id = ?',
      [userId]
    );

    res.json({
      status: 'success',
      message: `User ${user.username} has been banned`,
      user: { id: user.id, username: user.username }
    });

  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

/**
 * POST /api/admin/users/:userId/unban
 * Unban a user account
 */
router.post('/admin/users/:userId/unban', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Unban user
    await db.run(
      'UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?',
      [userId]
    );

    // Log action
    await db.run(
      `INSERT INTO admin_actions (admin_id, target_user_id, action_type, description, created_at)
       VALUES (?, ?, 'UNBAN', 'User unbanned', datetime('now'))`,
      [adminId, userId]
    );

    res.json({
      status: 'success',
      message: `User ${user.username} has been unbanned`
    });

  } catch (err) {
    console.error('Unban user error:', err);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

/**
 * POST /api/admin/users/:userId/reset-progress
 * Reset player progress (clear saves, reset stats)
 */
router.post('/admin/users/:userId/reset-progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all saves except backups
    await db.run(
      'DELETE FROM game_saves WHERE user_id = ? AND is_backup = 0',
      [userId]
    );

    // Reset player profile
    await db.run(
      `UPDATE player_profiles 
       SET total_xp = 0, prestige_level = 0, playtime_seconds = 0, 
           currency_earned = 0, currency_spent = 0, combat_wins = 0
       WHERE user_id = ?`,
      [userId]
    );

    // Log action
    await db.run(
      `INSERT INTO admin_actions (admin_id, target_user_id, action_type, description, created_at)
       VALUES (?, ?, 'RESET_PROGRESS', 'Player progress reset', datetime('now'))`,
      [adminId, userId]
    );

    res.json({
      status: 'success',
      message: `Player ${user.username}'s progress has been reset`
    });

  } catch (err) {
    console.error('Reset progress error:', err);
    res.status(500).json({ error: 'Failed to reset progress' });
  }
});

/**
 * POST /api/admin/users/:userId/nerf
 * Apply a nerf to player stats
 * Body: { xpMultiplier, currencyMultiplier, reason }
 */
router.post('/admin/users/:userId/nerf', async (req, res) => {
  try {
    const { userId } = req.params;
    const { xpMultiplier = 0.5, currencyMultiplier = 0.5, reason } = req.body;
    const adminId = req.user.id;

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Apply nerf (reduce stats by multiplier)
    const profile = await db.get(
      'SELECT total_xp, currency_earned FROM player_profiles WHERE user_id = ?',
      [userId]
    );

    if (profile) {
      const nerfedXP = Math.floor(profile.total_xp * xpMultiplier);
      const nerfedCurrency = Math.floor(profile.currency_earned * currencyMultiplier);

      await db.run(
        `UPDATE player_profiles 
         SET total_xp = ?, currency_earned = ?
         WHERE user_id = ?`,
        [nerfedXP, nerfedCurrency, userId]
      );
    }

    // Log action
    await db.run(
      `INSERT INTO admin_actions (admin_id, target_user_id, action_type, description, details, created_at)
       VALUES (?, ?, 'NERF', ?, ?, datetime('now'))`,
      [adminId, userId, reason || 'Nerf applied', JSON.stringify({ xpMultiplier, currencyMultiplier })]
    );

    res.json({
      status: 'success',
      message: `Player ${user.username} has been nerfed`,
      multipliers: { xpMultiplier, currencyMultiplier }
    });

  } catch (err) {
    console.error('Nerf player error:', err);
    res.status(500).json({ error: 'Failed to nerf player' });
  }
});

/**
 * POST /api/admin/ips/block
 * Block an IP address
 * Body: { ipAddress, reason, expiresIn? }
 */
router.post('/admin/ips/block', async (req, res) => {
  try {
    const { ipAddress, reason, expiresIn } = req.body;
    const adminId = req.user.id;

    if (!ipAddress) {
      return res.status(400).json({ error: 'IP address required' });
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresIn) {
      const ms = expiresIn; // milliseconds
      expiresAt = new Date(Date.now() + ms).toISOString();
    }

    await db.run(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by_admin, created_at, expires_at)
       VALUES (?, ?, ?, datetime('now'), ?)`,
      [ipAddress, reason || 'Blocked by admin', adminId, expiresAt]
    );

    res.json({
      status: 'success',
      message: `IP ${ipAddress} has been blocked`,
      expiresAt: expiresAt || 'Never'
    });

  } catch (err) {
    console.error('Block IP error:', err);
    res.status(500).json({ error: 'Failed to block IP' });
  }
});

/**
 * GET /api/admin/ips/blocked
 * List blocked IPs
 */
router.get('/admin/ips/blocked', async (req, res) => {
  try {
    const blocked = await db.all(
      `SELECT ip_address, reason, blocked_by_admin, created_at, expires_at
       FROM blocked_ips
       WHERE expires_at IS NULL OR expires_at > datetime('now')
       ORDER BY created_at DESC`,
      []
    );

    res.json({
      status: 'success',
      count: blocked.length,
      blockedIPs: blocked
    });

  } catch (err) {
    console.error('List blocked IPs error:', err);
    res.status(500).json({ error: 'Failed to list blocked IPs' });
  }
});

/**
 * POST /api/admin/ips/:ipAddress/unblock
 * Unblock an IP address
 */
router.post('/admin/ips/:ipAddress/unblock', async (req, res) => {
  try {
    const { ipAddress } = req.params;

    await db.run(
      'DELETE FROM blocked_ips WHERE ip_address = ?',
      [ipAddress]
    );

    res.json({
      status: 'success',
      message: `IP ${ipAddress} has been unblocked`
    });

  } catch (err) {
    console.error('Unblock IP error:', err);
    res.status(500).json({ error: 'Failed to unblock IP' });
  }
});

/**
 * GET /api/admin/actions
 * List all admin actions (audit log)
 */
router.get('/admin/actions', async (req, res) => {
  try {
    const actions = await db.all(
      `SELECT a.*, u.username as admin_name, tu.username as target_name
       FROM admin_actions a
       LEFT JOIN users u ON a.admin_id = u.id
       LEFT JOIN users tu ON a.target_user_id = tu.id
       ORDER BY a.created_at DESC
       LIMIT 100`,
      []
    );

    res.json({
      status: 'success',
      count: actions.length,
      actions
    });

  } catch (err) {
    console.error('List actions error:', err);
    res.status(500).json({ error: 'Failed to list admin actions' });
  }
});

/**
 * GET /api/admin/stats
 * Server statistics
 */
router.get('/admin/stats', async (req, res) => {
  try {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const bannedUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE is_banned = 1');
    const totalSaves = await db.get('SELECT COUNT(*) as count FROM game_saves');
    const totalPlaytime = await db.get('SELECT SUM(playtime_seconds) as total FROM player_profiles');

    res.json({
      status: 'success',
      stats: {
        totalUsers: totalUsers.count || 0,
        bannedUsers: bannedUsers.count || 0,
        totalGameSaves: totalSaves.count || 0,
        totalPlaytimeHours: Math.round((totalPlaytime.total || 0) / 3600),
        serverTime: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
