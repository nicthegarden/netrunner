/**
 * STATUS EFFECTS SYSTEM - Phase 5 Implementation
 * 
 * Manages:
 * - Buffs (beneficial effects) and debuffs (harmful effects)
 * - Status effect stacking and duration
 * - Combat integration (damage mods, dodge chance, etc.)
 * - Visual feedback and animations
 */

import { events, EVENTS } from '../engine/events.js';

export class StatusEffectManager {
  constructor() {
    this.playerEffects = []; // Active effects on player
    this.enemyEffects = new Map(); // enemyId -> [effects]
    this.maxEffectsPerEntity = 10;
    this.effectDefinitions = this._initializeEffectDefinitions();
  }

  // ============================================
  // Status Effect Definitions
  // ============================================

  _initializeEffectDefinitions() {
    return {
      // ========== BUFFS (Beneficial) ==========

      'combat_stim': {
        name: 'Combat Stim',
        type: 'buff',
        icon: '💉',
        color: '#00ff41', // Green
        duration: 30000, // 30 seconds
        maxStacks: 3, // Can stack up to 3x
        effects: {
          damageMultiplier: 1.50, // +50% damage
          displayText: '+50% damage'
        }
      },

      'bloodlust': {
        name: 'Bloodlust',
        type: 'buff',
        icon: '🩸',
        color: '#ff4444', // Red
        duration: 45000, // 45 seconds
        maxStacks: 2,
        effects: {
          critChance: 0.35, // +15% base crit (from 20% → 35%)
          damageMultiplier: 1.25, // +25% damage
          displayText: '+15% crit, +25% dmg'
        }
      },

      'regen': {
        name: 'Regeneration',
        type: 'buff',
        icon: '🌿',
        color: '#00ff41',
        duration: 60000, // 60 seconds
        maxStacks: 1, // Can't stack
        effects: {
          hpRegenPerTick: 5, // Heal 5 HP per second
          displayText: 'Heal 5 HP/s'
        }
      },

      'shield': {
        name: 'Shield',
        type: 'buff',
        icon: '🛡️',
        color: '#00d4ff', // Cyan
        duration: 40000,
        maxStacks: 2,
        effects: {
          damageReduction: 0.20, // -20% damage taken
          displayText: '-20% damage taken'
        }
      },

      'haste': {
        name: 'Haste',
        type: 'buff',
        icon: '⚡',
        color: '#ffff00', // Yellow
        duration: 35000,
        maxStacks: 1,
        effects: {
          attackSpeedMultiplier: 1.50, // Attack 50% faster (every 1.33s instead of 2s)
          displayText: '+50% attack speed'
        }
      },

      'precision': {
        name: 'Precision',
        type: 'buff',
        icon: '🎯',
        color: '#00d4ff',
        duration: 30000,
        maxStacks: 1,
        effects: {
          accuracyBonus: 0.25, // +25% accuracy (reduce miss chance)
          critMultiplier: 1.50, // Crits do 1.5x damage instead of 1x
          displayText: '+25% accuracy, crits ×1.5'
        }
      },

      // ========== DEBUFFS (Harmful) ==========

      'poison': {
        name: 'Poison',
        type: 'debuff',
        icon: '☠️',
        color: '#ff4444', // Red
        duration: 50000, // 50 seconds
        maxStacks: 3,
        effects: {
          damagePerTick: 3, // Take 3 damage per second
          damageMultiplier: 0.85, // -15% damage dealt
          displayText: 'Lose 3 HP/s, deal -15% damage'
        }
      },

      'stun': {
        name: 'Stun',
        type: 'debuff',
        icon: '💫',
        color: '#ffff00',
        duration: 8000, // 8 seconds (short!)
        maxStacks: 1, // Can't stack stuns
        effects: {
          paralyzed: true, // Can't attack
          displayText: 'Paralyzed! No attacks'
        }
      },

      'weakened': {
        name: 'Weakened',
        type: 'debuff',
        icon: '💔',
        color: '#ff6600', // Orange
        duration: 45000,
        maxStacks: 2,
        effects: {
          damageMultiplier: 0.65, // -35% damage dealt
          defenseReduction: 5, // -5 defense per stack
          displayText: '-35% damage, -5 defense'
        }
      },

      'confused': {
        name: 'Confused',
        type: 'debuff',
        icon: '😵',
        color: '#ff00ff', // Magenta
        duration: 30000,
        maxStacks: 1,
        effects: {
          randomAttacks: true, // 30% chance to attack self instead
          accuracyPenalty: 0.30, // -30% accuracy
          displayText: '30% self-attack, -30% accuracy'
        }
      },

      'bleed': {
        name: 'Bleed',
        type: 'debuff',
        icon: '🩹',
        color: '#ff4444',
        duration: 60000,
        maxStacks: 3,
        effects: {
          damagePerTick: 5, // 5 damage per tick
          displayText: 'Bleed 5 HP/s'
        }
      },

      'root': {
        name: 'Root',
        type: 'debuff',
        icon: '🌳',
        color: '#00cc44',
        duration: 20000,
        maxStacks: 1,
        effects: {
          stunned: true, // Same as stun
          displayText: 'Rooted! Can\'t move/attack'
        }
      }
    };
  }

