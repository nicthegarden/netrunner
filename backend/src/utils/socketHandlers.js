/**
 * WebSocket Handlers
 * Real-time communication for duels, guild wars, and events
 */

import { PvPMatch } from '../models/PvPMatch.js';
import { Event } from '../models/Event.js';
import { Player } from '../models/Player.js';
import { Guild } from '../models/Guild.js';

const activeMatches = new Map(); // matchId -> { socket, data }
const playerSockets = new Map(); // playerId -> socket
const guildWars = new Map(); // guildId -> damage tracking

/**
 * Initialize WebSocket handlers
 */
export function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`✓ Player connected: ${socket.id}`);

    // Store socket reference by player ID
    socket.on('auth', async (data) => {
      try {
        const { playerId } = data;
        playerSockets.set(playerId, socket);
        socket.playerId = playerId;
        socket.emit('authenticated', { message: 'Connected to multiplayer' });
        console.log(`✓ Player authenticated: ${playerId}`);
      } catch (error) {
        console.error('Auth error:', error.message);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // ==================
    // PvP Duel Events
    // ==================

    /**
     * duel:start
     * Initialize a duel between two players
     */
    socket.on('duel:start', async (data) => {
      try {
        const { matchId } = data;
        const match = await PvPMatch.findById(matchId);

        if (!match || match.status !== 'accepted') {
          socket.emit('error', { message: 'Match not found or not accepted' });
          return;
        }

        // Start match
        match.start();
        await match.save();

        activeMatches.set(matchId, {
          socket,
          matchId,
          round: 0,
          maxRounds: 20,
        });

        // Notify both players
        const challengerSocket = playerSockets.get(match.challenger.playerId.toString());
        const opponentSocket = playerSockets.get(match.opponent.playerId.toString());

        const duelData = {
          matchId,
          challenger: { name: match.challenger.username, hp: 100, maxHp: 100 },
          opponent: { name: match.opponent.username, hp: 100, maxHp: 100 },
        };

        challengerSocket?.emit('duel:started', duelData);
        opponentSocket?.emit('duel:started', duelData);

        console.log(`⚔️ Duel started: ${match.challenger.username} vs ${match.opponent.username}`);
      } catch (error) {
        console.error('Duel start error:', error.message);
        socket.emit('error', { message: 'Failed to start duel' });
      }
    });

    /**
     * duel:attack
     * Record player attack during duel
     */
    socket.on('duel:attack', async (data) => {
      try {
        const { matchId, damage } = data;
        const matchData = activeMatches.get(matchId);

        if (!matchData) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        const match = await PvPMatch.findById(matchId);
        if (!match || match.status !== 'in_progress') {
          socket.emit('error', { message: 'Match not in progress' });
          return;
        }

        // Validate attack damage
        const validDamage = Math.max(1, Math.floor(damage));

        // Simulate opponent counter-attack
        const opponentCounterDamage = Math.max(1, Math.floor(Math.random() * validDamage * 1.2));

        // Record round
        const newChallengerHp = Math.max(0, match.challenger.hp - opponentCounterDamage);
        const newOpponentHp = Math.max(0, match.opponent.hp - validDamage);

        matchData.round += 1;
        match.recordRound(matchData.round, validDamage, opponentCounterDamage, newChallengerHp, newOpponentHp);
        await match.save();

        // Broadcast round result
        const roundResult = {
          round: matchData.round,
          challengerDamage: validDamage,
          opponentDamage: opponentCounterDamage,
          challengerHp: newChallengerHp,
          opponentHp: newOpponentHp,
        };

        io.to(`match_${matchId}`).emit('duel:round', roundResult);

        // Check for victory
        if (newOpponentHp <= 0 || newChallengerHp <= 0 || matchData.round >= matchData.maxRounds) {
          await endDuel(io, match, newChallengerHp, newOpponentHp, matchData.round);
        }
      } catch (error) {
        console.error('Duel attack error:', error.message);
        socket.emit('error', { message: 'Failed to process attack' });
      }
    });

    /**
     * duel:surrender
     * Surrender from a duel
     */
    socket.on('duel:surrender', async (data) => {
      try {
        const { matchId } = data;
        const match = await PvPMatch.findById(matchId);

        if (!match) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        // Determine winner based on who surrendered
        const isChallenger = match.challenger.playerId.toString() === socket.playerId;
        const winner = isChallenger ? match.opponent : match.challenger;
        const loser = isChallenger ? match.challenger : match.opponent;

        await endDuel(io, match, 0, 100, 0, 'surrender', winner.playerId, loser.playerId);
      } catch (error) {
        console.error('Duel surrender error:', error.message);
        socket.emit('error', { message: 'Failed to surrender' });
      }
    });

    // ==================
    // Guild War Events
    // ==================

    /**
     * war:join
     * Join guild war event
     */
    socket.on('war:join', async (data) => {
      try {
        const { eventId, guildId } = data;
        const player = await Player.findById(socket.playerId);
        const event = await Event.findById(eventId);

        if (!event || event.status !== 'active') {
          socket.emit('error', { message: 'War not active' });
          return;
        }

        // Join war room
        socket.join(`war_${eventId}_${guildId}`);
        socket.emit('war:joined', { eventId, guildId, message: 'Joined guild war' });

        console.log(`🏴 Guild war joined: ${socket.playerId}`);
      } catch (error) {
        console.error('War join error:', error.message);
        socket.emit('error', { message: 'Failed to join war' });
      }
    });

    /**
     * war:damage
     * Report damage dealt to guild war boss
     */
    socket.on('war:damage', async (data) => {
      try {
        const { eventId, guildId, damage } = data;
        const event = await Event.findById(eventId);
        const guild = await Guild.findById(guildId);

        if (!event || event.status !== 'active') {
          socket.emit('error', { message: 'War not active' });
          return;
        }

        if (!guild) {
          socket.emit('error', { message: 'Guild not found' });
          return;
        }

        // Record damage
        const validDamage = Math.max(1, Math.floor(damage));
        event.recordGuildDamage(guildId, guild.name, validDamage);
        guild.dealDamage(validDamage);

        await event.save();
        await guild.save();

        // Broadcast war update
        io.to(`war_${eventId}_${guildId}`).emit('war:damage_update', {
          guildId,
          guildName: guild.name,
          damageDealt: validDamage,
          totalGuildDamage: event.guildWar.damageDealt.find((d) => d.guildId.toString() === guildId.toString())
            ?.totalDamage,
          bosshp: event.guildWar.bossHp,
          leaderboard: event.guildWar.leaderboard,
        });

        // Check victory
        if (event.guildWar.bossHp <= 0) {
          event.complete();
          await event.save();

          io.to(`war_${eventId}`).emit('war:victory', {
            message: 'Guild war completed',
            leaderboard: event.guildWar.leaderboard,
            rewards: event.rewards,
          });

          console.log(`🎉 Guild war complete: ${eventId}`);
        }
      } catch (error) {
        console.error('War damage error:', error.message);
        socket.emit('error', { message: 'Failed to record damage' });
      }
    });

    // ==================
    // Notifications
    // ==================

    /**
     * presence:update
     * Update player presence status
     */
    socket.on('presence:update', (data) => {
      const { status, gameLevel } = data;
      socket.broadcast.emit('presence:changed', {
        playerId: socket.playerId,
        status,
        gameLevel,
        timestamp: new Date(),
      });
    });

    // ==================
    // Disconnect
    // ==================

    socket.on('disconnect', () => {
      console.log(`✗ Player disconnected: ${socket.id}`);
      playerSockets.delete(socket.playerId);
    });
  });

  return io;
}

