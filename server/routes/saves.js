import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/saves/upload
 * Upload/save game state to server
 * Body: { saveData (JSON string), playtimeSeconds }
 */
router.post('/saves/upload', authenticateToken, async (req, res) => {
  try {
    const { saveData, playtimeSeconds, checksum } = req.body;

    if (!saveData) {
      return res.status(400).json({ error: 'Save data required' });
    }

    // Validate JSON
    try {
      JSON.parse(saveData);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON save data' });
    }

    const userId = req.user.id;
    const now = new Date();

    // Mark old saves as not latest
    await db.run(
      'UPDATE game_saves SET is_latest = 0 WHERE user_id = ? AND is_latest = 1',
      [userId]
    );

    // Insert new save
    const result = await db.run(
      `INSERT INTO game_saves (user_id, save_data, save_timestamp, is_latest, client_checksum, playtime_seconds)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [userId, saveData, now.toISOString(), checksum || null, playtimeSeconds || 0]
    );

    // Update player profile
    try {
      const profile = JSON.parse(saveData);
      await db.run(
        `UPDATE player_profiles 
         SET total_xp = ?, prestige_level = ?, playtime_seconds = ?, last_save_timestamp = datetime('now')
         WHERE user_id = ?`,
        [profile.totalXP || 0, profile.prestigeLevel || 0, playtimeSeconds || 0, userId]
      );
    } catch (err) {
      // If profile parsing fails, just continue
      console.warn('Could not update profile:', err);
    }

    res.json({
      status: 'success',
      message: 'Save uploaded successfully',
      saveId: result.lastID,
      timestamp: now.toISOString()
    });

  } catch (err) {
    console.error('Save upload error:', err);
    res.status(500).json({ error: 'Save upload failed' });
  }
});

/**
 * GET /api/saves/latest
 * Download latest save
 */
router.get('/saves/latest', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const save = await db.get(
      `SELECT id, save_data, save_timestamp, playtime_seconds, client_checksum
       FROM game_saves
       WHERE user_id = ? AND is_latest = 1
       LIMIT 1`,
      [userId]
    );

    if (!save) {
      return res.status(404).json({ error: 'No save found' });
    }

    res.json({
      status: 'success',
      save: {
        id: save.id,
        data: JSON.parse(save.save_data),
        timestamp: save.save_timestamp,
        playtimeSeconds: save.playtime_seconds,
        checksum: save.client_checksum
      }
    });

  } catch (err) {
    console.error('Save download error:', err);
    res.status(500).json({ error: 'Save download failed' });
  }
});

/**
 * GET /api/saves/list
 * List all saves for user (for backup/restore)
 */
router.get('/saves/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const saves = await db.all(
      `SELECT id, save_timestamp, playtime_seconds, is_latest, is_backup
       FROM game_saves
       WHERE user_id = ?
       ORDER BY save_timestamp DESC
       LIMIT 20`,
      [userId]
    );

    res.json({
      status: 'success',
      saves: saves.map(s => ({
        id: s.id,
        timestamp: s.save_timestamp,
        playtimeSeconds: s.playtime_seconds,
        isLatest: s.is_latest === 1,
        isBackup: s.is_backup === 1
      }))
    });

  } catch (err) {
    console.error('Save list error:', err);
    res.status(500).json({ error: 'Failed to list saves' });
  }
});

/**
 * GET /api/saves/:saveId
 * Download specific save (for restore)
 */
router.get('/saves/:saveId', authenticateToken, async (req, res) => {
  try {
    const { saveId } = req.params;
    const userId = req.user.id;

    const save = await db.get(
      `SELECT id, save_data, save_timestamp, playtime_seconds
       FROM game_saves
       WHERE id = ? AND user_id = ?`,
      [saveId, userId]
    );

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({
      status: 'success',
      save: {
        id: save.id,
        data: JSON.parse(save.save_data),
        timestamp: save.save_timestamp,
        playtimeSeconds: save.playtime_seconds
      }
    });

  } catch (err) {
    console.error('Save retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve save' });
  }
});

/**
 * POST /api/saves/:saveId/restore
 * Restore from a specific save point
 */
router.post('/saves/:saveId/restore', authenticateToken, async (req, res) => {
  try {
    const { saveId } = req.params;
    const userId = req.user.id;

    const save = await db.get(
      `SELECT id, save_data FROM game_saves WHERE id = ? AND user_id = ?`,
      [saveId, userId]
    );

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    // Mark this save as latest
    await db.run(
      'UPDATE game_saves SET is_latest = 0 WHERE user_id = ?',
      [userId]
    );

    await db.run(
      'UPDATE game_saves SET is_latest = 1 WHERE id = ?',
      [saveId]
    );

    res.json({
      status: 'success',
      message: 'Save restored successfully',
      save: {
        id: save.id,
        data: JSON.parse(save.save_data)
      }
    });

  } catch (err) {
    console.error('Save restore error:', err);
    res.status(500).json({ error: 'Save restore failed' });
  }
});

/**
 * DELETE /api/saves/:saveId
 * Delete a specific save (soft delete for now)
 */
router.delete('/saves/:saveId', authenticateToken, async (req, res) => {
  try {
    const { saveId } = req.params;
    const userId = req.user.id;

    const save = await db.get(
      `SELECT id, is_latest FROM game_saves WHERE id = ? AND user_id = ?`,
      [saveId, userId]
    );

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    if (save.is_latest) {
      return res.status(400).json({ error: 'Cannot delete latest save' });
    }

    // Soft delete
    await db.run(
      'UPDATE game_saves SET is_backup = 1 WHERE id = ?',
      [saveId]
    );

    res.json({ status: 'success', message: 'Save deleted' });

  } catch (err) {
    console.error('Save delete error:', err);
    res.status(500).json({ error: 'Save delete failed' });
  }
});

export default router;
