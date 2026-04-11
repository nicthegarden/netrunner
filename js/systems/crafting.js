import { events, EVENTS } from '../engine/events.js';
import { ITEMS } from '../data/skillData.js';

// Craft recipes: input items -> output item + currency cost
export const CRAFT_RECIPES = {
   // Weapon upgrades
   enhanced_pistol: {
     name: 'Enhanced Kinetic Pistol',
     category: 'weapon_upgrade',
     level: 30,
     requiredSkill: 'weapon_modding',
     inputs: { pistol: 1, circuit_board: 3, chrome_scrap: 2 },
     outputs: { smart_pistol: 1 },
     currencyCost: 300,
   },
   monowire_craft: {
     name: 'Craft Monowire',
     category: 'weapon',
     level: 50,
     requiredSkill: 'weapon_modding',
     inputs: { chrome_scrap: 5, synthetic_muscle: 2, circuit_board: 4 },
     outputs: { monowire: 1 },
     currencyCost: 500,
   },

   // Armor upgrades
   reinforced_bodysuit: {
     name: 'Reinforce Kevlar Bodysuit',
     category: 'armor_upgrade',
     level: 35,
     requiredSkill: 'cyberware_crafting',
     inputs: { kevlar_bodysuit: 1, chrome_scrap: 4, synthetic_muscle: 3 },
     outputs: { subdermal_armor: 1 },
     currencyCost: 400,
   },

   // Cyberware
   neural_port: {
     name: 'Install Neural Port',
     category: 'cyberware',
     level: 40,
     requiredSkill: 'cyberware_crafting',
     inputs: { neural_implant: 2, circuit_board: 5, chrome_scrap: 3 },
     outputs: { military_grade_implant: 1 },
     currencyCost: 800,
   },

   // Consumables
   healing_kit: {
     name: 'Synthesize Healing Kit',
     category: 'consumable',
     level: 20,
     requiredSkill: 'biotech',
     inputs: { bio_sample: 3, circuit_board: 2 },
     outputs: { healing_nanobots: 3 },
     currencyCost: 150,
   },
   stim_pack: {
     name: 'Synthesize Combat Stimulants',
     category: 'consumable',
     level: 35,
     requiredSkill: 'biotech',
     inputs: { bio_sample: 5, neural_implant: 1, synthetic_muscle: 2 },
     outputs: { combat_stim: 3 },
     currencyCost: 300,
   },

   // Materials
   chrome_refinement: {
     name: 'Refine Chrome Scrap',
     category: 'material',
     level: 25,
     requiredSkill: 'cyberware_crafting',
     inputs: { chrome_scrap: 5 },
     outputs: { synthetic_muscle: 1 },
     currencyCost: 100,
   },

   // ===== NEW RECIPES (15+) covering dead-end materials =====

   // Data Shard recipes
   decryption_key_craft: {
     name: 'Forge Decryption Key',
     category: 'material',
     level: 45,
     requiredSkill: 'decryption',
     inputs: { data_shard: 10, circuit_board: 5 },
     outputs: { decryption_key: 1 },
     currencyCost: 1000,
   },

   // Encrypted Data + Stolen Intel recipes
   corporate_blackmail_craft: {
     name: 'Compile Corporate Blackmail',
     category: 'material',
     level: 55,
     requiredSkill: 'info_brokering',
     inputs: { stolen_intel: 8, encrypted_data: 5, data_shard: 3 },
     outputs: { corporate_blackmail: 1 },
     currencyCost: 2000,
   },

   // NET Artifact + Daemon Code recipe
   neural_daemon_craft: {
     name: 'Assemble Neural Daemon',
     category: 'cyberware',
     level: 60,
     requiredSkill: 'daemon_coding',
     inputs: { net_artifact: 2, daemon_code: 8, neural_implant: 3, circuit_board: 5 },
     outputs: { neural_daemon: 1 },
     currencyCost: 3000,
   },

   // ICE Fragment recipe
   ice_shield_craft: {
     name: 'Crystallize ICE Shield',
     category: 'armor',
     level: 50,
     requiredSkill: 'ice_breaking',
     inputs: { ice_fragment: 15, chrome_scrap: 8, synthetic_muscle: 4 },
     outputs: { ice_shield: 1 },
     currencyCost: 2500,
   },

   // Vehicle Parts recipe
   armored_plating_craft: {
     name: 'Forge Armored Plating',
     category: 'armor_upgrade',
     level: 55,
     requiredSkill: 'vehicle_tuning',
     inputs: { vehicle_parts: 10, chrome_scrap: 12, synthetic_muscle: 6 },
     outputs: { armored_plating: 1 },
     currencyCost: 3500,
   },

   // Drone Chassis recipe
   combat_drone_craft: {
     name: 'Build Combat Drone',
     category: 'cyberware',
     level: 65,
     requiredSkill: 'drone_engineering',
     inputs: { drone_chassis: 3, circuit_board: 12, neural_implant: 2, daemon_code: 4 },
     outputs: { combat_drone: 1 },
     currencyCost: 4000,
   },

   // Street Cred Token recipe
   fixer_license_craft: {
     name: 'Commission Fixer License',
     category: 'material',
     level: 50,
     requiredSkill: 'trading',
     inputs: { street_cred_token: 20, contraband: 5 },
     outputs: { fixer_license: 1 },
     currencyCost: 2500,
   },

   // Contraband recipe
   black_market_bundle_craft: {
     name: 'Package Black Market Bundle',
     category: 'material',
     level: 40,
     requiredSkill: 'smuggling',
     inputs: { contraband: 10, stolen_intel: 3, encrypted_data: 5 },
     outputs: { black_market_bundle: 1 },
     currencyCost: 1500,
   },

   // Passive bonus item recipes
   xp_boost_chip_craft: {
     name: 'Install XP Boost Chip',
     category: 'cyberware',
     level: 70,
     requiredSkill: 'neural_enhancement',
     inputs: { neural_implant: 5, circuit_board: 8, daemon_code: 4, net_artifact: 1 },
     outputs: { xp_boost_chip: 1 },
     currencyCost: 5000,
   },

   speed_processor_craft: {
     name: 'Install Speed Processor',
     category: 'cyberware',
     level: 70,
     requiredSkill: 'cyberware_installation',
     inputs: { synthetic_muscle: 8, circuit_board: 10, neural_implant: 4, ice_fragment: 5 },
     outputs: { speed_processor: 1 },
     currencyCost: 5500,
   },

   loot_enhancer_craft: {
     name: 'Install Loot Enhancer',
     category: 'cyberware',
     level: 75,
     requiredSkill: 'cyberware_crafting',
     inputs: { net_artifact: 3, neural_implant: 6, chrome_scrap: 15, daemon_code: 6 },
     outputs: { loot_enhancer: 1 },
     currencyCost: 6000,
   },

    wealth_accumulator_craft: {
      name: 'Install Wealth Accumulator',
      category: 'cyberware',
      level: 75,
      requiredSkill: 'corpo_infiltration',
     inputs: { net_artifact: 3, biometric_scanner: 8, circuit_board: 12, daemon_code: 5 },
      outputs: { wealth_accumulator: 1 },
      currencyCost: 6500,
    },

    neuroclock_jack_craft: {
      name: 'Assemble Neuroclock Jack',
      category: 'cyberware',
      level: 72,
      requiredSkill: 'cyberware_installation',
      inputs: { neural_implant: 6, daemon_code: 8, circuit_board: 10, net_artifact: 2 },
      outputs: { neuroclock_jack: 1 },
      currencyCost: 7200,
    },

    spectral_sniffer_craft: {
      name: 'Build Spectral Packet Sniffer',
      category: 'cyberware',
      level: 68,
      requiredSkill: 'decryption',
      inputs: { encrypted_data: 18, circuit_board: 8, daemon_code: 6, biometric_scanner: 2 },
      outputs: { spectral_sniffer: 1 },
      currencyCost: 6800,
    },

    quicktrace_graft_craft: {
      name: 'Install Quicktrace Graft',
      category: 'cyberware',
      level: 70,
      requiredSkill: 'neural_surfing',
      inputs: { neural_implant: 4, net_artifact: 2, circuit_board: 10, ice_fragment: 8 },
      outputs: { quicktrace_graft: 1 },
      currencyCost: 7000,
    },

    zero_day_suite_craft: {
      name: 'Compile Zero-Day Suite',
      category: 'cyberware',
      level: 92,
      requiredSkill: 'intrusion',
      inputs: { neuroclock_jack: 1, blackwall_router: 1, daemon_code: 16, net_artifact: 8, neural_implant: 8 },
      outputs: { zero_day_suite: 1 },
      currencyCost: 24000,
    },

    ghostwalk_cloak_craft: {
      name: 'Weave Ghostwalk Cloak',
      category: 'armor',
      level: 58,
      requiredSkill: 'stealth',
      inputs: { kevlar_bodysuit: 1, stolen_intel: 6, synthetic_muscle: 4, circuit_board: 4 },
      outputs: { ghostwalk_cloak: 1 },
      currencyCost: 3200,
    },

    blackwall_router_craft: {
      name: 'Forge Blackwall Router Spine',
      category: 'cyberware',
      level: 78,
      requiredSkill: 'deep_dive',
      inputs: { daemon_code: 12, net_artifact: 5, neural_implant: 4, circuit_board: 8 },
      outputs: { blackwall_router: 1 },
      currencyCost: 8800,
    },

    corpo_breaker_craft: {
      name: 'Forge Corpo Breaker Shotgun',
      category: 'weapon',
      level: 66,
      requiredSkill: 'weapon_modding',
      inputs: { rifle: 1, chrome_scrap: 14, synthetic_muscle: 6, circuit_board: 6 },
      outputs: { corpo_breaker: 1 },
      currencyCost: 5200,
    },

    daemon_forge_craft: {
      name: 'Compile Daemon Forge Core',
      category: 'cyberware',
      level: 74,
      requiredSkill: 'daemon_coding',
      inputs: { daemon_code: 14, neural_implant: 4, net_artifact: 3, circuit_board: 6 },
      outputs: { daemon_forge: 1 },
      currencyCost: 7600,
    },

    // ===== LEGENDARY CRAFTING RECIPES =====

   plasma_rifle_craft: {
     name: 'Forge Plasma Rifle',
     category: 'weapon',
     level: 90,
     requiredSkill: 'weapon_modding',
     inputs: { rifle: 1, net_artifact: 8, circuit_board: 20, ice_fragment: 15, daemon_code: 12 },
     outputs: { plasma_rifle: 1 },
     currencyCost: 25000,
   },

   obsidian_armor_craft: {
     name: 'Forge Obsidian Combat Armor',
     category: 'armor',
     level: 90,
     requiredSkill: 'chrome_surgery',
     inputs: { ice_shield: 1, chrome_scrap: 30, neural_implant: 10, net_artifact: 6, synthetic_muscle: 8 },
     outputs: { obsidian_plating: 1 },
     currencyCost: 22000,
   },

   chrono_armor_craft: {
     name: 'Infuse Chrono Armor',
     category: 'armor',
     level: 88,
     requiredSkill: 'cyberware_installation',
     inputs: { subdermal_armor: 1, speed_processor: 1, daemon_code: 8, net_artifact: 4, circuit_board: 15 },
     outputs: { chrono_armor: 1 },
     currencyCost: 18000,
   },

   godlike_implant_craft: {
     name: 'Assemble Godlike Quantum Core',
     category: 'cyberware',
     level: 99,
     requiredSkill: 'neural_enhancement',
     inputs: { wealth_accumulator: 1, loot_enhancer: 1, xp_boost_chip: 1, net_artifact: 12, neural_implant: 15, daemon_code: 20 },
     outputs: { godlike_implant: 1 },
     currencyCost: 50000,
   },

   neural_nexus_craft: {
     name: 'Synthesize Neural Nexus Hub',
     category: 'cyberware',
     level: 95,
     requiredSkill: 'neural_enhancement',
     inputs: { neural_implant: 12, daemon_code: 15, net_artifact: 8, encrypted_core_shard: 3 },
     outputs: { neural_nexus: 1 },
     currencyCost: 35000,
   },

   encrypted_core_shard_craft: {
     name: 'Crystallize Encrypted Core Shard',
     category: 'material',
     level: 80,
     requiredSkill: 'decryption',
     inputs: { encrypted_data: 20, data_shard: 30, daemon_code: 5, net_artifact: 2 },
     outputs: { encrypted_core_shard: 1 },
     currencyCost: 8000,
   },

   prototype_nexus_craft: {
     name: 'Engineer Prototype Nexus Core',
     category: 'material',
     level: 85,
     requiredSkill: 'drone_engineering',
     inputs: { drone_chassis: 5, circuit_board: 20, net_artifact: 4, neural_implant: 8 },
     outputs: { prototype_nexus: 1 },
     currencyCost: 12000,
   },

   // ===== TRANSMUTATION RECIPES =====

   transmute_scraps_to_muscle: {
     name: 'Bulk Transmute: Scrap to Muscle',
     category: 'transmutation',
     level: 50,
     requiredSkill: 'cyberware_crafting',
     inputs: { chrome_scrap: 20, circuit_board: 10 },
     outputs: { synthetic_muscle: 5 },
     currencyCost: 500,
   },

   transmute_data_to_daemon: {
     name: 'Transmute: Data to Daemon Code',
     category: 'transmutation',
     level: 55,
     requiredSkill: 'daemon_coding',
     inputs: { data_shard: 25, encrypted_data: 10 },
     outputs: { daemon_code: 5 },
     currencyCost: 800,
   },

   transmute_fragments_to_artifact: {
     name: 'Transmute: Fragments to NET Artifact',
     category: 'transmutation',
     level: 65,
     requiredSkill: 'deep_dive',
     inputs: { ice_fragment: 15, daemon_code: 8, encrypted_data: 10 },
     outputs: { net_artifact: 2 },
     currencyCost: 2000,
   },

   transmute_implants_to_core: {
     name: 'Transmute: Implants to Core Shard',
     category: 'transmutation',
     level: 80,
     requiredSkill: 'neural_enhancement',
     inputs: { neural_implant: 10, net_artifact: 3, daemon_code: 8 },
     outputs: { encrypted_core_shard: 1 },
     currencyCost: 5000,
   },

   transmute_bio_to_healing: {
     name: 'Transmute: Bio Samples to Nanobots',
     category: 'transmutation',
     level: 30,
     requiredSkill: 'biotech',
     inputs: { bio_sample: 10 },
     outputs: { healing_nanobots: 5 },
     currencyCost: 200,
   },

   transmute_cred_to_contraband: {
     name: 'Transmute: Cred to Contraband',
     category: 'transmutation',
     level: 40,
     requiredSkill: 'smuggling',
     inputs: { street_cred_token: 15, stolen_intel: 5 },
     outputs: { contraband: 5 },
     currencyCost: 400,
   },
};

