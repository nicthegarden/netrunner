/**
 * VIRUS SYSTEM - Phase 2 Implementation
 * 
 * Manages:
 * - Virus infections from hacking activities
 * - Virus types with different mechanics
 * - Compromise chance calculations
 * - Virus progression and cascading infections
 * - Removal timers at clinic
 */

import { events, EVENTS } from '../engine/events.js';

export class VirusManager {
  constructor() {
    this.viruses = []; // Array of active Virus instances
    this.virusLog = []; // Historical log for analytics
    this.immunityTimer = 0; // Grace period after virus removal (no new infections for 5 min)
  }

  // ============================================
  // Virus Types & Constants
  // ============================================

  static VIRUS_TYPES = {
    DATA_CORRUPTION: {
      id: 'data_corruption',
      name: 'Data Corruption',
      icon: '💾',
      severity: 'low',
      duration: 3600000, // 1 hour in ms
      effect: 'xp_reduction',
      effectValue: -0.10, // -10% XP
      cascadeChance: 0.05, // 5% chance to cause next infection
      removalCost: 500,
      description: 'Corrupts skill data. You earn 10% less XP.'
    },

    SYSTEM_CRASH: {
      id: 'system_crash',
      name: 'System Crash',
      icon: '💥',
      severity: 'medium',
      duration: 5400000, // 1.5 hours in ms
      effect: 'currency_drain', // Random E$ drain on activity completion
      effectValue: 50, // Drain 50 E$ per trigger
      triggerChance: 0.15, // 15% chance per activity completion
      cascadeChance: 0.15, // 15% chance to cause next infection
      removalCost: 1500,
      description: 'System crashes randomly. Lose 50 E$ per crash (15% per action).'
    },

    PAYLOAD_LEAK: {
      id: 'payload_leak',
      name: 'Payload Leak',
      icon: '📡',
      severity: 'high',
      duration: 7200000, // 2 hours in ms
      effect: 'item_loss', // Random item deletion on activity completion
      effectValue: 1, // Lose 1 item per trigger
      triggerChance: 0.10, // 10% chance per activity completion
      cascadeChance: 0.25, // 25% chance to cause next infection
      removalCost: 2500,
      description: 'Leaks your inventory. Lose random items (10% per action).'
    },

    DEEP_INTRUSION: {
      id: 'deep_intrusion',
      name: 'Deep Intrusion',
      icon: '🔓',
      severity: 'critical',
      duration: 10800000, // 3 hours in ms
      effect: 'compound', // Combines all effects + vulnerability
      effectValue: { xpReduction: -0.25, currencyDrain: 100, itemLoss: 1 },
      triggerChance: 0.20, // 20% chance per activity completion
      cascadeChance: 0.50, // 50% chance to cause next infection (DANGEROUS!)
      removalCost: 5000,
      description: 'Critical breach. All effects active + 50% cascade to new virus. DANGEROUS!',
      screenCorruption: 'severe' // Visual glitches
    }
  };

  static SCREEN_CORRUPTION_EFFECTS = {
    // How viruses corrupt the screen display
    low: {
      // Data Corruption: minor text glitches
      glitchChance: 0.02, // 2% chance per frame
      effectType: 'text_scramble', // Random character replacement
      intensity: 0.05, // 5% of text affected
      colorShift: null
    },

    medium: {
      // System Crash: occasional pixel distortion
      glitchChance: 0.05, // 5% chance per frame
      effectType: 'pixel_drift', // Elements shift slightly
      intensity: 0.10, // 10% offset
      colorShift: '#ff000044' // Red tint
    },

    high: {
      // Payload Leak: frequent glitches, color corruption
      glitchChance: 0.10, // 10% chance per frame
      effectType: 'text_scramble_heavy', // More text affected
      intensity: 0.20, // 20% of text affected
      colorShift: '#ff00ff66', // Magenta tint
      scanlines: true // CRT scanline effect intensified
    },

    severe: {
      // Deep Intrusion: major corruption, words misspelled
      glitchChance: 0.25, // 25% chance per frame
      effectType: 'word_corruption', // Whole words scrambled
      intensity: 0.50, // 50% of text affected
      colorShift: '#ff0000aa', // Red tint
      scanlines: true,
      rotation: true // Slight rotation/skew
    }
  };

