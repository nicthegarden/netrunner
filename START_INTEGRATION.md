# 🚀 START INTEGRATION NOW - Step by Step

This guide will walk you through integrating the multiplayer backend into your game. **Should take 1-2 hours for basic integration.**

---

## ✅ Before You Start

- ✓ Backend test server running on port 3000
- ✓ Frontend SDK available (netrunnerClient.js)
- ✓ Game running on port 8000
- ✓ All API endpoints tested

---

## 📋 Phase A: SDK Integration (30 minutes)

### Step 1.1: Update index.html

Open `/home/edve/netrunner/index.html` and add SDK import before other scripts:

Find this line (around line 190):
```html
<script type="module" src="js/app.js"></script>
```

Replace with:
```html
<!-- Multiplayer SDK -->
<script type="module" src="js/netrunnerClient.js"></script>

<!-- App Bootstrap -->
<script type="module" src="js/app.js"></script>
```

### Step 1.2: Update app.js

Open `/home/edve/netrunner/js/app.js` and add this at the very top:

```javascript
import { NetrunnerClient } from './netrunnerClient.js';

// Initialize multiplayer client
const gameClient = new NetrunnerClient({
  apiUrl: 'http://localhost:3000',
  socketUrl: 'ws://localhost:3000'
});

// Make available globally
window.gameClient = gameClient;
```

After line that says `const gameInstance = new Game()`:

```javascript
// Wire game client to game instance
gameInstance.gameClient = gameClient;
window.gameInstance = gameInstance;
```

### Step 1.3: Test Integration

1. Open your browser console (F12)
2. Go to http://localhost:8000
3. In console, run:
```javascript
console.log(window.gameClient);
console.log(window.gameInstance);
```

You should see both objects logged.

**If successful:** SDK is integrated! ✅

---

## 🎮 Phase B: Add Multiplayer UI (1 hour)

### Step 2.1: Add Navigation Buttons

Open `/home/edve/netrunner/index.html` and find the sidebar nav section (around line 60-100).

Add these new buttons after the skill categories and before the utility nav:

```html
<!-- MULTIPLAYER SECTION -->
<div class="nav-section">
  <h3>MULTIPLAYER</h3>
  <div class="nav-skills">
    <button class="nav-btn nav-special" data-view="pvp">⚔️ PvP Duels</button>
    <button class="nav-btn nav-special" data-view="guilds">🏰 Guilds</button>
    <button class="nav-btn nav-special" data-view="events">📅 Events</button>
    <button class="nav-btn nav-special" data-view="leaderboards">🏆 Leaderboards</button>
  </div>
</div>
```

### Step 2.2: Add View Containers

In the same file, find the section with other view divs (around line 150), add:

```html
<!-- PvP Duels View -->
<div id="view-pvp" class="view-content">
  <h2 class="view-title">⚔️ PvP DUELS</h2>
  <div id="pvp-container">
    <h3>Available Opponents</h3>
    <div id="pvp-opponents"></div>
    <h3>Your PvP Stats</h3>
    <div id="pvp-stats"></div>
    <h3>Recent Duels</h3>
    <div id="pvp-history"></div>
  </div>
</div>

<!-- Guilds View -->
<div id="view-guilds" class="view-content">
  <h2 class="view-title">🏰 GUILDS</h2>
  <div id="guilds-container">
    <h3>Your Guild</h3>
    <div id="my-guild"></div>
    <h3>Available Guilds</h3>
    <div id="available-guilds"></div>
    <button class="btn-primary" id="btn-create-guild">Create New Guild</button>
  </div>
</div>

<!-- Events View -->
<div id="view-events" class="view-content">
  <h2 class="view-title">📅 EVENTS</h2>
  <div id="events-container">
    <h3>Active Events</h3>
    <div id="active-events"></div>
    <h3>Guild Wars</h3>
    <div id="guild-wars"></div>
  </div>
</div>

<!-- Leaderboards View -->
<div id="view-leaderboards" class="view-content">
  <h2 class="view-title">🏆 LEADERBOARDS</h2>
  <div id="leaderboards-container">
    <div id="leaderboards-tabs">
      <button class="tab-btn" data-leaderboard="xp">XP</button>
      <button class="tab-btn" data-leaderboard="elo">PvP (ELO)</button>
      <button class="tab-btn" data-leaderboard="wealth">Wealth</button>
    </div>
    <div id="leaderboard-list"></div>
  </div>
</div>
```

### Step 2.3: Create multiplayer.js

