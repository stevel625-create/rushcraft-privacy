import { SkinnedCharacter } from '../models/skinnedCharacter';
import { buildCharacter, type CharacterSpec } from './build';
import { RUN_SPEED, WALK_SPEED, makeClips } from './clips';

/**
 * Built-in characters: original models generated in code (no third-party assets, no licence limits),
 * one skinned mesh each (2 materials), with keyframed Idle / Walk / Run / Jump clips.
 * Rigged Mixamo models installed via tools/prepare-models.mjs replace them at runtime.
 */
export const JASON: CharacterSpec = {
  height: 1.82, fem: 0, build: 1.04,
  skin: 0xb98366, lips: 0xa1645a, iris: 0x4a3524, hair: 0x2b1d14, hairStyle: 'short',
  top: 0x9c8a62, topStyle: 'shortSleeve', pants: 0x5b5a3f, belt: 0x3b2a1c, boots: 0x4a3626,
  pack: 0x6b5a3a, packStyle: 'large', bedroll: 0x4c5a3a,
};

export const ELENA: CharacterSpec = {
  height: 1.68, fem: 1, build: 0.92,
  skin: 0xa87256, lips: 0x9c5a52, iris: 0x3b2618, hair: 0x23160f, hairStyle: 'ponytail',
  top: 0x55604a, topStyle: 'tank', pants: 0x8a7a5c, belt: 0x3a2a1d, boots: 0x3c2c20,
  pack: 0x5c5236, packStyle: 'small',
};

export function createCharacter(spec: CharacterSpec): SkinnedCharacter {
  const built = buildCharacter(spec);
  return new SkinnedCharacter(built.root, makeClips(built.rest.Hips), spec.height, { walkRef: WALK_SPEED, runRef: RUN_SPEED });
}
