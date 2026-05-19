/**
 * CLARITY SYSTEM - Phase 1 Implementation
 * 
 * Provides:
 * - Interactive tutorial for new players
 * - Tooltips for all game mechanics
 * - Mechanics panel explaining hidden systems
 * - Achievement hints
 * - Combat breakdown
 * - Prestige calculator
 */

import { events, EVENTS } from '../engine/events.js';

export class ClaritySystem {
  constructor() {
    this.tutorialState = 'idle'; // idle, tutorial_1, tutorial_2, tutorial_3, complete
    this.tooltipsEnabled = true;
    this.tooltipData = this._initializeTooltips();
    this.mechanicsExplained = new Set();
    this.achievementHints = this._initializeAchievementHints();
  }

  // ============================================
  // Tutorial Management
  // ============================================

  /**
   * Start interactive tutorial
   */
  startTutorial() {
    if (this.tutorialState === 'complete') return;
    this.tutorialState = 'tutorial_1';
    
    events.emit(EVENTS.UI_NOTIFICATION, {
      message: 'Welcome to NETRUNNER! Click the ? icon anytime for help.',
      type: 'info',
      transient: false,
      duration: 8000
    });

    return {
      step: 1,
      title: 'Welcome to NETRUNNER',
      content: `
You are a netrunner in a cyberpunk future. Your goal: grind 24 skills to level 99, earn currency, 
craft items, and prestige for permanent multipliers.

Each skill has activities (like "Easy Hack", "Fight Gang", etc). Click an activity to start grinding.
You earn XP and rewards (items, currency) every few seconds.

CLICK ANY ACTIVITY TO BEGIN!
      `,
      target: '.skill-list',
      position: 'right',
      callback: () => this.tutorialState = 'tutorial_2'
    };
  }

  /**
   * Get next tutorial step
   */
  getNextTutorialStep() {
    if (this.tutorialState === 'tutorial_2') {
      return {
        step: 2,
        title: 'Understanding Your Progress',
        content: `
When you start an activity, watch the progress bar fill up. When it completes, you'll get:
- XP (toward your next level, max 99)
- Items (materials for crafting)
- Currency (E$, for buying from shops)

TIP: Each activity also has MASTERY XP. Get mastery level 99 on an activity for +99% XP bonus!

Now check your INVENTORY to see what you earned. (Left sidebar: "Inventory")
      `,
        target: '#sidebar',
        position: 'right',
        callback: () => this.tutorialState = 'tutorial_3'
      };
    }

    if (this.tutorialState === 'tutorial_3') {
      return {
        step: 3,
        title: 'Combat & Equipment',
        content: `
Once you reach Combat skill level 5+, you can fight enemies. Combat is real-time:
- You attack every 2 seconds (3 base damage + skill bonuses)
- Enemy attacks every 3 seconds
- Win = XP + loot + items

You can equip weapons and armor to increase damage/defense:
- Weapon: +damage
- Armor: -incoming damage (halved, so 10 armor = -5 damage)
- Cyberware: can have multiple bonuses (XP boost, loot boost, etc)

Check your EQUIPMENT slot to equip items from your inventory!
      `,
        target: '#sidebar',
        position: 'right',
        callback: () => {
          this.tutorialState = 'complete';
        }
      };
    }

    return null;
  }

  // ============================================
  // Tooltip System
  // ============================================

  /**
   * Get tooltip for a mechanic
   */
  getTooltip(mechanicId) {
    return this.tooltipData[mechanicId] || null;
  }

  /**
   * Mark mechanic as explained (suppress future tooltips)
   */
  explainMechanic(mechanicId) {
    this.mechanicsExplained.add(mechanicId);
  }

  /**
   * Show tooltip only if not yet explained
   */
  maybeShowTooltip(mechanicId, position = 'top') {
    if (this.mechanicsExplained.has(mechanicId)) {
      return null;
    }

    const tooltip = this.getTooltip(mechanicId);
    if (!tooltip) return null;

    this.explainMechanic(mechanicId);
    return {
      id: mechanicId,
      text: tooltip.text,
      title: tooltip.title,
      position: position,
      icon: tooltip.icon || '?'
    };
  }

