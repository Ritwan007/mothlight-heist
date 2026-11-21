// The Wardens: patrol routes you can learn, vision cones that react,
// suspicion that gives you a chance to recover, and a chase when the alarm sounds.

import { moveWithCollision } from './level.js';
import { inVisionCone, isLit } from './lighting.js';

export const VISION_RANGE = 195;
export const VISION_HALF_ANGLE = 0.88; // ~50 degrees each side
const PATROL_PAUSE = 1.1; // seconds a Warden studies a waypoint before moving on
const CHASE_SPEED = 112;
const LOSE_SIGHT_AFTER = 4.0; // seconds unseen before the alarm cools
const CATCH_DISTANCE = 24;

export function createGuards(patrols) {
  return patrols.map((p, i) => ({
    id: i,
    x: p.waypoints[0].x,
    y: p.waypoints[0].y,
    facing: 0,
    patrol: p,
    waypointIndex: 1,
    pauseLeft: 0,
    state: 'patrol', // patrol | suspicious | chase | return
    unseenFor: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    stepPhase: 0,
    scanPhase: 0,
  }));
}

function moveToward(guard, tx, ty, speed, dt, level) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const solids = [...level.walls, ...level.crates];
  const pos = moveWithCollision(guard.x, guard.y, (dx / dist) * step, (dy / dist) * step, 13, solids);
  guard.x = pos.x;
  guard.y = pos.y;
  guard.facing = Math.atan2(dy, dx);
  guard.stepPhase += dt * 8;
  return dist <= step + 1;
}

function patrolStep(guard, dt, level) {
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    // Study the room: slow scan left and right while paused.
    guard.scanPhase += dt;
    guard.facing += Math.sin(guard.scanPhase * 2.2) * dt * 0.9;
    return;
  }
  const wp = guard.patrol.waypoints[guard.waypointIndex];
  if (moveToward(guard, wp.x, wp.y, guard.patrol.speed, dt, level)) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.patrol.waypoints.length;
    guard.pauseLeft = PATROL_PAUSE;
    guard.scanPhase = 0;
  }
}

// One tick for every Warden. Returns events for the main loop:
// { sawPlayer, suspicionDelta, caught, noticedSnuffed }.
export function updateGuards(guards, player, level, dt, alarmOn) {
  let suspicionDelta = 0;
  let sawPlayer = false;
  let caught = false;
  let noticedSnuffed = false;

  for (const guard of guards) {
    const sees = inVisionCone(
      guard.x, guard.y, guard.facing, player.x, player.y,
      VISION_RANGE, VISION_HALF_ANGLE, level.walls,
    );
    const lit = isLit(player.x, player.y, level.lanterns, level.walls);

    if (sees) {
      sawPlayer = true;
      guard.lastSeenX = player.x;
      guard.lastSeenY = player.y;
      guard.unseenFor = 0;
      // Light exposes you fast; shadow hides you; sneaking halves the rate.
      let rate = lit ? 52 : 13;
      if (player.sneaking) rate *= 0.55;
      suspicionDelta += rate * dt;
      guard.state = alarmOn ? 'chase' : 'suspicious';
    } else {
      guard.unseenFor += dt;
      if (guard.state === 'chase' && guard.unseenFor >= LOSE_SIGHT_AFTER) {
        guard.state = 'return';
      }
    }

    // A Warden that spots a snuffed lantern grows suspicious.
    for (const lamp of level.lanterns) {
      if (lamp.lit || lamp.counted) continue;
      if (inVisionCone(guard.x, guard.y, guard.facing, lamp.x, lamp.y, VISION_RANGE, VISION_HALF_ANGLE, level.walls)) {
        lamp.counted = true;
        noticedSnuffed = true;
        suspicionDelta += 14;
      }
    }

    if (alarmOn || guard.state === 'chase') {
      guard.state = 'chase';
      if (sees) {
        moveToward(guard, player.x, player.y, CHASE_SPEED, dt, level);
      } else {
        // Hunt the last place the moth was seen.
        if (moveToward(guard, guard.lastSeenX, guard.lastSeenY, CHASE_SPEED, dt, level)) {
          guard.state = guard.unseenFor >= LOSE_SIGHT_AFTER ? 'return' : 'chase';
        }
      }
    } else if (guard.state === 'return') {
      // Walk back to the nearest waypoint, then resume the patrol.
      let nearest = 0;
      let nearestD = Infinity;
      guard.patrol.waypoints.forEach((wp, i) => {
        const d = Math.hypot(wp.x - guard.x, wp.y - guard.y);
        if (d < nearestD) { nearestD = d; nearest = i; }
      });
      guard.waypointIndex = nearest;
      const wp = guard.patrol.waypoints[nearest];
      if (moveToward(guard, wp.x, wp.y, guard.patrol.speed * 1.3, dt, level)) {
        guard.state = 'patrol';
      }
    } else {
      patrolStep(guard, dt, level);
    }

    if (Math.hypot(guard.x - player.x, guard.y - player.y) < CATCH_DISTANCE) {
      caught = true;
    }
  }

  return { sawPlayer, suspicionDelta, caught, noticedSnuffed };
}

// Nearest Warden to the player, for the footstep audio.
export function nearestGuardDistance(guards, player) {
  let best = Infinity;
  for (const g of guards) {
    best = Math.min(best, Math.hypot(g.x - player.x, g.y - player.y));
  }
  return best;
}
