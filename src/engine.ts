import * as THREE from "three";
import { TrainAudio } from "./audio.ts";
import { resolveBody, shown } from "./collision.ts";
import { Dust } from "./dust.ts";
import { InputState } from "./input.ts";
import { Listener } from "./listener.ts";
import { BELLWEATHER_PLAN, MERCER_PLAN, cellAt, tileAt } from "./plan.ts";
import {
  clearProgress,
  loadBellweather,
  loadProgress,
  saveBellweather,
  saveProgress,
} from "./save.ts";
import {
  LINES,
  STAGE,
  TARGET_LABELS,
  applyMercerTarget,
  listenerActive,
  startsOnPlatform,
  taskFor,
  type MercerState,
  type MercerTarget,
} from "./story.ts";
import {
  BELL_COOLDOWN,
  BELL_LABELS,
  BELL_LINES,
  applyBellTarget,
  bellComplete,
  bellGateOpen,
  bellObjective,
  type GameTarget,
} from "./story-bellweather.ts";
import { MercerWorld } from "./world-mercer.ts";
import { clearExtra, loadExtra, saveExtra } from "./save-extra.ts";
import { segmentBlocked } from "./geom.ts";
import { Hunter } from "./hunter.ts";
import type { StageDef, StageWorld } from "./stage-kit.ts";
import { EXTRA_STAGES, GATE_CHIME_EVERY } from "./stages.ts";

/** Targets in stages 3+ are plain strings owned by each StageDef. */
type AnyTarget = GameTarget | string;

/** The stage-3-onward stage currently loaded. */
type Extra = { index: number; def: StageDef; world: StageWorld; hunters: Hunter[] };

export type HudState = {
  /** 1 = Mercer Lower, 2 = Bellweather Spur, 3+ = EXTRA_STAGES in order. */
  chapter: number;
  place: string;
  task: string;
  caption: string;
  hint: string;
  useLabel: string;
  useActive: boolean;
  showDot: boolean;
  charge: number;
  lit: boolean;
  danger: number;
  alert: boolean;
  /** Increments each time the player is caught, to trigger a blackout. */
  caughtCount: number;
  ended: boolean;
  /** Shown under the ending; what pressing Use will do. */
  endAction: string;
  /** Inside a locker: the UI can draw vent slats over the view. */
  hidden: boolean;
};

/**
 * What the shop can do to the game. The app passes GameShop's `perks`;
 * without one, everything is unlocked and there are no extras.
 */
export interface Perks {
  /** Stages 3–8 unlocked. */
  fullGame(): boolean;
  /** Spends a Second Wind if one is available; true if it was spent. */
  takeSecondWind(): boolean;
  /** The player tried to continue past Stage 2 without the full game. */
  onPaywall(): void;
}

const NO_PERKS: Perks = { fullGame: () => true, takeSecondWind: () => false, onPaywall: () => {} };

const LABELS: Record<GameTarget, string> = { ...TARGET_LABELS, ...BELL_LABELS };
const MERCER_FOG = 0x0e1417;
const BELL_FOG = 0x0b1714;
const EYE = 1.65;
const EYE_SNEAK = 1.32;
const MERCER_ENDING = 3;
const BELL_ENDING = 6;
const EXTRA_ENDING = 6;
const FOV = 72;
/** Signal-lamp stun: range (m), beam half-angle, hold time (s), stun length (s), charge cost. */
const STUN_RANGE = 8;
const STUN_COS = Math.cos(THREE.MathUtils.degToRad(14));
const STUN_HOLD = 0.8;
const STUN_SECONDS = 5;
const STUN_COST = 25;
const FOV_HIDDEN = 52;
const FLASH_INTENSITY = 26;
/** Aim offsets in NDC; a small spread gives fingers a margin on narrow panels. */
const AIM_SPREAD = [
  [0, 0],
  [0.035, 0],
  [-0.035, 0],
  [0, 0.035],
  [0, -0.035],
] as const;

