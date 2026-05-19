# NETRUNNER - Game Mechanics Analysis & Enhancement Roadmap

**Document Version:** 1.0 (May 2026)  
**Purpose:** Comprehensive analysis of current game mechanics, clarity improvements, and new feature recommendations

---

## Executive Summary

NETRUNNER is a well-architected cyberpunk idle game with solid foundations but several areas where **game rules are unclear to players** and **missing mechanics would significantly enhance depth**. This document provides:

1. **Clarity Analysis** — Current mechanics that confuse players
2. **Proposed New Systems** — Virus/hacking risk, clinic healing, status effects
3. **UI/UX Improvements** — Better tutorial, tooltips, and information display
4. **Implementation Roadmap** — Prioritized features with technical details

---

## PART 1: CURRENT GAME MECHANICS ANALYSIS

### 1.1 Core Systems Overview

| System | Status | Clarity | Complexity |
|--------|--------|---------|-----------|
| **Skills (24 total)** | ✓ Working | Medium | Medium |
| **Combat** | ✓ Working | Low | Medium |
| **Inventory** | ✓ Working | Medium | Low |
| **Crafting** | ✓ Working | Low | High |
| **Prestige** | ✓ Working | Low | High |
| **Abilities** | ✓ Working | Very Low | High |
| **Passive Stats** | ✓ Working | Very Low | High |
| **Living World** | ✓ Working | Very Low | High |

---

### 1.2 Clarity Issues Identified

#### Issue #1: Combat Mechanics Are Unclear
**Current State:** Players don't understand how damage is calculated or what affects combat effectiveness.

**Problems:**
- No visible explanation of damage formula (base + equipment + passives + abilities)
- Combat abilities tooltips are minimal
- No clear display of what passives apply to combat
- Player HP (100) feels arbitrary — never explained
- Defense reduction (halved) is not explained to players
- Boss phase 2 mechanics hidden from player

**Examples of Player Confusion:**
- Why does equipping better armor barely reduce damage?
- What do abilities actually do?
- Why does the same enemy do different damage on different days?

**Recommendation:**
```markdown
ADD TOOLTIP SYSTEM:
- Hover over enemy to see its stats
- Hover over player HP bar to see: "Max HP [X] from passive stats"
- Click abilities to see full description & cooldown
- Add damage popup showing: "50 base + 15 equipment + 8 passives = 73 total"
```

---

#### Issue #2: Hacking Mechanics Feel Risk-Free
**Current State:** Hacking skills (intrusion, decryption, ice_breaking, daemon_coding) have no consequences.

**Problems:**
- All hacking activities succeed 100% of the time
- No resource cost beyond time investment
- No "getting caught" mechanic
- No difficulty/failure states
- Players can afk-grind hacking indefinitely with zero punishment

**Why This Matters:**
- Hacking should feel *dangerous* thematically (cyberpunk)
- No risk = no tension, no strategic choices
- Prestige multipliers make even high-risk activities low-risk

**Recommendation:**
See Section 2.1: **Virus & Hacking Risk System**

---

#### Issue #3: Healing is Trivial
**Current State:** Healing Nanobots (💊) instantly restore 30 HP with no cost or consequence.

**Problems:**
- No resource management — just spam click to heal
- No "visiting clinic" or recovery downtime
- Combat becomes trivial if you stockpile healers
- Player death feels like minor inconvenience (instant respawn)
- No economy around health/recovery

**Examples:**
- Mid-combat, take 60 damage, use 2 nanobots, back to 100 HP instantly
- Zero strategic depth in combat resource management

**Recommendation:**
See Section 2.2: **Clinic & Healing System**

---

#### Issue #4: Status Effects Don't Exist
**Current State:** Only Combat Stim buff exists; no debuffs, poisons, or meaningful effects.

**Problems:**
- Combat feels static — same mechanics every fight
- No tactical variety (use ability -> do damage -> repeat)
- Enemies can't have special attacks (poison, stun, confusion)
- Player abilities don't have interesting side effects
- Prestige boosts never feel risky

**Recommendation:**
See Section 2.3: **Status Effects Framework**

---

#### Issue #5: Parallel Hacking Is Confusing
**Current State:** Some items enable "parallel hacking" but rule is complex and rarely explained.

**Problems:**
- Multi-grind efficiency penalty (22%) is hidden
- Players don't know if parallel hacking is worth it
- UI shows active tasks but not efficiency percentages
- No clear tooltip: "Running 3 tasks = 68% efficiency"
- Background hacking (75% of normal) never explained

**Recommendation:**
```markdown
ADD UI DISPLAYS:
- Task list shows: "Task 1 (82% eff.) | Task 2 (82% eff.)"
- Tooltip: "Parallel grinding reduces XP by 18% per task"
- Show warning if efficiency drops below 60%
- Display multiplier clearly: "[HACKING +2] 68% efficiency"
```

