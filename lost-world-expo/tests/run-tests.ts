/* Headless test suite: physics unit checks, level build checks, and full autopilot playthroughs. Run: npm test */
import { Game } from '../src/engine/game';
import { CharacterBody, Physics, v3 } from '../src/engine/physics';
import { LEVELS } from '../src/levels';
import { CAVE_MAP, cellPos } from '../src/levels/level4Caves';
import { SUMMIT_Y } from '../src/levels/level5Peak';
import { runAutopilot, type Step } from './autopilot';
import { InputState } from '../src/engine/input';
import { TouchController } from '../src/ui/touchController';
import { createRenderer, filterPixelStore, withWebGL1GlobalHidden, type GLLike } from '../src/ui/renderer';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { SkinnedCharacter, applyTextures, decodeLwtex, parseGlb, retargetClips } from '../src/models/skinnedCharacter';
import type { TextureSlot } from '../src/models/types';

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
  if (!ok) failures++;
}

// ------------------------------------------------------------ physics units

{
  const ph = new Physics();
  ph.addBox(v3(0, -0.5, 0), v3(20, 1, 20)); // floor top 0
  for (let i = 1; i <= 5; i++) ph.addBox(v3(0, i * 0.3 - 0.15, 2 + i), v3(4, 0.3, 1)); // stairs, 0.3 rise
  ph.addBox(v3(0, 0.75, 9), v3(4, 1.5, 3)); // landing at the top
  const b = new CharacterBody(v3(0, 0, 0));
  for (let k = 0; k < 600 && b.pos.z < 8.5; k++) b.step(ph, 0, 3.2, 1 / 60);
  check('stairs: 0.3 m steps are climbable', b.pos.z >= 8.5 && b.pos.y > 1.4, `y=${b.pos.y.toFixed(2)} z=${b.pos.z.toFixed(2)}`);

  const ph2 = new Physics();
  ph2.addBox(v3(0, -0.5, 0), v3(20, 1, 20));
  ph2.addBox(v3(0, 1, 3), v3(30, 2, 1), 0.3); // long rotated wall (character slides along it but can't pass)
  const w = new CharacterBody(v3(0, 0, 0));
  for (let k = 0; k < 180; k++) w.step(ph2, 0, 4, 1 / 60);
  // Position in the wall's frame: the near face is at lz = -0.5, so the body must stay at lz <= -0.85.
  const lz = w.pos.x * Math.sin(0.3) + (w.pos.z - 3) * Math.cos(0.3);
  check('walls: rotated box stops the character (slides along it)', lz <= -0.84, `lz=${lz.toFixed(3)}`);

  const ph3 = new Physics();
  ph3.addRamp(v3(0, 0, 0), v3(0, 2, 10), 2);
  check('ramp: surface height interpolates', Math.abs(ph3.surfaceAt(0, 5, 5) - 1) < 1e-6);
}

// ------------------------------------------------------------ frame rate independence and touch
{
  const a = new Game(); a.loadLevel(5);
  const b = new Game(); b.loadLevel(5);
  a.input.worldMove = { x: 0, z: 1 }; b.input.worldMove = { x: 0, z: 1 };
  for (let k = 0; k < 60; k++) a.update(1 / 60); // 1 s at 60 fps
  for (let k = 0; k < 10; k++) b.update(1 / 10); // 1 s at 10 fps
  const da = a.player.body.pos.z, db = b.player.body.pos.z;
  check('slow frames still play in real time (sub-stepping)', Math.abs(da - db) < 0.3, `60fps z=${da.toFixed(2)} 10fps z=${db.toFixed(2)}`);
}
{
  const input = new InputState();
  const t = new TouchController(input);
  t.stickStart(150, 300);           // left thumb down
  t.stickMove(150, 230);            // push up (forward), full deflection
  t.press('jump');                  // right thumb taps JUMP while moving
  const moving = input.moveY > 0.99 && Math.abs(input.moveX) < 0.01;
  const jumped = input.consumeJump();
  t.look(40, 0);                    // another finger drags the camera
  const look = input.consumeLook();
  t.stickEnd();
  check('touch: move + jump + camera drag at once', moving && jumped && look.dx === 40 && input.moveY === 0,
    `moveY=${input.moveY} jumped=${jumped} lookDX=${look.dx}`);
}

