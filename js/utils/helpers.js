import { COLORS } from '../config.js';

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const clamped = Math.max(0, Math.min(255, Math.round(x)));
    return clamped.toString(16).padStart(2, '0');
  }).join('');
}

function darkenColor(hex, factor) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - factor), rgb.g * (1 - factor), rgb.b * (1 - factor));
}

function lightenColor(hex, factor) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * factor,
    rgb.g + (255 - rgb.g) * factor,
    rgb.b + (255 - rgb.b) * factor
  );
}

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

export function renderBaseButton(ctx, btn, color) {
  ctx.save();
  const isHover = btn.hovered;
  const r = 16;
  const depth = 5;
  const outlineW = 3;

  const depthColor = darkenColor(color, 0.25);
  const outlineColor = darkenColor(color, 0.5);

  const x = btn.x - btn.w / 2;
  const y = btn.y - btn.h / 2;
  const cx = btn.x;
  const cy = btn.y;

  // Slight scale on hover
  if (isHover) {
    ctx.translate(cx, cy);
    ctx.scale(1.03, 1.03);
    ctx.translate(-cx, -cy);
  }

  // Depth layer (bottom offset)
  ctx.fillStyle = depthColor;
  ctx.beginPath();
  drawRoundRect(ctx, x, y + depth, btn.w, btn.h, r);
  ctx.fill();

  // Main body
  ctx.fillStyle = isHover ? lightenColor(color, 0.12) : color;
  ctx.beginPath();
  drawRoundRect(ctx, x, y, btn.w, btn.h, r);
  ctx.fill();

  // Outline
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineW;
  ctx.beginPath();
  drawRoundRect(ctx, x, y, btn.w, btn.h, r);
  ctx.stroke();

  // Text
  ctx.font = 'bold 22px Outfit, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.label, cx, cy + (isHover ? -1 : 0));

  ctx.restore();
}
