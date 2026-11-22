/**
 * Minimal kinematic collision for a third-person game, written for Expo Go (no native physics engine).
 *
 * World = static colliders: yaw-rotated boxes, vertical cylinders, ramps (walkable sloped strips) and
 * heightfields (terrain). Characters are vertical capsules approximated as a circle in XZ with a
 * vertical extent. Ground = highest surface under the character that is not above its step height.
 * Walls = solid shapes overlapping the body above the step height; the circle is pushed out of them.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

interface ColliderBase {
  id: number;
  /** Disabled colliders are ignored (opened doors, hidden pickups). */
  enabled: boolean;
}

export interface BoxCollider extends ColliderBase {
  kind: 'box';
  center: Vec3;
  half: Vec3;
  yaw: number;
  cos: number;
  sin: number;
}

export interface CylinderCollider extends ColliderBase {
  kind: 'cylinder';
  center: Vec3;
  radius: number;
  halfHeight: number;
}

/** Walkable strip from a to b (top surface), e.g. a sloped bridge deck. No side walls. */
export interface RampCollider extends ColliderBase {
  kind: 'ramp';
  a: Vec3;
  b: Vec3;
  halfWidth: number;
}

export interface HeightfieldCollider extends ColliderBase {
  kind: 'heightfield';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: (x: number, z: number) => number;
}

export type Collider = BoxCollider | CylinderCollider | RampCollider | HeightfieldCollider;

const CELL = 8;

export class Physics {
  private nextId = 1;
  private readonly grid = new Map<string, Collider[]>();
  private readonly heightfields: HeightfieldCollider[] = [];
  private stamp = 0;
  private readonly seen = new Map<number, number>();

  addBox(center: Vec3, size: Vec3, yaw = 0): BoxCollider {
    const c: BoxCollider = {
      kind: 'box', id: this.nextId++, enabled: true,
      center: { ...center }, half: { x: size.x / 2, y: size.y / 2, z: size.z / 2 },
      yaw, cos: Math.cos(yaw), sin: Math.sin(yaw),
    };
    // XZ bounding radius of the rotated rectangle.
    const r = Math.hypot(c.half.x, c.half.z);
    this.insert(c, center.x - r, center.x + r, center.z - r, center.z + r);
    return c;
  }

  addCylinder(center: Vec3, radius: number, height: number): CylinderCollider {
    const c: CylinderCollider = {
      kind: 'cylinder', id: this.nextId++, enabled: true, center: { ...center }, radius, halfHeight: height / 2,
    };
    this.insert(c, center.x - radius, center.x + radius, center.z - radius, center.z + radius);
    return c;
  }

  addRamp(a: Vec3, b: Vec3, width: number): RampCollider {
    const c: RampCollider = { kind: 'ramp', id: this.nextId++, enabled: true, a: { ...a }, b: { ...b }, halfWidth: width / 2 };
    const w = width / 2;
    this.insert(c, Math.min(a.x, b.x) - w, Math.max(a.x, b.x) + w, Math.min(a.z, b.z) - w, Math.max(a.z, b.z) + w);
    return c;
  }

  addHeightfield(minX: number, maxX: number, minZ: number, maxZ: number, height: (x: number, z: number) => number) {
    const c: HeightfieldCollider = { kind: 'heightfield', id: this.nextId++, enabled: true, minX, maxX, minZ, maxZ, height };
    this.heightfields.push(c);
    return c;
  }

  private insert(c: Collider, minX: number, maxX: number, minZ: number, maxZ: number) {
    for (let gx = Math.floor(minX / CELL); gx <= Math.floor(maxX / CELL); gx++)
      for (let gz = Math.floor(minZ / CELL); gz <= Math.floor(maxZ / CELL); gz++) {
        const key = `${gx},${gz}`;
        let list = this.grid.get(key);
        if (!list) this.grid.set(key, (list = []));
        list.push(c);
      }
  }

