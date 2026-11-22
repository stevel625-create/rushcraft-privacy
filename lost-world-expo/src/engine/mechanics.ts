import type * as THREE from 'three';
import type { MissionManager } from './missions';
import type { BoxCollider, CharacterBody, Vec3 } from './physics';

/** What world mechanics can see and do. Implemented by Game. */
export interface MechanicContext {
  missions: MissionManager;
  jason: CharacterBody;
  elena: CharacterBody;
  time: number;
  message(text: string): void;
  respawnJason(): void;
  recoverElena(): void;
  setCheckpoint(p: Vec3): void;
  /** Play a one-shot sound effect (see src/audio/sounds.ts). */
  sound(name: string): void;
}

export interface Mechanic {
  update(ctx: MechanicContext, dt: number): void;
  /** Set for mechanics tied to an objective, so Continue can fast-forward them. */
  objectiveId?: string;
  forceComplete?(): void;
}

export interface Interactable {
  position: Vec3;
  prompt: string;
  enabled: boolean;
  interact(ctx: MechanicContext): void;
}

const dist2D = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.z - b.z);

// ---------------------------------------------------------------- volumes

/** Completes its objective while Jason is inside the sphere and the objective is active. */
export class ObjectiveTrigger implements Mechanic {
  constructor(readonly objectiveId: string, private center: Vec3, private radius: number) {}
  update(ctx: MechanicContext) {
    if (ctx.missions.currentId !== this.objectiveId) return;
    const p = ctx.jason.pos;
    if (Math.hypot(p.x - this.center.x, p.y + 1 - this.center.y, p.z - this.center.z) < this.radius)
      ctx.missions.complete(this.objectiveId);
  }
}

export class Checkpoint implements Mechanic {
  private reached = false;
  constructor(private center: Vec3, private radius: number) {}
  update(ctx: MechanicContext) {
    if (this.reached) return;
    const p = ctx.jason.pos;
    if (dist2D(p, this.center) < this.radius && Math.abs(p.y - this.center.y) < 2.5) {
      this.reached = true;
      ctx.setCheckpoint({ x: p.x, y: p.y + 0.1, z: p.z });
      ctx.message('Checkpoint');
    }
  }
}

/** Water / lava: touching the surface sends Jason back to his checkpoint and recovers Elena. */
export class KillVolume implements Mechanic {
  constructor(private min: Vec3, private max: Vec3) {}
  private inside(p: Vec3) {
    return p.x >= this.min.x && p.x <= this.max.x && p.z >= this.min.z && p.z <= this.max.z && p.y <= this.max.y && p.y >= this.min.y - 5;
  }
  update(ctx: MechanicContext) {
    if (this.inside(ctx.jason.pos)) ctx.respawnJason();
    else if (this.inside(ctx.elena.pos)) ctx.recoverElena();
  }
}

// ---------------------------------------------------------------- doors and plates

/** Stone door that sinks into the ground; its collider follows and is disabled once open. */
export class SlidingDoor implements Mechanic {
  private t = -1;
  private readonly closedY: number;
  constructor(private mesh: THREE.Object3D, private collider: BoxCollider, private drop: number, private seconds = 1.6) {
    this.closedY = mesh.position.y;
  }
  open() { if (this.t < 0) this.t = 0; }
  openInstant() { this.t = 1; this.apply(1); }
  get isOpen() { return this.t >= 1; }
  private apply(k: number) {
    const y = this.closedY - this.drop * k;
    this.mesh.position.y = y;
    this.collider.center.y = y;
    this.collider.enabled = k < 0.95;
  }
  update(_ctx: MechanicContext, dt: number) {
    if (this.t < 0 || this.t >= 1) return;
    this.t = Math.min(1, this.t + dt / this.seconds);
    const k = this.t * this.t * (3 - 2 * this.t);
    this.apply(k);
  }
}

export type Occupant = 'jason' | 'elena';

export class PressurePlate {
  constructor(readonly top: Vec3, readonly radius = 0.8) {}
  has(ctx: MechanicContext, who: Occupant) {
    const b = who === 'jason' ? ctx.jason : ctx.elena;
    return dist2D(b.pos, this.top) <= this.radius + 0.1 && Math.abs(b.pos.y - this.top.y) < 0.6;
  }
}

/** All plates held by the right character for `hold` seconds. One Elena plate = "hold the gate". */
export class CoopPuzzle implements Mechanic {
  private held = 0;
  solved = false;
  constructor(
    readonly objectiveId: string,
    private plates: { plate: PressurePlate; need: Occupant }[],
    private door: SlidingDoor | null,
    private hold = 1,
  ) {}
  update(ctx: MechanicContext, dt: number) {
    if (this.solved || ctx.missions.currentId !== this.objectiveId) return;
    const ok = this.plates.every(({ plate, need }) => plate.has(ctx, need));
    this.held = ok ? this.held + dt : 0;
    if (this.held >= this.hold) {
      this.solved = true;
      this.door?.open();
      if (this.door) ctx.sound('door');
      ctx.missions.complete(this.objectiveId);
    }
  }
  forceComplete() {
    this.solved = true;
    this.door?.openInstant();
  }
}

// ---------------------------------------------------------------- counted objectives

export interface CountedItem { markDone(): void }

