/**
 * Stage 8 (finale) — Hallow Cross Terminus.
 *
 * The end of the line. Car 07 stops at a vast, dead terminus. Three relays
 * power the street gates: one across the ghost line on Platform 1, one in the
 * flooded booking hall, one in the left-luggage room. With all three live,
 * the gate control in the ticket office opens the gates, and the player walks
 * out into the street. Car 07 doesn't leave this time; you do.
 *
 * Everything at once: two Listeners, a ghost train that silences the station
 * and kills anyone on its track, floodwater, lockers to hide in, and the
 * signal lamp, which still stuns, but now there are two of them.
 */

export type TerminusTarget =
  | "relayPlatform"
  | "relayHall"
  | "relayLuggage"
  | "gateControl"
  | "exitGates"
  | "locker1"
  | "locker2"
  | "locker3";

export const TERMINUS_BIT = {
  relayPlatform: 1,
  relayHall: 2,
  relayLuggage: 4,
  gates: 8,
  escaped: 16,
} as const;

const RELAYS = TERMINUS_BIT.relayPlatform | TERMINUS_BIT.relayHall | TERMINUS_BIT.relayLuggage;
const RELAY_NAMES: [number, string][] = [
  [TERMINUS_BIT.relayPlatform, "Platform 1"],
  [TERMINUS_BIT.relayHall, "the booking hall"],
  [TERMINUS_BIT.relayLuggage, "left luggage"],
];

export const TERMINUS_LABELS: Record<TerminusTarget, string> = {
  relayPlatform: "GATE RELAY",
  relayHall: "GATE RELAY",
  relayLuggage: "GATE RELAY",
  gateControl: "GATE CONTROL",
  exitGates: "STREET GATES",
  locker1: "HIDE IN LOCKER",
  locker2: "HIDE IN LOCKER",
  locker3: "HIDE IN LOCKER",
};

export const TERMINUS_LINES = {
  arrival:
    "Hallow Cross Terminus. The end of the line. Car 07's doors open, and somewhere in the dark two sets of footsteps stop.",
  restored: "Hallow Cross. The great clock is stuck at a minute to midnight.",
  caught: "They drag you back to Car 07's door. They're in no hurry.",
  alert: "Footsteps from two directions now.",
  hazard: "The ghost train passes through you. You wake at Car 07's door.",
  hideLine: "You fold yourself into a left-luggage locker. Two sets of steps. Then one. Then none.",
  unhideLine: "You ease the locker open.",
  stun: "The lamp flares. One of them reels back. The other doesn't stop.",
  relaySet: "The relay slams shut with a crack like a pistol. Somewhere a gate motor stirs.",
  relayAlready: "That relay is already live.",
  gatesOpen: "You turn the key. Far ahead, the street gates shudder and grind open. Everything heard that.",
  gatesAlready: "The gates are open. Go.",
  exitShut: "The street gates are chained and dead. The motors need power.",
  lastCall:
    "You step through the gates into cold air and streetlight. Behind you the station falls silent. The end of the line.",
};

export function terminusComplete(bits: number): boolean {
  return (bits & TERMINUS_BIT.escaped) !== 0;
}

export function terminusGatesOpen(bits: number): boolean {
  return (bits & TERMINUS_BIT.gates) !== 0;
}

export function terminusObjective(bits: number): string {
  if (terminusComplete(bits)) return "You made it out.";
  if (terminusGatesOpen(bits)) return "Get out through the street gates.";
  const left = RELAY_NAMES.filter(([b]) => !(bits & b)).map(([, n]) => n);
  if (left.length) return `Reset the gate relays: ${left.join(", ")}.`;
  return "Work the gate control in the ticket office.";
}

export function applyTerminusTarget(
  bits: number,
  target: TerminusTarget,
): { bits: number; line: string; noisy: boolean } {
  const has = (b: number) => (bits & b) !== 0;
  switch (target) {
    case "relayPlatform":
    case "relayHall":
    case "relayLuggage": {
      const bit = TERMINUS_BIT[target];
      if (has(bit)) return { bits, line: TERMINUS_LINES.relayAlready, noisy: false };
      return { bits: bits | bit, line: TERMINUS_LINES.relaySet, noisy: true };
    }

    case "gateControl": {
      if (has(TERMINUS_BIT.gates)) return { bits, line: TERMINUS_LINES.gatesAlready, noisy: false };
      const live = RELAY_NAMES.filter(([b]) => has(b)).length;
      if ((bits & RELAYS) !== RELAYS) {
        return { bits, line: `The gate control is dead. ${live} of 3 relays live.`, noisy: false };
      }
      return { bits: bits | TERMINUS_BIT.gates, line: TERMINUS_LINES.gatesOpen, noisy: true };
    }

    case "exitGates":
      if (!has(TERMINUS_BIT.gates)) return { bits, line: TERMINUS_LINES.exitShut, noisy: false };
      return { bits: bits | TERMINUS_BIT.escaped, line: TERMINUS_LINES.lastCall, noisy: false };

    default:
      // Lockers are hiding spots, handled by the engine.
      return { bits, line: "", noisy: false };
  }
}
