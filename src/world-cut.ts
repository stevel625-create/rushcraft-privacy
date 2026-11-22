import * as THREE from "three";
import type { Pt } from "./geom.ts";
import type { Arena } from "./hunter.ts";
import { StageWorld, speckle } from "./stage-kit.ts";
import { CUT_BIT, cutTraction } from "./story-cut.ts";

/**
 * Gallows Cut. Game coordinates (x, z); world z = -game z.
 *
 *   z 68–70  ▓▓▓▓ rubble wall ▓▓▓▓        breaker B (right wall, z 66)
 *   z 58     refuge (right)
 *   z 52     rubble pile
 *   z 48     refuge (left)
 *   z 38     breaker A (left wall)
 *   z 33     refuge (right)
 *   z 27     abandoned trolley
 *   z 24     refuge (left)
 *   z 14.5   stores cage (right)        tunnel: x −4.2 … 4.2, vaulted roof
 *   z 13.5  ══ portal headwall ══ traction switch (x −6)
 *   z 11.3–13.5  apron in the cutting
 *   z 11  ── Car 07 door ──
 */

const HALF = 4.2;
const PORTAL = 13.5;
const END = 70;
const WALL_H = 3.2;
const AMBER = 0xffb060;
const COLD = 0xbfdcff;

type Refuge = [string, number, 1 | -1];
const REFUGES: Refuge[] = [
  ["refuge1", 24, -1],
  ["refuge2", 33, 1],
  ["refuge3", 48, -1],
  ["refuge4", 58, 1],
];

export class CutWorld extends StageWorld {
  readonly spawn: Pt = { x: 0, z: 12.4 };
  readonly boarded: Pt = { x: 0, z: 8.5 };
  readonly arena: Arena;

  private cageDoor!: THREE.Object3D;
  private readonly breakers = new Map<"breakerA" | "breakerB", THREE.Object3D>();
  private switchArm!: THREE.Object3D;
  private portalLamp!: THREE.PointLight;
  private portalLampMat!: THREE.MeshStandardMaterial;
  private readonly tunnelLights: { light: THREE.PointLight; mat: THREE.MeshStandardMaterial; halo: THREE.Sprite }[] = [];
  private readonly deadLamps: { halo: THREE.Sprite; phase: number }[] = [];
  private tunnelPower = 0.15;

  constructor(scene: THREE.Scene) {
    super(scene, "gallows-cut");
    this.buildCutting();
    this.buildTunnel();
    this.buildRefuges();
    this.buildCover();
    this.buildStores();
    this.buildBreakers();
    this.buildTractionSwitch();
    this.buildLights();
    this.buildCarDoor();

    Object.assign(this.noise, {
      breakerA: { x: -3.4, z: 38 },
      breakerB: { x: 3.4, z: 66 },
    });
    this.arena = {
      minX: -10,
      maxX: 10,
      minZ: 11.3,
      maxZ: END,
      solids: this.solids,
      patrol: [
        { x: 0, z: 66 },
        { x: 0, z: 50 },
        { x: 0, z: 36 },
        { x: 0, z: 21 },
        { x: -6, z: 12.4 },
        { x: 6, z: 12.4 },
        { x: 0, z: 44 },
      ],
      start: { x: 0, z: 64 },
    };
  }

  sync(bits: number): void {
    const has = (b: number) => (bits & b) !== 0;
    this.cageDoor.rotation.y = has(CUT_BIT.lamp) ? -1.3 : 0;
    this.breakers.get("breakerA")!.rotation.x = has(CUT_BIT.breakerA) ? -0.8 : 0.8;
    this.breakers.get("breakerB")!.rotation.x = has(CUT_BIT.breakerB) ? -0.8 : 0.8;
    // Each breaker brings back part of the tunnel's emergency lighting.
    this.tunnelPower = 0.15 + (has(CUT_BIT.breakerA) ? 0.45 : 0) + (has(CUT_BIT.breakerB) ? 0.4 : 0);
    const traction = cutTraction(bits);
    this.switchArm.rotation.z = traction ? -0.9 : 0.9;
    this.portalLamp.intensity = traction ? 6 : 0;
    this.portalLampMat.emissiveIntensity = traction ? 2.4 : 0.05;
  }

