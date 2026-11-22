import { CoopPuzzle } from '../engine/mechanics';
import { v3 } from '../engine/physics';
import type { WorldKit } from '../engine/world';
import { scatter, type LevelDefinition } from './types';

const CROSS = 'cross_river', HOLD = 'hold_gate', SHRINE = 'reach_shrine';
const RIVER_START = 10, RIVER_END = 30, WALL_Z = 52;

function H(x: number, z: number) {
  const bank = (Math.sin(x * 0.13 + 2) * Math.cos(z * 0.11) * 0.5 + 0.5) * 1.2;
  const inChannel = Math.min(1, Math.max(0, Math.min(z - RIVER_START, RIVER_END - z) / 3));
  return bank + (-4 - bank) * inChannel;
}

export const level2: LevelDefinition = {
  number: 2,
  title: 'The Sunken Gate',
  subtitle: 'Cross the flooded ruins',
  seed: 2203,
  theme: {
    sky: 0x809ead, fog: 0x8ca8b3, fogDensity: 0.02,
    ambientSky: 0xb8ccd6, ambientGround: 0x2e3d33, ambientIntensity: 1.4,
    sunColor: 0xe6ebff, sunIntensity: 1.8, sunFrom: { x: -0.3, y: 0.75, z: -0.6 },
  },
  objectives: [
    { id: CROSS, title: 'Cross the flooded river on the stepping stones' },
    { id: HOLD, title: 'Let Elena hold the gate plate' },
    { id: SHRINE, title: 'Go through the gate to the river shrine' },
  ],

  build(kit: WorldKit) {
    const GROUND = 0x405f33, WATER = 0x26596b, STONE = 0x80857a, MOSS = 0x4d6b47, TRUNK = 0x543d26, LEAF = 0x26662e, METAL = 0x998c66;

    kit.ground(0, 30, 130, 64, H, GROUND);
    kit.liquid(v3(0, -0.9, 20), 130, RIVER_END - RIVER_START + 6, WATER, true);

    // Stepping stones: tops at y 0.05, ~1 m gaps.
    const xs = [0, 2.2, 0.5, -1.8, 0, 2, 0.4];
    xs.forEach((x, i) => kit.cylinder(v3(x, -1.2, RIVER_START + 1.5 + i * 2.8), 0.9, 2.5, i % 2 ? MOSS : STONE));

    // Sunken ruins (decor).
    for (let i = 0; i < 10; i++) {
      let x = kit.rng.range(-30, 30);
      if (Math.abs(x) < 6) x += Math.sign(x || 1) * 6;
      const h = kit.rng.range(1.5, 5);
      kit.cylinder(v3(x, -1.5 + h / 2, kit.rng.range(RIVER_START, RIVER_END)), 0.6, h, STONE,
        { collide: false, tilt: { x: kit.rng.range(-0.25, 0.25), z: kit.rng.range(-0.25, 0.25) } });
    }

    // Gate wall across the valley with a sliding gate in the middle.
    kit.box(v3(-35, 3, WALL_Z), v3(64, 8, 2), STONE);
    kit.box(v3(35, 3, WALL_Z), v3(64, 8, 2), STONE);
    kit.box(v3(0, 6.5, WALL_Z), v3(6, 3, 2), STONE);
    const door = kit.door(v3(0, 2.5, WALL_Z), v3(6, 5, 1.6), MOSS);
    const plate = kit.plate(v3(7, H(7, WALL_Z - 6) + 0.1, WALL_Z - 6), METAL);
    kit.add(new CoopPuzzle(HOLD, [{ plate, need: 'elena' }], door, 0.6));

    // Shrine beyond the gate.
    const sz = 72, sy = H(0, sz);
    kit.box(v3(0, sy + 0.15, sz), v3(8, 0.3, 8), STONE);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      kit.cylinder(v3(Math.cos(a) * 3, sy + 2.5, sz + Math.sin(a) * 3), 0.35, 4.4, STONE);
    }
    kit.box(v3(0, sy + 4.9, sz), v3(7.5, 0.6, 7.5), STONE);

    scatter(kit, 55, 60, (x, z) => Math.abs(x) < 9 || (z + 30 > RIVER_START - 3 && z + 30 < RIVER_END + 3) || Math.abs(z + 30 - WALL_Z) < 3,
      (x, z) => kit.tree(v3(x, H(x, z + 30), z + 30), TRUNK, LEAF));

    const farBank = v3(0, H(0, RIVER_END + 5), RIVER_END + 5);
    kit.trigger(CROSS, farBank, 4);
    kit.trigger(SHRINE, v3(0, sy, sz), 4);
    kit.checkpoint(farBank);

    return {
      jasonSpawn: v3(0, H(0, -5) + 0.05, -5),
      jasonYaw: 0,
      elenaSpawn: v3(2, H(2, -7) + 0.05, -7),
      killY: -6,
      companionSpots: { [HOLD]: plate.top },
    };
  },
};
