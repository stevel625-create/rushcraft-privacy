import * as THREE from "three";
import type { Pt } from "./geom.ts";
import type { Arena } from "./hunter.ts";
import { StageWorld, speckle } from "./stage-kit.ts";
import { YARD_BIT, pointReversed, yardRouteSet } from "./story-yard.ts";

/**
 * Yard Nine. Game coordinates (x, z); world z = -game z. Car 07 sits at
 * game z < 11 and the yard opens out beyond its door.
 *
 *   z 46  ── fence ───────────────────────────────
 *   z 39             floodlight        [signal box]
 *   z 32  ═══ track 3 ════[wagon]═════════════════   lever C at x -3
 *   z 25  ═══ track 2 ═══════[wagon]══════════════   lever B at x 7
 *   z 18  ═══ track 1 ══[wagon]═══════════════════   lever A at x -9
 *   z 12.5  signal head          signal lever
 *   z 11  ── Car 07 door ─────────────────────────
 */

const SODIUM = 0xffa24a;
const TRACKS = [18, 25, 32];
const GAUGE = 1.435;

type Lever = "pointA" | "pointB" | "pointC" | "signalLever";
const LEVERS: [Lever, number, number][] = [
  ["pointA", -9, 16.2],
  ["pointB", 7, 23.2],
  ["pointC", -3, 30.2],
  ["signalLever", 4, 12.8],
];

export class YardWorld extends StageWorld {
  readonly spawn: Pt = { x: 0, z: 14 };
  readonly boarded: Pt = { x: 0, z: 8.5 };
  readonly arena: Arena;

  private readonly levers = new Map<Lever, THREE.Object3D>();
  private readonly signalRed: THREE.MeshStandardMaterial;
  private readonly signalGreen: THREE.MeshStandardMaterial;
  private readonly signalHaloRed: THREE.Sprite;
  private readonly signalHaloGreen: THREE.Sprite;
  private readonly boxWindow: THREE.MeshStandardMaterial;
  private readonly boxLight: THREE.PointLight;
  private readonly floods: THREE.PointLight[] = [];
  private readonly floodHalos: THREE.Sprite[] = [];

  constructor(scene: THREE.Scene) {
    super(scene, "yard-nine");
    this.signalRed = this.mat({ color: 0x301010, emissive: 0xff2a1a, emissiveIntensity: 2.2 });
    this.signalGreen = this.mat({ color: 0x0c2414, emissive: 0x2aff7a, emissiveIntensity: 0 });
    this.boxWindow = this.mat({ color: 0x141a1c, emissive: 0xffd28a, emissiveIntensity: 0 });
    this.signalHaloRed = this.halo(0xff3a2a, 0.9);
    this.signalHaloGreen = this.halo(0x3aff8a, 0.9);

    this.buildGround();
    this.buildTracks();
    this.buildWagons();
    this.buildFence();
    this.buildFloodlights();
    this.boxLight = this.buildSignalBox();
    this.buildLevers();
    this.buildSignal();
    this.buildCarDoor();

    Object.assign(this.noise, {
      yardBreaker: { x: 8.6, z: 38.5 },
      pointA: { x: -9, z: 15.4 },
      pointB: { x: 7, z: 22.4 },
      pointC: { x: -3, z: 29.4 },
      signalLever: { x: 4, z: 12.0 },
    });
    this.arena = {
      minX: -16.3,
      maxX: 16.3,
      minZ: 11.3,
      maxZ: 46.3,
      solids: this.solids,
      patrol: [
        { x: -12, z: 44 },
        { x: 12, z: 43 },
        { x: 13, z: 21 },
        { x: -13, z: 28 },
        { x: 0, z: 36 },
      ],
      start: { x: 0, z: 44 },
    };
  }

  sync(bits: number): void {
    const powered = (bits & YARD_BIT.power) !== 0;
    for (const p of ["pointA", "pointB", "pointC"] as const) {
      this.levers.get(p)!.rotation.x = pointReversed(bits, p) ? -0.55 : 0.55;
    }
    const routeSet = yardRouteSet(bits);
    this.levers.get("signalLever")!.rotation.x = routeSet ? -0.55 : 0.55;
    this.signalRed.emissiveIntensity = routeSet ? 0 : 2.2;
    this.signalGreen.emissiveIntensity = routeSet ? 2.4 : 0;
    this.signalHaloRed.visible = !routeSet;
    this.signalHaloGreen.visible = routeSet;
    this.boxWindow.emissiveIntensity = powered ? 1.6 : 0;
    // Intensity, not visibility: keeps the light count (and shaders) stable.
    this.boxLight.intensity = powered ? 6 : 0;
  }

