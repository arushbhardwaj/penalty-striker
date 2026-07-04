import { Scene } from '../game.js';
import { COLORS } from '../config.js';
import { TOURNAMENTS } from '../gamemodes/TournamentConfig.js';
import { drawRoundRect, drawGlowingText, isPointerOverButton } from '../utils/helpers.js';

export class TournamentMenuScene extends Scene {
  constructor(game) {
    super(game);
    this.backBtn = { x: 120, y: 80, w: 140, h: 56, label: '← BACK', hovered: false };
    this.resumeBtn = { x: 960, y: 920, w: 300, h: 56, label: 'RESUME TOURNAMENT', hovered: false };
    this.tournamentCards = [];
    this.scrollOffset = 0;
    this.entranceTimer = 0;
    this.entranceDuration = 0.6;
  }

  enter() {
    this.entranceTimer = 0;
    this.buildCards();
  }

  buildCards() {
    const tm = this.game.modeManager.tournament;
    this.tournamentCards = TOURNAMENTS.map((t, i) => {
      const unlocked = tm.isUnlocked(t);
      const completed = tm.isTournamentCompleted(t.id);
      return {
        ...t,
        index: i,
        unlocked,
        completed,
        hovered: false,
        y: 280 + i * 130,
      };
    });
  }

  update(dt) {
    if (this.entranceTimer < this.entranceDuration) {
      this.entranceTimer = Math.min(this.entranceTimer + dt, this.entranceDuration);
    }
    const p = this.game.inputManager.pointer;
    const tm = this.game.modeManager.tournament;

    this.backBtn.hovered = isPointerOverButton(p, this.backBtn);
    this.resumeBtn.hovered = isPointerOverButton(p, this.resumeBtn) && tm.canContinue();

    this.tournamentCards.forEach(card => {
      if (!card.unlocked) return;
      card.hovered = isPointerOverButton(p, {
        x: 960, y: card.y, w: 700, h: 100,
      });
    });

    if (p.isTapped) {
      if (this.backBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('MainMenu');
        return;
      }
      if (this.resumeBtn.hovered && tm.canContinue()) {
        this.game.soundManager.playSound('click');
        this.startTournamentMatch();
        return;
      }
      for (const card of this.tournamentCards) {
        if (!card.unlocked || card.completed) continue;
        const isOver = isPointerOverButton(p, { x: 960, y: card.y, w: 700, h: 100 });
        if (isOver) {
          this.game.soundManager.playSound('click');
          tm.startTournament(card);
          this.startTournamentMatch();
          return;
        }
      }
    }
    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.sceneManager.switchTo('MainMenu');
    }
  }

  startTournamentMatch() {
    const tm = this.game.modeManager.tournament;
    const difficulty = tm.getRoundDifficulty();
    const goalsRequired = tm.getGoalsRequired();
    this.game.sceneManager.switchTo('Gameplay', {
      mode: 'tournament',
      difficulty,
      maxAttempts: 5,
      goalsRequired,
      roundName: tm.getCurrentRoundName(),
      roundIndex: tm.currentRound,
      totalRounds: tm.currentTournament.rounds.length,
    });
  }

  render(ctx) {
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, 1920, 1080);
    this.renderBackground(ctx);
    this.renderTitle(ctx);
    this.renderCards(ctx);
    this.renderFooter(ctx);
    this.renderResumeButton(ctx);
    this.renderBackButton(ctx);
  }

  renderBackground(ctx) {
    const grad = ctx.createRadialGradient(960, 400, 50, 960, 400, 700);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const x = i * 100;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 200, 1080);
      ctx.stroke();
    }
  }

  renderTitle(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    const ease = 1 - Math.pow(1 - progress, 3);
    ctx.save();
    ctx.globalAlpha = ease;
    drawGlowingText(ctx, '🏆 TOURNAMENTS', 960, 160,
      '900 56px Outfit, sans-serif', COLORS.white, COLORS.purpleGlow, 20);

    const tm = this.game.modeManager.tournament;
    ctx.font = '500 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.textAlign = 'center';
    ctx.fillText(`Trophies: ${tm.trophiesUnlocked}  •  Coins: ${tm.totalCoins}  •  XP: ${tm.totalXP}`, 960, 210);
    ctx.restore();
  }

  renderCards(ctx) {
    const progress = Math.min(1, this.entranceTimer / this.entranceDuration);
    this.tournamentCards.forEach((card, i) => {
      const cardDelay = 0.1 + i * 0.08;
      const cardProgress = Math.max(0, Math.min(1, (progress - cardDelay) / 0.3));
      const ease = 1 - Math.pow(1 - cardProgress, 3);
      if (ease <= 0) return;

      ctx.save();
      ctx.globalAlpha = ease;
      const y = card.y;

      if (card.completed) {
        ctx.fillStyle = 'rgba(17, 24, 39, 0.5)';
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 1.5;
      } else if (card.unlocked) {
        const isHover = card.hovered;
        ctx.fillStyle = isHover ? 'rgba(17, 24, 39, 0.95)' : 'rgba(17, 24, 39, 0.8)';
        ctx.strokeStyle = isHover ? COLORS.purple : COLORS.border;
        ctx.lineWidth = isHover ? 2 : 1.5;
      } else {
        ctx.fillStyle = 'rgba(10, 14, 23, 0.7)';
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      drawRoundRect(ctx, 610, y - 50, 700, 100, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.font = '32px sans-serif';
      ctx.fillText(card.icon, 640, y);

      ctx.font = '800 24px Outfit, sans-serif';
      ctx.fillStyle = card.completed ? COLORS.green : (card.unlocked ? COLORS.white : 'rgba(148, 163, 184, 0.4)');
      ctx.fillText(card.name, 700, y - 12);

      ctx.font = '500 14px Space Grotesk, monospace';
      ctx.fillStyle = card.unlocked ? COLORS.darkSlate : 'rgba(148, 163, 184, 0.3)';
      ctx.fillText(card.description, 700, y + 18);

      if (!card.unlocked) {
        ctx.font = '500 14px Space Grotesk, monospace';
        ctx.fillStyle = COLORS.gold;
        ctx.textAlign = 'right';
        ctx.fillText(`🔒 Need ${card.requiredTrophies} trophy(ies)`, 1280, y);
      } else if (card.completed) {
        ctx.font = '500 14px Space Grotesk, monospace';
        ctx.fillStyle = COLORS.green;
        ctx.textAlign = 'right';
        ctx.fillText('✅ COMPLETED', 1280, y);
      } else {
        ctx.font = '600 14px Space Grotesk, monospace';
        ctx.fillStyle = COLORS.purple;
        ctx.textAlign = 'right';
        ctx.fillText(`${card.rewardCoins} 🪙  ${card.rewardXP} ⚡`, 1280, y);
      }

      ctx.restore();
    });
  }

  renderResumeButton(ctx) {
    const tm = this.game.modeManager.tournament;
    if (!tm.canContinue()) return;
    ctx.save();
    const isHover = this.resumeBtn.hovered;
    ctx.shadowColor = COLORS.purpleGlow;
    ctx.shadowBlur = isHover ? 20 : 5;
    ctx.fillStyle = isHover ? COLORS.purple : 'rgba(30, 41, 59, 0.6)';
    ctx.strokeStyle = isHover ? '#ffffff' : COLORS.border;
    ctx.lineWidth = isHover ? 2 : 1;
    ctx.beginPath();
    drawRoundRect(ctx, this.resumeBtn.x - this.resumeBtn.w / 2, this.resumeBtn.y - this.resumeBtn.h / 2,
      this.resumeBtn.w, this.resumeBtn.h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = isHover ? '#0b0f19' : COLORS.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.resumeBtn.label, this.resumeBtn.x, this.resumeBtn.y);
    ctx.restore();
  }

  renderFooter(ctx) {
    ctx.save();
    ctx.font = '500 12px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.textAlign = 'center';
    ctx.fillText('SELECT A TOURNAMENT TO BEGIN', 960, 1050);
    ctx.restore();
  }

  renderBackButton(ctx) {
    ctx.save();
    const isHover = this.backBtn.hovered;
    ctx.fillStyle = isHover ? 'rgba(255,255,255,0.1)' : 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundRect(ctx, this.backBtn.x - this.backBtn.w / 2, this.backBtn.y - this.backBtn.h / 2,
      this.backBtn.w, this.backBtn.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.backBtn.label, this.backBtn.x, this.backBtn.y);
    ctx.restore();
  }
}

export class TournamentResultScene extends Scene {
  constructor(game) {
    super(game);
    this.continueBtn = { x: 960, y: 800, w: 320, h: 64, label: 'NEXT ROUND', hovered: false };
    this.menuBtn = { x: 960, y: 890, w: 320, h: 64, label: 'TOURNAMENTS', hovered: false };
    this.result = null;
    this.entranceTimer = 0;
  }

  enter(data) {
    this.result = data || { won: false, stats: {}, roundName: '', tournamentName: '', isChampion: false };
    this.entranceTimer = 0;
    if (this.result.won && !this.result.isChampion) {
      this.continueBtn.label = 'NEXT ROUND →';
    } else if (this.result.isChampion) {
      this.continueBtn.label = '🎉 CHAMPION!';
    } else {
      this.continueBtn.label = 'TRY AGAIN';
    }
  }

  update(dt) {
    this.entranceTimer = Math.min(this.entranceTimer + dt, 1);
    const p = this.game.inputManager.pointer;
    this.continueBtn.hovered = Math.abs(p.x - this.continueBtn.x) < this.continueBtn.w / 2
      && Math.abs(p.y - this.continueBtn.y) < this.continueBtn.h / 2;
    this.menuBtn.hovered = Math.abs(p.x - this.menuBtn.x) < this.menuBtn.w / 2
      && Math.abs(p.y - this.menuBtn.y) < this.menuBtn.h / 2;

    if (p.isTapped) {
      if (this.continueBtn.hovered) {
        this.game.soundManager.playSound('click');
        if (this.result.won && !this.result.isChampion) {
          const tm = this.game.modeManager.tournament;
          const difficulty = tm.getRoundDifficulty();
          const goalsRequired = tm.getGoalsRequired();
          this.game.sceneManager.switchTo('Gameplay', {
            mode: 'tournament',
            difficulty,
            maxAttempts: 5,
            goalsRequired,
            roundName: tm.getCurrentRoundName(),
            roundIndex: tm.currentRound,
            totalRounds: tm.currentTournament.rounds.length,
          });
        } else {
          this.game.sceneManager.switchTo('TournamentMenu');
        }
        return;
      }
      if (this.menuBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('TournamentMenu');
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, 1920, 1080);

    const progress = Math.min(1, this.entranceTimer / 0.8);

    if (this.result.isChampion) this.renderConfetti(ctx);

    ctx.save();
    ctx.globalAlpha = progress;

    const glowColor = this.result.won ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
    const glow = ctx.createRadialGradient(960, 400, 10, 960, 400, 500);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
    ctx.strokeStyle = this.result.won ? COLORS.green : COLORS.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    drawRoundRect(ctx, 720, 200, 480, 420, 24);
    ctx.fill();
    ctx.stroke();

    if (this.result.isChampion) {
      drawGlowingText(ctx, '🏆 CHAMPION! 🏆', 960, 260,
        '900 40px Outfit, sans-serif', COLORS.gold, 'rgba(245, 158, 11, 0.4)', 25);
      drawGlowingText(ctx, this.result.tournamentName, 960, 310,
        '600 24px Outfit, sans-serif', COLORS.white, 'transparent', 0);
    } else if (this.result.won) {
      drawGlowingText(ctx, '✅ ROUND WON!', 960, 270,
        '900 40px Outfit, sans-serif', COLORS.green, COLORS.greenGlow, 15);
    } else {
      drawGlowingText(ctx, '❌ ELIMINATED', 960, 270,
        '900 40px Outfit, sans-serif', COLORS.red, 'rgba(239, 68, 68, 0.3)', 15);
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '500 20px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(this.result.roundName, 960, 380);

    ctx.font = 'bold 48px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(`${this.result.stats.score || 0} / ${this.result.stats.attempts || 0}`, 960, 440);

    ctx.font = '500 18px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.fillText(`Goals Required: ${this.result.goalsRequired || 0}`, 960, 490);

    if (this.result.won && !this.result.isChampion) {
      ctx.fillStyle = COLORS.green;
      ctx.fillText(`+${this.result.rewardCoins || 0} 🪙  +${this.result.rewardXP || 0} ⚡`, 960, 530);
    }

    ctx.restore();

    this.renderButton(ctx, this.continueBtn,
      this.result.isChampion ? COLORS.gold : (this.result.won ? COLORS.green : COLORS.purple));
    this.renderButton(ctx, this.menuBtn, '#475569');

    ctx.restore();
  }

  renderButton(ctx, btn, color) {
    ctx.save();
    const isHover = btn.hovered;
    ctx.shadowColor = isHover ? color : 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = isHover ? 20 : 5;
    ctx.fillStyle = isHover ? color : 'rgba(30, 41, 59, 0.6)';
    ctx.strokeStyle = isHover ? '#ffffff' : COLORS.border;
    ctx.lineWidth = isHover ? 2 : 1;
    ctx.beginPath();
    drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillStyle = isHover ? '#0b0f19' : COLORS.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x, btn.y);
    ctx.restore();
  }

  renderConfetti(ctx) {
    ctx.save();
    const time = performance.now() * 0.001;
    const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ef4444', '#ec4899'];
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(time + i * 1.7) * 0.5 + 0.5) * 1920;
      const y = ((Math.sin(time * 1.3 + i * 2.3) * 0.5 + 0.5) * 600) + 100;
      const size = 6 + Math.sin(i) * 3;
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.7 + Math.sin(time * 2 + i) * 0.3;
      ctx.fillRect(x, y, size, size * 0.6);
    }
    ctx.restore();
  }
}