  _initializeTooltips() {
    return {
      'xp_formula': {
        title: 'XP Formula',
        icon: '⭐',
        text: `
Your XP gain is calculated as:
  totalXP = baseXP × masteryBonus × prestigeMultiplier

- baseXP = the XP reward from the activity
- masteryBonus = 1 + (masteryLevel × 0.01), max 1.99x at mastery 99
- prestigeMultiplier = varies by prestige level (1.0 → 2.0+x)

This means mastery and prestige matter A LOT for grinding speed!
        `
      },

      'mastery_system': {
        title: 'Mastery System',
        icon: '🎯',
        text: `
Each activity tracks separate MASTERY XP. As you grind an activity:
- Reach mastery level 1: +1% XP
- Reach mastery level 2: +2% XP
- ... up to mastery 99: +99% XP!

Mastery is HIDDEN but POWERFUL. Activities with mastery 99 are 99% faster!

Tip: Focus on a few activities to 99 mastery, then switch to new ones.
        `
      },

      'prestige_system': {
        title: 'Prestige System',
        icon: '👑',
        text: `
After reaching ~500K XP in a skill, you can PRESTIGE to reset all skills to level 1, 
but keep your items and GAIN PERMANENT MULTIPLIERS:

- Prestige Level 1: +1% XP, +0.5% currency
- Prestige Level 2: +2% XP, +1% currency
- ... scales with prestige level

You also earn PRESTIGE POINTS to buy upgrades like:
- +5% more XP (+10 points)
- +8% more currency (+15 points)

Prestige is the endgame progression system!
        `
      },

      'equipment_effects': {
        title: 'Equipment Special Effects',
        icon: '⚙️',
        text: `
Advanced equipment has special effects:
- XP Boost: +10-20% XP gain from activities
- Speed Boost: reduce activity duration by 15-25%
- Loot Boost: increase item drop quantity by 20-30%
- Currency Boost: increase E$ rewards by 20-25%

These are HIDDEN but POWERFUL. Find them in advanced crafting!
        `
      },

      'combat_mechanics': {
        title: 'Combat Hidden Mechanics',
        icon: '⚔️',
        text: `
Combat has mechanics the game doesn't explain:

1. CRITICAL HITS: Random 20% chance, 1.5x damage
2. EVASION: Your defense stat also grants 5% miss chance per point
3. DAMAGE VARIANCE: ±25% randomness on every hit
4. STATUS EFFECTS: Buffs/debuffs like poison, stun, regen (coming soon!)

Example: With 10 defense:
  - You take 50% less damage (halved)
  - You have 50% chance to dodge (5% × 10)
        `
      },

      'hacking_risk': {
        title: 'Hacking Risk System',
        icon: '🦠',
        text: `
Hacking activities have a COMPROMISE CHANCE of getting infected with a VIRUS:

Formula: compromise% = 15% - (skillLevel × 0.5%) - (defense × 2%) - (prestige × 1%)

Examples:
  - Skill level 1, no defense, prestige 0: 15% chance
  - Skill level 30, defense 5, prestige 1: 15-15-10-1 = -11% = 0% (safe!)

Viruses include:
  - Data Corruption (low): -10% XP for 1 hour
  - System Crash (med): -25% XP + lose 50 E$ per crash (random)
  - Payload Leak (high): lose items randomly for 2 hours
  - Deep Intrusion (critical): all the above + character is vulnerable

Visit the CLINIC to remove viruses (cost: 500-5000 E$, time: 0-30 min)
        `
      },

      'inventory_system': {
        title: 'Inventory Management',
        icon: '🎒',
        text: `
You have 100 inventory slots. Different items take different space:

- STACKABLE items: share slots (e.g., 1000x data_shard = 1 slot)
- NON-STACKABLE items: each takes 1 slot (e.g., 5 weapons = 5 slots)

When inventory fills up:
  - Activities grind slower (efficiency drops)
  - Future rewards might be lost
  - Visit SHOP to sell items you don't need

Tip: Craft items into higher-value ones to save space!
        `
      },

      'crafting_synergy': {
        title: 'Crafting Synergy',
        icon: '🔨',
        text: `
Crafting lets you CONVERT low-value items into high-value ones:
  - 5x data_shard + 2x circuit_board → 1x encrypted_data (sells for 5x the input!)

Crafting is NOT about gaining XP — it's about INVENTORY EFFICIENCY and getting rare items
for equipment upgrades.

Use crafting to recycle excess materials!
        `
      },

      'passive_stats': {
        title: 'Passive Stat Bonuses',
        icon: '📊',
        text: `
Your stats come from THREE sources, all summed together:

1. SKILL LEVELS: Combat level 50 = +5 defense (visible in "Passives" panel)
2. EQUIPMENT: Kevlar bodysuit = +5 defense (see under EQUIPMENT)
3. PRESTIGE: Each prestige level = +0.5% XP multiplier (hidden, applied automatically)

Open "PASSIVES" tab to see ALL your bonuses itemized!

The passive stat panel shows you exactly where each bonus comes from.
        `
      },

      'skill_categories': {
        title: 'Skill Categories',
        icon: '📚',
        text: `
24 skills across 6 categories:

- HACKING: Intrusion, Decryption, ICE Breaking, Daemon Coding
- NETRUNNING: Deep Dive, Data Mining, Black ICE Combat, Neural Surfing
- STREET: Combat, Stealth, Street Cred, Smuggling
- TECH: Cyberware Crafting, Weapon Modding, Vehicle Tuning, Drone Engineering
- FIXER: Trading, Corpo Infiltration, Info Brokering, Fencing
- RIPPER: Cyberware Installation, Biotech, Neural Enhancement, Chrome Surgery

Each skill has 4-6 activities scaling from level 1 to level 90+.
        `
      },

      'offline_progress': {
        title: 'Offline Progress',
        icon: '😴',
        text: `
When you close the game, offline progress is calculated:

- Max offline: 24 hours of grind
- Processed in batches (no lag spikes on restart)
- XP and items earned, but NO events triggered (achievements don't count offline!)

Tip: Before logging off, start a high-XP activity and let it grind offline!
        `
      }
    };
  }

