import { Emitter } from './events';

export interface ObjectiveDef {
  id: string;
  title: string;
}

type MissionEvents = {
  started: [ObjectiveDef];
  completed: [ObjectiveDef];
  progress: [ObjectiveDef, number, number];
  levelComplete: [];
};

/**
 * Ordered objectives for the current level. World mechanics call complete(id);
 * only the active objective can complete, so out-of-order calls are ignored.
 */
export class MissionManager extends Emitter<MissionEvents> {
  private objectives: ObjectiveDef[] = [];
  index = 0;

  get current(): ObjectiveDef | null {
    return this.objectives[this.index] ?? null;
  }

  get currentId(): string | null {
    return this.current?.id ?? null;
  }

  get isLevelComplete() {
    return this.objectives.length > 0 && this.index >= this.objectives.length;
  }

  get count() {
    return this.objectives.length;
  }

  load(objectives: ObjectiveDef[], startIndex = 0) {
    this.objectives = objectives;
    this.index = Math.max(0, Math.min(startIndex, objectives.length));
    if (this.current) this.emit('started', this.current);
  }

  complete(id: string): boolean {
    const cur = this.current;
    if (!cur || cur.id !== id) return false;
    this.index++;
    this.emit('completed', cur);
    if (this.current) this.emit('started', this.current);
    else this.emit('levelComplete');
    return true;
  }

  isCompleted(id: string): boolean {
    return this.objectives.slice(0, this.index).some((o) => o.id === id);
  }

  reportProgress(id: string, current: number, total: number) {
    if (this.current?.id === id) this.emit('progress', this.current, current, total);
  }
}