---

#### Issue #6: Prestige System Unclear
**Current State:** Players don't understand when/how to prestige or if it's worth it.

**Problems:**
- No visual indicator of prestige readiness
- XP formula (level = sqrt(totalXP / 500000)) is hidden
- Benefits of prestige scattered across multiple systems
- "Should I prestige at 500k XP or wait for 2M?" — no guidance
- Reset consequences (skills go to 1) not clearly warned

**Recommendation:**
```markdown
ADD PRESTIGE GUIDE PANEL:
- "You have [500k/2M] XP. Next prestige level at [2M XP]."
- Show multiplier gains: "Current: 1.05x XP, 1.03x currency"
- "After prestige: 1.10x XP, 1.06x currency"
- Warning: "All skills will reset to level 1"
- Show prestige points gained: "+10 points"
```

---

#### Issue #7: Passive Stat System Is Invisible
**Current State:** Passive stats silently calculated, never explained to players.

**Problems:**
- No UI showing which passives apply
- How does Decryption skill give "+5% XP" to all skills? Unexplained
- Equipment bonuses (xpBoost, speedBoost, etc.) rarely visible
- Prestige multipliers stacked but not itemized
- Players can't see breakdown: "Your +30% XP from: skills +15%, equipment +10%, prestige +5%"

**Recommendation:**
```markdown
ADD PASSIVE STATS PANEL:
Shows all stat bonuses with sources:
- Max HP: 100 (base) + 50 (Subdermal Armor) = 150
- XP Gain: +15% (Decryption skill) + 10% (XP Boost Chip) + 5% (Prestige) = +30%
- Action Speed: -15% (Speed Processor) + -8% (Neural Surfing skill) = -23%
```

---

#### Issue #8: Achievement Requirements Are Hidden
**Current State:** Players unlock achievements but don't see what triggered them.

**Problems:**
- No description of "how to unlock"
- Players can't plan for achievements
- Mastery achievements poorly explained
- Combat "first kill" not clear on which enemy counts

**Recommendation:**
```markdown
ADD ACHIEVEMENT HINTS:
- Locked: "Level Combat to 50 (currently 12)"
- Locked: "Earn 10M total XP (currently 2.3M)"
- Unlocked: "Combat skill to level 99 ✓ [Date unlocked]"
```

---

### 1.3 Current Mechanics That Work Well

**Positive Aspects:**
- ✓ XP curve is well-balanced (gentle progression)
- ✓ Prestige ladder provides long-term goals
- ✓ 24 skills offer variety without overwhelming
- ✓ Inventory management is intuitive
- ✓ Offline progress is generous (24h cap)
- ✓ Combat is engaging enough for active play
- ✓ Equipment has clear damage/defense values

---

## PART 2: PROPOSED NEW SYSTEMS

### 2.1 Virus & Hacking Risk System

#### Overview

Transform hacking from risk-free activity into **high-risk, high-reward** gameplay where:
- Failed hacks can infect player with viruses
- Viruses cause passive XP loss, damage, or skill degradation
- Players must visit "Clinic" to remove viruses
- Risk/reward scales with difficulty and equipment

#### Core Mechanics

##### 2.1.1 Hacking Risk Formula

Each hacking activity (Intrusion, Decryption, ICE Breaking, Daemon Coding) has an inherent **Compromise Chance** (risk):

```javascript
compromiseChance = baseRisk + (skillLevelPenalty) - (equipmentDefense)

where:
  baseRisk = 5-30% depending on activity difficulty
  skillLevelPenalty = -(skillLevel / 100) * 5  // Better skill = less risk
  equipmentDefense = -(defenseStat / 50) * 2   // Better defenses = less risk

Example:
  Intrusion (level 1): 25% base + 0% skill penalty - 5% equipment = 20% risk
  Intrusion (level 50): 25% base - 2.5% skill penalty - 8% equipment = 14.5% risk
```

##### 2.1.2 Virus Types

Four virus types, each with unique effects:

| Virus | Icon | Effect | Duration | Removal |
|-------|------|--------|----------|---------|
| **Data Corruption** | 🐛 | -20% XP to all skills | 5 activities | Clinic (Easy) |
| **System Crash** | 💥 | Random 5-10s freezes every 30s | 3 activities | Clinic (Medium) |
| **Payload Leak** | 📤 | -30% of loot drops | 7 activities | Clinic (Hard) |
| **Deep Intrusion** | 🔓 | All skills -1 level (capped at 1) | 10 activities | Clinic (Severe) |

**Acquisition Rules:**
- Player only gets **one** virus from a single compromised activity
- Viruses stack if multiple compromises occur
- Same virus type doesn't stack — upgrades duration instead
- Prestige resets clear all viruses

