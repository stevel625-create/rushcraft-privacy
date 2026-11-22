import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import type { DialogueLine } from '../engine/dialogue';
import { SOUNDS, VOLUME, type SoundName } from './sounds';
import { TTS_VOICE, VOICES } from './voices';

const isSound = (n: string): n is SoundName => n in SOUNDS;

/**
 * Plays the game's audio with expo-audio (included in Expo Go): one-shot effects, looping effects,
 * per-level ambience, and dialogue voices (recording if registered, otherwise text-to-speech).
 * Every call is guarded: an audio failure never interrupts gameplay.
 */
export class AudioService {
  private readonly players = new Map<string, AudioPlayer>();
  private readonly loops = new Set<string>();
  private ambience: string | null = null;
  private voice: AudioPlayer | null = null;
  private paused = false;
  muted = false;

  async init() {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
    } catch (e) {
      console.warn('[LostWorld] audio mode:', e);
    }
  }

  private player(name: SoundName) {
    let p = this.players.get(name);
    if (!p) {
      p = createAudioPlayer(SOUNDS[name]);
      p.volume = VOLUME[name] ?? 0.9;
      this.players.set(name, p);
    }
    return p;
  }

  private safe(fn: () => void) {
    try { fn(); } catch (e) { console.warn('[LostWorld] audio:', e); }
  }

  /** One-shot effect (restarts if already playing). */
  play(name: string) {
    if (this.muted || !isSound(name)) return;
    this.safe(() => {
      const p = this.player(name);
      p.loop = false;
      p.seekTo(0).catch(() => {});
      p.play();
    });
  }

  loop(name: string, on: boolean) {
    if (!isSound(name)) return;
    this.safe(() => {
      const p = this.player(name);
      if (on) {
        this.loops.add(name);
        p.loop = true;
        if (!this.muted && !this.paused) p.play();
      } else {
        this.loops.delete(name);
        p.pause();
      }
    });
  }

  setAmbience(name: string | null) {
    if (name === this.ambience) return;
    if (this.ambience) this.loop(this.ambience, false);
    this.ambience = name && isSound(name) ? name : null;
    if (this.ambience) this.loop(this.ambience, true);
  }

  /** Speak a dialogue line: the recorded file if one is registered, otherwise text-to-speech. */
  say(line: DialogueLine | null) {
    this.safe(() => {
      Speech.stop().catch(() => {});
      this.voice?.pause();
      if (!line || this.muted) return;
      const rec = VOICES[line.id];
      if (rec !== undefined) {
        this.voice?.remove();
        this.voice = createAudioPlayer(rec);
        this.voice.play();
      } else {
        const v = TTS_VOICE[line.speaker];
        Speech.speak(line.text, { pitch: v.pitch, rate: v.rate, language: 'en-US' });
      }
    });
  }

  haptic(kind: 'impact') {
    if (kind === 'impact') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }

  /** Pause menu: silence everything, remembering which loops were running. */
  pauseAll() {
    this.paused = true;
    this.safe(() => {
      for (const n of this.loops) this.players.get(n)?.pause();
      this.voice?.pause();
      Speech.stop().catch(() => {});
    });
  }

  resumeAll() {
    this.paused = false;
    if (this.muted) return;
    this.safe(() => { for (const n of this.loops) this.players.get(n)?.play(); });
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (m) this.pauseAll(); else this.resumeAll();
  }

  dispose() {
    this.safe(() => {
      Speech.stop().catch(() => {});
      this.players.forEach((p) => p.remove());
      this.voice?.remove();
    });
    this.players.clear();
  }
}