  // ============================================
  // Effect Application
  // ============================================

  /**
   * Apply status effect to entity
   * @param {string} effectId - Effect ID from definitions
   * @param {string} targetId - 'player' or enemy ID
   * @param {number} duration - Override duration (ms), optional
   * @returns {StatusEffect|null} The applied effect
   */
  applyEffect(effectId, targetId = 'player', duration = null) {
    const definition = this.effectDefinitions[effectId];
    if (!definition) {
      console.warn(`Unknown effect: ${effectId}`);
      return null;
    }

    const effects = targetId === 'player' ? this.playerEffects : 
                   (this.enemyEffects.get(targetId) || []);

    // Check if already has max stacks
    const existingEffects = effects.filter(e => e.definitionId === effectId);
    if (existingEffects.length >= definition.maxStacks) {
      if (definition.maxStacks === 1) {
        // Refresh duration instead
        const existing = existingEffects[0];
        existing.createdAt = Date.now();
        return existing;
      }
      // Already at max stacks
      return null;
    }

    // Create new effect instance
    const effect = new StatusEffect(effectId, definition, duration);
    effects.push(effect);

    // Store back if enemy
    if (targetId !== 'player') {
      this.enemyEffects.set(targetId, effects);
    }

    // Emit event for UI
    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `${definition.type === 'buff' ? '✓' : '⚠️'} ${definition.name}`,
      type: definition.type === 'buff' ? 'success' : 'warning',
      icon: definition.icon,
      duration: 2000
    });

    return effect;
  }

  /**
   * Remove specific effect
   */
  removeEffect(effectId, targetId = 'player') {
    const effects = targetId === 'player' ? this.playerEffects : 
                   (this.enemyEffects.get(targetId) || []);

    const index = effects.findIndex(e => e.id === effectId);
    if (index >= 0) {
      const removed = effects[index];
      effects.splice(index, 1);
      return removed;
    }

    return null;
  }

  /**
   * Remove all effects of a type
   */
  removeEffectsByType(type, targetId = 'player') {
    const effects = targetId === 'player' ? this.playerEffects : 
                   (this.enemyEffects.get(targetId) || []);

    const removed = effects.filter(e => this.effectDefinitions[e.definitionId]?.type === type);
    
    if (targetId === 'player') {
      this.playerEffects = effects.filter(e => this.effectDefinitions[e.definitionId]?.type !== type);
    } else {
      this.enemyEffects.set(targetId, effects.filter(e => this.effectDefinitions[e.definitionId]?.type !== type));
    }

    return removed;
  }

  /**
   * Remove all effects (cleanse)
   */
  removeAllEffects(targetId = 'player') {
    if (targetId === 'player') {
      const removed = [...this.playerEffects];
      this.playerEffects = [];
      return removed;
    } else {
      const removed = this.enemyEffects.get(targetId) || [];
      this.enemyEffects.delete(targetId);
      return removed;
    }
  }

  // ============================================
  // Effect Query
  // ============================================

  /**
   * Get active effects
   */
  getEffects(targetId = 'player') {
    if (targetId === 'player') {
      return this.playerEffects.filter(e => !e.isExpired());
    } else {
      return (this.enemyEffects.get(targetId) || []).filter(e => !e.isExpired());
    }
  }

  /**
   * Get active buffs
   */
  getBuffs(targetId = 'player') {
    return this.getEffects(targetId).filter(e => 
      this.effectDefinitions[e.definitionId]?.type === 'buff'
    );
  }

  /**
   * Get active debuffs
   */
  getDebuffs(targetId = 'player') {
    return this.getEffects(targetId).filter(e => 
      this.effectDefinitions[e.definitionId]?.type === 'debuff'
    );
  }

  /**
   * Check if has specific effect
   */
  hasEffect(effectId, targetId = 'player') {
    return this.getEffects(targetId).some(e => e.definitionId === effectId);
  }

  /**
   * Get count of specific effect (stacks)
   */
  getEffectCount(effectId, targetId = 'player') {
    return this.getEffects(targetId).filter(e => e.definitionId === effectId).length;
  }

  // ============================================
  // Combat Integration
  // ============================================

  /**
   * Apply effect modifiers to damage
   * @returns {number} Modified damage
   */
  applyDamageModifiers(baseDamage, sourceId = 'player') {
    const effects = this.getEffects(sourceId);
    let finalDamage = baseDamage;

    effects.forEach(effect => {
      const def = this.effectDefinitions[effect.definitionId];
      if (def.effects.damageMultiplier) {
        finalDamage *= def.effects.damageMultiplier;
      }
    });

    return Math.floor(finalDamage);
  }

  /**
   * Apply crit chance modifiers
   * @returns {number} Effective crit chance (0-1)
   */
  applyCritModifiers(baseCritChance, targetId = 'player') {
    const effects = this.getEffects(targetId);
    let finalCritChance = baseCritChance;

    effects.forEach(effect => {
      const def = this.effectDefinitions[effect.definitionId];
      if (def.effects.critChance !== undefined) {
        finalCritChance = def.effects.critChance;
      }
    });

    return finalCritChance;
  }

  /**
   * Apply damage reduction modifiers (on incoming damage)
   * @returns {number} Modified incoming damage
   */
  applyDamageReduction(incomingDamage, targetId = 'player') {
    const effects = this.getEffects(targetId);
    let finalDamage = incomingDamage;

    effects.forEach(effect => {
      const def = this.effectDefinitions[effect.definitionId];
      if (def.effects.damageReduction) {
        finalDamage *= (1 - def.effects.damageReduction);
      }
    });

    return Math.max(1, Math.floor(finalDamage)); // Minimum 1 damage
  }

  /**
   * Check if target is paralyzed/stunned
   */
  isParalyzed(targetId = 'player') {
    const effects = this.getEffects(targetId);
    return effects.some(e => 
      this.effectDefinitions[e.definitionId]?.effects.paralyzed ||
      this.effectDefinitions[e.definitionId]?.effects.stunned
    );
  }

  /**
   * Check if target is confused
   */
  isConfused(targetId = 'player') {
    return this.getEffects(targetId).some(e => 
      this.effectDefinitions[e.definitionId]?.effects.randomAttacks
    );
  }

  /**
   * Calculate passive HP regen from effects
   * @returns {number} Total HP regen per tick
   */
  getHpRegenPerTick(targetId = 'player') {
    const effects = this.getEffects(targetId);
    let totalRegen = 0;

    effects.forEach(effect => {
      const def = this.effectDefinitions[effect.definitionId];
      if (def.effects.hpRegenPerTick) {
        totalRegen += def.effects.hpRegenPerTick;
      }
    });

    return totalRegen;
  }

  /**
   * Calculate passive damage from effects (poison, bleed, etc)
   * @returns {number} Total damage per tick
   */
  getPassiveDamagePerTick(targetId = 'player') {
    const effects = this.getEffects(targetId);
    let totalDamage = 0;

    effects.forEach(effect => {
      const def = this.effectDefinitions[effect.definitionId];
      if (def.effects.damagePerTick) {
        totalDamage += def.effects.damagePerTick;
      }
    });

    return totalDamage;
  }

  /**
   * Apply effect when attacking
   * Used in combat.tick() to apply conditions
   */
  tryApplyEffectOnAttack(attackingEntityId, targetId, effectChances = {}) {
    // Example: { 'stun': 0.15, 'bleed': 0.25 }
    Object.entries(effectChances).forEach(([effectId, chance]) => {
      if (Math.random() < chance) {
        this.applyEffect(effectId, targetId);
      }
    });
  }

  // ============================================
  // Tick System
  // ============================================

  /**
   * Tick all active effects (called once per game tick)
   * Handles:
   * - Expiration
   * - Passive damage/regen
   */
  tick() {
    // Player effects
    this.playerEffects = this.playerEffects.filter(e => !e.isExpired());

    // Enemy effects
    this.enemyEffects.forEach((effects, enemyId) => {
      const activeEffects = effects.filter(e => !e.isExpired());
      if (activeEffects.length > 0) {
        this.enemyEffects.set(enemyId, activeEffects);
      } else {
        this.enemyEffects.delete(enemyId);
      }
    });

    // Emit effects for UI update
    events.emit(EVENTS.UI_NOTIFICATION, {
      type: 'silent',
      playerEffects: this.getEffects('player'),
      effectCount: this.getEffects('player').length
    });
  }

  // ============================================
  // Serialization
  // ============================================

  serialize() {
    const enemyEffectsObj = {};
    this.enemyEffects.forEach((effects, enemyId) => {
      enemyEffectsObj[enemyId] = effects.map(e => e.serialize());
    });

    return {
      playerEffects: this.playerEffects.map(e => e.serialize()),
      enemyEffects: enemyEffectsObj
    };
  }

  deserialize(data) {
    if (!data) return;

    this.playerEffects = (data.playerEffects || [])
      .map(eData => StatusEffect.deserialize(eData, this.effectDefinitions));

    this.enemyEffects = new Map();
    Object.entries(data.enemyEffects || {}).forEach(([enemyId, effects]) => {
      this.enemyEffects.set(enemyId, 
        effects.map(eData => StatusEffect.deserialize(eData, this.effectDefinitions))
      );
    });
  }
}

