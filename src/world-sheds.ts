import * as THREE from "three";
import type { Pt } from "./geom.ts";
import type { Arena } from "./hunter.ts";
import { StageWorld, speckle } from "./stage-kit.ts";
import { SHEDS_BIT, shedsTraverser } from "./story-sheds.ts";

/**
 * Ashby Car Sheds. Game coordinates (x, z); world z = -game z.
 *
 *   z 52  ═══════ back wall ═══ [N isolator x -6] ═══════════
 *   z 45–51  lockers (west)                  [cabin + controls]
 *   z 27–43                    ┃pit┃          [carriage, east road]
 *   z 15–31  [carriage, west road] ┃pit┃
 *   z 14  [S isolator, west wall]            locker (east, z 22)
 *   z 12  ───── traverser plate ─────
 *   z 11  ───── Car 07 door ─────
 */

const STRIP = 0xd6ecff;
const AMBER = 0xffa020;
const HALF_W = 12;
const BACK = 52;
const ROOF = 7;

type Beacon = { spin: THREE.Object3D; halo: THREE.Sprite; on: boolean; until: number };

export class ShedsWorld extends StageWorld {
  readonly spawn: Pt = { x: 0, z: 13.8 };
  readonly boarded: Pt = { x: 0, z: 8.5 };
  readonly arena: Arena;

  private readonly strips: { light: THREE.PointLight; tube: THREE.MeshStandardMaterial; halo: THREE.Sprite }[] = [];
  private readonly isolators = new Map<"north" | "south", THREE.Object3D>();
  private readonly lamps = new Map<"north" | "south", THREE.MeshStandardMaterial>();
  private readonly beacons: Beacon[] = [];
  private foremanDoor!: THREE.Object3D;
  private cabinDoor!: THREE.Object3D;
  private lever!: THREE.Mesh;
  private exitBeacon!: Beacon;
  private lastBits = -1;
  private time = 0;

  constructor(scene: THREE.Scene) {
    super(scene, "ashby-sheds");
    this.buildShell();
    this.buildCarriages();
    this.buildPitAndColumns();
    this.buildLights();
    this.buildLockers();
    this.buildCabin();
    this.buildIsolators();
    this.buildTraverserPlate();
    this.buildCarDoor();

    Object.assign(this.noise, {
      isolatorNorth: { x: -6, z: 50.8 },
      isolatorSouth: { x: -10.8, z: 14 },
      traverserLever: { x: 7.8, z: 47 },
    });
    this.arena = {
      minX: -HALF_W,
      maxX: HALF_W,
      minZ: 11.3,
      maxZ: BACK - 0.3,
      solids: this.solids,
      patrol: [
        { x: -9, z: 49 },
        { x: 6, z: 49 },
        { x: 10, z: 24 },
        { x: -2, z: 44 },
        { x: -10, z: 34 },
        { x: -2, z: 14 },
      ],
      start: { x: 0, z: 49 },
    };
  }

  sync(bits: number): void {
    const has = (b: number) => (bits & b) !== 0;
    const changed = this.lastBits < 0 ? 0 : bits & ~this.lastBits;
    this.foremanDoor.rotation.y = has(SHEDS_BIT.key) ? -1.1 : 0;
    this.cabinDoor.rotation.y = has(SHEDS_BIT.cabin) ? 1.6 : 0;
    this.lever.visible = has(SHEDS_BIT.cabin);
    this.lever.rotation.z = shedsTraverser(bits) ? -0.6 : 0.6;
    for (const [side, bit] of [["north", SHEDS_BIT.north], ["south", SHEDS_BIT.south]] as const) {
      this.isolators.get(side)!.rotation.x = has(bit) ? -0.9 : 0.9;
      this.lamps.get(side)!.emissiveIntensity = has(bit) ? 2.4 : 0;
    }
    // Klaxon beacons spin for a few seconds after an isolator is thrown.
    if (changed & SHEDS_BIT.north) this.beacons[0].until = this.time + 5;
    if (changed & SHEDS_BIT.south) this.beacons[1].until = this.time + 5;
    this.exitBeacon.on = shedsTraverser(bits);
    this.lastBits = bits;
  }

