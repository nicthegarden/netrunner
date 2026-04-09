# NETRUNNER Multiplayer Integration Guide
## Phase 6: Frontend Client SDK Implementation

This document provides complete integration instructions for adding multiplayer features to the NETRUNNER single-player idle game using the NetrunnerClient SDK.

---

## Quick Start

### 1. Include the Client Library

Add the client SDK to your HTML:

```html
<!-- In index.html, before your game script -->
<script src="/backend/src/utils/clientSDK.js"></script>
```

Or import as ES6 module:

```javascript
import NetrunnerClient from './clientSDK.js';
```

### 2. Initialize the Client

In your main game initialization code (e.g., `js/app.js`):

```javascript
// Initialize multiplayer client
const netrunner = new NetrunnerClient({
  apiUrl: 'http://localhost:3000/api', // or production URL
  gameId: 'netrunner-main',
  oauth: {
    githubId: process.env.GITHUB_OAUTH_ID,
    googleId: process.env.GOOGLE_OAUTH_ID,
  },
  callbacks: {
    authenticated: (data) => console.log('Logged in!', data),
    'duel:started': (data) => console.log('Duel started!', data),
    'war:damage_update': (data) => console.log('War damage:', data),
  },
});

// Store globally for access in game code
window.netrunner = netrunner;
```

### 3. Add Login UI

Modify the game UI to include multiplayer login:

```html
<!-- Add to index.html in a modal or sidebar -->
<div id="multiplayer-panel" style="display: none;">
  <h2>Multiplayer</h2>
  
  <!-- Login section -->
  <div id="login-section">
    <input id="username-input" type="text" placeholder="Username">
    <input id="password-input" type="password" placeholder="Password">
    <button id="login-btn">Login</button>
    <button id="register-btn">Register</button>
    
    <!-- OAuth buttons -->
    <button id="github-login">Login with GitHub</button>
    <button id="google-login">Login with Google</button>
  </div>
  
  <!-- Multiplayer section (shown when logged in) -->
  <div id="multiplayer-section" style="display: none;">
    <p id="player-info"></p>
    <button id="logout-btn">Logout</button>
    
    <!-- Leaderboards -->
    <div id="leaderboard-section">
      <h3>Leaderboards</h3>
      <button id="view-xp-leaderboard">XP Leaderboard</button>
      <button id="view-elo-leaderboard">ELO Leaderboard</button>
    </div>
    
    <!-- PvP Duels -->
    <div id="pvp-section">
      <h3>PvP Duels</h3>
      <input id="opponent-search" type="text" placeholder="Search player...">
      <button id="challenge-player">Challenge</button>
      <div id="pending-challenges"></div>
    </div>
    
    <!-- Guilds -->
    <div id="guild-section">
      <h3>Guilds</h3>
      <button id="view-guilds">Browse Guilds</button>
      <button id="create-guild">Create Guild</button>
      <div id="my-guild"></div>
    </div>
  </div>
</div>
```

### 4. Wire Up Event Handlers

In your game code (e.g., `js/app.js`):

```javascript
// Login button
document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('username-input').value;
  const password = document.getElementById('password-input').value;
  
  try {
    const result = await netrunner.login(username, password);
    updateUIAfterLogin(result.player);
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
});

// Register button
document.getElementById('register-btn').addEventListener('click', async () => {
  const username = document.getElementById('username-input').value;
  const email = prompt('Email:');
  const password = document.getElementById('password-input').value;
  
  try {
    const result = await netrunner.register({
      username, email, password,
      confirmPassword: password
    });
    updateUIAfterLogin(result.player);
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
});

// OAuth login
document.getElementById('github-login').addEventListener('click', () => {
  netrunner.initiateOAuthLogin('github');
});

document.getElementById('google-login').addEventListener('click', () => {
  netrunner.initiateOAuthLogin('google');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  netrunner.logout();
  updateUIAfterLogout();
});

function updateUIAfterLogin(player) {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('multiplayer-section').style.display = 'block';
  document.getElementById('player-info').textContent = 
    `Welcome ${player.username}! XP: ${player.totalXP}, ELO: ${player.eloRating}`;
  
  // Connect to WebSocket for real-time updates
  netrunner.connectWebSocket().catch(console.error);
}

function updateUIAfterLogout() {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('multiplayer-section').style.display = 'none';
}
```

---

## Integration with Single-Player Game Progress