  // ============================================
  // Compromise & Infection Detection
  // ============================================

  /**
   * Calculate compromise chance for hacking activity
   * Formula: base(15-35%) - skillLevel(0.5%) - defense(2%) - prestige(1%)
   * 
   * @param {number} skillLevel - Intrusion skill level
   * @param {number} defense - Total defense stat
   * @param {number} prestigeLevel - Current prestige level
   * @param {string} activityDifficulty - 'easy', 'medium', 'hard' (affects base)
   * @returns {number} Compromise chance (0-100%)
   */
  calculateCompromiseChance(skillLevel, defense, prestigeLevel, activityDifficulty = 'medium') {
    // Base chance depends on activity difficulty
    const baseChanceMap = { easy: 0.10, medium: 0.15, hard: 0.25 };
    const baseChance = baseChanceMap[activityDifficulty] * 100;

    // Calculate reductions
    const skillReduction = skillLevel * 0.5;
    const defenseReduction = defense * 2;
    const prestigeReduction = prestigeLevel * 1;

    // Final chance (floor at 0%)
    const compromiseChance = Math.max(0, baseChance - skillReduction - defenseReduction - prestigeReduction);

    return compromiseChance;
  }

  /**
   * Check if compromise occurs for hacking activity
   * @returns {boolean|object} False if safe, or virus type object if compromised
   */
  checkCompromise(skillLevel, defense, prestigeLevel, activityDifficulty = 'medium') {
    const chance = this.calculateCompromiseChance(skillLevel, defense, prestigeLevel, activityDifficulty);
    const roll = Math.random() * 100;

    if (roll < chance) {
      // Compromise occurred! Determine virus type by severity
      const severityRoll = Math.random();
      
      if (severityRoll < 0.50) {
        return VirusManager.VIRUS_TYPES.DATA_CORRUPTION;
      } else if (severityRoll < 0.80) {
        return VirusManager.VIRUS_TYPES.SYSTEM_CRASH;
      } else if (severityRoll < 0.95) {
        return VirusManager.VIRUS_TYPES.PAYLOAD_LEAK;
      } else {
        return VirusManager.VIRUS_TYPES.DEEP_INTRUSION;
      }
    }

    return false;
  }

