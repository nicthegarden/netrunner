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
      // Progression Achievements
      first_level: { id: 'first_level', name: 'First Steps', description: 'Reach level 2 in any skill', unlocked: false },
      level_10: { id: 'level_10', name: 'Getting Started', description: 'Reach level 10 in any skill', unlocked: false },
      level_25: { id: 'level_25', name: 'Skilled Runner', description: 'Reach level 25 in any skill', unlocked: false },
      level_50_any: { id: 'level_50_any', name: 'Master', description: 'Reach level 50 in any skill', unlocked: false },
      level_99_any: { id: 'level_99_any', name: 'Legendary', description: 'Reach level 99 in any skill', unlocked: false },
      
      // Skill-Specific Achievements
      hacker: { id: 'hacker', name: 'Hacker', description: 'Reach level 50 in Intrusion', unlocked: false },
      street_fighter: { id: 'street_fighter', name: 'Street Fighter', description: 'Reach level 50 in Combat', unlocked: false },
      netrunner: { id: 'netrunner', name: 'Netrunner', description: 'Reach level 50 in Deep Dive', unlocked: false },
      tech_wizard: { id: 'tech_wizard', name: 'Tech Wizard', description: 'Reach level 50 in Cyberware Crafting', unlocked: false },
      cryptographer: { id: 'cryptographer', name: 'Cryptographer', description: 'Reach level 50 in Decryption', unlocked: false },
      ice_breaker: { id: 'ice_breaker', name: 'ICE Breaker', description: 'Reach level 50 in ICE Breaking', unlocked: false },
      daemon_lord: { id: 'daemon_lord', name: 'Daemon Lord', description: 'Reach level 50 in Daemon Coding', unlocked: false },
      combat_veteran: { id: 'combat_veteran', name: 'Combat Veteran', description: 'Reach level 99 in Combat', unlocked: false },
      
      // Prestige Achievements
      prestige_master: { id: 'prestige_master', name: 'Prestige Master', description: 'Reach Prestige Level 1', unlocked: false },
      prestige_legend: { id: 'prestige_legend', name: 'Prestige Legend', description: 'Reach Prestige Level 5', unlocked: false },
      prestige_ascended: { id: 'prestige_ascended', name: 'Ascended', description: 'Reach Prestige Level 10', unlocked: false },
      
      // Economy Achievements
      millionaire: { id: 'millionaire', name: 'Millionaire', description: 'Accumulate 1,000,000 Eurodollars total', unlocked: false },
      billionaire: { id: 'billionaire', name: 'Billionaire', description: 'Accumulate 1,000,000,000 Eurodollars total', unlocked: false },
      rich: { id: 'rich', name: 'Well-Off', description: 'Have 10,000 Eurodollars', unlocked: false },
      loaded: { id: 'loaded', name: 'Loaded', description: 'Have 100,000 Eurodollars at once', unlocked: false },
      
      // Combat Achievements
      first_kill: { id: 'first_kill', name: 'First Blood', description: 'Defeat your first enemy', unlocked: false },
      combat_master: { id: 'combat_master', name: 'Combat Master', description: 'Defeat 100 enemies', unlocked: false },
      boss_slayer: { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat a boss enemy', unlocked: false },
      legendary_hunter: { id: 'legendary_hunter', name: 'Legendary Hunter', description: 'Defeat 5 different boss enemies', unlocked: false },
      undefeated: { id: 'undefeated', name: 'Undefeated', description: 'Win 50 consecutive combats without losing', unlocked: false },
      
      // Inventory & Crafting
      collector: { id: 'collector', name: 'Collector', description: 'Own 10 different item types', unlocked: false },
      hoarder: { id: 'hoarder', name: 'Hoarder', description: 'Fill your inventory to 80 slots', unlocked: false },
      crafter: { id: 'crafter', name: 'Crafter', description: 'Complete 10 crafting recipes', unlocked: false },
      master_crafter: { id: 'master_crafter', name: 'Master Crafter', description: 'Craft a legendary item', unlocked: false },
      legendary_collector: { id: 'legendary_collector', name: 'Legendary Collector', description: 'Own 5 legendary items', unlocked: false },
      
      // Health & Virus Achievements
      virus_survivor: { id: 'virus_survivor', name: 'Virus Survivor', description: 'Get infected with a virus and survive', unlocked: false },
      virus_veteran: { id: 'virus_veteran', name: 'Virus Veteran', description: 'Remove 10 viruses at the clinic', unlocked: false },
      immune: { id: 'immune', name: 'Immune', description: 'Go 100 hacking activities without getting infected', unlocked: false },
      reckless: { id: 'reckless', name: 'Reckless', description: 'Get infected 5 times in one session', unlocked: false },
      
      // Market & Shop
      market_watcher: { id: 'market_watcher', name: 'Market Watcher', description: 'Check the rotating night market', unlocked: false },
      big_spender: { id: 'big_spender', name: 'Big Spender', description: 'Spend 100,000 Eurodollars total', unlocked: false },
      smart_shopper: { id: 'smart_shopper', name: 'Smart Shopper', description: 'Buy 5 items from the rotating shop', unlocked: false },
      
      // Mastery Achievements
      mastery_expert: { id: 'mastery_expert', name: 'Mastery Expert', description: 'Reach mastery level 50 on any activity', unlocked: false },
      mastery_legend: { id: 'mastery_legend', name: 'Mastery Legend', description: 'Reach mastery level 99 on any activity', unlocked: false },
      
      // World & Events
      first_contract: { id: 'first_contract', name: 'Contractor', description: 'Complete your first faction contract', unlocked: false },
      faction_ally: { id: 'faction_ally', name: 'Faction Ally', description: 'Reach Allied status with any faction', unlocked: false },
      world_explorer: { id: 'world_explorer', name: 'World Explorer', description: 'Encounter all 4 factions', unlocked: false },
      event_witness: { id: 'event_witness', name: 'Event Witness', description: 'Experience 5 world events', unlocked: false },
      
      // Playtime Achievements
      always_online: { id: 'always_online', name: 'Always Online', description: 'Accumulate 100 hours of playtime', unlocked: false },
      grinder: { id: 'grinder', name: 'Grinder', description: 'Accumulate 50 hours of playtime', unlocked: false },
      casual: { id: 'casual', name: 'Casual', description: 'Play for 10 hours', unlocked: false },
      nocturnal: { id: 'nocturnal', name: 'Nocturnal', description: 'Accumulate 500 hours of offline progress', unlocked: false },
      
      // Status Effects & Combat Depth
      buffed: { id: 'buffed', name: 'Buffed', description: 'Apply 3 status effects in a single combat', unlocked: false },
      critical_strike: { id: 'critical_strike', name: 'Critical Strike', description: 'Deal a critical hit that defeats an enemy', unlocked: false },
      evade_master: { id: 'evade_master', name: 'Evade Master', description: 'Dodge 10 attacks in a single combat', unlocked: false },
      
      // Secret/Challenge Achievements
      speedrunner: { id: 'speedrunner', name: 'Speedrunner', description: 'Reach level 50 in 5 hours', unlocked: false },
      perfectionist: { id: 'perfectionist', name: 'Perfectionist', description: 'Complete all achievements', unlocked: false },
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
