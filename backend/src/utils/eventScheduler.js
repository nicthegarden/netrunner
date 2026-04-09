/**
 * Event Scheduler
 * Automatically schedules and manages game events (weekly wars, daily quests, etc.)
 */

import cron from 'node-cron';
import { Event } from '../models/Event.js';
import { Guild } from '../models/Guild.js';
import { botDealWarDamage, botJoinGuildWar } from './botManager.js';

let scheduledTasks = [];

/**
 * Initialize event scheduler
 */
export async function initializeEventScheduler(io) {
  try {
    console.log('📅 Initializing event scheduler...');

    // Create recurring events if they don't exist
    await createWeeklyWarEvents();
    await createDailyQuestEvents();

    // Schedule recurring jobs
    scheduleWeeklyWars(io);
    scheduleDailyQuests(io);
    scheduleWarDamageUpdates(io);

    console.log('✓ Event scheduler initialized');
    return true;
  } catch (error) {
    console.error('Event scheduler initialization error:', error.message);
    throw error;
  }
}

/**
 * Create weekly war event template
 */
async function createWeeklyWarEvents() {
  try {
    // Create next week's war if it doesn't exist
    const nextSaturday = getNextDayOfWeek(6); // Saturday
    const nextSunday = getNextDayOfWeek(0); // Sunday

    const existing = await Event.findOne({
      type: 'weekly_war',
      startTime: { $gte: new Date(nextSaturday) },
    });

    if (existing) {
      console.log('✓ Weekly war already scheduled');
      return;
    }

    const warEvent = new Event({
      name: 'Guild Wars - Week ' + getWeekNumber(new Date()),
      description: 'Compete with your guild to defeat the weekly boss!',
      icon: '⚔️',
      type: 'weekly_war',
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 6, // Saturday
        time: '00:00',
        duration: 172800, // 48 hours (Sat-Sun)
      },
      startTime: nextSaturday,
      endTime: nextSunday,
      status: 'scheduled',
      maxParticipants: 10000,
      requireGuild: true,
      rewards: {
        baseReward: 5000,
        participationReward: 500,
        winnersBonus: 10000,
        topRewards: [
          { rank: 1, currency: 50000, item: 'legendary_badge_1' },
          { rank: 2, currency: 30000, item: 'legendary_badge_2' },
          { rank: 3, currency: 20000, item: 'legendary_badge_3' },
        ],
      },
      guildWar: {
        bossHp: 50000,
        maxHp: 50000,
        damageDealt: [],
        leaderboard: [],
      },
    });

    await warEvent.save();
    console.log(`✓ Created weekly war event: ${warEvent.name}`);
  } catch (error) {
    console.error('Create weekly war error:', error.message);
  }
}

/**
 * Create daily quest event template
 */
async function createDailyQuestEvents() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Event.findOne({
      type: 'daily_quest',
      startTime: { $gte: today },
    });

    if (existing) {
      console.log('✓ Daily quest already scheduled');
      return;
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const questEvent = new Event({
      name: 'Daily Challenges - ' + today.toDateString(),
      description: 'Complete daily challenges for rewards!',
      icon: '📋',
      type: 'daily_quest',
      schedule: {
        frequency: 'daily',
        time: '00:00',
        duration: 86400, // 24 hours
      },
      startTime: today,
      endTime: tomorrow,
      status: 'scheduled',
      maxParticipants: 100000,
      minLevel: 1,
      rewards: {
        baseReward: 1000,
        participationReward: 100,
      },
    });

    await questEvent.save();
    console.log(`✓ Created daily quest event`);
  } catch (error) {
    console.error('Create daily quest error:', error.message);
  }
}

/**
 * Schedule weekly war start and end
 */
