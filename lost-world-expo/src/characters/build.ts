import * as THREE from 'three';
import { surfaceMaps } from '../engine/textures';
import { Mesher, blend, type Bucket, type Ring, type Weights } from './mesher';
import { bonePositions, buildSkeleton, type BoneName, type Joints } from './rig';

/** Appearance and proportions of a built-in character. */
export interface CharacterSpec {
  height: number;
  /** 0 = male proportions, 1 = female proportions. */
  fem: number;
  /** Girth multiplier (1 = average athletic). */
  build: number;
  skin: number;
  lips: number;
  iris: number;
  hair: number;
  hairStyle: 'short' | 'ponytail';
  top: number;
  topStyle: 'shortSleeve' | 'tank';
  pants: number;
  belt: number;
  boots: number;
  pack: number;
  packStyle: 'large' | 'small';
  bedroll?: number;
}

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const darker = (c: number, k: number) => new THREE.Color(c).multiplyScalar(k).getHex();

/** Joint heights for a 1.82 m reference body, scaled to the spec's height. */
function joints(spec: CharacterSpec): Joints {
  const s = spec.height / 1.82, f = spec.fem;
  return {
    hips: 0.98 * s, hipX: (0.095 + 0.008 * f) * s, knee: 0.52 * s, ankle: 0.085 * s,
    waist: 1.1 * s, chest: 1.3 * s, shoulderY: (1.47 - 0.01 * f) * s, shoulderX: (0.205 - 0.025 * f) * s,
    elbow: [(0.245 - 0.02 * f) * s, 1.17 * s], wrist: [(0.275 - 0.025 * f) * s, 0.92 * s],
    neck: 1.53 * s, head: 1.69 * s,
  };
}

/** Sculpt a sphere into a head: skull, jaw, chin, nose, brow ridge, cheekbones, eye sockets. */
function headGeometry(r: number, fem: number) {
  const g = new THREE.SphereGeometry(1, 32, 24);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    x *= 0.86; y *= 1.14; z *= 1.0;
    if (z < 0) z *= 1.06; // fuller back of skull
    if (y < -0.15) {
      // Jaw narrows towards the chin; chin comes forward.
      const k = Math.min(1, (-y - 0.15) / 0.95);
      x *= 1 - (0.38 + 0.08 * fem) * k;
      if (z > 0) z *= 1 - 0.12 * k;
      if (z > 0.3 && y < -0.7) z += 0.06 * (1 - fem * 0.4);
    }
    // Nose: a ridge down the middle of the face.
    const nx = x / 0.14, ny = (y + 0.05) / 0.32;
    if (z > 0.5 && nx * nx + ny * ny < 1) z += 0.2 * (1 - nx * nx) * (1 - ny * ny) * (y < -0.25 ? 1.2 : 1);
    // Brow ridge and cheekbones.
    if (z > 0.55 && y > 0.12 && y < 0.32) z += 0.04 * (1 - fem * 0.5);
    for (const sx of [-0.33, 0.33]) {
      const ex = (x - sx) / 0.18, ey = (y - 0.08) / 0.12;
      if (z > 0.5 && ex * ex + ey * ey < 1) z -= 0.06 * (1 - ex * ex - ey * ey); // eye sockets
      const cx = (x - sx * 1.25) / 0.2, cy = (y + 0.18) / 0.15;
      if (z > 0.3 && cx * cx + cy * cy < 1) { z += 0.035 * (1 - cx * cx - cy * cy); }
    }
    p.setXYZ(i, x * r, y * r, z * r);
  }
  g.computeVertexNormals();
  return g;
}

