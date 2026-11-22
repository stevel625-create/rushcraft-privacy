import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  Brazier, Checkpoint, CountedObjective, InteractAction, KillVolume, ObjectiveTrigger, PressurePlate, SlidingDoor,
  type Interactable, type Mechanic,
} from './mechanics';
import { Physics, v3, type Vec3 } from './physics';
import { grassBlades, surfaceMaps, type Surface } from './textures';

// Shared unit geometries (scaled per mesh), non-indexed so everything can be merged together.
const BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const CYL = new THREE.CylinderGeometry(1, 1, 1, 16).toNonIndexed();
const SPHERE = new THREE.SphereGeometry(1, 14, 10).toNonIndexed();

export type Color = number;

interface MeshOpts {
  /** Add a collider (default true for box/cylinder, false for sphere). */
  collide?: boolean;
  /** Yaw in radians (visual and collider). */
  yaw?: number;
  /** Extra visual-only rotation (pitch, roll); colliders stay upright. */
  tilt?: { x?: number; z?: number };
  emissive?: Color;
  /** Surface detail (texture + roughness). Default: rock-like weathering. */
  surface?: Surface;
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
 * Write box-projected UVs from (transformed) positions and normals: each face picks the plane its
 * normal faces most, so textures keep a consistent real-world scale on every object.
 */
function bakeUVs(geo: THREE.BufferGeometry, tile: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nrm = geo.attributes.normal as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    let u: number, v: number;
    if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
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
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();
  private readonly ownedGeometries: THREE.BufferGeometry[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly staticMeshes: THREE.Mesh[] = [];
  private readonly animatedMaps: THREE.Texture[] = [];
  private grass: { x: number; y: number; z: number; s: number; color: Color }[] = [];
  private lightCount = 0;

  constructor(seed: number) {
    this.rng = new Rng(seed);
  }

  mat(color: Color, surface: Surface = 'rock', emissive?: Color, vertexColors = false): THREE.MeshStandardMaterial {
    const key = `${color}|${surface}|${emissive ?? ''}|${vertexColors}`;
    let m = this.materials.get(key);
    if (!m) {
      const maps = surfaceMaps(surface);
      m = new THREE.MeshStandardMaterial({
        color, map: maps.map, normalMap: maps.normalMap, roughness: maps.roughness, metalness: maps.metalness,
      });
      m.normalScale.set(0.8, 0.8);
      m.vertexColors = vertexColors;
      if (emissive !== undefined) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 1.2; }
      m.userData.tile = maps.tile;
      this.materials.set(key, m);
    }
    return m;
  }

  private place(geo: THREE.BufferGeometry, center: Vec3, scale: Vec3, color: Color, o: MeshOpts, parent?: THREE.Object3D) {
    const material = this.mat(color, o.surface ?? 'rock', o.emissive);
    let g = geo;
    if (o.dynamic || parent) {
      // Moving objects get their own UVs in local (scaled) space so the texture moves with them.
      g = geo.clone();
      g.scale(scale.x, scale.y, scale.z);
      bakeUVs(g, material.userData.tile);
      this.ownedGeometries.push(g);
    }
    const mesh = new THREE.Mesh(g, material);
    mesh.position.set(center.x, center.y, center.z);
    if (g === geo) mesh.scale.set(scale.x, scale.y, scale.z);
    mesh.rotation.set(o.tilt?.x ?? 0, o.yaw ?? 0, o.tilt?.z ?? 0, 'YXZ');
    mesh.castShadow = true;
    mesh.receiveShadow = true;
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

  /** Irregular boulder: a jittered icosahedron (looks like rock, not a ball). */
  boulder(center: Vec3, size: number, color: Color, collide = true) {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const seen = new Map<string, number>();
    for (let i = 0; i < pos.count; i++) {
      const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
      let k = seen.get(key);
      if (k === undefined) { k = 0.78 + this.rng.next() * 0.4; seen.set(key, k); }
      pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.7, pos.getZ(i) * k);
    }
    geo.computeVertexNormals();
    this.ownedGeometries.push(geo);
    const mesh = this.place(geo, center, v3(size, size, size), color, { surface: 'rock' });
    mesh.rotation.y = this.rng.range(0, Math.PI * 2);
    if (collide) this.physics.addCylinder(center, size * 0.8, size * 1.4);
    return mesh;
  }

  /** Square heightfield terrain centred at (cx, cz). Grass by default; tufts are scattered by grassCover(). */
  ground(cx: number, cz: number, size: number, grid: number, height: (x: number, z: number) => number, color: Color, surface: Surface = 'grass') {
    const geo = new THREE.PlaneGeometry(size, size, grid, grid).toNonIndexed();
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
      pos.setXYZ(i, x, height(x, z), z);
    }
    geo.computeVertexNormals();
    this.ownedGeometries.push(geo);
    const mesh = new THREE.Mesh(geo, this.mat(color, surface));
    mesh.receiveShadow = true;
    this.root.add(mesh);
    this.staticMeshes.push(mesh);
    this.physics.addHeightfield(cx - size / 2, cx + size / 2, cz - size / 2, cz + size / 2, height);
    return mesh;
  }

