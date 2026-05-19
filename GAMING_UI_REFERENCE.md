# Gaming UI Component Reference Guide

## Overview

This guide documents all gaming UI state management components available in NETRUNNER's GameMetricsUI system. These components provide cyberpunk-themed displays for health, XP, status effects, and other game metrics.

---

## Quick Start

### Import the module
```javascript
import { gameMetricsUI } from './js/ui/gameMetrics.js';
```

### Basic health bar
```javascript
const healthHTML = gameMetricsUI.createHealthBar({
  maxHealth: 100,
  currentHealth: 75,
  showLabel: true,
  compact: false
});

document.getElementById('health-container').innerHTML = healthHTML;
```

---

## Components

### 1. Health Bar

Displays current/max health with color-coded states.

**Method:** `createHealthBar(options)`

**Options:**
- `maxHealth` (number) - Maximum health value (default: 100)
- `currentHealth` (number) - Current health value (default: 100)
- `showLabel` (boolean) - Show "HP: X/Y" label (default: true)
- `compact` (boolean) - Smaller compact version (default: false)

**Health States:**
- **Critical** (≤10%) - Red, pulsing animation
- **Danger** (≤25%) - Red-orange with warning pulse
- **Warning** (≤50%) - Orange gradient
- **Moderate** (≤75%) - Yellow gradient
- **Healthy** (>75%) - Green gradient

**Example:**
```javascript
// Combat health bar
gameMetricsUI.createHealthBar({
  maxHealth: 150,
  currentHealth: 45,
  showLabel: true
});

// Compact enemy health
gameMetricsUI.createHealthBar({
  maxHealth: 100,
  currentHealth: 78,
  showLabel: false,
  compact: true
});
```

**CSS Classes:** `.health-bar-container`, `.health-critical`, `.health-danger`, `.health-warning`

---

### 2. XP Bar

Displays XP progress toward next level with max level indicator.

**Method:** `createXPBar(options)`

**Options:**
- `currentXP` (number) - Current XP toward next level (default: 0)
- `nextLevelXP` (number) - XP needed for next level (default: 1000)
- `level` (number) - Current skill level (default: 1)
- `maxLevel` (number) - Maximum skill level (default: 99)
- `showLevelUp` (boolean) - Show level up animation when 100% (default: false)
- `compact` (boolean) - Smaller compact version (default: false)

**Visual Changes:**
- At max level: bar turns golden yellow with enhanced glow
- When full (100%): shows "⭐ LEVEL UP! ⭐" animation if enabled
- Shows XP progress text: "500,000 / 2,000,000 XP"

**Example:**
```javascript
// Full XP bar for skill view
gameMetricsUI.createXPBar({
  currentXP: 45000,
  nextLevelXP: 100000,
  level: 25,
  maxLevel: 99,
  showLevelUp: true
});

// Compact XP bar in list
gameMetricsUI.createXPBar({
  currentXP: 8000,
  nextLevelXP: 10000,
  level: 1,
  compact: true
});
```

**CSS Classes:** `.xp-bar-container`, `.xp-bar-fill`, `.max-level`, `.level-up-notification`

---

### 3. Mastery Bar

Displays mastery level progress for specific activities.

**Method:** `createMasteryBar(options)`

**Options:**
- `masteryLevel` (number) - Current mastery level (default: 1)
- `masteryXP` (number) - Current mastery XP (default: 0)
- `masteryXPNeeded` (number) - XP needed for next mastery level (default: 100)
- `maxMastery` (number) - Maximum mastery level (default: 99)
- `compact` (boolean) - Smaller version (default: false)

**Mastery Formula:** Each level needs `masteryLevel * 100` XP

**Example:**
```javascript
gameMetricsUI.createMasteryBar({
  masteryLevel: 15,
  masteryXP: 650,
  masteryXPNeeded: 1600,
  maxMastery: 99
});
```

**CSS Classes:** `.mastery-bar-container`, `.mastery-bar-fill`

---

### 4. Combat Status Panel

Shows both player and enemy health in a versus display.

**Method:** `createCombatStatus(options)`

**Options:**
- `playerHealth` (number) - Player current HP
- `playerMaxHealth` (number) - Player max HP
- `enemyHealth` (number) - Enemy current HP
- `enemyMaxHealth` (number) - Enemy max HP
- `enemyName` (string) - Enemy display name
- `isBoss` (boolean) - Show boss styling (default: false)