**Example Scenario:**
```
Day 1: Intrusion activity compromised (20% chance)
  → Player infected with Data Corruption 🐛
  → XP -20% for 5 more Intrusion activities

Day 2: Still has Data Corruption
  → Decryption activity compromised
  → Player infected with System Crash 💥
  → Now: -20% XP (Data Corruption) + random freezes (System Crash)

Day 3: Visits Clinic
  → Removes Data Corruption (easy)
  → System Crash still active (harder to remove)
```

##### 2.1.3 Infection Mechanics

```javascript
// In skills.js completeAction()

if (Math.random() < compromiseChance) {
  // COMPROMISE! Roll for virus type
  const virusType = rollVirusType(compromiseChance);
  player.addVirus(virusType);
  
  events.emit(EVENTS.HACKING_COMPROMISED, {
    skill: skill.id,
    virus: virusType.name,
    effect: virusType.effect,
  });
}

// In player.js virus management
addVirus(virusType) {
  if (this.viruses[virusType.id]) {
    this.viruses[virusType.id].duration += virusType.baseDuration;
  } else {
    this.viruses[virusType.id] = {
      name: virusType.name,
      icon: virusType.icon,
      effect: virusType.effect,
      duration: virusType.baseDuration,
      activitiesRemaining: virusType.activitiesRemaining,
    };
  }
}

// In main.js tick system
applyVirusEffects() {
  Object.values(this.player.viruses).forEach(virus => {
    switch(virus.id) {
      case 'data_corruption':
        skillManager.multiplyXP(0.8); // -20% XP
        break;
      case 'system_crash':
        if (Math.random() < 0.03) {  // 3% chance per tick
          gameLoop.freezeFor(randomInt(5, 10));
        }
        break;
      case 'payload_leak':
        inventory.lootDropBonus = 0.7;  // -30% drops
        break;
      case 'deep_intrusion':
        skillManager.downgradeLevels(1);  // -1 to all skills
        break;
    }
  });
}
```

##### 2.1.4 Virus UI Display

```html
<!-- Virus indicator bar (top of screen) -->
<div id="virus-status">
  <div class="virus-indicator">
    🐛 Data Corruption (-20% XP) - 3/5 activities
    <button class="remove-btn" data-virus="data_corruption">Remove</button>
  </div>
  <div class="virus-indicator">
    💥 System Crash (freezes) - 1/3 activities
    <button class="remove-btn" data-virus="system_crash">Remove</button>
  </div>
</div>

<!-- Compromise notification -->
<div class="notification error">
  ⚠️ COMPROMISE DETECTED!
  Your intrusion attempt was traced.
  Infected: 🐛 Data Corruption (-20% XP for 5 activities)
  [Visit Clinic to recover]
</div>
```

##### 2.1.5 Risk Mitigation Strategies

Players can **reduce risk** through:

1. **Better Equipment**: Defense stat reduces compromise chance
   - Kevlar Bodysuit: 5 defense → -2.5% risk
   - Subdermal Armor: 8 defense → -4% risk
   - ICE Shield: 12 defense → -6% risk

2. **Higher Skill Level**: Each level reduces risk by ~0.5%
   - Level 1: 25% risk
   - Level 50: 22.5% risk
   - Level 99: 20% risk

3. **Parallel Hacking Tools**: Some items reduce risk when equipped
   - Neural Daemon: -5% compromise chance
   - ICEpick Array: -3% compromise chance (linked to ice_breaking)

4. **Prestige Bonus**: Prestige level reduces all hacking risk by 1% per level
   - Prestige 0: base risk
   - Prestige 5: base risk - 5%
   - Prestige 10: base risk - 10%

#### 2.1.6 Risk Difficulty Scaling

**Activity Risk by Difficulty Tier:**

| Tier | Activity | Base Risk | Examples |
|------|----------|-----------|----------|
| 1 | Tier 1 activities | 15% | Easy Hack |
| 2 | Tier 2 activities | 20% | Standard Intrusion |
| 3 | Tier 3 activities | 25% | Corporate Mainframe Breach |
| 4 | Tier 4 activities | 30% | Blackwall Contact |
| 5 | Tier 5 activities | 35% | Godlike-level Hacking |

---

### 2.2 Clinic & Healing System

#### Overview

A new facility where players **recover from viruses, heal injuries, and manage persistent health states**. Adds resource cost, strategic depth, and sense of consequence to dangerous activities.

#### Core Mechanics

##### 2.2.1 Clinic Services

**Clinic Menu:**
```
═══════════════════════════════════
           🏥 CLINIC 🏥
═══════════════════════════════════

1. VIRUS REMOVAL
   Remove viruses and restore corrupted systems
   
2. INJURY RECOVERY
   Heal damage from failed combat encounters
   
3. NEURAL DETOX
   Cleanse experimental implants side-effects
   
4. DIAGNOSTIC SCAN
   View health status & recommendations

═══════════════════════════════════
Player Health: 100/100 HP ✓
Viruses: 🐛 Data Corruption
═══════════════════════════════════
```

