import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { TEAMS } from '../data/teams.js';
import { TOURNAMENT_DEFS } from '../data/tournaments.js';
import { drawRoundRect, drawGlowingText, isPointerOverButton, renderBaseButton } from '../utils/helpers.js';

export class TournamentMenuScene extends Scene {
  constructor(game) {
    super(game);
    this.cards = [];
    this.entranceTimer = 0;
    this.entranceDuration = 0.7;
    this.overlay = document.getElementById('tournament-menu-overlay');
    this._backHandler = null;
  }

  enter() {
    this.entranceTimer = 0;
    this.buildCards();

    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      const backBtn = document.getElementById('tm-back-btn');
      if (backBtn && !this._backHandler) {
        this._backHandler = () => {
          this.game.soundManager.playSound('click');
          this.game.sceneManager.switchTo('MainMenu');
        };
        backBtn.addEventListener('click', this._backHandler);
      }
    }
  }

  exit() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
      const backBtn = document.getElementById('tm-back-btn');
      if (backBtn && this._backHandler) {
        backBtn.removeEventListener('click', this._backHandler);
        this._backHandler = null;
      }
    }
  }

  buildCards() {
    this.cards = TOURNAMENT_DEFS.map((t, i) => ({
      ...t,
      index: i,
      hovered: false,
      baseY: 240 + i * 125,
    }));
  }

  update(dt) {
    if (this.entranceTimer < this.entranceDuration) {
      this.entranceTimer = Math.min(this.entranceTimer + dt, this.entranceDuration);
    }
    const p = this.game.inputManager.pointer;

    this.cards.forEach(card => {
      card.hovered = isPointerOverButton(p, { x: 960, y: card.baseY, w: 780, h: 100 });
    });

    if (p.isTapped) {
      for (const card of this.cards) {
        if (card.hovered) {
          this.game.soundManager.playSound('click');
          this.game.sceneManager.switchTo('TournamentTeamSelect', { tournamentId: card.id });
          return;
        }
      }
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#0f1a2e';
    ctx.fillRect(0, 0, 1920, 1080);
    this.renderBg(ctx);
    this.renderTitle(ctx);
    this.renderCards(ctx);
    this.renderFooter(ctx);
  }

  renderBg(ctx) {
    const grad = ctx.createRadialGradient(960, 300, 50, 960, 300, 800);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.04)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 25; i++) {
      const x = i * 80;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 150, 1080);
      ctx.stroke();
    }
  }

  renderTitle(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    const ease = 1 - Math.pow(1 - progress, 3);
    ctx.save();
    ctx.globalAlpha = ease;
    drawGlowingText(ctx, '🏟 TOURNAMENTS', 960, 120,
      '900 56px Outfit, sans-serif', COLORS.white, 'rgba(139, 92, 246, 0.3)', 20);
    ctx.restore();
  }

  renderCards(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    this.cards.forEach((card, i) => {
      const delay = 0.1 + i * 0.07;
      const cardProgress = Math.max(0, Math.min(1, (progress - delay) / 0.3));
      const ease = 1 - Math.pow(1 - cardProgress, 3);
      if (ease <= 0) return;

      ctx.save();
      ctx.globalAlpha = ease;
      const y = card.baseY;
      const isHover = card.hovered;
      const scale = isHover ? 1.02 : 1;

      ctx.translate(960, y);
      ctx.scale(scale, scale);
      ctx.translate(-960, -y);

      ctx.fillStyle = isHover ? 'rgba(20, 30, 50, 0.95)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = isHover ? card.color : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = isHover ? 2.5 : 1.5;
      ctx.beginPath();
      drawRoundRect(ctx, 560, y - 50, 800, 100, 16);
      ctx.fill();
      ctx.stroke();

      if (isHover) {
        ctx.shadowColor = card.colorGlow;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        drawRoundRect(ctx, 560, y - 50, 800, 100, 16);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.font = '42px sans-serif';
      ctx.fillText(card.logo, 600, y);

      ctx.font = '800 26px Outfit, sans-serif';
      ctx.fillStyle = COLORS.white;
      ctx.fillText(card.name, 690, y - 8);

      ctx.font = '500 14px Space Grotesk, monospace';
      ctx.fillStyle = COLORS.slate;
      const formatLabel = card.format === 'league' ? 'League' : 'Group + Knockout';
      ctx.fillText(`${card.teams.length} teams  •  ${formatLabel}`, 690, y + 22);

      ctx.textAlign = 'right';
      ctx.font = '36px sans-serif';
      ctx.fillText(card.trophy, 1320, y);

      ctx.textAlign = 'center';
      ctx.font = '700 12px Space Grotesk, monospace';
      ctx.fillStyle = card.color;
      ctx.fillText(card.format === 'league' ? 'LEAGUE' : 'KNOCKOUT', 960, y + 42);

      ctx.restore();
    });
  }

  renderFooter(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    ctx.save();
    ctx.globalAlpha = progress * 0.6;
    ctx.font = '500 12px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.textAlign = 'center';
    ctx.fillText('SELECT A TOURNAMENT TO BEGIN', 960, 1050);
    ctx.restore();
  }
}

