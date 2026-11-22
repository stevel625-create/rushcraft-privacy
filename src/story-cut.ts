/**
 * Stage 7 — Gallows Cut.
 *
 * Car 07 dies at the mouth of a half-collapsed tunnel. Traction power has
 * tripped. The player takes a brakeman's signal lamp from the stores cage,
 * walks into the dark to reset two breakers (the second at the rubble wall
 * deep inside), then throws the traction switch at the portal and boards.
 *
 * New mechanic: the lamp is a weapon. Holding its beam on the Listener
 * stuns it for a few seconds, at a heavy cost in charge. Refuge niches in the
 * tunnel walls work as hiding spots.
 */

export type CutTarget =
  | "lampCage"
  | "breakerA"
  | "breakerB"
  | "tractionSwitch"
  | "carDoor"
  | "refuge1"
  | "refuge2"
  | "refuge3"
  | "refuge4";

export const CUT_BIT = {
  lamp: 1,
  breakerA: 2,
  breakerB: 4,
  traction: 8,
  boarded: 16,
} as const;

const BOTH = CUT_BIT.breakerA | CUT_BIT.breakerB;

export const CUT_LABELS: Record<CutTarget, string> = {
  lampCage: "STORES CAGE",
  breakerA: "TRACTION BREAKER A",
  breakerB: "TRACTION BREAKER B",
  tractionSwitch: "TRACTION SWITCH",
  carDoor: "CAR 07 DOOR",
  refuge1: "STEP INTO REFUGE",
  refuge2: "STEP INTO REFUGE",
  refuge3: "STEP INTO REFUGE",
  refuge4: "STEP INTO REFUGE",
};

export const CUT_LINES = {
  arrival: "Gallows Cut. Car 07's lights die at the tunnel mouth. Inside, only dark.",
  restored: "Gallows Cut. Water ticks from the tunnel roof.",
  caught: "Hands out of the dark. You're back at the tunnel mouth.",
  alert: "It's coming down the tunnel. There's nowhere to go but past it.",
  hideLine: "You press yourself into the refuge. Don't breathe.",
  unhideLine: "You slip out of the refuge.",
  lampTaken: "A brakeman's signal lamp, still charged. Hold its beam on anything that comes for you.",
  lampGone: "The stores cage is empty.",
  breakerSet: "You slam the breaker home. It arcs blue and bangs like a shot.",
  breakerAlready: "That breaker is already set.",
  switchDead: "The traction switch won't hold. Both tunnel breakers are still tripped.",
  traction: "You throw the switch. Car 07's lights blaze up behind you. Traction restored.",
  doorDead: "Car 07 is dark and dead. No traction.",
  lastCall: "The doors close. Car 07 grinds into Gallows Cut, headlights carving the dark.",
  stun: "The lamp flares. It reels back, clawing at its face.",
};

export function cutComplete(bits: number): boolean {
  return (bits & CUT_BIT.boarded) !== 0;
}

export function cutTraction(bits: number): boolean {
  return (bits & CUT_BIT.traction) !== 0;
}

/** Holding the signal lamp: the beam can stun the Listener. */
export function cutCanStun(bits: number): boolean {
  return (bits & CUT_BIT.lamp) !== 0;
}

export function cutObjective(bits: number): string {
  if (cutComplete(bits)) return "Ride into the Cut.";
  if (cutTraction(bits)) return "Board Car 07.";
  if (!(bits & CUT_BIT.lamp)) return "Find a light worth carrying.";
  if ((bits & BOTH) !== BOTH) {
    const left = [!(bits & CUT_BIT.breakerA) && "A", !(bits & CUT_BIT.breakerB) && "B"].filter(Boolean);
    return `Reset breaker${left.length > 1 ? "s" : ""} ${left.join(" and ")} in the tunnel.`;
  }
  return "Throw the traction switch at the portal.";
}

export function applyCutTarget(bits: number, target: CutTarget): { bits: number; line: string; noisy: boolean } {
  const has = (b: number) => (bits & b) !== 0;
  switch (target) {
    case "lampCage":
      if (has(CUT_BIT.lamp)) return { bits, line: CUT_LINES.lampGone, noisy: false };
      return { bits: bits | CUT_BIT.lamp, line: CUT_LINES.lampTaken, noisy: false };

    case "breakerA":
    case "breakerB": {
      const bit = target === "breakerA" ? CUT_BIT.breakerA : CUT_BIT.breakerB;
      if (has(bit)) return { bits, line: CUT_LINES.breakerAlready, noisy: false };
      return { bits: bits | bit, line: CUT_LINES.breakerSet, noisy: true };
    }

    case "tractionSwitch":
      if (has(CUT_BIT.traction)) return { bits, line: CUT_LINES.traction, noisy: false };
      if ((bits & BOTH) !== BOTH) return { bits, line: CUT_LINES.switchDead, noisy: false };
      return { bits: bits | CUT_BIT.traction, line: CUT_LINES.traction, noisy: false };

    case "carDoor":
      if (!cutTraction(bits)) return { bits, line: CUT_LINES.doorDead, noisy: false };
      return { bits: bits | CUT_BIT.boarded, line: CUT_LINES.lastCall, noisy: false };

    default:
      // Refuges are hiding spots, handled by the engine.
      return { bits, line: "", noisy: false };
  }
}
