import * as THREE from 'three';

/**
 * Skeleton for the built-in characters. Bind pose: standing, arms slightly out (A-pose), facing +Z,
 * feet at y = 0. Every bone's rest rotation is identity, so animation is plain local rotations:
 * rotation about X swings a hanging limb (negative = forward), about Z moves it sideways.
 */
export const BONES = [
  'Hips', 'Spine', 'Spine1', 'Chest', 'Neck', 'Head',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot',
  'Ponytail1', 'Ponytail2',
] as const;
export type BoneName = (typeof BONES)[number];

export interface Joints {
  hips: number;        // hip centre height
  hipX: number;        // leg joint offset from centre
  knee: number;
  ankle: number;
  waist: number;
  chest: number;
  shoulderY: number;
  shoulderX: number;
  elbow: [number, number]; // x, y
  wrist: [number, number];
  neck: number;
  head: number;        // head centre height
}

/** Bone world positions in bind pose for a body with these joint positions. */
export function bonePositions(j: Joints): Record<BoneName, THREE.Vector3> {
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
  const p: Partial<Record<BoneName, THREE.Vector3>> = {
    Hips: v(0, j.hips), Spine: v(0, j.waist - 0.06), Spine1: v(0, j.waist + 0.08), Chest: v(0, j.chest),
    Neck: v(0, j.neck), Head: v(0, j.neck + 0.08),
    Ponytail1: v(0, j.head + 0.03, -0.11), Ponytail2: v(0, j.head - 0.12, -0.15),
  };
  for (const [side, s] of [['Left', 1], ['Right', -1]] as const) {
    p[`${side}Shoulder`] = v(s * 0.06, j.shoulderY - 0.01);
    p[`${side}Arm`] = v(s * j.shoulderX, j.shoulderY);
    p[`${side}ForeArm`] = v(s * j.elbow[0], j.elbow[1], -0.01);
    p[`${side}Hand`] = v(s * j.wrist[0], j.wrist[1], 0.01);
    p[`${side}UpLeg`] = v(s * j.hipX, j.hips - 0.04);
    p[`${side}Leg`] = v(s * j.hipX, j.knee, 0.01);
    p[`${side}Foot`] = v(s * j.hipX, j.ankle, -0.01);
  }
  return p as Record<BoneName, THREE.Vector3>;
}

const PARENT: Record<BoneName, BoneName | null> = {
  Hips: null, Spine: 'Hips', Spine1: 'Spine', Chest: 'Spine1', Neck: 'Chest', Head: 'Neck',
  LeftShoulder: 'Chest', LeftArm: 'LeftShoulder', LeftForeArm: 'LeftArm', LeftHand: 'LeftForeArm',
  RightShoulder: 'Chest', RightArm: 'RightShoulder', RightForeArm: 'RightArm', RightHand: 'RightForeArm',
  LeftUpLeg: 'Hips', LeftLeg: 'LeftUpLeg', LeftFoot: 'LeftLeg',
  RightUpLeg: 'Hips', RightLeg: 'RightUpLeg', RightFoot: 'RightLeg',
  Ponytail1: 'Head', Ponytail2: 'Ponytail1',
};

/** Build bones (identity rest rotations) positioned at the given world points. */
export function buildSkeleton(world: Record<BoneName, THREE.Vector3>) {
  const bones = {} as Record<BoneName, THREE.Bone>;
  for (const name of BONES) {
    const b = new THREE.Bone();
    b.name = name;
    bones[name] = b;
  }
  for (const name of BONES) {
    const parent = PARENT[name];
    const pos = world[name];
    if (parent) {
      bones[parent].add(bones[name]);
      bones[name].position.copy(pos).sub(world[parent]);
    } else {
      bones[name].position.copy(pos);
    }
  }
  const list = BONES.map((n) => bones[n]);
  return { bones, skeleton: new THREE.Skeleton(list), index: (n: BoneName) => BONES.indexOf(n) };
}