function scheduleWeeklyWars(io) {
  // Run every Saturday at midnight UTC
  const warStartTask = cron.schedule('0 0 * * 6', async () => {
    try {
      console.log('🚀 Starting weekly guild wars...');

      const warEvent = new Event({
        name: 'Guild Wars - Week ' + getWeekNumber(new Date()),
        description: 'Compete with your guild to defeat the weekly boss!',
        icon: '⚔️',
        type: 'weekly_war',
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 6,
          time: '00:00',
          duration: 172800,
        },
        startTime: new Date(),
        endTime: new Date(Date.now() + 172800000),
        status: 'active',
        maxParticipants: 10000,
        requireGuild: true,
        guildWar: {
          bossHp: 50000,
          maxHp: 50000,
          damageDealt: [],
          leaderboard: [],
        },
      });

      await warEvent.save();

      // Invite all guilds and their bots
      const guilds = await Guild.find({ isActive: true });
      for (const guild of guilds) {
        warEvent.addParticipant(guild._id, guild._id);
        await botJoinGuildWar(warEvent._id);
      }

      await warEvent.save();

      io.emit('event:started', {
        eventId: warEvent._id,
        eventName: warEvent.name,
        type: warEvent.type,
        duration: warEvent.schedule.duration,
      });

      console.log('⚔️ Guild wars started!');
    } catch (error) {
      console.error('War start error:', error.message);
    }
  });

  // Run every Sunday at 23:59 UTC to end wars
  const warEndTask = cron.schedule('59 23 * * 0', async () => {
    try {
      console.log('🏁 Ending weekly guild wars...');

      const activeWar = await Event.findOne({ type: 'weekly_war', status: 'active' });
      if (activeWar) {
        activeWar.status = 'completed';
        activeWar.endTime = new Date();

        // Process rewards
        for (const reward of activeWar.rewards.topRewards || []) {
          const guildEntry = activeWar.guildWar?.leaderboard?.[reward.rank - 1];
          if (guildEntry) {
            const guild = await Guild.findById(guildEntry.guildId);
            if (guild) {
              guild.treasury.currency += reward.currency;
              guild.wars.totalWarsWon += 1;
              guild.wars.consecutiveWins += 1;
              await guild.save();
            }
          }
        }

        await activeWar.save();

        io.emit('event:ended', {
          eventId: activeWar._id,
          eventName: activeWar.name,
          type: activeWar.type,
          leaderboard: activeWar.guildWar?.leaderboard,
        });

        console.log('✓ Guild wars completed!');
      }
    } catch (error) {
      console.error('War end error:', error.message);
    }
  });

  scheduledTasks.push(warStartTask, warEndTask);
}

/**
 * Schedule daily quests
 */
function scheduleDailyQuests(io) {
  // Run every day at midnight UTC
  const dailyTask = cron.schedule('0 0 * * *', async () => {
    try {
      console.log('📋 Starting daily quests...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const questEvent = new Event({
        name: 'Daily Challenges - ' + today.toDateString(),
        description: 'Complete daily challenges for rewards!',
        icon: '📋',
        type: 'daily_quest',
        schedule: {
          frequency: 'daily',
          time: '00:00',
          duration: 86400,
        },
        startTime: today,
        endTime: tomorrow,
        status: 'active',
        maxParticipants: 100000,
        minLevel: 1,
        rewards: {
          baseReward: 1000,
          participationReward: 100,
        },
      });

      await questEvent.save();

      io.emit('event:started', {
        eventId: questEvent._id,
        eventName: questEvent.name,
        type: questEvent.type,
      });

      console.log('✓ Daily quests started');
    } catch (error) {
      console.error('Daily quest error:', error.message);
    }
  });

  scheduledTasks.push(dailyTask);
}

/**
 * Schedule war damage updates every 10 minutes
 */
function scheduleWarDamageUpdates(io) {
  const updateTask = cron.schedule('*/10 * * * *', async () => {
    try {
      const activeWar = await Event.findOne({ type: 'weekly_war', status: 'active' });
      if (activeWar) {
        // Bots deal damage
        await botDealWarDamage(activeWar._id);

        // Broadcast update
        io.emit('war:status_update', {
          eventId: activeWar._id,
          bossHp: activeWar.guildWar?.bossHp,
          leaderboard: activeWar.guildWar?.leaderboard?.slice(0, 10),
        });
      }
    } catch (error) {
      console.error('War update error:', error.message);
    }
  });

  scheduledTasks.push(updateTask);
}

/**
 * Cleanup function for graceful shutdown
 */
export function stopEventScheduler() {
  console.log('Stopping event scheduler...');
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks = [];
  console.log('Event scheduler stopped');
}

/**
 * Helper: Get next occurrence of day of week
 */
function getNextDayOfWeek(dayOfWeek) {
  const date = new Date();
  const currentDay = date.getDay();
  const daysAhead = dayOfWeek - currentDay;

  if (daysAhead <= 0) {
    date.setDate(date.getDate() + 7 + daysAhead);
  } else {
    date.setDate(date.getDate() + daysAhead);
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Helper: Get week number
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export { stopEventScheduler };
