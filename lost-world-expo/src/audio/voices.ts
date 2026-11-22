import type { Speaker } from '../engine/dialogue';

/**
 * Recorded voice lines, by dialogue line id (`<conversation>.<n>`, see src/levels/dialogue.ts).
 * Lines without a recording are read by the device's text-to-speech as placeholder audio.
 *
 * To add a recording:
 *   1. Save it as assets/voice/<line id>.m4a (or .mp3 / .wav), e.g. assets/voice/l1_found.1.m4a
 *   2. Add it here:  'l1_found.1': require('../../assets/voice/l1_found.1.m4a'),
 *   3. Optionally set its length in seconds in VOICE_SECONDS so the subtitle stays up exactly as long.
 */
export const VOICES: Record<string, number> = {
  // 'l1_found.1': require('../../assets/voice/l1_found.1.m4a'),
};

export const VOICE_SECONDS: Record<string, number> = {
  // 'l1_found.1': 4.2,
};

/** Placeholder text-to-speech voice per character (pitch and rate only, so it works on every device). */
export const TTS_VOICE: Record<Speaker, { pitch: number; rate: number }> = {
  Jason: { pitch: 0.82, rate: 1.0 },
  Elena: { pitch: 1.18, rate: 1.02 },
  Pilot: { pitch: 0.95, rate: 1.12 },
  Narrator: { pitch: 0.9, rate: 0.92 },
};