### Sync Game Progress to Multiplayer

After skill progression, craft items, or other achievements, sync to the multiplayer server:

```javascript
// In your game loop or after major actions
async function syncGameProgress() {
  try {
    // Collect game data from your single-player game
    const gameData = {
      totalXP: game.skillManager.getTotalXP(),
      skills: game.skillManager.getAllSkillsData(),
      currency: game.economy.getTotalCurrency(),
      inventory: game.inventory.getItems(),
      equipment: game.equipment.getEquipment(),
      prestige: game.prestige.level,
    };
    
    // Sync to server
    await netrunner.syncGameProgress(gameData);
    
    console.log('Game progress synced to server');
  } catch (error) {
    console.error('Failed to sync progress:', error);
    // Retry in 30 seconds
    setTimeout(syncGameProgress, 30000);
  }
}

// Call this periodically (e.g., every 5 minutes or after significant progress)
setInterval(syncGameProgress, 5 * 60 * 1000);
```

### Display Synced Progress

```javascript
// Get and display server-side progress
async function displayServerProgress() {
  try {
    const progress = await netrunner.getGameProgress();
    console.log('Server progress:', progress);
    
    // Could display stats like:
    // - Total XP (from all players with same account)
    // - Rank on leaderboard
    // - Guilds and achievements
  } catch (error) {
    console.error('Failed to get server progress:', error);
  }
}
```

---

## PvP Duel System

### Challenge a Player

```javascript
// Search for player and challenge them
document.getElementById('challenge-player').addEventListener('click', async () => {
  const opponentName = document.getElementById('opponent-search').value;
  
  try {
    // First, find player by username
    const players = await netrunner.getLeaderboard({ limit: 1000 });
    const opponent = players.find(p => p.username.toLowerCase() === opponentName.toLowerCase());
    
    if (!opponent) {
      alert('Player not found');
      return;
    }
    
    // Challenge with stakes
    const stakes = prompt('Enter stakes (1000-10000 E$):', '1000');
    const match = await netrunner.challengePlayer(opponent.id, {
      stakes: parseInt(stakes),
    });
    
    alert(`Challenge sent! Match ID: ${match.id}`);
  } catch (error) {
    alert('Challenge failed: ' + error.message);
  }
});
```

### Accept/Decline Challenges

```javascript
// Display and handle pending challenges
async function displayPendingChallenges() {
  try {
    const challenges = await netrunner.getPendingChallenges();
    const container = document.getElementById('pending-challenges');
    
    container.innerHTML = challenges.map(match => `
      <div class="challenge">
        <p>${match.challenger.username} challenges you!</p>
        <p>Stakes: ${match.stakes} E$</p>
        <button onclick="acceptChallenge('${match.id}')">Accept</button>
        <button onclick="declineChallenge('${match.id}')">Decline</button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load challenges:', error);
  }
}

async function acceptChallenge(matchId) {
  try {
    const match = await netrunner.acceptChallenge(matchId);
    
    // Connect to WebSocket if not already connected
    if (!netrunner.state.isConnected) {
      await netrunner.connectWebSocket();
    }
    
    alert('Challenge accepted! Duel starting...');
    // UI should now show the real-time duel
  } catch (error) {
    alert('Failed to accept: ' + error.message);
  }
}

async function declineChallenge(matchId) {
  try {
    await netrunner.declineChallenge(matchId);
    alert('Challenge declined');
    displayPendingChallenges(); // Refresh list
  } catch (error) {
    alert('Failed to decline: ' + error.message);
  }
}
```

### Real-Time Duel Display

```javascript
// Listen for duel events via WebSocket
netrunner.on('duel:started', (data) => {
  console.log('Duel started!', data);
  // Show duel UI with both players' HP bars
  displayDuelUI(data);
});

netrunner.on('duel:round', (data) => {
  console.log('Round update:', data);
  // Update HP bars, show attack animations
  updateDuelDisplay(data);
});

netrunner.on('duel:completed', (data) => {
  console.log('Duel finished!', data);
  // Show results: winner, XP/currency changes
  displayDuelResults(data);
});

