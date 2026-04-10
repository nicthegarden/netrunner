# 🚀 NETRUNNER Multiplayer - Phase 3: Performance Optimization Testing Guide

**Date:** April 10, 2026  
**Phase:** 3 - Performance Optimization  
**Status:** Testing Ready

---

## 📋 Overview

Phase 3 adds comprehensive performance optimizations to the multiplayer system:
- **5-minute TTL caching** for leaderboards, guilds, events, and guild wars
- **Visibility-based refresh optimization** - skips expensive API calls when UI is hidden
- **WebSocket reconnection with exponential backoff** - auto-reconnect with up to 5 attempts
- **Graceful error handling** - centralized error handler with user-friendly messages
- **Cache invalidation on events** - automatically clears cache when real-time events occur

---

## ✅ Pre-Testing Checklist

Before running tests, verify:

```bash
# 1. Check git status
cd /home/edve/netrunner
git status
# Expected: working tree clean, 3 commits ahead of origin

# 2. Verify both servers are running
ps aux | grep -E "http.server|node" | grep -v grep
# Expected: Two processes running (game server on 8000, backend on 3000)

# 3. Validate syntax
node -c js/multiplayer.js
# Expected: No output (success)

# 4. Check file size (should be ~557 lines)
wc -l js/multiplayer.js
# Expected: 557 js/multiplayer.js
```

---

## 🧪 Test Cases

### Test 1: Caching Layer Initialization

**Goal:** Verify cache system initializes with correct TTL

**Steps:**
1. Open browser DevTools Console (F12)
2. Navigate to http://localhost:8000
3. Open the browser console and type:
   ```javascript
   window.multiplayerManager.cache
   ```

**Expected Result:**
```
Cache {
  data: Map(0),
  timestamps: Map(0),
  ttl: 300000  // 5 minutes in milliseconds
}
```

**Pass Criteria:** Cache TTL is 300000ms (5 minutes)

---

### Test 2: Leaderboard Caching (First Load)

**Goal:** Verify leaderboard is fetched from API on first access

**Steps:**
1. In console, observe the Network tab (F12 → Network)
2. Click "⚔️ PvP" in sidebar
3. Watch the console for cache log messages

**Expected Output in Console:**
```
Leaderboard fetched from API
PvP stats fetched from API
```

**Expected Network Activity:**
- `GET /leaderboards/elo` → 200 OK
- `GET /pvp/stats/{username}` → 200 OK

**Pass Criteria:** API calls made, console shows "fetched from API"

---

### Test 3: Leaderboard Caching (Second Load - Cache Hit)

**Goal:** Verify leaderboard uses cache within 5-minute window

**Steps:**
1. After Test 2, click away from PvP view (e.g., click Skills)
2. Wait 1 second
3. Click back to "⚔️ PvP" view
4. Observe console output

**Expected Output in Console:**
```
Leaderboard retrieved from cache
PvP stats retrieved from cache
```

**Expected Network Activity:**
- NO new API calls to leaderboards or pvp/stats

**Pass Criteria:** No API calls made, console shows "retrieved from cache"

---

### Test 4: Cache Invalidation on Event

**Goal:** Verify cache is cleared when real-time events occur

**Steps:**
1. Simulate a duel completion (backend sends WebSocket event)
2. Check console for cache clearing

**Command (run in separate terminal on backend):**
```bash
# This would trigger a duel:finished event in a real scenario
# For testing, we can simulate by watching the WebSocket listener
```

**Expected Behavior:**
- WebSocket event received: `duel:finished`
- Console shows: `Cache cleared on game event`
- Next PvP UI refresh fetches fresh data from API

**Pass Criteria:** Cache is cleared when events occur

---

### Test 5: Visibility-Based Refresh Optimization

**Goal:** Verify expensive API calls are skipped when UI is hidden

**Steps:**
1. Open DevTools Network tab
2. Navigate to PvP view
3. Record API calls (should be made)
4. Hide the PvP view (click different tab)
5. Wait 2 seconds
6. Trigger manual refresh by calling:
   ```javascript
   window.multiplayerManager.refreshPvPUI()
   ```
7. Check Network tab

**Expected Result:**
- When view is hidden (display: none), the method returns early
- No new API calls are made
- Console shows early return: `return; // UI not visible`

**Pass Criteria:** No API calls when UI is hidden

---

### Test 6: Guild Caching

**Goal:** Verify guild list caching works the same as leaderboards

