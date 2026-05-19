/**
 * Gaming UI State Management
 * Progress bars, health displays, XP tracking, status effects
 * Cyberpunk-themed game metric displays
 */

export class GameMetricsUI {
  constructor() {
    this.lastHealth = 100;
    this.lastXP = 0;
    this.lastLevel = 1;
    this.effectAnimations = new Map();
  }

  /**
   * Create a health bar with state-driven styling
   */
  createHealthBar({ maxHealth = 100, currentHealth = 100, showLabel = true, compact = false } = {}) {
    const percent = (currentHealth / maxHealth) * 100;
    const healthClass = this.getHealthBarClass(percent);
    
    const barHeight = compact ? 'h-1' : 'h-2';
    const barColor = this.getHealthColor(percent);
    
    const html = `
      <div class="health-bar-container ${compact ? 'compact' : ''}">
        ${showLabel ? `
          <div class="health-label">
            <span class="retro-text">HP:</span>
            <span class="health-value">${currentHealth}/${maxHealth}</span>
          </div>
        ` : ''}
        <div class="health-bar-background ${barHeight}">
          <div 
            class="health-bar-fill ${barHeight} ${healthClass} transition-all duration-300"
            style="width: ${percent}%; background: ${barColor};"
          ></div>
          ${percent <= 25 ? '<div class="health-warning-pulse"></div>' : ''}
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Create an XP bar with level tracking
   */
  createXPBar({ 
    currentXP = 0, 
    nextLevelXP = 1000, 
    level = 1, 
    maxLevel = 99,
    showLevelUp = false,
    compact = false 
  } = {}) {
    const percent = Math.min(100, (currentXP / nextLevelXP) * 100);
    const isMaxLevel = level >= maxLevel;
    const barHeight = compact ? 'h-1' : 'h-2';
    
    const html = `
      <div class="xp-bar-container ${compact ? 'compact' : ''}">
        ${!compact ? `
          <div class="xp-label">
            <span class="retro-text">LVL:</span>
            <span class="level-value">${level}/${maxLevel}</span>
          </div>
        ` : ''}
        <div class="xp-bar-background ${barHeight}">
          <div 
            class="xp-bar-fill ${barHeight} transition-all duration-300 ${isMaxLevel ? 'max-level' : ''}"
            style="width: ${percent}%; background: ${isMaxLevel ? '#ffff00' : '#00ff41'};"
          ></div>
        </div>
        ${!compact ? `
          <div class="xp-progress-text retro-text text-xs">
            ${currentXP.toLocaleString()} / ${nextLevelXP.toLocaleString()} XP
          </div>
        ` : ''}
        ${showLevelUp && percent === 100 ? `
          <div class="level-up-notification animate-bounce">
            <span class="level-up-text">⭐ LEVEL UP! ⭐</span>
          </div>
        ` : ''}
      </div>
    `;
    
    return html;
  }

  /**
   * Create a mastery level display
   */
  createMasteryBar({ 
    masteryLevel = 1, 
    masteryXP = 0, 
    masteryXPNeeded = 100,
    maxMastery = 99,
    compact = false 
  } = {}) {
    const percent = (masteryXP / masteryXPNeeded) * 100;
    const barHeight = compact ? 'h-1' : 'h-1.5';
    
    const html = `
      <div class="mastery-bar-container ${compact ? 'compact' : ''}">
        <div class="mastery-label retro-text text-xs">
          Mastery: ${masteryLevel}/${maxMastery}
        </div>
        <div class="mastery-bar-background ${barHeight}">
          <div 
            class="mastery-bar-fill ${barHeight} transition-all duration-300"
            style="width: ${percent}%; background: #ff00ff;"
          ></div>
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Create combat status display
   */
  createCombatStatus({ 
    playerHealth = 100, 
    playerMaxHealth = 100,
    enemyHealth = 100,
    enemyMaxHealth = 100,
    enemyName = 'Enemy',
    isBoss = false 
  } = {}) {
    const playerPercent = (playerHealth / playerMaxHealth) * 100;
    const enemyPercent = (enemyHealth / enemyMaxHealth) * 100;
    
    const html = `
      <div class="combat-status-panel">
        <div class="combat-participant player-status">
          <div class="participant-label retro-text">
            <span>YOU</span>
            <span class="health-text">${playerHealth}/${playerMaxHealth}</span>
          </div>
          <div class="health-bar-background h-2">
            <div 
              class="health-bar-fill h-2 transition-all duration-100"
              style="width: ${playerPercent}%; background: #00ff41;"
            ></div>
          </div>
        </div>
        
        <div class="vs-indicator retro-text">VS</div>
        
        <div class="combat-participant enemy-status ${isBoss ? 'boss' : ''}">
          <div class="participant-label retro-text">
            <span>${isBoss ? '👹' : '⚔️'} ${enemyName}</span>
            <span class="health-text">${enemyHealth}/${enemyMaxHealth}</span>
          </div>
          <div class="health-bar-background h-2">
            <div 
              class="health-bar-fill h-2 transition-all duration-100"
              style="width: ${enemyPercent}%; background: #ff4444;"
            ></div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Create status effect display
   */
  createStatusEffects({ effects = [] } = {}) {
    if (effects.length === 0) return '';
    
    const effectsHTML = effects.map((effect, index) => {
      const remainingPercent = (effect.remaining / effect.duration) * 100;
      return `
        <div class="status-effect ${effect.type}" title="${effect.name}" data-effect-id="${effect.id}">
          <span class="effect-icon">${effect.icon}</span>
          <div class="effect-timer">
            <div class="effect-timer-fill" style="width: ${remainingPercent}%"></div>
          </div>
          <span class="effect-duration retro-text text-xs">${Math.ceil(effect.remaining)}s</span>
        </div>
      `;
    }).join('');
    
    return `
      <div class="status-effects-container">
        <div class="effects-label retro-text">STATUS</div>
        <div class="effects-list">
          ${effectsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Create virus indicator
   */
  createVirusIndicator({ viruses = [] } = {}) {
    if (viruses.length === 0) return '';
    
    const virusHTML = viruses.map(virus => `
      <div class="virus-indicator ${virus.severity || 'medium'}" title="${virus.name}">
        <span class="virus-icon">${virus.icon}</span>
        <span class="virus-name retro-text text-xs">${virus.name}</span>
        <span class="virus-duration retro-text text-xs">${virus.activitiesRemaining || virus.duration}</span>
      </div>
    `).join('');
    
    return `
      <div class="virus-panel ${viruses.length > 0 ? 'active' : ''}">
        <div class="virus-header retro-text">⚠️ INFECTED</div>
        <div class="virus-list">
          ${virusHTML}
        </div>
      </div>
    `;
  }

  /**
   * Create skill card for UI display
   */
  createSkillCard({ 
    skill, 
    isActive = false, 
    showDetailed = false 
  } = {}) {
    const xpPercent = (skill.xp / skill.getXPForNextLevel()) * 100;
    
    const html = `
      <div class="skill-card ${isActive ? 'active' : ''} ${showDetailed ? 'detailed' : 'compact'}">
        <div class="skill-header">
          <span class="skill-icon">${skill.icon}</span>
          <span class="skill-name retro-text">${skill.name}</span>
          <span class="skill-level retro-text">L${skill.level}</span>
        </div>
        
        ${showDetailed ? `
          <div class="skill-details">
            <div class="skill-xp-info retro-text text-xs">
              ${skill.xp.toLocaleString()} / ${skill.getXPForNextLevel().toLocaleString()} XP
            </div>
            <div class="xp-bar-background h-1">
              <div 
                class="xp-bar-fill h-1"
                style="width: ${xpPercent}%; background: ${skill.color};"
              ></div>
            </div>
          </div>
        ` : ''}
        
        ${isActive ? `
          <div class="skill-active-indicator">
            <span class="pulse-dot"></span>
            <span class="retro-text text-xs">Active</span>
          </div>
        ` : ''}
      </div>
    `;
    
    return html;
  }

  /**
   * Create equipment slot display
   */
  createEquipmentSlot({ slot, item, bonus = 0 } = {}) {
    const slotIcons = {
      weapon: '🔫',
      armor: '🛡️',
      cyberware: '🦾'
    };
    
    const html = `
      <div class="equipment-slot ${item ? 'equipped' : 'empty'}" data-slot="${slot}">
        <div class="slot-header">
          <span class="slot-icon">${slotIcons[slot] || '?'}</span>
          <span class="slot-label retro-text">${slot.toUpperCase()}</span>
        </div>
        
        ${item ? `
          <div class="equipped-item">
            <span class="item-icon">${item.icon}</span>
            <div class="item-info">
              <span class="item-name retro-text text-xs">${item.name}</span>
              ${bonus !== 0 ? `
                <span class="item-bonus retro-text text-xs ${bonus > 0 ? 'positive' : 'negative'}">
                  ${bonus > 0 ? '+' : ''}${bonus}
                </span>
              ` : ''}
            </div>
          </div>
        ` : `
          <div class="empty-slot retro-text">
            <span>[EMPTY]</span>
          </div>
        `}
      </div>
    `;
    
    return html;
  }

  /**
   * Create passive stat breakdown
   */
  createPassiveStatsPanel({ stats = {} } = {}) {
    const statRows = Object.entries(stats).map(([statName, value]) => {
      const isBonus = value > 0;
      return `
        <div class="stat-row">
          <span class="stat-name retro-text">${statName}</span>
          <span class="stat-value ${isBonus ? 'positive' : 'negative'} retro-text">
            ${isBonus ? '+' : ''}${value}
          </span>
        </div>
      `;
    }).join('');
    
    return `
      <div class="passive-stats-panel">
        <div class="panel-header retro-text">📊 PASSIVE STATS</div>
        <div class="stats-list">
          ${statRows}
        </div>
      </div>
    `;
  }

  /**
   * Determine health bar CSS class based on percentage
   */
  getHealthBarClass(percent) {
    if (percent <= 10) return 'critical animate-pulse';
    if (percent <= 25) return 'danger';
    if (percent <= 50) return 'warning';
    return 'healthy';
  }

  /**
   * Get color for health bar
   */
  getHealthColor(percent) {
    if (percent <= 10) return '#ff0000';  // Red - Critical
    if (percent <= 25) return '#ff4444';  // Red-Orange - Danger
    if (percent <= 50) return '#ffaa00';  // Orange - Warning
    if (percent <= 75) return '#ffff00';  // Yellow - Moderate
    return '#00ff41';                      // Green - Healthy
  }

  /**
   * Create damage number popup
   */
  createDamagePopup({ damage, x, y, isCrit = false, type = 'damage' } = {}) {
    const typeClass = type === 'heal' ? 'heal' : 'damage';
    const critClass = isCrit ? 'crit' : '';
    
    return `
      <div 
        class="damage-popup ${typeClass} ${critClass} animate-fade-up"
        style="--x: ${x}px; --y: ${y}px;"
      >
        <span class="damage-text retro-text">
          ${type === 'heal' ? '✨' : '💥'} ${damage}
        </span>
      </div>
    `;
  }

  /**
   * Create notification/alert
   */
  createNotification({ 
    message, 
    type = 'info',
    duration = 3000,
    icon = '' 
  } = {}) {
    const typeClasses = {
      'info': 'notification-info',
      'success': 'notification-success',
      'warning': 'notification-warning',
      'error': 'notification-error',
      'levelup': 'notification-levelup',
      'achievement': 'notification-achievement'
    };
    
    return `
      <div class="notification ${typeClasses[type] || 'notification-info'} animate-slide-down">
        <span class="notification-icon">${icon}</span>
        <span class="notification-text retro-text">${message}</span>
      </div>
    `;
  }

  /**
   * Create ability cooldown indicator
   */
  createAbilityCooldown({ 
    ability,
    cooldownRemaining = 0,
    cooldownMax = 30
  } = {}) {
    const percent = (cooldownRemaining / cooldownMax) * 100;
    const isReady = cooldownRemaining <= 0;
    
    return `
      <div class="ability-cooldown ${isReady ? 'ready' : 'cooldown'}" title="${ability.name}">
        <span class="ability-icon">${ability.icon}</span>
        <div class="cooldown-overlay" style="opacity: ${percent / 100}"></div>
        ${!isReady ? `
          <span class="cooldown-text retro-text text-xs">${Math.ceil(cooldownRemaining)}s</span>
        ` : ''}
      </div>
    `;
  }

  /**
   * Create progress task display for multi-grinding
   */
  createProgressTask({ 
    task, 
    progress = 0,
    efficiency = 100,
    isBackground = false
  } = {}) {
    const html = `
      <div class="progress-task ${isBackground ? 'background-hack' : 'active'} ${efficiency < 70 ? 'warning' : ''}">
        <div class="task-header">
          <span class="task-icon">${task.icon}</span>
          <span class="task-name retro-text">${task.name}</span>
          <span class="task-efficiency retro-text text-xs ${efficiency < 70 ? 'warn' : ''}">
            ${efficiency}%
          </span>
        </div>
        <div class="progress-bar-background h-2">
          <div 
            class="progress-bar-fill h-2 transition-all duration-300"
            style="width: ${progress}%; background: ${task.color};"
          ></div>
        </div>
      </div>
    `;
    
    return html;
  }
}

// Export singleton instance
export const gameMetricsUI = new GameMetricsUI();
