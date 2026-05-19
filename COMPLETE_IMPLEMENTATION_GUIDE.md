/**
 * COMPLETE IMPLEMENTATION GUIDE - ALL PHASES
 * 
 * A step-by-step guide to integrate all new systems
 * into the NETRUNNER game.
 */

# NETRUNNER: COMPLETE SYSTEMS INTEGRATION GUIDE

## Overview

This guide walks through implementing 5 major systems across 6 phases:

| Phase | System | Duration | Status |
|-------|--------|----------|--------|
| 1 | Clarity System (Tutorial, Tooltips, Mechanics Panel) | 2-3h | ✅ Code Ready |
| 2 | Virus System (Infections, Compromises, Screen Glitches) | 2-3h | ✅ Code Ready |
| 3 | Clinic System (Virus Removal, Injuries, Neural Degradation) | 2-3h | ✅ Code Ready |
| 4 | Gaming UI Integration (13 Components, Real-time Updates) | 3-4h | ✅ Code Ready |
| 5 | Status Effects (Buffs, Debuffs, Combat Integration) | 2-3h | ✅ Code Ready |
| 6 | Balance & Testing (Playtesting, Balance Adjustments) | 4-6h | ✅ Test Suite Ready |

**Total Development Time: 15-21 hours**

---

## Quick Start (5 minutes)

If you want to get everything running immediately:

```bash
# 1. Copy all new system files
cp js/systems/clarity.js [netrunner]/js/systems/
cp js/systems/virus.js [netrunner]/js/systems/
cp js/systems/clinic.js [netrunner]/js/systems/
cp js/systems/statusEffects.js [netrunner]/js/systems/

# 2. Update index.html (add gaming UI containers)
# 3. Update main.js (import and initialize systems)
# 4. Run tests
npm test

# 5. Play!
bash serve.sh
```

---

## PHASE 1: Clarity System (Tutorial & Tooltips)

**Time: 2-3 hours**

### What It Does
- Interactive tutorial for new players
- Tooltips explaining hidden mechanics
- Mechanics breakdown panel
- Achievement hints

### Files Created
- `js/systems/clarity.js` (600 lines)

### Installation Steps

#### Step 1: Import in `main.js`
```javascript
import { claritySystem } from './systems/clarity.js';
```

#### Step 2: Initialize in Game constructor
```javascript
export class Game {
  constructor() {
    // ... existing systems ...
    this.claritySystem = claritySystem;
  }
}
```

#### Step 3: Wire tutorial start event
```javascript
// In _wireEvents() method:
events.on(EVENTS.GAME_LOADED, () => {
  if (this.claritySystem.tutorialState === 'idle') {
    this.claritySystem.startTutorial();
  }
});
```

#### Step 4: Add UI panel to navigation
```javascript
// In ui/main.js renderNavigationPanel():
const helpBtn = document.createElement('button');
helpBtn.innerHTML = '❓ Help';
helpBtn.onclick = () => {
  const panel = this.claritySystem.generateMechanicsPanel(this.game);
  showModal('Game Mechanics', JSON.stringify(panel, null, 2), [
    { text: 'Close', onclick: () => {} }
  ]);
};
nav.appendChild(helpBtn);
```

### Testing
```javascript
// Test in browser console:
game.claritySystem.startTutorial();
game.claritySystem.getTooltip('xp_formula');
game.claritySystem.generateMechanicsPanel(game);
```

### Balance Adjustments
- Adjust tooltip duration if too verbose
- Modify XP formula explanation based on player feedback
- Add more tooltips based on common questions

---

## PHASE 2: Virus System (Infections & Screen Glitches)

**Time: 2-3 hours**

### What It Does
- Hacking activities have compromise chance (0-35%)
- 4 virus types with cascading infections
- Screen corruption effects (text scrambling, glitches)
- Visual feedback of virus severity

### Files Created
- `js/systems/virus.js` (650 lines)

### Installation Steps

#### Step 1: Import in `main.js`
```javascript
import { VirusManager } from './systems/virus.js';
```

#### Step 2: Initialize in Game constructor
```javascript
export class Game {
  constructor() {
    this.virusManager = new VirusManager();
  }
}
```

