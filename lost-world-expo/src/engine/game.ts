import * as THREE from 'three';
import { LEVELS } from '../levels';
import type { LevelLayout } from '../levels/types';
import { Companion, OrbitCamera, Player } from './characters';
import { Emitter } from './events';
import { InputState } from './input';
import type { Interactable, MechanicContext } from './mechanics';
import { MissionManager } from './missions';
import { SkyDome } from './sky';
import { v3, type Vec3 } from './physics';
import { WorldKit } from './world';

export interface SaveData {
  version: 1;
  levelIndex: number;
  objectiveIndex: number;
  position: [number, number, number];
  yaw: number;
}

export interface HudState {
  levelLabel: string;
  objective: string;
  prompt: string | null;
}

type GameEvents = {
  hud: [HudState];
  /** kind 'story' = examine/pickup text that should not be overwritten by the next objective toast. */
  toast: [string, 'objective' | 'story'];
  levelComplete: [title: string, hasNext: boolean];
  /** Autosave point: persist this. */
  save: [SaveData];
  /** Levels [0..index] are now unlocked. */
  unlock: [index: number];
};

/**
 * The whole game simulation, independent of React and of the GL context:
 * the same class runs on device, in the browser, and in the Node test suite.
 */
export class Game extends Emitter<GameEvents> {
  readonly scene = new THREE.Scene();
  readonly input = new InputState();
  readonly missions = new MissionManager();
  readonly orbit: OrbitCamera;
  readonly player = new Player(v3());
  readonly companion = new Companion(v3());
  levelIndex = 0;
  paused = false;
  time = 0;

