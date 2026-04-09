import { PASSIVE_BONUSES } from '../data/skillData.js';

/**
 * PassiveStats — aggregates all stat bonuses from skills, equipment, and prestige
 * into a single computed stats object. Recalculates on demand.
 *
 * Stats:
 *   maxHP, attackPower, defense, evasion, critChance, critDamage,
 *   xpBonus, currencyBonus, actionSpeed, lootBonus
 */
export class PassiveStats {
  constructor(skillManager, equipment, prestige) {
    this.skillManager = skillManager;
    this.equipment = equipment;
    this.prestige = prestige;
    this._cachedStats = null;
    this._cacheVersion = -1;
  }

  /** Get all computed stats (recalculates if dirty) */
  getStats() {
    // Always recalculate — cheap enough for 1s ticks and UI polling
    return this._calculate();
  }

  /** Get a single stat value */
  getStat(statName) {
    const stats = this.getStats();
    return stats[statName] || 0;
  }

  /** Get only the skill-level-derived portion of a stat (avoids double-counting equipment/prestige) */
  getSkillBonus(statName) {
    let bonus = 0;
    if (this.skillManager) {
      const skills = this.skillManager.getAllSkills ? this.skillManager.getAllSkills() : [];
      for (const skill of skills) {
        const pb = PASSIVE_BONUSES[skill.id];
        if (pb && pb.stat === statName && skill.level > 1) {
          bonus += (skill.level - 1) * pb.perLevel;
        }
      }
    }
    return bonus;
  }

  _calculate() {
    const stats = {
      maxHP: 100,        // base 100
      attackPower: 0,    // flat bonus to damage
      defense: 0,        // flat bonus to defense
      evasion: 0,        // % dodge chance
      critChance: 5,     // base 5%
      critDamage: 150,   // base 150% (1.5x)
      xpBonus: 0,        // % bonus
      currencyBonus: 0,  // % bonus
      actionSpeed: 0,    // % faster actions
      lootBonus: 0,      // % bonus loot
    };

    // --- Skill level bonuses ---
    if (this.skillManager) {
      const skills = this.skillManager.getAllSkills ? this.skillManager.getAllSkills() : [];
      for (const skill of skills) {
        const bonus = PASSIVE_BONUSES[skill.id];
        if (bonus && skill.level > 1) {
          const levelContribution = (skill.level - 1) * bonus.perLevel;
          stats[bonus.stat] = (stats[bonus.stat] || 0) + levelContribution;
        }
      }
    }

    // --- Equipment bonuses ---
    if (this.equipment) {
      const effects = this.equipment.getSpecialEffects();
      stats.xpBonus += (effects.xpBoost || 0) * 100;         // convert 0.10 -> 10%
      stats.actionSpeed += (effects.speedBoost || 0) * 100;
      stats.lootBonus += (effects.lootBoost || 0) * 100;
      stats.currencyBonus += (effects.currencyBoost || 0) * 100;

      // Equipment flat bonuses
      stats.attackPower += this.equipment.getBonusDamage();
      stats.defense += this.equipment.getBonusDefense();
    }

    // --- Prestige bonuses ---
    if (this.prestige) {
      const xpMult = this.prestige.getXPMultiplier();
      stats.xpBonus += (xpMult - 1) * 100;
      const currMult = this.prestige.getCurrencyMultiplier();
      stats.currencyBonus += (currMult - 1) * 100;
      if (this.prestige.bonuses) {
        stats.lootBonus += this.prestige.bonuses.materialDropBonus || 0;
        stats.attackPower += this.prestige.bonuses.combatDamageBonus || 0;
      }
    }

    // --- Clamp values ---
    stats.maxHP = Math.floor(stats.maxHP);
    stats.attackPower = Math.floor(stats.attackPower * 10) / 10;
    stats.defense = Math.floor(stats.defense * 10) / 10;
    stats.evasion = Math.min(stats.evasion, 75);  // cap at 75%
    stats.critChance = Math.min(stats.critChance, 80); // cap at 80%
    stats.critDamage = Math.floor(stats.critDamage * 10) / 10;
    stats.actionSpeed = Math.min(stats.actionSpeed, 50); // cap at 50%

    return stats;
  }

  /** Get breakdown of where stats come from (for UI tooltip) */
  getBreakdown() {
    const breakdown = {};
    const statNames = ['maxHP', 'attackPower', 'defense', 'evasion', 'critChance',
                       'critDamage', 'xpBonus', 'currencyBonus', 'actionSpeed', 'lootBonus'];

    for (const stat of statNames) {
      breakdown[stat] = { base: 0, skills: 0, equipment: 0, prestige: 0 };
    }

    // Bases
    breakdown.maxHP.base = 100;
    breakdown.critChance.base = 5;
    breakdown.critDamage.base = 150;

    // Skill contributions
    if (this.skillManager) {
      const skills = this.skillManager.getAllSkills ? this.skillManager.getAllSkills() : [];
      for (const skill of skills) {
        const bonus = PASSIVE_BONUSES[skill.id];
        if (bonus && skill.level > 1) {
          breakdown[bonus.stat].skills += (skill.level - 1) * bonus.perLevel;
        }
      }
    }

    // Equipment contributions
    if (this.equipment) {
      const effects = this.equipment.getSpecialEffects();
      breakdown.xpBonus.equipment += (effects.xpBoost || 0) * 100;
      breakdown.actionSpeed.equipment += (effects.speedBoost || 0) * 100;
      breakdown.lootBonus.equipment += (effects.lootBoost || 0) * 100;
      breakdown.currencyBonus.equipment += (effects.currencyBoost || 0) * 100;
      breakdown.attackPower.equipment += this.equipment.getBonusDamage();
      breakdown.defense.equipment += this.equipment.getBonusDefense();
    }

    // Prestige contributions
    if (this.prestige) {
      breakdown.xpBonus.prestige += (this.prestige.getXPMultiplier() - 1) * 100;
      breakdown.currencyBonus.prestige += (this.prestige.getCurrencyMultiplier() - 1) * 100;
      if (this.prestige.bonuses) {
        breakdown.lootBonus.prestige += this.prestige.bonuses.materialDropBonus || 0;
        breakdown.attackPower.prestige += this.prestige.bonuses.combatDamageBonus || 0;
      }
    }

    return breakdown;
  }

  // No serialization needed — stats are derived from other systems
  serialize() { return {}; }
  deserialize() {}
}
