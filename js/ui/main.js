import { events, EVENTS } from '../engine/events.js';
import { getGame } from '../main.js';
import { SHOP_ITEMS, ITEMS, SKILLS, SKILL_ABILITIES, PASSIVE_BONUSES, ACTIVITIES, BACKGROUND_HACK_SKILLS, BACKGROUND_HACK_EFFICIENCY, getItemTooltip, getRotatingShopItems, SHOP_ROTATION_INTERVAL_MS } from '../data/skillData.js';
import { FACTIONS } from '../data/worldData.js';
import { CRAFT_RECIPES } from '../systems/crafting.js';
import { PRESTIGE_UPGRADES } from '../systems/prestige.js';
import { HackerTerminal } from './hackerTerminal.js';

export class UI {
  constructor() {
    this.currentView = 'skills';
    this.currentCategory = 'hacking';
    this.currentSkill = null;
    this.inventoryFilter = 'all';
    this.shopFilter = 'all';
    this.shopPage = 0;
    this.shopRotationSeed = Math.floor(Date.now() / SHOP_ROTATION_INTERVAL_MS);
    this.pickerOverlay = null;
    this._eventUnsubs = [];
    this.hackerTerminal = new HackerTerminal();
  }

  setupEventListeners() {
    // Clean up any previous listeners (prevents accumulation on reset)
    this._eventUnsubs.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
    this._eventUnsubs = [];
    this._eventUnsubs.push(events.on(EVENTS.SKILL_LEVEL_UP, (data) => this.onSkillLevelUp(data)));
    this._eventUnsubs.push(events.on(EVENTS.SKILL_STARTED, () => this.updateSkillListings()));
    this._eventUnsubs.push(events.on(EVENTS.SKILL_STOPPED, () => this.updateSkillListings()));
    this._eventUnsubs.push(events.on(EVENTS.COMBAT_STARTED, () => this.updateCombatView()));
    this._eventUnsubs.push(events.on(EVENTS.COMBAT_HIT, () => this.updateCombatView()));
    this._eventUnsubs.push(events.on(EVENTS.COMBAT_ENEMY_DEFEATED, (data) => this.onEnemyDefeated(data)));
    this._eventUnsubs.push(events.on(EVENTS.COMBAT_ENDED, () => this.updateCombatView()));
    this._eventUnsubs.push(events.on(EVENTS.COMBAT_PLAYER_DIED, (data) => {
      this.notify(`Defeated by ${data.enemy || 'enemy'}! Respawning...`, 'error');
      this.updateCombatView();
      this.updateSkillListings();
    }));
    this._eventUnsubs.push(events.on(EVENTS.CURRENCY_CHANGED, (data) => this.onCurrencyChanged(data)));
    this._eventUnsubs.push(events.on(EVENTS.ITEM_GAINED, (data) => {
      this.notify(`+${data.quantity}x ${data.item}`, 'info');
    }));
    this._eventUnsubs.push(events.on(EVENTS.ACHIEVEMENT_UNLOCKED, (data) => {
      this.notify(`ACHIEVEMENT: ${data.name} - ${data.description}`, 'victory');
    }));
    this._eventUnsubs.push(events.on(EVENTS.UI_NOTIFICATION, (data) => {
      this.notify(data.message, data.type || 'info');
    }));
    this._eventUnsubs.push(events.on(EVENTS.ABILITY_ACTIVATED, (data) => {
      const typeLabel = { damage: 'error', heal: 'info', buff: 'levelup', debuff: 'victory' };
      this.notify(`${data.icon} ${data.abilityName}: ${data.value} ${data.type}`, typeLabel[data.type] || 'info');
    }));

    // Init the hacker terminal
    this.hackerTerminal.init();
  }

  onSkillLevelUp(data) {
    this.notify(`Level up! ${data.skillName || data.skill} is now level ${data.newLevel}`, 'levelup');
    this.updateSkillListings();
  }

  onEnemyDefeated(data) {
    this.notify(`Defeated ${data.enemy}! +${data.xp} XP`, 'victory');
    const loot = data.loot;
    if (loot) {
      let parts = [];
      if (loot.currency > 0) parts.push(`${loot.currency} E$`);
      if (loot.items) {
        Object.entries(loot.items).forEach(([item, qty]) => {
          parts.push(`${qty}x ${item}`);
        });
      }
      if (parts.length > 0) this.notify(`Loot: ${parts.join(', ')}`, 'info');
    }
  }

  onCurrencyChanged(data) {
    const currEl = document.getElementById('currency-display');
    if (currEl) {
      currEl.textContent = `E$ ${data.currency.toLocaleString()}`;
    }
  }

