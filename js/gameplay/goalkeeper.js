import { PHYSICS } from '../config.js';

export class Goalkeeper {
  constructor() {
    this.baseX = PHYSICS.goalX;
    this.baseY = PHYSICS.goalY - PHYSICS.goalHeight + 80;
    this.x = this.baseX;
    this.y = this.baseY;
    this.radius = 45;
    this.diveOffset = 0;
    this.diveTarget = 0;
    this.diveSpeed = 0;
    this.isDiving = false;
    this.returnSpeed = 3;
    this.patrolRange = 160;
    this.patrolSpeed = 1.2;
    this.patrolDir = 1;
    this.animationTime = 0;
  }

  update(dt) {
    this.animationTime += dt;

    if (this.isDiving) {
      this.diveOffset += (this.diveTarget - this.diveOffset) * dt * this.diveSpeed;
      if (Math.abs(this.diveOffset - this.diveTarget) < 5) {
        this.isDiving = false;
      }
    } else {
      this.diveOffset += (0 - this.diveOffset) * dt * this.returnSpeed;
      this.patrolDir = Math.sin(this.animationTime * this.patrolSpeed);
      this.diveOffset += this.patrolDir * dt * 20;
    }

    this.x = this.baseX + Math.max(-this.patrolRange, Math.min(this.patrolRange, this.diveOffset));
  }

  render(ctx, image) {
    ctx.save();
    const pulse = Math.sin(this.animationTime * 0.003) * 140;

    if (image) {
      ctx.drawImage(image, this.x - 40 + pulse, this.y - 80, 80, 80);
      ctx.drawImage(image, this.x - 120 + pulse, this.y - 60, 80, 80);
    } else {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(this.x + pulse, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  startDive(direction) {
    this.isDiving = true;
    this.diveTarget = direction * 200;
    this.diveSpeed = 8;
  }

  reset() {
    this.x = this.baseX;
    this.y = this.baseY;
    this.diveOffset = 0;
    this.isDiving = false;
    this.animationTime = 0;
  }
}
