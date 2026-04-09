# AGENTS.md - NETRUNNER Developer Guide

A comprehensive guide for AI agents working on the NETRUNNER codebase. This document covers architecture, conventions, known issues, game balance, and detailed content specifications to enable efficient development and modifications.

---

## 1. PROJECT OVERVIEW

### What is NETRUNNER?

**NETRUNNER** is a browser-based idle/incremental game inspired by Melvor Idle and RuneScape, set in a cyberpunk universe. Players grind 24 different skills across 6 categories, fight enemies, craft items, manage inventory, and climb a prestige ladder for permanent bonuses.

**Genre:** Cyberpunk idle game (grindy, afk-friendly, rewards offline progress)
**Theme:** Hacking, netrunning, street combat, corporate espionage, cyberware modification
**Platform:** Browser (no backend, pure localStorage)
**Target:** Casual players who enjoy idle/incremental games

### Tech Stack

- **Language:** Vanilla JavaScript ES6 (no TypeScript, no build step)
- **Modules:** ES6 `import`/`export` (native browser modules, no bundler)
- **Markup:** HTML5
- **Styling:** CSS3 (Flexbox, Grid, animations, CRT scanlines)
- **State:** Browser `localStorage` (JSON serialization)
- **Libraries/Dependencies:** ZERO (100% vanilla, no npm, no frameworks)
- **Dev Server:** Optional `serve.sh` (Python or Node http-server)

### How to Run

```bash
# Option 1: Use the provided shell script
bash serve.sh

# Option 2: Use Python directly
python3 -m http.server 8000

# Option 3: Open index.html directly (limited offline support)
open index.html
```

