/**
 * Gaming UI Integration Examples
 * How to use GameMetricsUI components throughout NETRUNNER
 */

import { gameMetricsUI } from './gameMetrics.js';
import { getGame } from '../main.js';

export class GameUIIntegration {
  constructor() {
    this.updateIntervals = [];
  }

  /**
   * Initialize all gaming UI elements
   */
  initializeGameUI() {
    this.setupCombatUI();
    this.setupSkillUI();
    this.setupEquipmentUI();
    this.setupPassiveStatsUI();
    this.setupStatusEffectsUI();
    this.setupNotificationSystem();
  }

  /**
   * Setup combat UI with real-time updates
   */
  setupCombatUI() {
    const combatContainer = document.getElementById('combat-ui');
    if (!combatContainer) return;

    const updateCombat = () => {
      const game = getGame();
      if (!game || !game.combat.isActive) return;

      const combat = game.combat;
      const statusHTML = gameMetricsUI.createCombatStatus({
        playerHealth: combat.playerHp,
        playerMaxHealth: combat.maxPlayerHp,
        enemyHealth: combat.currentEnemy.hp,
        enemyMaxHealth: combat.currentEnemy.maxHp,
        enemyName: combat.currentEnemy.name,
        isBoss: combat.currentEnemy.isBoss
      });

      combatContainer.innerHTML = statusHTML;
    };

    // Update every 100ms during combat
    const interval = setInterval(updateCombat, 100);
    this.updateIntervals.push(interval);
  }

  /**
   * Setup skill listing UI
   */
  setupSkillUI() {
    const skillsContainer = document.getElementById('skills-list');
    if (!skillsContainer) return;

    const updateSkills = () => {
      const game = getGame();
      if (!game) return;

      const skills = game.skillManager.getAllSkills();
      skillsContainer.innerHTML = skills.map(skill => {
        const xpProgress = skill.getXPProgress();
        return gameMetricsUI.createSkillCard({
          skill,
          isActive: skill.isActive,
          showDetailed: true
        });
      }).join('');
    };

    // Update every 500ms
    const interval = setInterval(updateSkills, 500);
    this.updateIntervals.push(interval);
    updateSkills(); // Initial update
  }

  /**
   * Setup equipment display
   */
  setupEquipmentUI() {
    const equipmentContainer = document.getElementById('equipment-display');
    if (!equipmentContainer) return;

    const updateEquipment = () => {
      const game = getGame();
      if (!game) return;

      const equipment = game.equipment;
      const slots = ['weapon', 'armor', 'cyberware'];

      equipmentContainer.innerHTML = slots.map(slot => {
        const item = equipment.slots[slot];
        const itemDef = item ? (typeof item === 'string' ? ITEMS[item.toUpperCase()] : item) : null;
        
        let bonus = 0;
        if (itemDef) {
          if (slot === 'weapon') bonus = itemDef.damage || 0;
          if (slot === 'armor') bonus = itemDef.defense || 0;
          if (slot === 'cyberware') bonus = itemDef.damage || itemDef.defense || 0;
        }

        return gameMetricsUI.createEquipmentSlot({
          slot,
          item: itemDef,
          bonus
        });
      }).join('');
    };

    // Update when equipment changes
    updateEquipment(); // Initial update
  }

  /**
   * Setup passive stats display
   */
  setupPassiveStatsUI() {
    const statsContainer = document.getElementById('passive-stats-display');
    if (!statsContainer) return;

    const updateStats = () => {
      const game = getGame();
      if (!game || !game.passiveStats) return;

      const stats = {
        'Max HP': game.passiveStats.getStat('maxHP'),
        'XP Gain': `+${Math.round(game.passiveStats.getStat('xpMultiplier') * 100)}%`,
        'Action Speed': `-${Math.round((1 - game.passiveStats.getStat('actionSpeedMultiplier')) * 100)}%`,
        'Loot Drop': `+${Math.round(game.passiveStats.getStat('lootMultiplier') * 100)}%`,
        'Currency Gain': `+${Math.round(game.passiveStats.getStat('currencyMultiplier') * 100)}%`
      };

      statsContainer.innerHTML = gameMetricsUI.createPassiveStatsPanel({ stats });
    };

    // Update every 1000ms
    const interval = setInterval(updateStats, 1000);
    this.updateIntervals.push(interval);
    updateStats(); // Initial update
  }

  /**
   * Setup status effects display
   */
  setupStatusEffectsUI() {
    const effectsContainer = document.getElementById('status-effects');
    if (!effectsContainer) return;

    const updateEffects = () => {
      const game = getGame();
      if (!game || !game.combat.isActive) return;

      const effects = game.combat.statusEffectManager?.getActiveEffects() || [];
      const formattedEffects = effects.map(effect => ({
        id: effect.id,
        name: effect.name,
        icon: effect.icon,
        type: effect.type,
        remaining: effect.getRemainingDuration() / 1000,
        duration: effect.duration / 1000
      }));

      effectsContainer.innerHTML = gameMetricsUI.createStatusEffects({
        effects: formattedEffects
      });
    };

    // Update every 100ms during combat
    const interval = setInterval(updateEffects, 100);
    this.updateIntervals.push(interval);
  }

  /**
   * Setup notification system
   */
  setupNotificationSystem() {
    const notificationContainer = document.getElementById('notifications');
    if (!notificationContainer) return;

    // Listen for notifications from event bus
    events.on(EVENTS.UI_NOTIFICATION, (data) => {
      const notifHTML = gameMetricsUI.createNotification({
        message: data.message,
        type: data.type || 'info',
        icon: data.icon || ''
      });

      const notifEl = document.createElement('div');
      notifEl.innerHTML = notifHTML;
      const child = notifEl.firstElementChild;
      notificationContainer.appendChild(child);

      // Auto-remove after duration
      setTimeout(() => {
        child.style.animation = 'fade-out 0.3s ease-out';
        setTimeout(() => child.remove(), 300);
      }, data.duration || 3000);
    });
  }

