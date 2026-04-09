// XP curve - rebalanced for idle game (less steep than RuneScape)
// Level 99 should take ~200-400 hours of active play at max-level activities
export function calculateRequiredXP(level) {
  if (level <= 0) return 0;
  // Gentler curve: level 10 ~1k total, level 50 ~100k total, level 99 ~2M total
  return Math.floor(level * 10 + 50 * Math.pow(2, level / 12));
}

// Precomputed XP lookup table — O(1) access instead of O(n)
const _xpTable = new Array(100);
_xpTable[0] = 0;
for (let i = 1; i <= 99; i++) {
  _xpTable[i] = (_xpTable[i - 1] || 0) + calculateRequiredXP(i);
}

export function getTotalXPForLevel(level) {
  if (level <= 0) return 0;
  if (level > 99) return _xpTable[99];
  return _xpTable[level];
}

export function getLevelFromXP(totalXP) {
  // Binary search on precomputed table — O(log n) instead of O(n^2)
  let lo = 1, hi = 99;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (_xpTable[mid] <= totalXP) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return totalXP >= _xpTable[lo] ? lo : Math.max(1, lo - 1);
}

export function getXPForLevel(level) {
  return _xpTable[level] || 0;
}

export const MAX_XP = _xpTable[99];

// Skills that can run as background hacking tasks (non-combat only)
export const BACKGROUND_HACK_SKILLS = new Set([
  'intrusion', 'decryption', 'ice_breaking', 'daemon_coding',
]);

// Background hacking XP efficiency multiplier (75% of normal)
export const BACKGROUND_HACK_EFFICIENCY = 0.75;

// Skill definitions - 24 skills across 6 categories
export const SKILLS = {
  // HACKING (4 skills)
  INTRUSION: {
    id: 'intrusion', name: 'Intrusion', category: 'hacking',
    description: 'Break into systems and steal data', icon: '🔓', color: '#00ff41',
  },
  DECRYPTION: {
    id: 'decryption', name: 'Decryption', category: 'hacking',
    description: 'Decrypt stolen data into usable intel', icon: '🔐', color: '#00ff41',
  },
  ICE_BREAKING: {
    id: 'ice_breaking', name: 'ICE Breaking', category: 'hacking',
    description: 'Defeat Intrusion Countermeasure Electronics', icon: '❄️', color: '#00ff41',
  },
  DAEMON_CODING: {
    id: 'daemon_coding', name: 'Daemon Coding', category: 'hacking',
    description: 'Write daemons to boost other skills', icon: '👾', color: '#00ff41',
  },

  // NETRUNNING (4 skills)
  DEEP_DIVE: {
    id: 'deep_dive', name: 'Deep Dive', category: 'netrunning',
    description: 'Explore deeper NET layers for rare finds', icon: '🌊', color: '#00d4ff',
  },
  DATA_MINING: {
    id: 'data_mining', name: 'Data Mining', category: 'netrunning',
    description: 'Extract raw data from the NET', icon: '⛏️', color: '#00d4ff',
  },
  BLACK_ICE_COMBAT: {
    id: 'black_ice_combat', name: 'Black ICE Combat', category: 'netrunning',
    description: 'Fight hostile AI in cyberspace', icon: '⚔️', color: '#00d4ff',
  },
  NEURAL_SURFING: {
    id: 'neural_surfing', name: 'Neural Surfing', category: 'netrunning',
    description: 'Move faster through NET, unlock zones', icon: '🏄', color: '#00d4ff',
  },

  // STREET (4 skills)
  COMBAT: {
    id: 'combat', name: 'Combat', category: 'street',
    description: 'Fight gangs, corpos, cyberpsychos', icon: '🤺', color: '#ff00ff',
  },
  STEALTH: {
    id: 'stealth', name: 'Stealth', category: 'street',
    description: 'Pickpocket, infiltrate, gather intel', icon: '🥷', color: '#ff00ff',
  },
  STREET_CRED: {
    id: 'street_cred', name: 'Street Cred', category: 'street',
    description: 'Build reputation with factions', icon: '⭐', color: '#ff00ff',
  },
  SMUGGLING: {
    id: 'smuggling', name: 'Smuggling', category: 'street',
    description: 'Transport contraband for profit', icon: '📦', color: '#ff00ff',
  },

  // TECH (4 skills)
  CYBERWARE_CRAFTING: {
    id: 'cyberware_crafting', name: 'Cyberware Crafting', category: 'tech',
    description: 'Build cyberware implants', icon: '🦾', color: '#ffff00',
  },
  WEAPON_MODDING: {
    id: 'weapon_modding', name: 'Weapon Modding', category: 'tech',
    description: 'Upgrade and modify weapons', icon: '🔫', color: '#ffff00',
  },
  VEHICLE_TUNING: {
    id: 'vehicle_tuning', name: 'Vehicle Tuning', category: 'tech',
    description: 'Tune vehicles for smuggling', icon: '🏎️', color: '#ffff00',
  },
  DRONE_ENGINEERING: {
    id: 'drone_engineering', name: 'Drone Engineering', category: 'tech',
    description: 'Build drones for passive gathering', icon: '🛸', color: '#ffff00',
  },

  // FIXER (4 skills)
  TRADING: {
    id: 'trading', name: 'Trading', category: 'fixer',
    description: 'Buy low, sell high on black market', icon: '💰', color: '#ff6600',
  },
  CORPO_INFILTRATION: {
    id: 'corpo_infiltration', name: 'Corpo Infiltration', category: 'fixer',
    description: 'High-risk heists against megacorps', icon: '🏢', color: '#ff6600',
  },
  INFO_BROKERING: {
    id: 'info_brokering', name: 'Info Brokering', category: 'fixer',
    description: 'Sell intel gathered from hacking', icon: '📰', color: '#ff6600',
  },
  FENCING: {
    id: 'fencing', name: 'Fencing', category: 'fixer',
    description: 'Sell stolen goods', icon: '🪙', color: '#ff6600',
  },

  // RIPPER (4 skills)
  CYBERWARE_INSTALLATION: {
    id: 'cyberware_installation', name: 'Cyberware Installation', category: 'ripper',
    description: 'Install cyberware for stat boosts', icon: '🔌', color: '#ff0099',
  },
  BIOTECH: {
    id: 'biotech', name: 'Biotech', category: 'ripper',
    description: 'Create healing items and stims', icon: '💊', color: '#ff0099',
  },
  NEURAL_ENHANCEMENT: {
    id: 'neural_enhancement', name: 'Neural Enhancement', category: 'ripper',
    description: 'Boost XP rates and skill synergies', icon: '🧠', color: '#ff0099',
  },
  CHROME_SURGERY: {
    id: 'chrome_surgery', name: 'Chrome Surgery', category: 'ripper',
    description: 'High-end implants, risk of psychosis', icon: '⚡', color: '#ff0099',
  },
};

