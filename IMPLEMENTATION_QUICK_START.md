# NETRUNNER - Quick Implementation Guide

**Start here:** Read this after the main analysis document.

---

## Phase 1: Clarity (Weeks 1-2)

### 1.1 Tutorial System

**Create:** `js/ui/tutorial.js`

```javascript
export class TutorialSystem {
  constructor(game) {
    this.game = game;
    this.currentStep = 0;
    this.completed = false;
    this.shouldShow = !localStorage.getItem('netrunner_tutorial_completed');
  }

  start() {
    if (!this.shouldShow) return;
    this.showStep(0);
  }

  steps = [
    {
      title: 'Welcome to NETRUNNER',
      description: 'You are a netrunner — a hacker in a cyberpunk world.',
      highlight: null,
      action: 'next',
    },
    {
      title: 'Choose a Skill',
      description: 'Click COMBAT in the sidebar to start grinding.',
      highlight: '[data-skill="combat"]',
      action: 'wait_for_click',
    },
    {
      title: 'You Earned Rewards!',
      description: 'Every activity grants XP and loot. Open inventory to see.',
      highlight: '.inventory-btn',
      action: 'next',
    },
    // ... more steps
  ];

  showStep(stepNum) {
    const step = this.steps[stepNum];
    // Create modal overlay with step info
    // Highlight specified element
    // Wait for action before proceeding
  }

  complete() {
    this.completed = true;
    localStorage.setItem('netrunner_tutorial_completed', 'true');
    events.emit(EVENTS.UI_NOTIFICATION, {
      message: '✓ Tutorial complete! Explore at your own pace.',
      type: 'success',
    });
  }
}
```

### 1.2 Mechanics Panel

**Modify:** `js/ui/main.js` - add new view function

```javascript
renderMechanicsView() {
  return `
    <div class="mechanics-panel">
      <h2>💡 How It Works</h2>
      
      <div class="mechanic-section">
        <h3>⚔️ Combat Damage</h3>
        <p>Damage = Base (3 + level/2) + Equipment Bonus + Ability Bonus</p>
        <p>Defense reduces incoming damage by 50%</p>
        <p>Abilities trigger during combat based on cooldown timers</p>
      </div>
      
      <div class="mechanic-section">
        <h3>🔓 Hacking Risk</h3>
        <p>Each hacking activity has a Compromise Chance (15-35%)</p>
        <p>If compromised: Infected with virus (various penalties)</p>
        <p>Better equipment & skills reduce risk by ~1% per level</p>
        <p>Prestige reduces all hacking risk by 1% per level</p>
      </div>
      
      <!-- ... more sections ... -->
    </div>
  `;
}
```

### 1.3 Tooltip System

**Create:** `js/ui/tooltips.js`

```javascript
export class TooltipManager {
  constructor() {
    this.currentTooltip = null;
    this.tooltipDelay = 300;  // ms
    this.init();
  }

  init() {
    document.addEventListener('mouseenter', (e) => {
      const element = e.target.closest('[data-tooltip]');
      if (element) {
        this.showTooltip(element);
      }
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const element = e.target.closest('[data-tooltip]');
      if (element) {
        this.hideTooltip();
      }
    }, true);
  }

  showTooltip(element) {
    const tooltipKey = element.getAttribute('data-tooltip');
    const tooltipText = this.getTooltipText(tooltipKey);
    
    // Create and position tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = tooltipText;
    document.body.appendChild(tooltip);
    
    this.currentTooltip = tooltip;
  }

  getTooltipText(key) {
    const tooltips = {
      'skill-level': 'Level determines XP gain from activities',
      'mastery-level': 'Mastery +1% XP per level for this activity',
      'combat-damage': 'Damage = Base + Equipment + Passives',
      // ... many more ...
    };
    return tooltips[key] || 'No tooltip available';
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }
}
```

### 1.4 Status Bar Enhancements

**Modify:** `js/ui/main.js` - renderPassivesView()

```javascript
renderPassiveStats() {
  const stats = this.game.passiveStats;
  
  return `
    <div class="passive-stats-panel">
      <h3>📊 Passive Bonuses</h3>
      
      <div class="stat-row">
        <span>Max HP:</span>
        <div class="stat-breakdown">
          <span>100 (base)</span>
          <span>+ 50 (Subdermal Armor)</span>
          <span>= 150 total</span>
        </div>
      </div>
      
      <div class="stat-row">
        <span>XP Gain:</span>
        <div class="stat-breakdown">
          <span>+15% (Decryption skill)</span>
          <span>+ 10% (XP Boost Chip)</span>
          <span>+ 5% (Prestige level 5)</span>
          <span>= +30% total</span>
        </div>
      </div>
      
      <div class="stat-row">
        <span>Action Speed:</span>
        <div class="stat-breakdown">
          <span>-15% (Speed Processor)</span>
          <span>- 8% (Neural Surfing L50)</span>
          <span>= -23% faster actions</span>
        </div>
      </div>
    </div>
  `;
}
```