Create a new file: `/home/edve/netrunner/js/multiplayer.js`

```javascript
/**
 * Multiplayer Module - Handles all multiplayer UI and interactions
 */

export class MultiplayerManager {
  constructor(gameClient, gameInstance) {
    this.client = gameClient;
    this.game = gameInstance;
    this.init();
  }

  init() {
    console.log('✓ Multiplayer module initialized');
    this.setupEventListeners();
    this.setupWebSocketListeners();
  }

  setupEventListeners() {
    // PvP events
    document.addEventListener('click', (e) => {
      if (e.target.id === 'btn-challenge-player') {
        this.challengePlayer(e.target.dataset.playerId);
      }
    });

    // Guild events
    if (document.getElementById('btn-create-guild')) {
      document.getElementById('btn-create-guild').addEventListener('click', () => {
        this.showCreateGuildModal();
      });
    }
  }

  setupWebSocketListeners() {
    if (!this.client) return;

    this.client.on('duel:started', (match) => {
      this.showNotification(`🔥 Duel started vs ${match.opponent}!`);
      this.refreshPvPUI();
    });

    this.client.on('duel:finished', (match) => {
      const result = match.winner === this.game.player.username ? '🎉 WON' : '😢 LOST';
      this.showNotification(`${result} against ${match.opponent}`);
      this.refreshPvPUI();
    });

    this.client.on('guild:joined', (guild) => {
      this.showNotification(`🏰 Joined guild: ${guild.name}`);
      this.refreshGuildUI();
    });

    this.client.on('event:started', (event) => {
      this.showNotification(`📅 Event started: ${event.name}`);
      this.refreshEventUI();
    });
  }

  async challengePlayer(playerId) {
    const wager = prompt('Enter wager amount (E$):', '5000');
    if (!wager) return;

    try {
      const result = await this.client.pvp.challengePlayer(playerId, parseInt(wager));
      this.showNotification(`✓ Challenge sent to ${result.opponent}`);
      this.refreshPvPUI();
    } catch (error) {
      this.showNotification(`✗ Error: ${error.message}`);
    }
  }

  async showCreateGuildModal() {
    const name = prompt('Guild name:');
    if (!name) return;
    const tag = prompt('Guild tag (3 letters):');
    if (!tag) return;

    try {
      const guild = await this.client.guilds.create({ name, tag });
      this.showNotification(`✓ Guild created: ${guild.name}`);
      this.refreshGuildUI();
    } catch (error) {
      this.showNotification(`✗ Error: ${error.message}`);
    }
  }

  async refreshPvPUI() {
    if (!document.getElementById('pvp-container').style.display !== 'none') {
      return; // UI not visible
    }

    try {
      // Get player stats
      const stats = await this.client.pvp.getStats(this.game.player.username);
      document.getElementById('pvp-stats').innerHTML = `
        <p>ELO Rating: ${stats.elo || 0}</p>
        <p>Wins: ${stats.duelsWon || 0}</p>
        <p>Losses: ${stats.duelsLost || 0}</p>
        <p>Win Rate: ${stats.winRate || '0%'}</p>
      `;

      // Get leaderboard
      const leaderboard = await this.client.leaderboards.getELO();
      this.renderLeaderboard(leaderboard, 'pvp-opponents');
    } catch (error) {
      console.error('Error refreshing PvP UI:', error);
    }
  }

  async refreshGuildUI() {
    try {
      const guilds = await this.client.guilds.list();
      this.renderGuildsList(guilds);
    } catch (error) {
      console.error('Error refreshing guild UI:', error);
    }
  }

  async refreshEventUI() {
    try {
      const events = await this.client.events.list();
      this.renderEventsList(events);
    } catch (error) {
      console.error('Error refreshing events UI:', error);
    }
  }

  renderLeaderboard(leaderboard, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !leaderboard) return;

    container.innerHTML = leaderboard
      .slice(0, 10)
      .map(
        (entry, i) =>
          `<div class="leaderboard-entry">
        <span class="rank">#${i + 1}</span>
        <span class="name">${entry.username}</span>
        <span class="value">${entry.elo || entry.xp || entry.eurodollar}</span>
      </div>`
      )
      .join('');
  }

  renderGuildsList(guilds) {
    const container = document.getElementById('available-guilds');
    if (!container) return;

    container.innerHTML = guilds
      .map(
        (guild) =>
          `<div class="guild-card">
        <h4>${guild.name} (${guild.tag})</h4>
        <p>Members: ${guild.members}</p>
        <button class="btn-primary" data-guild-id="${guild.id}" onclick="joinGuild('${guild.id}')">
          Join Guild
        </button>
      </div>`
      )
      .join('');
  }

  renderEventsList(events) {
    const container = document.getElementById('active-events');
    if (!container) return;

    container.innerHTML = events
      .map(
        (event) =>
          `<div class="event-card">
        <h4>${event.name}</h4>
        <p>Status: ${event.status}</p>
        <button class="btn-primary" onclick="joinEvent('${event.id}')">
          Join Event
        </button>
      </div>`
      )
      .join('');
  }

  showNotification(message) {
    // Use existing game notification system
    const notificationContainer = document.getElementById('notifications');
    if (notificationContainer) {
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      notificationContainer.appendChild(notification);

      setTimeout(() => notification.remove(), 3000);
    }
  }
}

// Global functions for onclick handlers
window.joinGuild = async (guildId) => {
  try {
    await window.gameClient.guilds.join(guildId);
    window.multiplayerManager.showNotification('✓ Joined guild!');
    window.multiplayerManager.refreshGuildUI();
  } catch (error) {
    window.multiplayerManager.showNotification(`✗ Error: ${error.message}`);
  }
};

window.joinEvent = async (eventId) => {
  try {
    await window.gameClient.events.join(eventId);
    window.multiplayerManager.showNotification('✓ Joined event!');
    window.multiplayerManager.refreshEventUI();
  } catch (error) {
    window.multiplayerManager.showNotification(`✗ Error: ${error.message}`);
  }
};
```