  notify(message, type = 'info') {
    const notifEl = document.getElementById('notifications');
    if (!notifEl) return;
    const div = document.createElement('div');
    div.className = `notification notification-${type}`;
    div.textContent = message;
    notifEl.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  // ==========================================
  // Progress Bars (active skill actions)
  // ==========================================
  updateProgressBars() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('progress-bars');
    if (!container) return;

    const activeSkills = game.skillManager.getAllSkills().filter(s => s.isActive && s.activeAction && !s.activeAction.enemy);
    container.innerHTML = '';

    activeSkills.forEach(skill => {
      if (!skill.activeAction) return;
      const isBg = skill._isBackgroundHack;
      const percent = Math.min(100, (skill.actionProgress / skill.activeAction.duration) * 100);
      const div = document.createElement('div');
      div.className = `progress-item ${isBg ? 'progress-background-hack' : ''}`;
      div.innerHTML = `
        <div class="progress-label">${isBg ? '<span class="bg-hack-label">BG HACK</span> ' : ''}${skill.name} — ${skill.activeAction.name}${isBg ? ' (75%)' : ''}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%; background: ${isBg ? '#00ff41' : skill.color}"></div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  // ==========================================
  // Background Hacking Display
  // ==========================================
  updateBackgroundHackDisplay() {
    const game = getGame();
    if (!game) return;
    let container = document.getElementById('background-hack-status');
    if (!container) return;

    const canHack = game.skillManager.canBackgroundHack();
    const bgInfo = game.skillManager.getBackgroundHackInfo();

    if (!canHack) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    if (bgInfo) {
      const percent = Math.min(100, (bgInfo.progress / bgInfo.duration) * 100);
      container.innerHTML = `
        <div class="bg-hack-panel active">
          <div class="bg-hack-header">
            <span class="bg-hack-icon">🔓</span>
            <span class="bg-hack-title">Background Hack</span>
            <span class="bg-hack-efficiency">${Math.round(bgInfo.efficiency * 100)}% efficiency</span>
            <button class="btn-small btn-danger" data-action="stop-background-hack">Stop</button>
          </div>
          <div class="bg-hack-info">
            <span>${bgInfo.skill.icon} ${bgInfo.skill.name} — ${bgInfo.action.name}</span>
            <span>Lv.${bgInfo.skill.level} | +${Math.floor(bgInfo.action.xp * bgInfo.efficiency)} XP</span>
          </div>
          <div class="progress-bar bg-hack-bar">
            <div class="progress-fill" style="width: ${percent}%; background: #00ff41"></div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="bg-hack-panel idle">
          <div class="bg-hack-header">
            <span class="bg-hack-icon">🔓</span>
            <span class="bg-hack-title">Background Hack</span>
            <span class="bg-hack-status-text">IDLE</span>
            <button class="btn-small" data-action="show-background-hack-picker">Start Hack</button>
          </div>
          <div class="bg-hack-info">
            <span class="bg-hack-hint">Cyberware detected — run a hacking skill in background while doing other activities</span>
          </div>
        </div>
      `;
    }
  }

  updateHackerTerminal() {
    this.hackerTerminal.update();
  }

  // Background Hack Picker
  showBackgroundHackPicker() {
    this.closePicker();
    const game = getGame();

    const overlay = document.createElement('div');
    overlay.className = 'picker-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) this.closePicker(); };

    let html = `<div class="picker-modal">
      <div class="picker-header">
        <h3>🔓 Background Hack — Select Activity</h3>
        <button class="btn-small btn-danger" data-action="close-picker">X</button>
      </div>
      <div class="picker-description">
        <p>Run a hacking activity in the background while you do other tasks. Background hacks operate at <strong>75% efficiency</strong> (reduced XP, currency, and drops).</p>
      </div>
      <div class="picker-list">`;

    // Show all hacking skills and their non-combat activities
    for (const skillId of BACKGROUND_HACK_SKILLS) {
      const skill = game.skillManager.getSkill(skillId);
      if (!skill) continue;
      const activities = ACTIVITIES[skillId];
      if (!activities) continue;

      // Don't allow background hack on a skill that's already primary
      const isPrimaryActive = skill.isActive && !skill._isBackgroundHack;

      html += `<div class="bg-hack-skill-group">
        <div class="bg-hack-skill-header">${skill.icon} ${skill.name} <span class="bg-hack-skill-level">Lv.${skill.level}</span>${isPrimaryActive ? ' <span class="badge-active">PRIMARY ACTIVE</span>' : ''}</div>`;

      activities.forEach(act => {
        if (act.enemy) return; // no combat activities in background
        const locked = skill.level < act.level;
        const disabled = locked || isPrimaryActive;
        const effXp = Math.floor(act.xp * BACKGROUND_HACK_EFFICIENCY);

        let rewardStr = '';
        if (act.rewards) {
          const parts = [];
          if (act.rewards.currency) parts.push(`${Math.floor(act.rewards.currency.min * BACKGROUND_HACK_EFFICIENCY)}-${Math.floor(act.rewards.currency.max * BACKGROUND_HACK_EFFICIENCY)} E$`);
          if (act.rewards.items) {
            Object.entries(act.rewards.items).forEach(([item, range]) => {
              if (range.max > 0) parts.push(`${range.min}-${range.max} ${item.replace(/_/g, ' ')}`);
            });
          }
          if (parts.length > 0) rewardStr = `<div class="act-rewards">Rewards: ${parts.join(', ')}</div>`;
        }

        html += `
          <div class="act-item ${disabled ? 'locked' : ''}">
            <div class="act-info">
              <div class="act-name">${act.name}</div>
              <div class="act-details">
                ${locked ? `<span class="act-locked">Requires level ${act.level}</span>` : ''}
                ${!locked ? `<span>Duration: ${act.duration}s</span>` : ''}
                <span>+${effXp} XP (75%)</span>
              </div>
              ${rewardStr}
            </div>
            <div class="act-action">
              ${disabled
                ? (locked ? '<span class="act-lock-icon">🔒</span>' : '<span class="act-lock-icon">IN USE</span>')
                : `<button class="btn-small" data-action="start-background-hack" data-skill-id="${skill.id}" data-action-id="${act.id}">Hack</button>`
              }
            </div>
          </div>`;
      });

      html += `</div>`;
    }

    html += `</div></div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    this.pickerOverlay = overlay;

    const closeBtn = overlay.querySelector('[data-action="close-picker"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePicker());
    }
  }

  // ==========================================
  // Skill Cards View
  // ==========================================
  updateSkillListings() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('skills-container');
    if (!container) return;

    const skills = game.skillManager.getSkillsByCategory(this.currentCategory);
    const selectedSkill = this.currentSkill
      ? game.skillManager.getSkill(this.currentSkill)
      : skills[0];

    if (!this.currentSkill && selectedSkill) {
      this.currentSkill = selectedSkill.id;
    }

    const activities = selectedSkill ? (ACTIVITIES[selectedSkill.id] || []) : [];
    const skillRail = skills.map((skill) => {
      const isSelected = skill.id === selectedSkill?.id;
      return `
        <button class="skill-rail-item ${isSelected ? 'active' : ''}" data-action="focus-skill" data-skill-id="${skill.id}">
          <span class="skill-rail-icon">${skill.icon}</span>
          <span class="skill-rail-copy">
            <span class="skill-rail-name">${skill.name}</span>
            <span class="skill-rail-meta">Lvl ${skill.level}${skill.isActive ? ' • Active' : ''}</span>
          </span>
        </button>
      `;
    }).join('');

    let detailHtml = '<div class="skill-focus-empty">No skill selected.</div>';

    if (selectedSkill) {
      const concurrentLoad = game.skillManager.getConcurrentSkillLoad();
      const concurrentEfficiency = Math.round(game.skillManager.getConcurrentEfficiency() * 100);
      const progress = selectedSkill.getXPProgress();
      const xpStr = selectedSkill.level >= 99
        ? 'MAX LEVEL'
        : `${Math.floor(progress.current).toLocaleString()} / ${Math.floor(progress.needed).toLocaleString()} XP`;
      const xpPercent = selectedSkill.level >= 99 ? 100 : Math.min(100, progress.percent);
      const masteryEntries = Object.entries(selectedSkill.masteryData);
      const masterySummary = masteryEntries.length > 0
        ? `${masteryEntries.length} tracked activity${masteryEntries.length === 1 ? '' : 'ies'}`
        : 'No mastery yet';
      const bgHackInfo = game.skillManager.getBackgroundHackInfo();
      const hasParallelPenalty = bgHackInfo && !selectedSkill._isBackgroundHack && selectedSkill.isActive;

      let activityState = 'Idle';
      if (selectedSkill.isActive && selectedSkill.activeAction) {
        if (selectedSkill._isBackgroundHack) {
          activityState = `Background Hack • ${selectedSkill.activeAction.name} (75%)`;
        } else if (hasParallelPenalty) {
          activityState = `Active • ${selectedSkill.activeAction.name} (75% XP while background hack runs)`;
        } else {
          activityState = `Active • ${selectedSkill.activeAction.name}`;
        }
      }

      const activityCards = activities.map((act) => {
        const locked = selectedSkill.level < act.level;
        const isCurrentAction = selectedSkill.activeAction?.id === act.id;
        const isCombat = !!act.enemy;
        const masteryLevel = selectedSkill.getMasteryLevel(act.id);
        let rewardStr = isCombat ? 'Combat encounter' : 'No listed rewards';

        if (!isCombat && act.rewards) {
          const parts = [];
          if (act.rewards.currency) {
            parts.push(`${act.rewards.currency.min}-${act.rewards.currency.max} E$`);
          }
          if (act.rewards.items) {
            Object.entries(act.rewards.items).forEach(([item, range]) => {
              parts.push(`${range.min}-${range.max} ${item.replace(/_/g, ' ')}`);
            });
          }
          if (parts.length > 0) rewardStr = parts.join(' • ');
        }

        return `
          <div class="skill-activity-card ${locked ? 'locked' : ''} ${isCurrentAction ? 'current' : ''}">
            <div class="skill-activity-card-top">
              <div>
                <div class="skill-activity-name">${act.name}</div>
                <div class="skill-activity-meta">
                  <span>${locked ? `Requires Lv.${act.level}` : `Lv.${act.level}+`}</span>
                  <span>${isCombat ? 'Combat' : `${act.duration}s`}</span>
                  <span>+${act.xp} XP</span>
                  ${masteryLevel > 1 ? `<span>Mastery ${masteryLevel}</span>` : ''}
                </div>
              </div>
              <div>
                ${locked
                  ? '<span class="badge-maxed">Locked</span>'
                  : isCurrentAction
                    ? '<span class="badge-active">Active</span>'
                    : `<button class="btn-small" data-action="start-activity" data-skill-id="${selectedSkill.id}" data-action-id="${act.id}">Start</button>`}
              </div>
            </div>
            <div class="skill-activity-rewards">${rewardStr}</div>
          </div>
        `;
      }).join('');

      detailHtml = `
        <div class="skill-focus-card ${selectedSkill.isActive ? 'active' : ''}" style="border-color: ${selectedSkill.color}">
          <div class="skill-focus-header">
            <div class="skill-focus-title">
              <span class="skill-icon">${selectedSkill.icon}</span>
              <div>
                <h3>${selectedSkill.name}</h3>
                <p>${selectedSkill.category.toUpperCase()} • Level ${selectedSkill.level}</p>
              </div>
            </div>
            <div class="skill-status">
              ${selectedSkill._isBackgroundHack ? '<span class="badge-bg-hack">BG HACK</span>' : selectedSkill.isActive ? '<span class="badge-active">ACTIVE</span>' : ''}
              ${selectedSkill.level >= 99 ? '<span class="badge-maxed">MAXED</span>' : ''}
            </div>
          </div>

          <div class="skill-focus-summary">
            <div class="skill-focus-stat skill-focus-stat-wide">
              <div class="skill-focus-stat-label">XP Progress</div>
              <div class="skill-focus-stat-value">${xpStr}</div>
            </div>
            <div class="skill-focus-stat skill-focus-stat-wide">
              <div class="skill-focus-stat-label">State</div>
              <div class="skill-focus-stat-value">${activityState}</div>
            </div>
            <div class="skill-focus-stat">
              <div class="skill-focus-stat-label">Mastery</div>
              <div class="skill-focus-stat-value">${masterySummary}</div>
            </div>
            <div class="skill-focus-stat">
              <div class="skill-focus-stat-label">Activities</div>
              <div class="skill-focus-stat-value">${activities.length}</div>
            </div>
            <div class="skill-focus-stat skill-focus-stat-wide skill-load-stat" title="Running multiple grinds at once shares one lightweight game tick. Each extra active grind reduces all non-combat grind payouts, so the game stays efficient without spiking CPU usage.">
              <div class="skill-focus-stat-label">Parallel Grind Load</div>
              <div class="skill-focus-stat-value">${concurrentLoad} active grind${concurrentLoad === 1 ? '' : 's'} • ${concurrentEfficiency}% payout efficiency</div>
            </div>
          </div>

          <div class="xp-bar skill-focus-bar">
            <div class="xp-fill" style="width: ${xpPercent}%; background: ${selectedSkill.color}"></div>
          </div>

          <div class="skill-focus-actions">
            ${selectedSkill.level < 99 && !selectedSkill._isBackgroundHack ? `<button class="btn-small" data-action="show-activities" data-skill-id="${selectedSkill.id}">Open Picker</button>` : ''}
            ${selectedSkill.isActive ? `<button class="btn-small btn-danger" data-action="stop-skill" data-skill-id="${selectedSkill.id}">Stop</button>` : ''}
          </div>

          <div class="skill-focus-activities">
            <div class="skill-focus-section-title">Available Activities</div>
            ${activityCards || '<div class="skill-focus-empty">No activities available.</div>'}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="skills-shell">
        <aside class="skills-rail">
          <div class="skill-focus-section-title">${this.currentCategory.toUpperCase()}</div>
          <div class="skill-rail-list">${skillRail}</div>
        </aside>
        <section class="skills-detail">${detailHtml}</section>
      </div>
    `;
  }

  // ==========================================
  // Activity Picker Modal
  // ==========================================
  showActivityPicker(skill, activities) {
    this.closePicker();

    const overlay = document.createElement('div');
    overlay.className = 'picker-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) this.closePicker(); };

    const game = getGame();
    const bgHackInfo = game.skillManager.getBackgroundHackInfo();
    const warningHtml = bgHackInfo && !skill._isBackgroundHack ? `
      <div style="background: #1a0a0a; border: 2px solid #ff6600; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
        <strong style="color: #ff6600;">⚠️ PARALLEL HACK ACTIVE</strong><br>
        <small>Starting an activity will reduce your XP to <strong>75%</strong> while the background hack runs.</small>
      </div>
    ` : '';

    let html = `<div class="picker-modal">
      <div class="picker-header">
        <h3>${skill.icon} ${skill.name} — Activities</h3>
        <button class="btn-small btn-danger" data-action="close-picker">X</button>
      </div>
      ${warningHtml}
      <div class="picker-list">`;

    activities.forEach(act => {
      const locked = skill.level < act.level;
      const isCombat = !!act.enemy;
      const isCurrentAction = skill.activeAction?.id === act.id;
      const masteryLevel = skill.getMasteryLevel(act.id);

      let rewardStr = '';
      if (act.rewards) {
        const parts = [];
        if (act.rewards.currency) parts.push(`${act.rewards.currency.min}-${act.rewards.currency.max} E$`);
        if (act.rewards.items) {
          Object.entries(act.rewards.items).forEach(([item, range]) => {
            if (range.max > 0) parts.push(`${range.min}-${range.max} ${item.replace(/_/g, ' ')}`);
          });
        }
        if (parts.length > 0) rewardStr = `<div class="act-rewards">Rewards: ${parts.join(', ')}</div>`;
      }
      if (isCombat) {
        rewardStr = `<div class="act-rewards">Combat: defeat enemies for loot</div>`;
      }

      html += `
        <div class="act-item ${locked ? 'locked' : ''} ${isCurrentAction ? 'current' : ''}">
          <div class="act-info">
            <div class="act-name">${act.name}</div>
            <div class="act-details">
              ${locked ? `<span class="act-locked">Requires level ${act.level}</span>` : ''}
              ${!locked && !isCombat ? `<span>Duration: ${act.duration}s</span>` : ''}
              <span>+${act.xp} XP</span>
              ${masteryLevel > 1 ? `<span class="mastery-badge">🔷 Mastery ${masteryLevel}</span>` : ''}
            </div>
            ${rewardStr}
          </div>
          <div class="act-action">
            ${locked
              ? '<span class="act-lock-icon">🔒</span>'
              : isCurrentAction
                ? '<span class="badge-active">ACTIVE</span>'
                : `<button class="btn-small" data-action="start-activity" data-skill-id="${skill.id}" data-action-id="${act.id}">Start</button>`
            }
          </div>
        </div>`;
    });

    html += `</div></div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    this.pickerOverlay = overlay;

    // Add close button handler
    const closeBtn = overlay.querySelector('[data-action="close-picker"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePicker());
    }
  }

  closePicker() {
    if (this.pickerOverlay) {
      this.pickerOverlay.remove();
      this.pickerOverlay = null;
    }
    // Also remove any leftover
    document.querySelectorAll('.picker-overlay').forEach(el => el.remove());
  }

  // ==========================================
  // Combat View
  // ==========================================
  updateCombatView() {
    const game = getGame();
    if (!game) return;
    const combatEl = document.getElementById('combat-status');
    if (!combatEl) return;

    if (!game.combat.isActive || !game.combat.currentEnemy) {
      combatEl.style.display = 'none';
      return;
    }

    combatEl.style.display = 'block';
    const enemy = game.combat.currentEnemy;
    const enemyHpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
    const playerHpPercent = Math.max(0, (game.combat.playerHp / game.combat.maxPlayerHp) * 100);

    // Find which skill is currently running combat
    const combatSkill = game.skillManager.getAllSkills().find(s => s.isActive && s.activeAction?.enemy) || { id: 'combat' };

    // Get active ability buffs
    let buffsHtml = '';
    if (game.abilityManager) {
      const abilityBuffs = game.abilityManager.getActiveBuffs();
      const activeEffects = game.abilityManager.activeEffects;
      if (activeEffects.length > 0) {
        buffsHtml = '<div class="combat-buffs">';
        const seen = new Set();
        for (const eff of activeEffects) {
          const key = eff.buffType;
          if (seen.has(key)) continue;
          seen.add(key);
          const buffLabels = {
            damage: '⚔️ +DMG', defense: '🛡️ +DEF', speed: '⚡ +SPD',
            critChance: '🎯 +CRIT', critDamage: '💥 +CRIT DMG', evasion: '💨 +EVA',
            shield: '🔰 SHIELD', enemyDamageReduce: '📉 -E.DMG', enemyDefenseReduce: '📉 -E.DEF',
            enemyVulnerability: '🎯 VULN', stun: '⚡ STUN', invulnerable: '✨ INVULN',
            dot: '🔥 DoT',
          };
          const label = buffLabels[key] || key;
          buffsHtml += `<span class="combat-buff-tag">${label} ${eff.remaining}s</span>`;
        }
        buffsHtml += '</div>';
      }
    }

    combatEl.innerHTML = `
      <div class="combat-container">
        <div class="combat-player">
          <h3>You</h3>
          <div class="hp-bar-player">
            <div class="hp-fill" style="width: ${playerHpPercent}%"></div>
          </div>
          <p>${game.combat.playerHp} / ${game.combat.maxPlayerHp} HP</p>
        </div>
        <div class="combat-vs">VS</div>
        <div class="combat-enemy">
          ${enemy.isBoss ? '<div class="boss-indicator">BOSS</div>' : ''}
          <h3>${enemy.name}</h3>
          ${enemy.isEnraged ? '<div class="enraged-indicator">ENRAGED!</div>' : ''}
          <div class="hp-bar-enemy">
            <div class="hp-fill" style="width: ${enemyHpPercent}%"></div>
          </div>
          <p>${enemy.hp} / ${enemy.maxHp} HP</p>
        </div>
      </div>
      ${buffsHtml}
      <div class="combat-actions">
        <button class="btn-small btn-danger" data-action="stop-skill" data-skill-id="${combatSkill.id}">Flee</button>
      </div>
    `;
  }

  // ==========================================
  // Currency display
  // ==========================================
  updateCurrencyDisplay() {
    const game = getGame();
    if (!game) return;
    const currEl = document.getElementById('currency-display');
    if (currEl) {
      currEl.textContent = `E$ ${game.economy.getCurrency().toLocaleString()}`;
    }
  }

  // ==========================================
  // Inventory View
  // ==========================================
   renderInventoryView() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('inventory-container');
    if (!container) return;

    const items = game.inventory.getSummary();
    const equipped = game.equipment.getEquipped();

    const rarityColors = {
      common: '#cccccc',
      uncommon: '#00ff41',
      rare: '#0099ff',
      epic: '#ff00ff',
      legendary: '#ffff00',
    };

    let html = '';

    // Equipment section
    html += '<div class="inv-section"><h3 class="inv-section-title">EQUIPPED</h3><div class="equipment-slots">';
    ['weapon', 'armor', 'cyberware'].forEach(slot => {
      const item = equipped[slot];
      const rarityColor = item ? (rarityColors[item.rarity] || '#cccccc') : '';
      html += `<div class="equip-slot">
        <div class="equip-slot-label">${slot.toUpperCase()}</div>
        ${item
          ? `<div class="equip-slot-item" style="border-left: 3px solid ${rarityColor}">${item.icon} ${item.name}${item.rarity && item.rarity !== 'common' ? ` <span class="rarity-badge" style="color:${rarityColor}">[${item.rarity.toUpperCase()}]</span>` : ''}</div>
             <button class="btn-small btn-danger" data-action="unequip-item" data-slot="${slot}">Unequip</button>`
          : `<div class="equip-slot-empty">Empty</div>`
        }
      </div>`;
    });
    html += '</div></div>';

    const filteredItems = this.inventoryFilter === 'all'
      ? items
      : items.filter(item => item.type === this.inventoryFilter || item.linkedSkill === this.inventoryFilter);

    // Items section
    html += `<div class="inv-section"><h3 class="inv-section-title">ITEMS</h3>
      <div class="inventory-toolbar">
        <button class="btn-small ${this.inventoryFilter === 'all' ? 'btn-danger' : ''}" data-action="set-inventory-filter" data-filter="all">All</button>
        <button class="btn-small ${this.inventoryFilter === 'weapon' ? 'btn-danger' : ''}" data-action="set-inventory-filter" data-filter="weapon">Weapons</button>
        <button class="btn-small ${this.inventoryFilter === 'armor' ? 'btn-danger' : ''}" data-action="set-inventory-filter" data-filter="armor">Armor</button>
        <button class="btn-small ${this.inventoryFilter === 'cyberware' ? 'btn-danger' : ''}" data-action="set-inventory-filter" data-filter="cyberware">Cyberware</button>
        <button class="btn-small ${this.inventoryFilter === 'material' ? 'btn-danger' : ''}" data-action="set-inventory-filter" data-filter="material">Materials</button>
        <button class="btn-small ${this.inventoryFilter === 'consumable' ? 'btn-danger' : ''}" data-action="set-inventory-filter" data-filter="consumable">Consumables</button>
      </div>`;
    if (filteredItems.length === 0) {
      html += '<p class="inv-empty">No items yet. Start grinding!</p>';
    } else {
      html += '<div class="inv-grid">';
      filteredItems.forEach(item => {
        const isEquippable = ['weapon', 'armor', 'cyberware'].includes(item.type);
        const canSell = item.value > 0;
        const rarityColor = rarityColors[item.rarity] || '#cccccc';
        const rarityClass = item.rarity || 'common';
        const perkText = item.perks?.length ? item.perks.join(' • ') : (item.description || 'No perks');
        html += `<div class="inventory-item rarity-${rarityClass}" style="border-color: ${rarityColor}">
          <div class="inventory-icon">${item.icon}</div>
          <div class="inventory-name">${item.name}${item.rarity && item.rarity !== 'common' ? ` <span class="rarity-badge" style="color:${rarityColor}">[${item.rarity.toUpperCase()}]</span>` : ''}</div>
          <div class="inventory-desc" title="${item.tooltip || perkText}">${perkText}</div>
          <div class="inventory-qty">x${item.quantity}</div>
          <div class="inventory-actions">
            ${isEquippable ? `<button class="btn-small" data-action="equip-item" data-item-id="${item.id}">Equip</button>` : ''}
            ${canSell ? `<button class="btn-small" data-action="sell-item" data-item-id="${item.id}" data-quantity="1">Sell (${item.value} E$)</button>` : ''}
            ${canSell && item.quantity > 1 ? `<button class="btn-small btn-danger" data-action="sell-item" data-item-id="${item.id}" data-quantity="${item.quantity}">Sell All</button>` : ''}
          </div>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div>';

    container.innerHTML = html;
  }

  // ==========================================
  // Achievements View
  // ==========================================
  renderAchievementsView() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const achievements = game.achievements.getAll();
    let html = `<div class="ach-summary">${game.achievements.getUnlockedCount()} / ${achievements.length} Unlocked</div>`;
    html += '<div class="ach-grid">';

    achievements.forEach(ach => {
      html += `<div class="ach-card ${ach.unlocked ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${ach.unlocked ? '🏆' : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${ach.description}</div>
        </div>
      </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // ==========================================
  // Shop View
  // ==========================================
  renderShopView() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('shop-container');
    if (!container) return;

    this.shopRotationSeed = Math.floor(Date.now() / SHOP_ROTATION_INTERVAL_MS);
    const activeSkillId = this.currentSkill || game.skillManager.getSkillsByCategory(this.currentCategory)[0]?.id || null;
    const rotatingItems = getRotatingShopItems(game.economy.getCurrency(), game.skillManager.getTotalLevel(), activeSkillId, this.shopRotationSeed);
    const filteredShop = this.shopFilter === 'all'
      ? rotatingItems
      : rotatingItems.filter(item => item.category === this.shopFilter || item.linkedSkill === this.shopFilter);
    const pageSize = 12;
    const maxPage = Math.max(0, Math.ceil(filteredShop.length / pageSize) - 1);
    this.shopPage = Math.min(this.shopPage, maxPage);
    const pagedItems = filteredShop.slice(this.shopPage * pageSize, (this.shopPage + 1) * pageSize);
    const msRemaining = SHOP_ROTATION_INTERVAL_MS - (Date.now() % SHOP_ROTATION_INTERVAL_MS);
    const minutesRemaining = Math.max(1, Math.ceil(msRemaining / 60000));
    let html = `<div class="shop-summary">Curated rollout: ${rotatingItems.length} items shown from ${SHOP_ITEMS.length}+ total listings. Current spotlight: ${activeSkillId ? activeSkillId.replace(/_/g, ' ') : 'mixed market'}.</div>
      <div class="shop-toolbar">
        <button class="btn-small ${this.shopFilter === 'all' ? 'btn-danger' : ''}" data-action="set-shop-filter" data-filter="all">All</button>
        <button class="btn-small ${this.shopFilter === 'weapon' ? 'btn-danger' : ''}" data-action="set-shop-filter" data-filter="weapon">Weapons</button>
        <button class="btn-small ${this.shopFilter === 'armor' ? 'btn-danger' : ''}" data-action="set-shop-filter" data-filter="armor">Armor</button>
        <button class="btn-small ${this.shopFilter === 'cyberware' ? 'btn-danger' : ''}" data-action="set-shop-filter" data-filter="cyberware">Cyberware</button>
        <button class="btn-small ${this.shopFilter === 'material' ? 'btn-danger' : ''}" data-action="set-shop-filter" data-filter="material">Materials</button>
        <button class="btn-small ${this.shopFilter === 'consumable' ? 'btn-danger' : ''}" data-action="set-shop-filter" data-filter="consumable">Consumables</button>
        <button class="btn-small" data-action="refresh-shop-rollout">Rotate Preview</button>
        <span class="shop-page-label">Next market cycle in ~${minutesRemaining} min</span>
      </div>
      <div class="shop-grid">`;
    const rarityColors = {
      common: '#cccccc',
      uncommon: '#00ff41',
      rare: '#0099ff',
      epic: '#ff00ff',
      legendary: '#ffff00',
    };
    pagedItems.forEach(item => {
      const canAfford = game.economy.getCurrency() >= item.cost;
      // Look up item rarity from ITEMS
      const itemKey = Object.keys(ITEMS).find(k => ITEMS[k].id === item.id);
      const itemDef = itemKey ? ITEMS[itemKey] : null;
      const rarity = itemDef?.rarity || 'common';
      const rarityColor = rarityColors[rarity] || '#cccccc';
      const tooltip = getItemTooltip(itemDef) || item.description;
      html += `<div class="shop-item ${canAfford ? '' : 'unaffordable'} rarity-${rarity}">
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-info">
          <div class="shop-name">${item.name}${rarity !== 'common' ? ` <span class="rarity-badge" style="color:${rarityColor}">[${rarity.toUpperCase()}]</span>` : ''}</div>
          <div class="shop-desc" title="${tooltip}">${tooltip}</div>
          <div class="shop-cost">E$ ${item.cost.toLocaleString()}</div>
        </div>
        <button class="btn-small ${canAfford ? '' : 'disabled'}" 
          data-action="buy-item"
          data-item-id="${item.id}"
          data-cost="${item.cost}"
          data-quantity="${item.quantity || 1}"
          ${canAfford ? '' : 'disabled'}>
          Buy
        </button>
      </div>`;
    });
    html += `</div><div class="shop-pagination">
      <button class="btn-small ${this.shopPage <= 0 ? 'disabled' : ''}" data-action="shop-page" data-direction="prev" ${this.shopPage <= 0 ? 'disabled' : ''}>Prev</button>
      <span class="shop-page-label">Page ${this.shopPage + 1} / ${Math.max(1, maxPage + 1)}</span>
      <button class="btn-small ${this.shopPage >= maxPage ? 'disabled' : ''}" data-action="shop-page" data-direction="next" ${this.shopPage >= maxPage ? 'disabled' : ''}>Next</button>
    </div>`;
    container.innerHTML = html;
  }

  // ==========================================
  // Crafting View
  // ==========================================
  renderCraftingView() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('crafting-container');
    if (!container) return;

    const recipes = game.crafter.getAvailableRecipes();
    let html = `<div class="craft-summary">${recipes.length} Recipes Available</div>`;
    html += '<div class="craft-grid">';

    if (recipes.length === 0) {
      html += '<p class="craft-empty">Level up skills to unlock recipes!</p>';
    } else {
      Object.entries(CRAFT_RECIPES).forEach(([id, recipe]) => {
        const available = recipes.some(r => r.id === id);
        const canCraft = available && game.crafter.canCraft(id).can;

        // Build inputs/outputs display
        let inputsStr = Object.entries(recipe.inputs)
          .map(([item, qty]) => `${qty}x ${item.replace(/_/g, ' ')}`)
          .join(', ');
        let outputsStr = Object.entries(recipe.outputs)
          .map(([item, qty]) => `${qty}x ${item.replace(/_/g, ' ')}`)
          .join(', ');

        const reason = available ? game.crafter.canCraft(id).reason : `Requires ${recipe.requiredSkill} level ${recipe.level}`;

        html += `<div class="craft-card ${available ? '' : 'locked'} ${canCraft ? 'craftable' : ''} ${recipe.category || ''}">
          <div class="craft-name">${recipe.name}</div>
          <div class="craft-req">Requires: ${recipe.requiredSkill} Lvl ${recipe.level}</div>
          <div class="craft-inputs">Input: ${inputsStr}</div>
          <div class="craft-outputs">Output: ${outputsStr}</div>
          <div class="craft-cost">Cost: E$ ${recipe.currencyCost}</div>
          ${available
            ? `<button class="btn-small ${canCraft ? '' : 'disabled'}" 
              data-action="craft" 
              data-recipe-id="${id}"
              ${canCraft ? '' : 'disabled'}>
              ${canCraft ? 'Craft' : reason}
            </button>`
            : `<span class="craft-lock">🔒 ${reason}</span>`
          }
        </div>`;
      });
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // ==========================================
  // Prestige View
  // ==========================================
  renderPrestigeView() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('prestige-container');
    if (!container) return;

    const prestige = game.prestige;
    const totalXP = Object.values(game.skillManager.skills)
      .reduce((sum, skill) => sum + skill.xp, 0);
    const nextPrestigeXP = Math.pow(prestige.level + 1, 2) * 500000;
    const canPrestige = nextPrestigeXP <= totalXP;

    let html = `<div class="prestige-info">
      <div class="prestige-stat">
        <div class="stat-label">Prestige Level</div>
        <div class="stat-value">${prestige.level}</div>
      </div>
      <div class="prestige-stat">
        <div class="stat-label">Total Resets</div>
        <div class="stat-value">${prestige.totalResets}</div>
      </div>
      <div class="prestige-stat">
        <div class="stat-label">Prestige Points</div>
        <div class="stat-value">${prestige.points}</div>
      </div>
    </div>`;

    // Bonuses display
    html += `<div class="prestige-bonuses">
      <h3>Permanent Bonuses</h3>
      <div class="bonus-list">
        <div class="bonus-item">XP Multiplier: +${((prestige.bonuses.xpMultiplier - 1) * 100).toFixed(0)}%</div>
        <div class="bonus-item">Currency Multiplier: +${((prestige.bonuses.currencyMultiplier - 1) * 100).toFixed(0)}%</div>
        <div class="bonus-item">Material Drop Bonus: +${prestige.bonuses.materialDropBonus}%</div>
        <div class="bonus-item">Mastery XP Bonus: +${prestige.bonuses.masteryXpBonus}%</div>
        <div class="bonus-item">Combat Damage Bonus: +${prestige.bonuses.combatDamageBonus || 0}%</div>
        <div class="bonus-item">Offline Progress Bonus: +${prestige.bonuses.offlineBonus || 0}%</div>
      </div>
    </div>`;

    // Prestige Upgrades Shop
    html += `<div class="prestige-upgrades">
      <h3>Prestige Upgrades</h3>
      <div class="upgrade-grid">`;
    
    Object.entries(PRESTIGE_UPGRADES).forEach(([id, upgrade]) => {
      const purchased = prestige.purchasedUpgrades[id];
      const canAfford = prestige.points >= upgrade.cost;
      html += `<div class="upgrade-card ${purchased ? 'purchased' : ''} ${canAfford && !purchased ? 'affordable' : ''}">
        <div class="upgrade-name">${upgrade.name}</div>
        <div class="upgrade-desc">${upgrade.description}</div>
        <div class="upgrade-cost">${upgrade.cost} Points</div>
        ${purchased
          ? '<span class="upgrade-owned">OWNED</span>'
          : `<button class="btn-small ${canAfford ? '' : 'disabled'}" 
              data-action="buy-prestige-upgrade" 
              data-upgrade-id="${id}"
              ${canAfford ? '' : 'disabled'}>
              Buy
            </button>`
        }
      </div>`;
    });
    
    html += '</div></div>';

    // Prestige button
    html += `<div class="prestige-action">
      <div class="prestige-progress">
        <div class="prestige-label">Progress to next Prestige: ${totalXP.toLocaleString()} / ${nextPrestigeXP.toLocaleString()} XP</div>
        <div class="prestige-bar">
          <div class="prestige-fill" style="width: ${Math.min(100, (totalXP / nextPrestigeXP) * 100)}%"></div>
        </div>
      </div>
      <button class="btn-large ${canPrestige ? '' : 'disabled'}" 
        data-action="prestige"
        ${canPrestige ? '' : 'disabled'}>
        ${canPrestige ? 'PRESTIGE' : 'Need More XP'}
      </button>
    </div>`;

    container.innerHTML = html;
  }

  // ==========================================
  // Passives & Abilities View
  // ==========================================
  renderPassivesView() {
    const game = getGame();
    if (!game) return;
    const container = document.getElementById('passives-container');
    if (!container) return;

    const stats = game.passiveStats ? game.passiveStats.getStats() : {};
    const breakdown = game.passiveStats ? game.passiveStats.getBreakdown() : {};

    const statMeta = [
      { key: 'maxHP',         label: 'Max HP',         icon: '❤️', unit: '',  decimals: 0, color: '#ff1744' },
      { key: 'attackPower',   label: 'Attack Power',   icon: '⚔️', unit: '',  decimals: 1, color: '#ff6600' },
      { key: 'defense',       label: 'Defense',        icon: '🛡️', unit: '',  decimals: 1, color: '#00d4ff' },
      { key: 'evasion',       label: 'Evasion',        icon: '💨', unit: '%', decimals: 1, color: '#00ff41' },
      { key: 'critChance',    label: 'Crit Chance',    icon: '🎯', unit: '%', decimals: 1, color: '#ffff00' },
      { key: 'critDamage',    label: 'Crit Damage',    icon: '💥', unit: '%', decimals: 1, color: '#ff00ff' },
      { key: 'xpBonus',       label: 'XP Bonus',       icon: '⭐', unit: '%', decimals: 1, color: '#00ff41' },
      { key: 'currencyBonus', label: 'Currency Bonus',  icon: '💰', unit: '%', decimals: 1, color: '#00d4ff' },
      { key: 'actionSpeed',   label: 'Action Speed',   icon: '⚡', unit: '%', decimals: 1, color: '#ffff00' },
      { key: 'lootBonus',     label: 'Loot Bonus',     icon: '💎', unit: '%', decimals: 1, color: '#ff00ff' },
    ];

    let html = '';

    // --- Passive Stats Panel ---
    html += '<div class="passives-section"><h3 class="passives-section-title">PASSIVE STATS</h3>';
    html += '<div class="passive-stats-grid">';
    for (const meta of statMeta) {
      const val = stats[meta.key] || 0;
      const bd = breakdown[meta.key] || { base: 0, skills: 0, equipment: 0, prestige: 0 };
      const displayVal = meta.decimals === 0 ? Math.floor(val) : val.toFixed(meta.decimals);

      // Build breakdown tooltip parts
      const parts = [];
      if (bd.base) parts.push(`Base: ${bd.base}`);
      if (bd.skills) parts.push(`Skills: +${bd.skills.toFixed(1)}`);
      if (bd.equipment) parts.push(`Equip: +${bd.equipment.toFixed(1)}`);
      if (bd.prestige) parts.push(`Prestige: +${bd.prestige.toFixed(1)}`);

      html += `<div class="passive-stat-card" style="border-color: ${meta.color}22">
        <div class="passive-stat-icon">${meta.icon}</div>
        <div class="passive-stat-info">
          <div class="passive-stat-label">${meta.label}</div>
          <div class="passive-stat-value" style="color: ${meta.color}">${displayVal}${meta.unit}</div>
        </div>
        <div class="passive-stat-breakdown">${parts.join(' | ')}</div>
      </div>`;
    }
    html += '</div></div>';

    // --- Abilities Panel ---
    html += '<div class="passives-section"><h3 class="passives-section-title">COMBAT ABILITIES</h3>';
    html += '<p class="passives-hint">Select one ability per skill. Auto-cast activates at mastery 50+.</p>';

    const categories = [
      { id: 'hacking',    name: 'HACKING',    color: '#00ff41' },
      { id: 'netrunning', name: 'NETRUNNING',  color: '#00d4ff' },
      { id: 'street',     name: 'STREET',      color: '#ff00ff' },
      { id: 'tech',       name: 'TECH',        color: '#ffff00' },
      { id: 'fixer',      name: 'FIXER',       color: '#ff6600' },
      { id: 'ripper',     name: 'RIPPER',      color: '#ff0099' },
    ];

    // Build a map of skillId -> SKILLS def for category lookup
    const skillDefs = {};
    Object.values(SKILLS).forEach(s => { skillDefs[s.id] = s; });

    for (const cat of categories) {
      // Get skills in this category
      const catSkillIds = Object.values(SKILLS).filter(s => s.category === cat.id).map(s => s.id);
      if (catSkillIds.length === 0) continue;

      // Check if any skill in this category has abilities
      const hasAbilities = catSkillIds.some(sid => SKILL_ABILITIES[sid] && SKILL_ABILITIES[sid].length > 0);
      if (!hasAbilities) continue;

      html += `<div class="ability-category">
        <h4 class="ability-category-title" style="color: ${cat.color}">${cat.name}</h4>
        <div class="ability-skills-list">`;

      for (const skillId of catSkillIds) {
        const skillAbilities = game.abilityManager
          ? game.abilityManager.getAbilitiesForSkill(skillId)
          : [];
        if (skillAbilities.length === 0) continue;

        const skillDef = skillDefs[skillId];
        const skill = game.skillManager.getSkill(skillId);
        const skillLevel = skill ? skill.level : 1;

        html += `<div class="ability-skill-group">
          <div class="ability-skill-header">
            <span class="ability-skill-icon">${skillDef.icon}</span>
            <span class="ability-skill-name">${skillDef.name}</span>
            <span class="ability-skill-level">Lvl ${skillLevel}</span>
          </div>
          <div class="ability-cards">`;

        for (const ab of skillAbilities) {
          const lockedClass = !ab.unlocked ? 'ability-locked' : '';
          const selectedClass = ab.selected ? 'ability-selected' : '';
          const autocastClass = ab.autocast ? 'ability-autocast' : '';
          const cdActive = ab.cooldownRemaining > 0;

          const typeColors = { damage: '#ff1744', heal: '#00ff41', buff: '#00d4ff', debuff: '#ff6600' };
          const typeColor = typeColors[ab.type] || '#888';

          html += `<div class="ability-card ${lockedClass} ${selectedClass} ${autocastClass}">
            <div class="ability-card-top">
              <span class="ability-icon">${ab.icon}</span>
              <div class="ability-card-info">
                <div class="ability-name">${ab.name}</div>
                <div class="ability-type-tag" style="color: ${typeColor}">${ab.type.toUpperCase()}</div>
              </div>
              ${ab.autocast ? '<span class="ability-autocast-badge">AUTO</span>' : ''}
            </div>
            <div class="ability-desc">${ab.description}</div>
            <div class="ability-details">
              <span>Power: ${ab.power}</span>
              <span>CD: ${ab.cooldown}s</span>
              <span>Unlock: Lvl ${ab.level}</span>
            </div>
            <div class="ability-effect">${ab.effect}</div>
            ${cdActive ? `<div class="ability-cd-bar"><div class="ability-cd-fill" style="width: ${(ab.cooldownRemaining / ab.cooldown) * 100}%"></div></div>` : ''}
            <div class="ability-card-actions">
              ${ab.unlocked
                ? `<button class="btn-small ${ab.selected ? 'btn-danger' : ''}" data-action="select-ability" data-skill-id="${skillId}" data-ability-id="${ab.id}">
                    ${ab.selected ? 'Deselect' : 'Select'}
                  </button>`
                : `<span class="ability-lock-msg">Requires Lvl ${ab.level}</span>`
              }
            </div>
          </div>`;
        }

        html += '</div></div>';
      }

      html += '</div></div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // ==========================================
  // Changelog View
  // ==========================================
  renderChangelogView() {
    const container = document.getElementById('changelog-container');
    if (!container) return;

    const changelog = [
      {
        version: '0.9.0',
        date: 'April 11, 2026',
        title: 'The Multi-Grind & Linked Loot Update',
        entries: [
          { type: 'feature', text: 'Parallel Multi-Grind System — Up to 3 primary non-combat grinds can now run at the same time, plus background hacking where supported.' },
          { type: 'balance', text: 'Shared Grind Load Debuff — Every extra simultaneous grind lowers payout efficiency for all active grinds, now tuned to a softer progression-friendly curve: 82% at 2 grinds, 68% at 3 grinds, and 58% at 4 grinds.' },
          { type: 'feature', text: 'Linked Item Catalog — The game now supports a massive generated catalog of 1000+ linked items with rarity, pricing, linked skills, and perk metadata.' },
          { type: 'feature', text: 'Handcrafted Cyberpunk Gear — Added curated new weapons, armor, cyberware, and consumables like Neuroclock Jack, Blackwall Router Spine, Ghostwalk Cloak, Corpo Breaker, and more to support faster grinds, stronger combat, and richer skill-themed builds.' },
          { type: 'feature', text: 'Inventory Perk Cards — Inventory entries now display perk text and linked-skill context so loot is readable instead of just being a list of names.' },
          { type: 'feature', text: 'Rotating Store Rollout — The shop now surfaces a curated slice of the larger item pool based on your progression, current skill focus, and available cash, with timed market rotation, category filters, and pagination.' },
          { type: 'feature', text: 'Admin Access Controls — Admin user details now include password reset, session revocation, email/admin access management, and recent login session visibility.' },
        ],
      },
      {
        version: '0.8.1',
        date: 'April 10, 2026',
        title: 'The Admin Enhancements Update',
        entries: [
          { type: 'feature', text: 'Admin Account Creation — Administrators can now create new user accounts directly through the admin panel without requiring email verification.' },
          { type: 'feature', text: 'Rate Limiting on Auth Endpoints — Login attempts limited to 5 per 15 minutes per IP. Registration limited to 10 per hour per IP. Token refresh limited to 30 per hour per IP.' },
          { type: 'feature', text: 'Admin Dashboard UI — Full web interface at /admin.html for user management, IP blocking, audit logs, and account creation. Accessible only from 192.168.1.X.' },
          { type: 'security', text: 'Brute-Force Protection — Rate limiting prevents automated account takeover attempts on login and registration endpoints.' },
          { type: 'security', text: 'Admin-Only Account Creation — Only admin users with valid IP can create new accounts via /api/admin/users/create endpoint.' },
          { type: 'balance', text: 'Enhanced Admin Actions — Account creation now logged to audit trail with admin name and timestamp.' },
          { type: 'backend', text: 'express-rate-limit middleware integrated for all auth endpoints.' },
        ],
      },
      {
        version: '0.8.0',
        date: 'April 10, 2026',
        title: 'The Authentication & Admin Panel Update',
        entries: [
          { type: 'feature', text: 'User Authentication System — Complete password-based authentication with SHA-256 hashing, JWT tokens, and secure session management.' },
          { type: 'feature', text: 'Account Registration — Users can create accounts with username, password, and optional email. Passwords must be 6+ characters with strength validation.' },
          { type: 'feature', text: 'Persistent Login — Login system with "Remember Me" functionality. Sessions stored in database with 7-day default or 30-day extended duration.' },
          { type: 'feature', text: 'JWT Access Tokens — Short-lived access tokens (15 min) + long-lived refresh tokens (7 days) for secure API access. Auto-refresh supported.' },
          { type: 'feature', text: 'Server-Side Game Saves — Game state persisted to SQLite database. Saves include player profile, skills, inventory, economy, equipment, combat state, prestige, abilities, and living world data.' },
          { type: 'feature', text: 'Save Management — Upload/download latest save, view save history with timestamps, restore from any previous save, soft-delete old saves. Playtime tracked per save.' },
          { type: 'feature', text: 'Admin Dashboard API — Complete admin system with user management, player moderation, and server statistics (192.168.1.X IP range only).' },
          { type: 'feature', text: 'User Management — List all users with stats, view detailed user info, ban/unban accounts with reasons, reset player progress, nerf stats by multiplier.' },
          { type: 'feature', text: 'IP Blocking System — Block/unblock IP addresses temporarily or permanently. Useful for dealing with cheaters or troublemakers on local network.' },
          { type: 'feature', text: 'Audit Logging — All admin actions logged with timestamp, admin name, target user, and action details. Accessible via /api/admin/actions.' },
          { type: 'feature', text: 'Server Statistics — Dashboard showing total users, banned accounts, total saves, total playtime in hours.' },
          { type: 'security', text: 'IP-Based Access Control — Admin endpoints restricted to 192.168.1.X IP range. Prevents remote access to admin panel.' },
          { type: 'security', text: 'Password Hashing — All passwords hashed with SHA-256 before storage. Never stored in plaintext.' },
          { type: 'security', text: 'JWT Verification — All protected endpoints verify token validity and check session exists in database.' },
          { type: 'security', text: 'Session Tracking — Sessions include IP address and user agent for security auditing.' },
          { type: 'security', text: 'Banned Account Enforcement — Banned users cannot login. All active sessions deleted on ban.' },
          { type: 'balance', text: 'Admin Actions: Ban removes login access; Reset clears all saves/stats; Nerf applies multiplier to XP and currency; Block IP prevents network access.' },
          { type: 'data', text: 'Database Enhanced: 15 tables total — users, sessions, game_saves, player_profiles, admin_actions, blocked_ips, player_flags (+ legacy tables for multiplayer).' },
          { type: 'backend', text: 'Node.js/Express backend with SQLite3. Listens on port 3000. Serves both API and static files.' },
          { type: 'backend', text: 'New Dependencies: jsonwebtoken (JWT handling), crypto (password hashing via Node.js built-in).' },
        ],
      },
      {
        version: '0.7.0',
        date: 'April 10, 2026',
        title: 'The Living World Update',
        entries: [
          { type: 'feature', text: 'Living World System — A dynamic, persistent cyberpunk economy with procedurally-generated rival netrunners, rotating faction contracts, and competitive leaderboards. All offline-first, no WebSocket required.' },
          { type: 'feature', text: 'World Events — 7 weekly bonuses (Mega Hack Monday +25% hacking XP, Gang Warfare Wednesday +35%, etc.) + 4 seasonal events (Neon Festival, Corpo Summit, Street Fair, Blackwall Whispers). Auto-triggers based on calendar date.' },
          { type: 'feature', text: 'Dynamic Contracts — 3-5 faction-issued missions available at any time, rotating every 60 minutes. 8 contract types across 4 factions: data heists, espionage, bounties, raids, weapon forges, cyberware mods. Accept → complete → claim rewards.' },
          { type: 'feature', text: 'PvP Hacking System — Hack rival netrunners to steal loot and currency. Success chance: 50% + (playerLevel - targetLevel) * 2%. Success grants loot + faction rep; failure inflicts rep penalty. Risk/reward gameplay without real-time combat.' },
          { type: 'feature', text: 'Faction Reputation — Track standing (-100 to +100) with 4 factions: Chrome Syndicate (elite hackers), Arasaka Corp (megacorp), Street Crew Coalition (gangs), Blackwall Collective (rogue AI). Status changes from Ally → Friendly → Neutral → Hostile → Enemy.' },
          { type: 'feature', text: 'Persistent Leaderboards — Top 100 per skill with procedurally-named NPC rivals. Deterministic seeding ensures same names across sessions. Compete with rivals like "ShadowBreaker," "CyberRunner5," "NetspaceKing." Player rank displayed in context of rivals.' },
          { type: 'feature', text: 'Living World View — New UI page consolidating all world content: active events, available contracts, faction standings, rival hacking targets, and skill leaderboards. Color-coded difficulty indicators and success chance percentages.' },
          { type: 'feature', text: 'Faction-Specific Loot Pools — Contract and PvP hack rewards vary by faction (Hacker Vault, Street Bounty, Corp Vault, Blackwall Cache). Rewards scale by player level and prestige multiplier.' },
          { type: 'balance', text: 'World Events apply multiplicative bonuses at the system level — contracts and skill XP both benefit, creating emergent gameplay during event windows.' },
          { type: 'balance', text: 'Contract difficulty affects reward scaling: easy 0.8x, medium 1.0x, hard 1.5x, very_hard 2.0x. Player level advantage and prestige further scale rewards.' },
          { type: 'balance', text: 'Faction reputation gains +10 for contract completion, +5 for successful PvP hack, -3 for failed hack. Encourages engagement with all systems.' },
          { type: 'fix', text: 'Living World persistence fixed — saves properly deserialized on reload with fresh contracts/targets if expired.' },
        ],
      },
      {
        version: '0.6.0',
        date: 'April 10, 2026',
        title: 'The Testing & Verification Update',
        entries: [
          { type: 'fix', text: 'Comprehensive code audit completed — 16/18 known issues verified fixed.' },
          { type: 'fix', text: 'Equipment persistence confirmed working — items no longer lost on reload.' },
          { type: 'fix', text: 'Skill rewards distribution verified — items and currency properly granted on activity completion.' },
          { type: 'fix', text: 'Combat XP granting verified — combat victories now grant XP to combat skill correctly.' },
          { type: 'fix', text: 'All shop items validated — legendary_blade, quantum_implant, neural_accelerator all exist and purchasable.' },
          { type: 'fix', text: 'Healing amounts verified — Healing Nanobots heal 30 HP as advertised (no mismatch).' },
          { type: 'fix', text: 'Mobile/desktop CSS properly separated — bottom tabs hidden on desktop, visible only on mobile.' },
          { type: 'fix', text: 'CSS rules consolidated — no duplicate definitions for modals or buttons found.' },
          { type: 'balance', text: 'All 10 backend API endpoints operational and tested (100% success rate).' },
          { type: 'balance', text: 'Event-driven architecture fully functional with proper orchestrator wiring.' },
          { type: 'balance', text: 'Code quality rated EXCELLENT — production-ready from bug perspective.' },
        ],
      },
      {
        version: '0.5.0',
        date: 'April 2026',
        title: 'The Parallel Hacking Update',
        entries: [
          { type: 'feature', text: 'Parallel Hacking — Equip cyberware with Parallel Hacking capability to run a hacking skill in the background while performing any other primary activity.' },
          { type: 'feature', text: 'Background Hack Panel — Persistent status panel shows current background hack progress, efficiency, and controls.' },
          { type: 'feature', text: 'Background Hack Picker — Dedicated activity picker for selecting which hacking skill and activity to run in background.' },
          { type: 'feature', text: 'New Item: Multithreaded Link — Uncommon cyberware enabling Parallel Hacking. Available in shop for 4,000 E$.' },
          { type: 'balance', text: 'Background hacks operate at 75% efficiency — reduced XP, currency, and item drops compared to primary activities.' },
          { type: 'balance', text: 'Only non-combat hacking activities (Intrusion, Decryption, ICE Breaking, Daemon Coding) can run in background.' },
          { type: 'feature', text: 'Updated cyberware: Neural Daemon, Quantum Implant, Godlike Quantum Core, and Neural Nexus Hub now also grant Parallel Hacking.' },
        ],
      },
      {
        version: '0.4.0',
        date: 'March 2026',
        title: 'The Passives & Abilities Update',
        entries: [
          { type: 'feature', text: 'Passive Stats System — All 24 skills now contribute passive bonuses (Max HP, Attack Power, Defense, Evasion, Crit Chance, Crit Damage, XP Bonus, Currency Bonus, Action Speed, Loot Bonus). Stats aggregate from skills, equipment, and prestige.' },
          { type: 'feature', text: '72 Combat Abilities — 3 abilities per skill (damage, heal, buff, debuff). Unlocked at levels 15, 45, and 75. Select one per skill for combat use.' },
          { type: 'feature', text: 'Auto-Cast System — Abilities auto-cast during combat when skill mastery reaches 50+ on any activity.' },
          { type: 'feature', text: 'Passives & Abilities View — New combined page showing all passive stat breakdowns and ability selection interface.' },
          { type: 'feature', text: 'Critical Hit System — Player attacks can crit based on Crit Chance stat. Crit Damage multiplier scales with skills and equipment.' },
          { type: 'feature', text: 'Player Evasion — Dodge enemy attacks based on Evasion stat from Stealth and other skills.' },
          { type: 'feature', text: 'Ability Effects in Combat — Stuns, shields, DoTs, damage/defense buffs, enemy debuffs all functional in combat tick loop.' },
          { type: 'balance', text: 'Combat damage formula reworked to use PassiveStats as single source of truth for attack power and defense.' },
          { type: 'balance', text: 'Max HP now scales with Cyberware Installation and Biotech skill levels.' },
          { type: 'balance', text: 'Boss enemies now respect stun, vulnerability, and evasion mechanics from abilities.' },
        ],
      },
      {
        version: '0.3.0',
        date: 'March 2026',
        title: 'The Expansion Update',
        entries: [
          { type: 'feature', text: 'Item Rarity System — All items now have rarity tiers: Common, Uncommon, Rare, Epic, Legendary. Rarity is displayed in inventory with color-coded borders.' },
          { type: 'feature', text: '5 Boss Enemies — Rogue Netrunner, Neon Samurai, Corporate Tyrant, Digital Phantom, Chrome Wraith. Bosses have enrage phases, evasion, and life steal mechanics.' },
          { type: 'feature', text: '7 New Legendary Items — Plasma Rifle, Obsidian Combat Armor, Chrono-Infused Armor, Godlike Quantum Core, Neural Nexus Hub, Encrypted Core Shard, Prototype Nexus Core.' },
          { type: 'feature', text: '7 Legendary Crafting Recipes — Forge endgame gear from rare materials and existing equipment.' },
          { type: 'feature', text: '6 Transmutation Recipes — Convert low-tier materials into higher-tier ones. Scrap to Muscle, Data to Daemon Code, Fragments to Artifacts, and more.' },
          { type: 'feature', text: '7 New Prestige Upgrades — XP Amplifier III, Profit Maximizer II, Loot Multiplier II, Mastery Accelerator II, Combat Protocol I & II, Idle Optimizer. Total: 12 upgrades (was 5).' },
          { type: 'feature', text: 'Changelog View — You\'re reading it! Track all game updates in one place.' },
          { type: 'balance', text: 'Prestige combat damage bonus now applies to all melee attacks.' },
          { type: 'balance', text: 'Boss enemies scale with combat skill level for ongoing challenge.' },
        ],
      },
      {
        version: '0.2.0',
        date: 'March 2026',
        title: 'The Quality of Life Update',
        entries: [
          { type: 'fix', text: 'Equipment now persists across saves — no more losing gear on reload.' },
          { type: 'fix', text: 'Game reset no longer orphans crafting and prestige systems.' },
          { type: 'fix', text: 'Shop items (Legendary Blade, Quantum Implant, Neural Accelerator) now properly added to inventory on purchase.' },
          { type: 'fix', text: 'Click delegation now works on button child elements (icons, spans).' },
          { type: 'fix', text: 'Mobile bottom tabs no longer display on desktop.' },
          { type: 'fix', text: 'Duplicate CSS rules consolidated for modals and buttons.' },
          { type: 'feature', text: 'Equipment Effects Integration — Life Steal, XP Boost, Speed Boost, Loot Boost, Currency Boost now all functional.' },
          { type: 'feature', text: 'Crafting now grants XP to the required skill.' },
          { type: 'feature', text: 'Sell and Unequip buttons added to inventory.' },
          { type: 'feature', text: 'Prestige upgrade purchase UI with buy buttons.' },
          { type: 'feature', text: 'Mobile prestige tab added to bottom navigation bar.' },
        ],
      },
      {
        version: '0.1.0',
        date: 'March 2026',
        title: 'Initial Release',
        entries: [
          { type: 'feature', text: '24 skills across 6 categories: Hacking, Netrunning, Street, Tech, Fixer, Ripper.' },
          { type: 'feature', text: '120+ activities with XP, mastery, and material rewards.' },
          { type: 'feature', text: '11 enemy types with tick-based real-time combat.' },
          { type: 'feature', text: '35+ items: weapons, armor, cyberware, consumables, crafting materials.' },
          { type: 'feature', text: '20+ crafting recipes with skill requirements.' },
          { type: 'feature', text: '20 shop items across 4 tiers.' },
          { type: 'feature', text: 'Prestige system with 5 upgrades.' },
          { type: 'feature', text: '14 achievements tracking milestones.' },
          { type: 'feature', text: 'Offline progress up to 24 hours.' },
          { type: 'feature', text: 'Auto-save every 30 seconds, with export/import.' },
        ],
      },
    ];

    const typeLabels = {
      feature: { label: 'NEW', color: '#00ff41' },
      fix: { label: 'FIX', color: '#ff6600' },
      balance: { label: 'BAL', color: '#00d4ff' },
    };

    let html = '<div class="changelog-list">';

    changelog.forEach(release => {
      html += `<div class="changelog-release">
        <div class="changelog-header">
          <span class="changelog-version">v${release.version}</span>
          <span class="changelog-date">${release.date}</span>
        </div>
        <div class="changelog-title">${release.title}</div>
        <div class="changelog-entries">`;

      release.entries.forEach(entry => {
        const typeInfo = typeLabels[entry.type] || typeLabels.feature;
        html += `<div class="changelog-entry">
          <span class="changelog-tag" style="background: ${typeInfo.color}; color: #0a0e27;">${typeInfo.label}</span>
          <span class="changelog-text">${entry.text}</span>
        </div>`;
      });

      html += '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // ==========================================
  // Living World - Contracts & Leaderboards
  // ==========================================
  renderLivingWorldView() {
    const container = document.getElementById('living-world-container');
    if (!container) {
      // Create container if it doesn't exist
      container = document.createElement('div');
      container.id = 'living-world-container';
      document.querySelector('.main-content').appendChild(container);
    }

    const game = getGame();
    const world = game.livingWorld;
    const playerLevel = game.skillManager.getSkill('intrusion')?.level || 1;

    let html = '<div class="living-world-section">';

    // === ACTIVE EVENTS ===
    const activeEvents = world.getActiveEvents();
    html += '<div class="living-world-panel">';
    html += '<div class="panel-title">🌍 World Events</div>';
    if (activeEvents.length > 0) {
      html += '<div class="events-list">';
      activeEvents.forEach(evt => {
        const bonus = Math.round((evt.bonusMultiplier - 1) * 100);
        html += `<div class="event-item">
          <span class="event-icon">${evt.icon}</span>
          <div class="event-info">
            <div class="event-name">${evt.name}</div>
            <div class="event-desc">${evt.description}</div>
            <div class="event-bonus">+${bonus}% bonus</div>
          </div>
        </div>`;
      });
      html += '</div>';
    } else {
      html += '<div class="no-events">No active events. Check back later!</div>';
    }
    html += '</div>';

    // === ACTIVE CONTRACTS ===
    const contracts = world.getAvailableContracts();
    html += '<div class="living-world-panel">';
    html += '<div class="panel-title">📋 Available Contracts</div>';
    if (contracts.length > 0) {
      html += '<div class="contracts-list">';
      contracts.forEach(contract => {
        const difficulty = { easy: '🟢', medium: '🟡', hard: '🔴', very_hard: '💀' }[contract.difficulty] || '❓';
        html += `<div class="contract-item">
          <div class="contract-header">
            <span class="contract-icon">${contract.icon}</span>
            <span class="contract-name">${contract.name}</span>
            <span class="contract-difficulty">${difficulty}</span>
          </div>
          <div class="contract-desc">${contract.description}</div>
          <div class="contract-reward">💰 ${contract.baseReward} E$ | Level ${contract.minLevel}+</div>
          <button class="btn btn-small" data-action="accept-contract" data-contract-id="${contract.id}">Accept</button>
        </div>`;
      });
      html += '</div>';
    } else {
      html += '<div class="no-contracts">Contracts will refresh soon. Check back later!</div>';
    }
    html += '</div>';

    // === FACTION REPUTATION ===
    html += '<div class="living-world-panel">';
    html += '<div class="panel-title">👥 Faction Reputation</div>';
    html += '<div class="factions-list">';
     Object.entries(world.worldState.factionReputation).forEach(([factionId, rep]) => {
      const faction = FACTIONS[factionId] || {};
      const repLabel = rep > 50 ? '⭐ Ally' : rep > 0 ? '👍 Friendly' : rep < -50 ? '⛔ Enemy' : rep < 0 ? '👎 Hostile' : '😐 Neutral';
      const barWidth = Math.max(0, Math.min(100, 50 + rep));
      html += `<div class="faction-item">
        <div class="faction-name">${faction.name || factionId}</div>
        <div class="faction-rep-bar">
          <div class="faction-rep-fill" style="width: ${barWidth}%; background: ${faction.color || '#00ff41'};"></div>
        </div>
        <div class="faction-rep-label">${repLabel} (${rep})</div>
      </div>`;
    });
    html += '</div>';
    html += '</div>';

    // === PVP HACKING TARGETS ===
    const targets = world.getPvPTargets();
    html += '<div class="living-world-panel">';
    html += '<div class="panel-title">💻 Rival Netrunners</div>';
    if (targets.length > 0) {
      html += '<div class="targets-list">';
      targets.forEach((target, idx) => {
        const difficulty = target.level > playerLevel ? '🔴' : target.level < playerLevel - 10 ? '🟢' : '🟡';
        const successChance = Math.max(10, Math.min(95, 50 + (playerLevel - target.level) * 2));
        html += `<div class="target-item">
          <div class="target-header">
            <span class="target-icon">💻</span>
            <span class="target-name">${target.name}</span>
            <span class="target-level">Lv${target.level} ${difficulty}</span>
          </div>
          <div class="target-details">
            <span class="target-faction">${target.faction}</span>
            <span class="target-loot">💰 ~${target.lootValue} E$</span>
          </div>
          <div class="target-chance">Success chance: ${successChance}%</div>
          <button class="btn btn-small" data-action="hack-target" data-target-id="${target.id}">Hack</button>
        </div>`;
      });
      html += '</div>';
    } else {
      html += '<div class="no-targets">No rivals available...</div>';
    }
    html += '</div>';

    // === LEADERBOARDS ===
    html += '<div class="living-world-panel">';
    html += '<div class="panel-title">🏆 Leaderboards</div>';
    html += '<div class="leaderboards-tabs">';
    
    // Show top 3 players for current skill
    const currentSkill = this.currentSkill || 'intrusion';
    const lb = world.getLeaderboard(currentSkill);
    const playerRank = world.getPlayerRank(currentSkill, game.player.name || 'You');
    
    html += '<div class="leaderboard">';
    html += `<div class="leaderboard-title">${currentSkill.replace(/_/g, ' ').toUpperCase()}</div>`;
    if (lb.length > 0) {
      html += '<div class="leaderboard-list">';
      lb.slice(0, 10).forEach((entry, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        const isPlayer = entry.name === (game.player.name || 'You');
        const highlight = isPlayer ? ' highlight' : '';
        html += `<div class="leaderboard-entry${highlight}">
          <span class="leaderboard-rank">${medal}</span>
          <span class="leaderboard-name">${entry.name}</span>
          <span class="leaderboard-level">Lv${entry.level}</span>
          <span class="leaderboard-xp">${Math.floor(entry.xp).toLocaleString()} XP</span>
        </div>`;
      });
      html += '</div>';
    } else {
      html += '<div class="no-leaderboard">No leaderboard data yet.</div>';
    }
    if (playerRank) {
      html += `<div class="player-rank">Your rank: #${playerRank}</div>`;
    }
    html += '</div>';
    
    html += '</div>';
    html += '</div>'; // End living-world-panel
    html += '</div>'; // End living-world-section

    container.innerHTML = html;
  }

  // ==========================================
  // Navigation
  // ==========================================
  navigate(view, category = null) {
    this.currentView = view;
    if (category) this.currentCategory = category;

    // Hide all views
    document.querySelectorAll('.view-content').forEach(el => el.classList.remove('active'));
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');

    // Render the specific view
    if (view === 'skills') {
      const game = getGame();
      if (!this.currentSkill && game) {
        const firstSkill = game.skillManager.getSkillsByCategory(this.currentCategory)[0];
        if (firstSkill) this.currentSkill = firstSkill.id;
      }
      this.updateSkillListings();
    } else if (view === 'inventory') {
      this.renderInventoryView();
    } else if (view === 'achievements') {
      this.renderAchievementsView();
    } else if (view === 'shop') {
      const game = getGame();
      if (game?.achievements) game.achievements.unlock('market_watcher');
      this.renderShopView();
    } else if (view === 'crafting') {
      this.renderCraftingView();
    } else if (view === 'prestige') {
      this.renderPrestigeView();
    } else if (view === 'passives') {
      this.renderPassivesView();
    } else if (view === 'changelog') {
      this.renderChangelogView();
    } else if (view === 'world') {
      this.renderLivingWorldView();
    }
  }

  // ==========================================
  // Init
  // ==========================================
  init() {
    this.setupEventListeners();
    this.updateCurrencyDisplay();
    this.navigate('skills');
    this.updateSkillListings();
  }
}
