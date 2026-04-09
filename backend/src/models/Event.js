/**
 * Event Model
 * Stores scheduled game events (guild wars, daily quests, seasonal challenges, etc.)
 */

import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    // Event Info
    name: {
      type: String,
      required: true,
    },
    description: String,
    icon: String,
    type: {
      type: String,
      enum: ['daily_quest', 'weekly_war', 'seasonal_challenge', 'tournament', 'boss_raid', 'special_event'],
      required: true,
    },

    // Scheduling
    schedule: {
      frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly', 'seasonal'],
        required: true,
      },
      dayOfWeek: Number, // 0-6 for weekly (0 = Sunday)
      time: String, // HH:mm format (UTC)
      duration: { type: Number, default: 3600 }, // seconds
    },

    // Status
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    startTime: Date,
    endTime: Date,

    // Participation
    participants: [
      {
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Player',
        },
        guildId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Guild',
        },
        joinedAt: { type: Date, default: Date.now },
        score: { type: Number, default: 0 },
        reward: { type: Number, default: 0 },
      },
    ],

    // For Guild Wars
    guildWar: {
      bossHp: { type: Number, default: 10000 },
      maxHp: { type: Number, default: 10000 },
      damageDealt: [
        {
          guildId: mongoose.Schema.Types.ObjectId,
          totalDamage: Number,
          contributors: Number,
        },
      ],
      leaderboard: [
        {
          guildId: mongoose.Schema.Types.ObjectId,
          guildName: String,
          damage: Number,
          rank: Number,
        },
      ],
    },

    // Rewards
    rewards: {
      baseReward: { type: Number, default: 1000 }, // Currency
      participationReward: { type: Number, default: 100 },
      winnersBonus: { type: Number, default: 500 },
      topRewards: [
        {
          rank: Number,
          currency: Number,
          item: String,
        },
      ],
    },

    // Metadata
    maxParticipants: { type: Number, default: 1000 },
    minLevel: { type: Number, default: 1 },
    requireGuild: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

// Index for faster queries
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ startTime: 1, endTime: 1 });
eventSchema.index({ 'schedule.frequency': 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdAt: -1 });

// Method to start event
eventSchema.methods.start = function () {
  this.status = 'active';
  this.startTime = new Date();
  this.endTime = new Date(Date.now() + this.schedule.duration * 1000);
};

// Method to complete event
eventSchema.methods.complete = function () {
  this.status = 'completed';
  this.endTime = new Date();
};

// Method to add participant
eventSchema.methods.addParticipant = function (playerId, guildId = null) {
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Event is full');
  }

  const exists = this.participants.some((p) => p.playerId.toString() === playerId.toString());
  if (exists) {
    throw new Error('Player already in event');
  }

  this.participants.push({ playerId, guildId, joinedAt: new Date(), score: 0 });
};

// Method to record guild damage (for wars)
eventSchema.methods.recordGuildDamage = function (guildId, guildName, damage) {
  if (!this.guildWar) {
    this.guildWar = {
      bossHp: this.maxParticipants,
      maxHp: this.maxParticipants,
      damageDealt: [],
      leaderboard: [],
    };
  }

  // Update boss HP
  this.guildWar.bossHp = Math.max(0, this.guildWar.bossHp - damage);

  // Find or create guild entry
  let guildEntry = this.guildWar.damageDealt.find((d) => d.guildId.toString() === guildId.toString());
  if (!guildEntry) {
    guildEntry = { guildId, totalDamage: 0, contributors: 0 };
    this.guildWar.damageDealt.push(guildEntry);
  }

  guildEntry.totalDamage += damage;
  guildEntry.contributors += 1;

  // Update leaderboard
  this.guildWar.leaderboard = this.guildWar.damageDealt
    .sort((a, b) => b.totalDamage - a.totalDamage)
    .map((entry, idx) => ({
      guildId: entry.guildId,
      guildName,
      damage: entry.totalDamage,
      rank: idx + 1,
    }));
};

export const Event = mongoose.model('Event', eventSchema);
export default Event;
