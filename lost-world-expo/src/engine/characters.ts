import * as THREE from 'three';
import type { CharacterVisual } from '../models/skinnedCharacter';
import { ELENA, Humanoid, JASON } from './humanoid';
import type { InputState } from './input';
import { CharacterBody, type Physics, type Vec3 } from './physics';

const WALK = 3.2, RUN = 6.5, RUN_THRESHOLD = 0.85, JUMP_HEIGHT = 1.4, TURN = 12;

const angleLerp = (from: number, to: number, k: number) => {
  const d = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + d * Math.min(1, k);
};

export class Player {
  readonly body: CharacterBody;
  /** Built-in figure until a rigged model is loaded (setVisual). */
  figure: CharacterVisual = new Humanoid(JASON);
  get mesh() { return this.figure.group; }

  setVisual(v: CharacterVisual) { this.figure = v; this.sync(); }
  yaw = 0;
  controlsEnabled = true;

  constructor(spawn: Vec3) {
    this.body = new CharacterBody(spawn);
  }

  warp(p: Vec3, yaw: number) {
    this.body.warp(p);
    this.yaw = yaw;
    this.sync();
  }

  update(physics: Physics, input: InputState, cameraYaw: number, dt: number) {
    let wx = 0, wz = 0, mag = 0;
    if (this.controlsEnabled) {
      if (input.worldMove) {
        wx = input.worldMove.x; wz = input.worldMove.z;
        mag = Math.min(1, Math.hypot(wx, wz));
      } else {
        // Camera-relative: forward = (sin, cos), right = (-cos, sin) for this camera.
        const fx = Math.sin(cameraYaw), fz = Math.cos(cameraYaw);
        const rx = -Math.cos(cameraYaw), rz = Math.sin(cameraYaw);
        wx = rx * input.moveX + fx * input.moveY;
        wz = rz * input.moveX + fz * input.moveY;
        mag = Math.min(1, Math.hypot(input.moveX, input.moveY));
      }
    }
    const len = Math.hypot(wx, wz);
    if (len > 1e-4) { wx /= len; wz /= len; }

    const speed = mag < 0.01 ? 0 : mag >= RUN_THRESHOLD ? RUN : WALK;
    if (len > 1e-4) this.yaw = angleLerp(this.yaw, Math.atan2(wx, wz), TURN * dt);

    if (this.controlsEnabled && input.consumeJump() && this.body.grounded) {
      this.body.vel.y = Math.sqrt(2 * -this.body.gravity * JUMP_HEIGHT);
      this.body.grounded = false;
    }
    const x0 = this.body.pos.x, z0 = this.body.pos.z;
    this.body.step(physics, wx * speed, wz * speed, dt);
    this.animate(x0, z0, dt);
    this.sync();
  }

  get forward() { return { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }; }

  /** Drive the walk/run/jump animation from how far Jason actually moved (walls slow him, so do they). */
  private animate(x0: number, z0: number, dt: number) {
    if (dt <= 0) return;
    const speed = Math.hypot(this.body.pos.x - x0, this.body.pos.z - z0) / dt;
    this.figure.update(dt, speed, this.body.grounded, this.body.vel.y);
  }

  sync() {
    this.mesh.position.set(this.body.pos.x, this.body.pos.y, this.body.pos.z);
    this.mesh.rotation.y = this.yaw;
  }
}

export type CompanionState = 'waiting' | 'following' | 'scripted';

/**
 * Elena: keeps 1.6-2.5 m from Jason with hysteresis, steers around walls by probing ahead,
 * sprints to catch up, warps if more than 25 m away. Scripted mode walks her to a point and holds.
 */
export class Companion {
  readonly body: CharacterBody;
  figure: CharacterVisual = new Humanoid(ELENA);
  get mesh() { return this.figure.group; }

  setVisual(v: CharacterVisual) { this.figure = v; this.sync(); }
  yaw = 0;
  state: CompanionState = 'waiting';
  private target: Vec3 | null = null;
  /** Set when Elena is lost or stranded; Game.recoverElena() clears it. */
  needsRecovery = false;

  constructor(spawn: Vec3) {
    this.body = new CharacterBody(spawn);
  }

  warp(p: Vec3) {
    this.body.warp(p);
    this.needsRecovery = false;
    this.sync();
  }

  walkTo(p: Vec3) {
    this.target = { ...p };
    this.state = 'scripted';
  }

