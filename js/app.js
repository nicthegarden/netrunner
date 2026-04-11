import { initGame, getGame } from './main.js';
import { UI } from './ui/main.js';
import { ACTIVITIES, BACKGROUND_HACK_SKILLS } from './data/skillData.js';
// MULTIPLAYER DISABLED (Phase 2)
// import { NetrunnerClient } from './netrunnerClient.js';
// import { MultiplayerManager } from './multiplayer.js';

let ui;
let currentModal = null;

// Initialize multiplayer client (DISABLED - Phase 2)
// const gameClient = new NetrunnerClient({
//   apiUrl: 'http://localhost:3001',
//   socketUrl: 'ws://localhost:3001'
// });

// Make available globally
// window.gameClient = gameClient;

// ==========================================
// Modal Dialog System
// ==========================================
function showModal(title, content, buttons = []) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'current-modal';

  // Create modal dialog
  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';

  // Modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `<h2>${title}</h2>`;

  // Modal body
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.innerHTML = content;

  // Modal footer
  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.className = `btn-primary ${btn.className || ''}`;
    button.textContent = btn.text;
    button.onclick = () => {
      btn.onclick();
      closeModal();
    };
    footer.appendChild(button);
  });

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);

  document.body.appendChild(overlay);
  currentModal = overlay;

  // Close on escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Close on outside click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
}

function closeModal() {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }
}