// Example duel UI
function displayDuelUI(match) {
  const html = `
    <div id="duel-screen">
      <div class="player-1">
        <h3>${match.player1.username}</h3>
        <div class="hp-bar" id="p1-hp" style="width: 100%"></div>
        <p id="p1-hp-text">${match.player1Hp} / ${match.player1MaxHp}</p>
      </div>
      
      <div class="vs">VS</div>
      
      <div class="player-2">
        <h3>${match.player2.username}</h3>
        <div class="hp-bar" id="p2-hp" style="width: 100%"></div>
        <p id="p2-hp-text">${match.player2Hp} / ${match.player2MaxHp}</p>
      </div>
      
      <button id="attack-btn" onclick="netrunner.emitDuelAction('${match.id}', 'attack')">
        Attack
      </button>
      <button id="surrender-btn" onclick="netrunner.emitDuelAction('${match.id}', 'surrender')">
        Surrender
      </button>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', html);
}

function updateDuelDisplay(round) {
  const p1HpPercent = (round.player1Hp / round.player1MaxHp) * 100;
  const p2HpPercent = (round.player2Hp / round.player2MaxHp) * 100;
  
  document.getElementById('p1-hp').style.width = p1HpPercent + '%';
  document.getElementById('p2-hp').style.width = p2HpPercent + '%';
  document.getElementById('p1-hp-text').textContent = 
    `${round.player1Hp} / ${round.player1MaxHp}`;
  document.getElementById('p2-hp-text').textContent = 
    `${round.player2Hp} / ${round.player2MaxHp}`;
  
  console.log(`Round ${round.roundNumber}: P1 dealt ${round.damageDealt}, P2 health: ${round.enemyHp}`);
}

function displayDuelResults(data) {
  alert(`
    Duel Complete!
    Winner: ${data.winner.username}
    Your ELO: ${data.eloChange > 0 ? '+' : ''}${data.eloChange}
    Currency: ${data.currencyWon > 0 ? '+' : ''}${data.currencyWon}
  `);
}
```

---

## Guild System Integration

### Browse and Join Guilds

```javascript
// Display guild list
async function displayGuildBrowser() {
  try {
    const guilds = await netrunner.getGuilds({ limit: 50 });
    const container = document.getElementById('guild-browser');
    
    container.innerHTML = guilds.map(guild => `
      <div class="guild-card">
        <h3>${guild.name} [${guild.tag}]</h3>
        <p>${guild.description}</p>
        <p>Members: ${guild.members.length} / ${guild.maxMembers}</p>
        <p>Level: ${guild.level}</p>
        <button onclick="joinGuild('${guild.id}')">Join</button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load guilds:', error);
  }
}

async function joinGuild(guildId) {
  try {
    const player = await netrunner.joinGuild(guildId);
    alert(`Joined guild! You are now a member.`);
    displayMyGuild(guildId);
  } catch (error) {
    alert('Failed to join: ' + error.message);
  }
}
```

### Display Guild Information

```javascript
async function displayMyGuild(guildId) {
  try {
    const guild = await netrunner.getGuild(guildId);
    const members = await netrunner.getGuildMembers(guildId);
    
    const html = `
      <div class="my-guild">
        <h3>${guild.name} [${guild.tag}]</h3>
        <p>${guild.description}</p>
        <p>Treasury: ${guild.treasury} E$</p>
        <p>Level: ${guild.level}</p>
        
        <h4>Members (${members.length})</h4>
        <ul>
          ${members.map(m => `
            <li>
              ${m.username} (${m.role})
              <br>XP: ${m.totalXP}, ELO: ${m.eloRating}
            </li>
          `).join('')}
        </ul>
        
        <button onclick="leaveGuild('${guildId}')">Leave Guild</button>
      </div>
    `;
    
    document.getElementById('my-guild').innerHTML = html;
  } catch (error) {
    console.error('Failed to load guild:', error);
  }
}

