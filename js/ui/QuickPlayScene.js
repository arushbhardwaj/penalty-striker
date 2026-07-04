import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { drawRoundRect, drawGlowingText, isPointerOverButton, renderBaseButton } from '../utils/helpers.js';

export class QuickPlaySetupScene extends Scene {
  constructor(game) {
    super(game);
    this.backBtn = { x: 120, y: 80, w: 140, h: 56, label: '← BACK', hovered: false };
    this.startBtn = { x: 960, y: 820, w: 320, h: 64, label: '⚽ START MATCH', hovered: false };
    this.difficultyOptions = [
      { label: 'Easy', value: 'easy', y: 400, hovered: false },
      { label: 'Normal', value: 'normal', y: 470, hovered: false },
      { label: 'Hard', value: 'hard', y: 540, hovered: false },
    ];
    this.matchLengthOptions = [
      { label: '5 Shots', value: 5, y: 660, hovered: false },
      { label: '10 Shots', value: 10, y: 730, hovered: false },
      { label: 'Endless', value: 0, y: 800, hovered: false },
    ];
    this.selectedDifficulty = 'normal';
    this.selectedLength = 5;
    this.entranceTimer = 0;
  }

  enter() {
    this.entranceTimer = 0;
  }

  update(dt) {
    this.entranceTimer = Math.min(this.entranceTimer + dt, 1);
    const p = this.game.inputManager.pointer;

    this.backBtn.hovered = isPointerOverButton(p, this.backBtn);
    this.startBtn.hovered = isPointerOverButton(p, this.startBtn);

    this.difficultyOptions.forEach(opt => {
      opt.hovered = isPointerOverButton(p, {
        x: 660, y: opt.y, w: 200, h: 50
      });
    });

    this.matchLengthOptions.forEach(opt => {
      opt.hovered = isPointerOverButton(p, {
        x: 960, y: opt.y, w: 200, h: 50
      });
    });

    if (p.isTapped) {
      if (this.backBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('MainMenu');
        return;
      }
      if (this.startBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('Gameplay', {
          mode: 'quickplay',
          difficulty: this.selectedDifficulty,
          maxAttempts: this.selectedLength === 0 ? null : this.selectedLength,
          matchLength: this.selectedLength,
        });
        return;
      }
      for (const opt of this.difficultyOptions) {
        if (opt.hovered) {
          this.game.soundManager.playSound('click');
          this.selectedDifficulty = opt.value;
          return;
        }
      }
      for (const opt of this.matchLengthOptions) {
        if (opt.hovered) {
          this.game.soundManager.playSound('click');
          this.selectedLength = opt.value;
          return;
        }
      }
    }
    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#2a4a6a';
    ctx.fillRect(0, 0, 1920, 1080);
    this.renderBackground(ctx);
    this.renderTitle(ctx);
    this.renderDifficulty(ctx);
    this.renderMatchLength(ctx);
    this.renderStartButton(ctx);
    this.renderBackButton(ctx);
  }

  renderBackground(ctx) {
    const grad = ctx.createRadialGradient(960, 400, 50, 960, 400, 700);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const x = i * 100;
      ctx.beginPath();
      ctx.moveTo(x, 1080);
      ctx.lineTo(x + 200, 0);
      ctx.stroke();
    }
  }

  renderTitle(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    const ease = 1 - Math.pow(1 - progress, 3);
    ctx.save();
    ctx.globalAlpha = ease;
    drawGlowingText(ctx, '⚽ QUICK PLAY', 960, 160,
      '900 56px Outfit, sans-serif', COLORS.white, COLORS.greenGlow, 20);

    ctx.font = '500 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.textAlign = 'center';
    ctx.fillText('Jump straight into the action', 960, 210);
    ctx.restore();
  }

  renderDifficulty(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = progress;

    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'center';
    ctx.fillText('DIFFICULTY', 660, 340);

    this.difficultyOptions.forEach(opt => {
      const isSelected = this.selectedDifficulty === opt.value;
      ctx.save();
      ctx.fillStyle = opt.hovered ? COLORS.green : (isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSelected ? COLORS.green : (opt.hovered ? COLORS.white : COLORS.border);
      ctx.lineWidth = isSelected ? 2.5 : (opt.hovered ? 2 : 1);
      ctx.beginPath();
      drawRoundRect(ctx, 560, opt.y - 25, 200, 50, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 18px Outfit, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.green : (opt.hovered ? COLORS.white : COLORS.slate);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.label, 660, opt.y);
      ctx.restore();
    });

    ctx.restore();
  }

  renderMatchLength(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = progress;

    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'center';
    ctx.fillText('MATCH LENGTH', 960, 600);

    this.matchLengthOptions.forEach(opt => {
      const isSelected = this.selectedLength === opt.value;
      const btnX = 960;
      ctx.save();
      ctx.fillStyle = opt.hovered ? COLORS.blue : (isSelected ? 'rgba(14, 165, 233, 0.15)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSelected ? COLORS.blue : (opt.hovered ? COLORS.white : COLORS.border);
      ctx.lineWidth = isSelected ? 2.5 : (opt.hovered ? 2 : 1);
      ctx.beginPath();
      drawRoundRect(ctx, btnX - 100, opt.y - 25, 200, 50, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 18px Outfit, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.blue : (opt.hovered ? COLORS.white : COLORS.slate);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.label, btnX, opt.y);
      ctx.restore();
    });

    ctx.restore();
  }

  renderStartButton(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = progress;
    renderBaseButton(ctx, this.startBtn, COLORS.green);
    ctx.restore();
  }

  renderBackButton(ctx) {
    renderBaseButton(ctx, this.backBtn, '#6a8aaa');
  }
}
