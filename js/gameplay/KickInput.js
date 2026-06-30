import { PHYSICS } from '../config.js';

const SMOOTHING_ALPHA = 0.3;
const MIN_DRAG_DIST = 15;
const TRAJECTORY_POINTS = 30;
const TRAJECTORY_DT = 0.025;
const GRAVITY = 400;

export class KickInput {
  constructor(canvas, ballX = PHYSICS.penaltySpotX, ballY = PHYSICS.penaltySpotY) {
    this.canvas = canvas;
    this.ballX = ballX;
    this.ballY = ballY;

    this.isDown = false;
    this.startLogicalX = 0;
    this.startLogicalY = 0;
    this.startTime = 0;
    this.currLogicalX = 0;
    this.currLogicalY = 0;
    this.smoothLogicalX = 0;
    this.smoothLogicalY = 0;

    this._onPreview = null;
    this._onKick = null;
    this.enabled = true;

    this._boundDown = (e) => this._down(e);
    this._boundMove = (e) => this._move(e);
    this._boundUp = (e) => this._up(e);

    this._init();
  }

  _init() {
    const c = this.canvas;
    c.style.touchAction = 'none';

    if (window.PointerEvent) {
      c.addEventListener('pointerdown', this._boundDown);
      window.addEventListener('pointermove', this._boundMove);
      window.addEventListener('pointerup', this._boundUp);
      window.addEventListener('pointercancel', this._boundUp);
    } else {
      c.addEventListener('mousedown', this._boundDown);
      window.addEventListener('mousemove', this._boundMove);
      window.addEventListener('mouseup', this._boundUp);
      c.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          e.preventDefault();
          const t = e.touches[0];
          this._down({ clientX: t.clientX, clientY: t.clientY, type: 'touchstart', preventDefault: () => {} });
        }
      }, { passive: false });
      window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0 && this.isDown) {
          const t = e.touches[0];
          this._move({ clientX: t.clientX, clientY: t.clientY, type: 'touchmove', preventDefault: () => e.preventDefault() });
        }
      });
      window.addEventListener('touchend', (e) => {
        if (e.changedTouches.length > 0 && this.isDown) {
          const t = e.changedTouches[0];
          this._up({ clientX: t.clientX, clientY: t.clientY, type: 'touchend' });
        }
      });
    }
  }

  destroy() {
    const c = this.canvas;
    c.style.touchAction = '';
    if (window.PointerEvent) {
      c.removeEventListener('pointerdown', this._boundDown);
      window.removeEventListener('pointermove', this._boundMove);
      window.removeEventListener('pointerup', this._boundUp);
      window.removeEventListener('pointercancel', this._boundUp);
    }
  }

  enable() { this.enabled = true; }
  disable() { this.enabled = false; this.isDown = false; }

  set onPreview(fn) { this._onPreview = fn; }
  get onPreview() { return this._onPreview; }

  set onKick(fn) { this._onKick = fn; }
  get onKick() { return this._onKick; }

  _clientToLogical(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (cx - rect.left) * (this.canvas.width / rect.width),
      y: (cy - rect.top) * (this.canvas.height / rect.height),
    };
  }

  _down(e) {
    if (!this.enabled) return;
    const p = this._clientToLogical(e.clientX, e.clientY);
    this.startLogicalX = p.x;
    this.startLogicalY = p.y;
    this.smoothLogicalX = p.x;
    this.smoothLogicalY = p.y;
    this.currLogicalX = p.x;
    this.currLogicalY = p.y;
    this.startTime = performance.now();
    this.isDown = true;
  }

  _move(e) {
    if (!this.isDown || !this.enabled) return;
    e.preventDefault();

    const p = this._clientToLogical(e.clientX, e.clientY);
    this.smoothLogicalX = SMOOTHING_ALPHA * p.x + (1 - SMOOTHING_ALPHA) * this.smoothLogicalX;
    this.smoothLogicalY = SMOOTHING_ALPHA * p.y + (1 - SMOOTHING_ALPHA) * this.smoothLogicalY;
    this.currLogicalX = this.smoothLogicalX;
    this.currLogicalY = this.smoothLogicalY;

    if (this._onPreview) {
      try {
        this._onPreview(this._computeInput());
      } catch (err) {
        console.error('[KickInput] preview error:', err);
      }
    }
  }

  _up(e) {
    if (!this.isDown || !this.enabled) return;
    this.isDown = false;

    let endX = e.clientX;
    let endY = e.clientY;
    if (e.type === 'pointercancel' || endX === 0 || endY === 0) {
      endX = this.currLogicalX;
      endY = this.currLogicalY;
    }
    const p = this._clientToLogical(endX, endY);
    this.currLogicalX = p.x;
    this.currLogicalY = p.y;

    const dx = this.currLogicalX - this.startLogicalX;
    const dy = this.currLogicalY - this.startLogicalY;
    if (Math.hypot(dx, dy) < MIN_DRAG_DIST) return;

    const input = this._computeInput();
    input.duration = (performance.now() - this.startTime) / 1000;
    console.log(input);
    if (this._onKick) {
      try {
        this._onKick(input);
      } catch (err) {
        console.error('[KickInput] kick error:', err);
      }
    }
  }

  _computeInput() {
    const dx = this.currLogicalX - this.startLogicalX;
    const dy = this.currLogicalY - this.startLogicalY;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const aimAngleX = Math.max(-1, Math.min(1, (dx / cw) * 2.5));

    const maxDrag = Math.hypot(cw, ch) * 0.35;
    const rawPower = Math.max(0, Math.min(1, Math.hypot(dx, dy) / maxDrag));
    const power = Math.pow(rawPower, 1.5);

    const curveInput = Math.max(-1, Math.min(1, (dx / cw) * 2.5));

    return { aimAngleX, power, curveInput };
  }

  predictTrajectory(input, numPoints = TRAJECTORY_POINTS) {
    const { aimAngleX, power, curveInput = 0 } = input;
    const speed = 1200 * power;
    const vx = aimAngleX * speed * 0.5 + curveInput * speed * 0.15;
    const vy = -speed;
    const points = [];
    let x = this.ballX;
    let y = this.ballY;
    let cvx = vx;
    let cvy = vy;

    for (let i = 0; i < numPoints; i++) {
      x += cvx * TRAJECTORY_DT;
      y += cvy * TRAJECTORY_DT;
      cvy += GRAVITY * TRAJECTORY_DT;
      points.push({ x, y });
      if (y > PHYSICS.penaltySpotY + 60) break;
    }
    return points;
  }

  getDragStart() {
    return { x: this.startLogicalX, y: this.startLogicalY };
  }
}
