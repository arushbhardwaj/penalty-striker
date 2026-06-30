import { PHYSICS, CANVAS_WIDTH } from '../config.js';

export function calculateShot(swipe) {
  const power = Math.min(1, Math.hypot(swipe.vx, swipe.vy) / 3000);
  const angleX = Math.max(-1, Math.min(1, swipe.dx / 400));
  return {
    vx: angleX * 600 * power,
    vy: -1200 * power,
    rotation: -angleX * power * 10,
    power,
  };
}

export function checkGoal(ballX, ballY) {
  const gx = PHYSICS.goalX;
  const gy = PHYSICS.goalY;
  const gw = PHYSICS.goalWidth;
  const gh = PHYSICS.goalHeight;
  return (
    ballX > gx - gw / 2 &&
    ballX < gx + gw / 2 &&
    ballY > gy - gh &&
    ballY < gy
  );
}

export function checkSave(ballX, ballY, keeperX, keeperY, keeperRadius) {
  const dist = Math.hypot(ballX - keeperX, ballY - keeperY);
  return dist < PHYSICS.ballRadius + keeperRadius;
}

export function getGoalBounds() {
  return {
    x: PHYSICS.goalX,
    y: PHYSICS.goalY,
    width: PHYSICS.goalWidth,
    height: PHYSICS.goalHeight,
    left: PHYSICS.goalX - PHYSICS.goalWidth / 2,
    right: PHYSICS.goalX + PHYSICS.goalWidth / 2,
    top: PHYSICS.goalY - PHYSICS.goalHeight,
    bottom: PHYSICS.goalY,
  };
}
