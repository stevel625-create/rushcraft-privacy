import type { ObjectiveDef } from '../engine/missions';
import type { Vec3 } from '../engine/physics';
import type { WorldKit } from '../engine/world';

export interface LevelTheme {
  sky: number;
  fog: number;
  fogDensity: number;
  /** Hemisphere light: sky colour, ground colour, intensity. */
  ambientSky: number;
  ambientGround: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  /** Direction the sunlight travels FROM (unit-ish vector). */
  sunFrom: Vec3;
}

export interface LevelLayout {
  jasonSpawn: Vec3;
  jasonYaw: number;
  elenaSpawn: Vec3;
  /** Falling below this height respawns Jason at his last checkpoint. */
  killY: number;
  /** When the keyed objective starts, Elena walks here and holds position. */
  companionSpots: Record<string, Vec3>;
}

export interface LevelDefinition {
  number: number;
  title: string;
  subtitle: string;
  seed: number;
  theme: LevelTheme;
  objectives: ObjectiveDef[];
  build(kit: WorldKit): LevelLayout;
}

export const defaultTheme: LevelTheme = {
  sky: 0x8cb8d1,
  fog: 0x9abfc7,
  fogDensity: 0.012,
  ambientSky: 0xcfe3d8,
  ambientGround: 0x3d4a30,
  ambientIntensity: 1.4,
  sunColor: 0xffedcc,
  sunIntensity: 2.2,
  sunFrom: { x: 0.4, y: 0.8, z: -0.45 },
};

/** Random placement in a disc, skipping cleared areas. Bounded attempts so it never hangs. */
export function scatter(kit: WorldKit, count: number, radius: number, isClear: (x: number, z: number) => boolean,
  place: (x: number, z: number) => void) {
  let placed = 0;
  for (let attempt = 0; placed < count && attempt < count * 10; attempt++) {
    const p = kit.rng.insideCircle(radius);
    if (isClear(p.x, p.y)) continue;
    place(p.x, p.y);
    placed++;
  }
}
