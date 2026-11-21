// MOTHLIGHT rendering: one canvas, warm lantern pools over a dark archive floor.
// Guards must read against the floor; light must show what is safe.

import { conePoints } from './lighting.js';

const FLOOR_A = '#221a30';
const FLOOR_B = '#1d1628';

export function drawWorld(ctx, state) {
  const { level, player, guards, suspicion, alarmOn } = state;
  drawFloor(ctx);
  drawExit(ctx, level.exit);
  drawEmbers(ctx, level.embers, state.time);
  drawCrates(ctx, level.crates);
  drawWalls(ctx, level.walls);
  drawLightPools(ctx, level.lanterns, level.walls, state.time);
  drawLanterns(ctx, level.lanterns, state.time);
  drawCones(ctx, guards, alarmOn);
  drawGuards(ctx, guards, state.time);
  drawPlayer(ctx, player, state);
  drawVignette(ctx, state);
}

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, 0, 960, 640);
  // Checker of large worn floor tiles, faint enough to keep guards readable.
  ctx.fillStyle = FLOOR_B;
  for (let ty = 0; ty < 10; ty++) {
    for (let tx = 0; tx < 15; tx++) {
      if ((tx + ty) % 2 === 0) ctx.fillRect(tx * 64, ty * 64, 64, 64);
    }
  }
  // Dusty rug in the middle of the archive.
  ctx.fillStyle = 'rgba(122, 60, 70, 0.20)';
  ctx.fillRect(410, 250, 150, 140);
  ctx.strokeStyle = 'rgba(200, 160, 110, 0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(416, 256, 138, 128);
}

function drawExit(ctx, exit) {
  const glow = exit.open ? 0.85 : 0.25;
  ctx.save();
  ctx.fillStyle = exit.open ? '#cfe6ff' : '#5a6b80';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = `rgba(190, 220, 255, ${glow})`;
  ctx.fillRect(exit.x + 4, exit.y + 4, exit.w - 8, exit.h - 8);
  // Moonlit window panes.
  ctx.strokeStyle = 'rgba(20, 20, 40, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(exit.x + exit.w / 2, exit.y);
  ctx.lineTo(exit.x + exit.w / 2, exit.y + exit.h);
  ctx.moveTo(exit.x, exit.y + exit.h / 2);
  ctx.lineTo(exit.x + exit.w, exit.y + exit.h / 2);
  ctx.stroke();
  if (exit.open) {
    ctx.fillStyle = '#eaf4ff';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h + 14);
  } else {
    ctx.fillStyle = '#8b93a5';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SEALED', exit.x + exit.w / 2, exit.y + exit.h + 14);
  }
  ctx.restore();
}