**Features:**
- Displays "VS" indicator in center
- Color-coded health bars (green for player, red for enemy)
- Boss enemies show 👹 icon and golden styling
- Real-time HP display

**Example:**
```javascript
// Regular enemy
gameMetricsUI.createCombatStatus({
  playerHealth: 85,
  playerMaxHealth: 100,
  enemyHealth: 42,
  enemyMaxHealth: 100,
  enemyName: 'Street Gang Member',
  isBoss: false
});

// Boss fight
gameMetricsUI.createCombatStatus({
  playerHealth: 120,
  playerMaxHealth: 150,
  enemyHealth: 200,
  enemyMaxHealth: 400,
  enemyName: 'Black Ice',
  isBoss: true
});
```

**CSS Classes:** `.combat-status-panel`, `.player-status`, `.enemy-status`, `.boss`

---

### 5. Status Effects

Shows active buffs and debuffs with timers.

**Method:** `createStatusEffects(options)`

**Options:**
- `effects` (array) - Array of effect objects:
  - `id` (string) - Unique effect ID
  - `name` (string) - Effect name
  - `icon` (string) - Emoji icon
  - `type` (string) - 'buff' or 'debuff'
  - `remaining` (number) - Seconds remaining
  - `duration` (number) - Total duration in seconds

**Features:**
- Timer bar for each effect
- Color-coded: cyan for buffs, red for debuffs
- Shows remaining time
- Grid layout for multiple effects

**Example:**
```javascript
gameMetricsUI.createStatusEffects({
  effects: [
    {
      id: 'combat_stim',
      name: 'Combat Stim',
      icon: '💉',
      type: 'buff',
      remaining: 15,
      duration: 30
    },
    {
      id: 'poisoned',
      name: 'Poisoned',
      icon: '☠️',
      type: 'debuff',
      remaining: 45,
      duration: 60
    }
  ]
});
```

**CSS Classes:** `.status-effects-container`, `.status-effect`, `.buff`, `.debuff`, `.effect-timer`

---

### 6. Virus Indicator

Shows active virus infections with severity levels.

**Method:** `createVirusIndicator(options)`

**Options:**
- `viruses` (array) - Array of virus objects:
  - `icon` (string) - Emoji icon
  - `name` (string) - Virus name
  - `severity` (string) - 'high', 'medium', or 'low'
  - `activitiesRemaining` (number) - Activities left before cleared

**Severity Levels:**
- **High** - Red border, background #2a0a0a
- **Medium** - Orange-red border, background #1a0e0e
- **Low** - Orange border, background #1a1a0e

**Example:**
```javascript
gameMetricsUI.createVirusIndicator({
  viruses: [
    {
      icon: '🐛',
      name: 'Data Corruption',
      severity: 'medium',
      activitiesRemaining: 3
    },
    {
      icon: '💥',
      name: 'System Crash',
      severity: 'high',
      activitiesRemaining: 1
    }
  ]
});
```

**CSS Classes:** `.virus-panel`, `.virus-indicator`, `.virus-high`, `.virus-medium`, `.virus-low`

---

### 7. Skill Card

Compact skill display with level and XP progress.

**Method:** `createSkillCard(options)`

**Options:**
- `skill` (object) - Skill object with: `name`, `icon`, `level`, `xp`, `color`, `getXPForNextLevel()`
- `isActive` (boolean) - Highlight if skill is currently active (default: false)
- `showDetailed` (boolean) - Show XP details (default: false)

**States:**
- **Active** - Magenta highlight with pulse indicator
- **Compact** - Minimal display (name + level)
- **Detailed** - Full XP bar and progress

**Example:**
```javascript
// In skill list
gameMetricsUI.createSkillCard({
  skill: skillObject,
  isActive: false,
  showDetailed: false
});

// Currently grinding skill
gameMetricsUI.createSkillCard({
  skill: skillObject,
  isActive: true,
  showDetailed: true
});
```

**CSS Classes:** `.skill-card`, `.skill-active`, `.skill-active-indicator`, `.pulse-dot`

---

### 8. Equipment Slot

Shows equipped item or empty slot.

**Method:** `createEquipmentSlot(options)`

