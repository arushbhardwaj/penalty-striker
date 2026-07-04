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

    ctx.save();
    if (typeof ctx.filter !== 'undefined') {
      ctx.filter = 'blur(6px)';
      ctx.drawImage(this.game.canvas, 0, 0);
      ctx.filter = 'none';
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.fillStyle = 'rgba(15, 30, 50, 0.92)';
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
    ctx.fillStyle = '#d0e0f0';
    ctx.fillRect(0, 0, 1920, 1080);

    const ambientGlow = ctx.createRadialGradient(960, 540, 10, 960, 540, 500);
    ambientGlow.addColorStop(0, this.stats.newRecord ? 'rgba(245, 158, 11, 0.12)' : 'rgba(139, 92, 246, 0.10)');
    ambientGlow.addColorStop(1, 'rgba(100, 160, 220, 0)');
    ctx.fillStyle = ambientGlow;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.fillStyle = 'rgba(15, 30, 50, 0.88)';
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
    ctx.fillStyle = '#8aaccc';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.shadowColor = 'rgba(14, 165, 233, 0.3)';
    ctx.shadowBlur = 30;
    ctx.font = '900 64px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a2a3a';
    ctx.fillText('SETTINGS', 960, 300);
    ctx.shadowBlur = 0;

    ctx.font = '500 22px Space Grotesk, monospace';
    ctx.fillStyle = '#3a5a7a';
    ctx.fillText('SOUND SETTINGS & PREFERENCES', 960, 400);
    ctx.fillStyle = '#4a6a8a';
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
    ctx.fillStyle = '#8aaccc';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.3)';
    ctx.shadowBlur = 30;
    ctx.font = '900 64px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a2a3a';
    ctx.fillText('HOW TO PLAY', 960, 250);
    ctx.shadowBlur = 0;

    ctx.font = '500 22px Space Grotesk, monospace';
    ctx.fillStyle = '#2a4a6a';
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

function renderConfetti(ctx) {
  ctx.save();
  const time = performance.now() * 0.001;
  const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ef4444', '#ec4899'];
  for (let i = 0; i < 40; i++) {
    const x = (Math.sin(time + i * 2.1) * 0.5 + 0.5) * 1920;
    const y = ((Math.sin(time * 1.4 + i * 2.7) * 0.5 + 0.5) * 500) + 80;
    const size = 5 + Math.sin(i) * 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.6 + Math.sin(time * 2.5 + i) * 0.3;
    ctx.fillRect(x, y, size, size * 0.5);
  }
  ctx.restore();
}

export class QuickPlayResultScene extends Scene {
  constructor(game) {
    super(game);
    this.replayBtn = { x: 960, y: 750, w: 320, h: 64, label: 'PLAY AGAIN', hovered: false };
    this.menuBtn = { x: 960, y: 840, w: 320, h: 64, label: 'MAIN MENU', hovered: false };
    this.result = null;
    this.entranceTimer = 0;
  }

  enter(data) {
    this.result = data || { score: 0, attempts: 0, accuracy: 0, bestStreak: 0, coinsEarned: 0, avgPower: 0, isNewBest: false, difficulty: 'normal' };
    this.entranceTimer = 0;
  }

  update(dt) {
    this.entranceTimer = Math.min(this.entranceTimer + dt, 1);
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
        this.game.sceneManager.switchTo('QuickPlaySetup');
      } else if (this.menuBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('MainMenu');
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#d0e0f0';
    ctx.fillRect(0, 0, 1920, 1080);

    const progress = Math.min(1, this.entranceTimer / 0.8);

    const glowColor = this.result.isNewBest ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.10)';
    const ambientGlow = ctx.createRadialGradient(960, 540, 10, 960, 540, 500);
    ambientGlow.addColorStop(0, glowColor);
    ambientGlow.addColorStop(1, 'rgba(100, 160, 220, 0)');
    ctx.fillStyle = ambientGlow;
    ctx.fillRect(0, 0, 1920, 1080);

    if (this.result.isNewBest) {
      renderConfetti(ctx);
    }

    ctx.save();
    ctx.globalAlpha = progress;

    ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
    ctx.strokeStyle = this.result.isNewBest ? COLORS.gold : COLORS.green;
    ctx.lineWidth = this.result.isNewBest ? 3 : 2;
    ctx.beginPath();
    drawRoundRect(ctx, 700, 180, 520, 520, 24);
    ctx.fill();
    ctx.stroke();

    if (this.result.isNewBest) {
      drawGlowingText(ctx, 'NEW BEST!', 960, 230,
        '900 38px Outfit, sans-serif', COLORS.gold, 'rgba(245, 158, 11, 0.3)', 15);
    } else {
      drawGlowingText(ctx, 'MATCH COMPLETE', 960, 230,
        '900 38px Outfit, sans-serif', COLORS.white, 'rgba(255, 255, 255, 0.1)', 10);
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(`${this.result.score} / ${this.result.attempts}`, 960, 310);

    ctx.font = '500 16px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText('GOALS', 960, 340);

    ctx.textAlign = 'left';
    ctx.font = '500 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    const statsY = 400;
    ctx.fillText('Accuracy', 750, statsY);
    ctx.fillText('Best Streak', 750, statsY + 45);
    ctx.fillText('Avg Power', 750, statsY + 90);
    ctx.fillText('Coins Earned', 750, statsY + 135);

    ctx.textAlign = 'right';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(`${this.result.accuracy}%`, 1170, statsY);
    ctx.fillText(`${this.result.bestStreak}`, 1170, statsY + 45);
    ctx.fillText(`${this.result.avgPower}%`, 1170, statsY + 90);
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(`+${this.result.coinsEarned} 🪙`, 1170, statsY + 135);

    ctx.restore();

    renderBaseButton(ctx, this.replayBtn, COLORS.green);
    renderBaseButton(ctx, this.menuBtn, '#475569');

    ctx.restore();
  }
}