export class TournamentTeamSelectScene extends Scene {
  constructor(game) {
    super(game);
    this.overlay = document.getElementById('tournament-team-overlay');
    this.teamGrid = document.getElementById('tt-team-grid');
    this.selectedTeam = null;
    this.startButton = null;
    this.tournamentId = null;
  }

  enter(data) {
    this.tournamentId = data?.tournamentId || null;
    this.selectedTeam = null;
    this.renderTitleText();

    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      this.overlay.getBoundingClientRect();
      this.overlay.classList.add('active');
      this._createTeamCards();
      this._createStartButton();
      this._updateUI();
    }
  }

  exit() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.classList.add('hidden');
    }
    this._destroyTeamCards();
    this._destroyStartButton();
  }

  renderTitleText() {
    const def = TOURNAMENT_DEFS.find(t => t.id === this.tournamentId);
    const titleEl = document.getElementById('tt-title');
    const subtitleEl = document.getElementById('tt-subtitle');
    if (titleEl) titleEl.textContent = def ? `${def.logo} ${def.name}` : 'Tournament';
    if (subtitleEl) subtitleEl.textContent = 'Choose Your Team';
  }

  update(dt) {
    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.sceneManager.switchTo('TournamentMenu');
    }
  }

  render(ctx) {
    this._renderBackground(ctx);
  }

  _renderBackground(ctx) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    skyGrad.addColorStop(0, '#0a1628');
    skyGrad.addColorStop(0.25, '#0f1f3a');
    skyGrad.addColorStop(0.5, '#152a4a');
    skyGrad.addColorStop(0.75, '#1a3460');
    skyGrad.addColorStop(1, '#0d1f3a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    const glow = ctx.createRadialGradient(960, 0, 50, 960, 0, 700);
    glow.addColorStop(0, 'rgba(255, 255, 220, 0.06)');
    glow.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1920, 700);
  }

  _createTeamCards() {
    this.teamGrid.innerHTML = '';
    const def = TOURNAMENT_DEFS.find(t => t.id === this.tournamentId);
    const availableTeams = def ? TEAMS.filter(t => def.teams.includes(t.id)) : TEAMS;

    availableTeams.forEach(team => {
      const card = document.createElement('div');
      card.className = 'qp-team-card';
      card.dataset.teamId = team.id;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Select ${team.name}`);

      card.innerHTML = `
        <img class="qp-card-flag" src="assets/flags/${team.flagCode}.png" alt="${team.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
        <span class="qp-card-flag-fallback" style="display:none">${team.flag}</span>
        <span class="qp-card-name">${team.name}</span>
        <span class="qp-card-rating">${team.rating}</span>
      `;

      card.addEventListener('click', () => this._handleCardClick(team));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._handleCardClick(team);
        }
      });

      this.teamGrid.appendChild(card);
    });
  }

  _destroyTeamCards() {
    this.teamGrid.innerHTML = '';
  }

  _handleCardClick(team) {
    if (this.selectedTeam && this.selectedTeam.id === team.id) return;
    this.game.soundManager.playSound('click');

    if (this.selectedTeam) {
      const prevEl = this.teamGrid.querySelector(`[data-team-id="${this.selectedTeam.id}"]`);
      if (prevEl) prevEl.classList.remove('selected-player');
    }

    this.selectedTeam = team;
    const el = this.teamGrid.querySelector(`[data-team-id="${team.id}"]`);
    if (el) {
      el.classList.add('selected-player');
      el.classList.add('just-selected');
      setTimeout(() => el.classList.remove('just-selected'), 120);
    }
    this._updateUI();
  }

  _createStartButton() {
    const container = document.getElementById('tt-start-section');
    container.innerHTML = '';

    this._createBackButton(container);

    const startBtn = document.createElement('button');
    startBtn.className = 'game-btn game-btn--blue';
    startBtn.setAttribute('type', 'button');
    startBtn.setAttribute('aria-label', 'Start Tournament');
    startBtn.style.width = '100%';
    startBtn.style.maxWidth = '520px';
    startBtn.style.fontSize = 'clamp(1.1rem, 1.8vw, 1.6rem)';
    startBtn.style.minHeight = '64px';
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="btn-text">🏆 START TOURNAMENT</span>';

    this._startHandler = () => {
      if (!this.selectedTeam) return;
      this.game.soundManager.playSound('click');
      const tm = this.game.modeManager.tournament;
      tm.startNewTournament(this.tournamentId, this.selectedTeam.id);
      this.game.sceneManager.switchTo('TournamentMatchIntro');
    };
    startBtn.addEventListener('click', this._startHandler);
    container.appendChild(startBtn);
    this.startButton = startBtn;
  }

  _createBackButton(container) {
    const backBtn = document.createElement('button');
    backBtn.className = 'qp-back-door-btn';
    backBtn.setAttribute('type', 'button');
    backBtn.setAttribute('aria-label', 'Back to Tournament Selection');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'btn-icon';
    iconSpan.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    backBtn.appendChild(iconSpan);

    const textSpan = document.createElement('span');
    textSpan.className = 'btn-text';
    textSpan.textContent = 'BACK';
    backBtn.appendChild(textSpan);

    this._backBtnHandler = () => {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('TournamentMenu');
    };
    backBtn.addEventListener('click', this._backBtnHandler);
    container.prepend(backBtn);
    this._backBtn = backBtn;
  }

  _destroyStartButton() {
    if (this._backBtn) {
      this._backBtn.removeEventListener('click', this._backBtnHandler);
      if (this._backBtn.parentNode) this._backBtn.parentNode.removeChild(this._backBtn);
      this._backBtn = null;
    }
    if (this.startButton) {
      this.startButton.removeEventListener('click', this._startHandler);
      if (this.startButton.parentNode) this.startButton.parentNode.removeChild(this.startButton);
      this.startButton = null;
    }
  }

  _updateUI() {
    this._updateIndicator();
    if (this.startButton) {
      this.startButton.disabled = !this.selectedTeam;
    }
  }

  _updateIndicator() {
    const flag = document.getElementById('tt-selected-flag');
    const fallback = document.getElementById('tt-selected-flag-fallback');
    const name = document.getElementById('tt-selected-name');
    const rating = document.getElementById('tt-selected-rating');

    if (this.selectedTeam) {
      flag.src = `assets/flags/${this.selectedTeam.flagCode}.png`;
      flag.alt = this.selectedTeam.name;
      flag.style.display = 'inline';
      fallback.style.display = 'none';
      name.textContent = this.selectedTeam.name;
      rating.textContent = `(${this.selectedTeam.rating})`;
    } else {
      flag.src = '';
      flag.style.display = 'none';
      fallback.style.display = 'none';
      name.textContent = 'Select a team';
      rating.textContent = '';
    }
  }
}

export class TournamentMatchIntroScene extends Scene {
  constructor(game) {
    super(game);
    this.introData = null;
    this.startBtn = { x: 960, y: 820, w: 380, h: 70, label: '▶ START MATCH', hovered: false };
    this.entranceTimer = 0;
    this.vsPulse = 0;
  }

  enter(data) {
    this.introData = data || this.game.modeManager.tournament.getMatchIntroData();
    this.entranceTimer = 0;
    this.vsPulse = 0;
  }

  update(dt) {
    this.entranceTimer = Math.min(this.entranceTimer + dt, 1);
    this.vsPulse += dt * 2;
    const p = this.game.inputManager.pointer;
    this.startBtn.hovered = isPointerOverButton(p, this.startBtn);

    if (p.isTapped && this.startBtn.hovered) {
      this.game.soundManager.playSound('click');
      const tm = this.game.modeManager.tournament;
      this.game.sceneManager.switchTo('Gameplay', tm.getGameplayData());
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('TournamentMenu');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#0f1a2e';
    ctx.fillRect(0, 0, 1920, 1080);
    this.renderBg(ctx);

    const progress = Math.min(1, this.entranceTimer / 0.8);
    const ease = 1 - Math.pow(1 - progress, 3);

    ctx.save();
    ctx.globalAlpha = ease;

    this.renderTournamentInfo(ctx);
    this.renderTeams(ctx);
    this.renderMatchInfo(ctx);
    this.renderStartButton(ctx);

    ctx.restore();
  }

  renderBg(ctx) {
    const grad = ctx.createRadialGradient(960, 400, 50, 960, 400, 700);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);
  }

  renderTournamentInfo(ctx) {
    ctx.textAlign = 'center';
    ctx.font = '700 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.purple;
    ctx.fillText(`${this.introData.tournamentLogo} ${this.introData.tournamentName}`, 960, 100);

    ctx.font = '500 14px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(this.introData.stageName, 960, 130);
  }

  renderTeams(ctx) {
    const centerX = 960;
    const leftX = 400;
    const rightX = 1520;
    const teamY = 420;

    const opacity = Math.min(1, this.entranceTimer / 0.5);

    ctx.save();
    ctx.globalAlpha = opacity;

    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = COLORS.white;
    ctx.fillText(this.introData.playerTeamName, leftX, teamY + 50);

    const leftSlide = Math.min(1, this.entranceTimer / 0.4);
    const leftXoff = 200 * (1 - leftSlide);
    ctx.font = '120px sans-serif';
    ctx.fillText(this.introData.playerTeamFlag || '⚽', leftX - leftXoff, teamY - 60);

    ctx.fillStyle = COLORS.white;
    ctx.fillText(this.introData.opponentTeamName, rightX, teamY + 50);

    const rightSlide = Math.min(1, this.entranceTimer / 0.4);
    const rightXoff = 200 * (1 - rightSlide);
    ctx.font = '120px sans-serif';
    ctx.fillText(this.introData.opponentTeamFlag || '⚽', rightX + rightXoff, teamY - 60);

    ctx.restore();

    const vsScale = 1 + Math.sin(this.vsPulse) * 0.05;
    ctx.save();
    ctx.translate(centerX, teamY);
    ctx.scale(vsScale, vsScale);
    ctx.translate(-centerX, -teamY);
    ctx.font = '900 72px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.gold;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fillText('VS', centerX, teamY);
    ctx.restore();
  }

  renderMatchInfo(ctx) {
    ctx.textAlign = 'center';
    ctx.font = '600 20px Outfit, sans-serif';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(this.introData.matchLabel || '', 960, 600);
  }

  renderStartButton(ctx) {
    renderBaseButton(ctx, this.startBtn, COLORS.green);
  }
}

export class TournamentHubScene extends Scene {
  constructor(game) {
    super(game);
    this.hubData = null;
    this.continueBtn = { x: 960, y: 940, w: 320, h: 64, label: '▶ CONTINUE', hovered: false };
    this.homeBtn = { x: 220, y: 940, w: 200, h: 64, label: '🏠 HOME', hovered: false };
    this.eliminatedHomeBtn = { x: 760, y: 850, w: 280, h: 60, label: '🏠 HOME', hovered: false };
    this.newTournamentBtn = { x: 1160, y: 850, w: 340, h: 60, label: '🆕 NEW TOURNAMENT', hovered: false };
    this.entranceTimer = 0;
    this.tab = 'standings';
    this.standingsBtn = { x: 650, y: 170, w: 200, h: 40, label: 'STANDINGS', hovered: false };
    this.bracketBtn = { x: 960, y: 170, w: 200, h: 40, label: 'BRACKET', hovered: false };
    this.fixturesBtn = { x: 1270, y: 170, w: 200, h: 40, label: 'FIXTURES', hovered: false };
    this.scrollOffset = 0;
  }

  enter(data) {
    this.entranceTimer = 0;
    this.tab = 'standings';
    this.scrollOffset = 0;
    const tm = this.game.modeManager.tournament;
    this.hubData = tm.getHubData();
  }

  update(dt) {
    this.entranceTimer = Math.min(this.entranceTimer + dt, 0.6);
    const p = this.game.inputManager.pointer;

    if (this.hubData.isEliminated || this.hubData.isComplete) {
      this.eliminatedHomeBtn.hovered = isPointerOverButton(p, this.eliminatedHomeBtn);
      if (!this.hubData.isComplete) {
        this.newTournamentBtn.hovered = isPointerOverButton(p, this.newTournamentBtn);
      }

      if (p.isTapped) {
        if (this.eliminatedHomeBtn.hovered) {
          this.game.soundManager.playSound('click');
          this.game.sceneManager.switchTo('MainMenu');
          return;
        }
        if (this.newTournamentBtn.hovered && !this.hubData.isComplete) {
          this.game.soundManager.playSound('click');
          this.game.modeManager.tournament.abandonTournament();
          this.game.sceneManager.switchTo('TournamentMenu');
          return;
        }
      }
      return;
    }

    this.continueBtn.hovered = isPointerOverButton(p, this.continueBtn);
    this.homeBtn.hovered = isPointerOverButton(p, this.homeBtn);

    if (this.hubData.format === 'group+knockout') {
      this.standingsBtn.hovered = isPointerOverButton(p, this.standingsBtn);
      this.bracketBtn.hovered = isPointerOverButton(p, this.bracketBtn);
      this.fixturesBtn.hovered = isPointerOverButton(p, this.fixturesBtn);

      if (p.isTapped) {
        if (this.standingsBtn.hovered) this.tab = 'standings';
        if (this.bracketBtn.hovered) this.tab = 'bracket';
        if (this.fixturesBtn.hovered) this.tab = 'fixtures';
      }

      if (this.tab === 'bracket' || this.tab === 'fixtures') {
        if (p.isDown) {
          this._handleScroll(p);
        }
      }
    }

    if (p.isTapped) {
      if (this.continueBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('TournamentMatchIntro');
        return;
      }
      if (this.homeBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('MainMenu');
        return;
      }
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  _handleScroll(p) {
    if (!this._lastScrollY) this._lastScrollY = p.y;
    const diff = this._lastScrollY - p.y;
    this.scrollOffset = Math.max(-400, Math.min(400, this.scrollOffset + diff * 0.5));
    this._lastScrollY = p.y;
  }

  render(ctx) {
    ctx.fillStyle = '#0f1a2e';
    ctx.fillRect(0, 0, 1920, 1080);
    this.renderBg(ctx);

    const progress = Math.min(1, this.entranceTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = progress;

    this.renderHeader(ctx);

    if (this.hubData.isEliminated) {
      this.renderEliminated(ctx);
      ctx.restore();
      return;
    }

    if (this.hubData.isComplete) {
      this.renderChampion(ctx);
      ctx.restore();
      return;
    }

    this.renderNextOpponent(ctx);

    if (this.hubData.format === 'league') {
      this.renderLeagueTable(ctx);
    } else if (this.hubData.format === 'group+knockout') {
      this.renderTabs(ctx);
      if (this.tab === 'standings') this.renderGroupStandings(ctx);
      else if (this.tab === 'bracket') this.renderKnockoutBracket(ctx);
      else if (this.tab === 'fixtures') this.renderFixtures(ctx);
    }

    this.renderButtons(ctx);
    ctx.restore();
  }

  renderBg(ctx) {
    const grad = ctx.createRadialGradient(960, 200, 50, 960, 200, 700);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);
  }

  renderHeader(ctx) {
    ctx.textAlign = 'center';
    ctx.font = '700 20px Space Grotesk, monospace';
    ctx.fillStyle = this.hubData.tournamentColor || COLORS.purple;
    ctx.fillText(`${this.hubData.tournamentLogo} ${this.hubData.tournamentName}`, 960, 50);

    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(`Stage: ${this.hubData.stageName}`, 960, 80);
  }

  renderNextOpponent(ctx) {
    if (!this.hubData.opponentTeamName) return;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundRect(ctx, 710, 100, 500, 80, 14);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '500 14px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.fillText('NEXT MATCH', 960, 115);

    ctx.font = '24px sans-serif';
    ctx.fillText(this.hubData.playerTeamFlag || '⚽', 840, 148);
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText('vs', 960, 148);
    ctx.font = '24px sans-serif';
    ctx.fillText(this.hubData.opponentTeamFlag || '⚽', 1080, 148);
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(this.hubData.opponentTeamName, 1120, 148);
  }

  renderTabs(ctx) {
    const tabs = [
      { btn: this.standingsBtn, label: 'STANDINGS', active: this.tab === 'standings' },
      { btn: this.bracketBtn, label: 'BRACKET', active: this.tab === 'bracket' },
      { btn: this.fixturesBtn, label: 'FIXTURES', active: this.tab === 'fixtures' },
    ];

    tabs.forEach(({ btn, label, active }) => {
      ctx.save();
      ctx.fillStyle = active ? 'rgba(139, 92, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = active ? COLORS.purple : COLORS.border;
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath();
      drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = active ? '700 14px Outfit, sans-serif' : '600 14px Outfit, sans-serif';
      ctx.fillStyle = active ? COLORS.purple : COLORS.slate;
      ctx.fillText(label, btn.x, btn.y);
      ctx.restore();
    });
  }

  renderGroupStandings(ctx) {
    const groups = this.hubData.groupStandings;
    if (!groups || groups.length === 0) return;

    const startY = 220;
    const colW = 460;
    const startX = [40, 500, 960, 1420];
    const rowH = 24;
    const headerH = 22;

    groups.forEach((group, gi) => {
      const gx = startX[gi % startX.length];
      const gy = startY + Math.floor(gi / startX.length) * (group.standings.length * rowH + headerH + 60);

      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.font = '700 14px Outfit, sans-serif';
      ctx.fillStyle = COLORS.purple;
      ctx.fillText(`Group ${group.name}`, gx + 5, gy);

      ctx.font = '500 10px Space Grotesk, monospace';
      ctx.fillStyle = COLORS.darkSlate;
      const headers = ['Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'];
      const hColW = colW / headers.length;
      headers.forEach((h, hi) => {
        ctx.textAlign = hi === 0 ? 'left' : 'center';
        ctx.fillText(h, gx + (hi === 0 ? 5 : hColW * hi + hColW / 2), gy + headerH);
      });

      group.standings.forEach((team, ti) => {
        const ty = gy + headerH + 16 + ti * rowH;
        const isPlayer = team.id === this.hubData.playerTeamId;
        ctx.fillStyle = isPlayer ? 'rgba(16, 185, 129, 0.15)' : 'transparent';
        ctx.fillRect(gx, ty - 2, colW, rowH);

        ctx.font = isPlayer ? '700 11px Outfit, sans-serif' : '500 11px Outfit, sans-serif';
        ctx.fillStyle = isPlayer ? COLORS.green : COLORS.slate;
        ctx.textAlign = 'left';
        ctx.fillText(team.id.substring(0, 10), gx + 5, ty);

        ctx.textAlign = 'center';
        ctx.fillStyle = isPlayer ? COLORS.green : COLORS.slate;
        [team.played, team.won, team.drawn, team.lost, team.gf, team.ga, team.gd, team.pts].forEach((val, vi) => {
          ctx.fillText(val, gx + hColW * (vi + 1) + hColW / 2, ty);
        });
      });

      ctx.restore();
    });
  }

  renderKnockoutBracket(ctx) {
    const rounds = this.hubData.knockoutBracket;
    if (!rounds || rounds.length === 0) {
      ctx.textAlign = 'center';
      ctx.font = '500 16px Space Grotesk, monospace';
      ctx.fillStyle = COLORS.darkSlate;
      ctx.fillText('Knockout stage has not started yet.', 960, 300);
      return;
    }

    ctx.save();
    ctx.translate(0, this.scrollOffset);

    const startY = 220;
    const matchH = 36;
    const roundGap = 240;
    const totalWidth = rounds.length * roundGap;

    rounds.forEach((round, ri) => {
      const rx = 100 + ri * roundGap;
      const numMatches = round.matches.length;
      const totalH = numMatches * (matchH + 4);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '600 12px Outfit, sans-serif';
      ctx.fillStyle = COLORS.purple;
      ctx.fillText(round.name, rx + 100, startY);

      round.matches.forEach((match, mi) => {
        const my = startY + 30 + (mi + 0.5) * (totalH / numMatches);
        const isPlayer = match.isPlayerMatch;
        const played = match.played;

        ctx.fillStyle = isPlayer ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.5)';
        ctx.strokeStyle = played ? (isPlayer ? COLORS.green : COLORS.border) : COLORS.border;
        ctx.lineWidth = played && isPlayer ? 2 : 1;
        ctx.beginPath();
        drawRoundRect(ctx, rx, my - matchH / 2, 200, matchH, 8);
        ctx.fill();
        ctx.stroke();

        const t1Name = this.getTeamNameAbbrev(match.team1);
        const t2Name = this.getTeamNameAbbrev(match.team2);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = isPlayer ? '700 12px Outfit, sans-serif' : '500 12px Outfit, sans-serif';

        if (played) {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${t1Name}`, rx + 8, my - 8);
          ctx.fillText(`${t2Name}`, rx + 8, my + 8);

          ctx.textAlign = 'right';
          ctx.font = '700 14px Outfit, sans-serif';
          const won1 = match.score1 > match.score2;
          ctx.fillStyle = won1 ? COLORS.green : COLORS.slate;
          ctx.fillText(match.score1, rx + 195, my - 8);
          const won2 = match.score2 > match.score1;
          ctx.fillStyle = won2 ? COLORS.green : COLORS.slate;
          ctx.fillText(match.score2, rx + 195, my + 8);
        } else {
          ctx.fillStyle = isPlayer ? COLORS.white : COLORS.slate;
          ctx.fillText(t1Name, rx + 8, my - 8);
          ctx.fillText(t2Name, rx + 8, my + 8);

          ctx.textAlign = 'right';
          ctx.font = '500 12px Outfit, sans-serif';
          ctx.fillStyle = COLORS.darkSlate;
          ctx.fillText('?', rx + 195, my - 8);
          ctx.fillText('?', rx + 195, my + 8);
        }
      });

      ctx.restore();
    });

    ctx.restore();
  }

  getTeamNameAbbrev(teamId) {
    if (!teamId) return 'TBD';
    if (teamId === this.hubData.playerTeamId) return this.hubData.playerTeamName.substring(0, 8);
    const t = TEAMS.find(t => t.id === teamId);
    return t ? t.name.substring(0, 8) : teamId.substring(0, 8);
  }

  renderFixtures(ctx) {
    const history = this.hubData.matchHistory || [];
    if (history.length === 0) {
      ctx.textAlign = 'center';
      ctx.font = '500 16px Space Grotesk, monospace';
      ctx.fillStyle = COLORS.darkSlate;
      ctx.fillText('No matches played yet.', 960, 300);
      return;
    }

    ctx.save();
    ctx.translate(0, this.scrollOffset);

    const startY = 220;
    ctx.textAlign = 'left';
    ctx.font = '500 11px Space Grotesk, monospace';

    const recent = history.slice(-20).reverse();
    recent.forEach((m, mi) => {
      const my = startY + mi * 26;
      const t1Name = this.getTeamNameAbbrev(m.team1);
      const t2Name = this.getTeamNameAbbrev(m.team2);

      ctx.fillStyle = m.simulated ? 'rgba(15, 23, 42, 0.5)' : 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(100, my, 1720, 24);

      ctx.fillStyle = m.simulated ? COLORS.slate : COLORS.white;
      ctx.fillText(`${t1Name} ${m.score1} - ${m.score2} ${t2Name}`, 110, my + 6);

      ctx.textAlign = 'right';
      ctx.fillStyle = COLORS.darkSlate;
      ctx.font = '400 10px Space Grotesk, monospace';
      ctx.fillText(m.stage || m.stageDetail || m.stage || '', 1810, my + 6);
      ctx.textAlign = 'left';
      ctx.font = '500 11px Space Grotesk, monospace';
    });

    ctx.restore();
  }

  renderLeagueTable(ctx) {
    const table = this.hubData.leagueTable;
    if (!table || table.length === 0) return;

    const startY = 200;
    const colW = 1440;
    const startX = 240;
    const rowH = 26;

    ctx.save();

    ctx.textAlign = 'left';
    ctx.font = '700 14px Outfit, sans-serif';
    ctx.fillStyle = COLORS.purple;
    ctx.fillText('LEAGUE TABLE', startX, startY);

    ctx.font = '500 10px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    const headers = ['#', 'Club', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'];
    const hColW = colW / headers.length;
    headers.forEach((h, hi) => {
      ctx.textAlign = hi <= 1 ? 'left' : 'center';
      ctx.fillText(h, startX + (hi === 0 ? 5 : hi === 1 ? 40 : hColW * hi + hColW / 2), startY + 20);
    });

    table.forEach((team, ti) => {
      const ty = startY + 50 + ti * rowH;
      const isPlayer = team.id === this.hubData.playerTeamId;

      ctx.fillStyle = isPlayer ? 'rgba(16, 185, 129, 0.12)' : (ti % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent');
      ctx.fillRect(startX, ty - 2, colW, rowH);

      ctx.font = isPlayer ? '700 12px Outfit, sans-serif' : '500 12px Outfit, sans-serif';
      ctx.fillStyle = isPlayer ? COLORS.green : COLORS.slate;

      ctx.textAlign = 'center';
      ctx.fillText(ti + 1, startX + 15, ty);

      ctx.textAlign = 'left';
      const teamName = this.getTeamNameAbbrev(team.id);
      ctx.fillText(teamName, startX + 40, ty);

      ctx.textAlign = 'center';
      [team.played, team.won, team.drawn, team.lost, team.gf, team.ga, team.gd].forEach((val, vi) => {
        ctx.fillText(val, startX + hColW * (vi + 2) + hColW / 2, ty);
      });

      ctx.font = isPlayer ? '800 13px Outfit, sans-serif' : '600 13px Outfit, sans-serif';
      ctx.fillStyle = isPlayer ? COLORS.green : COLORS.gold;
      ctx.fillText(team.pts, startX + hColW * 9 + hColW / 2, ty);
    });

    ctx.restore();
  }

  renderButtons(ctx) {
    if (!this.hubData.isEliminated && !this.hubData.isComplete) {
      renderBaseButton(ctx, this.continueBtn, COLORS.green);
      renderBaseButton(ctx, this.homeBtn, '#6a8aaa');
    }
  }

  renderEliminated(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    drawRoundRect(ctx, 660, 300, 600, 400, 24);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawGlowingText(ctx, '❌ ELIMINATED', 960, 380,
      '900 48px Outfit, sans-serif', COLORS.red, 'rgba(239,68,68,0.3)', 15);

    ctx.textAlign = 'center';
    ctx.font = '500 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(`Eliminated from ${this.hubData.tournamentName}`, 960, 450);

    ctx.font = '500 16px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.fillText(`Stage: ${this.hubData.stageName}`, 960, 490);

    renderBaseButton(ctx, this.eliminatedHomeBtn, '#6a8aaa');
    renderBaseButton(ctx, this.newTournamentBtn, COLORS.purple);
  }

  renderChampion(ctx) {
    ctx.save();
    const centerX = 960;
    const centerY = 400;

    const pulse = Math.sin(performance.now() * 0.003) * 0.02 + 1;
    const trophyY = centerY - 80 + Math.sin(performance.now() * 0.002) * 10;

    ctx.font = '80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    ctx.translate(centerX, trophyY);
    ctx.scale(pulse, pulse);
    ctx.translate(-centerX, -trophyY);
    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.shadowBlur = 40;
    ctx.fillText(this.hubData.tournamentTrophy || '🏆', centerX, trophyY);
    ctx.restore();

    drawGlowingText(ctx, '🏆 CHAMPION! 🏆', centerX, centerY + 40,
      '900 48px Outfit, sans-serif', COLORS.gold, 'rgba(245, 158, 11, 0.4)', 25);

    ctx.font = '700 28px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(`${this.hubData.playerTeamName}`, centerX, centerY + 100);

    ctx.font = '600 20px Outfit, sans-serif';
    ctx.fillStyle = COLORS.purple;
    ctx.fillText(`${this.hubData.tournamentName}`, centerX, centerY + 140);

    this.renderConfetti(ctx);

    const continueBtn = { x: 960, y: 850, w: 320, h: 64, label: 'CONTINUE', hovered: false };
    const p = this.game.inputManager.pointer;
    continueBtn.hovered = isPointerOverButton(p, continueBtn);

    renderBaseButton(ctx, continueBtn, COLORS.gold);

    if (p.isTapped && continueBtn.hovered) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('TournamentMenu');
    }
  }

  renderConfetti(ctx) {
    ctx.save();
    const time = performance.now() * 0.001;
    const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ef4444', '#ec4899'];
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(time + i * 1.7) * 0.5 + 0.5) * 1920;
      const y = ((Math.sin(time * 1.3 + i * 2.3) * 0.5 + 0.5) * 600) + 100;
      const size = 6 + Math.sin(i) * 3;
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.7 + Math.sin(time * 2 + i) * 0.3;
      ctx.fillRect(x, y, size, size * 0.6);
    }
    ctx.restore();
  }
}
