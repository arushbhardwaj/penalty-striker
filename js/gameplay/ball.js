import { CANVAS_WIDTH, PHYSICS } from '../config.js';

export class Ball {
  constructor() {
    this.x = PHYSICS.penaltySpotX;
    this.y = PHYSICS.penaltySpotY;
    this.radius = PHYSICS.ballRadius;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.isMoving = false;
    this.isScored = false;
    this.isSaved = false;
    this.trail = [];
  }

  shoot(vx, vy) {
    this.vx = vx;
    this.vy = vy;
    this.isMoving = true;
    this.isScored = false;
    this.isSaved = false;
    this.trail = [];
  }

  update(dt) {
    if (!this.isMoving) return;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) this.trail.shift();

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 400 * dt;
    this.rotation += this.vx * dt * 0.05;

    if (this.y > PHYSICS.penaltySpotY + 50 || this.x < -200 || this.x > CANVAS_WIDTH + 200) {
      this.isMoving = false;
    }
  }

  render(ctx, image) {
    ctx.save();

    ctx.globalAlpha = 0.2;
    const shadowGrad = ctx.createRadialGradient(this.x, this.y + 40, 2, this.x, this.y + 40, 50);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y + 40, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (image) {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 8;
      ctx.drawImage(image, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  reset() {
    this.x = PHYSICS.penaltySpotX;
    this.y = PHYSICS.penaltySpotY;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.isMoving = false;
    this.isScored = false;
    this.isSaved = false;
    this.trail = [];
  }
}