// ------------------------------------------------------------ Expo Go renderer workaround
{
  // Old Expo Go native expo-gl: WebGL2RenderingContext inherits from WebGLRenderingContext.
  const g = globalThis as { WebGLRenderingContext?: unknown };
  const saved = g.WebGLRenderingContext;
  class W1 {}
  class W2 extends W1 { createVertexArray() {} texImage3D() {} }
  g.WebGLRenderingContext = W1;
  // Same check three.js r187 runs in its WebGLRenderer constructor.
  const make = (p: { context?: unknown }) => {
    const Ctor = g.WebGLRenderingContext as (new () => object) | undefined;
    if (typeof Ctor !== 'undefined' && p.context instanceof Ctor) throw new Error('WebGL 1 is not supported since r163.');
    return {} as never;
  };
  const ctx = Object.assign(new W2(), { drawingBufferWidth: 8, drawingBufferHeight: 8, supportsWebGL2: true }) as unknown as GLLike;
  let error = '';
  try { createRenderer(ctx, make); } catch (e) { error = (e as Error).message; }
  const restored = g.WebGLRenderingContext === W1;
  class Only1 extends W1 {}
  let webgl1Message = '';
  try { createRenderer(Object.assign(new Only1(), { drawingBufferWidth: 1, drawingBufferHeight: 1, supportsWebGL2: false }) as unknown as GLLike, make); }
  catch (e) { webgl1Message = (e as Error).message; }
  g.WebGLRenderingContext = saved;
  check('renderer: old Expo Go WebGL2 context accepted by three.js check', error === '' && restored, error || (restored ? '' : 'global not restored'));
  check('renderer: true WebGL 1 device gets a clear message', webgl1Message.includes('needs WebGL 2'), webgl1Message);
}

{
  // Global defined like a native install: non-configurable but writable. Must still be hidden and restored.
  const g = globalThis as Record<string, unknown>;
  const saved = Object.getOwnPropertyDescriptor(g, 'WebGLRenderingContext');
  class W1 {}
  Object.defineProperty(g, 'WebGLRenderingContext', { value: W1, writable: true, configurable: false, enumerable: false });
  const seen = withWebGL1GlobalHidden(() => typeof g.WebGLRenderingContext);
  const restored = g.WebGLRenderingContext === W1;
  check('renderer: non-configurable WebGLRenderingContext global hidden and restored', seen === 'undefined' && restored, `inside=${seen} restored=${restored}`);
  // A non-configurable property can't be redefined or deleted, only reassigned (it is writable).
  g.WebGLRenderingContext = saved?.value;
}
{
  const calls: [number, number | boolean][] = [];
  const gl = { contextId: 1, drawingBufferWidth: 1, drawingBufferHeight: 1,
    pixelStorei: (p: number, v: number | boolean) => { calls.push([p, v]); } } as unknown as GLLike;
  filterPixelStore(gl);
  const ps = gl.pixelStorei as (p: number, v: number | boolean) => void;
  ps(0x9240, true);   // UNPACK_FLIP_Y_WEBGL: supported, passed through
  ps(0x0cf5, 4);      // UNPACK_ALIGNMENT: supported
  ps(0x9241, false);  // UNPACK_PREMULTIPLY_ALPHA_WEBGL default: dropped
  ps(0x9243, 0);      // UNPACK_COLORSPACE_CONVERSION_WEBGL NONE: dropped
  ps(0x0cf2, 0);      // UNPACK_ROW_LENGTH 0: dropped
  check('renderer: pixelStorei passes supported params and drops unsupported defaults',
    calls.length === 2 && calls[0][0] === 0x9240 && calls[1][0] === 0x0cf5, JSON.stringify(calls));
}

// ------------------------------------------------------------ cave map claim

{
  const bfs = (doorOpen: boolean) => {
    const seen = new Set<string>(); const q: [number, number][] = [];
    CAVE_MAP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'S') { q.push([r, c]); seen.add(`${r},${c}`); } }));
    const reached = new Set<string>();
    while (q.length) {
      const [r, c] = q.shift()!;
      reached.add(CAVE_MAP[r][c]);
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ch = CAVE_MAP[r + dr][c + dc];
        if (ch === '#' || (!doorOpen && ch === 'D') || seen.has(`${r + dr},${c + dc}`)) continue;
        seen.add(`${r + dr},${c + dc}`); q.push([r + dr, c + dc]);
      }
    }
    return reached;
  };
  check('caves: exit unreachable while door is shut', !bfs(false).has('E'));
  check('caves: exit reachable once door opens', bfs(true).has('E'));
}

