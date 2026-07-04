import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { drawRoundRect, drawGlowingText } from '../utils/helpers.js';
import { MenuButton } from './MenuButton.js';

export class LoadingScene extends Scene {
  constructor(game) {
    super(game);
    this.progress = 0;
    this.targetProgress = 0;
    this.dots = '';
    this.dotTimer = 0;
  }

  enter() {
    this.progress = 0;
    this.targetProgress = 0;

    this.game.loader.queueImage('ball', 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2246%22%20fill%3D%22%2523ffffff%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M50%2032%20L61%2040%20L57%2052%20L43%2052%20L39%2040%20Z%22%20fill%3D%22%25231e293b%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M50%202%20L50%2032%20M92%2026%20L61%2040%20M76%2080%20L57%2052%20M24%2080%20L43%2052%20M8%2026%20L39%2040%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E');
    this.game.loader.queueImage('glove', 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20x%3D%2225%22%20y%3D%2235%22%20width%3D%2250%22%20height%3D%2245%22%20rx%3D%2212%22%20fill%3D%22%25230ea5e9%22%20stroke%3D%22%2523ffffff%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M30%2035%20V15%20M42%2035%20V10%20M54%2035%20V10%20M66%2035%20V15%20M75%2045%20L88%2030%22%20stroke%3D%22%2523ffffff%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E');
    this.game.loader.queueImage('buttons', 'assets/ui/buttons.png');

    this.game.loader.loadAsync((pct) => {
      this.targetProgress = pct;
    }).then(() => {
      this.targetProgress = 100;
    });
  }

  update(dt) {
    if (this.progress < this.targetProgress) {
      this.progress += 80 * dt;
      if (this.progress > this.targetProgress) this.progress = this.targetProgress;
    }

    this.dotTimer += dt;
    if (this.dotTimer > 0.4) {
      this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
      this.dotTimer = 0;
    }

    if (this.progress >= 100) {
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1920; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1080);
      ctx.stroke();
    }
    for (let j = 0; j < 1080; j += 80) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(1920, j);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(960, 540, 50, 960, 540, 800);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1920, 1080);

    drawGlowingText(ctx, 'PENALTY STRIKER', 960, 430,
      'bold 90px Outfit, sans-serif', COLORS.white, 'rgba(16, 185, 129, 0.4)', 25);
    drawGlowingText(ctx, 'LOADING' + this.dots, 960, 510,
      '500 20px Space Grotesk, monospace', COLORS.green, 'transparent', 0);

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    drawRoundRect(ctx, 660, 560, 600, 16, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const fillWidth = (this.progress / 100) * 592;
    if (fillWidth > 0) {
      const fillGrad = ctx.createLinearGradient(664, 0, 664 + fillWidth, 0);
      fillGrad.addColorStop(0, COLORS.purple);
      fillGrad.addColorStop(0.5, COLORS.blue);
      fillGrad.addColorStop(1, COLORS.green);
      ctx.shadowColor = COLORS.greenGlow;
      ctx.shadowBlur = 10;
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      drawRoundRect(ctx, 664, 564, fillWidth, 8, 4);
      ctx.fill();
    }
    ctx.restore();

    ctx.font = '500 14px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(this.progress)}%`, 1260, 600);
  }
}

export class MainMenuScene extends Scene {
  constructor(game) {
    super(game);

    this.overlay = document.getElementById('menu-overlay');
    this.buttonsContainer = document.getElementById('menu-buttons-container');
    this.clickHandler = null;
    this.menuButtons = [];

    this.footballs = [];
    for (let i = 0; i < 6; i++) {
      this.footballs.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        r: Math.random() * 35 + 15,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        alpha: Math.random() * 0.12 + 0.04,
        floatAmp: Math.random() * 20 + 10,
        floatSpeed: Math.random() * 1.5 + 0.5,
        floatPhase: Math.random() * Math.PI * 2,
      });
    }

    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * 1920,
        y: Math.random() * 350,
        size: Math.random() * 2 + 1,
        baseAlpha: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    this.entranceTimer = 0;
    this.entranceDuration = 1.0;
  }

  enter() {
    this.entranceTimer = 0;
    if (this.overlay) {
      this.overlay.classList.remove('hidden');

      this._createMenuButtons();

      this.clickHandler = (e) => {
        const btn = e.target.closest('[data-scene]');
        if (!btn) return;
        if (btn.classList.contains('game-btn')) return;
        const sceneName = btn.dataset.scene;
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo(sceneName);
      };
      this.overlay.addEventListener('click', this.clickHandler);
    }
  }

  exit() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
      if (this.clickHandler) {
        this.overlay.removeEventListener('click', this.clickHandler);
        this.clickHandler = null;
      }
    }
    this._destroyMenuButtons();
  }

  _createMenuButtons() {
    this._destroyMenuButtons();
    const container = this.buttonsContainer;
    if (!container) return;

    const makeHandler = (sceneName) => () => {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo(sceneName);
    };

    this.menuButtons = [
      MenuButton.create(container, {
        label: 'QUICK PLAY',
        theme: 'red',
        sceneName: 'QuickPlaySetup',
        onClick: makeHandler('QuickPlaySetup'),
        entranceDelay: '0.20s',
      }),
      MenuButton.create(container, {
        label: 'TOURNAMENT',
        theme: 'green',
        sceneName: 'TournamentMenu',
        onClick: makeHandler('TournamentMenu'),
        entranceDelay: '0.32s',
      }),
      MenuButton.create(container, {
        label: 'PRACTICE',
        theme: 'yellow',
        sceneName: 'PracticeSetup',
        onClick: makeHandler('PracticeSetup'),
        entranceDelay: '0.44s',
      }),
    ];
  }

  _destroyMenuButtons() {
    this.menuButtons.forEach(btn => btn.destroy());
    this.menuButtons = [];
  }

  update(dt) {
    if (this.entranceTimer < this.entranceDuration) {
      this.entranceTimer = Math.min(this.entranceTimer + dt, this.entranceDuration);
    }

    const time = performance.now();

    this.footballs.forEach(b => {
      b.x += b.speedX;
      b.y += b.speedY + Math.sin(time * 0.001 * b.floatSpeed + b.floatPhase) * 0.3;
      b.rotation += b.rotSpeed;
      if (b.x < -b.r * 2) b.x = 1920 + b.r;
      if (b.x > 1920 + b.r * 2) b.x = -b.r;
      if (b.y < -b.r * 2) b.y = 1080 + b.r;
      if (b.y > 1080 + b.r * 2) b.y = -b.r;
    });

    this.stars.forEach(s => {
      const twinkle = Math.sin(time * 0.002 * s.twinkleSpeed + s.twinklePhase);
      s.alpha = s.baseAlpha + twinkle * 0.15;
      s.alpha = Math.max(0.1, Math.min(0.9, s.alpha));
    });

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
    }
  }

  render(ctx) {
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, 1920, 1080);

    this.renderStars(ctx);
    this.renderFloodlights(ctx);
    this.renderPitch(ctx);
    this.renderFootballParticles(ctx);
    this.renderTitle(ctx);
    this.renderFooter(ctx);
  }

  renderStars(ctx) {
    ctx.save();
    this.stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = COLORS.white;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  renderFloodlights(ctx) {
    this.drawFloodlight(ctx, 200, 100);
    this.drawFloodlight(ctx, 1720, 100);
  }

  drawFloodlight(ctx, x, y) {
    ctx.save();
    const beam = ctx.createRadialGradient(x, y, 10, x, y + 250, 400);
    beam.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
    beam.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - 40, y);
    ctx.lineTo(x + 40, y);
    ctx.lineTo(x + 300, y + 500);
    ctx.lineTo(x - 300, y + 500);
    ctx.closePath();
    ctx.fill();

    const pulse = Math.sin(performance.now() * 0.002) * 0.2 + 0.8;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - 45, y - 25, 90, 45);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = COLORS.blue;
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(x - 20, y, 8, 0, Math.PI * 2);
    ctx.arc(x + 20, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderPitch(ctx) {
    ctx.save();
    const fieldGrad = ctx.createLinearGradient(960, 450, 960, 1080);
    fieldGrad.addColorStop(0, COLORS.fieldDark);
    fieldGrad.addColorStop(0.4, '#0d4a22');
    fieldGrad.addColorStop(1, '#083216');
    ctx.fillStyle = fieldGrad;
    ctx.beginPath();
    ctx.moveTo(300, 450);
    ctx.lineTo(1620, 450);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(300 + i * 110, 450);
        ctx.lineTo(300 + (i + 1) * 110, 450);
        ctx.lineTo(i * 160 + 160, 1080);
        ctx.lineTo(i * 160, 1080);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(300, 450);
    ctx.lineTo(0, 1080);
    ctx.moveTo(1620, 450);
    ctx.lineTo(1920, 1080);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(550, 450);
    ctx.lineTo(400, 550);
    ctx.lineTo(1520, 550);
    ctx.lineTo(1370, 450);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 450);
    ctx.lineTo(1620, 450);
    ctx.stroke();
    ctx.restore();
  }

  renderFootballParticles(ctx) {
    this.footballs.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const pentR = b.r * 0.38;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * pentR, Math.sin(angle) * pentR);
        else ctx.lineTo(Math.cos(angle) * pentR, Math.sin(angle) * pentR);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = Math.cos(angle) * pentR;
        const py = Math.sin(angle) * pentR;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(Math.cos(angle) * b.r, Math.sin(angle) * b.r);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  renderTitle(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    ctx.save();
    ctx.globalAlpha = easeOut;

    ctx.shadowColor = 'rgba(16, 185, 129, 0.2)';
    ctx.shadowBlur = 60;
    ctx.font = '900 100px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.white;
    ctx.fillText('PENALTY', 960, 220);

    ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
    ctx.shadowBlur = 80;
    ctx.fillStyle = COLORS.green;
    ctx.fillText('STRIKER', 960, 325);

    ctx.shadowBlur = 0;
    ctx.font = '500 16px Space Grotesk, monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.fillText('CAN YOU SCORE THE WINNING PENALTY?', 960, 400);

    ctx.restore();
  }

  renderFooter(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    ctx.save();
    ctx.globalAlpha = progress * 0.5;
    ctx.font = '500 12px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.textAlign = 'center';
    ctx.fillText('HTML5 CANVAS GAME', 960, 1040);
    ctx.restore();
  }
}
