# NETRUNNER Multiplayer Frontend Integration Guide

Complete guide for integrating the NETRUNNER game client with the multiplayer backend server.

## Overview

The multiplayer system uses:
- **REST API** for state persistence (game progress, profile, guilds, leaderboards)
- **WebSockets** for real-time updates (duels, guild wars, notifications)
- **JWT Authentication** for secure endpoints
- **Unified Progress Model** where a single character works for both single-player and multiplayer

## Getting Started

### 1. Install Client Libraries

Add these to your frontend `package.json`:

```bash
npm install axios socket.io-client jsonwebtoken
```

### 2. Environment Configuration

Create `.env` in your frontend root:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_GAME_VERSION=1.0.0
```

### 3. Initialize Client

Create `js/multiplayer/client.js`:

```javascript
import io from 'socket.io-client';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

let token = localStorage.getItem('netrunner_token');
let playerId = localStorage.getItem('netrunner_playerId');
let socket = null;

// Create axios instance with auth headers
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Socket instance
export function getSocket() {
  return socket;
}

export function initSocket() {
  socket = io(WS_URL, {
    auth: { playerId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✓ Connected to multiplayer server');
    socket.emit('auth', { playerId });
  });

  socket.on('authenticated', (data) => {
    console.log('✓ Authenticated:', data.message);
  });

  socket.on('disconnect', () => {
    console.log('✗ Disconnected from multiplayer server');
  });

  return socket;
}

export async function setAuthToken(newToken, newPlayerId) {
  token = newToken;
  playerId = newPlayerId;
  localStorage.setItem('netrunner_token', newToken);
  localStorage.setItem('netrunner_playerId', newPlayerId);
  
  if (socket) {
    socket.auth = { playerId };
    socket.disconnect().connect();
  }
}

export async function logout() {
  token = null;
  playerId = null;
  localStorage.removeItem('netrunner_token');
  localStorage.removeItem('netrunner_playerId');
  
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { api, getSocket, initSocket, setAuthToken, logout };
```

## Integration Points

### Authentication

**Register/Login Flow:**

```javascript
import { api, setAuthToken, initSocket } from './multiplayer/client.js';

async function registerPlayer(username, email, password) {
  try {
    const res = await api.post('/auth/register', {
      username,
      email,
      password,
      confirmPassword: password,
    });

    await setAuthToken(res.data.token, res.data.player.id);
    initSocket();
    
    return res.data.player;
  } catch (error) {
    console.error('Registration failed:', error.response?.data?.error);
    throw error;
  }
}

async function loginPlayer(email, password) {
  try {
    const res = await api.post('/auth/login', { email, password });
    
    await setAuthToken(res.data.token, res.data.player.id);
    initSocket();
    
    return res.data.player;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.error);
    throw error;
  }
}

// OAuth (redirect-based)
function loginWithGitHub() {
  window.location.href = 'http://localhost:5000/auth/github';
}

function loginWithGoogle() {
  window.location.href = 'http://localhost:5000/auth/google';
}

// Handle OAuth callback
function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const username = params.get('username');
  const error = params.get('error');

  if (error) {
    console.error('OAuth failed:', error);
    return false;
  }

  if (token) {
    setAuthToken(token, username);
    initSocket();
    return true;
  }

  return false;
}

export { registerPlayer, loginPlayer, loginWithGitHub, loginWithGoogle, handleAuthCallback };
```

### Game Progress Synchronization

**Sync single-player progress to multiplayer:**

```javascript
import { api } from './multiplayer/client.js';

async function syncGameProgress(playerId, gameData) {
  try {
    const res = await api.post(`/api/players/${playerId}/sync`, { gameData });
    console.log('✓ Game progress synced:', res.data.lastSyncAt);
    return res.data;
  } catch (error) {
    console.error('Sync failed:', error.response?.data?.error);
  }
}

// Call this when saving game
function onGameSave() {
  const gameData = {
    level: game.skillManager.getHighestLevel(),
    totalXP: game.skillManager.getTotalXP(),
    skills: game.skillManager.serialize(),
    inventory: game.inventory.serialize(),
    equipment: game.equipment.serialize(),
    currency: game.economy.currency,
    prestige: game.prestige.serialize(),
    achievements: game.player.achievements.getUnlockedIds(),
    playTime: game.player.playTime,
  };

  syncGameProgress(playerId, gameData);
}

export { syncGameProgress };
```

### Guild Management

**UI for guild management:**

```javascript
import { api } from './multiplayer/client.js';

