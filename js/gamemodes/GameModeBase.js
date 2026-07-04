export class GameModeBase {
  constructor(config = {}) {
    this.name = config.name || 'BaseMode';
    this.displayName = config.displayName || 'Base Mode';
    this.maxAttempts = config.maxAttempts || 5;
    this.difficulty = config.difficulty || 'normal';
    this.modeType = 'base';
    this.stats = {
      score: 0,
      attempts: 0,
      streak: 0,
      bestStreak: 0,
      totalShotPower: 0,
      goals: 0,
      misses: 0,
    };
    this.isActive = false;
    this.onShotCallback = null;
    this.onMatchEndCallback = null;
  }

  start() {
    this.resetStats();
    this.isActive = true;
  }

  resetStats() {
    this.stats = {
      score: 0,
      attempts: 0,
      streak: 0,
      bestStreak: 0,
      totalShotPower: 0,
      goals: 0,
      misses: 0,
    };
  }

  processShot(isGoal, shotPower = 0) {
    if (!this.isActive) return;
    this.stats.attempts++;
    this.stats.totalShotPower += shotPower;
    if (isGoal) {
      this.stats.score++;
      this.stats.streak++;
      this.stats.goals++;
      if (this.stats.streak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.streak;
      }
    } else {
      this.stats.streak = 0;
      this.stats.misses++;
    }
    if (this.onShotCallback) {
      this.onShotCallback(this.stats, isGoal);
    }
  }

  isMatchEnd() {
    return this.maxAttempts !== null && this.stats.attempts >= this.maxAttempts;
  }

  endMatch() {
    this.isActive = false;
    if (this.onMatchEndCallback) {
      this.onMatchEndCallback(this.stats);
    }
  }

  onShot(fn) {
    this.onShotCallback = fn;
  }

  onMatchEnd(fn) {
    this.onMatchEndCallback = fn;
  }

  getAccuracy() {
    if (this.stats.attempts === 0) return 0;
    return (this.stats.goals / this.stats.attempts) * 100;
  }

  getAveragePower() {
    if (this.stats.attempts === 0) return 0;
    return this.stats.totalShotPower / this.stats.attempts;
  }

  getMultiplier() {
    return Math.min(5, 1 + Math.floor(this.stats.streak / 2));
  }

  toJSON() {
    return { ...this.stats, modeType: this.modeType, difficulty: this.difficulty };
  }
}
