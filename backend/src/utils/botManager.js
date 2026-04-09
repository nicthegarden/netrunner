/**
 * Bot Management System
 * Handles creation, management, and behavior of NPC bots
 */

import { Player } from '../models/Player.js';
import { Guild } from '../models/Guild.js';
import { PvPMatch } from '../models/PvPMatch.js';
import { Event } from '../models/Event.js';
import { config } from '../config/index.js';

const BOT_NAMES = [
  'NetGhost', 'CyberNinja', 'ShadowRunner', 'IceBreaker', 'NoirHacker',
  'PhantomCode', 'SilentVirus', 'DarkNet', 'ByteRunner', 'CryptoGhost',
  'NeonBlade', 'DataThief', 'QuantumLeap', 'VoidWalker', 'ChromeKing',
  'StealthBot', 'VirusHunt', 'CodeWizard', 'NetRunner', 'EchoStrike',
];

/**
 * Initialize bots in the system
 */
export async function initializeBots() {
  try {
    console.log('🤖 Initializing bot system...');

    const botCount = config.game.bot.count;
    const existingBots = await Player.countDocuments({ 'multiplayer.isBot': true });

    if (existingBots >= botCount) {
      console.log(`✓ Bots already initialized (${existingBots}/${botCount})`);
      return existingBots;
    }

    const botsToCreate = botCount - existingBots;
    const createdBots = [];

    for (let i = 0; i < botsToCreate; i++) {
      const botName = `${BOT_NAMES[i % BOT_NAMES.length]}_${Math.floor(Math.random() * 10000)}`;
      const bot = new Player({
        username: botName,
        email: `bot_${botName}@netrunner.local`,
        displayName: botName,
        avatar: '🤖',

        // Bot-specific game data
        gameData: {
          level: Math.floor(Math.random() * 70) + 30, // Level 30-99
          totalXP: Math.floor(Math.random() * 5000000) + 1000000,
          prestige: {
            level: Math.floor(Math.random() * 5),
            points: Math.floor(Math.random() * 500),
          },
        },

        // Bot-specific multiplayer stats
        multiplayer: {
          isBot: true,
          rank: Math.floor(Math.random() * 2500),
          duelsWon: Math.floor(Math.random() * 500),
          duelsLost: Math.floor(Math.random() * 500),
          currencyWon: Math.floor(Math.random() * 100000),
          currencyLost: Math.floor(Math.random() * 100000),
          botConfig: {
            skillLevel: Math.floor(Math.random() * 70) + 30,
            duelStrategy: ['aggressive', 'defensive', 'balanced'][Math.floor(Math.random() * 3)],
            activityLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          },
        },
      });

      bot.multiplayer.winRate = bot.multiplayer.duelsWon > 0
        ? (bot.multiplayer.duelsWon / (bot.multiplayer.duelsWon + bot.multiplayer.duelsLost)) * 100
        : 0;

      await bot.save();
      createdBots.push(bot);
      console.log(`✓ Created bot: ${botName} (Level ${bot.gameData.level})`);
    }

    console.log(`🤖 Bot initialization complete: ${createdBots.length} bots created`);
    return createdBots.length + existingBots;
  } catch (error) {
    console.error('Bot initialization error:', error.message);
    throw error;
  }
}

/**
 * Get all bots
 */
export async function getAllBots() {
  return Player.find({ 'multiplayer.isBot': true }, 'username displayName gameData.level multiplayer.rank').sort({
    'multiplayer.rank': -1,
  });
}

/**
 * Get random bot for challenge
 */
export async function getRandomBot() {
  const bots = await Player.find({ 'multiplayer.isBot': true });
  return bots[Math.floor(Math.random() * bots.length)];
}

/**
 * Make bot accept challenge (simulated)
 */
export async function botAcceptChallenge(matchId) {
  try {
    const match = await PvPMatch.findById(matchId);
    if (!match) return null;

    const bot = await Player.findById(match.opponent.playerId);
    if (!bot || !bot.multiplayer.isBot) return null;

    // Bot automatically accepts after random delay (2-10 seconds)
    const delay = Math.random() * 8000 + 2000;

    return new Promise((resolve) => {
      setTimeout(async () => {
        match.accept(bot._id, bot.username);
        await match.save();
        resolve(match);
      }, delay);
    });
  } catch (error) {
    console.error('Bot accept challenge error:', error.message);
    return null;
  }
}

/**
 * Generate bot attack damage (simulated AI)
 */
export function generateBotDamage(botConfig) {
  const baseSkill = botConfig.skillLevel || 50;
  const strategy = botConfig.duelStrategy || 'balanced';

  let damage = Math.random() * (baseSkill * 0.3) + baseSkill * 0.1;

  // Adjust based on strategy
  switch (strategy) {
    case 'aggressive':
      damage *= 1.3;
      break;
    case 'defensive':
      damage *= 0.7;
      break;
    case 'balanced':
    default:
      damage *= 1.0;
  }

  // Add variance
  damage += (Math.random() - 0.5) * (baseSkill * 0.2);

  return Math.max(1, Math.floor(damage));
}

/**
 * Make bot participate in guild wars
 */
export async function botJoinGuildWar(eventId) {
  try {
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'active') return null;

    // Get random bot
    const bot = await getRandomBot();
    if (!bot) return null;

    // Get random guild with bots
    const guilds = await Guild.find({ 'members.playerId': bot._id });
    const guild = guilds.length > 0 ? guilds[0] : null;

    if (!guild) {
      // Bot is not in a guild, skip war participation
      return null;
    }

    // Bot automatically joins war
    event.addParticipant(bot._id, guild._id);
    await event.save();

    console.log(`🤖 Bot ${bot.username} joined guild war`);
    return bot;
  } catch (error) {
    console.error('Bot join war error:', error.message);
    return null;
  }
}

/**
 * Make bot deal war damage periodically
 */
export async function botDealWarDamage(eventId) {
  try {
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'active' || event.type !== 'weekly_war') return;

    // Get bots participating in this event
    const botParticipants = await Player.find({
      'multiplayer.isBot': true,
      _id: { $in: event.participants.map((p) => p.playerId) },
    });

    for (const bot of botParticipants) {
      const guild = await Guild.findById(bot.multiplayer.guildId);
      if (!guild) continue;

      const damage = generateBotDamage(bot.multiplayer.botConfig);
      event.recordGuildDamage(guild._id, guild.name, damage);
      guild.dealDamage(damage);

      await guild.save();
    }

    await event.save();
    console.log(`🤖 Bots dealt damage in guild war ${eventId}`);
  } catch (error) {
    console.error('Bot deal war damage error:', error.message);
  }
}

/**
 * Periodic bot activity (every 5 minutes)
 */
export function startBotActivityLoop(io) {
  setInterval(async () => {
    try {
      // 30% chance for bots to participate in activities each cycle
      if (Math.random() > 0.3) return;

      const bot = await getRandomBot();
      if (!bot) return;

      // Emit bot presence update
      io.emit('presence:changed', {
        playerId: bot._id,
        username: bot.username,
        status: 'grinding',
        gameLevel: bot.gameData.level,
        timestamp: new Date(),
      });

      console.log(`🤖 Bot activity: ${bot.username} is active`);
    } catch (error) {
      console.error('Bot activity loop error:', error.message);
    }
  }, 300000); // Every 5 minutes
}

export default {
  initializeBots,
  getAllBots,
  getRandomBot,
  botAcceptChallenge,
  generateBotDamage,
  botJoinGuildWar,
  botDealWarDamage,
  startBotActivityLoop,
};
