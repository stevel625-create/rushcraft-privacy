import type { InputState } from '../engine/input';

export type ButtonId = 'jump' | 'use';

export interface ButtonZone {
  id: ButtonId;
  x: number;
  y: number;
  r: number;
}

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export interface JoystickVisual {
  active: boolean;
  ox: number;
  oy: number;
  kx: number;
  ky: number;
}

const JOY_RADIUS = 70;

/** Button positions for a screen size (pure, so the HUD can draw them during render). */
export function buttonZones(width: number, height: number): ButtonZone[] {
  return [
    { id: 'jump', x: width - 100, y: height - 95, r: 58 },
    { id: 'use', x: width - 225, y: height - 165, r: 48 },
  ];
}

/**
 * Multi-touch controls from one full-screen touch surface:
 * left half = floating joystick, right half = camera drag, circles = Jump / Use buttons.
 * One surface avoids React Native's single-responder limit (moving + jumping at once).
 */
export class TouchController {
  buttons: ButtonZone[] = [];
  useEnabled = false;
  joystick: JoystickVisual = { active: false, ox: 0, oy: 0, kx: 0, ky: 0 };
  private width = 1;
  private moveId: number | null = null;
  private lookId: number | null = null;
  private lastLook = { x: 0, y: 0 };

  constructor(private input: InputState) {}

  layout(width: number, height: number) {
    this.width = width;
    this.buttons = buttonZones(width, height);
  }

  setUseEnabled(enabled: boolean) {
    this.useEnabled = enabled;
  }

  private hitButton(t: TouchPoint): ButtonId | null {
    for (const b of this.buttons) {
      if (b.id === 'use' && !this.useEnabled) continue;
      if (Math.hypot(t.x - b.x, t.y - b.y) <= b.r + 12) return b.id;
    }
    return null;
  }

  start(touches: TouchPoint[]) {
    for (const t of touches) {
      const btn = this.hitButton(t);
      if (btn === 'jump') { this.input.queueJump(); continue; }
      if (btn === 'use') { this.input.queueInteract(); continue; }
      if (t.x < this.width / 2 && this.moveId === null) {
        this.moveId = t.id;
        this.joystick = { active: true, ox: t.x, oy: t.y, kx: t.x, ky: t.y };
        this.input.setMove(0, 0);
      } else if (t.x >= this.width / 2 && this.lookId === null) {
        this.lookId = t.id;
        this.lastLook = { x: t.x, y: t.y };
      }
    }
  }

  move(touches: TouchPoint[]) {
    for (const t of touches) {
      if (t.id === this.moveId) {
        let dx = t.x - this.joystick.ox, dy = t.y - this.joystick.oy;
        const d = Math.hypot(dx, dy);
        if (d > JOY_RADIUS) { dx *= JOY_RADIUS / d; dy *= JOY_RADIUS / d; }
        this.joystick = { ...this.joystick, kx: this.joystick.ox + dx, ky: this.joystick.oy + dy };
        // Screen y grows downward; stick "forward" is up.
        this.input.setMove(dx / JOY_RADIUS, -dy / JOY_RADIUS);
      } else if (t.id === this.lookId) {
        this.input.addLook(t.x - this.lastLook.x, t.y - this.lastLook.y);
        this.lastLook = { x: t.x, y: t.y };
      }
    }
  }

  end(touches: TouchPoint[]) {
    for (const t of touches) {
      if (t.id === this.moveId) {
        this.moveId = null;
        this.joystick = { ...this.joystick, active: false };
        this.input.setMove(0, 0);
      }
      if (t.id === this.lookId) this.lookId = null;
    }
  }

  reset() {
    this.moveId = this.lookId = null;
    this.joystick = { ...this.joystick, active: false };
    this.input.setMove(0, 0);
  }
}