  /** Colliders whose XZ bounds may touch the circle (x, z, r). Each returned once. */
  private candidates(x: number, z: number, r: number, out: Collider[]) {
    out.length = 0;
    this.stamp++;
    for (let gx = Math.floor((x - r) / CELL); gx <= Math.floor((x + r) / CELL); gx++)
      for (let gz = Math.floor((z - r) / CELL); gz <= Math.floor((z + r) / CELL); gz++) {
        const list = this.grid.get(`${gx},${gz}`);
        if (!list) continue;
        for (const c of list) {
          if (!c.enabled || this.seen.get(c.id) === this.stamp) continue;
          this.seen.set(c.id, this.stamp);
          out.push(c);
        }
      }
    return out;
  }

  private readonly tmp: Collider[] = [];

  /** Highest walkable surface at (x, z) whose top is <= maxY. -Infinity if none. */
  surfaceAt(x: number, z: number, maxY: number): number {
    let best = -Infinity;
    for (const h of this.heightfields) {
      if (!h.enabled || x < h.minX || x > h.maxX || z < h.minZ || z > h.maxZ) continue;
      const y = h.height(x, z);
      if (y <= maxY && y > best) best = y;
    }
    for (const c of this.candidates(x, z, 0, this.tmp)) {
      let top = -Infinity;
      if (c.kind === 'box') {
        const dx = x - c.center.x, dz = z - c.center.z;
        const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
        if (Math.abs(lx) <= c.half.x && Math.abs(lz) <= c.half.z) top = c.center.y + c.half.y;
      } else if (c.kind === 'cylinder') {
        if (Math.hypot(x - c.center.x, z - c.center.z) <= c.radius) top = c.center.y + c.halfHeight;
      } else if (c.kind === 'ramp') {
        const abx = c.b.x - c.a.x, abz = c.b.z - c.a.z;
        const len2 = abx * abx + abz * abz;
        const t = len2 > 0 ? ((x - c.a.x) * abx + (z - c.a.z) * abz) / len2 : 0;
        if (t >= 0 && t <= 1) {
          const px = c.a.x + abx * t, pz = c.a.z + abz * t;
          if (Math.hypot(x - px, z - pz) <= c.halfWidth) top = c.a.y + (c.b.y - c.a.y) * t;
        }
      }
      if (top <= maxY && top > best) best = top;
    }
    return best;
  }

  /** Ground under a character: max over the centre and four points at `spread` (ledge forgiveness). */
  groundUnder(x: number, z: number, spread: number, maxY: number): number {
    return Math.max(
      this.surfaceAt(x, z, maxY),
      this.surfaceAt(x + spread, z, maxY),
      this.surfaceAt(x - spread, z, maxY),
      this.surfaceAt(x, z + spread, maxY),
      this.surfaceAt(x, z - spread, maxY),
    );
  }

