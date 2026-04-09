# NETRUNNER Multiplayer Expansion — Comprehensive Plan

**Document Version:** 1.0  
**Prepared:** April 2026  
**Status:** Planning Phase (Implementation Ready)

---

## 1. EXECUTIVE SUMMARY

Transform NETRUNNER from a single-player idle game into a competitive multiplayer experience with:
- **User registration & authentication** (OAuth/Social Login)
- **Leaderboards** (Overall power, per-skill rankings, seasonal)
- **PvP duels** with currency stakes
- **Player-managed guilds** with cooperation
- **Bot players** as active guild members to keep the game entertaining
- **Scheduled events** (weekends + daily mini-events)
- **Unified progress** between single-player and multiplayer modes

### Key Decisions Made
- **Architecture:** Node.js + Express backend + MongoDB database
- **Real-time Updates:** WebSockets (Socket.io)
- **User Scale:** 100-500 concurrent players (community-focused)
- **PvP Model:** Simple duels with currency at stake
- **Bot Participation:** Active guild members + event participation
- **Data Model:** Unified character (single-player & multiplayer combined)

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Technology Stack

```
Frontend (Existing)
├─ NETRUNNER Web Client (vanilla JS + HTML/CSS)
│  └─ New: Multiplayer UI module
│  └─ New: Socket.io client library
│  └─ New: Auth/login modal
│
Backend (New)
├─ Node.js Express Server (Port 3000+)
│  ├─ User authentication (OAuth integration)
│  ├─ REST API endpoints
│  ├─ WebSocket server (Socket.io)
│  └─ Bot AI scheduler
│
Database
├─ MongoDB (local or cloud: MongoDB Atlas)
│  ├─ Players collection
│  ├─ Guilds collection
│  ├─ Leaderboards collection
│  ├─ PvP history collection
│  ├─ Events collection
│  └─ Bot profiles collection
```

### 2.2 Backend Directory Structure

```
/backend/
├─ server.js                    # Express + Socket.io entry point
├─ package.json                # Node dependencies
├─ .env                        # Environment config (secrets)
│
├─ /config/
│  ├─ database.js             # MongoDB connection
│  ├─ oauth.js                # OAuth strategy configs
│  └─ constants.js            # Game constants, bot schedules
│
├─ /middleware/
│  ├─ auth.js                 # JWT/OAuth verification
│  ├─ validation.js           # Input validation
│  └─ errorHandler.js         # Error handling
│
├─ /models/
│  ├─ User.js                 # MongoDB player schema
│  ├─ Guild.js                # Guild data structure
│  ├─ BotProfile.js           # Bot character profiles
│  ├─ Leaderboard.js          # Leaderboard entries
│  └─ PvPMatch.js             # PvP duel history
│
├─ /api/
│  ├─ auth.js                 # Login/register routes
│  ├─ players.js              # Player profile/stats routes
│  ├─ leaderboards.js         # Leaderboard ranking routes
│  ├─ guilds.js               # Guild management routes
│  ├─ pvp.js                  # Duel initiation routes
│  └─ events.js               # Event listing routes
│
├─ /websocket/
│  ├─ events.js               # Socket.io event handlers
│  ├─ leaderboardSync.js      # Real-time leaderboard updates
│  ├─ guildSync.js            # Guild event broadcasting
│  └─ pvpHandler.js           # Live duel notifications
│
├─ /bots/
│  ├─ BotManager.js           # Bot lifecycle management
│  ├─ BotAI.js                # Bot grinding/skill logic
│  ├─ BotScheduler.js         # Event participation scheduler
│  └─ botProfiles.json        # Pre-defined bot characters
│
├─ /scheduler/
│  ├─ eventScheduler.js       # Cron-like event triggers
│  ├─ weekendEvents.js        # Weekend event definitions
│  └─ dailyEvents.js          # Daily mini-event definitions
│
└─ /utils/
   ├─ validation.js           # Input validation
   ├─ xpCalculation.js        # Shared XP formulas
   └─ leaderboardCalc.js      # Ranking calculation logic
```

### 2.3 Frontend Modifications

```
/js/
├─ systems/
│  └─ multiplayer.js          # NEW: Multiplayer system class
│
├─ ui/
│  ├─ main.js                 # MODIFIED: Add multiplayer tabs
│  ├─ leaderboards.js         # NEW: Leaderboard rendering
│  ├─ guilds.js               # NEW: Guild UI
│  ├─ pvp.js                  # NEW: PvP duel UI
│  └─ auth.js                 # NEW: Login/register modal
│
├─ engine/
│  └─ socketManager.js        # NEW: Socket.io client wrapper
│
└─ data/
   └─ multiplayer-config.js   # NEW: Client-side MP config
```

