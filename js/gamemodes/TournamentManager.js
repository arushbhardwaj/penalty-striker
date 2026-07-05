import { TournamentEngine } from './TournamentEngine.js';
import { TOURNAMENT_DEFS } from '../data/tournaments.js';

export class TournamentManager {
  constructor() {
    this.engine = new TournamentEngine();
    this.currentDifficulty = 'normal';
  }

  startNewTournament(tournamentId, playerTeamId) {
    const def = TOURNAMENT_DEFS.find(t => t.id === tournamentId);
    if (!def) return false;
    this.engine.init(def, playerTeamId);
    this.currentDifficulty = 'normal';
    return true;
  }

  getNextMatch() {
    return this.engine.currentMatch;
  }

  getOpponentPenaltyScore() {
    const opponentId = this.engine.getOpponentTeamId();
    if (!opponentId) return 3;
    return this.engine.simulateOpponentPenaltyScore(opponentId, this.currentDifficulty);
  }

  recordPlayerMatchResult(playerGoals, opponentGoals) {
    this.engine.recordPlayerMatchResult(playerGoals, opponentGoals, this.currentDifficulty);
  }

  isEliminated() {
    return this.engine.isEliminated;
  }

  isChampion() {
    return this.engine.isComplete;
  }

  getMatchIntroData() {
    return {
      tournamentName: this.engine.getTournamentName(),
      tournamentLogo: this.engine.getTournamentLogo(),
      stageName: this.engine.getCurrentStageName(),
      matchLabel: this.engine.getMatchLabel(),
      playerTeamId: this.engine.getPlayerTeamId(),
      playerTeamName: this.engine.getPlayerTeamName(),
      playerTeamFlag: this.engine.getPlayerTeamFlag(),
      opponentTeamId: this.engine.getOpponentTeamId(),
      opponentTeamName: this.engine.getOpponentTeamName(),
      opponentTeamFlag: this.engine.getOpponentTeamFlag(),
    };
  }

  getHubData() {
    return {
      tournamentName: this.engine.getTournamentName(),
      tournamentLogo: this.engine.getTournamentLogo(),
      tournamentTrophy: this.engine.getTournamentTrophy(),
      tournamentColor: this.engine.getTournamentColor(),
      stageName: this.engine.getCurrentStageName(),
      matchLabel: this.engine.getMatchLabel(),
      playerTeamId: this.engine.getPlayerTeamId(),
      playerTeamName: this.engine.getPlayerTeamName(),
      playerTeamFlag: this.engine.getPlayerTeamFlag(),
      opponentTeamId: this.engine.getOpponentTeamId(),
      opponentTeamName: this.engine.getOpponentTeamName(),
      opponentTeamFlag: this.engine.getOpponentTeamFlag(),
      format: this.engine.def?.format,
      groupStandings: this.engine.getAllGroupStandings(),
      playerGroupName: this.engine.getPlayerGroupName(),
      knockoutBracket: this.engine.getKnockoutBracket(),
      leagueTable: this.engine.getSortedLeagueTable(),
      matchHistory: this.engine.matchHistory,
      leagueProgress: this.engine.getLeagueProgress(),
      isEliminated: this.engine.isEliminated,
      isComplete: this.engine.isComplete,
    };
  }

  getGameplayData() {
    const opponentScore = this.getOpponentPenaltyScore();
    return {
      mode: 'tournament',
      difficulty: this.currentDifficulty,
      maxAttempts: 5,
      opponentScore,
      matchIntroData: this.getMatchIntroData(),
    };
  }

  abandonTournament() {
    this.engine = new TournamentEngine();
    this.currentDifficulty = 'normal';
  }

  getTournamentDefs() {
    return TOURNAMENT_DEFS;
  }

  getCurrentTournamentDef() {
    return this.engine.def;
  }
}
