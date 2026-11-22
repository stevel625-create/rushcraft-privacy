/**
 * Pure-JavaScript FBX -> GLB conversion for Mixamo downloads (no native tools needed).
 * Uses three.js's FBXLoader and GLTFExporter in Node, with tiny shims for the browser APIs they expect.
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolveObjectURL } from 'node:buffer';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter's binary output reads Blobs through FileReader, which Node lacks.
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.(); }); }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((b) => {
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(b).toString('base64')}`;
        this.onloadend?.(); this.onload?.();
      });
    }
  };
}

// FBXLoader turns embedded images into blob: URLs and loads them with TextureLoader (needs a DOM).
// Instead, remember the URL so the bytes can be pulled out afterwards.
THREE.TextureLoader.prototype.load = function load(url) {
  const t = new THREE.Texture();
  t.userData.sourceUrl = url;
  return t;
};

async function textureBytes(tex, baseDir) {
  const url = tex?.userData?.sourceUrl;
  if (!url) return null;
  if (url.startsWith('blob:')) {
    const blob = resolveObjectURL(url);
    return blob ? Buffer.from(await blob.arrayBuffer()) : null;
  }
  // External texture referenced by file name (FBX exported without embedded media).
  const candidates = [url, path.join(baseDir, path.basename(url)), path.join(baseDir, 'textures', path.basename(url))];
  const found = candidates.find((c) => fs.existsSync(c));
  return found ? fs.readFileSync(found) : null;
}

function readFbx(file) {
  const buf = fs.readFileSync(file);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new FBXLoader().parse(ab, path.dirname(file) + '/');
}

/** Keep animations in place: drop horizontal root motion on the hips (keeps the vertical bob). */
function inPlace(clip) {
  for (const t of clip.tracks) {
    if (!/hips\.position$/i.test(t.name)) continue;
    const v = t.values;
    const x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
  return clip;
}

/** Map a Mixamo file name to one of our animation slots. */
export function animationSlot(fileName) {
  const n = fileName.toLowerCase();
  if (n.includes('idle')) return 'idle';
  if (n.includes('walk')) return 'walk';
  if (n.includes('run') || n.includes('jog') || n.includes('sprint')) return 'run';
  if (n.includes('jump')) return 'jump';
  return null;
}

/**
 * Convert a character FBX (with skin) plus animation FBXs into a GLB (no images) and the textures'
 * raw bytes per material. Returns { glb: ArrayBuffer, textures: { [material]: { map?, normalMap? } }, clips }.
 */
export async function convertFbxCharacter(characterFile, animationFiles) {
  const baseDir = path.dirname(characterFile);
  const model = readFbx(characterFile);
  const clips = [];
  for (const f of animationFiles) {
    const slot = animationSlot(path.basename(f));
    const anim = readFbx(f).animations[0];
    if (!slot || !anim) continue;
    anim.name = slot;
    clips.push(inPlace(anim));
  }

  // Swap the FBX's Phong materials for PBR materials and collect their textures' bytes.
  const textures = {};
  const swapped = new Map();
  let unnamed = 0;
  const swap = async (m) => {
    if (swapped.has(m)) return swapped.get(m);
    const name = (m.name || `material${unnamed++}`).replace(/[^\w-]+/g, '_');
    const std = new THREE.MeshStandardMaterial({ name, color: m.map ? 0xffffff : (m.color ?? 0xcccccc), roughness: 0.75, metalness: 0 });
    const slots = {};
    const map = await textureBytes(m.map, baseDir);
    const normal = await textureBytes(m.normalMap, baseDir);
    if (map) slots.map = map;
    if (normal) slots.normalMap = normal;
    textures[name] = slots;
    swapped.set(m, std);
    return std;
  };
  const meshes = [];
  model.traverse((o) => { if (o.isMesh) meshes.push(o); });
  for (const mesh of meshes) {
    mesh.material = Array.isArray(mesh.material) ? await Promise.all(mesh.material.map(swap)) : await swap(mesh.material);
  }

  const glb = await new GLTFExporter().parseAsync(model, { binary: true, animations: clips, onlyVisible: false });
  return { glb, textures, clips: clips.map((c) => c.name) };
}
