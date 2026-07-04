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
    ctx.fillStyle = '#8aaccc';
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
      'bold 90px Outfit, sans-serif', '#1a2a3a', 'rgba(16, 185, 129, 0.3)', 25);
    drawGlowingText(ctx, 'LOADING' + this.dots, 960, 510,
      '500 20px Space Grotesk, monospace', '#1a6a3a', 'transparent', 0);

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

    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * 2200 - 100,
        y: 30 + Math.random() * 260,
        w: 130 + Math.random() * 150,
        h: 25 + Math.random() * 30,
        speed: 0.04 + Math.random() * 0.06,
        alpha: 0.5 + Math.random() * 0.3,
        parts: Math.floor(4 + Math.random() * 3),
      });
    }

    this.entranceTimer = 0;
    this.entranceDuration = 1.0;
    this.logoBounceTimer = 8 + Math.random() * 2;
    this.logoBounceProgress = 0;
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
        icon: '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="black"/></svg>',
      }),
      MenuButton.create(container, {
        label: 'TOURNAMENT',
        theme: 'blue',
        sceneName: 'TournamentMenu',
        onClick: makeHandler('TournamentMenu'),
        entranceDelay: '0.32s',
        icon: '<svg viewBox="0 0 24 24" fill="black"><path d="M7 4v4.5a5 5 0 0 0 10 0V4H7z"/><path d="M4.5 5.5C3 6 2.5 8.5 4.5 10l1-1.5c-.7-.5-.4-2 0-3h-1z"/><path d="M19.5 5.5c1.5.5 2 3 0 4.5l-1-1.5c.7-.5.4-2 0-3h1z"/><rect x="11" y="12" width="2" height="3"/><rect x="7.5" y="15" width="9" height="4" rx="1"/></svg>',
      }),
      MenuButton.create(container, {
        label: 'PRACTICE',
        theme: 'yellow',
        sceneName: 'PracticeSetup',
        onClick: makeHandler('PracticeSetup'),
        entranceDelay: '0.44s',
        icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="black" stroke-width="2.5" fill="none"/><circle cx="12" cy="12" r="6" stroke="black" stroke-width="2.5" fill="none"/><circle cx="12" cy="12" r="2" fill="black"/></svg>',
      }),
      MenuButton.create(container, {
        label: 'COMING SOON',
        theme: 'green',
        entranceDelay: '0.56s',
        icon: '<svg viewBox="0 0 24 24"><polygon points="12,2 15,9 23,9 16.5,14 18.5,22 12,17 5.5,22 7.5,14 1,9 9,9" fill="black"/></svg>',
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

    this.logoBounceTimer -= dt;
    if (this.logoBounceTimer <= 0) {
      this.logoBounceProgress = 0.001;
      this.logoBounceTimer = 8 + Math.random() * 2;
    }
    if (this.logoBounceProgress > 0) {
      this.logoBounceProgress += dt * 3;
      if (this.logoBounceProgress >= 1) this.logoBounceProgress = 0;
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
    }
  }

  render(ctx) {
    // Bright daytime sky background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    skyGrad.addColorStop(0, '#6FBFFF');
    skyGrad.addColorStop(0.3, '#85CEFF');
    skyGrad.addColorStop(0.6, '#96D9FF');
    skyGrad.addColorStop(1, '#B0E4FF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    this.renderClouds(ctx);
    this.renderPitch(ctx);
    this.renderFootballParticles(ctx);

    // Soft blur background so it doesn't compete with UI
    ctx.save();
    if (typeof ctx.filter !== 'undefined') {
      ctx.filter = 'blur(3px)';
      ctx.drawImage(this.game.canvas, 0, 0);
      ctx.filter = 'none';
    }
    ctx.restore();

    this.renderTitle(ctx);
    this.renderFooter(ctx);
  }

  renderClouds(ctx) {
    const time = performance.now() * 0.001;
    this.clouds.forEach(cloud => {
      const cx = ((cloud.x + time * cloud.speed * 25) % 2400 + 2400) % 2400 - 200;
      ctx.save();
      ctx.globalAlpha = cloud.alpha;
      ctx.fillStyle = '#ffffff';
      const n = cloud.parts;
      for (let j = 0; j < n; j++) {
        const angle = (j / n) * Math.PI * 2;
        const dx = Math.cos(angle) * cloud.w * 0.28;
        const dy = Math.sin(angle) * cloud.h * 0.25 - cloud.h * 0.05;
        const r = cloud.w * (0.22 + Math.sin(j * 1.5) * 0.08);
        ctx.beginPath();
        ctx.arc(cx + dx, cloud.y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(200, 220, 240, 0.1)';
      ctx.beginPath();
      ctx.arc(cx + cloud.w * 0.05, cloud.y + cloud.h * 0.15, cloud.w * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderPitch(ctx) {
    ctx.save();
    const H = 410;
    const fieldGrad = ctx.createLinearGradient(960, H, 960, 1080);
    fieldGrad.addColorStop(0, '#267a42');
    fieldGrad.addColorStop(0.4, '#359050');
    fieldGrad.addColorStop(1, '#196530');
    ctx.fillStyle = fieldGrad;
    ctx.beginPath();
    ctx.moveTo(310, H);
    ctx.lineTo(1610, H);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    const seg = (1610 - 310) / 12;
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(310 + i * seg, H);
        ctx.lineTo(310 + (i + 1) * seg, H);
        ctx.lineTo(i * 160 + 160, 1080);
        ctx.lineTo(i * 160, 1080);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(310, H);
    ctx.lineTo(0, 1080);
    ctx.moveTo(1610, H);
    ctx.lineTo(1920, 1080);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(560, H);
    ctx.lineTo(400, 550);
    ctx.lineTo(1520, 550);
    ctx.lineTo(1360, H);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(310, H);
    ctx.lineTo(1610, H);
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

    const bounce = this.logoBounceProgress;
    let scale = 1;
    if (bounce > 0) {
      const t = bounce < 0.5 ? bounce * 2 : 2 - bounce * 2;
      scale = 1 + 0.02 * (1 - Math.pow(1 - t, 2));
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    // Soft drop shadow for the whole logo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // "PENALTY" - gold gradient with bold black border
    ctx.save();
    ctx.translate(960, 210);
    ctx.scale(scale, scale);
    ctx.translate(-960, -210);
    const goldGrad = ctx.createLinearGradient(960, 160, 960, 260);
    goldGrad.addColorStop(0, '#FFD700');
    goldGrad.addColorStop(0.5, '#FFB800');
    goldGrad.addColorStop(1, '#FF8C00');
    ctx.font = '900 112px Outfit, sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 7;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.strokeText('PENALTY', 960, 210);
    ctx.fillStyle = goldGrad;
    ctx.fillText('PENALTY', 960, 210);
    ctx.restore();

    // "STRIKER" - white with bold black border + green glow
    ctx.save();
    ctx.translate(960, 315);
    ctx.scale(scale, scale);
    ctx.translate(-960, -315);
    ctx.font = '900 112px Outfit, sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 7;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 0;
    ctx.strokeText('STRIKER', 960, 315);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STRIKER', 960, 315);
    ctx.restore();

    // Tagline - delayed entrance
    const tagProgress = Math.min(1, Math.max(0, (this.entranceTimer - 0.3) / (this.entranceDuration - 0.3)));
    const tagEase = 1 - Math.pow(1 - tagProgress, 3);
    if (tagEase > 0) {
      ctx.save();
      ctx.globalAlpha = tagEase;
      const tagY = 400;
      const tagW = 640;
      const tagH = 44;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      drawRoundRect(ctx, 960 - tagW / 2, tagY - tagH / 2, tagW, tagH, 22);
      ctx.fill();
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 2;
      ctx.font = '800 28px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('CAN YOU SCORE THE WINNING PENALTY?', 960, tagY + 1);
      ctx.restore();
    }

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