export const guildAPI = {
  async create(name, description) {
    return api.post('/api/guilds', { name, description });
  },

  async getInfo(guildId) {
    return api.get(`/api/guilds/${guildId}`);
  },

  async updateSettings(guildId, settings) {
    return api.put(`/api/guilds/${guildId}`, settings);
  },

  async getMembers(guildId) {
    return api.get(`/api/guilds/${guildId}/members`);
  },

  async invite(guildId, targetPlayerId) {
    return api.post(`/api/guilds/${guildId}/invite`, { targetPlayerId });
  },

  async removeMember(guildId, memberId) {
    return api.delete(`/api/guilds/${guildId}/members/${memberId}`);
  },

  async contribute(guildId, amount) {
    return api.post(`/api/guilds/${guildId}/treasury/contribute`, { amount });
  },

  async leave(playerId) {
    return api.post(`/api/players/${playerId}/guild/leave`);
  },
};

export default guildAPI;
```

### PvP Duels

**REST API duel flow:**

```javascript
import { api, getSocket } from './multiplayer/client.js';

export const pvpAPI = {
  async challenge(opponentId, stakes) {
    return api.post('/api/pvp/challenge', { opponentId, stakes });
  },

  async acceptChallenge(matchId) {
    return api.post(`/api/pvp/challenge/${matchId}/accept`);
  },

  async declineChallenge(matchId) {
    return api.post(`/api/pvp/challenge/${matchId}/decline`);
  },

  async getPending() {
    return api.get('/api/pvp/pending');
  },

  async getHistory(playerId, limit = 20) {
    return api.get(`/api/pvp/history/${playerId}?limit=${limit}`);
  },

  async getStats(playerId) {
    return api.get(`/api/pvp/stats/${playerId}`);
  },
};

// WebSocket duel events
export function setupDuelListeners() {
  const socket = getSocket();
  if (!socket) return;

  // Match started
  socket.on('duel:started', (data) => {
    console.log('⚔️ Duel started:', data);
    showDuelUI(data);
  });

  // Round update
  socket.on('duel:round', (data) => {
    console.log('Round', data.round, '- HP:', data.challengerHp, 'vs', data.opponentHp);
    updateDuelUI(data);
  });

  // Duel completed
  socket.on('duel:completed', (data) => {
    console.log(`${data.winner} defeats ${data.loser}`);
    showDuelResult(data);
  });
}

export default pvpAPI;
```

**WebSocket duel interaction:**

```javascript
import { getSocket } from './multiplayer/client.js';

export function initiateDuel(matchId) {
  const socket = getSocket();
  socket.emit('duel:start', { matchId });
}

export function sendAttack(matchId, damage) {
  const socket = getSocket();
  socket.emit('duel:attack', { matchId, damage });
}

export function surrenderDuel(matchId) {
  const socket = getSocket();
  socket.emit('duel:surrender', { matchId });
}

export default { initiateDuel, sendAttack, surrenderDuel };
```

### Guild Wars

**Event participation:**

```javascript
import { api, getSocket } from './multiplayer/client.js';

export const eventAPI = {
  async getEvents(type) {
    return api.get('/api/events', { params: { type } });
  },

  async getEventDetails(eventId) {
    return api.get(`/api/events/${eventId}`);
  },

  async joinEvent(eventId) {
    return api.post(`/api/events/${eventId}/join`);
  },

  async leaveEvent(eventId) {
    return api.post(`/api/events/${eventId}/leave`);
  },

  async recordDamage(eventId, damage) {
    return api.post('/api/events/guild-war/damage', { eventId, damage });
  },

  async getCurrentWarLeaderboard() {
    return api.get('/api/events/leaderboards/current');
  },
};

// WebSocket war events
export function setupWarListeners() {
  const socket = getSocket();
  if (!socket) return;

  socket.on('war:joined', (data) => {
    console.log('🏴 Joined guild war:', data);
  });

  socket.on('war:damage_update', (data) => {
    console.log('War damage update:', data);
    updateWarLeaderboard(data);
  });

  socket.on('war:victory', (data) => {
    console.log('🎉 Guild war complete:', data);
    showWarResults(data);
  });

  socket.on('war:status_update', (data) => {
    updateBossHP(data.bossHp);
  });
}

export function joinGuildWar(eventId, guildId) {
  const socket = getSocket();
  socket.emit('war:join', { eventId, guildId });
}

export function reportWarDamage(eventId, guildId, damage) {
  const socket = getSocket();
  socket.emit('war:damage', { eventId, guildId, damage });
}

export default eventAPI;
```

### Leaderboards

**Fetch and display leaderboards:**

```javascript
import { api } from './multiplayer/client.js';