  // ============================================
  // Achievement Hints
  // ============================================

  /**
   * Get hint for an achievement
   */
  getAchievementHint(achievementId) {
    return this.achievementHints[achievementId] || null;
  }

  _initializeAchievementHints() {
    return {
      'level_99_master': {
        hint: 'Get any skill to level 99 (2M+ XP)',
        difficulty: 'hard',
        timeEstimate: '20-40 hours'
      },

      'prestige_level_1': {
        hint: 'Reach prestige level 1 by grinding 500K XP in any skill, then prestige',
        difficulty: 'medium',
        timeEstimate: '5-10 hours'
      },

      'collector_100': {
        hint: 'Collect 100 different item types (you only have 100 inventory slots!)',
        difficulty: 'hard',
        timeEstimate: '30+ hours'
      },

      'rich_1m': {
        hint: 'Earn 1 million E$ total (check Economy view for progress)',
        difficulty: 'medium',
        timeEstimate: '10-20 hours'
      },

      'boss_slayer': {
        hint: 'Defeat 5 different boss enemies (combat level 85+)',
        difficulty: 'hard',
        timeEstimate: '15-25 hours'
      },

      'perfect_mastery': {
        hint: 'Get mastery level 99 on a single activity (grind same activity 1000+ times)',
        difficulty: 'very_hard',
        timeEstimate: '50+ hours'
      }
    };
  }

  // ============================================
  // Mechanics Panel (Info/Debug View)
  // ============================================

