/**
 * Stage 3 — Yard Nine.
 *
 * Car 07 stops in an open freight yard. To get out on the Yard Nine Line the
 * player must power the signal box, set three track points to match the route
 * card, pull the signal lever, then board Car 07.
 *
 * The twist: every lever is loud. Throwing a point or the signal lever draws
 * the Listener to that spot (the reverse of Bellweather's crossing bell, which
 * the player rang to lure it away).
 *
 * Progress is a bitmask, like Bellweather, so it saves as a single number.
 */

export type YardTarget =
  | "yardBreaker"
  | "routeBoard"
  | "pointA"
  | "pointB"
  | "pointC"
  | "signalLever"
  | "carDoor";

export const YARD_BIT = {
  power: 1,
  pointA: 2, // set = reversed, clear = normal
  pointB: 4,
  pointC: 8,
  route: 16, // signal pulled off, route locked
  boarded: 32,
} as const;

const POINTS = YARD_BIT.pointA | YARD_BIT.pointB | YARD_BIT.pointC;
/** The route card: A reversed, B normal, C reversed. */
export const YARD_ROUTE = YARD_BIT.pointA | YARD_BIT.pointC;

const POINT_BIT: Record<"pointA" | "pointB" | "pointC", number> = {
  pointA: YARD_BIT.pointA,
  pointB: YARD_BIT.pointB,
  pointC: YARD_BIT.pointC,
};

export const YARD_LABELS: Record<YardTarget, string> = {
  yardBreaker: "SIGNAL BOX BREAKER",
  routeBoard: "ROUTE CARD",
  pointA: "POINT LEVER A",
  pointB: "POINT LEVER B",
  pointC: "POINT LEVER C",
  signalLever: "SIGNAL LEVER",
  carDoor: "CAR 07 DOOR",
};

export const YARD_LINES = {
  arrival: "Yard Nine. The doors open onto gravel and sodium light. The signal ahead is red.",
  restored: "Yard Nine. The floodlights hum.",
  caught: "Hands on the gravel. You're back at Car 07's door.",
  alert: "Something is crossing the tracks toward the noise.",
  powerOn: "The breaker drops in. The signal box lights flicker on, one by one.",
  powerAlready: "The breaker is already in.",
  boardDark: "The route card is too dark to read. The box has no power.",
  boardRead: "Route card, Yard Nine Line: A reversed, B normal, C reversed.",
  noPower: "The signal lever won't budge. The interlocking is dead without power.",
  locked: "The lever is locked. The route is already set.",
  routeWrong: "The lever jams halfway with a bang. The points don't match the route.",
  routeSet: "The signal drops to green. Somewhere behind you, Car 07's doors chime.",
  doorShut: "Car 07's doors stay shut. The signal is still red.",
  lastCall: "The doors close behind you. Car 07 pulls out onto the Yard Nine Line.",
};

export function yardComplete(bits: number): boolean {
  return (bits & YARD_BIT.boarded) !== 0;
}

export function yardRouteSet(bits: number): boolean {
  return (bits & YARD_BIT.route) !== 0;
}

/** Whether a point is currently reversed. */
export function pointReversed(bits: number, point: "pointA" | "pointB" | "pointC"): boolean {
  return (bits & POINT_BIT[point]) !== 0;
}

export function yardObjective(bits: number): string {
  if (yardComplete(bits)) return "Ride the Yard Nine Line.";
  if (yardRouteSet(bits)) return "Board Car 07.";
  if (!(bits & YARD_BIT.power)) return "Restore power to the signal box.";
  return "Set the points to match the route card, then pull the signal lever.";
}

export type YardResult = {
  bits: number;
  line: string;
  /** True when the action makes a noise the Listener can hear. */
  noisy: boolean;
};

export function applyYardTarget(bits: number, target: YardTarget): YardResult {
  const powered = (bits & YARD_BIT.power) !== 0;
  const routeSet = yardRouteSet(bits);
  switch (target) {
    case "yardBreaker":
      if (powered) return { bits, line: YARD_LINES.powerAlready, noisy: false };
      return { bits: bits | YARD_BIT.power, line: YARD_LINES.powerOn, noisy: true };

    case "routeBoard":
      return { bits, line: powered ? YARD_LINES.boardRead : YARD_LINES.boardDark, noisy: false };

    case "pointA":
    case "pointB":
    case "pointC": {
      if (routeSet) return { bits, line: YARD_LINES.locked, noisy: false };
      const next = bits ^ POINT_BIT[target];
      const letter = target.slice(-1);
      const state = pointReversed(next, target) ? "reversed" : "normal";
      // Points are mechanical: they work without power, and they're loud.
      return { bits: next, line: `Point ${letter} slams over to ${state}.`, noisy: true };
    }

    case "signalLever":
      if (!powered) return { bits, line: YARD_LINES.noPower, noisy: false };
      if (routeSet) return { bits, line: YARD_LINES.locked, noisy: false };
      if ((bits & POINTS) !== YARD_ROUTE) return { bits, line: YARD_LINES.routeWrong, noisy: true };
      return { bits: bits | YARD_BIT.route, line: YARD_LINES.routeSet, noisy: true };

    case "carDoor":
      if (!routeSet) return { bits, line: YARD_LINES.doorShut, noisy: false };
      return { bits: bits | YARD_BIT.boarded, line: YARD_LINES.lastCall, noisy: false };
  }
}