// Item definitions
export const ITEMS = {
  // Currency (reference only — actual currency is Economy.currency)
  EURODOLLAR: { id: 'eurodollar', name: 'Eurodollar', type: 'currency', icon: '€$', stackable: true, rarity: 'common' },

  // Crafting materials
  DATA_SHARD: { id: 'data_shard', name: 'Data Shard', type: 'material', icon: '💾', stackable: true, value: 10, rarity: 'common' },
  CIRCUIT_BOARD: { id: 'circuit_board', name: 'Circuit Board', type: 'material', icon: '🔌', stackable: true, value: 25, rarity: 'common' },
  CHROME_SCRAP: { id: 'chrome_scrap', name: 'Chrome Scrap', type: 'material', icon: '⚙️', stackable: true, value: 15, rarity: 'common' },
  BIOMETRIC_SCANNER: { id: 'biometric_scanner', name: 'Biometric Scanner', type: 'material', icon: '👁️', stackable: true, value: 50, rarity: 'uncommon' },
  NEURAL_IMPLANT: { id: 'neural_implant', name: 'Neural Implant', type: 'material', icon: '🧬', stackable: true, value: 100, rarity: 'uncommon' },
  SYNTHETIC_MUSCLE: { id: 'synthetic_muscle', name: 'Synthetic Muscle', type: 'material', icon: '💪', stackable: true, value: 75, rarity: 'uncommon' },
  ENCRYPTED_DATA: { id: 'encrypted_data', name: 'Encrypted Data', type: 'material', icon: '🔒', stackable: true, value: 30, rarity: 'common' },
  ICE_FRAGMENT: { id: 'ice_fragment', name: 'ICE Fragment', type: 'material', icon: '❄️', stackable: true, value: 40, rarity: 'common' },
  DAEMON_CODE: { id: 'daemon_code', name: 'Daemon Code', type: 'material', icon: '👾', stackable: true, value: 60, rarity: 'uncommon' },
  NET_ARTIFACT: { id: 'net_artifact', name: 'NET Artifact', type: 'material', icon: '🌐', stackable: true, value: 200, rarity: 'rare' },
  STOLEN_INTEL: { id: 'stolen_intel', name: 'Stolen Intel', type: 'material', icon: '📋', stackable: true, value: 45, rarity: 'common' },
  CONTRABAND: { id: 'contraband', name: 'Contraband', type: 'material', icon: '🚫', stackable: true, value: 80, rarity: 'uncommon' },
  VEHICLE_PARTS: { id: 'vehicle_parts', name: 'Vehicle Parts', type: 'material', icon: '🔧', stackable: true, value: 55, rarity: 'common' },
  DRONE_CHASSIS: { id: 'drone_chassis', name: 'Drone Chassis', type: 'material', icon: '🤖', stackable: true, value: 90, rarity: 'uncommon' },
  BIO_SAMPLE: { id: 'bio_sample', name: 'Bio Sample', type: 'material', icon: '🧪', stackable: true, value: 35, rarity: 'common' },
  STREET_CRED_TOKEN: { id: 'street_cred_token', name: 'Street Cred Token', type: 'material', icon: '🏅', stackable: true, value: 20, rarity: 'common' },

  // Weapons
  PISTOL: { id: 'pistol', name: 'Kinetic Pistol', type: 'weapon', icon: '🔫', damage: 5, stackable: false, value: 500, rarity: 'common' },
  RIFLE: { id: 'rifle', name: 'Sniper Rifle', type: 'weapon', icon: '🎯', damage: 15, stackable: false, value: 2000, rarity: 'rare' },
  MELEE: { id: 'melee', name: 'Katana', type: 'weapon', icon: '⚔️', damage: 10, stackable: false, value: 1200, rarity: 'uncommon' },
  SMART_PISTOL: { id: 'smart_pistol', name: 'Smart Pistol', type: 'weapon', icon: '🔫', damage: 8, stackable: false, value: 800, rarity: 'uncommon' },
  MONOWIRE: { id: 'monowire', name: 'Monowire', type: 'weapon', icon: '〰️', damage: 12, stackable: false, value: 1500, rarity: 'rare' },

  // Armor/Cyberware
  KEVLAR_BODYSUIT: { id: 'kevlar_bodysuit', name: 'Kevlar Bodysuit', type: 'armor', icon: '🦺', defense: 5, stackable: false, value: 800, rarity: 'common' },
  MILITARY_GRADE_IMPLANT: { id: 'military_grade_implant', name: 'Military Grade Implant', type: 'cyberware', icon: '🦾', defense: 10, damage: 3, stackable: false, value: 3000, rarity: 'rare' },
  SUBDERMAL_ARMOR: { id: 'subdermal_armor', name: 'Subdermal Armor', type: 'armor', icon: '🛡️', defense: 8, stackable: false, value: 1500, rarity: 'uncommon' },

   // Consumables
   HEALING_NANOBOTS: { id: 'healing_nanobots', name: 'Healing Nanobots', type: 'consumable', icon: '🔬', stackable: true, value: 150, rarity: 'common' },
   COMBAT_STIM: { id: 'combat_stim', name: 'Combat Stim', type: 'consumable', icon: '💉', stackable: true, value: 200, rarity: 'uncommon' },

   // Crafting outputs / Advanced items
   DECRYPTION_KEY: { id: 'decryption_key', name: 'Decryption Key', type: 'material', icon: '🔑', stackable: true, value: 500, rarity: 'rare' },
   CORPORATE_BLACKMAIL: { id: 'corporate_blackmail', name: 'Corporate Blackmail', type: 'material', icon: '📂', stackable: true, value: 1500, rarity: 'rare' },
   NEURAL_DAEMON: { id: 'neural_daemon', name: 'Neural Daemon', type: 'cyberware', icon: '👾', damage: 5, defense: 8, parallelHacking: true, stackable: false, value: 3000, rarity: 'rare' },
   ICE_SHIELD: { id: 'ice_shield', name: 'ICE Shield', type: 'armor', icon: '❄️', defense: 12, stackable: false, value: 2000, rarity: 'rare' },
   ARMORED_PLATING: { id: 'armored_plating', name: 'Armored Plating', type: 'armor', icon: '🛡️', defense: 10, stackable: false, value: 2500, rarity: 'rare' },
   COMBAT_DRONE: { id: 'combat_drone', name: 'Combat Drone', type: 'cyberware', icon: '🤖', damage: 8, defense: 0, stackable: false, value: 2800, rarity: 'rare' },
   FIXER_LICENSE: { id: 'fixer_license', name: 'Fixer License', type: 'material', icon: '📜', stackable: true, value: 5000, rarity: 'epic' },
   BLACK_MARKET_BUNDLE: { id: 'black_market_bundle', name: 'Black Market Bundle', type: 'material', icon: '📦', stackable: true, value: 3000, rarity: 'rare' },

    // Passive bonus equipment (grind enhancers & speed boosters)
    XP_BOOST_CHIP: { id: 'xp_boost_chip', name: 'XP Boost Chip', type: 'cyberware', icon: '⚡', damage: 0, defense: 0, xpBoost: 0.10, stackable: false, value: 4000, rarity: 'epic', description: '+10% XP gain' },
    SPEED_PROCESSOR: { id: 'speed_processor', name: 'Speed Processor', type: 'cyberware', icon: '⏱️', damage: 0, defense: 0, speedBoost: 0.15, stackable: false, value: 5000, rarity: 'epic', description: '-15% action duration' },
    LOOT_ENHANCER: { id: 'loot_enhancer', name: 'Loot Enhancer Module', type: 'cyberware', icon: '💎', damage: 0, defense: 0, lootBoost: 0.20, stackable: false, value: 6000, rarity: 'epic', description: '+20% item drops' },
    WEALTH_ACCUMULATOR: { id: 'wealth_accumulator', name: 'Wealth Accumulator', type: 'cyberware', icon: '💰', damage: 0, defense: 0, currencyBoost: 0.25, stackable: false, value: 7000, rarity: 'epic', description: '+25% currency gain' },

    // Legendary equipment (Tier 4 endgame)
    LEGENDARY_BLADE: { id: 'legendary_blade', name: 'Legendary Mantis Blade', type: 'weapon', icon: '⚡', damage: 20, lifeSteal: 0.10, stackable: false, value: 8000, rarity: 'legendary', description: '+20 damage, life steal 10%' },
    QUANTUM_IMPLANT: { id: 'quantum_implant', name: 'Quantum Processing Implant', type: 'cyberware', icon: '🧠', damage: 15, defense: 15, xpBoost: 0.05, parallelHacking: true, stackable: false, value: 12000, rarity: 'legendary', description: '+15 damage, +15 defense, XP boost +5%, parallel hacking' },
    NEURAL_ACCELERATOR: { id: 'neural_accelerator', name: 'Neural Time Accelerator', type: 'cyberware', icon: '⏱️', damage: 0, defense: 0, speedBoost: 0.25, stackable: false, value: 15000, rarity: 'legendary', description: 'Skill cooldown -20%, actions +25% speed' },

    // New epic crafting materials
    ENCRYPTED_CORE_SHARD: { id: 'encrypted_core_shard', name: 'Encrypted Core Shard', type: 'material', icon: '🔶', stackable: true, value: 500, rarity: 'epic', description: 'A crystallized fragment of encrypted data from deep NET layers' },
    PROTOTYPE_NEXUS: { id: 'prototype_nexus', name: 'Prototype Nexus Core', type: 'material', icon: '⚛️', stackable: false, value: 2000, rarity: 'epic', description: 'Experimental quantum processing core from a forgotten lab' },

    // New legendary equipment
    PLASMA_RIFLE: { id: 'plasma_rifle', name: 'Legendary Plasma Rifle', type: 'weapon', icon: '🔥', damage: 22, stackable: false, value: 10000, rarity: 'legendary', description: '+22 damage, chance to deal double damage' },
    OBSIDIAN_PLATING: { id: 'obsidian_plating', name: 'Obsidian Combat Armor', type: 'armor', icon: '🖤', defense: 15, stackable: false, value: 9000, rarity: 'legendary', description: '+15 defense, reduces all damage by 15%' },
    CHRONO_ARMOR: { id: 'chrono_armor', name: 'Chrono-Infused Armor', type: 'armor', icon: '⏳', defense: 13, speedBoost: 0.25, stackable: false, value: 8500, rarity: 'legendary', description: '+13 defense, -25% action duration' },
    GODLIKE_IMPLANT: { id: 'godlike_implant', name: 'Godlike Quantum Core', type: 'cyberware', icon: '⭐', damage: 10, defense: 10, xpBoost: 0.20, lootBoost: 0.30, currencyBoost: 0.20, parallelHacking: true, stackable: false, value: 15000, rarity: 'legendary', description: '+20% XP, +20% currency, +30% loot drops, parallel hacking' },
    NEURAL_NEXUS: { id: 'neural_nexus', name: 'Neural Nexus Hub', type: 'cyberware', icon: '🧠', damage: 0, defense: 8, xpBoost: 0.15, parallelHacking: true, stackable: false, value: 13000, rarity: 'legendary', description: '+15% XP to all skills, +8 defense, parallel hacking' },

    // Parallel hacking enabler (mid-tier entry point)
    MULTITHREADED_LINK: { id: 'multithreaded_link', name: 'Multithreaded Neural Link', type: 'cyberware', icon: '🔗', damage: 0, defense: 2, parallelHacking: true, stackable: false, value: 2500, rarity: 'uncommon', description: '+2 defense, enables background hacking while doing other activities' },
};

// Enemy definitions
export const ENEMIES = {
  STREET_GANG: {
    id: 'street_gang', name: 'Street Gang Member',
    hp: 20, damage: 3, xpReward: 50,
    loot: { 'eurodollar': { min: 50, max: 150 }, 'data_shard': { min: 1, max: 3 } },
  },
  CORPO_MERC: {
    id: 'corpo_merc', name: 'Corporate Mercenary',
    hp: 50, damage: 8, xpReward: 200,
    loot: { 'eurodollar': { min: 200, max: 500 }, 'circuit_board': { min: 2, max: 5 } },
  },
  CYBERPSYCHO: {
    id: 'cyberpsycho', name: 'Cyberpsycho',
    hp: 100, damage: 15, xpReward: 500,
    loot: { 'eurodollar': { min: 500, max: 1500 }, 'neural_implant': { min: 1, max: 3 }, 'chrome_scrap': { min: 5, max: 15 } },
  },
  BLACK_ICE: {
    id: 'black_ice', name: 'Black ICE',
    hp: 75, damage: 12, xpReward: 300,
    loot: { 'data_shard': { min: 5, max: 10 }, 'circuit_board': { min: 3, max: 8 }, 'eurodollar': { min: 100, max: 400 } },
  },
  ROGUE_AI: {
    id: 'rogue_ai', name: 'Rogue AI',
    hp: 150, damage: 20, xpReward: 800,
    loot: { 'eurodollar': { min: 1000, max: 3000 }, 'net_artifact': { min: 1, max: 2 }, 'daemon_code': { min: 3, max: 8 } },
  },
  ARASAKA_GUARD: {
    id: 'arasaka_guard', name: 'Arasaka Guard',
    hp: 60, damage: 10, xpReward: 250,
    loot: { 'eurodollar': { min: 300, max: 700 }, 'biometric_scanner': { min: 1, max: 2 } },
  },
  ELITE_CORPO: {
    id: 'elite_corpo', name: 'Elite Corporate Agent',
    hp: 120, damage: 18, xpReward: 600,
    loot: { 'eurodollar': { min: 1000, max: 3000 }, 'biometric_scanner': { min: 2, max: 4 }, 'stolen_intel': { min: 1, max: 2 } },
  },
  NETRUNNER_AI: {
    id: 'netrunner_ai', name: 'Netrunner AI',
    hp: 200, damage: 25, xpReward: 1200,
    loot: { 'net_artifact': { min: 2, max: 4 }, 'daemon_code': { min: 5, max: 10 }, 'eurodollar': { min: 2000, max: 5000 } },
  },
  MEGA_CORP_BOSS: {
    id: 'mega_corp_boss', name: 'Megacorp Executive',
    hp: 250, damage: 30, xpReward: 2000,
    loot: { 'eurodollar': { min: 5000, max: 15000 }, 'net_artifact': { min: 3, max: 6 }, 'biometric_scanner': { min: 3, max: 5 } },
  },
  SOULKILLER_AI: {
    id: 'soulkiller_ai', name: 'Soulkiller AI',
    hp: 300, damage: 35, xpReward: 3000,
    loot: { 'eurodollar': { min: 8000, max: 20000 }, 'net_artifact': { min: 4, max: 8 }, 'daemon_code': { min: 5, max: 12 }, 'neural_implant': { min: 2, max: 4 } },
  },
  BLACKWALL_ENTITY: {
    id: 'blackwall_entity', name: 'Blackwall Entity',
    hp: 400, damage: 40, xpReward: 5000,
    loot: { 'eurodollar': { min: 12000, max: 30000 }, 'net_artifact': { min: 6, max: 12 }, 'daemon_code': { min: 8, max: 16 }, 'ice_fragment': { min: 10, max: 20 } },
  },

  // Boss Enemies (special mechanics: isBoss flag, higher rewards)
  ROGUE_NETRUNNER: {
    id: 'rogue_netrunner', name: 'Rogue Netrunner (Boss)',
    hp: 280, damage: 28, xpReward: 2500, isBoss: true, evasion: 0.15,
    loot: { 'net_artifact': { min: 5, max: 10 }, 'daemon_code': { min: 10, max: 20 }, 'neural_implant': { min: 3, max: 6 }, 'eurodollar': { min: 5000, max: 15000 } },
  },
  NEON_SAMURAI: {
    id: 'neon_samurai', name: 'Neon Samurai (Boss)',
    hp: 320, damage: 32, xpReward: 3000, isBoss: true, phase2_trigger: 0.5,
    loot: { 'chrome_scrap': { min: 20, max: 40 }, 'neural_implant': { min: 5, max: 10 }, 'synthetic_muscle': { min: 10, max: 20 }, 'eurodollar': { min: 8000, max: 20000 } },
  },
  CORPORATE_TYRANT: {
    id: 'corporate_tyrant', name: 'Corporate Tyrant CEO (Boss)',
    hp: 350, damage: 35, xpReward: 3500, isBoss: true, phase2_trigger: 0.3, lifeSteal: 0.10,
    loot: { 'biometric_scanner': { min: 8, max: 15 }, 'stolen_intel': { min: 10, max: 25 }, 'net_artifact': { min: 8, max: 12 }, 'eurodollar': { min: 10000, max: 30000 } },
  },
  DIGITAL_PHANTOM: {
    id: 'digital_phantom', name: 'Digital Phantom (Boss)',
    hp: 250, damage: 22, xpReward: 2800, isBoss: true, evasion: 0.20,
    loot: { 'daemon_code': { min: 15, max: 30 }, 'net_artifact': { min: 10, max: 15 }, 'eurodollar': { min: 7000, max: 18000 } },
  },
  CHROME_WRAITH: {
    id: 'chrome_wraith', name: 'Chrome Wraith (Boss)',
    hp: 400, damage: 40, xpReward: 4000, isBoss: true, phase2_trigger: 0.5, lifeSteal: 0.15,
    loot: { 'neural_implant': { min: 10, max: 20 }, 'chrome_scrap': { min: 25, max: 50 }, 'net_artifact': { min: 12, max: 20 }, 'eurodollar': { min: 15000, max: 40000 } },
  },
};

