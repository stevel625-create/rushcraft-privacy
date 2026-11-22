import type { InputState } from '../engine/input';

export type ButtonId = 'jump' | 'use';

export interface ButtonZone {
  id: ButtonId;
  x: number;
  y: number;
  r: number;
}

export interface JoystickVisual {
  active: boolean;
  ox: number;
  oy: number;
  kx: number;
  ky: number;
}

export const JOY_RADIUS = 70;

/** Button positions for a screen size (pure, so the HUD can draw them during render). */
export function buttonZones(width: number, height: number): ButtonZone[] {
  return [
    { id: 'jump', x: width - 100, y: height - 95, r: 58 },
    { id: 'use', x: width - 225, y: height - 165, r: 48 },
  ];
}

/**
 * Turns gesture callbacks into game input. Each control zone (left stick, right camera area,
 * buttons) has its own native gesture, so several fingers work at once.
 */
export class TouchController {
  joystick: JoystickVisual = { active: false, ox: 0, oy: 0, kx: 0, ky: 0 };

  constructor(private input: InputState) {}

  /** Finger down in the stick zone: the stick centres under the thumb (floating joystick). */
  stickStart(x: number, y: number) {
    this.joystick = { active: true, ox: x, oy: y, kx: x, ky: y };
    this.input.setMove(0, 0);
  }

  /** Finger moved: (x, y) is its current screen position. */
  stickMove(x: number, y: number) {
    if (!this.joystick.active) this.stickStart(x, y);
    let dx = x - this.joystick.ox, dy = y - this.joystick.oy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_RADIUS) { dx *= JOY_RADIUS / d; dy *= JOY_RADIUS / d; }
    this.joystick = { ...this.joystick, kx: this.joystick.ox + dx, ky: this.joystick.oy + dy };
    // Screen y grows downward; stick "forward" is up.
    this.input.setMove(dx / JOY_RADIUS, -dy / JOY_RADIUS);
  }

  stickEnd() {
    this.joystick = { ...this.joystick, active: false };
    this.input.setMove(0, 0);
  }

  /** Camera drag by (dx, dy) pixels since the last update. */
  look(dx: number, dy: number) {
    this.input.addLook(dx, dy);
  }

  press(id: ButtonId) {
    if (id === 'jump') this.input.queueJump();
    else this.input.queueInteract();
  }

  reset() {
    this.stickEnd();
  }
}
