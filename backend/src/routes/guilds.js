/**
 * Guild Routes
 * Handles guild creation, management, member operations, and treasury
 */

import express from 'express';
import { requireAuth, requireActive } from '../middleware/auth.js';
import { Guild } from '../models/Guild.js';
import { Player } from '../models/Player.js';

const router = express.Router();

/**
 * POST /api/guilds
 * Create a new guild
 */
router.post('/', requireAuth, requireActive, async (req, res) => {
  try {
    const { name, description, icon, joinPolicy } = req.body;

    // Validation
    if (!name || name.length < 3 || name.length > 30) {
      return res.status(400).json({ error: 'Guild name must be 3-30 characters' });
    }

    // Check if guild name already exists
    const existing = await Guild.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: 'Guild name already taken' });
    }

    // Check if player is already in a guild
    const player = await Player.findById(req.player.id);
    if (player.multiplayer.guildId) {
      return res.status(400).json({ error: 'Player is already in a guild' });
    }

    // Create guild
    const guild = new Guild({
      name,
      description: description || '',
      icon: icon || '🏢',
      leaderId: req.player.id,
      joinPolicy: joinPolicy || 'invite_only',
      members: [{ playerId: req.player.id, role: 'leader', joinedAt: new Date() }],
    });

    await guild.save();

    // Update player's guild reference
    player.multiplayer.guildId = guild._id;
    await player.save();

    res.status(201).json({
      message: 'Guild created successfully',
      guild: {
        id: guild._id,
        name: guild.name,
        leaderId: guild.leaderId,
        memberCount: guild.members.length,
      },
    });
  } catch (error) {
    console.error('Create guild error:', error.message);
    res.status(500).json({ error: 'Failed to create guild' });
  }
});

/**
 * GET /api/guilds/:id
 * Get guild information
 */
router.get('/:id', async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id).populate('leaderId', 'username displayName avatar');

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json({
      guild: {
        id: guild._id,
        name: guild.name,
        description: guild.description,
        icon: guild.icon,
        leader: guild.leaderId,
        memberCount: guild.members.length,
        level: guild.level,
        joinPolicy: guild.joinPolicy,
        treasury: {
          currency: guild.treasury.currency,
          totalContributed: guild.treasury.totalContributed,
        },
        wars: {
          consecutiveWins: guild.wars.consecutiveWins,
          totalWarsWon: guild.wars.totalWarsWon,
          totalWarsLost: guild.wars.totalWarsLost,
        },
        bonuses: guild.guildBonuses,
        perks: guild.perks,
      },
    });
  } catch (error) {
    console.error('Get guild error:', error.message);
    res.status(500).json({ error: 'Failed to fetch guild' });
  }
});

/**
 * PUT /api/guilds/:id
 * Update guild settings (leader only)
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Only leader can update guild settings
    if (guild.leaderId.toString() !== req.player.id) {
      return res.status(403).json({ error: 'Only guild leader can update settings' });
    }

    const { name, description, icon, joinPolicy, pvpEnabled } = req.body;

    // Validate new name if changed
    if (name && name !== guild.name) {
      if (name.length < 3 || name.length > 30) {
        return res.status(400).json({ error: 'Guild name must be 3-30 characters' });
      }

      const existing = await Guild.findOne({ name, _id: { $ne: guild._id } });
      if (existing) {
        return res.status(409).json({ error: 'Guild name already taken' });
      }

      guild.name = name;
    }

    if (description !== undefined) guild.description = description;
    if (icon !== undefined) guild.icon = icon;
    if (joinPolicy) guild.joinPolicy = joinPolicy;
    if (pvpEnabled !== undefined) guild.pvpEnabled = pvpEnabled;

    await guild.save();

    res.json({
      message: 'Guild updated successfully',
      guild: {
        id: guild._id,
        name: guild.name,
        description: guild.description,
      },
    });
  } catch (error) {
    console.error('Update guild error:', error.message);
    res.status(500).json({ error: 'Failed to update guild' });
  }
});

/**
 * GET /api/guilds/:id/members
 * Get guild members list
 */
