import * as THREE from "three";
import { collideBoxes, type Box, type Pt } from "./geom.ts";
import type { Arena } from "./hunter.ts";
import { StageWorld, speckle, type StageCue } from "./stage-kit.ts";
import { TERMINUS_BIT, terminusGatesOpen } from "./story-terminus.ts";

/**
 * Hallow Cross Terminus. Game coordinates (x, z); world z = -game z.
 *
 *   z 60  ══ back wall ══ [STREET GATES x −3…3] ══ great clock above
 *   z 49–53                 [ticket office, gate control]
 *   z 33–50  [booking hall, FLOODED]        [left luggage, lockers]
 *            relay at x −17.6, z 46          relay at x 14, z 47.6
 *   z 25.4–30  Platform 1                   relay at x −13, z 28.5
 *   z 21.8–25.2 ═══ GHOST LINE (train every 30 s) ═══
 *   z 11–21.6  Platform 2
 *   z 11  ── Car 07 door ──
 */

const HALF_W = 18;
const BACK = 60;
const ROOF = 11;
const LINE = 23.5;
const TRACK: Box = { minX: -40, maxX: 40, minZ: LINE - 1.7, maxZ: LINE + 1.7 };
const KEEP_OUT: Box = { minX: -40, maxX: 40, minZ: LINE - 2.3, maxZ: LINE + 2.3 };
const HALL: Box = { minX: -HALF_W, maxX: -5.3, minZ: 33.3, maxZ: 49.7 };
const WATER_Y = 0.3;
/** The gateway in the back wall: solid until the gates are up. */
const GATEWAY: Box = { minX: -5, maxX: 5, minZ: 59.8, maxZ: 60.6 };
const STREET_EDGE: Box = { minX: -6, maxX: 6, minZ: 61, maxZ: 62 };

const COLD = 0xc8e4ff;
const WARM = 0xffcf8a;
const RED = 0xff2a14;
const STREET = 0xffe2a8;

const CYCLE = 30;
const WARN_AT = 22;
const PASS_AT = 26;
const TRAIN_SPEED = 46;
const TRAIN_START_X = -44;

type Phase = "idle" | "warning" | "passing";

export class TerminusWorld extends StageWorld {
  readonly spawn: Pt = { x: 0, z: 13 };
  /** Where the player stands once out: just past the gates. */
  readonly boarded: Pt = { x: 0, z: 59 };
  readonly endYaw = 0;
  readonly arena: Arena;

  private phase: Phase = "idle";
  private cycleTime = 0;
  private t0 = -1;
  private lastTime = 0;
  private train!: THREE.Group;
  private gates!: THREE.Object3D;
  private gateLift = 0;
  private gateTarget = 0;
  private streetLight!: THREE.PointLight;
  private streetHalo!: THREE.Sprite;
  private readonly relayLamps = new Map<number, THREE.MeshStandardMaterial>();
  private controlLamp!: THREE.MeshStandardMaterial;
  private readonly warnMats: THREE.MeshStandardMaterial[] = [];
  private readonly warnHalos: THREE.Sprite[] = [];
  private readonly lamps: { light: THREE.PointLight; base: number }[] = [];

  constructor(scene: THREE.Scene) {
    super(scene, "hallow-cross-terminus");
    this.buildFloors();
    this.buildShell();
    this.buildGhostLine();
    this.buildPlatformOne();
    this.buildBookingHall();
    this.buildLeftLuggage();
    this.buildConcourse();
    this.buildGates();
    this.buildLights();
    this.buildTrain();

    Object.assign(this.noise, {
      relayPlatform: { x: -13, z: 27.6 },
      relayHall: { x: -16.8, z: 46 },
      relayLuggage: { x: 14, z: 46.8 },
      gateControl: { x: 0, z: 48.6 },
    });
    this.arena = {
      minX: -HALF_W,
      maxX: HALF_W,
      minZ: 11.3,
      maxZ: BACK - 0.3,
      solids: this.solids,
      patrol: [
        { x: -12, z: 56 },
        { x: -12, z: 40 },
        { x: -6, z: 28 },
        { x: -3, z: 45 },
        { x: -14, z: 16 },
      ],
      start: { x: -10, z: 55 },
    };
    // The second Listener works the east side and the platforms.
    this.extraHunters.push({
      start: { x: 12, z: 56 },
      patrol: [
        { x: 14, z: 55 },
        { x: 9, z: 40 },
        { x: 8, z: 28 },
        { x: 3, z: 54 },
        { x: 12, z: 15 },
      ],
    });
  }