### Step 2.4: Import multiplayer module

In `/home/edve/netrunner/js/app.js`, add after gameClient initialization:

```javascript
import { MultiplayerManager } from './multiplayer.js';

// Create multiplayer manager
const multiplayerManager = new MultiplayerManager(gameClient, gameInstance);
window.multiplayerManager = multiplayerManager;
```

---

## 📊 Phase C: Sync Game Progress (20 minutes)

### Step 3.1: Add sync function to main.js

Open `/home/edve/netrunner/js/main.js` and add this in the Game class:

```javascript
// Sync game progress to backend every 5 minutes
startProgressSync() {
  setInterval(async () => {
    if (window.gameClient?.isAuthenticated()) {
      try {
        await window.gameClient.sync({
          skills: Object.fromEntries(
            Object.entries(this.skillManager.skills || {}).map(([key, skill]) => [
              key,
              { level: skill.level, xp: skill.xp }
            ])
          ),
          inventory: {
            items: this.inventory.items || [],
            slots: this.inventory.slots || 100
          },
          economy: {
            eurodollar: this.economy?.currency || 0,
            totalEarned: this.economy?.totalEarned || 0
          },
          playtime: this.player?.playtime || 0,
          prestige: {
            level: this.prestige?.level || 0,
            totalResets: this.prestige?.totalResets || 0
          }
        });
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}
```

Call this in the Game constructor or init():

```javascript
// After other initialization
this.startProgressSync();
```

---

## ✅ Testing Integration

### Test 1: SDK Loaded
Open browser console:
```javascript
console.log(window.gameClient); // Should show NetrunnerClient object
```

### Test 2: Buttons Visible
- Game should show new nav buttons: PvP, Guilds, Events, Leaderboards
- Click them to see if views load

### Test 3: API Connection
Open console:
```javascript
await window.gameClient.players.getLeaderboard();
// Should return array of players
```

### Test 4: Sync
Watch network tab (F12 > Network):
- Every 5 minutes, POST request to `/api/players/sync`
- Should have your game data

---

## 🚀 Summary

**What you've done:**
1. ✅ Integrated NetrunnerClient SDK
2. ✅ Added multiplayer UI views
3. ✅ Created multiplayer manager
4. ✅ Implemented game progress sync
5. ✅ Added WebSocket listeners

**What's working:**
- PvP leaderboard viewing
- Guild browsing
- Event viewing
- Real-time notifications
- Game progress syncing

**Next phase:** Advanced features (challenges, guild creation, etc.)

---

## 📝 Files Modified

- `index.html` - Added SDK import, nav buttons, view containers
- `js/app.js` - Initialize gameClient and multiplayerManager
- `js/main.js` - Add progress sync
- `js/multiplayer.js` - NEW - Multiplayer logic

---

**Estimated time to complete: 1-2 hours**

Ready to start? ⚡