router.get('/:id/members', async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id).populate(
      'members.playerId',
      'username displayName avatar gameData.level multiplayer.rank'
    );

    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const members = guild.members.map((m) => ({
      playerId: m.playerId._id,
      username: m.playerId.username,
      displayName: m.playerId.displayName,
      avatar: m.playerId.avatar,
      role: m.role,
      joinedAt: m.joinedAt,
      contributedDamage: m.contributedDamage,
      level: m.playerId.gameData.level,
      rank: m.playerId.multiplayer.rank,
    }));

    res.json({
      guildId: guild._id,
      memberCount: members.length,
      maxMembers: guild.perks.memberLimit,
      members,
    });
  } catch (error) {
    console.error('Get guild members error:', error.message);
    res.status(500).json({ error: 'Failed to fetch guild members' });
  }
});

/**
 * POST /api/guilds/:id/invite
 * Invite player to guild (leader/officer only)
 */
router.post('/:id/invite', requireAuth, requireActive, async (req, res) => {
  try {
    const { targetPlayerId } = req.body;

    if (!targetPlayerId) {
      return res.status(400).json({ error: 'Target player ID required' });
    }

    const guild = await Guild.findById(req.params.id);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Check if requester is leader or officer
    const requesterMember = guild.members.find((m) => m.playerId.toString() === req.player.id);
    if (!requesterMember || !['leader', 'officer'].includes(requesterMember.role)) {
      return res.status(403).json({ error: 'Only leaders and officers can invite members' });
    }

    // Check guild is not full
    if (guild.members.length >= guild.perks.memberLimit) {
      return res.status(400).json({ error: 'Guild is full' });
    }

    const targetPlayer = await Player.findById(targetPlayerId);
    if (!targetPlayer) {
      return res.status(404).json({ error: 'Target player not found' });
    }

    // Check target is not already in guild
    if (targetPlayer.multiplayer.guildId) {
      return res.status(400).json({ error: 'Target player is already in a guild' });
    }

    // Check target is not already a member
    if (guild.members.some((m) => m.playerId.toString() === targetPlayerId)) {
      return res.status(400).json({ error: 'Player is already a member' });
    }

    // Add member to guild
    guild.addMember(targetPlayerId, 'member');
    await guild.save();

    // Update player's guild reference
    targetPlayer.multiplayer.guildId = guild._id;
    await targetPlayer.save();

    res.json({
      message: 'Player invited to guild successfully',
      memberCount: guild.members.length,
    });
  } catch (error) {
    console.error('Invite to guild error:', error.message);
    res.status(500).json({ error: 'Failed to invite player' });
  }
});

/**
 * DELETE /api/guilds/:id/members/:memberId
 * Remove member from guild (leader/officer only)
 */
router.delete('/:id/members/:memberId', requireAuth, async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Check if requester is leader or officer
    const requesterMember = guild.members.find((m) => m.playerId.toString() === req.player.id);
    if (!requesterMember || !['leader', 'officer'].includes(requesterMember.role)) {
      return res.status(403).json({ error: 'Only leaders and officers can remove members' });
    }

    // Cannot remove leader
    if (guild.leaderId.toString() === req.params.memberId) {
      return res.status(400).json({ error: 'Cannot remove guild leader' });
    }

    // Remove member
    guild.removeMember(req.params.memberId);
    await guild.save();

    // Update player's guild reference
    await Player.updateOne({ _id: req.params.memberId }, { 'multiplayer.guildId': null });

    res.json({
      message: 'Member removed from guild',
      memberCount: guild.members.length,
    });
  } catch (error) {
    console.error('Remove guild member error:', error.message);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * POST /api/guilds/:id/treasury/contribute
 * Contribute currency to guild treasury
 */
router.post('/:id/treasury/contribute', requireAuth, requireActive, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid contribution amount' });
    }

    const player = await Player.findById(req.player.id);
    if (!player.multiplayer.guildId || player.multiplayer.guildId.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Player is not a member of this guild' });
    }

    if (player.gameData.currency < amount) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    const guild = await Guild.findById(req.params.id);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    // Transfer currency from player to guild
    player.gameData.currency -= amount;
    guild.contribute(amount);

    await player.save();
    await guild.save();

    res.json({
      message: 'Contributed to guild treasury',
      playerCurrency: player.gameData.currency,
      guildTreasury: guild.treasury.currency,
    });
  } catch (error) {
    console.error('Contribute to treasury error:', error.message);
    res.status(500).json({ error: 'Failed to contribute' });
  }
});

export default router;
