export class PowerMeter {
  constructor(options = {}) {
    this.frequency = options.frequency !== undefined ? options.frequency : 1.5;
    this.sweetSpot = options.sweetSpot || { center: 0.65, width: 0.14 };
    this.overshootThreshold = options.overshootThreshold !== undefined ? options.overshootThreshold : 1.0;
    this.maxValue = options.maxValue !== undefined ? options.maxValue : 1.2;
    this.barRect = options.barRect || { x: 1780, y: 200, w: 50, h: 380 };

    this.value = 0;
    this.locked = false;
    this.lockedValue = 0;
    this.time = 0;
    this.onLock = null;
  }

  reset() {
    this.value = 0;
    this.locked = false;
    this.lockedValue = 0;
    this.time = 0;
  }

  lock() {
    if (this.locked) return;
    this.locked = true;
    this.lockedValue = this.value;
    if (this.onLock) this.onLock(this.lockedValue);
  }

  update(dt) {
    if (this.locked) return;
    this.time += dt;
    const raw = 0.5 + 0.5 * Math.sin(this.time * 2 * Math.PI * this.frequency);
    this.value = raw * this.maxValue;
  }

  getValue() {
    return this.locked ? this.lockedValue : this.value;
  }

  isInSweetSpot() {
    const v = this.getValue();
    return Math.abs(v - this.sweetSpot.center) < this.sweetSpot.width / 2;
  }

  isOvershoot() {
    return this.getValue() > this.overshootThreshold;
  }

  containsPoint(x, y) {
    const r = this.barRect;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  render(ctx) {
    const r = this.barRect;
    const val = this.getValue();
    const fillRatio = Math.min(1, val / this.maxValue);
    const fillH = fillRatio * r.h;

    const sweetY = r.y + r.h - (this.sweetSpot.center / this.maxValue) * r.h;
    const sweetH = (this.sweetSpot.width / this.maxValue) * r.h;
    const overshootY = r.y + r.h - (this.overshootThreshold / this.maxValue) * r.h;

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(239,68,68,0.12)';
    ctx.fillRect(r.x + 2, r.y, r.w - 4, overshootY - r.y);

    ctx.strokeStyle = 'rgba(239,68,68,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(r.x + 2, overshootY);
    ctx.lineTo(r.x + r.w - 2, overshootY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = this.isInSweetSpot() ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.08)';
    ctx.fillRect(r.x + 2, sweetY - sweetH / 2, r.w - 4, sweetH);

    if (fillH > 1) {
      const fillY = r.y + r.h - fillH;
      const grad = ctx.createLinearGradient(r.x, r.y + r.h, r.x, r.y);
      if (this.isOvershoot()) {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#b91c1c');
      } else if (this.isInSweetSpot()) {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#047857');
      } else {
        grad.addColorStop(0, '#0ea5e9');
        grad.addColorStop(1, '#0369a1');
      }
      ctx.fillStyle = grad;
      this._roundRect(ctx, r.x + 2, fillY, r.w - 4, Math.max(4, fillH - 2), 4);
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Space Grotesk, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('PWR', r.x + r.w / 2, r.y - 8);

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
