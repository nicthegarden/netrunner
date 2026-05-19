# 🚀 NETRUNNER SYSTEMS - QUICK START CHECKLIST

## ✅ All 6 Phases Complete - Ready for Integration!

---

## 📋 Integration Checklist (1-2 hours)

### Step 1: Copy New System Files
```bash
# Verify destination exists:
ls -la js/systems/
ls -la js/ui/
ls -la js/testing/
```

✅ Systems Files (NEW):
- [ ] `js/systems/clarity.js` (600 lines)
- [ ] `js/systems/virus.js` (650 lines)
- [ ] `js/systems/clinic.js` (700 lines)
- [ ] `js/systems/statusEffects.js` (700 lines)
- [ ] `js/testing/systemsTestSuite.js` (600 lines)

✅ UI Files (ALREADY CREATED):
- [ ] `js/ui/gameMetrics.js` (450 lines)
- [ ] `js/ui/gameUIIntegration.js` (420 lines)
- [ ] `css/gaming-ui.css` (900 lines)

### Step 2: Update index.html
**Add these containers in main content area:**
```html
<!-- Gaming UI Containers -->
<div id="combat-ui"></div>
<div id="health-container"></div>
<div id="status-effects"></div>
<div id="virus-warning"></div>
<div id="notifications"></div>
<div id="damage-popups"></div>
<div id="progress-tasks"></div>

<!-- CSS -->
<link rel="stylesheet" href="css/gaming-ui.css">
```

✅ [ ] Added CSS link
✅ [ ] Added 7 UI containers

### Step 3: Update js/main.js

**Add imports at top:**
```javascript
import { claritySystem } from './systems/clarity.js';
import { VirusManager } from './systems/virus.js';
import { ClinicManager } from './systems/clinic.js';
import { StatusEffectManager } from './systems/statusEffects.js';
import { GameMetricsUI } from './ui/gameMetrics.js';
import { gameUIIntegration } from './ui/gameUIIntegration.js';
```

**In Game constructor:**
```javascript
this.claritySystem = claritySystem;
this.virusManager = new VirusManager();
this.clinicManager = new ClinicManager();
this.statusEffectManager = new StatusEffectManager();
this.gameMetricsUI = new GameMetricsUI();
this.currentPlayerInjuries = [];
```

**In init() method:**
```javascript
gameUIIntegration.initializeGameUI();
```

✅ [ ] Added imports
✅ [ ] Initialized systems in constructor
✅ [ ] Called gameUIIntegration.initializeGameUI()

### Step 4: Wire Event Listeners

**In Game._wireEvents() method, add:**

```javascript
// Virus compromise check for hacking
events.on(EVENTS.SKILL_ACTION_COMPLETE, (data) => {
  if (data.skill.id === 'intrusion' || data.skill.id === 'decryption') {
    const compromise = this.virusManager.checkCompromise(
      data.skill.level, this.passiveStats.defense, this.prestige.level, 'medium'
    );
    if (compromise) {
      this.virusManager.attemptInfection(compromise.id);
    }
  }
});

// Injury tracking from combat loss
events.on(EVENTS.COMBAT_PLAYER_DIED, (data) => {
  const injury = this.clinicManager.createInjuryFromCombatLoss(
    this.skillManager.getSkill('combat').level, this.passiveStats.defense
  );
  if (injury) this.currentPlayerInjuries.push(injury);
});

// Apply status effect damage/regen
events.on(EVENTS.GAME_TICK, (data) => {
  this.virusManager.tick();
  this.statusEffectManager.tick();
  
  const playerDamage = this.statusEffectManager.getPassiveDamagePerTick('player');
  if (playerDamage > 0 && this.combat.playerHp) {
    this.combat.playerHp = Math.max(0, this.combat.playerHp - playerDamage);
  }
});

// Update combat UI
events.on(EVENTS.COMBAT_HIT, (data) => {
  const statusHTML = this.gameMetricsUI.createCombatStatus({
    playerHealth: this.combat.playerHp,
    playerMaxHealth: this.combat.maxPlayerHp,
    enemyHealth: this.combat.currentEnemy.hp,
    enemyMaxHealth: this.combat.currentEnemy.maxHp,
    enemyName: this.combat.currentEnemy.name
  });
  document.getElementById('combat-ui').innerHTML = statusHTML;
});
```

✅ [ ] Wired virus compromise check
✅ [ ] Wired injury from combat loss
✅ [ ] Wired effect damage/regen ticks
✅ [ ] Wired combat UI updates

### Step 5: Update Save/Load

**In Game.saveGame():**
```javascript
const saveData = {
  version: 5, // Bump from 4 to 5
  // ... existing data ...
  clarity: this.claritySystem.serialize(),
  viruses: this.virusManager.serialize(),
  clinic: this.clinicManager.serialize(),
  statusEffects: this.statusEffectManager.serialize(),
  currentPlayerInjuries: this.currentPlayerInjuries || []
};
```

**In Game.loadGame(saveData):**
```javascript
// ... existing load code ...
this.claritySystem.deserialize(saveData.clarity);
this.virusManager.deserialize(saveData.viruses);
this.clinicManager.deserialize(saveData.clinic);
this.statusEffectManager.deserialize(saveData.statusEffects);
this.currentPlayerInjuries = saveData.currentPlayerInjuries || [];
```