  /** Sodium lamps buzz and dip, harder when the Listener is near. */
  tick(time: number, danger: number): void {
    this.floods.forEach((light, i) => {
      const hum = 0.92 + 0.08 * Math.sin(time * 7.3 + i * 2.1);
      const dip = danger > 0.5 && Math.random() < 0.04 * danger ? 0.25 : 1;
      light.intensity = 9 * hum * dip;
      this.floodHalos[i].material.opacity = 0.55 * hum * dip;
    });
  }

  // ---------------------------------------------------------------- builders

  private buildGround(): void {
    const tex = this.texture(128, 128, (ctx) => speckle(ctx, 128, "#6f685e", 1400, 70, 160));
    tex.repeat.set(16, 18);
    const ground = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(34, 37)),
      this.mat({ color: 0x8a8378, map: tex, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -28.5);
    this.group.add(ground);
  }

  private buildTracks(): void {
    const steel = this.mat({ color: 0x5c5650, metalness: 0.8, roughness: 0.45 });
    const wood = this.mat({ color: 0x3a2c22, roughness: 0.95 });
    const perTrack = 52;
    const sleepers = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(0.24, 0.1, 2.5)), wood, perTrack * TRACKS.length);
    const rails = new THREE.InstancedMesh(this.geo(new THREE.BoxGeometry(34, 0.14, 0.07)), steel, TRACKS.length * 2);
    const m = new THREE.Matrix4();
    let n = 0;
    let r = 0;
    for (const z of TRACKS) {
      for (const side of [-1, 1]) rails.setMatrixAt(r++, m.makeTranslation(0, 0.12, -(z + (side * GAUGE) / 2)));
      for (let i = 0; i < perTrack; i++) {
        m.makeRotationY(Math.sin(i * 12.9898 + z) * 0.04);
        m.setPosition(-16.5 + i * 0.65, 0.05, -z);
        sleepers.setMatrixAt(n++, m);
      }
    }
    this.group.add(sleepers, rails);
  }

  private buildWagons(): void {
    // Freight wagons break up sightlines: the main cover in an open yard.
    const wagons = [
      { x: 3.5, z: 18, len: 7, color: 0x4a2a20 },
      { x: -6, z: 25, len: 8, color: 0x2c3a36 },
      { x: 10, z: 32, len: 7.5, color: 0x3b3026 },
      { x: -11.5, z: 32, len: 6, color: 0x4a2a20 },
    ];
    const ribs = this.texture(64, 128, drawRibs);
    const wheels = new THREE.InstancedMesh(
      this.geo(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 14).rotateX(Math.PI / 2)),
      this.mat({ color: 0x1c1a18, metalness: 0.6, roughness: 0.6 }),
      wagons.length * 4,
    );
    const m = new THREE.Matrix4();
    let n = 0;
    for (const w of wagons) {
      const map = this.own(ribs.clone());
      map.repeat.set(w.len / 1.2, 1);
      map.needsUpdate = true;
      this.block(this.mat({ color: w.color, map, roughness: 0.85, metalness: 0.25 }), w.x, w.z, w.len, 2.5, 2.7, 2.0);
      for (const dx of [-w.len / 2 + 1, w.len / 2 - 1]) {
        for (const side of [-1, 1]) wheels.setMatrixAt(n++, m.makeTranslation(w.x + dx, 0.42, -(w.z + side * 0.72)));
      }
    }
    this.group.add(wheels);
  }

  private buildFence(): void {
    const mesh = this.mat({
      color: 0x3a403f,
      metalness: 0.5,
      roughness: 0.7,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    for (const [w, x, z, rotY] of [
      [34, 0, 46.5, 0],
      [36, -16.5, 28.5, Math.PI / 2],
      [36, 16.5, 28.5, Math.PI / 2],
    ] as const) {
      const fence = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(w, 3)), mesh);
      fence.position.set(x, 1.5, -z);
      fence.rotation.y = rotY;
      this.group.add(fence);
    }
    this.solids.push(
      { minX: -17, maxX: 17, minZ: 46.3, maxZ: 47 },
      { minX: -17, maxX: -16.3, minZ: 11, maxZ: 47 },
      { minX: 16.3, maxX: 17, minZ: 11, maxZ: 47 },
    );
  }

  private buildFloodlights(): void {
    const pole = this.mat({ color: 0x2a2c2c, metalness: 0.6, roughness: 0.6 });
    const lamp = this.mat({ color: 0x221a10, emissive: SODIUM, emissiveIntensity: 3 });
    for (const [x, z] of [[-14, 21.5], [14, 28.5], [-1, 44]] as const) {
      this.block(pole, x, z, 0.3, 9, 0.3);
      this.block(lamp, x, z, 1.1, 0.3, 0.6, 9, false);
      // No shadows: keeps the yard cheap enough for phones.
      const light = new THREE.PointLight(SODIUM, 9, 22, 1.6);
      light.position.set(x, 8.6, -z);
      const halo = this.halo(SODIUM, 2.6);
      halo.position.set(x, 8.95, -z);
      this.pool(SODIUM, x, z, 14);
      this.group.add(light);
      this.floods.push(light);
      this.floodHalos.push(halo);
      this.glow.push(light);
    }
  }

  private buildSignalBox(): THREE.PointLight {
    const x = 11;
    const z = 39;
    this.block(this.mat({ color: 0x55483c, roughness: 0.9 }), x, z, 4.4, 3, 3.2);
    this.block(this.mat({ color: 0x2a2624, roughness: 0.8 }), x, z, 4.9, 0.2, 3.7, 3.1, false);
    const window = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(2.8, 0.9)), this.boxWindow);
    window.position.set(x, 2.1, -z + 1.61); // front faces Car 07
    const breaker = this.aimable(
      "yardBreaker",
      new THREE.BoxGeometry(0.5, 0.7, 0.18),
      this.mat({ color: 0x6b5a2a, metalness: 0.4, roughness: 0.6 }),
    );
    breaker.position.set(x - 2.4, 1.3, -z + 0.5);
    const board = this.aimable("routeBoard", new THREE.PlaneGeometry(1.1, 0.75), this.mat({ color: 0xd8d0b8, roughness: 0.9 }));
    board.position.set(x, 1.2, -z + 1.62);
    const light = new THREE.PointLight(0xffd28a, 0, 7, 1.8);
    light.position.set(x, 2, -z + 2.2);
    this.group.add(window, breaker, board, light);
    this.glow.push(light);
    return light;
  }

  private buildLevers(): void {
    const frameMat = this.mat({ color: 0x2c2a26, metalness: 0.5, roughness: 0.7 });
    const handleMat = this.mat({ color: 0xa8321e, metalness: 0.3, roughness: 0.5 });
    for (const [target, x, z] of LEVERS) {
      this.block(frameMat, x, z, 0.6, 0.35, 0.9);
      const pivot = new THREE.Object3D();
      pivot.position.set(x, 0.35, -z);
      const handle = this.aimable(target, new THREE.BoxGeometry(0.09, 1.25, 0.09), handleMat);
      handle.position.y = 0.6;
      pivot.add(handle);
      this.group.add(pivot);
      this.levers.set(target, pivot);
    }
  }

  private buildSignal(): void {
    const x = -12;
    const z = 12.5;
    this.block(this.mat({ color: 0x2a2c2c, metalness: 0.6 }), x, z, 0.18, 4, 0.18);
    this.block(this.mat({ color: 0x111111 }), x, z, 0.5, 1, 0.3, 4, false);
    const lampGeo = this.geo(new THREE.CircleGeometry(0.13, 16));
    const red = new THREE.Mesh(lampGeo, this.signalRed);
    red.position.set(x, 4.22, -z + 0.16);
    const green = new THREE.Mesh(lampGeo, this.signalGreen);
    green.position.set(x, 3.82, -z + 0.16);
    this.signalHaloRed.position.set(x, 4.22, -z + 0.2);
    this.signalHaloGreen.position.set(x, 3.82, -z + 0.2);
    this.group.add(red, green);
  }

  private buildCarDoor(): void {
    // Invisible hit panel over Car 07's doorway (the car itself belongs to MercerWorld).
    const door = this.aimable(
      "carDoor",
      new THREE.PlaneGeometry(1.4, 2.1),
      this.mat({ transparent: true, opacity: 0, depthWrite: false }),
    );
    door.position.set(0, 1.1, -11.05);
    this.group.add(door);
  }
}

/** Corrugated wagon side: vertical ribs, grime toward the bottom, rust streaks. */
function drawRibs(ctx: CanvasRenderingContext2D): void {
  const w = 64;
  const h = 128;
  for (let x = 0; x < w; x += 16) {
    const rib = ctx.createLinearGradient(x, 0, x + 16, 0);
    rib.addColorStop(0, "#a8a8a8");
    rib.addColorStop(0.5, "#f0f0f0");
    rib.addColorStop(1, "#9a9a9a");
    ctx.fillStyle = rib;
    ctx.fillRect(x, 0, 16, h);
  }
  const grime = ctx.createLinearGradient(0, 0, 0, h);
  grime.addColorStop(0, "rgba(40,30,20,0)");
  grime.addColorStop(1, "rgba(40,30,20,0.55)");
  ctx.fillStyle = grime;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(110,55,25,${0.15 + Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * w, Math.random() * h * 0.4, 1 + Math.random() * 2, h * (0.3 + Math.random() * 0.5));
  }
}
