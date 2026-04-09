// Event bus for decoupled communication between game systems and UI
export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    for (const cb of this.listeners[event]) {
      try { cb(data); } catch (e) { console.error(`Event error [${event}]:`, e); }
    }
  }
}

export const events = new EventBus();

export const EVENTS = {
  GAME_LOADED: 'game:loaded',
  GAME_SAVED: 'game:saved',
  GAME_TICK: 'game:tick',
  GAME_RESET: 'game:reset',
  SKILL_XP_GAINED: 'skill:xpGained',
  SKILL_LEVEL_UP: 'skill:levelUp',
  SKILL_STARTED: 'skill:started',
  SKILL_STOPPED: 'skill:stopped',
  SKILL_ACTION_COMPLETE: 'skill:actionComplete',
  MASTERY_XP_GAINED: 'mastery:xpGained',
  MASTERY_LEVEL_UP: 'mastery:levelUp',
  COMBAT_STARTED: 'combat:started',
  COMBAT_HIT: 'combat:hit',
  COMBAT_ENEMY_DEFEATED: 'combat:enemyDefeated',
  COMBAT_PLAYER_DIED: 'combat:playerDied',
  COMBAT_ENDED: 'combat:ended',
  CURRENCY_CHANGED: 'economy:currencyChanged',
  ITEM_GAINED: 'economy:itemGained',
  ITEM_REMOVED: 'economy:itemRemoved',
  INVENTORY_CHANGED: 'inventory:changed',
  INVENTORY_FULL: 'inventory:full',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  UI_NAVIGATE: 'ui:navigate',
  UI_NOTIFICATION: 'ui:notification',
  UI_UPDATE: 'ui:update',
  ABILITY_ACTIVATED: 'ability:activated',
};
