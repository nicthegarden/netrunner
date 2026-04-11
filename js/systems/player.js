import { events, EVENTS } from '../engine/events.js';

export class Player {
  constructor() {
    this.name = 'Netrunner';
    this.createdAt = Date.now();
    this.playTime = 0; // In seconds
  }

  addPlayTime(seconds) {
    this.playTime += seconds;
  }

  getFormattedPlayTime() {
    const hours = Math.floor(this.playTime / 3600);
    const minutes = Math.floor((this.playTime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  serialize() {
    return {
      name: this.name,
      createdAt: this.createdAt,
      playTime: this.playTime,
    };
  }

  deserialize(data) {
    if (!data) return;
    this.name = data.name || 'Netrunner';
    this.createdAt = data.createdAt || Date.now();
    this.playTime = data.playTime || 0;
  }
}

export class Achievements {
  constructor() {
    this.achievements = {
      first_level: { id: 'first_level', name: 'First Steps', description: 'Reach level 2 in any skill', unlocked: false },
      level_10: { id: 'level_10', name: 'Getting Started', description: 'Reach level 10 in any skill', unlocked: false },
      level_25: { id: 'level_25', name: 'Skilled Runner', description: 'Reach level 25 in any skill', unlocked: false },
      hacker: { id: 'hacker', name: 'Hacker', description: 'Reach level 50 in Intrusion', unlocked: false },
      street_fighter: { id: 'street_fighter', name: 'Street Fighter', description: 'Reach level 50 in Combat', unlocked: false },
      netrunner: { id: 'netrunner', name: 'Netrunner', description: 'Reach level 50 in Deep Dive', unlocked: false },
      tech_wizard: { id: 'tech_wizard', name: 'Tech Wizard', description: 'Reach level 50 in Cyberware Crafting', unlocked: false },
      legendary: { id: 'legendary', name: 'Legendary', description: 'Reach level 99 in any skill', unlocked: false },
      prestige_master: { id: 'prestige_master', name: 'Prestige Master', description: 'Reach Prestige Level 1', unlocked: false },
      prestige_legend: { id: 'prestige_legend', name: 'Prestige Legend', description: 'Reach Prestige Level 5', unlocked: false },
      millionaire: { id: 'millionaire', name: 'Millionaire', description: 'Accumulate 1,000,000 Eurodollars total', unlocked: false },
      first_kill: { id: 'first_kill', name: 'First Blood', description: 'Defeat your first enemy', unlocked: false },
      rich: { id: 'rich', name: 'Well-Off', description: 'Have 10,000 Eurodollars', unlocked: false },
      collector: { id: 'collector', name: 'Collector', description: 'Own 10 different item types', unlocked: false },
      market_watcher: { id: 'market_watcher', name: 'Market Watcher', description: 'Open the rotating night market and inspect the live rollout', unlocked: false },
    };
  }

  unlock(id) {
    if (this.achievements[id] && !this.achievements[id].unlocked) {
      this.achievements[id].unlocked = true;
      events.emit(EVENTS.ACHIEVEMENT_UNLOCKED, {
        id,
        name: this.achievements[id].name,
        description: this.achievements[id].description,
      });
      return true;
    }
    return false;
  }

  isUnlocked(id) {
    return this.achievements[id]?.unlocked || false;
  }

  getAll() {
    return Object.values(this.achievements);
  }

  getUnlocked() {
    return Object.values(this.achievements).filter(a => a.unlocked);
  }

  getUnlockedCount() {
    return this.getUnlocked().length;
  }

  serialize() {
    const data = {};
    Object.entries(this.achievements).forEach(([id, ach]) => {
      data[id] = ach.unlocked;
    });
    return data;
  }

  deserialize(data) {
    if (!data) return;
    Object.entries(data).forEach(([id, unlocked]) => {
      if (this.achievements[id]) {
        this.achievements[id].unlocked = unlocked;
      }
    });
  }
}
