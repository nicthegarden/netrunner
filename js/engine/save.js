import { events, EVENTS } from './events.js';

const SAVE_KEY = 'netrunner_save';
const AUTO_SAVE_INTERVAL = 30000;
const CURRENT_SAVE_VERSION = 2;

// Migration functions: each upgrades from version N to N+1
const MIGRATIONS = {
  // v1 -> v2: add totalSpent to economy, add prestige data
  1: (data) => {
    if (data.economy && data.economy.totalSpent === undefined) {
      data.economy.totalSpent = 0;
    }
    if (!data.prestige) {
      data.prestige = { level: 0, totalResets: 0, points: 0, bonuses: {} };
    }
    if (!data.stats) {
      data.stats = {};
    }
    // Add equipment slot (new save format)
    if (!data.equipment) {
      data.equipment = { weapon: null, armor: null, cyberware: null };
    }
    data.version = 2;
    return data;
  },
};

function migrateSave(data) {
  if (!data || !data.version) return data;
  let current = data.version;
  while (current < CURRENT_SAVE_VERSION) {
    const migrator = MIGRATIONS[current];
    if (!migrator) {
      console.warn(`No migration from v${current} to v${current + 1}`);
      break;
    }
    console.log(`Migrating save from v${current} to v${current + 1}`);
    data = migrator(data);
    current = data.version;
  }
  return data;
}

function validateSave(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.version || typeof data.version !== 'number') return false;
  if (!data.timestamp || typeof data.timestamp !== 'number') return false;
  // Must have at least some expected keys
  const requiredKeys = ['player', 'skills', 'inventory', 'economy'];
  return requiredKeys.every(k => data[k] !== undefined);
}

export class SaveManager {
  constructor(game) {
    this.game = game;
    this.autoSaveTimer = null;
  }

  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => this.save(), AUTO_SAVE_INTERVAL);
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  save() {
    try {
      const saveData = {
        version: CURRENT_SAVE_VERSION,
        timestamp: Date.now(),
        player: this.game.player.serialize(),
        skills: this.game.skillManager.serialize(),
        inventory: this.game.inventory.serialize(),
        economy: this.game.economy.serialize(),
        equipment: this.game.equipment.serialize(),
        combat: this.game.combat.serialize(),
        achievements: this.game.achievements.serialize(),
        prestige: this.game.prestige ? this.game.prestige.serialize() : { level: 0, totalResets: 0, points: 0, bonuses: {} },
        abilities: this.game.abilityManager ? this.game.abilityManager.serialize() : { selections: {} },
        livingWorld: this.game.livingWorld ? this.game.livingWorld.serialize() : { worldState: {}, leaderboards: {} },
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      events.emit(EVENTS.GAME_SAVED, { timestamp: saveData.timestamp });
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  load() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;
      let data = JSON.parse(json);
      if (!validateSave(data)) {
        console.warn('Invalid save data, ignoring');
        return null;
      }
      // Run migrations if needed
      if (data.version < CURRENT_SAVE_VERSION) {
        data = migrateSave(data);
        // Re-save migrated data
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      }
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  hasSave() { return localStorage.getItem(SAVE_KEY) !== null; }
  deleteSave() { localStorage.removeItem(SAVE_KEY); }

  exportSave() {
    const json = localStorage.getItem(SAVE_KEY);
    return json ? btoa(json) : null;
  }

  importSave(b64) {
    try {
      const json = atob(b64);
      let data = JSON.parse(json);
      if (!validateSave(data)) throw new Error('Invalid save structure');
      // Migrate if needed
      if (data.version < CURRENT_SAVE_VERSION) {
        data = migrateSave(data);
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
}
