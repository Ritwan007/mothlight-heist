// MOTHLIGHT boot: game loop, screens, input, HUD, and the suspicion alarm.
// Screens: title -> playing -> paused | caught | win.

import { buildLevel, WORLD } from './level.js';
import { createPlayer, updatePlayer, snuffLantern, collectEmbers, atExit } from './player.js';
import { createGuards, updateGuards, nearestGuardDistance } from './guards.js';
import { isLit } from './lighting.js';
import { createAudio } from './audio.js';
import { drawWorld, drawTitle, drawPaused, drawCaught, drawWin } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const els = {
  emberCount: document.getElementById('emberCount'),
  lanternCount: document.getElementById('lanternCount'),
  timeCount: document.getElementById('timeCount'),
  suspicionFill: document.getElementById('suspicionFill'),
  alarmState: document.getElementById('alarmState'),
  toast: document.getElementById('toast'),
  objective: document.getElementById('objective'),
};

const audio = createAudio();
const keys = new Set();

function newGame() {
  const level = buildLevel();
  return {
    level,
    player: createPlayer(level.playerStart),
    guards: createGuards(level.patrols),
    screen: 'title',
    time: 0,
    suspicion: 0,
    alarmOn: false,
    alarmCount: 0,
    embersGot: 0,
    lit: false,
    frozen: false,
    toastTimer: null,
  };
}

const game = newGame();

