import * as THREE from 'three';

/**
 * Procedural, seamlessly tiling textures generated in code (no image files: nothing for Expo Go to
 * fail to decode). Albedo textures are mostly neutral detail that multiplies the material colour,
 * so level code keeps choosing colours while surfaces gain grain, cracks, mortar and blades.
 */

export type Surface = 'grass' | 'dirt' | 'rock' | 'bark' | 'stone' | 'wood' | 'metal' | 'leaf' | 'plain' | 'water' | 'lava' | 'cloth' | 'skin';

const SIZE = 256;

// ---------------------------------------------------------------- tileable value noise

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Value noise with period `p` lattice cells (tiles seamlessly). */
function noise(x: number, y: number, p: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const m = (a: number) => ((a % p) + p) % p;
  const a = hash(m(xi), m(yi), seed), b = hash(m(xi + 1), m(yi), seed);
  const c = hash(m(xi), m(yi + 1), seed), d = hash(m(xi + 1), m(yi + 1), seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractal noise in [0,1], tileable over the unit square. sx/sy stretch the base frequency. */
function fbm(u: number, v: number, base: number, octaves: number, seed: number, sx = 1, sy = 1) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const fx = base * sx * (1 << o), fy = base * sy * (1 << o);
    sum += amp * noise(u * fx, v * fy, fx, seed + o * 17) ;
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

type Pixel = (u: number, v: number) => [number, number, number];

function makeTexture(pixel: Pixel, color = true, size = SIZE): { tex: THREE.DataTexture; height: Float32Array } {
  const data = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const i = (y * size + x) * 4;
      data[i] = Math.round(clamp01(r) * 255);
      data[i + 1] = Math.round(clamp01(g) * 255);
      data[i + 2] = Math.round(clamp01(b) * 255);
      data[i + 3] = 255;
      height[y * size + x] = (r + g + b) / 3;
    }
  const tex = new THREE.DataTexture(data, size, size);
  finish(tex, color);
  return { tex, height };
}

function finish(tex: THREE.DataTexture, color: boolean) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8; // clamped to what the GPU supports; keeps ground sharp at grazing angles
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
}