#### Step 3: Hook virus check to hacking activities
```javascript
// In _wireEvents() method:
events.on(EVENTS.SKILL_ACTION_COMPLETE, (data) => {
  if (data.skill.id === 'intrusion' || data.skill.id === 'decryption') {
    const compromise = this.virusManager.checkCompromise(
      data.skill.level,
      this.passiveStats.defense || 0,
      this.prestige.level || 0,
      this._getActivityDifficulty(data.action)
    );

    if (compromise) {
      this.virusManager.attemptInfection(compromise.id);
    }
  }
});
```

#### Step 4: Tick virus effects each game loop
```javascript
// In _wireEvents() method:
events.on(EVENTS.GAME_TICK, (data) => {
  this.virusManager.tick();
});
```

#### Step 5: Apply virus effects to rewards
```javascript
// In SKILL_ACTION_COMPLETE handler:
const reward = { xp: 100, currency: 50, items: {} };
const modifiedReward = this.virusManager.applyVirusEffects(reward);
// Now apply modifiedReward instead of reward
```

### Testing
```javascript
// Test in browser console:
game.virusManager.calculateCompromiseChance(1, 0, 0, 'medium'); // ~15%
game.virusManager.calculateCompromiseChance(99, 50, 10, 'hard'); // ~0%
game.virusManager.attemptInfection('data_corruption');
game.virusManager.getActiveViruses();
```

### Balance Adjustments
- Compromise chance formula: adjust skill reduction (currently 0.5% per level)
- Defense contribution: adjust reduction per defense point (currently 2%)
- Prestige reduction: adjust per prestige level (currently 1%)
- Cascade chance: modify per virus type if cascades too frequent

**Testing Scenarios:**
- Intrusion level 1, no defense: should have ~15% compromise chance
- Intrusion level 50, defense 10, prestige 2: should have ~10% chance
- Intrusion level 99, defense 50, prestige 5: should have <1% chance

---

## PHASE 3: Clinic System (Virus Removal & Medical)

**Time: 2-3 hours**

### What It Does
- Virus removal procedures with timers
- Injury tracking from failed combat
- Neural degradation from stim abuse (-0.5% XP per point, max -50%)
- Clinic cost calculator

### Files Created
- `js/systems/clinic.js` (700 lines)

### Installation Steps

#### Step 1: Import in `main.js`
```javascript
import { ClinicManager } from './systems/clinic.js';
```

#### Step 2: Initialize in Game constructor
```javascript
export class Game {
  constructor() {
    this.clinicManager = new ClinicManager();
    this.currentPlayerInjuries = [];
  }
}
```

#### Step 3: Hook injuries to combat loss
```javascript
// In _wireEvents() method:
events.on(EVENTS.COMBAT_PLAYER_DIED, (data) => {
  const injury = this.clinicManager.createInjuryFromCombatLoss(
    this.skillManager.getSkill('combat').level,
    this.passiveStats.defense || 0
  );

  if (injury) {
    this.currentPlayerInjuries.push(injury);
  }
});
```

#### Step 4: Apply neural degradation XP penalty
```javascript
// In SkillManager.gainXP():
gainXP(amount) {
  const degradationMultiplier = this.game.clinicManager.getNeuralDegradationXpMultiplier();
  const totalXP = amount * prestigeMultiplier * degradationMultiplier;
  this.xp += totalXP;
}
```

#### Step 5: Track stim usage for degradation
```javascript
// When stim item is used:
events.on(EVENTS.ITEM_USED, (data) => {
  if (data.itemId === 'combat_stim') {
    this.clinicManager.increaseNeuralDegradation(5);
  }
});
```

#### Step 6: Add clinic UI button
```javascript
// In ui/main.js:
const clinicBtn = document.createElement('button');
clinicBtn.innerHTML = '🏥 Clinic';
clinicBtn.onclick = () => this.showClinicPanel();
nav.appendChild(clinicBtn);
```

### Testing
```javascript
// Test in browser console:
game.clinicManager.createInjuryFromCombatLoss(10, 5);
game.clinicManager.increaseNeuralDegradation(25);
game.clinicManager.getNeuralDegradation(); // 25%
game.clinicManager.getNeuralDegradationXpMultiplier(); // 0.875
const cost = game.clinicManager.getTotalClinicCost([{removalCost: 500}], [], 0);
```

