/**
 * Floor-plane geometry shared by the extra stages and the hunter. Game
 * coordinates: (x, z) on the floor; world z = -game z. No three.js here, so
 * it can be tested in plain Node.
 */

export type Pt = { x: number; z: number };
/** Axis-aligned blocker in game coordinates. */
export type Box = { minX: number; maxX: number; minZ: number; maxZ: number };

export function box(x: number, z: number, halfW: number, halfD: number): Box {
  return { minX: x - halfW, maxX: x + halfW, minZ: z - halfD, maxZ: z + halfD };
}

/** Pushes a circle out of every box it overlaps. Mutates `pos`. */
export function collideBoxes(pos: Pt, boxes: readonly Box[], radius: number): void {
  for (const b of boxes) {
    const cx = Math.min(Math.max(pos.x, b.minX), b.maxX);
    const cz = Math.min(Math.max(pos.z, b.minZ), b.maxZ);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      pos.x = cx + (dx / d) * radius;
      pos.z = cz + (dz / d) * radius;
      continue;
    }
    // Centre is inside the box: leave by the nearest face.
    const left = b.minX - radius - pos.x;
    const right = b.maxX + radius - pos.x;
    const near = b.minZ - radius - pos.z;
    const far = b.maxZ + radius - pos.z;
    const ox = Math.abs(left) < Math.abs(right) ? left : right;
    const oz = Math.abs(near) < Math.abs(far) ? near : far;
    if (Math.abs(ox) < Math.abs(oz)) pos.x += ox;
    else pos.z += oz;
  }
}

/** Whether the segment a→b passes through any box (slab test). */
export function segmentBlocked(a: Pt, b: Pt, boxes: readonly Box[]): boolean {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (const bx of boxes) {
    let t0 = 0;
    let t1 = 1;
    let hit = true;
    for (const [p, d, lo, hi] of [
      [a.x, dx, bx.minX, bx.maxX],
      [a.z, dz, bx.minZ, bx.maxZ],
    ] as const) {
      if (Math.abs(d) < 1e-9) {
        if (p < lo || p > hi) {
          hit = false;
          break;
        }
        continue;
      }
      let ta = (lo - p) / d;
      let tb = (hi - p) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
