import * as THREE from 'three';
import { CoopPuzzle, RotatingStatue, StatuePuzzle } from '../engine/mechanics';
import { v3 } from '../engine/physics';
import type { WorldKit } from '../engine/world';
import type { LevelDefinition } from './types';

const ENTER = 'enter_sanctum', STATUES = 'align_statues', SEAL = 'final_seal', RELIC = 'claim_relic';
const HALF_W = 15, BACK = 65, FRONT = -5, WALL_H = 8, INNER_Z = 32;

export const level6: LevelDefinition = {
  number: 6,
  title: 'Heart of the Temple',
  subtitle: 'What the jungle was hiding',
  seed: 6607,
  theme: {
    sky: 0x121221, fog: 0x171426, fogDensity: 0.02,
    ambientSky: 0x8a80b3, ambientGround: 0x262033, ambientIntensity: 1.2,
    sunColor: 0x99adff, sunIntensity: 0.9, sunFrom: { x: 0.3, y: 0.8, z: 0.5 },
  },
  objectives: [
    { id: ENTER, title: 'Enter the sanctum hall' },
    { id: STATUES, title: 'Turn the guardian statues to face the altar' },
    { id: SEAL, title: 'Stand on the final seal together with Elena' },
    { id: RELIC, title: 'Claim the relic' },
  ],

  build(kit: WorldKit) {
    const FLOOR = 0x59524d, STONE = 0x807566, DARK = 0x47403d, GOLD = 0xf2bf40, METAL = 0x998c73, GLASS = 0x4d8089;
    const len = BACK - FRONT, midZ = (BACK + FRONT) / 2;

    kit.box(v3(0, -0.25, midZ), v3(HALF_W * 2, 0.5, len), FLOOR);
    kit.box(v3(-HALF_W, WALL_H / 2, midZ), v3(1, WALL_H, len), STONE);
    kit.box(v3(HALF_W, WALL_H / 2, midZ), v3(1, WALL_H, len), STONE);
    kit.box(v3(0, WALL_H / 2, BACK), v3(HALF_W * 2, WALL_H, 1), STONE);
    kit.box(v3(0, WALL_H / 2, FRONT), v3(HALF_W * 2, WALL_H, 1), STONE);
    for (let z = 4; z < BACK - 2; z += 6) {
      if (Math.abs(z - INNER_Z) < 2) continue;
      kit.cylinder(v3(-9, WALL_H / 2, z), 0.7, WALL_H, DARK);
      kit.cylinder(v3(9, WALL_H / 2, z), 0.7, WALL_H, DARK);
    }

    // Wall torches; only some carry a light to keep the per-pixel light count mobile-friendly.
    for (const z of [8, 26, 44, 58])
      for (const side of [-1, 1]) kit.flame(v3(side * (HALF_W - 0.9), 3.2, z), (z === 8 || z === 44) && side === -1 || z === 26 && side === 1);

    kit.box(v3(-4, 1, 6), v3(1.6, 2, 0.3), DARK);
    kit.action(v3(-4, 1, 6), 'Read inscription', '"Only when the guardians look upon the heart will the way open."');

    // Inner wall with the statue-locked door.
    kit.box(v3(-(HALF_W + 3) / 2, WALL_H / 2, INNER_Z), v3(HALF_W - 3, WALL_H, 1), STONE);
    kit.box(v3((HALF_W + 3) / 2, WALL_H / 2, INNER_Z), v3(HALF_W - 3, WALL_H, 1), STONE);
    kit.box(v3(0, WALL_H - 1, INNER_Z), v3(6, 2, 1), STONE);
    const innerDoor = kit.door(v3(0, 3, INNER_Z), v3(6, 6, 1.2), DARK);

    // Guardian statues: each must face +Z (the altar). Gold "face" shows which way it looks.
    const statues = [-6, 0, 6].map((x, i) => {
      kit.box(v3(x, 0.3, 22), v3(1.8, 0.6, 1.8), STONE);
      const root = new THREE.Group();
      root.position.set(x, 0.6, 22);
      kit.root.add(root);
      kit.box(v3(0, 1.1, 0), v3(1, 2.2, 0.8), STONE, { collide: false, dynamic: true }, root);
      kit.box(v3(0, 1.7, 0.45), v3(0.5, 0.35, 0.15), GOLD, { collide: false, dynamic: true, emissive: 0x403010 }, root);
      kit.physics.addCylinder(v3(x, 1.7, 22), 0.6, 2.2);
      const s = new RotatingStatue(v3(x, 1.2, 22), root, i + 1, 0);
      kit.interactables.push(s);
      return kit.add(s);
    });
    kit.add(new StatuePuzzle(STATUES, statues, innerDoor));

    // Inner chamber: final seal and the relic in a stone cage.
    const altar = v3(0, 0, 56);
    kit.box(v3(altar.x, 0.6, altar.z), v3(2.4, 1.2, 2.4), STONE);
    kit.sphere(v3(altar.x, 1.65, altar.z), 0.35, GOLD, { emissive: 0x664010 });
    kit.pointLight(v3(altar.x, 3, altar.z), 0xffd980, 12, 3);
    const cage = kit.door(v3(altar.x, 2.0, altar.z), v3(1.8, 1.6, 1.8), GLASS);
    kit.action(v3(altar.x, 1.65, altar.z - 0.6), 'Take the relic',
      'The relic is warm in your hands. Elena: "Jason... this changes everything."', RELIC,
      'The relic is sealed behind the stone cage.');

    const plateJ = kit.plate(v3(-5, 0.1, 44), METAL);
    const plateE = kit.plate(v3(5, 0.1, 44), METAL);
    kit.add(new CoopPuzzle(SEAL, [{ plate: plateJ, need: 'jason' }, { plate: plateE, need: 'elena' }], cage, 1));

    kit.trigger(ENTER, v3(0, 0, 12), 4);
    kit.checkpoint(v3(0, 0, 38));

    return {
      jasonSpawn: v3(0, 0.05, 0),
      jasonYaw: 0,
      elenaSpawn: v3(2, 0.05, -2),
      killY: -10,
      companionSpots: { [SEAL]: plateE.top },
    };
  },
};
