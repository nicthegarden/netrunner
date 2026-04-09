import { events, EVENTS } from '../engine/events.js';

export class Economy {
  constructor(prestige = null, equipment = null) {
    this.currency = 0;
    this.totalEarned = 0;
    this.totalSpent = 0;
    this.prestige = prestige;
    this.equipment = equipment;
    this.passiveStats = null; // Wired from main.js for skill-derived bonuses
  }

  addCurrency(amount) {
    if (amount <= 0) return;
    
    // Apply prestige multiplier
    let multiplier = 1.0;
    if (this.prestige) {
      multiplier = this.prestige.getCurrencyMultiplier();
    }
    
    // Apply equipment currency boost (Tier 4b)
    if (this.equipment) {
      const effects = this.equipment.getSpecialEffects();
      if (effects.currencyBoost > 0) {
        multiplier += effects.currencyBoost;
      }
    }

    // Apply skill-derived currency bonus (e.g., Data Mining, Street Cred, Trading, Fencing)
    if (this.passiveStats) {
      const skillCurrencyBonus = this.passiveStats.getSkillBonus('currencyBonus');
      if (skillCurrencyBonus > 0) {
        multiplier += (skillCurrencyBonus / 100); // convert from % to decimal
      }
    }
    
    const finalAmount = Math.floor(amount * multiplier);
    this.currency += finalAmount;
    this.totalEarned += finalAmount;
    events.emit(EVENTS.CURRENCY_CHANGED, { currency: this.currency, totalEarned: this.totalEarned, totalSpent: this.totalSpent });
  }

  removeCurrency(amount) {
    if (this.currency < amount) return false;
    this.currency -= amount;
    this.totalSpent += amount;
    events.emit(EVENTS.CURRENCY_CHANGED, { currency: this.currency, totalEarned: this.totalEarned, totalSpent: this.totalSpent });
    return true;
  }

  getCurrency() {
    return this.currency;
  }

  serialize() {
    return { currency: this.currency, totalEarned: this.totalEarned, totalSpent: this.totalSpent };
  }

  deserialize(data) {
    if (!data) return;
    this.currency = data.currency || 0;
    this.totalEarned = data.totalEarned || this.currency;
    this.totalSpent = data.totalSpent || 0;
  }
}
