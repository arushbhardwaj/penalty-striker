import { drawRoundRect, drawGlowingText } from '../utils/helpers.js';
import { COLORS } from '../config.js';

export function renderHUD(ctx, score, attempts, multiplier) {
  ctx.save();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundRect(ctx, 800, 40, 320, 80, 16);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px Space Grotesk, monospace';
  ctx.fillStyle = COLORS.slate;
  ctx.fillText('MATCH PENALTIES', 960, 60);

  ctx.font = 'bold 32px Outfit, sans-serif';
  ctx.fillStyle = COLORS.white;
  ctx.fillText(`${score} / ${attempts}`, 960, 95);

  if (multiplier > 1) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    drawRoundRect(ctx, 700, 50, 80, 60, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px Space Grotesk, monospace';
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(`x${multiplier}`, 740, 80);
  }

  ctx.restore();
}

export function renderPauseButton(ctx, btn) {
  ctx.save();
  ctx.fillStyle = btn.hovered ? 'rgba(255,255,255,0.1)' : 'rgba(15, 23, 42, 0.6)';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.white;
  ctx.fillRect(btn.x - 8, btn.y - 12, 5, 24);
  ctx.fillRect(btn.x + 3, btn.y - 12, 5, 24);
  ctx.restore();
}

export function renderSwipeTutorial(ctx, pulse) {
  ctx.save();
  const yOffset = Math.sin(pulse) * 30;

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

export function createDefaultPauseBtn() {
  return { x: 1840, y: 80, w: 60, h: 60, hovered: false };
}
