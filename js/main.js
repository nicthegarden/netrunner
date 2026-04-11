import { events, EVENTS } from './engine/events.js';
import { SaveManager } from './engine/save.js';
import { GameLoop } from './engine/gameLoop.js';
import { OfflineProgress } from './engine/offline.js';
import { SkillManager } from './systems/skills.js';
import { Inventory } from './systems/inventory.js';
import { Economy } from './systems/economy.js';
import { Equipment } from './systems/equipment.js';
import { Combat } from './systems/combat.js';
import { Player, Achievements } from './systems/player.js';
import { Crafter } from './systems/crafting.js';
import { Prestige } from './systems/prestige.js';
import { PassiveStats } from './systems/passiveStats.js';
import { AbilityManager } from './systems/abilities.js';
import { LivingWorld } from './systems/livingWorld.js';
import { SyncManager } from './network/sync.js';
import { ACTIVITIES, ENEMIES } from './data/skillData.js';

export class Game {
  constructor() {
    this.player = new Player();
    this.skillManager = new SkillManager();
    this.inventory = new Inventory();
    this.economy = new Economy();
    this.equipment = new Equipment();
    this.combat = new Combat(this.inventory, this.economy, this.equipment);
    this.achievements = new Achievements();
    this.crafter = new Crafter(this.inventory, this.economy, this.skillManager);
    this.prestige = new Prestige();
    this.skillManager.prestige = this.prestige; // Wire prestige to SkillManager
    this.economy.prestige = this.prestige; // Wire prestige to Economy
    this.economy.equipment = this.equipment; // Wire equipment to Economy (Tier 4b)
    this.skillManager.equipment = this.equipment; // Wire equipment to SkillManager (speedBoost)
    this.combat.prestige = this.prestige; // Wire prestige to Combat (combat damage bonus)
    this.passiveStats = new PassiveStats(this.skillManager, this.equipment, this.prestige);
    this.abilityManager = new AbilityManager(this.skillManager);
    this.skillManager.passiveStats = this.passiveStats; // Wire passive stats to SkillManager (XP/speed bonuses)
    this.economy.passiveStats = this.passiveStats; // Wire passive stats to Economy (currency bonus)
    this.combat.passiveStats = this.passiveStats; // Wire passive stats to Combat
    this.combat.abilityManager = this.abilityManager; // Wire abilities to Combat
    this.livingWorld = new LivingWorld(); // Living world system (contracts, PvP, events, leaderboards)
    this.gameLoop = new GameLoop(this);
    this.saveManager = new SaveManager(this);
    this.offlineProgress = new OfflineProgress(this);
    this.syncManager = new SyncManager(this); // Multiplayer sync
    this._eventUnsubs = [];
    this.eventBus = events; // Expose EventBus for SyncManager
  }

  init() {
    // Wire up event listeners for reward distribution and achievement checking
    this._wireEvents();

    // Try to load from server first (if authenticated)
    // Then fall back to localStorage
    const saveData = this.saveManager.load();
    if (saveData) {
      this.loadGame(saveData);
      // Calculate offline progress
      const offlineData = this.offlineProgress.calculate(saveData.timestamp);
      if (offlineData) {
        this.offlineProgress.apply(offlineData).then(() => {
          events.emit(EVENTS.UI_NOTIFICATION, {
            message: `Welcome back! You were away for ${offlineData.hours}h ${offlineData.minutes}m. Offline progress applied.`,
            type: 'info',
          });
        });
      }
    } else {
      // Grant starting resources
      this.inventory.addItem('data_shard', 10);
      this.inventory.addItem('circuit_board', 5);
      this.economy.addCurrency(500);
    }

    // Start game loop and auto-save
    this.gameLoop.start();
    this.saveManager.startAutoSave();
    
    // Start server auto-save (every 2 minutes if authenticated)
    this.startServerAutoSave();
    
    // Start progress sync to backend (every 5 minutes)
    this.startProgressSync();

    // Setup multiplayer (try to login with existing token if available)
    this._initMultiplayer();
    
    // Sync before unload
    window.addEventListener('beforeunload', () => {
      if (this.syncManager) {
        this.syncManager.syncBeforeUnload();
      }
    });
    
    events.emit(EVENTS.GAME_LOADED, {
      player: this.player,
      skills: this.skillManager.getAllSkills(),
    });
  }