---

## 3. DATABASE SCHEMA (MongoDB)

### 3.1 Players Collection

```javascript
{
  _id: ObjectId,
  
  // Authentication
  auth: {
    method: 'oauth',              // 'oauth', 'email'
    provider: 'github',            // 'github', 'google'
    providerId: '12345678',
    email: 'player@example.com',
    username: 'netrunner_ace',
    createdAt: Date,
    lastLogin: Date,
  },
  
  // Game Progress (from single-player save)
  gameState: {
    skills: { ... },              // All skill levels/XP
    inventory: { ... },           // Items
    economy: { ... },             // Currency balance
    equipment: { ... },           // Equipped items
    prestige: { ... },            // Prestige level
    achievements: { ... },        // Unlocked achievements
    playtime: Number,             // Total playtime seconds
  },
  
  // Multiplayer Profile
  profile: {
    displayName: 'NetRunner_Ace',
    avatar: 'https://...',
    bio: 'Professional hacker',
    joinedAt: Date,
    isBot: false,
  },
  
  // Guild Membership
  guild: {
    guildId: ObjectId,            // NULL if not in guild
    role: 'member',               // 'leader', 'officer', 'member'
    joinedAt: Date,
  },
  
  // Leaderboard Stats
  stats: {
    totalXP: 1000000,
    overallRank: 42,
    skillRankings: {
      'intrusion': 15,
      'combat': 8,
      // ... per-skill ranks
    },
    pvpWins: 45,
    pvpLosses: 12,
    winRate: 0.789,               // 78.9%
    currencyEarned: 500000,
    currencyLost: 200000,
  },
  
  // PvP State
  pvp: {
    lastDuelAt: Date,
    duelCooldown: Number,         // ms until next duel
    currentChallenge: ObjectId,   // NULL or opponent's _id
    declinedChallenges: [],       // Array of player IDs
  },
  
  // Last Sync
  lastSaved: Date,
  lastSyncedGameState: Date,
}
```

### 3.2 Guilds Collection

```javascript
{
  _id: ObjectId,
  
  name: 'The Neon Collective',
  description: 'Elite hacker group',
  leader: ObjectId,              // Player reference
  officers: [ObjectId, ...],
  members: [ObjectId, ...],
  
  created: Date,
  level: 5,                       // Guild level (prestige-like)
  totalXP: 1000000,              // Cumulative member XP
  treasury: 50000,               // Shared guild currency
  
  wars: {
    wins: 10,
    losses: 3,
    currentOpponent: ObjectId,   // NULL or other guild ID
    nextWarAt: Date,
  },
  
  perks: [
    { name: 'xpBonus', value: 0.05 },
    { name: 'currencyBonus', value: 0.10 },
    // ... unlocked guild bonuses
  ],
}
```

### 3.3 Leaderboards Collection

```javascript
{
  _id: ObjectId,
  
  type: 'overall',               // 'overall', 'skill:intrusion', 'seasonal:s1'
  
  entries: [
    {
      rank: 1,
      playerId: ObjectId,
      playerName: 'elite_hacker',
      score: 999999,
      scoreType: 'totalXP',      // 'totalXP', 'skillXP', 'pvpWins', etc
      updateTime: Date,
    },
    // ... up to 100-500 entries
  ],
  
  updatedAt: Date,
}
```

### 3.4 PvPMatches Collection

```javascript
{
  _id: ObjectId,
  
  challenger: {
    playerId: ObjectId,
    playerName: 'attacker',
    initialRating: 1500,
    skillLevel: 50,
  },
  
  defender: {
    playerId: ObjectId,
    playerName: 'defender',
    initialRating: 1450,
    skillLevel: 48,
  },
  
  result: 'win',                 // 'win', 'loss', 'draw'
  winner: ObjectId,
  
  currencyStake: 1000,
  wagerWon: 1200,
  wagerLost: 0,
  
  createdAt: Date,
  resolvedAt: Date,
  ratingChange: {
    challenger: +12,
    defender: -12,
  },
}
```

### 3.5 BotProfiles Collection

