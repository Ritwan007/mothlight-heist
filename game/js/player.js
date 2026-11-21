// Luma the moth: movement, sneaking, and snuffing lanterns.

import { moveWithCollision, circleHitsRect } from './level.js';
import { nearestLantern } from './lighting.js';

export const PLAYER_RADIUS = 11;
const WALK_SPEED = 132;
const SNEAK_SPEED = 68;
const SNUFF_REACH = 52;

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: -Math.PI / 2,
    moving: false,
    sneaking: false,
    stepPhase: 0,
    wingPhase: 0,
  };
}

// Read WASD/arrows + Shift from the key set; move and collide.
export function updatePlayer(player, keys, dt, level) {
  let mx = 0;
  let my = 0;
  if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
  if (keys.has('arrowright') || keys.has('d')) mx += 1;
  if (keys.has('arrowup') || keys.has('w')) my -= 1;
  if (keys.has('arrowdown') || keys.has('s')) my += 1;

  player.sneaking = keys.has('shift');
  player.moving = mx !== 0 || my !== 0;

  if (player.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const solids = [...level.walls, ...level.crates];
    const pos = moveWithCollision(
      player.x, player.y, mx * speed * dt, my * speed * dt, PLAYER_RADIUS, solids,
    );
    player.x = pos.x;
    player.y = pos.y;
    player.facing = Math.atan2(my, mx);
    player.stepPhase += dt * (player.sneaking ? 5 : 9);
    player.wingPhase += dt * (player.sneaking ? 7 : 13);
  } else {
    player.wingPhase += dt * 4;
  }
  return player;
}

// Snuff the nearest lit lantern within reach. Returns the lantern or null.
export function snuffLantern(player, level) {
  const lamp = nearestLantern(player.x, player.y, level.lanterns, SNUFF_REACH);
  if (!lamp) return null;
  lamp.lit = false;
  lamp.relightIn = 25;
  return lamp;
}

// Collect any ember the player is touching. Returns how many were taken.
export function collectEmbers(player, level) {
  let got = 0;
  for (const ember of level.embers) {
    if (ember.taken) continue;
    if (Math.hypot(ember.x - player.x, ember.y - player.y) < 24) {
      ember.taken = true;
      got += 1;
    }
  }
  return got;
}

// Is the player standing in the exit window?
export function atExit(player, level) {
  return circleHitsRect(player.x, player.y, PLAYER_RADIUS, level.exit);
}
