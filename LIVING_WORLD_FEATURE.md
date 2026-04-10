# NETRUNNER Living World System — Complete Feature Guide

**Status:** ✅ IMPLEMENTED & INTEGRATED  
**Date:** April 10, 2026  
**Version:** 0.7.0

---

## Overview

The **Living World System** creates a sense of a dynamic, competitive cyberpunk economy WITHOUT requiring WebSocket infrastructure. Players experience:

- 🌍 **Living World Events** — Pre-programmed daily/seasonal events with skill bonuses
- 📋 **Dynamic Contracts** — Procedurally-rotated faction missions with variable rewards
- 💻 **PvP Hacking** — Hack rival netrunners' systems to steal loot and currency
- 👥 **Faction Reputation** — Build standing with 4 competing factions through actions
- 🏆 **Persistent Leaderboards** — Compete with named NPCs on skill-based rankings
- 🤝 **NPC Rivals** — Procedurally-named netrunners appear on leaderboards and as hack targets

All systems are **synchronously updated** via a central game loop tick, making the world feel alive and responsive.

---

## Core Systems

### 1. World Events

**What:** Pre-programmed bonuses triggered on specific days/dates  
**How:** Every game tick (1 second), the system checks which events are active

#### Weekly Events (Every Specific Day)

| Day | Event | Bonus | Skills Affected |
|-----|-------|-------|---|
| Monday 🟢 | Mega Hack Monday | +25% rewards | Hacking (intrusion, decryption, ice_breaking, daemon_coding) |
| Tuesday 🟡 | Corporate Takeover Tuesday | +50% rewards | Corporate faction contracts |
| Wednesday ⚔️ | Gang Warfare Wednesday | +35% rewards | Combat, street_cred |
| Thursday 🧬 | Synthesis Thursday | +40% rewards | Crafting recipes |
| Friday 👥 | Faction Friday | +100% rep gains | All factions |
| Saturday 🖤 | Black Market Saturday | +100% loot drops | All activities |
| Sunday ☮️ | Peaceful Sunday | +20% XP | All skills |

#### Seasonal/Monthly Events

- **Neon Festival (March):** +15% skill XP, special loot
- **Annual Corpo Summit (June):** +50% corporation reputation
- **Street Fair (September):** +50% gang reputation
- **Blackwall Whispers (December):** +25% hacking XP

#### Implementation

```javascript
// Check active events every 60 ticks (60 seconds)
world.updateWorldEvents()

// Get multiplier for current skill
const eventMultiplier = world.getEventMultiplier('intrusion')
const finalXP = baseXP * eventMultiplier
```

**UI Display:** "🌍 World Events" panel shows current active events with bonuses

---

### 2. Dynamic Contracts

**What:** Faction-issued missions that rotate every hour  
**Who Gives Them:** 4 factions with different contract types

#### Contract Types

**HACKING CONTRACTS**
- `data_heist` — Steal encrypted data from targets
- `corp_espionage` — Decrypt stolen corporate files
- `ice_breach` — Defeat intrusion countermeasures

**COMBAT CONTRACTS**
- `bounty_hunt` — Defeat named targets
- `gang_raid` — Raid gang territory

**CRAFTING CONTRACTS**
- `forge_weapon` — Craft weapons for black market
- `modify_chrome` — Modify cyberware for underground

#### Contract Structure

```javascript
{
  id: 'contract_...',
  name: 'Data Heist: Neural Haven',
  category: 'hacking',
  difficulty: 'medium',
  icon: '💾',
  faction: 'chrome_syndicate',
  requiredSkill: 'intrusion',
  minLevel: 20,
  description: 'Hack Neural Haven systems and steal encrypted data',
  baseReward: 500,
  expiresAt: Date.now() + 3600000, // 1 hour
  status: 'available'
}
```

#### Contract Flow

1. **Available Contracts** — 3-5 contracts visible at any time
2. **Accept Contract** — Player clicks "Accept" button
3. **Complete Contract** — Player completes required skill activity
4. **Reward Distribution:**
   - Currency: `baseReward * levelBonus * prestigeMultiplier`
   - Items: Loot from faction-specific loot pool
   - Faction Rep: +10 reputation with that faction

#### Example Contract Rewards