/** Owns the renderer, scene and the per-frame game loop for both chapters. */
export class GameEngine {
  readonly input = new InputState();
  readonly audio = new TrainAudio();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly fog = new THREE.FogExp2(MERCER_FOG, 0.05);
  private readonly camera = new THREE.PerspectiveCamera(72, 1, 0.06, 80);
  private readonly flashlight: THREE.SpotLight;
  private readonly world: MercerWorld;
  private readonly listener: Listener;
  private readonly dust: Dust;
  private readonly raycaster = new THREE.Raycaster();
  private readonly aimPoint = new THREE.Vector2();
  private readonly aimCandidates: THREE.Object3D[] = [];
  /** Aim result cached for the current frame (update and HUD both need it). */
  private aimFrame = -1;
  private aimCached: AnyTarget | null = null;
  private frameNo = 0;
  /** Adaptive resolution: drops on slow phones, climbs back when there's headroom. */
  private pixelRatio = 1;
  private readonly maxPixelRatio: number;
  private frameAvg = 1 / 60;
  private retuneAt = 2;
  private raiseBlockedUntil = 0;
  /** Frame time just before the last resolution drop, to check the drop helped. */
  private avgBeforeDrop = 0;
  /** Set once a drop made no difference (frame-rate cap, not GPU load): stop tuning. */
  private tuningLocked = false;
  /** Paused frames only redraw when something changed. */
  private dirty = true;
  private readonly clock = new THREE.Clock();
  private frame = 0;
  private state: MercerState;
  private bellBits = 0;
  private bellReadyAt = 0;
  private nextTransferRing = 0;
  private extra: Extra | null = null;
  private extraBits = 0;
  private nextGateChime = 0;
  private cueWarn = false;
  /** How long the lamp beam has been held on the Listener. */
  private beamHeld = 0;
  private cueRumble = 0;
  /** Hide-spot id while the player is in a locker. */
  private hiddenIn: string | null = null;
  /** Where the Listener's body lives outside the extra stages. */
  private bodyHome: THREE.Object3D | null = null;
  /** Station visibility before an extra stage hid it, restored on the way out. */
  private stationShown = true;
  private bellShown = true;
  private pos = { x: 0, z: 0 };
  private yaw = 0;
  private pitch = 0;
  private eye = EYE;
  private bob = 0;
  private stride = 0;
  private lightOn = true;
  private charge = 100;
  private caption = "";
  private captionUntil = 0;
  private time = 0;
  private endingTime = 0;
  private phoneRang = false;
  private wasAlert = false;
  private nextKnock = 0;
  private nextDrip = 3;
  private caughtCount = 0;
  private lastHud = "";
  private hudTimer = 0;
  paused = true;