// ------------------------------------------------------------ level builds

for (const [i, def] of LEVELS.entries()) {
  const g = new Game();
  g.loadLevel(i);
  const p = g.player.body.pos;
  const ground = g.world!.physics.surfaceAt(p.x, p.z, p.y + 0.5);
  check(`L${def.number} builds; Jason spawns on ground`, Math.abs(ground - p.y) < 0.2, `ground=${ground.toFixed(2)} y=${p.y.toFixed(2)}`);
  const drawCalls = g.world!.root.children.length;
  check(`L${def.number} draw batches after merge`, drawCalls < 120, `${drawCalls} objects, ${g.world!.pointLights} point lights`);
}

// ------------------------------------------------------------ ground coverage
{
  // Every point along the level 1 trail must have ground under it (the Unity version ended at z=85).
  const g = new Game();
  g.loadLevel(0);
  const missing: number[] = [];
  for (let z = 0; z <= 119; z += 1) {
    const x = Math.sin(z * 0.05) * 4;
    if (g.world!.physics.surfaceAt(x, z, 50) === -Infinity) missing.push(z);
  }
  check('L1 ground covers crash site to temple', missing.length === 0, missing.length ? `no ground at z=${missing[0]}..${missing[missing.length - 1]}` : '');
}

// ------------------------------------------------------------ autopilot routes

const done = (g: Game) => g.missions.isLevelComplete;
const objectiveIs = (id: string) => (g: Game) => g.missions.currentId !== id;

function caveRoute(): Step[] {
  const find = (ch: string) => {
    const out: [number, number][] = [];
    CAVE_MAP.forEach((row, r) => [...row].forEach((x, c) => { if (x === ch) out.push([r, c]); }));
    return out;
  };
  const path = (from: [number, number], to: [number, number]): [number, number][] => {
    const prev = new Map<string, string | null>([[`${from}`, null]]);
    const q = [from];
    while (q.length) {
      const [r, c] = q.shift()!;
      if (r === to[0] && c === to[1]) break;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n: [number, number] = [r + dr, c + dc];
        if (CAVE_MAP[n[0]][n[1]] === '#' || prev.has(`${n}`)) continue;
        prev.set(`${n}`, `${r},${c}`); q.push(n);
      }
    }
    const cells: [number, number][] = [];
    for (let k: string | null | undefined = `${to}`; k; k = prev.get(k)) cells.unshift(k.split(',').map(Number) as [number, number]);
    return cells;
  };
  const steps: Step[] = [];
  let at = find('S')[0];
  for (const b of find('B')) {
    const cells = path(at, b);
    for (const c of cells.slice(1, -1)) { const p = cellPos(...c); steps.push({ goto: [p.x, p.z], tol: 0.8 }); }
    const bp = cellPos(...b);
    steps.push({ goto: [bp.x, bp.z], tol: 1.4 }, { face: [bp.x, bp.z] }, { interact: 1 });
    at = cells[cells.length - 2];
  }
  steps.push({ until: objectiveIs('light_braziers'), label: 'braziers lit', timeout: 5 }, { wait: 2 });
  for (const c of path(at, find('E')[0]).slice(1)) { const p = cellPos(...c); steps.push({ goto: [p.x, p.z], tol: 0.8 }); }
  steps.push({ until: done, label: 'level complete', timeout: 5 });
  return steps;
}

function stairRoute(): Step[] {
  // Mirror of the level 5 builder's spiral, every 2nd step.
  const steps: Step[] = [];
  let theta = -Math.PI / 2;
  const n = Math.ceil((SUMMIT_Y - 1) / 0.3);
  for (let s = 1; s <= n; s++) {
    const y = 1 + s * 0.3;
    const tier = Math.min(9, Math.max(1, Math.ceil((y - 1) / 2 - 1e-6)));
    const r = 14 - 1.2 * tier + 1.2;
    theta += 1.5 / r;
    if (s % 2 === 0 || s === n) steps.push({ goto: [Math.cos(theta) * r, Math.sin(theta) * r], tol: 0.7 });
  }
  return steps;
}

