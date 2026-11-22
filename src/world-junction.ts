import * as THREE from "three";
import type { Box, Pt } from "./geom.ts";
import type { Arena } from "./hunter.ts";
import { StageWorld, speckle, type StageCue } from "./stage-kit.ts";
import { JUNCTION_BIT, junctionPointsSet } from "./story-junction.ts";

/**
 * Thornby Junction. Game coordinates (x, z); world z = -game z.
 *
 *   z 46  ── fence ───────────────────────────────────────
 *   z 36–40                     [signal box, token instrument x 8]
 *   z 33–43   cable drums (cover)
 *   z 26  ═══════════ MAIN LINE (freights every 22 s) ═══════════
 *         wig-wag lights at x ±15
 *   z 19.5 ── platform edge ──
 *   z 17.5  [battery cabinet x -10]      sleeper stack x 12
 *   z 14.5                   [ground frame x 6]
 *   z 12    starter signal x -4
 *   z 11  ── Car 07 door ──
 */

const HALF_W = 17;
const MAIN = 26;
const TRACK: Box = { minX: -40, maxX: 40, minZ: MAIN - 1.6, maxZ: MAIN + 1.6 };
/** Wider zone the Listener keeps out of while a train is due. */
const KEEP_OUT: Box = { minX: -40, maxX: 40, minZ: MAIN - 2.2, maxZ: MAIN + 2.2 };
const MERCURY = 0xc8e4ff;
const WARM = 0xffcf8a;
const RED = 0xff2a14;

/** Freight timetable, seconds. idle → warning → passing, repeating. */
const CYCLE = 22;
const WARN_AT = 14;
const PASS_AT = 18;
const TRAIN_SPEED = 50;
const TRAIN_START_X = -42;

type Phase = "idle" | "warning" | "passing";

export class JunctionWorld extends StageWorld {
  readonly spawn: Pt = { x: 0, z: 13 };
  readonly boarded: Pt = { x: 0, z: 8.5 };
  readonly arena: Arena;