  // ------------------------------------------------------------- stage hooks

  wet(pos: Pt): boolean {
    return pos.x >= HALL.minX && pos.x <= HALL.maxX && pos.z >= HALL.minZ && pos.z <= HALL.maxZ;
  }

  collide(pos: Pt, radius = 0.3): void {
    super.collide(pos, radius);
    collideBoxes(pos, this.gateLift < 3 ? [GATEWAY] : [STREET_EDGE], radius);
  }

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
    if (this.phase === "warning") return { warn: true, rumble: ((this.cycleTime - WARN_AT) / (PASS_AT - WARN_AT)) * 0.35 };
    return { warn: true, rumble: Math.min(0.85, (CYCLE - this.cycleTime) / 0.6) };
  }

  // ------------------------------------------------------------- state

  sync(bits: number): void {
    for (const [bit, mat] of this.relayLamps) {
      const live = (bits & bit) !== 0;
      mat.emissive.set(live ? 0x3aff6a : 0xff2a1a);
      mat.color.set(live ? 0x3aff6a : 0xff2a1a);
    }
    const relays = TERMINUS_BIT.relayPlatform | TERMINUS_BIT.relayHall | TERMINUS_BIT.relayLuggage;
    const all = (bits & relays) === relays;
    this.controlLamp.emissiveIntensity = all && !terminusGatesOpen(bits) ? 2.6 : 0.1;
    this.gateTarget = terminusGatesOpen(bits) ? 3.4 : 0;
    if (bits & TERMINUS_BIT.escaped) this.gateLift = this.gateTarget;
    this.applyGates();
  }

  tick(time: number, danger: number): void {
    const dt = Math.min(0.1, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    if (this.t0 < 0) this.t0 = time - 8; // first warning ~14 s in
    this.cycleTime = (time - this.t0) % CYCLE;
    const c = this.cycleTime;
    this.phase = c < WARN_AT ? "idle" : c < PASS_AT ? "warning" : "passing";

    const due = this.phase !== "idle";
    const flip = Math.floor(time * 2.5) % 2;
    this.warnMats.forEach((m, i) => {
      const lit = due && flip === i % 2;
      m.emissiveIntensity = lit ? 3 : 0.05;
      this.warnHalos[i].visible = lit;
    });
    this.train.visible = this.phase === "passing";
    if (this.train.visible) this.train.position.x = TRAIN_START_X + (c - PASS_AT) * TRAIN_SPEED;

    // Gates rise slowly once powered.
    if (this.gateLift < this.gateTarget) {
      this.gateLift = Math.min(this.gateTarget, this.gateLift + dt * 0.6);
      this.applyGates();
    }
    this.lamps.forEach((l, i) => {
      const drop = Math.random() < 0.004 + 0.05 * danger * danger;
      l.light.intensity = l.base * (drop ? 0.1 : 0.93 + 0.07 * Math.sin(time * 2.2 + i));
    });
  }

  private applyGates(): void {
    this.gates.position.y = this.gateLift;
    const open = this.gateLift / 3.4;
    this.streetLight.intensity = 9 * open;
    this.streetHalo.material.opacity = 0.7 * open;
  }

  // ------------------------------------------------------------- builders

  private buildFloors(): void {
    const marble = this.texture(128, 128, (ctx) => {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          ctx.fillStyle = (x + y) % 2 ? "#2a2826" : "#c8c0b0";
          ctx.fillRect(x * 64, y * 64, 64, 64);
        }
      }
      ctx.fillStyle = "rgba(20,15,10,0.25)";
      for (let i = 0; i < 400; i++) ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
    });
    marble.repeat.set(18, 15);
    const concourse = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2, BACK - 30)),
      this.mat({ color: 0x9a948a, map: marble, roughness: 0.35, metalness: 0.05 }),
    );
    concourse.rotation.x = -Math.PI / 2;
    concourse.position.set(0, 0, -(30 + BACK) / 2);

    const concrete = this.texture(128, 128, (ctx) => speckle(ctx, 128, "#76726a", 900, 90, 150));
    concrete.repeat.set(12, 7);
    const platforms = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2, 20)),
      this.mat({ color: 0xa09a90, map: concrete, roughness: 0.9 }),
    );
    platforms.rotation.x = -Math.PI / 2;
    platforms.position.set(0, 0, -20);
    this.group.add(concourse, platforms);
    // Yellow lines along both platform edges.
    const yellow = this.mat({ color: 0xd4b030, roughness: 0.7 });
    this.block(yellow, 0, TRACK.minZ - 0.3, HALF_W * 2, 0.02, 0.2, 0.012, false);
    this.block(yellow, 0, TRACK.maxZ + 0.3, HALF_W * 2, 0.02, 0.2, 0.012, false);
  }

  private buildShell(): void {
    const tiles = this.texture(128, 128, drawGlazed);
    tiles.repeat.set(10, 3);
    const wall = this.mat({ color: 0xa8a090, map: tiles, roughness: 0.6 });
    const len = BACK - 11;
    this.block(wall, -HALF_W - 0.3, 11 + len / 2, 0.6, ROOF, len);
    this.block(wall, HALF_W + 0.3, 11 + len / 2, 0.6, ROOF, len);
    this.block(wall, -11.5, BACK + 0.3, 13, ROOF, 0.6);
    this.block(wall, 11.5, BACK + 0.3, 13, ROOF, 0.6);
    this.block(wall, 0, BACK + 0.3, 10, ROOF - 4.2, 0.6, 4.2 + (ROOF - 4.2) / 2, false);
    const roof = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2 + 1, len)),
      this.mat({ color: 0x0e1014, roughness: 1, side: THREE.DoubleSide }),
    );
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, ROOF, -(11 + len / 2));
    const truss = new THREE.InstancedMesh(
      this.geo(new THREE.BoxGeometry(HALF_W * 2, 0.5, 0.3)),
      this.mat({ color: 0x24282c, metalness: 0.6, roughness: 0.6 }),
      12,
    );
    const m = new THREE.Matrix4();
    for (let i = 0; i < 12; i++) truss.setMatrixAt(i, m.makeTranslation(0, ROOF - 0.6, -(13 + i * 4)));
    this.group.add(roof, truss);
  }

  private buildGhostLine(): void {
    this.block(this.mat({ color: 0x24221f, roughness: 1 }), 0, LINE, 80, 0.06, 3.4, 0.01, false);
    const steel = this.mat({ color: 0x8a8680, metalness: 0.85, roughness: 0.3 });
    const rails = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(80, 0.14, 0.07)), steel, 2);
    const m = new THREE.Matrix4();
    rails.setMatrixAt(0, m.makeTranslation(0, 0.1, -(LINE - 0.72)));
    rails.setMatrixAt(1, m.makeTranslation(0, 0.1, -(LINE + 0.72)));
    this.group.add(rails);
    // Warning lamps on both platform edges.
    for (const x of [-14, -4, 6, 16]) {
      for (const z of [TRACK.minZ - 0.6, TRACK.maxZ + 0.6]) {
        const mat = this.mat({ color: 0x220000, emissive: RED, emissiveIntensity: 0.05 });
        this.block(mat, x, z, 0.3, 0.12, 0.12, 0.08, false);
        const halo = this.halo(RED, 0.9, 0.7);
        halo.position.set(x, 0.25, -z);
        halo.visible = false;
        this.warnMats.push(mat);
        this.warnHalos.push(halo);
      }
    }
  }

  private relay(bit: number, target: string, x: number, z: number, facing: Pt): void {
    const cabinet = this.mat({ color: 0x3a4a3e, metalness: 0.4, roughness: 0.6 });
    const along = Math.abs(facing.x) > 0.5;
    this.block(cabinet, x, z, along ? 0.4 : 0.9, 1.3, along ? 0.9 : 0.4, 0.95);
    const panel = this.aimable(target, new THREE.BoxGeometry(along ? 0.03 : 0.8, 1.1, along ? 0.8 : 0.03), this.mat({ color: 0x4e6250, roughness: 0.5 }));
    panel.position.set(x + facing.x * 0.22, 0.95, -(z + facing.z * 0.22));
    const lampMat = this.mat({ color: 0xff2a1a, emissive: 0xff2a1a, emissiveIntensity: 2.2 });
    const lamp = new THREE.Mesh(this.geo(new THREE.SphereGeometry(0.07, 10, 8)), lampMat);
    lamp.position.set(x + facing.x * 0.25, 1.75, -(z + facing.z * 0.25));
    this.halo(0xff4a2a, 0.4, 0.5).position.copy(lamp.position);
    this.group.add(panel, lamp);
    this.relayLamps.set(bit, lampMat);
  }

  private buildPlatformOne(): void {
    // Platform canopy columns and a bench for cover.
    const iron = this.mat({ color: 0x2c3a34, metalness: 0.5, roughness: 0.6 });
    for (const x of [-9, 0, 9]) this.block(iron, x, 28, 0.35, 5, 0.35);
    this.block(this.mat({ color: 0x3a2c22, roughness: 0.9 }), 4.5, 28.2, 2.6, 0.5, 0.6, 0.25);
    this.relay(TERMINUS_BIT.relayPlatform, "relayPlatform", -13, 28.5, { x: 0, z: -1 });
    // Platform 2 columns.
    for (const x of [-9, 9]) this.block(iron, x, 17, 0.35, 5, 0.35);
  }

  private buildBookingHall(): void {
    const wall = this.mat({ color: 0x5a4a3c, roughness: 0.85 });
    // Walls with two ways in: a gap at the concourse side and one by the platforms.
    this.block(wall, -5.3, 38.6, 0.4, 3.4, 10.6, 1.7); // x −5.3, z 33.3…43.9
    this.block(wall, -13.65, 33.3, 8.7, 3.4, 0.4, 1.7); // z 33.3, x −18…−9.3
    this.block(wall, -11.65, 49.7, 12.7, 3.4, 0.4, 1.7); // back of hall, x −18…−5.3
    // Booking counter: cover in the water.
    this.block(this.mat({ color: 0x4a3426, roughness: 0.8 }), -11, 41, 5, 1.1, 0.7, 0.55);
    this.relay(TERMINUS_BIT.relayHall, "relayHall", -17.6, 46, { x: 1, z: 0 });
    // The flood.
    const ripples = this.texture(128, 128, (ctx) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 200; i++) {
        const v = 90 + Math.floor(Math.random() * 120);
        ctx.strokeStyle = `rgba(${v},${v},${v},0.5)`;
        ctx.beginPath();
        ctx.ellipse(Math.random() * 128, Math.random() * 128, 3 + Math.random() * 8, 1 + Math.random() * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ripples.repeat.set(3, 4);
    const water = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALL.maxX - HALL.minX, HALL.maxZ - HALL.minZ)),
      this.mat({ color: 0x1e302c, map: ripples, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set((HALL.minX + HALL.maxX) / 2, WATER_Y, -(HALL.minZ + HALL.maxZ) / 2);
    water.renderOrder = 2;
    this.group.add(water);
  }

  private buildLeftLuggage(): void {
    const wall = this.mat({ color: 0x4a4a52, roughness: 0.85 });
    this.block(wall, 6, 38.2, 0.4, 3.4, 8.4, 1.7); // x 6, z 34…42.4 (way in at z 42.4…48)
    this.block(wall, 12, 48.2, 12, 3.4, 0.4, 1.7); // north wall x 6…18
    this.block(wall, 13.4, 34, 9.2, 3.4, 0.4, 1.7); // south wall x 8.8…18 (gap by the door)
    const body = this.mat({ color: 0x5a6a5e, metalness: 0.5, roughness: 0.6 });
    const door = this.mat({ color: 0x6a7c6e, metalness: 0.5, roughness: 0.55 });
    // Wall bank on the east wall and a free-standing bank in the middle.
    this.block(body, 17.55, 41, 0.5, 2.2, 10, 1.1);
    this.block(body, 11, 41, 0.6, 2.2, 6, 1.1);
    const lockers: [string, number, number, number][] = [
      ["locker1", 17.28, 37, -90],
      ["locker2", 17.28, 44.5, -90],
      ["locker3", 10.68, 41, -90],
    ];
    for (const [id, x, z, yaw] of lockers) {
      const rad = THREE.MathUtils.degToRad(yaw);
      const fx = Math.sin(rad);
      const panel = this.aimable(id, new THREE.BoxGeometry(0.03, 1.9, 0.6), door);
      panel.position.set(x, 1, -z);
      this.group.add(panel);
      this.hideSpots[id] = { at: { x: x - fx * 0.3, z }, out: { x: x + fx * 0.75, z }, yaw };
    }
    this.relay(TERMINUS_BIT.relayLuggage, "relayLuggage", 14, 47.6, { x: 0, z: -1 });
  }

  private buildConcourse(): void {
    const stone = this.mat({ color: 0x8a8478, roughness: 0.8 });
    for (const [x, z] of [[-3, 36], [3, 36], [-3, 43], [3, 43], [-9, 55], [9, 55]] as const) this.block(stone, x, z, 0.8, ROOF, 0.8);
    const wood = this.mat({ color: 0x3a2c22, roughness: 0.9 });
    for (const [x, z] of [[0, 39.5], [-12, 54], [12, 52.5]] as const) this.block(wood, x, z, 2.6, 0.5, 0.6, 0.25);
    // Ticket office with the gate control on its front.
    this.block(this.mat({ color: 0x4a3a2c, roughness: 0.8 }), 0, 51.2, 5, 3, 3);
    this.block(this.mat({ color: 0x1a1612, roughness: 0.9 }), 0, 51.2, 5.4, 0.2, 3.4, 3.1, false);
    const control = this.aimable("gateControl", new THREE.BoxGeometry(0.7, 0.5, 0.12), this.mat({ color: 0x8a6a2a, metalness: 0.6 }));
    control.position.set(0, 1.25, -(51.2 - 1.56));
    this.controlLamp = this.mat({ color: 0x0a1a0a, emissive: 0x6aff5a, emissiveIntensity: 0.1 });
    const lamp = new THREE.Mesh(this.geo(new THREE.SphereGeometry(0.06, 8, 6)), this.controlLamp);
    lamp.position.set(0.25, 1.62, -(51.2 - 1.6));
    this.group.add(control, lamp);
    // The great clock, stopped at a minute to midnight.
    const face = this.texture(256, 256, drawClock);
    const clock = new THREE.Mesh(
      this.geo(new THREE.CircleGeometry(1.6, 40)),
      this.mat({ color: 0xffffff, map: face, emissive: 0xfff2d0, emissiveMap: face, emissiveIntensity: 0.35, roughness: 0.5 }),
    );
    clock.position.set(0, 7.2, -(BACK - 0.02));
    this.group.add(clock);
  }

  private buildGates(): void {
    this.gates = new THREE.Group();
    const bar = this.mat({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.5 });
    const bars = new THREE.InstancedMesh(this.geo(new THREE.CylinderGeometry(0.035, 0.035, 4.2, 6)), bar, 30);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 30; i++) bars.setMatrixAt(i, m.makeTranslation(-4.9 + i * 0.338, 2.1, 0));
    const rail = new THREE.Mesh(this.geo(new THREE.BoxGeometry(10, 0.12, 0.08)), bar);
    rail.position.y = 3.9;
    this.gates.add(bars, rail);
    this.gates.position.set(0, 0, -(BACK + 0.05));
    const hit = this.aimable("exitGates", new THREE.PlaneGeometry(9.6, 4), this.mat({ transparent: true, opacity: 0, depthWrite: false }));
    hit.position.set(0, 2, -(BACK - 0.1));
    this.group.add(this.gates, hit);
    // The street beyond: dark until the gates rise.
    this.streetLight = new THREE.PointLight(STREET, 0, 18, 1.5);
    this.streetLight.position.set(0, 4, -(BACK + 3));
    this.streetHalo = this.halo(STREET, 7, 0);
    this.streetHalo.position.set(0, 3, -(BACK + 4));
    this.group.add(this.streetLight);
  }

  private buildLights(): void {
    const spots: [number, number, number, number, number][] = [
      [0, 16, COLD, 7, 5.5],
      [0, 46, WARM, 6, 8],
      [-12, 41, RED, 3, 3.2],
    ];
    for (const [x, z, color, base, h] of spots) {
      const light = new THREE.PointLight(color, base, 20, 1.6);
      light.position.set(x, h, -z);
      this.halo(color, 1.6, 0.5).position.set(x, h + 0.15, -z);
      this.block(this.mat({ color: 0x111111, emissive: color, emissiveIntensity: 2 }), x, z, 0.5, 0.12, 0.25, h + 0.3, false);
      this.pool(color, x, z, 12, 0.12);
      this.group.add(light);
      this.glow.push(light);
      this.lamps.push({ light, base });
    }
  }

  private buildTrain(): void {
    // A ghost train: pale coaches with lit windows and no driver.
    this.train = new THREE.Group();
    this.train.visible = false;
    const coaches = 6;
    const len = 18;
    const shell = this.mat({ color: 0x9aa8b0, transparent: true, opacity: 0.45, roughness: 0.3, depthWrite: false });
    const glow = this.mat({ color: 0x223040, emissive: 0xcfe8ff, emissiveIntensity: 1.6, transparent: true, opacity: 0.8 });
    const bodies = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(len, 3.4, 2.8)), shell, coaches);
    const windows = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(len - 2, 0.7, 2.86)), glow, coaches);
    const m = new THREE.Matrix4();
    for (let i = 0; i < coaches; i++) {
      bodies.setMatrixAt(i, m.makeTranslation(-len / 2 - i * (len + 0.6), 2, 0));
      windows.setMatrixAt(i, m.makeTranslation(-len / 2 - i * (len + 0.6), 2.3, 0));
    }
    this.train.add(bodies, windows);
    for (const dz of [-0.9, 0.9]) {
      const head = this.halo(0xe8f4ff, 2.2, 0.8);
      this.group.remove(head);
      head.position.set(0.3, 1.1, dz);
      this.train.add(head);
    }
    this.train.position.set(TRAIN_START_X, 0, -LINE);
    this.group.add(this.train);
  }
}

