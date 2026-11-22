import * as THREE from 'three';
import { surfaceMaps } from './textures';

/**
 * Procedurally built, procedurally animated human figure (no model files, so it runs in Expo Go).
 * Root sits at the feet, facing +Z, 1.8 m tall with realistic adult proportions.
 * Joints are plain Object3Ds; update() drives idle, walk, run and airborne poses from movement.
 */

export interface Outfit {
  skin: number;
  shirt: number;
  pants: number;
  boots: number;
  hair: number;
  /** Fedora colour; omit for no hat. */
  hat?: number;
  /** Backpack (Jason) or hip satchel (Elena). */
  pack: number;
  packStyle: 'backpack' | 'satchel';
  ponytail?: boolean;
  /** Forearms bare (rolled sleeves / short sleeves). */
  bareForearms?: boolean;
  build: number; // 1 = average, <1 slimmer
}

const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 6, 14);

function mat(color: number, kind: 'cloth' | 'skin' | 'leather' | 'hair' = 'cloth') {
  const maps = surfaceMaps(kind === 'skin' ? 'skin' : kind === 'leather' ? 'wood' : 'cloth');
  return new THREE.MeshStandardMaterial({
    color,
    map: kind === 'hair' ? null : maps.map,
    roughness: kind === 'skin' ? 0.55 : kind === 'hair' ? 0.5 : kind === 'leather' ? 0.6 : 0.85,
  });
}

/** Mesh hanging down from its parent joint: top at the joint, extending -Y. */
function limb(geo: THREE.BufferGeometry, material: THREE.Material, length: number) {
  geo.translate(0, -length / 2, 0);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  return m;
}

