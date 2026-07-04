import { GameModeBase } from './GameModeBase.js';
import { SaveManager } from '../systems/save.js';

const STORAGE_KEY = 'penalty_quickplay_best';

export class QuickPlayMode extends GameModeBase {
  constructor(config = {}) {
    super(config);
    this.modeType = 'quickplay';
    this.name = 'QuickPlay';
    this.displayName = 'Quick Play';
    this.matchLength = config.matchLength || 5;
    this.difficulty = config.difficulty || 'normal';
    this.maxAttempts = this.matchLength === 0 ? null : this.matchLength;
    this.bestScore = SaveManager.load(STORAGE_KEY, { score: 0, accuracy: 0 });
  }

  processShot(isGoal, shotPower = 0) {
    super.processShot(isGoal, shotPower);
    if (this.isMatchEnd()) {
      this.endMatch();
    }
  }

  endMatch() {
    super.endMatch();
    const accuracy = this.getAccuracy();
    if (this.stats.score > this.bestScore.score) {
      this.bestScore = { score: this.stats.score, accuracy };
      SaveManager.save(STORAGE_KEY, this.bestScore);
    }
  }

  getCoinsEarned() {
    return this.stats.score * 10 + this.stats.bestStreak * 5;
  }
}
