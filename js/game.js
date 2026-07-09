import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PHYSICS } from './config.js';
import { AssetLoader, SoundManager } from './systems/audio.js';
import { InputManager } from './systems/input.js';
import { SaveManager } from './systems/save.js';
import { GameModeManager } from './gamemodes/GameModeManager.js';
import { drawRoundRect, drawGlowingText, renderBaseButton, isPointerOverButton } from './utils/helpers.js';
import { Ball } from './gameplay/ball.js';
import { renderHUD, renderPauseButton, createDefaultPauseBtn } from './ui/hud.js';
import { QUICK_PLAY_CONFIG } from './data/quickPlayConfig.js';

export class Scene {
  constructor(game) {
    this.game = game;
  }
  enter(data) {}
  exit() {}
  update(dt) {}
  render(ctx) {}
}

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.scenes = new Map();
    this.currentScene = null;
    this.transitionAlpha = 0;
    this.transitionState = null;
    this.pendingSwitch = null;
  }

  add(name, sceneInstance) {
    this.scenes.set(name, sceneInstance);
  }

  switchTo(name, data = null) {
    const nextScene = this.scenes.get(name);
    if (!nextScene) {
      console.error(`[SceneManager] Scene "${name}" not found!`);
      return;
    }
    if (this.transitionState) return;
    this.pendingSwitch = { name, data };
    this.transitionState = 'fadeOut';
    this.transitionAlpha = 0;
  }

  update(dt) {
    if (this.transitionState === 'fadeOut') {
      this.transitionAlpha += dt * 4;
      if (this.transitionAlpha >= 1) {
        this.transitionAlpha = 1;
        if (this.currentScene) this.currentScene.exit();
        this.currentScene = this.scenes.get(this.pendingSwitch.name);
        this.currentScene.enter(this.pendingSwitch.data);
        this.transitionState = 'fadeIn';
      }
    } else if (this.transitionState === 'fadeIn') {
      this.transitionAlpha -= dt * 4;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this.transitionState = null;
        this.pendingSwitch = null;
      }
      if (this.currentScene) this.currentScene.update(dt);
    } else {
      if (this.currentScene) this.currentScene.update(dt);
    }
  }

  render(ctx) {
    if (this.currentScene) this.currentScene.render(ctx);
    if (this.transitionState && this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
      ctx.fillRect(0, 0, 1920, 1080);
    }
  }
}

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.loader = new AssetLoader();
    this.soundManager = new SoundManager();
    this.inputManager = new InputManager(this.canvas);
    this.sceneManager = new SceneManager(this);
    this.modeManager = new GameModeManager();

    this.lastTime = 0;
    this.fps = 0;
    this.isTabPaused = false;

    this.init();
  }

  init() {
    window.addEventListener('resize', () => this.onResize());
    this.onResize();

    document.addEventListener('visibilitychange', () => this.onVisibilityChange());

    requestAnimationFrame((time) => this.run(time));
  }

  registerScenes(scenes) {
    scenes.forEach(({ name, instance }) => this.sceneManager.add(name, instance));
  }

  start(sceneName) {
    this.sceneManager.switchTo(sceneName);
  }

  onResize() {
    console.log(`[Game] Layout Resized: ${window.innerWidth}x${window.innerHeight}`);
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.isTabPaused = true;
      if (this.sceneManager.currentScene && this.sceneManager.currentScene.constructor.name === 'GameplayScene') {
        this.sceneManager.switchTo('Pause', this.sceneManager.currentScene);
      }
    } else {
      this.isTabPaused = false;
      this.lastTime = performance.now();
    }
  }

  run(time) {
    if (this.isTabPaused) {
      requestAnimationFrame((t) => this.run(t));
      return;
    }

    if (!this.lastTime) this.lastTime = time;
    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (dt > 0.1) dt = 0.1;
    this.fps = Math.round(1 / dt);

    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.run(t));
  }

  update(dt) {
    this.sceneManager.update(dt);
    this.inputManager.clearFrameTriggers();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.sceneManager.render(this.ctx);
    this.renderDebugHUD();
  }

  renderDebugHUD() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    this.ctx.beginPath();
    drawRoundRect(this.ctx, 20, 20, 80, 30, 6);
    this.ctx.fill();

    this.ctx.font = 'bold 12px Space Grotesk, monospace';
    this.ctx.fillStyle = this.fps >= 55 ? COLORS.green : (this.fps >= 30 ? COLORS.gold : COLORS.red);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${this.fps} FPS`, 60, 35);
    this.ctx.restore();
  }
}

export class GameplayScene extends Scene {
  constructor(game) {
    super(game);
    this.pauseBtn = createDefaultPauseBtn();
    this.ball = new Ball();
    this.ballRadius = PHYSICS.ballRadius;
    this.mode = null;
    this.modeConfig = null;
    this.matchEnded = false;
    this.matchEndTimer = 0;
    this.swipePulse = 0;
    this.goalsRequired = 0;
    this.roundName = '';
    this.roundIndex = 0;
    this.totalRounds = 0;
    this.showResult = false;
    this.opponentScore = 0;
    this.matchIntroData = null;

    this.showingFlash = false;
    this.flashTimer = 0;
    this.flashScored = false;
    this.flashScoreline = '';

    this.clouds = [];
    for (let i = 0; i < 10; i++) {
      this.clouds.push({
        x: Math.random() * 2200 - 100,
        y: 30 + Math.random() * 280,
        w: 120 + Math.random() * 160,
        h: 28 + Math.random() * 32,
        speed: 0.03 + Math.random() * 0.08,
        alpha: 0.55 + Math.random() * 0.35,
        parts: Math.floor(4 + Math.random() * 3),
      });
    }

    this.crowd = [];
    const crowdColors = [
      '#e74c3c', '#c0392b',
      '#3498db', '#2980b9',
      '#f1c40f', '#f39c12',
      '#2ecc71', '#27ae60',
      '#9b59b6', '#8e44ad',
      '#e67e22', '#d35400',
      '#1abc9c', '#16a085',
      '#e91e63', '#c2185b',
      '#00bcd4', '#0097a7',
      '#ff5722', '#e64a19',
      '#8bc34a', '#689f38',
      '#ff9800', '#f57c00',
      '#795548', '#5d4037',
      '#607d8b', '#455a64',
    ];
    const rowCount = 7;
    const peoplePerRow = 45;
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < peoplePerRow; col++) {
        this.crowd.push({
          x: (col / peoplePerRow) * 1920 + (col - peoplePerRow / 2) * 0.3 + (Math.random() - 0.5) * 10,
          row,
          bodyColor: crowdColors[Math.floor(Math.random() * crowdColors.length)],
          bobPhase: Math.random() * Math.PI * 2,
          bobSpeed: 1 + Math.random() * 2,
          armRaised: Math.random() > 0.65,
          armPhase: Math.random() * Math.PI * 2,
          hasScarf: Math.random() > 0.6,
          scarfColor: crowdColors[Math.floor(Math.random() * crowdColors.length)],
        });
      }
    }

  }

  enter(data) {
    this.ball.reset();
    this.showingFlash = false;
    this.flashTimer = 0;
    this.flashScored = false;
    this.flashScoreline = '';

    if (!data) {
      if (this.mode) return;
      data = { mode: 'quickplay', difficulty: 'normal', maxAttempts: 5 };
    }

    this.matchEnded = false;
    this.matchEndTimer = 0;
    this.showResult = false;
    this.swipePulse = 0;

    this.modeConfig = data;
    this.mode = data.mode || 'quickplay';
    this.goalsRequired = data.goalsRequired || 999;
    this.roundName = data.roundName || '';
    this.roundIndex = data.roundIndex || 0;
    this.totalRounds = data.totalRounds || 0;
    this.opponentScore = data.opponentScore || 0;
    this.matchIntroData = data.matchIntroData || null;

    this.isEventFlow = data.matchFlow === 'event';
    this.eventType = data.eventType || null;

    const difficulty = data.difficulty || 'normal';
    const maxAttempts = this.isEventFlow ? 1 : (data.maxAttempts !== undefined ? data.maxAttempts : 5);

    this.shotsTaken = 0;
    this.shotsScored = 0;
    this.bestStreak = 0;
    this.currentStreak = 0;
    this.totalShotPower = 0;

    if (this.mode === 'quickplay') {
      this.modeInstance = this.game.modeManager.startQuickPlay({
        difficulty,
        matchLength: data.matchLength || 5,
      });
    } else if (this.mode === 'practice') {
      this.modeInstance = this.game.modeManager.startPractice({
        difficulty,
        practiceMode: data.practiceMode || 'penalty',
        windEnabled: data.practiceOptions?.windEnabled || false,
        shotTrailEnabled: data.practiceOptions?.shotTrailEnabled || false,
        targetZonesEnabled: data.practiceOptions?.targetZonesEnabled || false,
      });
    } else {
      this.modeInstance = null;
    }
  }

  update(dt) {
    const p = this.game.inputManager.pointer;
    this.swipePulse += 3.5 * dt;

    this.pauseBtn.hovered =
      Math.abs(p.x - this.pauseBtn.x) < this.pauseBtn.w / 2 &&
      Math.abs(p.y - this.pauseBtn.y) < this.pauseBtn.h / 2;

    if (this.showingFlash) {
      this.flashTimer += dt;
      if (this.flashTimer >= QUICK_PLAY_CONFIG.goalFlashDuration) {
        this.showingFlash = false;
        const state = this.game.quickPlayState;
        if (state.eventIndex >= state.events.length) {
          this.game.sceneManager.switchTo('MatchClock', { phase: 'fulltime' });
        } else {
          const prevHalf = state.events[state.eventIndex - 1].half;
          const nextHalf = state.events[state.eventIndex].half;
          if (prevHalf === 1 && nextHalf === 2) {
            this.game.sceneManager.switchTo('MatchClock', { phase: 'halftime' });
          } else {
            this.game.sceneManager.switchTo('MatchClock', {
              phase: 'clock',
              previousMinute: state.events[state.eventIndex - 1].minute,
            });
          }
        }
      }
      return;
    }

    if (this.matchEnded) {
      this.matchEndTimer += dt;
      return;
    }

    if (p.isTapped && this.pauseBtn.hovered) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('Pause', this);
      return;
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('Pause', this);
      return;
    }

    if (p.swipe.active) {
      this.processShot(p);
    }
  }

  processShot(p) {
    const isGoal = Math.abs(p.swipe.dx) < 250 && p.swipe.dy < -100;
    const shotPower = Math.min(100, Math.abs(p.swipe.vy) / 5);

    this.shotsTaken++;
    this.totalShotPower += shotPower;

    if (isGoal) {
      this.shotsScored++;
      this.currentStreak++;
      if (this.currentStreak > this.bestStreak) {
        this.bestStreak = this.currentStreak;
      }
      this.game.soundManager.playSound('goal');
    } else {
      this.currentStreak = 0;
      this.game.soundManager.playSound('miss');
    }

    if (this.mode === 'practice') {
      if (this.modeInstance) this.modeInstance.processShot(isGoal, shotPower);
      this.handlePracticeShot();
    } else if (this.mode === 'quickplay') {
      this.handleQuickPlayShot();
    } else if (this.mode === 'tournament') {
      this.handleTournamentShot();
    }
  }

  handleTournamentShot() {
    const maxAttempts = 5;
    if (this.shotsTaken >= maxAttempts) {
      this.matchEnded = true;
      this.matchEndTimer = 0;
      const tm = this.game.modeManager.tournament;
      const won = this.shotsScored > this.opponentScore;
      const drawn = this.shotsScored === this.opponentScore;

      const finalPlayerScore = drawn ? this.shotsScored + 1 : this.shotsScored;
      const finalOpponentScore = drawn ? this.opponentScore : this.opponentScore;

      tm.recordPlayerMatchResult(finalPlayerScore, finalOpponentScore);

      setTimeout(() => {
        this.game.sceneManager.switchTo('TournamentHub');
      }, 600);
    }
  }

  handleQuickPlayShot() {
    if (this.isEventFlow) {
      const state = this.game.quickPlayState;
      const scored = this.shotsScored > 0;
      if (scored) {
        state.playerScore++;
      }
      state.lastResult = { scored, scoreline: `${state.playerScore} - ${state.opponentScore}` };
      state.eventIndex++;

      this.flashScored = scored;
      this.flashScoreline = `${state.playerScore} - ${state.opponentScore}`;
      this.flashTimer = 0;
      this.showingFlash = true;
      return;
    }

    const maxAttempts = this.modeConfig?.maxAttempts;
    if (maxAttempts !== null && this.shotsTaken >= maxAttempts) {
      this.matchEnded = true;
      this.matchEndTimer = 0;

      const coinsEarned = this.shotsScored * 10 + this.bestStreak * 5;
      const accuracy = this.shotsTaken > 0 ? (this.shotsScored / this.shotsTaken) * 100 : 0;
      const avgPower = this.shotsTaken > 0 ? this.totalShotPower / this.shotsTaken : 0;

      const prevBest = SaveManager.load('penalty_quickplay_best', { score: 0, accuracy: 0 });
      const isNewBest = this.shotsScored > prevBest.score;
      if (isNewBest) {
        SaveManager.save('penalty_quickplay_best', { score: this.shotsScored, accuracy: Math.round(accuracy) });
      }

      this.game.sceneManager.switchTo('QuickPlayResult', {
        score: this.shotsScored,
        attempts: this.shotsTaken,
        accuracy: Math.round(accuracy),
        bestStreak: this.bestStreak,
        coinsEarned,
        avgPower: Math.round(avgPower),
        isNewBest,
        difficulty: this.modeConfig?.difficulty || 'normal',
      });
    }
  }

  handlePracticeShot() {
    this.ball.reset();
  }

  resetPractice() {
    this.shotsTaken = 0;
    this.shotsScored = 0;
    this.bestStreak = 0;
    this.currentStreak = 0;
    this.totalShotPower = 0;
    if (this.modeInstance) {
      this.modeInstance.resetPractice();
    }
    this.ball.reset();
  }

  render(ctx) {
    this.renderStadiumBackground(ctx);
    this.renderStadiumField(ctx);
    this.renderGoalPost(ctx);

    if (this.mode === 'practice') {
      this.renderPracticeHUD(ctx);
    } else if (this.mode === 'tournament') {
      const maxAttempts = this.modeConfig?.maxAttempts || 5;
      renderHUD(ctx, this.shotsScored, maxAttempts, Math.max(1, this.currentStreak));
      this.renderOpponentScore(ctx);
    } else {
      const maxAttempts = this.modeConfig?.maxAttempts || 5;
      renderHUD(ctx, this.shotsScored, maxAttempts, Math.max(1, this.currentStreak));
    }

    if (this.mode === 'tournament') {
      this.renderTournamentRoundInfo(ctx);
    }

    this.renderBall(ctx);
    renderPauseButton(ctx, this.pauseBtn);

    if (this.mode === 'practice') {
      this.renderPracticeUI(ctx);
    }

    if (this.shotsTaken === 0) {
      this.renderSwipeTutorial(ctx);
    }

    if (this.showingFlash) {
      this.renderGoalFlash(ctx);
    }
  }

  renderTournamentRoundInfo(ctx) {
    ctx.save();

    if (this.matchIntroData) {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      drawRoundRect(ctx, 80, 40, 320, 90, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px Space Grotesk, monospace';
      ctx.fillStyle = COLORS.purple;
      ctx.fillText('TOURNAMENT MATCH', 240, 56);

      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillStyle = COLORS.white;
      ctx.fillText(`${this.matchIntroData.playerTeamName} vs ${this.matchIntroData.opponentTeamName}`, 240, 80);

      ctx.font = '500 12px Space Grotesk, monospace';
      ctx.fillStyle = COLORS.slate;
      ctx.fillText(`${this.matchIntroData.stageName}`, 240, 106);

      if (this.opponentScore > 0) {
        ctx.textAlign = 'right';
        ctx.font = 'bold 12px Space Grotesk, monospace';
        ctx.fillStyle = COLORS.gold;
        ctx.fillText(`Opponent needs: ${this.opponentScore}`, 390, 106);
      }
    } else {
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      drawRoundRect(ctx, 80, 40, 280, 80, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px Space Grotesk, monospace';
      ctx.fillStyle = COLORS.purple;
      ctx.fillText('TOURNAMENT', 220, 64);

      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.fillStyle = COLORS.white;
      ctx.fillText(this.roundName, 220, 98);
    }

    ctx.restore();
  }

  renderPracticeHUD(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundRect(ctx, 780, 40, 360, 110, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    const modeLabel = this.modeInstance?.practiceMode === 'freekick' ? 'FREE KICK' : 'PENALTY PRACTICE';
    ctx.fillText(modeLabel, 960, 56);

    ctx.font = 'bold 26px Outfit, sans-serif';
    ctx.fillStyle = COLORS.white;
    ctx.fillText(`${this.shotsScored} / ${this.shotsTaken}`, 960, 88);

    const accuracy = this.shotsTaken > 0 ? Math.round((this.shotsScored / this.shotsTaken) * 100) : 0;
    ctx.font = '600 14px Space Grotesk, monospace';
    ctx.fillStyle = accuracy >= 70 ? COLORS.green : (accuracy >= 40 ? COLORS.gold : COLORS.red);
    ctx.fillText(`${accuracy}% ACCURACY`, 960, 120);

    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    drawRoundRect(ctx, 80, 40, 260, 110, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '500 13px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.slate;
    ctx.fillText(`Shots: ${this.shotsTaken}`, 100, 62);
    ctx.fillText(`Goals: ${this.shotsScored}`, 100, 82);
    ctx.fillText(`Misses: ${this.shotsTaken - this.shotsScored}`, 100, 102);
    ctx.fillText(`Best Streak: ${this.bestStreak}`, 100, 122);

    ctx.restore();
  }

  renderPracticeUI(ctx) {
  }

  renderSwipeTutorial(ctx) {
    ctx.save();
    const yOffset = Math.sin(this.swipePulse) * 30;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(960, 750 + yOffset);
    ctx.lineTo(960, 680 + yOffset);
    ctx.lineTo(945, 695 + yOffset);
    ctx.moveTo(960, 680 + yOffset);
    ctx.lineTo(975, 695 + yOffset);
    ctx.stroke();
    drawGlowingText(ctx, 'FLICK OR DRAG BALL UPWARDS TO SHOOT', 960, 960,
      'bold 16px Space Grotesk, monospace', COLORS.white, 'rgba(0,0,0,0.5)', 8);
    ctx.restore();
  }

  renderGoalFlash(ctx) {
    ctx.save();
    const progress = Math.min(1, this.flashTimer / QUICK_PLAY_CONFIG.goalFlashDuration);
    const alpha = progress < 0.15
      ? progress / 0.15
      : progress > 0.7
        ? 1 - (progress - 0.7) / 0.3
        : 1;

    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * alpha})`;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.flashScored) {
      ctx.font = '900 80px Outfit, sans-serif';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 40 * alpha;
      ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.fillText('GOAL!', 960, 420);

      ctx.shadowBlur = 0;
      ctx.font = 'bold 40px Outfit, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillText(this.flashScoreline, 960, 510);
    } else {
      ctx.font = '900 72px Outfit, sans-serif';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 30 * alpha;
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.fillText('MISSED', 960, 420);
    }

    ctx.restore();
  }

  renderOpponentScore(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundRect(ctx, 1160, 40, 260, 80, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.darkSlate;
    ctx.fillText('OPPONENT SCORE', 1290, 60);

    const needed = Math.max(0, this.opponentScore);
    const isBeaten = this.shotsTaken >= 5 && this.shotsScored > needed;
    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.fillStyle = isBeaten ? COLORS.green : COLORS.white;
    ctx.fillText(`Need ${needed} to beat`, 1290, 100);
    ctx.restore();
  }

  renderStadiumBackground(ctx) {
    const horizon = 460;
    const time = performance.now() * 0.001;

    ctx.save();

    // Bright daytime sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon - 90);
    skyGrad.addColorStop(0, '#6FBFFF');
    skyGrad.addColorStop(0.4, '#85CEFF');
    skyGrad.addColorStop(0.7, '#96D9FF');
    skyGrad.addColorStop(1, '#A8E4FF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1920, horizon - 90);

    // Sun in upper-left area (45-degree angle sunlight)
    const sunGrad = ctx.createRadialGradient(180, 80, 10, 180, 80, 350);
    sunGrad.addColorStop(0, 'rgba(255, 250, 230, 0.35)');
    sunGrad.addColorStop(0.3, 'rgba(255, 245, 215, 0.12)');
    sunGrad.addColorStop(1, 'rgba(255, 245, 215, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(180, 80, 350, 0, Math.PI * 2);
    ctx.fill();

    // Sun disk
    ctx.fillStyle = 'rgba(255, 250, 235, 0.5)';
    ctx.beginPath();
    ctx.arc(180, 80, 35, 0, Math.PI * 2);
    ctx.fill();

    // Soft clouds
    this.clouds.forEach((cloud) => {
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
      // Cloud shadow/bottom highlight
      ctx.fillStyle = 'rgba(200, 220, 240, 0.15)';
      ctx.beginPath();
      ctx.arc(cx + cloud.w * 0.05, cloud.y + cloud.h * 0.15, cloud.w * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ====== STADIUM STRUCTURE ======

    // Main stand background (daylight concrete colors)
    const standGrad = ctx.createLinearGradient(0, horizon - 90, 0, horizon);
    standGrad.addColorStop(0, '#B8C8DC');
    standGrad.addColorStop(0.3, '#C8D6E8');
    standGrad.addColorStop(0.7, '#C0D0E4');
    standGrad.addColorStop(1, '#A8B8CC');
    ctx.fillStyle = standGrad;
    ctx.fillRect(0, horizon - 90, 1920, 90);

    // Stadium concrete tiers
    ctx.strokeStyle = 'rgba(100, 120, 150, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const y = horizon - 88 + i * 14;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }

    // Roof structure
    ctx.fillStyle = '#8A9BB0';
    ctx.fillRect(0, horizon - 108, 1920, 18);

    // Roof trusses
    ctx.strokeStyle = '#7A8BA0';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1920; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, horizon - 108);
      ctx.lineTo(x + 60, horizon - 90);
      ctx.stroke();
    }

    // Upper tier (second deck)
    ctx.fillStyle = 'rgba(160, 180, 200, 0.5)';
    ctx.fillRect(60, horizon - 110, 1800, 12);
    ctx.strokeStyle = 'rgba(120, 140, 170, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, horizon - 110, 1800, 12);

    // ====== CROWD ======

    const rowHeight = 12;
    const personWidth = 12;
    const personHeight = 14;

    this.crowd.forEach((person) => {
      const { row, bodyColor, bobPhase, bobSpeed, armRaised, armPhase, hasScarf, scarfColor } = person;

      const rowY = horizon - 82 + row * rowHeight;
      const bob = Math.sin(time * bobSpeed + bobPhase) * 1.5;
      const y = rowY + bob;

      // Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(person.x - personWidth / 2, y - personHeight, personWidth, personHeight);

      // Head
      ctx.fillStyle = '#f5d6b8';
      ctx.beginPath();
      ctx.arc(person.x, y - personHeight - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#3d2b1f';
      ctx.beginPath();
      ctx.arc(person.x, y - personHeight - 5, 3, 0, Math.PI);
      ctx.fill();

      // Scarf
      if (hasScarf) {
        ctx.fillStyle = scarfColor;
        ctx.fillRect(person.x - 4, y - personHeight - 1, 8, 4);
        ctx.fillRect(person.x - 6, y - personHeight + 1, 3, 6);
        ctx.fillRect(person.x + 3, y - personHeight + 1, 3, 6);
      }

      // Raised arm
      if (armRaised) {
        const armWave = Math.sin(time * 3 + armPhase) * 3;
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(person.x + 4, y - personHeight + 3);
        ctx.lineTo(person.x + 10 + armWave, y - personHeight - 8);
        ctx.stroke();

        // Hand
        ctx.fillStyle = '#f5d6b8';
        ctx.beginPath();
        ctx.arc(person.x + 10 + armWave, y - personHeight - 9, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // ====== FLOODLIGHT POLES (structure only, no glow) ======

    this.drawFloodlightPole(ctx, 120, horizon - 90);
    this.drawFloodlightPole(ctx, 1800, horizon - 90);

    // Subtle warm sunlight ambient glow on stands
    const glow = ctx.createRadialGradient(180, 80, 30, 180, 80, 600);
    glow.addColorStop(0, 'rgba(255, 240, 200, 0.06)');
    glow.addColorStop(1, 'rgba(255, 240, 200, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - 110, 1920, 110);

    ctx.restore();
  }

  drawFloodlightPole(ctx, x, y) {
    ctx.save();

    // Pole (daytime - just structural, no beam or glow)
    ctx.fillStyle = '#8A9BB0';
    ctx.strokeStyle = '#7A8BA0';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 3, y, 6, 40);
    ctx.strokeRect(x - 3, y, 6, 40);

    // Light housing (off during daytime)
    ctx.fillStyle = '#6A7B90';
    ctx.fillRect(x - 12, y - 6, 24, 8);

    ctx.restore();
  }

  renderStadiumField(ctx) {
    const horizon = 460;
    ctx.save();

    // Bright daytime pitch gradient - rich green under sunlight
    const fieldGrad = ctx.createLinearGradient(960, horizon, 960, 1080);
    fieldGrad.addColorStop(0, '#2d8a4e');
    fieldGrad.addColorStop(0.25, '#3da55e');
    fieldGrad.addColorStop(0.6, '#32934e');
    fieldGrad.addColorStop(1, '#1e7338');
    ctx.fillStyle = fieldGrad;
    ctx.fillRect(0, horizon, 1920, 1080 - horizon);

    // Subtle stripe pattern
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.02)';
      const segH = (1080 - horizon) / 16;
      ctx.fillRect(0, horizon + i * segH, 1920, segH);
    }

    // Sunlight highlight on the field (soft diagonal wash from upper-left)
    const sunWash = ctx.createLinearGradient(0, horizon, 1920, 1080);
    sunWash.addColorStop(0, 'rgba(255, 240, 200, 0.04)');
    sunWash.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    sunWash.addColorStop(1, 'rgba(0, 0, 0, 0.02)');
    ctx.fillStyle = sunWash;
    ctx.fillRect(0, horizon, 1920, 1080 - horizon);

    // Field edge lines (bold)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(280, horizon);
    ctx.lineTo(0, 1080);
    ctx.moveTo(1640, horizon);
    ctx.lineTo(1920, 1080);
    ctx.stroke();

    // Center line (bold)
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(960, horizon);
    ctx.lineTo(960, 1080);
    ctx.stroke();

    // Center circle (bold)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(960, horizon, 220, 0, Math.PI, true);
    ctx.stroke();

    // ====== PENALTY AREA (bold) ======
    const penLeft = 660;
    const penRight = 1260;
    const penTop = horizon + 50;
    const penBottom = 730;

    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'square';
    ctx.strokeRect(penLeft, penTop, penRight - penLeft, penBottom - penTop);

    // Six-yard box (inner box, bold)
    const sixYardLeft = 840;
    const sixYardRight = 1080;
    const sixYardTop = horizon + 50;
    const sixYardBottom = 640;
    ctx.strokeStyle = 'rgba(255,255,255,0.50)';
    ctx.lineWidth = 5;
    ctx.strokeRect(sixYardLeft, sixYardTop, sixYardRight - sixYardLeft, sixYardBottom - sixYardTop);

    // Penalty arc (bold)
    const arcR = 90;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(960, penBottom, arcR, 0, Math.PI, true);
    ctx.stroke();

    // Goal area arc (top of 6-yard box - small arc)
    ctx.strokeStyle = 'rgba(255,255,255,0.30)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(960, sixYardBottom, 40, 0, Math.PI, true);
    ctx.stroke();

    // Penalty spot (larger, bolder)
    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.shadowColor = 'rgba(255,255,255,0.2)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(PHYSICS.penaltySpotX, PHYSICS.penaltySpotY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center spot
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(960, horizon, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderGoalPost(ctx) {
    const gx = PHYSICS.goalX;
    const gy = PHYSICS.goalY;
    const gw = PHYSICS.goalWidth;
    const gh = PHYSICS.goalHeight;

    ctx.save();

    // Net mesh (more visible in daylight)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.2;
    for (let col = gx - gw / 2; col <= gx + gw / 2; col += 16) {
      ctx.beginPath();
      ctx.moveTo(col, gy - gh);
      ctx.lineTo(col + (col - gx) * 0.06, gy);
      ctx.stroke();
    }
    for (let row = gy - gh; row <= gy; row += 16) {
      const scale = 1 + ((row - (gy - gh)) / gh) * 0.06;
      ctx.beginPath();
      ctx.moveTo(gx - (gw / 2) * scale, row);
      ctx.lineTo(gx + (gw / 2) * scale, row);
      ctx.stroke();
    }

    // Netting subtle fill
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(gx - gw / 2, gy - gh, gw, gh);

    // Goal posts (bright white with subtle shadow for depth)
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowOffsetY = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'square';
    ctx.beginPath();
    ctx.moveTo(gx - gw / 2, gy);
    ctx.lineTo(gx - gw / 2, gy - gh);
    ctx.lineTo(gx + gw / 2, gy - gh);
    ctx.lineTo(gx + gw / 2, gy);
    ctx.stroke();

    // Outer post outline (depth)
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx - gw / 2 - 20, gy);
    ctx.lineTo(gx - gw / 2 - 20, gy - gh - 20);
    ctx.lineTo(gx + gw / 2 + 20, gy - gh - 20);
    ctx.lineTo(gx + gw / 2 + 20, gy);
    ctx.stroke();

    ctx.restore();
  }

  renderBall(ctx) {
    const bx = this.ball.x;
    const by = this.ball.y;
    const r = this.ball.radius;

    ctx.save();

    const shadowGrad = ctx.createRadialGradient(bx + r * 0.2, by + r * 0.7, 2, bx + r * 0.2, by + r * 0.7, r * 0.75);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(bx + r * 0.2, by + r * 0.7, r * 0.7, r * 0.18, 0.15, 0, Math.PI * 2);
    ctx.fill();

    const ballImg = this.game.loader.getImage('ball');
    if (ballImg) {
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 6;
      ctx.drawImage(ballImg, bx - r, by - r, r * 2, r * 2);
    } else {
      const grad = ctx.createRadialGradient(bx - r * 0.25, by - r * 0.25, r * 0.1, bx, by, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#f0f0f0');
      grad.addColorStop(1, '#d0d0d0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.stroke();

      const pentR = r * 0.35;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = bx + Math.cos(angle) * pentR;
        const py = by + Math.sin(angle) * pentR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(angle) * pentR, by + Math.sin(angle) * pentR);
        ctx.lineTo(bx + Math.cos(angle) * r, by + Math.sin(angle) * r);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