export function buildCharacter(spec: CharacterSpec) {
  const J = joints(spec);
  const s = spec.height / 1.82, g = spec.build, f = spec.fem;
  const world = bonePositions(J);
  const { bones, skeleton, index } = buildSkeleton(world);
  const m = new Mesher(index);
  const ring = (c: THREE.Vector3, rx: number, rz: number, color: number, w: Weights): Ring => ({ c, rx: rx * s, rz: rz * s, color, w });
  const pantsDark = darker(spec.pants, 0.82);

  // ---------------------------------------------------------------- legs
  for (const [side, sx] of [['Left', 1], ['Right', -1]] as const) {
    const up = `${side}UpLeg` as BoneName, leg = `${side}Leg` as BoneName, foot = `${side}Foot` as BoneName;
    const x = sx * J.hipX, P = spec.pants, B = spec.boots, loose = 1.1;
    const kneeY = J.knee, ank = J.ankle;
    m.loft('gear', [
      ring(V(x, J.hips + 0.02 * s), 0.1 * g * loose, 0.1 * g * loose, P, blend('Hips', up, 0.4)),
      ring(V(x, J.hips - 0.08 * s), 0.096 * g * loose, 0.098 * g * loose, P, [[up, 1]]),
      ring(V(x, J.hips - 0.22 * s, 0.005), (0.086 + 0.004 * f) * g * loose, 0.088 * g * loose, P, [[up, 1]]),
      ring(V(x, J.hips - 0.34 * s, 0.008), 0.074 * g * loose, 0.076 * g * loose, P, [[up, 1]]),
      ring(V(x, kneeY + 0.04 * s, 0.012), 0.064 * g * loose, 0.066 * g * loose, P, blend(up, leg, 0.35)),
      ring(V(x, kneeY - 0.02 * s, 0.012), 0.062 * g * loose, 0.064 * g * loose, P, blend(up, leg, 0.8)),
      ring(V(x, kneeY - 0.12 * s, -0.005), 0.066 * g * loose, 0.07 * g * loose, P, [[leg, 1]]), // calf
      ring(V(x, kneeY - 0.24 * s, -0.004), 0.058 * g * loose, 0.06 * g * loose, P, [[leg, 1]]),
      ring(V(x, ank + 0.18 * s), 0.054 * g * loose, 0.056 * g * loose, P, [[leg, 1]]),
      ring(V(x, ank + 0.18 * s), 0.062 * g, 0.064 * g, B, [[leg, 1]]), // boot cuff (sharp colour edge)
      ring(V(x, ank + 0.15 * s), 0.06 * g, 0.062 * g, B, [[leg, 1]]),
      ring(V(x, ank + 0.04 * s), 0.054 * g, 0.058 * g, B, blend(leg, foot, 0.4)),
      ring(V(x, ank - 0.01 * s), 0.05 * g, 0.056 * g, B, [[foot, 1]]),
    ], 16, [false, true]);
    // Boot foot: heel to toe.
    const fy = 0.045 * s;
    m.loft('gear', [
      ring(V(x, fy + 0.005, -0.075 * s), 0.045 * g, 0.045, B, [[foot, 1]]),
      ring(V(x, fy + 0.01, -0.02 * s), 0.052 * g, 0.05, B, [[foot, 1]]),
      ring(V(x, fy, 0.06 * s), 0.054 * g, 0.042, B, [[foot, 1]]),
      ring(V(x, fy - 0.006, 0.14 * s), 0.05 * g, 0.032, B, [[foot, 1]]),
      ring(V(x, fy - 0.01, 0.19 * s), 0.036 * g, 0.022, darker(B, 0.8), [[foot, 1]]),
    ], 14, [true, true], V(0, 1, 0));
    // Thick sole.
    m.geometry('gear', new THREE.BoxGeometry(0.1 * g * s, 0.025 * s, 0.27 * s), new THREE.Matrix4().makeTranslation(x, 0.012 * s, 0.05 * s), darker(B, 0.45), [[foot, 1]]);
    // Cargo pocket on the outer thigh.
    m.geometry('gear', new THREE.BoxGeometry(0.03 * s, 0.13 * s, 0.11 * s),
      new THREE.Matrix4().makeTranslation(x + sx * 0.093 * g * s, J.hips - 0.27 * s, 0.01), pantsDark, [[up, 1]]);
  }

  // ---------------------------------------------------------------- torso
  const T = spec.top, P = spec.pants, BL = spec.belt;
  const bust = f * 0.02;
  m.loft('gear', [
    ring(V(0, J.hips - 0.06 * s), 0.14 * g, 0.1 * g, P, [['Hips', 1]]),
    ring(V(0, J.hips + 0.02 * s), (0.17 + 0.012 * f) * g, 0.115 * g, P, [['Hips', 1]]),
    ring(V(0, J.hips + 0.07 * s), (0.168 + 0.01 * f) * g, 0.114 * g, P, [['Hips', 1]]),
    ring(V(0, J.hips + 0.07 * s), (0.172 + 0.01 * f) * g, 0.118 * g, BL, [['Hips', 1]]), // belt
    ring(V(0, J.hips + 0.11 * s), (0.168 + 0.006 * f) * g, 0.116 * g, BL, blend('Hips', 'Spine', 0.3)),
    ring(V(0, J.hips + 0.11 * s), (0.162 + 0.004 * f) * g, 0.112 * g, T, blend('Hips', 'Spine', 0.3)), // shirt hem
    ring(V(0, J.waist, 0.005), (0.152 - 0.012 * f) * g, 0.105 * g, T, [['Spine', 1]]),
    ring(V(0, J.waist + 0.09 * s, 0.01), (0.162 - 0.008 * f) * g, 0.112 * g, T, blend('Spine', 'Spine1', 0.6)),
    ring(V(0, J.chest - 0.05 * s, 0.015 + bust), (0.178 - 0.012 * f) * g, (0.12 + bust) * g, T, blend('Spine1', 'Chest', 0.5)),
    ring(V(0, J.chest + 0.06 * s, 0.012 + bust * 0.6), (0.188 - 0.02 * f) * g, (0.124 + bust * 0.4) * g, T, [['Chest', 1]]),
    ring(V(0, J.shoulderY - 0.01 * s, 0.0), (0.18 - 0.02 * f) * g, 0.105 * g, spec.topStyle === 'tank' ? spec.skin : T, [['Chest', 1]]),
    ring(V(0, J.shoulderY + 0.035 * s, -0.005), (0.12 - 0.012 * f) * g, 0.085 * g, spec.topStyle === 'tank' ? spec.skin : T, blend('Chest', 'Neck', 0.2)),
    ring(V(0, J.neck - 0.005, -0.005), 0.062 * (1 - 0.1 * f), 0.058, spec.skin, blend('Chest', 'Neck', 0.7)),
  ], 20, [true, false]);
  // Neck.
  m.loft('skin', [
    ring(V(0, J.neck - 0.01, -0.005), 0.058 * (1 - 0.12 * f), 0.056, spec.skin, blend('Chest', 'Neck', 0.7)),
    ring(V(0, J.neck + 0.05 * s, 0.0), 0.052 * (1 - 0.15 * f), 0.054, spec.skin, [['Neck', 1]]),
    ring(V(0, J.neck + 0.1 * s, 0.01), 0.05 * (1 - 0.15 * f), 0.052, spec.skin, blend('Neck', 'Head', 0.7)),
  ], 14, [false, false]);

  // ---------------------------------------------------------------- head
  const hr = 0.106 * s * (1 - 0.04 * f);
  const headC = V(0, J.head, 0.012);
  const at = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(headC.x + x * hr, headC.y + y * hr, headC.z + z * hr);
  const lipZone = (p: THREE.Vector3) => {
    const lx = (p.x - headC.x) / (0.2 * hr), ly = (p.y - headC.y + 0.5 * hr) / (0.06 * hr);
    return p.z - headC.z > 0.7 * hr && lx * lx + ly * ly < 1 ? spec.lips : spec.skin;
  };
  m.geometry('skin', headGeometry(hr, f), new THREE.Matrix4().makeTranslation(headC.x, headC.y, headC.z), lipZone, [['Head', 1]]);
  for (const sx of [-1, 1]) {
    const eye = new THREE.SphereGeometry(0.15 * hr, 12, 10);
    m.geometry('skin', eye, at(sx * 0.31, 0.08, 0.78), 0xf4f1ea, [['Head', 1]]);
    const iris = new THREE.SphereGeometry(0.085 * hr, 12, 8);
    iris.scale(1, 1, 0.45);
    m.geometry('skin', iris, at(sx * 0.31, 0.08, 0.92), spec.iris, [['Head', 1]]);
    const pupil = new THREE.SphereGeometry(0.04 * hr, 8, 6);
    pupil.scale(1, 1, 0.4);
    m.geometry('skin', pupil, at(sx * 0.31, 0.08, 0.955), 0x0d0a08, [['Head', 1]]);
    const brow = new THREE.BoxGeometry(0.3 * hr, 0.045 * hr, 0.06 * hr);
    brow.rotateZ(sx * -0.12);
    m.geometry('gear', brow, at(sx * 0.31, 0.27, 0.86), spec.hair, [['Head', 1]]);
    const ear = new THREE.SphereGeometry(0.2 * hr, 10, 8);
    ear.scale(0.35, 1, 0.65);
    m.geometry('skin', ear, at(sx * 0.86, 0.0, -0.05), darker(spec.skin, 0.95), [['Head', 1]]);
  }

  // Hair: a cap tilted back so the hairline sits on the forehead.
  // Thin shell over the skull, tilted back: the hairline sits high on the forehead and the back covers the nape.
  const cap = new THREE.SphereGeometry(1.025, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5);
  cap.scale(0.88 * hr, 1.16 * hr, 1.06 * hr);
  cap.rotateX(-0.68);
  m.geometry('gear', cap, new THREE.Matrix4().makeTranslation(headC.x, headC.y + 0.03 * hr, headC.z - 0.03 * hr), spec.hair, [['Head', 1]]);
  if (spec.hairStyle === 'ponytail') {
    const p1 = world.Ponytail1, p2 = world.Ponytail2;
    m.geometry('gear', new THREE.TorusGeometry(0.03 * s, 0.009 * s, 6, 12), new THREE.Matrix4().makeTranslation(p1.x, p1.y, p1.z - 0.01), darker(spec.hair, 0.6), [['Ponytail1', 1]]);
    m.loft('gear', [
      ring(V(p1.x, p1.y + 0.01, p1.z + 0.01), 0.03, 0.028, spec.hair, blend('Head', 'Ponytail1', 0.6)),
      ring(V(p1.x, p1.y - 0.06 * s, p1.z - 0.03), 0.04, 0.034, spec.hair, [['Ponytail1', 1]]),
      ring(V(p2.x, p2.y, p2.z), 0.036, 0.03, spec.hair, blend('Ponytail1', 'Ponytail2', 0.7)),
      ring(V(p2.x, p2.y - 0.1 * s, p2.z - 0.01), 0.022, 0.02, spec.hair, [['Ponytail2', 1]]),
      ring(V(p2.x, p2.y - 0.17 * s, p2.z + 0.01), 0.006, 0.006, spec.hair, [['Ponytail2', 1]]),
    ], 12, [true, true]);
  }

  // ---------------------------------------------------------------- arms
  for (const [side, sx] of [['Left', 1], ['Right', -1]] as const) {
    const arm = `${side}Arm` as BoneName, fore = `${side}ForeArm` as BoneName, hand = `${side}Hand` as BoneName;
    const sh = world[arm], el = world[fore], wr = world[hand];
    const sleeve = spec.topStyle === 'shortSleeve' ? spec.top : spec.skin;
    const k = 1 - 0.18 * f; // slimmer arms
    // Deltoid.
    const delt = new THREE.SphereGeometry(0.064 * s * g * k, 14, 10);
    delt.scale(1, 1.05, 0.95);
    m.geometry('gear', delt, new THREE.Matrix4().makeTranslation(sh.x - sx * 0.005, sh.y + 0.005, sh.z), sleeve, blend('Chest', arm, 0.65));
    const lerp = (t: number) => sh.clone().lerp(el, t);
    const lerpF = (t: number) => el.clone().lerp(wr, t);
    const sleeveEnd = spec.topStyle === 'shortSleeve' ? 0.5 : 0;
    const armRings: Ring[] = [
      ring(lerp(0.02), 0.058 * g * k, 0.056 * g * k, sleeve, blend('Chest', arm, 0.75)),
      ring(lerp(0.25).add(V(0, 0, 0.004)), 0.054 * g * k, 0.055 * g * k, sleeve, [[arm, 1]]), // biceps
    ];
    if (sleeveEnd > 0) {
      armRings.push(ring(lerp(sleeveEnd), 0.06 * g * k, 0.06 * g * k, sleeve, [[arm, 1]])); // rolled cuff
      armRings.push(ring(lerp(sleeveEnd), 0.047 * g * k, 0.047 * g * k, spec.skin, [[arm, 1]]));
    }
    armRings.push(
      ring(lerp(0.8), 0.044 * g * k, 0.045 * g * k, spec.skin, [[arm, 1]]),
      ring(lerp(1.0), 0.042 * g * k, 0.043 * g * k, spec.skin, blend(arm, fore, 0.5)),
      ring(lerpF(0.18), 0.044 * g * k, 0.042 * g * k, spec.skin, [[fore, 1]]), // forearm
      ring(lerpF(0.6), 0.036 * g * k, 0.033 * g * k, spec.skin, [[fore, 1]]),
      ring(lerpF(0.97), 0.03 * g * k, 0.026 * g * k, spec.skin, blend(fore, hand, 0.5)),
    );
    m.loft('gear', armRings, 14, [false, false]);
    // Hand: palm faces the thigh (width along Z), fingers together, thumb forward.
    const dir = wr.clone().sub(el).normalize();
    const hp = (d: number) => wr.clone().addScaledVector(dir, d * s);
    m.loft('skin', [
      ring(hp(-0.01), 0.02 * k, 0.03 * k, spec.skin, blend(fore, hand, 0.6)),
      ring(hp(0.04), 0.022 * k, 0.042 * k, spec.skin, [[hand, 1]]),
      ring(hp(0.09), 0.018 * k, 0.04 * k, spec.skin, [[hand, 1]]),
      ring(hp(0.15), 0.014 * k, 0.034 * k, spec.skin, [[hand, 1]]),
      ring(hp(0.18), 0.008 * k, 0.02 * k, spec.skin, [[hand, 1]]),
    ], 12, [true, true]);
    const thumb = new THREE.CapsuleGeometry(0.012 * s * k, 0.045 * s, 4, 8);
    thumb.rotateX(-0.6);
    const tp = hp(0.05);
    m.geometry('skin', thumb, new THREE.Matrix4().makeTranslation(tp.x - sx * 0.005, tp.y, tp.z + 0.035 * s * k), spec.skin, [[hand, 1]]);
  }

  // ---------------------------------------------------------------- gear
  const chest = world.Chest;
  const large = spec.packStyle === 'large';
  const pw = (large ? 0.34 : 0.27) * s, ph = (large ? 0.46 : 0.32) * s, pd = (large ? 0.19 : 0.14) * s;
  const packBox = new THREE.BoxGeometry(pw, ph, pd, 3, 3, 2);
  const pp = packBox.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pp.count; i++) {
    // Round the edges: pull corners in a little.
    const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
    const k2 = 1 - 0.12 * (Math.abs(x) / (pw / 2)) * (Math.abs(z) / (pd / 2));
    pp.setXYZ(i, x * k2, y, z * k2);
  }
  const packY = chest.y - (large ? 0.06 : 0.02) * s, packZ = -(0.13 + (large ? 0.1 : 0.07)) * s;
  const packShade = (p: THREE.Vector3) => (p.y > packY + ph * 0.32 ? darker(spec.pack, 0.75) : spec.pack);
  m.geometry('gear', packBox, new THREE.Matrix4().makeTranslation(0, packY, packZ), packShade, [['Chest', 1]]);
  m.geometry('gear', new THREE.BoxGeometry(pw * 0.7, ph * 0.3, 0.05 * s), new THREE.Matrix4().makeTranslation(0, packY - ph * 0.22, packZ - pd / 2 - 0.02 * s), darker(spec.pack, 0.85), [['Chest', 1]]);
  for (const sx of [-1, 1]) {
    m.geometry('gear', new THREE.BoxGeometry(0.05 * s, ph * 0.45, pd * 0.7), new THREE.Matrix4().makeTranslation(sx * (pw / 2 + 0.02 * s), packY - ph * 0.12, packZ), darker(spec.pack, 0.9), [['Chest', 1]]);
    // Shoulder strap: from the pack top, over the shoulder, down the chest.
    const x = sx * 0.1 * s * (1 - 0.1 * f);
    m.loft('gear', [
      ring(V(x, packY + ph * 0.4, -0.12 * s), 0.024, 0.007, darker(spec.pack, 0.6), [['Chest', 1]]),
      ring(V(x * 1.05, J.shoulderY + 0.04 * s, -0.02 * s), 0.024, 0.007, darker(spec.pack, 0.6), [['Chest', 1]]),
      ring(V(x, J.shoulderY - 0.04 * s, (0.11 + bust) * s), 0.024, 0.007, darker(spec.pack, 0.6), [['Chest', 1]]),
      ring(V(x * 1.1, chest.y - 0.12 * s, (0.125 + bust * 0.5) * s), 0.024, 0.007, darker(spec.pack, 0.6), [['Chest', 1]]),
    ], 6, [true, true], V(0, 0, 1));
  }
  if (spec.bedroll !== undefined) {
    const roll = new THREE.CylinderGeometry(0.055 * s, 0.055 * s, pw * 1.05, 14);
    roll.rotateZ(Math.PI / 2);
    m.geometry('gear', roll, new THREE.Matrix4().makeTranslation(0, packY + ph / 2 + 0.05 * s, packZ + 0.01), spec.bedroll, [['Chest', 1]]);
  }
  // Belt pouch and buckle.
  m.geometry('gear', new THREE.BoxGeometry(0.09 * s, 0.1 * s, 0.05 * s), new THREE.Matrix4().makeTranslation(0.15 * s, J.hips + 0.03 * s, 0.07 * s), darker(spec.belt, 1.15), [['Hips', 1]]);
  m.geometry('gear', new THREE.BoxGeometry(0.05 * s, 0.035 * s, 0.01 * s), new THREE.Matrix4().makeTranslation(0, J.hips + 0.09 * s, 0.12 * s * g), 0x8f7f5a, [['Hips', 1]]);

  // ---------------------------------------------------------------- mesh
  const geo = m.build();
  const skinMaps = surfaceMaps('skin'), cloth = surfaceMaps('cloth');
  const skinMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, map: skinMaps.map });
  const gearMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, map: cloth.map, normalMap: cloth.normalMap });
  gearMat.normalScale.set(0.6, 0.6);
  const mesh = new THREE.SkinnedMesh(geo, [skinMat, gearMat]);
  mesh.add(bones.Hips);
  mesh.bind(skeleton);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  const root = new THREE.Group();
  root.add(mesh);
  return { root, mesh, bones, rest: world };
}

export type BuiltCharacter = ReturnType<typeof buildCharacter>;
export type { Bucket };