function drawGlazed(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#2e2a24";
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 32) {
      const v = 150 + Math.floor(Math.random() * 40);
      ctx.fillStyle = y < 32 ? `rgb(${v * 0.55},${v * 0.7},${v * 0.6})` : `rgb(${v},${v - 6},${v - 20})`;
      ctx.fillRect(x + 1, y + 1, 30, 14);
    }
  }
  const grime = ctx.createLinearGradient(0, 0, 0, 128);
  grime.addColorStop(0, "rgba(20,18,15,0.5)");
  grime.addColorStop(1, "rgba(20,18,15,0.15)");
  ctx.fillStyle = grime;
  ctx.fillRect(0, 0, 128, 128);
}

/** Clock face stopped at 11:59. */
function drawClock(ctx: CanvasRenderingContext2D): void {
  const c = 128;
  ctx.fillStyle = "#e8e0cc";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#1a1612";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c, c, 120, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.lineWidth = i % 3 ? 4 : 8;
    ctx.beginPath();
    ctx.moveTo(c + Math.sin(a) * 100, c - Math.cos(a) * 100);
    ctx.lineTo(c + Math.sin(a) * 114, c - Math.cos(a) * 114);
    ctx.stroke();
  }
  const hand = (turns: number, length: number, width: number) => {
    const a = turns * Math.PI * 2;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.sin(a) * length, c - Math.cos(a) * length);
    ctx.stroke();
  };
  hand(11.983 / 12, 62, 9); // hour hand, just shy of twelve
  hand(59 / 60, 96, 6); // minute hand
}
