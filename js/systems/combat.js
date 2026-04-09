import { events, EVENTS } from '../engine/events.js';
import { ENEMIES } from '../data/skillData.js';
import { Equipment } from './equipment.js';

export class CombatEnemy {
  constructor(enemyDef, scaleFactor = 1) {
    this.def = enemyDef;
    this.id = enemyDef.id;
    this.name = enemyDef.name;
    this.maxHp = Math.floor(enemyDef.hp * scaleFactor);
    this.hp = this.maxHp;
    this.baseDamage = Math.floor(enemyDef.damage * scaleFactor);
    this.damage = this.baseDamage;
    this.isBoss = enemyDef.isBoss || false;
    this.evasion = enemyDef.evasion || 0;
    this.lifeSteal = enemyDef.lifeSteal || 0;
    this.phase2Trigger = enemyDef.phase2_trigger || 0;
    this.isEnraged = false;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    // Boss enrage: at phase2 trigger HP%, increase damage by 50%
    if (this.isBoss && this.phase2Trigger > 0 && !this.isEnraged) {
      if (this.hp <= this.maxHp * this.phase2Trigger) {
        this.isEnraged = true;
        this.damage = Math.floor(this.baseDamage * 1.5);
      }
    }
    return this.hp <= 0;
  }

  getStatus() {
    return {
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      damage: this.damage,
      hpPercent: (this.hp / this.maxHp) * 100,
      isBoss: this.isBoss,
      isEnraged: this.isEnraged,
    };
  }
}

export class Combat {
   constructor(inventory, economy, equipment = null) {
     this.inventory = inventory;
     this.economy = economy;
     this.equipment = equipment || new Equipment();
     this.isActive = false;
     this.playerHp = 100;
     this.maxPlayerHp = 100;
     this.currentEnemy = null;
     this.currentEnemyId = null;
     this.skillLevel = 1;
     this.ticksUntilNextAttack = 0;
     this.ticksUntilEnemyAttack = 0;
     this.playerAttackSpeed = 2;
     this.enemyAttackSpeed = 3;
     this.autoFight = true;
     // Consumable effect tracking
     this.activeBuffs = {}; // { 'combat_stim': { remainingTicks: 30, damageBonus: 0.5 } }
     // New references (wired from main.js)
     this.passiveStats = null;
     this.abilityManager = null;
   }

  startCombat(enemyId, skillLevel = 1) {
    const enemyDef = ENEMIES[Object.keys(ENEMIES).find(k => ENEMIES[k].id === enemyId)];
    if (!enemyDef) return false;

    const scaleFactor = 1 + (skillLevel - 1) * 0.02;

    this.isActive = true;
    this.currentEnemyId = enemyId;
    this.skillLevel = skillLevel;
    this.currentEnemy = new CombatEnemy(enemyDef, scaleFactor);
    // Apply passive stats for maxHP
    if (this.passiveStats) {
      this.maxPlayerHp = this.passiveStats.getStat('maxHP');
    }
    this.playerHp = this.maxPlayerHp;
    this.ticksUntilNextAttack = 0;
    this.ticksUntilEnemyAttack = 1;
    // Reset ability cooldowns for new fight
    if (this.abilityManager) {
      this.abilityManager.resetCooldowns();
    }

    events.emit(EVENTS.COMBAT_STARTED, {
      enemy: this.currentEnemy.getStatus(),
      playerHp: this.playerHp,
      isBoss: this.currentEnemy.isBoss,
    });

    return true;
  }

  stopCombat() {
    this.isActive = false;
    this.currentEnemy = null;
    this.currentEnemyId = null;
    if (this.abilityManager) {
      this.abilityManager.resetCooldowns();
    }
    events.emit(EVENTS.COMBAT_ENDED, { reason: 'stopped' });
  }

  endCombat(victory = false) {
    if (victory) {
      this.processVictory();
    } else {
      if (this.passiveStats) {
        this.maxPlayerHp = this.passiveStats.getStat('maxHP');
      }
      this.playerHp = this.maxPlayerHp;
      if (this.abilityManager) {
        this.abilityManager.resetCooldowns();
      }
      events.emit(EVENTS.COMBAT_PLAYER_DIED, {
        enemy: this.currentEnemy?.name || 'Unknown',
      });
    }

    if (victory && this.autoFight && this.currentEnemyId) {
      const enemyId = this.currentEnemyId;
      const level = this.skillLevel;
      this.currentEnemy = null;
      this.isActive = false;
      setTimeout(() => {
        this.startCombat(enemyId, level);
      }, 500);
    } else if (!victory) {
      this.isActive = false;
      this.currentEnemy = null;
      events.emit(EVENTS.COMBAT_ENDED, { reason: 'death' });
    }
  }