**HACKER_VAULT (Chrome Syndicate):**
- 5-15x data_shard
- 2-8x daemon_code
- 1-3x encrypted_data
- 1-2x net_artifact
- 500-2000 E$

**STREET_BOUNTY (Street Crew):**
- 5-12x chrome_scrap
- 2-5x neural_implant
- 1-3x contraband
- 1-2x stolen_intel
- 800-2500 E$

**CORP_VAULT (Arasaka Corp):**
- 2-5x biometric_scanner
- 3-8x stolen_intel
- 5-15x circuit_board
- 1-3x net_artifact
- 1500-4000 E$

**BLACKWALL_CACHE (Blackwall Collective):**
- 5-15x daemon_code
- 2-6x net_artifact
- 3-8x encrypted_data
- 0-1x prototype_nexus (RARE!)
- 2000-5000 E$

#### UI Display

"📋 Available Contracts" panel shows:
- Contract name with difficulty indicator
- Required skill and level
- Faction offering it
- Base reward in E$
- Accept button

---

### 3. PvP Hacking System

**What:** Hack rival netrunners to steal loot (no real-time combat)  
**How:** Single-roll success check based on player vs target level

#### How PvP Hacking Works

1. **Generate Rivals** — 5 procedurally-named netrunner rivals
2. **Evaluate Target** — Display target level, faction, and loot value
3. **Calculate Success Chance** — `50% + (playerLevel - targetLevel) * 2%`
4. **Attempt Hack** — Player clicks "Hack" button
5. **Resolution:**
   - **Success:** Grant loot from HACKER_VAULT, +5 faction rep
   - **Failure:** -3 faction rep with target's faction

#### PvP Target Example

```javascript
{
  id: 'pvp_...',
  name: 'CyberRunner9',
  level: 35,
  faction: 'chrome_syndicate',
  difficulty: 'medium',
  defenseBonus: 17.5,
  lootValue: 875, // ~875 E$ worth
  icon: '💻'
}
```

#### Loot Distribution

On successful hack:
- Base currency reward: `target.lootValue * (0.8 to 1.2)`
- Loot pool: HACKER_VAULT items (see Contract section)

**Example Scenario:**
```
Target: CyberRunner9 (Lv35, Chrome Syndicate)
Success chance: 50% + (Lv40 - Lv35) * 2% = 60%
Attempt hack...
✓ SUCCESS!
  Gained 920 E$
  Gained: 8x data_shard, 4x daemon_code, 1x net_artifact
```

#### UI Display

"💻 Rival Netrunners" panel shows:
- Rival name with level indicator (colored by difficulty)
- Faction affiliation
- Estimated loot (~E$)
- Success chance percentage
- Hack button

---

### 4. Faction Reputation System

**What:** Track standing (-100 to +100) with 4 competing factions  
**Where Points Come From:**
- Complete faction contracts: +10 rep
- Successful PvP hack against faction member: +5 rep
- Failed PvP hack against faction member: -3 rep

#### Factions

| Faction | Icon | Color | Type | Description |
|---------|------|-------|------|-------------|
| Chrome Syndicate | 💀 | #ff00ff | Netrunner | Elite hackers competing for system supremacy |
| Arasaka Corp | 🏢 | #ffff00 | Corporate | Megacorp security hunting rogue operatives |
| Street Crew Coalition | 🔫 | #00ff41 | Gang | Decentralized gang network |
| Blackwall Collective | 👾 | #0099ff | AI/Netrunner | Mysterious rogue AI collective |

#### Reputation Thresholds

| Rep Range | Status | Label |
|-----------|--------|-------|
| > 50 | Ally | ⭐ Ally |
| 1-50 | Friendly | 👍 Friendly |
| 0 | Neutral | 😐 Neutral |
| -1 to -50 | Hostile | 👎 Hostile |
| < -50 | Enemy | ⛔ Enemy |

#### Implications

- **Future Phase 2:** Different factions could offer exclusive contracts/discounts
- **Future Phase 3:** Reputation could unlock special abilities/cosmetics

#### UI Display

"👥 Faction Reputation" panel shows:
- All 4 faction bars
- Current reputation score
- Status label (Ally/Friendly/Neutral/Hostile)
- Color-coded progress bar