async function leaveGuild(guildId) {
  if (confirm('Are you sure you want to leave this guild?')) {
    try {
      await netrunner.leaveGuild(guildId);
      alert('You left the guild');
      document.getElementById('my-guild').innerHTML = '';
    } catch (error) {
      alert('Failed to leave: ' + error.message);
    }
  }
}
```

---

## Guild Wars Integration

### Display Current War and Contribute Damage

```javascript
// Show current guild war info
async function displayCurrentWar() {
  try {
    const event = await netrunner.getCurrentEvent();
    if (!event) {
      console.log('No active guild war');
      return;
    }
    
    const leaderboard = await netrunner.getEventLeaderboard(event.id);
    
    const html = `
      <div class="guild-war">
        <h3>Guild War: ${event.name}</h3>
        <p>Boss HP: ${event.bossHp} / ${event.bossMaxHp}</p>
        <div class="hp-bar" style="width: ${(event.bossHp / event.bossMaxHp) * 100}%"></div>
        
        <h4>Top Guilds</h4>
        <ol>
          ${leaderboard.slice(0, 5).map(entry => `
            <li>
              ${entry.guildName}: ${entry.damage} damage
            </li>
          `).join('')}
        </ol>
        
        <button onclick="contributeToWar()">Contribute Damage</button>
      </div>
    `;
    
    document.getElementById('guild-war').innerHTML = html;
  } catch (error) {
    console.error('Failed to load war:', error);
  }
}

async function contributeToWar() {
  const player = netrunner.state.player;
  if (!player || !player.guildId) {
    alert('You must be in a guild to contribute');
    return;
  }
  
  try {
    // Get player's current combat skill level for damage calculation
    const damage = 50 + (Math.random() * 50); // Example: 50-100 damage
    
    const result = await netrunner.contributeToWarDamage(player.guildId, damage);
    alert(`Dealt ${damage} damage! Total guild damage: ${result.totalDamage}`);
    
    // Refresh war display
    displayCurrentWar();
  } catch (error) {
    alert('Failed to contribute: ' + error.message);
  }
}

// Listen for real-time war updates
netrunner.on('war:damage_update', (data) => {
  console.log('War damage update:', data);
  // Update boss HP bar in real-time
  const percent = (data.bossHp / data.bossMaxHp) * 100;
  document.querySelector('.hp-bar').style.width = percent + '%';
});

netrunner.on('war:victory', (data) => {
  alert(`Guild ${data.winningGuild} defeated the boss! Rewards distributed.`);
  displayCurrentWar();
});
```

---

## Error Handling & Recovery

### Connection Management

```javascript
// Auto-reconnect on disconnect
netrunner.on('socket:disconnected', () => {
  console.log('WebSocket disconnected, attempting to reconnect...');
  setTimeout(() => {
    if (!netrunner.state.isConnected) {
      netrunner.connectWebSocket().catch(console.error);
    }
  }, 3000);
});

// Handle socket errors
netrunner.on('socket:error', (error) => {
  console.error('WebSocket error:', error);
  // Show error notification to user
  showNotification('Connection error: ' + error.message, 'error');
});

// Retry failed API calls
async function makeRequestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Usage:
const profile = await makeRequestWithRetry(() => netrunner.getProfile());
```

---

## Production Deployment

### Environment Variables

Create `.env` file in your game root:

```env
VITE_API_URL=https://api.netrunner.game
VITE_GITHUB_OAUTH_ID=your_github_app_id
VITE_GOOGLE_OAUTH_ID=your_google_app_id
```

### Initialize with Production Config

```javascript
const netrunner = new NetrunnerClient({
  apiUrl: import.meta.env.VITE_API_URL,
  gameId: 'netrunner-main',
  oauth: {
    githubId: import.meta.env.VITE_GITHUB_OAUTH_ID,
    googleId: import.meta.env.VITE_GOOGLE_OAUTH_ID,
  },
});
```

---

## Security Best Practices

1. **Never store passwords**: Always use OAuth or secure backends
2. **Validate all user input**: Check stakes, guild names, etc.
3. **Use HTTPS in production**: All API calls must be encrypted
4. **Expire tokens**: Implement token refresh every 24 hours
5. **Rate limit**: Implement client-side rate limiting for API calls
6. **CORS**: Only allow requests from your domain

---

## Troubleshooting

### WebSocket connection fails
```javascript
// Check if server is running
fetch('http://localhost:3000/api/players/leaderboard')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### OAuth redirect loop
- Ensure redirect URI matches exactly in OAuth app settings
- Check that `window.location.href` is setting correctly
- Verify client IDs are not hardcoded, use environment variables

### Synced progress not updating
- Ensure `syncGameProgress()` is called after game actions
- Check that player is authenticated before syncing
- Verify game data structure matches API expectations

---

## Next Steps

1. Integrate this SDK into your game
2. Test login/registration with test accounts
3. Create test duels between players
4. Set up test guild and guild war
5. Deploy to production server
6. Monitor for issues and optimize performance

For questions or issues, see the API documentation at `/backend/API.md`
