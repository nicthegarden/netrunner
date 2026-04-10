# Phase 2 Multiplayer Testing Guide

## Servers Status
✅ **Game Server** - Running on http://localhost:8000
✅ **Backend Server** - Running on http://localhost:3000

## Quick Test Steps

### 1. Load the Game
```
Open http://localhost:8000 in browser
Press F12 to open Developer Console
```

### 2. Verify SDK Integration
In console, verify both objects exist:
```javascript
console.log(window.gameClient);     // Should show NetrunnerClient object
console.log(window.gameInstance);   // Should show Game instance
console.log(window.multiplayerManager); // Should show MultiplayerManager
```

### 3. Test Multiplayer Navigation
- Look for new buttons in sidebar:
  - ⚔️ PvP Duels
  - 🏰 Guilds
  - 📅 Events
  - 🏆 Leaderboards

### 4. Test Each Feature

#### PvP Duels
1. Click "⚔️ PvP Duels" button
2. You should see:
   - Your PvP stats (ELO, wins, losses, win rate)
   - Leaderboard with top 10 players
   - Recent duel history
3. Try clicking "Challenge Player" button (will prompt for opponent name and wager)

#### Guilds
1. Click "🏰 Guilds" button
2. You should see:
   - "Your Guild" section (shows current guild or "not in a guild" message)
   - "Available Guilds" section with guild cards
3. Each guild card should show:
   - Guild name and tag
   - Leader name
   - Member count
   - Guild level
   - Description
4. Try clicking "Join Guild" button (requires guild ID from backend)

#### Events
1. Click "📅 Events" button
2. You should see:
   - Active Events section with event cards
   - Guild Wars section with ongoing wars
3. Each event card should show:
   - Event name
   - Event type
   - Status (with color coding: green=active, yellow=pending, red=ended)
   - Start time and duration
   - Join button (disabled if not active)

#### Leaderboards
1. Click "🏆 Leaderboards" button
2. You should see:
   - Three tabs: XP, PvP (ELO), Wealth
3. Click each tab to see different leaderboard types
4. Each entry shows rank, player name, and their score/ELO/wealth

### 5. Test Progress Sync
1. Play the game for a bit (complete a skill action, gain items, etc.)
2. Open Developer Tools > Network tab
3. Wait 5 minutes (or check logs)
4. You should see a POST request to `/api/players/sync` with your game data

### 6. Check Console for Errors
```javascript
// In console, look for any red error messages
// Common things to check:
console.log("Gameloop status:", gameInstance.gameLoop);
console.log("Skills:", gameInstance.skillManager.getAllSkills());
console.log("Client connected:", gameClient.isAuthenticated?.());
```

## Known Test Data

The backend comes pre-loaded with test data:
- **Test Players**: player1, player2, player3
- **Test Guilds**: Crimson Collective, Neon Phoenix, Dark Syndicate
- **Test Events**: Hunt the AI (active), Guild Wars Season 1, etc.

## API Testing (if backend needs debugging)

```bash
# Get leaderboard
curl http://localhost:3000/api/leaderboards/xp

# List guilds
curl http://localhost:3000/api/guilds

# List events
curl http://localhost:3000/api/events

# Get player stats (requires auth token)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/players/stats
```

## Common Issues & Fixes

### "Cannot read property 'sync' of undefined"
- Backend might not be running
- Solution: Check `http://localhost:3000/api/health` returns data

### Buttons don't appear in sidebar
- Page didn't load the new HTML
- Solution: Hard refresh (Ctrl+Shift+R) to clear cache

### Styles look broken
- CSS didn't load properly
- Solution: Check Network tab for 404 on css/main.css

### "gameClient is not defined"
- SDK didn't load
- Solution: Check that netrunnerClient.js is in js/ folder

## Performance Expectations

- Page load: < 2 seconds
- Multiplayer view load: < 1 second
- Progress sync: Every 5 minutes (runs in background)
- No noticeable lag during gameplay

## Next Steps After Testing

If all tests pass:
1. ✅ Phase 2.5 is COMPLETE
2. → Move to Phase 3: Performance optimization
3. → Then Phase 4: Production deployment

If issues found:
1. Check console for errors
2. Verify both servers are running
3. Check git status to see what changed
4. Review commit messages for reference

