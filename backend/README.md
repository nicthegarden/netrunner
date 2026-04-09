# NETRUNNER Multiplayer Backend

Node.js + Express backend server for the NETRUNNER multiplayer game system.

## Quick Start

### Prerequisites

- Node.js 18.x LTS or higher
- npm 9.x or higher
- MongoDB 5.x+ (local or Atlas)

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Set MONGODB_URI for your database
# - Add OAuth credentials (GitHub, Google)
# - Set JWT_SECRET and SESSION_SECRET
```

### Development

```bash
# Start with auto-reload (requires nodemon)
npm run dev

# Or start normally
npm start

# Run tests
npm test

# Run linter
npm run lint
```

### Environment Variables

See `.env.example` for all available options. Key variables:

- `NODE_ENV`: Set to `development`, `staging`, or `production`
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: OAuth credentials
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials

## Architecture

```
src/
├── config/          # Configuration and database setup
├── models/          # Mongoose schemas (Player, Guild, etc.)
├── routes/          # API endpoint handlers
├── middleware/      # Auth, validation, error handling
├── controllers/     # Business logic
├── utils/          # Helper functions
├── server.js       # Express + Socket.io setup
└── index.js        # Entry point
```

## API Endpoints (Planned)

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login with email/password
- `GET /auth/github` - GitHub OAuth login
- `GET /auth/google` - Google OAuth login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh JWT token

### Players
- `GET /api/players/:id` - Get player profile
- `PUT /api/players/:id` - Update player profile
- `POST /api/players/:id/sync` - Sync game progress from single-player save
- `GET /api/players/:id/stats` - Get multiplayer stats

### Guilds
- `POST /api/guilds` - Create new guild
- `GET /api/guilds/:id` - Get guild info
- `PUT /api/guilds/:id` - Update guild settings
- `POST /api/guilds/:id/invite` - Invite player
- `DELETE /api/guilds/:id/members/:playerId` - Remove member

### Leaderboards
- `GET /api/leaderboards/players` - Top players by rank
- `GET /api/leaderboards/guilds` - Top guilds by consecutive wins
- `GET /api/leaderboards/weekly` - Weekly challenge rankings

## WebSocket Events (Planned)

### PvP Duels
- `duel:challenge` - Challenge another player
- `duel:accept` - Accept duel challenge
- `duel:decline` - Decline challenge
- `duel:update` - Live duel HP/damage update
- `duel:end` - Duel finished

### Guilds
- `guild:damage` - Deal damage to weekly boss
- `guild:update` - Guild stats updated
- `guild:war-end` - Guild war finished

### Chat/Notifications
- `message:send` - Send chat message
- `notification:new` - New notification

## Database Models

### Player
- Account info (username, email, OAuth)
- Game progress (skills, inventory, prestige)
- Multiplayer stats (rank, duels, guild)

### Guild
- Members with roles
- Treasury and contributions
- Weekly war progress
- Perks and bonuses

### (Planned)
- PvPMatch
- Event
- Leaderboard (cached)
- AuditLog

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Deployment

### Docker

```bash
# Build image
docker build -t netrunner-backend .

# Run container
docker run -p 5000:5000 --env-file .env netrunner-backend
```

### PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start src/index.js --name netrunner

# Monitor
pm2 monit
```

### Environment-Specific Notes

**Development:**
- Uses local MongoDB (mongodb://localhost:27017/netrunner)
- Verbose logging
- Allows CORS from localhost:8000 and localhost:3000

**Production:**
- Requires MongoDB Atlas connection string
- HTTPS only
- JWT secrets must be set
- All OAuth credentials required
- Rate limiting enabled

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` (local) or check Atlas status
- Verify connection string in .env
- Check firewall/network access

### OAuth Not Working
- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check callback URLs match registered URLs in OAuth provider
- Ensure CORS_ORIGIN includes your frontend URL

### Port Already in Use
- Change `PORT` in .env
- Or kill existing process: `lsof -ti :5000 | xargs kill -9`

## Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -am "Add feature"`
3. Push branch: `git push origin feature/my-feature`
4. Create pull request with description
5. Request review and merge once approved

## Status

**Phase 1 Status:** ✅ Backend infrastructure initialized
- ✅ Express server setup
- ✅ Socket.io ready
- ✅ Database configuration
- ✅ Player and Guild models created
- ⏳ OAuth implementation (next)
- ⏳ API routes (next)

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Passport.js Documentation](http://www.passportjs.org/)
- [NETRUNNER Game Design](../MULTIPLAYER_PLAN.md)

## License

MIT
