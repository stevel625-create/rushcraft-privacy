import * as THREE from 'three';
import { FIRE, ParticleEmitter, SMOKE } from './particles';
import { buildPlane } from './plane';
import { surfaceMaps } from './textures';

/** What the cinematic needs from the game (keeps it testable without React or audio). */
export interface CinematicHost {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Jason's mesh and where he'll stand when control starts. */
  player: THREE.Object3D;
  playerStart: THREE.Vector3;
  playerYaw: number;
  viewportHeight: number;
  sound(name: string): void;
  loop(name: string, on: boolean): void;
  ambience(name: string | null): void;
  say(conversationId: string): void;
  clearDialogue(): void;
  haptic(kind: 'impact'): void;
  finished(): void;
}

export interface CinematicState {
  /** 0 = clear, 1 = black. */
  fade: number;
  /** 0..1 white flash (impact). */
  flash: number;
  letterbox: boolean;
}

const smooth = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };

/**
 * The plane-crash opening. ~21 s, skippable at any time.
 *   0-5     tracking shot alongside the plane over the canopy
 *   4.5     right engine catches fire, alarm, mayday call
 *   5-8     close shot of the burning wing
 *   8-11.6  chase camera as the plane dives into the jungle
 *   11.6    impact: crash, white flash, heavy shake, haptic
 *   12-16   black: "Some time later..."
 *   16-21   fade in on the burning wreck, crane down to Jason, hand over control
 */
export class OpeningCinematic {
  readonly duration = 21;
  t = 0;
  done = false;
  state: CinematicState = { fade: 1, flash: 0, letterbox: true };
  private readonly plane = buildPlane();
  private readonly fire = new ParticleEmitter({ ...FIRE, max: 120, rate: 80, size: [1.3, 0.3] });
  private readonly smoke = new ParticleEmitter({ ...SMOKE, max: 160, rate: 45, life: [2, 3.5], speed: [0.2, 0.6], size: [1.5, 6] });
  private readonly canopy: THREE.Mesh;
  private readonly path: THREE.CatmullRomCurve3;
  private readonly keyTimes = [0, 4.5, 8, 10.6, 11.6];
  private fired = new Set<string>();
  private alarmTimer = 0;
  private shake = 0;
  private readonly crashPoint = new THREE.Vector3(4, 1.4, 2);
  private fogDensity: number | null = null;