  /**
   * Generate a comprehensive mechanics breakdown
   */
  generateMechanicsPanel(gameState) {
    const { skillManager, combat, inventory, equipment, economy, prestige, passiveStats } = gameState;

    return {
      xpBreakdown: this._calculateXpBreakdown(skillManager, prestige),
      combatBreakdown: this._calculateCombatBreakdown(combat, equipment, passiveStats),
      inventoryHealth: this._calculateInventoryHealth(inventory),
      prestigeProgress: this._calculatePrestigeProgress(skillManager, prestige),
      equipmentBonuses: this._calculateEquipmentBonuses(equipment, passiveStats),
      passiveBonuses: this._formatPassiveBonuses(passiveStats),
      economyStats: this._calculateEconomyStats(economy, prestige),
      hackingRiskAssessment: this._assessHackingRisk(skillManager, equipment, prestige)
    };
  }

  _calculateXpBreakdown(skillManager, prestige) {
    const activeSkill = skillManager.getActiveSkill();
    if (!activeSkill) return null;

    const baseXP = activeSkill.currentAction?.xp || 0;
    const masteryBonus = 1 + (activeSkill.getMasteryLevel(activeSkill.currentAction?.id) * 0.01);
    const prestigeMultiplier = prestige?.getXPMultiplier?.() || 1.0;
    const totalXP = baseXP * masteryBonus * prestigeMultiplier;

    return {
      baseXP,
      masteryLevel: activeSkill.getMasteryLevel(activeSkill.currentAction?.id),
      masteryBonus: `${(masteryBonus * 100).toFixed(0)}%`,
      prestigeLevel: prestige?.level || 0,
      prestigeMultiplier: `${(prestigeMultiplier * 100).toFixed(1)}%`,
      totalXP: totalXP.toFixed(0),
      explanation: `totalXP = ${baseXP} × ${masteryBonus.toFixed(2)} × ${prestigeMultiplier.toFixed(2)} = ${totalXP.toFixed(0)}`
    };
  }

  _calculateCombatBreakdown(combat, equipment, passiveStats) {
    const playerDamage = combat?.getPlayerDamage?.() || 0;
    const enemyDamage = combat?.currentEnemy ? (combat.currentEnemy.damage || 0) : 0;
    const defense = passiveStats?.defense || 0;
    const actualEnemyDamage = Math.max(0, enemyDamage - Math.floor(defense * 0.5));

    return {
      playerDamage: `${playerDamage.toFixed(0)} (±25%)`,
      playerCritChance: '20%',
      enemyDamage: `${enemyDamage} → ${actualEnemyDamage} (after defense)`,
      playerDefense: defense,
      defenseReduction: `-${Math.floor(defense * 0.5)} damage per hit`,
      dodgeChance: `${Math.min(100, defense * 5)}% (5% per defense point)`,
      playerAttackSpeed: 'Every 2 seconds',
      enemyAttackSpeed: 'Every 3 seconds',
      explanation: `You deal ${playerDamage}±25% damage. Enemy deals ${actualEnemyDamage} damage after your defense.`
    };
  }

  _calculateInventoryHealth(inventory) {
    const totalSlots = 100;
    const usedSlots = inventory?.getTotalSlotsUsed?.() || 0;
    const efficiency = 100 - ((usedSlots / totalSlots) * 100);

    return {
      usedSlots,
      totalSlots,
      efficiency: `${efficiency.toFixed(0)}%`,
      status: efficiency > 80 ? 'critical' : efficiency > 60 ? 'warning' : 'healthy',
      recommendation: efficiency < 50 ? 'Inventory healthy' : 'Consider selling or crafting items'
    };
  }

