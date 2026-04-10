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
      const playerUsername = this.game?.player?.username || 'Player';
      const result = match.winner === playerUsername ? '🎉 WON' : '😢 LOST';
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
    const pvpContainer = document.getElementById('pvp-container');
    if (!pvpContainer || pvpContainer.style.display === 'none') {
      return; // UI not visible
    }

    try {
      const playerUsername = this.game?.player?.username || 'Player';
      
      // Get player stats
      const stats = await this.client.pvp.getStats(playerUsername);
      const statsDiv = document.getElementById('pvp-stats');
      if (statsDiv) {
        statsDiv.innerHTML = `
          <p>ELO Rating: ${stats.elo || 0}</p>
          <p>Wins: ${stats.duelsWon || 0}</p>
          <p>Losses: ${stats.duelsLost || 0}</p>
          <p>Win Rate: ${stats.winRate || '0%'}</p>
        `;
      }

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

  renderGuildsList(guilds) {
    const container = document.getElementById('available-guilds');
    if (!container || !Array.isArray(guilds)) return;

    container.innerHTML = guilds
      .map(
        (guild) =>
          `<div class="guild-card">
        <h4>${guild.name} (${guild.tag})</h4>
        <p>Members: ${guild.members}</p>
        <button class="btn-primary" data-guild-id="${guild.id}" onclick="window.joinGuild('${guild.id}')">
          Join Guild
        </button>
      </div>`
      )
      .join('');
  }

  renderEventsList(events) {
    const container = document.getElementById('active-events');
    if (!container || !Array.isArray(events)) return;

    container.innerHTML = events
      .map(
        (event) =>
          `<div class="event-card">
        <h4>${event.name}</h4>
        <p>Status: ${event.status}</p>
        <button class="btn-primary" onclick="window.joinEvent('${event.id}')">
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