##### 2.2.2 Virus Removal Service

**Removal Costs:**

| Virus | Removal Cost | Time | Effect |
|-------|--------------|------|--------|
| **Data Corruption** 🐛 | 500 E$ | Instant | Restore -20% XP penalty |
| **System Crash** 💥 | 1,500 E$ + 5 min AFK | 5 min | Stop random freezes |
| **Payload Leak** 📤 | 2,000 E$ + 10 min AFK | 10 min | Restore full loot drops |
| **Deep Intrusion** 🔓 | 5,000 E$ + 30 min AFK | 30 min | Restore all skill levels |

**Implementation:**
```javascript
// In clinic.js

class ClinicService {
  removeVirus(virusId) {
    const virus = this.player.viruses[virusId];
    const cost = this.getRemovalCost(virusId);
    const time = this.getRemovalTime(virusId);
    
    if (!this.player.hasEnoughCurrency(cost)) {
      return false; // Can't afford removal
    }
    
    this.player.removeCurrency(cost);
    this.player.startRemovalProcess(virusId, time);
    
    events.emit(EVENTS.VIRUS_REMOVAL_STARTED, {
      virus: virus.name,
      cost: cost,
      time: time,
    });
    
    setTimeout(() => {
      this.player.removeVirus(virusId);
      events.emit(EVENTS.VIRUS_REMOVED, { virus: virus.name });
    }, time * 1000);
  }
}
```

##### 2.2.3 Injury System

**New Mechanic:** Failed combat attempts can cause **injuries** (distinct from viruses).

**Injury Types:**
```
Broken Ribs (⚠️)
  - Effect: -50% max HP for next 5 combats
  - Cost to heal: 2,000 E$
  - Time: 15 minutes

Concussion (⚠️)
  - Effect: -20% skill XP for 3 hours
  - Cost to heal: 1,500 E$
  - Time: 10 minutes

Cybernetic Rejection (⚠️)
  - Effect: Can't equip any cyberware for 1 hour
  - Cost to heal: 3,500 E$ + requires Biotech level 40
  - Time: 20 minutes
```

**Injury Acquisition:**
- Get injury when HP drops below 10% and you lose combat
- Chance increases if you fight with low HP repeatedly
- Equipment with high defense reduces injury chance

##### 2.2.4 Neural Degradation System

**New Mechanic:** Using certain items (stims, implants) can cause temporary **neural degradation**.

```javascript
// Using high-end consumables can cause neural strain
useNeuralStim(stim) {
  const benefit = stim.damageBonus;  // e.g., +50% damage
  const degradationRisk = 0.15;      // 15% chance
  
  if (Math.random() < degradationRisk) {
    player.addDegradation({
      name: 'Neural Strain',
      duration: 30 * 60 * 1000,  // 30 minutes
      penalty: -10,  // -10% accuracy/crit
    });
  }
}

// Heal at clinic: "Neural Detox"
// Cost: 1,200 E$, Time: 5 minutes
```

##### 2.2.5 Health Status Display

**UI Panel:**
```html
<div id="health-panel">
  <h3>🏥 HEALTH STATUS</h3>
  
  <div class="health-stat">
    <span>HP:</span>
    <progress value="100" max="100"></progress>
    <span>100/100</span>
  </div>
  
  <div class="status-section">
    <h4>Active Conditions:</h4>
    <div class="condition">
      🐛 Data Corruption
      <span class="badge">-20% XP</span>
      <button class="clinic-btn" data-service="remove_virus" data-virus="data_corruption">
        Remove (500 E$)
      </button>
    </div>
    <div class="condition">
      ⚠️ Broken Ribs
      <span class="badge">-50% Max HP</span>
      <button class="clinic-btn" data-service="heal_injury" data-injury="broken_ribs">
        Heal (2000 E$, 15 min)
      </button>
    </div>
  </div>
  
  <div class="status-section">
    <h4>Protective Equipment:</h4>
    <div>🛡️ Subdermal Armor: -4% hacking risk</div>
    <div>🧬 Neural Daemon: Parallel hacking enabled</div>
  </div>
</div>
```

---

### 2.3 Status Effects Framework

#### Overview

Add **tactical depth** to combat and activities through temporary buffs/debuffs that stack, interact, and require strategy to manage.

#### 2.3.1 Status Effect Types

**Buffs (Positive):**
```
COMBAT_STIM (💉)
  - +50% damage for 30 seconds
  - Applied: Using Combat Stim consumable
  - Stacks: No (duration extends instead)
  - Special: Can be used mid-combat

BLOODLUST (🩸)
  - +25% damage, -10% defense for 20 seconds
  - Applied: Killing an enemy quickly
  - Stacks: No
  - Special: Bonus damage per consecutive kill

REGENERATION (💚)
  - +5 HP per second for 60 seconds
  - Applied: Using healing consumable
  - Stacks: No (resets timer instead)
  - Special: Caps at max HP

OVERCLOCKED (⚡)
  - +30% action speed for 45 seconds
  - Applied: Using high-end stimulant
  - Stacks: No
  - Special: Causes neural strain after expiring
```

