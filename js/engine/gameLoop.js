import { events, EVENTS } from './events.js';

export class GameLoop {
  constructor(game) {
    this.game = game;
    this.tickInterval = null;
    this.tickRate = 1000;
    this.running = false;
    this.tickCount = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.tickInterval = setInterval(() => this.tick(), this.tickRate);
  }

  stop() {
    this.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  tick() {
    try {
      this.tickCount++;
      this.game.skillManager.tick();
      this.game.combat.tick();
      events.emit(EVENTS.GAME_TICK, { tick: this.tickCount });
    } catch (e) {
      console.error('Game tick error:', e);
    }
  }

  processTicks(count) {
    for (let i = 0; i < count; i++) {
      try {
        this.tickCount++;
        this.game.skillManager.tick();
        this.game.combat.tick();
      } catch (e) {
        console.error('Offline tick error:', e);
      }
    }
  }
}
