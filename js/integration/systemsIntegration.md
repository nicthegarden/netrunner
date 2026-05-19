/**
 * SYSTEMS INTEGRATION - Phase 4 & 5
 * 
 * This file shows how to wire the new systems into the existing game:
 * - Clarity System (Phase 1)
 * - Virus System (Phase 2)
 * - Clinic System (Phase 3)
 * - Gaming UI (Phase 4)
 * - Status Effects (Phase 5)
 */

// ============================================
// STEP 1: Import all new systems in main.js
// ============================================

import { claritySystem } from './systems/clarity.js';
import { VirusManager } from './systems/virus.js';
import { ClinicManager } from './systems/clinic.js';
import { StatusEffectManager } from './systems/statusEffects.js';
import { GameMetricsUI } from './ui/gameMetrics.js';
import { gameUIIntegration } from './ui/gameUIIntegration.js';

// ============================================
// STEP 2: Initialize in Game constructor
// ============================================

export class Game {
  constructor() {
    // ... existing systems ...
    this.skillManager = new SkillManager();
    this.combat = new Combat();
    this.inventory = new Inventory();
    // ... etc

    // NEW SYSTEMS - Add these
    this.claritySystem = claritySystem;
    this.virusManager = new VirusManager();
    this.clinicManager = new ClinicManager();
    this.statusEffectManager = new StatusEffectManager();
    this.gameMetricsUI = new GameMetricsUI();

    // Wire up integrations
    this._wireNewSystems();
  }

  // ============================================
  // STEP 3: Wire event listeners for new systems
  // ============================================

  _wireNewSystems() {
    // ========== VIRUS SYSTEM WIRING ==========

    // On hacking activity completion: check for compromise
    events.on(EVENTS.SKILL_ACTION_COMPLETE, (data) => {
      if (data.skill.id === 'intrusion' || data.skill.id === 'decryption') {
        // Check compromise chance
        const compromise = this.virusManager.checkCompromise(
          data.skill.level,
          this.passiveStats.defense,
          this.prestige.level,
          this._getActivityDifficulty(data.action)
        );

        if (compromise) {
          const virus = this.virusManager.attemptInfection(compromise.id);
        }
      }
    });

    // ========== CLINIC SYSTEM WIRING ==========

    // Track failed combat for injuries
    events.on(EVENTS.COMBAT_PLAYER_DIED, (data) => {
      const injury = this.clinicManager.createInjuryFromCombatLoss(
        this.skillManager.getSkill('combat').level,
        this.passiveStats.defense
      );

      if (injury) {
        // Store injury somewhere accessible (player.injuries array or clinic.activeInjuries)
        if (!this.currentPlayerInjuries) this.currentPlayerInjuries = [];
        this.currentPlayerInjuries.push(injury);
      }
    });

    // ========== STATUS EFFECTS WIRING ==========

    // Apply status effect damage/regen each tick
    events.on(EVENTS.GAME_TICK, (data) => {
      // Player passive damage/regen from effects
      const playerDamage = this.statusEffectManager.getPassiveDamagePerTick('player');
      const playerRegen = this.statusEffectManager.getHpRegenPerTick('player');

      if (playerDamage > 0 && this.combat.playerHp) {
        this.combat.playerHp = Math.max(0, this.combat.playerHp - playerDamage);
      }

      if (playerRegen > 0 && this.combat.playerHp) {
        this.combat.playerHp = Math.min(this.combat.maxPlayerHp, this.combat.playerHp + playerRegen);
      }

      // Enemy passive effects
      if (this.combat.currentEnemy) {
        const enemyDamage = this.statusEffectManager.getPassiveDamagePerTick(this.combat.currentEnemy.id);
        if (enemyDamage > 0) {
          this.combat.currentEnemy.hp = Math.max(0, this.combat.currentEnemy.hp - enemyDamage);
        }
      }
    });

    // ========== GAMING UI WIRING ==========

    // Initialize gaming UI integration
    gameUIIntegration.initializeGameUI();

    // Update UI on combat events
    events.on(EVENTS.COMBAT_HIT, (data) => {
      gameUIIntegration.updateCombatStatus(
        this.combat.playerHp,
        this.combat.maxPlayerHp,
        this.combat.currentEnemy?.hp || 0,
        this.combat.currentEnemy?.maxHp || 0
      );

      // Show damage popup
      gameUIIntegration.displayDamagePopup(
        data.damage,
        window.innerWidth / 2,
        window.innerHeight / 2,
        data.isCrit || false,
        data.attacker === 'player' ? 'damage' : 'incoming'
      );
    });

    // ========== VIRUS VISUAL CORRUPTION ==========

    // Tick virus system each game tick to apply visual corruption
    events.on(EVENTS.GAME_TICK, (data) => {
      this.virusManager.tick();
      this.statusEffectManager.tick();
    });

    // ========== CLARITY SYSTEM ==========

    // Show tooltips on first encounter
    events.on(EVENTS.SKILL_STARTED, (data) => {
      const tooltip = this.claritySystem.maybeShowTooltip(data.skill + '_mechanics', 'right');
      if (tooltip) {
        events.emit(EVENTS.UI_NOTIFICATION, {
          message: tooltip.text,
          type: 'info',
          title: tooltip.title,
          transient: false,
          duration: 6000
        });
      }
    });

    events.on(EVENTS.COMBAT_STARTED, (data) => {
      const tooltip = this.claritySystem.maybeShowTooltip('combat_mechanics', 'right');
      if (tooltip) {
        events.emit(EVENTS.UI_NOTIFICATION, {
          message: tooltip.text,
          type: 'info',
          title: tooltip.title,
          duration: 7000
        });
      }
    });
  }