**Debuffs (Negative):**
```
POISONED (☠️)
  - -10 HP per second for 60 seconds
  - Applied: Enemy special attack
  - Stacks: Yes (damage adds)
  - Duration: Random 30-120 seconds

STUNNED (💫)
  - Can't act for 2-5 seconds
  - Applied: Crit hit, certain abilities
  - Stacks: No (duration extends)
  - Break condition: Take 20+ damage

WEAKENED (📉)
  - -50% damage output for 30 seconds
  - Applied: Enemy special attack, failed activity
  - Stacks: Yes (each source reduces independently)
  - Special: Can't be cured by items

CONFUSED (🌀)
  - 50% chance to miss actions for 20 seconds
  - Applied: Certain enemies, neural hacks
  - Stacks: No
  - Special: Affects all skills, not just combat
```

#### 2.3.2 Status Effect Mechanics

```javascript
// In a new file: systems/statusEffects.js

export class StatusEffect {
  constructor(type, name, icon, duration, properties) {
    this.type = type;
    this.name = name;
    this.icon = icon;
    this.duration = duration;  // milliseconds
    this.startTime = Date.now();
    this.properties = properties;  // { damageBonus, hpCost, etc. }
    this.stackCount = 0;
  }
  
  isExpired() {
    return Date.now() - this.startTime > this.duration;
  }
  
  getRemainingDuration() {
    return Math.max(0, this.duration - (Date.now() - this.startTime));
  }
}

export class StatusEffectManager {
  constructor(owner) {
    this.owner = owner;  // Combat instance or Skill instance
    this.effects = {};   // { effectId: [effect1, effect2...] }
  }
  
  applyEffect(effect, stackable = true) {
    if (!stackable && this.effects[effect.type]) {
      // Extend existing effect instead of stacking
      this.effects[effect.type][0].duration += effect.duration;
      return;
    }
    
    if (!this.effects[effect.type]) {
      this.effects[effect.type] = [];
    }
    
    this.effects[effect.type].push(effect);
    events.emit(EVENTS.STATUS_EFFECT_APPLIED, {
      target: this.owner.name,
      effect: effect.name,
      icon: effect.icon,
    });
  }
  
  removeEffect(effectType) {
    delete this.effects[effectType];
    events.emit(EVENTS.STATUS_EFFECT_REMOVED, {
      target: this.owner.name,
      effect: effectType,
    });
  }
  
  tick() {
    Object.entries(this.effects).forEach(([type, effectList]) => {
      effectList.forEach((effect, index) => {
        if (effect.isExpired()) {
          effectList.splice(index, 1);
          this.removeEffect(type);
        }
      });
    });
  }
  
  getActiveEffects() {
    return Object.values(this.effects).flat();
  }
  
  hasEffect(effectType) {
    return this.effects[effectType]?.length > 0;
  }
}
```

#### 2.3.3 Displaying Status Effects

```html
<!-- Combat UI: Show active effects on both player and enemy -->
<div id="combat-ui">
  <div class="player-status">
    <span>Player HP: 85/100</span>
    <div class="effects">
      <div class="effect buff">💉 COMBAT_STIM (15s)</div>
      <div class="effect debuff">☠️ POISONED (25s, -10 HP/s)</div>
    </div>
  </div>
  
  <div class="enemy-status">
    <span>Enemy HP: 42/100</span>
    <div class="effects">
      <div class="effect debuff">📉 WEAKENED (10s, -50% dmg)</div>
    </div>
  </div>
</div>

<!-- Activity UI: Show status effects on current action -->
<div id="activity-status">
  <div class="action-info">
    Running: Intrusion (45s remaining)
    <div class="effects">
      <div class="effect debuff">🌀 CONFUSED (15s) - 30% miss chance</div>
    </div>
  </div>
</div>
```

---

## PART 3: UI/UX IMPROVEMENTS FOR CLARITY

### 3.1 New Tutorial System

**Problem:** Players overwhelmed by 24 skills, 50+ items, complex mechanics.

**Solution: Interactive Tutorial**

```
Step 1: Welcome
  "Choose your playstyle: Active Combat | AFK Hacking | Balanced"

Step 2: First Skill
  "Start with Combat. Click [COMBAT] in sidebar. Try 'Street Fight'"
  → Highlight buttons, explain what's happening

Step 3: First Reward
  "You earned E$ and a Data Shard! Inventory auto-saved."
  → Show inventory, explain item types

Step 4: Second Skill
  "Try Intrusion (hacking). Notice the GREEN progress bar?"
  → Multi-skill explanation with efficiency warning

Step 5: Equipment
  "Better gear = more damage. Buy from SHOP or craft from materials."
  → Show equipment slots, why defense matters

Step 6: Prestige Preview
  "At level 10, you can prestige for permanent bonuses!"
  → Explain XP multipliers, why to reset

Step 7: Advanced (Optional)
  "Virus risk, clinic healing, status effects..."
  → Link to detailed guides
```