function drawEmbers(ctx, embers, time) {
  for (const ember of embers) {
    if (ember.taken) continue;
    const pulse = 0.65 + Math.sin(time * 3 + ember.x) * 0.35;
    const grad = ctx.createRadialGradient(ember.x, ember.y, 2, ember.x, ember.y, 32);
    grad.addColorStop(0, `rgba(255, 214, 120, ${0.85 * pulse})`);
    grad.addColorStop(1, 'rgba(255, 160, 40, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd678';
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(ember.x - 1.5, ember.y - 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrates(ctx, crates) {
  for (const c of crates) {
    ctx.fillStyle = '#6b4f2e';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#7d5f38';
    ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
    ctx.strokeStyle = '#4a3519';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y + 4);
    ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.moveTo(c.x + c.w - 4, c.y + 4);
    ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.stroke();
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    // Shelf body.
    ctx.fillStyle = '#3d2c1e';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    // Book spines: thin coloured stripes along the shelf.
    const horizontal = w.w >= w.h;
    const len = horizontal ? w.w : w.h;
    const count = Math.floor(len / 9);
    for (let i = 0; i < count; i++) {
      const hues = ['#7a4a3a', '#4a6a7a', '#6a7a4a', '#8a6a2a', '#5a4a7a', '#a03a3a'];
      ctx.fillStyle = hues[(i * 7 + w.x) % hues.length];
      if (horizontal) {
        ctx.fillRect(w.x + 4 + i * 9, w.y + 4, 6, w.h - 8);
      } else {
        ctx.fillRect(w.x + 4, w.y + 4 + i * 9, w.w - 8, 6);
      }
    }
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
}

function drawLightPools(ctx, lanterns, walls, time) {
  // Warm pools first, then a darkness layer with holes cut over the pools.
  ctx.save();
  for (const lamp of lanterns) {
    if (!lamp.lit) continue;
    const flicker = 0.85 + Math.sin(time * 5 + lamp.x * 0.7) * 0.08;
    const grad = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.r);
    grad.addColorStop(0, `rgba(255, 196, 110, ${0.40 * flicker})`);
    grad.addColorStop(0.7, `rgba(255, 170, 70, ${0.20 * flicker})`);
    grad.addColorStop(1, 'rgba(255, 160, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Darkness: everything outside a lantern pool dims, so safe shadow reads clearly.
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(8, 6, 16, 0.30)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.globalCompositeOperation = 'destination-out';
  for (const lamp of lanterns) {
    if (!lamp.lit) continue;
    const grad = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.r);
    grad.addColorStop(0, 'rgba(0,0,0,0.95)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLanterns(ctx, lanterns, time) {
  for (const lamp of lanterns) {
    if (lamp.lit) {
      const flicker = 0.8 + Math.sin(time * 5 + lamp.x) * 0.2;
      ctx.fillStyle = `rgba(255, 210, 120, ${flicker})`;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a1c08';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#3a2a12';
      ctx.fillRect(lamp.x - 2, lamp.y - 12, 4, 5);
    } else {
      // Snuffed: a cold, dead lantern with a wisp of smoke.
      ctx.fillStyle = '#4a4a55';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#22222a';
      ctx.lineWidth = 2;
      ctx.stroke();
      const wisp = Math.sin(time * 2 + lamp.x) * 3;
      ctx.strokeStyle = 'rgba(180, 180, 200, 0.5)';
      ctx.beginPath();
      ctx.moveTo(lamp.x, lamp.y - 8);
      ctx.quadraticCurveTo(lamp.x + wisp, lamp.y - 16, lamp.x - wisp, lamp.y - 24);
      ctx.stroke();
    }
  }
}

function coneColor(guard, alarmOn) {
  if (alarmOn || guard.state === 'chase') return 'rgba(224, 60, 50, 0.30)';
  if (guard.state === 'suspicious') return 'rgba(232, 178, 60, 0.30)';
  return 'rgba(255, 220, 130, 0.20)';
}

function drawCones(ctx, guards, alarmOn) {
  for (const guard of guards) {
    const pts = conePoints(guard.x, guard.y, guard.facing, 195, 0.88);
    ctx.fillStyle = coneColor(guard, alarmOn);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = coneColor(guard, alarmOn).replace('0.30', '0.55').replace('0.20', '0.45');
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGuards(ctx, guards, time) {
  for (const guard of guards) {
    // Shadow under the Warden.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(guard.x, guard.y + 10, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body: a tall hooded Warden, pale against the dark floor, ringed in
    // lantern amber so it always reads against the floor.
    ctx.fillStyle = 'rgba(255, 190, 100, 0.25)';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8c8b8';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffcf7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#3a2f4a';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2);
    ctx.fill();
    // Hood point and lantern staff direction.
    const hx = guard.x + Math.cos(guard.facing) * 9;
    const hy = guard.y + Math.sin(guard.facing) * 9;
    ctx.fillStyle = '#e8dcc8';
    ctx.beginPath();
    ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // State mark above the head: ? when suspicious, ! when chasing.
    if (guard.state === 'suspicious' || guard.state === 'chase') {
      ctx.fillStyle = guard.state === 'chase' ? '#ff6b5e' : '#ffb347';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - 20);
    }
  }
}

function drawPlayer(ctx, player, state) {
  const { x, y } = player;
  // A soft glow halo so the moth always pops against the floor.
  const halo = ctx.createRadialGradient(x, y, 2, x, y, 26);
  halo.addColorStop(0, 'rgba(255, 230, 160, 0.35)');
  halo.addColorStop(1, 'rgba(255, 230, 160, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  const flap = Math.sin(player.wingPhase * 2) * 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(player.facing);
  // Wings: two pale moth wings that flap as it flies.
  ctx.fillStyle = player.sneaking ? 'rgba(214, 196, 150, 0.85)' : 'rgba(232, 214, 160, 0.95)';
  ctx.beginPath();
  ctx.ellipse(-2, -8 - flap * 3, 9, 5 + flap * 2, -0.5, 0, Math.PI * 2);
  ctx.ellipse(-2, 8 + flap * 3, 9, 5 + flap * 2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = '#4a3520';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Antennae.
  ctx.strokeStyle = '#e8d6a0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(6, -2);
  ctx.quadraticCurveTo(12, -5, 14, -8);
  ctx.moveTo(6, 2);
  ctx.quadraticCurveTo(12, 5, 14, 8);
  ctx.stroke();
  ctx.restore();
  // Sneak ring: shows you are hard to spot.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(160, 220, 140, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Lit indicator: a small sun mark when the moth stands in light.
  if (state.lit) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('☀', x, y - 18);
  }
}

function drawVignette(ctx, state) {
  if (!state.alarmOn) return;
  const pulse = 0.10 + Math.sin(state.time * 6) * 0.05;
  const grad = ctx.createRadialGradient(480, 320, 200, 480, 320, 620);
  grad.addColorStop(0, 'rgba(200, 30, 20, 0)');
  grad.addColorStop(1, `rgba(200, 30, 20, ${pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 640);
}

// ---- Full-screen overlays ----

export function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(10, 7, 16, 0.82)';
  ctx.fillRect(0, 0, 960, 640);
  const bob = Math.sin(time * 1.5) * 6;
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255, 190, 90, 0.6)';
  ctx.shadowBlur = 24;
  ctx.fillText('MOTHLIGHT', 480, 200 + bob);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8ddc4';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('The Lantern Archive Heist', 480, 244 + bob);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = '#b9a684';
  const lines = [
    'You are Luma, a moth with a taste for stolen light.',
    'Steal 5 glow-embers from the Lantern Archive, then slip out',
    'through the moonlit window — unseen.',
    '',
    'Lantern light exposes you. Shadow hides you.',
    'Snuff a lantern (E or click) to carve yourself some dark —',
    'but a Warden who spots a dead lantern grows suspicious.',
    '',
    'WASD / arrows to fly · Shift to sneak · E / click to snuff · P pause · M sound',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 480, 300 + i * 26));
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press ENTER or click to begin', 480, 540 + Math.sin(time * 3) * 4);
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(10, 7, 16, 0.7)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 480, 320);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = '#b9a684';
  ctx.fillText('Press P to keep sneaking', 480, 356);
}

export function drawCaught(ctx, stats) {
  ctx.fillStyle = 'rgba(16, 5, 8, 0.85)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.fillStyle = '#ff6b5e';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAUGHT!', 480, 280);
  ctx.fillStyle = '#e8ddc4';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('A Warden\'s lantern found you. The archive keeps its light.', 480, 330);
  ctx.fillStyle = '#b9a684';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Embers stolen: ${stats.embers} of 5 · Time: ${stats.time}`, 480, 380);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press ENTER to try again', 480, 440);
}

export function drawWin(ctx, stats) {
  ctx.fillStyle = 'rgba(8, 12, 20, 0.85)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.fillStyle = '#cfe6ff';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY', 480, 260);
  ctx.fillStyle = '#e8ddc4';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Five embers in your wings, moonlight on your back —', 480, 310);
  ctx.fillText('the Lantern Archive never saw you leave.', 480, 338);
  ctx.fillStyle = '#ffd98a';
  ctx.font = '18px Georgia, serif';
  ctx.fillText(`Time: ${stats.time} · Alarms raised: ${stats.alarms}`, 480, 390);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press ENTER to steal again', 480, 450);
}