Then navigate to `http://localhost:8000` (or file:// URL).

### File Structure Overview

```
/home/edve/netrunner/
├── index.html                    # Single HTML page (196 lines)
├── js/
│   ├── app.js                    # Bootstrap & event delegation (533 lines)
│   ├── main.js                   # Game class & singleton (~275 lines)
│   ├── engine/
│   │   ├── events.js             # EventBus + 26 event constants
│   │   ├── gameLoop.js           # 1-second tick system (48 lines)
│   │   ├── save.js               # Save/load/export/import + migrations
│   │   └── offline.js            # Offline progress calculator (59 lines)
│   ├── systems/
│   │   ├── skills.js             # 24 skills, XP, mastery (360 lines)
│   │   ├── combat.js             # Real-time tick-based combat (~480 lines)
│   │   ├── player.js             # Profile + 14 achievements (101 lines)
│   │   ├── inventory.js          # Item slots & stacking (108 lines)
│   │   ├── economy.js            # Currency + multipliers (66 lines)
│   │   ├── equipment.js          # 3 equipment slots + bonuses (97 lines)
│   │   ├── crafting.js           # 20+ recipes (295 lines)
│   │   ├── prestige.js           # Reset system + 12 upgrades (194 lines)
│   │   ├── passiveStats.js       # Aggregated passive stat bonuses (163 lines)
│   │   └── abilities.js          # 72 combat abilities, cooldowns, auto-cast (351 lines)
│   ├── ui/
│   │   └── main.js               # UI rendering, 9 views (~860 lines)
│   └── data/
│       └── skillData.js          # All game data (~1238 lines)
├── css/
│   └── main.css                  # Cyberpunk theme (~1800 lines)
├── README.md, QUICKSTART.md, FEATURES.md, STATUS.md
└── serve.sh
```

**Total codebase:** ~6,500 lines (JS + HTML + CSS across 17 files)

---

## 2. ARCHITECTURE & CODE MAP

### Layer Diagram

```
┌─────────────────────────────────────────────────┐
│ UI Layer (ui/main.js)                           │
│ ├─ Renders: skills, inventory, shop, combat,    │
│ │   passives, abilities, prestige, changelog     │
│ ├─ Listens to events: SKILL_LEVEL_UP, COMBAT_*, │
│ │   ABILITY_ACTIVATED                            │
│ └─ Updates: 500ms polling + event-driven        │
├─ Event Bus (engine/events.js)                   │
│ └─ Pub/sub decoupling: 26 event types           │
├─────────────────────────────────────────────────┤
│ Game Orchestrator (main.js Game class)          │
│ ├─ Owns all subsystems                          │
│ ├─ Wires events: rewards distribution,          │
│ │   achievement checks, etc.                    │
│ └─ Handles: init, reset, save/load              │
├─────────────────────────────────────────────────┤
│ Systems Layer (systems/*.js)                    │
│ ├─ Skills (24 skills, XP, mastery)              │
│ ├─ Combat (tick-based, enemies, crits, evasion) │
│ ├─ Inventory (100 slots, stacking)              │
│ ├─ Equipment (3 slots: weapon, armor, cyberware)│
│ ├─ Economy (currency, multipliers)              │
│ ├─ Crafting (20+ recipes)                       │
│ ├─ Prestige (reset + 12 upgrades)               │
│ ├─ Player (profile, 14 achievements)            │
│ ├─ PassiveStats (10 stats from skills/equip/    │
│ │   prestige — single source of truth)           │
│ ├─ AbilityManager (72 abilities, cooldowns,     │
│ │   auto-cast, active effects/buffs/debuffs)     │
│ └─ [All emit events, never call each other]     │
├─────────────────────────────────────────────────┤
│ Engine Layer (engine/*.js)                      │
│ ├─ GameLoop (1-second tick dispatch)            │
│ ├─ SaveManager (localStorage, migrations)       │
│ ├─ OfflineProgress (24h cap, batch processing)  │
│ └─ EventBus (all events flow through here)      │
├─────────────────────────────────────────────────┤
│ Data Layer (data/skillData.js)                  │
│ ├─ SKILLS (24 definitions)                      │
│ ├─ ITEMS (35+ item definitions)                 │
│ ├─ ENEMIES (11+ enemy types + 5 bosses)         │
│ ├─ ACTIVITIES (120 activities across skills)    │
│ ├─ SHOP_ITEMS (20 shop entries)                 │
│ ├─ PASSIVE_BONUSES (24 skill→stat mappings)     │
│ ├─ SKILL_ABILITIES (72 ability definitions)     │
│ └─ XP formula + precomputed tables               │
├─────────────────────────────────────────────────┤
│ App Bootstrap (app.js)                          │
│ ├─ Initializes Game + UI                        │
│ ├─ Delegated click handler for all buttons      │
│ ├─ Modal management                             │
│ └─ 500ms polling loop                           │
└─────────────────────────────────────────────────┘
```

### The Game Singleton

`main.js` exports a `Game` class that acts as the god object. One instance is created in `app.js`:

```javascript
class Game {
  // All subsystems as properties
  player: Player
  skillManager: SkillManager
  inventory: Inventory
  economy: Economy
  equipment: Equipment
  combat: Combat
  achievements: Achievements
  crafter: Crafter
  prestige: Prestige
  passiveStats: PassiveStats
  abilityManager: AbilityManager
  gameLoop: GameLoop
  saveManager: SaveManager
  offlineProgress: OfflineProgress

  // Key methods
  init()                        // Load save, setup offline, start game loop
  saveGame()                    // Serialize all, write to localStorage
  loadGame(saveData)            // Deserialize all subsystems
  resetGame()                   // Clear state, reinitialize
  exportSave()                  // Base64 export
  importSave(b64)               // Base64 import
  shutdown()                    // Cleanup
}

// Module exports
export const gameInstance = new Game()
export function initGame() { ... }
export function getGame() { return gameInstance }
```

### The EventBus: 26 Event Types

All events flow through a central `EventBus` singleton. Systems emit events; orchestrators listen and wire actions.

| Category | Event Constant | Payload | Producer | Consumer |
|----------|---|---|---|---|
| **Lifecycle** | `GAME_LOADED` | `{}` | `main.js` init | UI init |
| | `GAME_SAVED` | `{}` | `SaveManager.save()` | (logging) |
| | `GAME_TICK` | `{ tick, prestigeReset? }` | `GameLoop.tick()` | `main.js` (playtime) |
| | `GAME_RESET` | `{}` | `Game.resetGame()` | (cleanup) |
| **Skills** | `SKILL_XP_GAINED` | `{ skill, xp, currentXP, currentLevel }` | `Skill.gainXP()` | (logging) |
| | `SKILL_LEVEL_UP` | `{ skill, skillName, newLevel }` | `Skill.levelUp()` | `main.js` achievements check, UI notify |
| | `SKILL_STARTED` | `{ skill, action, actionName }` | `Skill.startAction()` | UI update |
| | `SKILL_STOPPED` | `{ skill }` | `Skill.stopAction()` | UI update |
| | `SKILL_ACTION_COMPLETE` | `{ skill, action, xp, rewards }` | `Skill.completeAction()` | `main.js` distribute rewards |
| **Mastery** | `MASTERY_XP_GAINED` | `{ skill, action, xp, masteryLevel }` | `Skill.gainMasteryXP()` | (logging) |
| | `MASTERY_LEVEL_UP` | `{ skill, action, newLevel }` | `Skill.gainMasteryXP()` | (logging) |
| **Combat** | `COMBAT_STARTED` | `{ enemy, playerHp }` | `Combat.startCombat()` | UI update |
| | `COMBAT_HIT` | `{ attacker, damage, enemyHp, playerHp, ... }` | `Combat.tick()` | UI update |
| | `COMBAT_ENEMY_DEFEATED` | `{ enemy, xp, loot }` | `Combat.processVictory()` | `main.js` grant XP + achievements |
| | `COMBAT_PLAYER_DIED` | `{ enemy }` | `Combat.endCombat(false)` | UI notify |
| | `COMBAT_ENDED` | `{ reason }` | `Combat.stopCombat()` | UI update |
| **Economy** | `CURRENCY_CHANGED` | `{ currency, totalEarned, totalSpent }` | `Economy.add/removeCurrency()` | UI display, `main.js` achievements |
| **Inventory** | `ITEM_GAINED` | `{ item, quantity, icon }` | `Inventory.addItem()` | UI notify |
| | `ITEM_REMOVED` | `{ item, quantity }` | `Inventory.removeItem()` | (logging) |
| | `INVENTORY_CHANGED` | `[full inventory array]` | `Inventory.add/removeItem()` | `main.js` collector achievement |
| | `INVENTORY_FULL` | `{ item }` | `Inventory.addItem()` | (unused) |
| **Player** | `ACHIEVEMENT_UNLOCKED` | `{ id, name, description }` | `Achievements.unlock()` | UI notify |
| **UI** | `UI_NOTIFICATION` | `{ message, type, transient? }` | (any system) | UI notify |
| | `UI_NAVIGATE` | (unused) | - | - |
| | `UI_UPDATE` | (unused) | - | - |
| **Abilities** | `ABILITY_ACTIVATED` | `{ abilityName, icon, type, value }` | `Combat.tick()` | UI notify |

**Key Points:**
- Events are emitted synchronously, not queued
- Each listener wrapped in try/catch; failure doesn't block other listeners
- Listeners use unsubscribe handles for cleanup on reset
- `UI_NOTIFICATION` is used by crafting, prestige, offline, and error cases

### Data Flow: A Complete Tick

```
GameLoop.tick() [every 1000ms]
  |
  ├─> skillManager.tick()
  |   ├─ For each active skill:
  |   │  ├─ Advance actionProgress
  |   │  ├─ If complete: skill.completeAction()
  |   │  │  ├─ Emit SKILL_ACTION_COMPLETE { xp, rewards }
  |   │  │  └─ [MAIN.JS WIRING NEEDED: distribute rewards]
  |   │  └─ If level up: Emit SKILL_LEVEL_UP
  |   └─ [UI LISTENS: update progress bars]
  |
  ├─> combat.tick()
  |   ├─ Decrement attack timers
  |   ├─ If player attacks: roll damage, emit COMBAT_HIT
  |   │  └─ [UI LISTENS: update HP bars]
  |   ├─ If enemy attacks: roll damage, emit COMBAT_HIT
  |   │  └─ [UI LISTENS: update HP bars]
  |   ├─ If enemy dies: Emit COMBAT_ENEMY_DEFEATED { xp, loot }
  |   │  ├─ [MAIN.JS WIRING: grant XP to combat skill]
  |   │  └─ [MAIN.JS WIRING: check first_kill achievement]
  |   └─ If player dies: Emit COMBAT_PLAYER_DIED
  |       └─ [UI LISTENS: show death notification]
  |
  ├─> Emit GAME_TICK
  |   └─ [MAIN.JS LISTENS: player.addPlayTime(1)]
  |
  └─> [Every 30s] SaveManager auto-saves to localStorage
```

### Save/Load Lifecycle

```
App starts
  |
  ├─> SaveManager.load()
  |   ├─ Read from localStorage[netrunner_save]
  |   ├─ Validate structure (required keys: player, skills, inventory, economy)
  |   ├─ Migrate if version < CURRENT_SAVE_VERSION
  |   │  └─ v1->v2: adds totalSpent, prestige, stats
  |   └─ Return parsed data or null
  |
  ├─> If save exists: OfflineProgress.calculate(saveData.timestamp)
  |   ├─ elapsed = min(Date.now() - timestamp, 24 hours)
  |   ├─ If elapsed < 1 minute: skip
  |   └─ Compute ticks needed
  |
  ├─> OfflineProgress.apply(ticks)
  |   ├─ Process in batches of 200
  |   ├─ Call gameLoop.processTicks(200) per batch
  |   │  └─ [CRITICAL: processTicks does NOT emit GAME_TICK]
  |   ├─ Emit UI_NOTIFICATION with progress %
  |   └─ Async/await with browser yielding
  |
  ├─> GameLoop.start()
  |   └─ Begin 1-second tick interval
  |
  └─> SaveManager.startAutoSave()
      └─ Every 30s: serialize all systems to localStorage
```

### Equipment & Combat Interaction

Equipment has 3 slots: `weapon`, `armor`, `cyberware`. Each slot is optional (can be `null`).

```
Combat.tick()
  |
  ├─> getPlayerDamage()
  |   ├─ baseDamage = 3 + floor(skillLevel * 0.5)
  |   ├─ +equipment.weapon.damage (if equipped)
  |   ├─ +equipment.cyberware.damage (if equipped)
  |   ├─ +50% if combat_stim buff active
  |   ├─ Add ±25% variance
  |   └─ Return final damage
  |
  └─> getEnemyDamage()
      ├─ baseDamage = enemy.damage
      ├─ -floor(equipment.armor.defense * 0.5) (halved)
      ├─ -floor(equipment.cyberware.defense * 0.5) (halved)
      ├─ Add ±25% variance
      └─ Return final damage
```

**Special Effects (Dead Code Warning):** Equipment can have `xpBoost`, `speedBoost`, `lifeSteal`, `lootBoost`, `currencyBoost` properties. The UI reads these but **nothing in the game loop consumes them**. This is unfinished Tier 4b functionality.

---

## 3. CONVENTIONS & PATTERNS

### File Organization

1. **One class per system file** (e.g., `skills.js` = `Skill` + `SkillManager`)
2. **Data isolated in `skillData.js`** (not in system files)
3. **No circular imports** (data -> systems -> ui -> app -> main)
4. **Module scope**: each module is a namespace; use named exports

### Class Structure Template

Every system follows this pattern:

```javascript
import { events, EVENTS } from '../engine/events.js';
import { DATA_CONSTANTS } from '../data/skillData.js';

export class MySystem {
  constructor(dependencies...) {
    this.dep1 = dep1;
    // Initialize state
  }

  // Public methods
  publicMethod() { ... }

  // Event emissions
  _emitEvent(data) {
    events.emit(EVENTS.MY_EVENT, data);
  }

  // Serialization (required)
  serialize() {
    return { ... };
  }

  deserialize(data) {
    // Restore from save
  }
}
```

### Event-Driven Decoupling

**CRITICAL PATTERN:** Systems never call each other directly. Instead:

1. **System A emits an event** with relevant data
2. **System B (or orchestrator) listens** and takes action
3. **No hard dependency** between A and B

Example: Skill completion does NOT grant items/currency:

```javascript
// skills.js - CORRECT (event-driven)
completeAction() {
  const rewards = { /* ... */ };
  events.emit(EVENTS.SKILL_ACTION_COMPLETE, { 
    skill: this, 
    xp: 50, 
    rewards: rewards 
  });
  // NO: this.inventory.addItem(...) ← WRONG
  // NO: this.economy.addCurrency(...) ← WRONG
}

// main.js - Orchestrator listens and distributes rewards
events.on(EVENTS.SKILL_ACTION_COMPLETE, (data) => {
  // Grant items
  Object.entries(data.rewards.items).forEach(([itemId, qty]) => {
    game.inventory.addItem(itemId, qty);
  });
  // Grant currency
  game.economy.addCurrency(data.rewards.currency);
});
```

### Serialization Convention

Every system that holds state must implement `serialize()` and `deserialize(data)`:

```javascript
serialize() {
  // Return a plain object (no functions, no circular refs)
  return {
    field1: this.field1,
    field2: this.field2,
  };
}

deserialize(data) {
  if (!data) return;
  this.field1 = data.field1 || defaultValue;
  this.field2 = data.field2 || defaultValue;
}
```

SaveManager calls these automatically on save/load. Format must be JSON-serializable.

### Data Attribute Contract (UI Buttons)

All interactive elements use `data-*` attributes matched by delegated click handler in `app.js`:

```html
<!-- Skill action button -->
<button data-action="start-activity" data-skill-id="intrusion" data-action-id="easy_hack">
  Start
</button>

<!-- Shop item button -->
<button data-action="buy-shop-item" data-item-id="pistol" data-cost="500" data-quantity="1">
  Buy
</button>

<!-- Equipment button -->
<button data-action="equip-item" data-item-id="kevlar_bodysuit">
  Equip
</button>
```

The click handler matches these patterns and dispatches to appropriate functions in `app.js`.

### ID Naming Convention

- **Skill IDs:** `snake_case`, e.g., `'intrusion'`, `'deep_dive'`, `'combat'`
- **Item IDs:** `snake_case`, e.g., `'data_shard'`, `'healing_nanobots'`, `'combat_stim'`
- **Enemy IDs:** `snake_case`, e.g., `'street_gang'`, `'black_ice'`, `'rogue_ai'`
- **Activity IDs:** `snake_case`, e.g., `'easy_hack'`, `'gang_fight'`, `'spirit_walk'`
- **Event constants:** `SCREAMING_SNAKE_CASE`, e.g., `SKILL_XP_GAINED`, `COMBAT_STARTED`

### Prestige Integration

Prestige is passed to systems that need multipliers:

```javascript
// In main.js constructor wiring
skillManager.prestige = prestige;
economy.prestige = prestige;

// In systems
gainXP(amount) {
  const multiplier = this.prestige?.getXPMultiplier() ?? 1.0;
  const totalXP = amount * multiplier;
  this.xp += totalXP;
}
```

Prestige provides:
- `getXPMultiplier()` → number (1.0 + 0.01*level + purchases)
- `getCurrencyMultiplier()` → number
- `bonuses.masteryXpBonus` → number
- `bonuses.materialDropBonus` → number

---

## 4. COMMON TASKS GUIDE

### Add a New Skill

1. **Add to `SKILLS` object in `skillData.js`:**
   ```javascript
   export const SKILLS = {
     MY_SKILL: {
       id: 'my_skill',
       name: 'My Skill',
       category: 'hacking', // one of 6 categories
       description: 'Brief description',
       icon: '🎯', // emoji
       color: '#00ff41', // hex (should match category)
     },
   };
   ```

2. **Add activities to `ACTIVITIES` object in `skillData.js`:**
   ```javascript
   export const ACTIVITIES = {
     my_skill: [
       {
         id: 'activity_1',
         name: 'Easy Task',
         level: 1,
         duration: 5, // seconds (for non-combat)
         xp: 10,
         masteryXp: 3,
         rewards: {
           items: { 'data_shard': { min: 1, max: 2 } },
           currency: { min: 5, max: 20 }
         },
       },
       // ... more activities (at levels 1, 15-30, 40-60, 70, 90)
     ],
   };
   ```

3. **Add nav button to `index.html`:**
   ```html
   <button class="nav-btn" data-skill-id="my_skill" data-category="hacking">
     🎯 My Skill
   </button>
   ```

4. **UI auto-discovers** via `skillManager.getSkillsByCategory('hacking')`

### Add a New Item

1. **Add to `ITEMS` object in `skillData.js`:**
   ```javascript
   export const ITEMS = {
     MY_ITEM: {
       id: 'my_item',
       name: 'My Item Name',
       type: 'material', // material, weapon, armor, cyberware, consumable, currency
       icon: '🔮',
       stackable: true, // or false
       value: 100, // sell price in E$
       damage: 0, // if weapon/cyberware
       defense: 0, // if armor/cyberware
       xpBoost: 0, // if cyberware (0.10 = +10%)
       speedBoost: 0, // if cyberware/armor
       lootBoost: 0, // if cyberware
       currencyBoost: 0, // if cyberware
     },
   };
   ```

2. **Reference in activities/loot tables:**
   ```javascript
   // Activity reward
   rewards: {
     items: { 'my_item': { min: 1, max: 3 } },
     currency: { min: 50, max: 200 }
   }

   // Enemy loot table
   loot: { 'my_item': { min: 1, max: 2 }, 'eurodollar': { min: 50, max: 150 } }
   ```

3. **Add to shop (optional):**
   ```javascript
   export const SHOP_ITEMS = [
     {
       id: 'my_item',
       name: 'My Item Name',
       icon: '🔮',
       cost: 500, // E$
       category: 'material', // for filtering
       tier: 2, // 1=early, 2=mid, 3=late, 4=endgame
       description: 'Brief description',
       costPerformance: 'efficient', // budget, efficient, high-value, premium, exotic
     },
   ];
   ```

### Add a New Enemy

1. **Add to `ENEMIES` object in `skillData.js`:**
   ```javascript
   export const ENEMIES = {
     MY_ENEMY: {
       id: 'my_enemy',
       name: 'My Enemy Name',
       hp: 50, // base HP
       damage: 5, // base damage
       xpReward: 150,
       loot: {
         'data_shard': { min: 1, max: 3 },
         'eurodollar': { min: 50, max: 200 },
       },
     },
   };
   ```

2. **Reference in combat activities:**
   ```javascript
   combat: [
     {
       id: 'fight_my_enemy',
       name: 'Fight My Enemy',
       level: 40,
       enemy: 'my_enemy', // references ENEMIES id
       xp: 100,
       masteryXp: 30,
     },
   ];
   ```

3. **UI auto-discovers** when activity is selected

### Add a Crafting Recipe

1. **Add to `CRAFT_RECIPES` in `crafting.js`:**
   ```javascript
   export const CRAFT_RECIPES = {
     my_recipe: {
       name: 'Craft My Item',
       category: 'material', // weapon_upgrade, armor, cyberware, consumable, material
       level: 50, // required skill level
       requiredSkill: 'cyberware_crafting', // skill id
       inputs: {
         'circuit_board': 5,
         'neural_implant': 2,
       },
       outputs: {
         'my_item': 1,
       },
       currencyCost: 1000, // E$
     },
   };
   ```

2. **UI auto-discovers** via `crafter.getAvailableRecipes()`

### Add an Achievement

1. **Add to `Achievements` constructor in `player.js`:**
   ```javascript
   export class Achievements {
     constructor() {
       this.achievements = {
         my_achievement: {
           id: 'my_achievement',
           name: 'My Achievement',
           description: 'Description of unlock condition',
           unlocked: false,
         },
         // ... more achievements
       };
     }
   }
   ```

2. **Add trigger logic to `main.js` `_wireEvents()`:**
   ```javascript
   events.on(EVENTS.SKILL_LEVEL_UP, (data) => {
     if (data.newLevel === 50) {
       game.achievements.unlock('my_achievement');
     }
   });

   // Or for combat:
   events.on(EVENTS.COMBAT_ENEMY_DEFEATED, (data) => {
     if (data.enemy === 'my_enemy') {
       game.achievements.unlock('my_achievement');
     }
   });
   ```

3. **UI auto-discovers** and shows notification on unlock

### Add a Prestige Upgrade

1. **Add to `PRESTIGE_UPGRADES` in `prestige.js`:**
   ```javascript
   export const PRESTIGE_UPGRADES = {
     my_upgrade: {
       id: 'my_upgrade',
       name: 'My Upgrade',
       description: 'Brief effect description',
       cost: 20, // prestige points
       bonus: { xpMultiplier: 1.05 }, // or currencyMultiplier, masteryXpBonus, etc.
     },
   };
   ```

2. **Bonus is applied multiplicatively in `recalculateBonuses()`**

3. **UI auto-discovers** in prestige shop view

### Add a New Event Type

1. **Add constant to `EVENTS` in `engine/events.js`:**
   ```javascript
   export const EVENTS = {
     MY_NEW_EVENT: 'my:event',
     // ...
   };
   ```

2. **Emit from system:**
   ```javascript
   events.emit(EVENTS.MY_NEW_EVENT, { data: 'payload' });
   ```

3. **Listen in orchestrator or UI:**
   ```javascript
   events.on(EVENTS.MY_NEW_EVENT, (data) => {
     // Handle event
   });
   ```

### Add a Save Migration

1. **Add migration function to `save.js`:**
   ```javascript
   const MIGRATIONS = {
     1: (data) => {
       // Transform v1 → v2
       if (!data.economy.totalSpent) data.economy.totalSpent = 0;
       if (!data.prestige) data.prestige = { level: 0, totalResets: 0, points: 0 };
       data.version = 2;
       return data;
     },
     2: (data) => {
       // Transform v2 → v3
       // ...
       data.version = 3;
       return data;
     },
   };
   ```

2. **Bump `CURRENT_SAVE_VERSION`:**
   ```javascript
   const CURRENT_SAVE_VERSION = 3;
   ```

3. **Migration runs automatically on load** and re-saves to localStorage

---

## 5. KNOWN ISSUES & GOTCHAS

### Critical Bugs

1. **Equipment not persisted** (Data Loss)
   - Equipment is NOT included in `SaveManager.save()` output
   - `Game.loadGame()` tries to deserialize `saveData.equipment` but it's never saved
   - **Impact:** Equipped items are lost on page reload
   - **Fix:** Add equipment to save format: `saveData.equipment = game.equipment.serialize()`

2. **`resetGame()` orphans crafter and prestige** (Corruption)
   - After `resetGame()`, `this.crafter` and `this.prestige` still reference the OLD `skillManager`, `inventory`, `economy`
   - New instances are created but `crafter` and `prestige` are NOT recreated
   - **Impact:** Crafting and prestige fail silently after reset (they call old, orphaned subsystems)
   - **Fix:** Recreate both in `resetGame()` and re-wire prestige references

3. **Shop items without ITEMS entries** (Runtime Error)
   - Shop items `'legendary_blade'`, `'quantum_implant'`, `'neural_accelerator'` reference IDs not in `ITEMS`
   - `Inventory._findItemDef()` returns `null` for these
   - **Impact:** Buying these items fails silently; they're never added to inventory
   - **Fix:** Either add missing ITEMS entries or remove from shop

### UI & Interaction Bugs

4. **Click delegation fragility** (Silent Failures)
   - `app.js` uses `e.target.matches('[data-action="..."]')` to match button clicks
   - If a button contains child elements (span, icon), clicks on child elements don't match
   - **Impact:** Clicking on icon inside button won't trigger action
   - **Fix:** Use `e.target.closest('[data-action="..."]')` instead

5. **Healing nanobots HP mismatch** (Data Inconsistency)
   - `combat.js` code heals 30 HP
   - Shop description says "Restore 50 HP each"
   - **Impact:** Player confusion; shop description is wrong
   - **Fix:** Update shop description to "Restore 30 HP each" or change code to 50

6. **Bottom tabs always visible on desktop** (Layout Bug)
   - CSS rule for `#bottom-tabs`: `display: none;` immediately followed by `display: flex;`
   - Second rule wins; tabs always show
   - **Impact:** Mobile tab bar visible on desktop (ugly, blocks content)
   - **Fix:** Remove duplicate rule or add desktop-only `@media` override

7. **Mobile tabs missing Prestige** (UX Gap)
   - Mobile bottom tab bar has: Skills, Inventory, Shop, Achievements, Crafting
   - Missing: Prestige (only accessible via sidebar on mobile)
   - **Impact:** Mobile players must use sidebar to access prestige
   - **Fix:** Add prestige tab or move prestige to sidebar-only on mobile

### CSS & Styling Issues

8. **Duplicate CSS rule blocks** (Maintenance Burden)
   - `.modal-overlay` defined twice (lines 927 & 1062)
   - `.modal-dialog` defined twice (lines 940 & 1075)
   - `.btn-danger` defined twice (lines 236 & 1132) with conflicting `!important` rules
   - **Impact:** Confusing; last rule wins but visibility is poor
   - **Fix:** Consolidate into single definitions per selector

9. **Modal styling inconsistency** (Visual Glitch)
   - First `.modal-overlay`: `background: rgba(0,0,0,0.9)` (90% opaque)
   - Second `.modal-overlay`: `background: rgba(0,0,0,0.8)` (80% opaque)
   - **Impact:** Modals may appear slightly transparent (unintended)
   - **Fix:** Use consistent opacity value

### Dead Code & Unused Features

10. **Equipment special effects** (Unfinished Feature)
    - `Equipment.getSpecialEffects()` returns `xpBoost`, `speedBoost`, `lifeSteal`, `lootBoost`, `currencyBoost`
    - **Nothing in the game loop consumes these values**
    - `lifeSteal`: never applied in `Combat.tick()`
    - `xpBoost`: never applied in `Skill.gainXP()`
    - `speedBoost`: never reduces action durations
    - `lootBoost`: never increases drops
    - `currencyBoost`: never increases currency gain (wait, actually `Economy.addCurrency()` DOES check prestige multiplier, but not equipment)
    - **Impact:** These items are essentially placeholders with no mechanical effect
    - **Status:** Marked as "Tier 4b" (endgame feature, not yet implemented)

11. **Unused event constants** (Dead Code)
    - `UI_NAVIGATE` defined but never emitted or listened to
    - `UI_UPDATE` defined but never emitted or listened to
    - `INVENTORY_FULL` emitted but no listeners
    - **Impact:** Code bloat, confusing for new developers
    - **Fix:** Remove or implement

12. **Unused DOM element** (Dead Code)
    - `index.html` line 177: `<div id="modal-overlay" ... style="display:none">` never used
    - `app.js` creates modals dynamically with id `"current-modal"` instead
    - **Impact:** Dead HTML taking up space
    - **Fix:** Remove

### Data Consistency Issues

13. **Prestige XP formula duplicated** (Fragile)
    - `prestige.js` line ~42: `floor(sqrt(totalXP / 500000))`
    - `ui/main.js` line ~545: `Math.pow(prestige.level + 1, 2) * 500000` (inverted formula for display)
    - **Impact:** If one changes and other doesn't, they'll disagree about prestige cost
    - **Fix:** Define formula in one place, export and reuse

14. **Enemy reference inconsistency** (Fragile)
    - Activities use enemy id: `'black_ice'`
    - `main.js` achievement check uses enemy name: `'Black ICE'`
    - **Impact:** Will fail if combat system changes enemy payload format
    - **Fix:** Use consistent identifier (id or name)

15. **Crafting does NOT grant XP** (Design Gap)
    - Crafting recipes require specific skill levels (e.g., level 50 `weapon_modding`)
    - But completing a craft grants 0 XP
    - **Impact:** No skill progression from crafting; players must grind other activities
    - **Fix:** Add XP rewards to crafting (40-50% of equivalent activity reward)

16. **Combat XP double-granting risk** (Logic Unclear)
    - Combat activities specify `xp: 100`
    - Enemies specify `xpReward: 100`
    - Is XP granted twice? Or just once?
    - **Current:** Only `xpReward` from enemy is used (activity `xp` ignored for combat)
    - **Impact:** Confusing; players don't know which XP value applies
    - **Fix:** Document or consolidate

### Orchestrator Gaps (Events without Handlers)

17. **Skill rewards never distributed** (Missing Wiring)
    - `SKILL_ACTION_COMPLETE` event emitted with rewards
    - `main.js` `_wireEvents()` does NOT handle this event
    - **Impact:** Skill rewards (items, currency) are lost; never added to inventory/economy
    - **Status:** BUG if true; need to verify current `main.js` code

18. **Combat XP never granted to skill** (Missing Wiring)
    - `COMBAT_ENEMY_DEFEATED` emitted with XP payload
    - Orchestrator must call `game.skillManager.getSkill('combat').gainXP(xp)`
    - **Impact:** Combat defeats grant 0 XP to combat skill
    - **Status:** BUG if true; need to verify current `main.js` code

---

## 6. GAME BALANCE & CONSTANTS

### XP Formula & Progression

```javascript
// Per-level XP cost (RuneScape-inspired curve)
calculateRequiredXP(level) {
  return floor(level * 10 + 50 * 2^(level/12))
}

// Level 1:    10 XP
// Level 10:   ~1,000 XP
// Level 50:   ~100,000 XP
// Level 99:   ~2,000,000 XP (final milestone)
```

**Precomputed table:** `_xpTable[level]` stores cumulative XP for each level (O(1) lookup)

**Binary search:** `getLevelFromXP(totalXP)` uses binary search on table (O(log 99))

**Max level:** 99 (hardcoded everywhere)

**Playtime estimate:** Level 99 in one skill at max-level activity (~200-400 hours active grind)

### Mastery System

- **Per-activity mastery:** Each of 120 activities tracks separate mastery level
- **Mastery formula:** Masteryxp threshold = `masteryLevel * 100`
  - Level 1→2: 100 XP
  - Level 2→3: 200 XP
  - Level 99→cap: 9,900 XP
- **Mastery bonus:** +1% XP gain per mastery level (max +99% at mastery 99)
- **Applied:** `skill.gainXP()` multiplies by `1 + masteryLevel * 0.01`

### Tick System & Timing

- **Tick rate:** 1000ms (exactly 1 second)
- **Tick dispatch:** `GameLoop.tick()` called via `setInterval(tick, 1000)`
- **Per-tick:** skills advance, combat advances, events emitted
- **No frame-rate independence:** Ticks are wall-clock based, not delta-time

### Combat Mechanics

**Player attack:**
- Base damage: `3 + floor(skillLevel * 0.5)`
- Equipment bonus: `weapon.damage + cyberware.damage`
- Stim buff: `+50%` if `combat_stim` active
- Variance: `±25%` (randomized per attack)
- Attack speed: Every **2 ticks** (2-second cooldown)

**Enemy attack:**
- Base damage: from enemy definition
- Reduced by defense: `damage - floor(defense * 0.5)` (defense HALVES incoming)
- Variance: `±25%` randomized
- Attack speed: Every **3 ticks** (3-second cooldown)

**Player HP:**
- Max HP: 100 (hardcoded, no way to increase)
- Start each fight: 100 HP
- On death: reset to 100 HP, emit `COMBAT_PLAYER_DIED`

**Combat buff (consumable):**
- `combat_stim`: +50% damage for 30 ticks (30 seconds)
- Applied each tick: `total_damage = floor(damage * 1.5)`
- Duration decrements each tick

**Healing consumable:**
- `healing_nanobots`: restores 30 HP (capped at max)
- Consumed on use

### Inventory & Equipment

- **Inventory slots:** 100 total
- **Slot enforcement:** Non-stackable items each take 1 slot; stackable items can share slots
- **Equipment slots:** 3 (weapon, armor, cyberware) — one item per slot
- **Equipment bonus cap:** No limit (can stack arbitrarily high)

### Economy & Currency

- **Currency:** Eurodollar (E$)
- **Prestige multiplier:** Applied on `addCurrency()`, not on spending
  - Formula: `finalCurrency = base * prestige.getCurrencyMultiplier()`
  - Multiplier = `1.0 + (0.005 * prestigeLevel)` base + upgrades
- **Spending:** No multiplier (costs always face value)
- **Tracking:** `totalEarned` and `totalSpent` tracked separately

### Prestige System

**Prestige level formula:**
```javascript
prestigeLevel = floor(sqrt(totalXP / 500000))
```

**XP thresholds:**
- Level 0: 0 XP
- Level 1: 500,000 XP
- Level 2: 2,000,000 XP (4x level 1)
- Level 3: 4,500,000 XP (9x level 1)
- Level n: `n^2 * 500,000 XP`

**On prestige:**
- All skills reset to level 1 with 0 XP, mastery cleared
- Inventory, equipment, economy NOT reset (player keeps all items/currency)
- Prestige level increases (if new level > current)
- Award 10 prestige points per level gained
- Prestige multipliers applied going forward

**Prestige bonuses:**
- Base: `(1.0 + 0.01 * level)` XP multiplier, `(1.0 + 0.005 * level)` currency multiplier
- Purchased upgrades stack multiplicatively:
  - `xp_boost_1`: +5% XP (cost 10 points)
  - `xp_boost_2`: +10% XP (cost 25 points)
  - `currency_boost_1`: +8% currency (cost 15 points)
  - `drop_boost_1`: +3% material drop rate (cost 12 points)
  - `mastery_boost_1`: +2% mastery XP (cost 20 points)
- Example: Prestige level 5 + all upgrades = `1.05 * 1.05 * 1.10 * 1.08 * 1.02` = ~1.34x multiplier

### Save/Load Timings

- **Auto-save:** Every 30 seconds (`SaveManager.startAutoSave()`)
- **Manual save:** On demand via UI button
- **Save on unload:** `window.beforeunload` calls `game.saveGame()`
- **Save format:** JSON, stored in `localStorage['netrunner_save']`
- **Save size:** ~1-10KB depending on inventory fullness
- **Offline processing:** Max 24 hours cached; any time beyond is lost

### Offline Progress

- **Calculation:** `elapsed = min(Date.now() - saveTimestamp, 24 * 3600000)` → ticks
- **Batch processing:** 200 ticks per batch, async with browser yielding
- **No event emission:** `processTicks()` does NOT emit `GAME_TICK` (silent offline grind)
- **Progress notification:** UI shows "Offline grind: 25%", "50%", etc.
- **Max duration:** 86,400 ticks (24 hours)

### Skill Activity Unlock Levels

Activities are tiered by level requirement:

| Tier | Level | Notes |
|------|-------|-------|
| 1 | 1 | Early game, fast rewards, low XP |
| 2 | 15-30 | Early-mid game |
| 3 | 40-60 | Mid game |
| 4 | 70 | Late game |
| 5 | 90 | Endgame, slow durations, high rewards |

Most skills have 5 activities (one per tier). Some have 4-6.

---

## 7. CONTENT CATALOG & PROGRESSION

### Progression Overview

```
New Game Start
  ├─ 10x data_shard, 5x circuit_board, 500 E$ (starting items)
  ├─ All skills at level 1
  ├─ Empty inventory (some slots filled, 90 slots free)
  └─ Prestige level 0, 0 points

Early Game (Levels 1-30)
  ├─ Grind Tier 1 activities (duration 4-10 seconds)
  ├─ Unlock Tier 2 activities at level 15-20
  ├─ Gather materials for Tier 1 crafting
  ├─ First equipment: Pistol + Kevlar Bodysuit (~1-2 hours playtime)
  └─ First achievements: level milestones

Mid Game (Levels 40-70)
  ├─ Tier 3 & 4 activities unlock
  ├─ Longer action durations (20-45 seconds)
  ├─ Higher rewards, item drops
  ├─ Crafting more useful (multiple tiers of upgrades)
  ├─ Combat becomes viable with better weapons
  ├─ Prestige level 1-2 possible (~500K-2M XP needed)
  └─ More achievements unlocked

Late Game (Levels 70-99)
  ├─ Tier 5 activities (40-70 seconds duration)
  ├─ Highest XP and material drop rates
  ├─ Prestige 3+ with full upgrade tree
  ├─ All crafting recipes available
  ├─ Endgame equipment (neural daemon, ice shield, etc.)
  └─ Challenge: achieve mastery 99 on all activities

Prestige Resets
  └─ After reaching 2M+ XP: prestige to level 1+
     ├─ Gain XP and currency multipliers
     ├─ Start new character from level 1
     ├─ Keep inventory and equipment
     ├─ Prestige again at 4.5M XP → level 2
     └─ Infinite prestige ladder (diminishing returns)
```

### 24 Skills Across 6 Categories

**HACKING (Green, #00ff41)**
- Intrusion: Break into systems, steal data
- Decryption: Decrypt stolen data into usable intel
- ICE Breaking: Defeat Intrusion Countermeasure Electronics
- Daemon Coding: Write daemons to boost other skills

**NETRUNNING (Cyan, #00d4ff)**
- Deep Dive: Explore deeper NET layers for rare finds
- Data Mining: Extract raw data from the NET
- Black ICE Combat: Fight hostile AI in cyberspace (combat skill)
- Neural Surfing: Move faster through NET, unlock zones

**STREET (Magenta, #ff00ff)**
- Combat: Fight gangs, corpos, cyberpsychos (combat skill)
- Stealth: Pickpocket, infiltrate, gather intel
- Street Cred: Build reputation with factions
- Smuggling: Transport contraband for profit

**TECH (Yellow, #ffff00)**
- Cyberware Crafting: Build cyberware implants (crafting output)
- Weapon Modding: Upgrade and modify weapons (crafting output)
- Vehicle Tuning: Tune vehicles for smuggling
- Drone Engineering: Build drones for passive gathering

**FIXER (Orange, #ff6600)**
- Trading: Buy low, sell high on black market
- Corpo Infiltration: High-risk heists against megacorps (combat input)
- Info Brokering: Sell intel gathered from hacking
- Fencing: Sell stolen goods

**RIPPER (Pink, #ff0099)**
- Cyberware Installation: Install cyberware for stat boosts
- Biotech: Create healing items and stims (crafting output)
- Neural Enhancement: Boost XP rates and skill synergies
- Chrome Surgery: High-end implants, risk of psychosis

### 11 Enemy Types (Combat Progression)

| Enemy | HP | DMG | XP | Loot | Difficulty |
|-------|----|----|----|----|---|
| Street Gang | 20 | 3 | 50 | data_shard, eurodollar | Easy |
| Corporate Merc | 50 | 8 | 200 | circuit_board, eurodollar | Easy-Mid |
| Cyberpsycho | 100 | 15 | 500 | neural_implant, chrome_scrap, eurodollar | Mid |
| Black ICE | 75 | 12 | 300 | data_shard, circuit_board, eurodollar | Mid |
| Rogue AI | 150 | 20 | 800 | net_artifact, daemon_code, eurodollar | Mid-Hard |
| Arasaka Guard | 60 | 10 | 250 | biometric_scanner, eurodollar | Mid |
| Elite Corporate Agent | 120 | 18 | 600 | stolen_intel, biometric_scanner, eurodollar | Hard |
| Netrunner AI | 200 | 25 | 1200 | net_artifact, daemon_code, eurodollar | Hard |
| Megacorp Executive | 250 | 30 | 2000 | net_artifact, biometric_scanner, eurodollar | Hard |
| Soulkiller AI | 300 | 35 | 3000 | net_artifact, daemon_code, neural_implant, eurodollar | Very Hard |
| Blackwall Entity | 400 | 40 | 5000 | net_artifact, daemon_code, ice_fragment, eurodollar | Endgame |

### 35+ Items Across 6 Types

**Materials (Basic Crafting Inputs)**
- data_shard (💾, value 10)
- circuit_board (🔌, value 25)
- chrome_scrap (⚙️, value 15)
- encrypted_data (🔒, value 30)
- ice_fragment (❄️, value 40)
- daemon_code (👾, value 60)
- neural_implant (🧬, value 100)
- synthetic_muscle (💪, value 75)
- stolen_intel (📋, value 45)
- contraband (🚫, value 80)
- vehicle_parts (🔧, value 55)
- drone_chassis (🤖, value 90)
- bio_sample (🧪, value 35)
- street_cred_token (🏅, value 20)
- biometric_scanner (👁️, value 50)
- net_artifact (🌐, value 200)

**Weapons**
- Kinetic Pistol (🔫, damage 5, value 500)
- Smart Pistol (🔫, damage 8, value 800)
- Katana (⚔️, damage 10, value 1200)
- Monowire (〰️, damage 12, value 1500)
- Sniper Rifle (🎯, damage 15, value 2000)

**Armor**
- Kevlar Bodysuit (🦺, defense 5, value 800)
- Subdermal Armor (🛡️, defense 8, value 1500)
- ICE Shield (❄️, defense 12, value 2000)
- Armored Plating (🛡️, defense 10, value 2500)

**Cyberware**
- Military Grade Implant (🦾, damage 3, defense 10, value 3000)
- Neural Daemon (👾, damage 5, defense 8, value 3000)
- Combat Drone (🤖, damage 8, value 2800)
- XP Boost Chip (⚡, xpBoost +10%, value 4000)
- Speed Processor (⏱️, speedBoost 15%, value 5000)
- Loot Enhancer (💎, lootBoost +20%, value 6000)
- Wealth Accumulator (💰, currencyBoost +25%, value 7000)

**Consumables**
- Healing Nanobots (🔬, restores 30 HP, value 150)
- Combat Stim (💉, +50% damage 30s, value 200)

**Crafting Outputs (High-Value Materials)**
- Decryption Key (🔑, value 500)
- Corporate Blackmail (📂, value 1500)
- Fixer License (📜, value 5000)
- Black Market Bundle (📦, value 3000)

---

## 8. NEW CONTENT PROPOSALS WITH FULL ITEM SPECS

This section proposes new content to expand endgame, make inventory more relevant, and provide longer-term progression targets.

### Problem Statement

**Current state:**
- Only 11 enemies (endgame is just repeating the same 3-4 fights)
- Only 5 prestige upgrades (prestige feels "done" after 2-3 resets)
- Equipment special effects are completely unused
- 20 crafting recipes, but many become obsolete after one use
- Limited inventory relevance (collect → equip or sell, not much else)

**Proposed solutions:**
1. **New enemy archetypes** for endgame combat variety
2. **Equipment special effects integration** (make them matter)
3. **Item tiers & rarity system** for inventory depth
4. **Legendary items & quest chains** for long-term goals
5. **Transmutation system** (convert low-tier items into high-tier)

---

### Proposal 1: Legendary Item System

Introduce "Legendary" rarity tier with unique effects. Requires new crafting recipes and high prestige level.

#### New Items (with full specs)

```javascript
// In skillData.js ITEMS:

// Legendary Weapons (Tier 4 Endgame)
MANTIS_BLADE: {
  id: 'mantis_blade',
  name: 'Legendary Mantis Blade',
  type: 'weapon',
  icon: '⚡',
  rarity: 'legendary',
  damage: 20,
  lifeSteal: 0.10,  // 10% of damage dealt heals player
  stackable: false,
  value: 8000,
  description: 'Grants 10% of damage dealt as healing',
},

PLASMA_RIFLE: {
  id: 'plasma_rifle',
  name: 'Legendary Plasma Rifle',
  type: 'weapon',
  icon: '🔥',
  rarity: 'legendary',
  damage: 22,
  areaBonus: 0.05,  // 5% chance to deal double damage
  stackable: false,
  value: 10000,
  description: 'Chance to deal double damage on hit',
},

// Legendary Armor
OBSIDIAN_PLATING: {
  id: 'obsidian_plating',
  name: 'Obsidian Combat Armor',
  type: 'armor',
  icon: '🖤',
  rarity: 'legendary',
  defense: 15,
  damageReduction: 0.15,  // Reduce ALL damage taken by 15%
  stackable: false,
  value: 9000,
  description: 'Reduces all damage taken by 15% (stacks with defense)',
},

CHRONO_ARMOR: {
  id: 'chrono_armor',
  name: 'Chrono-Infused Armor',
  type: 'armor',
  icon: '⏳',
  rarity: 'legendary',
  defense: 13,
  speedBoost: 0.25,  // 25% faster actions
  stackable: false,
  value: 8500,
  description: 'Reduces action duration by 25%',
},

// Legendary Cyberware (Most Powerful)
GODLIKE_IMPLANT: {
  id: 'godlike_implant',
  name: 'Godlike Quantum Core',
  type: 'cyberware',
  icon: '⭐',
  rarity: 'legendary',
  damage: 10,
  defense: 10,
  xpBoost: 0.20,  // +20% XP
  lootBoost: 0.30,  // +30% drops
  currencyBoost: 0.20,  // +20% currency
  stackable: false,
  value: 15000,
  description: '+20% XP, +20% currency, +30% loot drops',
},

SOULKILLER_OVERRIDE: {
  id: 'soulkiller_override',
  name: 'Soulkiller Override Ware',
  type: 'cyberware',
  icon: '💀',
  rarity: 'legendary',
  damage: 15,
  defense: 0,
  omniscience: true,  // New effect: see all enemy HP/stats upfront
  stackable: false,
  value: 12000,
  description: 'Reveals enemy stats before combat',
},

NEURAL_NEXUS: {
  id: 'neural_nexus',
  name: 'Neural Nexus Hub',
  type: 'cyberware',
  icon: '🧠',
  rarity: 'legendary',
  damage: 0,
  defense: 8,
  masteryXpBoost: 0.50,  // +50% mastery XP
  skillSynergyBonus: 0.10,  // +10% XP to all skills (global)
  stackable: false,
  value: 13000,
  description: '+50% mastery XP, +10% XP to all skills globally',
},
```

#### New Crafting Recipes (for Legendaries)

```javascript
// In crafting.js CRAFT_RECIPES:

mantis_blade_craft: {
  name: 'Forge Mantis Blade',
  category: 'weapon',
  level: 90,
  requiredSkill: 'weapon_modding',
  inputs: {
    'monowire': 1,
    'neural_implant': 8,
    'daemon_code': 10,
    'net_artifact': 5,
    'synthetic_muscle': 5,
  },
  outputs: { 'mantis_blade': 1 },
  currencyCost: 20000,
},

plasma_rifle_craft: {
  name: 'Craft Plasma Rifle',
  category: 'weapon',
  level: 95,
  requiredSkill: 'daemon_coding',
  inputs: {
    'rifle': 1,
    'net_artifact': 8,
    'circuit_board': 20,
    'ice_fragment': 15,
    'daemon_code': 12,
  },
  outputs: { 'plasma_rifle': 1 },
  currencyCost: 25000,
},

obsidian_armor_craft: {
  name: 'Forge Obsidian Armor',
  category: 'armor',
  level: 90,
  requiredSkill: 'chrome_surgery',
  inputs: {
    'ice_shield': 1,
    'chrome_scrap': 30,
    'neural_implant': 10,
    'net_artifact': 6,
    'synthetic_muscle': 8,
  },
  outputs: { 'obsidian_plating': 1 },
  currencyCost: 22000,
},

chrono_armor_craft: {
  name: 'Infuse Chrono Armor',
  category: 'armor',
  level: 88,
  requiredSkill: 'cyberware_installation',
  inputs: {
    'subdermal_armor': 1,
    'speed_processor': 1,  // Consumes the boost chip
    'daemon_code': 8,
    'net_artifact': 4,
    'circuit_board': 15,
  },
  outputs: { 'chrono_armor': 1 },
  currencyCost: 18000,
},

godlike_implant_craft: {
  name: 'Assemble Godlike Quantum Core',
  category: 'cyberware',
  level: 99,
  requiredSkill: 'neural_enhancement',
  inputs: {
    'wealth_accumulator': 1,
    'loot_enhancer': 1,
    'xp_boost_chip': 1,
    'net_artifact': 12,
    'neural_implant': 15,
    'daemon_code': 20,
  },
  outputs: { 'godlike_implant': 1 },
  currencyCost: 50000,
},

// ... more legendary crafting recipes ...
```

---

### Proposal 2: New Enemy Archetypes (5+ bosses)

Introduce "Boss" enemies with unique mechanics, high rewards, and challenge.

#### New Boss Enemies

```javascript
// In skillData.js ENEMIES:

ROGUE_NETRUNNER: {
  id: 'rogue_netrunner',
  name: 'Rogue Netrunner (Boss)',
  hp: 280,
  damage: 28,
  xpReward: 2500,
  isBoss: true,
  phase2_trigger: 0.50,  // At 50% HP, enters phase 2 (higher damage)
  loot: {
    'net_artifact': { min: 5, max: 10 },
    'daemon_code': { min: 10, max: 20 },
    'neural_implant': { min: 3, max: 6 },
    'eurodollar': { min: 5000, max: 15000 },
  },
},

NEON_SAMURAI: {
  id: 'neon_samurai',
  name: 'Neon Samurai (Boss)',
  hp: 320,
  damage: 32,
  xpReward: 3000,
  isBoss: true,
  phase2_trigger: 0.50,
  loot: {
    'chrome_scrap': { min: 20, max: 40 },
    'neural_implant': { min: 5, max: 10 },
    'synthetic_muscle': { min: 10, max: 20 },
    'eurodollar': { min: 8000, max: 20000 },
  },
},

CORPORATE_TYRANT: {
  id: 'corporate_tyrant',
  name: 'Corporate Tyrant CEO (Boss)',
  hp: 350,
  damage: 35,
  xpReward: 3500,
  isBoss: true,
  phase2_trigger: 0.50,
  loot: {
    'biometric_scanner': { min: 8, max: 15 },
    'stolen_intel': { min: 10, max: 25 },
    'net_artifact': { min: 8, max: 12 },
    'eurodollar': { min: 10000, max: 30000 },
  },
},

DIGITAL_PHANTOM: {
  id: 'digital_phantom',
  name: 'Digital Phantom (Boss)',
  hp: 250,
  damage: 22,
  xpReward: 2800,
  isBoss: true,
  evasion: 0.20,  // 20% chance to dodge player attacks
  loot: {
    'daemon_code': { min: 15, max: 30 },
    'net_artifact': { min: 10, max: 15 },
    'eurodollar': { min: 7000, max: 18000 },
  },
},

CHROME_WRAITH: {
  id: 'chrome_wraith',
  name: 'Chrome Wraith (Boss)',
  hp: 400,
  damage: 40,
  xpReward: 4000,
  isBoss: true,
  lifeSteal: 0.15,  // Heals 15% of damage dealt
  loot: {
    'neural_implant': { min: 10, max: 20 },
    'chrome_scrap': { min: 25, max: 50 },
    'net_artifact': { min: 12, max: 20 },
    'eurodollar': { min: 15000, max: 40000 },
  },
},
```

#### New Combat Activities (Boss Fights)

```javascript
// In skillData.js ACTIVITIES:

combat: [
  // ... existing activities ...
  {
    id: 'fight_rogue_netrunner',
    name: 'Duel Rogue Netrunner (Boss)',
    level: 85,
    enemy: 'rogue_netrunner',
    xp: 2500,
    masteryXp: 800,
  },
  {
    id: 'fight_neon_samurai',
    name: 'Battle Neon Samurai (Boss)',
    level: 88,
    enemy: 'neon_samurai',
    xp: 3000,
    masteryXp: 1000,
  },
  {
    id: 'fight_corporate_tyrant',
    name: 'Confront Corporate Tyrant (Boss)',
    level: 90,
    enemy: 'corporate_tyrant',
    xp: 3500,
    masteryXp: 1200,
  },
  // ... more boss fights ...
],

// New netrunning combat activity
black_ice_combat: [
  // ... existing ...
  {
    id: 'fight_digital_phantom',
    name: 'Face Digital Phantom (Boss)',
    level: 85,
    enemy: 'digital_phantom',
    xp: 2800,
    masteryXp: 900,
  },
  {
    id: 'fight_chrome_wraith',
    name: 'Confront Chrome Wraith (Boss)',
    level: 95,
    enemy: 'chrome_wraith',
    xp: 4000,
    masteryXp: 1500,
  },
],
```

---

### Proposal 3: Equipment Effects Integration

Make special effects actually do something by integrating them into game loop.

#### In `combat.js`, modify `getPlayerDamage()`:

```javascript
getPlayerDamage() {
  const baseDamage = 3 + Math.floor(this.skillLevel * 0.5);
  const equipBonus = this.equipment.getBonusDamage();
  
  // NEW: Apply lifeSteal effect
  const effects = this.equipment.getSpecialEffects();
  const lifeStealAmount = baseDamage * effects.lifeSteal;
  if (lifeStealAmount > 0) {
    this.playerHp = Math.min(this.maxPlayerHp, this.playerHp + lifeStealAmount);
  }
  
  let total = baseDamage + equipBonus;
  // ... rest unchanged ...
}
```

#### In `skills.js`, modify `gainXP()`:

```javascript
gainXP(amount, sourceAction = null, prestigeMultiplier = 1.0) {
  const baseMultiplier = prestigeMultiplier;
  const masteryBonus = 1 + (this.getMasteryLevel(sourceAction) * 0.01);
  
  // NEW: Apply equipment XP boost
  const equipEffects = this.equipment?.getSpecialEffects?.() || {};
  const xpBoostMultiplier = 1 + (equipEffects.xpBoost || 0);
  
  const totalXP = amount * baseMultiplier * masteryBonus * xpBoostMultiplier;
  this.xp += totalXP;
  // ... rest unchanged ...
}
```

#### In `ui/main.js`, modify action duration display:

```javascript
// When rendering activity picker, apply speedBoost to duration
renderActivityCard(skill, activity) {
  const equipEffects = game.equipment.getSpecialEffects();
  const speedMultiplier = 1 - (equipEffects.speedBoost || 0); // 0.85 = 15% faster
  const adjustedDuration = Math.ceil(activity.duration * speedMultiplier);
  
  // Display adjustedDuration instead of activity.duration
  // ...
}
```

#### In `inventory.js`, modify loot generation:

```javascript
// In skills.js completeAction(), when calculating rewards:
const baseDropChance = 1.0;
const equipEffects = this.equipment?.getSpecialEffects?.() || {};
const lootBoostMultiplier = 1 + (equipEffects.lootBoost || 0);

// When rolling item quantities from rewards range:
const quantity = Math.floor(
  (Math.random() * (range.max - range.min + 1)) + range.min
) * lootBoostMultiplier;
```

---

### Proposal 4: Item Rarity Tiers

Expand inventory depth by adding rarity/quality tiers. Each item has inherent rarity affecting value and display.

#### Rarity Tiers (propose 5 levels):

| Tier | Name | Color | Value Mult | Drop Chance | Examples |
|------|------|-------|-----------|------------|----------|
| 1 | Common | White | 1x | 100% | data_shard, chrome_scrap |
| 2 | Uncommon | Green | 2x | 50% | neural_implant, daemon_code |
| 3 | Rare | Blue | 5x | 20% | net_artifact |
| 4 | Epic | Purple | 10x | 5% | (new) Encrypted Core Shard |
| 5 | Legendary | Gold | 20x | 0.5% | (new) Mantis Blade, Godlike Implant |

#### Implementation (in `skillData.js`):

```javascript
export const ITEMS = {
  // Existing items get rarity field added
  DATA_SHARD: {
    id: 'data_shard',
    name: 'Data Shard',
    type: 'material',
    icon: '💾',
    stackable: true,
    value: 10,
    rarity: 'common',  // NEW FIELD
  },
  
  // New epic-tier items
  ENCRYPTED_CORE_SHARD: {
    id: 'encrypted_core_shard',
    name: 'Encrypted Core Shard',
    type: 'material',
    icon: '🔶',
    stackable: true,
    value: 500,  // 5x net_artifact (100)
    rarity: 'epic',
  },
  
  PROTOTYPE_NEXUS: {
    id: 'prototype_nexus',
    name: 'Prototype Nexus Core',
    type: 'material',
    icon: '⚛️',
    stackable: false,
    value: 2000,
    rarity: 'epic',
  },
};
```

#### UI Display (in `ui/main.js`):

```javascript
// Render item in inventory with rarity color
const rarityColors = {
  'common': '#ffffff',
  'uncommon': '#00ff41',
  'rare': '#0099ff',
  'epic': '#ff00ff',
  'legendary': '#ffff00',
};

const itemHtml = `
  <div class="inventory-item" style="border-color: ${rarityColors[item.rarity]}">
    <span class="item-icon">${item.icon}</span>
    <span class="item-name">${item.name}</span>
    <span class="item-qty">x${item.quantity}</span>
  </div>
`;
```

---

### Proposal 5: Item Transmutation Recipes

Add "downgrade" recipes so players can recycle high-tier items back into materials (avoid dead ends).

#### New Transmutation Recipes:

```javascript
// In crafting.js CRAFT_RECIPES:

transmute_legendary: {
  name: 'Transmute Legendary to Materials',
  category: 'transmutation',
  level: 99,
  requiredSkill: 'chrome_surgery',
  inputs: { 'mantis_blade': 1 },  // Any legendary weapon
  outputs: {
    'net_artifact': { min: 3, max: 5 },
    'daemon_code': { min: 5, max: 10 },
    'neural_implant': { min: 2, max: 4 },
  },
  currencyCost: 0,  // Free transmutation
},

transmute_epic: {
  name: 'Transmute Epic to Uncommon',
  category: 'transmutation',
  level: 80,
  requiredSkill: 'daemon_coding',
  inputs: { 'encrypted_core_shard': 1 },
  outputs: {
    'net_artifact': { min: 1, max: 2 },
    'daemon_code': { min: 2, max: 5 },
  },
  currencyCost: 0,
},

// Bulk recipes
bulk_transmute_materials: {
  name: 'Bulk Transmute Low-Tier Materials',
  category: 'transmutation',
  level: 50,
  requiredSkill: 'cyberware_crafting',
  inputs: {
    'chrome_scrap': 20,
    'circuit_board': 10,
  },
  outputs: {
    'synthetic_muscle': { min: 3, max: 5 },
  },
  currencyCost: 0,
},
```

---

### Proposal 6: New Activities with Item Specs

Add 10+ new activities across skills to provide more grinding paths and use new items.

#### New Hacking Activity (Intrusion Skill):

```javascript
// In ACTIVITIES.intrusion:

{
  id: 'corporate_mainframe_breach',
  name: 'Breach Megacorp Mainframe',
  level: 95,
  duration: 50,
  xp: 950,
  masteryXp: 350,
  rewards: {
    items: {
      'encrypted_core_shard': { min: 1, max: 3 },  // Epic drop!
      'net_artifact': { min: 5, max: 10 },
    },
    currency: { min: 5000, max: 12000 },
  },
},

{
  id: 'blackwall_contact',
  name: 'Contact Blackwall Entity',
  level: 99,
  duration: 60,
  xp: 1500,
  masteryXp: 500,
  rewards: {
    items: {
      'net_artifact': { min: 10, max: 20 },
      'daemon_code': { min: 15, max: 30 },
      'encrypted_core_shard': { min: 2, max: 5 },
    },
    currency: { min: 8000, max: 20000 },
  },
},
```

#### New Netrunning Activity (Deep Dive Skill):

```javascript
{
  id: 'void_exploration',
  name: 'Void Exploration Expedition',
  level: 98,
  duration: 70,
  xp: 1200,
  masteryXp: 450,
  rewards: {
    items: {
      'net_artifact': { min: 15, max: 25 },
      'daemon_code': { min: 10, max: 20 },
      'prototype_nexus': { min: 1, max: 2 },  // Epic material
    },
    currency: { min: 10000, max: 25000 },
  },
},
```

#### New Ripper Activity (Chrome Surgery Skill):

```javascript
{
  id: 'full_body_conversion',
  name: 'Full Body Chrome Conversion',
  level: 99,
  duration: 80,
  xp: 1400,
  masteryXp: 500,
  rewards: {
    items: {
      'neural_implant': { min: 12, max: 20 },
      'synthetic_muscle': { min: 15, max: 25 },
      'net_artifact': { min: 8, max: 12 },
      'prototype_nexus': { min: 1, max: 3 },
    },
    currency: { min: 12000, max: 30000 },
  },
},
```

---

### Summary: New Content Adds

| Category | Count | Examples |
|----------|-------|----------|
| New Items | 15+ | Mantis Blade, Godlike Implant, Encrypted Core Shard, Prototype Nexus |
| New Boss Enemies | 5 | Rogue Netrunner, Neon Samurai, Corporate Tyrant, Digital Phantom, Chrome Wraith |
| New Crafting Recipes | 15+ | Legendary crafting, Transmutation recipes |
| New Activities | 10+ | Corporate Mainframe, Void Exploration, Full Body Conversion |
| Total estimated playtime | +200h | Crafting + prestige ladder + boss farming |

---

## 9. IMPLEMENTATION CHECKLIST FOR AGENTS

Use this checklist when implementing the proposals above:

### Before coding:

- [ ] Read this entire AGENTS.md file
- [ ] Understand the event-driven architecture (Section 2)
- [ ] Identify where orchestrator wiring is needed (main.js)
- [ ] Check for existing bugs that might affect your feature (Section 5)

### When adding items:

- [ ] Add to `ITEMS` object in `skillData.js`
- [ ] If equippable: add `damage`/`defense`/special effects
- [ ] If tradeable: add `value` (E$ sell price)
- [ ] If stackable: set `stackable: true`, else `false`
- [ ] If new rarity: add `rarity: 'epic'` or `'legendary'`
- [ ] Add to at least one activity's reward table or shop
- [ ] Test: item should appear in inventory after activity completion

### When adding enemies:

- [ ] Add to `ENEMIES` object in `skillData.js`
- [ ] Set `hp`, `damage`, `xpReward` (balanced for level)
- [ ] Add `loot` table with items and `eurodollar` currency
- [ ] Create corresponding combat activity
- [ ] Test: enemy should be defeatable with appropriate gear

### When adding activities:

- [ ] Add to `ACTIVITIES` array for target skill in `skillData.js`
- [ ] Set `level` requirement (one per tier: 1, 15-30, 40-60, 70, 90)
- [ ] Set `duration` in seconds (or `enemy` id for combat)
- [ ] Set `xp` and `masteryXp` (scale with level)
- [ ] Add `rewards` (items + currency)
- [ ] Test: activity should be selectable and grant rewards

### When adding crafting recipes:

- [ ] Add to `CRAFT_RECIPES` in `crafting.js`
- [ ] Verify `requiredSkill` and `level` are valid
- [ ] Verify all `inputs` items exist in `ITEMS`
- [ ] Verify all `outputs` items exist in `ITEMS`
- [ ] Set `currencyCost` (cost in E$)
- [ ] Test: recipe should appear in crafting when skill level met

### When adding achievements:

- [ ] Add to `Achievements.constructor()` in `player.js`
- [ ] Add trigger logic to `Game._wireEvents()` in `main.js`
- [ ] Use appropriate event listener (SKILL_LEVEL_UP, COMBAT_*, CURRENCY_CHANGED, etc.)
- [ ] Test: achievement should unlock and show notification

### When integrating equipment effects:

- [ ] Add effect fields to equipment items (`xpBoost`, `speedBoost`, etc.)
- [ ] Call `equipment.getSpecialEffects()` in relevant systems
- [ ] Apply multipliers in game loop (skills, combat, activities)
- [ ] Test: effect should measurably change gameplay (faster actions, higher XP, etc.)

### Testing:

- [ ] No console errors
- [ ] Feature persists across save/load
- [ ] UI updates correctly (no stale state)
- [ ] Events fire and orchestrator handles them
- [ ] Prestige multipliers apply correctly to new content

---

## 10. DEBUGGING REFERENCE

### Common Issues & Solutions

**Issue: Item added to ITEMS but doesn't appear in inventory**
- Check: `id` is exactly matching in activity reward table
- Check: Item ID uses correct snake_case
- Check: No circular reference in data
- Fix: Ensure `Inventory._findItemDef()` can find it

**Issue: Skill activity doesn't grant rewards**
- Check: `SKILL_ACTION_COMPLETE` event is being emitted (add console.log in skills.js)
- Check: `main.js` is listening to `SKILL_ACTION_COMPLETE` in `_wireEvents()`
- Check: Rewards object is properly structured
- Fix: Add missing event listener in main.js

**Issue: Equipment bonus not applying**
- Check: Item is equipped (check Equipment.slots)
- Check: `getSpecialEffects()` is being called in game loop
- Check: Multiplier is applied at right location
- Fix: Verify integration point in system tick

**Issue: Prestige reset clears everything unexpectedly**
- Check: What's being reset in `Game.resetGame()`
- Expected: Only skills reset; inventory, equipment, economy kept
- Fix: May be prestige.prestige() doing too much

**Issue: Save file grows too large**
- Check: Inventory full of items? (serialize() includes all items)
- Check: Long playtime? (saveData includes full tick history)
- Fix: Implement item limit or archive old data

---

## 11. PERFORMANCE TIPS

For agents working on features that might impact performance:

1. **Avoid DOM manipulation in tick loop** (500ms polling is OK, 1s tick is too frequent)
2. **Use precomputed lookup tables** like XP table instead of calculating every time
3. **Batch inventory updates** (emit one `INVENTORY_CHANGED` event, not one per item)
4. **Avoid deep cloning** in save serialization (use shallow object copies)
5. **Cache equipment effects** instead of calling `getSpecialEffects()` every tick
6. **Profile offline processing** — ensure batch size (200) doesn't cause browser lag

---

## 12. RESOURCES & REFERENCES

### Key Files Quick Reference

| Task | File | Line | Function |
|------|------|------|----------|
| Add skill | `skillData.js` | 43-151 | `SKILLS` object |
| Add item | `skillData.js` | 154-207 | `ITEMS` object |
| Add enemy | `skillData.js` | 209-266 | `ENEMIES` object |
| Add activity | `skillData.js` | 271-821 | `ACTIVITIES` object |
| Add passive bonus | `skillData.js` | 918-954 | `PASSIVE_BONUSES` object |
| Add ability | `skillData.js` | 962-1238 | `SKILL_ABILITIES` object |
| Add recipe | `crafting.js` | 5-209 | `CRAFT_RECIPES` object |
| Add achievement | `player.js` | 40-101 | `Achievements.constructor()` |
| Wire orchestrator | `main.js` | 77-170 | `Game._wireEvents()` |
| Event constants | `events.js` | 28-55 | `EVENTS` object |
| UI rendering | `ui/main.js` | 1-917 | Various `render*()` methods |
| Passives/abilities UI | `ui/main.js` | 621-764 | `renderPassivesView()` |
| Game loop | `gameLoop.js` | 1-48 | `GameLoop.tick()` |
| Passive stats calc | `passiveStats.js` | 32-93 | `PassiveStats._calculate()` |
| Ability management | `abilities.js` | 128-162 | `AbilityManager.tick()` |

### External References

- **RuneScape XP formula:** https://runescape.wiki/w/Experience
- **Melvor Idle:** https://melvor.com/
- **Idle game design:** https://ncase.me/idle/
- **Cyberpunk theme:** Inspired by CP2020, Cyberpunk 2077

---

**Document Version:** 1.1 (April 2026)
**Target Audience:** AI agents, code reviewers, new developers
**Last Updated:** Updated with PassiveStats, AbilityManager, and functional passive bonus wiring
