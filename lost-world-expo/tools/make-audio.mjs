#!/usr/bin/env node
/**
 * Synthesises the game's placeholder sound effects and ambience as 16-bit mono WAV files in
 * assets/audio/. Everything is generated from oscillators and noise (original work, no licences).
 * Replace any file with a final recording of the same name; nothing else needs to change.
 *
 *   node tools/make-audio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const RATE = 22050;
const OUT = path.resolve('assets/audio');
fs.mkdirSync(OUT, { recursive: true });

// Deterministic noise so regenerating gives identical files.
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296) * 2 - 1;

function render(seconds, fn) {
  const n = Math.round(seconds * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / RATE, i);
  return out;
}

/** Crossfade the tail into the head so the file loops without a click. */
function loopify(buf, fade = 0.25) {
  const f = Math.round(fade * RATE);
  const n = buf.length - f;
  const out = buf.slice(0, n);
  for (let i = 0; i < f; i++) {
    const k = i / f;
    out[i] = out[i] * k + buf[n + i] * (1 - k);
  }
  return out;
}

/** One-pole low-pass filter (in place), cutoff in Hz. */
function lowpass(buf, hz) {
  const a = Math.exp(-2 * Math.PI * hz / RATE);
  let y = 0;
  for (let i = 0; i < buf.length; i++) buf[i] = y = (1 - a) * buf[i] + a * y;
  return buf;
}
function highpass(buf, hz) {
  const lp = lowpass(Float32Array.from(buf), hz);
  for (let i = 0; i < buf.length; i++) buf[i] -= lp[i];
  return buf;
}

function normalize(buf, peak = 0.85) {
  let m = 0;
  for (const v of buf) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < buf.length; i++) buf[i] *= peak / m;
  return buf;
}

function writeWav(name, buf) {
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([h, data]));
  console.log(`${name}.wav  ${(buf.length / RATE).toFixed(1)} s  ${((44 + data.length) / 1024).toFixed(0)} KB`);
}

const TAU = Math.PI * 2;
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// Twin-prop engine: rough harmonic drone with propeller beating.
const engineNoise = lowpass(render(3.25, () => rnd()), 500);
writeWav('engine', normalize(loopify(render(3.25, (t, i) => {
  const f = 82;
  const saw = [1, 2, 3, 4, 6].reduce((s, h) => s + Math.sin(TAU * f * h * t + h) / h, 0);
  const beat = 0.75 + 0.25 * Math.sin(TAU * 13.3 * t);
  return (saw * 0.5 + engineNoise[i] * 1.6) * beat;
})), 0.6));

// Cockpit alarm: alternating two-tone beeps.
writeWav('alarm', normalize(render(1.2, (t) => {
  const on = (t % 0.3) < 0.22;
  const f = Math.floor(t / 0.3) % 2 ? 660 : 880;
  return on ? Math.sign(Math.sin(TAU * f * t)) * 0.4 + Math.sin(TAU * f * t) * 0.3 : 0;
}), 0.55));

// Crash: deep boom, debris noise, metallic clangs.
const crashNoise = lowpass(render(3.5, () => rnd()), 1800);
writeWav('crash', normalize(render(3.5, (t, i) => {
  const boom = Math.sin(TAU * (48 - 20 * t) * t) * env(t, 0.01, 0.6) * 1.4;
  const debris = crashNoise[i] * env(t, 0.005, 0.9);
  const clang = [311, 517, 743, 1103].reduce((s, f, k) => s + Math.sin(TAU * f * t + k) * env(Math.max(0, t - 0.12 * k), 0.002, 0.25 + 0.1 * k), 0) * 0.35;
  return boom + debris + clang;
})));

// Fire crackle loop.
writeWav('fire', normalize(loopify(render(2.25, (t) => {
  const roar = rnd() * 0.25;
  const crack = (rnd() + 1) / 2 < 0.0009 ? 1 : 0;
  return roar + crack * rnd() * 3;
}), 0.2), 0.5));