// ==========================================
// Navigation Helpers
// ==========================================
function navigateToSkill(skillId) {
  if (!ui) return;
  const category = document.querySelector(`.nav-btn[data-skill="${skillId}"]`)?.dataset.category || 'hacking';
  ui.currentCategory = category;
  ui.currentSkill = skillId;
  ui.navigate('skills', category);
  
  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-btn[data-skill="${skillId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  closeSidebar();
}

function focusCurrentSkill(skillId) {
  if (!ui) return;
  ui.currentSkill = skillId;
  ui.navigate('skills', ui.currentCategory);
}

function navigateToView(view) {
  if (!ui) return;
  ui.navigate(view);
  
  // Clear nav active state for non-skill views
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  closeSidebar();
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// ==========================================
// Skill Action Helpers
// ==========================================
function showActivityPickerForSkill(skillId) {
  if (!ui) return;
  const game = getGame();
  const skill = game.skillManager.getSkill(skillId);
  if (!skill) return;

  const activities = ACTIVITIES[skillId];
  if (!activities || activities.length === 0) {
    ui.notify('No activities available for this skill yet.', 'error');
    return;
  }

  ui.showActivityPicker(skill, activities);
}

function startSkillActivity(skillId, actionId) {
  const game = getGame();
  const skill = game.skillManager.getSkill(skillId);
  if (!skill) return;

  const activities = ACTIVITIES[skillId];
  if (!activities) {
    ui.notify('No activities available.', 'error');
    return;
  }

  const action = activities.find(a => a.id === actionId);
  if (!action) {
    ui.notify('Activity not found.', 'error');
    return;
  }

  if (skill.level < action.level) {
    ui.notify(`Requires ${skill.name} level ${action.level}.`, 'error');
    return;
  }

  if (!action.enemy && !game.skillManager.canStartAdditionalPrimary(skillId)) {
    ui.notify('Concurrent grind cap reached. Stop another grind or use background hacking.', 'error');
    return;
  }

  // If this skill is currently running as a background hack, stop it first
  if (skill._isBackgroundHack) {
    game.skillManager.stopBackgroundHack();
    ui.updateBackgroundHackDisplay();
  }

  // Check if background hack is running and show warning
  const bgHackInfo = game.skillManager.getBackgroundHackInfo();
  if (bgHackInfo && !action.enemy) {
    // Show warning modal for non-combat activities when parallel hacking is active
    showParallelHackWarning(skillId, actionId, action, bgHackInfo);
    return;
  }

  // For combat-type activities, start combat
  if (action.enemy) {
    skill.stopAction();
    game.combat.startCombat(action.enemy, skill.level);
    skill.isActive = true;
    skill.activeAction = action;
    ui.updateSkillListings();
    ui.closePicker();
    return;
  }

  // For normal activities
  const started = skill.startAction(actionId);
  if (started) {
    const activeLoad = game.skillManager.getConcurrentSkillLoad();
    const loadEfficiency = Math.round(game.skillManager.getConcurrentEfficiency() * 100);
    ui.updateSkillListings();
    ui.closePicker();
    if (!action.enemy && activeLoad > 1) {
      ui.notify(`Parallel grind started. All running grinds now operate at ${loadEfficiency}% efficiency.`, 'warning');
    }
  } else {
    ui.notify('Failed to start activity.', 'error');
  }
}

function showParallelHackWarning(skillId, actionId, action, bgHackInfo) {
  const game = getGame();
  
  // Create warning modal
  const modal = document.createElement('div');
  modal.id = 'parallel-hack-warning-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 500px;">
      <div class="modal-header">
        <h2>⚠️ PARALLEL HACK ACTIVE</h2>
        <button class="modal-close" data-action="close-modal">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <p style="margin-bottom: 15px;">
          You have a <strong>${bgHackInfo.skillName}</strong> background hack running.
        </p>
        <div style="background: #0f0f1e; border-left: 3px solid #ff6600; padding: 12px; margin-bottom: 15px;">
          <strong style="color: #ff6600;">XP PENALTY:</strong> Primary activity XP will be reduced to <strong>75%</strong> while parallel hacking.
        </div>
        <p style="margin-bottom: 15px; font-size: 0.9em; color: #888;">
          <strong>Activity:</strong> ${action.name}<br>
          <strong>Current Multiplier:</strong> <span style="color: #ff6600;">75%</span> (25% reduction)
        </p>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" data-action="confirm-with-parallel-hack" data-skill-id="${skillId}" data-action-id="${actionId}" style="flex: 1;">
            Start Activity (75% XP)
          </button>
          <button class="btn" onclick="document.getElementById('parallel-hack-warning-modal').remove(); ui.closePicker();" style="flex: 1;">
            Cancel
          </button>
        </div>
        <p style="margin-top: 15px; font-size: 0.85em; color: #666;">
          💡 <strong>Tip:</strong> Stop the background hack first for full XP rewards.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function stopSkillActivity(skillId) {
  const game = getGame();
  const skill = game.skillManager.getSkill(skillId);
  if (!skill) return;

  // If this skill is running as background hack, stop that instead
  if (skill._isBackgroundHack) {
    game.skillManager.stopBackgroundHack();
    ui.updateBackgroundHackDisplay();
    ui.updateSkillListings();
    return;
  }

  if (skill.activeAction?.enemy) {
    game.combat.stopCombat();
  }

  skill.stopAction();
  ui.updateSkillListings();
}

// ==========================================
// Background Hacking
// ==========================================
function showBackgroundHackPicker() {
  if (!ui) return;
  const game = getGame();
  if (!game.skillManager.canBackgroundHack()) {
    ui.notify('Requires cyberware with parallel hacking capability.', 'error');
    return;
  }
  if (game.skillManager.backgroundHack) {
    ui.notify('Background hack already running. Stop it first.', 'error');
    return;
  }
  ui.showBackgroundHackPicker();
}

function startBackgroundHack(skillId, actionId) {
  const game = getGame();
  if (!game.skillManager.canBackgroundHack()) {
    ui.notify('Requires cyberware with parallel hacking capability.', 'error');
    return;
  }
  const success = game.skillManager.startBackgroundHack(skillId, actionId);
  if (success) {
    ui.notify(`Background hack started: ${game.skillManager.getSkill(skillId).activeAction.name} (75% efficiency)`, 'info');
    ui.closePicker();
    ui.updateBackgroundHackDisplay();
    ui.updateSkillListings();
  } else {
    ui.notify('Cannot start background hack. Check requirements.', 'error');
  }
}

function stopBackgroundHack() {
  const game = getGame();
  game.skillManager.stopBackgroundHack();
  ui.updateBackgroundHackDisplay();
  ui.updateSkillListings();
  ui.notify('Background hack stopped.', 'info');
}

// ==========================================
// Save / Export / Import / Reset
// ==========================================
function manualSave() {
  const game = getGame();
  if (game.saveGame()) {
    ui.notify('Game saved!', 'info');
  }
}

function exportSave() {
  const game = getGame();
  const b64 = game.exportSave();
  if (!b64) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(b64).then(() => {
      ui.notify('Save code copied to clipboard!', 'info');
    }).catch(() => {
      showModal('Export Save', `<textarea readonly style="width: 100%; height: 150px; font-family: monospace; font-size: 12px;">${b64}</textarea>`, [
        { text: 'Copy', onclick: () => navigator.clipboard.writeText(b64) }
      ]);
    });
  } else {
    showModal('Export Save', `<textarea readonly style="width: 100%; height: 150px; font-family: monospace; font-size: 12px;">${b64}</textarea>`, [
      { text: 'OK', onclick: () => {} }
    ]);
  }
}

function showImportSaveModal() {
  showModal('Import Save', '<textarea id="import-input" placeholder="Paste your save code here" style="width: 100%; height: 150px; font-family: monospace; font-size: 12px;"></textarea>', [
    { text: 'Import', onclick: () => {
      const b64 = document.getElementById('import-input')?.value;
      if (!b64) {
        ui.notify('No save code provided', 'error');
        return;
      }
      const game = getGame();
      if (game.importSave(b64)) {
        ui.notify('Save imported! Reloading...', 'info');
        setTimeout(() => location.reload(), 1000);
      } else {
        ui.notify('Invalid save code', 'error');
      }
    } },
    { text: 'Cancel', onclick: () => {} }
  ]);
}

function resetGameWithConfirm() {
  showModal('Reset Game', '<p style="color: #ff6b6b;">Are you sure? This will delete your save! This action cannot be undone.</p>', [
    { text: 'Reset', className: 'btn-danger', onclick: () => {
      const game = getGame();
      game.resetGame();
      ui.init();
      ui.notify('Game reset!', 'info');
    } },
    { text: 'Cancel', onclick: () => {} }
  ]);
}

// ==========================================
// Shop & Equipment
// ==========================================
function buyShopItemHandler(itemId, cost, quantity) {
  const game = getGame();
  if (!game.economy.removeCurrency(cost)) {
    ui.notify('Not enough Eurodollars!', 'error');
    return;
  }
  game.inventory.addItem(itemId, quantity || 1);
  ui.notify(`Purchased!`, 'info');
  ui.renderShopView();
}

function equipItemHandler(itemId) {
  const game = getGame();
  const itemDef = game.inventory._findItemDef(itemId);
  if (!itemDef) return;
  if (!game.inventory.hasItem(itemId, 1)) return;

  const prev = game.equipment.equip(itemDef);
  game.inventory.removeItem(itemId, 1);

  if (prev) {
    game.inventory.addItem(prev.id, 1);
  }

  ui.notify(`Equipped ${itemDef.name}!`, 'info');
  ui.renderInventoryView();
}

// ==========================================
// Sell & Unequip
// ==========================================
function sellItemHandler(itemId, quantity) {
  const game = getGame();
  if (!game) return;
  const success = game.inventory.sellItem(itemId, quantity, game.economy);
  if (success) {
    ui.notify(`Sold ${quantity}x ${itemId.replace(/_/g, ' ')}!`, 'info');
    ui.renderInventoryView();
    ui.updateCurrencyDisplay();
  } else {
    ui.notify('Cannot sell that item.', 'error');
  }
}

function unequipItemHandler(slot) {
  const game = getGame();
  if (!game) return;
  const prev = game.equipment.unequip(slot);
  if (prev) {
    game.inventory.addItem(prev.id, 1);
    ui.notify(`Unequipped ${prev.name}`, 'info');
    ui.renderInventoryView();
  }
}

// ==========================================
// Initialize Game
// ==========================================
window.addEventListener('load', () => {
  const game = initGame();
  ui = new UI();
  ui.init();
  
  // Wire game client to game instance (DISABLED - Phase 2)
  // game.gameClient = gameClient;
  window.gameInstance = game;
  
  // Initialize multiplayer manager (DISABLED - Phase 2)
  // const multiplayerManager = new MultiplayerManager(gameClient, game);
  // window.multiplayerManager = multiplayerManager;
});

// ==========================================
// Event Delegation - Main Click Handler
// ==========================================
document.addEventListener('click', (e) => {
  // Helper: use closest() so clicks on child elements (icons, spans) bubble up correctly
  const match = (selector) => e.target.closest(selector);

  // Skill navigation
  const skillNav = match('.nav-btn[data-skill]');
  if (skillNav) {
    navigateToSkill(skillNav.dataset.skill);
    return;
  }

  // View navigation
  const viewNav = match('.nav-btn[data-view]');
  if (viewNav) {
    navigateToView(viewNav.dataset.view);
    return;
  }

  // Manual save buttons
  if (match('#btn-manual-save') || match('#btn-header-save')) {
    manualSave();
    return;
  }

  // Export save
  if (match('#btn-export-save')) {
    exportSave();
    return;
  }

  // Import save
  if (match('#btn-import-save')) {
    showImportSaveModal();
    return;
  }

  // Reset game
  if (match('#btn-reset-game')) {
    resetGameWithConfirm();
    return;
  }

  // Mobile tab navigation
  const tabNav = match('.tab-btn[data-view]');
  if (tabNav) {
    navigateToView(tabNav.dataset.view);
    return;
  }

  // Skill activity picker (Activities button on skill card)
  const showAct = match('[data-action="show-activities"]');
  if (showAct) {
    showActivityPickerForSkill(showAct.dataset.skillId);
    return;
  }

  const focusSkill = match('[data-action="focus-skill"]');
  if (focusSkill) {
    focusCurrentSkill(focusSkill.dataset.skillId);
    return;
  }

  // Stop skill action (Stop button on skill card)
  const stopSkill = match('[data-action="stop-skill"]');
  if (stopSkill) {
    stopSkillActivity(stopSkill.dataset.skillId);
    return;
  }

  // Start skill action (Start button in activity picker)
  const startAct = match('[data-action="start-activity"]');
  if (startAct) {
    startSkillActivity(startAct.dataset.skillId, startAct.dataset.actionId);
    return;
  }

  // Confirm start activity with parallel hack penalty
  const confirmWithPenalty = match('[data-action="confirm-with-parallel-hack"]');
  if (confirmWithPenalty) {
    const skillId = confirmWithPenalty.dataset.skillId;
    const actionId = confirmWithPenalty.dataset.actionId;
    const modal = document.getElementById('parallel-hack-warning-modal');
    if (modal) modal.remove();
    
    const game = getGame();
    const skill = game.skillManager.getSkill(skillId);
    const activities = ACTIVITIES[skillId];
    const action = activities.find(a => a.id === actionId);
    
    // Start the activity with parallel hack penalty applied
    const started = skill.startAction(actionId);
    if (started) {
      ui.updateSkillListings();
      ui.closePicker();
    } else {
      ui.notify('Failed to start activity.', 'error');
    }
    return;
  }

  // Shop buy button
  const buyItem = match('[data-action="buy-item"]');
  if (buyItem) {
    const itemId = buyItem.dataset.itemId;
    const cost = parseInt(buyItem.dataset.cost);
    const quantity = parseInt(buyItem.dataset.quantity) || 1;
    buyShopItemHandler(itemId, cost, quantity);
    return;
  }

  // Inventory equip button
  const equipItem = match('[data-action="equip-item"]');
  if (equipItem) {
    equipItemHandler(equipItem.dataset.itemId);
    return;
  }

  // Sell item button
  const sellItem = match('[data-action="sell-item"]');
  if (sellItem) {
    sellItemHandler(sellItem.dataset.itemId, parseInt(sellItem.dataset.quantity) || 1);
    return;
  }

  // Unequip item button
  const unequipItem = match('[data-action="unequip-item"]');
  if (unequipItem) {
    unequipItemHandler(unequipItem.dataset.slot);
    return;
  }

  // Crafting recipe button
  const craftBtn = match('[data-action="craft"]');
  if (craftBtn) {
    const recipeId = craftBtn.dataset.recipeId;
    const game = getGame();
    if (game && game.crafter) {
      const success = game.crafter.craft(recipeId);
      if (success) {
        ui.renderCraftingView();
        ui.renderInventoryView();
        ui.updateCurrencyDisplay();
      }
    }
    return;
  }

  // Prestige button
  const prestigeBtn = match('[data-action="prestige"]');
  if (prestigeBtn) {
    const game = getGame();
    if (game && game.prestige) {
      const success = game.prestige.prestige(game.skillManager, game.achievements);
      if (success) {
        ui.renderPrestigeView();
        ui.updateSkillListings();
        ui.updateCurrencyDisplay();
      }
    }
    return;
  }

  // Prestige upgrade purchase button
  const prestigeUpgrade = match('[data-action="buy-prestige-upgrade"]');
  if (prestigeUpgrade) {
    const upgradeId = prestigeUpgrade.dataset.upgradeId;
    const game = getGame();
    if (game && game.prestige) {
      const success = game.prestige.buyUpgrade(upgradeId);
      if (success) {
        ui.renderPrestigeView();
      }
    }
    return;
  }

  // Select/deselect ability
  const selectAbility = match('[data-action="select-ability"]');
  if (selectAbility) {
    const skillId = selectAbility.dataset.skillId;
    const abilityId = selectAbility.dataset.abilityId;
    const game = getGame();
    if (game && game.abilityManager) {
      const success = game.abilityManager.selectAbility(skillId, abilityId);
      if (success) {
        ui.renderPassivesView();
      } else {
        ui.notify('Cannot select that ability.', 'error');
      }
    }
    return;
  }

  // Background hacking: open picker
  const bgHackPicker = match('[data-action="show-background-hack-picker"]');
  if (bgHackPicker) {
    showBackgroundHackPicker();
    return;
  }

  // Background hacking: start
  const startBgHack = match('[data-action="start-background-hack"]');
  if (startBgHack) {
    startBackgroundHack(startBgHack.dataset.skillId, startBgHack.dataset.actionId);
    return;
  }

  // Background hacking: stop
  const stopBgHack = match('[data-action="stop-background-hack"]');
  if (stopBgHack) {
    stopBackgroundHack();
    return;
  }

  // Accept contract
  const acceptContract = match('[data-action="accept-contract"]');
  if (acceptContract) {
    const contractId = acceptContract.getAttribute('data-contract-id');
    if (contractId && game.livingWorld) {
      game.livingWorld.acceptContract(contractId);
      ui.renderLivingWorldView();
    }
    return;
  }

  // Hack PvP target
  const hackTarget = match('[data-action="hack-target"]');
  if (hackTarget) {
    const targetId = hackTarget.getAttribute('data-target-id');
    const intrusion = game.skillManager.getSkill('intrusion');
    if (targetId && intrusion && game.livingWorld) {
      const result = game.livingWorld.attemptHack(targetId, intrusion.level, intrusion.level);
      if (result) {
        // Distribute loot if successful
        if (result.success && result.lootPool && result.lootPool.items) {
          Object.entries(result.lootPool.items).forEach(([itemId, spec]) => {
            const qty = spec.min + Math.floor(Math.random() * (spec.max - spec.min + 1));
            if (qty > 0) {
              game.inventory.addItem(itemId, qty);
            }
          });
        }
        // Refresh view to show updated targets
        ui.renderLivingWorldView();
      }
    }
    return;
  }

  // Close modal (used by parallel hack warning modal)
  const closeBtn = match('[data-action="close-modal"]');
  if (closeBtn) {
    const modal = closeBtn.closest('.modal-overlay');
    if (modal) modal.remove();
    return;
  }
});

// ==========================================
// Mobile Menu Toggle
// ==========================================
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', toggleSidebar);
}

// ==========================================
// Sidebar Click Handling
// ==========================================
const sidebar = document.getElementById('sidebar');
if (sidebar) {
  sidebar.addEventListener('click', (e) => {
    // Only close if clicking a nav button (not other elements)
    if (e.target.closest('.nav-btn')) {
      closeSidebar();
    }
  });
}

// ==========================================
// Close modal on Escape key
// ==========================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ==========================================
// Prevent accidentally closing — save on close
// ==========================================
window.addEventListener('beforeunload', () => {
  const game = getGame();
  if (game) game.saveGame();
});

// ==========================================
// Periodic UI updates
// ==========================================
setInterval(() => {
  if (ui) {
    ui.updateCurrencyDisplay();
    ui.updateProgressBars();
    ui.updateCombatView();
    ui.updateBackgroundHackDisplay();
    ui.updateHackerTerminal();
  }
}, 500);
