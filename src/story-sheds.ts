/**
 * Stage 4 — Ashby Car Sheds.
 *
 * Car 07 rolls into a maintenance shed on a dead road. To get out, the player
 * finds the foreman's key, opens the traverser cabin, closes the north and
 * south isolators (each one sets off a klaxon that brings the Listener
 * running), then works the traverser to shift Car 07 onto the exit road.
 *
 * New mechanic: lockers you can hide in. The Listener walks straight past an
 * occupied locker, unless it watched you climb in.
 */

export type ShedsTarget =
  | "foremanLocker"
  | "cabinDoor"
  | "isolatorNorth"
  | "isolatorSouth"
  | "traverserLever"
  | "carDoor"
  | "hideA"
  | "hideB"
  | "hideC";

export const SHEDS_BIT = {
  key: 1,
  cabin: 2,
  north: 4,
  south: 8,
  traverser: 16,
  boarded: 32,
} as const;

export const SHEDS_HIDE: readonly ShedsTarget[] = ["hideA", "hideB", "hideC"];

export const SHEDS_LABELS: Record<ShedsTarget, string> = {
  foremanLocker: "FOREMAN'S LOCKER",
  cabinDoor: "TRAVERSER CABIN",
  isolatorNorth: "NORTH ISOLATOR",
  isolatorSouth: "SOUTH ISOLATOR",
  traverserLever: "TRAVERSER CONTROLS",
  carDoor: "CAR 07 DOOR",
  hideA: "HIDE IN LOCKER",
  hideB: "HIDE IN LOCKER",
  hideC: "HIDE IN LOCKER",
};

export const SHEDS_LINES = {
  arrival: "Ashby Car Sheds. Car 07 has stopped on a dead road. The strip lights tick and stutter.",
  restored: "Ashby Car Sheds. Oil and cold metal.",
  caught: "The shed spins. You're back at Car 07's door.",
  alert: "Heavy steps between the carriages. Get out of sight.",
  keyFound: "A brass key on a paper tag: TRAVERSER CABIN.",
  lockerEmpty: "The foreman's locker is empty now.",
  cabinLocked: "The cabin door is locked. The plate reads: FOREMAN.",
  cabinOpen: "The key turns. Inside, a dead panel with two lamps: NORTH and SOUTH.",
  cabinAlready: "The cabin is open.",
  isolatorShut: "The isolator slams home. A klaxon wails the length of the shed.",
  isolatorAlready: "That isolator is already closed.",
  panelLocked: "The traverser controls are behind the cabin door.",
  traverserMoved: "The traverser groans awake and drags Car 07 across onto the exit road.",
  doorDead: "Car 07 is still on the dead road. There's nowhere for it to go.",
  lastCall: "The doors close behind you. Car 07 rolls out of Ashby into the dark.",
  hide: "You pull the locker shut. Breathe slowly.",
  unhide: "You ease the locker door open.",
};

export function shedsComplete(bits: number): boolean {
  return (bits & SHEDS_BIT.boarded) !== 0;
}

export function shedsTraverser(bits: number): boolean {
  return (bits & SHEDS_BIT.traverser) !== 0;
}

export function shedsObjective(bits: number): string {
  if (shedsComplete(bits)) return "Leave Ashby.";
  if (shedsTraverser(bits)) return "Board Car 07.";
  if (!(bits & SHEDS_BIT.key)) return "Find a way to work the traverser.";
  if (!(bits & SHEDS_BIT.cabin)) return "Open the traverser cabin.";
  const left = [!(bits & SHEDS_BIT.north) && "north", !(bits & SHEDS_BIT.south) && "south"].filter(Boolean);
  if (left.length) return `Close the ${left.join(" and ")} isolator${left.length > 1 ? "s" : ""}.`;
  return "Work the traverser controls.";
}

function lamp(on: boolean): string {
  return on ? "lit" : "dark";
}

export function applyShedsTarget(
  bits: number,
  target: ShedsTarget,
): { bits: number; line: string; noisy: boolean } {
  const has = (b: number) => (bits & b) !== 0;
  switch (target) {
    case "foremanLocker":
      if (has(SHEDS_BIT.key)) return { bits, line: SHEDS_LINES.lockerEmpty, noisy: false };
      return { bits: bits | SHEDS_BIT.key, line: SHEDS_LINES.keyFound, noisy: false };

    case "cabinDoor":
      if (has(SHEDS_BIT.cabin)) return { bits, line: SHEDS_LINES.cabinAlready, noisy: false };
      if (!has(SHEDS_BIT.key)) return { bits, line: SHEDS_LINES.cabinLocked, noisy: false };
      return { bits: bits | SHEDS_BIT.cabin, line: SHEDS_LINES.cabinOpen, noisy: false };

    case "isolatorNorth":
    case "isolatorSouth": {
      const bit = target === "isolatorNorth" ? SHEDS_BIT.north : SHEDS_BIT.south;
      if (has(bit)) return { bits, line: SHEDS_LINES.isolatorAlready, noisy: false };
      return { bits: bits | bit, line: SHEDS_LINES.isolatorShut, noisy: true };
    }

    case "traverserLever": {
      if (shedsTraverser(bits)) return { bits, line: SHEDS_LINES.traverserMoved, noisy: false };
      if (!has(SHEDS_BIT.cabin)) return { bits, line: SHEDS_LINES.panelLocked, noisy: false };
      const north = has(SHEDS_BIT.north);
      const south = has(SHEDS_BIT.south);
      if (!north || !south) {
        return { bits, line: `The panel is dead. NORTH ${lamp(north)}, SOUTH ${lamp(south)}.`, noisy: false };
      }
      return { bits: bits | SHEDS_BIT.traverser, line: SHEDS_LINES.traverserMoved, noisy: true };
    }

    case "carDoor":
      if (!shedsTraverser(bits)) return { bits, line: SHEDS_LINES.doorDead, noisy: false };
      return { bits: bits | SHEDS_BIT.boarded, line: SHEDS_LINES.lastCall, noisy: false };

    case "hideA":
    case "hideB":
    case "hideC":
      // Hiding is handled by the engine; it doesn't change progress.
      return { bits, line: SHEDS_LINES.hide, noisy: false };
  }
}