  _calculatePrestigeProgress(skillManager, prestige) {
    const currentPrestigeLevel = prestige?.level || 0;
    const nextPrestigeXP = (currentPrestigeLevel + 1) ** 2 * 500000;

    let maxSkillXP = 0;
    skillManager.skills.forEach(skill => {
      if (skill.xp > maxSkillXP) maxSkillXP = skill.xp;
    });

    const progressToNext = (maxSkillXP / nextPrestigeXP) * 100;

    return {
      currentLevel: currentPrestigeLevel,
      currentXP: maxSkillXP.toFixed(0),
      nextLevelXP: nextPrestigeXP.toFixed(0),
      progress: `${progressToNext.toFixed(1)}%`,
      timeToNext: progressToNext < 1 ? '100+ hours' : `${(100 / (progressToNext / 100)).toFixed(0)} hours (estimated)`
    };
  }

  _calculateEquipmentBonuses(equipment, passiveStats) {
    const weapon = equipment?.slots?.weapon;
    const armor = equipment?.slots?.armor;
    const cyberware = equipment?.slots?.cyberware;

    return {
      weapon: weapon ? `${weapon.name} (+${weapon.damage} damage)` : '[EMPTY]',
      armor: armor ? `${armor.name} (+${armor.defense} defense)` : '[EMPTY]',
      cyberware: cyberware ? `${cyberware.name} (multiple bonuses)` : '[EMPTY]',
      totalDamageBonus: (weapon?.damage || 0) + (cyberware?.damage || 0),
      totalDefenseBonus: (armor?.defense || 0) + (cyberware?.defense || 0)
    };
  }

  _formatPassiveBonuses(passiveStats) {
    const bonuses = [];
    
    // Collect all bonuses from passiveStats
    Object.entries(passiveStats || {}).forEach(([key, value]) => {
      if (typeof value === 'number' && value !== 0) {
        bonuses.push({
          stat: key,
          value: value,
          source: 'Skills + Equipment + Prestige'
        });
      }
    });

    return bonuses;
  }

  _calculateEconomyStats(economy, prestige) {
    const totalEarned = economy?.totalEarned || 0;
    const totalSpent = economy?.totalSpent || 0;
    const currentBalance = economy?.currency || 0;
    const prestigeMultiplier = prestige?.getCurrencyMultiplier?.() || 1.0;

    return {
      balance: currentBalance,
      totalEarned,
      totalSpent,
      prestigeMultiplier: `${(prestigeMultiplier * 100).toFixed(1)}%`,
      explanation: `You earn E$ × ${prestigeMultiplier.toFixed(2)} multiplier from prestige`
    };
  }

  _assessHackingRisk(skillManager, equipment, prestige) {
    const hackingSkill = skillManager.getSkill('intrusion');
    const skillLevel = hackingSkill?.level || 1;
    const defense = equipment?.getTotalDefense?.() || 0;
    const prestigeLevel = prestige?.level || 0;

    const baseRisk = 15;
    const skillReduction = skillLevel * 0.5;
    const defenseReduction = defense * 2;
    const prestigeReduction = prestigeLevel * 1;

    const compromiseChance = Math.max(0, baseRisk - skillReduction - defenseReduction - prestigeReduction);

    return {
      baseChance: `${baseRisk}%`,
      skillLevel,
      skillReduction: `${skillReduction.toFixed(1)}%`,
      defense,
      defenseReduction: `${defenseReduction}%`,
      prestigeLevel,
      prestigeReduction: `${prestigeReduction}%`,
      finalChance: `${compromiseChance.toFixed(1)}%`,
      risk: compromiseChance > 10 ? 'high' : compromiseChance > 5 ? 'medium' : 'low',
      explanation: `You have ${compromiseChance.toFixed(1)}% chance to get a virus on hacking activities`
    };
  }

  // ============================================
  // Serialization
  // ============================================

  serialize() {
    return {
      tutorialState: this.tutorialState,
      tooltipsEnabled: this.tooltipsEnabled,
      mechanicsExplained: Array.from(this.mechanicsExplained)
    };
  }

  deserialize(data) {
    if (!data) return;
    this.tutorialState = data.tutorialState || 'idle';
    this.tooltipsEnabled = data.tooltipsEnabled !== false;
    this.mechanicsExplained = new Set(data.mechanicsExplained || []);
  }
}

// Export singleton
export const claritySystem = new ClaritySystem();
