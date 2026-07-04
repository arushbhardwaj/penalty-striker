import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PHYSICS } from './config.js';
import { AssetLoader, SoundManager } from './systems/audio.js';
import { InputManager } from './systems/input.js';
import { SaveManager } from './systems/save.js';
import { GameModeManager } from './gamemodes/GameModeManager.js';
import { drawRoundRect, drawGlowingText, renderBaseButton, isPointerOverButton } from './utils/helpers.js';
import { Ball } from './gameplay/ball.js';
import { renderHUD, renderPauseButton, createDefaultPauseBtn } from './ui/hud.js';

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

    this.stars = [];
    for (let i = 0; i < 30; i++) {
      this.stars.push({
        x: Math.random() * 1920,
        y: Math.random() * 200,
        size: Math.random() * 2 + 0.5,
        baseAlpha: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 2 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
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

    this.practiceResetBtn = { x: 960, y: 980, w: 180, h: 50, label: 'RESET', hovered: false };
  }

  enter(data) {
    this.ball.reset();

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

    const difficulty = data.difficulty || 'normal';
    const maxAttempts = data.maxAttempts !== undefined ? data.maxAttempts : 5;

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

    if (this.mode === 'practice') {
      this.practiceResetBtn.hovered = isPointerOverButton(p, this.practiceResetBtn);
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

    if (this.mode === 'practice' && p.isTapped && this.practiceResetBtn.hovered) {
      this.game.soundManager.playSound('click');
      this.resetPractice();
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
      const won = this.shotsScored >= this.goalsRequired;

      tm.recordMatchResult({
        score: this.shotsScored,
        attempts: this.shotsTaken,
        goalsRequired: this.goalsRequired,
      });

      setTimeout(() => {
        const isChampion = tm.currentRound >= (tm.currentTournament?.rounds?.length || 0);
        this.game.sceneManager.switchTo('TournamentResult', {
          won,
          stats: { score: this.shotsScored, attempts: this.shotsTaken },
          roundName: this.roundName,
          tournamentName: tm.currentTournament?.name || '',
          isChampion,
          goalsRequired: this.goalsRequired,
          rewardCoins: tm.currentTournament?.rewardCoins || 0,
          rewardXP: tm.currentTournament?.rewardXP || 0,
        });
      }, 600);
    }
  }

  handleQuickPlayShot() {
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
    } else {
      const maxAttempts = this.modeConfig?.maxAttempts || 5;
      renderHUD(ctx, this.shotsScored, maxAttempts, Math.max(1, this.currentStreak));
    }

    if (this.mode === 'tournament' && this.roundName) {
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
  }

  renderTournamentRoundInfo(ctx) {
    ctx.save();
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
    ctx.fillText('PRACTICE', 960, 56);

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
    ctx.save();
    const isHover = this.practiceResetBtn.hovered;
    ctx.shadowColor = isHover ? COLORS.purpleGlow : 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = isHover ? 20 : 5;
    ctx.fillStyle = isHover ? COLORS.purple : 'rgba(30, 41, 59, 0.7)';
    ctx.strokeStyle = isHover ? '#ffffff' : COLORS.border;
    ctx.lineWidth = isHover ? 2 : 1;
    ctx.beginPath();
    drawRoundRect(ctx, this.practiceResetBtn.x - this.practiceResetBtn.w / 2,
      this.practiceResetBtn.y - this.practiceResetBtn.h / 2,
      this.practiceResetBtn.w, this.practiceResetBtn.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.fillStyle = isHover ? '#0b0f19' : COLORS.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.practiceResetBtn.label, this.practiceResetBtn.x, this.practiceResetBtn.y);
    ctx.restore();
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

  renderStadiumBackground(ctx) {
    const horizon = 460;
    const time = performance.now() * 0.001;

    ctx.save();

    // Night sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon - 90);
    skyGrad.addColorStop(0, '#050a18');
    skyGrad.addColorStop(0.5, '#0a1030');
    skyGrad.addColorStop(1, '#121a3a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1920, horizon - 90);

    // Stars
    this.stars.forEach((s) => {
      const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase);
      ctx.globalAlpha = s.baseAlpha + twinkle * 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ====== STADIUM STRUCTURE ======

    // Main stand background
    const standGrad = ctx.createLinearGradient(0, horizon - 90, 0, horizon);
    standGrad.addColorStop(0, '#1a1a2e');
    standGrad.addColorStop(0.3, '#16213e');
    standGrad.addColorStop(0.7, '#1a1a30');
    standGrad.addColorStop(1, '#0f0f22');
    ctx.fillStyle = standGrad;
    ctx.fillRect(0, horizon - 90, 1920, 90);

    // Stadium concrete tiers
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const y = horizon - 88 + i * 14;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }

    // Roof structure
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, horizon - 108, 1920, 18);

    // Roof trusses
    ctx.strokeStyle = '#1a1a3a';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1920; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, horizon - 108);
      ctx.lineTo(x + 60, horizon - 90);
      ctx.stroke();
    }

    // Upper tier (second deck)
    ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
    ctx.fillRect(60, horizon - 110, 1800, 12);
    ctx.strokeStyle = 'rgba(40, 40, 70, 0.4)';
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

    // ====== FLOODLIGHTS ======

    // Left floodlight
    this.drawFloodlightPole(ctx, 120, horizon - 90);
    // Right floodlight
    this.drawFloodlightPole(ctx, 1800, horizon - 90);

    // Stadium glow (ambient light from pitch reflecting onto stands)
    const glow = ctx.createRadialGradient(960, horizon, 50, 960, horizon, 500);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.04)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - 110, 1920, 110);

    ctx.restore();
  }

  drawFloodlightPole(ctx, x, y) {
    ctx.save();

    // Light beam
    const beam = ctx.createRadialGradient(x, y, 5, x, y + 80, 200);
    beam.addColorStop(0, 'rgba(255, 255, 200, 0.08)');
    beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x + 20, y);
    ctx.lineTo(x + 150, y + 200);
    ctx.lineTo(x - 150, y + 200);
    ctx.closePath();
    ctx.fill();

    // Pole
    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 3, y, 6, 40);
    ctx.strokeRect(x - 3, y, 6, 40);

    // Light housing
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(x - 12, y - 6, 24, 8);

    const pulse = Math.sin(performance.now() * 0.003) * 0.2 + 0.8;
    ctx.shadowColor = '#ffffee';
    ctx.shadowBlur = 15 * pulse;
    ctx.fillStyle = '#ffffcc';
    ctx.beginPath();
    ctx.arc(x - 6, y - 2, 3, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderStadiumField(ctx) {
    const horizon = 460;
    ctx.save();

    // Deep rich pitch gradient
    const fieldGrad = ctx.createLinearGradient(960, horizon, 960, 1080);
    fieldGrad.addColorStop(0, '#145225');
    fieldGrad.addColorStop(0.3, '#1e7a3a');
    fieldGrad.addColorStop(0.7, '#186630');
    fieldGrad.addColorStop(1, '#0d4518');
    ctx.fillStyle = fieldGrad;
    ctx.fillRect(0, horizon, 1920, 1080 - horizon);

    // Subtle stripe pattern
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)';
      const segH = (1080 - horizon) / 16;
      ctx.fillRect(0, horizon + i * segH, 1920, segH);
    }

    // Field edge lines (bold)
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(280, horizon);
    ctx.lineTo(0, 1080);
    ctx.moveTo(1640, horizon);
    ctx.lineTo(1920, 1080);
    ctx.stroke();

    // Center line (bold)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(960, horizon);
    ctx.lineTo(960, 1080);
    ctx.stroke();

    // Center circle (bold)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(960, horizon, 220, 0, Math.PI, true);
    ctx.stroke();

    // ====== PENALTY AREA (bold) ======
    const penLeft = 660;
    const penRight = 1260;
    const penTop = horizon + 50;
    const penBottom = 730;

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'square';
    ctx.strokeRect(penLeft, penTop, penRight - penLeft, penBottom - penTop);

    // Six-yard box (inner box, bold)
    const sixYardLeft = 840;
    const sixYardRight = 1080;
    const sixYardTop = horizon + 50;
    const sixYardBottom = 640;
    ctx.strokeStyle = 'rgba(255,255,255,0.40)';
    ctx.lineWidth = 5;
    ctx.strokeRect(sixYardLeft, sixYardTop, sixYardRight - sixYardLeft, sixYardBottom - sixYardTop);

    // Penalty arc (bold)
    const arcR = 90;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(960, penBottom, arcR, 0, Math.PI, true);
    ctx.stroke();

    // Goal area arc (top of 6-yard box - small arc)
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(960, sixYardBottom, 40, 0, Math.PI, true);
    ctx.stroke();

    // Penalty spot (larger, bolder)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(PHYSICS.penaltySpotX, PHYSICS.penaltySpotY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center spot
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(960, horizon, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pitch glow (subtle floodlight illumination)
    const glow = ctx.createRadialGradient(960, 500, 50, 960, 500, 600);
    glow.addColorStop(0, 'rgba(255, 255, 200, 0.05)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon, 1920, 1080 - horizon);

    ctx.restore();
  }

  renderGoalPost(ctx) {
    const gx = PHYSICS.goalX;
    const gy = PHYSICS.goalY;
    const gw = PHYSICS.goalWidth;
    const gh = PHYSICS.goalHeight;

    ctx.save();

    // Net mesh (more visible)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
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
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(gx - gw / 2, gy - gh, gw, gh);

    // Goal posts (very bold white)
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255,255,255,0.2)';
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
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
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

    const shadowGrad = ctx.createRadialGradient(bx, by + r * 0.6, 2, bx, by + r * 0.6, r * 0.7);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(bx, by + r * 0.6, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const ballImg = this.game.loader.getImage('ball');
    if (ballImg) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
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