  /**
   * Push a circle out of solid boxes/cylinders that overlap the vertical band [bottomY, topY].
   * Mutates pos.x / pos.z. Returns true if anything was hit.
   */
  resolveWalls(pos: Vec3, radius: number, bottomY: number, topY: number): boolean {
    let hit = false;
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.candidates(pos.x, pos.z, radius, this.tmp)) {
        if (c.kind === 'box') {
          if (c.center.y + c.half.y <= bottomY || c.center.y - c.half.y >= topY) continue;
          const dx = pos.x - c.center.x, dz = pos.z - c.center.z;
          const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
          const cx = Math.max(-c.half.x, Math.min(c.half.x, lx));
          const cz = Math.max(-c.half.z, Math.min(c.half.z, lz));
          let nx = lx - cx, nz = lz - cz;
          let d = Math.hypot(nx, nz);
          let push: number;
          if (d > 1e-6) {
            if (d >= radius) continue;
            push = radius - d;
            nx /= d; nz /= d;
          } else {
            // Centre inside the box: leave by the nearest face.
            const px = c.half.x - Math.abs(lx), pz = c.half.z - Math.abs(lz);
            if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; push = px + radius; }
            else { nx = 0; nz = Math.sign(lz) || 1; push = pz + radius; }
          }
          // Back to world space (inverse of the local rotation above).
          const wx = nx * c.cos + nz * c.sin, wz = -nx * c.sin + nz * c.cos;
          pos.x += wx * push;
          pos.z += wz * push;
          hit = true;
        } else if (c.kind === 'cylinder') {
          if (c.center.y + c.halfHeight <= bottomY || c.center.y - c.halfHeight >= topY) continue;
          const dx = pos.x - c.center.x, dz = pos.z - c.center.z;
          const d = Math.hypot(dx, dz);
          const min = c.radius + radius;
          if (d >= min) continue;
          const nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0;
          pos.x = c.center.x + nx * min;
          pos.z = c.center.z + nz * min;
          hit = true;
        }
      }
    }
    return hit;
  }

  /** Would a circle at (x, z) overlap a wall in the band? (Used for companion steering.) */
  blocked(x: number, z: number, radius: number, bottomY: number, topY: number): boolean {
    const p = { x, y: 0, z };
    return this.resolveWalls(p, radius, bottomY, topY);
  }

  /** True if the point is inside any solid box/cylinder (camera occlusion). */
  pointInSolid(p: Vec3): boolean {
    for (const c of this.candidates(p.x, p.z, 0, this.tmp)) {
      if (c.kind === 'box') {
        if (Math.abs(p.y - c.center.y) > c.half.y) continue;
        const dx = p.x - c.center.x, dz = p.z - c.center.z;
        const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
        if (Math.abs(lx) <= c.half.x && Math.abs(lz) <= c.half.z) return true;
      } else if (c.kind === 'cylinder') {
        if (Math.abs(p.y - c.center.y) > c.halfHeight) continue;
        if (Math.hypot(p.x - c.center.x, p.z - c.center.z) <= c.radius) return true;
      }
    }
    for (const h of this.heightfields) {
      if (p.x >= h.minX && p.x <= h.maxX && p.z >= h.minZ && p.z <= h.maxZ && p.y < h.height(p.x, p.z)) return true;
    }
    return false;
  }
}

/** Kinematic character: feet position, gravity, step-up, ground snapping. */
export class CharacterBody {
  readonly pos: Vec3;
  readonly vel: Vec3 = v3();
  grounded = false;
  readonly radius = 0.35;
  readonly height = 1.8;
  readonly stepHeight = 0.35;
  gravity = -22;

  constructor(pos: Vec3) {
    this.pos = { ...pos };
  }

  warp(p: Vec3) {
    this.pos.x = p.x; this.pos.y = p.y; this.pos.z = p.z;
    this.vel.x = this.vel.y = this.vel.z = 0;
    this.grounded = false;
  }

  /** Move with horizontal velocity (hx, hz) for dt seconds. Returns true if a wall was hit. */
  step(physics: Physics, hx: number, hz: number, dt: number): boolean {
    const p = this.pos;
    p.x += hx * dt;
    p.z += hz * dt;
    const hitWall = physics.resolveWalls(p, this.radius, p.y + this.stepHeight, p.y + this.height);

    this.vel.y += this.gravity * dt;
    const ground = physics.groundUnder(p.x, p.z, this.radius * 0.6, p.y + this.stepHeight);
    let ny = p.y + this.vel.y * dt;

    if (this.vel.y <= 0 && ny <= ground) {
      ny = ground; // landed, or stepped up onto something low
      this.vel.y = 0;
      this.grounded = true;
    } else if (this.grounded && this.vel.y <= 0 && ground > p.y - 0.45) {
      ny = ground; // walking down stairs or a gentle slope: stay glued
      this.vel.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    p.y = ny;
    return hitWall;
  }
}
