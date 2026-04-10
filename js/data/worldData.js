/**
 * NETRUNNER LIVING WORLD DATA
 * 
 * Defines NPCs, factions, contracts, events, and procedural content
 * for the living world system. All content is pre-designed but feels
 * procedurally generated through randomization and time-based triggering.
 */

// ============================================================================
// FACTIONS - Rival netrunners, corporations, street gangs
// ============================================================================

export const FACTIONS = {
  CHROME_SYNDICATE: {
    id: 'chrome_syndicate',
    name: 'Chrome Syndicate',
    faction: 'netrunner',
    color: '#ff00ff',
    description: 'Elite netrunners competing for system supremacy',
    icon: '💀',
    baseReputation: 0,
  },
  ARASAKA_CORP: {
    id: 'arasaka_corp',
    name: 'Arasaka Corporation',
    faction: 'corporate',
    color: '#ffff00',
    description: 'Megacorp security division hunting rogue operatives',
    icon: '🏢',
    baseReputation: 0,
  },
  STREET_CREW: {
    id: 'street_crew',
    name: 'Street Crew Coalition',
    faction: 'gang',
    color: '#00ff41',
    description: 'Decentralized gang network running street-level contracts',
    icon: '🔫',
    baseReputation: 0,
  },
  BLACKWALL_COLLECTIVE: {
    id: 'blackwall_collective',
    name: 'Blackwall Collective',
    faction: 'netrunner',
    color: '#0099ff',
    description: 'Mysterious rogue AI collective offering high-stakes contracts',
    icon: '👾',
    baseReputation: 0,
  },
};

// ============================================================================
// NPC RIVALS - Procedurally-named competitors on leaderboards
// ============================================================================

export const NPC_TEMPLATES = [
  // Hacker aliases
  { prefix: ['Cyber', 'Null', 'Ghost', 'Void', 'Shadow', 'Rogue', 'Phantom', 'Neon', 'Crash', 'Razor'], 
    suffix: ['Runner', 'Breaker', 'Jack', 'Punk', 'Code', 'Sys', 'Net', 'Hack', 'Surge', 'Killer'] },
];