const routes: Record<number, Step[]> = {
  1: [
    { goto: [-12.5, 6.5] },
    { until: objectiveIs('find_elena'), label: 'found Elena', timeout: 5 },
    { goto: [-1.2, -0.4] }, { face: [-1.2, 1.2] }, { interact: 1 },
    { until: objectiveIs('investigate_crash'), label: 'logbook read', timeout: 3 },
    { goto: [-6, 6] }, // around the fuselage
    ...[14, 24, 34, 45, 55, 65, 75, 85, 95].map((z): Step => ({ goto: [Math.sin(z * 0.05) * 4, z] })),
    { goto: [0, 101] },
    { goto: [-3, 107], tol: 0.25, walk: true },
    { until: done, label: 'temple plates solved', timeout: 40, hold: [-3, 107] },
  ],
  2: [
    { goto: [0, 9.6], walk: true },
    ...[[0, 11.5], [2.2, 14.3], [0.5, 17.1], [-1.8, 19.9], [0, 22.7], [2, 25.5], [0.4, 28.3]].map((p): Step => ({ goto: p as [number, number], tol: 0.45 })),
    { goto: [0, 35] },
    { until: objectiveIs('cross_river'), label: 'river crossed', timeout: 3 },
    { goto: [0, 46] },
    { until: objectiveIs('hold_gate'), label: 'Elena holds the gate', timeout: 40 },
    { wait: 2 },
    { goto: [0, 56] }, { goto: [0, 72] },
    { until: done, label: 'level complete', timeout: 5 },
  ],
  3: [
    { goto: [6, 12] }, { goto: [13.5, 13] }, { goto: [6, 12] },
    { goto: [-2, 22] }, { goto: [-3, 28.5] }, { goto: [-4, 35] },
    { goto: [-11.5, 35] }, { goto: [-4, 35] },
    { goto: [4, 46] }, { goto: [2, 59] }, { goto: [9.5, 60.5] }, { goto: [2, 59] },
    { goto: [-1.5, 64.5] }, { goto: [-5, 70] }, { goto: [0, 84] },
    { until: done, label: 'level complete', timeout: 5 },
  ],
  4: caveRoute(),
  5: [
    ...[[0, -36.5], [1.6, -33.3], [-0.4, -30.1], [-2, -26.9], [-0.5, -23.7], [1.4, -20.5], [0, -17.3]].map((p): Step => ({ goto: p as [number, number], tol: 0.5 })),
    { goto: [0, -14.15] },
    { until: objectiveIs('cross_lava'), label: 'lava crossed', timeout: 3 },
    ...stairRoute(),
    { goto: [0, -1.4], tol: 0.5 }, { face: [0, 0] },
    { until: objectiveIs('climb_peak'), label: 'summit reached', timeout: 3 },
    { interact: 1 },
    { until: done, label: 'level complete', timeout: 3 },
  ],
  6: [
    { goto: [0, 12] },
    { until: objectiveIs('enter_sanctum'), label: 'entered', timeout: 3 },
    { goto: [-6, 20.4], tol: 0.3 }, { face: [-6, 22] }, { interact: 3 },
    { goto: [0, 20.4], tol: 0.3 }, { face: [0, 22] }, { interact: 2 },
    { goto: [6, 20.4], tol: 0.3 }, { face: [6, 22] }, { interact: 1 },
    { until: objectiveIs('align_statues'), label: 'statues aligned', timeout: 5 },
    { wait: 2 },
    { goto: [0, 29] }, { goto: [0, 35] }, { goto: [-5, 44], tol: 0.25, walk: true },
    { until: objectiveIs('final_seal'), label: 'final seal held', timeout: 40, hold: [-5, 44] },
    { wait: 2 },
    { goto: [0, 54.1], tol: 0.3 }, { face: [0, 56] }, { interact: 1 },
    { until: done, label: 'level complete', timeout: 3 },
  ],
};

