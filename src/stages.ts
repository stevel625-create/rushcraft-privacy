import { cutHint, junctionHint, pumpHint, shedsHint, terminusHint, yardHint } from "./hints.ts";
import type { StageDef } from "./stage-kit.ts";
import {
  TERMINUS_LABELS,
  TERMINUS_LINES,
  applyTerminusTarget,
  terminusComplete,
  terminusGatesOpen,
  terminusObjective,
  type TerminusTarget,
} from "./story-terminus.ts";
import {
  CUT_LABELS,
  CUT_LINES,
  applyCutTarget,
  cutCanStun,
  cutComplete,
  cutObjective,
  cutTraction,
  type CutTarget,
} from "./story-cut.ts";
import {
  JUNCTION_LABELS,
  JUNCTION_LINES,
  applyJunctionTarget,
  junctionComplete,
  junctionObjective,
  junctionPointsSet,
  type JunctionTarget,
} from "./story-junction.ts";
import {
  PUMP_LABELS,
  PUMP_LINES,
  applyPumpTarget,
  hallDrained,
  pumpComplete,
  pumpObjective,
  type PumpTarget,
} from "./story-pump.ts";
import {
  SHEDS_LABELS,
  SHEDS_LINES,
  applyShedsTarget,
  shedsComplete,
  shedsObjective,
  shedsTraverser,
  type ShedsTarget,
} from "./story-sheds.ts";
import {
  YARD_LABELS,
  YARD_LINES,
  applyYardTarget,
  yardComplete,
  yardObjective,
  yardRouteSet,
  type YardTarget,
} from "./story-yard.ts";
import { CutWorld } from "./world-cut.ts";
import { TerminusWorld } from "./world-terminus.ts";
import { JunctionWorld } from "./world-junction.ts";
import { PumpWorld } from "./world-pump.ts";
import { ShedsWorld } from "./world-sheds.ts";
import { YardWorld } from "./world-yard.ts";

/**
 * Stages after Bellweather, in play order. To add Stage 5: write a story
 * module and a StageWorld, then append a StageDef here. The engine needs no
 * changes.
 */

const YARD: StageDef<YardTarget> = {
  chapter: 3,
  name: "Yard Nine",
  fog: 0x1a130d,
  labels: YARD_LABELS,
  lines: YARD_LINES,
  apply: applyYardTarget,
  complete: yardComplete,
  gateOpen: yardRouteSet,
  objective: yardObjective,
  hint: yardHint,
  place: (pos, alert) =>
    pos.z < 11 ? "CAR 07   /   YARD NINE" : alert ? "YARD NINE   /   FOOTSTEPS CLOSE" : "YARD NINE   /   SIDINGS",
  ending: { place: "CAR 07   /   YARD NINE LINE", waiting: "Yard Nine   /   End of Stage 3" },
  build: (scene) => new YardWorld(scene),
};

const SHEDS: StageDef<ShedsTarget> = {
  chapter: 4,
  name: "Ashby Car Sheds",
  fog: 0x101214,
  labels: SHEDS_LABELS,
  lines: SHEDS_LINES,
  apply: applyShedsTarget,
  complete: shedsComplete,
  gateOpen: shedsTraverser,
  objective: shedsObjective,
  hint: shedsHint,
  place: (pos, alert) => {
    if (pos.z < 11) return "CAR 07   /   ASHBY";
    if (alert) return "ASHBY SHEDS   /   FOOTSTEPS CLOSE";
    return pos.z > 42 ? "ASHBY SHEDS   /   FOREMAN'S END" : "ASHBY SHEDS   /   CARRIAGE ROADS";
  },
  ending: { place: "CAR 07   /   LEAVING ASHBY", waiting: "Ashby Car Sheds   /   End of Stage 4" },
  build: (scene) => new ShedsWorld(scene),
};

const PUMP: StageDef<PumpTarget> = {
  chapter: 5,
  name: "Hollin Pumping Station",
  fog: 0x0c1412,
  labels: PUMP_LABELS,
  lines: PUMP_LINES,
  apply: applyPumpTarget,
  complete: pumpComplete,
  gateOpen: hallDrained,
  objective: pumpObjective,
  hint: pumpHint,
  place: (pos, alert) => {
    if (pos.z < 11) return "CAR 07   /   HOLLIN";
    if (alert) return "HOLLIN   /   SOMETHING WADING";
    return pos.z > 31 ? "HOLLIN   /   SLUICE HALL" : "HOLLIN   /   PUMP FLOOR";
  },
  ending: { place: "CAR 07   /   LEAVING HOLLIN", waiting: "Hollin Pumping Station   /   End of Stage 5" },
  build: (scene) => new PumpWorld(scene),
};