  processVictory() {
    if (!this.currentEnemy) return null;

    const xpReward = this.currentEnemy.def.xpReward;
    const loot = this.generateLoot();

    Object.entries(loot.items).forEach(([itemId, quantity]) => {
      this.inventory.addItem(itemId, quantity);
    });
    if (loot.currency > 0) {
      this.economy.addCurrency(loot.currency);
    }

    events.emit(EVENTS.COMBAT_ENEMY_DEFEATED, {
      enemy: this.currentEnemy.name,
      xp: xpReward,
      loot,
    });

    return { xp: xpReward, loot };
  }

  generateLoot() {
    const loot = { currency: 0, items: {} };
    if (!this.currentEnemy || !this.currentEnemy.def.loot) return loot;

    Object.entries(this.currentEnemy.def.loot).forEach(([itemId, range]) => {
      const quantity = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      if (quantity > 0) {
        if (itemId === 'eurodollar') {
          loot.currency += quantity;
        } else {
          loot.items[itemId] = quantity;
        }
      }
    });

    return loot;
  }

   getPlayerDamage() {
      const baseDamage = 3 + Math.floor(this.skillLevel * 0.5);
      
      // PassiveStats is the single source of truth for all attack bonuses
      // (includes equipment damage, prestige combat bonus, and skill-derived attack power)
      const passiveAttack = this.passiveStats ? this.passiveStats.getStat('attackPower') : 0;
      let total = baseDamage + passiveAttack;
      
      // Apply combat stim buff if active (Tier 2c)
      if (this.activeBuffs.combat_stim && this.activeBuffs.combat_stim.remainingTicks > 0) {
        total = Math.floor(total * (1 + this.activeBuffs.combat_stim.damageBonus));
      }

      // Apply ability damage multiplier
      const abilityBuffs = this.abilityManager ? this.abilityManager.getActiveBuffs() : null;
      if (abilityBuffs) {
        total = Math.floor(total * abilityBuffs.damageMultiplier);
        // Apply enemy vulnerability (enemy takes more damage)
        if (abilityBuffs.enemyVulnerability > 0) {
          total = Math.floor(total * (1 + abilityBuffs.enemyVulnerability));
        }
      }

      // Crit check
      const passiveCrit = this.passiveStats ? this.passiveStats.getStat('critChance') : 5;
      const passiveCritDmg = this.passiveStats ? this.passiveStats.getStat('critDamage') : 150;
      let critChance = passiveCrit + (abilityBuffs ? abilityBuffs.critChanceBonus : 0);
      let critDmgMult = (passiveCritDmg + (abilityBuffs ? abilityBuffs.critDamageBonus : 0)) / 100;
      let isCrit = false;
      if (Math.random() * 100 < critChance) {
        total = Math.floor(total * critDmgMult);
        isCrit = true;
      }
     
     const min = Math.max(1, Math.floor(total * 0.75));
     const max = Math.floor(total * 1.25);
     const finalDmg = Math.floor(Math.random() * (max - min + 1)) + min;
     return { damage: finalDmg, isCrit };
   }

   // Use a consumable in combat (Tier 2c)
   useConsumable(itemId) {
     if (!this.inventory.hasItem(itemId, 1)) return false;
     
     if (itemId === 'healing_nanobots') {
       // Restore 30 HP (capped at max)
       const healed = Math.min(30, this.maxPlayerHp - this.playerHp);
       this.playerHp += healed;
       this.inventory.removeItem(itemId, 1);
       return true;
     } else if (itemId === 'combat_stim') {
       // +50% damage for 30 ticks (30 seconds)
       this.activeBuffs.combat_stim = { remainingTicks: 30, damageBonus: 0.50 };
       this.inventory.removeItem(itemId, 1);
       return true;
     }
     
     return false;
   }