export const leaderboardAPI = {
  async getPlayerLeaderboard(limit = 100, offset = 0) {
    return api.get('/api/leaderboards/players', {
      params: { limit, offset },
    });
  },

  async getPlayerByPeriod(period = 'weekly', limit = 50) {
    return api.get(`/api/leaderboards/players/${period}`, {
      params: { limit },
    });
  },

  async getGuildLeaderboard(limit = 50, sortBy = 'consecutiveWins') {
    return api.get('/api/leaderboards/guilds', {
      params: { limit, sortBy },
    });
  },

  async getPlayerRank(playerId) {
    return api.get(`/api/leaderboards/player/${playerId}/rank`);
  },

  async getGlobalStats() {
    return api.get('/api/leaderboards/stats');
  },
};

export default leaderboardAPI;
```

### Equipment Effects

**Equipment bonuses apply to single-player gameplay:**

```javascript
import { game } from './main.js'; // Your game instance

export function applyEquipmentBonuses() {
  const effects = game.equipment.getSpecialEffects();

  // XP boost
  if (effects.xpBoost > 0) {
    game.skillManager.xpMultiplier = 1 + effects.xpBoost;
  }

  // Speed boost (reduce action duration)
  if (effects.speedBoost > 0) {
    game.actionDurationMultiplier = 1 - effects.speedBoost;
  }

  // Loot boost
  if (effects.lootBoost > 0) {
    game.lootDropMultiplier = 1 + effects.lootBoost;
  }

  // Currency boost
  if (effects.currencyBoost > 0) {
    game.economy.currencyMultiplier = 1 + effects.currencyBoost;
  }

  // Lifestealing (during combat)
  if (effects.lifeSteal > 0) {
    game.combat.lifeStealMultiplier = effects.lifeSteal;
  }
}
```

## Real-Time Notifications

**Setup notification system:**

```javascript
import { getSocket } from './multiplayer/client.js';

export function setupNotifications() {
  const socket = getSocket();
  if (!socket) return;

  // PvP notifications
  socket.on('duel:completed', (data) => {
    showNotification(`⚔️ ${data.winner} defeated ${data.loser}`, 'info');
  });

  // Guild notifications
  socket.on('player:joined-guild', (data) => {
    showNotification(`${data.playerName} joined the guild`, 'guild');
  });

  // Event notifications
  socket.on('event:started', (data) => {
    showNotification(`🎉 ${data.eventName} started!`, 'event');
  });

  socket.on('event:ended', (data) => {
    showNotification(`Event complete: ${data.eventName}`, 'event');
  });

  // Global notifications
  socket.on('presence:changed', (data) => {
    updatePlayerStatus(data);
  });
}

function showNotification(message, type = 'info') {
  // Your notification UI implementation
  console.log(`[${type.toUpperCase()}]`, message);
}

function updatePlayerStatus(data) {
  // Update UI with player presence
  console.log(`${data.playerId} is ${data.status}`);
}

export { showNotification };
```

## Error Handling

**Comprehensive error handling:**

```javascript
import { api } from './multiplayer/client.js';

// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || error.message;

    switch (error.response?.status) {
      case 401:
        console.error('❌ Unauthorized - please login');
        // Redirect to login
        break;

      case 403:
        console.error('❌ Forbidden - insufficient permissions');
        break;

      case 404:
        console.error('❌ Not found');
        break;

      case 409:
        console.error('❌ Conflict -', errorMessage);
        break;

      case 500:
        console.error('❌ Server error - try again later');
        break;

      default:
        console.error('❌ Error:', errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
```

## Best Practices

1. **Always persist token to localStorage** for session recovery
2. **Emit game sync event** on regular intervals (every 30 seconds)
3. **Handle reconnection gracefully** - Socket.io auto-reconnects
4. **Cache leaderboards locally** - refresh every 5 minutes
5. **Throttle game progress sync** - don't spam updates
6. **Handle rate limiting** - backend enforces 100 req/15min
7. **Validate all user input** - server validates but validate client-side too
8. **Show connection status** - inform player if disconnected from multiplayer

## Testing Integration

**Mock API for development:**

```javascript
export const mockAPI = {
  async getPlayerProfile(playerId) {
    return Promise.resolve({
      data: {
        player: {
          id: playerId,
          username: 'test_player',
          level: 50,
          rank: 1200,
        },
      },
    });
  },

  async syncGameProgress(playerId, gameData) {
    return Promise.resolve({ data: { message: 'synced' } });
  },

  // ... add more mocks as needed
};
```

## Performance Tips

1. **Lazy-load leaderboards** - only fetch when viewing leaderboard tab
2. **Debounce damage reports** - batch war damage updates
3. **Unsubscribe from WebSocket events** on component unmount
4. **Cache player profiles** - don't re-fetch same player repeatedly
5. **Implement request timeouts** - don't wait forever for slow connections

## Resources

- [Complete API Reference](./API.md)
- [Game Design Doc](../MULTIPLAYER_PLAN.md)
- [Backend README](./README.md)