/** Tangent-space normal map from a tileable height field. */
function normalFrom(height: Float32Array, strength: number, size = SIZE) {
  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = Math.round((-dx / len * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, size, size);
  finish(tex, false);
  return tex;
}

// ---------------------------------------------------------------- surfaces

const grey = (k: number): [number, number, number] => [k, k, k];

const generators: Record<Exclude<Surface, 'plain'>, { pixel: Pixel; normal: number }> = {
  grass: {
    pixel: (u, v) => {
      const patches = fbm(u, v, 4, 4, 11);
      const blades = fbm(u, v, 24, 2, 12, 1, 0.6);
      const k = 0.7 + patches * 0.22 + blades * 0.1;
      return [k * (0.92 + patches * 0.1), k, k * (0.85 + blades * 0.1)];
    },
    normal: 1.5,
  },
  dirt: {
    pixel: (u, v) => {
      const base = fbm(u, v, 6, 5, 21);
      const pebble = noise(u * 48, v * 48, 48, 22);
      const k = 0.62 + base * 0.3 + (pebble > 0.82 ? 0.15 : 0) - (pebble < 0.12 ? 0.12 : 0);
      return [k * 1.02, k, k * 0.94];
    },
    normal: 3,
  },
  rock: {
    pixel: (u, v) => {
      const n = fbm(u, v, 4, 6, 31);
      const ridge = 1 - Math.abs(fbm(u, v, 3, 4, 32) * 2 - 1);
      const crack = ridge > 0.95 ? -0.12 : 0;
      return grey(0.55 + n * 0.4 + crack);
    },
    normal: 5,
  },
  bark: {
    pixel: (u, v) => {
      const lines = fbm(u, v, 12, 4, 41, 1, 0.12);
      const groove = lines < 0.42 ? -0.22 : 0;
      const k = 0.6 + lines * 0.35 + groove;
      return [k, k * 0.95, k * 0.9];
    },
    normal: 6,
  },
  stone: {
    pixel: (u, v) => {
      // Staggered stone blocks with mortar.
      const rows = 4, cols = 2;
      const row = Math.floor(v * rows);
      const uu = u * cols + (row % 2) * 0.5;
      const fu = uu - Math.floor(uu), fv = v * rows - row;
      const mortar = fu < 0.03 || fu > 0.97 || fv < 0.05 || fv > 0.95;
      const blockTint = hash(Math.floor(uu) % cols, row, 51) * 0.15;
      const n = fbm(u, v, 8, 5, 52);
      return grey(mortar ? 0.42 + n * 0.1 : 0.7 + n * 0.25 + blockTint);
    },
    normal: 5,
  },
  wood: {
    pixel: (u, v) => {
      const plank = Math.floor(u * 4);
      const fu = u * 4 - plank;
      const gap = fu < 0.04 ? -0.3 : 0;
      const grain = fbm(u, v, 16, 3, 61 + plank, 0.15, 1);
      const k = 0.62 + grain * 0.32 + gap + hash(plank, 0, 62) * 0.08;
      return [k, k * 0.93, k * 0.85];
    },
    normal: 3,
  },
  metal: {
    pixel: (u, v) => {
      const brushed = fbm(u, v, 64, 2, 71, 0.05, 1) * 0.12;
      const rust = fbm(u, v, 5, 5, 72);
      const r = rust > 0.62 ? (rust - 0.62) * 2.5 : 0;
      const k = 0.78 + brushed - r * 0.2;
      return [k + r * 0.35, k - r * 0.05, k - r * 0.3];
    },
    normal: 1.5,
  },
  leaf: {
    pixel: (u, v) => {
      const n = fbm(u, v, 10, 4, 81);
      const spots = noise(u * 40, v * 40, 40, 82);
      const k = 0.62 + n * 0.35 + (spots > 0.8 ? 0.1 : 0);
      return [k * 0.95, k, k * 0.9];
    },
    normal: 3,
  },
  water: {
    pixel: (u, v) => grey(0.8 + fbm(u, v, 6, 4, 91) * 0.2),
    normal: 2.5,
  },
  lava: {
    pixel: (u, v) => {
      const n = fbm(u, v, 5, 5, 101);
      const hot = Math.pow(n, 2.2) * 1.6;
      return [0.55 + hot * 0.45, 0.18 + hot * 0.6, 0.05 + hot * 0.2];
    },
    normal: 2,
  },
  cloth: {
    pixel: (u, v) => {
      const weave = (Math.sin(u * SIZE * 1.6) * Math.sin(v * SIZE * 1.6)) * 0.04;
      return grey(0.86 + weave + fbm(u, v, 8, 3, 111) * 0.12);
    },
    normal: 1,
  },
  skin: {
    pixel: (u, v) => grey(0.92 + fbm(u, v, 12, 3, 121) * 0.08),
    normal: 0.5,
  },
};

export interface SurfaceMaps {
  map: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  /** Metres of world covered by one texture tile. */
  tile: number;
  roughness: number;
  metalness: number;
}

const tileSize: Partial<Record<Surface, number>> = { grass: 4, dirt: 3, rock: 3, stone: 3, wood: 2, bark: 1.5, metal: 2, leaf: 2, water: 6, lava: 8 };
const roughness: Partial<Record<Surface, number>> = { metal: 0.45, water: 0.08, lava: 0.6, leaf: 0.75, skin: 0.6 };
const metalness: Partial<Record<Surface, number>> = { metal: 0.35 };

const cache = new Map<Surface, SurfaceMaps>();

/** Shared maps per surface (generated on first use, then reused by every level). */
export function surfaceMaps(s: Surface): SurfaceMaps {
  let m = cache.get(s);
  if (m) return m;
  if (s === 'plain') {
    m = { map: null, normalMap: null, tile: 1, roughness: 0.85, metalness: 0 };
  } else {
    const g = generators[s];
    const { tex, height } = makeTexture(g.pixel);
    m = { map: tex, normalMap: normalFrom(height, g.normal), tile: tileSize[s] ?? 2, roughness: roughness[s] ?? 0.9, metalness: metalness[s] ?? 0 };
  }
  cache.set(s, m);
  return m;
}

/** Alpha texture for grass/fern cards: tapered blades on transparent background. */
let bladeTexture: THREE.DataTexture | null = null;
export function grassBlades(): THREE.DataTexture {
  if (bladeTexture) return bladeTexture;
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const blades = 14;
  for (let b = 0; b < blades; b++) {
    const x0 = hash(b, 1, 131) * size;
    const lean = (hash(b, 2, 132) - 0.5) * 30;
    const h = size * (0.55 + hash(b, 3, 133) * 0.45);
    const w = 3 + hash(b, 4, 134) * 3;
    const shade = 0.65 + hash(b, 5, 135) * 0.35;
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const cx = x0 + lean * t * t;
      const half = w * (1 - t);
      for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
        if (x < 0 || x >= size) continue;
        const i = (y * size + x) * 4; // DataTexture row 0 = v 0 = bottom: blade bases sit on the ground
        const k = Math.round(255 * shade * (0.75 + 0.25 * t));
        data[i] = k; data[i + 1] = k; data[i + 2] = k; data[i + 3] = 255;
      }
    }
  }
  bladeTexture = new THREE.DataTexture(data, size, size);
  bladeTexture.magFilter = THREE.LinearFilter;
  bladeTexture.minFilter = THREE.LinearMipmapLinearFilter;
  bladeTexture.generateMipmaps = true;
  bladeTexture.colorSpace = THREE.SRGBColorSpace;
  bladeTexture.needsUpdate = true;
  return bladeTexture;
}
