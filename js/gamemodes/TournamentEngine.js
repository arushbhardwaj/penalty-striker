import { TEAMS } from '../data/teams.js';
import { TOURNAMENT_DEFS } from '../data/tournaments.js';

const TEAM_MAP = {};
TEAMS.forEach(t => { TEAM_MAP[t.id] = t; });

function getTeam(id) { return TEAM_MAP[id]; }
function getTeamRating(id) { const t = TEAM_MAP[id]; return t ? t.rating : 70; }

export class TournamentEngine {
  constructor() {
    this.def = null;
    this.playerTeamId = null;
    this.stage = null;
    this.groups = [];
    this.knockoutRounds = [];
    this.leagueTable = [];
    this.leagueFixtures = [];
    this.leagueMatchIndex = 0;
    this.currentMatch = null;
    this.matchHistory = [];
    this.isComplete = false;
    this.isEliminated = false;
    this.groupFinished = false;
    this.knockoutRoundIndex = 0;
  }

  init(tournamentDef, playerTeamId) {
    this.def = tournamentDef;
    this.playerTeamId = playerTeamId;
    this.stage = 'group';
    this.groups = [];
    this.knockoutRounds = [];
    this.leagueTable = [];
    this.leagueFixtures = [];
    this.leagueMatchIndex = 0;
    this.currentMatch = null;
    this.matchHistory = [];
    this.isComplete = false;
    this.isEliminated = false;
    this.groupFinished = false;
    this.knockoutRoundIndex = 0;

    if (this.def.format === 'group+knockout') {
      this._generateGroups();
      this._generateGroupFixtures();
    } else if (this.def.format === 'league') {
      this._initLeague();
    }

    this._advanceToNextMatch();
  }

  _generateGroups() {
    const teams = [...this.def.teams];
    const ratings = teams.map(id => ({ id, rating: getTeamRating(id) }));
    ratings.sort((a, b) => b.rating - a.rating);

    const numGroups = this.def.groupCount;
    const groups = [];
    for (let i = 0; i < numGroups; i++) {
      groups.push({ name: String.fromCharCode(65 + i), teams: [] });
    }

    const perGroup = teams.length / numGroups;
    for (let round = 0; round < perGroup; round++) {
      for (let g = 0; g < numGroups; g++) {
        const idx = round % 2 === 0
          ? round * numGroups + g
          : (round + 1) * numGroups - 1 - g;
        if (idx < ratings.length) {
          groups[g].teams.push(ratings[idx].id);
        }
      }
    }

    this.groups = groups.map(g => ({
      name: g.name,
      teams: g.teams.map(id => ({
        id, played: 0, won: 0, drawn: 0, lost: 0,
        gf: 0, ga: 0, gd: 0, pts: 0,
      })),
      fixtures: [],
    }));
  }