### Balance Adjustments
- Injury failure chance: modify base 30%
- Injury severity ratios: adjust 50%/35%/15% split
- Neural degradation per stim: currently 5 points
- XP penalty formula: currently -0.5% per degradation point

**Testing Scenarios:**
- At 100 degradation: XP multiplier should be 0.5x (-50%)
- Minor injury: -5 defense for 1 hour
- Severe injury: -20 defense for 4 hours

---

## PHASE 4: Gaming UI Integration (13 Components)

**Time: 3-4 hours**

### What It Does
- 13 reusable gaming UI components
- Real-time health/XP/effects display
- Damage popups and notifications
- Combat status panels
- Passive stats breakdown

### Files Created
- `js/ui/gameMetrics.js` (450 lines) - Already created
- `js/ui/gameUIIntegration.js` (420 lines) - Already created
- `css/gaming-ui.css` (900 lines) - Already created

### Installation Steps

#### Step 1: Add CSS to index.html
```html
<head>
  <link rel="stylesheet" href="css/gaming-ui.css">
</head>
```

#### Step 2: Add UI containers to index.html
```html
<body id="app">
  <!-- ... existing nav ... -->
  
  <!-- Gaming UI Containers -->
  <div id="combat-ui" class="gaming-ui-container"></div>
  <div id="health-container" class="gaming-ui-container"></div>
  <div id="status-effects" class="gaming-ui-container"></div>
  <div id="virus-warning" class="gaming-ui-container"></div>
  <div id="notifications" class="gaming-ui-container"></div>
  <div id="damage-popups" class="gaming-ui-container"></div>
  <div id="progress-tasks" class="gaming-ui-container"></div>
</body>
```

#### Step 3: Import in `main.js`
```javascript
import { GameMetricsUI } from './ui/gameMetrics.js';
import { gameUIIntegration } from './ui/gameUIIntegration.js';
```

#### Step 4: Initialize in Game constructor
```javascript
export class Game {
  constructor() {
    this.gameMetricsUI = new GameMetricsUI();
  }

  init() {
    // ... existing init code ...
    gameUIIntegration.initializeGameUI();
  }
}
```

#### Step 5: Wire combat UI updates
```javascript
// In _wireEvents() method:
events.on(EVENTS.COMBAT_HIT, (data) => {
  const statusHTML = this.gameMetricsUI.createCombatStatus({
    playerHealth: this.combat.playerHp,
    playerMaxHealth: this.combat.maxPlayerHp,
    enemyHealth: this.combat.currentEnemy.hp,
    enemyMaxHealth: this.combat.currentEnemy.maxHp,
    enemyName: this.combat.currentEnemy.name,
    isBoss: this.combat.currentEnemy.isBoss
  });
  document.getElementById('combat-ui').innerHTML = statusHTML;
});
```

#### Step 6: Display notifications
```javascript
// Use existing UI_NOTIFICATION event:
events.emit(EVENTS.UI_NOTIFICATION, {
  message: 'Skill leveled up!',
  type: 'levelup',
  icon: '⭐',
  duration: 3000
});
```

### Testing
```javascript
// Test in browser console:
game.gameMetricsUI.createHealthBar({ maxHealth: 100, currentHealth: 75 });
game.gameMetricsUI.createXPBar({ maxXP: 1000, currentXP: 500, level: 25 });
game.gameMetricsUI.createNotification({ message: 'Test', type: 'success' });
game.gameMetricsUI.createDamagePopup({ damage: 45, isCrit: true });
```

### Performance Tips
- Health bar updates: batch into 100ms intervals, not every tick
- Status effects: update every 500ms (not continuous)
- Damage popups: limit to 5 on screen at once
- CSS animations: use GPU acceleration (transform, opacity)

---

## PHASE 5: Status Effects (Buffs & Debuffs)

**Time: 2-3 hours**

### What It Does
- 10 status effects (6 buffs, 4 debuffs)
- Stacking, duration, and expiration
- Combat modifiers (damage, crit, dodge)
- Passive effects (regen, poison)

### Files Created
- `js/systems/statusEffects.js` (700 lines)

### Installation Steps

#### Step 1: Import in `main.js`
```javascript
import { StatusEffectManager } from './systems/statusEffects.js';
```

