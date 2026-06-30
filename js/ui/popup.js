import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { drawRoundRect, drawGlowingText, renderBaseButton } from '../utils/helpers.js';

export class PauseScene extends Scene {
  constructor(game) {
    super(game);
    this.resumeBtn = { x: 960, y: 530, w: 320, h: 64, label: 'RESUME', hovered: false };
    this.quitBtn = { x: 960, y: 630, w: 320, h: 64, label: 'QUIT TO MENU', hovered: false };
    this.previousScene = null;
  }

  enter(data) {
    this.previousScene = data;
  }

  update(dt) {
    const p = this.game.inputManager.pointer;

    this.resumeBtn.hovered =
      Math.abs(p.x - this.resumeBtn.x) < this.resumeBtn.w / 2 &&
      Math.abs(p.y - this.resumeBtn.y) < this.resumeBtn.h / 2;

    this.quitBtn.hovered =
      Math.abs(p.x - this.quitBtn.x) < this.quitBtn.w / 2 &&
      Math.abs(p.y - this.quitBtn.y) < this.quitBtn.h / 2;

    if (p.isTapped) {
      if (this.resumeBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('Gameplay');
      } else if (this.quitBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('MainMenu');
      }
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('Gameplay');
    }
  }

  render(ctx) {
    if (this.previousScene) this.previousScene.render(ctx);

    ctx.fillStyle = 'rgba(5, 7, 12, 0.82)';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    drawRoundRect(ctx, 760, 340, 400, 400, 24);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawGlowingText(ctx, 'PAUSED', 960, 410,
      '900 48px Outfit, sans-serif', COLORS.white, COLORS.blueGlow, 15);

    renderBaseButton(ctx, this.resumeBtn, COLORS.blue);
    renderBaseButton(ctx, this.quitBtn, COLORS.red);
  }
}

export class GameOverScene extends Scene {
  constructor(game) {
    super(game);
    this.replayBtn = { x: 960, y: 730, w: 320, h: 64, label: 'PLAY AGAIN', hovered: false };
    this.menuBtn = { x: 960, y: 830, w: 320, h: 64, label: 'MAIN MENU', hovered: false };
    this.stats = { score: 0, attempts: 0, points: 0, newRecord: false };
  }

  enter(data) {
    if (data) this.stats = data;
  }

  update(dt) {
    const p = this.game.inputManager.pointer;

    this.replayBtn.hovered =
      Math.abs(p.x - this.replayBtn.x) < this.replayBtn.w / 2 &&
      Math.abs(p.y - this.replayBtn.y) < this.replayBtn.h / 2;

    this.menuBtn.hovered =
      Math.abs(p.x - this.menuBtn.x) < this.menuBtn.w / 2 &&
      Math.abs(p.y - this.menuBtn.y) < this.menuBtn.h / 2;

    if (p.isTapped) {
      if (this.replayBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('Gameplay');
      } else if (this.menuBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('MainMenu');
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, 1920, 1080);

    const ambientGlow = ctx.createRadialGradient(960, 540, 10, 960, 540, 500);
    ambientGlow.addColorStop(0, this.stats.newRecord ? 'rgba(245, 158, 11, 0.08)' : 'rgba(139, 92, 246, 0.08)');
    ambientGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ambientGlow;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
    ctx.strokeStyle = this.stats.newRecord ? COLORS.gold : COLORS.border;
    ctx.lineWidth = this.stats.newRecord ? 3 : 1.5;
    ctx.beginPath();
    drawRoundRect(ctx, 720, 220, 480, 420, 24);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (this.stats.newRecord) {
      drawGlowingText(ctx, 'NEW STADIUM RECORD!', 960, 280,
        '900 36px Outfit, sans-serif', COLORS.gold, 'rgba(245, 158, 11, 0.3)', 15);
    } else {
      drawGlowingText(ctx, 'MATCH COMPLETED', 960, 280,
        '900 36px Outfit, sans-serif', COLORS.white, 'rgba(255, 255, 255, 0.1)', 10);
    }

    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '500 20px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.fillText('GOALS SCORED:', 780, 360);
    ctx.fillText('ATTEMPTS:', 780, 420);
    ctx.fillText('SCORE POINTS:', 780, 480);

    ctx.textAlign = 'right';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${this.stats.score} / ${this.stats.attempts}`, 1140, 360);
    ctx.fillText(`${this.stats.attempts}`, 1140, 420);
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(`${this.stats.points} PTS`, 1140, 480);
    ctx.restore();

    renderBaseButton(ctx, this.replayBtn, COLORS.green);
    renderBaseButton(ctx, this.menuBtn, '#475569');
  }
}

export class SettingsScene extends Scene {
  constructor(game) {
    super(game);
    this.backBtn = { x: 960, y: 880, w: 320, h: 64, label: 'BACK', hovered: false };
  }

  enter() {}

  update(dt) {
    const p = this.game.inputManager.pointer;
    this.backBtn.hovered =
      Math.abs(p.x - this.backBtn.x) < this.backBtn.w / 2 &&
      Math.abs(p.y - this.backBtn.y) < this.backBtn.h / 2;

    if (p.isTapped && this.backBtn.hovered) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('MainMenu');
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.shadowColor = COLORS.blueGlow;
    ctx.shadowBlur = 30;
    ctx.font = '900 64px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.white;
    ctx.fillText('SETTINGS', 960, 300);
    ctx.shadowBlur = 0;

    ctx.font = '500 22px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.fillText('SOUND SETTINGS & PREFERENCES', 960, 400);
    ctx.fillStyle = '#475569';
    ctx.fillText('COMING SOON', 960, 460);
    ctx.restore();

    renderBaseButton(ctx, this.backBtn, COLORS.blue);
  }
}

export class HowToPlayScene extends Scene {
  constructor(game) {
    super(game);
    this.backBtn = { x: 960, y: 880, w: 320, h: 64, label: 'BACK', hovered: false };
  }

  enter() {}

  update(dt) {
    const p = this.game.inputManager.pointer;
    this.backBtn.hovered =
      Math.abs(p.x - this.backBtn.x) < this.backBtn.w / 2 &&
      Math.abs(p.y - this.backBtn.y) < this.backBtn.h / 2;

    if (p.isTapped && this.backBtn.hovered) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('MainMenu');
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.shadowColor = COLORS.purpleGlow;
    ctx.shadowBlur = 30;
    ctx.font = '900 64px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.white;
    ctx.fillText('HOW TO PLAY', 960, 250);
    ctx.shadowBlur = 0;

    ctx.font = '500 22px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.textAlign = 'left';
    const instructions = [
      '1. SWIPE UP on the ball to shoot',
      '2. AIM by swiping left or right',
      '3. SCORE 5 penalties to win the match',
      '4. BUILD streaks for multiplier bonus',
      '5. BEAT your high score to set records',
    ];
    instructions.forEach((text, i) => {
      ctx.fillText(text, 540, 400 + i * 60);
    });
    ctx.restore();

    renderBaseButton(ctx, this.backBtn, COLORS.purple);
  }
}