  getEnemyDamage() {
    if (!this.currentEnemy) return 0;
    let baseDamage = this.currentEnemy.damage;

    // Apply ability enemy damage reduction debuff
    const abilityBuffs = this.abilityManager ? this.abilityManager.getActiveBuffs() : null;
    if (abilityBuffs && abilityBuffs.enemyDamageReduction > 0) {
      baseDamage = Math.floor(baseDamage * (1 - abilityBuffs.enemyDamageReduction));
    }

    // Use passive defense (includes equipment + skill bonuses)
    const defense = this.passiveStats ? this.passiveStats.getStat('defense') : this.equipment.getBonusDefense();
    // Apply ability defense multiplier
    let effectiveDefense = defense;
    if (abilityBuffs && abilityBuffs.defenseMultiplier > 1) {
      effectiveDefense = Math.floor(effectiveDefense * abilityBuffs.defenseMultiplier);
    }

    const reduced = Math.max(1, baseDamage - Math.floor(effectiveDefense * 0.5));
    let dmg = Math.floor(Math.random() * reduced) + 1;

    // Check ability shield — absorb damage
    if (abilityBuffs && abilityBuffs.shieldHP > 0) {
      const absorbed = Math.min(dmg, abilityBuffs.shieldHP);
      dmg -= absorbed;
      // Reduce shield in active effects
      if (this.abilityManager) {
        for (const eff of this.abilityManager.activeEffects) {
          if (eff.buffType === 'shield' && eff.value > 0) {
            const take = Math.min(absorbed, eff.value);
            eff.value -= take;
            break;
          }
        }
      }
      dmg = Math.max(0, dmg);
    }

    return dmg;
  }

