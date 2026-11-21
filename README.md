# MOTHLIGHT — The Lantern Archive Heist

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Ritwan007/mothlight-heist/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Ritwan007/mothlight-heist/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

A top-down stealth game built for the [make.fun best stealth game competition](https://make.fun/c/best-stealth-game-20261121-1759).

You are **Luma**, a moth with a taste for stolen light. Sneak through the Lantern Archive, steal **5 glow-embers**, and slip out through the moonlit window — unseen.

## The twist: light is the enemy

- **Lantern light exposes you.** Standing in a lantern's warm pool makes a Warden's vision cone fill your suspicion fast. **Shadow hides you** — in the dark, suspicion rises slowly, and sneaking halves it again.
- **Snuff a lantern** (E, or click it) to carve yourself a pocket of shadow. It relights in 25 seconds — and a Warden who spots a dead lantern grows suspicious.
- **Patrols you can learn:** four Wardens walk fixed routes with pauses to scan the room. **Detection gives you a chance to recover:** suspicion drains when unseen, and if the alarm trips, breaking line of sight cools it down and the Wardens return to their rounds.
- **Feel:** vision cones shift from pale gold to amber to red, Wardens mark `?` then `!`, footsteps (synthesized, WebAudio) tell you how close a Warden is, and a low hum rises while you are being watched.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit http://localhost:8080). No network, no build step.

- **WASD / arrows** — fly · **Shift** — sneak (slow, quiet, harder to spot) · **E / click a lantern** — snuff it · **P** — pause · **M** — sound on/off

## Layout

- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/`, writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `game/index.html` + `game/css/style.css` — page shell and chrome
- `game/js/main.js` — boot, game loop, screens, input, HUD
- `game/js/level.js` — the archive layout: shelves, crates, lanterns, embers, patrols, exit
- `game/js/guards.js` — Warden patrol / vision / suspicion / chase AI
- `game/js/player.js` — Luma: movement, sneaking, snuffing, collecting
- `game/js/lighting.js` — lantern pools, shadow test, vision-cone geometry
- `game/js/audio.js` — synthesized footsteps, chimes, alarm (WebAudio, no files)
- `game/js/render.js` — canvas drawing: floor, cones, lanterns, moth, screens
- `game/js/shots.js` — `?shot=` staging for the screenshots
- `screenshots/` — four real renders of the game's own code
