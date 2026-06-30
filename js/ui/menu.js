import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { drawRoundRect, drawGlowingText } from '../utils/helpers.js';

let ballSvgUrl = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2246%22%20fill%3D%22%2523ffffff%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M50%2032%20L61%2040%20L57%2052%20L43%2052%20L39%2040%20Z%22%20fill%3D%22%25231e293b%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M50%202%20L50%2032%20M92%2026%20L61%2040%20M76%2080%20L57%2052%20M24%2080%20L43%2052%20M8%2026%20L39%2040%22%20stroke%3D%22%25230f172a%22%20stroke-width%3D%223%22%2F%3E%3C%2Fsvg%3E';
let gloveSvgUrl = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20x%3D%2225%22%20y%3D%2235%22%20width%3D%2250%22%20height%3D%2245%22%20rx%3D%2212%22%20fill%3D%22%25230ea5e9%22%20stroke%3D%22%2523ffffff%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M30%2035%20V15%20M42%2035%20V10%20M54%2035%20V10%20M66%2035%20V15%20M75%2045%20L88%2030%22%20stroke%3D%22%2523ffffff%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E';

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

    this.game.loader.queueImage('ball', ballSvgUrl);
    this.game.loader.queueImage('glove', gloveSvgUrl);

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

    this.buttons = [
      { x: 960, y: 600, w: 380, h: 80, label: 'PLAY', key: 'play', color: COLORS.green, hoverColor: '#059669' },
      { x: 960, y: 710, w: 380, h: 80, label: 'SETTINGS', key: 'settings', color: COLORS.blue, hoverColor: '#0284c7' },
      { x: 960, y: 820, w: 380, h: 80, label: 'HOW TO PLAY', key: 'howtoplay', color: COLORS.purple, hoverColor: '#6d28d9' },
    ];

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
  }

  update(dt) {
    if (this.entranceTimer < this.entranceDuration) {
      this.entranceTimer = Math.min(this.entranceTimer + dt, this.entranceDuration);
    }

    const time = performance.now();
    const p = this.game.inputManager.pointer;

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

    this.buttons.forEach(btn => {
      btn.hovered = Math.abs(p.x - btn.x) < btn.w / 2 && Math.abs(p.y - btn.y) < btn.h / 2;
    });

    if (p.isTapped) {
      for (const btn of this.buttons) {
        const isOver = Math.abs(p.x - btn.x) < btn.w / 2 && Math.abs(p.y - btn.y) < btn.h / 2;
        if (isOver) {
          this.game.soundManager.playSound('click');
          switch (btn.key) {
            case 'play': this.game.sceneManager.switchTo('Gameplay'); break;
            case 'settings': this.game.sceneManager.switchTo('Settings'); break;
            case 'howtoplay': this.game.sceneManager.switchTo('HowToPlay'); break;
          }
          break;
        }
      }
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
    this.renderButtons(ctx);
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
    ctx.fillText('PENALTY', 960, 260);

    ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
    ctx.shadowBlur = 80;
    ctx.fillStyle = COLORS.green;
    ctx.fillText('STRIKER', 960, 365);

    ctx.shadowBlur = 0;
    ctx.font = '500 16px Space Grotesk, monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.fillText('CAN YOU SCORE THE WINNING PENALTY?', 960, 430);

    ctx.restore();
  }

  renderButtons(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    this.buttons.forEach((btn, i) => {
      const btnDelay = 0.3 + i * 0.15;
      const btnProgress = Math.max(0, Math.min(1, (progress - btnDelay) / 0.3));
      const btnEase = 1 - Math.pow(1 - btnProgress, 3);
      this.drawButton(ctx, btn, btnEase);
    });
  }

  drawButton(ctx, btn, ease) {
    if (ease <= 0) return;
    ctx.save();
    ctx.globalAlpha = ease;

    const hoverScale = btn.hovered ? 1.06 : 1;
    ctx.translate(btn.x, btn.y);
    ctx.scale(hoverScale, hoverScale);
    ctx.translate(-btn.x, -btn.y);

    ctx.shadowColor = btn.hovered ? btn.color : 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = btn.hovered ? 30 : 10;

    const grad = ctx.createLinearGradient(btn.x - btn.w / 2, btn.y - btn.h / 2, btn.x - btn.w / 2, btn.y + btn.h / 2);
    if (btn.hovered) {
      grad.addColorStop(0, btn.color);
      grad.addColorStop(1, btn.hoverColor);
      ctx.fillStyle = grad;
    } else {
      grad.addColorStop(0, 'rgba(30, 41, 59, 0.8)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
      ctx.fillStyle = grad;
    }

    ctx.beginPath();
    drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 16);
    ctx.fill();

    ctx.strokeStyle = btn.hovered ? COLORS.white : COLORS.border;
    ctx.lineWidth = btn.hovered ? 2.5 : 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '800 24px Outfit, sans-serif';
    ctx.fillStyle = btn.hovered ? '#0b0f19' : '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x, btn.y);
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