   tick() {
     if (!this.isActive || !this.currentEnemy) return;

     // Decrement buff timers (Tier 2c)
     Object.entries(this.activeBuffs).forEach(([buffId, buff]) => {
       buff.remainingTicks--;
       if (buff.remainingTicks <= 0) {
         delete this.activeBuffs[buffId];
       }
     });

     // Tick ability manager (decrements cooldowns, auto-casts)
     let abilityEffects = [];
     if (this.abilityManager) {
       abilityEffects = this.abilityManager.tick(this.isActive);
     }

     // Process ability effects (direct damage, heals)
     for (const effect of abilityEffects) {
       if (effect.type === 'damage' && effect.damage > 0) {
         let abilityDmg = effect.damage;
         // Execute bonus: +50% if enemy below threshold
         if (effect.executeThreshold && this.currentEnemy.hp / this.currentEnemy.maxHp <= effect.executeThreshold) {
           abilityDmg = Math.floor(abilityDmg * (effect.executeBonusMult || 1.5));
         }
         const killed = this.currentEnemy.takeDamage(abilityDmg);
         events.emit(EVENTS.ABILITY_ACTIVATED, {
           abilityName: effect.abilityName,
           icon: effect.icon,
           type: 'damage',
           value: abilityDmg,
         });
         if (killed) {
           this.endCombat(true);
           return;
         }
       }
       if (effect.type === 'heal' && effect.healing > 0) {
         this.playerHp = Math.min(this.maxPlayerHp, this.playerHp + effect.healing);
         events.emit(EVENTS.ABILITY_ACTIVATED, {
           abilityName: effect.abilityName,
           icon: effect.icon,
           type: 'heal',
           value: effect.healing,
         });
       }
       if (effect.type === 'buff' || effect.type === 'debuff') {
         events.emit(EVENTS.ABILITY_ACTIVATED, {
           abilityName: effect.abilityName,
           icon: effect.icon,
           type: effect.type,
           value: effect.power,
         });
       }
     }

     // Get ability buffs for this tick
     const abilityBuffs = this.abilityManager ? this.abilityManager.getActiveBuffs() : null;

     // Check if enemy is stunned (skip enemy attack)
     const enemyStunned = abilityBuffs && abilityBuffs.enemyStunRemaining > 0;

     this.ticksUntilNextAttack--;
     this.ticksUntilEnemyAttack--;

      if (this.ticksUntilNextAttack <= 0) {
        // Boss evasion check: boss may dodge player attacks
        if (this.currentEnemy.evasion > 0 && Math.random() < this.currentEnemy.evasion) {
          events.emit(EVENTS.COMBAT_HIT, {
            attacker: 'player',
            damage: 0,
            dodged: true,
            enemyHp: this.currentEnemy.hp,
            enemyMaxHp: this.currentEnemy.maxHp,
            playerHp: this.playerHp,
            maxPlayerHp: this.maxPlayerHp,
            isBoss: this.currentEnemy.isBoss,
          });
          this.ticksUntilNextAttack = this.playerAttackSpeed;
        } else {
          const result = this.getPlayerDamage();
          const damage = result.damage;
          const killed = this.currentEnemy.takeDamage(damage);

          // Apply life steal effect if equipped
          const effects = this.equipment.getSpecialEffects();
          if (effects.lifeSteal > 0) {
            const healed = Math.ceil(damage * effects.lifeSteal);
            this.playerHp = Math.min(this.maxPlayerHp, this.playerHp + healed);
          }

          events.emit(EVENTS.COMBAT_HIT, {
            attacker: 'player',
            damage,
            isCrit: result.isCrit,
            enemyHp: this.currentEnemy.hp,
            enemyMaxHp: this.currentEnemy.maxHp,
            playerHp: this.playerHp,
            maxPlayerHp: this.maxPlayerHp,
            isBoss: this.currentEnemy.isBoss,
            isEnraged: this.currentEnemy.isEnraged,
          });

          this.ticksUntilNextAttack = this.playerAttackSpeed;

          if (killed) {
            this.endCombat(true);
            return;
          }
        }
      }

     if (this.ticksUntilEnemyAttack <= 0) {
       // Skip enemy attack if stunned or player is invulnerable
       if (enemyStunned || (abilityBuffs && abilityBuffs.invulnerable)) {
         this.ticksUntilEnemyAttack = this.enemyAttackSpeed;
       } else {
         // Player evasion check from passive stats
         const playerEvasion = this.passiveStats ? this.passiveStats.getStat('evasion') : 0;
         const totalEvasion = playerEvasion + (abilityBuffs ? abilityBuffs.evasionBonus : 0);
         if (totalEvasion > 0 && Math.random() * 100 < totalEvasion) {
           // Player dodged
           events.emit(EVENTS.COMBAT_HIT, {
             attacker: 'enemy',
             damage: 0,
             dodged: true,
             playerHp: this.playerHp,
             maxPlayerHp: this.maxPlayerHp,
             enemyHp: this.currentEnemy.hp,
             enemyMaxHp: this.currentEnemy.maxHp,
             isBoss: this.currentEnemy.isBoss,
             isEnraged: this.currentEnemy.isEnraged,
           });
           this.ticksUntilEnemyAttack = this.enemyAttackSpeed;
         } else {
           const damage = this.getEnemyDamage();
           this.playerHp -= damage;

           // Boss life steal: boss heals from damage dealt
           if (this.currentEnemy.lifeSteal > 0) {
             const healed = Math.ceil(damage * this.currentEnemy.lifeSteal);
             this.currentEnemy.hp = Math.min(this.currentEnemy.maxHp, this.currentEnemy.hp + healed);
           }

           events.emit(EVENTS.COMBAT_HIT, {
             attacker: 'enemy',
             damage,
             playerHp: this.playerHp,
             maxPlayerHp: this.maxPlayerHp,
             enemyHp: this.currentEnemy.hp,
             enemyMaxHp: this.currentEnemy.maxHp,
             isBoss: this.currentEnemy.isBoss,
             isEnraged: this.currentEnemy.isEnraged,
           });

           this.ticksUntilEnemyAttack = this.enemyAttackSpeed;

           if (this.playerHp <= 0) {
             this.playerHp = 0;
             this.endCombat(false);
           }
         }
       }
     }
   }

   serialize() {
     return {
       isActive: this.isActive,
       playerHp: this.playerHp,
       currentEnemyId: this.currentEnemyId,
       skillLevel: this.skillLevel,
       currentEnemy: this.currentEnemy ? { id: this.currentEnemy.id, hp: this.currentEnemy.hp } : null,
       equipment: this.equipment.serialize(),
       activeBuffs: this.activeBuffs,
     };
   }

   deserialize(data) {
     if (!data) return;
     this.skillLevel = data.skillLevel || 1;
     this.activeBuffs = data.activeBuffs || {};
     if (this.equipment && data.equipment) {
       this.equipment.deserialize(data.equipment);
     }
     if (data.isActive && data.currentEnemyId) {
       this.startCombat(data.currentEnemyId, data.skillLevel || 1);
       if (data.playerHp != null) this.playerHp = data.playerHp;
       if (data.currentEnemy && this.currentEnemy) {
         this.currentEnemy.hp = data.currentEnemy.hp;
       }
     } else {
       this.playerHp = data.playerHp || this.maxPlayerHp;
     }
   }
}