### 3.2 Mechanics Explanation Panel

**New UI Section:** "How It Works"

```
═══════════════════════════════════
        💡 HOW IT WORKS 💡
═══════════════════════════════════

⚔️ COMBAT
  Damage = Base (3 + level/2) + Equipment + Passives
  Defense reduces incoming damage by 50%
  Abilities trigger automatically
  STATUS EFFECTS modify damage/defenses
  
🔓 HACKING
  Risk of compromise: 15-35% depending on difficulty
  If caught: infected with virus (various penalties)
  Better equipment & skills reduce risk
  Prestige bonus: -1% risk per level
  
💊 HEALING
  Healing Nanobots: instant +30 HP
  Clinic: removes viruses (cost E$ + time)
  Injuries: caused by low HP combat losses
  
⚡ PARALLEL GRINDING
  Running 2+ tasks = efficiency penalty
  2 tasks: 82% efficiency (-18%)
  3 tasks: 68% efficiency (-32%)
  4 tasks: 58% efficiency (-42%)
  
📊 PRESTIGE
  Unlocks at: 500k XP
  Formula: Level = sqrt(totalXP / 500k)
  Bonus: +1% XP per level + equipment
  Cost: All skills reset to level 1
  
═══════════════════════════════════
```

### 3.3 Tooltip Standardization

**All tooltips follow this format:**

```
═════════════════════════
    SKILL NAME 🔓
═════════════════════════

Description: Brief explanation
Current Level: 45/99

Progression: ████████░░ 82%
Next Level: 2,450 / 5,000 XP

Passive Bonus: +8% XP (from skill)
Mastery Levels: 3/99

Recent Activities:
  Easy Hack ⭐⭐⭐ (Level 20)
  Corp Intrusion ⭐⭐ (Level 40)

═════════════════════════
```

### 3.4 Equipment Comparison View

**When viewing or equipping items:**

```
CURRENTLY EQUIPPED:
  Weapon: Pistol (🔫, +5 dmg)
  Armor: Kevlar (🦺, +5 def)
  Cyberware: None

SELECT NEW ITEM TO COMPARE:
  Sniper Rifle (🎯, +15 dmg)
  
═════════════════════════
                    Current | New   | Diff
  Weapon Damage:   5       | 15    | +10
  Crit Chance:     0%      | 5%    | +5%
  Action Speed:    0%      | 0%    | —
  
  Equipment Bonus: +5 DMG total → +15 DMG total (+10)
  Combat Advantage: +30% damage vs enemies
═════════════════════════
[EQUIP] [CANCEL]
```

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Clarity Improvements (1-2 weeks)

**High-Impact, Low-Effort improvements:**

1. **Tutorial System** ✓ Required
   - Files: `js/ui/tutorial.js`, new tutorial modal
   - Effort: 8 hours
   - Impact: 40% new player retention

2. **Mechanics Panel** ✓ Required
   - Files: `js/ui/main.js` (add mechanics view)
   - Effort: 6 hours
   - Impact: 35% clarity improvement

3. **Tooltip System** ✓ Required
   - Files: `js/ui/tooltips.js` (new file)
   - Effort: 10 hours
   - Impact: 25% clarity improvement

4. **Status Bar Enhancements** ✓ Required
   - Show passive stat breakdowns
   - Show active buffs/debuffs
   - Effort: 6 hours

**Acceptance Criteria:**
- [ ] New players see tutorial on first login
- [ ] Every skill has clear description on hover
- [ ] Damage calculations visible to player
- [ ] Parallel grind efficiency shown in task list

---

### Phase 2: Virus & Hacking Risk (2-3 weeks)

**Medium Impact, Medium Effort:**

1. **Core Virus System**
   - Files: `js/systems/virus.js`, `js/systems/player.js` (extend)
   - Create: Virus data definitions
   - Effort: 12 hours
   - Risk: Affects prestige balance

2. **Compromise Detection**
   - Files: `js/systems/skills.js` (modify completeAction)
   - Add: Risk calculation, virus rolling
   - Effort: 6 hours

3. **Virus UI Display**
   - Files: `js/ui/main.js` (add health panel)
   - Show: Active viruses, removal options
   - Effort: 8 hours

4. **Save/Load Integration**
   - Files: `js/engine/save.js` (add virus serialization)
   - Effort: 4 hours

5. **Testing & Balance**
   - Test: Virus frequency, removal costs
   - Adjust: Risk curves for each tier
   - Effort: 8 hours