✅ [ ] Bumped save version to 5
✅ [ ] Added serialization for all systems
✅ [ ] Added deserialization for all systems

### Step 6: Test Everything

```javascript
// In browser console:
// Test 1: Systems initialized
console.log(game.claritySystem);
console.log(game.virusManager);
console.log(game.clinicManager);
console.log(game.statusEffectManager);

// Test 2: Create a virus
game.virusManager.attemptInfection('data_corruption');

// Test 3: Apply status effect
game.statusEffectManager.applyEffect('combat_stim', 'player');

// Test 4: Run full test suite
const testSuite = new SystemsTestSuite(game);
const results = await testSuite.runAllTests();

// Test 5: Verify save/load
const save1 = JSON.stringify(game.saveGame());
game.loadGame(JSON.parse(save1));
const save2 = JSON.stringify(game.saveGame());
console.log('Saves match:', save1 === save2);
```

✅ [ ] Systems initialize without error
✅ [ ] Can create virus
✅ [ ] Can apply status effect
✅ [ ] Test suite passes 39/39 tests
✅ [ ] Save/load works correctly

### Step 7: Playtest

**New Player Experience:**
- [ ] Tutorial runs on first game
- [ ] Tooltips appear for new mechanics
- [ ] Can grind skills without issues

**Virus System:**
- [ ] Hacking activity compromises (~15% at level 1)
- [ ] Screen corruption visible (text scrambled, red tint)
- [ ] Can visit clinic to remove virus (costs 500-5000 E$)

**Combat:**
- [ ] Failed combat causes injury
- [ ] Can use status effects (stim, poison, etc)
- [ ] Damage popups display correctly

**Persistence:**
- [ ] Save/load preserves all systems
- [ ] Viruses persist across reloads
- [ ] Injuries persist across reloads
- [ ] Offline progress accounts for viruses

---

## 📚 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `PHASE_6_COMPLETION_SUMMARY.md` | Overview of all systems | 5 min |
| `COMPLETE_IMPLEMENTATION_GUIDE.md` | Detailed integration steps | 30 min |
| `js/integration/systemsIntegration.md` | Code wiring examples | 20 min |
| `GAMING_UI_REFERENCE.md` | Component API docs | 15 min |
| `AGENTS.md` | Architecture guidelines | 15 min |

**Recommended reading order:**
1. This file (QUICK_START_CHECKLIST.md)
2. PHASE_6_COMPLETION_SUMMARY.md
3. COMPLETE_IMPLEMENTATION_GUIDE.md
4. js/integration/systemsIntegration.md

---

## 🆘 Troubleshooting

### Issue: "Cannot find module 'clarity.js'"
**Solution:** Make sure file is at `js/systems/clarity.js` and import path matches

### Issue: "virusManager is undefined"
**Solution:** Make sure you initialized it: `this.virusManager = new VirusManager();`

### Issue: "Viruses never appear"
**Solution:** Verify event listener is wired for `EVENTS.SKILL_ACTION_COMPLETE`

### Issue: "Screen corruption not showing"
**Solution:** Make sure `virusManager.tick()` is called in `EVENTS.GAME_TICK` handler

### Issue: "Test suite failing"
**Solution:** Run individual tests to find the problem, check console for errors

---

## 📊 Success Metrics

✅ **After integration, you should see:**
- [ ] Tutorial appears for new games
- [ ] Virus system prevents risk-free hacking
- [ ] Screen glitches immersively show virus severity
- [ ] Clinic is accessible and useful
- [ ] Combat feels more dynamic with status effects
- [ ] UI shows real-time health/effects/status
- [ ] All 39 test cases pass
- [ ] Performance is smooth (<50ms per tick)
- [ ] Save/load works perfectly
- [ ] Players understand hidden mechanics better

---

## ⏱️ Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Read this checklist | 5 min | ✅ Now |
| Copy files | 5 min | Next |
| Update HTML | 5 min | Next |
| Update main.js | 15 min | Next |
| Wire events | 20 min | Next |
| Update save/load | 10 min | Next |
| Test systems | 10 min | Next |
| Initial playtest | 30 min | Then |
| Balance adjustments | 1-2 hrs | After testing |
| **Total** | **1.5-2 hours** | 🎉 |

---

## 🎯 Next Steps

1. **RIGHT NOW:** Read PHASE_6_COMPLETION_SUMMARY.md
2. **THEN:** Follow COMPLETE_IMPLEMENTATION_GUIDE.md step-by-step
3. **THEN:** Run the test suite in browser console
4. **THEN:** Playtest for 30 minutes
5. **THEN:** Make balance adjustments based on feel
6. **THEN:** Deploy to production! 🚀

---

## 📞 Quick Reference

**All system files in:**
- `js/systems/` - Core logic
- `js/ui/` - UI components
- `js/testing/` - Test suite
- `css/` - Styling

**All documentation in:**
- Root directory (*.md files)
- `js/integration/` - Wiring details

**Test command:**
```javascript
const testSuite = new SystemsTestSuite(game);
await testSuite.runAllTests();
console.log(testSuite.generateReport());
```

**Expected result:** ✅ 39/39 tests passing

---

**🎉 You're ready to go! Good luck deploying! 🚀**
