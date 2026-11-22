import * as THREE from "three";
import { collideBoxes, type Box, type Pt } from "./geom.ts";
import type { Arena } from "./hunter.ts";
import { StageWorld, speckle } from "./stage-kit.ts";
import { PUMP_BIT, channelDrained, hallDrained } from "./story-pump.ts";

/**
 * Hollin Pumping Station. Game coordinates (x, z); world z = -game z.
 *
 *   z 48  ═══ back wall ═══════ [sluice wheel x 0] ═══════════
 *   z 45–47.6  ░░░░░░░░░░ back grate walkway ░░░░░░░░░░░░░░░░
 *   z 32–47                                     ░ east grate ░
 *   z 28–31  ≈≈≈≈≈≈≈≈≈≈ deep sump channel (blocks the player) ≈≈≈≈≈≈≈≈≈≈
 *   z 20     [pump 1, x -8]
 *   z 17                                 [pump 2, x 8]
 *   z 12–27  ░ west grate ░  (tool locker at z 15)
 *   z 11  ───── Car 07 door ─────
 *
 * Everything not on a grate is under water until the sluice opens.
 */

const HALF_W = 13;
const BACK = 48;
const CEILING = 6;
const WATER_UP = 0.35;
const WATER_DOWN = -0.12;
const GRATE_Y = 0.42;
const SICK = 0x8fe0c8;
const EMERGENCY = 0xff3020;

const GRATES: Box[] = [
  { minX: -12.8, maxX: -10.6, minZ: 11.3, maxZ: 27.5 },
  { minX: 10.6, maxX: 12.8, minZ: 31.5, maxZ: 47.6 },
  { minX: -12.8, maxX: 12.8, minZ: 45.4, maxZ: 47.6 },
];
const CHANNEL: Box = { minX: -14, maxX: 14, minZ: 28, maxZ: 31 };

type Pump = { wheel: THREE.Object3D; lamp: THREE.MeshStandardMaterial; running: boolean; spin: number };

export class PumpWorld extends StageWorld {
  readonly spawn: Pt = { x: 0, z: 13.2 };
  readonly boarded: Pt = { x: 0, z: 8.5 };
  readonly arena: Arena;

  private readonly pumps: Pump[] = [];
  private readonly lights: { light: THREE.PointLight; base: number; halo: THREE.Sprite }[] = [];
  private water!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private waterTex!: THREE.CanvasTexture;
  private channelShade!: THREE.MeshBasicMaterial;
  private sluice!: THREE.Object3D;
  private level = WATER_UP;
  private levelTarget = WATER_UP;
  private shade = 0.65;
  private shadeTarget = 0.65;
  private channelOpen = false;
  private sluiceSpin = 0;
  private lastBits = -1;
  private lastTime = 0;

  constructor(scene: THREE.Scene) {
    super(scene, "hollin-pumping-station");
    this.buildShell();
    this.buildGrates();
    this.buildChannel();
    this.buildColumnsAndPipes();
    this.buildPumps();
    this.buildToolLocker();
    this.buildSluice();
    this.buildLights();
    this.buildWater();
    this.buildCarDoor();

    Object.assign(this.noise, {
      pumpA: { x: -8, z: 18.6 },
      pumpB: { x: 8, z: 15.6 },
      sluiceWheel: { x: 0, z: 47 },
    });
    // The Listener's map ignores the channel: it wades straight through.
    this.arena = {
      minX: -HALF_W,
      maxX: HALF_W,
      minZ: 11.3,
      maxZ: BACK - 0.3,
      solids: this.solids,
      patrol: [
        { x: -9, z: 44 },
        { x: 9, z: 43 },
        { x: 0, z: 36 },
        { x: -10, z: 33 },
        { x: 10, z: 24 },
        { x: -7, z: 26 },
        { x: 1, z: 15 },
      ],
      start: { x: 0, z: 44 },
    };
  }

  wet(pos: Pt): boolean {
    if (this.level <= 0.03 || pos.z < 11.3) return false;
    return !GRATES.some((g) => pos.x >= g.minX && pos.x <= g.maxX && pos.z >= g.minZ && pos.z <= g.maxZ);
  }

  collide(pos: Pt, radius = 0.3): void {
    super.collide(pos, radius);
    if (!this.channelOpen) collideBoxes(pos, [CHANNEL], radius);
  }

