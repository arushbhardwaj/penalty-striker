import { PHYSICS } from '../config.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.keysPressed = new Set();

    this.pointer = {
      x: 0, y: 0, isDown: false,
      startX: 0, startY: 0, startTime: 0,
      isTapped: false,
      swipe: { active: false, dx: 0, dy: 0, vx: 0, vy: 0 },
    };

    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      const blockDefault = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
      if (blockDefault) e.preventDefault();
      if (!this.keys[e.code]) this.keysPressed.add(e.code);
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => this.onPointerUp(e.clientX, e.clientY));

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        this.onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    });
  }

  getLogicalCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  onPointerDown(clientX, clientY) {
    const coords = this.getLogicalCoords(clientX, clientY);
    this.pointer.isDown = true;
    this.pointer.startX = coords.x;
    this.pointer.startY = coords.y;
    this.pointer.x = coords.x;
    this.pointer.y = coords.y;
    this.pointer.startTime = performance.now();
    this.pointer.isTapped = false;
    this.pointer.swipe.active = false;
  }

  onPointerMove(clientX, clientY) {
    const coords = this.getLogicalCoords(clientX, clientY);
    this.pointer.x = coords.x;
    this.pointer.y = coords.y;
  }

  onPointerUp(clientX, clientY) {
    if (!this.pointer.isDown) return;
    const coords = this.getLogicalCoords(clientX, clientY);
    this.pointer.x = coords.x;
    this.pointer.y = coords.y;

    const dt = (performance.now() - this.pointer.startTime) / 1000;
    const dx = coords.x - this.pointer.startX;
    const dy = coords.y - this.pointer.startY;
    const dist = Math.hypot(dx, dy);

    if (dist > PHYSICS.swipeMinDist && dt < PHYSICS.swipeMaxTime) {
      this.pointer.swipe = { active: true, dx, dy, vx: dx / dt, vy: dy / dt };
    } else if (dist < PHYSICS.tapMaxDist) {
      this.pointer.isTapped = true;
    }

    this.pointer.isDown = false;
  }

  clearFrameTriggers() {
    this.keysPressed.clear();
    this.pointer.isTapped = false;
    this.pointer.swipe.active = false;
  }

  isKeyPressed(code) {
    return !!this.keys[code];
  }

  isKeyJustPressed(code) {
    return this.keysPressed.has(code);
  }
}
