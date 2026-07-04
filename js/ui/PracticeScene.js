import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { drawRoundRect, drawGlowingText, isPointerOverButton, renderBaseButton } from '../utils/helpers.js';
import { PracticeMode } from '../gamemodes/PracticeMode.js';

export class PracticeSetupScene extends Scene {
  constructor(game) {
    super(game);
    this.backBtn = { x: 120, y: 80, w: 140, h: 56, label: '← BACK', hovered: false };
    this.startBtn = { x: 960, y: 920, w: 320, h: 64, label: '🎯 START PRACTICE', hovered: false };
    this.difficultyOptions = [
      { label: 'Easy', value: 'easy', y: 330, hovered: false },
      { label: 'Normal', value: 'normal', y: 390, hovered: false },
      { label: 'Hard', value: 'hard', y: 450, hovered: false },
      { label: 'God', value: 'god', y: 510, hovered: false },
    ];
    this.toggleOptions = [
      { label: 'Wind', key: 'windEnabled', y: 620, enabled: false },
      { label: 'Shot Trail', key: 'shotTrailEnabled', y: 690, enabled: false },
      { label: 'Target Zones', key: 'targetZonesEnabled', y: 760, enabled: false },
    ];
    this.selectedDifficulty = 'normal';
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
      opt.hovered = isPointerOverButton(p, { x: 660, y: opt.y, w: 200, h: 46 });
    });

    this.toggleOptions.forEach(opt => {
      opt.hovered = isPointerOverButton(p, { x: 960, y: opt.y, w: 300, h: 46 });
    });

    if (p.isTapped) {
      if (this.backBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('MainMenu');
        return;
      }
      if (this.startBtn.hovered) {
        this.game.soundManager.playSound('click');
        const practice = this.game.modeManager.startPractice({
          difficulty: this.selectedDifficulty,
          windEnabled: this.toggleOptions[0].enabled,
          shotTrailEnabled: this.toggleOptions[1].enabled,
          targetZonesEnabled: this.toggleOptions[2].enabled,
        });
        this.game.sceneManager.switchTo('Gameplay', {
          mode: 'practice',
          difficulty: this.selectedDifficulty,
          maxAttempts: null,
          practiceOptions: {
            windEnabled: this.toggleOptions[0].enabled,
            shotTrailEnabled: this.toggleOptions[1].enabled,
            targetZonesEnabled: this.toggleOptions[2].enabled,
          },
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
      for (const opt of this.toggleOptions) {
        if (opt.hovered) {
          this.game.soundManager.playSound('click');
          opt.enabled = !opt.enabled;
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
    this.renderOptions(ctx);
    this.renderStartButton(ctx);
    this.renderBackButton(ctx);
  }

  renderBackground(ctx) {
    const grad = ctx.createRadialGradient(960, 400, 50, 960, 400, 700);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x = (i / 30) * 1920;
      ctx.beginPath();
      ctx.arc(x, 1080, 400 + i * 30, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderTitle(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    const ease = 1 - Math.pow(1 - progress, 3);
    ctx.save();
    ctx.globalAlpha = ease;
    drawGlowingText(ctx, '🎯 PRACTICE', 960, 150,
      '900 56px Outfit, sans-serif', COLORS.white, COLORS.purpleGlow, 20);

    ctx.font = '500 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.textAlign = 'center';
    ctx.fillText('Hone your skills with unlimited shots', 960, 200);
    ctx.restore();
  }

  renderDifficulty(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = progress;

    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'left';
    ctx.fillText('DIFFICULTY', 560, 280);

    this.difficultyOptions.forEach(opt => {
      const isSelected = this.selectedDifficulty === opt.value;
      ctx.save();
      ctx.fillStyle = opt.hovered ? COLORS.purple : (isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)');
      ctx.strokeStyle = isSelected ? COLORS.purple : (opt.hovered ? COLORS.white : COLORS.border);
      ctx.lineWidth = isSelected ? 2.5 : (opt.hovered ? 2 : 1);
      ctx.beginPath();
      drawRoundRect(ctx, 560, opt.y - 23, 200, 46, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 16px Outfit, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.purple : (opt.hovered ? COLORS.white : COLORS.slate);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.label, 660, opt.y);
      ctx.restore();
    });

    ctx.restore();
  }

  renderOptions(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = progress;

    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'left';
    ctx.fillText('OPTIONS', 560, 580);

    this.toggleOptions.forEach(opt => {
      const isEnabled = opt.enabled;
      ctx.save();
      ctx.fillStyle = opt.hovered ? (isEnabled ? COLORS.green : 'rgba(30, 41, 59, 0.8)') : 'rgba(15, 23, 42, 0.6)';
      ctx.strokeStyle = isEnabled ? COLORS.green : (opt.hovered ? COLORS.white : COLORS.border);
      ctx.lineWidth = isEnabled ? 2.5 : (opt.hovered ? 2 : 1);
      ctx.beginPath();
      drawRoundRect(ctx, 560, opt.y - 23, 260, 46, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 16px Outfit, sans-serif';
      ctx.fillStyle = isEnabled ? COLORS.green : (opt.hovered ? COLORS.white : COLORS.slate);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(isEnabled ? '✓ ' : '○ ', 580, opt.y);
      ctx.fillText(opt.label, 610, opt.y);

      ctx.textAlign = 'right';
      ctx.fillStyle = isEnabled ? COLORS.green : COLORS.darkSlate;
      ctx.fillText(isEnabled ? 'ON' : 'OFF', 800, opt.y);

      ctx.restore();
    });

    ctx.restore();
  }

  renderStartButton(ctx) {
    const progress = Math.min(1, this.entranceTimer / 0.6);
    ctx.save();
    ctx.globalAlpha = progress;
    renderBaseButton(ctx, this.startBtn, COLORS.purple);
    ctx.restore();
  }

  renderBackButton(ctx) {
    renderBaseButton(ctx, this.backBtn, '#6a8aaa');
  }
}
