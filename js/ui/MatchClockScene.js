import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { drawRoundRect, drawGlowingText } from '../utils/helpers.js';
import { QUICK_PLAY_CONFIG } from '../data/quickPlayConfig.js';

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export class MatchClockScene extends Scene {
  constructor(game) {
    super(game);
    this.state = 'clock';
    this.event = null;
    this.previousMinute = 0;
    this.currentMinute = 0;
    this.displayMinute = 0;
    this.animElapsed = 0;
    this.holdTimer = 0;
    this.flagCache = {};
    this.flavorLine = '';
  }

  enter(data) {
    const state = this.game.quickPlayState || {};
    this.phase = data.phase || 'clock';
    this.playerTeam = state.playerTeam || {};
    this.opponentTeam = state.opponentTeam || {};
    this.playerScore = state.playerScore || 0;
    this.opponentScore = state.opponentScore || 0;
    this.difficulty = state.difficulty || 'normal';
    this.events = state.events || [];
    this.eventIndex = state.eventIndex || 0;
    this.lastResult = state.lastResult || null;

    if (this.phase === 'clock') {
      this.event = this.events[this.eventIndex];
      if (!this.event) {
        setTimeout(() => {
          this.game.sceneManager.switchTo('QuickPlayResult', {
            playerScore: this.playerScore,
            opponentScore: this.opponentScore,
            playerTeam: this.playerTeam,
            opponentTeam: this.opponentTeam,
            difficulty: this.difficulty,
            events: this.events,
          });
        }, 0);
        return;
      }
      this.previousMinute = data.previousMinute !== undefined ? data.previousMinute : 0;
      this.currentMinute = this.previousMinute;
      this.displayMinute = Math.floor(this.previousMinute);
      this.animElapsed = 0;
      this.holdTimer = 0;
      this.state = 'animating';
      this.flavorLine = pick(QUICK_PLAY_CONFIG.flavorLines[this.event.type]);
      this._ensureFlags();
    } else if (this.phase === 'halftime') {
      this.state = 'halftime';
      this.holdTimer = 0;
    } else if (this.phase === 'fulltime') {
      this.state = 'fulltime';
      this.holdTimer = 0;
    }
  }

  _ensureFlags() {
    const codes = [this.playerTeam.flagCode, this.opponentTeam.flagCode]
      .filter(Boolean)
      .map(c => c.toLowerCase());
    codes.forEach(code => {
      if (!this.flagCache[code]) {
        const img = new Image();
        img.src = `assets/flags/${code}.png`;
        this.flagCache[code] = img;
      }
    });
  }

  update(dt) {
    if (this.state === 'animating') {
      this.animElapsed += dt;
      const duration = QUICK_PLAY_CONFIG.clockAnimationDuration;
      const progress = Math.min(1, this.animElapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.currentMinute = this.previousMinute + (this.event.minute - this.previousMinute) * eased;
      this.displayMinute = Math.floor(this.currentMinute);
      if (progress >= 1) {
        this.displayMinute = this.event.minute;
        this.state = 'holding';
        this.holdTimer = 0;
      }
    } else if (this.state === 'holding') {
      this.holdTimer += dt;
      if (this.game.inputManager.pointer.isTapped) {
        this._advance();
        return;
      }
      if (this.holdTimer >= QUICK_PLAY_CONFIG.clockHoldDuration) {
        this._advance();
      }
    } else if (this.state === 'halftime') {
      this.holdTimer += dt;
      if (this.game.inputManager.pointer.isTapped) {
        this._startSecondHalf();
        return;
      }
      if (this.holdTimer >= QUICK_PLAY_CONFIG.halftimeHoldDuration) {
        this._startSecondHalf();
      }
    } else if (this.state === 'fulltime') {
      this.holdTimer += dt;
      if (this.game.inputManager.pointer.isTapped) {
        this._goToResult();
        return;
      }
      if (this.holdTimer >= QUICK_PLAY_CONFIG.fulltimeHoldDuration) {
        this._goToResult();
      }
    }
  }

  _advance() {
    const state = this.game.quickPlayState;
    this.game.sceneManager.switchTo('Gameplay', {
      mode: 'quickplay',
      matchFlow: 'event',
      eventType: this.event.type,
      difficulty: this.difficulty,
      playerTeam: this.playerTeam,
      opponentTeam: this.opponentTeam,
      eventIndex: this.eventIndex,
    });
  }

  _startSecondHalf() {
    const state = this.game.quickPlayState;
    state.eventIndex = this.eventIndex;
    this.game.sceneManager.switchTo('MatchClock', {
      phase: 'clock',
      previousMinute: 45,
    });
  }

  _goToResult() {
    const state = this.game.quickPlayState;
    this.game.sceneManager.switchTo('QuickPlayResult', {
      playerScore: this.playerScore,
      opponentScore: this.opponentScore,
      playerTeam: this.playerTeam,
      opponentTeam: this.opponentTeam,
      difficulty: this.difficulty,
      events: this.events,
    });
  }

  render(ctx) {
    this._renderBackground(ctx);
    this._renderScoreboard(ctx);

    if (this.state === 'animating' || this.state === 'holding') {
      this._renderMinuteCounter(ctx);
      this._renderEventBanner(ctx);
    } else if (this.state === 'halftime') {
      this._renderHalftimeBeat(ctx);
    } else if (this.state === 'fulltime') {
      this._renderFulltimeBeat(ctx);
    }
  }

  _renderBackground(ctx) {
    ctx.save();
    const bg = ctx.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#0a0f1e');
    bg.addColorStop(0.4, '#101828');
    bg.addColorStop(0.7, '#1a1f2e');
    bg.addColorStop(1, '#0d1220');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1920, 1080);

    for (let i = 0; i < 60; i++) {
      const sx = (i * 137.5 + 23) % 1920;
      const sy = 60 + (i * 89.3 + 11) % 400;
      const sr = 0.6 + (i % 5) * 0.2;
      ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 3) * 0.02})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(960, 540, 100, 960, 540, 1100);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.restore();
  }

  _renderScoreboard(ctx) {
    ctx.save();

    const sbW = 700;
    const sbH = 100;
    const sbX = (1920 - sbW) / 2;
    const sbY = 40;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundRect(ctx, sbX, sbY, sbW, sbH, 14);
    ctx.fill();
    ctx.stroke();

    const halfLabel = this._getHalfLabel();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '500 11px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(halfLabel, 960, sbY + 20);

    const flagW = 44;
    const flagH = 30;

    const playerFlag = this.flagCache[this.playerTeam.flagCode?.toLowerCase()];
    if (playerFlag && playerFlag.complete && playerFlag.naturalWidth > 0) {
      ctx.drawImage(playerFlag, sbX + 60, sbY + sbH / 2 - flagH / 2 + 6, flagW, flagH);
    } else {
      ctx.fillStyle = COLORS.slate;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.playerTeam.flag || '🏳', sbX + 82, sbY + sbH / 2 + 6);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    const nameY = sbY + sbH / 2 + 8;
    ctx.fillText(this.playerTeam.name?.substring(0, 12) || 'HOME', sbX + 115, nameY);

    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(`${this.playerScore}`, 870, nameY);

    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText('-', 960, nameY);

    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(`${this.opponentScore}`, 1050, nameY);

    const oppFlag = this.flagCache[this.opponentTeam.flagCode?.toLowerCase()];
    if (oppFlag && oppFlag.complete && oppFlag.naturalWidth > 0) {
      ctx.drawImage(oppFlag, sbX + sbW - 60 - flagW, sbY + sbH / 2 - flagH / 2 + 6, flagW, flagH);
    } else {
      ctx.fillStyle = COLORS.slate;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.opponentTeam.flag || '🏳', sbX + sbW - 38, sbY + sbH / 2 + 6);
    }

    ctx.textAlign = 'right';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(this.opponentTeam.name?.substring(0, 12) || 'AWAY', sbX + sbW - 115, nameY);

    ctx.restore();
  }

  _getHalfLabel() {
    if (this.state === 'halftime') return 'Half Time';
    if (this.state === 'fulltime') return 'Full Time';
    if (this.event) return this.event.half === 1 ? '1st Half' : '2nd Half';
    return '';
  }

  _renderMinuteCounter(ctx) {
    ctx.save();

    const cy = 480;
    const minuteStr = `${this.displayMinute}'`;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 200px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillText(minuteStr, 963, cy + 3);

    ctx.font = '900 200px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillText(minuteStr, 961, cy + 2);

    ctx.font = '900 200px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.shadowColor = 'rgba(255,255,255,0.08)';
    ctx.shadowBlur = 30;
    ctx.fillText(minuteStr, 960, cy);
    ctx.shadowBlur = 0;

    ctx.font = '600 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText('MINUTE', 960, cy + 120);

    ctx.restore();
  }

  _renderEventBanner(ctx) {
    ctx.save();

    const bannerW = 520;
    const bannerH = 72;
    const bx = (1920 - bannerW) / 2;
    const by = 680;

    const isPenalty = this.event && this.event.type === 'PENALTY';
    const accentColor = isPenalty ? '#ef4444' : '#0ea5e9';
    const accentBg = isPenalty ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 165, 233, 0.12)';

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    drawRoundRect(ctx, bx, by, bannerW, bannerH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentBg;
    ctx.beginPath();
    drawRoundRect(ctx, bx + 2, by + 2, bannerW - 4, bannerH - 4, 12);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const typeLabel = isPenalty ? 'PENALTY' : 'FREE KICK';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText(typeLabel, 960, by + 22);

    ctx.font = '500 13px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(this.flavorLine, 960, by + 50);

    ctx.restore();
  }

  _renderHalftimeBeat(ctx) {
    ctx.save();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 72px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillText('HALF TIME', 963, 363);

    ctx.font = '900 72px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.shadowColor = 'rgba(255,255,255,0.08)';
    ctx.shadowBlur = 30;
    ctx.fillText('HALF TIME', 960, 360);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 48px Outfit, sans-serif';
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(`${this.playerScore} - ${this.opponentScore}`, 960, 450);

    ctx.font = '500 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText('The second half is about to begin...', 960, 520);

    ctx.restore();
  }

  _renderFulltimeBeat(ctx) {
    ctx.save();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 72px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillText('FULL TIME', 963, 363);

    ctx.font = '900 72px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.shadowColor = 'rgba(255,255,255,0.08)';
    ctx.shadowBlur = 30;
    ctx.fillText('FULL TIME', 960, 360);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 48px Outfit, sans-serif';
    ctx.fillStyle = this.playerScore > this.opponentScore ? COLORS.green : (this.playerScore === this.opponentScore ? COLORS.gold : COLORS.red);
    ctx.fillText(`${this.playerScore} - ${this.opponentScore}`, 960, 450);

    const resultText = this.playerScore > this.opponentScore ? 'VICTORY!' : (this.playerScore === this.opponentScore ? 'DRAW' : 'DEFEAT');
    ctx.font = '600 22px Space Grotesk, monospace';
    ctx.fillStyle = this.playerScore > this.opponentScore ? COLORS.green : (this.playerScore === this.opponentScore ? COLORS.gold : COLORS.red);
    ctx.fillText(resultText, 960, 520);

    ctx.restore();
  }
}
