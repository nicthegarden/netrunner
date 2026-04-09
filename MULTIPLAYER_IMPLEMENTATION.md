# NETRUNNER Multiplayer — Implementation Guide

**Status:** Ready for Development  
**Technology Stack:** Node.js + Express + MongoDB + Socket.io  
**Timeline:** 15-17 weeks (9 phases)

---

## Quick Reference

### Technology Stack
- **Backend:** Node.js 18.x LTS + Express 4.18+
- **Database:** MongoDB 5.x+ (Atlas or self-hosted)
- **Real-time:** Socket.io 4.5+
- **Auth:** Passport.js + JWT
- **Job Scheduling:** node-cron 3.x
- **Testing:** Jest + Supertest

### Project Structure

**Backend:** `/backend/` (new directory)
- `server.js` — Main entry point
- `/config` — Configuration & secrets
- `/models` — MongoDB schemas
- `/api` — REST API routes
- `/bots` — Bot AI logic
- `/scheduler` — Event scheduler
- `/websocket` — Socket.io handlers

**Frontend:** `/js/` (modifications)
- `/ui/leaderboards.js` — New leaderboard UI
- `/ui/guilds.js` — New guild UI
- `/ui/pvp.js` — New PvP UI
- `/ui/auth.js` — New auth modal
- `/engine/socketManager.js` — Socket.io client
- `/systems/multiplayer.js` — MP system class

---

## Phase 1: Backend Infrastructure (Weeks 1-3)

### Deliverable
✅ Working Node.js server  
✅ OAuth login/register  
✅ Basic REST API  
✅ Socket.io connection  
✅ Leaderboard calculation

### Key Files to Create

**server.js** (50 lines)
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

// Middleware
app.use(express.json());
app.use(require('./middleware/auth'));

// Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/players', require('./api/players'));
app.use('/api/leaderboards', require('./api/leaderboards'));

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  // Event handlers
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
```

**config/database.js** (30 lines)
```javascript
const mongoose = require('mongoose');

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
```

**config/oauth.js** (40 lines)
```javascript
const GitHubStrategy = require('passport-github2').Strategy;

module.exports = {
  github: {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    passReqToCallback: true,
  },
  strategy: new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // User authentication logic
      done(null, profile);
    }
  ),
};
```

**models/User.js** (80 lines)
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  auth: {
    method: String,
    provider: String,
    providerId: String,
    email: String,
    username: String,
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
  },
  profile: {
    displayName: String,
    avatar: String,
    bio: String,
    joinedAt: { type: Date, default: Date.now },
    isBot: { type: Boolean, default: false },
  },
  gameState: mongoose.Schema.Types.Mixed,
  guild: {
    guildId: mongoose.Schema.Types.ObjectId,
    role: String,
    joinedAt: Date,
  },
  stats: {
    totalXP: Number,
    overallRank: Number,
    skillRankings: mongoose.Schema.Types.Mixed,
    pvpWins: Number,
    pvpLosses: Number,
    winRate: Number,
    currencyEarned: Number,
    currencyLost: Number,
  },
  pvp: {
    lastDuelAt: Date,
    duelCooldown: Number,
    currentChallenge: mongoose.Schema.Types.ObjectId,
    declinedChallenges: [mongoose.Schema.Types.ObjectId],
  },
  lastSaved: Date,
  lastSyncedGameState: Date,
});

module.exports = mongoose.model('User', userSchema);
```

---

## Phase 2: Database & Persistence (Weeks 4-5)

### Deliverable
✅ MongoDB schemas complete  
✅ Game state sync working  
✅ Leaderboard ranking engine  
✅ PvP match storage  

### Key Files
- `models/Guild.js`
- `models/Leaderboard.js`
- `models/PvPMatch.js`
- `models/BotProfile.js`
- `api/auth.js` (sync endpoint)
- `utils/leaderboardCalc.js`

---

## Phase 3: Guild System (Weeks 6-7)

### Deliverable
✅ Guild creation API  
✅ Member management  
✅ Treasury system  
✅ Guild wars scheduling  
✅ Perks/bonuses  

### Key Files
- `models/Guild.js` (complete)
- `api/guilds.js` (6 endpoints)
- `websocket/guildSync.js`

