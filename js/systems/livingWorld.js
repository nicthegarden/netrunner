/**
 * LivingWorld System
 * 
 * Manages dynamic contracts, PvP hacking targets, world events, leaderboards,
 * and faction reputation to create a sense of a living, breathing world with
 * competing netrunners, corporations, and gangs.
 * 
 * Features:
 * - Dynamic contracts from factions (rotate every hour)
 * - PvP hacking system (hack rivals to steal loot)
 * - World events (daily bonuses, seasonal events)
 * - Persistent leaderboards (skill-based + global)
 * - Faction reputation system
 * - Procedurally-named rival netrunners
 */

import { events, EVENTS } from '../engine/events.js';
import {
  FACTIONS,
  CONTRACT_TEMPLATES,
  CONTRACT_TARGETS,
  WORLD_EVENTS,
  LEADERBOARD_CONFIG,
  LOOT_POOLS,
  generateNPCName,
  generatePvPTarget,
  createInitialWorldState,
} from '../data/worldData.js';

export class LivingWorld {
  constructor() {
    this.worldState = createInitialWorldState();
    this.contractRotationTimer = 0;
    this.eventCheckTimer = 0;
    this.leaderboards = {}; // skill -> [{ name, level, xp }, ...]
    this.initializeLeaderboards();
  }

  initializeLeaderboards() {
    Object.keys(LEADERBOARD_CONFIG.CATEGORIES).forEach(category => {
      LEADERBOARD_CONFIG.CATEGORIES[category].forEach(skill => {
        this.leaderboards[skill] = [];
      });
    });
    this.leaderboards.global_playtime = [];
    this.leaderboards.prestige_level = [];
    this.leaderboards.currency_earned = [];
    this.leaderboards.combat_wins = [];
  }

  // ========================================================================
  // CONTRACTS - Dynamic missions from factions
  // ========================================================================

  /**
   * Generate a contract from a template
   */
  generateContract() {
    const templates = Object.values(CONTRACT_TEMPLATES);
    const template = templates[Math.floor(Math.random() * templates.length)];
    const faction = template.factions[Math.floor(Math.random() * template.factions.length)];
    
    // Pick a random target based on contract type
    let target;
    if (template.category === 'hacking') {
      const systems = CONTRACT_TARGETS.systems;
      target = systems[Math.floor(Math.random() * systems.length)];
    } else if (template.category === 'combat') {
      const options = [...CONTRACT_TARGETS.gangs, ...CONTRACT_TARGETS.npcs];
      target = options[Math.floor(Math.random() * options.length)] || generateNPCName(Math.random());
    } else if (template.category === 'crafting') {
      const options = template.id.includes('chrome') ? CONTRACT_TARGETS.cyberware : CONTRACT_TARGETS.weapons;
      target = options[Math.floor(Math.random() * options.length)];
    }

    const difficulty = template.difficulty;
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5,
      very_hard: 2.0,
    }[difficulty] || 1.0;