// Pre-generated NPC pool (procedural but deterministic)
export function generateNPCName(seed) {
  const random = (n) => {
    const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  
  const prefixes = ['Cyber', 'Null', 'Ghost', 'Void', 'Shadow', 'Rogue', 'Phantom', 'Neon', 'Crash', 'Razor', 'Blaze', 'Frost', 'Storm', 'Chrome', 'Pixel'];
  const suffixes = ['Runner', 'Breaker', 'Jack', 'Punk', 'Code', 'Sys', 'Net', 'Hack', 'Surge', 'Killer', 'Bot', 'Dev', 'Lancer', 'Merc', 'Witch'];
  
  const prefix = prefixes[Math.floor(random(1) * prefixes.length)];
  const suffix = suffixes[Math.floor(random(2) * suffixes.length)];
  return `${prefix}${suffix}`;
}

// ============================================================================
// CONTRACT TEMPLATES - Dynamic missions from factions
// ============================================================================

export const CONTRACT_TEMPLATES = {
  // Hacking intrusion contracts
  DATA_HEIST: {
    id: 'data_heist',
    name: 'Data Heist: {target}',
    category: 'hacking',
    difficulty: 'medium',
    icon: '💾',
    requiredSkill: 'intrusion',
    minLevel: 20,
    description: 'Hack {target} systems and steal encrypted data',
    baseReward: 500,
    factions: ['chrome_syndicate', 'blackwall_collective'],
  },
  CORP_ESPIONAGE: {
    id: 'corp_espionage',
    name: 'Corporate Espionage: {target}',
    category: 'hacking',
    difficulty: 'hard',
    icon: '📋',
    requiredSkill: 'decryption',
    minLevel: 50,
    description: 'Decrypt stolen corporate files from {target}',
    baseReward: 2000,
    factions: ['street_crew', 'chrome_syndicate'],
  },
  ICE_BREACH: {
    id: 'ice_breach',
    name: 'ICE Breach: {target}',
    category: 'hacking',
    difficulty: 'very_hard',
    icon: '❄️',
    requiredSkill: 'ice_breaking',
    minLevel: 70,
    description: 'Defeat {target} intrusion countermeasures',
    baseReward: 3500,
    factions: ['blackwall_collective', 'chrome_syndicate'],
  },
  
  // Combat/street contracts
  BOUNTY_HUNT: {
    id: 'bounty_hunt',
    name: 'Bounty: {target}',
    category: 'combat',
    difficulty: 'hard',
    icon: '🎯',
    requiredSkill: 'combat',
    minLevel: 40,
    description: 'Defeat the target: {target}',
    baseReward: 1500,
    factions: ['street_crew', 'arasaka_corp'],
  },
  GANG_RAID: {
    id: 'gang_raid',
    name: 'Gang Raid: {target}',
    category: 'combat',
    difficulty: 'medium',
    icon: '🔥',
    requiredSkill: 'street_cred',
    minLevel: 30,
    description: 'Raid {target} gang territory',
    baseReward: 800,
    factions: ['street_crew'],
  },
  
  // Crafting contracts
  FORGE_WEAPON: {
    id: 'forge_weapon',
    name: 'Forge Contract: {target}',
    category: 'crafting',
    difficulty: 'medium',
    icon: '⚔️',
    requiredSkill: 'weapon_modding',
    minLevel: 35,
    description: 'Craft {target} weapons for black market',
    baseReward: 1000,
    factions: ['street_crew', 'arasaka_corp'],
  },
  MODIFY_CHROME: {
    id: 'modify_chrome',
    name: 'Chrome Modification: {target}',
    category: 'crafting',
    difficulty: 'hard',
    icon: '🧬',
    requiredSkill: 'cyberware_crafting',
    minLevel: 50,
    description: 'Modify {target} cyberware for underground market',
    baseReward: 2000,
    factions: ['chrome_syndicate'],
  },
};

// Procedural contract target pool
export const CONTRACT_TARGETS = {
  corps: ['Arasaka', 'Militech', 'Kang Tao', 'Yaiba', 'Horizon', 'NeoTokyo', 'Raven', 'EuroDollar Bank'],
  gangs: ['Tygers Claw', 'Valentinos', 'Animals', 'Maelstrom', 'The Mox', 'Badlands Nomads'],
  systems: ['Neural Haven', 'Blackmarket Exchange', 'Shadow Net', 'Cipher Vault', 'Code Red'],
  npcs: [], // filled dynamically with rival names
  weapons: ['Mantis Blade', 'Monokatana', 'Smart Pistol', 'Legendary Sniper', 'Rail Gun'],
  cyberware: ['Combat Implant', 'Optics Package', 'Reinforced Skeleton', 'Reflexes Package'],
};

// ============================================================================
// WORLD EVENTS - Pre-programmed events that trigger on schedule
// ============================================================================

export const WORLD_EVENTS = [
  {
    id: 'mega_hack_monday',
    name: 'Mega Hack Monday',
    day: 1, // Monday
    weeklyOccurrence: true,
    icon: '💻',
    description: 'All hacking contracts pay 25% bonus rewards',
    bonusType: 'skill_bonus',
    affectedSkills: ['intrusion', 'decryption', 'ice_breaking', 'daemon_coding'],
    bonusMultiplier: 1.25,
    duration: 86400, // 24 hours in seconds
  },
  {
    id: 'corporate_tuesday',
    name: 'Corporate Takeover Tuesday',
    day: 2, // Tuesday
    weeklyOccurrence: true,
    icon: '🏢',
    description: 'Corporate contracts are twice as dangerous but pay 50% more',
    bonusType: 'faction_bonus',
    affectedFactions: ['arasaka_corp'],
    bonusMultiplier: 1.50,
    duration: 86400,
  },
  {
    id: 'gang_warfare_wed',
    name: 'Gang Warfare Wednesday',
    day: 3, // Wednesday
    weeklyOccurrence: true,
    icon: '⚔️',
    description: 'Street combat contracts pay 35% bonus; enemy HP increased 20%',
    bonusType: 'skill_bonus',
    affectedSkills: ['combat', 'street_cred'],
    bonusMultiplier: 1.35,
    duration: 86400,
  },
  {
    id: 'synthesis_thursday',
    name: 'Synthesis Thursday',
    day: 4, // Thursday
    weeklyOccurrence: true,
    icon: '🧬',
    description: 'Crafting contracts reward 40% more; material costs 15% reduced',
    bonusType: 'crafting_bonus',
    bonusMultiplier: 1.40,
    duration: 86400,
  },
  {
    id: 'faction_friday',
    name: 'Faction Friday',
    day: 5, // Friday
    weeklyOccurrence: true,
    icon: '👥',
    description: 'Faction reputation gains doubled; new contracts appear',
    bonusType: 'reputation_bonus',
    bonusMultiplier: 2.0,
    duration: 86400,
  },
  {
    id: 'blackmarket_saturday',
    name: 'Black Market Saturday',
    day: 6, // Saturday
    weeklyOccurrence: true,
    icon: '🖤',
    description: 'Exclusive rare loot drops; high-value contracts unlocked',
    bonusType: 'loot_bonus',
    bonusMultiplier: 2.0,
    duration: 86400,
  },
  {
    id: 'peaceful_sunday',
    name: 'Peaceful Sunday',
    day: 0, // Sunday
    weeklyOccurrence: true,
    icon: '☮️',
    description: 'Rest day; all XP gains 20% boosted, but no contracts available',
    bonusType: 'xp_bonus',
    bonusMultiplier: 1.20,
    duration: 86400,
  },
  
  // One-time seasonal/special events
  {
    id: 'neon_festival',
    name: 'Neon Festival',
    month: 3, // March/Spring
    icon: '🎆',
    description: 'Celebrate the Neon Festival: all skill XP +15%, special loot available',
    bonusType: 'xp_bonus',
    bonusMultiplier: 1.15,
    duration: 259200, // 3 days
  },
  {
    id: 'corpo_summit',
    name: 'Annual Corpo Summit',
    month: 6, // June/Summer
    icon: '💼',
    description: 'Corporate entities are gathering: corporation reputation +50%, unique contracts',
    bonusType: 'faction_bonus',
    affectedFactions: ['arasaka_corp'],
    bonusMultiplier: 1.50,
    duration: 432000, // 5 days
  },
  {
    id: 'street_fair',
    name: 'Street Fair Extravaganza',
    month: 9, // September/Fall
    icon: '🎪',
    description: 'Street Fair: gang reputation +50%, street combat contracts pay more',
    bonusType: 'faction_bonus',
    affectedFactions: ['street_crew'],
    bonusMultiplier: 1.50,
    duration: 345600, // 4 days
  },
  {
    id: 'blackwall_whispers',
    name: 'Blackwall Whispers',
    month: 12, // December/Winter
    icon: '👻',
    description: 'Mysterious transmissions from Blackwall: hacking XP +25%, rare encounters',
    bonusType: 'skill_bonus',
    affectedSkills: ['intrusion', 'decryption', 'ice_breaking'],
    bonusMultiplier: 1.25,
    duration: 604800, // 7 days
  },
];

// ============================================================================
// LEADERBOARD CONFIGURATION
// ============================================================================

export const LEADERBOARD_CONFIG = {
  // Top 100 per skill + global top 50
  MAX_ENTRIES: 100,
  GLOBAL_MAX: 50,
  
  // Categories for leaderboards
  CATEGORIES: {
    HACKING: ['intrusion', 'decryption', 'ice_breaking', 'daemon_coding'],
    COMBAT: ['combat', 'black_ice_combat'],
    CRAFTING: ['cyberware_crafting', 'weapon_modding'],
    STREET: ['street_cred', 'stealth', 'smuggling'],
    TECH: ['vehicle_tuning', 'drone_engineering'],
    RIPPER: ['cyberware_installation', 'biotech', 'neural_enhancement', 'chrome_surgery'],
  },
  
  // Leaderboard types
  TYPES: {
    SKILL_XP: 'skill_xp',           // Per-skill XP leaderboard
    GLOBAL_PLAYTIME: 'global_playtime',   // Total playtime across all skills
    PRESTIGE_LEVEL: 'prestige_level',     // Prestige progression
    CURRENCY_EARNED: 'currency_earned',   // Total E$ earned
    ITEMS_COLLECTED: 'items_collected',   // Inventory diversity/size
    COMBAT_WINS: 'combat_wins',         // Combat victories
    RARE_DROPS: 'rare_drops',           // Epic/legendary items found
  },
};

// ============================================================================
// PVP HACKING TARGETS - Procedurally generated rival players
// ============================================================================

export function generatePvPTarget(playerLevel, faction = null) {
  const seed = Math.random();
  const npcName = generateNPCName(seed);
  const npcLevel = Math.max(1, playerLevel + (Math.random() * 40 - 20)); // ±20 levels
  const difficulty = npcLevel > playerLevel ? 'hard' : npcLevel < playerLevel - 10 ? 'easy' : 'medium';
  
  return {
    id: `pvp_${Date.now()}_${Math.random()}`,
    name: npcName,
    level: Math.floor(npcLevel),
    faction: faction || Object.keys(FACTIONS)[Math.floor(Math.random() * 4)],
    difficulty: difficulty,
    defenseBonus: npcLevel * 0.5,
    lootValue: Math.floor(100 + npcLevel * 25),
    icon: '💻',
  };
}

// ============================================================================
// LOOT POOLS - Dynamic rewards from contracts and PvP
// ============================================================================

export const LOOT_POOLS = {
  HACKER_VAULT: {
    name: 'Hacker\'s Vault Loot',
    icon: '💾',
    items: {
      'data_shard': { min: 5, max: 15, weight: 40 },
      'daemon_code': { min: 2, max: 8, weight: 30 },
      'encrypted_data': { min: 1, max: 3, weight: 20 },
      'net_artifact': { min: 1, max: 2, weight: 10 },
    },
    currency: { min: 500, max: 2000 },
  },
  STREET_BOUNTY: {
    name: 'Street Bounty Loot',
    icon: '💰',
    items: {
      'chrome_scrap': { min: 5, max: 12, weight: 35 },
      'neural_implant': { min: 2, max: 5, weight: 25 },
      'contraband': { min: 1, max: 3, weight: 20 },
      'stolen_intel': { min: 1, max: 2, weight: 20 },
    },
    currency: { min: 800, max: 2500 },
  },
  CORP_VAULT: {
    name: 'Corporate Vault Loot',
    icon: '🏢',
    items: {
      'biometric_scanner': { min: 2, max: 5, weight: 30 },
      'stolen_intel': { min: 3, max: 8, weight: 35 },
      'circuit_board': { min: 5, max: 15, weight: 25 },
      'net_artifact': { min: 1, max: 3, weight: 10 },
    },
    currency: { min: 1500, max: 4000 },
  },
  BLACKWALL_CACHE: {
    name: 'Blackwall Cache Loot',
    icon: '👾',
    items: {
      'daemon_code': { min: 5, max: 15, weight: 40 },
      'net_artifact': { min: 2, max: 6, weight: 35 },
      'encrypted_data': { min: 3, max: 8, weight: 20 },
      'prototype_nexus': { min: 0, max: 1, weight: 5 }, // Rare!
    },
    currency: { min: 2000, max: 5000 },
  },
};

// ============================================================================
// DYNAMIC WORLD STATE - Tracks faction influence, active contracts, etc.
// ============================================================================

export function createInitialWorldState() {
  return {
    timestamp: Date.now(),
    version: 1,
    
    // Faction standings (-100 to +100)
    factionReputation: {
      chrome_syndicate: 0,
      arasaka_corp: 0,
      street_crew: 0,
      blackwall_collective: 0,
    },
    
    // Active contracts (3-5 at any time, rotating)
    activeContracts: [],
    
    // Completed contracts (for tracking rewards)
    completedContracts: [],
    
    // PvP targets available for hacking
    pvpTargets: [],
    
    // Current world events (events triggered by day/month)
    activeEvents: [],
    
    // NPC rival pool (10 rivals per skill)
    rivals: {},
  };
}