---

## Phase 4: PvP System (Weeks 8-9.5)

### Deliverable
✅ Duel challenges  
✅ Match resolution  
✅ Elo rating system  
✅ PvP history  

### Key Files
- `models/PvPMatch.js`
- `api/pvp.js`
- `utils/ratingCalc.js`
- `websocket/pvpHandler.js`

---

## Phase 5: Bot System (Weeks 10-11)

### Deliverable
✅ 20-50 active bots  
✅ Bot grinding AI  
✅ Event participation  
✅ Skill-based progression  

### Key Files
- `bots/BotManager.js`
- `bots/BotAI.js`
- `bots/BotScheduler.js`
- `bots/botProfiles.json`

---

## Phase 6: Event System (Weeks 12-13)

### Deliverable
✅ Event scheduler (cron)  
✅ Weekend events  
✅ Daily mini-events  
✅ Reward distribution  
✅ Event broadcasting  

### Key Files
- `scheduler/eventScheduler.js`
- `scheduler/weekendEvents.js`
- `scheduler/dailyEvents.js`
- `api/events.js`
- `websocket/eventHandler.js`

---

## Phase 7: Frontend Integration (Weeks 14-16)

### Deliverable
✅ Auth modal  
✅ Leaderboard UI  
✅ Guild UI  
✅ PvP UI  
✅ Real-time updates via Socket.io  

### Modifications to Existing Files

**index.html**
```html
<!-- Add multiplayer section in sidebar -->
<div class="nav-section">
  <h3>MULTIPLAYER</h3>
  <button class="nav-btn" data-view="leaderboards">🏆 Leaderboards</button>
  <button class="nav-btn" data-view="guilds">⚔️ Guilds</button>
  <button class="nav-btn" data-view="pvp">🎯 PvP</button>
  <button class="nav-btn" data-view="events">🎪 Events</button>
</div>

<!-- Auth Modal -->
<div id="auth-modal" class="modal" style="display:none">
  <div class="modal-dialog">
    <h2>Join NETRUNNER Multiplayer</h2>
    <button onclick="authWithGitHub()">Login with GitHub</button>
  </div>
</div>
```

