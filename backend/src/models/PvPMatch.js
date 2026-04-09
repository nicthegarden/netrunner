/**
 * PvP Match Model
 * Stores information about player vs player duels and matches
 */

import mongoose from 'mongoose';

const pvpMatchSchema = new mongoose.Schema(
  {
    // Match Info
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    matchType: {
      type: String,
      enum: ['duel', 'ranked', 'casual'],
      default: 'duel',
    },

    // Players
    challenger: {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true,
      },
      hp: { type: Number, default: 100 },
      maxHp: { type: Number, default: 100 },
      damage: { type: Number, default: 0 },
      username: String,
    },

    opponent: {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
      },
      hp: { type: Number, default: 100 },
      maxHp: { type: Number, default: 100 },
      damage: { type: Number, default: 0 },
      username: String,
    },

    // Wager
    wager: {
      currency: { type: Number, default: 0, min: 0 },
      stakes: { type: Number, default: 0, min: 0 }, // Per player bet
    },

    // Combat Log
    rounds: [
      {
        roundNumber: Number,
        timestamp: Date,
        challenger: {
          damage: Number,
          accuracy: Number,
        },
        opponent: {
          damage: Number,
          accuracy: Number,
        },
        challengerHp: Number,
        opponentHp: Number,
      },
    ],

    // Result
    result: {
      winnerId: mongoose.Schema.Types.ObjectId,
      winnerName: String,
      loserId: mongoose.Schema.Types.ObjectId,
      loserName: String,
      reason: {
        type: String,
        enum: ['knockout', 'surrender', 'timeout', 'error'],
      },
      currencyWon: Number,
      currencyLost: Number,
      eloChange: {
        challenger: { type: Number, default: 0 },
        opponent: { type: Number, default: 0 },
      },
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    expiresAt: { type: Date, default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) }, // 24h expiry for pending

    // Metadata
    isRanked: { type: Boolean, default: false },
    spectatorCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'pvp_matches',
  }
);

// Index for faster queries
pvpMatchSchema.index({ 'challenger.playerId': 1 });
pvpMatchSchema.index({ 'opponent.playerId': 1 });
pvpMatchSchema.index({ status: 1 });
pvpMatchSchema.index({ 'result.winnerId': 1 });
pvpMatchSchema.index({ createdAt: -1 });
pvpMatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Method to accept match
pvpMatchSchema.methods.accept = function (opponentId, opponentName) {
  this.opponent.playerId = opponentId;
  this.opponent.username = opponentName;
  this.status = 'accepted';
  this.acceptedAt = new Date();
};

// Method to start match
pvpMatchSchema.methods.start = function () {
  this.status = 'in_progress';
  this.startedAt = new Date();
};

// Method to record round
pvpMatchSchema.methods.recordRound = function (roundNumber, challengerDmg, opponentDmg, challengerHp, opponentHp) {
  this.rounds.push({
    roundNumber,
    timestamp: new Date(),
    challenger: { damage: challengerDmg, accuracy: 100 },
    opponent: { damage: opponentDmg, accuracy: 100 },
    challengerHp,
    opponentHp,
  });

  // Update current HP
  this.challenger.hp = challengerHp;
  this.opponent.hp = opponentHp;
};

// Method to complete match
pvpMatchSchema.methods.complete = function (winnerId, winnerName, loserId, loserName, reason, currencyWon, currencyLost) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.result.winnerId = winnerId;
  this.result.winnerName = winnerName;
  this.result.loserId = loserId;
  this.result.loserName = loserName;
  this.result.reason = reason;
  this.result.currencyWon = currencyWon;
  this.result.currencyLost = currencyLost;
};

export const PvPMatch = mongoose.model('PvPMatch', pvpMatchSchema);
export default PvPMatch;