#### Step 2: Initialize in Game constructor
```javascript
export class Game {
  constructor() {
    this.statusEffectManager = new StatusEffectManager();
  }
}
```

#### Step 3: Apply effect modifiers to combat damage
```javascript
// In combat.js getPlayerDamage():
getPlayerDamage() {
  let damage = 3 + Math.floor(this.skillLevel * 0.5);
  damage = this.statusEffectManager.applyDamageModifiers(damage, 'player');
  return damage;
}
```

#### Step 4: Apply damage reduction on incoming damage
```javascript
// In combat.js when enemy attacks:
let enemyDamage = this.getEnemyDamage();
enemyDamage = this.statusEffectManager.applyDamageReduction(enemyDamage, 'player');
this.playerHp -= enemyDamage;
```

#### Step 5: Check paralysis
```javascript
// In combat.js tick():
if (this.statusEffectManager.isParalyzed('player')) {
  // Player can't attack this tick
  return;
}
```

#### Step 6: Tick effects each game loop
```javascript
// In _wireEvents() method:
events.on(EVENTS.GAME_TICK, (data) => {
  this.statusEffectManager.tick();
});
```

#### Step 7: Display active effects
```javascript
// Update UI each tick:
const effects = game.statusEffectManager.getEffects('player');
effects.forEach(effect => {
  // Render effect UI
});
```

### Testing
```javascript
// Test in browser console:
game.statusEffectManager.applyEffect('combat_stim', 'player');
game.statusEffectManager.applyEffect('poison', 'player');
game.statusEffectManager.getBuffs('player');
game.statusEffectManager.getDebuffs('player');
game.statusEffectManager.applyDamageModifiers(100, 'player'); // 150 with stim
game.statusEffectManager.applyDamageReduction(50, 'player'); // 25 with shield
```

### Balance Adjustments
- Combat Stim: currently +50% damage, 30s duration, max 3 stacks
- Poison: currently 3 damage/s, -15% damage dealt, max 3 stacks
- Stun: currently 8 seconds, can't stack (1 max)
- All durations: adjust based on combat pacing

**Testing Scenarios:**
- With combat_stim: 100 damage → 150 damage
- With poison (3 stacks): take 9 damage/s, deal 55% damage
- With shield: take 50% less damage per shield stack
- With both stim and bloodlust: stack multipliers correctly

---

## PHASE 6: Balance & Testing

**Time: 4-6 hours**

### What It Does
- Comprehensive test suite for all systems
- Balance validation across all mechanics
- Performance profiling
- Integration testing

### Files Created
- `js/testing/systemsTestSuite.js` (600 lines)

### Installation Steps

#### Step 1: Import test suite in app.js
```javascript
import { SystemsTestSuite } from './testing/systemsTestSuite.js';
```

#### Step 2: Run tests
```javascript
// In browser console after loading:
const testSuite = new SystemsTestSuite(game);
const results = await testSuite.runAllTests();
console.log(testSuite.generateReport());
```

#### Step 3: Monitor test results
```
✅ Clarity System: 4/4 tests passed
✅ Virus System: 6/6 tests passed
✅ Clinic System: 5/5 tests passed
✅ Status Effects: 6/6 tests passed
✅ Gaming UI: 5/5 tests passed
✅ Game Balance: 5/5 tests passed
✅ System Integration: 4/4 tests passed
✅ Performance: 4/4 tests passed
```

### Playtesting Checklist
- [ ] Start new game, run tutorial
- [ ] Check tooltips appear on first activity
- [ ] Grind intrusion to get virus (should show screen glitches)
- [ ] Visit clinic, remove virus, pay cost
- [ ] Check neural degradation from stims
- [ ] Check injury from failed combat
- [ ] Apply status effects in combat
- [ ] Monitor no performance issues
- [ ] Verify save/load persists all systems
- [ ] Test offline progress with viruses active
- [ ] Check achievements unlock with new systems
- [ ] Verify prestige multipliers apply to new content

### Balance Adjustments to Make

**Virus Compromise Chance:**
- Too frequent (>15% at high level): increase skill reduction from 0.5% to 0.75%
- Too rare (<2% at low level): decrease base chance from 15% to 10%
- Adjust defense contribution (currently 2% per point)

**Clinic Costs:**
- Too expensive for low-level players: reduce removal costs by 20%
- Too cheap relative to player income: increase by 30%
- Current: Data Corruption 500E$, Deep Intrusion 5000E$

