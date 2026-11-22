/**
 * Per-frame input shared by touch controls, keyboard (web), and the test autopilot.
 * The game reads it once per frame; one-shot actions (jump, interact) are consumed when read.
 */
export class InputState {
  /** Stick, x = right, y = forward, length <= 1. Camera-relative. */
  moveX = 0;
  moveY = 0;
  /** Accumulated camera drag in pixels since last frame. */
  lookDX = 0;
  lookDY = 0;
  private jumpQueued = false;
  private interactQueued = false;

  /** Autopilot/tests: world-space move direction (x, z) that bypasses the camera. */
  worldMove: { x: number; z: number } | null = null;

  setMove(x: number, y: number) {
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.moveX = x;
    this.moveY = y;
  }

  addLook(dx: number, dy: number) {
    this.lookDX += dx;
    this.lookDY += dy;
  }

  queueJump() { this.jumpQueued = true; }
  queueInteract() { this.interactQueued = true; }

  consumeJump() { const j = this.jumpQueued; this.jumpQueued = false; return j; }
  consumeInteract() { const i = this.interactQueued; this.interactQueued = false; return i; }

  consumeLook() {
    const d = { dx: this.lookDX, dy: this.lookDY };
    this.lookDX = this.lookDY = 0;
    return d;
  }

  reset() {
    this.moveX = this.moveY = this.lookDX = this.lookDY = 0;
    this.jumpQueued = this.interactQueued = false;
    this.worldMove = null;
  }
}
