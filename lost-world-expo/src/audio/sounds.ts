/**
 * Sound effects and ambience (placeholders synthesised by tools/make-audio.mjs).
 * To use a final recording, replace the file in assets/audio/ with one of the same name.
 */
export const SOUNDS = {
  engine: require('../../assets/audio/engine.wav'),
  alarm: require('../../assets/audio/alarm.wav'),
  crash: require('../../assets/audio/crash.wav'),
  fire: require('../../assets/audio/fire.wav'),
  wind: require('../../assets/audio/wind.wav'),
  jungle: require('../../assets/audio/jungle.wav'),
  cave: require('../../assets/audio/cave.wav'),
  lava: require('../../assets/audio/lava.wav'),
  temple: require('../../assets/audio/temple.wav'),
  pickup: require('../../assets/audio/pickup.wav'),
  door: require('../../assets/audio/door.wav'),
  gong: require('../../assets/audio/gong.wav'),
  splash: require('../../assets/audio/splash.wav'),
  ui: require('../../assets/audio/ui.wav'),
} as const satisfies Record<string, number>;

export type SoundName = keyof typeof SOUNDS;

/** Relative volumes (ambience sits under dialogue). */
export const VOLUME: Partial<Record<SoundName, number>> = {
  engine: 0.55, alarm: 0.5, fire: 0.45, wind: 0.5, jungle: 0.45, cave: 0.5, lava: 0.5, temple: 0.4, ui: 0.5,
};