  constructor(
    private readonly host: HTMLElement,
    private readonly onHud: (hud: HudState) => void,
    private readonly touch: boolean,
    /** Shop hooks (GameShop.perks). Optional: defaults to everything unlocked. */
    public perks: Perks = NO_PERKS,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: !touch, powerPreference: "high-performance" });
    this.maxPixelRatio = Math.min(window.devicePixelRatio, touch ? 1.5 : 2);
    this.pixelRatio = this.maxPixelRatio;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = "block h-full w-full touch-none";
    host.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(MERCER_FOG);
    this.scene.fog = this.fog;
    this.scene.add(new THREE.HemisphereLight(0x8fa6ad, 0x2a2018, 0.55));
    this.scene.add(new THREE.AmbientLight(0x5a6870, 0.35));

    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);
    this.flashlight = new THREE.SpotLight(0xf0e8c6, 26, 18, THREE.MathUtils.degToRad(29), 0.45, 1.3);
    this.flashlight.position.set(0.12, -0.12, 0);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);
    this.flashlight.target.position.set(0, -0.05, -1);
    this.raycaster.far = 3.5;

    this.world = new MercerWorld(this.scene);
    this.listener = new Listener(this.world.station, MERCER_PLAN, this.world.b.solids);
    this.dust = new Dust(this.scene, this.world.b.glow);

    this.state = loadProgress();
    const extraSave = loadExtra();
    const resumeExtra = extraSave.index >= 0 && extraSave.index < EXTRA_STAGES.length && this.perks.fullGame();
    if (this.state.stage === STAGE.Bellweather && resumeExtra) {
      this.loadExtraStage(extraSave.index, extraSave.bits);
      const { def } = this.extra!;
      if (def.complete(this.extraBits)) {
        this.endingTime = EXTRA_ENDING;
        this.say(def.lines.lastCall, Infinity);
      } else this.say(this.extraBits === 0 ? def.lines.arrival : def.lines.restored, 6);
    } else if (this.atBell) {
      this.bellBits = loadBellweather();
      this.showStation(true);
      if (bellComplete(this.bellBits)) {
        this.endingTime = BELL_ENDING;
        this.say(BELL_LINES.lastCall, Infinity);
      } else if (this.bellBits === 0) this.arrivalCaption();
      else this.say(BELL_LINES.restored, 5);
    } else {
      this.world.sync(this.state.stage);
      this.restorePosition();
      if (this.state.stage === STAGE.Power) this.say(LINES.wake, 7);
      else if (this.state.stage === STAGE.Departed) {
        this.endingTime = MERCER_ENDING + 1;
        this.phoneRang = true;
        this.say(LINES.departed, 9);
      } else this.say(LINES.restored, 4);
    }

    window.addEventListener("resize", this.resize);
    this.resize();
    // Publish the first HUD while paused so the menu knows the scene is ready.
    this.render();
    this.pushHud(1);
    this.loop();
  }

  private get atBell(): boolean {
    return this.state.stage === STAGE.Bellweather && !this.extra;
  }

  /** Whoever is hunting: the yard-style Hunter in stages 3+, else the Listener. */
  private get enemy(): { alert: boolean; distance: number } {
    if (!this.extra) return this.listener;
    // With several hunters, the HUD and audio follow whichever is nearest; alert if any is chasing.
    let distance = Infinity;
    let alert = false;
    for (const h of this.extra.hunters) {
      distance = Math.min(distance, h.distance);
      alert ||= h.alert;
    }
    return { alert, distance };
  }

  private get extraDone(): boolean {
    return !!this.extra && this.extra.def.complete(this.extraBits);
  }

  /** Whether the Listener is hunting right now. */
  private get hunting(): boolean {
    if (this.extra) return !this.extraDone;
    return this.atBell ? !bellComplete(this.bellBits) : listenerActive(this.state.stage);
  }

  private readonly resize = () => {
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  };

  /** Swaps the station beside Car 07 and moves the Listener there. */
  private showStation(bell: boolean): void {
    this.unloadExtraStage();
    this.world.switchStation(bell);
    const fog = bell ? BELL_FOG : MERCER_FOG;
    this.fog.color.set(fog);
    (this.scene.background as THREE.Color).set(fog);
    if (bell) this.world.syncBellweather(this.bellBits);
    this.listener.useStation(
      bell ? (this.world.bellweatherGroup ?? this.world.station) : this.world.station,
      bell ? BELLWEATHER_PLAN : MERCER_PLAN,
      bell,
    );
    this.restorePosition();
  }

  /**
   * Builds stage `index` of EXTRA_STAGES beside Car 07 and hands it the
   * Listener's body. Worlds are built on entry and disposed on exit, so only
   * one extra stage is ever in memory.
   */
  private loadExtraStage(index: number, bits: number): void {
    this.unloadExtraStage();
    const def = EXTRA_STAGES[index];
    const world = def.build(this.scene);
    const body = this.listener.body;
    this.bodyHome = body.parent;
    world.group.add(body);
    const first = new Hunter(world.arena);
    first.attach(body);
    const hunters = [first];
    // Further Listeners wear clones of the same body (shared geometry and materials).
    for (const spec of world.extraHunters) {
      const twin = body.clone();
      world.group.add(twin);
      const h = new Hunter({ ...world.arena, start: spec.start, patrol: spec.patrol });
      h.attach(twin);
      hunters.push(h);
    }
    this.extra = { index, def, world, hunters };
    this.extraBits = bits;
    this.nextGateChime = 0;
    // Keep Car 07 placed as at the junction, then hide the station around it.
    this.world.switchStation(true);
    this.stationShown = this.world.station.visible;
    this.bellShown = this.world.bellweatherGroup?.visible ?? true;
    this.world.station.visible = false;
    if (this.world.bellweatherGroup) this.world.bellweatherGroup.visible = false;
    world.visible = true;
    world.sync(bits);
    this.fog.color.set(def.fog);
    (this.scene.background as THREE.Color).set(def.fog);
    this.restorePosition();
  }

  private unloadExtraStage(): void {
    const extra = this.extra;
    if (!extra) return;
    // Give the Listener its body back before its own stations reclaim it.
    if (this.bodyHome) this.bodyHome.add(this.listener.body);
    else extra.world.group.remove(this.listener.body);
    this.bodyHome = null;
    // Put the stations back as switchStation left them, so a restart shows Mercer again.
    this.world.station.visible = this.stationShown;
    if (this.world.bellweatherGroup) this.world.bellweatherGroup.visible = this.bellShown;
    extra.world.dispose();
    this.extra = null;
    this.hiddenIn = null;
    this.cueWarn = false;
    if (this.cueRumble) this.audio.motion(0);
    this.cueRumble = 0;
  }

  private restorePosition(): void {
    this.hiddenIn = null;
    if (this.extra) {
      const { world, hunters } = this.extra;
      this.pos = { ...(this.extraDone ? world.boarded : world.spawn) };
      this.yaw = this.extraDone ? world.endYaw : 0;
      this.pitch = 0;
      for (const h of hunters) h.reset();
      this.wasAlert = false;
      this.input.clear();
      return;
    }
    const platform = this.atBell || startsOnPlatform(this.state.stage);
    this.pos = platform ? { x: 0, z: 14 } : { x: 0, z: -8.5 };
    if (this.atBell && bellComplete(this.bellBits)) this.pos = { x: 0, z: 28.7 };
    this.yaw = 0;
    this.pitch = 0;
    this.listener.reset();
    this.wasAlert = false;
    this.input.clear();
  }

  private say(line: string, seconds: number): void {
    this.caption = line;
    this.captionUntil = this.time + seconds;
  }

  private arrivalCaption(): void {
    this.say(this.state.foundTape ? BELL_LINES.arrivalWithTape : BELL_LINES.arrival, 7);
  }

  private readonly loop = () => {
    this.frame = requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    this.frameNo++;
    if (this.paused) {
      // The menu covers a still frame: don't burn battery redrawing it.
      if (this.dirty) this.render();
      return;
    }
    this.tuneResolution(raw);
    this.update(Math.min(raw, 0.05));
    this.render();
  };

  /**
   * Keeps frame rate steady on phones by trading pixel ratio. Drops quickly
   * when frames run long; climbs back slowly, and not straight after a drop,
   * so it doesn't oscillate.
   */
  private tuneResolution(raw: number): void {
    if (raw > 0.25) return; // tab switch or hitch: not representative
    this.frameAvg += (raw - this.frameAvg) * 0.05;
    if (this.tuningLocked || this.time < this.retuneAt) return;
    // If the last drop didn't speed frames up, the phone is frame-capped (e.g. iOS
    // Low Power Mode at 30 fps): restore full sharpness and stop tuning.
    if (this.avgBeforeDrop > 0 && this.frameAvg > this.avgBeforeDrop * 0.9) {
      this.avgBeforeDrop = 0;
      this.tuningLocked = true;
      this.pixelRatio = this.maxPixelRatio;
      this.renderer.setPixelRatio(this.pixelRatio);
      this.resize();
      return;
    }
    this.avgBeforeDrop = 0;
    let next = this.pixelRatio;
    if (this.frameAvg > 1 / 45 && this.pixelRatio > 0.75) {
      next = Math.max(0.75, this.pixelRatio - 0.25);
      this.raiseBlockedUntil = this.time + 20;
      this.avgBeforeDrop = this.frameAvg;
    } else if (this.frameAvg < 1 / 57 && this.pixelRatio < this.maxPixelRatio && this.time >= this.raiseBlockedUntil) {
      next = Math.min(this.maxPixelRatio, this.pixelRatio + 0.25);
    }
    if (next === this.pixelRatio) return;
    this.pixelRatio = next;
    this.renderer.setPixelRatio(next);
    this.resize();
    this.retuneAt = this.time + 3;
  }

  /** Holds the camera still during an ending; Use moves on once it has played. */
  private updateEnding(dt: number, minimum: number, next: () => void): void {
    this.endingTime += dt;
    const input = this.input;
    if (input.usePressed && this.endingTime >= minimum) {
      // Clear first: if `next` only opens the paywall, it mustn't fire again every frame.
      input.usePressed = false;
      next();
      return;
    }
    input.usePressed = input.lightPressed = false;
    input.consumeLook();
    this.pushHud(dt);
  }

  private update(dt: number): void {
    this.time += dt;
    const input = this.input;
    if (this.state.stage === STAGE.Departed) {
      this.world.depart(this.endingTime + dt);
      this.audio.motion(Math.min(1, this.endingTime / 4));
      if (!this.phoneRang && this.endingTime >= 1.8) {
        this.audio.phone();
        this.phoneRang = true;
      }
      this.listener.body.visible = false;
      this.updateEnding(dt, MERCER_ENDING, () => this.enterBellweather());
      return;
    }
    if (this.atBell && bellComplete(this.bellBits)) {
      this.audio.proximity(0);
      this.listener.body.visible = false;
      this.updateEnding(dt, BELL_ENDING, () => this.continueFromBellweather());
      return;
    }
    if (this.extra && this.extraDone) {
      const next = this.extra.index + 1;
      this.audio.proximity(0);
      if (this.cueRumble) {
        // A train may have been passing when the stage ended: stop its rumble.
        this.cueRumble = 0;
        this.cueWarn = false;
        if (this.extra.def.departs === false) this.audio.motion(0);
      }
      if (this.extra.def.departs !== false) this.audio.motion(Math.min(1, this.endingTime / 4));
      this.showHunters(false);
      this.updateEnding(dt, EXTRA_ENDING, () => (next < EXTRA_STAGES.length ? this.enterExtra(next) : this.restart()));
      return;
    }
    if (this.extra) this.playStageCues();
    if (this.extra && this.extra.def.gateOpen(this.extraBits) && this.time >= this.nextGateChime) {
      this.audio.transferRing();
      this.nextGateChime = this.time + GATE_CHIME_EVERY;
    }
    if (this.atBell && bellGateOpen(this.bellBits) && this.time >= this.nextTransferRing) {
      this.audio.transferRing();
      this.nextTransferRing = this.time + 6;
    }

    input.sample();
    const look = input.consumeLook();
    this.yaw += look.x;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.y, -80, 80);
    const slow = input.sneak;
    const sprint = input.sprint && !slow;
    this.eye = THREE.MathUtils.lerp(this.eye, slow ? EYE_SNEAK : EYE, Math.min(1, dt * 6));

    const speed = slow ? 1.5 : sprint ? 5.1 : 3;
    const yawRad = THREE.MathUtils.degToRad(this.yaw);
    const fx = Math.sin(yawRad);
    const fz = Math.cos(yawRad);
    const mx = (fx * input.moveY + fz * input.moveX) * speed * dt;
    const mz = (fz * input.moveY - fx * input.moveX) * speed * dt;
    const before = { ...this.pos };
    if (!this.hiddenIn) {
      this.pos.x += mx;
      this.pos.z += mz;
      if (this.extra) this.extra.world.collide(this.pos);
      else resolveBody(this.world.b.solids, this.pos);
    }
    const moved = Math.hypot(this.pos.x - before.x, this.pos.z - before.z);
    this.bob += moved * (sprint ? 2.4 : 3);
    this.stride += moved;
    if (this.stride > (sprint ? 1.6 : 1.2)) {
      this.stride = 0;
      // Wading splashes: louder steps, and the hunter hears them further off.
      const wading = this.extra?.world.wet(this.pos) ?? false;
      this.audio.footstep((slow ? 0.25 : sprint ? 1.1 : 0.6) * (wading ? 1.6 : 1));
    }

    if (input.lightPressed) this.lightOn = !this.lightOn;
    // The signal lamp is brighter and hungrier than the torch.
    const drain = this.lampReady ? 0.7 : 0.45;
    this.charge = THREE.MathUtils.clamp(this.charge + dt * (this.lightOn ? -drain : 0.75), 0, 100);
    if (this.charge <= 0) this.lightOn = false;
    if (input.usePressed) {
      if (this.hiddenIn) this.leaveHiding();
      else {
        const target = this.aim();
        if (target) this.interact(target);
      }
    }
    input.usePressed = input.lightPressed = false;

    const hunting = this.hunting;
    if (hunting) {
      const moving = !this.hiddenIn && Math.hypot(input.moveX, input.moveY) > 0.2;
      const running = moving && sprint;
      const lit = this.lightOn && this.charge > 0.01;
      // In water, walking carries like running and sneaking like walking.
      const wet = moving && (this.extra?.world.wet(this.pos) ?? false);
      let caught = false;
      if (this.extra) {
        const muffled = this.extra.world.muffled();
        const forbidden = this.extra.world.forbidden();
        for (const h of this.extra.hunters) {
          h.muffled = muffled;
          h.forbidden = forbidden;
          caught = h.tick(this.pos, slow && !wet, running || (wet && !slow), dt, lit, this.hiddenIn !== null) || caught;
        }
      } else caught = this.listener.tick(this.pos, slow, running, dt);
      const struck = !caught && !!this.extra && !this.hiddenIn && this.extra.world.hazard(this.pos);
      if (!caught && !struck) this.updateBeam(dt);
      if (caught && this.perks.takeSecondWind()) {
        this.secondWind();
      } else if (caught || struck) {
        this.restorePosition();
        this.charge = Math.max(45, this.charge);
        this.caughtCount++;
        this.audio.knock();
        const lines = this.extra?.def.lines;
        this.say(
          lines ? ((struck && lines.hazard) || lines.caught) : this.atBell ? BELL_LINES.caught : LINES.caught,
          5,
        );
      } else if (this.enemy.alert && (!this.wasAlert || this.time >= this.nextKnock)) {
        this.audio.knock();
        if (!this.wasAlert && this.time >= this.captionUntil) {
          this.say(this.extra ? this.extra.def.lines.alert : LINES.alert, 3);
        }
        this.nextKnock = this.time + 1.3;
      }
      this.wasAlert = this.enemy.alert;
    }
    this.showHunters(this.hunting);
    this.audio.proximity(this.hunting ? this.danger() : 0);

    if (this.time > this.nextDrip) {
      this.audio.ambientDrip();
      this.nextDrip = this.time + 2 + Math.random() * 6;
    }
    this.pushHud(dt);
  }

  private danger(): number {
    return THREE.MathUtils.clamp(1 - (this.enemy.distance - 1) / 9, 0, 1);
  }

  private aim(): AnyTarget | null {
    if (this.aimFrame === this.frameNo) return this.aimCached;
    this.aimFrame = this.frameNo;
    this.aimCached = null;
    const candidates = this.aimCandidates;
    candidates.length = 0;
    for (const obj of this.extra ? this.extra.world.aimables : this.world.b.aimables) {
      if (shown(obj)) candidates.push(obj);
    }
    if (candidates.length === 0) return null;
    for (const [ox, oy] of AIM_SPREAD) {
      this.raycaster.setFromCamera(this.aimPoint.set(ox, oy), this.camera);
      const hit = this.raycaster.intersectObjects(candidates, false)[0];
      const target = hit?.object.userData.target as AnyTarget | undefined;
      if (target) return (this.aimCached = target);
    }
    return null;
  }

  private interact(target: AnyTarget): void {
    if (this.extra) {
      this.useExtra(target);
      return;
    }
    if (this.atBell) {
      this.useBellweather(target as GameTarget);
      return;
    }
    if (!(target in TARGET_LABELS)) return;
    const result = applyMercerTarget(this.state, target as MercerTarget);
    const changed =
      result.state.stage !== this.state.stage || result.state.foundTape !== this.state.foundTape;
    this.state = result.state;
    if (changed) {
      saveProgress(this.state);
      this.world.sync(this.state.stage);
    }
    if (result.sound === "signal") this.audio.signal();
    if (result.departed) {
      this.endingTime = 0;
      this.phoneRang = false;
      this.input.clear();
      // Face the open platform before the door slides shut.
      this.yaw = 0;
      this.pitch = 0;
    }
    this.say(result.line, result.seconds);
  }

  private useBellweather(target: GameTarget): void {
    if (target === "crossingBell") {
      if (this.time < this.bellReadyAt) {
        this.say(BELL_LINES.bellWinding, 2);
        return;
      }
      this.bellReadyAt = this.time + BELL_COOLDOWN;
      this.listener.followBell();
      this.audio.crossingBell();
      this.say(BELL_LINES.bellRung, 4);
      return;
    }
    const before = this.bellBits;
    const { bits, line } = applyBellTarget(before, target);
    if (bits !== before) {
      this.bellBits = bits;
      this.world.syncBellweather(bits);
      saveBellweather(bits);
      if (bellComplete(bits)) this.audio.liftReceiver();
      else if (bellGateOpen(bits)) {
        this.audio.transferRing();
        this.nextTransferRing = this.time + 6;
      } else this.audio.signal();
    }
    if (bellComplete(this.bellBits)) {
      this.endingTime = 0;
      this.input.clear();
    }
    if (line) this.say(line, bellComplete(this.bellBits) ? Infinity : 7);
  }

  /** Holding the signal lamp (Stage 7). */
  private get lampReady(): boolean {
    return !!this.extra?.def.canStun?.(this.extraBits);
  }

  /** Holding the lamp beam on the Listener for long enough stuns it. */
  private updateBeam(dt: number): void {
    const extra = this.extra;
    const lit = this.lightOn && this.charge > 0.01;
    if (!extra || !lit || this.hiddenIn || !this.lampReady) {
      this.beamHeld = 0;
      return;
    }
    // The nearest un-stunned hunter caught in the beam.
    const yaw = THREE.MathUtils.degToRad(this.yaw);
    let inBeam: Hunter | null = null;
    let best = Infinity;
    for (const h of extra.hunters) {
      if (h.stunned) continue;
      const dx = h.position.x - this.pos.x;
      const dz = h.position.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d <= 0.3 || d >= STUN_RANGE || d >= best) continue;
      if ((dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d <= STUN_COS) continue;
      if (segmentBlocked(this.pos, h.position, extra.world.solids)) continue;
      inBeam = h;
      best = d;
    }
    this.beamHeld = inBeam ? this.beamHeld + dt : Math.max(0, this.beamHeld - dt * 2);
    if (!inBeam || this.beamHeld < STUN_HOLD) return;
    this.beamHeld = 0;
    inBeam.stun(STUN_SECONDS);
    this.charge = Math.max(0, this.charge - STUN_COST);
    this.audio.knock();
    this.say(extra.def.lines.stun ?? "It reels back from the light.", 3);
  }

  /** Shows or hides the Listener and any twins. */
  private showHunters(visible: boolean): void {
    this.listener.body.visible = visible;
    if (this.extra) for (const h of this.extra.hunters) if (h.body) h.body.visible = visible;
  }

  /** Bells and rumble requested by the stage (e.g. Thornby's freights). */
  private playStageCues(): void {
    const cue = this.extra!.world.cue();
    if (cue.warn && !this.cueWarn) this.audio.crossingBell();
    this.cueWarn = cue.warn;
    if (Math.abs(cue.rumble - this.cueRumble) > 0.02 || (cue.rumble === 0 && this.cueRumble !== 0)) {
      this.cueRumble = cue.rumble;
      this.audio.motion(cue.rumble);
    }
  }

  private useExtra(target: string): void {
    const extra = this.extra!;
    const { def, world, hunters } = extra;
    if (target in world.hideSpots) {
      this.enterHiding(target);
      return;
    }
    if (!(target in def.labels)) return;
    const before = this.extraBits;
    const { bits, line, noisy } = def.apply(before, target);
    if (bits !== before) {
      this.extraBits = bits;
      world.sync(bits);
      saveExtra(extra.index, bits);
      if (def.gateOpen(bits) && !def.gateOpen(before)) {
        this.audio.transferRing();
        this.nextGateChime = this.time + GATE_CHIME_EVERY;
      } else if (!def.complete(bits)) this.audio.signal();
    }
    if (noisy && this.hunting && !world.muffled()) {
      // Loud actions bring the Listener to that exact spot.
      for (const h of hunters) h.hearNoise(world.noise[target] ?? this.pos);
      this.audio.knock();
    }
    if (def.complete(this.extraBits)) {
      this.endingTime = 0;
      this.input.clear();
      this.pos = { ...world.boarded };
      this.yaw = world.endYaw;
      this.pitch = 0;
    }
    this.say(line, def.complete(this.extraBits) ? Infinity : 6);
  }

  private enterHiding(spot: string): void {
    const hide = this.extra!.world.hideSpots[spot];
    this.hiddenIn = spot;
    this.pos = { ...hide.at };
    this.yaw = hide.yaw;
    this.pitch = 0;
    this.input.clear();
    this.audio.footstep(0.2);
    this.say(this.extra!.def.lines.hideLine ?? "You pull the locker shut. Hold still.", 3);
  }

  private leaveHiding(): void {
    const spot = this.hiddenIn;
    this.hiddenIn = null;
    if (!spot || !this.extra) return;
    this.pos = { ...this.extra.world.hideSpots[spot].out };
    this.audio.footstep(0.3);
    this.say(this.extra.def.lines.unhideLine ?? "You ease the locker open.", 2);
  }

  /** End of Stage 2: carry on (resuming any saved later stage), or ask for the unlock. */
  private continueFromBellweather(): void {
    if (!this.perks.fullGame()) {
      this.perks.onPaywall();
      this.lastHud = "";
      return;
    }
    const save = loadExtra();
    if (save.index >= 0 && save.index < EXTRA_STAGES.length) {
      this.audio.motion(0);
      this.loadExtraStage(save.index, save.bits);
      this.endingTime = 0;
      const lines = EXTRA_STAGES[save.index].lines;
      if (this.extraDone) this.say(lines.lastCall, Infinity);
      else this.say(save.bits ? lines.restored : lines.arrival, 6);
      this.lastHud = "";
    } else this.enterExtra(0);
  }

  /** Caught, but a Second Wind was spent: tear free where you stand. */
  private secondWind(): void {
    if (this.extra) {
      for (const h of this.extra.hunters) if (h.distance < 6) h.stun(6);
    } else this.listener.reset();
    this.charge = Math.max(45, this.charge);
    this.wasAlert = false;
    this.audio.knock();
    this.say("Second Wind. You tear free. Run.", 4);
  }

  // ------------------------------------------------------------- shop actions (called by the UI)

  /**
   * Battery refill: full charge, light on. The UI spends the item first and
   * refunds it if this returns false (already full, or during an ending).
   */
  refillBattery(): boolean {
    if (this.charge >= 99 || this.endingHud()) return false;
    this.charge = 100;
    this.lightOn = true;
    this.lastHud = "";
    return true;
  }

  /**
   * Shows where to go next. Returns false (so the UI can refund the hint)
   * when there's no hint here: during endings, or in Stages 1–2.
   */
  showHint(): boolean {
    if (!this.extra || this.extraDone) return false;
    const text = this.extra.def.hint?.(this.extraBits);
    if (!text) return false;
    this.say(text, 9);
    this.lastHud = "";
    return true;
  }

  /** Beam colour for the torch and signal lamp (cosmetic). */
  setLampColor(color: number): void {
    this.flashlight.color.set(color);
    this.dirty = true;
  }

  /** Re-check the unlock (e.g. after a purchase while the Stage 2 ending is showing). */
  refreshPerks(): void {
    this.lastHud = "";
  }

  /** Car 07 rolls on into the next stage after Bellweather. */
  private enterExtra(index: number): void {
    saveExtra(index, 0);
    this.audio.motion(0);
    this.loadExtraStage(index, 0);
    this.endingTime = 0;
    this.say(EXTRA_STAGES[index].lines.arrival, 7);
    this.lastHud = "";
  }

  /** Car 07 pulls in at the sealed junction. */
  private enterBellweather(): void {
    this.state = { ...this.state, stage: STAGE.Bellweather };
    saveProgress(this.state);
    saveBellweather(this.bellBits);
    this.audio.motion(0);
    this.showStation(true);
    this.endingTime = 0;
    this.arrivalCaption();
    this.lastHud = "";
  }

  private render(): void {
    const yawRad = THREE.MathUtils.degToRad(this.yaw);
    const bobY = Math.sin(this.bob) * 0.035;
    const bobX = Math.cos(this.bob * 0.5) * 0.02;
    this.camera.position.set(
      this.pos.x + Math.cos(yawRad) * bobX,
      this.eye + bobY,
      -this.pos.z + Math.sin(yawRad) * bobX,
    );
    this.dirty = false;
    const danger = this.hunting ? this.danger() : 0;
    const rumble = this.extra && !this.extraDone ? this.cueRumble : 0;
    const shake = this.paused ? 0 : (danger > 0.6 ? (danger - 0.6) * 0.02 : 0) + rumble * 0.012;
    this.camera.rotation.set(
      THREE.MathUtils.degToRad(-this.pitch) + (Math.random() - 0.5) * shake,
      -yawRad + (Math.random() - 0.5) * shake,
      0,
    );
    // The beam stutters when low on charge or when the Listener is close.
    const stutter = !this.paused && (this.charge < 15 || danger > 0.7) && Math.random() < 0.08;
    const lit = this.lightOn && this.charge > 0.01;
    // Dim to zero instead of toggling visibility: changing the visible light
    // count makes three.js swap shader programs, which hitches on phones.
    this.flashlight.intensity =
      lit && !stutter
        ? FLASH_INTENSITY * (this.lampReady ? 1.5 : 1) * (0.55 + 0.45 * Math.min(1, this.charge / 30))
        : 0;
    this.world.tick(this.time, danger);
    if (this.extra) {
      this.extra.world.tick(this.time, danger);
      if (this.extra.def.departs !== false) this.extra.world.depart(this.extraDone ? this.endingTime : 0);
    }
    // Narrow the view inside a locker.
    const fov = this.hiddenIn ? FOV_HIDDEN : FOV;
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov += (fov - this.camera.fov) * 0.15;
      this.camera.updateProjectionMatrix();
    }
    this.dust.tick(this.camera.position, this.time, lit);
    this.renderer.render(this.scene, this.camera);
  }

  private placeLabel(): string {
    const plan = this.atBell ? BELLWEATHER_PLAN : MERCER_PLAN;
    const tile = tileAt(plan, cellAt(this.pos.x, this.pos.z));
    if (this.extra) return this.extra.def.place(this.pos, this.enemy.alert);
    if (this.pos.z < 11) return this.atBell ? "CAR 07   /   BELLWEATHER" : "CAR 07   /   MERCER LINE";
    if (tile === "T") {
      const name = this.atBell ? "BELLWEATHER   /   SERVICE GALLERIES" : "SERVICE TUNNELS";
      return this.listener.alert ? `${name}   /   FOOTSTEPS CLOSE` : name;
    }
    return this.atBell ? "BELLWEATHER SPUR   /   JUNCTION" : "MERCER LOWER   /   PLATFORM";
  }

  private endingHud(): { place: string; label: string; ready: boolean; waiting: string; action: string } | null {
    if (this.state.stage === STAGE.Departed) {
      return {
        place: "CAR 07   /   DEPARTING",
        label: "CONTINUE",
        ready: this.endingTime >= MERCER_ENDING,
        waiting: "The last train pulls out.",
        action: "enter Bellweather Spur",
      };
    }
    if (this.atBell && bellComplete(this.bellBits)) {
      const unlocked = this.perks.fullGame();
      return {
        place: "TRANSFER 9   /   YARD NINE LINE",
        label: unlocked ? "CONTINUE" : "UNLOCK",
        ready: this.endingTime >= BELL_ENDING,
        waiting: "Transfer 9   /   End of Stage 2",
        action: unlocked ? `enter ${EXTRA_STAGES[0].name}` : "unlock Stages 3–8",
      };
    }
    if (this.extra && this.extraDone) {
      const next = EXTRA_STAGES[this.extra.index + 1];
      return {
        place: this.extra.def.ending.place,
        label: next ? "CONTINUE" : "REPLAY",
        ready: this.endingTime >= EXTRA_ENDING,
        waiting: this.extra.def.ending.waiting,
        action: next ? `enter ${next.name}` : "restart at Mercer Lower",
      };
    }
    return null;
  }

  private pushHud(dt: number): void {
    this.hudTimer -= dt;
    if (this.hudTimer > 0) return;
    this.hudTimer = 0.08;
    if (this.caption && this.time >= this.captionUntil) this.caption = "";
    const ending = this.endingHud();
    let hint = "";
    let useActive = false;
    let useLabel = "USE";
    if (ending) {
      useLabel = ending.label;
      useActive = ending.ready;
      hint = ending.ready ? "" : ending.waiting;
    } else if (this.hiddenIn) {
      useActive = true;
      hint = `${this.touch ? "USE" : "E"}  /  LEAVE LOCKER`;
    } else {
      const target = this.aim();
      const label = target && (this.extra ? this.extra.def.labels[target] : LABELS[target as GameTarget]);
      if (label) {
        useActive = true;
        hint = `${this.touch ? "USE" : "E"}  /  ${label}`;
      }
    }
    const hunting = this.hunting;
    const hud: HudState = {
      chapter: this.extra ? this.extra.def.chapter : this.atBell ? 2 : 1,
      place: ending?.place ?? this.placeLabel(),
      task: this.extra
        ? this.extra.def.objective(this.extraBits)
        : this.atBell
          ? bellObjective(this.bellBits)
          : taskFor(this.state),
      caption: this.caption,
      hint,
      useLabel,
      useActive,
      showDot: !ending,
      charge: Math.ceil(this.charge),
      lit: this.lightOn && this.charge > 0.01,
      danger: Math.round((hunting ? this.danger() : 0) * 20) / 20,
      alert: this.enemy.alert && hunting,
      caughtCount: this.caughtCount,
      ended: Boolean(ending?.ready),
      endAction: ending?.action ?? "",
      hidden: this.hiddenIn !== null,
    };
    const key = JSON.stringify(hud);
    if (key !== this.lastHud) {
      this.lastHud = key;
      this.onHud(hud);
    }
  }

  /** Clears all progress and starts again in the carriage at Mercer Lower. */
  restart(): void {
    clearProgress();
    this.unloadExtraStage();
    clearExtra();
    this.extraBits = 0;
    this.nextGateChime = 0;
    this.input.clear();
    this.state = { stage: STAGE.Power, foundTape: false };
    this.bellBits = 0;
    this.bellReadyAt = this.nextTransferRing = 0;
    this.beamHeld = 0;
    this.lightOn = true;
    this.charge = 100;
    this.phoneRang = false;
    this.endingTime = 0;
    this.audio.motion(0);
    this.showStation(false);
    this.world.sync(this.state.stage);
    this.say(LINES.wake, 6);
    this.lastHud = "";
    this.dirty = true;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.dirty = true;
    if (paused) {
      this.input.clear();
      this.audio.suspend();
      this.lastHud = "";
      this.pushHud(1);
    } else {
      this.audio.unlock();
      this.clock.getDelta();
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.resize);
    this.unloadExtraStage();
    this.listener.dispose();
    this.dust.dispose();
    this.world.dispose();
    this.audio.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