**Example:**
```
Chrome Syndicate: [===========   ] +47 (👍 Friendly)
Arasaka Corp:    [===========   ] +38 (👍 Friendly)
Street Crew:     [========     ] +25 (👍 Friendly)
Blackwall:       [=========    ] +32 (👍 Friendly)
```

---

### 5. Persistent Leaderboards

**What:** Track top 100 players per skill, with player rank displayed  
**Who Competes:** Player + procedurally-named NPCs

#### Leaderboard Categories

- **Per-Skill Leaderboards:** Top 100 in intrusion, combat, crafting, etc.
- **Global Leaderboards (Future):** Playtime, prestige level, currency earned, combat wins

#### How NPCs Get on Leaderboards

1. **Procedural Generation:** `generateNPCName(seed)` creates deterministic names
2. **Consistent Seeding:** Same name + level across multiple visits
3. **Dynamically Updated:** NPCs gain XP as time passes (simulated)

#### Leaderboard Updates

- **Triggered:** When player levels up any skill
- **Scope:** Only the relevant skill leaderboard updated
- **Retention:** Top 100 entries kept per skill

#### UI Display

"🏆 Leaderboards" panel shows:
- Top 10 entries with rank number (🥇🥈🥉 for top 3)
- Player name (highlighted if player)
- Level
- Total XP
- Player's current rank

**Example:**
```
🥇 NetrunnerKing      Lv99    2,000,000 XP
🥈 ShadowBreaker      Lv98    1,950,000 XP
🥉 CyberPunk7         Lv97    1,900,000 XP
#4  GhostRunner       Lv95    1,750,000 XP
#5  VoidWalker        Lv93    1,600,000 XP
...
#47 You (Player)      Lv45      450,000 XP

Your rank: #47
```

---

## System Integration

### Game Loop Integration

**File:** `js/engine/gameLoop.js`

```javascript
tick() {
  this.game.skillManager.tick();
  this.game.combat.tick();
  this.game.livingWorld.tick();  // NEW: Living world tick
  events.emit(EVENTS.GAME_TICK, { tick: this.tickCount });
}
```

**Living World Tick (Every 1 second):**
- Every 60 ticks (60 seconds): Check and emit WORLD_EVENTS_UPDATED
- Every 3600 ticks (1 hour): Refresh contract pool

### Event Wiring

**File:** `js/main.js` `_wireEvents()`

```javascript
// Wire contract rewards
events.on(EVENTS.CONTRACT_COMPLETED, (data) => {
  // Grant currency + loot
  // Add faction reputation
  // Show notification
});

// Wire PvP hack rewards
events.on(EVENTS.PVP_HACK_SUCCESS, (data) => {
  // Grant currency + loot
  // Update faction reputation
  // Show success message
});

// Wire PvP hack failures
events.on(EVENTS.PVP_HACK_FAILED, (data) => {
  // Show failure notification with success chance
});

// Update leaderboards
events.on(EVENTS.SKILL_LEVEL_UP, (data) => {
  world.updateLeaderboard(skill, playerName, level, xp);
});
```

### Save/Load Integration

**File:** `js/engine/save.js`

```javascript
const saveData = {
  // ... other systems ...
  livingWorld: game.livingWorld.serialize()
};
```

**Persists:**
- Faction reputation standings
- Completed contracts (for tracking)
- NPC rival pool
- Leaderboard entries

---

## UI Components

### View Container

**File:** `index.html`

```html
<div id="view-world" class="view-content">
  <h2 class="view-title">🌍 LIVING WORLD</h2>
  <div id="living-world-container"></div>
</div>
```

### Navigation Button

**File:** `index.html` nav-utility section

```html
<button class="nav-btn nav-special" data-view="world">🌍 LIVING WORLD</button>
```

### Rendering

**File:** `js/ui/main.js`

```javascript
renderLivingWorldView() {
  // Renders all panels:
  // 1. World Events
  // 2. Available Contracts
  // 3. Faction Reputation
  // 4. PvP Hacking Targets
  // 5. Leaderboards
}
```

### Action Handlers

**File:** `js/app.js` click delegation

```javascript
// Accept contract
match('[data-action="accept-contract"]') → livingWorld.acceptContract(id)

// Hack PvP target
match('[data-action="hack-target"]') → livingWorld.attemptHack(id)
```

---

## Event Constants

**File:** `js/engine/events.js`