  /** Flat liquid surface. Water is translucent and ripples; lava glows. With kill, touching it respawns Jason. */
  liquid(center: Vec3, sx: number, sz: number, color: Color, kill: boolean, emissive?: Color) {
    const isLava = emissive !== undefined;
    const maps = surfaceMaps(isLava ? 'lava' : 'water');
    const material = new THREE.MeshStandardMaterial({
      color, roughness: maps.roughness, metalness: 0, normalMap: maps.normalMap, map: isLava ? null : maps.map,
      transparent: !isLava, opacity: isLava ? 1 : 0.82,
    });
    if (isLava) { material.emissive = new THREE.Color(emissive); material.emissiveMap = maps.map; material.emissiveIntensity = 1.6; }
    this.ownedMaterials.push(material);
    const geo = new THREE.PlaneGeometry(sx, sz);
    geo.rotateX(-Math.PI / 2);
    bakeUVs(geo, maps.tile);
    this.ownedGeometries.push(geo);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(center.x, center.y + 0.1, center.z);
    mesh.receiveShadow = true;
    this.root.add(mesh);
    if (maps.normalMap) this.animatedMaps.push(maps.normalMap);
    if (isLava && maps.map) this.animatedMaps.push(maps.map);
    if (kill) this.mechanics.push(new KillVolume(v3(center.x - sx / 2, center.y - 0.1, center.z - sz / 2), v3(center.x + sx / 2, center.y + 0.1, center.z + sz / 2)));
  }

