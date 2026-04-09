/**
 * Authentication Routes
 * Handles user registration, login, OAuth, and token management
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { config } from '../config/index.js';
import { Player } from '../models/Player.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /auth/register
 * Register a new player with email and password
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existing = await Player.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res
        .status(409)
        .json({ error: existing.username === username ? 'Username taken' : 'Email already registered' });
    }

    // Create new player
    const player = new Player({
      username,
      email,
      password,
      displayName: username,
    });

    await player.save();

    // Generate JWT token
    const token = jwt.sign({ id: player._id, username: player.username }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    res.status(201).json({
      message: 'Player registered successfully',
      token,
      player: player.fullProfile,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: 'Failed to register player' });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find player and select password field
    const player = await Player.findOne({ email }).select('+password');
    if (!player) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await player.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    player.lastLoginAt = new Date();
    await player.save();

    // Generate JWT token
    const token = jwt.sign({ id: player._id, username: player.username }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    res.json({
      message: 'Logged in successfully',
      token,
      player: player.fullProfile,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /auth/github
 * GitHub OAuth login redirect
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * GET /auth/github/callback
 * GitHub OAuth callback
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login?error=github_auth_failed' }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign({ id: req.user._id, username: req.user.username }, config.jwt.secret, {
        expiresIn: config.jwt.expiry,
      });

      // Redirect to game with token
      const redirectUrl = `http://localhost:8000?token=${token}&username=${req.user.username}`;
      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(`http://localhost:8000?error=token_generation_failed`);
    }
  }
);

/**
 * GET /auth/google
 * Google OAuth login redirect
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * GET /auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign({ id: req.user._id, username: req.user.username }, config.jwt.secret, {
        expiresIn: config.jwt.expiry,
      });

      // Redirect to game with token
      const redirectUrl = `http://localhost:8000?token=${token}&username=${req.user.username}`;
      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(`http://localhost:8000?error=token_generation_failed`);
    }
  }
);

/**
 * POST /auth/logout
 * Logout (client-side token deletion)
 */
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const token = jwt.sign({ id: player._id, username: player.username }, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    });

    res.json({
      message: 'Token refreshed',
      token,
    });
  } catch (error) {
    console.error('Refresh error:', error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * GET /auth/me
 * Get current player profile (requires auth)
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      player: player.fullProfile,
    });
  } catch (error) {
    console.error('Auth me error:', error.message);
    res.status(500).json({ error: 'Failed to fetch player profile' });
  }
});

export default router;