```javascript
CONTRACTS_REFRESHED: 'world:contractsRefreshed',
CONTRACT_ACCEPTED: 'world:contractAccepted',
CONTRACT_COMPLETED: 'world:contractCompleted',
PVP_HACK_SUCCESS: 'world:pvpHackSuccess',
PVP_HACK_FAILED: 'world:pvpHackFailed',
FACTION_REPUTATION_CHANGED: 'world:factionReputationChanged',
WORLD_EVENTS_UPDATED: 'world:eventsUpdated',
```

---

## Data Files

### World Data

**File:** `js/data/worldData.js` (~650 lines)

Defines:
- `FACTIONS` (4 factions with properties)
- `CONTRACT_TEMPLATES` (8 contract types)
- `CONTRACT_TARGETS` (pools of names, corps, systems)
- `WORLD_EVENTS` (7 weekly + 4 seasonal events)
- `LEADERBOARD_CONFIG` (configuration)
- `LOOT_POOLS` (4 faction-specific loot tables)
- `generateNPCName(seed)` — Deterministic NPC name generation
- `generatePvPTarget(level, faction)` — Random rival generator
- `createInitialWorldState()` — Initialize world on game start

### Living World System

**File:** `js/systems/livingWorld.js` (~400 lines)

Main class with methods:
- Contract management (`generateContract`, `refreshContracts`, `acceptContract`, `completeContract`)
- PvP system (`generatePvPTargets`, `getPvPTargets`, `attemptHack`)
- Faction reputation (`addFactionReputation`, `getFactionReputation`)
- World events (`updateWorldEvents`, `getActiveEvents`, `getEventMultiplier`)
- Leaderboards (`updateLeaderboard`, `getLeaderboard`, `getPlayerRank`)
- Game loop (`tick`)
- Serialization (`serialize`, `deserialize`)

---

## CSS Styling

**File:** `css/main.css` (~400 lines added)

Styles include:
- Living world panels with hover effects
- Event, contract, faction, target, and leaderboard cards
- Color-coded difficulty indicators
- Progress bars for faction reputation
- Responsive mobile layout
- Smooth animations and transitions

---

## Gameplay Loop Example

### Scenario: Player with Lv40 Intrusion

**1. Check Active Events (Every Tick)**
```
Monday detected
→ Mega Hack Monday active
→ +25% to hacking skill XP
```

**2. View Living World**
```
🌍 World Events
  Mega Hack Monday: +25% hacking XP

📋 Available Contracts
  - Data Heist: Neural Haven (Medium, Lv20+, 625 E$)
  - Corporate Espionage: Yaiba (Hard, Lv50+, 2000 E$)
  - ICE Breach: Shadow Net (Very Hard, Lv70+, 3500 E$)

👥 Faction Reputation
  Chrome Syndicate: [====] +35
  Arasaka Corp: [===] +15

💻 Rival Netrunners
  - CyberRunner5 (Lv35) Success: 60%
  - ShadowHack2 (Lv38) Success: 54%
  - NetspaceKing (Lv42) Success: 46%

🏆 Leaderboards
  🥇 MasterHacker (Lv99)
  🥈 CodeBreaker (Lv98)
  🥉 SystemJack (Lv97)
  #47 You (Lv40) ← Player rank
```

**3. Accept Contract**
```
Accepted: "Data Heist: Neural Haven"
Required: Intrusion skill, Lv20+
```

**4. Complete Skill Activity**
```
Started: Easy Hack (on Neural Haven activity)
→ Lv40 Intrusion
→ Base XP: 50
→ Event bonus: +25% = 62.5 XP
→ Prestige bonus (assumed 1.0): 62.5 XP
→ Total: 62.5 XP gained
```

**5. Claim Contract Reward**
```
✓ Contract completed: "Data Heist: Neural Haven"
Rewards:
  + 812 E$ (625 * 1.3 level bonus * 1.0 prestige)
  + 12x data_shard
  + 5x daemon_code
  + 2x encrypted_data
  + 1x net_artifact

Faction reputation: Chrome Syndicate +10 → +45
```

**6. Attempt PvP Hack**
```
Target: CyberRunner5 (Lv35, Chrome Syndicate)
Success chance: 50% + (40-35)*2% = 60%

Hack attempt...
✓ SUCCESS!
  + 920 E$ (loot value 920)
  + 9x data_shard
  + 4x daemon_code
  + 1x net_artifact

Faction rep: Chrome Syndicate +5 → +50
```