---

## Phase 2: Virus System (Weeks 2-4)

### 2.1 Virus Definitions

**Create:** `js/systems/virus.js`

```javascript
export const VIRUS_TYPES = {
  DATA_CORRUPTION: {
    id: 'data_corruption',
    name: 'Data Corruption',
    icon: '🐛',
    baseRisk: 0.40,        // 40% of total compromise chance
    effect: 'xp_reduction', // -20% to all XP
    magnitude: 0.20,
    baseDuration: 5,        // 5 more activities
    removalCost: 500,
    removalTime: 0,         // Instant
  },
  SYSTEM_CRASH: {
    id: 'system_crash',
    name: 'System Crash',
    icon: '💥',
    baseRisk: 0.30,
    effect: 'random_freeze',
    magnitude: 0.03,        // 3% chance per tick to freeze 5-10s
    baseDuration: 3,
    removalCost: 1500,
    removalTime: 300,       // 5 minutes
  },
  PAYLOAD_LEAK: {
    id: 'payload_leak',
    name: 'Payload Leak',
    icon: '📤',
    baseRisk: 0.20,
    effect: 'loot_reduction', // -30% drops
    magnitude: 0.30,
    baseDuration: 7,
    removalCost: 2000,
    removalTime: 600,       // 10 minutes
  },
  DEEP_INTRUSION: {
    id: 'deep_intrusion',
    name: 'Deep Intrusion',
    icon: '🔓',
    baseRisk: 0.10,
    effect: 'skill_downgrade', // All skills -1 level
    magnitude: 1,
    baseDuration: 10,
    removalCost: 5000,
    removalTime: 1800,      // 30 minutes
  },
};

export class Virus {
  constructor(type, duration = null) {
    this.type = type.id;
    this.name = type.name;
    this.icon = type.icon;
    this.effect = type.effect;
    this.magnitude = type.magnitude;
    this.duration = duration || type.baseDuration;
    this.activitiesRemaining = this.duration;
    this.applied = false;
  }

  onActivityComplete() {
    this.activitiesRemaining--;
    return this.activitiesRemaining <= 0;
  }

  serialize() {
    return {
      type: this.type,
      duration: this.duration,
      activitiesRemaining: this.activitiesRemaining,
    };
  }

  static deserialize(data) {
    const virus = new Virus(VIRUS_TYPES[data.type.toUpperCase()], data.duration);
    virus.activitiesRemaining = data.activitiesRemaining;
    return virus;
  }
}
```

### 2.2 Compromise Roll in Skills

**Modify:** `js/systems/skills.js` - completeAction()

```javascript
completeAction() {
  // ... existing reward logic ...
  
  // NEW: Check for compromise (hacking skills only)
  if (this.skillManager && this.skillManager.isHackingSkill(this.id)) {
    const compromiseChance = this.calculateCompromiseChance();
    
    if (Math.random() < compromiseChance) {
      // COMPROMISED!
      const virus = this.rollVirus(compromiseChance);
      this.game.player.addVirus(virus);
      
      events.emit(EVENTS.HACKING_COMPROMISED, {
        skill: this.id,
        virus: virus.name,
        icon: virus.icon,
      });
    }
  }
}

calculateCompromiseChance() {
  const activity = ACTIVITIES[this.id]?.find(a => a.id === this.activeAction);
  if (!activity) return 0;
  
  // Base risk from tier (1-5)
  const tier = Math.ceil((activity.level || 1) / 20);
  const baseRisk = 0.15 + (tier * 0.05);  // 15%, 20%, 25%, 30%, 35%
  
  // Skill penalty: -0.5% per skill level
  const skillPenalty = (this.level / 100) * 0.05;
  
  // Equipment defense: -2% per defense point
  const equipDefense = this.equipment?.getTotalDefense?.() || 0;
  const equipBonus = (equipDefense / 50) * 0.02;
  
  // Prestige bonus: -1% per prestige level
  const prestigeBonus = (this.prestige?.level || 0) * 0.01;
  
  return Math.max(0.05, baseRisk - skillPenalty - equipBonus - prestigeBonus);
}

rollVirus(compromiseChance) {
  // Weight virus types by their baseRisk
  let roll = Math.random();
  let cumulative = 0;
  
  for (const virusType of Object.values(VIRUS_TYPES)) {
    cumulative += virusType.baseRisk;
    if (roll < cumulative) {
      return new Virus(virusType);
    }
  }
  
  // Default to lowest risk
  return new Virus(VIRUS_TYPES.DATA_CORRUPTION);
}
```

