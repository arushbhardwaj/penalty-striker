import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PHYSICS, STORAGE_KEYS } from './config.js';
import { AssetLoader, SoundManager } from './systems/audio.js';
import { InputManager } from './systems/input.js';
import { SaveManager } from './systems/save.js';
import { drawRoundRect } from './utils/helpers.js';
import { Ball } from './gameplay/ball.js';
import { Goalkeeper } from './gameplay/goalkeeper.js';
import { calculateShot, checkGoal, checkSave } from './gameplay/physics.js';
import { KickInput } from './gameplay/KickInput.js';
import { PowerMeter } from './gameplay/PowerMeter.js';
import { renderHUD, renderPauseButton, renderSwipeTutorial, createDefaultPauseBtn } from './ui/hud.js';

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
    this.score = 0;
    this.attempts = 0;
    this.multiplier = 1;
    this.swipePulse = 0;
    this.shotActive = false;
    this.shotTimer = 0;
    this.shotResult = null;
    this.ball = new Ball();
    this.goalkeeper = new Goalkeeper();
    this.goalBounds = {
      x: PHYSICS.goalX,
      y: PHYSICS.goalY,
      left: PHYSICS.goalX - PHYSICS.goalWidth / 2,
      right: PHYSICS.goalX + PHYSICS.goalWidth / 2,
      top: PHYSICS.goalY - PHYSICS.goalHeight,
      bottom: PHYSICS.goalY,
    };

    this.powerMeter = new PowerMeter();
    this.kickInput = new KickInput(game.canvas);
    this.trajectoryPoints = [];
    this._lastPreviewInput = null;

    this.kickInput.onKick = (input) => this._onKick(input);
    this.kickInput.onPreview = (input) => this._onPreview(input);
  }

  enter() {
    this.score = 0;
    this.attempts = 0;
    this.multiplier = 1;
    this.shotActive = false;
    this.shotTimer = 0;
    this.shotResult = null;
    this.ball.reset();
    this.goalkeeper.reset();
    this.powerMeter.reset();
    this.trajectoryPoints = [];
    this._lastPreviewInput = null;
    this.kickInput.enable();
  }

  update(dt) {
    const p = this.game.inputManager.pointer;

    this.swipePulse += 3.5 * dt;

    this.powerMeter.update(dt);

    if (this.kickInput.isDown && this._lastPreviewInput) {
      this.trajectoryPoints = this.kickInput.predictTrajectory({
        ...this._lastPreviewInput,
        power: this.powerMeter.getValue(),
      });
    }

    this.pauseBtn.hovered =
      Math.abs(p.x - this.pauseBtn.x) < this.pauseBtn.w / 2 &&
      Math.abs(p.y - this.pauseBtn.y) < this.pauseBtn.h / 2;

    if (p.isTapped) {
      if (this.pauseBtn.hovered) {
        this.game.soundManager.playSound('click');
        this.game.sceneManager.switchTo('Pause', this);
        return;
      }
      if (this.powerMeter.containsPoint(p.x, p.y)) {
        this.powerMeter.lock();
      }
    }

    if (this.game.inputManager.isKeyJustPressed('Escape')) {
      this.game.soundManager.playSound('click');
      this.game.sceneManager.switchTo('Pause', this);
      return;
    }

    if (this.shotActive) {
      this.shotTimer += dt;
      this.ball.update(dt);
      this.goalkeeper.update(dt);

      if (!this.ball.isMoving || this.ball.y < 100 || this.shotTimer > 3) {
        this.shotActive = false;
      }
      return;
    }
  }

  _onPreview(input) {
    this._lastPreviewInput = input;
    const effectivePower = this.powerMeter.getValue();
    this.trajectoryPoints = this.kickInput.predictTrajectory({
      ...input,
      power: effectivePower,
    });
  }

  _onKick(input) {
    if (this.shotActive) return;

    this.kickInput.disable();
    this.attempts++;

    if (!this.powerMeter.locked) {
      this.powerMeter.lock();
    }

    const shotInput = {
      aimAngleX: input.aimAngleX,
      power: this.powerMeter.getValue(),
      curveInput: input.curveInput,
    };

    const shot = calculateShot(shotInput);
    this.ball.shoot(shot.vx, shot.vy);
    this.goalkeeper.startDive(Math.sign(input.aimAngleX));
    this.shotActive = true;
    this.shotTimer = 0;
    this.trajectoryPoints = [];

    const goalX = this.ball.x + shot.vx * 0.3;
    const goalY = this.ball.y + shot.vy * 0.3;
    const isGoal = checkGoal(goalX, goalY);
    const isSaved = checkSave(goalX, goalY, this.goalkeeper.x, this.goalkeeper.y, this.goalkeeper.radius);

    if (isGoal && !isSaved) {
      this.score++;
      this.multiplier = Math.min(PHYSICS.maxMultiplier, this.multiplier + 1);
      this.shotResult = 'goal';
      this.game.soundManager.playSound('goal');
      this.ball.isScored = true;
    } else {
      this.multiplier = 1;
      this.shotResult = 'miss';
      this.game.soundManager.playSound('miss');
      if (isSaved) this.ball.isSaved = true;
    }

    if (this.attempts >= PHYSICS.maxAttempts) {
      setTimeout(() => this.endMatch(), 800);
      return;
    }

    setTimeout(() => {
      this.ball.reset();
      this.goalkeeper.reset();
      this.shotResult = null;
      this.shotActive = false;
      this.powerMeter.reset();
      this.trajectoryPoints = [];
      this._lastPreviewInput = null;
      this.kickInput.enable();
    }, 1500);
  }

  endMatch() {
    const currentHighScore = SaveManager.load(STORAGE_KEYS.highScore, 0);
    const finalPoints = this.score * PHYSICS.basePoints + (this.multiplier * PHYSICS.multiplierBonus);

    if (finalPoints > currentHighScore) {
      SaveManager.save(STORAGE_KEYS.highScore, finalPoints);
    }

    const prevPlayed = SaveManager.load(STORAGE_KEYS.matches, 0);
    SaveManager.save(STORAGE_KEYS.matches, prevPlayed + 1);

    this.game.sceneManager.switchTo('GameOver', {
      score: this.score,
      attempts: this.attempts,
      points: finalPoints,
      newRecord: finalPoints > currentHighScore,
    });
  }

  render(ctx) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 1920, 1080);

    this.renderStadiumField(ctx);
    this.renderGoalPost(ctx);
    renderHUD(ctx, this.score, this.attempts, this.multiplier);

    this.ball.render(ctx, this.game.loader.getImage('ball'));
    this.goalkeeper.render(ctx, this.game.loader.getImage('glove'));

    if (this.trajectoryPoints.length > 0) {
      this._renderTrajectoryPreview(ctx);
    }

    this.powerMeter.render(ctx);

    if (this.attempts === 0 && !this.shotActive) {
      renderSwipeTutorial(ctx, this.swipePulse);
    }

    renderPauseButton(ctx, this.pauseBtn);
  }

  _renderTrajectoryPreview(ctx) {
    const pts = this.trajectoryPoints;
    if (pts.length < 2) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    pts.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  renderStadiumField(ctx) {
    const horizon = 460;
    ctx.save();

    const fieldGrad = ctx.createLinearGradient(960, horizon, 960, 1080);
    fieldGrad.addColorStop(0, '#092915');
    fieldGrad.addColorStop(0.6, PHYSICS.fieldLight);
    fieldGrad.addColorStop(1, '#0a3617');
    ctx.fillStyle = fieldGrad;
    ctx.beginPath();
    ctx.moveTo(350, horizon);
    ctx.lineTo(1570, horizon);
    ctx.lineTo(1920, 1080);
    ctx.lineTo(0, 1080);
    ctx.closePath();
    ctx.fill();

    const glow = ctx.createRadialGradient(960, horizon, 100, 960, horizon, 700);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(600, horizon);
    ctx.lineTo(480, horizon + 150);
    ctx.lineTo(1440, horizon + 150);
    ctx.lineTo(1320, horizon);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(PHYSICS.penaltySpotX, PHYSICS.penaltySpotY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderGoalPost(ctx) {
    const gx = this.goalBounds.x;
    const gy = this.goalBounds.y;
    const gw = PHYSICS.goalWidth;
    const gh = PHYSICS.goalHeight;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let col = gx - gw / 2; col <= gx + gw / 2; col += 20) {
      ctx.moveTo(col, gy - gh);
      ctx.lineTo(col + (col - gx) * 0.05, gy);
    }
    for (let row = gy - gh; row <= gy; row += 20) {
      const scale = 1.0 + ((row - (gy - gh)) / gh) * 0.05;
      ctx.moveTo(gx - (gw / 2) * scale, row);
      ctx.lineTo(gx + (gw / 2) * scale, row);
    }
    ctx.stroke();

    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 10;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(gx - gw / 2, gy);
    ctx.lineTo(gx - gw / 2, gy - gh);
    ctx.lineTo(gx + gw / 2, gy - gh);
    ctx.lineTo(gx + gw / 2, gy);
    ctx.stroke();

    ctx.restore();
  }
}