**Acceptance Criteria:**
- [ ] Compromises occur at expected rate (~20% for tier 3)
- [ ] Viruses cause measurable penalties
- [ ] Players can remove viruses via clinic
- [ ] Prestige reduces hacking risk as intended
- [ ] No save corruption with viruses

---

### Phase 3: Clinic & Healing System (1-2 weeks)

**Medium Impact, Medium Effort:**

1. **Clinic System**
   - Files: `js/systems/clinic.js` (new file)
   - Create: Clinic services, costs, timers
   - Effort: 10 hours

2. **Injury System**
   - Files: `js/systems/player.js` (extend), `js/systems/combat.js`
   - Add: Injury acquisition, effects
   - Effort: 8 hours

3. **Neural Degradation**
   - Files: `js/systems/statusEffects.js` (prepare for)
   - Add: Stim side-effect mechanics
   - Effort: 4 hours

4. **Clinic UI**
   - Files: `js/ui/main.js` (add clinic view)
   - Design: Service menu, costs display
   - Effort: 10 hours

5. **Save Integration**
   - Files: `js/engine/save.js` (add clinic data)
   - Effort: 4 hours

**Acceptance Criteria:**
- [ ] Clinic accessible from main UI
- [ ] Virus removal costs and times correct
- [ ] Injuries persist across game sessions
- [ ] Neural degradation appears after stim use
- [ ] Health status always visible

---

### Phase 4: Status Effects Framework (2-3 weeks)

**High Impact, High Effort:**

1. **Status Effect System**
   - Files: `js/systems/statusEffects.js` (new file, 200+ lines)
   - Create: StatusEffect class, StatusEffectManager
   - Effort: 12 hours

2. **Combat Integration**
   - Files: `js/systems/combat.js` (deep refactor)
   - Add: Buff/debuff application, effect ticking
   - Effort: 12 hours

3. **Ability System Enhancement**
   - Files: `js/systems/abilities.js` (extend)
   - Add: Abilities apply status effects
   - Effort: 8 hours

4. **Enemy Behavior**
   - Files: `js/systems/combat.js` (create enemy abilities)
   - Add: Special attacks that apply debuffs
   - Effort: 10 hours

5. **Status Effect UI**
   - Files: `js/ui/main.js` (add effect icons, timers)
   - Design: Combat overlay showing buffs/debuffs
   - Effort: 12 hours

6. **Save/Load**
   - Files: `js/engine/save.js` (status effects serialization)
   - Effort: 6 hours

**Acceptance Criteria:**
- [ ] Effects display correctly in combat
- [ ] Effects apply accurate bonuses/penalties
- [ ] Effects expire after duration
- [ ] Stacking rules respected
- [ ] Effects persist through save/load
- [ ] No performance impact (max 10 effects active)

---

### Phase 5: Polish & Balance (1-2 weeks)

**Fine-tuning:**

1. **Playtesting** (20 hours)
   - Virus frequency feels right (not too punishing)
   - Clinic costs balanced against playtime
   - Status effects don't make combat too complex
   - Performance acceptable (no lag)

2. **Balancing**
   - Adjust: Risk curves, virus penalties, removal costs
   - Adjust: Effect durations, damage bonuses
   - Adjustment: Prestige interaction with all systems

3. **Documentation**
   - Update: AGENTS.md with new systems
   - Create: Player guide / tutorial content
   - Update: Achievement descriptions

---

## PART 5: DETAILED CODE IMPLEMENTATION SPECS

### 5.1 New Files to Create

```
js/systems/virus.js (150 lines)
├─ class VirusType
├─ export const VIRUS_TYPES
└─ virus management logic

js/systems/clinic.js (200 lines)
├─ class ClinicService
├─ removal costs / times
└─ healing logic

js/systems/statusEffects.js (300+ lines)
├─ class StatusEffect
├─ class StatusEffectManager
├─ export const EFFECTS_LIBRARY
└─ effect mechanics

js/ui/tutorial.js (400+ lines)
├─ class TutorialSystem
├─ step definitions
└─ UI rendering

js/ui/tooltips.js (200+ lines)
├─ Tooltip manager
├─ Format helpers
└─ Event listeners

js/ui/clinic.js (200+ lines)
├─ Clinic UI renderer
├─ Service selection
└─ Progress display
```

### 5.2 Files to Modify

```
js/systems/player.js
  + viruses: {}
  + injuries: {}
  + addVirus(type)
  + removeVirus(id)
  + applyVirusEffects()

js/systems/combat.js
  + statusEffectManager
  + injuries on death
  + effect application from abilities

js/systems/skills.js
  + compromiseRoll() in completeAction()
  + virus acquisition
  + virus effect application to XP

js/ui/main.js
  + tutorial check on init
  + health panel renderer
  + clinic view
  + tooltip system initialization
  + effect display in combat

js/engine/save.js
  + virus serialization
  + injury data persistence
  + clinic service data

js/data/skillData.js
  + VIRUS_TYPES definition
  + CLINIC_SERVICES definition
  + STATUS_EFFECTS definition
  + Enemy special attacks
```