  // Auto-save game to server (every 2 minutes if authenticated)
  startServerAutoSave() {
    setInterval(async () => {
      const hasAuth = window.gameAuthState?.accessToken;
      if (hasAuth) {
        try {
          await this.saveManager.uploadToServer();
        } catch (error) {
          console.error('Server auto-save failed:', error);
        }
      }
    }, 120000); // 2 minutes
  }

  // Sync game progress to backend every 5 minutes
  startProgressSync() {
    setInterval(async () => {
      if (window.gameClient?.isAuthenticated?.()) {
        try {
          await window.gameClient.sync({
            skills: Object.fromEntries(
              Object.entries(this.skillManager.skills || {}).map(([key, skill]) => [
                key,
                { level: skill.level, xp: skill.xp }
              ])
            ),
            inventory: {
              items: this.inventory.items || [],
              slots: this.inventory.slots || 100
            },
            economy: {
              eurodollar: this.economy?.currency || 0,
              totalEarned: this.economy?.totalEarned || 0
            },
            playtime: this.player?.playtime || 0,
            prestige: {
              level: this.prestige?.level || 0,
              totalResets: this.prestige?.totalResets || 0
            }
          });
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  _wireEvents() {
    // Distribute rewards when a skill action completes
    this._eventUnsubs.push(
      events.on(EVENTS.SKILL_ACTION_COMPLETE, (data) => {
        if (data.rewards) {
          // Get loot boost from equipment (Tier 4b)
          const equipEffects = this.equipment.getSpecialEffects();
          let lootMultiplier = 1 + (equipEffects.lootBoost || 0);

          // Add skill-derived loot bonus (e.g., Deep Dive, Smuggling, Drone Engineering)
          if (this.passiveStats) {
            const skillLootBonus = this.passiveStats.getSkillBonus('lootBonus');
            if (skillLootBonus > 0) {
              lootMultiplier += (skillLootBonus / 100);
            }
          }
          
          // Give currency
          if (data.rewards.currency > 0) {
            this.economy.addCurrency(data.rewards.currency);
          }
          // Give items with loot boost multiplier
          if (data.rewards.items) {
            Object.entries(data.rewards.items).forEach(([itemId, qty]) => {
              const boostedQty = Math.ceil(qty * lootMultiplier);
              this.inventory.addItem(itemId, boostedQty);
            });
          }
        }
      })
    );

    // Give combat XP when enemy defeated
    this._eventUnsubs.push(
      events.on(EVENTS.COMBAT_ENEMY_DEFEATED, (data) => {
        const combatSkill = this.skillManager.getSkill('combat');
        if (combatSkill && data.xp) {
          const prestigeMult = this.prestige.getXPMultiplier();
          combatSkill.gainXP(data.xp, 'combat_victory', prestigeMult, this.equipment);
        }
        // Also give black_ice_combat XP if the defeated enemy is referenced by any black_ice_combat activity
        const bic = this.skillManager.getSkill('black_ice_combat');
        if (bic && ACTIVITIES.black_ice_combat) {
          // Build set of enemy display names from black_ice_combat activities
          const bicEnemyNames = new Set(
            ACTIVITIES.black_ice_combat
              .filter(a => a.enemy)
              .map(a => {
                const def = ENEMIES[Object.keys(ENEMIES).find(k => ENEMIES[k].id === a.enemy)];
                return def ? def.name : null;
              })
              .filter(Boolean)
          );
          if (bicEnemyNames.has(data.enemy)) {
            const prestigeMult = this.prestige.getXPMultiplier();
            bic.gainXP(Math.floor(data.xp * 0.5), 'ice_combat', prestigeMult, this.equipment);
          }
        }
        // Check first kill achievement
        this.achievements.unlock('first_kill');
      })
    );

    // Handle player death
    this._eventUnsubs.push(
      events.on(EVENTS.COMBAT_PLAYER_DIED, (data) => {
        events.emit(EVENTS.UI_NOTIFICATION, {
          message: `You were defeated by ${data.enemy || 'an enemy'}! Respawning...`,
          type: 'error',
        });
      })
    );

    // Track play time every tick
    this._eventUnsubs.push(
      events.on(EVENTS.GAME_TICK, () => {
        this.player.addPlayTime(1);
      })
    );

    // Check achievements on level up
    this._eventUnsubs.push(
      events.on(EVENTS.SKILL_LEVEL_UP, (data) => {
        this._checkSkillAchievements(data);
      })
    );

    // Check currency achievements
    this._eventUnsubs.push(
      events.on(EVENTS.CURRENCY_CHANGED, (data) => {
        if (data.currency >= 10000) this.achievements.unlock('rich');
        if (data.totalEarned >= 1000000) this.achievements.unlock('millionaire');
      })
    );

    // Check collector achievement on inventory change
    this._eventUnsubs.push(
      events.on(EVENTS.INVENTORY_CHANGED, (items) => {
        if (items && items.length >= 10) this.achievements.unlock('collector');
      })
    );

    // Wire contract rewards
    this._eventUnsubs.push(
      events.on(EVENTS.CONTRACT_COMPLETED, (data) => {
        if (data.reward > 0) {
          this.economy.addCurrency(data.reward);
        }
        // Distribute loot from contract
        if (data.lootPool && data.lootPool.items) {
          Object.entries(data.lootPool.items).forEach(([itemId, spec]) => {
            const qty = spec.min + Math.floor(Math.random() * (spec.max - spec.min + 1));
            if (qty > 0) {
              this.inventory.addItem(itemId, qty);
            }
          });
        }
        events.emit(EVENTS.UI_NOTIFICATION, {
          message: `✓ Contract completed: "${data.contract.name}"`,
          type: 'success',
        });
      })
    );

    // Wire PvP hack rewards
    this._eventUnsubs.push(
      events.on(EVENTS.PVP_HACK_SUCCESS, (data) => {
        if (data.reward > 0) {
          this.economy.addCurrency(data.reward);
        }
        // Distribute loot from hack
        if (data.lootPool && data.lootPool.items) {
          Object.entries(data.lootPool.items).forEach(([itemId, spec]) => {
            const qty = spec.min + Math.floor(Math.random() * (spec.max - spec.min + 1));
            if (qty > 0) {
              this.inventory.addItem(itemId, qty);
            }
          });
        }
        events.emit(EVENTS.UI_NOTIFICATION, {
          message: `✓ Successfully hacked ${data.target.name} (${data.target.faction})!`,
          type: 'success',
        });
      })
    );

    // PvP hack failure message
    this._eventUnsubs.push(
      events.on(EVENTS.PVP_HACK_FAILED, (data) => {
        events.emit(EVENTS.UI_NOTIFICATION, {
          message: `✗ Failed to hack ${data.target.name}. Success chance was ${Math.floor(data.successChance * 100)}%.`,
          type: 'warning',
        });
      })
    );

    // Update leaderboards on skill level up
    this._eventUnsubs.push(
      events.on(EVENTS.SKILL_LEVEL_UP, (data) => {
        if (this.livingWorld && this.player.name) {
          this.livingWorld.updateLeaderboard(
            data.skill,
            this.player.name,
            data.newLevel,
            data.currentXP
          );
        }
      })
    );

    // Record XP gains for sync (multiplayer)
    this._eventUnsubs.push(
      events.on(EVENTS.SKILL_XP_GAINED, (data) => {
        if (this.syncManager) {
          this.syncManager.recordAction('xp_gain', data.skill, data.xp, {
            skillName: data.skillName,
            currentLevel: data.currentLevel
          });
        }
      })
    );

    // Record combat victories for sync (multiplayer)
    this._eventUnsubs.push(
      events.on(EVENTS.COMBAT_ENEMY_DEFEATED, (data) => {
        if (this.syncManager && data.xp) {
          this.syncManager.recordAction('combat_victory', 'combat', data.xp, {
            enemyName: data.enemy,
            enemyHp: data.enemyHp
          });
        }
      })
    );

    // Record item gains for sync (multiplayer)
    this._eventUnsubs.push(
      events.on(EVENTS.ITEM_GAINED, (data) => {
        if (this.syncManager) {
          this.syncManager.recordAction('item_gained', null, data.quantity, {
            itemId: data.itemId || data.item,
            itemName: data.itemName || data.item,
            itemIcon: data.icon
          });
        }
      })
    );
  }

  _checkSkillAchievements(data) {
    const { newLevel } = data;
    if (newLevel >= 2) this.achievements.unlock('first_level');
    if (newLevel >= 10) this.achievements.unlock('level_10');
    if (newLevel >= 25) this.achievements.unlock('level_25');
    if (newLevel >= 99) this.achievements.unlock('legendary');

    // Skill-specific achievements
    if (data.skill === 'intrusion' && newLevel >= 50) this.achievements.unlock('hacker');
    if (data.skill === 'combat' && newLevel >= 50) this.achievements.unlock('street_fighter');
    if (data.skill === 'deep_dive' && newLevel >= 50) this.achievements.unlock('netrunner');
    if (data.skill === 'cyberware_crafting' && newLevel >= 50) this.achievements.unlock('tech_wizard');
  }

  saveGame() {
    return this.saveManager.save();
  }

  loadGame(saveData) {
    if (saveData.player) this.player.deserialize(saveData.player);
    if (saveData.skills) this.skillManager.deserialize(saveData.skills);
    if (saveData.inventory) this.inventory.deserialize(saveData.inventory);
    if (saveData.economy) this.economy.deserialize(saveData.economy);
    if (saveData.equipment) this.equipment.deserialize(saveData.equipment);
    if (saveData.combat) this.combat.deserialize(saveData.combat);
    if (saveData.achievements) this.achievements.deserialize(saveData.achievements);
    if (saveData.prestige) this.prestige.deserialize(saveData.prestige);
    if (saveData.abilities) this.abilityManager.deserialize(saveData.abilities);
    if (saveData.livingWorld) this.livingWorld.deserialize(saveData.livingWorld);
  }

  resetGame() {
    // FIXED: Stop old intervals before creating new ones
    this.gameLoop.stop();
    this.saveManager.stopAutoSave();
    // Unsubscribe old event listeners
    this._eventUnsubs.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
    this._eventUnsubs = [];

    this.saveManager.deleteSave();
    this.player = new Player();
    this.skillManager = new SkillManager();
    this.inventory = new Inventory();
    this.economy = new Economy();
    this.equipment = new Equipment();
    this.combat = new Combat(this.inventory, this.economy, this.equipment);
    this.achievements = new Achievements();
    this.crafter = new Crafter(this.inventory, this.economy, this.skillManager);
    this.prestige = new Prestige();
    this.skillManager.prestige = this.prestige; // Wire prestige to SkillManager
    this.economy.prestige = this.prestige; // Wire prestige to Economy
    this.economy.equipment = this.equipment; // Wire equipment to Economy (Tier 4b)
    this.skillManager.equipment = this.equipment; // Wire equipment to SkillManager (speedBoost)
    this.combat.prestige = this.prestige; // Wire prestige to Combat (combat damage bonus)
    this.passiveStats = new PassiveStats(this.skillManager, this.equipment, this.prestige);
    this.abilityManager = new AbilityManager(this.skillManager);
    this.skillManager.passiveStats = this.passiveStats; // Wire passive stats to SkillManager (XP/speed bonuses)
    this.economy.passiveStats = this.passiveStats; // Wire passive stats to Economy (currency bonus)
   this.combat.passiveStats = this.passiveStats; // Wire passive stats to Combat
     this.combat.abilityManager = this.abilityManager; // Wire abilities to Combat
     this.livingWorld = new LivingWorld(); // Recreate living world on reset
     this.gameLoop = new GameLoop(this);
    // Re-use existing save manager but update reference
    this.saveManager.game = this;
    this.offlineProgress.game = this;
    events.emit(EVENTS.GAME_RESET, {});
    this.init();
  }

  /**
   * Initialize multiplayer - attempt to login with existing token
   */
  async _initMultiplayer() {
    if (!this.syncManager) return;

    // Try to login with existing token
    if (this.syncManager.token) {
      const success = await this.syncManager.loginWithToken(this.syncManager.token);
      if (success) {
        console.log('Multiplayer enabled');
        // Optional: perform initial sync
        await this.syncManager.sync();
      }
    }
  }

  exportSave() {
    return this.saveManager.exportSave();
  }

  importSave(b64) {
    return this.saveManager.importSave(b64);
  }

  shutdown() {
    this.gameLoop.stop();
    this.saveManager.stopAutoSave();
    this.saveGame();
  }
}

// Global game instance
export let gameInstance;

export function initGame() {
  gameInstance = new Game();
  gameInstance.init();
  return gameInstance;
}

export function getGame() {
  return gameInstance;
}