    return {
      id: `contract_${Date.now()}_${Math.random()}`,
      templateId: template.id,
      name: template.name.replace('{target}', target),
      category: template.category,
      difficulty: difficulty,
      icon: template.icon,
      description: template.description.replace('{target}', target),
      faction: faction,
      requiredSkill: template.requiredSkill,
      minLevel: template.minLevel,
      baseReward: Math.floor(template.baseReward * difficultyMultiplier),
      target: target,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
      status: 'available', // available, accepted, completed
      acceptedAt: null,
      completedAt: null,
    };
  }

  /**
   * Refresh contract pool (every hour or on demand)
   */
  refreshContracts() {
    // Keep completed contracts, remove expired/available ones
    this.worldState.activeContracts = this.worldState.activeContracts.filter(c => 
      c.status === 'completed' && c.completedAt > Date.now() - 86400000 // Keep for 24h
    );
    
    // Add 3-5 new contracts
    const newContractCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < newContractCount; i++) {
      this.worldState.activeContracts.push(this.generateContract());
    }

    events.emit(EVENTS.CONTRACTS_REFRESHED, { contracts: this.getAvailableContracts() });
  }

  getAvailableContracts() {
    return this.worldState.activeContracts.filter(c => 
      c.status === 'available' && c.expiresAt > Date.now()
    );
  }

  acceptContract(contractId) {
    const contract = this.worldState.activeContracts.find(c => c.id === contractId);
    if (!contract) return false;
    
    contract.status = 'accepted';
    contract.acceptedAt = Date.now();
    events.emit(EVENTS.CONTRACT_ACCEPTED, { contract });
    return true;
  }

  completeContract(contractId, playerLevel, prestige) {
    const contract = this.worldState.activeContracts.find(c => c.id === contractId);
    if (!contract) return null;
    
    contract.status = 'completed';
    contract.completedAt = Date.now();

    // Calculate rewards
    const levelBonus = Math.max(0.5, 1 + (playerLevel - contract.minLevel) * 0.05);
    const prestigeMultiplier = prestige?.getCurrencyMultiplier?.() || 1.0;
    const finalReward = Math.floor(contract.baseReward * levelBonus * prestigeMultiplier);

    // Award faction reputation
    this.addFactionReputation(contract.faction, 10);

    // Emit event with rewards
    const lootPool = LOOT_POOLS[this._getLootPoolForFaction(contract.faction)];
    events.emit(EVENTS.CONTRACT_COMPLETED, {
      contract,
      reward: finalReward,
      lootPool: lootPool,
    });

    return { reward: finalReward, lootPool };
  }

  _getLootPoolForFaction(factionId) {
    const poolMap = {
      chrome_syndicate: 'HACKER_VAULT',
      arasaka_corp: 'CORP_VAULT',
      street_crew: 'STREET_BOUNTY',
      blackwall_collective: 'BLACKWALL_CACHE',
    };
    return poolMap[factionId] || 'HACKER_VAULT';
  }

  // ========================================================================
  // PVP HACKING - Hack rival netrunners for loot
  // ========================================================================

  /**
   * Generate PvP targets (rivals to hack)
   */
  generatePvPTargets(playerLevel, count = 5) {
    this.worldState.pvpTargets = [];
    for (let i = 0; i < count; i++) {
      const faction = Object.keys(FACTIONS)[Math.floor(Math.random() * 4)];
      const target = generatePvPTarget(playerLevel, faction);
      this.worldState.pvpTargets.push(target);
    }
    return this.worldState.pvpTargets;
  }

  getPvPTargets() {
    // Refresh if empty or if too old (every 30 minutes)
    if (this.worldState.pvpTargets.length === 0 || 
        (this.worldState.pvpTargets[0]?.generatedAt || 0) < Date.now() - 1800000) {
      this.generatePvPTargets(50); // arbitrary level
    }
    return this.worldState.pvpTargets;
  }

  /**
   * Attempt to hack a rival netrunner
   * Success chance depends on player level vs target level
   */
  attemptHack(targetId, playerIntrusion, playerLevel) {
    const target = this.worldState.pvpTargets.find(t => t.id === targetId);
    if (!target) return null;

    // Success chance: +2% per level difference, baseline 50%
    const levelDiff = playerLevel - target.level;
    let successChance = 0.50 + (levelDiff * 0.02);
    successChance = Math.max(0.1, Math.min(0.95, successChance)); // Clamp 10-95%

    const success = Math.random() < successChance;

    if (success) {
      // Award loot from HACKER_VAULT
      const lootPool = LOOT_POOLS.HACKER_VAULT;
      const reward = Math.floor(target.lootValue * (0.8 + Math.random() * 0.4));
      
      this.addFactionReputation(target.faction, 5); // Small rep for successful hack

      events.emit(EVENTS.PVP_HACK_SUCCESS, {
        target,
        reward,
        lootPool,
        successChance,
      });

      return { success: true, reward, lootPool, successChance };
    } else {
      // Failed hack: small XP penalty
      this.addFactionReputation(target.faction, -3); // Negative rep for failed hack

      events.emit(EVENTS.PVP_HACK_FAILED, {
        target,
        successChance,
      });

      return { success: false, successChance };
    }
  }

  // ========================================================================
  // FACTION REPUTATION - Build standing with factions
  // ========================================================================

  addFactionReputation(factionId, amount) {
    if (!this.worldState.factionReputation.hasOwnProperty(factionId)) {
      this.worldState.factionReputation[factionId] = 0;
    }
    this.worldState.factionReputation[factionId] = Math.max(-100, Math.min(100, 
      this.worldState.factionReputation[factionId] + amount
    ));
    events.emit(EVENTS.FACTION_REPUTATION_CHANGED, {
      faction: factionId,
      newReputation: this.worldState.factionReputation[factionId],
    });
  }

  getFactionReputation(factionId) {
    return this.worldState.factionReputation[factionId] || 0;
  }

  // ========================================================================
  // WORLD EVENTS - Dynamic bonuses and world state
  // ========================================================================

  /**
   * Check and update active world events
   * Called every tick to determine which events are active
   */
  updateWorldEvents() {
    const now = new Date();
    const activeEvents = [];

    WORLD_EVENTS.forEach(event => {
      let isActive = false;

      if (event.weeklyOccurrence && event.day !== undefined) {
        // Weekly events
        isActive = now.getDay() === event.day;
      } else if (event.month !== undefined) {
        // Seasonal/monthly events
        isActive = now.getMonth() === event.month;
      }

      if (isActive) {
        activeEvents.push({
          ...event,
          activeSince: Date.now(),
        });
      }
    });

    this.worldState.activeEvents = activeEvents;
    return activeEvents;
  }

  getActiveEvents() {
    this.updateWorldEvents();
    return this.worldState.activeEvents;
  }

  /**
   * Get multiplier for a skill based on active events
   */
  getEventMultiplier(skillId) {
    const activeEvents = this.getActiveEvents();
    let multiplier = 1.0;

    activeEvents.forEach(event => {
      if (event.bonusType === 'skill_bonus' && event.affectedSkills?.includes(skillId)) {
        multiplier *= event.bonusMultiplier;
      } else if (event.bonusType === 'xp_bonus') {
        multiplier *= event.bonusMultiplier;
      }
    });

    return multiplier;
  }

  // ========================================================================
  // LEADERBOARDS - Track top players
  // ========================================================================

  /**
   * Update leaderboards with player stats
   * Called periodically or on level up
   */
  updateLeaderboard(skillId, playerName, playerLevel, playerXP) {
    if (!this.leaderboards[skillId]) {
      this.leaderboards[skillId] = [];
    }

    const lb = this.leaderboards[skillId];
    const existingIndex = lb.findIndex(e => e.name === playerName);

    if (existingIndex >= 0) {
      // Update existing entry
      lb[existingIndex] = { name: playerName, level: playerLevel, xp: playerXP };
    } else {
      // Add new entry
      lb.push({ name: playerName, level: playerLevel, xp: playerXP });
    }

    // Sort by level (desc) then XP (desc)
    lb.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.xp - a.xp;
    });

    // Keep only top 100
    this.leaderboards[skillId] = lb.slice(0, LEADERBOARD_CONFIG.MAX_ENTRIES);
  }

  getLeaderboard(skillId) {
    return this.leaderboards[skillId] || [];
  }

  /**
   * Get player rank on leaderboard
   */
  getPlayerRank(skillId, playerName) {
    const lb = this.getLeaderboard(skillId);
    const index = lb.findIndex(e => e.name === playerName);
    return index >= 0 ? index + 1 : null; // 1-indexed rank
  }

  // ========================================================================
  // GAME LOOP
  // ========================================================================

  tick() {
    this.contractRotationTimer++;
    this.eventCheckTimer++;

    // Refresh contracts every hour (3600 ticks)
    if (this.contractRotationTimer >= 3600) {
      this.refreshContracts();
      this.contractRotationTimer = 0;
    }

    // Check events every minute (60 ticks)
    if (this.eventCheckTimer >= 60) {
      const activeEvents = this.updateWorldEvents();
      if (activeEvents.length > 0) {
        events.emit(EVENTS.WORLD_EVENTS_UPDATED, { events: activeEvents });
      }
      this.eventCheckTimer = 0;
    }
  }

  // ========================================================================
  // SERIALIZATION
  // ========================================================================

  serialize() {
    return {
      worldState: this.worldState,
      leaderboards: this.leaderboards,
    };
  }

  deserialize(data) {
    if (!data) return;
    
    if (data.worldState) {
      this.worldState = data.worldState;
    }
    
    if (data.leaderboards) {
      this.leaderboards = data.leaderboards;
    }
  }
}

export default LivingWorld;
