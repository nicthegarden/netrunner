import { events, EVENTS } from '../engine/events.js';
import { calculateRequiredXP, getTotalXPForLevel, SKILLS, ACTIVITIES, BACKGROUND_HACK_SKILLS, BACKGROUND_HACK_EFFICIENCY } from '../data/skillData.js';

export class Skill {
  constructor(id, name, category, icon, color, prestige = null) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.icon = icon;
    this.color = color;
    this.level = 1;
    this.xp = 0;
    this.masteryData = {}; // { activityId: { level, xp } }
    this.isActive = false;
    this.activeAction = null;
    this.prestige = prestige;
    this.actionProgress = 0;
    this._isBackgroundHack = false; // true when running as background hacking task
  }

  getXPForNextLevel() {
    return getTotalXPForLevel(this.level);
  }

  getXPForCurrentLevel() {
    return this.level <= 1 ? 0 : getTotalXPForLevel(this.level - 1);
  }

  getXPProgress() {
    const currentLevelXP = this.getXPForCurrentLevel();
    const nextLevelXP = this.getXPForNextLevel();
    const progressXP = this.xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    return { current: progressXP, needed: neededXP, percent: neededXP > 0 ? (progressXP / neededXP) * 100 : 100 };
  }

   gainXP(amount, sourceAction = null, prestigeMultiplier = 1.0, equipment = null) {
     if (this.level >= 99) return;
     
     // Apply prestige multiplier first, then mastery bonus (1% per mastery level)
     let multiplier = prestigeMultiplier;
     if (sourceAction && this.masteryData[sourceAction]) {
       const masteryLevel = this.masteryData[sourceAction].level;
       multiplier += (masteryLevel * 0.01);
     }
     
     // Apply equipment XP boost if available (Tier 4b)
     if (equipment) {
       const effects = equipment.getSpecialEffects();
       if (effects.xpBoost > 0) {
         multiplier += effects.xpBoost;
       }
     }

     // Apply skill-derived XP bonus from passive stats (e.g., Decryption, Info Brokering, Neural Enhancement)
     if (this._passiveStats) {
       const skillXpBonus = this._passiveStats.getSkillBonus('xpBonus');
       if (skillXpBonus > 0) {
         multiplier += (skillXpBonus / 100); // convert from % to decimal
       }
     }
     
     const finalXP = Math.floor(amount * multiplier);
     this.xp += finalXP;
     
     events.emit(EVENTS.SKILL_XP_GAINED, {
       skill: this.id,
       xp: finalXP,
       currentXP: this.xp,
       currentLevel: this.level,
     });

     // Check for level up (support multi-level-up)
     while (this.level < 99 && this.xp >= getTotalXPForLevel(this.level)) {
       this.levelUp();
     }

     // Gain mastery XP if applicable
     if (sourceAction) {
       this.gainMasteryXP(sourceAction, Math.floor(amount * 0.5));
     }
   }

  levelUp() {
    if (this.level >= 99) return;
    this.level++;
    events.emit(EVENTS.SKILL_LEVEL_UP, {
      skill: this.id,
      skillName: this.name,
      newLevel: this.level,
    });
  }

   gainMasteryXP(actionId, amount) {
     if (!this.masteryData[actionId]) {
       this.masteryData[actionId] = { level: 1, xp: 0 };
     }
     
     // Apply prestige masteryXpBonus (Tier 2e)
     let multiplier = 1.0;
     if (this.prestige) {
       multiplier += (this.prestige.bonuses.masteryXpBonus / 100);
     }
     
     this.masteryData[actionId].xp += Math.floor(amount * multiplier);

     // FIXED: Check for mastery level up
     const mastery = this.masteryData[actionId];
     while (mastery.xp >= mastery.level * 100 && mastery.level < 99) {
       mastery.xp -= mastery.level * 100;
       mastery.level++;
       events.emit(EVENTS.MASTERY_LEVEL_UP, {
         skill: this.id,
         action: actionId,
         newLevel: mastery.level,
       });
     }

     events.emit(EVENTS.MASTERY_XP_GAINED, {
       skill: this.id,
       action: actionId,
       xp: amount,
       masteryLevel: mastery.level,
     });
   }

  getMasteryLevel(actionId) {
    return this.masteryData[actionId]?.level || 1;
  }

  getAvailableActivities() {
    const activities = ACTIVITIES[this.id];
    if (!activities) return [];
    return activities.filter(a => this.level >= a.level);
  }

  getAllActivities() {
    return ACTIVITIES[this.id] || [];
  }

  startAction(actionId) {
    const activities = ACTIVITIES[this.id];
    if (!activities) return false;
    const action = activities.find(a => a.id === actionId);
    if (!action) return false;
    if (this.level < action.level) return false;

    this.isActive = true;
    this.activeAction = action;
    this.actionProgress = 0;
    events.emit(EVENTS.SKILL_STARTED, { skill: this.id, action: actionId, actionName: action.name });
    return true;
  }

  stopAction() {
    const wasActive = this.isActive;
    this.isActive = false;
    this.activeAction = null;
    this.actionProgress = 0;
    if (wasActive) {
      events.emit(EVENTS.SKILL_STOPPED, { skill: this.id });
    }
  }

  tick() {
    if (!this.isActive || !this.activeAction) return null;
    // Combat-type activities don't tick here — combat system handles them
    if (this.activeAction.enemy) return null;

    this.actionProgress++;
    let duration = this.activeAction.duration;
    
    // Apply equipment speedBoost (reduces duration) via SkillManager reference
    if (this._equipment) {
      const effects = this._equipment.getSpecialEffects();
      if (effects.speedBoost > 0) {
        duration = Math.max(1, Math.ceil(duration * (1 - effects.speedBoost)));
      }
    }

    // Apply skill-derived action speed bonus from passive stats (e.g., Neural Surfing, Vehicle Tuning)
    if (this._passiveStats) {
      const skillSpeedBonus = this._passiveStats.getSkillBonus('actionSpeed');
      if (skillSpeedBonus > 0) {
        duration = Math.max(1, Math.ceil(duration * (1 - skillSpeedBonus / 100)));
      }
    }

    if (this.actionProgress >= duration) {
      const result = this.completeAction();
      this.actionProgress = 0;
      return result;
    }

    return null;
  }

   completeAction() {
     const action = this.activeAction;
     const prestigeMult = this.prestige ? this.prestige.getXPMultiplier() : 1.0;
     
     // Apply background hack efficiency penalty (75% XP when running in background)
     const bgEfficiency = this._isBackgroundHack ? BACKGROUND_HACK_EFFICIENCY : 1.0;
     this.gainXP(Math.floor(action.xp * bgEfficiency), action.id, prestigeMult, this._equipment);

     // Build rewards result
     const rewardResult = { xp: action.xp, items: {}, currency: 0, isBackground: this._isBackgroundHack };

     if (action.rewards) {
       // Currency rewards (reduced by background efficiency)
       if (action.rewards.currency) {
         const range = action.rewards.currency;
         const baseCurrency = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
         rewardResult.currency = Math.floor(baseCurrency * bgEfficiency);
       }
       // Item rewards (apply materialDropBonus - Tier 2d, reduced by background efficiency)
       if (action.rewards.items) {
         let dropBonus = 1.0;
         if (this.prestige) {
           dropBonus = 1.0 + (this.prestige.bonuses.materialDropBonus / 100);
         }
         
         Object.entries(action.rewards.items).forEach(([itemId, range]) => {
           const qty = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
           const boostedQty = Math.max(1, Math.floor(qty * dropBonus * bgEfficiency));
           if (boostedQty > 0) {
             rewardResult.items[itemId] = boostedQty;
           }
         });
       }
     }

     events.emit(EVENTS.SKILL_ACTION_COMPLETE, {
       skill: this.id,
       action: action.id,
       xp: action.xp,
       rewards: rewardResult,
     });

     this.actionProgress = 0;
     return rewardResult;
   }

  serialize() {
    return {
      id: this.id,
      level: this.level,
      xp: this.xp,
      masteryData: this.masteryData,
      isActive: this.isActive,
      activeAction: this.activeAction?.id || null,
      actionProgress: this.actionProgress,
    };
  }

  deserialize(data) {
    this.level = data.level || 1;
    this.xp = data.xp || 0;
    this.masteryData = data.masteryData || {};
    this.isActive = data.isActive || false;
    if (data.activeAction) {
      const activities = ACTIVITIES[this.id] || [];
      this.activeAction = activities.find(a => a.id === data.activeAction) || null;
    }
    this.actionProgress = data.actionProgress || 0;
    // If we couldn't find the action, stop
    if (this.isActive && !this.activeAction) {
      this.isActive = false;
    }
  }
}