```javascript
{
  _id: ObjectId,
  
  botName: 'NeonSamurai_Bot',
  displayName: 'Neon Samurai',
  avatar: 'https://...',
  
  gameState: { ... },            // Same as player gameState
  
  status: 'active',              // 'active', 'inactive', 'grinding', 'in_duel'
  currentActivity: 'intrusion',
  guildId: ObjectId,             // Bot's guild (optional)
  
  personality: 'aggressive',     // Used for event participation
  
  stats: {
    totalXP: 500000,
    skillFocus: ['intrusion', 'combat'],
    pvpWins: 20,
    pvpStyle: 'aggressive',
  },
  
  schedule: {
    activeHours: [9, 10, 11, ... , 22],  // UTC
    preferredEvents: ['guild_wars', 'duels'],
  },
  
  createdAt: Date,
  lastUpdate: Date,
}
```

---

## 4. API ENDPOINTS (25+)

### 4.1 Authentication Endpoints

```
POST   /api/auth/oauth/github         → OAuth callback handler
POST   /api/auth/logout               → Logout & clear session
GET    /api/auth/me                   → Get current user profile
POST   /api/auth/sync-game-state      → Upload single-player progress
```

### 4.2 Player Endpoints

```
GET    /api/players/:id               → Get player profile
GET    /api/players/:id/stats         → Get detailed player stats
PUT    /api/players/:id/profile       → Update profile (bio, avatar)
GET    /api/players/:id/history       → Get player's PvP history
```

### 4.3 Leaderboard Endpoints

```
GET    /api/leaderboards/overall      → Get top 100 overall
GET    /api/leaderboards/skill/:skill → Get top 100 for skill
GET    /api/leaderboards/seasonal     → Get seasonal leaderboards
GET    /api/leaderboards/my-rank      → Get current user's rank(s)
```

### 4.4 Guild Endpoints

```
POST   /api/guilds                    → Create new guild
GET    /api/guilds/:id                → Get guild details
PUT    /api/guilds/:id                → Update guild (leader only)
POST   /api/guilds/:id/members        → Add/invite member
DELETE /api/guilds/:id/members/:uid   → Remove member
GET    /api/guilds/:id/treasury       → Get guild funds
POST   /api/guilds/:id/treasury       → Contribute to treasury
GET    /api/guilds/my-guild           → Get user's current guild
```

### 4.5 PvP Endpoints

```
POST   /api/pvp/challenge             → Challenge another player
POST   /api/pvp/accept/:matchId       → Accept duel
POST   /api/pvp/decline/:matchId      → Decline duel
GET    /api/pvp/pending               → Get pending challenges
GET    /api/pvp/history               → Get past match history
POST   /api/pvp/resolve/:matchId      → Resolve match (server auto-resolves)
```

### 4.6 Event Endpoints

```
GET    /api/events/active             → Get current active events
GET    /api/events/schedule           → Get upcoming event schedule
POST   /api/events/:id/join           → Join event
GET    /api/events/:id/participants   → Get event participants
GET    /api/events/:id/results        → Get event results (post-event)
```

---

## 5. WEBSOCKET EVENTS (15+)

### 5.1 Leaderboard Updates

```javascript
// Server → Client
'leaderboard:updated'              // Overall rank changed
  { playerId, newRank, previousRank, totalXP }

'leaderboard:skill-updated'        // Skill rank changed
  { playerId, skill, newRank, skillXP }

'leaderboard:snapshot'             // Broadcast full leaderboard periodically
  { type: 'overall', entries: [...] }
```

### 5.2 Guild Events

```javascript
// Server → Client
'guild:member-joined'
  { guildId, playerId, playerName }

'guild:member-left'
  { guildId, playerId, playerName, reason }

'guild:treasury-updated'
  { guildId, balance, contributor, amount }

'guild:war-started'
  { guildId, opponentId, opponentName }

'guild:war-ended'
  { guildId, opponentId, result, rewards }

'guild:announcement'
  { guildId, leaderId, message }
```

### 5.3 PvP Events

```javascript
// Server → Client
'pvp:challenged'
  { challengerId, challengerName, stake }

'pvp:match-result'
  { matchId, winner, loser, wagerWon, wagerLost, ratingChange }

'pvp:duel-available'               // Notify when ready for next duel
  { nextDuelAvailableIn: 3600000 } // ms
```

### 5.4 Event Notifications

```javascript
// Server → Client
'event:starting'
  { eventId, eventName, startsIn: 300000 } // 5 minutes

'event:live'
  { eventId, eventName, participants: [], objectives: [...] }

'event:ended'
  { eventId, eventName, results: {...}, rewards: {...} }

'event:reward-earned'
  { eventId, reward, amount }
```

---

## 6. EVENT SYSTEM

### 6.1 Weekly Events (Weekends)

