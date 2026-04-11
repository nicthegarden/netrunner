import { events, EVENTS } from '../engine/events.js';
import { ITEMS, getItemPerkLines, getItemTooltip } from '../data/skillData.js';

export class Inventory {
  constructor(slots = 100) {
    this.items = {}; // { itemId: { item, quantity } }
    this.maxSlots = slots;
    this.usedSlots = 0;
  }

  _findItemDef(itemId) {
    if (ITEMS[itemId.toUpperCase()]) return ITEMS[itemId.toUpperCase()];
    const key = Object.keys(ITEMS).find(k => ITEMS[k].id === itemId);
    return key ? ITEMS[key] : null;
  }

  addItem(itemId, quantity = 1) {
    const itemDef = this._findItemDef(itemId);
    if (!itemDef) return false;

    if (!this.items[itemId]) {
      if (!itemDef.stackable && this.usedSlots >= this.maxSlots) {
        events.emit(EVENTS.INVENTORY_FULL, { item: itemId });
        return false;
      }
      this.items[itemId] = { item: itemDef, quantity: 0 };
      this.usedSlots++;
    }

    this.items[itemId].quantity += quantity;
    events.emit(EVENTS.ITEM_GAINED, { item: itemDef.name, quantity, icon: itemDef.icon });
    events.emit(EVENTS.INVENTORY_CHANGED, this.getSummary());
    return true;
  }

  removeItem(itemId, quantity = 1) {
    if (!this.items[itemId]) return false;
    if (this.items[itemId].quantity < quantity) return false;
    this.items[itemId].quantity -= quantity;
    if (this.items[itemId].quantity <= 0) {
      delete this.items[itemId];
      this.usedSlots--;
    }
    events.emit(EVENTS.ITEM_REMOVED, { item: itemId, quantity });
    events.emit(EVENTS.INVENTORY_CHANGED, this.getSummary());
    return true;
  }

  getQuantity(itemId) {
    return this.items[itemId]?.quantity || 0;
  }

  hasItem(itemId, quantity = 1) {
    return this.getQuantity(itemId) >= quantity;
  }

  getSummary() {
    return Object.entries(this.items).map(([id, data]) => ({
      id,
      name: data.item.name,
      quantity: data.quantity,
      icon: data.item.icon,
      type: data.item.type,
      value: data.item.value || 0,
      rarity: data.item.rarity || 'common',
      description: data.item.description || '',
      linkedSkill: data.item.linkedSkill || null,
      perks: getItemPerkLines(data.item),
      tooltip: getItemTooltip(data.item),
    }));
  }

  getTotalValue() {
    return Object.entries(this.items).reduce((sum, [, data]) => {
      return sum + (data.item.value || 0) * data.quantity;
    }, 0);
  }

  sellItem(itemId, quantity, economy) {
    const itemDef = this._findItemDef(itemId);
    if (!itemDef) return false;
    if (!this.hasItem(itemId, quantity)) return false;

    const totalValue = (itemDef.value || 0) * quantity;
    if (totalValue <= 0) return false;

    this.removeItem(itemId, quantity);
    economy.addCurrency(totalValue);

    return true;
  }

  serialize() {
    const data = {};
    Object.entries(this.items).forEach(([id, itemData]) => {
      data[id] = itemData.quantity;
    });
    return data;
  }

  deserialize(data) {
    if (!data) return;
    this.items = {};
    this.usedSlots = 0;
    Object.entries(data).forEach(([id, quantity]) => {
      const itemDef = this._findItemDef(id);
      if (itemDef) {
        this.items[id] = { item: itemDef, quantity };
        this.usedSlots++;
      }
    });
  }
}
