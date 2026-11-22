import type { Game } from '../src/engine/game';

export type Step =
  | { goto: [number, number]; tol?: number; walk?: boolean }
  | { face: [number, number] }
  | { interact: number }
  | { until: (g: Game) => boolean; label: string; timeout?: number; hold?: [number, number] }
  | { wait: number };

export interface RunResult {
  ok: boolean;
  seconds: number;
  log: string[];
}

const DT = 1 / 60;

/**
 * Plays the game through a list of steps at a fixed 60 Hz timestep.
 * Auto-jumps when the ground ahead drops away (gaps) or a low ledge blocks the way, like a player would.
 */
export function runAutopilot(game: Game, steps: Step[], maxSeconds = 600): RunResult {
  const log: string[] = [];
  let t = 0;
  const body = game.player.body;
  const tick = () => { game.update(DT); t += DT; };
  const where = () => `(${body.pos.x.toFixed(1)}, ${body.pos.y.toFixed(1)}, ${body.pos.z.toFixed(1)})`;

  for (const [i, step] of steps.entries()) {
    if ('goto' in step) {
      const [tx, tz] = step.goto, tol = step.tol ?? 0.6;
      let best = Infinity, sinceProgress = 0;
      for (;;) {
        const dx = tx - body.pos.x, dz = tz - body.pos.z, d = Math.hypot(dx, dz);
        if (d <= tol || game.missions.isLevelComplete) break;
        const ux = dx / d, uz = dz / d;
        const s = step.walk ? 0.6 : 1;
        game.input.worldMove = { x: ux * s, z: uz * s };
        if (body.grounded) {
          const physics = game.world!.physics;
          const ahead = physics.surfaceAt(body.pos.x + ux * 0.9, body.pos.z + uz * 0.9, body.pos.y + 0.35);
          const ledge = physics.surfaceAt(body.pos.x + ux * 0.6, body.pos.z + uz * 0.6, body.pos.y + 1.3);
          const gap = ahead < body.pos.y - 0.5 && d > 1.2;
          const lowLedge = ledge > body.pos.y + 0.35 && ledge <= body.pos.y + 1.3;
          if (gap || lowLedge) game.input.queueJump();
        }
        tick();
        if (d < best - 0.05) { best = d; sinceProgress = 0; } else sinceProgress += DT;
        if (sinceProgress > 4 || t > maxSeconds) {
          game.input.worldMove = null;
          log.push(`step ${i} goto(${tx}, ${tz}) stuck at ${where()} after ${t.toFixed(1)}s`);
          return { ok: false, seconds: t, log };
        }
      }
      game.input.worldMove = null;
      // Land before the next waypoint, like a player would (air control lets us drop straight down).
      for (let k = 0; k < 90 && !body.grounded; k++) tick();
    } else if ('face' in step) {
      const [tx, tz] = step.face;
      for (let k = 0; k < 30; k++) {
        const dx = tx - body.pos.x, dz = tz - body.pos.z, d = Math.hypot(dx, dz) || 1;
        game.input.worldMove = { x: (dx / d) * 0.005, z: (dz / d) * 0.005 };
        tick();
      }
      game.input.worldMove = null;
    } else if ('interact' in step) {
      for (let k = 0; k < step.interact; k++) {
        game.input.queueInteract();
        for (let w = 0; w < 40; w++) tick();
      }
    } else if ('until' in step) {
      const limit = t + (step.timeout ?? 30);
      while (!step.until(game)) {
        if (step.hold) {
          const dx = step.hold[0] - body.pos.x, dz = step.hold[1] - body.pos.z, d = Math.hypot(dx, dz);
          game.input.worldMove = d > 0.25 ? { x: (dx / d) * 0.6, z: (dz / d) * 0.6 } : null;
        }
        tick();
        if (t > limit) {
          game.input.worldMove = null;
          log.push(`step ${i} until "${step.label}" timed out at ${where()}; Elena at (${game.companion.body.pos.x.toFixed(1)}, ${game.companion.body.pos.y.toFixed(1)}, ${game.companion.body.pos.z.toFixed(1)}) state=${game.companion.state}; objective=${game.missions.currentId}`);
          return { ok: false, seconds: t, log };
        }
      }
      game.input.worldMove = null;
    } else {
      const end = t + step.wait;
      while (t < end) tick();
    }
  }
  return { ok: true, seconds: t, log };
}
