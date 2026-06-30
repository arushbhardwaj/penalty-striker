import { PHYSICS, CANVAS_WIDTH } from '../config.js';

export class Player {
  constructor() {
    this.x = PHYSICS.penaltySpotX;
    this.y = PHYSICS.penaltySpotY + 60;
    this.kickFrame = 0;
    this.isKicking = false;
  }

  triggerKick() {
    this.isKicking = true;
    this.kickFrame = 0;
  }

  update(dt) {
    if (this.isKicking) {
      this.kickFrame += dt * 8;
      if (this.kickFrame >= 1) {
        this.kickFrame = 0;
        this.isKicking = false;
      }
    }
  }

  render(ctx) {
    ctx.save();
    const legSwing = this.isKicking ? Math.sin(this.kickFrame * Math.PI) * 30 : 0;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y - 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - 10 - legSwing * 0.5, this.y - 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y - 65, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px Space Grotesk, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('YOU', this.x, this.y + 10);

    ctx.restore();
  }
}