  follow() {
    this.target = null;
    this.state = 'following';
  }

  update(physics: Physics, leader: CharacterBody, dt: number) {
    const lp = leader.pos, p = this.body.pos;
    const dist = Math.hypot(lp.x - p.x, lp.z - p.z);
    let hx = 0, hz = 0;

    if (this.state === 'scripted' && this.target) {
      [hx, hz] = this.steer(physics, this.target, 3.6, 0.3);
    } else {
      if (dist > 25 || lp.y - p.y > 6) {
        // Lost, or stuck below a jump she can't make: the game places her next to Jason on solid ground.
        this.needsRecovery = true;
        return;
      }
      if (this.state !== 'following' && dist > 2.5) this.state = 'following';
      else if (this.state === 'following' && dist < 1.6) this.state = 'waiting';
      if (this.state === 'following') [hx, hz] = this.steer(physics, lp, dist > 6 ? 6 : 3.6, 1.6);
      else this.face(lp, dt);
    }
    const x0 = this.body.pos.x, z0 = this.body.pos.z;
    this.body.step(physics, hx, hz, dt);
    if (dt > 0) this.figure.update(dt, Math.hypot(this.body.pos.x - x0, this.body.pos.z - z0) / dt, this.body.grounded, this.body.vel.y);
    this.sync();
  }

  private steer(physics: Physics, to: Vec3, speed: number, arrive: number): [number, number] {
    const p = this.body.pos;
    let dx = to.x - p.x, dz = to.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d <= arrive) return [0, 0];
    dx /= d; dz /= d;
    const probe = 1.0;
    const free = (x: number, z: number) =>
      !physics.blocked(p.x + x * probe, p.z + z * probe, this.body.radius, p.y + this.body.stepHeight, p.y + this.body.height);
    let dir: [number, number] = [dx, dz];
    if (!free(dx, dz)) {
      dir = [dx, dz];
      for (const a of [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) {
        const c = Math.cos(a), s = Math.sin(a);
        const rx = dx * c - dz * s, rz = dx * s + dz * c;
        if (free(rx, rz)) { dir = [rx, rz]; break; }
      }
    }
    this.yaw = Math.atan2(dir[0], dir[1]);
    return [dir[0] * speed, dir[1] * speed];
  }

  private face(to: Vec3, dt: number) {
    const p = this.body.pos;
    if (Math.hypot(to.x - p.x, to.z - p.z) > 0.01) this.yaw = angleLerp(this.yaw, Math.atan2(to.x - p.x, to.z - p.z), 10 * dt);
  }

  sync() {
    this.mesh.position.set(this.body.pos.x, this.body.pos.y, this.body.pos.z);
    this.mesh.rotation.y = this.yaw;
  }
}

/** Orbit camera: drag to rotate, follows smoothly, pulls in when geometry blocks the view. */
export class OrbitCamera {
  readonly camera: THREE.PerspectiveCamera;
  yaw = 0;
  pitch = 0.32;
  distance = 5.5;
  sensitivity = 0.006;
  private pivot = new THREE.Vector3();
  private initialised = false;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 260);
  }

  snap(yaw: number) {
    this.yaw = yaw;
    this.initialised = false;
  }

  update(target: Vec3, look: { dx: number; dy: number }, physics: Physics, dt: number) {
    this.yaw -= look.dx * this.sensitivity;
    this.pitch = Math.max(-0.35, Math.min(1.05, this.pitch + look.dy * this.sensitivity));

    const desired = new THREE.Vector3(target.x, target.y + 1.6, target.z);
    if (!this.initialised) { this.pivot.copy(desired); this.initialised = true; }
    this.pivot.lerp(desired, 1 - Math.exp(-12 * dt));

    const cp = Math.cos(this.pitch);
    const dir = new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);

    // March along the boom; stop before the first solid sample.
    let dist = this.distance;
    for (let d = 0.6; d <= this.distance; d += 0.3) {
      const pt = { x: this.pivot.x + dir.x * d, y: this.pivot.y + dir.y * d, z: this.pivot.z + dir.z * d };
      if (physics.pointInSolid(pt)) { dist = Math.max(1.2, d - 0.35); break; }
    }
    this.camera.position.copy(this.pivot).addScaledVector(dir, dist);
    this.camera.lookAt(this.pivot);
  }
}
