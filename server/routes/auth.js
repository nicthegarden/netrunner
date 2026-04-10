import express from 'express';
import rateLimit from 'express-rate-limit';
import { db, hashPassword } from '../db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  checkBlockedIP,
  authenticateToken
} from '../middleware/auth.js';

const router = express.Router();

// Rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per window
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 requests per window
  message: 'Too many token refresh attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Check IP before any auth operations
router.use(checkBlockedIP);

/**
 * POST /api/auth/register
 * Register a new user account
 * Body: { username, password, email? }
 */
router.post('/auth/register', registerLimiter, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validation
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({ error: 'Username must be 3-32 characters' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username exists
    const existing = await db.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user
    const result = await db.run(
      `INSERT INTO users (username, password_hash, email, created_at) 
       VALUES (?, ?, ?, datetime('now'))`,
      [username, passwordHash, email || null]
    );

    const userId = result.lastID;

    // Create player profile
    await db.run(
      `INSERT INTO player_profiles (user_id) 
       VALUES (?)`,
      [userId]
    );

    // Generate tokens
    const accessToken = generateAccessToken(userId, username);
    const refreshToken = generateRefreshToken(userId);

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.run(
      `INSERT INTO sessions (user_id, access_token, refresh_token, expires_at, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, accessToken, refreshToken, expiresAt.toISOString(), req.ip]
    );

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      user: { id: userId, username },
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with username and password
 * Body: { username, password, rememberMe? }
 */
router.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = await db.get(
      'SELECT id, username, password_hash, is_banned, ban_reason FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({ 
        error: 'Account is banned',
        reason: user.ban_reason
      });
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    await db.run(
      'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?',
      [user.id]
    );

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id);

    // Store session
    const expiresAtMs = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 days for "Remember Me"
      : 7 * 24 * 60 * 60 * 1000;  // 7 days default
    const expiresAt = new Date(Date.now() + expiresAtMs);

    await db.run(
      `INSERT INTO sessions (user_id, access_token, refresh_token, expires_at, remember_me, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, accessToken, refreshToken, expiresAt.toISOString(), rememberMe ? 1 : 0, req.ip]
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      user: { id: user.id, username: user.username },
      accessToken,
      refreshToken,
      rememberMe
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh expired access token using refresh token
 * Body: { refreshToken }
 */
router.post('/auth/refresh', refreshLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find session
    const session = await db.get(
      `SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > datetime('now')`,
      [refreshToken]
    );

    if (!session) {
      return res.status(401).json({ error: 'Session expired or not found' });
    }

    // Get user
    const user = await db.get(
      'SELECT username FROM users WHERE id = ?',
      [decoded.userId]
    );

    // Generate new access token
    const newAccessToken = generateAccessToken(decoded.userId, user.username);

    // Update session
    await db.run(
      'UPDATE sessions SET access_token = ? WHERE id = ?',
      [newAccessToken, session.id]
    );

    res.json({
      status: 'success',
      accessToken: newAccessToken
    });

  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate session)
 */
router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Delete session
    await db.run(
      'DELETE FROM sessions WHERE user_id = ? AND expires_at > datetime(\'now\')',
      [req.user.id]
    );

    res.json({ status: 'success', message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT u.id, u.username, u.email, u.created_at, u.last_login, u.is_admin,
              p.total_xp, p.prestige_level, p.playtime_seconds, p.currency_earned
       FROM users u
       LEFT JOIN player_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        stats: {
          totalXP: user.total_xp || 0,
          prestigeLevel: user.prestige_level || 0,
          playtimeSeconds: user.playtime_seconds || 0,
          currencyEarned: user.currency_earned || 0
        }
      }
    });

  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

export default router;
