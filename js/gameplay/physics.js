import { PHYSICS, CANVAS_WIDTH } from '../config.js';

export function calculateShot(input) {
  const { aimAngleX, power, curveInput = 0 } = input;
  const baseSpeed = 1200 * power;
  return {
    vx: aimAngleX * baseSpeed * 0.5 + curveInput * baseSpeed * 0.15,
    vy: -baseSpeed,
    rotation: -aimAngleX * power * 10 + curveInput * power * 5,
    power,
    aimAngleX,
    curveInput,
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