function showToast(text, ms = 2600) {
  els.toast.textContent = text;
  els.toast.style.opacity = '1';
  clearTimeout(game.toastTimer);
  game.toastTimer = setTimeout(() => { els.toast.style.opacity = '0'; }, ms);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function updateHud() {
  els.emberCount.textContent = `${game.embersGot} / 5`;
  els.lanternCount.textContent = String(game.level.lanterns.filter((l) => l.lit).length);
  els.timeCount.textContent = formatTime(game.time);
  els.suspicionFill.style.width = `${Math.min(100, Math.max(0, game.suspicion))}%`;
  const state = els.alarmState;
  if (game.alarmOn) {
    state.textContent = 'ALARM — RUN FOR SHADOW';
    state.className = 'alarm';
  } else if (game.suspicion >= 50) {
    state.textContent = 'SUSPICIOUS — THEY SAW SOMETHING';
    state.className = 'hot';
  } else if (game.suspicion > 5) {
    state.textContent = 'WATCHED';
    state.className = 'hot';
  } else {
    state.textContent = 'UNSEEN';
    state.className = '';
  }
  els.objective.textContent = game.level.exit.open
    ? 'All five embers are yours. Slip out through the moonlit window!'
    : `Steal 5 glow-embers (${game.embersGot} so far), then slip out through the moonlit window.`;
}

function tripAlarm() {
  game.alarmOn = true;
  game.alarmCount += 1;
  audio.alarmSting();
  showToast('THE ALARM IS UP — break line of sight to cool it down!');
}

function update(dt) {
  if (game.screen !== 'playing' || game.frozen) return;
  game.time += dt;

  // Lanterns relight after a while; a relit lantern can be snuffed again.
  for (const lamp of game.level.lanterns) {
    if (!lamp.lit && lamp.relightIn !== undefined) {
      lamp.relightIn -= dt;
      if (lamp.relightIn <= 0) {
        lamp.lit = true;
        lamp.counted = false;
        delete lamp.relightIn;
      }
    }
  }

  updatePlayer(game.player, keys, dt, game.level);
  game.lit = isLit(game.player.x, game.player.y, game.level.lanterns, game.level.walls);

  const events = updateGuards(game.guards, game.player, game.level, dt, game.alarmOn);
  if (events.noticedSnuffed) {
    showToast('A Warden spotted a snuffed lantern — suspicion rising!');
  }
  game.suspicion += events.suspicionDelta;
  if (!events.sawPlayer) game.suspicion -= 22 * dt;
  game.suspicion = Math.max(0, Math.min(100, game.suspicion));

  if (game.suspicion >= 100 && !game.alarmOn) tripAlarm();
  if (game.alarmOn && game.suspicion <= 0) {
    game.alarmOn = false;
    for (const g of game.guards) if (g.state === 'chase') g.state = 'return';
    showToast('The alarm cools. They lost you — for now.');
  }

  const got = collectEmbers(game.player, game.level);
  if (got > 0) {
    game.embersGot += got;
    audio.chime();
    showToast(got > 1 ? `${got} embers stolen!` : 'Ember stolen — the archive grows darker.');
    if (game.embersGot >= 5 && !game.level.exit.open) {
      game.level.exit.open = true;
      showToast('The moonlit window is open. Run for it — unseen!');
    }
  }

  if (game.level.exit.open && atExit(game.player, game.level)) {
    game.screen = 'win';
    return;
  }
  if (events.caught) {
    game.screen = 'caught';
    return;
  }

  audio.tick(game.player, nearestGuardDistance(game.guards, game.player), dt);
  audio.setHum(events.sawPlayer, game.suspicion / 100);
  updateHud();
}

function render() {
  ctx.clearRect(0, 0, WORLD.w, WORLD.h);
  drawWorld(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game.time);
  if (game.screen === 'paused') drawPaused(ctx);
  if (game.screen === 'caught') drawCaught(ctx, { embers: game.embersGot, time: formatTime(game.time) });
  if (game.screen === 'win') drawWin(ctx, { time: formatTime(game.time), alarms: game.alarmCount });
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---- Input: keyboard + mouse ----

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
  if (key === 'enter' || key === ' ') {
    if (game.screen === 'title' || game.screen === 'caught' || game.screen === 'win') {
      const keepShot = new URLSearchParams(window.location.search).get('shot');
      const fresh = newGame();
      Object.assign(game, fresh);
      game.screen = 'playing';
      if (keepShot) applyShot(game, keepShot);
      updateHud();
    }
    return;
  }
  if (key === 'p' && (game.screen === 'playing' || game.screen === 'paused')) {
    game.screen = game.screen === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (key === 'm') {
    const muted = audio.toggleMute();
    showToast(muted ? 'Sound off' : 'Sound on');
    return;
  }
  if (key === 'e' && game.screen === 'playing') {
    const lamp = snuffLantern(game.player, game.level);
    if (lamp) {
      audio.snuffPuff();
      game.suspicion = Math.min(100, game.suspicion + 4);
      showToast('Lantern snuffed — a pocket of shadow. It relights in 25 seconds.');
      updateHud();
    }
    return;
  }
  keys.add(key);
});

window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

canvas.addEventListener('mousedown', (e) => {
  audio.ensureContext();
  if (game.screen === 'title' || game.screen === 'caught' || game.screen === 'win') {
    const fresh = newGame();
    Object.assign(game, fresh);
    game.screen = 'playing';
    updateHud();
    return;
  }
  if (game.screen !== 'playing') return;
  // Click a lantern to snuff it; click anywhere else to nudge Luma that way.
  const rect = canvas.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width) * WORLD.w;
  const cy = ((e.clientY - rect.top) / rect.height) * WORLD.h;
  const lamp = game.level.lanterns.find(
    (l) => l.lit && Math.hypot(l.x - cx, l.y - cy) < 34,
  );
  if (lamp) {
    lamp.lit = false;
    lamp.relightIn = 25;
    audio.snuffPuff();
    game.suspicion = Math.min(100, game.suspicion + 4);
    showToast('Lantern snuffed — a pocket of shadow. It relights in 25 seconds.');
    updateHud();
  }
});

// ---- Screenshot staging: ?shot=title|cover|alarm|win freezes a staged scene ----
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  applyShot(game, shot);
  game.frozen = true;
  game.time = 1.4;
  updateHud();
}

// Test hook: lets a play-test drive and inspect the live game.
window.__mothlight = game;

updateHud();
requestAnimationFrame(loop);
