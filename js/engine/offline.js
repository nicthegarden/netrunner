import { events, EVENTS } from './events.js';

export class OfflineProgress {
  constructor(game) {
    this.game = game;
    this.maxOfflineHours = 24;
  }

  calculate(saveTimestamp) {
    if (!saveTimestamp) return null;
    const elapsed = Math.min(Date.now() - saveTimestamp, this.maxOfflineHours * 3600000);
    if (elapsed < 60000) return null;
    
    // Apply prestige offline bonus (increases effective ticks)
    let offlineMultiplier = 1.0;
    if (this.game.prestige && this.game.prestige.bonuses.offlineBonus > 0) {
      offlineMultiplier = 1 + (this.game.prestige.bonuses.offlineBonus / 100);
    }
    
    const baseTicks = Math.floor(elapsed / 1000);
    const ticks = Math.floor(baseTicks * offlineMultiplier);
    return {
      elapsed, ticks,
      hours: Math.floor(elapsed / 3600000),
      minutes: Math.floor((elapsed % 3600000) / 60000),
    };
  }

  // Async chunked processing — prevents browser freeze for long offline periods
  apply(offlineData) {
    return new Promise((resolve) => {
      if (!offlineData || offlineData.ticks <= 0) {
        resolve(offlineData);
        return;
      }

      const batchSize = 200;
      let remaining = offlineData.ticks;
      let processed = 0;
      const total = offlineData.ticks;

      const processBatch = () => {
        const batch = Math.min(remaining, batchSize);
        this.game.gameLoop.processTicks(batch);
        remaining -= batch;
        processed += batch;

        // Emit progress for UI
        const percent = Math.floor((processed / total) * 100);
        events.emit(EVENTS.UI_NOTIFICATION, {
          message: `Processing offline progress... ${percent}%`,
          type: 'info',
          transient: true,
        });

        if (remaining > 0) {
          // Yield to browser with setTimeout(0) to keep UI responsive
          setTimeout(processBatch, 0);
        } else {
          resolve(offlineData);
        }
      };

      processBatch();
    });
  }
}
