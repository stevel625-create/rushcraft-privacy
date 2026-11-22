/** Tiny typed event emitter (no dependency on Node's EventEmitter, which React Native lacks). */
export class Emitter<Events extends Record<string, unknown[]>> {
  private readonly handlers: { [K in keyof Events]?: ((...args: Events[K]) => void)[] } = {};

  on<K extends keyof Events>(event: K, fn: (...args: Events[K]) => void): () => void {
    (this.handlers[event] ??= []).push(fn);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: (...args: Events[K]) => void) {
    const list = this.handlers[event];
    if (list) this.handlers[event] = list.filter((f) => f !== fn);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]) {
    for (const fn of this.handlers[event] ?? []) fn(...args);
  }
}
