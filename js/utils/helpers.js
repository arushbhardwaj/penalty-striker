import { COLORS } from '../config.js';

export function drawRoundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

export function drawGlowingText(ctx, text, x, y, font, color, glowColor, glowRadius = 15, align = 'center') {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowRadius;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function createButtonTemplate(x, y, w, h, label) {
  return { x, y, w, h, label, hovered: false };
}

export function isPointerOverButton(pointer, btn) {
  return (
    Math.abs(pointer.x - btn.x) < btn.w / 2 &&
    Math.abs(pointer.y - btn.y) < btn.h / 2
  );
}

export function renderBaseButton(ctx, btn, color, hoverColor) {
  ctx.save();
  const isHover = btn.hovered;
  ctx.shadowColor = isHover ? color : 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = isHover ? 20 : 5;
  ctx.fillStyle = isHover ? color : 'rgba(30, 41, 59, 0.6)';
  ctx.strokeStyle = isHover ? '#ffffff' : COLORS.border;
  ctx.lineWidth = isHover ? 2 : 1;
  ctx.beginPath();
  drawRoundRect(ctx, btn.x - btn.w / 2, btn.y - btn.h / 2, btn.w, btn.h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = 'bold 20px Outfit, sans-serif';
  ctx.fillStyle = isHover ? '#0b0f19' : '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.label, btn.x, btn.y);
  ctx.restore();
}