  sync(bits: number): void {
    const has = (b: number) => (bits & b) !== 0;
    [PUMP_BIT.pumpA, PUMP_BIT.pumpB].forEach((bit, i) => {
      const pump = this.pumps[i];
      pump.running = has(bit);
      pump.lamp.color.set(pump.running ? 0x2aff6a : 0xff2a1a);
      pump.lamp.emissive.set(pump.running ? 0x2aff6a : 0xff2a1a);
    });
    this.channelOpen = channelDrained(bits);
    this.shadeTarget = this.channelOpen ? 0 : 0.65;
    this.levelTarget = hallDrained(bits) ? WATER_DOWN : WATER_UP;
    const newlyOpened = this.lastBits >= 0 && hallDrained(bits) && !hallDrained(this.lastBits);
    if (newlyOpened) this.sluiceSpin = 4;
    if (this.lastBits < 0) {
      // Restoring a save: snap instead of animating.
      this.level = this.levelTarget;
      this.shade = this.shadeTarget;
      if (hallDrained(bits)) this.sluice.rotation.z = Math.PI * 3;
    }
    this.lastBits = bits;
    this.applyWater();
  }

  tick(time: number, danger: number): void {
    const dt = Math.min(0.1, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    // Drain slowly enough to watch it happen.
    this.level += Math.sign(this.levelTarget - this.level) * Math.min(Math.abs(this.levelTarget - this.level), dt * 0.08);
    this.shade += (this.shadeTarget - this.shade) * Math.min(1, dt * 0.6);
    this.applyWater();
    this.waterTex.offset.set(time * 0.012, time * 0.02);

    for (const p of this.pumps) {
      p.spin = THREE.MathUtils.lerp(p.spin, p.running ? 9 : 0, Math.min(1, dt * 0.8));
      p.wheel.rotation.x += p.spin * dt;
    }
    if (this.sluiceSpin > 0) {
      this.sluiceSpin -= dt;
      this.sluice.rotation.z += dt * 2.4;
    }
    this.lights.forEach((l, i) => {
      const drop = Math.random() < 0.004 + 0.04 * danger * danger;
      const k = drop ? 0.1 : 0.9 + 0.1 * Math.sin(time * (i ? 3.1 : 2.3));
      l.light.intensity = l.base * k;
      l.halo.material.opacity = 0.5 * k;
    });
  }

  private applyWater(): void {
    this.water.position.y = this.level;
    this.water.visible = this.level > 0.005;
    this.channelShade.opacity = this.shade * (this.water.visible ? 1 : 0);
  }

  // ---------------------------------------------------------------- builders

  private buildShell(): void {
    const floorTex = this.texture(256, 256, (ctx) => speckle(ctx, 256, "#4a4c48", 2000, 45, 95));
    floorTex.repeat.set(6, 9);
    const floor = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2, BACK - 10)),
      this.mat({ color: 0x8a8e88, map: floorTex, roughness: 0.45, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -(10 + BACK) / 2);

    const tiles = this.texture(128, 128, drawTiles);
    tiles.repeat.set(12, 1);
    const wall = this.mat({ color: 0x9aa8a0, map: tiles, roughness: 0.6 });
    this.block(wall, -HALF_W - 0.25, (11 + BACK) / 2, 0.5, CEILING, BACK - 10);
    this.block(wall, HALF_W + 0.25, (11 + BACK) / 2, 0.5, CEILING, BACK - 10);
    this.block(wall, 0, BACK + 0.25, HALF_W * 2 + 1, CEILING, 0.5);

    const ceiling = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2 + 1, BACK - 10)),
      this.mat({ color: 0x101413, roughness: 1, side: THREE.DoubleSide }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CEILING, -(10 + BACK) / 2);
    this.group.add(floor, ceiling);
  }

  private buildGrates(): void {
    const grate = this.texture(64, 64, (ctx) => {
      ctx.fillStyle = "#2c302e";
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = "#7a7e76";
      ctx.lineWidth = 3;
      for (let i = 0; i <= 64; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 64);
        ctx.moveTo(0, i);
        ctx.lineTo(64, i);
        ctx.stroke();
      }
    });
    for (const g of GRATES) {
      const w = g.maxX - g.minX;
      const d = g.maxZ - g.minZ;
      const map = this.own(grate.clone());
      map.repeat.set(w / 0.6, d / 0.6);
      map.needsUpdate = true;
      const mat = this.mat({ color: 0xb0b4aa, map, metalness: 0.7, roughness: 0.45 });
      this.block(mat, (g.minX + g.maxX) / 2, (g.minZ + g.maxZ) / 2, w, 0.06, d, GRATE_Y, false);
    }
    // Yellow edge rails so the dry paths read at a glance.
    const rail = this.mat({ color: 0xc9a227, roughness: 0.6 });
    this.block(rail, -10.6, 19.4, 0.06, 0.9, 16.2, GRATE_Y + 0.45, false);
    this.block(rail, 10.6, 38.5, 0.06, 0.9, 14, GRATE_Y + 0.45, false);
  }

  private buildChannel(): void {
    const mid = (CHANNEL.minZ + CHANNEL.maxZ) / 2;
    const depth = CHANNEL.maxZ - CHANNEL.minZ;
    // The sump floor: dark enough to read as deep through the water.
    this.block(this.mat({ color: 0x050707, roughness: 1 }), 0, mid, HALF_W * 2, 0.02, depth, 0.005, false);
    const hazard = this.mat({ color: 0xc9a227, roughness: 0.7 });
    for (const z of [CHANNEL.minZ, CHANNEL.maxZ]) this.block(hazard, 0, z, HALF_W * 2, 0.04, 0.14, 0.02, false);
    this.channelShade = this.own(
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.65, depthWrite: false }),
    );
    const shade = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(HALF_W * 2, depth)), this.channelShade);
    shade.rotation.x = -Math.PI / 2;
    shade.position.set(0, WATER_UP + 0.004, -mid);
    shade.renderOrder = 3;
    this.group.add(shade);
  }

  private buildColumnsAndPipes(): void {
    const concrete = this.mat({ color: 0x6a6e68, roughness: 0.9 });
    for (const x of [-5, 5]) for (const z of [16, 24, 36, 44]) this.block(concrete, x, z, 0.6, CEILING, 0.6);
    const pipeMat = this.mat({ color: 0x4a5a50, metalness: 0.6, roughness: 0.5 });
    const pipes = new THREE.InstancedMesh(this.geo(new THREE.CylinderGeometry(0.28, 0.28, BACK - 11, 12)), pipeMat, 4);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    [-9, -7.9, 7.9, 9].forEach((x, i) => {
      m.compose(new THREE.Vector3(x, CEILING - 0.6 - (i % 2) * 0.35, -(11 + BACK) / 2), q, new THREE.Vector3(1, 1, 1));
      pipes.setMatrixAt(i, m);
    });
    this.group.add(pipes);
  }

  private buildPumps(): void {
    const casing = this.mat({ color: 0x3e5a6a, metalness: 0.55, roughness: 0.45 });
    const iron = this.mat({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.5 });
    const socketMat = this.mat({ color: 0xb08a30, metalness: 0.6, roughness: 0.4 });
    const spots: ["pumpA" | "pumpB", number, number][] = [
      ["pumpA", -8, 20],
      ["pumpB", 8, 17],
    ];
    for (const [target, x, z] of spots) {
      this.block(casing, x, z, 2, 1.8, 1.8, 0.9);
      const body = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(0.8, 0.8, 1.9, 20)), casing);
      body.position.set(x, 1.85, -z);
      // Riser pipe to the ceiling main.
      const riser = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(0.22, 0.22, CEILING - 2.8, 10)), iron);
      riser.position.set(x, 2.8 + (CEILING - 2.8) / 2, -z);
      // Flywheel on the side facing the centre of the hall.
      const side = x < 0 ? 1 : -1;
      const wheel = new THREE.Object3D();
      wheel.position.set(x + side * 1.08, 1.1, -z);
      const rim = new THREE.Mesh(this.geo(new THREE.TorusGeometry(0.62, 0.07, 8, 24).rotateY(Math.PI / 2)), iron);
      const spoke = new THREE.Mesh(this.geo(new THREE.BoxGeometry(0.06, 1.2, 0.08)), iron);
      const spoke2 = spoke.clone();
      spoke2.rotation.x = Math.PI / 2;
      wheel.add(rim, spoke, spoke2);
      // Crank socket faces Car 07 so it's what you see walking up.
      const socket = this.aimable(target, new THREE.BoxGeometry(0.34, 0.34, 0.2), socketMat);
      socket.position.set(x, 1.1, -(z - 0.98));
      const lampMat = this.mat({ color: 0xff2a1a, emissive: 0xff2a1a, emissiveIntensity: 2 });
      const lamp = new THREE.Mesh(this.geo(new THREE.SphereGeometry(0.08, 10, 8)), lampMat);
      lamp.position.set(x + 0.55, 1.6, -(z - 0.92));
      this.group.add(body, riser, wheel, socket, lamp);
      this.pumps.push({ wheel, lamp: lampMat, running: false, spin: 0 });
    }
  }

  private buildToolLocker(): void {
    const x = -12.75;
    const z = 15;
    this.block(this.mat({ color: 0x7a3a22, metalness: 0.4, roughness: 0.6 }), x, z, 0.45, 1.6, 0.9, GRATE_Y + 0.8);
    const door = this.aimable("crankBox", new THREE.BoxGeometry(0.03, 1.5, 0.85), this.mat({ color: 0x8e4628, roughness: 0.55 }));
    door.position.set(x + 0.24, GRATE_Y + 0.8, -z);
    this.group.add(door);
  }

  private buildSluice(): void {
    const steel = this.mat({ color: 0x5a6058, metalness: 0.7, roughness: 0.4 });
    this.block(steel, 0, BACK - 0.05, 3.2, 3, 0.15, 1.5, false);
    const wheel = new THREE.Object3D();
    wheel.position.set(0, 1.6, -(BACK - 0.35));
    const red = this.mat({ color: 0x9a2a18, metalness: 0.5, roughness: 0.45 });
    const rim = this.aimable("sluiceWheel", new THREE.TorusGeometry(0.55, 0.06, 8, 28), red);
    const hub = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 12).rotateX(Math.PI / 2)), red);
    wheel.add(rim, hub);
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(this.geo(new THREE.BoxGeometry(1.1, 0.05, 0.05)), red);
      spoke.rotation.z = (i * Math.PI) / 3;
      wheel.add(spoke);
    }
    this.sluice = wheel;
    this.group.add(wheel);
  }

  private buildLights(): void {
    const work: [number, number, number, number][] = [
      [-6, 18, SICK, 6],
      [6, 38, SICK, 6],
      [0, 46, EMERGENCY, 3.5],
    ];
    for (const [x, z, color, base] of work) {
      const light = new THREE.PointLight(color, base, 16, 1.7);
      light.position.set(x, 4.3, -z);
      const halo = this.halo(color, 1.4, 0.5);
      halo.position.set(x, 4.5, -z);
      this.block(this.mat({ color: 0x111111, emissive: color, emissiveIntensity: 1.8 }), x, z, 0.3, 0.2, 0.3, 4.6, false);
      this.pool(color, x, z, 8, 0.1);
      this.group.add(light);
      this.glow.push(light);
      this.lights.push({ light, base, halo });
    }
    // Caged emergency bulbs: glow only, no light cost.
    for (const [x, z] of [[-12.9, 24], [12.9, 20], [-12.9, 40], [12.9, 34]] as const) {
      const bulb = this.halo(EMERGENCY, 0.7, 0.6);
      bulb.position.set(x + (x < 0 ? 0.2 : -0.2), 2.6, -z);
      this.block(this.mat({ color: 0x220000, emissive: EMERGENCY, emissiveIntensity: 2 }), x + (x < 0 ? 0.12 : -0.12), z, 0.12, 0.16, 0.12, 2.6, false);
    }
  }

  private buildWater(): void {
    this.waterTex = this.texture(128, 128, (ctx) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 260; i++) {
        const v = 90 + Math.floor(Math.random() * 120);
        ctx.strokeStyle = `rgba(${v},${v},${v},0.5)`;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + Math.random() * 9, 1 + Math.random() * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    this.waterTex.repeat.set(5, 7);
    const material = this.mat({
      color: 0x203530,
      map: this.waterTex,
      roughness: 0.12,
      metalness: 0.35,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
    });
    this.water = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(HALF_W * 2, BACK - 11)), material);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(0, WATER_UP, -(11 + BACK) / 2);
    this.water.renderOrder = 2;
    this.group.add(this.water);
  }

  private buildCarDoor(): void {
    const door = this.aimable("carDoor", new THREE.PlaneGeometry(1.4, 2.1), this.mat({ transparent: true, opacity: 0, depthWrite: false }));
    door.position.set(0, 1.1, -11.05);
    this.group.add(door);
  }
}

/** Old white glazed tiles, stained from the waterline down. */
function drawTiles(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#3a403c";
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 16) {
      const v = 175 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${v},${v + 4},${v - 6})`;
      ctx.fillRect(x + 1, y + 1, 14, 14);
    }
  }
  const stain = ctx.createLinearGradient(0, 0, 0, 128);
  stain.addColorStop(0, "rgba(30,40,30,0)");
  stain.addColorStop(0.7, "rgba(40,50,35,0.35)");
  stain.addColorStop(1, "rgba(30,35,25,0.75)");
  ctx.fillStyle = stain;
  ctx.fillRect(0, 0, 128, 128);
}
