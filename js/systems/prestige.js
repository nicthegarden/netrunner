import { events, EVENTS } from '../engine/events.js';

// Prestige system: Reset skills for permanent bonuses
export const PRESTIGE_UPGRADES = {
   xp_boost_1: {
     id: 'xp_boost_1',
     name: 'XP Amplifier I',
     description: '+5% XP gain from all skills',
     cost: 10,
     effect: { xpMultiplier: 1.05 },
   },
   xp_boost_2: {
     id: 'xp_boost_2',
     name: 'XP Amplifier II',
     description: '+10% XP gain from all skills',
     cost: 25,
     effect: { xpMultiplier: 1.10 },
   },
   xp_boost_3: {
     id: 'xp_boost_3',
     name: 'XP Amplifier III',
     description: '+15% XP gain from all skills',
     cost: 50,
     effect: { xpMultiplier: 1.15 },
   },
   currency_boost_1: {
     id: 'currency_boost_1',
     name: 'Profit Maximizer I',
     description: '+8% Eurodollars gained',
     cost: 15,
     effect: { currencyMultiplier: 1.08 },
   },
   currency_boost_2: {
     id: 'currency_boost_2',
     name: 'Profit Maximizer II',
     description: '+12% Eurodollars gained',
     cost: 35,
     effect: { currencyMultiplier: 1.12 },
   },
   drop_boost_1: {
     id: 'drop_boost_1',
     name: 'Loot Multiplier I',
     description: '+3% material drop rate',
     cost: 12,
     effect: { materialDropBonus: 3 },
   },
   drop_boost_2: {
     id: 'drop_boost_2',
     name: 'Loot Multiplier II',
     description: '+5% material drop rate',
     cost: 30,
     effect: { materialDropBonus: 5 },
   },
   mastery_boost_1: {
     id: 'mastery_boost_1',
     name: 'Mastery Accelerator I',
     description: '+2% mastery XP gain',
     cost: 20,
     effect: { masteryXpBonus: 2 },
   },
   mastery_boost_2: {
     id: 'mastery_boost_2',
     name: 'Mastery Accelerator II',
     description: '+5% mastery XP gain',
     cost: 40,
     effect: { masteryXpBonus: 5 },
   },
   combat_boost_1: {
     id: 'combat_boost_1',
     name: 'Combat Protocol I',
     description: '+10% combat damage',
     cost: 20,
     effect: { combatDamageBonus: 10 },
   },
   combat_boost_2: {
     id: 'combat_boost_2',
     name: 'Combat Protocol II',
     description: '+20% combat damage',
     cost: 45,
     effect: { combatDamageBonus: 20 },
   },
   offline_boost_1: {
     id: 'offline_boost_1',
     name: 'Idle Optimizer',
     description: '+25% offline progress efficiency',
     cost: 30,
     effect: { offlineBonus: 25 },
   },
};

export class Prestige {
   constructor() {
     this.level = 0;
     this.totalResets = 0;
     this.points = 0; // Earned per prestige level
     this.purchasedUpgrades = {}; // { upgradeId: true }
    this.bonuses = {
        xpMultiplier: 1.0, // 1% per prestige level
        currencyMultiplier: 1.0,
        materialDropBonus: 0, // % increase
        masteryXpBonus: 0,
        combatDamageBonus: 0, // % increase to combat damage
        offlineBonus: 0, // % increase to offline progress
      };
   }

  // Calculate prestige level based on total skill XP
  calculatePrestigeLevel(skillManager) {
    const totalXP = Object.values(skillManager.skills)
      .reduce((sum, skill) => sum + skill.xp, 0);
    // Each prestige requires 500k total XP more than the previous
    return Math.floor(Math.sqrt(totalXP / 500000));
  }