function part(geo: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

/** Add a part with its own rotation (note: Object3D.add returns the parent, so set rotation first). */
function rotated(parent: THREE.Object3D, mesh: THREE.Mesh, axis: 'x' | 'y' | 'z', angle: number) {
  mesh.rotation[axis] = angle;
  parent.add(mesh);
}

const joint = (parent: THREE.Object3D, x: number, y: number, z: number) => {
  const j = new THREE.Object3D();
  j.position.set(x, y, z);
  parent.add(j);
  return j;
};

export class Humanoid {
  readonly group = new THREE.Group();
  private readonly hips: THREE.Object3D;
  private readonly spine: THREE.Object3D;
  private readonly neck: THREE.Object3D;
  private readonly arm: [THREE.Object3D, THREE.Object3D];
  private readonly elbow: [THREE.Object3D, THREE.Object3D];
  private readonly thigh: [THREE.Object3D, THREE.Object3D];
  private readonly knee: [THREE.Object3D, THREE.Object3D];
  private readonly ankle: [THREE.Object3D, THREE.Object3D];
  private readonly tail: THREE.Object3D | null = null;
  private phase = 0;
  private air = 0;
  private move = 0;
  private time = Math.random() * 10;
  private readonly hipY = 0.98;

  constructor(o: Outfit) {
    const b = o.build;
    const skin = mat(o.skin, 'skin'), shirt = mat(o.shirt), pants = mat(o.pants), boots = mat(o.boots, 'leather');
    const hair = mat(o.hair, 'hair'), leather = mat(o.pack, 'leather');
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b1410, roughness: 0.4 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.3 });
    const lips = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.skin).multiplyScalar(0.72), roughness: 0.5 });

    // Hips and pelvis.
    this.hips = joint(this.group, 0, this.hipY, 0);
    this.hips.add(part(capsule(0.15 * b, 0.12), pants, 0, -0.02, 0, 1.12, 0.9, 0.78));
    this.hips.add(part(new THREE.CylinderGeometry(0.168 * b, 0.168 * b, 0.05, 20), leather, 0, 0.07, 0, 1.08, 1, 0.8)); // belt

    // Torso.
    this.spine = joint(this.hips, 0, 0.08, 0);
    const chest = joint(this.spine, 0, 0.22, 0);
    this.spine.add(part(capsule(0.15 * b, 0.16), shirt, 0, 0.1, 0, 1.1, 1, 0.75)); // waist
    chest.add(part(capsule(0.175 * b, 0.16), shirt, 0, 0.05, 0, 1.18, 1, 0.78)); // ribcage
    chest.add(part(new THREE.SphereGeometry(0.07, 12, 8), shirt, 0, 0.17, 0.02, 2.9, 0.7, 1.5)); // shoulders line

    // Neck and head.
    this.neck = joint(chest, 0, 0.25, 0.005);
    this.neck.add(part(new THREE.CylinderGeometry(0.048, 0.055, 0.11, 12), skin, 0, 0.03, 0));
    const head = joint(this.neck, 0, 0.13, 0.01);
    head.add(part(new THREE.SphereGeometry(0.105, 24, 18), skin, 0, 0, 0, 0.92, 1.12, 1.0)); // skull/face
    head.add(part(new THREE.SphereGeometry(0.06, 16, 10), skin, 0, -0.07, 0.035, 1.25, 0.8, 1.05)); // jaw
    rotated(head, part(new THREE.ConeGeometry(0.018, 0.045, 8), skin, 0, -0.01, 0.105, 1, 1, 1), 'x', Math.PI / 2); // nose
    for (const s of [-1, 1]) {
      head.add(part(new THREE.SphereGeometry(0.022, 10, 8), skin, s * 0.097, -0.005, -0.005, 0.5, 1.1, 0.8)); // ears
      head.add(part(new THREE.SphereGeometry(0.017, 12, 8), white, s * 0.036, 0.018, 0.088, 1, 0.8, 0.6)); // eye
      head.add(part(new THREE.SphereGeometry(0.0095, 10, 8), dark, s * 0.036, 0.018, 0.098, 1, 1, 0.5)); // iris
      rotated(head, part(new THREE.BoxGeometry(0.036, 0.007, 0.01), hair, s * 0.037, 0.043, 0.095), 'z', s * -0.12); // brow
    }
    head.add(part(new THREE.BoxGeometry(0.04, 0.008, 0.01), lips, 0, -0.058, 0.093)); // mouth

    // Hair (cap over the back/top of the skull), optional ponytail and hat.
    // Hair cap: tilted back so the hairline sits above the forehead and leaves the face clear.
    rotated(head, part(new THREE.SphereGeometry(0.113, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 0.02, -0.018, 0.97, 1.1, 1.06), 'x', -0.55);
    if (o.ponytail) {
      const tieJoint = joint(head, 0, 0.03, -0.1);
      tieJoint.add(limb(capsule(0.032, 0.18), hair, 0.22));
      this.tail = tieJoint;
    }
    if (o.hat !== undefined) {
      const hatMat = mat(o.hat, 'leather');
      head.add(part(new THREE.CylinderGeometry(0.2, 0.2, 0.014, 28), hatMat, 0, 0.075, 0.0)); // brim
      head.add(part(new THREE.CylinderGeometry(0.09, 0.11, 0.11, 22), hatMat, 0, 0.13, 0, 1, 1, 1.15)); // crown
      head.add(part(new THREE.CylinderGeometry(0.112, 0.112, 0.025, 22), dark, 0, 0.09, 0, 1, 1, 1.15)); // band
    }

    // Arms.
    const sides: [number, number] = [-1, 1];
    const arms = sides.map((s) => {
      const shoulder = joint(chest, s * 0.215 * b, 0.15, 0);
      shoulder.add(limb(capsule(0.058 * b, 0.2), shirt, 0.29));
      const elbow = joint(shoulder, 0, -0.29, 0);
      elbow.add(limb(capsule(0.046 * b, 0.19), o.bareForearms ? skin : shirt, 0.26));
      if (o.bareForearms) elbow.add(part(new THREE.CylinderGeometry(0.062 * b, 0.06 * b, 0.05, 14), shirt, 0, -0.02, 0)); // rolled cuff
      const hand = joint(elbow, 0, -0.27, 0);
      hand.add(part(new THREE.SphereGeometry(0.048, 12, 10), skin, 0, -0.03, 0.005, 0.75, 1.2, 0.95));
      shoulder.rotation.z = s * 0.06; // arms hang slightly away from the body
      return { shoulder, elbow };
    });
    this.arm = [arms[0].shoulder, arms[1].shoulder];
    this.elbow = [arms[0].elbow, arms[1].elbow];

    // Legs.
    const legs = sides.map((s) => {
      const hip = joint(this.hips, s * 0.095 * b, -0.05, 0);
      hip.add(limb(capsule(0.078 * b, 0.3), pants, 0.43));
      const knee = joint(hip, 0, -0.43, 0);
      knee.add(limb(capsule(0.06 * b, 0.3), pants, 0.4));
      knee.add(part(new THREE.CylinderGeometry(0.068, 0.07, 0.12, 14), boots, 0, -0.33, 0)); // boot shaft
      const ankle = joint(knee, 0, -0.42, 0);
      ankle.add(part(new THREE.BoxGeometry(0.11, 0.08, 0.26), boots, 0, -0.04, 0.05));
      return { hip, knee, ankle };
    });
    this.thigh = [legs[0].hip, legs[1].hip];
    this.knee = [legs[0].knee, legs[1].knee];
    this.ankle = [legs[0].ankle, legs[1].ankle];

    // Gear.
    if (o.packStyle === 'backpack') {
      chest.add(part(new THREE.BoxGeometry(0.3, 0.38, 0.16), leather, 0, -0.02, -0.19));
      chest.add(part(new THREE.BoxGeometry(0.26, 0.12, 0.05), leather, 0, -0.17, -0.28)); // front pocket
      rotated(chest, part(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12), mat(0x3d5a3a), 0, 0.2, -0.2), 'z', Math.PI / 2); // bedroll
      for (const s of sides) chest.add(part(new THREE.BoxGeometry(0.04, 0.3, 0.02), leather, s * 0.1, 0.05, 0.135)); // straps
    } else {
      this.hips.add(part(new THREE.BoxGeometry(0.08, 0.2, 0.24), leather, 0.19, -0.05, 0.02)); // satchel at the hip
      const strap = part(new THREE.BoxGeometry(0.035, 0.62, 0.02), leather, 0.02, 0.32, 0.135);
      strap.rotation.z = -0.62;
      this.spine.add(strap);
    }

    this.group.traverse((o3) => { if ((o3 as THREE.Mesh).isMesh) (o3 as THREE.Mesh).receiveShadow = true; });
  }

  /**
   * Animate for this frame.
   * @param speed horizontal speed in m/s (0 idle, ~3.2 walk, ~6.5 run)
   */
  update(dt: number, speed: number, grounded: boolean, vy: number) {
    this.time += dt;
    const k = 1 - Math.exp(-12 * dt);
    this.move += (Math.min(1, speed / 1.2) - this.move) * k;
    this.air += ((grounded ? 0 : 1) - this.air) * (1 - Math.exp(-10 * dt));
    const run = Math.min(1, Math.max(0, (speed - 3.4) / 3));
    const stride = 1.3 + run * 0.9; // metres per full cycle
    if (grounded) this.phase += (speed / stride) * Math.PI * 2 * dt;

    const m = this.move * (1 - this.air);
    const legAmp = 0.42 + run * 0.38, armAmp = 0.35 + run * 0.45;
    const breathe = Math.sin(this.time * 2.2) * 0.012;

    for (let i = 0; i < 2; i++) {
      const ph = this.phase + i * Math.PI;
      const s = Math.sin(ph), c = Math.cos(ph);
      // Legs: thigh swings forward (negative X), knee folds during the swing, foot rolls.
      const thighX = -s * legAmp * m + this.air * (vy > 0 ? -0.75 : -0.35) * (i === 0 ? 1.1 : 0.7);
      const kneeX = (Math.max(0, c) * (0.65 + run * 0.6) + 0.08) * m + this.air * (i === 0 ? 1.15 : 0.6);
      this.thigh[i].rotation.x = thighX;
      this.knee[i].rotation.x = kneeX;
      this.ankle[i].rotation.x = -kneeX * 0.35 + s * 0.15 * m;
      // Arms swing against the legs; elbows bend more when running; arms lift in the air.
      this.arm[i].rotation.x = s * armAmp * m - this.air * 0.9 + (1 - m) * (1 - this.air) * Math.sin(this.time * 1.1 + i) * 0.02;
      this.elbow[i].rotation.x = -(0.18 + run * 0.9) * m - 0.12 - this.air * 0.5;
      this.arm[i].rotation.z = (i === 0 ? -1 : 1) * (0.06 + this.air * 0.35);
    }

    // Body: bob twice per stride, lean into a run, breathe at rest.
    this.hips.position.y = this.hipY - Math.abs(Math.cos(this.phase)) * 0.035 * m + 0.02 * m - this.air * 0.05;
    this.spine.rotation.x = 0.04 + run * 0.18 * m + this.air * 0.1;
    this.spine.rotation.y = Math.sin(this.phase) * 0.08 * m;
    this.spine.scale.set(1, 1 + breathe * (1 - m), 1);
    this.neck.rotation.x = -this.spine.rotation.x * 0.6;
    this.neck.rotation.y = (1 - m) * Math.sin(this.time * 0.35) * 0.25;
    if (this.tail) this.tail.rotation.x = 0.25 + Math.sin(this.phase * 2) * 0.25 * m + this.air * 0.5 + breathe;
  }
}

export const JASON: Outfit = {
  skin: 0xc68e6c, shirt: 0xb8a07a, pants: 0x50533a, boots: 0x3d2b1e, hair: 0x3a2a1e,
  hat: 0x6b4a2e, pack: 0x6a4a2c, packStyle: 'backpack', bareForearms: true, build: 1,
};

export const ELENA: Outfit = {
  skin: 0xb07a58, shirt: 0x3e7a72, pants: 0x9e8660, boots: 0x2f231a, hair: 0x24170f,
  pack: 0x7a5232, packStyle: 'satchel', ponytail: true, bareForearms: true, build: 0.88,
};