  /**
   * Attempt to infect player with virus
   * @returns {Virus|null} The new virus if infection succeeded, null if immunity or already infected
   */
  attemptInfection(virusTypeId) {
    // Check immunity timer
    if (this.immunityTimer > 0) {
      return null;
    }

    // Check if already infected with same type
    if (this.viruses.some(v => v.typeId === virusTypeId)) {
      return null; // Already infected, can't stack same type
    }

    const virusType = VirusManager.VIRUS_TYPES[Object.keys(VirusManager.VIRUS_TYPES).find(key => 
      VirusManager.VIRUS_TYPES[key].id === virusTypeId
    )];

    if (!virusType) return null;

    // Create new virus instance
    const virus = new Virus(virusType);
    this.viruses.push(virus);

    // Emit event
    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `🦠 INFECTED: ${virus.name}`,
      type: 'warning',
      icon: virus.icon,
      duration: 5000
    });

    // Log infection
    this.virusLog.push({
      timestamp: Date.now(),
      type: virusType.id,
      severity: virusType.severity
    });

    // Cascade check: chance to spawn additional virus
    if (Math.random() < virus.cascadeChance) {
      setTimeout(() => {
        this._cascadeInfection();
      }, 1000);
    }

    return virus;
  }

  /**
   * Cascade infection - spawn secondary virus from existing
   * @private
   */
  _cascadeInfection() {
    if (this.viruses.length === 0) return;

    const sourceVirus = this.viruses[Math.floor(Math.random() * this.viruses.length)];
    const availableTypes = Object.values(VirusManager.VIRUS_TYPES)
      .filter(type => !this.viruses.some(v => v.typeId === type.id))
      .map(type => type.id);

    if (availableTypes.length === 0) return; // Already has all virus types

    const newVirusType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    this.attemptInfection(newVirusType);
  }

  // ============================================
  // Virus Management
  // ============================================

  /**
   * Get list of active viruses
   */
  getActiveViruses() {
    // Remove expired viruses
    this.viruses = this.viruses.filter(v => !v.isExpired());
    return this.viruses;
  }

  /**
   * Get virus by ID
   */
  getVirus(virusId) {
    return this.viruses.find(v => v.id === virusId);
  }

  /**
   * Check if player has specific virus type
   */
  hasVirusType(virusTypeId) {
    return this.viruses.some(v => v.typeId === virusTypeId && !v.isExpired());
  }

  /**
   * Get total active virus count
   */
  getVirusCount() {
    return this.getActiveViruses().length;
  }

  /**
   * Get worst severity level (critical > high > medium > low)
   */
  getMaxSeverity() {
    const severities = ['low', 'medium', 'high', 'critical'];
    const activeViruses = this.getActiveViruses();
    
    if (activeViruses.length === 0) return null;
    
    const maxSev = activeViruses.reduce((max, v) => {
      const vSevIdx = severities.indexOf(v.severity);
      const maxIdx = severities.indexOf(max);
      return vSevIdx > maxIdx ? v.severity : max;
    }, 'low');

    return maxSev;
  }

  /**
   * Remove virus (at clinic)
   * @returns {number} Cost in E$ to remove
   */
  removeVirus(virusId) {
    const virus = this.getVirus(virusId);
    if (!virus) return 0;

    const cost = virus.removalCost;
    this.viruses = this.viruses.filter(v => v.id !== virusId);

    // Grant immunity period (5 minutes)
    this.immunityTimer = 300000; // 5 minutes
    
    // Emit event
    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `✓ Virus removed! (Immunity for 5 min)`,
      type: 'success',
      duration: 3000
    });

    return cost;
  }

  /**
   * Remove all viruses at once (emergency clinic procedure)
   * @returns {number} Total cost
   */
  removeAllViruses() {
    let totalCost = 0;
    this.viruses.forEach(v => {
      totalCost += v.removalCost;
    });
    this.viruses = [];
    
    this.immunityTimer = 300000; // 5 minutes immunity
    
    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `✓ All viruses removed!`,
      type: 'success',
      duration: 3000
    });

    return totalCost;
  }

  /**
   * Apply virus effects to activity reward
   * @param {object} reward - { xp, currency, items }
   * @returns {object} Modified reward
   */
  applyVirusEffects(reward) {
    const activeViruses = this.getActiveViruses();

    activeViruses.forEach(virus => {
      switch (virus.effect) {
        case 'xp_reduction':
          reward.xp = Math.floor(reward.xp * (1 + virus.effectValue));
          break;

        case 'currency_drain':
          if (Math.random() < virus.triggerChance) {
            reward.currency -= virus.effectValue;
            events.emit(EVENTS.UI_NOTIFICATION, {
              message: `💥 System crash! Lost ${virus.effectValue} E$`,
              type: 'warning',
              duration: 2000
            });
          }
          break;

        case 'item_loss':
          if (Math.random() < virus.triggerChance) {
            // Item loss handled in inventory system
            events.emit(EVENTS.UI_NOTIFICATION, {
              message: `📡 Payload leak! Lost item`,
              type: 'warning',
              duration: 2000
            });
          }
          break;

        case 'compound':
          reward.xp = Math.floor(reward.xp * 0.75); // -25% XP
          if (Math.random() < virus.triggerChance) {
            reward.currency -= 100;
          }
          break;
      }
    });

    return reward;
  }

  /**
   * Tick function - called each game loop tick
   * Decrement immunity timer and virus durations
   */
  tick() {
    if (this.immunityTimer > 0) {
      this.immunityTimer -= 1000;
    }

    this.viruses.forEach(v => v.tick());

    // Apply screen corruption effects
    this._applyScreenCorruption();
  }

  /**
   * Apply visual corruption to screen based on active viruses
   * @private
   */
  _applyScreenCorruption() {
    const activeViruses = this.getActiveViruses();
    if (activeViruses.length === 0) {
      this._clearScreenCorruption();
      return;
    }

    // Find worst virus severity
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    let worstSeverity = 'low';
    activeViruses.forEach(v => {
      const vIdx = severityOrder.indexOf(v.severity);
      const wIdx = severityOrder.indexOf(worstSeverity);
      if (vIdx > wIdx) worstSeverity = v.severity;
    });

    const corruptionConfig = VirusManager.SCREEN_CORRUPTION_EFFECTS[worstSeverity];
    
    // Roll for glitch this frame
    if (Math.random() < corruptionConfig.glitchChance) {
      this._triggerScreenGlitch(corruptionConfig);
    }

    // Apply tint overlay
    this._applyColorTint(corruptionConfig.colorShift);

    // Apply scanlines if needed
    if (corruptionConfig.scanlines) {
      this._applyIntensifiedScanlines();
    }
  }

  /**
   * Trigger a screen glitch effect
   * @private
   */
  _triggerScreenGlitch(config) {
    const { effectType, intensity } = config;

    switch (effectType) {
      case 'text_scramble':
        this._scrambleRandomText(intensity);
        break;

      case 'pixel_drift':
        this._driftElements(intensity);
        break;

      case 'text_scramble_heavy':
        this._scrambleRandomText(intensity);
        break;

      case 'word_corruption':
        this._corruptWords(intensity);
        break;
    }
  }

  /**
   * Randomly replace characters in text elements
   * @private
   */
  _scrambleRandomText(intensity) {
    const elements = document.querySelectorAll('span, p, h1, h2, h3, h4, button, div');
    const affectCount = Math.ceil(elements.length * intensity);

    for (let i = 0; i < affectCount; i++) {
      const elem = elements[Math.floor(Math.random() * elements.length)];
      if (!elem.textContent || elem.textContent.length === 0) continue;

      const originalText = elem.textContent;
      const chars = originalText.split('');
      const charCount = Math.ceil(chars.length * 0.2); // Corrupt 20% of chars

      for (let j = 0; j < charCount; j++) {
        const idx = Math.floor(Math.random() * chars.length);
        chars[idx] = String.fromCharCode(33 + Math.floor(Math.random() * 94)); // Random printable ASCII
      }

      elem.textContent = chars.join('');
      elem.dataset.originalText = originalText;

      // Self-heal after a few frames
      setTimeout(() => {
        if (elem.dataset.originalText) {
          elem.textContent = elem.dataset.originalText;
          delete elem.dataset.originalText;
        }
      }, 100 + Math.random() * 200);
    }
  }

  /**
   * Shift element positions slightly
   * @private
   */
  _driftElements(intensity) {
    const elements = document.querySelectorAll('.skill-item, .inventory-item, button, .stat-display');
    const driftCount = Math.ceil(elements.length * intensity);

    for (let i = 0; i < driftCount; i++) {
      const elem = elements[Math.floor(Math.random() * elements.length)];
      const offsetX = (Math.random() - 0.5) * 20 * intensity;
      const offsetY = (Math.random() - 0.5) * 20 * intensity;

      const originalTransform = elem.style.transform || '';
      elem.style.transform = `translate(${offsetX}px, ${offsetY}px) ${originalTransform}`;

      // Reset after a few frames
      setTimeout(() => {
        elem.style.transform = originalTransform;
      }, 150 + Math.random() * 150);
    }
  }

  /**
   * Corrupt entire words (misspelling effect)
   * @private
   */
  _corruptWords(intensity) {
    const elements = document.querySelectorAll('span, p, h1, h2, h3, h4, button');
    const affectCount = Math.ceil(elements.length * intensity);

    for (let i = 0; i < affectCount; i++) {
      const elem = elements[Math.floor(Math.random() * elements.length)];
      if (!elem.textContent || elem.textContent.length === 0) continue;

      const originalText = elem.textContent;
      const words = originalText.split(/\s+/);

      // Corrupt 30% of words
      const corruptCount = Math.ceil(words.length * 0.3);
      for (let j = 0; j < corruptCount; j++) {
        const wordIdx = Math.floor(Math.random() * words.length);
        const word = words[wordIdx];
        
        // Scramble word: reverse it, swap chars, repeat chars
        const corruptionMethods = [
          word.split('').reverse().join(''), // Reverse
          word.split('').map((c, i) => (i % 2) ? word[i - 1] || c : c).join(''), // Swap chars
          word.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c).join(''), // Random case
        ];

        words[wordIdx] = corruptionMethods[Math.floor(Math.random() * corruptionMethods.length)];
      }

      elem.textContent = words.join(' ');
      elem.dataset.originalText = originalText;

      // Self-heal after longer duration
      setTimeout(() => {
        if (elem.dataset.originalText) {
          elem.textContent = elem.dataset.originalText;
          delete elem.dataset.originalText;
        }
      }, 250 + Math.random() * 300);
    }
  }

  /**
   * Apply red/magenta color tint overlay
   * @private
   */
  _applyColorTint(colorShift) {
    if (!colorShift) {
      // Remove tint
      const existing = document.getElementById('virus-tint-overlay');
      if (existing) existing.remove();
      return;
    }

    let overlay = document.getElementById('virus-tint-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'virus-tint-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999;
        mix-blend-mode: multiply;
      `;
      document.body.appendChild(overlay);
    }

    overlay.style.backgroundColor = colorShift;
  }

  /**
   * Intensify scanline effect during severe virus
   * @private
   */
  _applyIntensifiedScanlines() {
    let scanlines = document.getElementById('virus-scanlines');
    if (!scanlines) {
      scanlines = document.createElement('div');
      scanlines.id = 'virus-scanlines';
      scanlines.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 998;
        background: repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        );
        animation: virus-scanline-flicker 0.1s infinite;
      `;

      // Add animation keyframes if not exists
      if (!document.getElementById('virus-scanline-style')) {
        const style = document.createElement('style');
        style.id = 'virus-scanline-style';
        style.textContent = `
          @keyframes virus-scanline-flicker {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(scanlines);
    }
  }

  /**
   * Clear all screen corruption effects
   * @private
   */
  _clearScreenCorruption() {
    // Remove tint overlay
    const tint = document.getElementById('virus-tint-overlay');
    if (tint) tint.remove();

    // Remove scanlines
    const scanlines = document.getElementById('virus-scanlines');
    if (scanlines) scanlines.remove();

    // Reset any drifted elements
    document.querySelectorAll('[style*="translate"]').forEach(elem => {
      elem.style.transform = elem.style.transform.replace(/translate\([^)]*\)\s*/g, '');
    });
  }

  // ============================================
  // Serialization
  // ============================================

  serialize() {
    return {
      viruses: this.viruses.map(v => v.serialize()),
      virusLog: this.virusLog,
      immunityTimer: this.immunityTimer
    };
  }

  deserialize(data) {
    if (!data) return;
    
    this.viruses = (data.viruses || []).map(vData => Virus.deserialize(vData));
    this.virusLog = data.virusLog || [];
    this.immunityTimer = data.immunityTimer || 0;
  }
}

/**
 * Individual Virus Instance
 */
class Virus {
  constructor(virusType) {
    this.id = `virus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.typeId = virusType.id;
    this.name = virusType.name;
    this.icon = virusType.icon;
    this.severity = virusType.severity;
    this.createdAt = Date.now();
    this.duration = virusType.duration; // in ms
    this.effect = virusType.effect;
    this.effectValue = virusType.effectValue;
    this.triggerChance = virusType.triggerChance || 0;
    this.cascadeChance = virusType.cascadeChance || 0;
    this.removalCost = virusType.removalCost;
  }

  /**
   * Check if virus has expired
   */
  isExpired() {
    return (Date.now() - this.createdAt) > this.duration;
  }

  /**
   * Get remaining time in ms
   */
  getRemainingTime() {
    const elapsed = Date.now() - this.createdAt;
    return Math.max(0, this.duration - elapsed);
  }

  /**
   * Get remaining time as formatted string (e.g., "45 min")
   */
  getRemainingTimeFormatted() {
    const ms = this.getRemainingTime();
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  }

  /**
   * Tick function - decrement duration
   */
  tick() {
    // Called every second, but duration in ms naturally counts down via isExpired()
  }

  serialize() {
    return {
      id: this.id,
      typeId: this.typeId,
      name: this.name,
      icon: this.icon,
      severity: this.severity,
      createdAt: this.createdAt,
      duration: this.duration,
      effect: this.effect,
      effectValue: this.effectValue,
      triggerChance: this.triggerChance,
      cascadeChance: this.cascadeChance,
      removalCost: this.removalCost
    };
  }

  static deserialize(data) {
    const virus = Object.create(Virus.prototype);
    Object.assign(virus, data);
    return virus;
  }
}

export { Virus };