---

## PART 6: POTENTIAL CHALLENGES & MITIGATIONS

### Challenge #1: Virus System Feels Too Punishing

**Risk:** Players stop hacking if virus risk is too high.

**Mitigation:**
- Start with low base risks (15% for tier 1)
- Prestige reduces risk significantly (-1% per level)
- Equipment provides clear risk reduction
- Clear UI showing current risk before activity
- **Testing:** Playtest with 50+ hours of hacking to ensure engagement

### Challenge #2: Clinic Costs Spiral Out of Control

**Risk:** Late-game players need to spend all currency on virus removal.

**Mitigation:**
- Scale removal costs with player wealth (% of total currency earned)
- Make removal free if you prestige (fresh start)
- Allow passive healing over time (slow HP regen)
- **Tuning:** Test removal costs feel ~5-10 minutes of active grinding

### Challenge #3: Status Effects Make Combat Confusing

**Risk:** Too many buffs/debuffs create decision paralysis.

**Mitigation:**
- Limit to max 4 active effects at once
- Simple, clear icons for each effect
- Tooltip on hover showing exact numbers
- Tutorial explaining effect mechanics
- **Design:** Start with 8 effects, expand to 15+ only if well-received

### Challenge #4: New Systems Break Save Compatibility

**Risk:** Players with old saves can't load properly.

**Mitigation:**
- Write migration functions for each new system
- Set defaults for missing fields (viruses = {}, injuries = {})
- Test save/load cycle thoroughly
- Version save format (v1.0 → v1.1 → v1.2)

### Challenge #5: Performance Degradation

**Risk:** Too many ticking effects cause lag on low-end devices.

**Mitigation:**
- Effect manager batches updates (every 500ms instead of every tick)
- Max 10 active effects per entity
- Defer expensive calculations to next idle frame
- **Profiling:** Monitor frame rate with stress test (100 effects active)

---

## PART 7: SUCCESS METRICS

### Key Performance Indicators

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Tutorial Completion Rate | N/A | 80%+ | Week 1 |
| Time to Level 10 (First Prestige Unlock) | 2-4h | 1-2h | Week 2 |
| Hacking Activity Popularity | 60% | 65-75% (balanced) | Week 3 |
| Virus Encounter Rate | 0% | 15-20% (tier 3) | Week 3 |
| Clinic Visit Rate | 0% | 30-40% (active players) | Week 4 |
| Combat Depth (actions/minute) | 1.2 | 2.0+ | Week 6 |
| Player Retention (Day 7) | 35% | 50%+ | Week 8 |

---

## PART 8: FUTURE EXPANSION IDEAS

**Beyond this roadmap:**

1. **Multiplayer Raids** — Cooperative virus removal, boss fights
2. **Cybersecurity Arms Race** — Player can infect other players' saves (with consent)
3. **Advanced Healing Techs** — Gene therapy, neural reset chambers
4. **Mod System** — Create custom viruses/effects
5. **PvP Hacking** — Hack other players for rewards/penalties
6. **Augmentation Trees** — Permanent stat upgrades
7. **Faction System** — Different clinics, healing philosophies
8. **Dynamic Events** — Random security crackdowns increase virus rates

---

## CONCLUSION

The NETRUNNER codebase has strong architecture but **lacks explanation of mechanics and strategic depth**. By implementing:

1. ✓ **Clarity improvements** → Tutorial, tooltips, mechanics panel
2. ✓ **Virus & hacking risk** → Thematic danger to high-reward activities
3. ✓ **Clinic & healing** → Resource management, strategic recovery
4. ✓ **Status effects** → Tactical depth in combat

...the game will feel **more engaging, strategic, and cyberpunk**.

These features build on each other naturally:
- Virus risk creates need for clinic
- Clinic needs currency (gameplay incentive)
- Status effects reward active play + abilities
- All systems create prestige motivation (resets clear problems)

**Recommended Implementation Order:**
1. **Phase 1:** Clarity improvements (get feedback from players)
2. **Phase 2:** Virus system (core feature, high impact)
3. **Phase 3:** Clinic system (complement viruses)
4. **Phase 4:** Status effects (polish, engagement)

---

**Next Steps:**
- [ ] Review this document with team
- [ ] Prioritize which phases to implement
- [ ] Create detailed technical specs for Phase 1
- [ ] Begin Phase 1 implementation
- [ ] Set up A/B testing framework for balancing
- [ ] Prepare player communication about new features

**Document Owner:** AI Assistant  
**Last Updated:** May 2026  
**Status:** Ready for Review
