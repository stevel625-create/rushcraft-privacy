import manifest from '@lostworld/models';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type * as THREE from 'three';
import { SkinnedCharacter, applyTextures, decodeLwtex, parseGlb, retargetClips } from './skinnedCharacter';
import { ensureTextDecoder } from './textDecoder';
import type { ModelEntry, TextureSlot } from './types';

/** Read a bundled asset's bytes (file system on device, fetch on web). */
async function readAsset(mod: number): Promise<ArrayBuffer> {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (Platform.OS === 'web') return (await fetch(uri)).arrayBuffer();
  return new File(uri).arrayBuffer();
}

async function loadEntry(entry: ModelEntry) {
  const { scene, animations } = await parseGlb(await readAsset(entry.glb));
  const textures: Record<string, Partial<Record<TextureSlot, THREE.Texture>>> = {};
  for (const [material, slots] of Object.entries(entry.materials)) {
    textures[material] = {};
    for (const [slot, mod] of Object.entries(slots) as [TextureSlot, number][]) {
      textures[material][slot] = decodeLwtex(await readAsset(mod), slot);
    }
  }
  applyTextures(scene, textures);
  return { scene, animations };
}

export interface LoadedCharacters {
  jason?: SkinnedCharacter;
  elena?: SkinnedCharacter;
}

/**
 * Load the prepared character models, if any (see tools/prepare-models.mjs).
 * Returns null when no models are installed, so the game keeps its built-in characters.
 * Elena reuses Jason's Idle/Walk/Run if her file has no animations (same Mixamo skeleton).
 */
export async function loadCharacterModels(): Promise<LoadedCharacters | null> {
  if (!manifest) return null;
  ensureTextDecoder();
  const out: LoadedCharacters = {};
  let jasonClips: THREE.AnimationClip[] = [];
  if (manifest.jason) {
    const j = await loadEntry(manifest.jason);
    jasonClips = j.animations;
    out.jason = new SkinnedCharacter(j.scene, j.animations, 1.8);
  }
  if (manifest.elena) {
    const e = await loadEntry(manifest.elena);
    const clips = e.animations.length ? e.animations : retargetClips(jasonClips);
    out.elena = new SkinnedCharacter(e.scene, clips, 1.68);
  }
  return out;
}