// ==========================================
// Activities/Actions for ALL 24 skills
// ==========================================
export const ACTIVITIES = {
  // ---- HACKING ----
   intrusion: [
    {
      id: 'easy_hack', name: 'Hack Corporate Terminal', level: 1, duration: 5, xp: 15, masteryXp: 5,
      rewards: { items: { 'data_shard': { min: 1, max: 3 } }, currency: { min: 10, max: 50 } },
    },
    {
      id: 'medium_hack', name: 'Breach Security System', level: 15, duration: 10, xp: 45, masteryXp: 15,
      rewards: { items: { 'data_shard': { min: 3, max: 8 }, 'circuit_board': { min: 1, max: 2 } }, currency: { min: 50, max: 200 } },
    },
    {
      id: 'hard_hack', name: 'Penetrate Megacorp Matrix', level: 40, duration: 20, xp: 150, masteryXp: 50,
      rewards: { items: { 'data_shard': { min: 5, max: 15 }, 'circuit_board': { min: 2, max: 5 } }, currency: { min: 200, max: 800 } },
    },
    {
      id: 'elite_hack', name: 'Crack Arasaka Mainframe', level: 70, duration: 30, xp: 400, masteryXp: 100,
      rewards: { items: { 'data_shard': { min: 10, max: 25 }, 'neural_implant': { min: 1, max: 2 } }, currency: { min: 500, max: 2000 } },
    },
    {
      id: 'legendary_hack', name: 'Breach Netrunner Consciousness', level: 90, duration: 40, xp: 800, masteryXp: 200,
      rewards: { items: { 'data_shard': { min: 20, max: 40 }, 'net_artifact': { min: 1, max: 3 }, 'daemon_code': { min: 2, max: 5 } }, currency: { min: 2000, max: 8000 } },
    },
  ],

   decryption: [
     {
       id: 'basic_decrypt', name: 'Decrypt Low-Grade Data', level: 1, duration: 6, xp: 12, masteryXp: 4,
       rewards: { items: { 'encrypted_data': { min: 1, max: 2 } }, currency: { min: 15, max: 40 } },
     },
     {
       id: 'mid_decrypt', name: 'Crack Military Cipher', level: 20, duration: 12, xp: 50, masteryXp: 18,
       rewards: { items: { 'encrypted_data': { min: 2, max: 5 }, 'stolen_intel': { min: 1, max: 2 } }, currency: { min: 60, max: 250 } },
     },
     {
       id: 'hard_decrypt', name: 'Break Quantum Encryption', level: 50, duration: 25, xp: 180, masteryXp: 60,
       rewards: { items: { 'encrypted_data': { min: 5, max: 10 }, 'stolen_intel': { min: 2, max: 4 } }, currency: { min: 200, max: 700 } },
     },
     {
       id: 'elite_decrypt', name: 'Decode Arasaka Protocol', level: 70, duration: 35, xp: 420, masteryXp: 120,
       rewards: { items: { 'encrypted_data': { min: 10, max: 20 }, 'stolen_intel': { min: 3, max: 6 }, 'neural_implant': { min: 1, max: 2 } }, currency: { min: 600, max: 2500 } },
     },
     {
       id: 'legendary_decrypt', name: 'Crack Megacorp AI Mind', level: 90, duration: 45, xp: 900, masteryXp: 250,
       rewards: { items: { 'encrypted_data': { min: 20, max: 40 }, 'net_artifact': { min: 1, max: 3 }, 'daemon_code': { min: 3, max: 6 } }, currency: { min: 3000, max: 10000 } },
     },
   ],

   ice_breaking: [
     {
       id: 'weak_ice', name: 'Break Weak ICE', level: 1, duration: 7, xp: 14, masteryXp: 5,
       rewards: { items: { 'ice_fragment': { min: 1, max: 3 } }, currency: { min: 20, max: 60 } },
     },
     {
       id: 'medium_ice', name: 'Crack Corporate ICE', level: 25, duration: 14, xp: 55, masteryXp: 20,
       rewards: { items: { 'ice_fragment': { min: 3, max: 6 }, 'circuit_board': { min: 1, max: 3 } }, currency: { min: 80, max: 300 } },
     },
     {
       id: 'black_ice_break', name: 'Shatter Black ICE', level: 55, duration: 25, xp: 200, masteryXp: 65,
       rewards: { items: { 'ice_fragment': { min: 5, max: 12 }, 'neural_implant': { min: 0, max: 1 } }, currency: { min: 300, max: 900 } },
     },
     {
       id: 'elite_ice_break', name: 'Dismantle Elite ICE Fortress', level: 70, duration: 40, xp: 420, masteryXp: 140,
       rewards: { items: { 'ice_fragment': { min: 12, max: 25 }, 'circuit_board': { min: 3, max: 6 } }, currency: { min: 800, max: 2500 } },
     },
     {
       id: 'legendary_ice_break', name: 'Breach Netrunner ICE Lattice', level: 90, duration: 55, xp: 900, masteryXp: 300,
       rewards: { items: { 'ice_fragment': { min: 25, max: 50 }, 'net_artifact': { min: 1, max: 3 } }, currency: { min: 3000, max: 10000 } },
     },
   ],

   daemon_coding: [
     {
       id: 'simple_daemon', name: 'Code Simple Daemon', level: 1, duration: 8, xp: 16, masteryXp: 6,
       rewards: { items: { 'daemon_code': { min: 1, max: 2 } }, currency: { min: 15, max: 50 } },
     },
     {
       id: 'complex_daemon', name: 'Code Complex Daemon', level: 30, duration: 18, xp: 70, masteryXp: 25,
       rewards: { items: { 'daemon_code': { min: 2, max: 5 } }, currency: { min: 80, max: 300 } },
     },
     {
       id: 'ai_daemon', name: 'Code AI-Enhanced Daemon', level: 60, duration: 30, xp: 250, masteryXp: 80,
       rewards: { items: { 'daemon_code': { min: 4, max: 10 }, 'net_artifact': { min: 0, max: 1 } }, currency: { min: 250, max: 1000 } },
     },
     {
       id: 'elite_daemon', name: 'Design Netrunner-Grade Daemon', level: 70, duration: 45, xp: 520, masteryXp: 170,
       rewards: { items: { 'daemon_code': { min: 10, max: 20 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 1000, max: 3500 } },
     },
     {
       id: 'legendary_daemon', name: 'Architect Omniscient Daemon', level: 90, duration: 60, xp: 1100, masteryXp: 350,
       rewards: { items: { 'daemon_code': { min: 20, max: 40 }, 'net_artifact': { min: 2, max: 5 } }, currency: { min: 4000, max: 12000 } },
     },
   ],

  // ---- NETRUNNING ----
   deep_dive: [
     {
       id: 'shallow_dive', name: 'Shallow NET Dive', level: 1, duration: 8, xp: 14, masteryXp: 5,
       rewards: { items: { 'data_shard': { min: 1, max: 3 } }, currency: { min: 10, max: 40 } },
     },
     {
       id: 'mid_dive', name: 'Mid-Layer Exploration', level: 20, duration: 15, xp: 55, masteryXp: 20,
       rewards: { items: { 'data_shard': { min: 3, max: 7 }, 'net_artifact': { min: 0, max: 1 } }, currency: { min: 50, max: 200 } },
     },
     {
       id: 'deep_net_dive', name: 'Deep NET Expedition', level: 50, duration: 30, xp: 200, masteryXp: 65,
       rewards: { items: { 'net_artifact': { min: 1, max: 3 }, 'daemon_code': { min: 2, max: 5 } }, currency: { min: 200, max: 800 } },
     },
     {
       id: 'abyss_dive', name: 'Abyss Delve (Netrunner Zone)', level: 70, duration: 45, xp: 440, masteryXp: 150,
       rewards: { items: { 'net_artifact': { min: 3, max: 7 }, 'daemon_code': { min: 5, max: 12 } }, currency: { min: 800, max: 3000 } },
     },
     {
       id: 'void_dive', name: 'Void Abyss Expedition', level: 90, duration: 60, xp: 950, masteryXp: 320,
       rewards: { items: { 'net_artifact': { min: 6, max: 12 }, 'daemon_code': { min: 10, max: 20 } }, currency: { min: 3500, max: 12000 } },
     },
   ],

   data_mining: [
     {
       id: 'basic_mine', name: 'Harvest Surface Data', level: 1, duration: 4, xp: 10, masteryXp: 4,
       rewards: { items: { 'data_shard': { min: 1, max: 2 } }, currency: { min: 5, max: 20 } },
     },
     {
       id: 'deep_mine', name: 'Deep NET Extraction', level: 20, duration: 10, xp: 45, masteryXp: 16,
       rewards: { items: { 'data_shard': { min: 3, max: 8 }, 'circuit_board': { min: 1, max: 3 } }, currency: { min: 30, max: 150 } },
     },
     {
       id: 'elite_mine', name: 'Quantum Data Harvest', level: 50, duration: 20, xp: 170, masteryXp: 55,
       rewards: { items: { 'data_shard': { min: 8, max: 20 }, 'net_artifact': { min: 0, max: 1 } }, currency: { min: 150, max: 600 } },
     },
     {
       id: 'master_mine', name: 'Mega-Scale Quantum Extraction', level: 70, duration: 30, xp: 380, masteryXp: 130,
       rewards: { items: { 'data_shard': { min: 20, max: 40 }, 'circuit_board': { min: 3, max: 7 } }, currency: { min: 600, max: 2500 } },
     },
     {
       id: 'omniscient_mine', name: 'Universal Data Synthesis', level: 90, duration: 42, xp: 820, masteryXp: 280,
       rewards: { items: { 'data_shard': { min: 40, max: 80 }, 'net_artifact': { min: 2, max: 4 } }, currency: { min: 3000, max: 10000 } },
     },
   ],

    black_ice_combat: [
      {
        id: 'fight_weak_ice', name: 'Fight Weak Black ICE', level: 1, enemy: 'black_ice', xp: 25, masteryXp: 10,
      },
      {
        id: 'fight_rogue_ai', name: 'Fight Rogue AI', level: 40, enemy: 'rogue_ai', xp: 120, masteryXp: 45,
      },
      {
        id: 'fight_netrunner_ai', name: 'Duel Netrunner AI', level: 70, enemy: 'netrunner_ai', xp: 350, masteryXp: 120,
      },
      {
        id: 'fight_mega_boss', name: 'Face Megacorp Nexus AI', level: 80, enemy: 'mega_corp_boss', xp: 600, masteryXp: 200,
      },
      {
        id: 'fight_blackwall', name: 'Breach Blackwall Entity', level: 90, enemy: 'blackwall_entity', xp: 1500, masteryXp: 500,
      },
      {
        id: 'fight_digital_phantom', name: 'Face Digital Phantom (Boss)', level: 88, enemy: 'digital_phantom', xp: 2800, masteryXp: 900,
      },
      {
        id: 'fight_chrome_wraith', name: 'Confront Chrome Wraith (Boss)', level: 95, enemy: 'chrome_wraith', xp: 4000, masteryXp: 1500,
      },
    ],

   neural_surfing: [
     {
       id: 'casual_surf', name: 'Casual NET Surf', level: 1, duration: 5, xp: 10, masteryXp: 4,
       rewards: { items: { 'data_shard': { min: 1, max: 2 } }, currency: { min: 5, max: 25 } },
     },
     {
       id: 'speed_surf', name: 'Speed Surfing', level: 15, duration: 8, xp: 35, masteryXp: 12,
       rewards: { items: { 'data_shard': { min: 2, max: 5 } }, currency: { min: 25, max: 100 } },
     },
     {
       id: 'deep_surf', name: 'Deep Layer Surfing', level: 40, duration: 15, xp: 120, masteryXp: 40,
       rewards: { items: { 'net_artifact': { min: 0, max: 1 }, 'data_shard': { min: 5, max: 10 } }, currency: { min: 100, max: 400 } },
     },
     {
       id: 'phantom_surf', name: 'Phantom Speed Run', level: 70, duration: 25, xp: 300, masteryXp: 110,
       rewards: { items: { 'net_artifact': { min: 1, max: 2 }, 'daemon_code': { min: 2, max: 5 } }, currency: { min: 500, max: 2000 } },
     },
     {
       id: 'void_surf', name: 'Void Hyperspace Traverse', level: 90, duration: 35, xp: 700, masteryXp: 250,
       rewards: { items: { 'net_artifact': { min: 2, max: 5 }, 'daemon_code': { min: 5, max: 10 } }, currency: { min: 2500, max: 8000 } },
     },
   ],

  // ---- STREET ----
    combat: [
      {
        id: 'gang_fight', name: 'Street Fight', level: 1, enemy: 'street_gang', xp: 30, masteryXp: 10,
      },
      {
        id: 'merc_fight', name: 'Corporate Merc Battle', level: 25, enemy: 'corpo_merc', xp: 100, masteryXp: 40,
      },
      {
        id: 'psycho_fight', name: 'Cyberpsycho Takedown', level: 55, enemy: 'cyberpsycho', xp: 300, masteryXp: 100,
      },
      {
        id: 'elite_fight', name: 'Battle Elite Corporate Agent', level: 70, enemy: 'elite_corpo', xp: 320, masteryXp: 115,
      },
      {
        id: 'mega_fight', name: 'Raid Megacorp Executive', level: 80, enemy: 'mega_corp_boss', xp: 600, masteryXp: 200,
      },
      {
        id: 'soulkiller_fight', name: 'Hack Soulkiller AI', level: 90, enemy: 'soulkiller_ai', xp: 1200, masteryXp: 400,
      },
      {
        id: 'fight_rogue_netrunner', name: 'Duel Rogue Netrunner (Boss)', level: 85, enemy: 'rogue_netrunner', xp: 2500, masteryXp: 800,
      },
      {
        id: 'fight_neon_samurai', name: 'Battle Neon Samurai (Boss)', level: 88, enemy: 'neon_samurai', xp: 3000, masteryXp: 1000,
      },
      {
        id: 'fight_corporate_tyrant', name: 'Confront Corporate Tyrant (Boss)', level: 92, enemy: 'corporate_tyrant', xp: 3500, masteryXp: 1200,
      },
    ],

   stealth: [
     {
       id: 'pickpocket', name: 'Pickpocket Target', level: 1, duration: 6, xp: 12, masteryXp: 5,
       rewards: { items: {}, currency: { min: 20, max: 100 } },
     },
     {
       id: 'infiltrate', name: 'Infiltrate Building', level: 20, duration: 15, xp: 50, masteryXp: 18,
       rewards: { items: { 'stolen_intel': { min: 1, max: 3 }, 'data_shard': { min: 1, max: 3 } }, currency: { min: 80, max: 300 } },
     },
     {
       id: 'ghost_run', name: 'Ghost Run (Zero Trace)', level: 50, duration: 25, xp: 180, masteryXp: 60,
       rewards: { items: { 'stolen_intel': { min: 3, max: 7 }, 'biometric_scanner': { min: 0, max: 1 } }, currency: { min: 300, max: 900 } },
     },
     {
       id: 'phantom_infiltration', name: 'Phantom Corpo Infiltration', level: 70, duration: 35, xp: 400, masteryXp: 140,
       rewards: { items: { 'stolen_intel': { min: 7, max: 15 }, 'biometric_scanner': { min: 1, max: 3 } }, currency: { min: 1000, max: 3500 } },
     },
     {
       id: 'shadow_legend', name: 'Shadow Protocol Breach', level: 90, duration: 50, xp: 850, masteryXp: 300,
       rewards: { items: { 'stolen_intel': { min: 15, max: 30 }, 'biometric_scanner': { min: 2, max: 5 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 4000, max: 12000 } },
     },
   ],

   street_cred: [
     {
       id: 'do_favors', name: 'Do Favors for Locals', level: 1, duration: 8, xp: 12, masteryXp: 5,
       rewards: { items: { 'street_cred_token': { min: 1, max: 2 } }, currency: { min: 10, max: 40 } },
     },
     {
       id: 'gang_work', name: 'Gang Contract Work', level: 15, duration: 12, xp: 40, masteryXp: 15,
       rewards: { items: { 'street_cred_token': { min: 2, max: 4 } }, currency: { min: 50, max: 200 } },
     },
     {
       id: 'legend_mission', name: 'Legendary Mission', level: 45, duration: 25, xp: 160, masteryXp: 55,
       rewards: { items: { 'street_cred_token': { min: 5, max: 10 } }, currency: { min: 200, max: 800 } },
     },
     {
       id: 'godfather_mission', name: 'Godfather Contract', level: 70, duration: 40, xp: 420, masteryXp: 150,
       rewards: { items: { 'street_cred_token': { min: 10, max: 20 } }, currency: { min: 800, max: 3000 } },
     },
     {
       id: 'immortal_legend', name: 'Immortal Legend Quest', level: 90, duration: 55, xp: 950, masteryXp: 330,
       rewards: { items: { 'street_cred_token': { min: 20, max: 40 } }, currency: { min: 3500, max: 12000 } },
     },
   ],

   smuggling: [
     {
       id: 'small_run', name: 'Small Smuggling Run', level: 1, duration: 8, xp: 14, masteryXp: 5,
       rewards: { items: { 'contraband': { min: 1, max: 2 } }, currency: { min: 30, max: 80 } },
     },
     {
       id: 'medium_run', name: 'Cross-District Run', level: 20, duration: 15, xp: 55, masteryXp: 20,
       rewards: { items: { 'contraband': { min: 2, max: 5 } }, currency: { min: 100, max: 400 } },
     },
     {
       id: 'big_run', name: 'International Smuggling', level: 50, duration: 30, xp: 200, masteryXp: 70,
       rewards: { items: { 'contraband': { min: 5, max: 12 } }, currency: { min: 400, max: 1500 } },
     },
     {
       id: 'mega_run', name: 'Megacorp Black Market Operation', level: 70, duration: 45, xp: 450, masteryXp: 160,
       rewards: { items: { 'contraband': { min: 12, max: 25 } }, currency: { min: 1200, max: 4000 } },
     },
     {
       id: 'legendary_run', name: 'Continental Contraband Network', level: 90, duration: 60, xp: 1000, masteryXp: 350,
       rewards: { items: { 'contraband': { min: 25, max: 50 } }, currency: { min: 5000, max: 15000 } },
     },
   ],

  // ---- TECH ----
   cyberware_crafting: [
     {
       id: 'basic_implant', name: 'Craft Basic Implant', level: 1, duration: 10, xp: 20, masteryXp: 8,
       rewards: { items: { 'chrome_scrap': { min: 1, max: 3 } }, currency: { min: 15, max: 50 } },
     },
     {
       id: 'mid_implant', name: 'Craft Military Implant', level: 25, duration: 20, xp: 70, masteryXp: 25,
       rewards: { items: { 'chrome_scrap': { min: 3, max: 7 }, 'synthetic_muscle': { min: 1, max: 2 } }, currency: { min: 80, max: 300 } },
     },
     {
       id: 'elite_implant', name: 'Craft Elite Cyberware', level: 55, duration: 35, xp: 250, masteryXp: 80,
       rewards: { items: { 'neural_implant': { min: 1, max: 3 }, 'synthetic_muscle': { min: 2, max: 5 } }, currency: { min: 300, max: 1000 } },
     },
     {
       id: 'legendary_implant', name: 'Forge Legendary Cyberware', level: 70, duration: 50, xp: 520, masteryXp: 180,
       rewards: { items: { 'neural_implant': { min: 3, max: 6 }, 'synthetic_muscle': { min: 5, max: 10 } }, currency: { min: 1000, max: 3500 } },
     },
     {
       id: 'godlike_implant', name: 'Engineer Godlike Enhancements', level: 90, duration: 65, xp: 1150, masteryXp: 400,
       rewards: { items: { 'neural_implant': { min: 6, max: 12 }, 'synthetic_muscle': { min: 10, max: 20 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 4000, max: 12000 } },
     },
   ],

   weapon_modding: [
     {
       id: 'basic_mod', name: 'Basic Weapon Tune', level: 1, duration: 8, xp: 16, masteryXp: 6,
       rewards: { items: { 'chrome_scrap': { min: 1, max: 2 } }, currency: { min: 20, max: 60 } },
     },
     {
       id: 'smart_mod', name: 'Smart Weapon Mod', level: 25, duration: 15, xp: 60, masteryXp: 22,
       rewards: { items: { 'chrome_scrap': { min: 2, max: 5 }, 'circuit_board': { min: 1, max: 2 } }, currency: { min: 70, max: 250 } },
     },
     {
       id: 'legendary_mod', name: 'Legendary Weapon Mod', level: 55, duration: 30, xp: 220, masteryXp: 75,
       rewards: { items: { 'chrome_scrap': { min: 5, max: 10 }, 'neural_implant': { min: 0, max: 1 } }, currency: { min: 250, max: 900 } },
     },
     {
       id: 'exotic_mod', name: 'Exotic Weapon Engineering', level: 70, duration: 40, xp: 480, masteryXp: 170,
       rewards: { items: { 'chrome_scrap': { min: 10, max: 20 }, 'circuit_board': { min: 3, max: 6 } }, currency: { min: 1000, max: 3500 } },
     },
     {
       id: 'divine_mod', name: 'Divine Weapon Transcendence', level: 90, duration: 55, xp: 1050, masteryXp: 370,
       rewards: { items: { 'chrome_scrap': { min: 20, max: 40 }, 'neural_implant': { min: 2, max: 4 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 4500, max: 14000 } },
     },
   ],

   vehicle_tuning: [
     {
       id: 'basic_tune', name: 'Basic Vehicle Tune', level: 1, duration: 10, xp: 16, masteryXp: 6,
       rewards: { items: { 'vehicle_parts': { min: 1, max: 3 } }, currency: { min: 20, max: 60 } },
     },
     {
       id: 'turbo_tune', name: 'Turbo Engine Upgrade', level: 25, duration: 18, xp: 60, masteryXp: 22,
       rewards: { items: { 'vehicle_parts': { min: 3, max: 6 } }, currency: { min: 80, max: 300 } },
     },
     {
       id: 'armored_tune', name: 'Armored Vehicle Mod', level: 50, duration: 30, xp: 200, masteryXp: 65,
       rewards: { items: { 'vehicle_parts': { min: 5, max: 12 }, 'chrome_scrap': { min: 2, max: 5 } }, currency: { min: 250, max: 800 } },
     },
     {
       id: 'hypertech_tune', name: 'Hypertech Vehicle Transformation', level: 70, duration: 45, xp: 440, masteryXp: 155,
       rewards: { items: { 'vehicle_parts': { min: 12, max: 25 }, 'chrome_scrap': { min: 5, max: 10 } }, currency: { min: 1000, max: 3500 } },
     },
     {
       id: 'godspeed_tune', name: 'Godspeed Ultimate Rig', level: 90, duration: 60, xp: 980, masteryXp: 340,
       rewards: { items: { 'vehicle_parts': { min: 25, max: 50 }, 'chrome_scrap': { min: 10, max: 20 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 4500, max: 13000 } },
     },
   ],

   drone_engineering: [
     {
       id: 'scout_drone', name: 'Build Scout Drone', level: 1, duration: 10, xp: 18, masteryXp: 7,
       rewards: { items: { 'drone_chassis': { min: 0, max: 1 }, 'circuit_board': { min: 1, max: 2 } }, currency: { min: 25, max: 70 } },
     },
     {
       id: 'combat_drone', name: 'Build Combat Drone', level: 30, duration: 20, xp: 75, masteryXp: 28,
       rewards: { items: { 'drone_chassis': { min: 1, max: 2 }, 'circuit_board': { min: 2, max: 4 } }, currency: { min: 100, max: 350 } },
     },
     {
       id: 'ai_drone', name: 'Build AI Drone', level: 60, duration: 35, xp: 270, masteryXp: 90,
       rewards: { items: { 'drone_chassis': { min: 2, max: 4 }, 'neural_implant': { min: 0, max: 1 } }, currency: { min: 300, max: 1000 } },
     },
     {
       id: 'swarm_drone', name: 'Architect Swarm Intelligence Network', level: 70, duration: 50, xp: 510, masteryXp: 180,
       rewards: { items: { 'drone_chassis': { min: 4, max: 8 }, 'neural_implant': { min: 2, max: 4 } }, currency: { min: 1200, max: 4000 } },
     },
     {
       id: 'godlike_drone', name: 'Engineer Omniscient Drone Fleet', level: 90, duration: 70, xp: 1200, masteryXp: 420,
       rewards: { items: { 'drone_chassis': { min: 8, max: 16 }, 'neural_implant': { min: 4, max: 8 }, 'net_artifact': { min: 1, max: 3 } }, currency: { min: 5000, max: 15000 } },
     },
   ],

  // ---- FIXER ----
   trading: [
     {
       id: 'small_trade', name: 'Small-Time Trading', level: 1, duration: 6, xp: 12, masteryXp: 5,
       rewards: { items: {}, currency: { min: 30, max: 100 } },
     },
     {
       id: 'black_market', name: 'Black Market Deals', level: 20, duration: 12, xp: 50, masteryXp: 18,
       rewards: { items: { 'contraband': { min: 0, max: 2 } }, currency: { min: 100, max: 400 } },
     },
     {
       id: 'corpo_trade', name: 'Corpo Stock Manipulation', level: 50, duration: 25, xp: 180, masteryXp: 60,
       rewards: { items: {}, currency: { min: 500, max: 2000 } },
     },
     {
       id: 'mega_trade', name: 'Megacorp Futures Trading', level: 70, duration: 35, xp: 420, masteryXp: 150,
       rewards: { items: { 'contraband': { min: 2, max: 5 } }, currency: { min: 1500, max: 5000 } },
     },
     {
       id: 'ultimate_trade', name: 'Universal Market Domination', level: 90, duration: 50, xp: 950, masteryXp: 330,
       rewards: { items: { 'contraband': { min: 5, max: 12 } }, currency: { min: 6000, max: 18000 } },
     },
   ],

   corpo_infiltration: [
     {
       id: 'small_heist', name: 'Small Office Heist', level: 1, duration: 10, xp: 18, masteryXp: 7,
       rewards: { items: { 'stolen_intel': { min: 1, max: 2 } }, currency: { min: 40, max: 120 } },
     },
     {
       id: 'mid_heist', name: 'Corporate Tower Break-in', level: 25, duration: 18, xp: 65, masteryXp: 25,
       rewards: { items: { 'stolen_intel': { min: 2, max: 5 }, 'biometric_scanner': { min: 0, max: 1 } }, currency: { min: 150, max: 500 } },
     },
     {
       id: 'mega_heist', name: 'Arasaka Vault Heist', level: 55, duration: 35, xp: 280, masteryXp: 90,
       rewards: { items: { 'stolen_intel': { min: 5, max: 10 }, 'biometric_scanner': { min: 1, max: 3 } }, currency: { min: 500, max: 2500 } },
     },
     {
       id: 'legendary_heist', name: 'Continental Corpo Raid', level: 70, duration: 50, xp: 520, masteryXp: 185,
       rewards: { items: { 'stolen_intel': { min: 10, max: 20 }, 'biometric_scanner': { min: 3, max: 6 } }, currency: { min: 1500, max: 5000 } },
     },
     {
       id: 'impossible_heist', name: 'Impossible Inner Sanctum Heist', level: 90, duration: 70, xp: 1150, masteryXp: 400,
       rewards: { items: { 'stolen_intel': { min: 20, max: 40 }, 'biometric_scanner': { min: 6, max: 12 }, 'net_artifact': { min: 1, max: 3 } }, currency: { min: 6000, max: 18000 } },
     },
   ],

   info_brokering: [
     {
       id: 'sell_gossip', name: 'Sell Street Gossip', level: 1, duration: 5, xp: 10, masteryXp: 4,
       rewards: { items: {}, currency: { min: 15, max: 50 } },
     },
     {
       id: 'sell_intel', name: 'Broker Stolen Intel', level: 20, duration: 10, xp: 45, masteryXp: 16,
       rewards: { items: { 'stolen_intel': { min: 0, max: 1 } }, currency: { min: 60, max: 250 } },
     },
     {
       id: 'sell_secrets', name: 'Sell Corporate Secrets', level: 45, duration: 20, xp: 160, masteryXp: 55,
       rewards: { items: {}, currency: { min: 300, max: 1200 } },
     },
     {
       id: 'master_broker', name: 'Master Intelligence Brokerage', level: 70, duration: 30, xp: 420, masteryXp: 150,
       rewards: { items: { 'stolen_intel': { min: 2, max: 5 } }, currency: { min: 1200, max: 4000 } },
     },
     {
       id: 'omniscient_broker', name: 'Omniscient Data Synthesis', level: 90, duration: 45, xp: 900, masteryXp: 310,
       rewards: { items: { 'stolen_intel': { min: 5, max: 10 } }, currency: { min: 5000, max: 16000 } },
     },
   ],

   fencing: [
     {
       id: 'fence_junk', name: 'Fence Junk Items', level: 1, duration: 5, xp: 10, masteryXp: 4,
       rewards: { items: {}, currency: { min: 10, max: 40 } },
     },
     {
       id: 'fence_goods', name: 'Fence Stolen Goods', level: 20, duration: 10, xp: 42, masteryXp: 15,
       rewards: { items: { 'contraband': { min: 0, max: 1 } }, currency: { min: 50, max: 200 } },
     },
     {
       id: 'fence_rare', name: 'Fence Rare Artifacts', level: 50, duration: 20, xp: 170, masteryXp: 55,
       rewards: { items: {}, currency: { min: 250, max: 1000 } },
     },
     {
       id: 'master_fence', name: 'Master Fence Operation', level: 70, duration: 30, xp: 380, masteryXp: 135,
       rewards: { items: { 'contraband': { min: 2, max: 5 } }, currency: { min: 1000, max: 3500 } },
     },
     {
       id: 'legendary_fence', name: 'Legendary Underground Market', level: 90, duration: 45, xp: 820, masteryXp: 290,
       rewards: { items: { 'contraband': { min: 5, max: 12 } }, currency: { min: 4500, max: 14000 } },
     },
   ],

  // ---- RIPPER ----
   cyberware_installation: [
     {
       id: 'basic_install', name: 'Basic Chrome Install', level: 1, duration: 10, xp: 18, masteryXp: 7,
       rewards: { items: { 'chrome_scrap': { min: 1, max: 2 } }, currency: { min: 20, max: 60 } },
     },
     {
       id: 'mid_install', name: 'Neural Port Installation', level: 25, duration: 18, xp: 65, masteryXp: 25,
       rewards: { items: { 'chrome_scrap': { min: 2, max: 5 }, 'synthetic_muscle': { min: 0, max: 1 } }, currency: { min: 80, max: 300 } },
     },
     {
       id: 'elite_install', name: 'Full Body Chrome', level: 55, duration: 35, xp: 250, masteryXp: 85,
       rewards: { items: { 'neural_implant': { min: 1, max: 2 }, 'synthetic_muscle': { min: 1, max: 3 } }, currency: { min: 300, max: 1000 } },
     },
     {
       id: 'transcendent_install', name: 'Transcendent Chrome Integration', level: 70, duration: 50, xp: 520, masteryXp: 185,
       rewards: { items: { 'neural_implant': { min: 2, max: 4 }, 'synthetic_muscle': { min: 3, max: 6 } }, currency: { min: 1200, max: 4000 } },
     },
     {
       id: 'godlike_install', name: 'Godlike Full Conversion', level: 90, duration: 65, xp: 1150, masteryXp: 400,
       rewards: { items: { 'neural_implant': { min: 4, max: 8 }, 'synthetic_muscle': { min: 6, max: 12 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 5000, max: 15000 } },
     },
   ],

   biotech: [
     {
       id: 'basic_bio', name: 'Synthesize Basic Stims', level: 1, duration: 7, xp: 14, masteryXp: 5,
       rewards: { items: { 'bio_sample': { min: 1, max: 2 } }, currency: { min: 10, max: 40 } },
     },
     {
       id: 'mid_bio', name: 'Create Healing Nanobots', level: 25, duration: 15, xp: 55, masteryXp: 20,
       rewards: { items: { 'bio_sample': { min: 2, max: 5 }, 'healing_nanobots': { min: 0, max: 1 } }, currency: { min: 50, max: 200 } },
     },
     {
       id: 'elite_bio', name: 'Engineer Bio-Weapons', level: 55, duration: 30, xp: 220, masteryXp: 75,
       rewards: { items: { 'bio_sample': { min: 5, max: 10 }, 'combat_stim': { min: 0, max: 1 } }, currency: { min: 200, max: 800 } },
     },
     {
       id: 'supreme_bio', name: 'Supreme Bio-Enhancement Synthesis', level: 70, duration: 45, xp: 480, masteryXp: 170,
       rewards: { items: { 'bio_sample': { min: 10, max: 20 }, 'healing_nanobots': { min: 1, max: 3 }, 'combat_stim': { min: 1, max: 2 } }, currency: { min: 1000, max: 3500 } },
     },
     {
       id: 'godlike_bio', name: 'Godlike Bio-Transformation', level: 90, duration: 60, xp: 1050, masteryXp: 370,
       rewards: { items: { 'bio_sample': { min: 20, max: 40 }, 'healing_nanobots': { min: 2, max: 5 }, 'combat_stim': { min: 2, max: 4 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 4500, max: 14000 } },
     },
   ],

   neural_enhancement: [
     {
       id: 'basic_neuro', name: 'Basic Neural Tuning', level: 1, duration: 8, xp: 14, masteryXp: 5,
       rewards: { items: { 'neural_implant': { min: 0, max: 1 } }, currency: { min: 15, max: 50 } },
     },
     {
       id: 'mid_neuro', name: 'Cognitive Boost Procedure', level: 25, duration: 15, xp: 60, masteryXp: 22,
       rewards: { items: { 'neural_implant': { min: 1, max: 2 } }, currency: { min: 60, max: 250 } },
     },
     {
       id: 'elite_neuro', name: 'Full Neural Overhaul', level: 55, duration: 30, xp: 240, masteryXp: 80,
       rewards: { items: { 'neural_implant': { min: 2, max: 4 }, 'net_artifact': { min: 0, max: 1 } }, currency: { min: 250, max: 900 } },
     },
     {
       id: 'transcendent_neuro', name: 'Transcendent Neural Evolution', level: 70, duration: 45, xp: 480, masteryXp: 170,
       rewards: { items: { 'neural_implant': { min: 4, max: 8 }, 'net_artifact': { min: 1, max: 2 } }, currency: { min: 1200, max: 4000 } },
     },
     {
       id: 'godlike_neuro', name: 'Godlike Consciousness Enhancement', level: 90, duration: 60, xp: 1050, masteryXp: 370,
       rewards: { items: { 'neural_implant': { min: 8, max: 16 }, 'net_artifact': { min: 2, max: 4 } }, currency: { min: 5000, max: 15000 } },
     },
   ],

   chrome_surgery: [
     {
       id: 'basic_chrome', name: 'Basic Chrome Surgery', level: 1, duration: 10, xp: 18, masteryXp: 7,
       rewards: { items: { 'chrome_scrap': { min: 1, max: 3 }, 'synthetic_muscle': { min: 0, max: 1 } }, currency: { min: 20, max: 70 } },
     },
     {
       id: 'mid_chrome', name: 'Advanced Chrome Surgery', level: 30, duration: 20, xp: 75, masteryXp: 28,
       rewards: { items: { 'chrome_scrap': { min: 3, max: 7 }, 'synthetic_muscle': { min: 1, max: 3 } }, currency: { min: 100, max: 400 } },
     },
     {
       id: 'elite_chrome', name: 'Legendary Chrome Overhaul', level: 60, duration: 35, xp: 300, masteryXp: 100,
       rewards: { items: { 'chrome_scrap': { min: 5, max: 15 }, 'neural_implant': { min: 1, max: 2 } }, currency: { min: 400, max: 1500 } },
     },
     {
       id: 'transcendent_chrome', name: 'Transcendent Chrome Integration', level: 70, duration: 50, xp: 550, masteryXp: 190,
       rewards: { items: { 'chrome_scrap': { min: 15, max: 30 }, 'neural_implant': { min: 2, max: 5 }, 'synthetic_muscle': { min: 2, max: 5 } }, currency: { min: 1500, max: 5000 } },
     },
     {
       id: 'godlike_chrome', name: 'Godlike Total Replacement', level: 90, duration: 70, xp: 1250, masteryXp: 430,
       rewards: { items: { 'chrome_scrap': { min: 30, max: 60 }, 'neural_implant': { min: 5, max: 10 }, 'synthetic_muscle': { min: 5, max: 10 }, 'net_artifact': { min: 1, max: 3 } }, currency: { min: 6000, max: 18000 } },
     },
   ],
};

// ==========================================
// Shop data — things to spend Eurodollars on
// ==========================================
export const SHOP_ITEMS = [
   // Tier 1: Early Game (500-1500 E$)
   { id: 'pistol', name: 'Kinetic Pistol', icon: '🔫', cost: 500, category: 'weapon', tier: 1, description: '+5 damage', costPerformance: 'budget' },
   { id: 'kevlar_bodysuit', name: 'Kevlar Bodysuit', icon: '🦺', cost: 800, category: 'armor', tier: 1, description: '+5 defense', costPerformance: 'budget' },
   { id: 'healing_nanobots', name: 'Healing Nanobots x10', icon: '🔬', cost: 400, category: 'consumable', tier: 1, description: 'Restore 30 HP each', quantity: 10 },

   // Tier 2: Mid Game (1000-3000 E$)
   { id: 'smart_pistol', name: 'Smart Pistol', icon: '🔫', cost: 1200, category: 'weapon', tier: 2, description: '+8 damage', costPerformance: 'efficient' },
   { id: 'melee', name: 'Katana', icon: '⚔️', cost: 1500, category: 'weapon', tier: 2, description: '+10 damage, bonus vs cyborgs', costPerformance: 'efficient' },
   { id: 'subdermal_armor', name: 'Subdermal Armor', icon: '🛡️', cost: 1800, category: 'armor', tier: 2, description: '+8 defense', costPerformance: 'efficient' },
   { id: 'combat_stim', name: 'Combat Stim x20', icon: '💉', cost: 1200, category: 'consumable', tier: 2, description: '+3 damage per hit for 10 seconds', quantity: 20 },

   // Tier 3: Late Game (2000-5000 E$)
   { id: 'monowire', name: 'Monowire', icon: '〰️', cost: 2500, category: 'weapon', tier: 3, description: '+12 damage, piercing attacks', costPerformance: 'high-value' },
   { id: 'rifle', name: 'Sniper Rifle', icon: '🎯', cost: 3500, category: 'weapon', tier: 3, description: '+15 damage, long-range', costPerformance: 'high-value' },
   { id: 'military_grade_implant', name: 'Military Grade Implant', icon: '🦾', cost: 5000, category: 'cyberware', tier: 3, description: '+10 defense, +3 damage', costPerformance: 'premium' },
   { id: 'xp_boost_chip', name: 'XP Boost Chip', icon: '⚡', cost: 3000, category: 'cyberware', tier: 3, description: '+10% XP from all skills', costPerformance: 'grind-booster' },
   { id: 'speed_processor', name: 'Speed Processor', icon: '⏱️', cost: 3500, category: 'cyberware', tier: 3, description: 'Actions complete 15% faster', costPerformance: 'grind-booster' },

   // Tier 3.5: Parallel Hacking (mid-late game)
   { id: 'multithreaded_link', name: 'Multithreaded Neural Link', icon: '🔗', cost: 4000, category: 'cyberware', tier: 3, description: 'Enables background hacking while doing other activities', costPerformance: 'utility' },

   // Tier 4: End Game (5000+ E$)
   { id: 'legendary_blade', name: 'Legendary Mantis Blade', icon: '⚡', cost: 8000, category: 'weapon', tier: 4, description: '+20 damage, life steal 10%', costPerformance: 'exotic' },
   { id: 'quantum_implant', name: 'Quantum Processing Implant', icon: '🧠', cost: 12000, category: 'cyberware', tier: 4, description: '+15 damage, +15 defense, XP boost +5%, parallel hacking', costPerformance: 'exotic' },
   { id: 'neural_accelerator', name: 'Neural Time Accelerator', icon: '⏱️', cost: 15000, category: 'cyberware', tier: 4, description: 'Skill cooldown -20%, actions +25% speed', costPerformance: 'exotic' },
   { id: 'loot_enhancer', name: 'Loot Enhancer Module', icon: '💎', cost: 10000, category: 'cyberware', tier: 4, description: '+20% material drops from all skills', costPerformance: 'exotic' },
   { id: 'wealth_accumulator', name: 'Wealth Accumulator', icon: '💰', cost: 12500, category: 'cyberware', tier: 4, description: '+25% Eurodollars gained', costPerformance: 'exotic' },
   { id: 'neural_daemon', name: 'Neural Daemon', icon: '👾', cost: 8500, category: 'cyberware', tier: 4, description: '+5 damage, +8 defense, parallel hacking', costPerformance: 'exotic' },
    { id: 'ice_shield', name: 'ICE Shield', icon: '❄️', cost: 7000, category: 'armor', tier: 4, description: '+12 defense, immune to slow effects', costPerformance: 'defensive' },
];

// ==========================================
// Passive bonuses from skill levels
// Each skill provides a specific stat bonus per level
// ==========================================
export const PASSIVE_BONUSES = {
  // HACKING — XP, crit, action speed
  intrusion:      { stat: 'critChance',    perLevel: 0.08, description: '+0.08% crit chance per level' },
  decryption:     { stat: 'xpBonus',       perLevel: 0.12, description: '+0.12% XP bonus per level' },
  ice_breaking:   { stat: 'attackPower',   perLevel: 0.3,  description: '+0.3 attack power per level' },
  daemon_coding:  { stat: 'critDamage',    perLevel: 0.15, description: '+0.15% crit damage per level' },

  // NETRUNNING — evasion, speed, loot
  deep_dive:      { stat: 'lootBonus',     perLevel: 0.10, description: '+0.10% loot bonus per level' },
  data_mining:    { stat: 'currencyBonus', perLevel: 0.10, description: '+0.10% currency bonus per level' },
  black_ice_combat: { stat: 'attackPower', perLevel: 0.4,  description: '+0.4 attack power per level' },
  neural_surfing: { stat: 'actionSpeed',   perLevel: 0.06, description: '+0.06% action speed per level' },

  // STREET — attack, defense, HP
  combat:         { stat: 'attackPower',   perLevel: 0.5,  description: '+0.5 attack power per level' },
  stealth:        { stat: 'evasion',       perLevel: 0.10, description: '+0.10% evasion per level' },
  street_cred:    { stat: 'currencyBonus', perLevel: 0.12, description: '+0.12% currency bonus per level' },
  smuggling:      { stat: 'lootBonus',     perLevel: 0.12, description: '+0.12% loot bonus per level' },

  // TECH — defense, speed, crafting
  cyberware_crafting: { stat: 'defense',   perLevel: 0.3,  description: '+0.3 defense per level' },
  weapon_modding:     { stat: 'critDamage',perLevel: 0.20, description: '+0.20% crit damage per level' },
  vehicle_tuning:     { stat: 'actionSpeed', perLevel: 0.05, description: '+0.05% action speed per level' },
  drone_engineering:  { stat: 'lootBonus', perLevel: 0.08, description: '+0.08% loot bonus per level' },

  // FIXER — currency, XP, crit
  trading:            { stat: 'currencyBonus', perLevel: 0.15, description: '+0.15% currency bonus per level' },
  corpo_infiltration: { stat: 'critChance',    perLevel: 0.10, description: '+0.10% crit chance per level' },
  info_brokering:     { stat: 'xpBonus',       perLevel: 0.10, description: '+0.10% XP bonus per level' },
  fencing:            { stat: 'currencyBonus', perLevel: 0.08, description: '+0.08% currency bonus per level' },

  // RIPPER — HP, heal, defense
  cyberware_installation: { stat: 'maxHP',    perLevel: 0.8,  description: '+0.8 max HP per level' },
  biotech:                { stat: 'maxHP',    perLevel: 0.5,  description: '+0.5 max HP per level' },
  neural_enhancement:     { stat: 'xpBonus',  perLevel: 0.15, description: '+0.15% XP bonus per level' },
  chrome_surgery:         { stat: 'defense',  perLevel: 0.4,  description: '+0.4 defense per level' },
};

// ==========================================
// Skill abilities for combat
// Each skill has 3 abilities unlocked at levels 15, 45, 75
// Only one ability can be selected per skill
// At mastery 50+ for that skill, selected ability auto-casts
// ==========================================
export const SKILL_ABILITIES = {
  // --- HACKING ---
  intrusion: [
    { id: 'backdoor_exploit', name: 'Backdoor Exploit', level: 15, icon: '🔓', type: 'damage',
      cooldown: 8, description: 'Bypass defenses for a critical strike',
      basePower: 15, scaling: 0.4, effect: 'Deals damage ignoring defense' },
    { id: 'system_overload', name: 'System Overload', level: 45, icon: '💥', type: 'debuff',
      cooldown: 12, description: 'Overload enemy systems, reducing damage',
      basePower: 25, scaling: 0.2, effect: 'Reduces enemy damage by 25% for 8s' },
    { id: 'root_access', name: 'Root Access', level: 75, icon: '👑', type: 'damage',
      cooldown: 15, description: 'Full system compromise — devastating attack',
      basePower: 40, scaling: 0.6, effect: 'Massive damage + stun 2s' },
  ],
  decryption: [
    { id: 'cipher_shield', name: 'Cipher Shield', level: 15, icon: '🛡️', type: 'buff',
      cooldown: 10, description: 'Encrypted defense matrix',
      basePower: 8, scaling: 0.15, effect: 'Gain shield absorbing damage for 6s' },
    { id: 'decrypt_weakness', name: 'Decrypt Weakness', level: 45, icon: '🎯', type: 'debuff',
      cooldown: 14, description: 'Expose enemy vulnerabilities',
      basePower: 0, scaling: 0.1, effect: '+15% damage to target for 10s' },
    { id: 'quantum_decode', name: 'Quantum Decode', level: 75, icon: '⚛️', type: 'damage',
      cooldown: 18, description: 'Quantum-decrypt enemy core',
      basePower: 35, scaling: 0.5, effect: 'High damage + removes enemy buffs' },
  ],
  ice_breaking: [
    { id: 'ice_shatter', name: 'ICE Shatter', level: 15, icon: '❄️', type: 'damage',
      cooldown: 7, description: 'Shatter enemy ICE defenses',
      basePower: 12, scaling: 0.35, effect: 'Direct damage piercing armor' },
    { id: 'ice_wall', name: 'ICE Wall', level: 45, icon: '🧊', type: 'buff',
      cooldown: 16, description: 'Erect defensive ICE barrier',
      basePower: 15, scaling: 0.2, effect: 'Block next 2 attacks' },
    { id: 'black_ice_spike', name: 'Black ICE Spike', level: 75, icon: '🖤', type: 'damage',
      cooldown: 14, description: 'Deploy lethal Black ICE',
      basePower: 45, scaling: 0.55, effect: 'Heavy damage + DoT 5s' },
  ],
  daemon_coding: [
    { id: 'attack_daemon', name: 'Attack Daemon', level: 15, icon: '👾', type: 'damage',
      cooldown: 6, description: 'Deploy offensive daemon',
      basePower: 10, scaling: 0.3, effect: 'Daemon attacks for 4s' },
    { id: 'support_daemon', name: 'Support Daemon', level: 45, icon: '🤖', type: 'heal',
      cooldown: 12, description: 'Deploy healing daemon',
      basePower: 20, scaling: 0.25, effect: 'Restores HP over 6s' },
    { id: 'berserker_daemon', name: 'Berserker Daemon', level: 75, icon: '😈', type: 'buff',
      cooldown: 20, description: 'Deploy berserker combat daemon',
      basePower: 0, scaling: 0.15, effect: '+40% damage for 8s' },
  ],

  // --- NETRUNNING ---
  deep_dive: [
    { id: 'net_pulse', name: 'NET Pulse', level: 15, icon: '📡', type: 'damage',
      cooldown: 7, description: 'Send resonating pulse through the NET',
      basePower: 12, scaling: 0.35, effect: 'AoE damage pulse' },
    { id: 'deep_scan', name: 'Deep Scan', level: 45, icon: '🔍', type: 'buff',
      cooldown: 15, description: 'Scan for weak points',
      basePower: 0, scaling: 0.08, effect: '+10% crit chance for 10s' },
    { id: 'abyss_strike', name: 'Abyss Strike', level: 75, icon: '🌀', type: 'damage',
      cooldown: 16, description: 'Channel the void against your enemy',
      basePower: 38, scaling: 0.5, effect: 'Massive void damage' },
  ],
  data_mining: [
    { id: 'data_siphon', name: 'Data Siphon', level: 15, icon: '💾', type: 'heal',
      cooldown: 10, description: 'Siphon data to repair systems',
      basePower: 15, scaling: 0.2, effect: 'Restore HP based on skill level' },
    { id: 'overmine', name: 'Overmine', level: 45, icon: '⛏️', type: 'damage',
      cooldown: 9, description: 'Aggressive data extraction',
      basePower: 20, scaling: 0.4, effect: 'Damage + bonus currency on kill' },
    { id: 'data_cascade', name: 'Data Cascade', level: 75, icon: '🌊', type: 'damage',
      cooldown: 14, description: 'Unleash cascading data torrent',
      basePower: 35, scaling: 0.55, effect: 'Multi-hit damage over 4s' },
  ],
  black_ice_combat: [
    { id: 'ice_lance', name: 'ICE Lance', level: 15, icon: '🔱', type: 'damage',
      cooldown: 6, description: 'Hurl concentrated ICE',
      basePower: 14, scaling: 0.4, effect: 'Piercing ICE damage' },
    { id: 'frost_shield', name: 'Frost Shield', level: 45, icon: '🛡️', type: 'buff',
      cooldown: 14, description: 'ICE-hardened shield',
      basePower: 12, scaling: 0.18, effect: 'Absorb damage for 8s' },
    { id: 'absolute_zero', name: 'Absolute Zero', level: 75, icon: '💠', type: 'damage',
      cooldown: 18, description: 'Freeze enemy to absolute zero',
      basePower: 50, scaling: 0.6, effect: 'Devastating damage + freeze 3s' },
  ],
  neural_surfing: [
    { id: 'neural_dash', name: 'Neural Dash', level: 15, icon: '⚡', type: 'buff',
      cooldown: 8, description: 'Surge through neural pathways',
      basePower: 0, scaling: 0.05, effect: '+20% attack speed for 6s' },
    { id: 'synapse_strike', name: 'Synapse Strike', level: 45, icon: '🧠', type: 'damage',
      cooldown: 10, description: 'Strike through neural links',
      basePower: 22, scaling: 0.4, effect: 'Fast damage + speed buff' },
    { id: 'neural_storm', name: 'Neural Storm', level: 75, icon: '🌩️', type: 'damage',
      cooldown: 16, description: 'Overwhelm with neural lightning',
      basePower: 42, scaling: 0.55, effect: 'Chain lightning damage' },
  ],

  // --- STREET ---
  combat: [
    { id: 'power_strike', name: 'Power Strike', level: 15, icon: '💪', type: 'damage',
      cooldown: 5, description: 'Focused heavy blow',
      basePower: 12, scaling: 0.45, effect: 'High single-target damage' },
    { id: 'adrenaline_rush', name: 'Adrenaline Rush', level: 45, icon: '💉', type: 'buff',
      cooldown: 18, description: 'Surge of combat adrenaline',
      basePower: 0, scaling: 0.1, effect: '+30% damage, +20% speed for 8s' },
    { id: 'execution', name: 'Execution', level: 75, icon: '☠️', type: 'damage',
      cooldown: 20, description: 'Finishing move on weakened enemies',
      basePower: 60, scaling: 0.7, effect: 'Massive damage, +50% if enemy below 30% HP' },
  ],
  stealth: [
    { id: 'shadow_strike', name: 'Shadow Strike', level: 15, icon: '🗡️', type: 'damage',
      cooldown: 8, description: 'Strike from the shadows',
      basePower: 18, scaling: 0.35, effect: 'Guaranteed crit if first attack' },
    { id: 'smoke_bomb', name: 'Smoke Bomb', level: 45, icon: '💨', type: 'buff',
      cooldown: 16, description: 'Cloud of confusion',
      basePower: 0, scaling: 0.1, effect: '+30% evasion for 8s' },
    { id: 'assassinate', name: 'Assassinate', level: 75, icon: '🥷', type: 'damage',
      cooldown: 22, description: 'Lethal targeted strike',
      basePower: 55, scaling: 0.65, effect: 'Massive damage + ignore defense' },
  ],
  street_cred: [
    { id: 'intimidate', name: 'Intimidate', level: 15, icon: '😤', type: 'debuff',
      cooldown: 10, description: 'Frighten the enemy',
      basePower: 0, scaling: 0.1, effect: 'Reduce enemy damage by 20% for 8s' },
    { id: 'rally_crew', name: 'Rally Crew', level: 45, icon: '👥', type: 'buff',
      cooldown: 20, description: 'Call in your crew for support',
      basePower: 15, scaling: 0.2, effect: 'Bonus damage hits for 6s' },
    { id: 'kingpin_authority', name: 'Kingpin Authority', level: 75, icon: '👑', type: 'buff',
      cooldown: 25, description: 'Assert your dominance',
      basePower: 0, scaling: 0.15, effect: '+25% all damage, +15% defense for 10s' },
  ],
  smuggling: [
    { id: 'flashbang', name: 'Flashbang', level: 15, icon: '💡', type: 'debuff',
      cooldown: 10, description: 'Blind the enemy with a flashbang',
      basePower: 8, scaling: 0.15, effect: 'Stun for 2s + minor damage' },
    { id: 'contraband_stim', name: 'Contraband Stim', level: 45, icon: '💊', type: 'heal',
      cooldown: 14, description: 'Black market healing stim',
      basePower: 25, scaling: 0.3, effect: 'Restore HP + boost defense 6s' },
    { id: 'dirty_bomb', name: 'Dirty Bomb', level: 75, icon: '💣', type: 'damage',
      cooldown: 20, description: 'Throw an improvised explosive',
      basePower: 48, scaling: 0.5, effect: 'Heavy AoE damage + DoT' },
  ],

  // --- TECH ---
  cyberware_crafting: [
    { id: 'deploy_turret', name: 'Deploy Turret', level: 15, icon: '🔫', type: 'damage',
      cooldown: 12, description: 'Deploy an auto-targeting turret',
      basePower: 10, scaling: 0.25, effect: 'Turret fires for 8s' },
    { id: 'repair_nanites', name: 'Repair Nanites', level: 45, icon: '🔬', type: 'heal',
      cooldown: 14, description: 'Release repair nanobots',
      basePower: 22, scaling: 0.28, effect: 'Heal over 6s' },
    { id: 'emp_blast', name: 'EMP Blast', level: 75, icon: '⚡', type: 'damage',
      cooldown: 16, description: 'Electromagnetic pulse detonation',
      basePower: 40, scaling: 0.5, effect: 'Damage + disable enemy 3s' },
  ],
  weapon_modding: [
    { id: 'overcharge_round', name: 'Overcharge Round', level: 15, icon: '🔥', type: 'damage',
      cooldown: 6, description: 'Fire an overcharged shot',
      basePower: 14, scaling: 0.4, effect: 'Boosted damage single shot' },
    { id: 'armor_piercing', name: 'Armor Piercing', level: 45, icon: '🎯', type: 'damage',
      cooldown: 10, description: 'Penetrate all defenses',
      basePower: 25, scaling: 0.45, effect: 'Ignores 50% of defense' },
    { id: 'smart_rounds', name: 'Smart Rounds', level: 75, icon: '🧠', type: 'buff',
      cooldown: 18, description: 'Load smart targeting rounds',
      basePower: 0, scaling: 0.1, effect: '+25% crit chance, +30% crit damage 8s' },
  ],
  vehicle_tuning: [
    { id: 'hit_and_run', name: 'Hit & Run', level: 15, icon: '🏎️', type: 'damage',
      cooldown: 8, description: 'Drive-by strike',
      basePower: 15, scaling: 0.3, effect: 'Damage + dodge next attack' },
    { id: 'nitro_boost', name: 'Nitro Boost', level: 45, icon: '🚀', type: 'buff',
      cooldown: 16, description: 'Activate nitro systems',
      basePower: 0, scaling: 0.06, effect: '+30% attack speed for 8s' },
    { id: 'road_warrior', name: 'Road Warrior', level: 75, icon: '🔥', type: 'damage',
      cooldown: 18, description: 'Full vehicle assault',
      basePower: 42, scaling: 0.5, effect: 'Heavy damage + speed boost' },
  ],
  drone_engineering: [
    { id: 'scout_drone', name: 'Scout Drone', level: 15, icon: '🛸', type: 'debuff',
      cooldown: 10, description: 'Deploy recon drone',
      basePower: 0, scaling: 0.08, effect: 'Reveal enemy, +8% crit for 10s' },
    { id: 'attack_drone', name: 'Attack Drone', level: 45, icon: '🤖', type: 'damage',
      cooldown: 12, description: 'Deploy armed drone',
      basePower: 18, scaling: 0.35, effect: 'Drone attacks for 6s' },
    { id: 'drone_swarm', name: 'Drone Swarm', level: 75, icon: '🐝', type: 'damage',
      cooldown: 20, description: 'Unleash a swarm of micro-drones',
      basePower: 45, scaling: 0.55, effect: 'Multi-hit swarm damage' },
  ],

  // --- FIXER ---
  trading: [
    { id: 'bribe', name: 'Bribe', level: 15, icon: '💵', type: 'debuff',
      cooldown: 12, description: 'Bribe enemy to lower guard',
      basePower: 0, scaling: 0.1, effect: 'Reduce enemy defense 30% for 8s' },
    { id: 'market_manipulation', name: 'Market Manipulation', level: 45, icon: '📊', type: 'buff',
      cooldown: 18, description: 'Leverage market intel',
      basePower: 0, scaling: 0.12, effect: '+20% damage, +15% currency for 10s' },
    { id: 'hostile_takeover', name: 'Hostile Takeover', level: 75, icon: '🏦', type: 'damage',
      cooldown: 22, description: 'Corporate-grade assault',
      basePower: 38, scaling: 0.5, effect: 'Heavy damage + bonus currency' },
  ],
  corpo_infiltration: [
    { id: 'insider_info', name: 'Insider Info', level: 15, icon: '📋', type: 'debuff',
      cooldown: 10, description: 'Exploit insider intelligence',
      basePower: 0, scaling: 0.08, effect: '+12% crit, expose weakness 8s' },
    { id: 'corpo_sabotage', name: 'Corpo Sabotage', level: 45, icon: '💣', type: 'damage',
      cooldown: 12, description: 'Sabotage enemy systems',
      basePower: 22, scaling: 0.4, effect: 'Damage + reduce enemy attack' },
    { id: 'extraction_protocol', name: 'Extraction Protocol', level: 75, icon: '🚁', type: 'heal',
      cooldown: 20, description: 'Emergency extraction and repair',
      basePower: 35, scaling: 0.35, effect: 'Large heal + brief invulnerability' },
  ],
  info_brokering: [
    { id: 'leak_intel', name: 'Leak Intel', level: 15, icon: '📰', type: 'debuff',
      cooldown: 10, description: 'Leak enemy weaknesses',
      basePower: 0, scaling: 0.1, effect: 'Enemy takes +15% damage for 8s' },
    { id: 'disinformation', name: 'Disinformation', level: 45, icon: '🗞️', type: 'debuff',
      cooldown: 14, description: 'Confuse with false intel',
      basePower: 5, scaling: 0.1, effect: 'Enemy misses next 2 attacks' },
    { id: 'blackmail', name: 'Blackmail', level: 75, icon: '📁', type: 'damage',
      cooldown: 18, description: 'Devastating compromising intel',
      basePower: 35, scaling: 0.5, effect: 'High damage + enemy debuffed' },
  ],
  fencing: [
    { id: 'cheap_shot', name: 'Cheap Shot', level: 15, icon: '👊', type: 'damage',
      cooldown: 5, description: 'Quick underhanded strike',
      basePower: 10, scaling: 0.3, effect: 'Fast low-cooldown damage' },
    { id: 'fence_contacts', name: 'Fence Contacts', level: 45, icon: '🤝', type: 'buff',
      cooldown: 16, description: 'Call in underworld contacts',
      basePower: 10, scaling: 0.15, effect: 'Bonus damage + loot for 8s' },
    { id: 'black_market_deal', name: 'Black Market Deal', level: 75, icon: '🏴', type: 'heal',
      cooldown: 18, description: 'Acquire black market healing',
      basePower: 30, scaling: 0.3, effect: 'Large heal + defense boost' },
  ],

  // --- RIPPER ---
  cyberware_installation: [
    { id: 'overclock_implant', name: 'Overclock Implant', level: 15, icon: '⚡', type: 'buff',
      cooldown: 12, description: 'Overclock installed cyberware',
      basePower: 0, scaling: 0.08, effect: '+20% damage, +10% speed for 8s' },
    { id: 'emergency_repair', name: 'Emergency Repair', level: 45, icon: '🔧', type: 'heal',
      cooldown: 14, description: 'Emergency cyberware repair protocol',
      basePower: 25, scaling: 0.3, effect: 'Restore HP + cleanse debuffs' },
    { id: 'full_cyborg', name: 'Full Cyborg Mode', level: 75, icon: '🤖', type: 'buff',
      cooldown: 25, description: 'Activate full cybernetic combat mode',
      basePower: 0, scaling: 0.15, effect: '+35% damage, +25% defense, +20% speed 10s' },
  ],
  biotech: [
    { id: 'bio_regen', name: 'Bio Regen', level: 15, icon: '💚', type: 'heal',
      cooldown: 10, description: 'Activate biological regeneration',
      basePower: 18, scaling: 0.25, effect: 'Heal over 6s' },
    { id: 'toxin_injection', name: 'Toxin Injection', level: 45, icon: '🧪', type: 'damage',
      cooldown: 10, description: 'Inject lethal biotoxin',
      basePower: 15, scaling: 0.35, effect: 'Poison damage over 8s' },
    { id: 'phoenix_protocol', name: 'Phoenix Protocol', level: 75, icon: '🔥', type: 'heal',
      cooldown: 30, description: 'Near-death resurrection protocol',
      basePower: 50, scaling: 0.4, effect: 'Massive heal + damage immunity 3s' },
  ],
  neural_enhancement: [
    { id: 'neural_spike', name: 'Neural Spike', level: 15, icon: '🧠', type: 'damage',
      cooldown: 7, description: 'Direct neural assault',
      basePower: 14, scaling: 0.35, effect: 'Psionic damage bypassing armor' },
    { id: 'mind_fortress', name: 'Mind Fortress', level: 45, icon: '🏰', type: 'buff',
      cooldown: 16, description: 'Fortify mental defenses',
      basePower: 10, scaling: 0.2, effect: '+30% defense + reflect 10% damage 8s' },
    { id: 'neural_overload', name: 'Neural Overload', level: 75, icon: '💫', type: 'damage',
      cooldown: 18, description: 'Overload enemy neural pathways',
      basePower: 45, scaling: 0.6, effect: 'Massive psionic damage + stun' },
  ],
  chrome_surgery: [
    { id: 'chrome_spike', name: 'Chrome Spike', level: 15, icon: '🔩', type: 'damage',
      cooldown: 6, description: 'Extend chrome blade',
      basePower: 13, scaling: 0.35, effect: 'Quick chrome melee attack' },
    { id: 'chrome_plating', name: 'Chrome Plating', level: 45, icon: '🛡️', type: 'buff',
      cooldown: 14, description: 'Activate chrome armor plating',
      basePower: 15, scaling: 0.2, effect: 'Absorb damage for 8s' },
    { id: 'chrome_berserker', name: 'Chrome Berserker', level: 75, icon: '⚡', type: 'buff',
      cooldown: 22, description: 'Enter chrome berserker rage',
      basePower: 0, scaling: 0.2, effect: '+50% damage, +25% speed, -15% defense 10s' },
  ],
};
