import { ITEMS } from '../data/skillData.js';

export class Equipment {
  constructor() {
    this.slots = {
      weapon: null,
      armor: null,
      cyberware: null,
    };
  }

  equip(itemDef) {
    if (!itemDef) return null;
    let slot = null;
    if (itemDef.type === 'weapon') slot = 'weapon';
    else if (itemDef.type === 'armor') slot = 'armor';
    else if (itemDef.type === 'cyberware') slot = 'cyberware';
    if (!slot) return null;

    const prev = this.slots[slot];
    this.slots[slot] = itemDef;
    return prev;
  }

  unequip(slot) {
    const prev = this.slots[slot];
    this.slots[slot] = null;
    return prev;
  }

  getBonusDamage() {
    let bonus = 0;
    if (this.slots.weapon) bonus += this.slots.weapon.damage || 0;
    if (this.slots.cyberware) bonus += this.slots.cyberware.damage || 0;
    return bonus;
  }

   getBonusDefense() {
     let bonus = 0;
     if (this.slots.armor) bonus += this.slots.armor.defense || 0;
     if (this.slots.cyberware) bonus += this.slots.cyberware.defense || 0;
     return bonus;
   }

   // Get special effects from equipment (Tier 4b)
   getSpecialEffects() {
     const effects = {
       xpBoost: 0,
       speedBoost: 0,
       lifeSteal: 0,
       lootBoost: 0,
       currencyBoost: 0,
     };
     
     // Weapon effects
     if (this.slots.weapon) {
       if (this.slots.weapon.lifeSteal) effects.lifeSteal += this.slots.weapon.lifeSteal;
     }
     
     // Armor effects
     if (this.slots.armor) {
       if (this.slots.armor.speedBoost) effects.speedBoost += this.slots.armor.speedBoost;
     }
     
     // Cyberware effects (most powerful)
     if (this.slots.cyberware) {
       if (this.slots.cyberware.xpBoost) effects.xpBoost += this.slots.cyberware.xpBoost;
       if (this.slots.cyberware.speedBoost) effects.speedBoost += this.slots.cyberware.speedBoost;
       if (this.slots.cyberware.lootBoost) effects.lootBoost += this.slots.cyberware.lootBoost;
       if (this.slots.cyberware.currencyBoost) effects.currencyBoost += this.slots.cyberware.currencyBoost;
     }
     
     return effects;
   }

  // Check if equipped cyberware enables parallel hacking
  hasParallelHacking() {
    return !!(this.slots.cyberware && this.slots.cyberware.parallelHacking);
  }

  getEquipped() {
    return { ...this.slots };
  }

  serialize() {
    const data = {};
    Object.entries(this.slots).forEach(([slot, item]) => {
      data[slot] = item ? item.id : null;
    });
    return data;
  }

  deserialize(data) {
    if (!data) return;
    Object.entries(data).forEach(([slot, itemId]) => {
      if (itemId) {
        const key = Object.keys(ITEMS).find(k => ITEMS[k].id === itemId);
        this.slots[slot] = key ? ITEMS[key] : null;
      }
    });
  }
}