export class Crafter {
  constructor(inventory, economy, skillManager) {
    this.inventory = inventory;
    this.economy = economy;
    this.skillManager = skillManager;
  }

  canCraft(recipeId) {
    const recipe = CRAFT_RECIPES[recipeId];
    if (!recipe) return { can: false, reason: 'Recipe not found' };

    // Check skill level
    const skill = this.skillManager.getSkill(recipe.requiredSkill);
    if (!skill) return { can: false, reason: 'Skill not found' };
    if (skill.level < recipe.level) {
      return { can: false, reason: `Requires ${recipe.requiredSkill} level ${recipe.level}` };
    }

    // Check inputs
    for (const [itemId, qty] of Object.entries(recipe.inputs)) {
      if (!this.inventory.hasItem(itemId, qty)) {
        return { can: false, reason: `Need ${qty}x ${itemId}` };
      }
    }

    // Check currency
    if (this.economy.getCurrency() < recipe.currencyCost) {
      return { can: false, reason: `Need E$ ${recipe.currencyCost}` };
    }

    return { can: true };
  }

  craft(recipeId) {
    const recipe = CRAFT_RECIPES[recipeId];
    if (!recipe) return false;

    const check = this.canCraft(recipeId);
    if (!check.can) {
      events.emit(EVENTS.UI_NOTIFICATION, { message: check.reason, type: 'error' });
      return false;
    }

    // Remove inputs
    for (const [itemId, qty] of Object.entries(recipe.inputs)) {
      this.inventory.removeItem(itemId, qty);
    }

    // Pay currency
    this.economy.removeCurrency(recipe.currencyCost);

    // Grant outputs
    for (const [itemId, qty] of Object.entries(recipe.outputs)) {
      this.inventory.addItem(itemId, qty);
    }

    // Grant XP to the required skill (40-50% of equivalent activity XP at that level)
    const skill = this.skillManager.getSkill(recipe.requiredSkill);
    if (skill) {
      const craftXP = Math.floor(recipe.level * 5 + recipe.currencyCost * 0.05);
      const prestigeMult = skill.prestige ? skill.prestige.getXPMultiplier() : 1.0;
      skill.gainXP(craftXP, `craft_${recipeId}`, prestigeMult);
    }

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `Crafted: ${recipe.name}`,
      type: 'info',
    });

    return true;
  }

  getAvailableRecipes() {
    return Object.entries(CRAFT_RECIPES)
      .filter(([id, recipe]) => {
        const skill = this.skillManager.getSkill(recipe.requiredSkill);
        return skill && skill.level >= recipe.level;
      })
      .map(([id, recipe]) => ({
        id,
        ...recipe,
        canCraft: this.canCraft(id).can,
      }));
  }

  serialize() {
    return {};
  }

  deserialize(data) {
    // Crafter is stateless, nothing to restore
  }
}
