# 🔗 NETRUNNER Backend Integration Plan

## 🎯 Objective
Integrate the multiplayer backend (32 API endpoints, PvP, guilds, events) with the existing single-player game.

## 📊 Current State

### Existing Game
- ✅ Single-player idle game (24 skills, combat, crafting, prestige)
- ✅ All game logic complete
- ✅ Game saves to localStorage
- ✅ No multiplayer features yet

### New Backend
- ✅ 32 REST API endpoints running
- ✅ PvP duel system ready
- ✅ Guild system ready
- ✅ Event system ready
- ✅ Leaderboards ready
- ✅ Frontend SDK available (netrunnerClient.js)

---

## 🔧 Integration Phases

### **Phase A: SDK Integration (2 hours)**
- Add NetrunnerClient to game initialization
- Connect auth system
- Load player data from backend
- Sync game progress automatically

### **Phase B: Multiplayer UI (4 hours)**
- Add PvP duel interface
- Add guild management interface
- Add events/guild wars interface
- Add leaderboard views

### **Phase C: Real-time Features (3 hours)**
- Add WebSocket for live updates
- Live duel notifications
- Live guild war updates
- Live leaderboard updates

### **Phase D: Testing & Polish (3 hours)**
- Test all multiplayer features
- Fix bugs
- Optimize performance
- Deploy to production

---

## 📋 Step-by-Step Integration

### Step 1: Import NetrunnerClient
**File:** `/home/edve/netrunner/js/app.js`

Add at the top:
```javascript
import { NetrunnerClient } from './netrunnerClient.js';
```

### Step 2: Initialize Client
**In app.js after Game initialization:**

```javascript
// Initialize multiplayer client
const gameClient = new NetrunnerClient({
  apiUrl: 'http://localhost:3000',  // Backend URL
  socketUrl: 'ws://localhost:3000'   // WebSocket URL
});

// Make available globally
window.gameClient = gameClient;
window.gameInstance = game;
```

### Step 3: Add OAuth Login UI
**Create:** `/home/edve/netrunner/html/login-modal.html`

```html
<div id="login-modal" class="modal" style="display:none;">
  <div class="modal-content">
    <h2>NETRUNNER Login</h2>
    <button id="github-login">Login with GitHub</button>
    <button id="google-login">Login with Google</button>
    <p>or continue offline</p>
    <button id="offline-continue">Continue Offline</button>
  </div>
</div>
```

### Step 4: Add PvP Interface
**Create:** `/home/edve/netrunner/html/pvp-modal.html`

Features:
- List available opponents
- Show ELO ratings
- Challenge player with wager amount
- View duel history
- Track wins/losses

### Step 5: Add Guild Interface
**Create:** `/home/edve/netrunner/html/guilds-modal.html`

Features:
- Create new guild
- Browse guilds
- Join guild
- View guild members
- Guild wars participation

### Step 6: Add Events Interface
**Create:** `/home/edve/netrunner/html/events-modal.html`

Features:
- View active events
- Join events
- Submit damage in guild wars
- View event leaderboards

### Step 7: Add Leaderboards
**Create:** `/home/edve/netrunner/html/leaderboards-modal.html`

Features:
- XP leaderboard
- PvP ELO leaderboard
- Wealth leaderboard
- Prestige leaderboard

### Step 8: Sync Game Progress
**In:** `/home/edve/netrunner/js/main.js`

Add periodic sync:
```javascript
// Sync every 5 minutes
setInterval(async () => {
  if (window.gameClient?.isAuthenticated()) {
    await window.gameClient.sync({
      skills: this.skillManager.serialize(),
      inventory: this.inventory.serialize(),
      equipment: this.equipment.serialize(),
      economy: this.economy.serialize(),
      playtime: this.player.playtime,
      prestige: this.prestige.serialize(),
    });
  }
}, 5 * 60 * 1000);
```

---

## 🎮 UI Integration Points