export class SkillManager {
  constructor(prestige = null) {
    this.skills = {};
    this._prestige = prestige;
    this._equipment = null;
    this._passiveStats = null;
    // Background hacking state
    this.backgroundHack = null; // { skillId, actionId } or null
    this.initializeSkills();
  }

  set equipment(eq) {
    this._equipment = eq;
    // Propagate to all skills
    Object.values(this.skills).forEach(skill => {
      skill._equipment = eq;
    });
  }

  get equipment() {
    return this._equipment;
  }

  set passiveStats(ps) {
    this._passiveStats = ps;
    // Propagate to all skills
    Object.values(this.skills).forEach(skill => {
      skill._passiveStats = ps;
    });
  }

  get passiveStats() {
    return this._passiveStats;
  }

  set prestige(p) {
    this._prestige = p;
    // Propagate to all skills so Skill.prestige is never null when prestige exists
    Object.values(this.skills).forEach(skill => {
      skill.prestige = p;
    });
  }

  get prestige() {
    return this._prestige;
  }

  initializeSkills() {
    Object.values(SKILLS).forEach(skillDef => {
      this.skills[skillDef.id] = new Skill(
        skillDef.id, skillDef.name, skillDef.category, skillDef.icon, skillDef.color, this.prestige
      );
    });
  }

  getSkill(id) {
    return this.skills[id];
  }

  getAllSkills() {
    return Object.values(this.skills);
  }

