import * as THREE from 'three';
import type { BoneName } from './rig';

/**
 * Keyframed animation clips for the built-in rig (all rest rotations are identity, so a pose is just a
 * set of local Euler angles). Each clip is sampled at 30 fps from a pose function and loops seamlessly.
 * Sign conventions: rotation.x < 0 swings a hanging limb forward; knee/elbow bends are + / - x.
 */
type Pose = Partial<Record<BoneName, [number, number, number]>> & { hipsDy?: number; hipsDz?: number };

/** Reference speeds the cycles are authored for (playback rate scales from these). */
export const WALK_SPEED = 2.4;
export const RUN_SPEED = 5.5;

function sample(name: string, duration: number, pose: (t: number) => Pose, hipsRest: THREE.Vector3, loop = true) {
  const fps = 30;
  const frames = Math.round(duration * fps);
  const times: number[] = [];
  const quats = new Map<BoneName, number[]>();
  const hips: number[] = [];
  const e = new THREE.Euler(), q = new THREE.Quaternion();
  for (let i = 0; i <= frames; i++) {
    const t = i / frames; // 0..1 (last frame == first for loops)
    times.push(t * duration);
    const p = pose(loop && i === frames ? 0 : t);
    for (const [bone, rot] of Object.entries(p) as [BoneName, [number, number, number]][]) {
      if (!Array.isArray(rot)) continue;
      e.set(rot[0], rot[1], rot[2], 'XYZ');
      q.setFromEuler(e);
      if (!quats.has(bone)) quats.set(bone, []);
      quats.get(bone)!.push(q.x, q.y, q.z, q.w);
    }
    hips.push(hipsRest.x, hipsRest.y + (p.hipsDy ?? 0), hipsRest.z + (p.hipsDz ?? 0));
  }
  const tracks: THREE.KeyframeTrack[] = [new THREE.VectorKeyframeTrack('Hips.position', times, hips)];
  for (const [bone, values] of quats) tracks.push(new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, times, values));
  return new THREE.AnimationClip(name, duration, tracks);
}

const TAU = Math.PI * 2;

/** Walking or running gait. `run` 0 = walk, 1 = run. t in 0..1 over one full stride (two steps). */
function gait(t: number, run: number): Pose {
  const ph = t * TAU;
  const p: Pose = {};
  const legAmp = 0.42 + 0.33 * run, kneeAmp = 0.7 + 0.75 * run, armAmp = 0.32 + 0.5 * run;
  for (const [side, off] of [['Left', 0], ['Right', Math.PI]] as const) {
    const s = Math.sin(ph + off), c = Math.cos(ph + off);
    const thigh = -s * legAmp;
    const knee = Math.max(0, c) * kneeAmp + 0.06 + run * 0.12;
    p[`${side}UpLeg`] = [thigh, 0, 0];
    p[`${side}Leg`] = [knee, 0, 0];
    p[`${side}Foot`] = [-thigh * 0.35 - knee * 0.25 + 0.05, 0, 0];
    // Arms swing opposite to the same-side leg; elbows bend more when running.
    p[`${side}Arm`] = [s * armAmp, 0, (side === 'Left' ? 1 : -1) * (0.05 + run * 0.08)];
    p[`${side}ForeArm`] = [-(0.2 + run * 1.0) - Math.max(0, -s) * 0.2 * (1 - run), 0, 0];
    p[`${side}Hand`] = [0.1, 0, 0];
  }
  const twist = Math.sin(ph) * (0.07 + 0.05 * run);
  p.Spine = [0.03 + 0.1 * run, twist * 0.5, 0];
  p.Spine1 = [0.02 + 0.06 * run, twist * 0.5, 0];
  p.Chest = [0.0, -twist * 0.4, Math.sin(ph) * 0.02];
  p.Neck = [-(0.04 + 0.12 * run), -twist * 0.3, 0];
  p.Head = [0.0, 0, 0];
  p.Hips = [0, -twist * 0.6, Math.sin(ph) * 0.03];
  p.Ponytail1 = [0.35 + Math.sin(ph * 2) * (0.12 + 0.2 * run) + run * 0.3, Math.sin(ph) * 0.2, 0];
  p.Ponytail2 = [0.2 + Math.sin(ph * 2 - 0.8) * (0.15 + 0.2 * run), 0, 0];
  p.hipsDy = -Math.abs(Math.cos(ph)) * (0.035 + 0.03 * run) + 0.02 + 0.01 * run;
  return p;
}