/** "Do X of N". Items may be done early; completes as soon as the objective is active and count is met. */
export class CountedObjective implements Mechanic {
  private count = 0;
  private done = false;
  private reported = false;
  private readonly items: CountedItem[] = [];
  constructor(readonly objectiveId: string, private required: number, private door: SlidingDoor | null = null) {}
  register(item: CountedItem) { this.items.push(item); }
  increment() {
    if (this.done) return;
    this.count = Math.min(this.required, this.count + 1);
    this.reported = false;
  }
  update(ctx: MechanicContext) {
    if (this.done || ctx.missions.currentId !== this.objectiveId) return;
    if (!this.reported) {
      ctx.missions.reportProgress(this.objectiveId, this.count, this.required);
      this.reported = true;
    }
    if (this.count >= this.required) {
      this.done = true;
      this.door?.open();
      if (this.door) ctx.sound('door');
      ctx.missions.complete(this.objectiveId);
    }
  }
  forceComplete() {
    this.done = true;
    this.count = this.required;
    this.items.forEach((i) => i.markDone());
    this.door?.openInstant();
  }
}

/** Floating relic shard: walk into it to collect. */
export class Collectible implements Mechanic, CountedItem {
  private taken = false;
  private readonly baseY: number;
  constructor(private mesh: THREE.Object3D, private owner: CountedObjective) {
    this.baseY = mesh.position.y;
    owner.register(this);
  }
  update(ctx: MechanicContext, dt: number) {
    if (this.taken) return;
    this.mesh.rotation.y += dt * 1.6;
    this.mesh.position.y = this.baseY + Math.sin(ctx.time * 2) * 0.15;
    const p = ctx.jason.pos;
    const m = this.mesh.position;
    if (Math.hypot(p.x - m.x, p.z - m.z) < 1.2 && m.y - p.y > -0.5 && m.y - p.y < 2.4) {
      this.markDone();
      this.owner.increment();
      ctx.sound('pickup');
      ctx.message('Relic shard found');
    }
  }
  markDone() {
    this.taken = true;
    this.mesh.visible = false;
  }
}

/** Brazier: interact to light it. */
export class Brazier implements Interactable, CountedItem {
  prompt = 'Light brazier';
  enabled = true;
  constructor(readonly position: Vec3, private flame: THREE.Object3D, private owner: CountedObjective) {
    flame.visible = false;
    owner.register(this);
  }
  interact(ctx: MechanicContext) {
    if (!this.enabled) return;
    this.markDone();
    this.owner.increment();
    ctx.sound('pickup');
  }
  markDone() {
    this.enabled = false;
    this.flame.visible = true;
  }
}

// ---------------------------------------------------------------- statues

/** Turns 90 degrees per interaction. Aligned when facing its target step. */
export class RotatingStatue implements Interactable, Mechanic {
  prompt = 'Turn statue';
  enabled = true;
  step: number;
  constructor(readonly position: Vec3, private root: THREE.Object3D, startStep: number, private targetStep: number) {
    this.step = startStep & 3;
    root.rotation.y = this.step * (Math.PI / 2);
  }
  get aligned() { return this.step === this.targetStep; }
  interact(ctx: MechanicContext) {
    if (!this.enabled) return;
    this.step = (this.step + 1) & 3;
    ctx.sound('door');
  }
  update(_ctx: MechanicContext, dt: number) {
    const target = this.step * (Math.PI / 2);
    let diff = target - this.root.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const maxStep = 2 * Math.PI * dt;
    this.root.rotation.y += Math.abs(diff) < maxStep ? diff : Math.sign(diff) * maxStep;
  }
  lock(snap: boolean) {
    this.enabled = false;
    if (snap) { this.step = this.targetStep; this.root.rotation.y = this.step * (Math.PI / 2); }
  }
}

export class StatuePuzzle implements Mechanic {
  solved = false;
  constructor(readonly objectiveId: string, private statues: RotatingStatue[], private door: SlidingDoor | null) {}
  update(ctx: MechanicContext) {
    if (this.solved || ctx.missions.currentId !== this.objectiveId) return;
    if (!this.statues.every((s) => s.aligned)) return;
    this.solved = true;
    this.statues.forEach((s) => s.lock(false));
    this.door?.open();
    ctx.sound('door');
    ctx.message('The statues lock into place');
    ctx.missions.complete(this.objectiveId);
  }
  forceComplete() {
    this.solved = true;
    this.statues.forEach((s) => s.lock(true));
    this.door?.openInstant();
  }
}

// ---------------------------------------------------------------- interact actions

/** Examine text, and optionally "interact to complete objective". */
export class InteractAction implements Interactable, Mechanic {
  enabled = true;
  private done = false;
  constructor(
    readonly position: Vec3,
    public prompt: string,
    private message: string,
    readonly objectiveId?: string,
    private notYet?: string,
    private soundName?: string,
  ) {}
  interact(ctx: MechanicContext) {
    if (!this.enabled) return;
    const id = this.objectiveId;
    if (id && !this.done && ctx.missions.currentId !== id) {
      if (this.notYet) ctx.message(this.notYet);
      return;
    }
    if (this.message) ctx.message(this.message);
    if (this.soundName && (!id || ctx.missions.currentId === id)) ctx.sound(this.soundName);
    if (id && !this.done && ctx.missions.complete(id)) this.forceComplete();
  }
  update() {}
  forceComplete() {
    this.done = true;
    if (this.objectiveId) this.enabled = false;
  }
}
