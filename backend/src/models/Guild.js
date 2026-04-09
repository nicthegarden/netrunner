/**
 * Guild Model
 * Stores guild information, members, treasury, and wars
 */

import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema(
  {
    // Guild Info
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    description: { type: String, maxlength: 500 },
    icon: String,
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },

    // Members
    members: [
      {
        playerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Player',
          required: true,
        },
        role: {
          type: String,
          enum: ['leader', 'officer', 'member'],
          default: 'member',
        },
        joinedAt: { type: Date, default: Date.now },
        contributedDamage: { type: Number, default: 0, min: 0 },
      },
    ],

    // Treasury
    treasury: {
      currency: { type: Number, default: 0, min: 0 },
      totalContributed: { type: Number, default: 0, min: 0 },
      totalSpent: { type: Number, default: 0, min: 0 },
    },

    // Guild Wars
    wars: {
      weeklyBossHp: { type: Number, default: 10000, min: 0 }, // Current week boss HP
      weeklyDamageDealt: { type: Number, default: 0, min: 0 }, // Total damage dealt this week
      consecutiveWins: { type: Number, default: 0, min: 0 },
      totalWarsWon: { type: Number, default: 0, min: 0 },
      totalWarsLost: { type: Number, default: 0, min: 0 },
      warStreak: { type: Number, default: 0 }, // Can be negative
      lastWarStartDate: Date,
      lastWarEndDate: Date,
    },

    // Leveling
    level: { type: Number, default: 1, min: 1 },
    experience: { type: Number, default: 0, min: 0 },

    // Prestige/Bonuses
    guildBonuses: {
      xpMultiplier: { type: Number, default: 1.0, min: 1.0 },
      currencyMultiplier: { type: Number, default: 1.0, min: 1.0 },
      lootBonus: { type: Number, default: 0, min: 0, max: 0.5 },
    },

    // Perks (unlocked via guild level)
    perks: {
      bankSlots: { type: Number, default: 5 },
      memberLimit: { type: Number, default: 10 },
      warReward: { type: Number, default: 1 }, // Multiplier
    },

    // Settings
    joinPolicy: {
      type: String,
      enum: ['open', 'invite_only', 'application'],
      default: 'invite_only',
    },
    pvpEnabled: { type: Boolean, default: true },

    // Status
    isActive: { type: Boolean, default: true },
    disbandedAt: Date,

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'guilds',
  }
);

// Method to add member
guildSchema.methods.addMember = function (playerId, role = 'member') {
  if (this.members.length >= this.perks.memberLimit) {
    throw new Error('Guild is full');
  }

  const exists = this.members.some((m) => m.playerId.toString() === playerId.toString());
  if (exists) {
    throw new Error('Player already in guild');
  }

  this.members.push({ playerId, role });
};

// Method to remove member
guildSchema.methods.removeMember = function (playerId) {
  this.members = this.members.filter((m) => m.playerId.toString() !== playerId.toString());
};

// Method to contribute to treasury
guildSchema.methods.contribute = function (amount) {
  this.treasury.currency += amount;
  this.treasury.totalContributed += amount;
  this.experience += amount * 0.01; // 1 exp per 100 currency
};

// Method to spend from treasury
guildSchema.methods.spend = function (amount) {
  if (this.treasury.currency < amount) {
    throw new Error('Insufficient guild treasury');
  }
  this.treasury.currency -= amount;
  this.treasury.totalSpent += amount;
};

// Method to process war damage
guildSchema.methods.dealDamage = function (damage) {
  this.wars.weeklyBossHp = Math.max(0, this.wars.weeklyBossHp - damage);
  this.wars.weeklyDamageDealt += damage;
};

// Method to check if guild won the war (for weekly reset)
guildSchema.methods.checkWarVictory = function () {
  return this.wars.weeklyBossHp <= 0;
};

// Index for faster queries
guildSchema.index({ name: 1 });
guildSchema.index({ leaderId: 1 });
guildSchema.index({ 'members.playerId': 1 });
guildSchema.index({ 'wars.consecutiveWins': -1 }); // For rankings
guildSchema.index({ createdAt: -1 });

export const Guild = mongoose.model('Guild', guildSchema);
export default Guild;
