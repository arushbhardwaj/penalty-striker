import { TournamentManager } from './TournamentManager.js';
import { QuickPlayMode } from './QuickPlayMode.js';
import { PracticeMode } from './PracticeMode.js';

export class GameModeManager {
  constructor() {
    this.tournament = new TournamentManager();
    this.quickPlay = null;
    this.practice = null;
    this.currentMode = null;
    this.modes = new Map();
  }

  registerMode(name, modeInstance) {
    this.modes.set(name, modeInstance);
  }

  startQuickPlay(config = {}) {
    this.quickPlay = new QuickPlayMode(config);
    this.currentMode = this.quickPlay;
    this.quickPlay.start();
    return this.quickPlay;
  }

  startPractice(config = {}) {
    this.practice = new PracticeMode(config);
    this.currentMode = this.practice;
    this.practice.start();
    return this.practice;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  getMode(name) {
    return this.modes.get(name);
  }

  getTournamentDifficulty() {
    if (!this.currentMode || this.currentMode.modeType !== 'tournament') return 'normal';
    return this.currentMode.difficulty;
  }

  getKeeperDifficultySettings(difficultyName) {
    const settings = {
      easy: { speed: 0.8, reaction: 1.2, patrolRange: 100 },
      normal: { speed: 1.0, reaction: 1.0, patrolRange: 140 },
      hard: { speed: 1.3, reaction: 0.8, patrolRange: 180 },
      expert: { speed: 1.5, reaction: 0.7, patrolRange: 200 },
      legendary: { speed: 1.8, reaction: 0.6, patrolRange: 220 },
      god: { speed: 2.2, reaction: 0.4, patrolRange: 250 },
    };
    return settings[difficultyName] || settings.normal;
  }
}
