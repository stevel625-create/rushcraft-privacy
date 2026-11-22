import * as THREE from 'three';

/**
 * Small CPU particle emitter (fire, smoke, sparks) drawn as soft round point sprites by a tiny shader,
 * so it needs no textures. ~100-200 particles per emitter is cheap on phones.
 */
export interface EmitterOptions {
  max: number;
  rate: number;            // particles per second
  life: [number, number];  // seconds
  speed: [number, number]; // initial upward speed
  spread: number;          // horizontal speed / spawn jitter
  radius: number;          // spawn radius
  size: [number, number];  // world size at birth / death
  colorStart: number;
  colorEnd: number;
  alpha: number;
  additive: boolean;
  gravity?: number;
  wind?: { x: number; z: number };
}

const vertexShader = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
uniform float uScale;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const fragmentShader = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d) * 4.0;
  if (r > 1.0) discard;
  float soft = (1.0 - r) * (1.0 - r);
  gl_FragColor = vec4(vColor, vAlpha * soft);
}`;

export class ParticleEmitter {
  readonly points: THREE.Points;
  readonly origin = new THREE.Vector3();
  active = true;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly size: Float32Array;
  private readonly alpha: Float32Array;
  private readonly color: Float32Array;
  private readonly c0: THREE.Color;
  private readonly c1: THREE.Color;
  private readonly material: THREE.ShaderMaterial;
  private carry = 0;
  private next = 0;
  private rng = 1;

  constructor(private o: EmitterOptions) {
    const n = o.max;
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.age = new Float32Array(n).fill(1e9);
    this.life = new Float32Array(n).fill(1);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.color = new Float32Array(n * 3);
    this.c0 = new THREE.Color(o.colorStart);
    this.c1 = new THREE.Color(o.colorEnd);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.color, 3));
    this.material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthWrite: false, fog: false,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uScale: { value: 600 } },
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = o.additive ? 3 : 2;
  }

  /** Point size scale: viewport height in pixels (keeps sizes in world units). */
  setViewportHeight(px: number) {
    this.material.uniforms.uScale.value = px * 0.9;
  }

  private rand() {
    this.rng = (this.rng * 16807) % 2147483647;
    return this.rng / 2147483647;
  }

  update(dt: number) {
    const o = this.o;
    if (this.active) {
      this.carry += o.rate * dt;
      while (this.carry >= 1) { this.carry -= 1; this.spawn(); }
    }
    const g = o.gravity ?? 0, wx = o.wind?.x ?? 0, wz = o.wind?.z ?? 0;
    for (let i = 0; i < o.max; i++) {
      const a = (this.age[i] += dt);
      const k = a / this.life[i];
      if (k >= 1) { this.alpha[i] = 0; this.size[i] = 0; continue; }
      const j = i * 3;
      this.vel[j] += wx * dt; this.vel[j + 1] += g * dt; this.vel[j + 2] += wz * dt;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      this.size[i] = o.size[0] + (o.size[1] - o.size[0]) * k;
      this.alpha[i] = o.alpha * Math.min(1, k * 6) * (1 - k);
      this.color[j] = this.c0.r + (this.c1.r - this.c0.r) * k;
      this.color[j + 1] = this.c0.g + (this.c1.g - this.c0.g) * k;
      this.color[j + 2] = this.c0.b + (this.c1.b - this.c0.b) * k;
    }
    const geo = this.points.geometry;
    (['position', 'aSize', 'aAlpha', 'aColor'] as const).forEach((n) => { geo.attributes[n].needsUpdate = true; });
  }

  private spawn() {
    const o = this.o, i = this.next;
    this.next = (this.next + 1) % o.max;
    const j = i * 3, a = this.rand() * Math.PI * 2, r = Math.sqrt(this.rand()) * o.radius;
    this.pos[j] = this.origin.x + Math.cos(a) * r;
    this.pos[j + 1] = this.origin.y;
    this.pos[j + 2] = this.origin.z + Math.sin(a) * r;
    this.vel[j] = (this.rand() - 0.5) * o.spread;
    this.vel[j + 1] = o.speed[0] + this.rand() * (o.speed[1] - o.speed[0]);
    this.vel[j + 2] = (this.rand() - 0.5) * o.spread;
    this.age[i] = 0;
    this.life[i] = o.life[0] + this.rand() * (o.life[1] - o.life[0]);
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

export const FIRE: EmitterOptions = {
  max: 90, rate: 55, life: [0.5, 1.1], speed: [1.2, 2.6], spread: 0.6, radius: 0.5, size: [0.9, 0.2],
  colorStart: 0xffc04a, colorEnd: 0xd2300a, alpha: 0.9, additive: true, wind: { x: 0.3, z: 0.1 },
};

export const SMOKE: EmitterOptions = {
  max: 110, rate: 22, life: [3, 5], speed: [1.2, 2.0], spread: 0.5, radius: 0.6, size: [1.0, 4.5],
  colorStart: 0x3a3532, colorEnd: 0x8e8a86, alpha: 0.55, additive: false, wind: { x: 0.6, z: 0.25 },
};
