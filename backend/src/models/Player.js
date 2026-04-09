/**
 * Player Model
 * Stores player account information, game progress, and multiplayer stats
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const playerSchema = new mongoose.Schema(
  {
    // Authentication
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Don't include by default
    },

    // OAuth
    oauthProviders: {
      github: {
        id: String,
        username: String,
        avatar: String,
      },
      google: {
        id: String,
        email: String,
        avatar: String,
      },
    },

    // Player Profile
    displayName: String,
    avatar: String,
    bio: { type: String, maxlength: 200 },

    // Game Progress (synced from single-player save)
    gameData: {
      level: { type: Number, default: 1, min: 1, max: 99 },
      totalXP: { type: Number, default: 0, min: 0 },
      skills: mongoose.Schema.Types.Mixed, // Object mapping skill_id -> { level, xp }
      inventory: mongoose.Schema.Types.Mixed, // Object of items
      equipment: mongoose.Schema.Types.Mixed, // Equipped items
      currency: { type: Number, default: 0, min: 0 },
      prestige: {
        level: { type: Number, default: 0, min: 0 },
        points: { type: Number, default: 0, min: 0 },
        totalResets: { type: Number, default: 0, min: 0 },
      },
      achievements: [String], // Array of achievement IDs
      playTime: { type: Number, default: 0, min: 0 }, // Total seconds played
    },

    // Multiplayer Stats
    multiplayer: {
      rank: { type: Number, default: 0 }, // ELO rating
      duelsWon: { type: Number, default: 0, min: 0 },
      duelsLost: { type: Number, default: 0, min: 0 },
      currencyWon: { type: Number, default: 0, min: 0 },
      currencyLost: { type: Number, default: 0, min: 0 },
      winRate: { type: Number, default: 0, min: 0, max: 100 },
      guildId: mongoose.Schema.Types.ObjectId,
      isBot: { type: Boolean, default: false },
      botConfig: {
        skillLevel: { type: Number, default: 50 },
        duelStrategy: {
          type: String,
          enum: ['aggressive', 'defensive', 'balanced'],
          default: 'balanced',
        },
        activityLevel: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
      },
    },

    // Account Status
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: String,
    banUntil: Date,

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLoginAt: Date,
    lastSyncAt: Date,
  },
  {
    timestamps: true,
    collection: 'players',
  }
);

// Hash password before saving
playerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
playerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

// Method to calculate win rate
playerSchema.methods.updateWinRate = function () {
  const total = this.multiplayer.duelsWon + this.multiplayer.duelsLost;
  this.multiplayer.winRate = total > 0 ? (this.multiplayer.duelsWon / total) * 100 : 0;
};

// Virtual for full profile
playerSchema.virtual('fullProfile').get(function () {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    gameLevel: this.gameData.level,
    prestigeLevel: this.gameData.prestige.level,
    rank: this.multiplayer.rank,
    winRate: this.multiplayer.winRate,
    isBot: this.multiplayer.isBot,
  };
});

// Index for faster queries
playerSchema.index({ username: 1 });
playerSchema.index({ email: 1 });
playerSchema.index({ 'multiplayer.rank': -1 }); // For leaderboards
playerSchema.index({ 'multiplayer.guildId': 1 });
playerSchema.index({ isActive: 1 });
playerSchema.index({ createdAt: -1 });

export const Player = mongoose.model('Player', playerSchema);
export default Player;
