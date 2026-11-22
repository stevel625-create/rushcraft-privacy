import { dist, segmentBlocked, type Box, type Pt } from "./geom.ts";

/**
 * The Listener's behaviour in the open stages (3 onward). It drives the same
 * body mesh as the original Listener, so it looks identical; only the brain
 * differs: grid pathfinding around obstacles, sight that the flashlight
 * extends, hearing that depends on how you move, noise investigation, and
 * awareness of hiding spots.
 *
 * No three.js import: the body is any object with a position/rotation, so
 * this file runs (and is tested) in plain Node.
 */

export type Arena = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  solids: readonly Box[];
  /** Waypoints it walks between when it has nothing better to do. */
  patrol: readonly Pt[];
  start: Pt;
};

export type HunterBody = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
  visible: boolean;
};

type Mode = "patrol" | "investigate" | "chase" | "search" | "stunned";

const CELL = 0.5;
const INFLATE = 0.35;
const SPEED: Record<Mode, number> = { patrol: 1.3, investigate: 2.2, search: 1.6, chase: 3.6, stunned: 0 };
const SIGHT_DARK = 8;
const SIGHT_LIT = 15; // your flashlight gives you away from further off
const HEAR_RUN = 13;
const HEAR_WALK = 6;
const HEAR_SNEAK = 2;
const FOV_COS = Math.cos((70 * Math.PI) / 180);
const CATCH = 0.85;
const LOSE_AFTER = 2.5;
/** If it was this close and saw you a moment ago, it saw you get in. */
const HIDE_SPOTTED = 3;

export class Hunter {
  alert = false;
  distance = Infinity;
  body: HunterBody | null = null;
  /** Set by the stage each frame: while true it hears nothing. */
  muffled = false;
  /** Set by the stage each frame: it won't step into this area. */
  forbidden: Box | null = null;

  private readonly cols: number;
  private readonly rows: number;
  private readonly blocked: Uint8Array;
  private readonly inflated: Box[];
  private pos: Pt;
  private heading: Pt = { x: 0, z: 1 };
  private mode: Mode = "patrol";
  private path: Pt[] = [];
  private goal: Pt | null = null;
  private repathAt = 0;
  private patrolIdx = 0;
  private lastSeen: Pt | null = null;
  private lostFor = 0;
  private seesNow = false;
  private stunLeft = 0;
  private searchLeft = 0;
  private searchCentre: Pt = { x: 0, z: 0 };
  private prevPlayer: Pt | null = null;
  private clock = 0;
  private stride = 0;
  private baseY = 0;
  private rand: () => number;

  private readonly arena: Arena;

