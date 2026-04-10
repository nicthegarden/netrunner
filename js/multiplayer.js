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
    // Show modal for challenge with wager input
    const playerName = prompt('Enter opponent username:');
    if (!playerName) return;

    const wagerAmount = prompt('Enter wager amount (E$):', '1000');
    if (!wagerAmount || isNaN(wagerAmount)) {
      this.showNotification('✗ Invalid wager amount');
      return;
    }

    try {
      const result = await this.client.pvp.challengePlayer(playerName, parseInt(wagerAmount));
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

      // Get leaderboard
      const leaderboard = await this.client.leaderboards.getELO();
      this.renderLeaderboard(leaderboard, 'pvp-opponents');
      
      // Render recent duel history
      if (stats.recentDuels) {
        this.renderDuelHistory(stats.recentDuels);
      }
    } catch (error) {
      console.error('Error refreshing PvP UI:', error);
      const statsDiv = document.getElementById('pvp-stats');
      if (statsDiv) {
        statsDiv.innerHTML = '<p style="color:#ff0000;">Error loading stats. Make sure you\'re logged in.</p>';
      }
    }
  }

  async refreshGuildUI() {
    try {
      const guilds = await this.client.guilds.list();
      this.renderGuildsList(guilds);
      this.displayMyGuild();
    } catch (error) {
      console.error('Error refreshing guild UI:', error);
    }
  }

  async refreshEventUI() {
    try {
      const events = await this.client.events.list();
      this.renderEventsList(events);
      this.renderGuildWars();
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
      const myGuild = await this.client.guilds.getMyGuild(playerUsername);
      
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
      console.error('Error loading my guild:', error);
      container.innerHTML = '<p class="empty-state">Error loading guild info</p>';
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
      const guildWars = await this.client.events.listGuildWars();
      
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
      console.error('Error loading guild wars:', error);
      container.innerHTML = '<p class="empty-state">Error loading guild wars</p>';
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

window.leaveGuild = async (guildId) => {
  const confirm = prompt('Are you sure you want to leave the guild? Type "YES" to confirm:');
  if (confirm !== 'YES') {
    window.multiplayerManager.showNotification('Guild leave cancelled');
    return;
  }

  try {
    await window.gameClient.guilds.leave(guildId);
    window.multiplayerManager.showNotification('✓ Left guild!');
    window.multiplayerManager.refreshGuildUI();
    window.multiplayerManager.displayMyGuild();
  } catch (error) {
    window.multiplayerManager.showNotification(`✗ Error: ${error.message}`);
  }
};