function idle(t: number): Pose {
  const ph = t * TAU;
  const breathe = Math.sin(ph * 2) * 0.012;
  const p: Pose = {};
  for (const [side, sx] of [['Left', 1], ['Right', -1]] as const) {
    p[`${side}UpLeg`] = [0.02, 0, sx * 0.02];
    p[`${side}Leg`] = [0.04, 0, 0];
    p[`${side}Foot`] = [-0.03, 0, 0];
    p[`${side}Arm`] = [Math.sin(ph + (sx > 0 ? 0 : 1)) * 0.025, 0, sx * 0.03];
    p[`${side}ForeArm`] = [-0.22, 0, 0];
    p[`${side}Hand`] = [0.12, 0, 0];
  }
  p.Spine = [0.02 + breathe * 0.5, 0, Math.sin(ph) * 0.01];
  p.Spine1 = [breathe, 0, 0];
  p.Chest = [breathe, 0, 0];
  p.Neck = [-0.02, Math.sin(ph) * 0.18, 0];      // looks around slowly
  p.Head = [Math.sin(ph * 0.5) * 0.04, Math.sin(ph) * 0.12, 0];
  p.Hips = [0, Math.sin(ph) * 0.02, Math.sin(ph) * 0.012];
  p.Ponytail1 = [0.35 + breathe, Math.sin(ph) * 0.05, 0];
  p.Ponytail2 = [0.2, 0, 0];
  p.hipsDy = breathe * 0.3;
  return p;
}

/** Jump: crouch, push off with arms swinging up, tuck in the air, reach for the landing. t 0..1 once. */
function jump(t: number): Pose {
  const crouch = t < 0.15 ? t / 0.15 : t < 0.3 ? 1 - (t - 0.15) / 0.15 : 0;
  const tuck = t < 0.3 ? 0 : t < 0.55 ? (t - 0.3) / 0.25 : t < 0.85 ? 1 - (t - 0.55) / 0.3 * 0.6 : 0.4;
  const p: Pose = {};
  for (const [side, sx, lead] of [['Left', 1, 1], ['Right', -1, 0.6]] as const) {
    p[`${side}UpLeg`] = [-(0.45 * crouch + 0.9 * tuck * lead), 0, 0];
    p[`${side}Leg`] = [0.9 * crouch + 1.2 * tuck * lead, 0, 0];
    p[`${side}Foot`] = [-0.3 * crouch + 0.3 * tuck, 0, 0];
    p[`${side}Arm`] = [0.5 * crouch - 1.3 * (1 - crouch) * (t < 0.6 ? 1 : 0.6), 0, sx * (0.15 + 0.25 * tuck)];
    p[`${side}ForeArm`] = [-0.4 - 0.4 * tuck, 0, 0];
  }
  p.Spine = [0.25 * crouch + 0.1 * tuck, 0, 0];
  p.Neck = [-0.15 * crouch, 0, 0];
  p.Ponytail1 = [0.3 + 0.6 * tuck, 0, 0];
  p.hipsDy = -0.18 * crouch;
  return p;
}

export function makeClips(hipsRest: THREE.Vector3) {
  return [
    sample('idle', 4, idle, hipsRest),
    sample('walk', 2.3 / WALK_SPEED, (t) => gait(t, 0), hipsRest), // one stride (two steps) ~2.3 m
    sample('run', 3.8 / RUN_SPEED, (t) => gait(t, 1), hipsRest),          // one stride ~3.8 m
    sample('jump', 0.9, jump, hipsRest, false),
  ];
}