const JUNCTION: StageDef<JunctionTarget> = {
  chapter: 6,
  name: "Thornby Junction",
  fog: 0x0d1016,
  labels: JUNCTION_LABELS,
  lines: JUNCTION_LINES,
  apply: applyJunctionTarget,
  complete: junctionComplete,
  gateOpen: junctionPointsSet,
  objective: junctionObjective,
  hint: junctionHint,
  place: (pos, alert) => {
    if (pos.z < 11) return "CAR 07   /   THORNBY";
    if (alert) return "THORNBY   /   FOOTSTEPS ON THE BALLAST";
    if (pos.z > 24.4 && pos.z < 27.6) return "THORNBY   /   MAIN LINE";
    return pos.z > 27.6 ? "THORNBY   /   SIGNAL BOX SIDE" : "THORNBY   /   BRANCH PLATFORM";
  },
  ending: { place: "CAR 07   /   LEAVING THORNBY", waiting: "Thornby Junction   /   End of Stage 6" },
  build: (scene) => new JunctionWorld(scene),
};

const CUT: StageDef<CutTarget> = {
  chapter: 7,
  name: "Gallows Cut",
  fog: 0x07090a,
  labels: CUT_LABELS,
  lines: CUT_LINES,
  apply: applyCutTarget,
  complete: cutComplete,
  gateOpen: cutTraction,
  objective: cutObjective,
  hint: cutHint,
  canStun: cutCanStun,
  place: (pos, alert) => {
    if (pos.z < 13.5) return pos.z < 11 ? "CAR 07   /   GALLOWS CUT" : "GALLOWS CUT   /   PORTAL";
    if (alert) return "GALLOWS CUT   /   IT'S IN THE TUNNEL";
    return pos.z > 60 ? "GALLOWS CUT   /   THE FALL" : "GALLOWS CUT   /   TUNNEL";
  },
  ending: { place: "CAR 07   /   INTO THE CUT", waiting: "Gallows Cut   /   End of Stage 7" },
  build: (scene) => new CutWorld(scene),
};

/** The finale: everything at once, and the game ends on foot. */
const TERMINUS: StageDef<TerminusTarget> = {
  chapter: 8,
  name: "Hallow Cross Terminus",
  fog: 0x0b0c10,
  labels: TERMINUS_LABELS,
  lines: TERMINUS_LINES,
  apply: applyTerminusTarget,
  complete: terminusComplete,
  gateOpen: terminusGatesOpen,
  objective: terminusObjective,
  hint: terminusHint,
  canStun: () => true, // the signal lamp comes with you from Gallows Cut
  departs: false,
  place: (pos, alert) => {
    if (pos.z < 11) return "CAR 07   /   HALLOW CROSS";
    if (alert) return "HALLOW CROSS   /   THEY'RE COMING";
    if (pos.z < 21.8) return "HALLOW CROSS   /   PLATFORM 2";
    if (pos.z < 25.2) return "HALLOW CROSS   /   GHOST LINE";
    if (pos.z < 30) return "HALLOW CROSS   /   PLATFORM 1";
    if (pos.x < -5.3 && pos.z < 49.7) return "HALLOW CROSS   /   BOOKING HALL";
    if (pos.x > 6 && pos.z < 48.2) return "HALLOW CROSS   /   LEFT LUGGAGE";
    return "HALLOW CROSS   /   CONCOURSE";
  },
  ending: { place: "HALLOW CROSS   /   THE STREET", waiting: "The End of the Line" },
  build: (scene) => new TerminusWorld(scene),
};

export const EXTRA_STAGES: readonly StageDef[] = [
  YARD as StageDef,
  SHEDS as StageDef,
  PUMP as StageDef,
  JUNCTION as StageDef,
  CUT as StageDef,
  TERMINUS as StageDef,
];

/** Seconds between gate chimes once a stage's last step is unlocked. */
export const GATE_CHIME_EVERY = 6;
