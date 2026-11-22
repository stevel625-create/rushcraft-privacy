import { CoopPuzzle } from '../engine/mechanics';
import { v3 } from '../engine/physics';
import type { WorldKit } from '../engine/world';
import { defaultTheme, scatter, type LevelDefinition } from './types';

const FIND = 'find_elena', INVESTIGATE = 'investigate_crash', TRAIL = 'follow_trail', TEMPLE = 'reach_temple', PUZZLE = 'coop_puzzle';
const TEMPLE_Z = 110;

function H(x: number, z: number) {
  // Smooth value noise from sines (deterministic, cheap) flattened around the crash site and temple plaza.
  const n = Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.09 + 0.7) * 0.6 + Math.sin((x + z) * 0.05) * 0.4;
  const dCrash = Math.hypot(x, z);
  const dTemple = Math.hypot(x, z - TEMPLE_Z);
  const flatten = Math.min(1, Math.max(0, (dCrash - 14) / 20)) * Math.min(1, Math.max(0, (dTemple - 13) / 18));
  return n * 3.2 * flatten;
}

const trailX = (z: number) => Math.sin(z * 0.05) * 4;

export const level1: LevelDefinition = {
  number: 1,
  title: 'The Crash',
  subtitle: 'Find Elena and the way into the jungle',
  seed: 1138,
  theme: defaultTheme,
  objectives: [
    { id: FIND, title: 'Find Elena' },
    { id: INVESTIGATE, title: "Investigate the crash site: read the pilot's logbook" },
    { id: TRAIL, title: 'Follow the ancient trail' },
    { id: TEMPLE, title: 'Reach the temple entrance' },
    { id: PUZZLE, title: 'Stand on the temple plates together with Elena' },
  ],

  build(kit: WorldKit) {
    const GROUND = 0x38592a, TRUNK = 0x5c4024, LEAF = 0x1f6b24, ROCK = 0x6b6b66, METAL = 0x8c8c94,
      STONE = 0x9e9479, PATH = 0x8c7552, PAPER = 0xd9cca6, DARK = 0x1c1a18;

    // Terrain covers the crash site (z=0) through the temple plaza (z=119). Centre z=45, 190 m square.
    kit.ground(0, 45, 190, 90, H, GROUND);

    // Trail stones (visual only; the ground collides).
    for (let z = 14; z < 104; z += 2.2) {
      const x = trailX(z);
      kit.box(v3(x, H(x, z) + 0.02, z), v3(2.4, 0.05, 1.6), PATH, { collide: false, yaw: kit.rng.range(-0.14, 0.14) });
    }

    // Crash site: fuselage on its side, wings, tail fin, debris.
    kit.cylinder(v3(4, 1.1, 2), 1.1, 14, METAL, { collide: false, yaw: 0.44, tilt: { z: Math.PI / 2 } });
    kit.physics.addBox(v3(4, 1.1, 2), v3(14, 2.2, 2.2), 0.44);
    kit.box(v3(-2, 0.6, -3), v3(9, 0.25, 2.6), METAL, { collide: false, yaw: 0.6, tilt: { x: -0.2, z: 0.14 } });
    kit.box(v3(7, 0.4, -4), v3(5, 0.2, 2), METAL, { collide: false, yaw: -0.35, tilt: { x: 0.07, z: -0.26 } });
    kit.box(v3(10.5, 2.2, 5), v3(0.25, 3.5, 2.2), METAL, { yaw: 0.7 });
    for (let i = 0; i < 8; i++) {
      kit.box(v3(kit.rng.range(-8, 8), 0.2, kit.rng.range(-8, -3)),
        v3(kit.rng.range(0.3, 1.2), kit.rng.range(0.2, 0.6), kit.rng.range(0.3, 1.2)), METAL,
        { collide: false, yaw: kit.rng.range(0, 6.28), tilt: { x: kit.rng.range(-0.5, 0.5) } });
    }

    kit.box(v3(-1.2, 0.06, 1.2), v3(0.5, 0.12, 0.35), PAPER, { collide: false });
    kit.action(v3(-1.2, 0.3, 1.2), 'Read logbook',
      '"Engine fire over the ridge... heading for the old temple road, north."', INVESTIGATE,
      'A charred logbook. Find Elena first.');
    kit.box(v3(2.2, 0.2, -1.5), v3(0.5, 0.4, 0.3), METAL);
    kit.action(v3(2.2, 0.4, -1.5), 'Inspect radio', 'Dead. The antenna snapped in the crash.');

    // Temple: three shallow plaza tiers (0.3 m: walkable), a facade with a door, plates in front.
    const cz = TEMPLE_Z;
    for (let i = 0; i < 3; i++) kit.box(v3(0, 0.15 + i * 0.3, cz), v3(18 - i * 2, 0.3, 18 - i * 2), STONE);
    const top = 0.9;
    kit.box(v3(-4.5, top + 4, cz + 4), v3(2.4, 8, 3), STONE);
    kit.box(v3(4.5, top + 4, cz + 4), v3(2.4, 8, 3), STONE);
    kit.box(v3(0, top + 8.6, cz + 4), v3(12, 1.6, 3.2), STONE);
    kit.box(v3(0, top + 3.9, cz + 7.5), v3(6.6, 7.8, 4), DARK); // the dark interior behind the door
    const door = kit.door(v3(0, top + 2.2, cz + 4), v3(6.6, 4.4, 1.2), ROCK);
    const plateJ = kit.plate(v3(-3, top + 0.1, cz - 3), METAL);
    const plateE = kit.plate(v3(3, top + 0.1, cz - 3), METAL);
    kit.add(new CoopPuzzle(PUZZLE, [
      { plate: plateJ, need: 'jason' }, { plate: plateE, need: 'elena' }], door, 1));

    // Vegetation, kept off the spawn, trail and plaza.
    const clear = (x: number, z: number) =>
      Math.hypot(x, z) < 16 || (Math.abs(x - trailX(z)) < 5 && z > 10 && z < 104) || Math.hypot(x, z - cz) < 20;
    scatter(kit, 100, 88, (x, z) => clear(x, z + 45), (x, z) => kit.tree(v3(x, H(x, z + 45), z + 45), TRUNK, LEAF));
    scatter(kit, 45, 88, (x, z) => clear(x, z + 45), (x, z) => {
      const s = kit.rng.range(0.4, 1.2);
      kit.sphere(v3(x, H(x, z + 45) + s * 0.2, z + 45), v3(s, s * 0.7, s), ROCK, { collide: true });
    });
    scatter(kit, 65, 88, (x, z) => clear(x, z + 45), (x, z) => {
      const s = kit.rng.range(0.6, 1.1);
      kit.sphere(v3(x, H(x, z + 45) + s * 0.4, z + 45), v3(s, s * 0.8, s), LEAF);
    });

    const elena = v3(-14, H(-14, 8) + 0.05, 8);
    kit.trigger(FIND, elena, 4);
    kit.trigger(TRAIL, v3(trailX(45), H(trailX(45), 45), 45), 5);
    kit.trigger(TEMPLE, v3(0, H(0, 100), 100), 6);
    kit.checkpoint(v3(trailX(45), H(trailX(45), 45), 45));

    return {
      jasonSpawn: v3(0, H(0, 0) + 0.05, 0),
      jasonYaw: 0,
      elenaSpawn: elena,
      killY: -30,
      companionSpots: { [FIND]: elena, [PUZZLE]: plateE.top },
    };
  },
};