### Navigation
Add multiplayer nav buttons to sidebar:
```html
<button class="nav-btn nav-special" data-view="pvp">⚔️ PvP Duels</button>
<button class="nav-btn nav-special" data-view="guilds">🏰 Guilds</button>
<button class="nav-btn nav-special" data-view="events">📅 Events</button>
<button class="nav-btn nav-special" data-view="leaderboards">🏆 Leaderboards</button>
```

### Notifications
Display multiplayer notifications:
- "You've been challenged by PlayerName!"
- "Your duel with PlayerName finished!"
- "Guild war boss defeated!"
- "New high score on XP leaderboard!"

### Real-time Updates
WebSocket listeners:
```javascript
gameClient.on('duel:started', (match) => {
  showNotification(`Duel started: ${match.opponent}`);
});

gameClient.on('duel:finished', (match) => {
  showNotification(`Duel finished! Winner: ${match.winner}`);
});

gameClient.on('guild_war:update', (event) => {
  showNotification(`Guild war update: ${event.message}`);
});
```

---

## 📁 Files to Create/Modify

### Modify:
- `js/app.js` - Add client initialization and event delegation
- `js/main.js` - Add sync logic
- `index.html` - Add multiplayer nav buttons
- `css/main.css` - Add styles for multiplayer UI

### Create:
- `js/multiplayer.js` - Multiplayer-specific logic
- `html/login-modal.html` - Login interface
- `html/pvp-modal.html` - PvP interface
- `html/guilds-modal.html` - Guild interface
- `html/events-modal.html` - Events interface
- `html/leaderboards-modal.html` - Leaderboards interface
- `INTEGRATION_GUIDE.md` - Integration documentation

---

## 🔌 Backend Integration Checklist

- [ ] Import NetrunnerClient
- [ ] Initialize client with correct API URL
- [ ] Implement OAuth login
- [ ] Add multiplayer nav buttons
- [ ] Create PvP interface
- [ ] Create guild interface
- [ ] Create events interface
- [ ] Create leaderboards interface
- [ ] Implement game progress sync
- [ ] Add WebSocket listeners
- [ ] Add multiplayer notifications
- [ ] Test all multiplayer features
- [ ] Deploy to production

---

## ⚡ Quick Start (1 hour setup)

### 1. Add import (5 min)
```javascript
import { NetrunnerClient } from './netrunnerClient.js';
```

### 2. Initialize client (5 min)
```javascript
const gameClient = new NetrunnerClient({
  apiUrl: 'http://localhost:3000',
  socketUrl: 'ws://localhost:3000'
});
window.gameClient = gameClient;
```

### 3. Add basic UI (20 min)
- Add nav buttons for PvP, Guilds, Events, Leaderboards
- Create simple modal templates

### 4. Add sync (20 min)
- Implement progress sync
- Test data is sent correctly

### 5. Test (10 min)
- Verify backend receives data
- Check frontend gets responses
- Test in browser console

---

## 🎯 Success Criteria

After integration, you should be able to:

✅ Login with GitHub/Google or offline
✅ View player profile synced from backend
✅ Challenge other players to duels
✅ Create and manage guilds
✅ Participate in guild wars
✅ View leaderboards
✅ See real-time notifications
✅ Sync game progress automatically
✅ Get ELO ratings for PvP
✅ Earn multiplayer achievements

---

## 🚀 Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| SDK Integration | 2 hours | Ready to start |
| UI Development | 4 hours | Depends on Phase A |
| Real-time Features | 3 hours | Depends on Phase B |
| Testing & Polish | 3 hours | Final phase |
| **TOTAL** | **12 hours** | |

---

## 💡 Pro Tips

1. Start with PvP - it's the simplest multiplayer feature
2. Test each feature individually before combining
3. Use browser DevTools to monitor network requests
4. Keep offline mode working as fallback
5. Test thoroughly before production deployment

---

## 📞 Reference

- **SDK Location:** `/home/edve/netrunner/js/netrunnerClient.js`
- **Backend API:** `http://localhost:3000`
- **API Docs:** `/home/edve/netrunner/API.md`
- **SDK Docs:** `/home/edve/netrunner/FRONTEND_INTEGRATION.md`

---

**Next:** Start with Phase A - SDK Integration (Should take ~2 hours)