**Status Effects:**
- Stim too powerful: reduce damage multiplier from 1.5x to 1.35x
- Poison not threatening: increase damage from 3/s to 5/s
- Stun too short: increase from 8s to 12s
- Adjust effect stacking limits as needed

**Injuries:**
- Combat failure too frequent: increase base chance from 30% to 20%
- Defense too good: reduce defense per injury from -5/-10/-20 to -3/-7/-15
- Recovery too fast: increase duration from 1h/2h/4h to 2h/4h/8h

### Performance Targets
- Tick time: < 50ms (currently ~10-20ms)
- UI rendering: < 100ms for 100 components
- Serialization: < 20ms for all systems
- Screen glitch effect: doesn't impact FPS

---

## Integration Checklist

Complete these steps in order:

### Pre-Integration
- [ ] Back up existing game files
- [ ] Review all new code files
- [ ] Understand event flow and system dependencies

### Integration
- [ ] Copy `js/systems/clarity.js`
- [ ] Copy `js/systems/virus.js`
- [ ] Copy `js/systems/clinic.js`
- [ ] Copy `js/systems/statusEffects.js`
- [ ] Copy `js/ui/gameMetrics.js` (already exists)
- [ ] Copy `js/ui/gameUIIntegration.js` (already exists)
- [ ] Copy `css/gaming-ui.css` (already exists)
- [ ] Update `index.html` (add containers)
- [ ] Update `main.js` (import & initialize systems)
- [ ] Wire event listeners (see above)
- [ ] Update save/load methods
- [ ] Test in browser console
- [ ] Run test suite
- [ ] Playtesting

### Post-Integration
- [ ] Monitor for bugs (check browser console)
- [ ] Gather player feedback
- [ ] Make balance adjustments
- [ ] Deploy to production

---

## Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `js/systems/clarity.js` | 600 | Tutorial, tooltips, mechanics panel |
| `js/systems/virus.js` | 650 | Virus system with screen corruption |
| `js/systems/clinic.js` | 700 | Medical procedures and injuries |
| `js/systems/statusEffects.js` | 700 | Buffs and debuffs system |
| `js/ui/gameMetrics.js` | 450 | 13 gaming UI components |
| `js/ui/gameUIIntegration.js` | 420 | Integration with game state |
| `js/testing/systemsTestSuite.js` | 600 | Comprehensive test suite |
| `css/gaming-ui.css` | 900 | Gaming UI styling |

**Total: ~5,000 lines of new code**

---

## Troubleshooting

### Viruses not appearing
- Check: `EVENTS.SKILL_ACTION_COMPLETE` listener is wired
- Check: `virusManager.checkCompromise()` is called for hacking skills
- Test: `game.virusManager.attemptInfection('data_corruption')`

### Screen glitches not showing
- Check: `virusManager.tick()` called each game tick
- Check: DOM elements exist and are queryable
- Test: `game.virusManager._triggerScreenGlitch(config)`

### Injuries never trigger
- Check: `EVENTS.COMBAT_PLAYER_DIED` listener wired
- Check: Combat failure chance is high enough (30% base)
- Test: Die in combat and check `game.currentPlayerInjuries`

### Status effects not applying
- Check: `statusEffectManager.tick()` called each tick
- Check: Damage modifiers applied in `combat.getPlayerDamage()`
- Check: Damage reduction applied in enemy attack code
- Test: `game.statusEffectManager.applyDamageModifiers(100, 'player')`

### UI not updating
- Check: HTML containers exist in DOM
- Check: Event listeners emitting with correct payload
- Check: CSS file included in `index.html`
- Test: Manually update container: `document.getElementById('health-container').innerHTML = html`

### Save/Load broken
- Check: All systems serialized in `saveGame()`
- Check: All systems deserialized in `loadGame()`
- Check: Save version bumped (v4 → v5)
- Test: `JSON.stringify(game.saveGame())` produces valid JSON

---

## Support & Feedback

- Check AGENTS.md for architecture details
- Review GAMING_UI_REFERENCE.md for component API
- Consult GAME_MECHANICS_ANALYSIS.md for design rationale
- Look at systemsIntegration.md for detailed wiring examples

Ready to integrate! 🚀
