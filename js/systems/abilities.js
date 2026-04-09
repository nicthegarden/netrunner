import { events, EVENTS } from '../engine/events.js';
import { SKILL_ABILITIES } from '../data/skillData.js';

/**
 * AbilityManager — manages combat ability selection, cooldowns, and auto-cast.
 *
 * Each of 24 skills has 3 abilities (unlocked at levels 15, 45, 75).
 * Player selects ONE ability per skill to be "equipped" for combat.
 * During combat, abilities can be manually activated or auto-cast.
 * Auto-cast triggers when the skill's highest mastery level >= 50.
 *
 * Abilities scale with skill level:
 *   power = basePower + floor(skillLevel * scaling)
 */
export class AbilityManager {
  constructor(skillManager) {
    this.skillManager = skillManager;

    // Map: skillId -> abilityId (selected ability per skill)
    this.selections = {};

    // Map: abilityId -> { cooldownRemaining, isActive, effectRemaining }
    this.cooldowns = {};

    // Active combat effects: array of { abilityId, type, remaining, power, ... }
    this.activeEffects = [];
  }

  /** Get all abilities for a skill (with unlock/select/autocast status) */
  getAbilitiesForSkill(skillId) {
    const abilities = SKILL_ABILITIES[skillId] || [];
    const skill = this.skillManager.getSkill(skillId);
    if (!skill) return [];

    return abilities.map(ability => {
      const unlocked = skill.level >= ability.level;
      const selected = this.selections[skillId] === ability.id;
      const mastered = this._getHighestMastery(skillId) >= 50;
      const power = this._calculatePower(ability, skill.level);

      return {
        ...ability,
        unlocked,
        selected,
        autocast: mastered && selected,
        power,
        cooldownRemaining: this.cooldowns[ability.id]?.cooldownRemaining || 0,
        skillLevel: skill.level,
        skillName: skill.name,
      };
    });
  }

  /** Get all selected abilities across all skills (for combat use) */
  getSelectedAbilities() {
    const result = [];
    for (const [skillId, abilityId] of Object.entries(this.selections)) {
      const abilities = SKILL_ABILITIES[skillId] || [];
      const ability = abilities.find(a => a.id === abilityId);
      if (!ability) continue;

      const skill = this.skillManager.getSkill(skillId);
      if (!skill || skill.level < ability.level) continue;

      const mastered = this._getHighestMastery(skillId) >= 50;
      result.push({
        ...ability,
        skillId,
        skillName: skill.name,
        power: this._calculatePower(ability, skill.level),
        autocast: mastered,
        cooldownRemaining: this.cooldowns[ability.id]?.cooldownRemaining || 0,
      });
    }
    return result;
  }

  /** Select an ability for a skill (or deselect if same) */
  selectAbility(skillId, abilityId) {
    const abilities = SKILL_ABILITIES[skillId] || [];
    const ability = abilities.find(a => a.id === abilityId);
    if (!ability) return false;

    const skill = this.skillManager.getSkill(skillId);
    if (!skill || skill.level < ability.level) return false;

    if (this.selections[skillId] === abilityId) {
      // Deselect
      delete this.selections[skillId];
    } else {
      this.selections[skillId] = abilityId;
    }
    return true;
  }

  /** Activate an ability manually during combat. Returns effect data or null. */
  activateAbility(abilityId) {
    // Find which skill this belongs to
    let foundAbility = null;
    let foundSkillId = null;
    for (const [skillId, abilities] of Object.entries(SKILL_ABILITIES)) {
      const ab = abilities.find(a => a.id === abilityId);
      if (ab) { foundAbility = ab; foundSkillId = skillId; break; }
    }
    if (!foundAbility) return null;

    // Check cooldown
    if (this.cooldowns[abilityId]?.cooldownRemaining > 0) return null;

    // Check if selected
    if (this.selections[foundSkillId] !== abilityId) return null;

    // Check skill level
    const skill = this.skillManager.getSkill(foundSkillId);
    if (!skill || skill.level < foundAbility.level) return null;

    const power = this._calculatePower(foundAbility, skill.level);

    // Start cooldown
    this.cooldowns[abilityId] = { cooldownRemaining: foundAbility.cooldown };

    // Create effect
    const effect = this._createEffect(foundAbility, power, skill.level);

    return effect;
  }