for (const [i, def] of LEVELS.entries()) {
  const g = new Game();
  let complete = false;
  g.on('levelComplete', () => { complete = true; });
  g.loadLevel(i);
  const r = runAutopilot(g, routes[def.number]);
  check(`L${def.number} ${def.title}: autopilot completes the level`, r.ok && complete, r.ok ? `${r.seconds.toFixed(0)}s of play` : r.log.join('; '));
}

// ------------------------------------------------------------ continue / fast-forward

{
  const g = new Game();
  g.loadLevel(5); // level 6
  const r = runAutopilot(g, routes[6].slice(0, 12)); // up to the statues aligned + wait
  const save = g.snapshot();
  const g2 = new Game();
  g2.loadLevel(save.levelIndex, save);
  const r2 = runAutopilot(g2, [{ goto: [0, 35] }]);
  check('Continue: solved statue door stays open after reload', r.ok && r2.ok && g2.missions.currentId === 'final_seal',
    `objective=${g2.missions.currentId} ${r2.log.join('; ')}`);
}

// ------------------------------------------------------------ rigged character models (if installed)
async function modelTests() {
  const dir = 'assets/models';
  if (!fs.existsSync(path.join(dir, 'jason.glb'))) {
    results.push('SKIP  character models not installed (run tools/prepare-models.mjs)');
    return;
  }
  const toAB = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  const load = async (name: string) => {
    const { scene, animations } = await parseGlb(toAB(fs.readFileSync(path.join(dir, `${name}.glb`))));
    const textures: Record<string, Partial<Record<TextureSlot, THREE.Texture>>> = {};
    for (const f of fs.readdirSync(dir).filter((x) => x.startsWith(`${name}.`) && x.endsWith('.lwtex'))) {
      const [, material, slot] = f.slice(0, -'.lwtex'.length).split('.');
      (textures[material] ??= {})[slot as TextureSlot] = decodeLwtex(toAB(fs.readFileSync(path.join(dir, f))), slot as TextureSlot);
    }
    applyTextures(scene, textures);
    return { scene, animations, textured: Object.keys(textures).length };
  };
  const bonesMoved = (c: SkinnedCharacter) => {
    const bones: THREE.Bone[] = [];
    c.group.traverse((o) => { if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone); });
    const before = bones.map((b) => b.quaternion.clone());
    for (let i = 0; i < 30; i++) c.update(1 / 30, 5.5, true, 0); // run for 1 s
    return bones.filter((b, i) => b.quaternion.angleTo(before[i]) > 0.02).length;
  };
  const measure = (c: SkinnedCharacter) => {
    c.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c.group);
    return { h: box.max.y - box.min.y, feet: box.min.y };
  };
  const j = await load('jason');
  const jason = new SkinnedCharacter(j.scene, j.animations, 1.8);
  const jm = measure(jason), jMoved = bonesMoved(jason);
  check('models: Jason loads with textures and Idle/Walk/Run', j.textured > 0 && jason.hasAnimations, `${j.animations.map((a) => a.name).join(',')}`);
  check('models: Jason is 1.8 m tall, feet on the ground', Math.abs(jm.h - 1.8) < 0.05 && Math.abs(jm.feet) < 0.05, `h=${jm.h.toFixed(2)} feet=${jm.feet.toFixed(2)}`);
  check('models: Jason\'s run animation moves his bones', jMoved > 10, `${jMoved} bones moved`);
  if (fs.existsSync(path.join(dir, 'elena.glb'))) {
    const e = await load('elena');
    const elena = new SkinnedCharacter(e.scene, e.animations.length ? e.animations : retargetClips(j.animations), 1.68);
    const em = measure(elena), eMoved = bonesMoved(elena);
    check('models: Elena is 1.68 m tall, feet on the ground', Math.abs(em.h - 1.68) < 0.05 && Math.abs(em.feet) < 0.05, `h=${em.h.toFixed(2)} feet=${em.feet.toFixed(2)}`);
    check('models: Jason\'s animations drive Elena\'s skeleton', eMoved > 10, `${eMoved} bones moved`);
  }
}

modelTests().catch((e) => check('models: load without errors', false, String(e))).finally(() => {
  console.log(results.join('\n'));
  console.log(`\n${results.length - failures}/${results.length} passed`);
  process.exit(failures ? 1 : 0);

});