### 2.3 Virus Management in Player

**Modify:** `js/systems/player.js`

```javascript
export class Player {
  constructor() {
    // ... existing fields ...
    this.viruses = {};  // { virusId: Virus instance }
  }

  addVirus(virus) {
    if (this.viruses[virus.type]) {
      // Already infected: extend duration
      this.viruses[virus.type].duration += virus.duration;
    } else {
      // New infection
      this.viruses[virus.type] = virus;
    }
  }

  removeVirus(virusId) {
    delete this.viruses[virusId];
    events.emit(EVENTS.VIRUS_REMOVED, { virusId });
  }

  getActiveViruses() {
    return Object.values(this.viruses);
  }

  applyVirusEffects(skillManager, inventory, equipment) {
    // Called once per tick
    Object.values(this.viruses).forEach(virus => {
      switch(virus.effect) {
        case 'xp_reduction':
          // Multiplier applied in skill.gainXP()
          break;
        case 'random_freeze':
          if (Math.random() < virus.magnitude) {
            // Freeze gameplay for 5-10 seconds
            events.emit(EVENTS.SYSTEM_CRASH, {
              duration: Math.random() * 5000 + 5000,
            });
          }
          break;
        case 'loot_reduction':
          // Multiplier applied in generateLoot()
          break;
        case 'skill_downgrade':
          // Applied on first tick only
          if (!virus.applied) {
            skillManager.downgradeLevels(1);
            virus.applied = true;
          }
          break;
      }
    });
  }

  serialize() {
    return {
      // ... existing fields ...
      viruses: Object.entries(this.viruses).map(([id, virus]) => ({
        id,
        data: virus.serialize(),
      })),
    };
  }

  deserialize(data) {
    // ... existing deserialization ...
    if (data.viruses) {
      data.viruses.forEach(({ id, data: virusData }) => {
        this.viruses[id] = Virus.deserialize(virusData);
      });
    }
  }
}
```

### 2.4 Virus UI Display

**Modify:** `js/ui/main.js` - renderHealthPanel()

```javascript
renderHealthPanel() {
  const player = this.game.player;
  const viruses = player.getActiveViruses();
  
  if (viruses.length === 0) {
    return '<div class="health-panel"><span>🏥 Status: Healthy</span></div>';
  }
  
  return `
    <div class="health-panel virus-warning">
      <h3>⚠️ INFECTED</h3>
      ${viruses.map(virus => `
        <div class="virus-item">
          <span>${virus.icon} ${virus.name}</span>
          <span class="duration">${virus.activitiesRemaining} activities remaining</span>
          <button 
            class="remove-btn"
            data-action="remove-virus"
            data-virus-id="${virus.type}"
          >
            Remove (${VIRUS_TYPES[virus.type.toUpperCase()].removalCost} E$)
          </button>
        </div>
      `).join('')}
    </div>
  `;
}
```

---

## Phase 3: Clinic System (Weeks 4-5)

### 3.1 Clinic Service System

**Create:** `js/systems/clinic.js`

```javascript
export class ClinicService {
  constructor(game) {
    this.game = game;
    this.removalQueue = [];  // { virusId, startTime, endTime }
    this.removalInProgress = null;
  }

  startRemoval(virusId) {
    const virus = this.game.player.viruses[virusId];
    if (!virus) return false;
    
    const virusType = VIRUS_TYPES[virus.type.toUpperCase()];
    const cost = virusType.removalCost;
    const time = virusType.removalTime * 1000;  // Convert to ms
    
    // Check affordability
    if (this.game.economy.currency < cost) {
      events.emit(EVENTS.UI_NOTIFICATION, {
        message: `Not enough E$. Need ${cost}, have ${this.game.economy.currency}`,
        type: 'error',
      });
      return false;
    }
    
    // Deduct cost
    this.game.economy.removeCurrency(cost);
    
    // Start removal process
    this.removalInProgress = {
      virusId,
      startTime: Date.now(),
      endTime: Date.now() + time,
      duration: time,
    };
    
    events.emit(EVENTS.VIRUS_REMOVAL_STARTED, {
      virus: virus.name,
      cost: cost,
      time: time / 1000,
    });
    
    // Wait, then remove
    setTimeout(() => {
      this.completeRemoval(virusId);
    }, time);
    
    return true;
  }

  completeRemoval(virusId) {
    this.game.player.removeVirus(virusId);
    this.removalInProgress = null;
    
    events.emit(EVENTS.VIRUS_REMOVED, {
      virusId,
    });
  }

  getRemovalProgress() {
    if (!this.removalInProgress) return null;
    
    const elapsed = Date.now() - this.removalInProgress.startTime;
    const percent = (elapsed / this.removalInProgress.duration) * 100;
    const remaining = Math.ceil((this.removalInProgress.endTime - Date.now()) / 1000);
    
    return { percent, remaining };
  }

  serialize() {
    return {
      removalInProgress: this.removalInProgress,
    };
  }

  deserialize(data) {
    if (data.removalInProgress) {
      this.removalInProgress = data.removalInProgress;
    }
  }
}
```