**Options:**
- `slot` (string) - 'weapon', 'armor', or 'cyberware'
- `item` (object) - Item definition with: `icon`, `name` (or null if empty)
- `bonus` (number) - Bonus value to display (damage/defense)

**Slot Icons:**
- Weapon: 🔫
- Armor: 🛡️
- Cyberware: 🦾

**Example:**
```javascript
// Equipped weapon
gameMetricsUI.createEquipmentSlot({
  slot: 'weapon',
  item: {
    icon: '🎯',
    name: 'Sniper Rifle'
  },
  bonus: 15
});

// Empty slot
gameMetricsUI.createEquipmentSlot({
  slot: 'armor',
  item: null,
  bonus: 0
});
```

**CSS Classes:** `.equipment-slot`, `.equipped`, `.empty`, `.item-bonus`

---

### 9. Passive Stats Panel

Breakdown of all passive bonuses.

**Method:** `createPassiveStatsPanel(options)`

**Options:**
- `stats` (object) - Key-value pairs of stat names and values

**Example:**
```javascript
gameMetricsUI.createPassiveStatsPanel({
  stats: {
    'Max HP': 150,
    'XP Gain': '+30%',
    'Action Speed': '-23%',
    'Loot Drop': '+20%',
    'Crit Chance': '+15%'
  }
});
```

**CSS Classes:** `.passive-stats-panel`, `.stat-row`, `.stat-name`, `.stat-value`, `.positive`, `.negative`

---

### 10. Damage Popup

Floating damage/heal numbers that fade up.

**Method:** `createDamagePopup(options)`

**Options:**
- `damage` (number) - Damage or heal amount
- `x` (number) - Screen X coordinate
- `y` (number) - Screen Y coordinate
- `isCrit` (boolean) - Critical hit styling (default: false)
- `type` (string) - 'damage' or 'heal' (default: 'damage')

**Features:**
- Damage: Red with 💥 icon
- Heal: Green with ✨ icon
- Critical: Larger text, spins while floating

**Example:**
```javascript
// Regular hit
gameMetricsUI.createDamagePopup({
  damage: 45,
  x: 300,
  y: 200,
  isCrit: false,
  type: 'damage'
});

// Critical heal
gameMetricsUI.createDamagePopup({
  damage: 80,
  x: 350,
  y: 150,
  isCrit: true,
  type: 'heal'
});
```

**CSS Classes:** `.damage-popup`, `.damage`, `.heal`, `.crit`, `.animate-fade-up`

---

### 11. Notifications

Alert messages for events.

**Method:** `createNotification(options)`

**Options:**
- `message` (string) - Notification text
- `type` (string) - 'info', 'success', 'warning', 'error', 'levelup', 'achievement'
- `duration` (number) - Display duration in ms (default: 3000)
- `icon` (string) - Emoji icon

**Types & Colors:**
- **info** - Cyan background
- **success** - Green background
- **warning** - Yellow background
- **error** - Red background
- **levelup** - Magenta, bold
- **achievement** - Yellow, bold

**Example:**
```javascript
gameMetricsUI.createNotification({
  message: 'Intrusion Skill increased to level 25!',
  type: 'levelup',
  icon: '⭐',
  duration: 3000
});

gameMetricsUI.createNotification({
  message: 'ACHIEVEMENT: First Blood',
  type: 'achievement',
  icon: '🏆'
});
```

**CSS Classes:** `.notification`, `.notification-info`, `.notification-success`, `.notification-warning`, `.notification-error`, `.notification-levelup`, `.notification-achievement`

---

### 12. Ability Cooldown

Shows ability icon with cooldown overlay and timer.

**Method:** `createAbilityCooldown(options)`

**Options:**
- `ability` (object) - Ability with: `name`, `icon`
- `cooldownRemaining` (number) - Seconds remaining (default: 0)
- `cooldownMax` (number) - Total cooldown in seconds (default: 30)

**Features:**
- Green glow when ready
- Dimmed with timer when cooling down
- Hover shows ability name

**Example:**
```javascript
gameMetricsUI.createAbilityCooldown({
  ability: {
    name: 'Power Strike',
    icon: '⚡'
  },
  cooldownRemaining: 5,
  cooldownMax: 30
});

// Ready ability
gameMetricsUI.createAbilityCooldown({
  ability: {
    name: 'Fireball',
    icon: '🔥'
  },
  cooldownRemaining: 0,
  cooldownMax: 20
});
```

