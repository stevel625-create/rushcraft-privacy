import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  Brazier, Checkpoint, CountedObjective, InteractAction, KillVolume, ObjectiveTrigger, PressurePlate, SlidingDoor,
  type Interactable, type Mechanic,
} from './mechanics';
import { Physics, v3, type Vec3 } from './physics';

// Shared unit geometries (scaled per mesh). Never disposed: reused by every level.
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
const SPHERE = new THREE.SphereGeometry(1, 12, 8);

export type Color = number;

interface MeshOpts {
  /** Add a collider (default true for box/cylinder, false for sphere). */
  collide?: boolean;
  /** Yaw in radians (visual and collider). */
  yaw?: number;
  /** Extra visual-only rotation (pitch, roll); colliders stay upright. */
  tilt?: { x?: number; z?: number };
  emissive?: Color;
  /** Moving/animated objects must not be merged into the static batch. */
  dynamic?: boolean;
}

/** Deterministic RNG (mulberry32) so every level looks the same each time. */
export class Rng {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number) { return a + (b - a) * this.next(); }
  insideCircle(r: number) {
    const a = this.next() * Math.PI * 2, d = Math.sqrt(this.next()) * r;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  }
}

/**
 * Builds a level: meshes, colliders, mechanics, interactables, lights.
 * Call finalize() once at the end to batch static meshes (big draw-call saving on phones).
 */
export class WorldKit {
  readonly root = new THREE.Group();
  readonly physics = new Physics();
  readonly mechanics: Mechanic[] = [];
  readonly interactables: Interactable[] = [];
  readonly rng: Rng;
  private readonly materials = new Map<string, THREE.MeshLambertMaterial>();
  private readonly ownedGeometries: THREE.BufferGeometry[] = [];
  private readonly staticMeshes: THREE.Mesh[] = [];
  private lightCount = 0;

  constructor(seed: number) {
    this.rng = new Rng(seed);
  }

