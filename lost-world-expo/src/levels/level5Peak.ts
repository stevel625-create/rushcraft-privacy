import { v3, type Vec3 } from '../engine/physics';
import type { WorldKit } from '../engine/world';
import type { LevelDefinition } from './types';

const CROSS = 'cross_lava', CLIMB = 'climb_peak', GONG = 'ring_gong';
const TIERS = 10, BASE_R = 14, SHRINK = 1.2, TIER_H = 2, BASE_TOP = 1;
const STEP_RISE = 0.3; // under the 0.35 m step height
const STEP_ARC = 1.5;

const tierRadius = (i: number) => BASE_R - SHRINK * i;
export const SUMMIT_Y = BASE_TOP + TIER_H * (TIERS - 1);

export const level5: LevelDefinition = {
  number: 5,
  title: 'Obsidian Peak',
  subtitle: 'Climb above the fire',
  seed: 5521,
  theme: {
    sky: 0x52241c, fog: 0x6b331f, fogDensity: 0.018,
    ambientSky: 0xd9997a, ambientGround: 0x401a10, ambientIntensity: 1.3,
    sunColor: 0xff9966, sunIntensity: 2, sunFrom: { x: -0.7, y: 0.5, z: -0.4 },
  },
  objectives: [
    { id: CROSS, title: 'Cross the lava field to the mountain' },
    { id: CLIMB, title: 'Climb to the summit of Obsidian Peak' },
    { id: GONG, title: 'Ring the summit gong' },
  ],

  build(kit: WorldKit) {
    const LAVA = 0xff590d, OBSIDIAN = 0x1f1a1f, BASALT = 0x403838, BRONZE = 0xbf8c33;

    kit.liquid(v3(0, 0, 0), 170, 170, LAVA, true, 0xb33300);
    kit.pointLight(v3(0, 3, -30), 0xff7326, 40, 3);

    // Start island and basalt columns (tops at BASE_TOP).
    const island = v3(0, BASE_TOP, -45);
    kit.cylinder(v3(0, BASE_TOP - 1.5, -45), 6, 3, BASALT);
    [0, 1.6, -0.4, -2, -0.5, 1.4, 0].forEach((x, i) => kit.cylinder(v3(x, BASE_TOP - 1.5, -36.5 + i * 3.2), 1, 3, BASALT));

    // Stepped volcanic cone.
    // Tier 0 is 1.5 m wider than the cone line: a 2.7 m landing ring after the lava jumps.
    for (let i = 0; i < TIERS; i++) {
      const top = BASE_TOP + TIER_H * i;
      kit.cylinder(v3(0, top - TIER_H / 2, 0), tierRadius(i) + (i === 0 ? 1.5 : 0), TIER_H, OBSIDIAN);
    }

    // Spiral stair hugging the cone, starting on the side facing the columns (-Z).
    let theta = -Math.PI / 2;
    const steps = Math.ceil((SUMMIT_Y - BASE_TOP) / STEP_RISE);
    let midStair: Vec3 = v3();
    for (let s = 1; s <= steps; s++) {
      const y = BASE_TOP + s * STEP_RISE;
      const tier = Math.min(TIERS - 1, Math.max(1, Math.ceil((y - BASE_TOP) / TIER_H - 1e-6)));
      const r = tierRadius(tier) + 1.2;
      theta += STEP_ARC / r;
      // Box local X must point radially: local X maps to (cos yaw, -sin yaw), radial is (cos t, sin t) => yaw = -t.
      kit.box(v3(Math.cos(theta) * r, y - 0.15, Math.sin(theta) * r), v3(2.4, 0.3, STEP_ARC + 0.3), BASALT, { yaw: -theta });
      if (s === Math.floor(steps / 2)) midStair = v3(Math.cos(theta) * r, y, Math.sin(theta) * r);
    }

    // Summit gong.
    const summit = v3(0, SUMMIT_Y, 0);
    kit.box(v3(-1.4, SUMMIT_Y + 1.5, 0), v3(0.25, 3, 0.25), OBSIDIAN);
    kit.box(v3(1.4, SUMMIT_Y + 1.5, 0), v3(0.25, 3, 0.25), OBSIDIAN);
    kit.box(v3(0, SUMMIT_Y + 3, 0), v3(3.1, 0.25, 0.25), OBSIDIAN, { collide: false });
    kit.cylinder(v3(0, SUMMIT_Y + 1.7, 0), 1, 0.12, BRONZE, { collide: false, tilt: { x: Math.PI / 2 } });
    kit.action(v3(0, SUMMIT_Y + 1.2, 0), 'Ring the gong', 'BWONNNG... the sound rolls across the valley.', GONG,
      'Climb to the summit first.');

    // Middle of the landing ring between tier 1's wall (12.8 m) and tier 0's edge (15.5 m).
    const baseLanding = v3(0, BASE_TOP, -(tierRadius(1) + tierRadius(0) + 1.5) / 2);
    kit.trigger(CROSS, baseLanding, 3);
    kit.trigger(CLIMB, summit, 2.5);
    kit.checkpoint(baseLanding);
    kit.checkpoint(midStair, 1.5);

    return {
      jasonSpawn: v3(island.x, island.y + 0.05, island.z),
      jasonYaw: 0,
      elenaSpawn: v3(2, island.y + 0.05, -46.5),
      killY: -5,
      companionSpots: {},
    };
  },
};