  // Prestige: reset all skills, earn points, gain permanent bonuses
  prestige(skillManager, achievements) {
    const newLevel = this.calculatePrestigeLevel(skillManager);
    if (newLevel <= this.level) {
      events.emit(EVENTS.UI_NOTIFICATION, {
        message: 'Not enough XP to prestige yet',
        type: 'error',
      });
      return false;
    }

    const levelGain = newLevel - this.level;
    this.level = newLevel;
    this.totalResets++;
    this.points += levelGain * 10; // 10 points per prestige level

    // Increase bonuses
    this.bonuses.xpMultiplier = 1.0 + (this.level * 0.01);
    this.bonuses.currencyMultiplier = 1.0 + (this.level * 0.01);
    this.bonuses.materialDropBonus = this.level * 2; // +2% per level
    this.bonuses.masteryXpBonus = this.level * 1; // +1% per level

    // Reset all skills to level 1
    Object.values(skillManager.skills).forEach(skill => {
      skill.level = 1;
      skill.xp = 0;
      skill.masteryData = {};
      skill.isActive = false;
      skill.activeAction = null;
    });

    achievements.unlock('prestige_master');
    if (this.level >= 5) achievements.unlock('prestige_legend');

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `Prestige Level ${this.level}! +${levelGain * 10} Prestige Points`,
      type: 'victory',
    });

    events.emit(EVENTS.GAME_TICK, { prestigeReset: true });

    return true;
  }

  getXPMultiplier() {
    return this.bonuses.xpMultiplier;
  }

   getCurrencyMultiplier() {
     return this.bonuses.currencyMultiplier;
   }

   // Buy a prestige upgrade (Tier 3b)
   buyUpgrade(upgradeId) {
     const upgrade = PRESTIGE_UPGRADES[upgradeId];
     if (!upgrade) return false;
     if (this.points < upgrade.cost) {
       events.emit(EVENTS.UI_NOTIFICATION, {
         message: `Need ${upgrade.cost - this.points} more prestige points`,
         type: 'error',
       });
       return false;
     }
     if (this.purchasedUpgrades[upgradeId]) {
       events.emit(EVENTS.UI_NOTIFICATION, {
         message: 'Already purchased this upgrade',
         type: 'error',
       });
       return false;
     }

     this.points -= upgrade.cost;
     this.purchasedUpgrades[upgradeId] = true;
     this.recalculateBonuses();

     events.emit(EVENTS.UI_NOTIFICATION, {
       message: `Purchased: ${upgrade.name}`,
       type: 'victory',
     });

     return true;
   }

   // Recalculate total bonuses from level + purchased upgrades (Tier 3b)
   recalculateBonuses() {
      // Base bonuses from prestige level
      this.bonuses.xpMultiplier = 1.0 + (this.level * 0.01);
      this.bonuses.currencyMultiplier = 1.0 + (this.level * 0.01);
      this.bonuses.materialDropBonus = this.level * 2;
      this.bonuses.masteryXpBonus = this.level * 1;
      this.bonuses.combatDamageBonus = 0;
      this.bonuses.offlineBonus = 0;

      // Add purchased upgrades
      Object.keys(this.purchasedUpgrades).forEach(upgradeId => {
        const upgrade = PRESTIGE_UPGRADES[upgradeId];
        if (upgrade && upgrade.effect) {
          if (upgrade.effect.xpMultiplier) {
            this.bonuses.xpMultiplier *= upgrade.effect.xpMultiplier;
          }
          if (upgrade.effect.currencyMultiplier) {
            this.bonuses.currencyMultiplier *= upgrade.effect.currencyMultiplier;
          }
          if (upgrade.effect.materialDropBonus) {
            this.bonuses.materialDropBonus += upgrade.effect.materialDropBonus;
          }
          if (upgrade.effect.masteryXpBonus) {
            this.bonuses.masteryXpBonus += upgrade.effect.masteryXpBonus;
          }
          if (upgrade.effect.combatDamageBonus) {
            this.bonuses.combatDamageBonus += upgrade.effect.combatDamageBonus;
          }
          if (upgrade.effect.offlineBonus) {
            this.bonuses.offlineBonus += upgrade.effect.offlineBonus;
          }
        }
      });
   }

   serialize() {
     return {
       level: this.level,
       totalResets: this.totalResets,
       points: this.points,
       purchasedUpgrades: { ...this.purchasedUpgrades },
       bonuses: { ...this.bonuses },
     };
   }

   deserialize(data) {
     if (!data) return;
     this.level = data.level || 0;
     this.totalResets = data.totalResets || 0;
     this.points = data.points || 0;
     this.purchasedUpgrades = data.purchasedUpgrades || {};
     this.bonuses = data.bonuses || this.bonuses;
     this.recalculateBonuses();
   }
}
