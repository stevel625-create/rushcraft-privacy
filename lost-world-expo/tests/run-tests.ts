/* Headless test suite: physics unit checks, level build checks, and full autopilot playthroughs. Run: npm test */
import { Game } from '../src/engine/game';
import { CharacterBody, Physics, v3 } from '../src/engine/physics';
import { LEVELS } from '../src/levels';
import { CAVE_MAP, cellPos } from '../src/levels/level4Caves';
import { SUMMIT_Y } from '../src/levels/level5Peak';
import { runAutopilot, type Step } from './autopilot';
import { InputState } from '../src/engine/input';
import { TouchController } from '../src/ui/touchController';

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
  t.layout(800, 400);
  t.start([{ id: 1, x: 150, y: 300 }]);       // left thumb down
  t.move([{ id: 1, x: 150, y: 230 }]);        // push up (forward), full deflection
  t.start([{ id: 2, x: 700, y: 305 }]);       // right thumb taps JUMP while moving
  const moving = input.moveY > 0.99 && Math.abs(input.moveX) < 0.01;
  const jumped = input.consumeJump();
  t.start([{ id: 3, x: 600, y: 100 }]);       // another finger drags the camera
  t.move([{ id: 3, x: 640, y: 100 }]);
  const look = input.consumeLook();
  t.end([{ id: 1, x: 150, y: 230 }]);
  check('touch: move + jump + camera drag at once', moving && jumped && look.dx === 40 && input.moveY === 0,
    `moveY=${input.moveY} jumped=${jumped} lookDX=${look.dx}`);
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

console.log(results.join('\n'));
console.log(`\n${results.length - failures}/${results.length} passed`);
process.exit(failures ? 1 : 0);
