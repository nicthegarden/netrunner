# NETRUNNER MULTIPLAYER — Phase 2 Implementation Roadmap

**Status:** ⏸️ Disabled (Ready for Phase 2)
**Backend API:** ✓ Running and tested
**Real-time Layer:** ⏳ Planned

## Executive Summary

Multiplayer features (PvP, Guilds, Events) have been disabled from the UI pending implementation of the WebSocket real-time layer. The backend REST API is fully functional and ready to be extended.

## Current Status

### What Works ✓

**Backend REST Endpoints:**
- `GET /api/players/leaderboard` — XP-based leaderboard
- `GET /api/guilds` — List all guilds
- `GET /api/guilds/:id` — Guild details
- `POST /api/challenges` — Create duel challenge
- `GET /api/events` — List active events
- `GET /api/duels` — List duel history
- `GET /api/leaderboard/pvp` — PvP stats
- `GET /api/leaderboard/elo` — ELO ratings

### What's Missing ✗

**WebSocket Real-time Features:**
- Duel event broadcasting
- Guild war live updates
- Player presence/online status
- Event notifications
- Real-time damage tracking

**Frontend Implementation:**
- PvP duel UI and opponent matching
- Guild creation and management UI
- Event participation UI
- Live leaderboard updates
- Duel animation and battle resolution

## Phase 2 Implementation Plan

### Week 1: Backend WebSocket Layer

#### Task 1: Add Socket.io to Backend (4 hours)

```bash
# Add dependencies
npm install socket.io

# Create socket server
# Listen on same port (3001) or separate port
# Implement auth middleware
```

**Code Structure:**
```javascript
import socketIO from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Implement namespaces
  socket.on('duel:action', (data) => { /* handle */ });
  socket.on('war:damage', (data) => { /* handle */ });
});
```

#### Task 2: Implement Duel Namespace (3 hours)

**Features:**
- Join duel room
- Broadcast rounds to both players
- Track match state
- Emit victory/defeat
- Update player ELO rating

**Events:**
- `duel:started` — Match begins
- `duel:round` — Round completed, new state
- `duel:completed` — Match ended
- `duel:action` — Player action (attack, ability, etc)

#### Task 3: Implement Guild War Namespace (3 hours)

**Features:**
- Broadcast damage updates to guild members
- Track war progress (phase, remaining health)
- Announce phase transitions
- Handle war completion and rewards

**Events:**
- `war:started` — War begins
- `war:damage_update` — Damage dealt
- `war:phase_transition` — New phase
- `war:victory` — Guild won
- `war:defeat` — Guild lost

#### Task 4: Implement Presence System (2 hours)

**Features:**
- Track online players
- Announce player login/logout
- Publish online list to leaderboards
- Show player status in guild UI

**Events:**
- `presence:online` — Player login
- `presence:offline` — Player logout
- `presence:updated` — Status changed

### Week 2: Frontend Multiplayer Manager

#### Task 5: Create Multiplayer UI Manager (4 hours)

**File:** `js/ui/multiplayer.js`

**Classes:**
- `MultiplayerUIManager` — Coordinate multiplayer UI
- `DuelUIManager` — Duel-specific UI
- `GuildUIManager` — Guild-specific UI
- `EventUIManager` — Event-specific UI

**Responsibilities:**
- Listen to multiplayer events
- Update UI in real-time
- Handle animations and transitions
- Manage modal dialogs

#### Task 6: Implement PvP Duel UI (5 hours)

**Features:**
- Opponent list with ELO ratings
- Challenge confirmation dialog
- Live duel battle screen with:
  - Player/Opponent HP bars
  - Turn indicator
  - Action buttons (Attack, Defend, Ability)
  - Damage numbers
  - Round counter
- Result screen with ELO change
- Duel history log

**Components:**
- Opponent selector
- Battle arena
- Action panel
- Result notification

#### Task 7: Implement Guild UI (4 hours)

**Features:**
- Guild browser with filter
- Guild details page
- Join/Leave buttons
- Guild member list
- Guild war tracker
- Contribution leaderboard

**Components:**
- Guild list view
- Guild detail modal
- Member roster table
- War progress bar

#### Task 8: Implement Event UI (3 hours)

**Features:**
- Event listings
- Event details with objectives
- Join event button
- Event leaderboard
- Rewards preview
- Time remaining

### Week 3: Integration & Testing

#### Task 9: Integration Testing (4 hours)

**Test Scenarios:**
1. Challenge opponent → Duel starts → Battle → Victory/Loss
2. Guild war starts → Damage updates → War ends
3. Player online/offline → Presence updated
4. Multiple concurrent duels
5. Connection loss → Reconnection → Resume

