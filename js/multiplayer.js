/**
 * Multiplayer Module - Handles all multiplayer UI and interactions
 * Phase 3 Optimizations: Caching, WebSocket resilience, error boundaries
 */

/**
 * Cache layer with TTL support
 */
class Cache {
  constructor(ttlMs = 5 * 60 * 1000) {
    this.data = new Map();
    this.timestamps = new Map();
    this.ttl = ttlMs;
  }

  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;
    
    const age = Date.now() - timestamp;
    if (age > this.ttl) {
      this.data.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    return this.data.get(key);
  }

  isStale(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return true;
    return (Date.now() - timestamp) > this.ttl;
  }

  clear() {
    this.data.clear();
    this.timestamps.clear();
  }
}

export class MultiplayerManager {
  constructor(gameClient, gameInstance) {
    this.client = gameClient;
    this.game = gameInstance;
    this.cache = new Cache(5 * 60 * 1000); // 5-minute TTL
    this.wsReconnectAttempts = 0;
    this.wsReconnectMaxAttempts = 5;
    this.wsReconnectDelay = 1000; // 1 second base delay
    this.init();
  }

  init() {
    console.log('✓ Multiplayer module initialized with caching (5min TTL)');
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

    // Duel events
    this.client.on('duel:started', (match) => {
      this.showNotification(`🔥 Duel started vs ${match.opponent}!`);
      this.cache.clear(); // Invalidate cache on game event
      this.refreshPvPUI();
    });

    this.client.on('duel:finished', (match) => {
      const playerUsername = this.game?.player?.username || 'Player';
      const result = match.winner === playerUsername ? '🎉 WON' : '😢 LOST';
      this.showNotification(`${result} against ${match.opponent}`);
      this.cache.clear();
      this.refreshPvPUI();
    });

    // Guild events
    this.client.on('guild:joined', (guild) => {
      this.showNotification(`🏰 Joined guild: ${guild.name}`);
      this.cache.clear();
      this.refreshGuildUI();
    });

    this.client.on('guild:left', (guildId) => {
      this.showNotification(`👋 You left the guild`);
      this.cache.clear();
      this.refreshGuildUI();
    });

    // Event events
    this.client.on('event:started', (event) => {
      this.showNotification(`📅 Event started: ${event.name}`);
      this.cache.clear();
      this.refreshEventUI();
    });

    // WebSocket connection events (with reconnection)
    this.client.on('connect', () => {
      console.log('✓ WebSocket connected');
      this.wsReconnectAttempts = 0;
      this.showNotification('🟢 Connected to server');
    });

    this.client.on('disconnect', () => {
      console.warn('✗ WebSocket disconnected, attempting reconnect...');
      this.attemptReconnect();
    });

    this.client.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.showNotification(`⚠️ Connection error: ${error.message || 'Unknown'}`);
      this.attemptReconnect();
    });
  }

  /**
   * Exponential backoff reconnection logic
   */
  attemptReconnect() {
    if (this.wsReconnectAttempts >= this.wsReconnectMaxAttempts) {
      console.error('Max reconnection attempts reached');
      this.showNotification('❌ Server connection lost. Please refresh the page.');
      return;
    }

    const delay = this.wsReconnectDelay * Math.pow(2, this.wsReconnectAttempts);
    this.wsReconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts}/${this.wsReconnectMaxAttempts})`);
    this.showNotification(`🔄 Reconnecting... (${this.wsReconnectAttempts}/${this.wsReconnectMaxAttempts})`);

    setTimeout(() => {
      if (this.client?.reconnect) {
        this.client.reconnect();
      }
    }, delay);
  }

  async challengePlayer(playerId) {
    // Show modal for challenge with wager input
    const playerName = prompt('Enter opponent username:');
    if (!playerName) return;

    const wagerAmount = prompt('Enter wager amount (E$):', '1000');
    if (!wagerAmount || isNaN(wagerAmount)) {
      this.showNotification('✗ Invalid wager amount');
      return;
    }

    try {
      const result = await this.client.challengePlayer(playerName, { wager: parseInt(wagerAmount) });
      this.showNotification(`✓ Challenge sent to ${result.opponent}! Wager: E$ ${wagerAmount}`);
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
      const guild = await this.client.createGuild({ name, tag });
      this.showNotification(`✓ Guild created: ${guild.name}`);
      this.refreshGuildUI();
    } catch (error) {
      this.showNotification(`✗ Error: ${error.message}`);
    }
  }

  async refreshPvPUI() {
    const pvpContainer = document.getElementById('pvp-container');
    if (!pvpContainer || pvpContainer.style.display === 'none') {
      return; // UI not visible - skip expensive refresh
    }

    try {
      const playerUsername = this.game?.player?.username || 'Player';
      
      // Check cache first
      const cacheKey = `pvp_stats_${playerUsername}`;
      let stats = this.cache.get(cacheKey);
      
      if (!stats) {
        // Cache miss - fetch from API
        stats = await this.client.getPvPStats(playerUsername);
        this.cache.set(cacheKey, stats);
        console.log('PvP stats fetched from API');
      } else {
        console.log('PvP stats retrieved from cache');
      }

      // Render stats
      const statsDiv = document.getElementById('pvp-stats');
      if (statsDiv) {
        const totalMatches = (stats.duelsWon || 0) + (stats.duelsLost || 0);
        const winRate = totalMatches > 0 ? ((stats.duelsWon / totalMatches) * 100).toFixed(1) : '0.0';
        
        statsDiv.innerHTML = `
          <p><strong>ELO Rating:</strong> <span>${stats.elo || 0}</span></p>
          <p><strong>Rank:</strong> <span>${stats.rank || 'Unranked'}</span></p>
          <p><strong>Wins:</strong> <span>${stats.duelsWon || 0}</span></p>
          <p><strong>Losses:</strong> <span>${stats.duelsLost || 0}</span></p>
          <p><strong>Total Matches:</strong> <span>${totalMatches}</span></p>
          <p><strong>Win Rate:</strong> <span>${winRate}%</span></p>
        `;
      }

      // Get leaderboard (cached)
      const leaderboardCacheKey = 'pvp_leaderboard';
      let leaderboard = this.cache.get(leaderboardCacheKey);
      
      if (!leaderboard) {
        leaderboard = await this.client.getELOLeaderboard();
        this.cache.set(leaderboardCacheKey, leaderboard);
        console.log('Leaderboard fetched from API');
      } else {
        console.log('Leaderboard retrieved from cache');
      }

      this.renderLeaderboard(leaderboard, 'pvp-opponents');
      
      // Render recent duel history
      if (stats.recentDuels) {
        this.renderDuelHistory(stats.recentDuels);
      }
    } catch (error) {
      this.handleError('Error refreshing PvP UI', error, 'pvp-stats');
    }
  }

  async refreshGuildUI() {
    const guildContainer = document.getElementById('guild-container');
    if (!guildContainer || guildContainer.style.display === 'none') {
      return; // UI not visible - skip expensive refresh
    }

    try {
      // Check cache first
      const guildsCacheKey = 'guilds_list';
      let guilds = this.cache.get(guildsCacheKey);
      
      if (!guilds) {
        guilds = await this.client.getGuilds();
        this.cache.set(guildsCacheKey, guilds);
        console.log('Guilds fetched from API');
      } else {
        console.log('Guilds retrieved from cache');
      }

      this.renderGuildsList(guilds);
      this.displayMyGuild();
    } catch (error) {
      this.handleError('Error refreshing guild UI', error, 'available-guilds');
    }
  }

  async refreshEventUI() {
    const eventContainer = document.getElementById('event-container');
    if (!eventContainer || eventContainer.style.display === 'none') {
      return; // UI not visible - skip expensive refresh
    }

    try {
      // Check cache first
      const eventsCacheKey = 'events_list';
      let events = this.cache.get(eventsCacheKey);
      
      if (!events) {
        events = await this.client.getEvents();
        this.cache.set(eventsCacheKey, events);
        console.log('Events fetched from API');
      } else {
        console.log('Events retrieved from cache');
      }

      this.renderEventsList(events);
      this.renderGuildWars();
    } catch (error) {
      this.handleError('Error refreshing events UI', error, 'active-events');
    }
  }

  /**
   * Centralized error handling with graceful degradation
   */
  handleError(title, error, containerId) {
    console.error(title, error);
    this.showNotification(`⚠️ ${title}`);
    
    // Show error state in UI
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `<p style="color:#ff4444; padding: 15px;">
          ${title}: ${error?.message || 'Unknown error'}. 
          <br/><small>Data may be outdated or unavailable.</small>
        </p>`;
      }
    }
  }

  renderLeaderboard(leaderboard, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !leaderboard || !Array.isArray(leaderboard)) return;

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

  renderDuelHistory(duels) {
    const container = document.getElementById('pvp-history');
    if (!container || !Array.isArray(duels)) return;

    if (duels.length === 0) {
      container.innerHTML = '<p class="empty-state">No recent duels</p>';
      return;
    }

    container.innerHTML = duels
      .slice(0, 5)
      .map((duel) => {
        const isWin = duel.winner === this.game?.player?.username;
        const statusColor = isWin ? '#00ff41' : '#ff0000';
        const statusText = isWin ? '✓ WIN' : '✗ LOSS';
        
        return `<div class="duel-history-entry" style="border-left: 3px solid ${statusColor}; padding: 10px 15px; margin-bottom: 8px; background: rgba(0, 255, 65, 0.03);">
          <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
          <span style="color: #aaa; margin: 0 10px;">vs ${duel.opponent}</span>
          <span style="color: #ffff00;">+${duel.eloChange || 0} ELO</span>
        </div>`;
      })
      .join('');
  }

  renderGuildsList(guilds) {
    const container = document.getElementById('available-guilds');
    if (!container || !Array.isArray(guilds)) return;

    if (guilds.length === 0) {
      container.innerHTML = '<p class="empty-state">No guilds available. Be the first to create one!</p>';
      return;
    }

    container.innerHTML = guilds
      .map(
        (guild) => `
      <div class="guild-card">
        <h4>${guild.name} [${guild.tag}]</h4>
        <p><strong>Leader:</strong> ${guild.leader || 'Unknown'}</p>
        <p><strong>Members:</strong> ${guild.members || 0}/${guild.maxMembers || 50}</p>
        <p><strong>Level:</strong> ${guild.level || 1}</p>
        <p style="color: #aaa; font-size: 12px; margin-top: 10px;">${guild.description || 'No description'}</p>
        <button class="btn-primary" data-guild-id="${guild.id}" onclick="window.joinGuild('${guild.id}')">
          Join Guild
        </button>
      </div>`
      )
      .join('');
  }

  async displayMyGuild() {
    const container = document.getElementById('my-guild');
    if (!container) return;

    try {
      const playerUsername = this.game?.player?.username || 'Player';
      
      // Check cache first
      const myGuildCacheKey = `my_guild_${playerUsername}`;
      let myGuild = this.cache.get(myGuildCacheKey);
      
      if (!myGuild) {
        // Fetch user's guilds by getting all guilds
        const allGuilds = await this.client.getGuilds();
        myGuild = allGuilds && allGuilds.length > 0 ? allGuilds[0] : null;
        this.cache.set(myGuildCacheKey, myGuild);
        console.log('My guild fetched from API');
      } else {
        console.log('My guild retrieved from cache');
      }
      
      if (!myGuild) {
        container.innerHTML = '<p class="empty-state">You are not in a guild. Create or join one!</p>';
        return;
      }

      container.innerHTML = `
        <h5>🏰 ${myGuild.name} [${myGuild.tag}]</h5>
        <p><strong>Leader:</strong> ${myGuild.leader}</p>
        <p><strong>Members:</strong> ${myGuild.members}/${myGuild.maxMembers}</p>
        <p><strong>Level:</strong> ${myGuild.level}</p>
        <p><strong>Created:</strong> ${new Date(myGuild.createdAt).toLocaleDateString()}</p>
        <button class="btn-primary" onclick="window.leaveGuild('${myGuild.id}')" style="margin-top: 10px;">
          Leave Guild
        </button>
      `;
    } catch (error) {
      this.handleError('Error loading my guild', error, 'my-guild');
    }
  }

  renderEventsList(events) {
    const container = document.getElementById('active-events');
    if (!container || !Array.isArray(events)) return;

    if (events.length === 0) {
      container.innerHTML = '<p class="empty-state">No active events at this time</p>';
      return;
    }

    container.innerHTML = events
      .map(
        (event) => {
          const statusColor = event.status === 'active' ? '#00ff41' : (event.status === 'pending' ? '#ffff00' : '#ff0000');
          return `
      <div class="event-card" style="border-left: 4px solid ${statusColor};">
        <h4>${event.name}</h4>
        <p><strong>Type:</strong> ${event.type || 'Unknown'}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor};">${event.status || 'Unknown'}</span></p>
        <p><strong>Start Time:</strong> ${new Date(event.startTime).toLocaleString()}</p>
        <p><strong>Duration:</strong> ${event.duration || 'Unknown'} minutes</p>
        <p style="color: #aaa; font-size: 12px;">${event.description || 'No description'}</p>
        <button class="btn-primary" onclick="window.joinEvent('${event.id}')" ${event.status !== 'active' ? 'disabled' : ''}>
          Join Event
        </button>
      </div>`
        }
      )
      .join('');
  }

  async renderGuildWars() {
    const container = document.getElementById('guild-wars');
    if (!container) return;

    try {
      // Check cache first
      const guildWarsCacheKey = 'guild_wars_list';
      let guildWars = this.cache.get(guildWarsCacheKey);
      
      if (!guildWars) {
        guildWars = await this.client.getEvents();
        this.cache.set(guildWarsCacheKey, guildWars);
        console.log('Guild wars fetched from API');
      } else {
        console.log('Guild wars retrieved from cache');
      }
      
      if (!Array.isArray(guildWars) || guildWars.length === 0) {
        container.innerHTML = '<p class="empty-state">No active guild wars</p>';
        return;
      }

      container.innerHTML = guildWars
        .map(
          (war) => `
        <div class="event-card" style="border-left: 4px solid #ff1744;">
          <h4>⚔️ ${war.guild1} vs ${war.guild2}</h4>
          <p><strong>Status:</strong> <span style="color: #ff1744;">ACTIVE</span></p>
          <p><strong>${war.guild1}:</strong> ${war.guild1Score || 0} points</p>
          <p><strong>${war.guild2}:</strong> ${war.guild2Score || 0} points</p>
          <p><strong>Ends:</strong> ${new Date(war.endTime).toLocaleString()}</p>
        </div>`
        )
        .join('');
    } catch (error) {
      this.handleError('Error loading guild wars', error, 'guild-wars');
    }
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

// Global functions for onclick handlers (with cache invalidation)

window.joinGuild = async (guildId) => {
  try {
    await window.gameClient.guilds.join(guildId);
    window.multiplayerManager.cache.clear(); // Invalidate cache
    window.multiplayerManager.showNotification('✓ Joined guild!');
    window.multiplayerManager.refreshGuildUI();
  } catch (error) {
    window.multiplayerManager.showNotification(`✗ Error: ${error.message}`);
  }
};

window.joinEvent = async (eventId) => {
  try {
    await window.gameClient.events.join(eventId);
    window.multiplayerManager.cache.clear(); // Invalidate cache
    window.multiplayerManager.showNotification('✓ Joined event!');
    window.multiplayerManager.refreshEventUI();
  } catch (error) {
    window.multiplayerManager.showNotification(`✗ Error: ${error.message}`);
  }
};

window.leaveGuild = async (guildId) => {
  const confirm = prompt('Are you sure you want to leave the guild? Type "YES" to confirm:');
  if (confirm !== 'YES') {
    window.multiplayerManager.showNotification('Guild leave cancelled');
    return;
  }

  try {
    await window.gameClient.guilds.leave(guildId);
    window.multiplayerManager.cache.clear(); // Invalidate cache
    window.multiplayerManager.showNotification('✓ Left guild!');
    window.multiplayerManager.refreshGuildUI();
    window.multiplayerManager.displayMyGuild();
  } catch (error) {
    window.multiplayerManager.showNotification(`✗ Error: ${error.message}`);
  }
};