  // ============================================
  // STEP 4: Wire into save/load
  // ============================================

  saveGame() {
    const saveData = {
      version: 5, // Bump version for new systems
      timestamp: Date.now(),
      
      // ... existing systems ...
      player: this.player.serialize(),
      skills: this.skillManager.serialize(),
      inventory: this.inventory.serialize(),
      equipment: this.equipment.serialize(),
      
      // NEW SYSTEMS - Add these
      clarity: this.claritySystem.serialize(),
      viruses: this.virusManager.serialize(),
      clinic: this.clinicManager.serialize(),
      statusEffects: this.statusEffectManager.serialize(),
      currentPlayerInjuries: this.currentPlayerInjuries || []
    };

    this.saveManager.save(saveData);
    return saveData;
  }

  loadGame(saveData) {
    // ... existing load code ...
    this.player.deserialize(saveData.player);
    this.skillManager.deserialize(saveData.skills);
    this.inventory.deserialize(saveData.inventory);
    this.equipment.deserialize(saveData.equipment);
    
    // NEW SYSTEMS - Add these
    this.claritySystem.deserialize(saveData.clarity);
    this.virusManager.deserialize(saveData.viruses);
    this.clinicManager.deserialize(saveData.clinic);
    this.statusEffectManager.deserialize(saveData.statusEffects);
    this.currentPlayerInjuries = saveData.currentPlayerInjuries || [];
  }

  // ============================================
  // STEP 5: Integrate with Combat
  // ============================================

  // In combat.js - modify tick() method to apply status effects:

  combatTickWithEffects() {
    // Player attacks
    if (this.playerAttackCooldown <= 0) {
      if (!this.statusEffectManager.isParalyzed('player')) {
        let damage = this.getPlayerDamage();

        // Apply status effect damage modifiers
        damage = this.statusEffectManager.applyDamageModifiers(damage, 'player');

        // Check confusion effect
        const targetId = this.statusEffectManager.isConfused('player')
          ? (Math.random() < 0.30 ? 'player' : this.currentEnemy.id) // 30% self-damage
          : this.currentEnemy.id;

        if (targetId === 'player') {
          this.playerHp = Math.max(0, this.playerHp - damage);
        } else {
          this.currentEnemy.hp -= damage;
        }

        this.playerAttackCooldown = 2000;
      }
    }

    // Enemy attacks
    if (this.enemyAttackCooldown <= 0 && !this.statusEffectManager.isParalyzed(this.currentEnemy.id)) {
      let enemyDamage = this.getEnemyDamage();

      // Apply status effect reduction
      enemyDamage = this.statusEffectManager.applyDamageReduction(enemyDamage, 'player');

      this.playerHp -= enemyDamage;
      this.enemyAttackCooldown = 3000;
    }

    // Check for combat end
    if (this.currentEnemy.hp <= 0) {
      this.processVictory();
    } else if (this.playerHp <= 0) {
      this.endCombat(false);
    }
  }

  // ============================================
  // STEP 6: Add UI panels for new systems
  // ============================================

  // In ui/main.js - add new view buttons to navigation:

  renderNavigationPanel() {
    const nav = document.getElementById('nav-panel');
    
    // Existing buttons...
    
    // Add NEW buttons:
    const clarityBtn = document.createElement('button');
    clarityBtn.innerHTML = '❓ Help';
    clarityBtn.onclick = () => this.showClarityPanel();
    
    const clinicBtn = document.createElement('button');
    clinicBtn.innerHTML = '🏥 Clinic';
    clinicBtn.onclick = () => this.showClinicPanel();
    
    const effectsBtn = document.createElement('button');
    effectsBtn.innerHTML = '⚡ Effects';
    effectsBtn.onclick = () => this.showStatusEffectsPanel();
    
    nav.appendChild(clarityBtn);
    nav.appendChild(clinicBtn);
    nav.appendChild(effectsBtn);
  }

