import { QUICK_PLAY_CONFIG } from '../data/quickPlayConfig.js';

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickMinutes(count, rangeStart, rangeEnd) {
  const pool = [];
  for (let m = rangeStart; m <= rangeEnd; m++) {
    pool.push(m);
  }
  shuffle(pool);
  return pool.slice(0, count).sort((a, b) => a - b);
}

export function generateQuickPlayEvents() {
  const { min, max } = QUICK_PLAY_CONFIG.eventCount;
  const count = min + Math.floor(Math.random() * (max - min + 1));

  const types = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    types.push(r < QUICK_PLAY_CONFIG.eventTypeWeights.PENALTY ? 'PENALTY' : 'FREE_KICK');
  }

  if (
    count === max &&
    QUICK_PLAY_CONFIG.guaranteePenaltyOnMaxEvents &&
    !types.some(t => t === 'PENALTY')
  ) {
    types[Math.floor(Math.random() * types.length)] = 'PENALTY';
  }

  const half1Count = Math.ceil(count / 2);
  const half2Count = count - half1Count;

  const half1Minutes = half1Count > 0 ? pickMinutes(half1Count, 8, 43) : [];
  const half2Minutes = half2Count > 0 ? pickMinutes(half2Count, 46, 89) : [];

  const half1Events = half1Minutes.map(minute => ({ minute, half: 1 }));
  const half2Events = half2Minutes.map(minute => ({ minute, half: 2 }));
  const slots = [...half1Events, ...half2Events].sort((a, b) => a.minute - b.minute);

  shuffle(types);

  return slots.map((slot, i) => ({
    type: types[i],
    minute: slot.minute,
    half: slot.half,
  }));
}
