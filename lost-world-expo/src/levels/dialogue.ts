import type { Conversation } from '../engine/dialogue';

/**
 * All spoken lines. Each line's id is `<conversation id>.<n>` (1-based), e.g. `l1_found.1`.
 * Recorded voice files are matched by that id (see src/audio/voices.ts); until then the device's
 * text-to-speech reads the line as placeholder audio.
 */
const C = (id: string, lines: Conversation['lines']): Conversation => ({ id, lines });

export const CONVERSATIONS: Record<string, Conversation> = Object.fromEntries([
  // ---- Opening cinematic
  C('opening_intro', [{ speaker: 'Narrator', text: 'Somewhere over the Amazon basin...', duration: 3.8 }]),
  C('opening_mayday', [
    { speaker: 'Pilot', text: "Mayday, mayday! We've lost the right engine!", duration: 3 },
    { speaker: 'Jason', text: 'Elena, hold on to something!', duration: 2.6 },
  ]),
  C('opening_later', [{ speaker: 'Narrator', text: 'Some time later...', duration: 2.6 }]),
  C('opening_wake', [
    { speaker: 'Jason', text: 'Ugh... my head.', duration: 2 },
    { speaker: 'Jason', text: 'Elena? Elena!', duration: 2.4 },
  ]),

  // ---- Level 1: The Crash
  C('l1_start', [{ speaker: 'Jason', text: "Elena! Where are you? Can you hear me?" }]),
  C('l1_found', [
    { speaker: 'Elena', text: "You made it! This isn't just a crash site... there's something here. Follow me." },
    { speaker: 'Jason', text: 'Something here? We just fell out of the sky.' },
    { speaker: 'Elena', text: 'Check the wreck first. The pilot kept a logbook.' },
  ]),
  C('l1_logbook', [
    { speaker: 'Jason', text: 'He was heading for an old temple road. North.' },
    { speaker: 'Elena', text: 'Then that is where we go. Look, the trail stones are carved.' },
  ]),
  C('l1_trail', [{ speaker: 'Elena', text: 'These markings are older than anything on record. Keep going.' }]),
  C('l1_plates', [{ speaker: 'Elena', text: "Two pressure plates. You take the left one, I'll take the right." }]),
  C('l1_done', [{ speaker: 'Elena', text: "It's open. Nobody has been inside here in a thousand years." }]),

  // ---- Level 2: The Sunken Gate
  C('l2_start', [{ speaker: 'Elena', text: 'The river flooded the old city. Watch your footing on those stones.' }]),
  C('l2_gate', [{ speaker: 'Elena', text: "There's a plate by the wall. I'll hold the gate, you go through." }]),
  C('l2_done', [{ speaker: 'Jason', text: 'A shrine... and another piece of the map.' }]),

  // ---- Level 3: Canopy Walk
  C('l3_start', [
    { speaker: 'Jason', text: 'We have to go up there?' },
    { speaker: 'Elena', text: "The relic shards are in the canopy. Don't look down." },
  ]),
  C('l3_done', [{ speaker: 'Elena', text: 'From up here you can see the mountain. That is where the map leads.' }]),

  // ---- Level 4: The Echo Caves
  C('l4_start', [{ speaker: 'Elena', text: "It's pitch black. Light the braziers, the old way." }]),
  C('l4_lit', [{ speaker: 'Jason', text: "Something moved. The door's open." }]),
  C('l4_done', [{ speaker: 'Jason', text: "Fresh air. We're out." }]),

  // ---- Level 5: Obsidian Peak
  C('l5_start', [{ speaker: 'Jason', text: "A volcano. Of course it's a volcano." }]),
  C('l5_gong', [{ speaker: 'Elena', text: 'Ring it, Jason. Let the old city hear us.' }]),
  C('l5_done', [{ speaker: 'Elena', text: 'Listen... the whole valley answered.' }]),

  // ---- Level 6: Heart of the Temple
  C('l6_start', [{ speaker: 'Elena', text: 'The heart of the temple. Careful, the guardians are watching.' }]),
  C('l6_statues', [{ speaker: 'Elena', text: 'Read the inscription. They need to face the altar.' }]),
  C('l6_seal', [{ speaker: 'Elena', text: 'One last seal. Together.' }]),
  C('l6_done', [{ speaker: 'Elena', text: 'Jason... this changes everything.' }]),
].map((c) => [c.id, c]));

export type DialogueEvent = 'levelStart' | 'levelComplete' | `started:${string}` | `completed:${string}`;

/** Mission-triggered conversations, by level number. */
export const DIALOGUE_TRIGGERS: Record<number, Partial<Record<DialogueEvent, string>>> = {
  1: { levelStart: 'l1_start', 'completed:find_elena': 'l1_found', 'completed:investigate_crash': 'l1_logbook',
    'completed:follow_trail': 'l1_trail', 'started:coop_puzzle': 'l1_plates', levelComplete: 'l1_done' },
  2: { levelStart: 'l2_start', 'started:hold_gate': 'l2_gate', levelComplete: 'l2_done' },
  3: { levelStart: 'l3_start', levelComplete: 'l3_done' },
  4: { levelStart: 'l4_start', 'completed:light_braziers': 'l4_lit', levelComplete: 'l4_done' },
  5: { levelStart: 'l5_start', 'started:ring_gong': 'l5_gong', levelComplete: 'l5_done' },
  6: { levelStart: 'l6_start', 'started:align_statues': 'l6_statues', 'started:final_seal': 'l6_seal', levelComplete: 'l6_done' },
};