  tick(time: number, danger: number): void {
    this.tunnelLights.forEach((t, i) => {
      const flicker = Math.random() < 0.01 + 0.06 * danger * danger ? 0.1 : 0.92 + 0.08 * Math.sin(time * 4 + i * 1.7);
      const k = this.tunnelPower * flicker;
      t.light.intensity = 4 * k;
      t.mat.emissiveIntensity = 2.2 * k;
      t.halo.material.opacity = 0.55 * k;
    });
    // Broken fittings stutter on and off at random.
    for (const d of this.deadLamps) {
      const on = Math.sin(time * 0.7 + d.phase) > 0.85 && Math.random() < 0.6;
      d.halo.material.opacity = on ? 0.35 * this.tunnelPower : 0;
    }
  }

  // ---------------------------------------------------------------- builders

  private stone(repeatX: number, repeatY: number): THREE.MeshStandardMaterial {
    const tex = this.texture(128, 128, drawBlocks);
    tex.repeat.set(repeatX, repeatY);
    return this.mat({ color: 0x8a7e72, map: tex, roughness: 0.95 });
  }

  private buildCutting(): void {
    const ground = this.texture(128, 128, (ctx) => speckle(ctx, 128, "#4e4a44", 1500, 45, 120));
    ground.repeat.set(8, 24);
    const floor = new THREE.Mesh(
      this.geo(new THREE.PlaneGeometry(20, END - 10)),
      this.mat({ color: 0x7a7468, map: ground, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -(10 + END) / 2);
    this.group.add(floor);

    // Retaining walls of the cutting either side of the apron.
    const wall = this.stone(2, 3);
    this.block(wall, -10.3, 12.4, 0.6, 7, 3, 3.5);
    this.block(wall, 10.3, 12.4, 0.6, 7, 3, 3.5);
    // Portal headwall with a lintel over the tunnel mouth.
    const head = this.stone(4, 3);
    this.block(head, -7.1, PORTAL + 0.3, 5.8, 8, 0.6, 4, false);
    this.block(head, 7.1, PORTAL + 0.3, 5.8, 8, 0.6, 4, false);
    this.block(head, 0, PORTAL + 0.3, HALF * 2, 2.4, 0.6, 6.8, false);
    // Solid rock either side of the tunnel and the rubble at its end.
    this.solids.push(
      { minX: -10.6, maxX: -HALF, minZ: PORTAL, maxZ: END + 1 },
      { minX: HALF, maxX: 10.6, minZ: PORTAL, maxZ: END + 1 },
    );
  }

  private buildTunnel(): void {
    const len = END - PORTAL;
    const mid = (PORTAL + END) / 2;
    const wall = this.stone(len / 3, 1);
    // Wall visuals (the rock masses above are what's solid).
    this.block(wall, -HALF - 0.2, mid, 0.4, WALL_H, len, WALL_H / 2, false);
    this.block(wall, HALF + 0.2, mid, 0.4, WALL_H, len, WALL_H / 2, false);
    // Vaulted roof: half a cylinder seen from inside.
    const vaultTex = this.texture(128, 128, drawBlocks);
    vaultTex.repeat.set(6, len / 3);
    const vault = new THREE.Mesh(
      this.geo(new THREE.CylinderGeometry(HALF, HALF, len, 20, 1, true, -Math.PI / 2, Math.PI)),
      this.mat({ color: 0x5e554c, map: vaultTex, roughness: 1, side: THREE.BackSide }),
    );
    // −90° maps the half-cylinder's +z side to +y, so it arches overhead.
    vault.rotation.x = -Math.PI / 2;
    vault.position.set(0, WALL_H, -mid);
    this.group.add(vault);
    // Rails continue into the dark.
    const steel = this.mat({ color: 0x6a645c, metalness: 0.8, roughness: 0.4 });
    for (const x of [-0.72, 0.72]) this.block(steel, x, (11 + END) / 2, 0.07, 0.14, END - 11, 0.07, false);
    // Rubble wall where the tunnel fell in.
    const rubble = this.mat({ color: 0x4a443c, roughness: 1 });
    const rocks: [number, number, number, number][] = [
      [-2.6, 69.2, 2.2, 1.8], [0.4, 69.6, 3, 2.6], [2.8, 69, 1.8, 1.4], [-0.8, 68.6, 1.6, 1],
      [1.6, 68.4, 1.2, 0.8], [-3.2, 68.8, 1.2, 2.4], [0, 70.2, 8.4, 4.2],
    ];
    rocks.forEach(([x, z, s, h], i) => {
      const rock = this.block(rubble, x, z, s, h, s * 0.9, h / 2, false);
      rock.rotation.set(i * 0.37, i * 0.81, i * 0.23);
    });
    this.solids.push({ minX: -HALF, maxX: HALF, minZ: 68.2, maxZ: END + 1 });
  }

  private buildRefuges(): void {
    const dark = this.mat({ color: 0x030303, roughness: 1 });
    const edge = this.mat({ color: 0xd8d0c0, roughness: 0.9 }); // whitewashed surround, easy to spot
    for (const [id, z, side] of REFUGES) {
      const x = side * (HALF + 0.005);
      const recess = new THREE.Mesh(this.geo(new THREE.PlaneGeometry(1.2, 2.2)), dark);
      recess.position.set(x - side * 0.01, 1.1, -z);
      recess.rotation.y = -side * (Math.PI / 2);
      this.group.add(recess);
      for (const dz of [-0.66, 0.66]) this.block(edge, x - side * 0.02, z + dz, 0.04, 2.3, 0.12, 1.15, false);
      this.block(edge, x - side * 0.02, z, 0.04, 0.12, 1.44, 2.3, false);
      // Hit target over the recess.
      const hit = this.aimable(id, new THREE.PlaneGeometry(1.1, 2), this.mat({ transparent: true, opacity: 0, depthWrite: false }));
      hit.position.set(x - side * 0.03, 1.1, -z);
      hit.rotation.y = -side * (Math.PI / 2);
      this.group.add(hit);
      this.hideSpots[id] = {
        at: { x: side * (HALF + 0.45), z },
        out: { x: side * (HALF - 0.7), z },
        yaw: side < 0 ? 90 : -90,
      };
    }
  }

  private buildCover(): void {
    const iron = this.mat({ color: 0x3a3430, metalness: 0.5, roughness: 0.7 });
    this.block(iron, 1.4, 27, 1.2, 0.9, 2, 0.6); // trolley
    this.block(this.mat({ color: 0x4a443c, roughness: 1 }), -2.2, 52, 1.6, 0.8, 2.2, 0.4); // fallen spoil
    const ring = this.block(this.stone(1, 1), 2.4, 60, 1.4, 1.2, 1, 0.6); // dropped arch stones
    ring.rotation.y = 0.4;
  }

  private buildStores(): void {
    const x = 3.4;
    const z = 15.2;
    const frame = this.mat({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.5 });
    const mesh = this.mat({ color: 0x5a5a5a, metalness: 0.6, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    this.block(mesh, x, z, 1.4, 2, 1.6, 1);
    this.block(frame, x, z, 1.5, 0.08, 1.7, 2.04, false);
    const hinge = new THREE.Object3D();
    hinge.position.set(x - 0.72, 1, -(z - 0.8));
    const door = this.aimable("lampCage", new THREE.BoxGeometry(0.03, 1.9, 1.5), mesh);
    door.position.z = -0.75;
    hinge.add(door);
    hinge.rotation.order = "YXZ";
    this.cageDoor = hinge;
    // The lamp on a shelf inside, with a faint glow so it's findable in the dark.
    const lamp = new THREE.Mesh(this.geo(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 12)), this.mat({ color: 0x8a2a1a, metalness: 0.4 }));
    lamp.position.set(x, 1.1, -z);
    this.halo(0xfff0c0, 0.5, 0.35).position.set(x - 0.1, 1.15, -z);
    this.group.add(hinge, lamp);
  }

  private buildBreakers(): void {
    const box = this.mat({ color: 0x4a5a3a, metalness: 0.4, roughness: 0.6 });
    const handle = this.mat({ color: 0xd0b020, roughness: 0.5 });
    const spots = [
      ["breakerA", -HALF + 0.15, 38, 1],
      ["breakerB", HALF - 0.15, 66, -1],
    ] as const;
    for (const [id, x, z, face] of spots) {
      this.block(box, x, z, 0.3, 0.9, 0.7, 1.4, false);
      const pivot = new THREE.Object3D();
      pivot.position.set(x + face * 0.2, 1.4, -z);
      pivot.rotation.order = "YXZ";
      pivot.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2;
      const arm = this.aimable(id, new THREE.BoxGeometry(0.08, 0.5, 0.08), handle);
      arm.position.y = 0.22;
      pivot.add(arm);
      this.group.add(pivot);
      this.breakers.set(id, pivot);
      // A little warning lamp so the breaker can be found in the dark.
      this.halo(0xff3a1a, 0.35, 0.6).position.set(x + face * 0.18, 1.95, -z);
    }
  }

  private buildTractionSwitch(): void {
    const x = -6;
    const z = PORTAL - 0.02;
    this.block(this.mat({ color: 0x3a3a3a, metalness: 0.5 }), x, z, 0.8, 1, 0.25, 1.4, false);
    const pivot = new THREE.Object3D();
    pivot.position.set(x, 1.4, -(z - 0.15));
    const arm = this.aimable("tractionSwitch", new THREE.BoxGeometry(0.5, 0.09, 0.09), this.mat({ color: 0xc23a1e, roughness: 0.5 }));
    arm.position.x = 0.2;
    pivot.add(arm);
    this.switchArm = pivot;
    this.group.add(pivot);
    // Portal floodlight: dead until traction is back.
    this.portalLampMat = this.mat({ color: 0x111111, emissive: COLD, emissiveIntensity: 0.05 });
    this.block(this.portalLampMat, 0, PORTAL - 0.05, 0.9, 0.25, 0.3, 5.2, false);
    this.portalLamp = new THREE.PointLight(COLD, 0, 16, 1.6);
    this.portalLamp.position.set(0, 5, -(PORTAL - 0.6));
    this.group.add(this.portalLamp);
    this.glow.push(this.portalLamp);
  }

  private buildLights(): void {
    // Two real lights inside; everything else is glow only.
    for (const [z, side] of [[21, 1], [44, -1]] as const) {
      const x = side * (HALF - 0.12);
      const mat = this.mat({ color: 0x1a1008, emissive: AMBER, emissiveIntensity: 0.3 });
      this.block(mat, x, z, 0.12, 0.25, 0.4, 2.6, false);
      const light = new THREE.PointLight(AMBER, 0.6, 13, 1.8);
      light.position.set(x - side * 0.3, 2.5, -z);
      const halo = this.halo(AMBER, 1.2, 0.1);
      halo.position.set(x - side * 0.15, 2.6, -z);
      this.group.add(light);
      this.glow.push(light);
      this.tunnelLights.push({ light, mat, halo });
    }
    for (let z = 28, i = 0; z < 68; z += 8, i++) {
      const side = i % 2 ? 1 : -1;
      const halo = this.halo(AMBER, 0.9, 0);
      halo.position.set(side * (HALF - 0.2), 2.6, -z);
      this.deadLamps.push({ halo, phase: i * 2.3 });
    }
  }

  private buildCarDoor(): void {
    const door = this.aimable("carDoor", new THREE.PlaneGeometry(1.4, 2.1), this.mat({ transparent: true, opacity: 0, depthWrite: false }));
    door.position.set(0, 1.1, -11.05);
    this.group.add(door);
  }
}

/** Sooty dressed-stone blocks. */
function drawBlocks(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#2a2622";
  ctx.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 32 : 0;
    for (let col = -1; col < 2; col++) {
      const v = 95 + Math.floor(Math.random() * 45);
      ctx.fillStyle = `rgb(${v},${v * 0.92},${v * 0.82})`;
      ctx.fillRect(col * 64 + off + 2, row * 32 + 2, 60, 28);
    }
  }
  const soot = ctx.createLinearGradient(0, 0, 0, 128);
  soot.addColorStop(0, "rgba(8,8,8,0.6)");
  soot.addColorStop(1, "rgba(8,8,8,0.1)");
  ctx.fillStyle = soot;
  ctx.fillRect(0, 0, 128, 128);
}
