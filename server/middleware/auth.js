import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'netrunner-secret-key-change-in-production';
const JWT_EXPIRY = '15m'; // Short-lived access token
const REFRESH_EXPIRY = '7d'; // Longer-lived refresh token

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId, username) {
  return jwt.sign(
    { userId, username, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Middleware: Verify authentication token
 * Expects: Authorization: Bearer <token>
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Verify session still exists in DB
  try {
    const session = await db.get(
      `SELECT * FROM sessions WHERE access_token = ? AND expires_at > datetime('now')`,
      [token]
    );
    
    if (!session) {
      return res.status(401).json({ error: 'Session not found or expired' });
    }

    req.user = {
      id: decoded.userId,
      username: decoded.username
    };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware: Check if user is admin
 * Must be called after authenticateToken
 */
export async function requireAdmin(req, res, next) {
  try {
    const user = await db.get(
      `SELECT is_admin FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: 'Permission check failed' });
  }
}

/**
 * Middleware: Check if request IP is in admin range (192.168.1.X)
 */
export function checkAdminIP(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  const adminIPRange = /^(::ffff:)?192\.168\.1\.\d+$/;
  const localAdminRange = /^(::1|::ffff:127\.0\.0\.1|127\.0\.0\.1|localhost)$/;
  
  if (!adminIPRange.test(clientIP) && !localAdminRange.test(clientIP)) {
    console.warn(`Admin access attempt from unauthorized IP: ${clientIP}`);
    return res.status(403).json({ 
      error: 'Admin access restricted to localhost or 192.168.1.X network' 
    });
  }

  next();
}

/**
 * Middleware: Check if IP is blocked
 */
export async function checkBlockedIP(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;

  try {
    const blocked = await db.get(
      `SELECT * FROM blocked_ips 
       WHERE ip_address = ? 
       AND (expires_at IS NULL OR expires_at > datetime('now'))`,
      [clientIP]
    );

    if (blocked) {
      return res.status(403).json({ 
        error: 'Your IP address has been blocked',
        reason: blocked.reason
      });
    }

    next();
  } catch (err) {
    console.error('IP block check error:', err);
    res.status(500).json({ error: 'Access check failed' });
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  authenticateToken,
  requireAdmin,
  checkAdminIP,
  checkBlockedIP
};