  constructor(private host: CinematicHost) {
    this.path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-30, 78, -430), new THREE.Vector3(-18, 74, -260), new THREE.Vector3(-6, 56, -130),
      new THREE.Vector3(2, 22, -40), this.crashPoint.clone(),
    ]);
    // A wide, far-below jungle canopy so the flight shots have ground under them (removed afterwards).
    const leaf = surfaceMaps('leaf');
    const mat = new THREE.MeshStandardMaterial({ color: 0x24482a, roughness: 0.95, map: leaf.map });
    if (mat.map) { mat.map = mat.map.clone(); mat.map.repeat.set(120, 120); mat.map.needsUpdate = true; }
    this.canopy = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2), mat);
    this.canopy.position.set(0, -2, -400);
    this.fire.active = false;
    this.smoke.active = false;
  }

  start() {
    const h = this.host;
    h.scene.add(this.plane.group, this.fire.points, this.smoke.points, this.canopy);
    this.fire.setViewportHeight(h.viewportHeight);
    this.smoke.setViewportHeight(h.viewportHeight);
    h.player.visible = false;
    h.loop('fire', false); // the wreck isn't burning yet
    h.ambience('wind');
    h.loop('engine', true);
    // Thinner haze during the flight so the canopy far below is visible; restored on landing.
    const fog = h.scene.fog as THREE.FogExp2 | null;
    if (fog) { this.fogDensity = fog.density; fog.density = 0.0035; }
    this.update(0);
  }

  private once(key: string, at: number, fn: () => void) {
    if (this.t >= at && !this.fired.has(key)) { this.fired.add(key); fn(); }
  }

  /** Map cinematic time to curve parameter (keys at the control points). */
  private u(t: number) {
    const k = this.keyTimes;
    for (let i = 0; i < k.length - 1; i++) {
      if (t <= k[i + 1]) return (i + (t - k[i]) / (k[i + 1] - k[i])) / (k.length - 1);
    }
    return 1;
  }

  update(dt: number) {
    if (this.done) return;
    this.t += dt;
    const t = this.t, h = this.host, cam = h.camera;

    // ---- cues
    this.once('intro', 0.6, () => h.say('opening_intro'));
    this.once('fire', 4.5, () => { this.fire.active = true; this.smoke.active = true; h.sound('alarm'); h.loop('fire', true); });
    this.once('mayday', 5.0, () => h.say('opening_mayday'));
    this.once('impact', 11.6, () => {
      h.loop('engine', false); h.loop('fire', false);
      h.sound('crash'); h.haptic('impact');
      this.plane.group.visible = false; this.fire.active = false; this.smoke.active = false;
    });
    this.once('later', 13.2, () => { h.say('opening_later'); h.ambience('jungle'); h.loop('fire', true); });
    this.once('wake', 16.4, () => { h.player.visible = true; this.canopy.visible = false; this.restoreFog(); });
    this.once('ground', 11.6, () => this.restoreFog());
    this.once('wakeLines', 17.0, () => h.say('opening_wake'));
    if (t > 4.5 && t < 11.6) {
      this.alarmTimer -= dt;
      if (this.alarmTimer <= 0) { this.alarmTimer = 1.25; h.sound('alarm'); }
    }

    // ---- plane
    const flying = t < 11.6;
    if (flying) {
      const u = this.u(t);
      const p = this.path.getPointAt(Math.min(1, u * 0.999 + 0.0005));
      const ahead = this.path.getPointAt(Math.min(1, u + 0.01));
      const g = this.plane.group;
      g.position.copy(p);
      g.lookAt(ahead);
      const damaged = t > 4.5 ? smooth((t - 4.5) / 2) : 0;
      g.rotateZ(Math.sin(t * 1.7) * 0.06 + damaged * (0.25 + Math.sin(t * 3.1) * 0.12));
      this.plane.propellers.forEach((pr, i) => { pr.rotation.z += dt * (i === 1 && t > 4.5 ? 8 : 40); });
      g.updateMatrixWorld();
      this.fire.origin.copy(this.plane.exhaust).applyMatrix4(g.matrixWorld);
      this.smoke.origin.copy(this.fire.origin);
    }
    this.fire.update(dt);
    this.smoke.update(dt);

    // ---- camera
    const g = this.plane.group;
    const look = new THREE.Vector3();
    if (t < 5) {
      // Tracking alongside, slowly drifting forward along the fuselage.
      cam.position.copy(g.position).add(new THREE.Vector3(26 - t * 1.5, 5, 6 + t * 2));
      look.copy(g.position);
    } else if (t < 8) {
      // Over the right wing, looking at the burning engine.
      cam.position.copy(new THREE.Vector3(10, 3.5, -10).applyMatrix4(g.matrixWorld));
      look.copy(this.fire.origin);
    } else if (t < 12.2) {
      // Chase camera behind and above as it dives.
      const back = this.path.getTangentAt(this.u(Math.min(t, 11.5))).multiplyScalar(-1);
      cam.position.copy(flying ? g.position : this.crashPoint).addScaledVector(back, 22).add(new THREE.Vector3(0, 7, 0));
      look.copy(flying ? g.position : this.crashPoint);
    } else {
      // Wake-up: crane from above the wreck down to behind Jason.
      const k = smooth((t - 16) / 4.5);
      const yaw = h.playerYaw, dist = 5.5, pitch = 0.32;
      const end = new THREE.Vector3(
        h.playerStart.x - Math.sin(yaw) * Math.cos(pitch) * dist,
        h.playerStart.y + 1.6 + Math.sin(pitch) * dist,
        h.playerStart.z - Math.cos(yaw) * Math.cos(pitch) * dist,
      );
      cam.position.copy(new THREE.Vector3(12, 11, -14)).lerp(end, k);
      look.copy(new THREE.Vector3(4, 1, 2)).lerp(new THREE.Vector3(h.playerStart.x, h.playerStart.y + 1.6, h.playerStart.z), k);
    }

    // ---- shake, fades
    this.shake = t > 4.5 && t < 11.6 ? 0.08 + smooth((t - 8) / 3.6) * 0.35 : t >= 11.6 && t < 12.4 ? 1.2 * (1 - (t - 11.6) / 0.8) : 0;
    if (this.shake > 0) cam.position.add(new THREE.Vector3(Math.sin(t * 47) * this.shake, Math.sin(t * 61 + 1) * this.shake * 0.6, Math.sin(t * 53 + 2) * this.shake));
    cam.lookAt(look);

    this.state = {
      fade: t < 0.8 ? 1 - t / 0.8 : t < 12.2 ? 0 : t < 13 ? (t - 12.2) / 0.8 : t < 16 ? 1 : t < 17.5 ? 1 - (t - 16) / 1.5 : 0,
      flash: t >= 11.6 && t < 12.3 ? 1 - (t - 11.6) / 0.7 : 0,
      letterbox: t < this.duration - 0.6,
    };

    if (t >= this.duration) this.finish();
  }

  private restoreFog() {
    const fog = this.host.scene.fog as THREE.FogExp2 | null;
    if (fog && this.fogDensity !== null) fog.density = this.fogDensity;
    this.fogDensity = null;
  }

  /** Jump to the end: stop sounds and lines, show Jason, hand over control. */
  skip() {
    if (this.done) return;
    const h = this.host;
    h.loop('engine', false);
    h.clearDialogue();
    h.ambience('jungle');
    h.loop('fire', true);
    this.finish();
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    const h = this.host;
    this.restoreFog();
    h.player.visible = true;
    this.state = { fade: 0, flash: 0, letterbox: false };
    h.scene.remove(this.plane.group, this.fire.points, this.smoke.points, this.canopy);
    this.plane.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
    });
    this.fire.dispose();
    this.smoke.dispose();
    this.canopy.geometry.dispose();
    (this.canopy.material as THREE.Material).dispose();
    h.finished();
  }
}