**Steps:**
1. Click "🏰 Guilds" tab
2. Check console for "Guilds fetched from API"
3. Click away and back to guilds tab
4. Check console for "Guilds retrieved from cache"

**Expected Network Activity:**
- First load: API call to `GET /guilds`
- Second load: NO API calls (cached data used)

**Pass Criteria:** Guild data is cached and reused

---

### Test 7: Event Caching

**Goal:** Verify event list caching

**Steps:**
1. Click "📅 Events" tab
2. Console should show: "Events fetched from API"
3. Click away and back
4. Console should show: "Events retrieved from cache"

**Expected Network Activity:**
- First load: API calls to `/events` and `/events/guild-wars`
- Second load within 5min: NO API calls

**Pass Criteria:** Event data is cached and reused

---

### Test 8: WebSocket Connection Status

**Goal:** Verify WebSocket connects successfully

**Steps:**
1. Open browser console
2. Look for connection message
3. In devtools, check Network → WS tab (WebSocket section)

**Expected Console Output:**
```
✓ WebSocket connected
🟢 Connected to server
```

**Expected Network Tab:**
- WebSocket connection established to `ws://localhost:3000`
- Status: `101 Web Socket Protocol Handshake`

**Pass Criteria:** WebSocket connects without errors

---

### Test 9: WebSocket Reconnection Logic

**Goal:** Verify auto-reconnection works when connection drops

**Steps:**
1. Stop the backend server:
   ```bash
   pkill -f "node test-server.js"
   ```
2. Wait 2 seconds and observe browser console
3. Restart the backend server:
   ```bash
   cd /home/edve/netrunner/backend && node test-server.js
   ```
4. Observe reconnection attempt

**Expected Console Output:**
```
✗ WebSocket disconnected, attempting reconnect...
🔄 Reconnecting... (1/5)
# Wait 1 second
✓ WebSocket connected
🟢 Connected to server
```

**Expected Behavior:**
- Initial connection fails
- Exponential backoff timer starts: 1s, 2s, 4s, 8s, 16s
- Auto-reconnect succeeds after server restarts
- User sees notification: "🔄 Reconnecting... (1/5)"

**Pass Criteria:** Auto-reconnection succeeds within 5 attempts

---

### Test 10: Error Boundary - Network Error Handling

**Goal:** Verify graceful error handling when API calls fail

**Steps:**
1. Stop backend server again
2. Try to click "⚔️ PvP" and trigger a refresh
3. Observe error message in UI

**Expected User Experience:**
- Error message displayed in PvP stats container:
  ```
  ⚠️ Error refreshing PvP UI: [error details]
  Data may be outdated or unavailable.
  ```
- User sees notification: "⚠️ Error refreshing PvP UI"
- Game continues to function (no crash)

**Pass Criteria:** Graceful error handling, no crash, informative message

---

### Test 11: Cache Expiration (Stale Data)

**Goal:** Verify cache expires after 5 minutes

**Steps:**
1. Load PvP view and cache leaderboard
2. Manually set cache entry to old timestamp (in console):
   ```javascript
   // Get current cache entry
   const cache = window.multiplayerManager.cache;
   const oldTime = Date.now() - (6 * 60 * 1000); // 6 minutes ago
   cache.timestamps.set('pvp_leaderboard', oldTime);
   ```
3. Call refreshPvPUI() again:
   ```javascript
   window.multiplayerManager.refreshPvPUI()
   ```
4. Check console for cache refresh

**Expected Output:**
- Console shows: "Leaderboard fetched from API" (not from cache)
- New API call made to refresh stale data

**Pass Criteria:** Stale cache entries are refetched automatically

---

### Test 12: Mobile Responsiveness

**Goal:** Verify caching works on mobile view (visibility optimization)

**Steps:**
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select "iPhone 12" or similar
3. Navigate to each multiplayer view
4. Observe that visibility check prevents unnecessary API calls

**Expected Behavior:**
- Responsive design maintained
- Caching still works on mobile
- Bottom tabs visible for easy navigation

**Pass Criteria:** Caching optimizations work on mobile

---

## 📊 Performance Expectations

### Before Phase 3 Optimization
- Leaderboard load time: ~200-300ms (API call)
- Guild list load time: ~150-250ms (API call)
- Switching tabs with current data: ~200-300ms (refresh all)

