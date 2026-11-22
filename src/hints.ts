import { CUT_BIT } from "./story-cut.ts";
import { JUNCTION_BIT } from "./story-junction.ts";
import { PUMP_BIT } from "./story-pump.ts";
import { SHEDS_BIT } from "./story-sheds.ts";
import { TERMINUS_BIT } from "./story-terminus.ts";
import { YARD_BIT, YARD_ROUTE } from "./story-yard.ts";

/**
 * Paid hints: unlike the objective line, these say exactly where to go.
 * Each takes the stage's progress bits and describes the next step.
 */

export function yardHint(bits: number): string {
  if (bits & YARD_BIT.route) return "Hint: walk back to Car 07's door. It's open now.";
  if (!(bits & YARD_BIT.power)) return "Hint: the breaker is on the left side of the signal box, at the far right corner of the yard.";
  const wrong = (["pointA", "pointB", "pointC"] as const).filter(
    (p) => ((bits & YARD_BIT[p]) !== 0) !== ((YARD_ROUTE & YARD_BIT[p]) !== 0),
  );
  if (wrong.length) {
    const where = { pointA: "A (first track, left)", pointB: "B (second track, right)", pointC: "C (third track, centre-left)" };
    return `Hint: throw lever ${wrong.map((p) => where[p]).join(", then ")}. Levers are loud: move away after each one.`;
  }
  return "Hint: the points are right. Pull the signal lever just to the right of Car 07's door.";
}

export function shedsHint(bits: number): string {
  if (bits & SHEDS_BIT.traverser) return "Hint: get back to Car 07's door.";
  if (!(bits & SHEDS_BIT.key)) return "Hint: the foreman's locker is in the bank on the left wall at the far end of the shed.";
  if (!(bits & SHEDS_BIT.cabin)) return "Hint: the traverser cabin is the small room in the far right corner. Its door faces left.";
  if (!(bits & SHEDS_BIT.north)) return "Hint: the north isolator is on the back wall, left of centre. Hide in a locker after the klaxon.";
  if (!(bits & SHEDS_BIT.south)) return "Hint: the south isolator is on the left wall, right by the entrance near Car 07.";
  return "Hint: the traverser controls are just inside the open cabin door.";
}

export function pumpHint(bits: number): string {
  if (bits & PUMP_BIT.sluice) return "Hint: return to Car 07's door. The hall is draining.";
  if (!(bits & PUMP_BIT.crank)) return "Hint: the tool locker is on the dry walkway along the left wall, near Car 07.";
  if (!(bits & PUMP_BIT.pumpA)) return "Hint: Pump 1 is on the left side of the pump floor. Its crank socket faces you.";
  if (!(bits & PUMP_BIT.pumpB)) return "Hint: Pump 2 is on the right side, closer to Car 07.";
  return "Hint: cross the drained channel. The sluice wheel is on the centre of the back wall. Use the right-hand walkway to stay quiet.";
}

export function junctionHint(bits: number): string {
  if (bits & JUNCTION_BIT.frame) return "Hint: board Car 07.";
  if (!(bits & JUNCTION_BIT.battery)) return "Hint: the battery cabinet is the green box on the left of the platform.";
  if (!(bits & JUNCTION_BIT.token)) return "Hint: cross right after a train passes. The token instrument is on the front of the signal box, far right.";
  return "Hint: the ground frame is right of Car 07's door. Throw it while a train is passing and nothing will hear.";
}

export function cutHint(bits: number): string {
  if (bits & CUT_BIT.traction) return "Hint: Car 07's door, at the tunnel mouth.";
  if (!(bits & CUT_BIT.lamp)) return "Hint: the stores cage is just inside the tunnel, on the right.";
  if (!(bits & CUT_BIT.breakerA)) return "Hint: breaker A is halfway down the tunnel, on the left wall. Look for the small red light.";
  if (!(bits & CUT_BIT.breakerB)) return "Hint: breaker B is at the very end, on the right wall by the rubble. It starts down there. Have charge to spare.";
  return "Hint: the traction switch is on the portal headwall, left of the tunnel mouth.";
}

export function terminusHint(bits: number): string {
  if (bits & TERMINUS_BIT.gates) return "Hint: the street gates are straight ahead at the back of the concourse. Run.";
  if (!(bits & TERMINUS_BIT.relayPlatform)) return "Hint: the Platform 1 relay is across the ghost line, on the left. Cross just after a train.";
  if (!(bits & TERMINUS_BIT.relayHall)) return "Hint: the booking hall relay is on its far-left wall. Enter from the concourse side and sneak; the water is loud.";
  if (!(bits & TERMINUS_BIT.relayLuggage)) return "Hint: the left-luggage relay is on the room's back wall. Lockers are close by if they come.";
  return "Hint: the gate control is on the front of the ticket office. Both will come. Have a locker or your lamp ready.";
}