  getSkillsByCategory(category) {
    return Object.values(this.skills).filter(s => s.category === category);
  }

  // ==========================================
  // Background Hacking
  // ==========================================

  /**
   * Check if background hacking is possible right now.
   * Requires: equipped cyberware with parallelHacking, and no current background hack running.
   */
  canBackgroundHack() {
    return !!(this._equipment && this._equipment.hasParallelHacking());
  }

  /**
   * Check if a skill can be used as a background hack.
   * Must be a hacking-category skill with non-combat activities.
   */
  isBackgroundHackSkill(skillId) {
    return BACKGROUND_HACK_SKILLS.has(skillId);
  }

  /**
   * Start a background hacking activity.
   * Returns true on success.
   */
  startBackgroundHack(skillId, actionId) {
    if (!this.canBackgroundHack()) return false;
    if (!this.isBackgroundHackSkill(skillId)) return false;
    if (this.backgroundHack) return false; // already running one

    const skill = this.skills[skillId];
    if (!skill) return false;

    const activities = ACTIVITIES[skillId];
    if (!activities) return false;
    const action = activities.find(a => a.id === actionId);
    if (!action) return false;
    if (skill.level < action.level) return false;
    if (action.enemy) return false; // combat activities can't run in background

    // If this skill is already running as primary, block
    if (skill.isActive && !skill._isBackgroundHack) return false;

    // Stop any existing primary action on this skill
    if (skill.isActive) skill.stopAction();

    // Start the background hack
    skill._isBackgroundHack = true;
    skill.isActive = true;
    skill.activeAction = action;
    skill.actionProgress = 0;
    this.backgroundHack = { skillId, actionId };

    events.emit(EVENTS.SKILL_STARTED, {
      skill: skillId,
      action: actionId,
      actionName: action.name,
      isBackground: true,
    });
    return true;
  }

  /**
   * Stop the current background hack.
   */
  stopBackgroundHack() {
    if (!this.backgroundHack) return;
    const skill = this.skills[this.backgroundHack.skillId];
    if (skill) {
      skill._isBackgroundHack = false;
      skill.stopAction();
    }
    this.backgroundHack = null;
  }

  /**
   * Get the currently running background hack info (for UI display).
   * Returns { skill, action, progress, duration, efficiency } or null.
   */
  getBackgroundHackInfo() {
    if (!this.backgroundHack) return null;
    const skill = this.skills[this.backgroundHack.skillId];
    if (!skill || !skill.isActive || !skill.activeAction) return null;

    let duration = skill.activeAction.duration;
    // Apply speed bonuses (same as normal tick)
    if (skill._equipment) {
      const effects = skill._equipment.getSpecialEffects();
      if (effects.speedBoost > 0) {
        duration = Math.max(1, Math.ceil(duration * (1 - effects.speedBoost)));
      }
    }
    if (skill._passiveStats) {
      const skillSpeedBonus = skill._passiveStats.getSkillBonus('actionSpeed');
      if (skillSpeedBonus > 0) {
        duration = Math.max(1, Math.ceil(duration * (1 - skillSpeedBonus / 100)));
      }
    }

    return {
      skill,
      action: skill.activeAction,
      progress: skill.actionProgress,
      duration,
      efficiency: BACKGROUND_HACK_EFFICIENCY,
    };
  }

  tick() {
    Object.values(this.skills).forEach(skill => {
      // Skip background hack skill here — we tick it separately below
      if (skill._isBackgroundHack) return;
      skill.tick();
      // Reward distribution is handled via events emitted from skill.completeAction()
    });

    // Tick background hack separately (if running and cyberware still equipped)
    if (this.backgroundHack) {
      if (!this.canBackgroundHack()) {
        // Cyberware was unequipped — stop background hack
        this.stopBackgroundHack();
      } else {
        const bgSkill = this.skills[this.backgroundHack.skillId];
        if (bgSkill && bgSkill.isActive && bgSkill._isBackgroundHack) {
          bgSkill.tick();
        } else {
          // Skill somehow stopped — clean up
          this.backgroundHack = null;
        }
      }
    }
  }

  getTotalLevel() {
    return Object.values(this.skills).reduce((sum, s) => sum + s.level, 0);
  }

  serialize() {
    const data = {};
    Object.entries(this.skills).forEach(([id, skill]) => {
      data[id] = skill.serialize();
    });
    return {
      skills: data,
      backgroundHack: this.backgroundHack,
    };
  }

  deserialize(data) {
    if (!data) return;
    // Support both old format (flat skills object) and new format (with backgroundHack)
    const skillsData = data.skills || data;
    Object.entries(skillsData).forEach(([id, skillData]) => {
      if (this.skills[id] && skillData && typeof skillData === 'object' && skillData.id) {
        this.skills[id].deserialize(skillData);
      }
    });

    // Restore background hack state
    if (data.backgroundHack) {
      const bg = data.backgroundHack;
      const skill = this.skills[bg.skillId];
      if (skill && skill.isActive && skill.activeAction?.id === bg.actionId) {
        skill._isBackgroundHack = true;
        this.backgroundHack = bg;
      }
    }
  }
}
