/**
 * NETRUNNER Multiplayer Client SDK
 * Phase 6: Frontend Integration Library
 * 
 * Complete JavaScript library for integrating NETRUNNER multiplayer features
 * into the browser-based idle game. Handles OAuth, WebSocket communication,
 * API requests, and game state synchronization.
 */

class NetrunnerClient {
  /**
   * Initialize the NETRUNNER multiplayer client
   * @param {Object} config - Configuration object
   * @param {string} config.apiUrl - Backend API URL (e.g., 'https://api.netrunner.game')
   * @param {string} config.gameId - Unique identifier for game instance
   * @param {Object} config.oauth - OAuth configuration
   * @param {string} config.oauth.githubId - GitHub OAuth app ID
   * @param {string} config.oauth.googleId - Google OAuth app ID
   * @param {Object} config.callbacks - Event callbacks
   */
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:3000/api',
      gameId: config.gameId || 'netrunner-main',
      oauth: config.oauth || {},
      callbacks: config.callbacks || {},
      ...config,
    };

    // State management
    this.state = {
      isAuthenticated: false,
      player: null,
      token: null,
      socket: null,
      isConnected: false,
      gameProgress: null,
    };

    // Event listeners
    this.listeners = new Map();

    // Rate limiting
    this.requestQueue = [];
    this.rateLimitMs = 100;

    // Initialize
    this._loadFromStorage();
  }

  // ===================
  // AUTHENTICATION
  // ===================

  /**
   * Register a new player account
   * @param {Object} credentials - Registration credentials
   * @returns {Promise<Object>} - Player and token
   */
  async register(credentials) {
    return this._request('POST', '/auth/register', {
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
      confirmPassword: credentials.confirmPassword,
    });
  }

  /**
   * Login with username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} - Player and token
   */
  async login(username, password) {
    const response = await this._request('POST', '/auth/login', {
      username,
      password,
    });

    if (response.token) {
      this.state.token = response.token;
      this.state.player = response.player;
      this.state.isAuthenticated = true;
      this._saveToStorage();
      this._emit('authenticated', response);
    }

    return response;
  }

  /**
   * Initiate OAuth login flow (GitHub or Google)
   * @param {string} provider - OAuth provider ('github' or 'google')
   * @returns {void}
   */
  initiateOAuthLogin(provider) {
    const clientId = this.config.oauth[`${provider}Id`];
    if (!clientId) {
      throw new Error(`OAuth ${provider} ID not configured`);
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = provider === 'github' 
      ? 'user:email' 
      : 'email profile';

    const authUrl = provider === 'github'
      ? `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
      : `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback
   * @param {string} code - Authorization code
   * @param {string} provider - Provider name
   * @returns {Promise<Object>} - Player and token
   */
  async handleOAuthCallback(code, provider) {
    const response = await this._request('POST', `/auth/${provider}/callback`, { code });

    if (response.token) {
      this.state.token = response.token;
      this.state.player = response.player;
      this.state.isAuthenticated = true;
      this._saveToStorage();
      this._emit('authenticated', response);
    }

    return response;
  }

  /**
   * Logout and clear authentication
   */
  logout() {
    this.state.isAuthenticated = false;
    this.state.token = null;
    this.state.player = null;
    this.disconnectWebSocket();
    localStorage.removeItem(`${this.config.gameId}_auth`);
    this._emit('logout');
  }

  // ===================
  // PLAYER & PROFILE
  // ===================

  /**
   * Get current player profile
   * @returns {Promise<Object>} - Player object
   */
  async getProfile() {
    return this._request('GET', `/players/${this.state.player?.id}`);
  }

  /**
   * Update player profile
   * @param {Object} updates - Profile fields to update
   * @returns {Promise<Object>} - Updated player
   */
  async updateProfile(updates) {
    return this._request('PATCH', `/players/${this.state.player?.id}`, updates);
  }

  /**
   * Get player leaderboard (ranked by XP)
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of entries (default: 100)
   * @param {number} options.offset - Pagination offset (default: 0)
   * @returns {Promise<Array>} - Leaderboard entries
   */
  async getLeaderboard(options = {}) {
    return this._request('GET', '/leaderboards/xp', {
      limit: options.limit || 100,
      offset: options.offset || 0,
    });
  }

  /**
   * Get ELO rating leaderboard
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - ELO leaderboard
   */
  async getELOLeaderboard(options = {}) {
    return this._request('GET', '/leaderboards/elo', {
      limit: options.limit || 100,
      offset: options.offset || 0,
    });
  }

  /**
   * Get achievements
   * @returns {Promise<Array>} - Player achievements
   */
  async getAchievements() {
    return this._request('GET', `/players/${this.state.player?.id}/achievements`);
  }

  // ===================
  // GUILDS
  // ===================

  /**
   * Get all guilds
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Guild list
   */
  async getGuilds(options = {}) {
    return this._request('GET', '/guilds', {
      limit: options.limit || 50,
      offset: options.offset || 0,
      sort: options.sort || 'members',
    });
  }

  /**
   * Get guild details
   * @param {string} guildId - Guild ID
   * @returns {Promise<Object>} - Guild object
   */
  async getGuild(guildId) {
    return this._request('GET', `/guilds/${guildId}`);
  }

  /**
   * Create a new guild
   * @param {Object} data - Guild creation data
   * @param {string} data.name - Guild name
   * @param {string} data.description - Guild description
   * @param {string} data.tag - Guild tag (2-4 characters)
   * @returns {Promise<Object>} - Created guild
   */
  async createGuild(data) {
    return this._request('POST', '/guilds', data);
  }

  /**
   * Join a guild
   * @param {string} guildId - Guild ID
   * @returns {Promise<Object>} - Updated player
   */
  async joinGuild(guildId) {
    return this._request('POST', `/guilds/${guildId}/join`);
  }

  /**
   * Leave guild
   * @param {string} guildId - Guild ID
   * @returns {Promise<Object>} - Updated player
   */
  async leaveGuild(guildId) {
    return this._request('POST', `/guilds/${guildId}/leave`);
  }

  /**
   * Invite player to guild
   * @param {string} guildId - Guild ID
   * @param {string} username - Player username
   * @returns {Promise<Object>} - Invitation result
   */
  async inviteToGuild(guildId, username) {
    return this._request('POST', `/guilds/${guildId}/invite`, { username });
  }

  /**
   * Get guild members
   * @param {string} guildId - Guild ID
   * @returns {Promise<Array>} - Guild members
   */
  async getGuildMembers(guildId) {
    return this._request('GET', `/guilds/${guildId}/members`);
  }

  /**
   * Contribute to guild war
   * @param {string} guildId - Guild ID
   * @param {number} damage - Damage to boss
   * @returns {Promise<Object>} - Contribution result
   */
  async contributeToWarDamage(guildId, damage) {
    return this._request('POST', `/events/current/damage`, {
      guildId,
      damage,
    });
  }

  // ===================
  // PvP DUELS
  // ===================

  /**
   * Get PvP stats for player
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} - PvP statistics
   */
  async getPvPStats(playerId) {
    return this._request('GET', `/pvp/stats/${playerId}`);
  }

  /**
   * Get PvP match history
   * @param {string} playerId - Player ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Match history
   */
  async getPvPHistory(playerId, options = {}) {
    return this._request('GET', `/pvp/history/${playerId}`, {
      limit: options.limit || 50,
      offset: options.offset || 0,
    });
  }

  /**
   * Get pending duel challenges
   * @returns {Promise<Array>} - Pending challenges
   */
  async getPendingChallenges() {
    return this._request('GET', `/pvp/pending`);
  }

  /**
   * Challenge another player to a duel
   * @param {string} opponentId - Opponent player ID
   * @param {Object} options - Duel options
   * @param {number} options.stakes - Currency stakes (1000-10000)
   * @returns {Promise<Object>} - Created match
   */
  async challengePlayer(opponentId, options = {}) {
    return this._request('POST', `/pvp/challenge`, {
      opponentId,
      stakes: options.stakes || 1000,
    });
  }

  /**
   * Accept pending duel challenge
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} - Match object
   */
  async acceptChallenge(matchId) {
    return this._request('POST', `/pvp/matches/${matchId}/accept`);
  }

  /**
   * Decline pending duel challenge
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} - Result
   */
  async declineChallenge(matchId) {
    return this._request('POST', `/pvp/matches/${matchId}/decline`);
  }

  // ===================
  // EVENTS & GUILD WARS
  // ===================

  /**
   * Get current event (guild war)
   * @returns {Promise<Object>} - Event object
   */
  async getCurrentEvent() {
    return this._request('GET', '/events/current');
  }

  /**
   * Get all events with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Events list
   */
  async getEvents(options = {}) {
    return this._request('GET', '/events', {
      limit: options.limit || 50,
      offset: options.offset || 0,
    });
  }

  /**
   * Get event leaderboard
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} - Leaderboard
   */
  async getEventLeaderboard(eventId) {
    return this._request('GET', `/events/${eventId}/leaderboard`);
  }

  /**
   * Join an event (guild war)
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} - Result
   */
  async joinEvent(eventId) {
    return this._request('POST', `/events/${eventId}/join`);
  }

  // ===================
  // GAME PROGRESS SYNC
  // ===================

  /**
   * Sync single-player game progress to multiplayer server
   * This allows your game progress to contribute to leaderboards and guilds
   * @param {Object} gameData - Game progress data from single-player
   * @param {number} gameData.totalXP - Total XP earned
   * @param {Object} gameData.skills - Skill levels map
   * @param {number} gameData.currency - Current currency
   * @param {Array} gameData.inventory - Inventory items
   * @returns {Promise<Object>} - Sync result
   */
  async syncGameProgress(gameData) {
    return this._request('POST', `/players/${this.state.player?.id}/sync-progress`, {
      totalXP: gameData.totalXP || 0,
      skills: gameData.skills || {},
      currency: gameData.currency || 0,
      inventory: gameData.inventory || [],
      equipment: gameData.equipment || {},
      prestige: gameData.prestige || 0,
      timestamp: Date.now(),
    });
  }

  /**
   * Get synced game progress from server
   * @returns {Promise<Object>} - Game progress data
   */
  async getGameProgress() {
    return this._request('GET', `/players/${this.state.player?.id}/progress`);
  }

  // ===================
  // WEBSOCKET
  // ===================

  /**
   * Connect to WebSocket for real-time updates
   * @returns {Promise<void>}
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        // Dynamically load Socket.io client
        const socketUrl = this.config.apiUrl.replace('/api', '');
        
        // Create script tag to load Socket.io
        if (!window.io) {
          const script = document.createElement('script');
          script.src = `${socketUrl}/socket.io/socket.io.js`;
          script.onload = () => this._initializeSocket(socketUrl, resolve, reject);
          script.onerror = () => reject(new Error('Failed to load Socket.io client'));
          document.head.appendChild(script);
        } else {
          this._initializeSocket(socketUrl, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize Socket.io connection (internal)
   * @private
   */
  _initializeSocket(socketUrl, resolve, reject) {
    try {
      this.state.socket = window.io(socketUrl, {
        auth: {
          token: this.state.token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Connection events
      this.state.socket.on('connect', () => {
        this.state.isConnected = true;
        this._emit('socket:connected');
        resolve();
      });

      this.state.socket.on('disconnect', () => {
        this.state.isConnected = false;
        this._emit('socket:disconnected');
      });

      this.state.socket.on('error', (error) => {
        this._emit('socket:error', error);
      });

      // Duel events
      this.state.socket.on('duel:started', (data) => this._emit('duel:started', data));
      this.state.socket.on('duel:round', (data) => this._emit('duel:round', data));
      this.state.socket.on('duel:completed', (data) => {
        this._emit('duel:completed', data);
        // Update local player stats
        if (this.state.player) {
          this.state.player.eloRating = data.eloChange;
          this.state.player.currency = data.newBalance;
        }
      });

      // Guild war events
      this.state.socket.on('war:damage_update', (data) => this._emit('war:damage_update', data));
      this.state.socket.on('war:victory', (data) => this._emit('war:victory', data));

      // Presence updates
      this.state.socket.on('presence:updated', (data) => this._emit('presence:updated', data));
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Emit a real-time duel action
   * @param {string} matchId - Match ID
   * @param {string} action - Action type ('attack', 'surrender')
   * @param {Object} data - Action data
   */
  emitDuelAction(matchId, action, data = {}) {
    if (!this.state.socket || !this.state.isConnected) {
      console.warn('WebSocket not connected');
      return;
    }

    this.state.socket.emit('duel:action', {
      matchId,
      action,
      ...data,
    });
  }

  /**
   * Emit guild war damage
   * @param {string} eventId - Event ID
   * @param {number} damage - Damage dealt
   */
  emitWarDamage(eventId, damage) {
    if (!this.state.socket || !this.state.isConnected) {
      console.warn('WebSocket not connected');
      return;
    }

    this.state.socket.emit('war:damage', {
      eventId,
      damage,
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    if (this.state.socket) {
      this.state.socket.disconnect();
      this.state.socket = null;
      this.state.isConnected = false;
    }
  }

  // ===================
  // EVENT LISTENERS
  // ===================

  /**
   * Listen for client events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit client event (internal)
   * @private
   */
  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }

    // Also call config callbacks if provided
    if (this.config.callbacks[event]) {
      try {
        this.config.callbacks[event](data);
      } catch (error) {
        console.error(`Error in ${event} callback:`, error);
      }
    }
  }

  // ===================
  // PRIVATE HELPERS
  // ===================

  /**
   * Make HTTP request to API (internal)
   * @private
   */
  async _request(method, endpoint, data = null) {
    const url = `${this.config.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add auth token if available
    if (this.state.token) {
      options.headers['Authorization'] = `Bearer ${this.state.token}`;
    }

    // Add body for POST/PATCH/PUT
    if (method !== 'GET' && method !== 'DELETE' && data) {
      options.body = JSON.stringify(data);
    } else if ((method === 'GET' || method === 'DELETE') && data) {
      // Add query parameters
      const params = new URLSearchParams(data);
      return this._request(method, `${endpoint}?${params.toString()}`, null);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Save auth state to localStorage (internal)
   * @private
   */
  _saveToStorage() {
    localStorage.setItem(
      `${this.config.gameId}_auth`,
      JSON.stringify({
        token: this.state.token,
        player: this.state.player,
      })
    );
  }

  /**
   * Load auth state from localStorage (internal)
   * @private
   */
  _loadFromStorage() {
    const stored = localStorage.getItem(`${this.config.gameId}_auth`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.state.token = data.token;
        this.state.player = data.player;
        this.state.isAuthenticated = !!data.token;
      } catch (error) {
        console.error('Failed to load auth state from storage:', error);
      }
    }
  }

  /**
   * Get current authentication state
   * @returns {Object} - Auth state
   */
  getAuthState() {
    return {
      isAuthenticated: this.state.isAuthenticated,
      player: this.state.player,
      isConnected: this.state.isConnected,
    };
  }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetrunnerClient;
} else if (typeof window !== 'undefined') {
  window.NetrunnerClient = NetrunnerClient;
}