  mat(color: Color, emissive?: Color): THREE.MeshLambertMaterial {
    const key = `${color}|${emissive ?? ''}`;
    let m = this.materials.get(key);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color, flatShading: true });
      if (emissive !== undefined) m.emissive = new THREE.Color(emissive);
      this.materials.set(key, m);
    }
    return m;
  }

  private place(geo: THREE.BufferGeometry, center: Vec3, scale: Vec3, color: Color, o: MeshOpts, parent?: THREE.Object3D) {
    const mesh = new THREE.Mesh(geo, this.mat(color, o.emissive));
    mesh.position.set(center.x, center.y, center.z);
    mesh.scale.set(scale.x, scale.y, scale.z);
    mesh.rotation.set(o.tilt?.x ?? 0, o.yaw ?? 0, o.tilt?.z ?? 0, 'YXZ');
    (parent ?? this.root).add(mesh);
    if (!o.dynamic && !parent) this.staticMeshes.push(mesh);
    return mesh;
  }

  // ------------------------------------------------------------ primitives

  box(center: Vec3, size: Vec3, color: Color, o: MeshOpts = {}, parent?: THREE.Object3D) {
    const mesh = this.place(BOX, center, size, color, o, parent);
    const collider = o.collide === false ? null : this.physics.addBox(center, size, o.yaw ?? 0);
    return { mesh, collider };
  }

  cylinder(center: Vec3, radius: number, height: number, color: Color, o: MeshOpts = {}, parent?: THREE.Object3D) {
    const mesh = this.place(CYL, center, v3(radius, height, radius), color, o, parent);
    if (o.collide !== false) this.physics.addCylinder(center, radius, height);
    return mesh;
  }

  /** Ellipsoid. With collide, an upright cylinder approximates it. */
  sphere(center: Vec3, radii: number | Vec3, color: Color, o: MeshOpts = {}, parent?: THREE.Object3D) {
    const r = typeof radii === 'number' ? v3(radii, radii, radii) : radii;
    const mesh = this.place(SPHERE, center, r, color, o, parent);
    if (o.collide) this.physics.addCylinder(center, Math.min(r.x, r.z) * 0.85, r.y * 2);
    return mesh;
  }

  /** Square heightfield terrain centred at (cx, cz). */
  ground(cx: number, cz: number, size: number, grid: number, height: (x: number, z: number) => number, color: Color) {
    const geo = new THREE.PlaneGeometry(size, size, grid, grid);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
      pos.setXYZ(i, x, height(x, z), z);
    }
    geo.computeVertexNormals();
    this.ownedGeometries.push(geo);
    const mesh = new THREE.Mesh(geo, this.mat(color));
    this.root.add(mesh);
    this.staticMeshes.push(mesh);
    this.physics.addHeightfield(cx - size / 2, cx + size / 2, cz - size / 2, cz + size / 2, height);
    return mesh;
  }

  /** Flat liquid surface. With kill, touching it respawns Jason / recovers Elena. */
  liquid(center: Vec3, sx: number, sz: number, color: Color, kill: boolean, emissive?: Color) {
    this.box(center, v3(sx, 0.2, sz), color, { collide: false, emissive });
    if (kill) this.mechanics.push(new KillVolume(v3(center.x - sx / 2, center.y - 0.1, center.z - sz / 2), v3(center.x + sx / 2, center.y + 0.1, center.z + sz / 2)));
  }

  /** Walkable sloped strip with top surface from a to b (bridge decks). */
  ramp(a: Vec3, b: Vec3, width: number, thickness: number, color: Color, collide = true) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const flat = Math.hypot(dx, dz);
    const len = Math.hypot(flat, dy);
    const mesh = new THREE.Mesh(BOX, this.mat(color));
    mesh.scale.set(width, thickness, len);
    mesh.rotation.set(-Math.atan2(dy, flat), Math.atan2(dx, dz), 0, 'YXZ');
    mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 - thickness / 2, (a.z + b.z) / 2);
    this.root.add(mesh);
    this.staticMeshes.push(mesh);
    if (collide) this.physics.addRamp(a, b, width);
    return mesh;
  }

  /** Upright tree: collidable trunk plus a canopy you can walk under. */
  tree(base: Vec3, trunk: Color, leaf: Color, minH = 5, maxH = 9) {
    const h = this.rng.range(minH, maxH);
    this.cylinder(v3(base.x, base.y + h / 2, base.z), 0.2, h, trunk);
    this.sphere(v3(base.x, base.y + h + 0.6, base.z), this.rng.range(1.3, 1.9), leaf);
  }

  // ------------------------------------------------------------ gameplay pieces

  door(center: Vec3, size: Vec3, color: Color, yaw = 0) {
    const { mesh, collider } = this.box(center, size, color, { yaw, dynamic: true });
    const d = new SlidingDoor(mesh, collider!, size.y + 0.05);
    this.mechanics.push(d);
    return d;
  }

  /** Pressure plate whose top surface is at `top`. */
  plate(top: Vec3, color: Color) {
    this.cylinder(v3(top.x, top.y - 0.05, top.z), 0.8, 0.1, color);
    return new PressurePlate(top);
  }

  pointLight(pos: Vec3, color: Color, distance: number, intensity: number, parent?: THREE.Object3D) {
    const l = new THREE.PointLight(color, intensity, distance, 1.5);
    l.position.set(pos.x, pos.y, pos.z);
    (parent ?? this.root).add(l);
    this.lightCount++;
    return l;
  }

  /** Flame: glowing sphere with an optional point light, grouped so it toggles as one. */
  flame(pos: Vec3, withLight = true) {
    const g = new THREE.Group();
    this.root.add(g);
    this.sphere(pos, 0.22, 0xff9a3c, { emissive: 0xff6a10, dynamic: true }, g);
    if (withLight) this.pointLight(v3(pos.x, pos.y + 0.3, pos.z), 0xff9a50, 10, 2.2, g);
    return g;
  }

  trigger(objectiveId: string, pos: Vec3, radius: number) {
    this.mechanics.push(new ObjectiveTrigger(objectiveId, v3(pos.x, pos.y + 1, pos.z), radius));
  }

  checkpoint(pos: Vec3, radius = 3) {
    this.mechanics.push(new Checkpoint(pos, radius));
  }

  /** Examinable or interact-to-complete object at `pos`. */
  action(pos: Vec3, prompt: string, message: string, objectiveId?: string, notYet?: string) {
    const a = new InteractAction(pos, prompt, message, objectiveId, notYet);
    this.interactables.push(a);
    this.mechanics.push(a);
    return a;
  }

  brazier(pos: Vec3, owner: CountedObjective) {
    this.cylinder(v3(pos.x, pos.y + 0.6, pos.z), 0.5, 1.2, 0x8c6633);
    const flame = this.flame(v3(pos.x, pos.y + 1.45, pos.z));
    const b = new Brazier(v3(pos.x, pos.y + 0.6, pos.z), flame, owner);
    this.interactables.push(b);
    return b;
  }

  add<T extends Mechanic>(m: T): T {
    this.mechanics.push(m);
    return m;
  }

  get pointLights() { return this.lightCount; }

  // ------------------------------------------------------------ batching and cleanup

  /** Merge static meshes by material into a few large meshes. */
  finalize() {
    const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
    for (const m of this.staticMeshes) {
      m.updateMatrixWorld(true);
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      g.deleteAttribute('uv');
      if (!g.index) continue;
      const mat = m.material as THREE.Material;
      if (!byMat.has(mat)) byMat.set(mat, []);
      byMat.get(mat)!.push(g);
      this.root.remove(m);
    }
    for (const [mat, geos] of byMat) {
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) continue;
      this.ownedGeometries.push(merged);
      this.root.add(new THREE.Mesh(merged, mat));
    }
    this.staticMeshes.length = 0;
  }

  dispose() {
    this.root.removeFromParent();
    this.ownedGeometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
