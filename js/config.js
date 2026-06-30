export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const COLORS = {
  bg: '#05070c',
  dark: '#0b0f19',
  card: 'rgba(17, 24, 39, 0.85)',
  green: '#10b981',
  greenGlow: 'rgba(16, 185, 129, 0.4)',
  purple: '#8b5cf6',
  purpleGlow: 'rgba(139, 92, 246, 0.4)',
  blue: '#0ea5e9',
  blueGlow: 'rgba(14, 165, 233, 0.4)',
  gold: '#f59e0b',
  red: '#ef4444',
  white: '#ffffff',
  slate: '#94a3b8',
  darkSlate: '#64748b',
  border: 'rgba(255, 255, 255, 0.08)',
  fieldDark: '#062010',
  fieldMid: '#0d4a22',
  fieldLight: '#0f4f24',
};

export const PHYSICS = {
  maxAttempts: 5,
  basePoints: 300,
  multiplierBonus: 50,
  maxMultiplier: 5,
  goalWidth: 760,
  goalHeight: 280,
  goalX: 960,
  goalY: 440,
  penaltySpotX: 960,
  penaltySpotY: 850,
  ballRadius: 50,
  swipeMinDist: 30,
  swipeMaxTime: 0.5,
  tapMaxDist: 15,
};

export const STORAGE_KEYS = {
  muted: 'penalty_muted',
  volume: 'penalty_volume',
  highScore: 'penalty_highscore',
  matches: 'penalty_matches',
};
