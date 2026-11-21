// MOTHLIGHT lighting: lantern pools, shadow test, and vision-cone geometry.
// Rule of the game: a lit lantern's pool exposes you; shadow hides you.

import { hasLineOfSight } from './level.js';

// Is point (x, y) inside the warm pool of any lantern that is still lit?
// A shelf between the lantern and the point casts a shadow pocket.
export function isLit(x, y, lanterns, walls) {
  for (const lamp of lanterns) {
    if (!lamp.lit) continue;
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy > lamp.r * lamp.r) continue;
    if (hasLineOfSight(lamp.x, lamp.y, x, y, walls)) return true;
  }
  return false;
}

// Vision cone test: is the target inside the guard's cone and in sight?
export function inVisionCone(gx, gy, facing, targetX, targetY, range, halfAngle, walls) {
  const dx = targetX - gx;
  const dy = targetY - gy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 26) return true; // Bumped into a Warden: always seen.
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  return hasLineOfSight(gx, gy, targetX, targetY, walls);
}

// Cone polygon points for drawing: arc fan, clipped by range.
export function conePoints(gx, gy, facing, range, halfAngle, steps = 18) {
  const pts = [{ x: gx, y: gy }];
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    pts.push({ x: gx + Math.cos(a) * range, y: gy + Math.sin(a) * range });
  }
  return pts;
}

// Nearest lit lantern within reach of the player (for the snuff action).
export function nearestLantern(x, y, lanterns, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const lamp of lanterns) {
    if (!lamp.lit) continue;
    const d = Math.hypot(lamp.x - x, lamp.y - y);
    if (d < bestD) {
      bestD = d;
      best = lamp;
    }
  }
  return best;
}
