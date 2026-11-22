/**
 * Stage 6 — Thornby Junction.
 *
 * Car 07 is held at a red signal on a branch beside a live main line. The
 * player powers the token instrument from the battery cabinet, crosses the
 * main line to draw the single-line token from the signal box, brings it back
 * to the ground frame by Car 07, and throws the points.
 *
 * New mechanic: through freights. Every 22 s a train thunders down the main
 * line. While it passes, the Listener can't hear anything (sprint, ring the
 * instrument), but being on the main line then is fatal, and the Listener
 * won't step onto the track while a train is due.
 */

export type JunctionTarget = "batteryCabinet" | "tokenInstrument" | "groundFrame" | "carDoor";

export const JUNCTION_BIT = {
  battery: 1,
  token: 2,
  frame: 4,
  boarded: 8,
} as const;

export const JUNCTION_LABELS: Record<JunctionTarget, string> = {
  batteryCabinet: "BATTERY CABINET",
  tokenInstrument: "TOKEN INSTRUMENT",
  groundFrame: "GROUND FRAME",
  carDoor: "CAR 07 DOOR",
};

export const JUNCTION_LINES = {
  arrival: "Thornby Junction. Car 07 waits at a red signal beside the main line. The rails are humming.",
  restored: "Thornby Junction. The main line ticks in the cold.",
  caught: "A hand on your collar, then gravel. You're back by Car 07's door.",
  alert: "Footsteps on the ballast, coming fast.",
  hazard: "Light, a roar, then nothing. You come to by Car 07's door.",
  batteryOn: "You throw the battery isolator. Across the main line, the signal box bell tinkles once.",
  batteryAlready: "The battery is already on.",
  tokenDead: "The token instrument is dead. No current from the battery cabinet.",
  tokenDrawn: "The instrument rings out as a brass token drops into your hand.",
  tokenAlready: "You already have the token.",
  frameLocked: "The ground frame is locked. It wants a single-line token.",
  frameSet: "The token turns the lock. You heave the lever over and the points thump across.",
  frameAlready: "The points are already set.",
  doorRed: "The signal is still red. Car 07 isn't going anywhere.",
  lastCall: "The signal clears. Car 07 eases over the main line and away from Thornby.",
};

export function junctionComplete(bits: number): boolean {
  return (bits & JUNCTION_BIT.boarded) !== 0;
}

export function junctionPointsSet(bits: number): boolean {
  return (bits & JUNCTION_BIT.frame) !== 0;
}

export function junctionObjective(bits: number): string {
  if (junctionComplete(bits)) return "Leave Thornby.";
  if (junctionPointsSet(bits)) return "Board Car 07.";
  if (!(bits & JUNCTION_BIT.battery)) return "Get power to the token instrument.";
  if (!(bits & JUNCTION_BIT.token)) return "Cross the main line and draw the token. Watch for trains.";
  return "Bring the token back to the ground frame.";
}

export function applyJunctionTarget(
  bits: number,
  target: JunctionTarget,
): { bits: number; line: string; noisy: boolean } {
  const has = (b: number) => (bits & b) !== 0;
  switch (target) {
    case "batteryCabinet":
      if (has(JUNCTION_BIT.battery)) return { bits, line: JUNCTION_LINES.batteryAlready, noisy: false };
      return { bits: bits | JUNCTION_BIT.battery, line: JUNCTION_LINES.batteryOn, noisy: false };

    case "tokenInstrument":
      if (has(JUNCTION_BIT.token)) return { bits, line: JUNCTION_LINES.tokenAlready, noisy: false };
      if (!has(JUNCTION_BIT.battery)) return { bits, line: JUNCTION_LINES.tokenDead, noisy: false };
      // Loud, unless a freight is passing (the engine skips the noise then).
      return { bits: bits | JUNCTION_BIT.token, line: JUNCTION_LINES.tokenDrawn, noisy: true };

    case "groundFrame":
      if (has(JUNCTION_BIT.frame)) return { bits, line: JUNCTION_LINES.frameAlready, noisy: false };
      if (!has(JUNCTION_BIT.token)) return { bits, line: JUNCTION_LINES.frameLocked, noisy: false };
      return { bits: bits | JUNCTION_BIT.frame, line: JUNCTION_LINES.frameSet, noisy: true };

    case "carDoor":
      if (!junctionPointsSet(bits)) return { bits, line: JUNCTION_LINES.doorRed, noisy: false };
      return { bits: bits | JUNCTION_BIT.boarded, line: JUNCTION_LINES.lastCall, noisy: false };
  }
}