| Event | Schedule | Type | Rewards | Participation |
|-------|----------|------|---------|---|
| **Guild Wars Tournament** | Sat 9 AM - Sun 5 PM | Guild vs Guild | Guild XP, currency | Auto-enrolled |
| **King of the Hill** | Sat 2 PM - 8 PM | Individual | XP multiplier, title | Opt-in |
| **Skill Sprint** | Sun 10 AM - 6 PM | Individual | Bonus drops 2x | Opt-in |
| **Loot Rush** | Sun 7 PM - 11 PM | Individual | 5x item drops | Opt-in |

### 6.2 Daily Mini-Events

| Event | Time | Duration | Type | Rewards |
|-------|------|----------|------|---------|
| **Daily Duel** | 12 PM UTC | 1 hour | Optional duel | Currency if win |
| **Skill Challenge** | 6 PM UTC | 2 hours | Grind challenge | Mastery XP 2x |
| **Boss Spawn** | 8 PM UTC | 30 min | PvE wave | Rare drops |

### 6.3 Seasonal Events (Quarterly)

- **Season 1 Leaderboard** (Jan-Mar): Track top performers, award skins
- **Season 2 Leaderboard** (Apr-Jun): Reset rankings, new challenges
- **Holiday Events** (Dec): Special events, limited items

---

## 7. BOT SYSTEM DESIGN

### 7.1 Bot Architecture

```
BotManager (lifecycle)
  ├─ Initialize 20-50 bots at startup
  ├─ Load bot profiles from JSON
  ├─ Assign bots to guilds (50% chance)
  └─ Schedule grinding tasks
  
BotAI (behavior)
  ├─ Auto-grind skills (8-12 hours/day simulated)
  ├─ Auto-participate in PvP (2-5 duels/day)
  ├─ Auto-join guilds (if guild < 20 members)
  └─ Pause/resume based on event schedule
  
BotScheduler (events)
  ├─ Weekend event participation (100% join rate)
  ├─ Daily mini-event participation (70% join rate)
  ├─ Challenge random players (2-3/day)
  └─ Contribute to guild treasury (weekly)
```

### 7.2 Sample Bot Profiles

```json
[
  {
    "botName": "NeonSamurai",
    "personality": "aggressive",
    "skillFocus": ["combat", "ice_breaking"],
    "pvpStyle": "aggressive",
    "guildType": "military"
  },
  {
    "botName": "DataWraith",
    "personality": "strategic",
    "skillFocus": ["decryption", "deep_dive"],
    "pvpStyle": "evasive",
    "guildType": "hacker"
  },
  {
    "botName": "CyberNova",
    "personality": "casual",
    "skillFocus": ["cyberware_crafting", "neural_enhancement"],
    "pvpStyle": "balanced",
    "guildType": "tech"
  }
]
```

---

## 8. IMPLEMENTATION PHASES (15-17 weeks total)

### Phase 1: Backend Infrastructure (2-3 weeks)
- Set up Node.js + Express server
- Configure MongoDB & seed initial data
- Implement OAuth (GitHub/Google)
- Create REST API endpoints (auth, players, leaderboards)
- Set up WebSocket server (Socket.io)
- Implement basic leaderboard calculation

### Phase 2: Database & Persistence (2 weeks)
- Create MongoDB schemas
- Implement game state sync endpoint
- Build leaderboard ranking engine
- Add PvP match storage
- Set up guild system backend

### Phase 3: Guild System (2 weeks)
- Guild creation/management API
- Member invite system
- Guild treasury management
- Guild war scheduling
- Guild-level perks system

### Phase 4: PvP System (1.5 weeks)
- Duel challenge API
- Match resolution logic
- Rating/Elo system
- Challenge timeout & decline system
- PvP history tracking

### Phase 5: Bot System (2 weeks)
- BotManager lifecycle
- Bot profile loading & initialization
- BotAI grinding loop
- Bot event participation
- Bot persistence to MongoDB

### Phase 6: Event System (2 weeks)
- Event scheduler (cron-like)
- Weekend event definitions
- Daily mini-event definitions
- Event participation tracking
- Reward calculation & distribution

### Phase 7: Frontend Integration (3 weeks)
- Auth modal (login/register)
- Leaderboard UI component
- Guild management UI
- PvP duel interface
- Real-time leaderboard updates
- Event notification system
- Socket.io client integration

### Phase 8: Testing & Optimization (2 weeks)
- Load testing (100-500 concurrent users)
- Bot behavior fine-tuning
- Leaderboard performance optimization
- WebSocket connection stability
- Database indexing & query optimization

