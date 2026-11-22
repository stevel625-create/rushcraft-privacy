/**
 * Stage 5 — Hollin Pumping Station.
 *
 * Car 07 halts at a flooded underground pumping station: the line ahead is
 * under water. The player finds a crank handle, cranks two pumps to life
 * (which drains the deep sump channel so it can be crossed), then opens the
 * sluice on the far wall to drain the whole hall and the track beyond.
 *
 * New mechanic: floodwater. Wading is loud (walking carries like running,
 * sneaking like walking). Only the raised grates are quiet. The Listener
 * wades through the deep channel that blocks the player.
 */

export type PumpTarget = "crankBox" | "pumpA" | "pumpB" | "sluiceWheel" | "carDoor";

export const PUMP_BIT = {
  crank: 1,
  pumpA: 2,
  pumpB: 4,
  sluice: 8,
  boarded: 16,
} as const;

export const PUMP_LABELS: Record<PumpTarget, string> = {
  crankBox: "TOOL LOCKER",
  pumpA: "PUMP 1",
  pumpB: "PUMP 2",
  sluiceWheel: "SLUICE WHEEL",
  carDoor: "CAR 07 DOOR",
};

export const PUMP_LINES = {
  arrival: "Hollin Pumping Station. Black water laps at Car 07's step. The track ahead is drowned.",
  restored: "Hollin Pumping Station. Water drips somewhere in the dark.",
  caught: "Cold water closes over you. You're back at Car 07's door.",
  alert: "Something is wading toward you. It doesn't care how deep it is.",
  crankFound: "A heavy pump crank, greased and waiting.",
  crankAlready: "The tool locker is empty.",
  noCrank: "The pump's crank socket is empty. You need a handle.",
  pumpStarted: "You heave the crank round. The pump coughs, then thunders to life.",
  bothPumps: "The second pump catches. The sump channel gurgles and starts to empty.",
  pumpAlready: "The pump is already running.",
  sluiceStuck: "The sluice won't turn against that much water. Get the pumps running first.",
  sluiceOpen: "The wheel screams round. Water roars out through the sluice. The hall begins to drain.",
  sluiceAlready: "The sluice is wide open.",
  doorFlooded: "Car 07 won't move. The line ahead is still under water.",
  lastCall: "The doors close behind you. Car 07 noses forward through the dripping tunnel.",
};

const BOTH_PUMPS = PUMP_BIT.pumpA | PUMP_BIT.pumpB;

export function pumpComplete(bits: number): boolean {
  return (bits & PUMP_BIT.boarded) !== 0;
}

/** Both pumps running: the deep channel is crossable. */
export function channelDrained(bits: number): boolean {
  return (bits & BOTH_PUMPS) === BOTH_PUMPS;
}

export function hallDrained(bits: number): boolean {
  return (bits & PUMP_BIT.sluice) !== 0;
}

export function pumpObjective(bits: number): string {
  if (pumpComplete(bits)) return "Ride out of Hollin.";
  if (hallDrained(bits)) return "Return to Car 07.";
  if (!(bits & PUMP_BIT.crank)) return "Find something to work the pumps.";
  if (!channelDrained(bits)) {
    const left = [!(bits & PUMP_BIT.pumpA) && "Pump 1", !(bits & PUMP_BIT.pumpB) && "Pump 2"].filter(Boolean);
    return `Start ${left.join(" and ")}.`;
  }
  return "Cross the sump and open the sluice.";
}

export function applyPumpTarget(
  bits: number,
  target: PumpTarget,
): { bits: number; line: string; noisy: boolean } {
  const has = (b: number) => (bits & b) !== 0;
  switch (target) {
    case "crankBox":
      if (has(PUMP_BIT.crank)) return { bits, line: PUMP_LINES.crankAlready, noisy: false };
      return { bits: bits | PUMP_BIT.crank, line: PUMP_LINES.crankFound, noisy: false };

    case "pumpA":
    case "pumpB": {
      const bit = target === "pumpA" ? PUMP_BIT.pumpA : PUMP_BIT.pumpB;
      if (has(bit)) return { bits, line: PUMP_LINES.pumpAlready, noisy: false };
      if (!has(PUMP_BIT.crank)) return { bits, line: PUMP_LINES.noCrank, noisy: false };
      const next = bits | bit;
      return { bits: next, line: channelDrained(next) ? PUMP_LINES.bothPumps : PUMP_LINES.pumpStarted, noisy: true };
    }

    case "sluiceWheel":
      if (hallDrained(bits)) return { bits, line: PUMP_LINES.sluiceAlready, noisy: false };
      if (!channelDrained(bits)) return { bits, line: PUMP_LINES.sluiceStuck, noisy: false };
      return { bits: bits | PUMP_BIT.sluice, line: PUMP_LINES.sluiceOpen, noisy: true };

    case "carDoor":
      if (!hallDrained(bits)) return { bits, line: PUMP_LINES.doorFlooded, noisy: false };
      return { bits: bits | PUMP_BIT.boarded, line: PUMP_LINES.lastCall, noisy: false };
  }
}