**js/ui/leaderboards.js** (200 lines)
```javascript
export function renderLeaderboards() {
  const container = document.getElementById('content');
  
  // Overall leaderboard
  const overall = fetch('/api/leaderboards/overall')
    .then(r => r.json())
    .then(data => renderLeaderboardTable(data, 'overall'));
  
  // Skill leaderboards
  const skills = fetch('/api/leaderboards/skill')
    .then(r => r.json())
    .then(data => renderSkillLeaderboards(data));
}

function renderLeaderboardTable(data, type) {
  const html = `
    <div class="leaderboard-${type}">
      <h2>Leaderboard: ${type}</h2>
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${data.entries.map(entry => `
            <tr>
              <td>#${entry.rank}</td>
              <td>${entry.playerName}</td>
              <td>${entry.score.toLocaleString()}</td>
              <td>
                <button onclick="challengePlayer('${entry.playerId}')">Challenge</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  return html;
}
```

---

## Phase 8: Testing & Optimization (Weeks 17-18)

### Testing Checklist

**Unit Tests (Jest)**
- [ ] Leaderboard calculation accuracy
- [ ] Elo rating formula
- [ ] Bot AI decision logic
- [ ] Event reward distribution

**Integration Tests**
- [ ] Full auth flow (OAuth → user created)
- [ ] PvP duel flow (challenge → resolution)
- [ ] Guild creation → war → reward flow
- [ ] Event participation → reward flow

**Load Tests (Artillery/k6)**
- [ ] 100 concurrent users
- [ ] 500 concurrent users
- [ ] WebSocket connection stability
- [ ] API response times under load

**Manual Testing**
- [ ] Login/register works
- [ ] Leaderboards display correctly
- [ ] PvP duels resolve
- [ ] Guild wars work end-to-end
- [ ] Bots grind & participate
- [ ] Events trigger on schedule

---

## Phase 9: Deployment (Week 19)

### Deployment Steps

**1. Choose Hosting**
```bash
# Option A: DigitalOcean App Platform
# - Create app, connect GitHub repo
# - Set environment variables
# - Deploy automatically on push

# Option B: Self-hosted on DigitalOcean Droplet
mkdir /opt/netrunner-backend
cd /opt/netrunner-backend
git clone <repo>
npm install
npm start  # with PM2 for process management
```

**2. Set Up Database**
```bash
# MongoDB Atlas
# 1. Create free cluster
# 2. Get connection string
# 3. Add IP whitelist
# 4. Save to .env
```

**3. Configure SSL**
```bash
# Let's Encrypt
sudo certbot certonly --standalone -d api.netrunner.com
```

**4. Environment Variables**
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<random-32-char-string>
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://api.netrunner.com/auth/oauth/github
FRONTEND_URL=https://netrunner.com
```

**5. Monitoring**
```bash
# UptimeRobot - Check every 5 minutes
# Sentry - Track errors
# Discord webhook - Alert on critical issues
```

---

## Package.json Template

```json
{
  "name": "netrunner-backend",
  "version": "1.0.0",
  "description": "NETRUNNER Multiplayer Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.5.0",
    "mongoose": "^7.0.0",
    "passport": "^0.6.0",
    "passport-github2": "^0.1.12",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.0",
    "node-cron": "^3.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

## Environment Variables (.env)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netrunner

# Authentication
JWT_SECRET=your-secret-key-here-minimum-32-characters-long
JWT_EXPIRE=1h

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret
GITHUB_CALLBACK_URL=https://api.yourdomain.com/auth/oauth/github

# Frontend
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Bot Configuration
BOT_COUNT=50
BOT_GRIND_HOURS=8
BOT_DUEL_FREQUENCY=3

# Event Configuration
GUILD_WAR_DAY=6  # Saturday
GUILD_WAR_START_HOUR=9  # 9 AM UTC
GUILD_WAR_END_HOUR=17  # 5 PM UTC
```

---

## Development Workflow

**Local Setup**
```bash
# 1. Clone repository
git clone git@github.com:nicthegarden/netrunner.git
cd netrunner

# 2. Set up backend
mkdir backend
cd backend
npm init -y
npm install express socket.io mongoose passport...

# 3. Create .env file
cp .env.example .env
# Edit .env with local values

# 4. Start development server
npm run dev

# 5. In another terminal, start frontend
cd ..
npm start  # or python -m http.server 8000
```

**Git Workflow**
```bash
# Create feature branch
git checkout -b feature/guild-system

# Make changes, test, commit
git add .
git commit -m "feat: implement guild creation API"

# Push to GitHub
git push origin feature/guild-system

# Create pull request on GitHub
# After review, merge to main
```

---

## Performance Optimization Tips

**Database**
- Add indexes on frequently queried fields (username, email)
- Use connection pooling (Mongoose does this by default)
- Archive old leaderboard entries

**WebSocket**
- Use rooms for guild/event broadcasting
- Limit leaderboard broadcast to 5-minute intervals
- Implement connection heartbeat

**API**
- Implement caching for leaderboards (Redis optional)
- Use pagination for large datasets
- Compress responses with gzip

**Bot AI**
- Batch bot operations (don't update 50 bots simultaneously)
- Use timeouts to spread grinding across hours
- Store bot state in DB, not memory

---

## Common Issues & Solutions

**Issue: WebSocket connection fails**
- Check CORS configuration in server.js
- Ensure Socket.io version matches on client
- Add console logging to debug

**Issue: Leaderboards slow to update**
- Add MongoDB indexes
- Implement caching layer
- Batch leaderboard calculation

**Issue: Bot AI farms leaderboards**
- Add skill-level checks before matching
- Implement cooldowns on bot actions
- Separate bot and human leaderboards

---

## Documentation Links

- [Socket.io Documentation](https://socket.io/docs/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Express.js Guide](https://expressjs.com/)
- [Passport.js Strategies](http://www.passportjs.org/packages/)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)

---

**Ready to begin development!**

Start with Phase 1: Backend Infrastructure. Create the backend directory, set up Express server, configure OAuth, and get basic API endpoints working.

Questions? Check the main MULTIPLAYER_PLAN.md for detailed architectural decisions.