### After Phase 3 Optimization
- First load: ~200-300ms (API call, same as before)
- Cached load (within 5min): ~5-10ms (memory access only)
- **Improvement:** 95% faster for cached data
- **Bandwidth savings:** 30-40% reduction in API calls during normal usage

### API Call Reduction
- **Before:** Every tab switch triggers 3-5 API calls
- **After:** First tab switch triggers API calls, subsequent switches use cache
- **Impact:** 60-70% fewer API calls during 1-hour gameplay session

---

## 🔍 Debugging Tips

### View Cache Contents
```javascript
// View all cached data
window.multiplayerManager.cache.data

// View cache timestamps
window.multiplayerManager.cache.timestamps

// Clear cache manually
window.multiplayerManager.cache.clear()

// Check if key is stale
window.multiplayerManager.cache.isStale('pvp_leaderboard')
```

### View WebSocket Status
```javascript
// Check reconnection attempt count
window.multiplayerManager.wsReconnectAttempts

// Check WebSocket ready state
window.gameClient?.ws?.readyState
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

### View Recent Notifications
```javascript
// Check notification container
document.getElementById('notifications').children
```

---

## ✨ Common Issues & Fixes

### Issue: Cache shows empty after refresh
**Cause:** Cache was cleared by game event
**Fix:** Cache clears intentionally on important events (duels, guild joins). Refresh will repopulate.

### Issue: "Reconnecting... (5/5)" appears and doesn't reconnect
**Cause:** Backend server is not running or unreachable
**Fix:** Restart backend server: `cd /home/edve/netrunner/backend && node test-server.js`

### Issue: "Error loading stats" message appears
**Cause:** Not logged in or username not set
**Fix:** Ensure game.player.username is set before accessing PvP

### Issue: API calls still happening on cached data
**Cause:** Cache TTL expired (5 minutes passed) or cache was manually cleared
**Fix:** This is expected behavior - cache expires after 5 minutes for fresh data

### Issue: Hidden UI still making API calls
**Cause:** Element exists but is not display:none
**Fix:** Verify element's display property is actually "none" in CSS

---

## 📝 Manual Testing Checklist

- [ ] Cache initializes with 5-minute TTL
- [ ] First load fetches from API
- [ ] Second load within 5min uses cache
- [ ] Cache invalidates on WebSocket events
- [ ] Hidden UI skips expensive refreshes
- [ ] Guild data caches correctly
- [ ] Event data caches correctly
- [ ] Guild wars data caches correctly
- [ ] WebSocket connects successfully
- [ ] WebSocket auto-reconnects on disconnect
- [ ] Errors display gracefully without crashing
- [ ] Cache expires after 5 minutes
- [ ] Mobile view works with caching
- [ ] Console shows cache hit/miss logs
- [ ] No memory leaks (cache size stays reasonable)

---

## 🎯 Success Criteria for Phase 3

Phase 3 is complete when:
1. ✅ All 12 test cases pass
2. ✅ Performance metrics show 95% faster cached loads
3. ✅ API calls reduced by 60-70% during normal gameplay
4. ✅ WebSocket reconnection succeeds within 5 attempts
5. ✅ Error handling is graceful with informative messages
6. ✅ No console errors on normal operations
7. ✅ Mobile responsiveness maintained
8. ✅ Documentation is complete

---

## 📦 Files Modified in Phase 3

```
js/multiplayer.js         +192 lines (365 → 557 lines)
  - Added Cache class (37 lines)
  - Enhanced constructor with cache & reconnection state (5 lines)
  - Enhanced setupWebSocketListeners() with reconnection (67 lines)
  - Added attemptReconnect() method (20 lines)
  - Enhanced refreshPvPUI() with caching (46 lines)
  - Enhanced refreshGuildUI() with caching (20 lines)
  - Enhanced refreshEventUI() with caching (19 lines)
  - Added handleError() method (14 lines)
  - Enhanced displayMyGuild() with caching (24 lines)
  - Enhanced renderGuildWars() with caching (28 lines)
  - Updated global functions with cache invalidation (7 lines)
```

---

## 🚀 Next Steps (Phase 4)

After Phase 3 testing is complete:
1. Commit optimizations to git
2. Create PHASE3_COMPLETE.md documentation
3. Begin Phase 4: Production Deployment
   - Deploy to DigitalOcean or similar
   - Configure DNS and SSL/TLS
   - Setup monitoring and alerting
   - Create deployment runbook

---

**Document Status:** Ready for Testing  
**Last Updated:** April 10, 2026