/**
 * Individual Status Effect Instance
 */
class StatusEffect {
  constructor(definitionId, definition, customDuration = null) {
    this.id = `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.definitionId = definitionId;
    this.name = definition.name;
    this.type = definition.type;
    this.icon = definition.icon;
    this.color = definition.color;
    this.duration = customDuration || definition.duration;
    this.createdAt = Date.now();
    this.effects = definition.effects;
  }

  isExpired() {
    return (Date.now() - this.createdAt) > this.duration;
  }

  getRemainingMs() {
    const elapsed = Date.now() - this.createdAt;
    return Math.max(0, this.duration - elapsed);
  }

  getProgress() {
    const elapsed = Date.now() - this.createdAt;
    return Math.min(100, (elapsed / this.duration) * 100);
  }

  getRemainingFormatted() {
    const ms = this.getRemainingMs();
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  }

  serialize() {
    return {
      id: this.id,
      definitionId: this.definitionId,
      name: this.name,
      type: this.type,
      icon: this.icon,
      color: this.color,
      duration: this.duration,
      createdAt: this.createdAt,
      effects: this.effects
    };
  }

  static deserialize(data, effectDefinitions) {
    const effect = new StatusEffect(data.definitionId, effectDefinitions[data.definitionId] || {});
    Object.assign(effect, data);
    return effect;
  }
}

export { StatusEffectManager, StatusEffect };
