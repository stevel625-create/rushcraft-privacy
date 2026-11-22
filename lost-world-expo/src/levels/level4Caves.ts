import { CountedObjective } from '../engine/mechanics';
import { v3 } from '../engine/physics';
import type { WorldKit } from '../engine/world';
import type { LevelDefinition } from './types';

const BRAZIERS = 'light_braziers', EXIT = 'find_exit';
const CELL = 4, WALL_H = 5;

// S start, B brazier, D door (opens when all braziers are lit), E exit, C glowing crystal, # rock.
// Checked by tests: every B is reachable from S with the door shut; E only through D.
export const CAVE_MAP = [
  '#############',
  '#S....#.....#',
  '#.###.#.###.#',
  '#.#B..#..C#.#',
  '#.#####.#.#.#',
  '#..C....#.#B#',
  '###.#####.#.#',
  '#B..#.....#.#',
  '#.###.###.#.#',
  '#.....#E.D.C#',
  '#############',
];

export const cellPos = (row: number, col: number, y = 0) => v3(col * CELL, y, -row * CELL);

export const level4: LevelDefinition = {
  number: 4,
  title: 'The Echo Caves',
  subtitle: 'Bring light to the dark',
  seed: 4409,
  theme: {
    sky: 0x08080b, fog: 0x0a0a0d, fogDensity: 0.03,
    ambientSky: 0x7a7488, ambientGround: 0x2a2520, ambientIntensity: 1.5,
    sunColor: 0x99a6cc, sunIntensity: 0.35, sunFrom: { x: 0, y: 1, z: 0.2 },
  },
  objectives: [
    { id: BRAZIERS, title: 'Light the braziers' },
    { id: EXIT, title: 'Find the way out of the caves' },
  ],

  build(kit: WorldKit) {
    const ROCK = 0x57504b, FLOOR = 0x423d39, DOOR = 0x615447, CRYSTAL = 0x66bfff;
    const rows = CAVE_MAP.length, cols = CAVE_MAP[0].length;
    const cx = ((cols - 1) * CELL) / 2, cz = -((rows - 1) * CELL) / 2;

    kit.box(v3(cx, -0.25, cz), v3(cols * CELL, 0.5, rows * CELL), FLOOR);
    // Roof: collides only so the camera stays inside the maze (it is far above jump height).
    kit.box(v3(cx, WALL_H + 0.25, cz), v3(cols * CELL, 0.5, rows * CELL), ROCK);

    let start = v3(), exit = v3(), elena = v3();
    let door = null as ReturnType<WorldKit['door']> | null;
    const brazierCells: [number, number][] = [];

    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const p = cellPos(r, c);
        switch (CAVE_MAP[r][c]) {
          case '#': kit.box(v3(p.x, WALL_H / 2, p.z), v3(CELL, WALL_H, CELL), ROCK); break;
          case 'S': start = cellPos(r, c + 1); elena = cellPos(r, c + 2); break; // camera room behind Jason; Elena ahead in view
          case 'E': exit = p; kit.pointLight(v3(p.x, 3, p.z), 0xccddff, 12, 3); break;
          case 'D': door = kit.door(v3(p.x, WALL_H / 2, p.z), v3(CELL, WALL_H, CELL), DOOR); break;
          case 'C':
            kit.box(v3(p.x + 1.2, 0.6, p.z + 1.2), v3(0.5, 1.2, 0.5), CRYSTAL, { emissive: 0x1f4d80, yaw: 0.5, tilt: { x: 0.25, z: 0.2 } });
            kit.pointLight(v3(p.x + 1.2, 1.5, p.z + 1.2), 0x66b3ff, 8, 1.5);
            break;
          case 'B': brazierCells.push([r, c]); break;
        }
      }

    const counter = kit.add(new CountedObjective(BRAZIERS, brazierCells.length, door));
    for (const [r, c] of brazierCells) kit.brazier(cellPos(r, c), counter);

    kit.flame(v3(start.x - 2.6, 2.2, start.z + 1.4)); // starting torch, on the corner wall
    kit.trigger(EXIT, exit, 1.8);
    kit.checkpoint(cellPos(5, 4), 1.5);

    return {
      jasonSpawn: v3(start.x, 0.05, start.z),
      jasonYaw: Math.PI / 2, // facing +X down the first corridor
      elenaSpawn: v3(elena.x, 0.05, elena.z),
      killY: -10,
      companionSpots: {},
    };
  },
};