  /** Called each combat tick — decrements cooldowns, processes DoTs, auto-casts */
  tick(combatActive) {
    const effects = [];

    // Decrement cooldowns
    for (const [abilityId, cd] of Object.entries(this.cooldowns)) {
      if (cd.cooldownRemaining > 0) {
        cd.cooldownRemaining--;
      }
    }

    // Process active effects (DoTs, buffs, etc.)
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const eff = this.activeEffects[i];
      eff.remaining--;
      if (eff.remaining <= 0) {
        this.activeEffects.splice(i, 1);
      }
    }

    // Auto-cast logic (only during active combat)
    if (combatActive) {
      const selected = this.getSelectedAbilities();
      for (const ability of selected) {
        if (ability.autocast && ability.cooldownRemaining <= 0) {
          const effect = this.activateAbility(ability.id);
          if (effect) {
            effects.push(effect);
          }
        }
      }
    }

    return effects;
  }

  /** Reset all cooldowns (called when combat ends) */
  resetCooldowns() {
    this.cooldowns = {};
    this.activeEffects = [];
  }

  /** Get active buffs/debuffs for combat calculations */
  getActiveBuffs() {
    const buffs = {
      damageMultiplier: 1.0,
      defenseMultiplier: 1.0,
      speedMultiplier: 1.0,
      critChanceBonus: 0,
      critDamageBonus: 0,
      evasionBonus: 0,
      shieldHP: 0,
      enemyDamageReduction: 0,
      enemyDefenseReduction: 0,
      enemyVulnerability: 0,    // extra % damage taken
      enemyStunRemaining: 0,
      invulnerable: false,
    };

    for (const eff of this.activeEffects) {
      if (eff.buffType === 'damage') buffs.damageMultiplier += eff.value;
      if (eff.buffType === 'defense') buffs.defenseMultiplier += eff.value;
      if (eff.buffType === 'speed') buffs.speedMultiplier += eff.value;
      if (eff.buffType === 'critChance') buffs.critChanceBonus += eff.value;
      if (eff.buffType === 'critDamage') buffs.critDamageBonus += eff.value;
      if (eff.buffType === 'evasion') buffs.evasionBonus += eff.value;
      if (eff.buffType === 'shield') buffs.shieldHP += eff.value;
      if (eff.buffType === 'enemyDamageReduce') buffs.enemyDamageReduction += eff.value;
      if (eff.buffType === 'enemyDefenseReduce') buffs.enemyDefenseReduction += eff.value;
      if (eff.buffType === 'enemyVulnerability') buffs.enemyVulnerability += eff.value;
      if (eff.buffType === 'stun') buffs.enemyStunRemaining = Math.max(buffs.enemyStunRemaining, eff.remaining);
      if (eff.buffType === 'invulnerable') buffs.invulnerable = true;
    }

    return buffs;
  }

  _calculatePower(ability, skillLevel) {
    return Math.floor(ability.basePower + skillLevel * ability.scaling);
  }

  _getHighestMastery(skillId) {
    const skill = this.skillManager.getSkill(skillId);
    if (!skill || !skill.masteryData) return 0;
    let highest = 0;
    for (const key of Object.keys(skill.masteryData)) {
      const ml = skill.masteryData[key]?.level || 0;
      if (ml > highest) highest = ml;
    }
    return highest;
  }

  _createEffect(ability, power, skillLevel) {
    const effect = {
      abilityId: ability.id,
      abilityName: ability.name,
      icon: ability.icon,
      type: ability.type,
      power,
    };

    switch (ability.type) {
      case 'damage':
        effect.damage = power;
        // Some damage abilities have secondary effects
        if (ability.effect.includes('stun')) {
          this.activeEffects.push({ buffType: 'stun', remaining: 2, value: 0 });
        }
        if (ability.effect.includes('DoT')) {
          this.activeEffects.push({ buffType: 'dot', remaining: 5, value: Math.floor(power * 0.2) });
        }
        if (ability.effect.includes('ignoring defense') || ability.effect.includes('ignore defense') || ability.effect.includes('bypassing armor')) {
          effect.ignoreDefense = true;
        }
        if (ability.effect.includes('+50% if enemy below 30%')) {
          effect.executeThreshold = 0.3;
          effect.executeBonusMult = 1.5;
        }
        break;

      case 'heal':
        effect.healing = power;
        if (ability.effect.includes('immunity') || ability.effect.includes('invulnerability')) {
          this.activeEffects.push({ buffType: 'invulnerable', remaining: 3, value: 0 });
        }
        break;

      case 'buff':
        const duration = this._parseDuration(ability.effect);
        if (ability.effect.includes('damage')) {
          const pct = this._parsePercent(ability.effect, 'damage') / 100;
          this.activeEffects.push({ buffType: 'damage', remaining: duration, value: pct });
        }
        if (ability.effect.includes('defense')) {
          const pct = this._parsePercent(ability.effect, 'defense') / 100;
          this.activeEffects.push({ buffType: 'defense', remaining: duration, value: pct });
        }
        if (ability.effect.includes('speed')) {
          const pct = this._parsePercent(ability.effect, 'speed') / 100;
          this.activeEffects.push({ buffType: 'speed', remaining: duration, value: pct });
        }
        if (ability.effect.includes('crit chance')) {
          const pct = this._parsePercent(ability.effect, 'crit chance');
          this.activeEffects.push({ buffType: 'critChance', remaining: duration, value: pct });
        }
        if (ability.effect.includes('crit damage')) {
          const pct = this._parsePercent(ability.effect, 'crit damage');
          this.activeEffects.push({ buffType: 'critDamage', remaining: duration, value: pct });
        }
        if (ability.effect.includes('evasion')) {
          const pct = this._parsePercent(ability.effect, 'evasion');
          this.activeEffects.push({ buffType: 'evasion', remaining: duration, value: pct });
        }
        if (ability.effect.includes('shield') || ability.effect.includes('Absorb') || ability.effect.includes('Block')) {
          this.activeEffects.push({ buffType: 'shield', remaining: duration, value: power });
        }
        effect.buffApplied = true;
        break;

      case 'debuff':
        const debuffDur = this._parseDuration(ability.effect);
        if (ability.effect.includes('enemy damage') || ability.effect.includes('Reduce enemy damage') || ability.effect.includes('Reducing enemy damage')) {
          const pct = this._parsePercent(ability.effect, 'damage') / 100;
          this.activeEffects.push({ buffType: 'enemyDamageReduce', remaining: debuffDur, value: pct });
        }
        if (ability.effect.includes('enemy defense') || ability.effect.includes('Reduce enemy defense')) {
          const pct = this._parsePercent(ability.effect, 'defense') / 100;
          this.activeEffects.push({ buffType: 'enemyDefenseReduce', remaining: debuffDur, value: pct });
        }
        if (ability.effect.includes('takes +') || ability.effect.includes('damage to target') || ability.effect.includes('vulnerability') || ability.effect.includes('expose')) {
          const pct = this._parsePercent(ability.effect, 'damage') / 100;
          this.activeEffects.push({ buffType: 'enemyVulnerability', remaining: debuffDur, value: pct || 0.15 });
        }
        if (ability.effect.includes('Stun') || ability.effect.includes('stun')) {
          const stunDur = parseInt(ability.effect.match(/(\d+)s/)?.[1] || '2');
          this.activeEffects.push({ buffType: 'stun', remaining: stunDur, value: 0 });
        }
        if (ability.effect.includes('miss')) {
          this.activeEffects.push({ buffType: 'stun', remaining: 2, value: 0 });
        }
        if (ability.effect.includes('crit')) {
          const pct = this._parsePercent(ability.effect, 'crit');
          this.activeEffects.push({ buffType: 'critChance', remaining: debuffDur, value: pct });
        }
        effect.debuffApplied = true;
        break;
    }

    return effect;
  }

  _parseDuration(effectStr) {
    const match = effectStr.match(/(\d+)s/);
    return match ? parseInt(match[1]) : 8;
  }

  _parsePercent(effectStr, keyword) {
    // Try patterns like "+30% damage", "25% evasion", etc.
    const patterns = [
      new RegExp(`\\+(\\d+)%\\s*${keyword}`, 'i'),
      new RegExp(`(\\d+)%\\s*${keyword}`, 'i'),
      new RegExp(`${keyword}[^\\d]*(\\d+)%`, 'i'),
      new RegExp(`\\+(\\d+)%`, 'i'),
    ];
    for (const pat of patterns) {
      const m = effectStr.match(pat);
      if (m) return parseInt(m[1]);
    }
    return 15; // default fallback
  }

  serialize() {
    return {
      selections: { ...this.selections },
    };
  }

  deserialize(data) {
    if (!data) return;
    this.selections = data.selections || {};
    this.cooldowns = {};
    this.activeEffects = [];
  }
}