/**
 * Helper: End a duel and process results
 */
async function endDuel(io, match, challengerHp, opponentHp, rounds, reason = 'knockout', winnerId = null, loserId = null) {
  try {
    let winner, loser;

    if (winnerId && loserId) {
      // Explicit winner (surrender)
      winner = winnerId;
      loser = loserId;
    } else if (opponentHp > challengerHp) {
      winner = match.opponent.playerId;
      loser = match.challenger.playerId;
    } else if (challengerHp > opponentHp) {
      winner = match.challenger.playerId;
      loser = match.opponent.playerId;
    } else {
      // Draw - challenger wins ties
      winner = match.challenger.playerId;
      loser = match.opponent.playerId;
    }

    // Calculate rewards
    const currencyWon = match.wager.stakes;
    const currencyLost = match.wager.stakes;

    // Update match
    const winnerDoc = await Player.findById(winner);
    const loserDoc = await Player.findById(loser);

    match.complete(winner, winnerDoc.username, loser, loserDoc.username, reason, currencyWon, currencyLost);

    // Update player stats
    winnerDoc.multiplayer.duelsWon += 1;
    winnerDoc.gameData.currency += currencyWon;
    winnerDoc.multiplayer.currencyWon += currencyWon;
    winnerDoc.multiplayer.rank = Math.max(0, winnerDoc.multiplayer.rank + 25); // ELO +25

    loserDoc.multiplayer.duelsLost += 1;
    loserDoc.gameData.currency = Math.max(0, loserDoc.gameData.currency - currencyLost);
    loserDoc.multiplayer.currencyLost += currencyLost;
    loserDoc.multiplayer.rank = Math.max(0, loserDoc.multiplayer.rank - 15); // ELO -15

    winnerDoc.updateWinRate();
    loserDoc.updateWinRate();

    await match.save();
    await winnerDoc.save();
    await loserDoc.save();

    activeMatches.delete(match._id.toString());

    // Broadcast result
    io.emit('duel:completed', {
      matchId: match._id,
      winner: winnerDoc.username,
      loser: loserDoc.username,
      reason,
      currencyWon,
      currencyLost,
      round: rounds,
    });

    console.log(`✓ Duel complete: ${winnerDoc.username} defeats ${loserDoc.username}`);
  } catch (error) {
    console.error('End duel error:', error.message);
  }
}

export { activeMatches, playerSockets, guildWars };