**Tools:**
- Browser DevTools for WebSocket debugging
- Socket.io test client
- Manual gameplay testing

#### Task 10: Error Handling & Reconnection (3 hours)

**Features:**
- Graceful disconnection handling
- Automatic reconnection with exponential backoff
- Queue actions during offline
- Sync state on reconnect
- User-friendly error messages

**Code:**
```javascript
socket.on('disconnect', () => {
  // Show offline indicator
  // Queue pending actions
  // Attempt reconnect
});

socket.on('connect', () => {
  // Sync game state
  // Process queued actions
  // Clear offline indicator
});
```

#### Task 11: Polish & Optimization (3 hours)

**Optimizations:**
- Minimize message payload size
- Implement request throttling
- Cache leaderboard data
- Lazy load guild lists
- Optimize UI redraws

**Polish:**
- Add sound effects for events
- Animate HP changes
- Smooth transitions
- Loading states
- Tooltips and help text

## Backend API Reference

### Existing Endpoints (Ready to Use)

```
GET /api/players/leaderboard
  Returns: { leaderboard: [ { rank, id, username, level, xp, elo, eurodollar, playtime } ] }

GET /api/guilds
  Returns: { guilds: [ { id, name, tag, members, level } ] }

GET /api/guilds/:id
  Returns: { id, name, tag, members, level, founder, wars, treasury }

POST /api/challenges
  Body: { challenger: id, opponent: id, wager: amount }
  Returns: { matchId, challenger, opponent, status: 'pending' }

GET /api/events
  Returns: { events: [ { id, name, type, status, boss, phase } ] }

GET /api/duels
  Returns: { duels: [ { id, player1, player2, winner, wager, status } ] }
```

### WebSocket Events (To Implement)

```
CLIENT → SERVER (Emit):
  duel:action { matchId, action, data }
  war:damage { eventId, damage }
  presence:status { status, location }

SERVER → CLIENT (On):
  duel:started { matchId, opponent, firstPlayer }
  duel:round { round, playerState, opponentState, winner? }
  duel:completed { winner, eloChange, wager_result }
  
  war:started { eventId, guild1, guild2, duration }
  war:damage_update { eventId, guild, damage, totalDamage }
  war:phase_transition { eventId, newPhase }
  war:victory { eventId, winningGuild, rewards }
  
  presence:online { playerId, username }
  presence:offline { playerId }
  
  leaderboard:updated { type, leaderboard }
```

## File Structure (Phase 2)

```
js/
├── multiplayer/
│   ├── duelUI.js          (NEW)
│   ├── guildUI.js         (NEW)
│   ├── eventUI.js         (NEW)
│   └── multiplayerUI.js   (NEW - replaces multiplayer.js)
├── multiplayer.js         (UPDATED - re-enable)
├── netrunnerClient.js     (UPDATED - re-enable WebSocket)
└── app.js                 (UPDATED - re-enable multiplayer init)
```

## Testing Checklist

- [ ] WebSocket connection established
- [ ] Duel starts and broadcasts to both players
- [ ] Duel actions update both UIs
- [ ] Duel ends and calculates ELO change
- [ ] Guild war damage accumulates
- [ ] Guild war completion awards rewards
- [ ] Player presence tracked
- [ ] Leaderboards update in real-time
- [ ] Reconnection works after disconnect
- [ ] Error handling for network failures
- [ ] Performance under concurrent users
- [ ] Mobile UI responsive

## Success Criteria

- All multiplayer features working in browser
- Real-time updates < 100ms latency
- Graceful degradation on offline
- No console errors
- UI responsive during network activity
- Can handle 50+ concurrent duels
- Leaderboards accurate and live

## Estimated Timeline

- **Planning:** 2 hours
- **Backend WebSocket:** 12 hours
- **Frontend UI:** 16 hours
- **Integration & Testing:** 10 hours
- **Polish:** 3 hours
- **Buffer:** 7 hours

**Total: ~50 hours (approximately 1 week for 1 developer, 3-4 days for 2 developers)**

## Notes

- This roadmap assumes the core game continues to work offline
- Multiplayer is enhancement, not requirement
- Can be deployed incrementally (duel → guild → events)
- Test server can be reused during Phase 2
- All code should follow existing patterns

## Next Steps

1. Review and approve this roadmap
2. Set target date for Phase 2 kickoff
3. Prepare Socket.io implementation setup
4. Create issue board with tasks
5. Schedule daily standup for Phase 2

---

**Prepared:** April 10, 2026
**Status:** Ready for Phase 2 Development
**Contacts:** @dev-team

