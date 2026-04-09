/**
 * Test Utilities and Setup
 * Helper functions for testing
 */

import { Player } from '../src/models/Player.js';
import { Guild } from '../src/models/Guild.js';
import { PvPMatch } from '../src/models/PvPMatch.js';
import { Event } from '../src/models/Event.js';

export async function createTestPlayer(overrides = {}) {
  const player = new Player({
    username: `test_player_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: `Test Player ${Date.now()}`,
    gameData: {
      level: 50,
      totalXP: 1000000,
    },
    multiplayer: {
      rank: 1200,
      duelsWon: 10,
      duelsLost: 5,
    },
    ...overrides,
  });

  return player.save();
}

export async function createTestGuild(leaderId, overrides = {}) {
  const guild = new Guild({
    name: `test_guild_${Date.now()}`,
    description: 'Test Guild',
    leaderId,
    members: [{ playerId: leaderId, role: 'leader' }],
    ...overrides,
  });

  return guild.save();
}

export async function createTestPvPMatch(challengerId, overrides = {}) {
  const match = new PvPMatch({
    challenger: {
      playerId: challengerId,
      username: 'test_challenger',
    },
    wager: {
      stakes: 1000,
    },
    ...overrides,
  });

  return match.save();
}

export async function createTestEvent(overrides = {}) {
  const event = new Event({
    name: `test_event_${Date.now()}`,
    type: 'daily_quest',
    schedule: {
      frequency: 'daily',
      time: '00:00',
      duration: 86400,
    },
    status: 'scheduled',
    ...overrides,
  });

  return event.save();
}

export async function cleanupTestData() {
  await Player.deleteMany({ username: /^test_player/ });
  await Guild.deleteMany({ name: /^test_guild/ });
  await PvPMatch.deleteMany({});
  await Event.deleteMany({ name: /^test_event/ });
}

export function getAuthToken(playerId, username) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: playerId, username },
    process.env.JWT_SECRET || 'dev-secret-change-in-production',
    { expiresIn: '7d' }
  );
}

export default {
  createTestPlayer,
  createTestGuild,
  createTestPvPMatch,
  createTestEvent,
  cleanupTestData,
  getAuthToken,
};