  world: WorldKit | null = null;
  layout: LevelLayout | null = null;
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.4);
  private readonly sun = new THREE.DirectionalLight(0xffffff, 2);
  private readonly sky = new SkyDome();
  private checkpoint: { pos: Vec3; yaw: number } = { pos: v3(), yaw: 0 };
  private respawnCooldown = 0;
  private currentInteractable: Interactable | null = null;
  private hudState: HudState = { levelLabel: '', objective: '', prompt: null };
  private progressText = '';

  constructor(aspect = 16 / 9) {
    super();
    this.orbit = new OrbitCamera(aspect);
    this.scene.add(this.sky.mesh, this.hemi, this.sun, this.sun.target, this.player.mesh, this.companion.mesh);
    // Sun shadows cover a 60 m square that follows Jason (see followSun).
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 140;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;

    this.missions.on('started', (o) => {
      this.progressText = '';
      this.setHud({ objective: o.title });
      this.emit('toast', o.title, 'objective');
      const spot = this.layout?.companionSpots[o.id];
      if (spot) this.companion.walkTo(spot);
      else if (this.companion.state === 'scripted') this.companion.follow();
    });
    this.missions.on('progress', (o, cur, total) => {
      this.progressText = ` (${cur}/${total})`;
      this.setHud({ objective: o.title + this.progressText });
    });
    this.missions.on('completed', () => this.emit('save', this.snapshot()));
    this.missions.on('levelComplete', () => {
      const hasNext = this.levelIndex + 1 < LEVELS.length;
      if (hasNext) this.emit('unlock', this.levelIndex + 1);
      this.player.controlsEnabled = false;
      this.companion.follow();
      this.setHud({ objective: 'Level complete', prompt: null });
      this.emit('levelComplete', LEVELS[this.levelIndex].title, hasNext);
    });
  }

  get levelCount() { return LEVELS.length; }
  get level() { return LEVELS[this.levelIndex]; }
  get camera() { return this.orbit.camera; }

  setAspect(aspect: number) {
    this.orbit.camera.aspect = aspect;
    this.orbit.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ levels

  loadLevel(index: number, restore?: SaveData | null) {
    this.world?.dispose();
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    const def = LEVELS[this.levelIndex];

    const kit = new WorldKit(def.seed);
    const layout = def.build(kit);
    kit.finalize();
    this.scene.add(kit.root);
    this.world = kit;
    this.layout = layout;
    this.applyTheme();

    const pos = restore ? v3(...restore.position) : layout.jasonSpawn;
    const yaw = restore ? restore.yaw : layout.jasonYaw;
    this.player.warp(pos, yaw);
    this.player.controlsEnabled = true;
    this.companion.follow();
    if (restore) this.recoverElena();
    else this.companion.warp(layout.elenaSpawn);
    this.checkpoint = { pos: { ...pos }, yaw };
    this.orbit.snap(yaw);
    this.input.reset();
    this.currentInteractable = null;

    this.setHud({ levelLabel: `LEVEL ${def.number} · ${def.title.toUpperCase()}`, prompt: null });
    this.missions.load(def.objectives, restore?.objectiveIndex ?? 0);

    // Continue: put puzzles already behind the player into their solved state.
    for (const m of kit.mechanics)
      if (m.objectiveId && m.forceComplete && this.missions.isCompleted(m.objectiveId)) m.forceComplete();

    this.update(0); // settle camera and characters
  }

  private applyTheme() {
    const t = this.level.theme;
    this.scene.background = new THREE.Color(t.sky);
    this.scene.fog = new THREE.FogExp2(t.fog, t.fogDensity);
    this.hemi.color.setHex(t.ambientSky);
    this.hemi.groundColor.setHex(t.ambientGround);
    this.hemi.intensity = t.ambientIntensity;
    this.sun.color.setHex(t.sunColor);
    this.sun.intensity = t.sunIntensity;
    this.sky.setTheme(t.sky, t.fog, t.sunColor, t.sunFrom, t.sunIntensity > 1);
  }

  snapshot(): SaveData {
    const p = this.player.body.pos;
    return { version: 1, levelIndex: this.levelIndex, objectiveIndex: this.missions.index, position: [p.x, p.y, p.z], yaw: this.player.yaw };
  }

  // ------------------------------------------------------------ frame

  /**
   * Advance one rendered frame. Physics and mechanics run in sub-steps of at most 1/30 s, so a phone
   * dropping to 20 fps still plays at real-time speed instead of slow motion.
   */
  update(dt: number) {
    const world = this.world;
    if (!world || (this.paused && dt > 0)) return;
    dt = Math.min(dt, 0.1);
    const steps = Math.max(1, Math.ceil(dt / (1 / 30)));
    const h = dt / steps;
    const look = this.input.consumeLook();
    for (let i = 0; i < steps; i++) this.simulate(h);
    this.orbit.update(this.player.body.pos, look, world.physics, dt || 1 / 60);
    this.afterFrame(dt);
  }

  /** Cosmetic per-frame work: sky follows the camera, sun shadow follows Jason, water/lava flow. */
  private afterFrame(dt: number) {
    this.sky.follow(this.orbit.camera);
    const p = this.player.body.pos, f = this.level.theme.sunFrom;
    const len = Math.hypot(f.x, f.y, f.z) || 1;
    this.sun.target.position.set(p.x, p.y, p.z);
    this.sun.position.set(p.x + (f.x / len) * 60, p.y + (f.y / len) * 60, p.z + (f.z / len) * 60);
    this.world?.tick(dt);
  }

  private simulate(dt: number) {
    const world = this.world!;
    this.time += dt;
    const physics = world.physics;

    this.player.update(physics, this.input, this.orbit.yaw, dt);
    this.companion.update(physics, this.player.body, dt);
    if (this.companion.needsRecovery) this.recoverElena();

    this.respawnCooldown = Math.max(0, this.respawnCooldown - dt);
    const killY = this.layout!.killY;
    if (this.player.body.pos.y < killY) this.respawnJason();
    if (this.companion.body.pos.y < killY) this.recoverElena();

    const ctx = this.context;
    for (const m of world.mechanics) m.update(ctx, dt);
    this.updateInteraction(ctx);
  }

  /** Menu backdrop: no simulation, just a slow camera drift around Jason. */
  idle(dt: number) {
    if (!this.world) return;
    this.time += dt;
    this.orbit.yaw += dt * 0.08;
    this.orbit.update(this.player.body.pos, { dx: 0, dy: 0 }, this.world.physics, Math.min(dt, 1 / 30) || 1 / 60);
    this.afterFrame(dt);
  }

  private updateInteraction(ctx: MechanicContext) {
    const best = this.findInteractable();
    if (best !== this.currentInteractable) {
      this.currentInteractable = best;
      this.setHud({ prompt: best?.prompt ?? null });
    }
    if (this.input.consumeInteract() && best && this.player.controlsEnabled) {
      best.interact(ctx);
      if (!best.enabled) { this.currentInteractable = null; this.setHud({ prompt: null }); }
    }
  }

  findInteractable(): Interactable | null {
    if (!this.world) return null;
    const p = this.player.body.pos, f = this.player.forward;
    let best: Interactable | null = null, bestScore = -Infinity;
    for (const it of this.world.interactables) {
      if (!it.enabled) continue;
      const dx = it.position.x - p.x, dz = it.position.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 2.2 || Math.abs(it.position.y - (p.y + 1)) > 2.2) continue;
      const facing = d < 0.6 ? 1 : (dx * f.x + dz * f.z) / d;
      if (facing < 0.35) continue;
      const score = facing - d * 0.1;
      if (score > bestScore) { bestScore = score; best = it; }
    }
    return best;
  }

  // ------------------------------------------------------------ hazards

  private get context(): MechanicContext {
    return {
      missions: this.missions,
      jason: this.player.body,
      elena: this.companion.body,
      time: this.time,
      message: (t) => this.emit('toast', t, 'story'),
      respawnJason: () => this.respawnJason(),
      recoverElena: () => this.recoverElena(),
      setCheckpoint: (p) => { this.checkpoint = { pos: { ...p }, yaw: this.player.yaw }; },
    };
  }

  respawnJason() {
    if (this.respawnCooldown > 0) return;
    this.respawnCooldown = 0.5;
    this.player.warp(this.checkpoint.pos, this.checkpoint.yaw);
    this.orbit.snap(this.checkpoint.yaw);
    this.recoverElena();
    this.emit('toast', 'Careful...', 'story');
  }

  /** Put Elena next to Jason on solid ground (never back into the water or lava she fell into). */
  recoverElena() {
    const physics = this.world?.physics;
    const p = this.player.body.pos;
    if (!physics) return;
    const f = this.player.forward;
    const offsets = [[-f.x, -f.z], [f.z, -f.x], [-f.z, f.x], [f.x, f.z]];
    for (const [ox, oz] of offsets) {
      const x = p.x + ox * 1.2, z = p.z + oz * 1.2;
      const g = physics.surfaceAt(x, z, p.y + 1);
      if (Math.abs(g - p.y) < 1 && !physics.blocked(x, z, 0.35, g + 0.35, g + 1.8)) {
        this.companion.warp(v3(x, g + 0.02, z));
        return;
      }
    }
    this.companion.warp({ ...p });
  }

  // ------------------------------------------------------------ HUD

  private setHud(patch: Partial<HudState>) {
    this.hudState = { ...this.hudState, ...patch };
    this.emit('hud', this.hudState);
  }

  get hud() { return this.hudState; }
}
