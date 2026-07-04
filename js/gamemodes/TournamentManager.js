import { SaveManager } from '../systems/save.js';

const STORAGE_KEY = 'penalty_tournament';

export class TournamentManager {
  constructor() {
    this.currentTournament = null;
    this.currentRound = 0;
    this.matchResults = [];
    this.isActive = false;
    this.trophiesUnlocked = 0;
    this.completedTournaments = [];
    this.totalCoins = 0;
    this.totalXP = 0;
    this.load();
  }

  load() {
    const data = SaveManager.load(STORAGE_KEY, {});
    this.trophiesUnlocked = data.trophiesUnlocked || 0;
    this.completedTournaments = data.completedTournaments || [];
    this.totalCoins = data.totalCoins || 0;
    this.totalXP = data.totalXP || 0;
    if (data.currentTournament) {
      this.currentTournament = data.currentTournament;
      this.currentRound = data.currentRound || 0;
      this.matchResults = data.matchResults || [];
      this.isActive = data.isActive || false;
    }
  }

  save() {
    const data = {
      trophiesUnlocked: this.trophiesUnlocked,
      completedTournaments: this.completedTournaments,
      totalCoins: this.totalCoins,
      totalXP: this.totalXP,
    };
    if (this.isActive && this.currentTournament) {
      data.currentTournament = this.currentTournament;
      data.currentRound = this.currentRound;
      data.matchResults = this.matchResults;
      data.isActive = this.isActive;
    }
    SaveManager.save(STORAGE_KEY, data);
  }

  isUnlocked(tournament) {
    return this.trophiesUnlocked >= tournament.requiredTrophies;
  }

  startTournament(tournament) {
    this.currentTournament = { ...tournament };
    this.currentRound = 0;
    this.matchResults = [];
    this.isActive = true;
    this.save();
  }

  getCurrentRoundName() {
    if (!this.currentTournament) return '';
    return this.currentTournament.rounds[this.currentRound] || 'Final';
  }

  getGoalsRequired() {
    if (!this.currentTournament) return 0;
    return this.currentTournament.goalsToAdvance[this.currentRound] || 999;
  }

  getRoundDifficulty() {
    if (!this.currentTournament) return 'normal';
    const base = this.currentTournament.difficulty;
    const roundBonus = this.currentRound * 0.15;
    const difficulties = ['easy', 'normal', 'hard', 'expert', 'legendary'];
    const baseIdx = difficulties.indexOf(base);
    if (baseIdx === -1) return base;
    const adjustedIdx = Math.min(difficulties.length - 1, Math.floor(baseIdx + roundBonus));
    return difficulties[adjustedIdx];
  }

  recordMatchResult(stats) {
    const goalsRequired = this.getGoalsRequired();
    const won = stats.score >= goalsRequired;
    this.matchResults.push({
      round: this.currentRound,
      roundName: this.getCurrentRoundName(),
      score: stats.score,
      attempts: stats.attempts,
      goalsRequired,
      won,
      difficulty: this.getRoundDifficulty(),
    });
    if (won) {
      this.currentRound++;
      if (this.currentRound >= this.currentTournament.rounds.length) {
        this.completeTournament();
      }
    } else {
      this.isActive = false;
    }
    this.save();
  }

  completeTournament() {
    this.trophiesUnlocked++;
    this.completedTournaments.push(this.currentTournament.id);
    this.totalCoins += this.currentTournament.rewardCoins;
    this.totalXP += this.currentTournament.rewardXP;
    this.isActive = false;
    this.save();
  }

  getTournamentProgress() {
    if (!this.currentTournament) return 0;
    return (this.currentRound / this.currentTournament.rounds.length) * 100;
  }

  canContinue() {
    return this.isActive && this.currentTournament && this.currentRound < this.currentTournament.rounds.length;
  }

  abandonTournament() {
    this.isActive = false;
    this.currentTournament = null;
    this.currentRound = 0;
    this.matchResults = [];
    this.save();
  }

  addCoins(amount) {
    this.totalCoins += amount;
    this.save();
  }

  addXP(amount) {
    this.totalXP += amount;
    this.save();
  }

  isTournamentCompleted(tournamentId) {
    return this.completedTournaments.includes(tournamentId);
  }
}