// Wind loop: slowly swelling filtered noise.
const windRaw = lowpass(lowpass(render(4.25, () => rnd()), 700), 900);
writeWav('wind', normalize(loopify(windRaw.map((v, i) => v * (0.6 + 0.4 * Math.sin(TAU * (i / RATE) / 4.0)))), 0.6));

// Jungle ambience: leafy hiss, insect trill, bird chirps.
const leaves = highpass(lowpass(render(8.25, () => rnd()), 2500), 400);
const birds = [0.6, 1.9, 3.1, 4.4, 5.8, 6.9];
writeWav('jungle', normalize(loopify(render(8.25, (t, i) => {
  let v = leaves[i] * 0.25;
  v += Math.sin(TAU * 4200 * t) * (0.5 + 0.5 * Math.sin(TAU * 38 * t)) * 0.03; // insects
  for (const b of birds) {
    const dt = t - b;
    if (dt > 0 && dt < 0.45) {
      const chirp = Math.sin(TAU * (2400 + 900 * Math.sin(TAU * 7 * dt)) * dt);
      v += chirp * Math.sin(Math.PI * dt / 0.45) * 0.35 * ((dt * 9) % 1 < 0.6 ? 1 : 0.2);
    }
  }
  return v;
})), 0.5));

// Cave: low drone with water drips.
const drips = [0.7, 2.2, 3.4, 4.9];
writeWav('cave', normalize(loopify(render(6.25, (t) => {
  let v = Math.sin(TAU * 55 * t) * 0.15 + Math.sin(TAU * 82.5 * t) * 0.08 + rnd() * 0.02;
  for (const d of drips) { const dt = t - d; if (dt > 0 && dt < 0.3) v += Math.sin(TAU * (1400 - 2600 * dt) * dt) * Math.exp(-dt * 18) * 0.6; }
  return v;
})), 0.5));

// Lava: rumble and bubbling.
const rumble = lowpass(lowpass(render(5.25, () => rnd()), 120), 160);
writeWav('lava', normalize(loopify(render(5.25, (t, i) => {
  let v = rumble[i] * 3;
  const bub = (t * 3.3) % 1;
  if (bub < 0.08) v += Math.sin(TAU * (180 + 900 * bub) * bub) * 0.4;
  return v;
})), 0.6));

// Temple: hollow choir-like pad.
writeWav('temple', normalize(loopify(render(6.25, (t) => {
  const pad = [110, 165, 220, 277.2].reduce((s, f, k) => s + Math.sin(TAU * f * t + Math.sin(TAU * 0.2 * t + k)) / (k + 1), 0);
  return pad * (0.7 + 0.3 * Math.sin(TAU * t / 6.25)) * 0.4 + rnd() * 0.01;
})), 0.45));

// Pickup chime: quick rising arpeggio.
writeWav('pickup', normalize(render(0.7, (t) => [880, 1108.7, 1318.5].reduce((s, f, k) => s + Math.sin(TAU * f * t) * env(Math.max(0, t - k * 0.07), 0.005, 0.18) * (t >= k * 0.07 ? 1 : 0), 0)), 0.6));

// Stone door grinding.
const grind = lowpass(render(1.8, () => rnd()), 300);
writeWav('door', normalize(grind.map((v, i) => { const t = i / RATE; return v * (0.7 + 0.3 * Math.sin(TAU * 9 * t)) * Math.min(1, t * 4) * Math.min(1, (1.8 - t) * 3); }), 0.7));

// Gong: inharmonic partials with a long decay.
writeWav('gong', normalize(render(4, (t) => [98, 153, 241, 317, 486].reduce((s, f, k) => s + Math.sin(TAU * f * t * (1 + 0.002 * Math.sin(TAU * 3 * t))) * env(t, 0.004, 2.2 - 0.3 * k) / (k + 1), 0))));

// Splash: bright noise burst.
const splashRaw = highpass(render(0.9, () => rnd()), 900);
writeWav('splash', normalize(splashRaw.map((v, i) => v * env(i / RATE, 0.01, 0.22)), 0.6));

// UI tap.
writeWav('ui', normalize(render(0.07, (t) => Math.sin(TAU * 1500 * t) * env(t, 0.002, 0.02)), 0.4));
