// MOTHLIGHT — The Lantern Archive Heist: a make.fun program/v1 entry.
// main.ts hands the game in: it copies game/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json with the vendored
// make.fun library. Node 22, standard library only, no network.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

// Fail loudly, before writing anything, if the entry is incomplete:
// the game folder and its index.html, and 3 to 4 screenshots, must be there.
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error(`MOTHLIGHT: game/index.html is missing under ${gameDir}`);
}
if (!existsSync(shotsDir)) {
  throw new Error(`MOTHLIGHT: screenshots/ is missing under ${shotsDir}`);
}
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`MOTHLIGHT: expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const bytes = statSync(join(shotsDir, shot)).size;
  if (bytes > 262144) {
    throw new Error(`MOTHLIGHT: screenshot ${shot} is ${bytes} bytes, over the 256 KiB cap`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The gate's own caps (from the kit's RULES.txt): at most 4 screenshots,
// each at most 256 KiB; game/ at most 993 files and 48 MiB, paths at most
// 1000 bytes; dossier text at most 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`MOTHLIGHT: wrote ${out} (game/ + ${shots.length} screenshots + dossier.json)`);