  showClarityPanel() {
    const content = this.claritySystem.generateMechanicsPanel(this.game);
    
    let html = '<div style="font-size: 12px; line-height: 1.5;">';
    html += '<h3>⭐ Game Mechanics Breakdown</h3>';
    html += '<h4>XP Formula</h4>';
    html += `<p>${JSON.stringify(content.xpBreakdown, null, 2)}</p>`;
    html += '<h4>Combat Stats</h4>';
    html += `<p>${JSON.stringify(content.combatBreakdown, null, 2)}</p>`;
    html += '<h4>Inventory Health</h4>';
    html += `<p>${JSON.stringify(content.inventoryHealth, null, 2)}</p>`;
    html += '<h4>Hacking Risk Assessment</h4>';
    html += `<p>${JSON.stringify(content.hackingRiskAssessment, null, 2)}</p>`;
    html += '</div>';

    showModal('Mechanics Panel', html, [
      { text: 'Close', onclick: () => {} }
    ]);
  }

  showClinicPanel() {
    const virusCount = this.virusManager.getVirusCount();
    const injuryCount = this.currentPlayerInjuries.filter(i => !i.isHealed()).length;
    const degradation = this.clinicManager.getNeuralDegradation();

    let html = `<div style="font-size: 12px;">`;
    html += `<h3>🏥 Clinic Status</h3>`;
    html += `<p><strong>Active Viruses:</strong> ${virusCount}</p>`;
    html += `<p><strong>Injuries:</strong> ${injuryCount}</p>`;
    html += `<p><strong>Neural Degradation:</strong> ${degradation}%</p>`;

    if (virusCount > 0) {
      html += '<h4>Viruses:</h4>';
      this.virusManager.getActiveViruses().forEach(virus => {
        const remaining = virus.getRemainingTimeFormatted();
        const cost = virus.removalCost;
        html += `<p>• ${virus.name} (${virus.severity}) - ${remaining} remaining - Cost: ${cost} E$</p>`;
      });
    }

    html += '</div>';

    showModal('Clinic', html, [
      { text: 'Remove All Viruses', onclick: () => {
        const cost = this.clinicManager.removeAllViruses();
        this.economy.removeCurrency(cost);
      }},
      { text: 'Close', onclick: () => {} }
    ]);
  }

  showStatusEffectsPanel() {
    const buffs = this.statusEffectManager.getBuffs('player');
    const debuffs = this.statusEffectManager.getDebuffs('player');

    let html = '<div style="font-size: 12px;">';
    html += '<h3>⚡ Active Status Effects</h3>';

    if (buffs.length > 0) {
      html += '<h4>✓ Buffs</h4>';
      buffs.forEach(effect => {
        html += `<p>${effect.icon} ${effect.name} (${effect.getRemainingFormatted()})</p>`;
      });
    } else {
      html += '<p><em>No buffs active</em></p>';
    }

    if (debuffs.length > 0) {
      html += '<h4>⚠️ Debuffs</h4>';
      debuffs.forEach(effect => {
        html += `<p>${effect.icon} ${effect.name} (${effect.getRemainingFormatted()})</p>`;
      });
    } else {
      html += '<p><em>No debuffs active</em></p>';
    }

    html += '</div>';

    showModal('Status Effects', html, [
      { text: 'Close', onclick: () => {} }
    ]);
  }

  // ============================================
  // STEP 7: Add helper method
  // ============================================

  _getActivityDifficulty(activityId) {
    // Determine if activity is easy/medium/hard
    // Easy: level 1-10 activities
    // Medium: level 15-60 activities
    // Hard: level 70+ activities
    
    const allActivities = ACTIVITIES[Object.keys(ACTIVITIES)[0]]; // Get any skill's activities
    const activity = allActivities.find(a => a.id === activityId);
    
    if (!activity) return 'medium';
    if (activity.level <= 10) return 'easy';
    if (activity.level >= 70) return 'hard';
    return 'medium';
  }
}

// ============================================
// STEP 8: Update index.html with new containers
// ============================================

/*
Add these to index.html main content area:

<!-- Gaming UI Containers -->
<div id="combat-ui"></div>
<div id="health-container"></div>
<div id="status-effects"></div>
<div id="virus-warning"></div>
<div id="notifications"></div>
<div id="damage-popups"></div>
<div id="progress-tasks"></div>
<div id="abilities-cooldown"></div>
<div id="passive-stats-panel"></div>

<!-- CSS for Gaming UI -->
<link rel="stylesheet" href="css/gaming-ui.css">
*/

// ============================================
// STEP 9: CSS for Screen Corruption
// ============================================

/*
Add to css/main.css or gaming-ui.css:

#virus-tint-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
  mix-blend-mode: multiply;
  transition: background-color 0.2s;
}

#virus-scanlines {
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
}

@keyframes virus-scanline-flicker {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
*/

export { Game };