  _generateGroupFixtures() {
    this.groups.forEach(group => {
      const ids = group.teams.map(t => t.id);
      const fixtures = [];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const isPlayerMatch = ids[i] === this.playerTeamId || ids[j] === this.playerTeamId;
          if (isPlayerMatch) {
            const opponentId = ids[i] === this.playerTeamId ? ids[j] : ids[i];
            fixtures.push({
              team1: ids[i], team2: ids[j],
              score1: null, score2: null,
              isPlayerMatch: true,
              playerTeamId: this.playerTeamId,
              opponentTeamId: opponentId,
              played: false,
            });
          } else {
            const sim = this._simulateMatch(ids[i], ids[j]);
            this._recordGroupMatch(group, ids[i], ids[j], sim.score1, sim.score2);
            this.matchHistory.push({
              stage: 'group', groupName: group.name,
              team1: ids[i], team2: ids[j],
              score1: sim.score1, score2: sim.score2, simulated: true,
            });
          }
        }
      }
      group.fixtures = fixtures;
    });
    this.groupFinished = this.groups.every(g => g.fixtures.length === 0);
  }

  _recordGroupMatch(group, t1Id, t2Id, s1, s2) {
    const t1 = group.teams.find(t => t.id === t1Id);
    const t2 = group.teams.find(t => t.id === t2Id);
    if (!t1 || !t2) return;
    t1.played++; t2.played++;
    t1.gf += s1; t1.ga += s2;
    t2.gf += s2; t2.ga += s1;
    t1.gd = t1.gf - t1.ga;
    t2.gd = t2.gf - t2.ga;
    if (s1 > s2) { t1.won++; t1.pts += 3; t2.lost++; }
    else if (s2 > s1) { t2.won++; t2.pts += 3; t1.lost++; }
    else { t1.drawn++; t1.pts++; t2.drawn++; t2.pts++; }
  }

  _initLeague() {
    const ids = this.def.teams;
    this.leagueTable = ids.map(id => ({
      id, played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, pts: 0,
    }));

    this.leagueFixtures = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const isPlayerMatch = ids[i] === this.playerTeamId || ids[j] === this.playerTeamId;
        if (isPlayerMatch) {
          const opponentId = ids[i] === this.playerTeamId ? ids[j] : ids[i];
          this.leagueFixtures.push({
            team1: ids[i], team2: ids[j],
            score1: null, score2: null,
            isPlayerMatch: true,
            playerTeamId: this.playerTeamId,
            opponentTeamId: opponentId,
            played: false,
          });
        } else {
          const sim = this._simulateMatch(ids[i], ids[j]);
          this._recordLeagueMatch(ids[i], ids[j], sim.score1, sim.score2);
          this.matchHistory.push({
            stage: 'league',
            team1: ids[i], team2: ids[j],
            score1: sim.score1, score2: sim.score2, simulated: true,
          });
        }
      }
    }
    this._sortLeagueTable();
    this.leagueMatchIndex = 0;
  }

  _recordLeagueMatch(t1Id, t2Id, s1, s2) {
    const t1 = this.leagueTable.find(t => t.id === t1Id);
    const t2 = this.leagueTable.find(t => t.id === t2Id);
    if (!t1 || !t2) return;
    t1.played++; t2.played++;
    t1.gf += s1; t1.ga += s2;
    t2.gf += s2; t2.ga += s1;
    t1.gd = t1.gf - t1.ga;
    t2.gd = t2.gf - t2.ga;
    if (s1 > s2) { t1.won++; t1.pts += 3; t2.lost++; }
    else if (s2 > s1) { t2.won++; t2.pts += 3; t1.lost++; }
    else { t1.drawn++; t1.pts++; t2.drawn++; t2.pts++; }
  }

  _sortLeagueTable() {
    this.leagueTable.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return 0;
    });
  }

  _getGroupAdvancers() {
    const advancing = [];
    this.groups.forEach(g => {
      const sorted = [...g.teams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return 0;
      });
      const count = this.def.teamsAdvancing;
      for (let i = 0; i < count && i < sorted.length; i++) {
        advancing.push({ id: sorted[i].id, groupName: g.name, pos: i + 1 });
      }
    });
    return advancing;
  }

  _generateFirstKnockoutRound() {
    const advancers = this._getGroupAdvancers();
    if (advancers.length < 2) return [];

    const matches = [];
    const half = advancers.length / 2;
    for (let i = 0; i < half; i++) {
      const teamA = advancers[i];
      const teamB = advancers[advancers.length - 1 - i];
      const isPlayerMatch = teamA.id === this.playerTeamId || teamB.id === this.playerTeamId;
      if (isPlayerMatch) {
        const opponentId = teamA.id === this.playerTeamId ? teamB.id : teamA.id;
        matches.push({
          team1: teamA.id, team2: teamB.id,
          score1: null, score2: null,
          isPlayerMatch: true, playerTeamId: this.playerTeamId,
          opponentTeamId: opponentId, played: false,
        });
      } else {
        const sim = this._simulateMatch(teamA.id, teamB.id);
        matches.push({
          team1: teamA.id, team2: teamB.id,
          score1: sim.score1, score2: sim.score2,
          isPlayerMatch: false, played: true,
          winner: sim.score1 > sim.score2 ? teamA.id : teamB.id,
        });
        this.matchHistory.push({
          stage: this.def.knockoutRounds[0],
          team1: teamA.id, team2: teamB.id,
          score1: sim.score1, score2: sim.score2, simulated: true,
        });
      }
    }
    return matches;
  }

  _generateNextKnockoutRound() {
    const prevRound = this.knockoutRounds[this.knockoutRounds.length - 1];
    if (!prevRound) return [];

    const winners = prevRound.matches.map(m => m.winner);
    const nextRoundIdx = this.knockoutRounds.length;
    const nextRoundName = this.def.knockoutRounds[nextRoundIdx];
    if (!nextRoundName) return [];

    const matches = [];
    for (let i = 0; i < winners.length; i += 2) {
      const t1 = winners[i];
      const t2 = winners[i + 1];
      if (!t1 || !t2) continue;

      const isPlayerMatch = t1 === this.playerTeamId || t2 === this.playerTeamId;
      if (isPlayerMatch) {
        const opponentId = t1 === this.playerTeamId ? t2 : t1;
        matches.push({
          team1: t1, team2: t2,
          score1: null, score2: null,
          isPlayerMatch: true, playerTeamId: this.playerTeamId,
          opponentTeamId: opponentId, played: false,
        });
      } else {
        const sim = this._simulateMatch(t1, t2);
        matches.push({
          team1: t1, team2: t2,
          score1: sim.score1, score2: sim.score2,
          isPlayerMatch: false, played: true,
          winner: sim.score1 > sim.score2 ? t1 : t2,
        });
        this.matchHistory.push({
          stage: nextRoundName, team1: t1, team2: t2,
          score1: sim.score1, score2: sim.score2, simulated: true,
        });
      }
    }
    return matches;
  }

  _simulateMatch(team1Id, team2Id) {
    const r1 = getTeamRating(team1Id);
    const r2 = getTeamRating(team2Id);
    const diff = r1 - r2;
    const expectedG1 = Math.max(0.3, 1.2 + diff * 0.03);
    const expectedG2 = Math.max(0.3, 1.2 - diff * 0.03);
    const g1 = this._randomGoals(expectedG1);
    const g2 = this._randomGoals(expectedG2);
    return { score1: Math.min(g1, 5), score2: Math.min(g2, 5) };
  }

  _randomGoals(lambda) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return Math.max(0, k - 1);
  }

  simulateOpponentPenaltyScore(opponentTeamId, difficulty) {
    const rating = getTeamRating(opponentTeamId);
    const base = 3;
    const ratingBonus = (rating - 70) * 0.025;
    const diffFactor = difficulty === 'easy' ? -0.3 : difficulty === 'normal' ? 0 : difficulty === 'hard' ? 0.3 : 0.6;
    const expected = base + ratingBonus + diffFactor;
    const score = Math.round(expected + (Math.random() - 0.5) * 1.5);
    return Math.max(0, Math.min(5, score));
  }

  _advanceToNextMatch() {
    this.currentMatch = null;

    if (this.def.format === 'group+knockout') {
      if (!this.groupFinished) {
        for (const group of this.groups) {
          for (const fixture of group.fixtures) {
            if (!fixture.played) {
              this.currentMatch = {
                type: 'group',
                groupName: group.name,
                fixture,
                opponentTeamId: fixture.opponentTeamId,
                matchLabel: `Group ${group.name} Match`,
              };
              return;
            }
          }
        }
        this.groupFinished = true;
      }

      if (this.groupFinished && this.knockoutRounds.length === 0) {
        this.stage = 'knockout';
        const matches = this._generateFirstKnockoutRound();
        if (matches.length > 0) {
          this.knockoutRounds.push({ name: this.def.knockoutRounds[0], matches });
          this.knockoutRoundIndex = 0;
        }
      }

      if (this.knockoutRounds.length > 0) {
        const round = this.knockoutRounds[this.knockoutRoundIndex];
        if (round) {
          for (const match of round.matches) {
            if (!match.played && match.isPlayerMatch) {
              this.currentMatch = {
                type: 'knockout',
                roundName: round.name,
                match,
                opponentTeamId: match.opponentTeamId,
                matchLabel: round.name,
              };
              return;
            }
          }
        }
      }

      if (!this.currentMatch) {
        this.isComplete = true;
      }

    } else if (this.def.format === 'league') {
      while (this.leagueMatchIndex < this.leagueFixtures.length) {
        const f = this.leagueFixtures[this.leagueMatchIndex];
        if (!f.played && f.isPlayerMatch) {
          this.currentMatch = {
            type: 'league',
            fixture: f,
            opponentTeamId: f.opponentTeamId,
            matchLabel: `Matchday ${this.leagueMatchIndex + 1}`,
          };
          return;
        }
        this.leagueMatchIndex++;
      }
      this.isComplete = true;
    }
  }

  recordPlayerMatchResult(playerGoals, opponentGoals) {
    const record = {
      team1: this.playerTeamId,
      team2: this.currentMatch.opponentTeamId,
      score1: playerGoals,
      score2: opponentGoals,
      simulated: false,
    };

    if (this.def.format === 'group+knockout') {
      if (this.currentMatch.type === 'group') {
        const group = this.groups.find(g => g.name === this.currentMatch.groupName);
        if (group) {
          const f = this.currentMatch.fixture;
          f.score1 = playerGoals;
          f.score2 = opponentGoals;
          f.played = true;
          this._recordGroupMatch(group, f.team1, f.team2, playerGoals, opponentGoals);
        }
        record.stage = 'group';
        record.stageDetail = `Group ${this.currentMatch.groupName}`;
      } else {
        const round = this.knockoutRounds[this.knockoutRoundIndex];
        if (round) {
          const m = this.currentMatch.match;
          m.score1 = playerGoals;
          m.score2 = opponentGoals;
          m.played = true;
          m.winner = playerGoals > opponentGoals ? this.playerTeamId : this.currentMatch.opponentTeamId;
        }
        record.stage = round?.name || 'knockout';
        record.stageDetail = round?.name || 'Knockout';

        if (playerGoals <= opponentGoals) {
          this.isEliminated = true;
          this.matchHistory.push(record);
          return;
        }

        const currentRound = this.knockoutRounds[this.knockoutRoundIndex];
        const allPlayed = currentRound.matches.every(m => m.played);
        if (allPlayed) {
          const isFinal = this.knockoutRoundIndex >= this.def.knockoutRounds.length - 1;
          if (isFinal) {
            this.isComplete = true;
            this.matchHistory.push(record);
            return;
          } else {
            this.knockoutRoundIndex++;
            const nextMatches = this._generateNextKnockoutRound();
            if (nextMatches.length > 0) {
              this.knockoutRounds.push({ name: this.def.knockoutRounds[this.knockoutRoundIndex], matches: nextMatches });
            }
          }
        }
        this.matchHistory.push(record);
        this._advanceToNextMatch();
        return;
      }
    } else if (this.def.format === 'league') {
      const f = this.currentMatch.fixture;
      f.score1 = playerGoals;
      f.score2 = opponentGoals;
      f.played = true;
      this._recordLeagueMatch(f.team1, f.team2, playerGoals, opponentGoals);
      this._sortLeagueTable();
      this.leagueMatchIndex++;
      record.stage = 'league';
      record.stageDetail = `Matchday ${this.leagueMatchIndex}`;
    }

    this.matchHistory.push(record);
    this._advanceToNextMatch();
  }

  getGroupStandings(groupName) {
    const group = this.groups.find(g => g.name === groupName);
    if (!group) return [];
    return [...group.teams].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return 0;
    });
  }

  getAllGroupStandings() {
    return this.groups.map(g => ({ name: g.name, standings: this.getGroupStandings(g.name) }));
  }

  getCurrentGroupName() {
    return this.currentMatch?.type === 'group' ? this.currentMatch.groupName : null;
  }

  getSortedLeagueTable() {
    return [...this.leagueTable].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return 0;
    });
  }

  getKnockoutBracket() { return this.knockoutRounds; }

  getPlayerTeamName() { const t = getTeam(this.playerTeamId); return t ? t.name : 'Unknown'; }
  getPlayerTeamFlag() { const t = getTeam(this.playerTeamId); return t ? t.flag : ''; }
  getPlayerTeamFlagCode() { const t = getTeam(this.playerTeamId); return t ? t.flagCode : ''; }
  getPlayerTeamId() { return this.playerTeamId; }
  getTeamName(id) { const t = getTeam(id); return t ? t.name : id; }
  getTeamFlag(id) { const t = getTeam(id); return t ? t.flag : ''; }
  getTeamFlagCode(id) { const t = getTeam(id); return t ? t.flagCode : ''; }
  getOpponentTeamId() { return this.currentMatch?.opponentTeamId || null; }
  getOpponentTeamName() { return this.getTeamName(this.getOpponentTeamId()); }
  getOpponentTeamFlag() { return this.getTeamFlag(this.getOpponentTeamId()); }

  getCurrentStageName() {
    if (this.def?.format === 'league') return 'League';
    if (this.stage === 'group') return 'Group Stage';
    if (this.stage === 'knockout' && this.knockoutRounds.length > 0) {
      return this.knockoutRounds[this.knockoutRoundIndex]?.name || 'Knockout';
    }
    return '';
  }

  getMatchLabel() { return this.currentMatch?.matchLabel || ''; }
  getTournamentName() { return this.def?.name || ''; }
  getTournamentLogo() { return this.def?.logo || ''; }
  getTournamentTrophy() { return this.def?.trophy || '🏆'; }
  getTournamentColor() { return this.def?.color || '#8b5cf6'; }
  getTournamentColorGlow() { return this.def?.colorGlow || 'rgba(139,92,246,0.3)'; }

  getLeagueProgress() {
    if (this.def?.format !== 'league') return 0;
    const total = this.leagueFixtures.filter(f => f.isPlayerMatch).length;
    const done = this.leagueFixtures.filter(f => f.isPlayerMatch && f.played).length;
    return total > 0 ? done / total : 0;
  }

  getPlayerGroupName() {
    for (const g of this.groups) {
      if (g.teams.some(t => t.id === this.playerTeamId)) return g.name;
    }
    return null;
  }

  toJSON() {
    return {
      tournamentId: this.def?.id,
      playerTeamId: this.playerTeamId,
      stage: this.stage,
      groups: this.groups,
      knockoutRounds: this.knockoutRounds,
      knockoutRoundIndex: this.knockoutRoundIndex,
      leagueTable: this.leagueTable,
      leagueFixtures: this.leagueFixtures,
      leagueMatchIndex: this.leagueMatchIndex,
      matchHistory: this.matchHistory,
      isComplete: this.isComplete,
      isEliminated: this.isEliminated,
      groupFinished: this.groupFinished,
    };
  }

  fromJSON(data) {
    if (!data) return false;
    this.def = TOURNAMENT_DEFS.find(t => t.id === data.tournamentId);
    if (!this.def) return false;
    this.playerTeamId = data.playerTeamId;
    this.stage = data.stage;
    this.groups = data.groups || [];
    this.knockoutRounds = data.knockoutRounds || [];
    this.knockoutRoundIndex = data.knockoutRoundIndex || 0;
    this.leagueTable = data.leagueTable || [];
    this.leagueFixtures = data.leagueFixtures || [];
    this.leagueMatchIndex = data.leagueMatchIndex || 0;
    this.matchHistory = data.matchHistory || [];
    this.isComplete = data.isComplete || false;
    this.isEliminated = data.isEliminated || false;
    this.groupFinished = data.groupFinished || false;
    this._advanceToNextMatch();
    return true;
  }
}
