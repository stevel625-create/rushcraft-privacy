import { Collectible, CountedObjective } from '../engine/mechanics';
import { v3, type Vec3 } from '../engine/physics';
import type { WorldKit } from '../engine/world';
import { scatter, type LevelDefinition } from './types';

const SHARDS = 'collect_shards', LOOKOUT = 'reach_lookout';
const DECK = 12, R = 3;

export const level3: LevelDefinition = {
  number: 3,
  title: 'Canopy Walk',
  subtitle: 'High above the jungle floor',
  seed: 3317,
  theme: {
    sky: 0x9ecce6, fog: 0x8cb89e, fogDensity: 0.016,
    ambientSky: 0xd6edd6, ambientGround: 0x3a5230, ambientIntensity: 1.5,
    sunColor: 0xfff2d1, sunIntensity: 2.4, sunFrom: { x: 0.6, y: 0.85, z: -0.3 },
  },
  objectives: [
    { id: SHARDS, title: 'Collect the relic shards in the canopy' },
    { id: LOOKOUT, title: 'Reach the lookout platform' },
  ],

  build(kit: WorldKit) {
    const WOOD = 0x735233, PLANK = 0x8c6640, ROPE = 0xb39e73, TRUNK = 0x4d3824, LEAF = 0x246629, FLOOR = 0x29471f, RELIC = 0x4de6ff;

    kit.ground(0, 45, 160, 32, (x, z) => (Math.sin(x * 0.07) * Math.cos(z * 0.06) + 1), FLOOR);

    const platform = (top: Vec3, r: number) => {
      kit.cylinder(v3(top.x, top.y - 0.2, top.z), r, 0.4, WOOD);
      kit.cylinder(v3(top.x, top.y / 2 - 0.4, top.z), 0.6, top.y, TRUNK);
      kit.sphere(v3(top.x, top.y + 7, top.z), v3(r * 1.2, 1.5, r * 1.2), LEAF);
    };

    /** Plank bridge between two platform edges, with rope rails that also keep characters on. */
    const bridge = (a: Vec3, b: Vec3) => {
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      const ux = dx / d, uz = dz / d;
      const s = v3(a.x + ux * (R - 0.3), a.y, a.z + uz * (R - 0.3));
      const e = v3(b.x - ux * (R - 0.3), b.y, b.z - uz * (R - 0.3));
      kit.ramp(s, e, 1.6, 0.12, PLANK);
      const yaw = Math.atan2(dx, dz);
      const len = Math.hypot(e.x - s.x, e.z - s.z);
      for (const side of [-1, 1]) {
        // Right vector for yaw (matches three's rotation.y): (cos, -sin).
        const ox = Math.cos(yaw) * side * 0.85, oz = -Math.sin(yaw) * side * 0.85;
        const mid = v3((s.x + e.x) / 2 + ox, (s.y + e.y) / 2 + 0.5, (s.z + e.z) / 2 + oz);
        kit.ramp(v3(s.x + ox, s.y + 1, s.z + oz), v3(e.x + ox, e.y + 1, e.z + oz), 0.08, 0.08, ROPE, false);
        kit.physics.addBox(mid, v3(0.1, 1 + Math.abs(e.y - s.y), len), yaw);
      }
    };

    const route: Vec3[] = [
      v3(0, DECK, 0), v3(6, DECK, 12), v3(-2, DECK, 22), v3(-4, DECK + 1, 35), v3(4, DECK + 1, 46),
      v3(2, DECK + 2, 59), v3(-5, DECK + 2, 70), v3(0, DECK + 3, 84),
    ];
    const gapAfter = [false, false, true, false, false, true, false];

    route.forEach((p, i) => {
      platform(p, i === route.length - 1 ? 4.5 : R);
      if (i > 0 && !gapAfter[i - 1]) bridge(route[i - 1], p);
    });
    // Jump gaps: a small stepping platform halfway, leaving ~1.6 m gaps on either side.
    gapAfter.forEach((g, i) => {
      if (!g) return;
      const a = route[i], b = route[i + 1];
      platform(v3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2), 2);
    });

    // Relic shards on side platforms (~2.3 m jump from the route; a running jump clears ~4 m).
    const sides = [
      v3(route[1].x + 7.5, route[1].y, route[1].z + 1),
      v3(route[3].x - 7.5, route[3].y + 0.5, route[3].z),
      v3(route[5].x + 7.5, route[5].y + 0.5, route[5].z + 1.5),
    ];
    const counter = kit.add(new CountedObjective(SHARDS, sides.length));
    for (const s of sides) {
      platform(s, 2.2);
      const shard = kit.box(v3(s.x, s.y + 1.2, s.z), v3(0.6, 0.6, 0.6), RELIC, { collide: false, dynamic: true, emissive: 0x1a6680 }).mesh;
      shard.rotation.set(Math.PI / 4, 0, Math.PI / 4);
      kit.add(new Collectible(shard, counter));
      kit.pointLight(v3(s.x, s.y + 1.6, s.z), 0x66e6ff, 6, 1.2);
    }

    scatter(kit, 40, 70, () => false, (x, z) => kit.tree(v3(x, 0, z + 45), TRUNK, LEAF, 8, 14));

    kit.checkpoint(v3(route[3].x, route[3].y, route[3].z));
    kit.checkpoint(v3(route[6].x, route[6].y, route[6].z));
    kit.trigger(LOOKOUT, route[route.length - 1], 3.5);

    return {
      jasonSpawn: v3(0, DECK + 0.05, 0),
      jasonYaw: 0,
      elenaSpawn: v3(1.5, DECK + 0.05, -1),
      killY: DECK - 4,
      companionSpots: {},
    };
  },
};