**CSS Classes:** `.ability-cooldown`, `.ready`, `.cooldown`, `.cooldown-overlay`, `.cooldown-text`

---

### 13. Progress Task

Displays active grinding tasks with efficiency indicator.

**Method:** `createProgressTask(options)`

**Options:**
- `task` (object) - Task with: `name`, `icon`, `color`
- `progress` (number) - Progress 0-100%
- `efficiency` (number) - Efficiency 0-100% (default: 100)
- `isBackground` (boolean) - Background hack styling (default: false)

**Features:**
- Shows efficiency percentage
- Warning styling if efficiency < 70%
- Dimmed for background tasks

**Example:**
```javascript
gameMetricsUI.createProgressTask({
  task: {
    name: 'Intrusion',
    icon: '🔓',
    color: '#00ff41'
  },
  progress: 65,
  efficiency: 82
});

// Background hack
gameMetricsUI.createProgressTask({
  task: {
    name: 'Decryption',
    icon: '🔐',
    color: '#00ff41'
  },
  progress: 42,
  efficiency: 68,
  isBackground: true
});
```

**CSS Classes:** `.progress-task`, `.background-hack`, `.warning`, `.task-efficiency`

---

## Color Scheme

### Primary Colors
- **Health/Green** - `#00ff41` - HP, healing, success
- **Cyan** - `#00d4ff` - UI, buffs, info
- **Magenta** - `#ff00ff` - Active, special effects
- **Yellow** - `#ffff00` - XP, warnings, level up
- **Red** - `#ff4444` - Damage, danger, errors
- **Orange** - `#ffaa00` - Warnings, caution

### Status Colors
- **Critical Health** - `#ff0000`
- **Low Health** - `#ff4444`
- **Medium Health** - `#ffaa00`
- **High Health** - `#00ff41`
- **Max Level** - `#ffff00`

---

## Animations

### Built-in Animations
- `animate-pulse` - Pulsing opacity
- `animate-bounce` - Bouncing motion
- `animate-fade-up` - Fade and float up
- `animate-slide-down` - Slide down into view
- `critical-pulse` - Fast red pulse for critical HP
- `level-up-bounce` - Scale bounce for level up
- `damage-float` - Damage number float animation
- `crit-float` - Critical damage spin animation

### Using Animations

```javascript
// In HTML
<div class="animate-pulse">Pulsing text</div>

// With duration modifier
<div style="animation: level-up-bounce 0.6s ease-out;">
  Level Up!
</div>
```

---

## Integration Example

```javascript
import { gameMetricsUI } from './js/ui/gameMetrics.js';
import { getGame } from './js/main.js';

function updateCombatDisplay() {
  const game = getGame();
  const combat = game.combat;
  
  const statusHTML = gameMetricsUI.createCombatStatus({
    playerHealth: combat.playerHp,
    playerMaxHealth: combat.maxPlayerHp,
    enemyHealth: combat.currentEnemy.hp,
    enemyMaxHealth: combat.currentEnemy.maxHp,
    enemyName: combat.currentEnemy.name,
    isBoss: combat.currentEnemy.isBoss
  });
  
  document.getElementById('combat-ui').innerHTML = statusHTML;
}

// Update every 100ms
setInterval(updateCombatDisplay, 100);
```

---

## Responsive Behavior

All components are mobile-responsive:
- Progress bars adapt to screen size
- Status effects grid reflows
- Combat panel stacks vertically on mobile
- Font sizes scale appropriately
- Touch-friendly sizing (min 44px height for buttons)

---

## Performance Tips

1. **Batch Updates** - Update multiple components in one render pass
2. **Debounce** - Use intervals (100-500ms) instead of every frame
3. **CSS Transitions** - Prefer CSS over JavaScript animations
4. **Cleanup** - Remove listeners and intervals when components unmount

---

## Accessibility

- All components use semantic HTML
- Color isn't the only indicator (use icons + text)
- Font size scales with content
- High contrast colors (WCAG AA compliant)
- Screen reader friendly labels

---

## Future Enhancements

- Sound effects integration
- Particle effects system
- Advanced battle animations
- Custom theme support
- Accessibility modes
- Dark/Light mode toggle