  private phase: Phase = "idle";
  private cycleTime = 0;
  private t0 = -1;
  private train!: THREE.Group;
  private trainLength = 0;
  private readonly wigwag: { mats: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial]; halos: THREE.Sprite[][] } = {
    mats: [this.lampMat(), this.lampMat()],
    halos: [[], []],
  };
  private frameLever!: THREE.Object3D;
  private signalRed!: THREE.MeshStandardMaterial;
  private signalGreen!: THREE.MeshStandardMaterial;
  private boxWindow!: THREE.MeshStandardMaterial;
  private instrumentLamp!: THREE.MeshStandardMaterial;
  private readonly lamps: { light: THREE.PointLight; base: number }[] = [];

  constructor(scene: THREE.Scene) {
    super(scene, "thornby-junction");
    this.buildGround();
    this.buildMainLine();
    this.buildWigwags();
    this.buildNearSide();
    this.buildFarSide();
    this.buildLights();
    this.buildTrain();
    this.buildCarDoor();

    Object.assign(this.noise, {
      tokenInstrument: { x: 8, z: 35.2 },
      groundFrame: { x: 6, z: 13.6 },
    });
    this.arena = {
      minX: -HALF_W,
      maxX: HALF_W,
      minZ: 11.3,
      maxZ: 46,
      solids: this.solids,
      patrol: [
        { x: -12, z: 42 },
        { x: 13, z: 44 },
        { x: 0, z: 34 },
        { x: -14, z: 31 },
        { x: -12, z: 15 },
        { x: 9, z: 20 },
        { x: 14, z: 31 },
      ],
      start: { x: -12, z: 42 },
    };
  }

  // ------------------------------------------------------------- stage hooks

  hazard(pos: Pt): boolean {
    return this.phase === "passing" && pos.z > TRACK.minZ && pos.z < TRACK.maxZ;
  }

  muffled(): boolean {
    return this.phase === "passing";
  }

  forbidden(): Box | null {
    return this.phase === "idle" ? null : KEEP_OUT;
  }

  cue(): StageCue {
    if (this.phase === "idle") return { warn: false, rumble: 0 };
    if (this.phase === "warning") return { warn: true, rumble: ((this.cycleTime - WARN_AT) / (PASS_AT - WARN_AT)) * 0.4 };
    const left = CYCLE - this.cycleTime;
    return { warn: true, rumble: Math.min(1, left / 0.6) };
  }

  // ------------------------------------------------------------- state

  sync(bits: number): void {
    const powered = (bits & JUNCTION_BIT.battery) !== 0;
    const set = junctionPointsSet(bits);
    this.frameLever.rotation.x = set ? -0.55 : 0.55;
    this.signalRed.emissiveIntensity = set ? 0 : 2.2;
    this.signalGreen.emissiveIntensity = set ? 2.4 : 0;
    this.boxWindow.emissiveIntensity = powered ? 1.5 : 0.15;
    this.instrumentLamp.emissiveIntensity = powered && !(bits & JUNCTION_BIT.token) ? 2.5 : 0;
  }

  tick(time: number, danger: number): void {
    // First warning about 10 s after arriving, then every CYCLE seconds.
    if (this.t0 < 0) this.t0 = time - 4;
    this.cycleTime = (time - this.t0) % CYCLE;
    const c = this.cycleTime;
    this.phase = c < WARN_AT ? "idle" : c < PASS_AT ? "warning" : "passing";

    // Wig-wags alternate while a train is due.
    const on = this.phase !== "idle";
    const flip = Math.floor(time * 2.5) % 2;
    this.wigwag.mats.forEach((m, i) => {
      const lit = on && flip === i;
      m.emissiveIntensity = lit ? 3 : 0.05;
      for (const h of this.wigwag.halos[i]) h.visible = lit;
    });

    // The freight itself.
    this.train.visible = this.phase === "passing";
    if (this.train.visible) this.train.position.x = TRAIN_START_X + (c - PASS_AT) * TRAIN_SPEED;

    this.lamps.forEach((l, i) => {
      const passing = this.phase === "passing" && Math.random() < 0.25; // the train's draught makes them swing
      const drop = Math.random() < 0.003 + 0.04 * danger * danger;
      l.light.intensity = l.base * (drop ? 0.1 : passing ? 0.7 : 0.95 + 0.05 * Math.sin(time * 2 + i));
    });
  }

  // ------------------------------------------------------------- builders

  private lampMat(): THREE.MeshStandardMaterial {
    return this.mat({ color: 0x220000, emissive: RED, emissiveIntensity: 0.05 });
  }

  private buildGround(): void {
    const ballast = this.texture(128, 128, (ctx) => speckle(ctx, 128, "#5a5650", 1500, 55, 140));
    ballast.repeat.set(16, 16);
    const ground = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2 + 6, 38)),
      this.mat({ color: 0x8a847a, map: ballast, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -29);
    // Near platform: raised a touch, with the yellow safety line.
    const concrete = this.texture(128, 128, (ctx) => speckle(ctx, 128, "#7a7872", 900, 95, 150));
    concrete.repeat.set(10, 3);
    this.block(this.mat({ color: 0xa8a49c, map: concrete, roughness: 0.9 }), 0, 15.25, HALF_W * 2, 0.06, 8.5, 0.03, false);
    this.block(this.mat({ color: 0xd4b030, roughness: 0.7 }), 0, 19.2, HALF_W * 2, 0.07, 0.2, 0.035, false);
    // Back fence, see-through so the dark beyond still reads.
    const fence = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2 + 2, 2.4)),
      this.mat({ color: 0x3a403f, metalness: 0.5, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    );
    fence.position.set(0, 1.2, -46.3);
    this.group.add(ground, fence);
    this.solids.push({ minX: -HALF_W - 1, maxX: HALF_W + 1, minZ: 46, maxZ: 47 });
  }

  private buildMainLine(): void {
    const steel = this.mat({ color: 0x8a8680, metalness: 0.85, roughness: 0.3 });
    const wood = this.mat({ color: 0x2e241c, roughness: 0.95 });
    this.block(this.mat({ color: 0x3e3a36, roughness: 1 }), 0, MAIN, 80, 0.1, 3.4, 0.05, false);
    const rails = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(80, 0.15, 0.07)), steel, 2);
    const m = new THREE.Matrix4();
    rails.setMatrixAt(0, m.makeTranslation(0, 0.18, -(MAIN - 0.72)));
    rails.setMatrixAt(1, m.makeTranslation(0, 0.18, -(MAIN + 0.72)));
    const count = 90;
    const sleepers = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(0.24, 0.1, 2.6)), wood, count);
    for (let i = 0; i < count; i++) sleepers.setMatrixAt(i, m.makeTranslation(-40 + i * 0.9, 0.11, -MAIN));
    this.group.add(rails, sleepers);
  }

  private buildWigwags(): void {
    const post = this.mat({ color: 0x1e1e1e, metalness: 0.5 });
    const board = this.mat({ color: 0x0a0a0a, roughness: 0.8 });
    for (const x of [-15, 15]) {
      for (const z of [MAIN - 3.2, MAIN + 3.2]) {
        this.block(post, x, z, 0.14, 2.6, 0.14);
        this.block(board, x, z, 1.1, 0.4, 0.06, 2.4, false);
        // Lamps face whoever is approaching the crossing.
        const face = z < MAIN ? 0.04 : -0.04;
        [-0.35, 0.35].forEach((dx, i) => {
          const lamp = new THREE.Mesh(this.geo(new THREE.CircleGeometry(0.13, 14)), this.wigwag.mats[i]);
          lamp.position.set(x + dx, 2.4, -(z - face));
          if (z > MAIN) lamp.rotation.y = Math.PI;
          const halo = this.halo(RED, 1.1, 0.7);
          halo.position.set(x + dx, 2.4, -(z - face * 2));
          halo.visible = false;
          this.wigwag.halos[i].push(halo);
          this.group.add(lamp);
        });
      }
    }
  }

  private buildNearSide(): void {
    // Battery cabinet.
    const green = this.mat({ color: 0x2f4a36, metalness: 0.4, roughness: 0.6 });
    this.block(green, -10, 17.5, 1.2, 1.5, 0.6, 0.75);
    const door = this.aimable("batteryCabinet", new THREE.BoxGeometry(1.1, 1.35, 0.03), this.mat({ color: 0x395a42, roughness: 0.55 }));
    door.position.set(-10, 0.8, -17.18);
    this.group.add(door);

    // Ground frame with token lock.
    this.block(this.mat({ color: 0x2c2a26, metalness: 0.5, roughness: 0.7 }), 6, 14.5, 0.7, 0.35, 1, 0.18);
    const lock = this.aimable("groundFrame", new THREE.BoxGeometry(0.34, 0.3, 0.26), this.mat({ color: 0x8a6a2a, metalness: 0.6 }));
    lock.position.set(6, 0.5, -(14.5 - 0.62));
    const pivot = new THREE.Object3D();
    pivot.position.set(6, 0.35, -14.5);
    const handle = new THREE.Mesh(this.geo(new THREE.BoxGeometry(0.09, 1.25, 0.09)), this.mat({ color: 0xa8321e, roughness: 0.5 }));
    handle.position.y = 0.6;
    pivot.add(handle);
    this.frameLever = pivot;
    this.group.add(lock, pivot);

    // Starter signal guarding Car 07.
    this.block(this.mat({ color: 0x2a2c2c, metalness: 0.6 }), -4, 12.2, 0.16, 3.4, 0.16);
    this.block(this.mat({ color: 0x111111 }), -4, 12.2, 0.45, 0.9, 0.28, 3.4, false);
    this.signalRed = this.mat({ color: 0x301010, emissive: 0xff2a1a, emissiveIntensity: 2.2 });
    this.signalGreen = this.mat({ color: 0x0c2414, emissive: 0x2aff7a, emissiveIntensity: 0 });
    const lampGeo = this.geo(new THREE.CircleGeometry(0.12, 14));
    const r = new THREE.Mesh(lampGeo, this.signalRed);
    r.position.set(-4, 3.6, -12.2 + 0.15);
    const g = new THREE.Mesh(lampGeo, this.signalGreen);
    g.position.set(-4, 3.22, -12.2 + 0.15);
    this.group.add(r, g);

    // Sleeper stack: a bit of cover on the platform.
    this.block(this.mat({ color: 0x3a2c22, roughness: 0.95 }), 12, 16, 3, 0.9, 1.3, 0.45);
  }

  private buildFarSide(): void {
    const x = 8;
    const z = 38;
    this.block(this.mat({ color: 0x5a4636, roughness: 0.9 }), x, z, 5, 3.2, 4);
    this.block(this.mat({ color: 0x24201e, roughness: 0.8 }), x, z, 5.5, 0.2, 4.5, 3.3, false);
    this.boxWindow = this.mat({ color: 0x141a1c, emissive: WARM, emissiveIntensity: 0.15 });
    const win = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(3.4, 0.9)), this.boxWindow);
    win.position.set(x, 2.2, -(z - 2.01));
    // Token instrument: a tall cabinet on the front wall, with a ready lamp.
    const inst = this.aimable("tokenInstrument", new THREE.BoxGeometry(0.6, 1.2, 0.3), this.mat({ color: 0x6a2a1a, roughness: 0.5 }));
    inst.position.set(x, 0.9, -(z - 2.15));
    this.instrumentLamp = this.mat({ color: 0x0a1a0a, emissive: 0x6aff5a, emissiveIntensity: 0 });
    const lamp = new THREE.Mesh(this.geo(new THREE.SphereGeometry(0.05, 8, 6)), this.instrumentLamp);
    lamp.position.set(x, 1.6, -(z - 2.32));
    this.group.add(win, inst, lamp);
    this.solids.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 2.3, maxZ: z - 2 });

    // Cable drums for cover.
    const drum = this.mat({ color: 0x5a4a32, roughness: 0.9 });
    const drumGeo = this.geo(new THREE.CylinderGeometry(0.9, 0.9, 1.1, 18).rotateX(Math.PI / 2));
    for (const [dx, dz] of [[-6, 33], [-11, 40], [2, 43], [-1, 32]] as const) {
      const d = new THREE.Mesh(drumGeo, drum);
      d.position.set(dx, 0.9, -dz);
      this.group.add(d);
      this.solids.push({ minX: dx - 0.9, maxX: dx + 0.9, minZ: dz - 0.55, maxZ: dz + 0.55 });
    }
  }

  private buildLights(): void {
    const pole = this.mat({ color: 0x2a2c2c, metalness: 0.6 });
    const spots: [number, number, number, number, number][] = [
      [-8, 15.5, MERCURY, 7, 5],
      [8, 15.5, MERCURY, 7, 5],
      [8, 35.4, WARM, 4, 3.4],
    ];
    for (const [x, z, color, base, h] of spots) {
      if (h > 4) this.block(pole, x, z + 0.4, 0.14, h, 0.14);
      const light = new THREE.PointLight(color, base, 18, 1.7);
      light.position.set(x, h - 0.2, -z);
      this.block(this.mat({ color: 0x111111, emissive: color, emissiveIntensity: 2 }), x, z, 0.5, 0.12, 0.25, h, false);
      this.halo(color, 1.8, 0.5).position.set(x, h - 0.05, -z);
      this.pool(color, x, z, 10, 0.14);
      this.group.add(light);
      this.glow.push(light);
      this.lamps.push({ light, base });
    }
  }

  private buildTrain(): void {
    this.train = new THREE.Group();
    this.train.visible = false;
    const loco = this.mat({ color: 0x2a2e32, metalness: 0.5, roughness: 0.6 });
    const nose = this.mat({ color: 0xd8b020, roughness: 0.6 });
    const wagons = 8;
    const wagonLen = 12;
    // Locomotive leads at +x (it runs toward +x).
    const body = new THREE.Mesh(this.geo(new THREE.BoxGeometry(16, 3.8, 3)), loco);
    body.position.set(-8, 2.1, 0);
    const front = new THREE.Mesh(this.geo(new THREE.BoxGeometry(0.2, 2, 2.9)), nose);
    front.position.set(0.05, 1.4, 0);
    this.train.add(body, front);
    for (const dz of [-0.9, 0.9]) {
      const head = this.halo(0xfff2c8, 2.4, 0.9);
      this.group.remove(head);
      head.position.set(0.3, 1.1, dz);
      this.train.add(head);
    }
    const wagonMat = this.mat({ color: 0x4a3226, metalness: 0.3, roughness: 0.8 });
    const cars = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(wagonLen, 3, 2.9)), wagonMat, wagons);
    const m = new THREE.Matrix4();
    for (let i = 0; i < wagons; i++) cars.setMatrixAt(i, m.makeTranslation(-16.8 - wagonLen / 2 - i * (wagonLen + 0.8), 1.8, 0));
    this.train.add(cars);
    this.trainLength = 16.8 + wagons * (wagonLen + 0.8);
    const tail = this.halo(RED, 0.9, 0.9);
    this.group.remove(tail);
    tail.position.set(-this.trainLength, 1.2, 0);
    this.train.add(tail);
    this.train.position.set(TRAIN_START_X, 0, -MAIN);
    this.group.add(this.train);
  }

  private buildCarDoor(): void {
    const door = this.aimable("carDoor", new THREE.PlaneGeometry(1.4, 2.1), this.mat({ transparent: true, opacity: 0, depthWrite: false }));
    door.position.set(0, 1.1, -11.05);
    this.group.add(door);
  }
}
