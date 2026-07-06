import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { MenuButton } from './MenuButton.js';
import { TEAMS } from '../data/teams.js';
import { SaveManager } from '../systems/save.js';

const DIFFICULTY_KEY = 'penalty_qp_difficulty';

export class QuickPlaySetupScene extends Scene {
  constructor(game) {
    super(game);
    this.overlay = document.getElementById('quickplay-overlay');
    this.teamGrid = document.getElementById('qp-team-grid');

    this.playerTeam = null;
    this.opponentTeam = null;
    this.selectionPhase = 'start';
    this.nextChange = 'player';
    this.selectedDifficulty = SaveManager.load(DIFFICULTY_KEY, 'normal');

    this.difficultyButtons = [];
    this.startButton = null;

    this.entranceTimer = 0;
  }

    enter() {
    this.entranceTimer = 0;
    this.playerTeam = null;
    this.opponentTeam = null;
    this.selectionPhase = 'start';
    this.nextChange = 'player';

    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      this.overlay.getBoundingClientRect();
      this.overlay.classList.add('active');

      this._createTeamCards();
      this._createDifficultyButtons();
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
    this._destroyDifficultyButtons();
    this._destroyStartButton();
  }

  update(dt) {
    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('MainMenu');
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

    ctx.fillStyle = 'rgba(15, 55, 30, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, 1080);
    ctx.lineTo(250, 720);
    ctx.lineTo(1670, 720);
    ctx.lineTo(1920, 1080);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let i = 0; i < 14; i++) {
      if (i % 2 === 0) {
        const x1 = 250 + i * 100;
        const x2 = 250 + (i + 1) * 100;
        ctx.beginPath();
        ctx.moveTo(x1, 720);
        ctx.lineTo(x2, 720);
        ctx.lineTo(137 + i * 137, 1080);
        ctx.lineTo(68 + i * 137, 1080);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97.3 + 43) % 1920;
      const sy = 15 + (i * 61.7 + 29) % 320;
      const sr = 0.5 + (i % 4) * 0.25;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _createTeamCards() {
    this.teamGrid.innerHTML = '';
    TEAMS.forEach(team => {
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
    if (!this.playerTeam && !this.opponentTeam) {
      this._setPlayerTeam(team);
      this.selectionPhase = 'player';
      this._updateUI();
      return;
    }

    if (this.playerTeam && !this.opponentTeam) {
      if (team.id === this.playerTeam.id) return;
      this._setOpponentTeam(team);
      this.selectionPhase = 'opponent';
      this._updateUI();
      return;
    }

    if (!this.playerTeam && this.opponentTeam) {
      if (team.id === this.opponentTeam.id) return;
      this._setPlayerTeam(team);
      this.selectionPhase = 'opponent';
      this._updateUI();
      return;
    }

    if (this.playerTeam && this.opponentTeam) {
      if (team.id === this.playerTeam.id) return;
      if (team.id === this.opponentTeam.id) return;

      if (this.nextChange === 'player') {
        this._clearPlayerTeam();
        this._setPlayerTeam(team);
        this.nextChange = 'opponent';
      } else {
        this._clearOpponentTeam();
        this._setOpponentTeam(team);
        this.nextChange = 'player';
      }
      this._updateUI();
    }
  }

  _setPlayerTeam(team) {
    this.playerTeam = team;
    const el = this.teamGrid.querySelector(`[data-team-id="${team.id}"]`);
    if (el) {
      el.classList.add('selected-player');
      el.classList.remove('selected-opponent');
      el.classList.add('just-selected');
      setTimeout(() => el.classList.remove('just-selected'), 120);
    }
  }

  _clearPlayerTeam() {
    if (!this.playerTeam) return;
    const el = this.teamGrid.querySelector(`[data-team-id="${this.playerTeam.id}"]`);
    if (el) el.classList.remove('selected-player');
    this.playerTeam = null;
  }

  _setOpponentTeam(team) {
    this.opponentTeam = team;
    const el = this.teamGrid.querySelector(`[data-team-id="${team.id}"]`);
    if (el) {
      el.classList.add('selected-opponent');
      el.classList.remove('selected-player');
      el.classList.add('just-selected');
      setTimeout(() => el.classList.remove('just-selected'), 120);
    }
  }

  _clearOpponentTeam() {
    if (!this.opponentTeam) return;
    const el = this.teamGrid.querySelector(`[data-team-id="${this.opponentTeam.id}"]`);
    if (el) el.classList.remove('selected-opponent');
    this.opponentTeam = null;
  }

  _createDifficultyButtons() {
    const container = document.getElementById('qp-difficulty-buttons');
    container.innerHTML = '';
    this.difficultyButtons = [];

    const options = [
      { label: 'Easy', value: 'easy' },
      { label: 'Normal', value: 'normal' },
      { label: 'Hard', value: 'hard' },
      { label: 'Legendary', value: 'legendary' },
    ];

    options.forEach(opt => {
      const btn = new MenuButton({
        label: opt.label,
        width: 'auto',
        maxWidth: '140px',
        fontSize: 'clamp(0.75rem, 1.1vw, 1rem)',
        minHeight: '44px',
        onClick: () => this._selectDifficulty(opt.value),
      });
      btn.create(container);
      btn.element.dataset.value = opt.value;
      this.difficultyButtons.push(btn);
    });

    this._updateDifficultyButtons();
  }

  _destroyDifficultyButtons() {
    this.difficultyButtons.forEach(btn => btn.destroy());
    this.difficultyButtons = [];
  }

  _selectDifficulty(value) {
    if (value === this.selectedDifficulty) return;
    this.selectedDifficulty = value;
    SaveManager.save(DIFFICULTY_KEY, value);
    this._updateDifficultyButtons();
    this.game.soundManager.playSound('click');
  }

  _updateDifficultyButtons() {
    this.difficultyButtons.forEach(btn => {
      const value = btn.element.dataset.value;
      const isSelected = value === this.selectedDifficulty;

      btn.element.className = 'game-btn';
      btn.element.classList.add(`game-btn--diff-${value}`);

      if (!isSelected) {
        btn.element.classList.remove(`game-btn--diff-${value}`);
        btn.element.style.setProperty('--btn-bg', 'rgba(30, 41, 59, 0.65)');
        btn.element.style.setProperty('--btn-depth', 'rgba(15, 23, 42, 0.9)');
        btn.element.style.setProperty('--btn-outline', 'rgba(100, 116, 139, 0.25)');
        btn.element.classList.remove('game-btn--fire');
      } else {
        btn.element.classList.add(`game-btn--diff-${value}`);
        if (value === 'easy') {
          btn.element.style.setProperty('--btn-bg', 'var(--diff-easy-bg)');
          btn.element.style.setProperty('--btn-depth', 'var(--diff-easy-depth)');
          btn.element.style.setProperty('--btn-outline', 'var(--diff-easy-outline)');
        } else if (value === 'normal') {
          btn.element.style.setProperty('--btn-bg', 'var(--diff-normal-bg)');
          btn.element.style.setProperty('--btn-depth', 'var(--diff-normal-depth)');
          btn.element.style.setProperty('--btn-outline', 'var(--diff-normal-outline)');
        } else if (value === 'hard') {
          btn.element.style.setProperty('--btn-bg', 'var(--diff-hard-bg)');
          btn.element.style.setProperty('--btn-depth', 'var(--diff-hard-depth)');
          btn.element.style.setProperty('--btn-outline', 'var(--diff-hard-outline)');
        } else if (value === 'legendary') {
          btn.element.style.setProperty('--btn-bg', '#ff4500');
          btn.element.style.setProperty('--btn-depth', '#cc3700');
          btn.element.style.setProperty('--btn-outline', '#5c1a00');
          btn.element.classList.add('game-btn--fire');
        }
      }
    });
  }

  _createStartButton() {
    const container = document.getElementById('qp-start-section');
    container.innerHTML = '';

    this._createBackButton(container);

    this.startButton = new MenuButton({
      label: '\u26BD START MATCH',
      theme: 'red',
      maxWidth: '520px',
      fontSize: 'clamp(1.1rem, 1.8vw, 1.6rem)',
      minHeight: '64px',
      onClick: () => this._startMatch(),
    });
    this.startButton.create(container);
    this.startButton.setDisabled(true);
  }

  _createBackButton(container) {
    const backBtn = document.createElement('button');
    backBtn.className = 'qp-back-door-btn';
    backBtn.setAttribute('type', 'button');
    backBtn.setAttribute('aria-label', 'Back to Main Menu');

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
      this.game.sceneManager.switchTo('MainMenu');
    };
    backBtn.addEventListener('click', this._backBtnHandler);

    container.prepend(backBtn);
    this._backBtn = backBtn;
  }

  _destroyBackButton() {
    if (this._backBtn) {
      if (this._backBtnHandler) {
        this._backBtn.removeEventListener('click', this._backBtnHandler);
      }
      if (this._backBtn.parentNode) {
        this._backBtn.parentNode.removeChild(this._backBtn);
      }
      this._backBtn = null;
      this._backBtnHandler = null;
    }
  }

  _destroyStartButton() {
    this._destroyBackButton();
    if (this.startButton) {
      this.startButton.destroy();
      this.startButton = null;
    }
  }

  _startMatch() {
    if (!this.playerTeam || !this.opponentTeam) return;
    this.game.soundManager.playSound('click');
    this.game.sceneManager.switchTo('Gameplay', {
      mode: 'quickplay',
      difficulty: this.selectedDifficulty,
      playerTeam: this.playerTeam,
      opponentTeam: this.opponentTeam,
      maxAttempts: 5,
    });
  }

  _updateUI() {
    this._updateIndicator();
    this._updatePhase();
    this._updateStartButtonState();
  }

  _updateIndicator() {
    const homeFlag = document.getElementById('qp-home-flag');
    const homeFallback = document.getElementById('qp-home-flag-fallback');
    const homeName = document.getElementById('qp-home-name');
    const homeRating = document.getElementById('qp-home-rating');
    const awayFlag = document.getElementById('qp-away-flag');
    const awayFallback = document.getElementById('qp-away-flag-fallback');
    const awayName = document.getElementById('qp-away-name');
    const awayRating = document.getElementById('qp-away-rating');

    if (this.playerTeam) {
      homeFlag.src = `assets/flags/${this.playerTeam.flagCode}.png`;
      homeFlag.alt = this.playerTeam.name;
      homeFlag.style.display = 'inline';
      homeFallback.style.display = 'none';
      homeName.textContent = this.playerTeam.name;
      homeRating.textContent = `(${this.playerTeam.rating})`;
      homeRating.style.display = 'inline';
    } else {
      homeFlag.src = '';
      homeFlag.style.display = 'none';
      homeFallback.style.display = 'none';
      homeName.textContent = 'Your Team: \u2014';
      homeRating.textContent = '';
      homeRating.style.display = 'none';
    }

    if (this.opponentTeam) {
      awayFlag.src = `assets/flags/${this.opponentTeam.flagCode}.png`;
      awayFlag.alt = this.opponentTeam.name;
      awayFlag.style.display = 'inline';
      awayFallback.style.display = 'none';
      awayName.textContent = this.opponentTeam.name;
      awayRating.textContent = `(${this.opponentTeam.rating})`;
      awayRating.style.display = 'inline';
    } else {
      awayFlag.src = '';
      awayFlag.style.display = 'none';
      awayFallback.style.display = 'none';
      awayName.textContent = 'Opponent: \u2014';
      awayRating.textContent = '';
      awayRating.style.display = 'none';
    }
  }

  _updatePhase() {
    const phaseEl = document.getElementById('qp-phase');
    if (this.selectionPhase === 'start') {
      phaseEl.style.display = 'none';
    } else if (this.selectionPhase === 'player') {
      phaseEl.textContent = 'Select Opponent';
      phaseEl.style.display = 'block';
    } else {
      phaseEl.style.display = 'none';
    }
  }

  _updateStartButtonState() {
    if (this.startButton) {
      const enabled = this.playerTeam && this.opponentTeam;
      this.startButton.setDisabled(!enabled);
    }
  }

}
