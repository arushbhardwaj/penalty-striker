import { Scene } from '../game.js';
import { MenuButton } from './MenuButton.js';

export class PracticeSetupScene extends Scene {
  constructor(game) {
    super(game);
    this.overlay = document.getElementById('practice-overlay');
    this.modeButtons = [];
    this.difficultyButtons = [];
    this.selectedMode = 'penalty';
    this.selectedDifficulty = 'normal';
    this.entranceTimer = 0;
  }

  enter() {
    this.entranceTimer = 0;
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      this.overlay.getBoundingClientRect();
      this.overlay.classList.add('active');
      this._createModeButtons();
      this._createDifficultyButtons();
      this._createBackButton();
    }
  }

  exit() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.classList.add('hidden');
    }
    this._destroyModeButtons();
    this._destroyDifficultyButtons();
    this._destroyBackButton();
  }

  _createModeButtons() {
    const container = document.getElementById('practice-mode-buttons');
    container.innerHTML = '';
    this.modeButtons = [];

    const modes = [
      { label: '\u26BD Penalty', value: 'penalty', theme: 'green' },
      { label: '\u26A1 Freekick', value: 'freekick', theme: 'blue' },
    ];

    modes.forEach(mode => {
      const btn = new MenuButton({
        label: mode.label,
        theme: mode.theme,
        width: 'auto',
        maxWidth: '220px',
        fontSize: 'clamp(0.95rem, 1.4vw, 1.3rem)',
        minHeight: '54px',
        onClick: () => this._launchPractice(mode.value),
      });
      btn.create(container);
      btn.element.dataset.value = mode.value;
      this.modeButtons.push(btn);
    });
  }

  _destroyModeButtons() {
    this.modeButtons.forEach(btn => btn.destroy());
    this.modeButtons = [];
  }

  _launchPractice(mode) {
    this.selectedMode = mode;
    this.game.soundManager.playSound('click');
    this.game.sceneManager.switchTo('Gameplay', {
      mode: 'practice',
      practiceMode: mode,
      difficulty: this.selectedDifficulty,
      maxAttempts: null,
    });
  }

  _createDifficultyButtons() {
    const container = document.getElementById('practice-difficulty-buttons');
    container.innerHTML = '';
    this.difficultyButtons = [];

    const options = [
      { label: 'Easy', value: 'easy' },
      { label: 'Medium', value: 'normal' },
      { label: 'Hard', value: 'hard' },
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
    this._updateDifficultyButtons();
    this.game.soundManager.playSound('click');
  }

  _updateDifficultyButtons() {
    this.difficultyButtons.forEach(btn => {
      const value = btn.element.dataset.value;
      const isSelected = value === this.selectedDifficulty;

      btn.element.className = 'game-btn';

      if (!isSelected) {
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
          btn.element.style.setProperty('--btn-bg', '#ff4500');
          btn.element.style.setProperty('--btn-depth', '#cc3700');
          btn.element.style.setProperty('--btn-outline', '#5c1a00');
          btn.element.classList.add('game-btn--fire');
        }
      }
    });
  }

  _createBackButton() {
    const container = document.getElementById('practice-back-section');
    container.innerHTML = '';

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

    this._backHandler = () => {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('MainMenu');
    };
    backBtn.addEventListener('click', this._backHandler);

    container.appendChild(backBtn);
    this._backBtn = backBtn;
  }

  _destroyBackButton() {
    if (this._backBtn) {
      this._backBtn.removeEventListener('click', this._backHandler);
      if (this._backBtn.parentNode) this._backBtn.parentNode.removeChild(this._backBtn);
      this._backBtn = null;
      this._backHandler = null;
    }
  }

  update(dt) {
    this.entranceTimer = Math.min(this.entranceTimer + dt, 0.6);
    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#2a4a6a';
    ctx.fillRect(0, 0, 1920, 1080);
    const grad = ctx.createRadialGradient(960, 400, 50, 960, 400, 700);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);
  }
}