  constructor(arena: Arena, rand: () => number = Math.random) {
    this.arena = arena;
    this.rand = rand;
    this.cols = Math.ceil((arena.maxX - arena.minX) / CELL);
    this.rows = Math.ceil((arena.maxZ - arena.minZ) / CELL);
    this.blocked = new Uint8Array(this.cols * this.rows);
    this.inflated = arena.solids.map((b) => ({
      minX: b.minX - INFLATE,
      maxX: b.maxX + INFLATE,
      minZ: b.minZ - INFLATE,
      maxZ: b.maxZ + INFLATE,
    }));
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const p = this.centre(c, r);
        const edge =
          p.x < arena.minX + INFLATE || p.x > arena.maxX - INFLATE ||
          p.z < arena.minZ + INFLATE || p.z > arena.maxZ - INFLATE;
        if (edge || this.inflated.some((b) => p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ)) {
          this.blocked[r * this.cols + c] = 1;
        }
      }
    }
    this.pos = { ...arena.start };
  }

  /** Where it stands, in game coordinates. */
  get position(): Readonly<Pt> {
    return this.pos;
  }

  get stunned(): boolean {
    return this.stunLeft > 0;
  }

  /** Blinded: it stops dead, then comes round searching where it stood. */
  stun(seconds: number): void {
    this.stunLeft = seconds;
    this.mode = "stunned";
    this.path = [];
    this.alert = false;
  }

  /** Takes over a body mesh (the Listener's), remembering its resting height. */
  attach(body: HunterBody): void {
    this.body = body;
    this.baseY = body.position.y;
    this.place();
  }

  reset(): void {
    this.pos = { ...this.arena.start };
    this.mode = "patrol";
    this.path = [];
    this.goal = null;
    this.lastSeen = null;
    this.prevPlayer = null;
    this.alert = false;
    this.distance = Infinity;
    this.lostFor = 0;
    this.stunLeft = 0;
    this.place();
  }

  /** Something loud happened at `p`. It comes to look unless it's already chasing. */
  hearNoise(p: Pt): void {
    if (this.mode === "chase" || this.muffled || this.stunLeft > 0) return;
    this.mode = "investigate";
    this.setGoal(p);
  }

  /** Advances one frame. Returns true if it caught the player. */
  tick(player: Pt, slow: boolean, running: boolean, dt: number, lit = false, hidden = false): boolean {
    this.clock += dt;
    const d = dist(this.pos, player);
    this.distance = d;
    const speed = this.prevPlayer && dt > 0 ? dist(player, this.prevPlayer) / dt : 0;
    this.prevPlayer = { ...player };

    this.seesNow = false;
    if (this.stunLeft > 0) {
      this.stunLeft -= dt;
      if (this.stunLeft <= 0) this.startSearch(this.pos, 4);
      this.place();
      return false;
    }
    if (hidden) {
      if (this.mode === "chase" && this.lostFor < 1 && d < HIDE_SPOTTED) return this.caught();
      if (this.mode === "chase") this.startSearch(this.lastSeen ?? player, 6);
    } else {
      const sees = this.canSee(player, d, lit);
      const hearRange = this.muffled ? 0 : running ? HEAR_RUN : speed > 0.5 ? (slow ? HEAR_SNEAK : HEAR_WALK) : 0;
      this.seesNow = sees;
      if (sees) {
        this.mode = "chase";
        this.lastSeen = { ...player };
        this.lostFor = 0;
      } else if (d < hearRange) {
        this.lastSeen = { ...player };
        if (this.mode === "chase") this.lostFor = 0;
        else {
          this.mode = "investigate";
          this.setGoal(player);
        }
      }
      if (d < CATCH) return this.caught();
    }

    this.think(dt, player, hidden);
    this.move(dt);
    this.alert = this.mode === "chase";
    this.place();
    return false;
  }

  // ------------------------------------------------------------- behaviour

  private think(dt: number, player: Pt, hidden: boolean): void {
    switch (this.mode) {
      case "chase": {
        if (!this.seesNow) this.lostFor += dt;
        if (this.lostFor > LOSE_AFTER) {
          this.startSearch(this.lastSeen ?? player, 6);
          break;
        }
        const target = this.seesNow ? player : (this.lastSeen ?? player);
        if (this.clock >= this.repathAt || !this.goal || dist(this.goal, target) > 1) {
          this.setGoal(target);
          this.repathAt = this.clock + 0.4;
        }
        break;
      }
      case "investigate":
        if (this.arrived()) this.startSearch(this.goal ?? this.pos, 5);
        break;
      case "search":
        this.searchLeft -= dt;
        if (this.searchLeft <= 0) {
          this.mode = "patrol";
          this.goal = null;
        } else if (this.arrived()) {
          this.setGoal(this.randomNear(this.searchCentre, 4));
        }
        break;
      case "patrol":
        if (!this.goal || this.arrived()) {
          const pts = this.arena.patrol;
          if (pts.length) {
            this.patrolIdx = (this.patrolIdx + 1) % pts.length;
            this.setGoal(pts[this.patrolIdx]);
          }
        }
        break;
    }
  }

  private startSearch(centre: Pt, seconds: number): void {
    this.mode = "search";
    this.searchCentre = { ...centre };
    this.searchLeft = seconds;
    this.setGoal(centre);
  }

  private canSee(player: Pt, d: number, lit: boolean): boolean {
    if (d > (lit ? SIGHT_LIT : SIGHT_DARK)) return false;
    if (this.mode !== "chase" && d > 3) {
      const dot = ((player.x - this.pos.x) * this.heading.x + (player.z - this.pos.z) * this.heading.z) / Math.max(d, 1e-6);
      if (dot < FOV_COS) return false;
    }
    return !segmentBlocked(this.pos, player, this.arena.solids);
  }

  private caught(): boolean {
    this.alert = false;
    return true;
  }

  // ------------------------------------------------------------- movement

  private arrived(): boolean {
    return this.path.length === 0;
  }

  private move(dt: number): void {
    let step = SPEED[this.mode] * dt;
    const keepOut = this.forbidden;
    const inside = (p: Pt) =>
      !!keepOut && p.x >= keepOut.minX && p.x <= keepOut.maxX && p.z >= keepOut.minZ && p.z <= keepOut.maxZ;
    const startedInside = inside(this.pos);
    while (step > 0 && this.path.length) {
      const next = this.path[0];
      const dx = next.x - this.pos.x;
      const dz = next.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      // Wait at the edge rather than walk into a no-go area (already inside: keep going, to get out).
      if (!startedInside && d > 0) {
        const s = Math.min(step, d);
        if (inside({ x: this.pos.x + (dx / d) * s, z: this.pos.z + (dz / d) * s })) break;
      }
      if (d <= step) {
        this.pos = { ...next };
        this.path.shift();
        step -= d;
        this.stride += d;
      } else {
        this.pos.x += (dx / d) * step;
        this.pos.z += (dz / d) * step;
        this.heading = { x: dx / d, z: dz / d };
        this.stride += step;
        step = 0;
      }
    }
  }

  private place(): void {
    const body = this.body;
    if (!body) return;
    body.position.x = this.pos.x;
    body.position.z = -this.pos.z;
    // A heavy, uneven gait: faster sway when it's chasing.
    body.position.y = this.baseY + Math.abs(Math.sin(this.stride * (this.mode === "chase" ? 2.4 : 1.8))) * 0.06;
    body.rotation.y = Math.atan2(this.heading.x, -this.heading.z);
    // Stunned: it rocks back on its heels.
    body.rotation.x = this.stunLeft > 0 ? -0.25 + Math.sin(this.clock * 9) * 0.06 : 0;
  }

  // ------------------------------------------------------------- pathing

  private setGoal(target: Pt): void {
    this.goal = { ...target };
    this.path = this.findPath(this.pos, target);
  }

  private randomNear(c: Pt, radius: number): Pt {
    for (let i = 0; i < 12; i++) {
      const p = { x: c.x + (this.rand() * 2 - 1) * radius, z: c.z + (this.rand() * 2 - 1) * radius };
      const cell = this.cellOf(p);
      if (cell >= 0 && !this.blocked[cell]) return p;
    }
    return { ...c };
  }

  private centre(c: number, r: number): Pt {
    return { x: this.arena.minX + (c + 0.5) * CELL, z: this.arena.minZ + (r + 0.5) * CELL };
  }

  private cellOf(p: Pt): number {
    const c = Math.floor((p.x - this.arena.minX) / CELL);
    const r = Math.floor((p.z - this.arena.minZ) / CELL);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  /** Nearest open cell to `p` (goals often sit right against a wall or lever). */
  private openCell(p: Pt): number {
    const c0 = Math.min(this.cols - 1, Math.max(0, Math.floor((p.x - this.arena.minX) / CELL)));
    const r0 = Math.min(this.rows - 1, Math.max(0, Math.floor((p.z - this.arena.minZ) / CELL)));
    for (let ring = 0; ring < 8; ring++) {
      let best = -1;
      let bestD = Infinity;
      for (let r = r0 - ring; r <= r0 + ring; r++) {
        for (let c = c0 - ring; c <= c0 + ring; c++) {
          if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) continue;
          if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== ring) continue;
          const i = r * this.cols + c;
          if (this.blocked[i]) continue;
          const q = this.centre(c, r);
          const d = dist(q, p);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  /** A* over the grid, then string-pulled so it walks straight lines. */
  findPath(from: Pt, to: Pt): Pt[] {
    const start = this.openCell(from);
    const end = this.openCell(to);
    if (start < 0 || end < 0) return [];
    // Same cell: walk to the exact goal only if it's open (it may sit inside a lever frame).
    if (start === end) return [this.cellOf(to) === end ? { ...to } : this.centre(end % this.cols, (end / this.cols) | 0)];
    const n = this.cols * this.rows;
    const g = new Float32Array(n).fill(Infinity);
    const came = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const heap = new MinHeap();
    const ec = end % this.cols;
    const er = (end / this.cols) | 0;
    const h = (i: number) => {
      const dx = Math.abs((i % this.cols) - ec);
      const dz = Math.abs(((i / this.cols) | 0) - er);
      return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz);
    };
    g[start] = 0;
    heap.push(start, h(start));
    while (heap.size) {
      const cur = heap.pop();
      if (cur === end) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cc = cur % this.cols;
      const cr = (cur / this.cols) | 0;
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const nc = cc + dx;
          const nr = cr + dz;
          if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue;
          const ni = nr * this.cols + nc;
          if (this.blocked[ni] || closed[ni]) continue;
          // No cutting corners past obstacles.
          if (dx && dz && (this.blocked[cr * this.cols + nc] || this.blocked[nr * this.cols + cc])) continue;
          const ng = g[cur] + (dx && dz ? 1.4142 : 1);
          if (ng < g[ni]) {
            g[ni] = ng;
            came[ni] = cur;
            heap.push(ni, ng + h(ni));
          }
        }
      }
    }
    if (came[end] < 0) return [];
    const cells: Pt[] = [];
    for (let i = end; i !== start; i = came[i]) cells.push(this.centre(i % this.cols, (i / this.cols) | 0));
    cells.reverse();
    const goalOpen = this.cellOf(to) === end;
    if (goalOpen) cells[cells.length - 1] = { ...to };
    // String-pull: skip waypoints we can walk to directly.
    const out: Pt[] = [];
    let anchor = from;
    let i = 0;
    while (i < cells.length) {
      let j = cells.length - 1;
      while (j > i && segmentBlocked(anchor, cells[j], this.inflated)) j--;
      out.push(cells[j]);
      anchor = cells[j];
      i = j + 1;
    }
    return out;
  }
}

/** Binary min-heap of grid indices keyed by f-score. */
class MinHeap {
  private ids: number[] = [];
  private keys: number[] = [];
  get size(): number {
    return this.ids.length;
  }
  push(id: number, key: number): void {
    const ids = this.ids;
    const keys = this.keys;
    let i = ids.length;
    ids.push(id);
    keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= key) break;
      ids[i] = ids[p];
      keys[i] = keys[p];
      i = p;
    }
    ids[i] = id;
    keys[i] = key;
  }
  pop(): number {
    const ids = this.ids;
    const keys = this.keys;
    const top = ids[0];
    const lastId = ids.pop()!;
    const lastKey = keys.pop()!;
    const n = ids.length;
    if (n) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= n) break;
        const r = l + 1;
        const c = r < n && keys[r] < keys[l] ? r : l;
        if (keys[c] >= lastKey) break;
        ids[i] = ids[c];
        keys[i] = keys[c];
        i = c;
      }
      ids[i] = lastId;
      keys[i] = lastKey;
    }
    return top;
  }
}

