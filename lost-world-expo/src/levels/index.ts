import { level1 } from './level1Crash';
import { level2 } from './level2SunkenGate';
import { level3 } from './level3Canopy';
import { level4 } from './level4Caves';
import { level5 } from './level5Peak';
import { level6 } from './level6Sanctum';
import type { LevelDefinition } from './types';

/** All playable levels in order. Level N+1 unlocks when level N is completed. */
export const LEVELS: LevelDefinition[] = [level1, level2, level3, level4, level5, level6];
