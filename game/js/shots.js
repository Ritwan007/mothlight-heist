// Screenshot staging: ?shot=cover|title|alarm|win places the game in a
// readable, honest state of its own code, so the screenshots are real renders.

export function applyShot(game, shot) {
  if (!shot) return;
  if (shot === 'title') {
    game.screen = 'title';
    return;
  }
  if (shot === 'cover') {
    // Mid-play: Luma crouched in shadow behind crates, two cones sweeping
    // the aisle, embers glowing, the sealed exit window glowing top-right.
    game.screen = 'playing';
    game.player.x = 300;
    game.player.y = 310;
    game.player.sneaking = true;
    game.player.facing = 0.4;
    game.guards[0].x = 90;
    game.guards[0].y = 430;
    game.guards[0].facing = Math.PI / 2;
    game.guards[1].x = 320;
    game.guards[1].y = 260;
    game.guards[1].facing = Math.PI;
    game.guards[2].x = 640;
    game.guards[2].y = 420;
    game.guards[2].facing = -Math.PI / 2;
    game.suspicion = 18;
    game.embersGot = 1;
    game.level.embers[0].taken = true;
    game.level.lanterns[5].lit = false;
    game.level.lanterns[5].relightIn = 20;
    return;
  }
  if (shot === 'alarm') {
    // Near-miss: suspicion at 92, a Warden close behind with a red cone,
    // Luma darting for the shadow between two shelves.
    game.screen = 'playing';
    game.player.x = 430;
    game.player.y = 330;
    game.player.facing = -0.6;
    game.player.sneaking = false;
    game.guards[1].x = 470;
    game.guards[1].y = 300;
    game.guards[1].facing = Math.atan2(330 - 300, 430 - 470);
    game.guards[1].state = 'chase';
    game.guards[1].lastSeenX = 430;
    game.guards[1].lastSeenY = 330;
    game.guards[2].x = 560;
    game.guards[2].y = 480;
    game.guards[2].facing = -Math.PI / 2;
    game.guards[2].state = 'suspicious';
    game.suspicion = 92;
    game.alarmOn = true;
    game.embersGot = 3;
    game.level.embers[0].taken = true;
    game.level.embers[1].taken = true;
    game.level.embers[2].taken = true;
    return;
  }
  if (shot === 'win') {
    // All five embers stolen, the exit window open, Luma at the threshold.
    game.screen = 'playing';
    for (const ember of game.level.embers) ember.taken = true;
    game.level.exit.open = true;
    game.player.x = 872;
    game.player.y = 76;
    game.player.facing = -Math.PI / 2;
    game.guards[3].x = 800;
    game.guards[3].y = 200;
    game.guards[3].facing = Math.PI / 2;
    game.guards[0].x = 250;
    game.guards[0].y = 540;
    game.guards[0].facing = 0;
    game.guards[1].x = 470;
    game.guards[1].y = 300;
    game.guards[1].facing = Math.PI;
    game.suspicion = 6;
    game.embersGot = 5;
    return;
  }
}