  tick(time: number, danger: number): void {
    this.time = time;
    // Strip lights: a steady tick with dropouts, much worse when it's close.
    this.strips.forEach((s, i) => {
      const drop = Math.random() < 0.006 + 0.05 * danger * danger;
      const buzz = 0.94 + 0.06 * Math.sin(time * 50 + i);
      const k = drop ? 0.08 : buzz;
      s.light.intensity = 7 * k;
      s.tube.emissiveIntensity = 2.2 * k;
      s.halo.material.opacity = 0.4 * k;
    });
    for (const b of this.beacons) {
      const active = b.on || time < b.until;
      b.halo.visible = active;
      if (!active) continue;
      b.spin.rotation.y = time * 6;
      b.halo.material.opacity = 0.35 + 0.35 * Math.max(0, Math.sin(time * 6));
    }
  }

  // ---------------------------------------------------------------- builders

  private buildShell(): void {
    const floorTex = this.texture(256, 256, (ctx) => {
      speckle(ctx, 256, "#5e5e5a", 2200, 60, 120);
      // Oil stains.
      for (let i = 0; i < 9; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 18 + Math.random() * 30);
        g.addColorStop(0, "rgba(15,12,10,0.55)");
        g.addColorStop(1, "rgba(15,12,10,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
      }
    });
    floorTex.repeat.set(6, 10);
    const floor = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2, BACK - 10)),
      this.mat({ color: 0x9a9890, map: floorTex, roughness: 0.92 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -(10 + BACK) / 2);

    const brick = this.texture(128, 128, drawBrick);
    brick.repeat.set(10, 2);
    const wall = this.mat({ color: 0x8a7266, map: brick, roughness: 0.95 });
    this.block(wall, -HALF_W - 0.25, 31, 0.5, ROOF, BACK - 10);
    this.block(wall, HALF_W + 0.25, 31, 0.5, ROOF, BACK - 10);
    this.block(wall, 0, BACK + 0.25, HALF_W * 2 + 1, ROOF, 0.5);

    const roof = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(HALF_W * 2 + 1, BACK - 10)),
      this.mat({ color: 0x15171a, roughness: 1, side: THREE.DoubleSide }),
    );
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, ROOF, -(10 + BACK) / 2);

    // Roof trusses: one instanced mesh.
    const truss = new THREE.InstancedMesh(
      this.geo(new THREE.BoxGeometry(HALF_W * 2, 0.35, 0.25)),
      this.mat({ color: 0x2a2c2e, metalness: 0.6, roughness: 0.6 }),
      11,
    );
    const m = new THREE.Matrix4();
    for (let i = 0; i < 11; i++) truss.setMatrixAt(i, m.makeTranslation(0, ROOF - 0.4, -(12 + i * 4)));
    this.group.add(floor, roof, truss);
  }

  private buildCarriages(): void {
    const side = this.texture(256, 64, drawCarriage);
    const carriages = [
      { x: -7, z: 23, len: 16, color: 0x3e4a52 },
      { x: 7, z: 35, len: 16, color: 0x56443a },
    ];
    for (const c of carriages) {
      const map = this.own(side.clone());
      map.repeat.set(c.len / 8, 1);
      map.needsUpdate = true;
      // Carriages run along z, so the long sides face ±x.
      this.block(this.mat({ color: c.color, map, roughness: 0.7, metalness: 0.3 }), c.x, c.z, 2.8, 3.4, c.len, 2.1);
      this.block(this.mat({ color: 0x1a1a1a, roughness: 0.8 }), c.x, c.z, 2.2, 0.5, c.len - 1, 0.25, false);
    }
  }

  private buildPitAndColumns(): void {
    // Inspection pit: a black slot edged in hazard yellow. Too deep to cross.
    this.block(this.mat({ color: 0x050505, roughness: 1 }), 0, 30, 1.4, 0.02, 20, 0.01);
    const hazard = this.mat({ color: 0xc9a227, roughness: 0.7 });
    for (const dx of [-0.8, 0.8]) this.block(hazard, dx, 30, 0.16, 0.03, 20, 0.015, false);
    const steel = this.mat({ color: 0x3a3e42, metalness: 0.7, roughness: 0.5 });
    for (const x of [-3.6, 3.6]) {
      for (const z of [18, 26, 34, 42]) this.block(steel, x, z, 0.4, ROOF, 0.4);
    }
  }

  private buildLights(): void {
    for (const z of [18, 32, 46]) {
      const tube = this.mat({ color: 0x222628, emissive: STRIP, emissiveIntensity: 2.2 });
      this.block(tube, 0, z, 0.18, 0.08, 3.2, ROOF - 0.7, false);
      const light = new THREE.PointLight(STRIP, 7, 18, 1.6);
      light.position.set(0, ROOF - 0.9, -z);
      const halo = this.halo(STRIP, 2.2, 0.4);
      halo.position.set(0, ROOF - 0.75, -z);
      this.pool(STRIP, 0, z, 10, 0.12);
      this.group.add(light);
      this.glow.push(light);
      this.strips.push({ light, tube, halo });
    }
  }

  private buildLockers(): void {
    const body = this.mat({ color: 0x4a5a52, metalness: 0.5, roughness: 0.6 });
    const door = this.mat({ color: 0x5a6c62, metalness: 0.5, roughness: 0.55 });
    const vent = this.mat({ color: 0x111111, roughness: 1 });
    /** x, z, facing yaw (deg), target or null for decoration. */
    const lockers: [number, number, number, string | null][] = [
      [-11.7, 44.2, 90, "hideA"],
      [-11.7, 44.9, 90, null],
      [-11.7, 45.6, 90, "foremanLocker"],
      [-11.7, 46.3, 90, null],
      [11.7, 22, -90, "hideB"],
      [-3.5, BACK - 0.3, 180, "hideC"],
    ];
    for (const [x, z, yaw, target] of lockers) {
      const rad = THREE.MathUtils.degToRad(yaw);
      // Facing direction in game coords (yaw 0 = +z, 90 = +x).
      const fx = Math.sin(rad);
      const fz = Math.cos(rad);
      const along = Math.abs(fx) > 0.5;
      this.block(body, x, z, along ? 0.5 : 0.62, 2, along ? 0.62 : 0.5, 1);
      const pivot = new THREE.Object3D();
      pivot.position.set(x + fx * 0.26, 1, -(z + fz * 0.26));
      pivot.rotation.y = -rad + Math.PI; // door plane faces outward
      const panel = target
        ? this.aimable(target, new THREE.BoxGeometry(0.58, 1.9, 0.03), door)
        : new THREE.Mesh(this.geo(new THREE.BoxGeometry(0.58, 1.9, 0.03)), door);
      panel.position.x = 0.29; // hinge on one edge
      const slats = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(0.36, 0.2)), vent);
      slats.position.set(0, 0.6, -0.02);
      slats.rotation.y = Math.PI;
      panel.add(slats);
      const hinge = new THREE.Object3D();
      hinge.position.x = -0.29;
      hinge.add(panel);
      pivot.add(hinge);
      this.group.add(pivot);
      if (target === "foremanLocker") this.foremanDoor = hinge;
      if (target?.startsWith("hide")) {
        this.hideSpots[target] = {
          at: { x: x - fx * 0.02, z: z - fz * 0.02 },
          out: { x: x + fx * 0.75, z: z + fz * 0.75 },
          yaw,
        };
      }
    }
  }

  private buildCabin(): void {
    const x = 10.25;
    const z = 48;
    this.block(this.mat({ color: 0x3d4a3f, roughness: 0.85 }), x, z, 3.5, 3, 5.5);
    this.block(this.mat({ color: 0x1e2220, roughness: 0.8 }), x, z, 3.8, 0.15, 5.8, 3.05, false);
    const front = x - 1.75;
    // Door on the front face, hinged at its south edge.
    const hinge = new THREE.Object3D();
    hinge.position.set(front - 0.02, 1.05, -(z - 1.6));
    const door = this.aimable("cabinDoor", new THREE.BoxGeometry(0.04, 2.1, 0.95), this.mat({ color: 0x6a5434, roughness: 0.7 }));
    door.position.z = -0.475;
    hinge.add(door);
    this.cabinDoor = hinge;
    // Controls sit in the doorway recess, revealed when the door opens.
    this.lever = this.aimable("traverserLever", new THREE.BoxGeometry(0.08, 0.7, 0.08), this.mat({ color: 0xc23a1e, roughness: 0.5 }));
    this.lever.position.set(front + 0.05, 1.1, -(z - 2.05));
    this.lever.visible = false;
    // Panel lamps over the door show which isolators are closed.
    for (const [side, dz] of [["north", 0.25], ["south", -0.25]] as const) {
      const lampMat = this.mat({ color: 0x1a1208, emissive: 0x7dff6a, emissiveIntensity: 0 });
      const lamp = new THREE.Mesh(this.geo(new THREE.SphereGeometry(0.07, 10, 8)), lampMat);
      lamp.position.set(front - 0.05, 2.45, -(z - 2.05 + dz));
      this.group.add(lamp);
      this.lamps.set(side, lampMat);
    }
    this.group.add(hinge, this.lever);
  }

  private buildIsolators(): void {
    const box = this.mat({ color: 0x5a5a3a, metalness: 0.4, roughness: 0.6 });
    const handle = this.mat({ color: 0xd0b020, roughness: 0.5 });
    const spots = [
      ["north", "isolatorNorth", -6, BACK - 0.15, 180],
      ["south", "isolatorSouth", -HALF_W + 0.15, 14, 90],
    ] as const;
    for (const [side, target, x, z, yaw] of spots) {
      const rad = THREE.MathUtils.degToRad(yaw);
      const fx = Math.sin(rad);
      const fz = Math.cos(rad);
      const housing = this.block(box, x, z, 0.6, 0.8, 0.3, 1.4, false);
      housing.rotation.y = -rad;
      const pivot = new THREE.Object3D();
      pivot.position.set(x + fx * 0.2, 1.4, -(z + fz * 0.2));
      pivot.rotation.order = "YXZ";
      pivot.rotation.y = -rad;
      const arm = this.aimable(target, new THREE.BoxGeometry(0.08, 0.55, 0.08), handle);
      arm.position.y = 0.25;
      pivot.add(arm);
      this.group.add(pivot);
      this.isolators.set(side, pivot);
      this.beacons.push(this.beacon(x + fx * 0.2, z + fz * 0.2, 2.3));
    }
  }

  private buildTraverserPlate(): void {
    const plate = this.mat({ color: 0x3c3f42, metalness: 0.75, roughness: 0.4 });
    this.block(plate, 0, 12.4, HALF_W * 2, 0.04, 1.6, 0.02, false);
    const rail = this.mat({ color: 0x77736c, metalness: 0.8, roughness: 0.35 });
    for (const dz of [-0.55, 0.55]) this.block(rail, 0, 12.4 + dz, HALF_W * 2, 0.06, 0.08, 0.05, false);
    this.exitBeacon = this.beacon(1.2, 11.4, 2.6);
  }

  private buildCarDoor(): void {
    const door = this.aimable("carDoor", new THREE.PlaneGeometry(1.4, 2.1), this.mat({ transparent: true, opacity: 0, depthWrite: false }));
    door.position.set(0, 1.1, -11.05);
    this.group.add(door);
  }

  /** Rotating amber beacon. No real light: an emissive cap plus a pulsing halo. */
  private beacon(x: number, z: number, y: number): Beacon {
    const spin = new THREE.Object3D();
    spin.position.set(x, y, -z);
    const cap = new THREE.Mesh(
      this.geo(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 12)),
      this.mat({ color: 0x3a2400, emissive: AMBER, emissiveIntensity: 1.5 }),
    );
    const vane = new THREE.Mesh(this.geo(new THREE.BoxGeometry(0.02, 0.12, 0.18)), this.mat({ color: 0x111111 }));
    vane.position.x = 0.06;
    spin.add(cap, vane);
    const halo = this.halo(AMBER, 1.6, 0.5);
    halo.position.set(x, y, -z);
    halo.visible = false;
    this.group.add(spin);
    return { spin, halo, on: false, until: 0 };
  }
}

function drawBrick(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#3a302a";
  ctx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 8; row++) {
    const off = row % 2 ? 16 : 0;
    for (let col = -1; col < 4; col++) {
      const shade = 110 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${shade},${shade * 0.72},${shade * 0.6})`;
      ctx.fillRect(col * 32 + off + 1, row * 16 + 1, 30, 14);
    }
  }
  const soot = ctx.createLinearGradient(0, 0, 0, 128);
  soot.addColorStop(0, "rgba(10,10,10,0.5)");
  soot.addColorStop(1, "rgba(10,10,10,0)");
  ctx.fillStyle = soot;
  ctx.fillRect(0, 0, 128, 128);
}

/** Carriage side: paneling with a dark window band. */
function drawCarriage(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#d0d0d0";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = "#0c0e10";
  for (let i = 0; i < 4; i++) ctx.fillRect(10 + i * 62, 14, 46, 18);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 4; i++) ctx.fillRect(12 + i * 62, 16, 12, 14);
  ctx.fillStyle = "#9a9a9a";
  ctx.fillRect(0, 40, 256, 2);
  ctx.fillRect(0, 60, 256, 4);
}
