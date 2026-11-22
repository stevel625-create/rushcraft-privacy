import { Emitter } from './events';

export type Speaker = 'Jason' | 'Elena' | 'Pilot' | 'Narrator';

export interface DialogueLine {
  /** Stable id `<conversation>.<n>`: recorded voice files are looked up by this id. */
  id: string;
  speaker: Speaker;
  text: string;
  /** Seconds on screen. Defaults to a reading-time estimate (or the recording's length if registered). */
  duration?: number;
}

export interface Conversation {
  id: string;
  lines: { speaker: Speaker; text: string; duration?: number }[];
}

type DialogueEvents = {
  /** A line starts (null = subtitles cleared). */
  line: [DialogueLine | null];
  finished: [conversationId: string];
};

/** Reading-time estimate: ~2.6 words per second plus a beat, within sensible bounds. */
export function estimateDuration(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2.2, Math.min(8, 1.0 + words * 0.38));
}

/**
 * Plays conversations line by line with subtitles. Non-blocking: gameplay continues while people talk.
 * A new conversation queues behind the current one unless it interrupts.
 */
export class DialogueManager extends Emitter<DialogueEvents> {
  private queue: Conversation[] = [];
  private conv: Conversation | null = null;
  private index = -1;
  private remaining = 0;
  /** Recorded-line lengths in seconds, by line id (set by the audio layer when recordings exist). */
  recordedDurations: Record<string, number> = {};

  get current(): DialogueLine | null {
    if (!this.conv || this.index < 0) return null;
    return this.lineAt(this.conv, this.index);
  }

  get busy() { return this.conv !== null; }

  private lineAt(c: Conversation, i: number): DialogueLine {
    const l = c.lines[i];
    const id = `${c.id}.${i + 1}`;
    return { id, speaker: l.speaker, text: l.text, duration: l.duration ?? this.recordedDurations[id] ?? estimateDuration(l.text) };
  }

  play(c: Conversation, interrupt = false) {
    if (interrupt) { this.queue = []; this.finish(); }
    if (this.conv) { this.queue.push(c); return; }
    this.conv = c;
    this.index = -1;
    this.advance();
  }

  private advance() {
    if (!this.conv) return;
    this.index++;
    if (this.index >= this.conv.lines.length) { this.finish(); this.next(); return; }
    const line = this.lineAt(this.conv, this.index);
    this.remaining = line.duration!;
    this.emit('line', line);
  }

  private finish() {
    if (!this.conv) return;
    const id = this.conv.id;
    this.conv = null;
    this.index = -1;
    this.emit('line', null);
    this.emit('finished', id);
  }

  private next() {
    const c = this.queue.shift();
    if (c) this.play(c);
  }

  update(dt: number) {
    if (!this.conv) return;
    this.remaining -= dt;
    if (this.remaining <= 0) this.advance();
  }

  /** Skip to the next line (tap on the subtitle box). */
  skipLine() { if (this.conv) this.advance(); }

  clear() { this.queue = []; this.finish(); }
}
