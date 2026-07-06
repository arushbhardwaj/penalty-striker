import { GameModeBase } from './GameModeBase.js';

export class PracticeMode extends GameModeBase {
  constructor(config = {}) {
    super({ ...config, maxAttempts: null });
    this.modeType = 'practice';
    this.name = 'Practice';
    this.displayName = 'Practice';
    this.difficulty = config.difficulty || 'normal';
    this.practiceMode = config.practiceMode || 'penalty';
    this.windEnabled = config.windEnabled || false;
    this.shotTrailEnabled = config.shotTrailEnabled || false;
    this.targetZonesEnabled = config.targetZonesEnabled || false;
    this.instantBallReset = config.instantBallReset || true;
    this.windX = 0;
    this.windY = 0;
  }

  start() {
    super.start();
    this.windX = (Math.random() - 0.5) * 200;
    this.windY = (Math.random() - 0.5) * 50;
  }

  processShot(isGoal, shotPower = 0) {
    this.stats.attempts++;
    this.stats.totalShotPower += shotPower;
    if (isGoal) {
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
    return false;
  }

  resetPractice() {
    this.resetStats();
  }

  toggleWind() {
    this.windEnabled = !this.windEnabled;
    if (this.windEnabled) {
      this.windX = (Math.random() - 0.5) * 200;
      this.windY = (Math.random() - 0.5) * 50;
    } else {
      this.windX = 0;
      this.windY = 0;
    }
  }

  toggleShotTrail() {
    this.shotTrailEnabled = !this.shotTrailEnabled;
  }

  toggleTargetZones() {
    this.targetZonesEnabled = !this.targetZonesEnabled;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
}
