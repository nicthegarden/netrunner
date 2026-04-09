/**
 * Events Routes
 * Handles event scheduling, participation, and guild wars
 */

import express from 'express';
import { requireAuth, requireActive } from '../middleware/auth.js';
import { Event } from '../models/Event.js';
import { Player } from '../models/Player.js';
import { Guild } from '../models/Guild.js';

const router = express.Router();

/**
 * GET /api/events
 * Get active and upcoming events
 */
router.get('/', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;

    const query = { isActive: true };
    if (type) {
      query.type = type;
    }

    const events = await Event.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit));

    res.json({
      count: events.length,
      events: events.map((e) => ({
        id: e._id,
        name: e.name,
        description: e.description,
        icon: e.icon,
        type: e.type,
        status: e.status,
        startTime: e.startTime,
        endTime: e.endTime,
        participants: e.participants.length,
        rewards: e.rewards.baseReward,
      })),
    });
  } catch (error) {
    console.error('Get events error:', error.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/:id
 * Get event details
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('participants.playerId', 'username');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        icon: event.icon,
        type: event.type,
        status: event.status,
        startTime: event.startTime,
        endTime: event.endTime,
        duration: event.schedule.duration,
        participants: event.participants.length,
        maxParticipants: event.maxParticipants,
        minLevel: event.minLevel,
        requireGuild: event.requireGuild,
        rewards: event.rewards,
        guildWar:
          event.type === 'weekly_war'
            ? {
                bossHp: event.guildWar?.bossHp || 0,
                maxHp: event.guildWar?.maxHp || 0,
                leaderboard: event.guildWar?.leaderboard || [],
              }
            : null,
      },
    });
  } catch (error) {
    console.error('Get event error:', error.message);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * POST /api/events/:id/join
 * Join an event
 */
router.post('/:id/join', requireAuth, requireActive, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'active' && event.status !== 'scheduled') {
      return res.status(400).json({ error: 'Event is not available' });
    }

    const player = await Player.findById(req.player.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check level requirement
    if (player.gameData.level < event.minLevel) {
      return res.status(400).json({ error: `Minimum level ${event.minLevel} required` });
    }

    // Check guild requirement
    if (event.requireGuild && !player.multiplayer.guildId) {
      return res.status(400).json({ error: 'Guild membership required for this event' });
    }

    // Check if already participating
    const alreadyIn = event.participants.some((p) => p.playerId.toString() === player._id.toString());
    if (alreadyIn) {
      return res.status(400).json({ error: 'Already participating in this event' });
    }

    // Check capacity
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Add participant
    event.addParticipant(player._id, player.multiplayer.guildId);
    await event.save();

    res.json({
      message: 'Joined event successfully',
      eventId: event._id,
      participantCount: event.participants.length,
    });
  } catch (error) {
    console.error('Join event error:', error.message);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

/**
 * POST /api/events/:id/leave
 * Leave an event
 */
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Remove player from participants
    event.participants = event.participants.filter((p) => p.playerId.toString() !== req.player.id);
    await event.save();

    res.json({
      message: 'Left event',
      participantCount: event.participants.length,
    });
  } catch (error) {
    console.error('Leave event error:', error.message);
    res.status(500).json({ error: 'Failed to leave event' });
  }
});

/**
 * POST /api/events/guild-war/damage
 * Record guild war damage (from WebSocket, but also available via REST)
 */
router.post('/guild-war/damage', requireAuth, requireActive, async (req, res) => {
  try {
    const { eventId, damage } = req.body;

    if (!damage || damage <= 0) {
      return res.status(400).json({ error: 'Damage must be positive' });
    }

    const player = await Player.findById(req.player.id);
    if (!player || !player.multiplayer.guildId) {
      return res.status(400).json({ error: 'Player must be in a guild' });
    }

    const guild = await Guild.findById(player.multiplayer.guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const event = await Event.findById(eventId);
    if (!event || event.type !== 'weekly_war') {
      return res.status(404).json({ error: 'Guild war event not found' });
    }

    if (event.status !== 'active') {
      return res.status(400).json({ error: 'Guild war is not active' });
    }

    // Record damage
    event.recordGuildDamage(guild._id, guild.name, damage);
    guild.dealDamage(damage);

    // Update guild war stats
    const memberIndex = guild.members.findIndex((m) => m.playerId.toString() === player._id.toString());
    if (memberIndex >= 0) {
      guild.members[memberIndex].contributedDamage += damage;
    }

    await event.save();
    await guild.save();

    res.json({
      message: 'Damage recorded',
      totalDamage: event.guildWar.bossHp,
      guildDamage: event.guildWar.damageDealt.find((d) => d.guildId.toString() === guild._id.toString())?.totalDamage,
      rank: event.guildWar.leaderboard.findIndex((l) => l.guildId.toString() === guild._id.toString()) + 1,
    });
  } catch (error) {
    console.error('Record war damage error:', error.message);
    res.status(500).json({ error: 'Failed to record damage' });
  }
});

/**
 * GET /api/events/leaderboards/current
 * Get current event leaderboards
 */
router.get('/leaderboards/current', async (req, res) => {
  try {
    const currentEvent = await Event.findOne({
      status: 'active',
      type: 'weekly_war',
    });

    if (!currentEvent) {
      return res.status(404).json({ error: 'No active guild war' });
    }

    res.json({
      eventId: currentEvent._id,
      eventName: currentEvent.name,
      status: currentEvent.status,
      endTime: currentEvent.endTime,
      leaderboard: (currentEvent.guildWar?.leaderboard || []).slice(0, 20),
      rewards: currentEvent.rewards,
    });
  } catch (error) {
    console.error('Get event leaderboards error:', error.message);
    res.status(500).json({ error: 'Failed to fetch leaderboards' });
  }
});

export default router;