### Phase 9: Deployment (1 week)
- Choose hosting (DigitalOcean, AWS, etc.)
- Set up MongoDB Atlas or self-hosted DB
- Configure environment variables
- Deploy backend & frontend
- DNS/domain configuration
- Monitoring & alerting setup

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Authentication & Authorization
- OAuth via GitHub (industry standard, no password storage)
- JWT tokens (httpOnly cookies, 1-hour expiry)
- Rate limiting on auth endpoints (5 attempts/minute)
- CORS configuration (allow only netrunner domain)

### 9.2 Data Validation
- Server validates all client submissions (XP, items, currency)
- Cannot trust client XP amounts; recalculate from activity logs
- Inventory changes validated against server state
- PvP stakes validated before match

### 9.3 Cheating Prevention
- Client is read-only for leaderboards (no direct XP manipulation)
- All XP/item gains must go through API
- PvP matches auto-resolved server-side (not client)
- Timestamps checked for offline grinding (max 24h)
- Bot accounts clearly marked in leaderboards

### 9.4 Rate Limiting
- Auth endpoints: 5/min per IP
- API endpoints: 100/min per user
- WebSocket messages: 50/sec per connection
- Leaderboard queries: 1/sec per user

---

## 10. DEPLOYMENT STRATEGY

### 10.1 Hosting Options

| Provider | Cost | Recommendation |
|----------|------|---|
| **DigitalOcean App Platform** | $12/mo | ← Recommended start |
| **Heroku** | $50+/mo | Easy but pricier |
| **AWS EC2** | $10+/mo | Complex but scalable |

### 10.2 Database Hosting

| Option | Cost | Recommendation |
|--------|------|---|
| **MongoDB Atlas Free** | Free | ← Recommended start (512MB) |
| **Self-hosted MongoDB** | $5/mo | Full control |

### 10.3 Monitoring & Alerting

- **Uptime:** UptimeRobot (check every 5 min)
- **Errors:** Sentry (JS + backend exceptions)
- **Performance:** DataDog or New Relic (optional)
- **Logs:** CloudWatch or ELK stack
- **Alerts:** Discord webhook for critical errors

---

## 11. SUCCESS METRICS

### 11.1 User Engagement
- **Target DAU:** 50-100 players by month 2
- **Target MAU:** 150-300
- **Guild Participation:** 70%+
- **PvP Engagement:** 40%+ attempt duels

### 11.2 Retention
- **Week 1:** 50% (standard for idle games)
- **Week 4:** 25%
- **Month 1:** 15%
- **Month 3:** 10%+ (strong)

### 11.3 Bot Activity
- **Leaderboard Diversity:** 30-40% bots in top 20
- **Bot Win Rate:** 35-45% (slightly below average)
- **Event Participation:** 80%+

### 11.4 Community Health
- **Guild Wars Participation:** 60%+ weekly
- **Event Attendance:** 30-50%
- **Support Tickets:** <5/month
- **No Major Exploits:** Zero game-breaking bugs

---

## 12. RISK ANALYSIS

### 12.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| WebSocket drops | Medium | High | Auto-reconnect + fallback |
| Database performance | Low | Critical | Proper indexing |
| Bot leaderboard farming | Low | High | Skill rating checks |
| OAuth downtime | Low | Medium | Fallback email |

### 12.2 Balance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| PvP becomes P2W | Medium | High | Stake caps, seasonal reset |
| Bots too strong | Medium | High | Nerf AI |
| Guild imbalance | Low | Medium | Matchmaking by level |
| Event inflation | Medium | Medium | Monthly balance |

### 12.3 Community Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Toxic chat | High | Medium | Moderation + mutes |
| Inactive guilds | Medium | Low | Archive after 30 days |
| New player overwhelm | Medium | Medium | Tutorial + newbie ladder |

---

## 13. POST-LAUNCH ROADMAP

- **Month 2:** New abilities, more events, cosmetics shop
- **Month 3:** Trading market between players
- **Month 4:** Guild raids (cooperative PvE dungeon)
- **Month 5:** Seasonal cosmetics & battle pass
- **Month 6+:** Community feedback loop, continuous balance

---

## 14. NEXT STEPS

1. **Review this plan** — Approve or request changes
2. **Confirm technology choices** — Node/MongoDB/Socket.io
3. **Set up backend repository** — Separate from frontend
4. **Begin Phase 1** — Backend infrastructure
5. **Weekly progress updates** — Track against timeline

---

**Document Complete — Ready for Implementation**

This plan represents a comprehensive, phased approach to adding multiplayer functionality to NETRUNNER while maintaining the integrity of the single-player experience.
