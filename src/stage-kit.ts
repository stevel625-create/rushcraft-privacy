import * as THREE from "three";
import { collideBoxes, type Box, type Pt } from "./geom.ts";
import type { Arena } from "./hunter.ts";

/**
 * Shared building blocks for stages 3 onward. Each stage is a pure story
 * module (bitmask progress, testable without three.js) plus a world built on
 * StageWorld. The engine drives any stage through StageDef, so adding a stage
 * means adding files, not engine branches.
 */

export type StageResult = {
  bits: number;
  line: string;
  /** The Listener hears this and comes to the spot. */
  noisy: boolean;
};

export type StageLines = {
  arrival: string;
  restored: string;
  caught: string;
  alert: string;
  lastCall: string;
  /** Caption after a stage hazard (e.g. a passing train) gets the player. */
  hazard?: string;
  /** Captions for entering/leaving a hiding spot (default: lockers). */
  hideLine?: string;
  unhideLine?: string;
  /** Caption when the lamp beam stuns the Listener. */
  stun?: string;
};

export type StageCue = { warn: boolean; rumble: number };
const NO_CUE: StageCue = { warn: false, rumble: 0 };

export interface StageDef<T extends string = string> {
  chapter: number;
  name: string;
  fog: number;
  labels: Record<T, string>;
  lines: StageLines;
  apply(bits: number, target: T): StageResult;
  complete(bits: number): boolean;
  /** Final step is unlocked: the engine plays a repeating chime. */
  gateOpen(bits: number): boolean;
  objective(bits: number): string;
  /** Paid hint: exactly where to go for the next step. */
  hint?(bits: number): string;
  /** False for a stage that ends on foot rather than with Car 07 pulling out. */
  departs?: boolean;
  /** Whether the player's light can stun the Listener right now (Stage 7's signal lamp). */
  canStun?(bits: number): boolean;
  place(pos: Pt, alert: boolean): string;
  ending: { place: string; waiting: string };
  build(scene: THREE.Scene): StageWorld;
}

const tmpColor = new THREE.Color();

/** Base for a stage's 3D world with shared helpers and cleanup. */
export abstract class StageWorld {
  readonly group = new THREE.Group();
  readonly aimables: THREE.Mesh[] = [];
  readonly solids: Box[] = [];
  readonly glow: THREE.Object3D[] = [];
  /** Where a lever/noise target is heard from, by target id. */
  readonly noise: Record<string, Pt> = {};
  /** Hiding spots: target id → where the player is while hidden, where they step out, and which way they face. */
  readonly hideSpots: Record<string, { at: Pt; out: Pt; yaw: number }> = {};
  abstract readonly spawn: Pt;
  abstract readonly boarded: Pt;
  abstract readonly arena: Arena;
  /** Extra Listeners beyond the first, each with its own start and patrol (the finale has two). */
  readonly extraHunters: { start: Pt; patrol: Pt[] }[] = [];
  /** Facing (deg) once the stage is complete; boarding faces out of Car 07 (0). */
  readonly endYaw: number = 0;
  /** Body radius-safe minimum z (Car 07's doorway is a wall until boarding). */
  protected minZ = 11.3;
  protected readonly glowTex: THREE.CanvasTexture;
  private readonly disposables: { dispose(): void }[] = [];

  constructor(scene: THREE.Scene, name: string) {
    this.group.name = name;
    this.group.visible = false;
    scene.add(this.group);
    this.glowTex = glowTexture();
    this.disposables.push(this.glowTex);
  }

  set visible(on: boolean) {
    this.group.visible = on;
  }

  abstract sync(bits: number): void;
  abstract tick(time: number, danger: number): void;

  /** Whether the player is wading here (wading is loud). Stages with water override this. */
  wet(_pos: Pt): boolean {
    return false;
  }

  /** True while standing at `pos` is fatal (a passing train, say). */
  hazard(_pos: Pt): boolean {
    return false;
  }

  /** True while something drowns out all sound, so the Listener can't hear. */
  muffled(): boolean {
    return false;
  }

  /** Area the Listener refuses to step into right now. */
  forbidden(): Box | null {
    return null;
  }

  /** Audio cues for the engine: `warn` rising edge rings a bell; `rumble` 0..1 drives the low rumble and camera shake. */
  cue(): StageCue {
    return NO_CUE;
  }

  collide(pos: Pt, radius = 0.3): void {
    pos.z = Math.max(pos.z, this.minZ);
    collideBoxes(pos, this.solids, radius);
  }

  /**
   * Car 07 pulling out. The player stays still inside the car, so the world
   * slides past instead: accelerate, then hold top speed. Fog hides the edge.
   */
  depart(t: number, accel = 1.4, top = 14): void {
    const rampEnd = top / accel;
    const d = t <= rampEnd ? 0.5 * accel * t * t : 0.5 * accel * rampEnd * rampEnd + top * (t - rampEnd);
    this.group.position.x = -d;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
  }

  // ------------------------------------------------------------- helpers

  protected aimable(target: string, geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
    const mesh = new THREE.Mesh(this.geo(geometry), material);
    mesh.userData.target = target;
    this.aimables.push(mesh);
    return mesh;
  }

  protected geo<T extends THREE.BufferGeometry>(g: T): T {
    this.disposables.push(g);
    return g;
  }

  protected mat(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    return this.own(new THREE.MeshStandardMaterial(params));
  }

  protected own<T extends { dispose(): void }>(thing: T): T {
    this.disposables.push(thing);
    return thing;
  }

  /** Additive glow sprite; fog still applies so far lamps fade into the murk. */
  protected halo(color: number, size: number, opacity = 0.55): THREE.Sprite {
    const material = this.own(
      new THREE.SpriteMaterial({
        map: this.glowTex,
        color: tmpColor.set(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(size);
    sprite.renderOrder = 2;
    this.group.add(sprite);
    return sprite;
  }

  /** Soft additive pool on the floor that fakes bounce light without a real light. */
  protected pool(color: number, x: number, z: number, size: number, opacity = 0.22): THREE.Mesh {
    const pool = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(size, size)),
      this.own(
        new THREE.MeshBasicMaterial({
          map: this.glowTex,
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.03, -z);
    pool.renderOrder = 1;
    this.group.add(pool);
    return pool;
  }

  /** Static box in game coords; optionally solid. */
  protected block(
    material: THREE.Material,
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    y = h / 2,
    solid = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(this.geo(new THREE.BoxGeometry(w, h, d)), material);
    mesh.position.set(x, y, -z);
    this.group.add(mesh);
    if (solid) this.solids.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return mesh;
  }

  /** Canvas texture registered for disposal. */
  protected texture(
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
    srgb = true,
  ): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext("2d")!);
    const tex = this.own(new THREE.CanvasTexture(canvas));
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
}

/** Soft white radial falloff, tinted per use via material colour. */
function glowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Speckled noise: gravel, concrete, grime. */
export function speckle(ctx: CanvasRenderingContext2D, size: number, base: string, count: number, lo: number, hi: number): void {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    const shade = lo + Math.floor(Math.random() * (hi - lo));
    ctx.fillStyle = `rgb(${shade},${shade - 6},${shade - 14})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 0.6 + Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}