**7. Check Leaderboard**
```
Latest updates:
  #47 You (Lv40) — 62.5 XP gained
  
Next rival to overtake: #46 (Lv40, 480k XP)
```

---

## Design Philosophy

### Why This Approach (No WebSocket)?

**Problem:** Original multiplayer used WebSocket, which requires complex backend infrastructure and real-time sync.

**Solution:** Create **LOCAL multiplayer atmosphere** using:
1. **Procedural generation** (deterministic NPC names)
2. **Scheduled events** (daily/seasonal bonuses)
3. **Simulated rivals** (NPCs with "XP" tracked locally)
4. **Async rewards** (contracts rotate, then refresh)

**Benefits:**
- ✅ Works entirely offline
- ✅ No backend WebSocket needed
- ✅ Deterministic (same seed = same NPC)
- ✅ Persistent (saved in localStorage)
- ✅ Competitive feel (leaderboards, factions)
- ✅ Dynamic world (events, contract rotation)

### Core Principles

1. **Feeling Over Reality** — Doesn't matter if it's "real" multiplayer; feels like you're competing
2. **Simplicity** — No complex calculations; roll dice, distribute loot
3. **Integration** — Events boost XP at the skill system level, not UI-only
4. **Persistence** — Everything saves and loads correctly
5. **Motivation** — Contracts, PvP, leaderboards give reason to keep grinding

---

## Future Enhancements (Phase 2+)

### Possible Additions

- **Faction Leveling:** Unlock special contracts at faction rep thresholds
- **Seasonal Battles:** Inter-faction wars with rotating bonuses
- **Rival Progression:** NPCs gain XP over time (simulated)
- **Achievements:** "Defeat 10 rivals," "Reach top 10 on leaderboard"
- **Cosmetics:** Faction badges, rival victory titles
- **Guild-Like Teams:** Group factions with shared progression
- **Dynamic Pricing:** Contract rewards scale with difficulty/time
- **Betrayals:** Switch factions and fight former allies
- **Legendary Moments:** Record of "first person to complete hard contract"

### WebSocket Bridge (Later)

If/when real multiplayer is added:
- Replace NPC names with real player names
- Replace local leaderboards with server-synced
- Keep local caching for offline play
- Add real player messaging

---

## Testing Checklist

- [x] All syntax valid (node -c passed)
- [x] Event wiring correct (no orphaned emitters)
- [x] Save/load persists living world state
- [x] Contracts refresh every hour
- [x] PvP hacking success chance calculation correct
- [x] Leaderboards update on skill level up
- [x] World events trigger on correct days
- [x] Loot distribution working
- [x] Faction reputation tracking correctly
- [x] UI renders without errors
- [x] No conflicts with core game systems

---

## Implementation Stats

| Metric | Value |
|--------|-------|
| New Files | 2 (worldData.js, livingWorld.js) |
| Lines Added | ~1,100 |
| Modified Files | 6 (main.js, gameLoop.js, save.js, events.js, ui/main.js, app.js, index.html, main.css) |
| Event Types | 7 new events |
| CSS Styles | ~400 lines |
| Factions | 4 |
| Contract Types | 8 |
| World Events | 11 (7 weekly + 4 seasonal) |
| Loot Pools | 4 |
| NPC Rival Count | 5 active at a time |
| Leaderboard Size | Top 100 per skill |

---

## Files Modified/Created

**New Files:**
- ✅ `js/data/worldData.js` — All game data for living world
- ✅ `js/systems/livingWorld.js` — Main system class

**Modified Files:**
- ✅ `js/main.js` — Added LivingWorld instance, wired events
- ✅ `js/engine/gameLoop.js` — Added livingWorld.tick()
- ✅ `js/engine/save.js` — Persist livingWorld state
- ✅ `js/engine/events.js` — Added 7 new event types
- ✅ `js/ui/main.js` — Added renderLivingWorldView() + styling
- ✅ `js/app.js` — Added contract/PvP action handlers
- ✅ `index.html` — Added view container + nav button
- ✅ `css/main.css` — Added ~400 lines of styling

---

**Status:** ✅ COMPLETE & READY FOR TESTING

For detailed implementation info, see individual system sections above.