  /**
   * Display damage popup at coordinates
   */
  displayDamagePopup(damage, x, y, isCrit = false, type = 'damage') {
    const container = document.getElementById('damage-popups');
    if (!container) return;

    const popupHTML = gameMetricsUI.createDamagePopup({
      damage,
      x,
      y,
      isCrit,
      type
    });

    const popupEl = document.createElement('div');
    popupEl.innerHTML = popupHTML;
    const child = popupEl.firstElementChild;
    container.appendChild(child);

    // Remove after animation
    setTimeout(() => child.remove(), 1000);
  }

  /**
   * Update progress task display
   */
  updateProgressTasks() {
    const tasksContainer = document.getElementById('progress-tasks');
    if (!tasksContainer) return;

    const game = getGame();
    if (!game) return;

    const tasks = game.skillManager.getActiveTasks(); // Assuming this method exists
    const efficiency = game.skillManager.getMultiGrindEfficiency();

    tasksContainer.innerHTML = tasks.map((task, index) => {
      const isBackground = task._isBackgroundHack || false;
      return gameMetricsUI.createProgressTask({
        task,
        progress: task.actionProgress / task.activeAction.duration * 100,
        efficiency: efficiency * 100,
        isBackground
      });
    }).join('');
  }

  /**
   * Create virus warning display
   */
  updateVirusDisplay() {
    const virusContainer = document.getElementById('virus-warning');
    if (!virusContainer) return;

    const game = getGame();
    if (!game) return;

    const viruses = game.player.getActiveViruses().map(virus => ({
      id: virus.type,
      name: virus.name,
      icon: virus.icon,
      severity: virus.duration <= 2 ? 'high' : (virus.duration <= 5 ? 'medium' : 'low'),
      activitiesRemaining: virus.activitiesRemaining,
      duration: virus.duration
    }));

    virusContainer.innerHTML = gameMetricsUI.createVirusIndicator({ viruses });
  }

  /**
   * Display ability cooldown indicators
   */
  updateAbilityCooldowns() {
    const cooldownContainer = document.getElementById('ability-cooldowns');
    if (!cooldownContainer) return;

    const game = getGame();
    if (!game) return;

    const abilities = game.abilityManager.getActiveAbilities();
    
    cooldownContainer.innerHTML = abilities.map(ability => {
      const remaining = ability.cooldownRemaining || 0;
      const max = ability.cooldownMax || 30;
      
      return gameMetricsUI.createAbilityCooldown({
        ability,
        cooldownRemaining: remaining,
        cooldownMax: max
      });
    }).join('');
  }

  /**
   * Create level up animation and notification
   */
  triggerLevelUpAnimation(skillName, newLevel) {
    // Play sound effect (if available)
    this.playSound('levelup');

    // Show notification
    const notif = gameMetricsUI.createNotification({
      message: `${skillName} leveled up to ${newLevel}!`,
      type: 'levelup',
      icon: '⭐'
    });

    const container = document.getElementById('notifications');
    if (container) {
      const el = document.createElement('div');
      el.innerHTML = notif;
      container.appendChild(el.firstElementChild);
    }

    // Trigger screen shake (optional)
    this.triggerScreenShake(300);
  }

  /**
   * Create achievement unlock animation
   */
  triggerAchievementUnlock(achievementName, icon = '🏆') {
    // Play sound effect
    this.playSound('achievement');

    // Show notification with longer duration
    const notif = gameMetricsUI.createNotification({
      message: `ACHIEVEMENT: ${achievementName}`,
      type: 'achievement',
      icon: icon
    });

    const container = document.getElementById('notifications');
    if (container) {
      const el = document.createElement('div');
      el.innerHTML = notif;
      container.appendChild(el.firstElementChild);
    }

    // Confetti effect (optional)
    this.triggerConfetti();
  }

  /**
   * Screen shake effect
   */
  triggerScreenShake(duration = 300) {
    const app = document.getElementById('app');
    if (!app) return;

    app.style.animation = `screen-shake ${duration}ms`;
    setTimeout(() => {
      app.style.animation = '';
    }, duration);
  }

  /**
   * Confetti effect
   */
  triggerConfetti() {
    // Simple implementation - can be expanded with more effects
    const confettiPieces = [];
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * window.innerWidth + 'px';
      piece.style.top = '-10px';
      piece.textContent = ['🎉', '✨', '⭐', '🌟'][Math.floor(Math.random() * 4)];
      piece.style.fontSize = '24px';
      piece.style.position = 'fixed';
      piece.style.pointerEvents = 'none';
      piece.style.zIndex = '1000';
      document.body.appendChild(piece);

      // Animate down
      let top = -10;
      const interval = setInterval(() => {
        top += Math.random() * 3 + 2;
        piece.style.top = top + 'px';
        piece.style.opacity = Math.max(0, 1 - (top / window.innerHeight));
        
        if (top > window.innerHeight) {
          clearInterval(interval);
          piece.remove();
        }
      }, 20);

      confettiPieces.push(interval);
    }
  }

  /**
   * Play sound effect
   */
  playSound(effectName) {
    // Stub for sound effects - implement with Web Audio API or HTML5 audio
    // Example sounds: 'levelup', 'achievement', 'hit', 'heal', 'error'
    console.log(`[SOUND] ${effectName}`);
  }

  /**
   * Cleanup all intervals and listeners
   */
  cleanup() {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals = [];
  }
}

// Export singleton
export const gameUIIntegration = new GameUIIntegration();
