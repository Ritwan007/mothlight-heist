// MOTHLIGHT level: one room of the Lantern Archive, top-down.
// Walls are tall bookshelves: they block movement AND sight.
// Crates are low cover: they block movement but not sight.
// Lanterns cast pools of warm light; outside every pool is shadow.

export const WORLD = { w: 960, h: 640 };

export function buildLevel() {
  // Shelves: {x, y, w, h} in pixels. Border walls first.
  const walls = [
    { x: 0, y: 0, w: 960, h: 26 },
    { x: 0, y: 614, w: 960, h: 26 },
    { x: 0, y: 0, w: 26, h: 640 },
    { x: 934, y: 0, w: 26, h: 640 },
    // Reading-room shelves: vertical stacks that carve corridors.
    { x: 170, y: 26, w: 34, h: 180 },
    { x: 170, y: 300, w: 34, h: 180 },
    { x: 380, y: 130, w: 34, h: 220 },
    { x: 380, y: 440, w: 34, h: 174 },
    { x: 590, y: 26, w: 34, h: 180 },
    { x: 590, y: 300, w: 34, h: 180 },
    // Horizontal shelf rows make side aisles.
    { x: 240, y: 130, w: 140, h: 30 },
    { x: 450, y: 440, w: 140, h: 30 },
    { x: 660, y: 130, w: 140, h: 30 },
    { x: 660, y: 440, w: 140, h: 30 },
    // Central archive desk block.
    { x: 440, y: 290, w: 90, h: 60 },
  ];

  // Crates: low cover you can slip behind, but a Warden can still see over them.
  const crates = [
    { x: 90, y: 240, w: 44, h: 44 },
    { x: 250, y: 520, w: 44, h: 44 },
    { x: 300, y: 240, w: 44, h: 44 },
    { x: 470, y: 80, w: 44, h: 44 },
    { x: 660, y: 330, w: 44, h: 44 },
    { x: 700, y: 520, w: 44, h: 44 },
    { x: 820, y: 240, w: 44, h: 44 },
    { x: 120, y: 480, w: 44, h: 44 },
  ];

  // Lanterns hang on the walls and posts; each lights a pool around itself.
  const lanterns = [
    { x: 110, y: 90, r: 118, lit: true },
    { x: 310, y: 90, r: 118, lit: true },
    { x: 520, y: 90, r: 118, lit: true },
    { x: 730, y: 90, r: 118, lit: true },
    { x: 880, y: 90, r: 100, lit: true },
    { x: 110, y: 560, r: 118, lit: true },
    { x: 310, y: 560, r: 118, lit: true },
    { x: 520, y: 560, r: 118, lit: true },
    { x: 730, y: 560, r: 118, lit: true },
    { x: 880, y: 330, r: 100, lit: true },
  ];

  // Glow-embers: five, each tucked where a patrol route passes close by.
  const embers = [
    { x: 120, y: 330, taken: false },
    { x: 300, y: 200, taken: false },
    { x: 485, y: 380, taken: false },
    { x: 640, y: 200, taken: false },
    { x: 830, y: 480, taken: false },
  ];

  // The moonlit exit window, top-right corner; sealed until all embers are stolen.
  const exit = { x: 880, y: 40, w: 44, h: 60, open: false };

  // Warden patrol routes: loops of waypoints through the aisles.
  const patrols = [
    { waypoints: [{ x: 90, y: 120 }, { x: 90, y: 540 }, { x: 250, y: 540 }, { x: 250, y: 120 }], speed: 56 },
    { waypoints: [{ x: 320, y: 540 }, { x: 320, y: 120 }, { x: 470, y: 120 }, { x: 470, y: 540 }], speed: 62 },
    { waypoints: [{ x: 540, y: 120 }, { x: 700, y: 120 }, { x: 700, y: 540 }, { x: 540, y: 540 }], speed: 56 },
    { waypoints: [{ x: 860, y: 540 }, { x: 860, y: 180 }, { x: 760, y: 180 }, { x: 760, y: 540 }], speed: 68 },
  ];

  return {
    walls,
    crates,
    lanterns,
    embers,
    exit,
    patrols,
    // Start in shadow, in the quiet south-west aisle — never in a lantern pool.
    playerStart: { x: 60, y: 400 },
  };
}

// Axis-aligned rectangle collision: does circle (cx, cy, r) hit rect?
export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Does the segment (x1,y1)-(x2,y2) cross rect? Used for sight and light occlusion.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Quick reject: both ends on one side.
  if ((x1 < rect.x && x2 < rect.x) || (x1 > rect.x + rect.w && x2 > rect.x + rect.w)) return false;
  if ((y1 < rect.y && y2 < rect.y) || (y1 > rect.y + rect.h && y2 > rect.y + rect.h)) return false;
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  return (
    segmentsCross(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.w, rect.y) ||
    segmentsCross(x1, y1, x2, y2, rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h) ||
    segmentsCross(x1, y1, x2, y2, rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h) ||
    segmentsCross(x1, y1, x2, y2, rect.x, rect.y + rect.h, rect.x, rect.y)
  );
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Is there a clear line of sight between two points (no shelf in the way)?
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const wall of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  return true;
}

// Move a circle, sliding along walls and crates; returns the new position.
export function moveWithCollision(x, y, dx, dy, r, solids) {
  let nx = x + dx;
  for (const s of solids) {
    if (circleHitsRect(nx, y, r, s)) {
      nx = dx > 0 ? s.x - r : s.x + s.w + r;
      if (circleHitsRect(nx, y, r, s)) nx = x;
    }
  }
  let ny = y + dy;
  for (const s of solids) {
    if (circleHitsRect(nx, ny, r, s)) {
      ny = dy > 0 ? s.y - r : s.y + s.h + r;
      if (circleHitsRect(nx, ny, r, s)) ny = y;
    }
  }
  return { x: nx, y: ny };
}
