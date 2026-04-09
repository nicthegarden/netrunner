/**
 * Authentication Middleware
 * Handles JWT validation and authorization
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { Player } from '../models/Player.js';

/**
 * Middleware to verify JWT token
 */
export const requireAuth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    req.player = { id: decoded.id, username: decoded.username };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if player is admin
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const player = await Player.findById(req.player.id);
    if (!player || !player.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Middleware to check if player is active (not banned)
 */
export const requireActive = async (req, res, next) => {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!player.isActive || player.isBanned) {
      return res.status(403).json({ error: 'Account is inactive or banned' });
    }

    if (player.banUntil && new Date() < player.banUntil) {
      return res.status(403).json({ error: `Account banned until ${player.banUntil.toISOString()}` });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' });
  }
};

/**
 * Optional authentication (doesn't fail if no token, just sets req.player = null)
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.player = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    req.player = { id: decoded.id, username: decoded.username };
    next();
  } catch (error) {
    req.player = null;
    next();
  }
};

export default { requireAuth, requireAdmin, requireActive, optionalAuth };
