import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { inflateSync } from 'fflate';
import type { TextureSlot } from './types';

/** What Player/Companion need from a character's visuals (procedural Humanoid or a skinned model). */
export interface CharacterVisual {
  readonly group: THREE.Object3D;
  update(dt: number, speed: number, grounded: boolean, vy: number): void;
}

/** Decode a .lwtex file (header "LWT1", width, height, deflated RGBA) into a DataTexture. */
export function decodeLwtex(buf: ArrayBuffer, slot: TextureSlot): THREE.DataTexture {
  const head = new DataView(buf, 0, 12);
  const magic = String.fromCharCode(head.getUint8(0), head.getUint8(1), head.getUint8(2), head.getUint8(3));
  if (magic !== 'LWT1') throw new Error('Not a .lwtex texture');
  const w = head.getUint32(4, true), h = head.getUint32(8, true);
  const rgba = inflateSync(new Uint8Array(buf, 12));
  const tex = new THREE.DataTexture(rgba, w, h);
  tex.flipY = false; // glTF convention
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.colorSpace = slot === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Parse a GLB (no embedded images) with three's GLTFLoader. */
export function parseGlb(buf: ArrayBuffer): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buf, '', (g) => resolve({ scene: g.scene, animations: g.animations }), reject);
  });
}

/** Apply decoded textures to the model's materials by material name. */
export function applyTextures(scene: THREE.Object3D, textures: Record<string, Partial<Record<TextureSlot, THREE.Texture>>>) {
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats as THREE.MeshStandardMaterial[]) {
      const t = textures[m.name];
      if (!t) continue;
      if (t.map) { m.map = t.map; m.color.set(0xffffff); }
      if (t.normalMap) m.normalMap = t.normalMap;
      if (t.roughnessMap) { m.roughnessMap = t.roughnessMap; m.metalnessMap = t.roughnessMap; }
      m.needsUpdate = true;
    }
  });
}

/** Clips retargeted to another Mixamo skeleton: same bone names, rotations only (heights differ). */
export function retargetClips(clips: THREE.AnimationClip[]) {
  return clips.map((c) => {
    const copy = c.clone();
    copy.tracks = copy.tracks.filter((t) => !t.name.endsWith('.position') && !t.name.endsWith('.scale'));
    return copy;
  });
}

/** m/s the Mixamo walk / run cycles are authored at (approx.); built-in clips pass their own. */
const MIXAMO_WALK_REF = 1.7, MIXAMO_RUN_REF = 4.6;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/**
 * A rigged, animated character (e.g. from Mixamo). Normalised to `height` metres with feet at y=0,
 * facing +Z. Idle / Walk / Run are blended by speed, with playback rate matched to movement.
 */
export class SkinnedCharacter implements CharacterVisual {
  readonly group = new THREE.Group();
  private readonly mixer: THREE.AnimationMixer;
  private readonly actions: Partial<Record<'idle' | 'walk' | 'run' | 'jump', THREE.AnimationAction>> = {};
  private w = { idle: 1, walk: 0, run: 0, jump: 0 };
  private wasGrounded = true;

  private readonly walkRef: number;
  private readonly runRef: number;

  constructor(model: THREE.Object3D, clips: THREE.AnimationClip[], height: number, refs: { walkRef?: number; runRef?: number } = {}) {
    this.walkRef = refs.walkRef ?? MIXAMO_WALK_REF;
    this.runRef = refs.runRef ?? MIXAMO_RUN_REF;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const k = height / (size.y || 1);
    model.scale.multiplyScalar(k);
    model.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(model);
    model.position.y -= box2.min.y;
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; }
    });
    this.group.add(model);

    this.mixer = new THREE.AnimationMixer(model);
    const find = (name: string) => clips.find((c) => c.name.toLowerCase() === name);
    for (const key of ['idle', 'walk', 'run', 'jump'] as const) {
      const clip = find(key);
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      action.setEffectiveWeight(key === 'idle' ? 1 : 0);
      if (key === 'jump') { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
      action.play();
      this.actions[key] = action;
    }
  }

  get hasAnimations() { return Object.keys(this.actions).length > 0; }

  update(dt: number, speed: number, grounded: boolean, _vy: number) {
    const run = clamp((speed - this.walkRef) / (this.runRef - this.walkRef), 0, 1);
    const moving = clamp(speed / 1.2, 0, 1);
    const jumpA = this.actions.jump;
    if (jumpA && this.wasGrounded && !grounded) jumpA.reset().play(); // take-off: play the jump once
    this.wasGrounded = grounded;
    let target = { idle: 1 - moving, walk: moving * (1 - run), run: moving * run, jump: 0 };
    if (!grounded) target = jumpA ? { idle: 0, walk: 0, run: 0, jump: 1 } : { idle: 0, walk: 0, run: 1, jump: 0 };
    const k = 1 - Math.exp(-10 * dt);
    this.w = {
      idle: this.w.idle + (target.idle - this.w.idle) * k,
      walk: this.w.walk + (target.walk - this.w.walk) * k,
      run: this.w.run + (target.run - this.w.run) * k,
      jump: this.w.jump + (target.jump - this.w.jump) * k,
    };
    const { idle, walk, run: runA } = this.actions;
    idle?.setEffectiveWeight(this.w.idle);
    jumpA?.setEffectiveWeight(this.w.jump);
    if (walk) { walk.setEffectiveWeight(this.w.walk); walk.timeScale = clamp(speed / this.walkRef, 0.6, 1.5); }
    if (runA) { runA.setEffectiveWeight(this.w.run); runA.timeScale = grounded || jumpA ? clamp(speed / this.runRef, 0.7, 1.35) : 0.15; }
    this.mixer.update(dt);
  }
}