  /** Walkable sloped strip with top surface from a to b (bridge decks). */
  ramp(a: Vec3, b: Vec3, width: number, thickness: number, color: Color, collide = true, surface: Surface = 'wood') {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const flat = Math.hypot(dx, dz);
    const len = Math.hypot(flat, dy);
    const mesh = new THREE.Mesh(BOX, this.mat(color, surface));
    mesh.scale.set(width, thickness, len);
    mesh.rotation.set(-Math.atan2(dy, flat), Math.atan2(dx, dz), 0, 'YXZ');
    mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 - thickness / 2, (a.z + b.z) / 2);
    mesh.castShadow = mesh.receiveShadow = true;
    this.root.add(mesh);
    this.staticMeshes.push(mesh);
    if (collide) this.physics.addRamp(a, b, width);
    return mesh;
  }

  /** Jungle tree: tapered bark trunk, a few branches, and clustered leafy canopy. */
  tree(base: Vec3, trunk: Color, leaf: Color, minH = 5, maxH = 9) {
    const r = this.rng;
    const h = r.range(minH, maxH);
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.3, h, 9, 4).toNonIndexed();
    this.ownedGeometries.push(trunkGeo);
    const lean = { x: r.range(-0.06, 0.06), z: r.range(-0.06, 0.06) };
    this.place(trunkGeo, v3(base.x, base.y + h / 2, base.z), v3(1, 1, 1), trunk, { surface: 'bark', tilt: lean });
    this.physics.addCylinder(v3(base.x, base.y + h / 2, base.z), 0.28, h);

    const top = v3(base.x + lean.z * h * 0.5, base.y + h, base.z - lean.x * h * 0.5);
    const branches = 3 + Math.floor(r.next() * 2);
    for (let i = 0; i < branches; i++) {
      const a = (i / branches) * Math.PI * 2 + r.range(-0.4, 0.4);
      const len = r.range(1.2, 2.2);
      const y = top.y - r.range(0.3, 1.6);
      const bx = top.x + Math.cos(a) * len * 0.5, bz = top.z + Math.sin(a) * len * 0.5;
      this.place(CYL, v3(bx, y + 0.3, bz), v3(0.07, len, 0.07), trunk,
        { surface: 'bark', yaw: -a, tilt: { z: -(Math.PI / 2 - 0.5) } }); // tip points outward and up
      this.foliage(v3(top.x + Math.cos(a) * len, y + 0.7, top.z + Math.sin(a) * len), r.range(0.9, 1.3), leaf);
    }
    this.foliage(v3(top.x, top.y + 0.5, top.z), r.range(1.4, 1.9), leaf);
  }

  /**
   * Leafy clump: a few overlapping, softly lumpy blobs. Shade variation is stored as vertex colour on one
   * shared leaf material per level colour, so every clump still merges into a single draw call.
   */
  foliage(center: Vec3, size: number, leaf: Color) {
    const material = this.mat(leaf, 'leaf', undefined, true);
    for (let i = 0; i < 3; i++) {
      const tint = new THREE.Color(1, 1, 1).offsetHSL(0, 0, this.rng.range(-0.12, 0.04));
      tint.g = Math.min(1, tint.g + this.rng.range(-0.03, 0.05));
      // Indexed while jittering so shared corners move together, then smooth normals: soft, not spiky.
      let geo: THREE.BufferGeometry = mergeVertices(new THREE.IcosahedronGeometry(1, 2).deleteAttribute('normal').deleteAttribute('uv'));
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < pos.count; k++) {
        const j = 0.86 + this.rng.next() * 0.22;
        pos.setXYZ(k, pos.getX(k) * j, pos.getY(k) * j * 0.78, pos.getZ(k) * j);
      }
      geo.computeVertexNormals();
      geo = geo.toNonIndexed();
      const colors = new Float32Array(geo.attributes.position.count * 3);
      for (let k = 0; k < colors.length; k += 3) { colors[k] = tint.r; colors[k + 1] = tint.g; colors[k + 2] = tint.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      this.ownedGeometries.push(geo);
      const off = v3(this.rng.range(-0.6, 0.6) * size, this.rng.range(-0.2, 0.3) * size, this.rng.range(-0.6, 0.6) * size);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(center.x + off.x, center.y + off.y, center.z + off.z);
      mesh.scale.setScalar(size);
      mesh.rotation.y = this.rng.range(0, Math.PI * 2);
      mesh.castShadow = mesh.receiveShadow = true;
      this.root.add(mesh);
      this.staticMeshes.push(mesh);
    }
  }

  /** Queue grass tufts; finalize() draws them all as one instanced mesh. */
  grassTuft(x: number, y: number, z: number, color: Color, scale = 1) {
    this.grass.push({ x, y, z, s: scale, color });
  }

  // ------------------------------------------------------------ gameplay pieces

  door(center: Vec3, size: Vec3, color: Color, yaw = 0, surface: Surface = 'stone') {
    const { mesh, collider } = this.box(center, size, color, { yaw, dynamic: true, surface });
    const d = new SlidingDoor(mesh, collider!, size.y + 0.05);
    this.mechanics.push(d);
    return d;
  }

  /** Pressure plate whose top surface is at `top`. */
  plate(top: Vec3, color: Color) {
    this.cylinder(v3(top.x, top.y - 0.05, top.z), 0.8, 0.1, color, { surface: 'metal' });
    return new PressurePlate(top);
  }

  pointLight(pos: Vec3, color: Color, distance: number, intensity: number, parent?: THREE.Object3D) {
    const l = new THREE.PointLight(color, intensity * 3, distance, 1.5);
    l.position.set(pos.x, pos.y, pos.z);
    (parent ?? this.root).add(l);
    this.lightCount++;
    return l;
  }

  /** Flame: glowing core with an optional point light, grouped so it toggles as one. */
  flame(pos: Vec3, withLight = true) {
    const g = new THREE.Group();
    this.root.add(g);
    const core = this.sphere(pos, v3(0.16, 0.28, 0.16), 0xffb347, { emissive: 0xff7a1a, dynamic: true, surface: 'plain' }, g);
    core.castShadow = false;
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
    this.cylinder(v3(pos.x, pos.y + 0.45, pos.z), 0.18, 0.9, 0x6b4f2a, { surface: 'metal' });
    this.cylinder(v3(pos.x, pos.y + 1.05, pos.z), 0.5, 0.3, 0x8c6633, { surface: 'metal' });
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

  /** Per-frame cosmetic animation (water ripples, lava flow). */
  tick(dt: number) {
    for (const t of this.animatedMaps) { t.offset.x += dt * 0.02; t.offset.y += dt * 0.013; }
  }

  // ------------------------------------------------------------ batching and cleanup

  /** Merge static meshes by material into a few large meshes, with world-scale UVs; build grass. */
  finalize() {
    const byMat = new Map<THREE.MeshStandardMaterial, THREE.BufferGeometry[]>();
    for (const m of this.staticMeshes) {
      m.updateMatrixWorld(true);
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      const mat = m.material as THREE.MeshStandardMaterial;
      bakeUVs(g, mat.userData.tile ?? 2);
      const clean = new THREE.BufferGeometry()
        .setAttribute('position', g.getAttribute('position'))
        .setAttribute('normal', g.getAttribute('normal'))
        .setAttribute('uv', g.getAttribute('uv'));
      // Vertex-coloured materials keep their colours; every geometry in that group has them.
      if (mat.vertexColors && g.getAttribute('color')) clean.setAttribute('color', g.getAttribute('color'));
      g = clean;
      if (!byMat.has(mat)) byMat.set(mat, []);
      byMat.get(mat)!.push(g);
      this.root.remove(m);
    }
    for (const [mat, geos] of byMat) {
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) continue;
      this.ownedGeometries.push(merged);
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
    }
    this.staticMeshes.length = 0;
    this.buildGrass();
  }

  private buildGrass() {
    if (this.grass.length === 0) return;
    // Two crossed cards per tuft, all in one instanced draw call.
    const card = new THREE.PlaneGeometry(0.9, 0.7);
    card.translate(0, 0.35, 0);
    const card2 = card.clone().rotateY(Math.PI / 2);
    const geo = mergeGeometries([card, card2], false)!;
    card.dispose(); card2.dispose();
    this.ownedGeometries.push(geo);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: grassBlades(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9,
    });
    this.ownedMaterials.push(material);
    const mesh = new THREE.InstancedMesh(geo, material, this.grass.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
    this.grass.forEach((t, i) => {
      q.setFromAxisAngle(up, this.rng.range(0, Math.PI));
      s.set(t.s, t.s * this.rng.range(0.8, 1.3), t.s);
      m.compose(p.set(t.x, t.y, t.z), q, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.setHex(t.color).offsetHSL(0, 0, this.rng.range(-0.06, 0.06)));
    });
    mesh.receiveShadow = true;
    this.root.add(mesh);
    this.grass = [];
  }

  dispose() {
    this.root.removeFromParent();
    this.ownedGeometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.ownedMaterials.forEach((m) => m.dispose());
  }
}