### 3.2 Clinic UI

**Modify:** `js/ui/main.js` - add renderClinicView()

```javascript
renderClinicView() {
  const clinic = this.game.clinic;
  const viruses = this.game.player.getActiveViruses();
  
  return `
    <div class="clinic-view">
      <h2>🏥 CLINIC SERVICES</h2>
      
      <div class="clinic-section">
        <h3>Virus Removal</h3>
        ${viruses.length === 0 
          ? '<p>✓ No active infections detected.</p>'
          : viruses.map(virus => {
              const virusType = VIRUS_TYPES[virus.type.toUpperCase()];
              return `
                <div class="virus-removal-item">
                  <span>${virus.icon} ${virus.name}</span>
                  <div class="details">
                    <span>Cost: ${virusType.removalCost} E$</span>
                    <span>Time: ${virusType.removalTime}s</span>
                    <span>Effect: ${virus.magnitude * 100}% penalty</span>
                  </div>
                  <button 
                    data-action="start-removal"
                    data-virus-id="${virus.type}"
                  >
                    Remove
                  </button>
                </div>
              `;
            }).join('')
        }
      </div>
      
      ${clinic.removalInProgress ? `
        <div class="removal-progress">
          <h4>In Progress...</h4>
          <progress value="${clinic.getRemovalProgress().percent}" max="100"></progress>
          <span>${clinic.getRemovalProgress().remaining}s remaining</span>
        </div>
      ` : ''}
    </div>
  `;
}
```

---

## Phase 4: Status Effects (Weeks 6-8)

See main analysis document for full spec. Key files:

**Create:** `js/systems/statusEffects.js`

```javascript
export class StatusEffect {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.icon = config.icon;
    this.duration = config.duration;
    this.startTime = Date.now();
    this.properties = config.properties;
    this.stackable = config.stackable ?? false;
  }

  isExpired() {
    return Date.now() - this.startTime > this.duration;
  }

  getRemainingDuration() {
    const remaining = this.duration - (Date.now() - this.startTime);
    return Math.max(0, remaining);
  }
}

export const STATUS_EFFECTS = {
  COMBAT_STIM: {
    id: 'combat_stim',
    name: 'Combat Stim',
    icon: '💉',
    duration: 30000,  // 30 seconds
    stackable: false,
    properties: {
      damageBonus: 0.50,  // +50%
    },
  },
  // ... more effects
};
```

---

## Testing Checklist

### Phase 1 (Clarity)
- [ ] Tutorial shows on first login
- [ ] All buttons have tooltips
- [ ] Mechanics panel explains all systems
- [ ] Passive stats show correct breakdown

### Phase 2 (Viruses)
- [ ] Compromises occur at ~20% for tier 3
- [ ] Correct virus type rolls
- [ ] Prestige reduces risk correctly
- [ ] Save/load preserves virus state

### Phase 3 (Clinic)
- [ ] Clinic accessible from main menu
- [ ] Removal costs deducted properly
- [ ] Timers count down correctly
- [ ] Viruses actually removed after timer

### Phase 4 (Status Effects)
- [ ] Effects apply and display correctly
- [ ] Effects expire after duration
- [ ] Combat shows effect icons
- [ ] Abilities trigger effects properly

---

## Quick Start for Phase 1

1. Copy tutorial.js, tooltips.js to js/ui/
2. Add to main.js init():
   ```javascript
   if (!localStorage.getItem('netrunner_tutorial_completed')) {
     const tutorial = new TutorialSystem(this);
     tutorial.start();
   }
   ```
3. Add tooltip manager initialization
4. Add mechanics view to UI tabs
5. Test on fresh browser (no localStorage)

---

**Next Step:** Implement Phase 1 completely before moving to Phase 2!
