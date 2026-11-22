#!/usr/bin/env node
/**
 * Prepare character models for The Lost World in Expo Go.
 *
 *   node tools/prepare-models.mjs jason ~/Downloads/jason elena ~/Downloads/elena
 *
 * Each input is either a .glb file, or a folder of Mixamo FBX downloads: one character file
 * ("With Skin") plus animation files whose names contain idle / walk / run / jump ("Without Skin",
 * "In Place" ticked). FBX is converted in pure JavaScript (tools/fbx.mjs).
 *
 * three.js can't decode JPEG/PNG textures inside Expo Go, so each texture is decoded here,
 * resized, and stored as deflate-compressed raw RGBA (.lwtex). The model is re-saved without
 * images (geometry, skeleton, animations only). Output goes to assets/models/ (git-ignored:
 * Mixamo assets may be used in your game but not redistributed as standalone files), together
 * with assets/models/index.js, which Metro uses when it exists (see metro.config.js).
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, metalRough, prune, weld } from '@gltf-transform/functions';
import { animationSlot, convertFbxCharacter } from './fbx.mjs';
import { deflateSync } from 'fflate';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve('assets/models');
const MAX_TEX = 1024;
const KEEP_ANIMS = new Set(['Idle', 'Walk', 'Run', 'idle', 'walk', 'run', 'jump']);

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error('usage: node tools/prepare-models.mjs <name> <file.glb> [<name> <file.glb> ...]');
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const manifest = {};

async function encodeTexture(texture, file, { invertGreen = false, max = MAX_TEX } = {}) {
  const bytes = Buffer.isBuffer(texture) ? texture : Buffer.from(texture.getImage());
  let img = sharp(bytes).ensureAlpha();
  const meta = await img.metadata();
  const scale = Math.min(1, max / Math.max(meta.width, meta.height));
  const w = Math.round(meta.width * scale), h = Math.round(meta.height * scale);
  if (scale < 1) img = img.resize(w, h);
  const raw = new Uint8Array(await img.raw().toBuffer());
  if (invertGreen) for (let i = 1; i < raw.length; i += 4) raw[i] = 255 - raw[i];
  const header = new Uint8Array(12);
  const dv = new DataView(header.buffer);
  header.set([76, 87, 84, 49]); // "LWT1"
  dv.setUint32(4, w, true);
  dv.setUint32(8, h, true);
  const body = deflateSync(raw, { level: 6 });
  fs.writeFileSync(path.join(OUT, file), Buffer.concat([header, body]));
  return { w, h, bytes: 12 + body.length };
}

for (let a = 0; a < args.length; a += 2) {
  const name = args[a], src = args[a + 1];
  let doc;
  let fbxTextures = null; // FBX path: textures come out of the converter as raw image bytes
  if (fs.statSync(src).isDirectory()) {
    const files = fs.readdirSync(src).filter((f) => f.toLowerCase().endsWith('.fbx')).map((f) => path.join(src, f));
    const anims = files.filter((f) => animationSlot(path.basename(f)));
    const character = files.find((f) => !anims.includes(f)) ?? files[0];
    if (!character) { console.error(`${src}: no .fbx files`); process.exit(1); }
    console.log(`${name}: character ${path.basename(character)}, animations ${anims.map((f) => path.basename(f)).join(', ') || 'none'}`);
    const converted = await convertFbxCharacter(character, anims);
    doc = await io.readBinary(new Uint8Array(converted.glb));
    fbxTextures = converted.textures;
    await doc.transform(weld(), dedup());
  } else {
    doc = await io.read(src);
  }
  // Spec/gloss materials (older Mixamo exports) -> metal/rough, which three.js supports.
  await doc.transform(metalRough());
  const root = doc.getRoot();
  const materials = {};
  const written = new Map(); // texture -> file, so textures shared by materials are stored once

  for (const mat of root.listMaterials()) {
    const slots = {};
    const add = async (slot, tex, opts) => {
      if (!tex) return;
      if (written.has(tex)) { slots[slot] = written.get(tex); return; }
      const file = `${name}.${mat.getName().replace(/[^\w-]+/g, '_')}.${slot}.lwtex`;
      const info = await encodeTexture(tex, file, opts);
      written.set(tex, file);
      slots[slot] = file;
      console.log(`  ${name}/${mat.getName()} ${slot}: ${info.w}x${info.h} -> ${(info.bytes / 1024).toFixed(0)} KB`);
    };
    const fbx = fbxTextures?.[mat.getName()];
    await add('map', fbx ? fbx.map : mat.getBaseColorTexture());
    await add('normalMap', fbx ? fbx.normalMap : mat.getNormalTexture(), { max: 512 });
    await add('roughnessMap', mat.getMetallicRoughnessTexture());
    mat.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null)
      .setOcclusionTexture(null).setEmissiveTexture(null);
    materials[mat.getName()] = slots;
  }
  for (const anim of root.listAnimations()) if (!KEEP_ANIMS.has(anim.getName())) anim.dispose();
  for (const tex of root.listTextures()) tex.dispose();
  await doc.transform(prune());

  const glbFile = `${name}.glb`;
  fs.writeFileSync(path.join(OUT, glbFile), await io.writeBinary(doc));
  manifest[name] = { glb: glbFile, materials, animations: root.listAnimations().map((x) => x.getName()) };
  console.log(`${name}: ${glbFile}, animations: ${manifest[name].animations.join(', ') || 'none'}`);
}

// index.js with static require() calls so Metro bundles every file.
const req = (f) => `require('./${f}')`;
const lines = Object.entries(manifest).map(([name, m]) => {
  const mats = Object.entries(m.materials).map(([mat, slots]) =>
    `      ${JSON.stringify(mat)}: { ${Object.entries(slots).map(([s, f]) => `${s}: ${req(f)}`).join(', ')} },`).join('\n');
  return `  ${name}: {\n    glb: ${req(m.glb)},\n    animations: ${JSON.stringify(m.animations)},\n    materials: {\n${mats}\n    },\n  },`;
});
fs.writeFileSync(path.join(OUT, 'index.js'),
  `// Generated by tools/prepare-models.mjs. Do not edit.\nmodule.exports = {\n${lines.join('\n')}\n};\n`);
console.log(`wrote ${path.join(OUT, 'index.js')}`);
