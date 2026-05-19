/**
 * CLINIC SYSTEM - Phase 3 Implementation
 * 
 * Manages:
 * - Virus removal with timers
 * - Injury tracking from failed combat
 * - Neural degradation from stimulant abuse
 * - Clinic UI and cost calculations
 * - Medical procedures and recovery
 */

import { events, EVENTS } from '../engine/events.js';

export class ClinicManager {
  constructor() {
    this.patients = {}; // Map of player state { viruses, injuries, degradation }
    this.procedures = []; // Active procedures
    this.medicalHistory = []; // Log of all procedures
  }

  // ============================================
  // Clinic Procedures
  // ============================================

  /**
   * Start virus removal procedure
   * @param {Virus} virus - Virus to remove
   * @param {number} currentCurrency - Player's current E$ balance
   * @returns {Procedure|null} Procedure object or null if insufficient funds
   */
  startVirusRemovalProcedure(virus, currentCurrency) {
    const cost = virus.removalCost;
    
    if (currentCurrency < cost) {
      events.emit(EVENTS.UI_NOTIFICATION, {
        message: `Insufficient funds. Need ${cost - currentCurrency} more E$`,
        type: 'error',
        duration: 3000
      });
      return null;
    }

    // Create procedure with random duration (0-30 min based on severity)
    const durationMap = {
      'low': [5, 10, 15], // min
      'medium': [10, 15, 20],
      'high': [15, 25, 30],
      'critical': [20, 30, 40]
    };

    const durationRange = durationMap[virus.severity] || [15, 25, 30];
    const durationMin = durationRange[Math.floor(Math.random() * durationRange.length)];
    const durationMs = durationMin * 60 * 1000;

    const procedure = new MedicalProcedure({
      type: 'virus_removal',
      virusId: virus.id,
      virusName: virus.name,
      severity: virus.severity,
      durationMs: durationMs,
      cost: cost,
      startTime: Date.now()
    });

    this.procedures.push(procedure);

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `🏥 Virus removal started. Cost: ${cost} E$. Duration: ${durationMin} min`,
      type: 'info',
      duration: 4000
    });

    return procedure;
  }

  /**
   * Start injury treatment procedure
   * @param {Injury} injury - Injury to treat
   * @param {number} currentCurrency - Player's current E$ balance
   * @returns {Procedure|null}
   */
  startInjuryTreatmentProcedure(injury, currentCurrency) {
    const cost = this._calculateInjuryCost(injury.severity);

    if (currentCurrency < cost) {
      events.emit(EVENTS.UI_NOTIFICATION, {
        message: `Insufficient funds for treatment. Need ${cost - currentCurrency} more E$`,
        type: 'error',
        duration: 3000
      });
      return null;
    }

    // Duration based on injury severity: 10-60 min
    const durationMap = {
      'minor': [5, 10, 15],
      'moderate': [15, 20, 30],
      'severe': [30, 45, 60]
    };

    const durationRange = durationMap[injury.severity] || [15, 30, 45];
    const durationMin = durationRange[Math.floor(Math.random() * durationRange.length)];
    const durationMs = durationMin * 60 * 1000;

    const procedure = new MedicalProcedure({
      type: 'injury_treatment',
      injuryId: injury.id,
      injuryName: injury.name,
      severity: injury.severity,
      durationMs: durationMs,
      cost: cost,
      startTime: Date.now()
    });

    this.procedures.push(procedure);

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `🏥 Injury treatment started. Cost: ${cost} E$. Duration: ${durationMin} min`,
      type: 'info',
      duration: 4000
    });

    return procedure;
  }

  /**
   * Start neural recovery procedure (from stim abuse)
   * @param {number} degradationLevel - Current degradation level (0-100)
   * @param {number} currentCurrency - Player's current E$ balance
   * @returns {Procedure|null}
   */
  startNeuralRecoveryProcedure(degradationLevel, currentCurrency) {
    const cost = Math.floor(500 + (degradationLevel * 50)); // 500-5500 E$

    if (currentCurrency < cost) {
      events.emit(EVENTS.UI_NOTIFICATION, {
        message: `Insufficient funds for recovery. Need ${cost - currentCurrency} more E$`,
        type: 'error',
        duration: 3000
      });
      return null;
    }

    // Duration scales with degradation: 10-120 min
    const durationMin = Math.floor(10 + (degradationLevel * 1.1));
    const durationMs = durationMin * 60 * 1000;

    const procedure = new MedicalProcedure({
      type: 'neural_recovery',
      degradationLevel: degradationLevel,
      durationMs: durationMs,
      cost: cost,
      startTime: Date.now()
    });

    this.procedures.push(procedure);

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `🏥 Neural recovery started. Cost: ${cost} E$. Duration: ${durationMin} min`,
      type: 'info',
      duration: 4000
    });

    return procedure;
  }

  /**
   * Emergency full clinic visit (all treatments)
   * @returns {{ cost: number, procedures: Array }}
   */
  createFullClinicPackage(viruses, injuries, degradationLevel, currentCurrency) {
    const virusCosts = viruses.reduce((sum, v) => sum + v.removalCost, 0);
    const injuryCosts = injuries.reduce((sum, i) => sum + this._calculateInjuryCost(i.severity), 0);
    const degradationCost = degradationLevel > 0 ? Math.floor(500 + (degradationLevel * 50)) : 0;

    const totalCost = virusCosts + injuryCosts + degradationCost;

    if (currentCurrency < totalCost) {
      return { cost: totalCost, affordable: false, shortfall: totalCost - currentCurrency };
    }

    return {
      cost: totalCost,
      affordable: true,
      breakdown: {
        virusCost: virusCosts,
        injuryCost: injuryCosts,
        degradationCost: degradationCost
      },
      estimatedDuration: '60-120 minutes'
    };
  }

  /**
   * Complete active procedure
   * @returns {object} Procedure results
   */
  completeProcedure(procedureId) {
    const procedure = this.procedures.find(p => p.id === procedureId);
    if (!procedure) return null;

    const result = {
      procedureId: procedure.id,
      type: procedure.type,
      success: true,
      resultMessage: '',
      recovered: null
    };

    switch (procedure.type) {
      case 'virus_removal':
        result.resultMessage = `✓ ${procedure.virusName} removed successfully!`;
        result.recovered = { virus: procedure.virusId };
        break;

      case 'injury_treatment':
        result.resultMessage = `✓ ${procedure.injuryName} treated successfully!`;
        result.recovered = { injury: procedure.injuryId };
        break;

      case 'neural_recovery':
        result.resultMessage = `✓ Neural pathways restored! Degradation: ${procedure.degradationLevel}% → 0%`;
        result.recovered = { degradation: true };
        break;
    }

    // Remove from active procedures
    this.procedures = this.procedures.filter(p => p.id !== procedureId);

    // Log in medical history
    this.medicalHistory.push({
      ...procedure,
      completedAt: Date.now(),
      success: true
    });

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: result.resultMessage,
      type: 'success',
      duration: 3000
    });

    return result;
  }

  /**
   * Cancel procedure (refund partial cost)
   * @returns {number} Refund amount (75% of cost)
   */
  cancelProcedure(procedureId) {
    const procedure = this.procedures.find(p => p.id === procedureId);
    if (!procedure) return 0;

    const refund = Math.floor(procedure.cost * 0.75);
    this.procedures = this.procedures.filter(p => p.id !== procedureId);

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `Procedure cancelled. Refund: ${refund} E$`,
      type: 'info',
      duration: 2000
    });

    return refund;
  }

  // ============================================
  // Injury Management
  // ============================================

  /**
   * Register injury from failed combat
   * Combat failure chance = max(0, 30% - (level * 0.5%) - (defense * 1%))
   * 
   * When failed:
   * - Minor injury (50%): -5 defense for 1 hour
   * - Moderate injury (35%): -10 defense for 2 hours + -20% combat XP
   * - Severe injury (15%): -20 defense for 4 hours + -50% combat XP
   */
  createInjuryFromCombatLoss(combatLevel, defense) {
    const failureChance = Math.max(0, 30 - (combatLevel * 0.5) - (defense * 1));
    const roll = Math.random() * 100;

    if (roll > failureChance) {
      return null; // No injury
    }

    const injuryRoll = Math.random();
    let severity, defenseReduction, xpReduction, duration;

    if (injuryRoll < 0.50) {
      severity = 'minor';
      defenseReduction = 5;
      xpReduction = 0;
      duration = 3600000; // 1 hour
    } else if (injuryRoll < 0.85) {
      severity = 'moderate';
      defenseReduction = 10;
      xpReduction = 0.20; // -20% XP
      duration = 7200000; // 2 hours
    } else {
      severity = 'severe';
      defenseReduction = 20;
      xpReduction = 0.50; // -50% XP
      duration = 14400000; // 4 hours
    }

    const injury = new Injury({
      severity: severity,
      name: `${severity.capitalize()} Injury`,
      defenseReduction: defenseReduction,
      xpReduction: xpReduction,
      skillAffected: 'combat',
      duration: duration,
      createdAt: Date.now()
    });

    events.emit(EVENTS.UI_NOTIFICATION, {
      message: `🤕 ${injury.name}! Defense -${defenseReduction}, treatment needed`,
      type: 'warning',
      duration: 4000
    });

    return injury;
  }

  _calculateInjuryCost(severity) {
    const costMap = {
      'minor': 300,
      'moderate': 800,
      'severe': 2000
    };
    return costMap[severity] || 500;
  }

  // ============================================
  // Neural Degradation (Stim Abuse)
  // ============================================

  /**
   * Increase neural degradation from stim use
   * Each stim use: +5 degradation (1-100)
   * At 100: -50% XP from ALL activities (severe penalty!)
   */
  increaseNeuralDegradation(amount = 5) {
    this.neuralDegradation = Math.min(100, (this.neuralDegradation || 0) + amount);

    if (this.neuralDegradation >= 100) {
      events.emit(EVENTS.UI_NOTIFICATION, {
        message: '⚠️ CRITICAL: Neural pathways failing! XP halved, go to clinic ASAP!',
        type: 'error',
        duration: 5000
      });
    } else if (this.neuralDegradation >= 75) {
      events.emit(EVENTS.UI_NOTIFICATION, {
        message: `⚠️ Neural degradation: ${this.neuralDegradation}% - consider treatment`,
        type: 'warning',
        duration: 3000
      });
    }

    return this.neuralDegradation;
  }

  /**
   * Get XP multiplier from neural degradation
   * At 100 degradation: -50% XP
   */
  getNeuralDegradationXpMultiplier() {
    const degradation = this.neuralDegradation || 0;
    return 1.0 - (degradation * 0.005); // -0.5% per degradation point
  }

  /**
   * Get current degradation level
   */
  getNeuralDegradation() {
    return Math.max(0, this.neuralDegradation || 0);
  }

  /**
   * Reset degradation to 0 (via clinic)
   */
  resetNeuralDegradation() {
    this.neuralDegradation = 0;
  }

  // ============================================
  // Clinic Status & Info
  // ============================================

  /**
   * Get all active procedures
   */
  getActiveProcedures() {
    return this.procedures.filter(p => !p.isCompleted());
  }

  /**
   * Get total clinic cost needed for all conditions
   */
  getTotalClinicCost(viruses = [], injuries = [], degradationLevel = 0) {
    const virusTotal = viruses.reduce((sum, v) => sum + v.removalCost, 0);
    const injuryTotal = injuries.reduce((sum, i) => sum + this._calculateInjuryCost(i.severity), 0);
    const degradationCost = degradationLevel > 0 ? Math.floor(500 + (degradationLevel * 50)) : 0;

    return virusTotal + injuryTotal + degradationCost;
  }

  /**
   * Get clinic status overview
   */
  getClinicStatus(viruses = [], injuries = [], degradationLevel = 0) {
    const activeProcedures = this.getActiveProcedures();
    const totalCost = this.getTotalClinicCost(viruses, injuries, degradationLevel);

    return {
      activeProcedures: activeProcedures.length,
      viruses: viruses.length,
      injuries: injuries.length,
      degradation: degradationLevel,
      totalCost: totalCost,
      urgency: this._assessUrgency(viruses, injuries, degradationLevel)
    };
  }

  _assessUrgency(viruses, injuries, degradationLevel) {
    if (degradationLevel >= 100) return 'critical';
    if (viruses.some(v => v.severity === 'critical')) return 'high';
    if (viruses.length >= 3) return 'high';
    if (injuries.length >= 2) return 'medium';
    if (viruses.length > 0 || injuries.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Medical history analytics
   */
  getMedicalStats() {
    return {
      totalProcedures: this.medicalHistory.length,
      virusRemovalCount: this.medicalHistory.filter(p => p.type === 'virus_removal').length,
      injuryTreatmentCount: this.medicalHistory.filter(p => p.type === 'injury_treatment').length,
      neuralRecoveryCount: this.medicalHistory.filter(p => p.type === 'neural_recovery').length,
      totalSpentOnClinic: this.medicalHistory.reduce((sum, p) => sum + p.cost, 0)
    };
  }

  // ============================================
  // Serialization
  // ============================================

  serialize() {
    return {
      neuralDegradation: this.neuralDegradation || 0,
      procedures: this.procedures.map(p => p.serialize()),
      medicalHistory: this.medicalHistory
    };
  }

  deserialize(data) {
    if (!data) return;
    
    this.neuralDegradation = data.neuralDegradation || 0;
    this.procedures = (data.procedures || []).map(pData => MedicalProcedure.deserialize(pData));
    this.medicalHistory = data.medicalHistory || [];
  }
}

/**
 * Medical Procedure Instance
 */
class MedicalProcedure {
  constructor(config) {
    this.id = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = config.type; // virus_removal, injury_treatment, neural_recovery
    this.virusId = config.virusId || null;
    this.virusName = config.virusName || null;
    this.injuryId = config.injuryId || null;
    this.injuryName = config.injuryName || null;
    this.severity = config.severity || null;
    this.degradationLevel = config.degradationLevel || null;
    this.durationMs = config.durationMs;
    this.cost = config.cost;
    this.startTime = config.startTime;
  }

  getProgress() {
    const elapsed = Date.now() - this.startTime;
    return Math.min(100, (elapsed / this.durationMs) * 100);
  }

  getRemainingMs() {
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.durationMs - elapsed);
  }

  getRemainingFormatted() {
    const ms = this.getRemainingMs();
    const minutes = Math.ceil(ms / 60000);
    return `${minutes} min`;
  }

  isCompleted() {
    return this.getRemainingMs() <= 0;
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      virusId: this.virusId,
      virusName: this.virusName,
      injuryId: this.injuryId,
      injuryName: this.injuryName,
      severity: this.severity,
      degradationLevel: this.degradationLevel,
      durationMs: this.durationMs,
      cost: this.cost,
      startTime: this.startTime
    };
  }

  static deserialize(data) {
    return new MedicalProcedure(data);
  }
}

/**
 * Injury Instance
 */
class Injury {
  constructor(config) {
    this.id = `inj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.severity = config.severity; // minor, moderate, severe
    this.name = config.name;
    this.defenseReduction = config.defenseReduction;
    this.xpReduction = config.xpReduction;
    this.skillAffected = config.skillAffected; // combat, stealth, etc
    this.duration = config.duration;
    this.createdAt = config.createdAt;
  }

  getRemainingTime() {
    const elapsed = Date.now() - this.createdAt;
    return Math.max(0, this.duration - elapsed);
  }

  isHealed() {
    return this.getRemainingTime() === 0;
  }

  getXpPenalty() {
    if (this.isHealed()) return 1.0;
    return 1.0 - this.xpReduction;
  }

  serialize() {
    return {
      id: this.id,
      severity: this.severity,
      name: this.name,
      defenseReduction: this.defenseReduction,
      xpReduction: this.xpReduction,
      skillAffected: this.skillAffected,
      duration: this.duration,
      createdAt: this.createdAt
    };
  }

  static deserialize(data) {
    return new Injury(data);
  }
}

export { MedicalProcedure, Injury };
