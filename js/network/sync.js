/**
 * SyncManager - Client-side multiplayer sync
 * 
 * Manages:
 * - Token storage and validation
 * - Offline change tracking (sync log)
 * - Auto-sync every 60 seconds
 * - Error handling and retry logic
 */

export class SyncManager {
  constructor(game) {
    this.game = game;
    this.serverUrl = 'http://localhost:3000'; // Will be configurable
    this.token = null;
    this.playerId = null;
    this.username = null;
    this.syncLog = []; // Track changes made offline
    this.lastSyncTime = null;
    this.isSyncing = false;
    this.syncInterval = null;
    this.enabledMultiplayer = false;

    // Load token from localStorage
    this._loadToken();
  }

  /**
   * Initialize multiplayer - register or login
   */
  async init(username) {
    try {
      // Try to register (if already exists, will fail with 409)
      const response = await fetch(`${this.serverUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (response.status === 409) {
        // Username exists - we're doing a "login"
        // For now, just require the user to provide the token they saved
        console.warn('Username already exists. If this is your account, provide your saved token.');
        return false;
      }

      if (response.ok) {
        // Registration successful
        this.token = data.token;
        this.playerId = data.player_id;
        this.username = data.username;
        this._saveToken();
        this.enabledMultiplayer = true;
        
        // Start auto-sync
        this._startAutoSync();
        
        console.log(`✓ Multiplayer enabled! Username: ${this.username}`);
        return true;
      }

      throw new Error(data.error || 'Registration failed');
    } catch (err) {
      console.error('Multiplayer init failed:', err);
      return false;
    }
  }

  /**
   * Login with existing token
   */
  async loginWithToken(token) {
    try {
      const response = await fetch(`${this.serverUrl}/api/players/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      const data = await response.json();
      this.token = token;
      this.playerId = data.player_id;
      this.username = data.username;
      this._saveToken();
      this.enabledMultiplayer = true;

      // Start auto-sync
      this._startAutoSync();

      console.log(`✓ Logged in as ${this.username}`);
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  }

  /**
   * Record an action in the sync log (for offline tracking)
   */
  recordAction(action, skillId = null, amount = 0, details = null) {
    if (!this.enabledMultiplayer) return;

    this.syncLog.push({
      action,
      skill_id: skillId,
      amount,
      details: details || {},
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Perform sync with server
   */
  async sync() {
    if (!this.enabledMultiplayer || !this.token) {
      return null;
    }

    if (this.isSyncing) {
      console.debug('Sync already in progress...');
      return null;
    }

    this.isSyncing = true;

    try {
      // Gather current player state from game
      const playerState = this._buildPlayerState();

      const response = await fetch(`${this.serverUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player_state: playerState,
          sync_log: this.syncLog,
          last_sync: this.lastSyncTime,
          client_checksum: this._calculateChecksum(playerState)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      // Clear sync log after successful sync
      this.syncLog = [];
      this.lastSyncTime = new Date(data.server_timestamp);

      console.log(`✓ Synced! Rank: #${data.updates.leaderboard_position}/${data.updates.total_players}`);
      
      // Emit event so UI can update
      this.game.eventBus?.emit('MULTIPLAYER_SYNCED', data);

      return data;
    } catch (err) {
      console.error('Sync failed:', err);
      // Sync log persists - we'll retry next time
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Build current player state from game
   */
  _buildPlayerState() {
    // Gather state from game instance
    const skillManager = this.game.skillManager;
    const inventory = this.game.inventory;
    const equipment = this.game.equipment;
    const economy = this.game.economy;
    const prestige = this.game.prestige;
    const player = this.game.player;

    // Calculate total XP and average level across all skills
    let totalXp = 0;
    let totalLevel = 0;
    const skillsState = {};

    if (skillManager) {
      const skills = skillManager.skills || {};
      for (const [skillId, skill] of Object.entries(skills)) {
        skillsState[skillId] = {
          level: skill.level || 1,
          xp: skill.xp || 0
        };
        totalXp += skill.xp || 0;
        totalLevel += skill.level || 1;
      }
    }

    const avgLevel = Object.keys(skillsState).length > 0
      ? Math.round(totalLevel / Object.keys(skillsState).length)
      : 1;

    return {
      skills: skillsState,
      inventory: inventory?.items || [],
      equipment: equipment?.serialize?.() || {},
      currency: economy?.eurodollars || 0,
      prestige_level: prestige?.level || 0,
      playtime_seconds: player?.playtime || 0,
      total_xp: totalXp,
      avg_level: avgLevel
    };
  }

  /**
   * Calculate checksum of player state (for validation)
   */
  _calculateChecksum(playerState) {
    // Simple hash for integrity check
    const json = JSON.stringify(playerState);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Start automatic syncing every 60 seconds
   */
  _startAutoSync() {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 60 seconds
    this.syncInterval = setInterval(() => {
      this.sync();
    }, 60000);

    console.debug('Auto-sync enabled (every 60 seconds)');
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Force sync before page unload
   */
  syncBeforeUnload() {
    // Use sendBeacon for unload (doesn't block navigation)
    if (!this.enabledMultiplayer || !this.token || this.syncLog.length === 0) {
      return;
    }

    const playerState = this._buildPlayerState();
    const payload = JSON.stringify({
      player_state: playerState,
      sync_log: this.syncLog,
      last_sync: this.lastSyncTime
    });

    navigator.sendBeacon(`${this.serverUrl}/api/sync`, payload);
  }

  /**
   * Save token to localStorage
   */
  _saveToken() {
    if (this.token) {
      localStorage.setItem('netrunner_multiplayer_token', this.token);
    }
  }

  /**
   * Load token from localStorage
   */
  _loadToken() {
    this.token = localStorage.getItem('netrunner_multiplayer_token');
    if (this.token) {
      console.log('Multiplayer token found in localStorage');
    }
  }

  /**
   * Clear token (logout)
   */
  logout() {
    this.token = null;
    this.playerId = null;
    this.username = null;
    this.enabledMultiplayer = false;
    this.syncLog = [];
    localStorage.removeItem('netrunner_multiplayer_token');
    this.stopAutoSync();
    console.log('Multiplayer disabled');
  }

  /**
   * Get player status (for UI)
   */
  getStatus() {
    return {
      enabled: this.enabledMultiplayer,
      username: this.username,
      playerId: this.playerId,
      isSyncing: this.isSyncing,
      unsyncedChanges: this.syncLog.length,
      lastSync: this.lastSyncTime
    };
  }
}

export default SyncManager;
