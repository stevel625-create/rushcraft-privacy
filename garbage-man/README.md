# The Garbage Man — story prototype

A playable mobile narrative prototype adapted from Steven Long’s manuscript. Begin as Mara Kessler: observe the sanitation route, choose an approach to Malcolm, inspect the old photograph and incident report, then distinguish suspicion from evidence. Both approaches can complete the opening using standard equipment. Continue into the sanitation yard, match the route board to Malcolm’s surname, check the library records, and follow the story into the dusk encounter on Mercer and the next morning’s photograph confrontation. Then play Malcolm as Mara intercepts him on Hanover and brings him to the old bank’s contingency case. Continue through the bank escape, confront Keane, and recover a notebook entry on the train. Follow it through Union Station to locker 247, an unsent draft and the Black Harbor archive. Return to Hanover for Lena’s explanation, preparation and the apparent patrol stop. Continue through “The Memory Trap”: the clinic lead, Hale’s account, Session 12, pursuit and the locked compartment. At Apex, review the recovered spousal-vector transcript, match archive names, and follow the Ash ledger’s two new leads. Continue to the estate, find Lena in B-12 and recover the records-room ledger and audit memo. “Black Harbor Rising” continues the escape to the freight yard and the offshore archive lead. Continue to “The Dead Man’s Archive” for the contingent record, North Span review and release-scope previews.

## Play on a phone

Requires Node.js 20.19+ and Expo Go compatible with Expo SDK 54, or a native development build.

```sh
npm ci
npm start
```

Scan the Expo QR code from a compatible Expo Go app on the same network. Android SDK-specific Expo Go downloads are available from expo.dev/go. Physical iPhones may require a development build if the current App Store Expo Go no longer supports SDK 54. A native iOS build requires macOS/Xcode and signing. The app identifiers in `app.json` are provisional.

`npm run web` starts a browser preview. `npm test` checks story progression, both approaches, evidence requirements, duplicate observations, yard choices, route matching, Mercer responses and dialogue, prompted versus independent recollection, camera-record comparisons, bank confirmation order, case evidence, reversible packing, train puzzle recovery, station routing, handset input/recovery, archive gates, Lena’s preparation and canonical outcome, clinic source gates, transcript progress, name matching and source-aware demand interpretation, estate evidence, room matching, estate escape, partial Kars recall, contingent record and uncommitted release scopes, legacy-save compatibility and saved-state restoration.

## Prototype content

- An original illustrated Cedar Street scene and archive scene, rendered with native views.
- Tap targets and equivalent labeled observation buttons.
- Two approaches to Malcolm, with different dialogue and awareness feedback.
- An evidence notebook that separates observation, testimony and archive records.
- A conclusion with feedback when the player goes beyond the evidence.
- A playable sanitation-yard scene, two dispatch approaches, a route-board matching task, and the Hanover/Lena record trail.
- Four yard evidence entries and a second conclusion; earlier notes carry forward.
- A playable dusk encounter on Mercer, with two responses, two dialogue tones, four evidence notes and a third conclusion.
- A playable “A Face from the Fire” sequence: the old name, fragmented recall, the Marseille photograph, Malcolm’s family boundary, Jonas’s warning and the disappearing feeds.
- Recollection provenance changes with your choice: independent words versus a detail supplied by Mara.
- Five new evidence notes per path and a camera/work-order comparison.
- The opening bank sequence from “What the Dead Leave Behind,” switching to Malcolm’s viewpoint, with two doorstep responses, two-stage vault confirmation and four inspectable case objects.
- Six new case notes distinguish a physical passport and authorization from earlier uncertain recollections.
- A playable bank escape: reversible three-object packing, service-route observations, Keane dialogue, train conversation and a recoverable destination-order puzzle.
- Four new escape notes preserve the difference between adversary claims, personal testimony and partial decoding.
- A playable Union Station sequence: observation and locker-number matching, the old phone, the unsent warning, and a gated review of READ FIRST, LEDGER, AUDIO and ACCOUNTS.
- Seven new station notes keep recognition, archived statements, records and voice identification distinct.
- Manual handset input or a free direct-recall option, with no timed penalty or paid hint.
- A playable “The Wife Who Buried Him” sequence: Hanover observations, two explanations, a brief Lena viewpoint, reversible preparation, and the chapter’s roadside ending.
- Five new notes preserve Lena’s demands and the observed threat. A keepsake can be included without capacity charges.
- A playable “The Memory Trap” sequence: the roadside standoff, MEDCONTAINMENT records, Soren Hale, a four-part Session 12 transcript, clinic pursuit and the contact photograph.
- Nine new notes distinguish archival records, witness claims, recorded statements and an as-yet-unplayed cassette.
- A playable “Names in the Static” sequence: Apex, frequency interpretation, three name matches, four recovered transcript sections, the Ash ledger reference, Millbrook, the annex loop and the new demand.
- Eight new notes keep a recording, interpretation, reported address and unattributed demand separate.
- A playable “The House with No Corners” sequence: the perimeter, B-12 monitor, Lena’s terms, her brother’s history, the physical ledger, Marrow memo and Rourke’s confrontation.
- Eight new notes distinguish a monitor image, overheard report, personal testimony and recovered documents.
- A playable “Black Harbor Rising” sequence: the shutters, drainage escape, Jonas’s return, routing-shell interpretation, three Kars recollection sections and the offshore lead.
- Eight new notes distinguish a crash from a later observed survival and separate printed markings from recalled design.
- A playable “The Dead Man’s Archive” sequence: the transfer facility, primary rejection, six narrative responses, archive-status and footage review, five release-scope previews and Rourke’s interruption.
- Seven new notes keep testimony, status, recorded material and the outer-room image distinct.
- Release previews save without committing a release. No biometric, camera, microphone or external publishing service is used.
- No timed reflex inputs or required purchases.
- Local saved progress and a confirmed replay action across all twenty-three scenes.
- An equipment shop available before/after the opening, with the three approved individual upgrade concepts.

These twenty-three short scenes are an early narrative prototype. Malcolm’s later missions, free movement, stealth simulation, combat, voice acting and the later campaign are not implemented. This is not a signed installable app or store release. The adaptation is not yet a complete manuscript continuity review.

## Purchases

No payments can be taken. The shop labels all prices as proposed and explicitly disables checkout. There are no bundles or purchased currency. Quiet boots, the expanded field kit and the reinforced jacket are defined in `paid-upgrades.json`; their effects are for later gameplay and do not alter this Mara-focused opening. The complete opening is available with standard equipment.

Real checkout requires separate Apple/Google app and product registrations, native billing integration, player sign-in, verification, saved entitlements, restore, and refund reconciliation. Rushcraft’s backend is a starting architecture but has a different catalog and must not grant this game’s upgrades without that separate configuration.

## Project files

`ADAPTATION.md` records the approved story direction. `game.js` contains the opening’s state transitions. `App.js` implements the interface and local persistence. `paid-upgrades.json` holds the approved equipment catalog. Source packages omit the extracted manuscript text and dependency directories.

## Validation

Android, iOS and web JavaScript/Hermes exports are build checks, not physical-device certification. Browser checks use a 390 × 844 touch viewport. Native device playtesting is still needed before judging release quality.

## Adaptation choices in scene two

The yard’s visitor-counter approaches and alternative route-board crew names are new interactive material. The manuscript’s envelope encounter (PDF pp. 11–12) is condensed for this prototype. Cedar / Ridge / Latham and Ortiz / Graves, the Malcolm Graves lead, Hanover Street and Lena’s record connection follow the reviewed source. The scene does not treat those records as proof of Adrian’s identity. “Scene 02” is a game scene number, not the book’s chapter numbering.

Existing `garbage-man-story-v1` saves remain compatible. A previously completed opening now offers Continue to the sanitation yard. Completing the yard enables equipment browsing, replay, and continuation to Mercer. Existing yard saves can enter the new scene.

## Adaptation choices in scene three

Mercer follows the events reviewed in PDF pp. 13–20: the van reflection, sudden threat, Malcolm’s practiced reaction, his confusion, the scar and the approaching siren. Combat is condensed into aftermath prose rather than a playable fighting lesson. Mara’s response options and dialogue branches are game adaptations; neither changes the canonical encounter’s outcome. The scene remains entirely from Mara’s viewpoint. The choices affect dialogue and are saved, but do not yet affect unbuilt future missions. The standard kit completes all twenty-three scenes.

“A Face from the Fire” is now playable. The opening bank sequence of “What the Dead Leave Behind” is now playable; the interruption and escape portion is also playable, ending on the train before “Union Station Locker.” The game has no multiplayer. Purchase checkout and later equipment effects remain unavailable.

## Adaptation choices in scene four

This sequence adapts PDF pp. 21–40, not just the porch conversation. It preserves Malcolm’s incomplete recollection, uncertainty about the passport, the boundary around Lena, his refusal of the proposed seven o’clock diner meeting, and the subsequent warning and loss of footage. The game adds a choice to supply a remembered detail; this is an adaptation branch, while the manuscript has Mara deliberately withhold the line. That branch records prompted testimony and never silently upgrades it to independent corroboration. Both paths continue without purchases. Camera review is an abstract narrative comparison, not an implemented surveillance system. Prior saves at `mercer_complete` can continue into this scene.

## Adaptation choices in scene five

Scene five adapts PDF pp. 41–56. The viewpoint explicitly switches to Malcolm. He can insist on an hour or ask what Mara expects to find; both paths preserve his boundary and lead to Calder & Merrow. Daniel Foss is the appointment alias. Paper activation precedes Bell’s physical-marker confirmation. The case contains the authorization signed Nathan Rourke, the physical passport under Anton Eberhardt, the brass key tagged 247 and the undecoded notebook. The destination association with Union Station comes from Mara’s recognition, not text on the key.

Earlier prompted recollection notes remain prompted; the physical passport is added as a separate evidence item. Inspecting the codebook does not decode it. Scene five ends at the footsteps on PDF p. 56; scene six now continues through the interruption and escape later in the same chapter. It does not skip the escape or claim arrival at Union Station. The bank’s fictional confirmation is narrative gameplay, not real authentication. Prior `fire_complete` saves can continue directly into this sequence. Case notes are now labeled as shared rather than solely Mara’s private notebook.

## Adaptation choices in scene six

The escape adapts PDF pp. 57–78. Bell’s shooting, the sudden attacks and struggles, the blocked exit, Keane’s confrontation, and the alley/print-shop escape are condensed into narrative transitions. There is no real-time combat simulation or weapon-control tutorial. The player handles three reversible packing selections, a service-route observation choice, dialogue, and a train notebook puzzle. The black case remains behind; the key, passport and notebook stay with Malcolm. Mara carries the authorization and other materials. Evidence objects are separate from optional gadget inventory; the proposed field-kit purchase cannot bypass this mission choice.

The three destination fragments are an adaptation of Malcolm’s recovered associations, not literal plaintext from the source’s codebook or fabricated real-world coordinates. Only page three, line seven is resolved. A wrong arrangement can be cleared and retried freely. Keane’s claims remain adversary testimony; Mara says partner and “not all,” without the game establishing marriage from Keane’s taunt. Their dialogue choices affect the current exchange and saved state, not unbuilt future events.

Old `dead_complete` saves can continue into the escape. Current saves preserve partial packing and notebook arrangements. Scene six ends at the platform search on PDF p. 78. “Union Station Locker” is now playable through the south-arcade exit; “The Wife Who Buried Him” is now playable; “The Memory Trap” is now playable; “Names in the Static” is now playable; “The House with No Corners” is now playable; “Black Harbor Rising” is now playable; “The Dead Man’s Archive” is now playable; “The Cost of Returning” is now playable. This is still a single-player narrative prototype; native device testing, the full campaign and real purchase integration remain pending.

## Adaptation choices in scene seven

Union Station adapts PDF pp. 79–100. The public-side watchers, missing locker number, employee-side pursuit, old locker room, satchel, BLACK HARBOR label, old handset draft, maintenance-room file review and decision to return to Lena follow the reviewed source. Movement and armed encounters are condensed into narrative transitions, not a free-roaming station or combat simulation. Locker 247 uses the carried key retained by the escape; it does not appear without the carried evidence. The prototype displays 243/247/249 as an invented small selection from the old locker bank.

The handset code 2471 is from the manuscript. Manual input and direct recall reach the same draft; wrong codes can be cleared indefinitely. This is a local fiction puzzle, not a network authentication service. The drive’s introduction must be read before its folders; AUDIO is a transcript excerpt, not generated voice audio. Mara’s identification of Rourke’s voice is recorded as testimony attached to a recording. Missing archive references remain missing. The scene does not imply that opening the drive decodes the complete operation.

Old `escape_complete` saves with their retained key, notebook and passport can continue directly. Partial phone input, successful unlock, inspected files and source labels persist. A complete standard-kit state-machine playthrough from the title to the thirteenth scene is tested. The scene ends on the way out of the station toward Hanover, before the next manuscript chapter. It remains single-player, and checkout and paid equipment effects remain unimplemented.

## Adaptation choices in scene eight

The Hanover chapter adapts PDF pp. 101–123. The watchers, Lena’s insistence on an explanation, the unsigned notice, departure and false patrol stop are condensed into narrative stages. Lena’s demand to decide what she can handle is preserved; the preparation stage briefly changes viewpoint to her. Malcolm can explain first or begin with an apology, but neither path erases the conversation’s uncertainty. The optional family-photograph selection is new interactive material inspired by the domestic scene. It is not a claim that the manuscript has her take it.

The contact phone in Lena’s preparation is separate from the old Black Harbor handset, so selecting it does not reset the recovered draft. Her selected belongings are separate from Malcolm’s retained key/passport/notebook. Preparation choices are reversible, with no capacity purchase or paid shortcut. Medication, keys, phone and the notice are required for this adaptation’s preparation gate; a keepsake is optional.

Lena’s abduction and Keane’s reappearance follow the chapter’s canonical ending on PDF pp. 121–123. They are not a missed timed input, a failed paid upgrade check, or a purchasable rescue. Both roadside response choices lead through the same source event with different introductory dialogue. The equipment navigation is absent throughout this chapter and at its ending. “The Memory Trap” follows as scene nine. Existing `station_complete` saves can enter directly; all earlier evidence and partially selected belongings persist. A continuous standard-kit state-machine playthrough now reaches the end of scene eleven.

## Adaptation choices in scene nine

“The Memory Trap” adapts PDF pp. 124–160, ending with the pump-house door giving way and the contact photograph. Keane’s roadside confrontation, the vehicle escape, clinic navigation, armed pursuit and bridge crossing are condensed into narrative transitions. There is no real-time combat or simulated medical procedure. The player reviews the MEDCONTAINMENT order and transcript, compares Hale’s accounts, reads four excerpts of Session 12, chooses the alternate clinic exit and examines the locked compartment’s contents.

Hale’s attribution of deliberate suppression and Adrian’s request remains witness testimony from an involved participant. Session 12 is a historical recording represented by text excerpts, not generated audio or a complete clinical consent record. The game does not present memory-suppression techniques as real medical guidance. Partial transcript position saves and restores, and all four excerpts remain available to reread once revealed.

The anchor claim is labeled as Hale’s account. The photograph and its UNSCRIPTED INTEREST caption do not prove Lena’s knowledge or complicity. GRAVES / SPOUSAL VECTOR remains an **unplayed** microcassette, while Session 12 is a separate recording; scene ten handles its recovered contents. The clinic’s hard case is distinct from the black bank case left behind in scene six. Earlier physical leads, Lena’s selected belongings and testimony provenance remain unchanged. No equipment shop appears in this sequence or at its ending. Existing `wife_complete` saves can continue directly. The next unbuilt chapter is “Black Harbor Rising.”

## Adaptation choices in scene ten

“Names in the Static” adapts PDF pp. 161–189. Jonas’s tape recovery, the notebook frequency interpretation, archive cross-references, missing-page pattern, Ash ledger, Millbrook lead, loop signal and fresh proof-of-life demand follow the reviewed source. The matching task uses three of the source’s initials/name pairs (B.N./Branislav Novak, I.C./Idris Celik, P.S./Petra Salonen); it is a small interpretation puzzle rather than a general cipher decoder. Correct matches and transcript position save independently.

The spousal-vector cassette is now reviewed in four text sections. Its date remains unknown; the game does not infer a precise treatment or marriage timeline from it. Observational terminology does not establish that Lena knowingly participated. Toby is mentioned and remembered, not confirmed captured. The earlier recovery note is now worded historically so it remains accurate beside the new recovered-content note. Session 12 and the spousal-vector cassette remain distinct recordings.

The Millbrook report and private-record references are static fiction drawn from the manuscript. This app performs no actual searches of people, addresses, school, pharmacy, telephone or government records. The receiver is a transcript panel, not a functioning radio. The fresh demand is not proof that Lena and Toby are held together; Mara’s interpretation is labeled as an inference. No audio is generated or played. The chapter ends with the microphone on the table and footsteps outside, without inventing a transmitted reply or the next chapter’s infiltration.

Old `memory_complete` saves continue directly. Earlier testimony, family choices, evidence and carried items persist. A standard-kit state-machine playthrough reaches scene ten. The next unbuilt chapter is “Black Harbor Rising.” Checkout and later paid equipment effects remain unimplemented.

## Adaptation choices in scene eleven

“The House with No Corners” adapts PDF pp. 190–212, stopping at the embedded “Black Harbor Rising” heading on p. 212. The chapter opens at the estate after the departure from Apex; the prototype does not invent a missing transmitted radio reply or explain the fresh demand as if its sender had been verified. Adrian becomes the displayed field name while Malcolm’s identity and incomplete memories remain part of the character.

The perimeter entry, confrontations with guards and borrowed access are condensed into narrative transitions. This is not a free-roaming stealth simulation, live surveillance tool or security-bypass tutorial. The room-matching selection uses the observed B-12 image and a small invented choice set. The overheard report about the sister’s house is not promoted to proof of Toby’s safety.

Lena’s refusal to leave without proof, her account of her brother’s copies, her legal-pad reconstruction and her recognition of the Marrow Holdings audit memo follow the reviewed source. The ledger and memo become new document notes; merely recovering the book does not establish that it is the complete archive. Both final responses lead into the canonical records-room confrontation. Mara arrives, but the group has not escaped, Rourke is not declared defeated, and Toby’s location remains unknown.

Existing `static_complete` saves continue directly. Prior archive entries, recollection provenance and family belongings persist, with a continuous standard-kit state-machine playthrough through all twelve scenes. No shop is promoted during the rescue or confrontation. “Black Harbor Rising” follows in scene twelve; “The Dead Man’s Archive” is the next unbuilt chapter.

## Adaptation choices in scene twelve

“Black Harbor Rising” adapts the embedded heading on PDF p. 212 through p. 230. The escape through shutters, service area, drainage and damaged van is condensed into narrative and observation choices rather than real-time combat or a timed chase. Lena stays active and with the ledger. Jonas’s van is first observed being hit, then he is observed alive at the outflow; the first event does not silently establish death.

The retained drive, physical ledger and Marrow memo remain in the case history. The shipping terms on the page are documented separately from Adrian’s returning account of a wider market. The ledger is interpreted as a routing shell, not the complete archive. Three recollection sections cover Kars, Keane’s recovery-authority claim and split access. Partial recollection progress persists. These do not retrospectively make every earlier uncertain memory verified.

The offshore transfer station behind the waste plant is a recalled destination that has not yet been reached. The app collects no biometric data and performs no actual archive authentication. Toby’s whereabouts remain unresolved. The scene ends with the group moving toward utility carts in the freight yard, before the cart-starting sequence and harbor access in “The Dead Man’s Archive.” All choices are recoverable without money or timed penalties. Existing `house_complete` saves can continue directly. A continuous standard-kit state-machine playthrough reaches the first thirteen scenes; separate tests cover scene fourteen.

## Adaptation choices in scene thirteen

“The Dead Man’s Archive” adapts PDF pp. 231–252. The failed first cart, second-cart escape, transfer road, tug crossing and meeting with Hale are condensed into narrative transitions. The inner door’s failed primary match and contingent cognitive record are represented entirely with local text/state. Six compressed response sections cover the operation, failure condition, changed order, action taken, suppression rationale and final acceptance of record. No actual biometric measurement, speech recognition, microphone, camera or medical-restoration function is present.

The archive’s prior integrity check remains ambiguous between automated activity and another visitor. North Span footage is reviewed in text, not a generated video. The release directory is a fictional list without actual contact addresses. Selective packet, legal tranche, broker identities, internal corruption and full dump are all reviewable previews; selection is reversible before the canonical interruption. `releasePreview` stores that choice, while `releaseCommitted` remains false even after save restoration. No file, message or packet is exported or sent to another service.

The scene ends on Rourke’s outer-room camera appearance before p. 253’s “The Cost of Returning.” It does not claim Rourke is defeated, the archive is published or Toby located. Old `rising_complete` saves continue directly. Partial response progress, prior evidence and preview selection persist. Tests cover all five preview scopes, malformed/forged committed-state restoration, and a continuous standard-kit path through the first thirteen scenes. The manuscript ending is now playable; recurring routes are now available after the ending.

## The Cost of Returning — implemented

Scene 14 adapts PDF pages 253–273: remote lockdown, Adrian’s domestic recollections, curated packet assignments, failed-link recovery, Lena retaining her brother’s copy key, the service-duct departure and Adrian’s holdout. Earlier scope previews remain history; the executed story plan is curated. All acknowledgements and the nineteen-endpoint export are local fictional state, with no network transmission. Family and juvenile indices remain in deferred escrow. Receipts do not prove public verification or safety. Toby’s location remains unknown; Adrian is wounded inside and Rourke remains alive.

Thirty-two automated story tests cover progression and save restoration, including release-plan validation and committed story receipts. Android/iOS JavaScript bundle exports and phone-sized browser checks are development validation, not signed native builds or physical-device tests. “Ashes on the Curb” is now playable; “Permit at the Wrong Angle” is now playable; “The Service Road Brother” is now playable; “The Man Outside the Notices” is now playable; “White Truck, Black File” is now playable; “Collection Day” is now playable; “The Blue Handle” is now playable; “The Last Custodian of Cedar” is now playable; “Pickup Before Dawn” is now playable through the manuscript ending. Real-money checkout and upgrade effects remain unfinished; individual permanent upgrades are planned, without currency bundles.

## Ashes on the Curb — implemented

Scene 15 condenses PDF pages 274–302 into the cradle escape, harbor recovery, public aftermath, family reunion and return to Cedar. Gunfire and the struggle are narrative passages, without aim controls or timed penalties. The source establishes Toby alive with Lena three weeks later, without resolving all earlier timeline inconsistencies. Rourke survives and faces proceedings; Keane remains unaccounted for. The van leaves temporarily, and its occupants are not conclusively identified. Inspectable evidence preserves these distinctions. Family dialogue choices change emphasis, not the canonical outcome. Earlier preview history, curated receipts and Lena’s retained copy key persist.

Validation: 34 story tests, phone-sized browser progression and save checks, and web/Android/iOS bundle exports. No signed native release or physical-device test is claimed. The manuscript ending is now playable; recurring routes are now available after the ending. Live payments and paid upgrade effects remain unfinished.

## Permit at the Wrong Angle — implemented

Scene 16 adapts PDF pages 303–319: repeated van sightings, Mara’s Delmore permit and credential findings, the partial domestic fragment, the family evening, Paul Mendez’s closet documents and the KEANE, D. note. Players distinguish a family-address lead from a verified occupant identity. Dialogue choices change emphasis without changing Lena’s decision to open the box. The flash drive remains unread; the B12 folded sheet is kept separate from the closet box/key. Paul’s live-feed claim remains a document lead, not an actual network connection. The car outside remains unidentified.

Validation includes 36 story tests, phone-sized browser progression/save checks and web/Android/iOS bundle exports. Native signing, physical-device testing, live checkout and paid equipment effects remain pending. The manuscript ending is now playable; recurring routes are now available after the ending.

## The Service Road Brother — implemented

Scene 17 condenses PDF pages 320–340: the waiting sedan, Toby staying with Carol, her account of the Ramsey refill, Paul’s relay tin/map, the fictional storage-lock transmission, mislabeled duplicate work sets, the witness sleeve, loading-yard escape and the voice Adrian recognizes as Keane. The brass key is an off-site object in the manuscript and is not equated with the B12 folded sheet. Clinic timing is suggestive, not independently proven; Paul’s discovery date remains uncertain. Treatment is not framed as a mistake. The unread drive and incomplete witness destination remain unresolved. Keane’s message may warn or steer; it does not establish allegiance.

Validation: 38 story tests, phone-sized browser progression and save checks, web/Android/iOS bundle exports. No radio, microphone or live data is accessed. Native signing, physical-device testing, checkout and paid effects remain pending. The manuscript ending is now playable; recurring routes are now available after the ending.

## The Man Outside the Notices — implemented

Scene 18 adapts PDF pages 341–362: Jonas’s stored computer, Paul’s crosswalk and uncertain recorded claims, courier/architect scans, Keane’s call, Lena’s insistence on attending, north weigh-station testimony, access card and attack. The drive is now read in the story, without actual file access or transmission. Keane’s child-dependency account and Adrian’s partial recollection do not establish Toby’s safety or reconcile the chronology. Dialogue emphasis respects Lena’s canonical decision. The attack attribution remains unconfirmed; Keane’s fate at the SUV is unresolved at this boundary. No aim controls, timers or paid protection alter the outcome.

Validation: 40 story tests, phone-sized browser progression/save checks and web/Android/iOS bundle exports. Native signing, physical-device tests, checkout and paid effects remain pending. The manuscript ending is now playable; recurring routes are now available after the ending.

## White Truck, Black File — implemented

Scene 19 condenses PDF pages 363–384: Keane’s return, outfall escape, his admission of pressure on Paul, the municipal-mirror account, Lena’s paper comparison, the dead-room lead, sequence rehearsal, Delmore discrepancy plan, Graves’s yard entry, WT-BLK-RCV index and courier validation under breach. The three-label rehearsal is a game adaptation of the prepared document order, not completion of every terminal directory. The source only reaches disposal and route review before interruption here. Its numerical credential strings are not entered by the player. The second authorization is still pending at this chapter boundary. No reserve extraction or new release has completed. Earlier archive receipts persist as separate history.

Validation: 42 story tests, phone-sized browser progression/save checks and web/Android/iOS bundle exports. No real credentials, terminal, database or radio are accessed. Physical-device testing, native signing, payments and upgrade effects remain pending. The manuscript ending is now playable; recurring routes are now available after the ending.

## Collection Day — implemented

Scene 20 adapts PDF pages 385–407: story second authorization, audit intent, Lena’s source crosswalk, substitute-chain output retaining custody linkage, staggered nine-channel send, ninth-channel interruption and retry, declined generated purge, damaged local hardware, Keane’s unresolved holdout, escape, court aftermath, retained family redactions and field-trip signature before the route. Choices are recoverable and untimed. All output is fictional local state: no files or messages are transmitted. Family substitution is a story result, not a universal technical anonymization guarantee. In-transit receipts differ from later warrants, authentication and trials. Keane is not confirmed dead or escaped. Lena retains the legal-pad sheet and evidence copies while shredding only leftover domestic details. Earlier archive-release history stays separate from reserve receipts.

Validation: 44 story tests, phone-sized browser progression/save checks and web/Android/iOS bundle exports. Native signing, physical-device testing, real checkout and paid effects remain pending. The manuscript ending is now playable; recurring routes are now available after the ending.

## The Blue Handle — implemented

Scene 21 adapts PDF pages 408–424: sedan recurrence, three-mark cart comparison, Lena’s warning, four route placements, Mara’s Special Handling ticket findings, Sarto login attribution limits, narrative bundle recovery, the attributed Keane note, unopened module and departure toward the trucks. The cart comparison is an untimed game adaptation; recovery is condensed prose without hazardous-object handling instructions. No player action opens, connects or tests the module. Its dark indicator proves neither safety nor inactivity. Keane’s handwriting is Adrian’s recognition, not independent authentication or confirmation of survival/death. The note’s custodian and trigger claims remain unverified at this boundary.

Validation: 46 story tests, phone-sized browser progression/save checks and web/Android/iOS bundle exports. Physical-device tests, native signing, checkout and paid upgrade effects remain pending. The manuscript ending is now playable; recurring routes are now available after the ending.

## The Last Custodian of Cedar — implemented

Scene 22 adapts PDF pages 425–445: Sarto’s funeral notice, Quill’s substitution, Mara’s record findings, Garland confrontation, the proposed governor trade, held-node review, intervention logs, physical carrier protocol and Hanover secondary-pickup warning. The notice does not establish cause of death. Quill’s account is labeled testimony; a continuity hold is not disarmament. Intervention entries support acts attributed to Keane without proving his motives, safety of every family or his current fate. The physical governor and reserve carrier remain distinct. Story docking is scripted without real device access or technical input. The sixteen-hour hold and 04:10–04:32 window are narrative conditions, not real-time gameplay deadlines. Carrier collection, verification and fallback prevention remain unfinished at this boundary.

Validation: 48 story tests, phone-sized browser progression/save checks and web/Android/iOS bundle exports. Native signing, physical-device tests, real checkout and paid effects remain pending. The manuscript ending is now playable; recurring routes are now available after the ending.

## Pickup Before Dawn — implemented / manuscript ending

Scene 23 adapts PDF pages 446–462: auxiliary collection, distinction between collection and verification, fictional closed-chain kiosk status, carrier disposal, Mara’s farewell and court notice, and Adrian and Lena’s return to the route. Machinery operation and hazardous-material handling are condensed prose, not procedural interactions. No real equipment, devices or services are accessed. Two closing choices change emphasis only. The narrative supports disposal of the last practical packet, without claiming every possible copy or threat is gone, confirming Keane’s fate or depicting Quill’s conviction. The source reads 4:24 and twelve minutes remaining against an earlier 04:32 deadline; the adaptation keeps 4:24 and omits the contradictory interval. No real-time countdown is used.

The 23-scene narrative adaptation now reaches the manuscript ending. This is an early text-and-native-view prototype, not a complete commercial mobile game. Stealth systems, physical-device validation, signed releases and live individual-upgrade purchases remain unfinished. Planned purchases remain individual permanent upgrades with no currency bundles.

Validation: 50 story tests; phone-sized ending, save, notebook and confirmed-replay checks; prior-chapter regression; web/Android/iOS bundle exports. These exports are JavaScript/Hermes bundles, not signed installable apps.

## Recurring routes — implemented

After the manuscript ending, START RECURRING ROUTES opens an original sanitation decision mode. Deterministic generated shifts vary stop order, addresses and ambient weather. Six tasks cover household pickup, clean recycling, unbooked bulk, blocked access, loose glass and unknown containers. A visible handbook supports four response choices. Each stop is untimed, wrong choices are recoverable, and corrections count once per stop rather than once per tap. No currency, fee or paid equipment is required. Shifts grow from five to eight stops by shift ten; they continue using recombinations of these six tasks, not automatically authored chapters or unlimited novel content. Weather is atmosphere only.

Progress saves the current shift, stop, correction count and completed-shift total. The generated sheet is recreated from its shift number on reload; no server or scheduled update is required. Campaign notes, release history and ending choice remain intact. NEXT GENERATED SHIFT continues without a terminal level. Replaying the campaign asks for confirmation and resets both modes.

Validation: 53 automated tests, including 1,000 deterministic route sheets and 25 saved consecutive shifts, plus phone-sized browser progression/reload checks and platform bundle exports. Real checkout, paid effects, native signing and physical-device testing remain unfinished.

## Truck load and depot visits — implemented

Recurring routes now track a three-unit truck capacity. Regular and recycling pickups each add two abstract load units; holds and service requests add none. The depot unloads both streams separately without a fee, timer or lost stop. Attempting a pickup without room preserves its stop and records no handling mistake. Stops and loaded material save independently, so an interrupted shift returns with the same load. Resolving the final stop with material aboard requires an unload before the completed-shift count increases and the next shift unlocks. Unloading an empty truck cannot award another completion. Legacy route saves without load fields start empty. This is an abstract planning system, not a machinery simulation.

Validation: 55 automated tests, phone-sized capacity/reload/depot/completion checks and recurring-route regression, with Android/iOS/web bundle exports. Live payments, equipment effects, native signing and physical-device testing remain pending.

## Expanded pickup planning — implemented

The route sheet now lists every generated stop with current/upcoming/resolved status and pickup size. Four additional task types—booked small bulk, clean cardboard bundles, approved missed-bin returns and unlisted paint tins—expand new shifts to ten types. Small household, cardboard and missed-bin pickups take one abstract unit; larger pickups take two. The truck remains at three units. Previewing a sheet is free and cannot skip stops or change their order.

Generator version 2 is saved with each route. Existing unversioned saves keep version 1, including their original six-task sheet and two-unit pickup sizes, through the current shift. NEXT GENERATED SHIFT upgrades to version 2. New investigations begin with version 2. This avoids changing a saved stop beneath the player. Old and new sheets are deterministic.

Validation: 57 story/gameplay tests, phone-sized planning-sheet and variable-load progression checks, legacy depot regression and platform bundle exports. Checkout, paid effects, native signing and physical-device testing remain pending.

## Shift records and milestones — implemented

Recurring play now records each fully finished shift with its number, generator version, stops, handling corrections and depot visits. Clear shift means zero corrections; Steady shift means one; Shift resolved means two or more. There are no currency or purchase rewards. Depot visits and capacity blocks never lower ratings. A zero-correction completion extends the clear-shift streak; a corrected completion resets that streak while preserving its best. An unfinished or paused shift changes neither.

The shift-record panel shows the last five results, current/best streak and completion milestones at 1, 5, 10 and 25 shifts. Results persist locally, and a final unload cannot award the same completion twice. Legacy completed-shift totals remain; detailed history and streak begin with this feature rather than retroactively inventing results. Replay confirmation resets these records with the rest of the game.

Validation: 60 automated tests, phone-sized real-shift/rating/milestone/history checks, route-planning regression and Android/iOS/web bundle exports. Live purchases, upgrade effects, signed native releases and physical-device testing remain unfinished.

## Neighborhood route map — implemented

Recurring shifts now include an optional native-view schematic map. Numbered touch targets show resolved, current and upcoming stops. Selecting a stop previews its address, task and abstract load size without changing route order, game state or the stop to be serviced. The diagram is not geographical navigation and uses no location services or map API. The active marker follows actual pickup progress, including after reload. Preview selection and panel visibility are temporary UI state; route progress remains saved. All targets are at least 44 by 44 points.

Validation: phone-sized eight-stop map selection/current-marker/reload checks, variable-load route regression and platform bundle exports. The existing 60 gameplay tests remain unchanged because this feature adds presentation only. Real checkout, equipment effects, native signing and physical-device testing remain pending.

## Optional dispatch goals — implemented

Each recurring shift has a briefing with total abstract load, pickup count, non-pickup stop count and an attainable depot target based on the fixed stop order and three-unit capacity. The minimum includes the final unload and can be achieved by carrying through zero-load stops and unloading only before overflow. Two optional goals track zero handling corrections and finishing within that depot target. Results remain pending until the shift is fully unloaded.

A missed planning goal never blocks completion or the next shift, changes the handling rating or resets a clean-shift streak. Goals award no currency and require no purchases. Current summaries and the last-five results derive planning status from saved route version and visit counts, so legacy sheets keep their own target. No extra event history or server is used.

Validation: 62 tests, including exhaustive fixed-order load sequences through length six against an independent optimal-unload search, phone-sized briefing/completion/history checks and career regression; platform bundles exported. Native signing, physical-device tests, checkout and paid effects remain unfinished.

## Service receipts and shift journal — implemented

Resolved recurring stops now show a last-service receipt and can be reviewed in a shift journal with pickup, recycling, hold and service-request totals. Completed map stops also show their outcome; upcoming previews do not claim completion. Bulk requests are recorded without promising a collection date. Blocked-access and unidentified-container holds have distinct explanations. No request is transmitted externally.

Receipts derive from the versioned generated sheet and saved resolved-stop prefix: they survive reload without another history list, cannot be earned by previewing, and reset on NEXT GENERATED SHIFT. Depot visits leave stop outcomes intact. The last-five shift summaries remain in the career record. Presentation only; the existing 62 gameplay tests remain unchanged. Phone-sized journal/reload/map/next-shift checks and dispatch-goal regression validate the integration; platform bundles exported. Native signing, device tests, real checkout and paid effects remain pending.

## Phone gameplay layout — improved

The active pickup and its handbook now appear before optional planning tools. A compact load meter and depot control replace the large truck explanation, and pickup responses use a two-column touch grid. Route tools share one open-panel state, so opening the map, journal, briefing, sheet or shift record closes the previous panel. Previewing remains read-only and does not alter stop progress. Recent service receipts and campaign controls remain available below the main action area. No gameplay or save format changes.

Validation: phone-sized action order and touch-size checks, exclusive-panel switching, preview non-mutation and pickup reload, plus service-journal regression and Android/iOS/web bundle exports. Checkout, paid effects, native signing and device testing remain pending.

## Fallback saves and save status — implemented

Autosave now keeps the previous validated main snapshot in garbage-man-story-backup-v1. An unchanged snapshot does not rotate the fallback. Startup prefers a valid main save and recovers the fallback if the main is malformed or unreadable, showing a recovery message. The fallback may be one saved action behind. Invalid data cannot replace a valid fallback during normal saving. Writes remain serialized; if the fallback write fails, the main is left intact.

If neither slot can be read, saving pauses rather than silently overwriting them. Players can continue in memory and explicitly retry saving current progress. Device save status appears in the app, with a retry control on failure. Confirmed campaign replay replaces both slots, preventing old progress from returning through fallback recovery. The reset intent remains pending through failed writes. These are local storage safeguards, not cloud sync or protection from device loss, uninstall or cleared browser data.

Validation: 67 tests, including save rotation, corrupt/unknown-stage recovery, write failures and reset; phone-sized recovery, career/load preservation, main repair, reset and explicit-retry checks; route regression and platform bundle exports. Physical-device testing, native signing, payments and upgrade effects remain pending.

## Reading controls — implemented

A Reading tab provides larger primary text/line spacing for narrative, evidence, route handbooks and shared buttons, plus a reduced-animation override. The Cedar marker animation also follows the system reduced-motion preference and updates when that device preference changes. Larger reading text does not rescale every fixed diagram, decorative label or illustration, and physical assistive-technology validation remains pending. System text scaling is not disabled.

Preferences are validated booleans saved with campaign/route progress. Changing a preference does not advance a scene or modify route/load/career state. Confirmed campaign replay preserves these preferences while resetting game progress and both save slots. Legacy saves use standard text and device motion defaults.

Validation: 69 automated tests; phone-sized large text, preference persistence, replay preservation, static marker and overflow checks; fallback-save regression and Android/iOS/web bundle exports. Real purchases, equipment effects, signing and physical-device tests remain pending.

## Searchable case notebook — implemented

The notebook now searches recorded titles, original source labels and note text, matching all typed terms with case/accent/punctuation normalization. Newest-first reverses acquisition order rather than claiming historical source chronology. Result counts, clear search and a no-results message make filtering visible. A top return control avoids requiring a scroll through every note. Original source labels and qualifications remain unchanged. No unseen clue is searched or unlocked.

Search and sort are temporary view state; saved evidence, narrative progress, route loads and career totals are untouched. The notebook follows larger reading-text preferences. Validation: 71 tests, recorded-only search/source/normalization/order checks, phone-sized filtering/empty results/clear/sort/large-text/state-preservation checks, reading-control regression and platform bundle exports. Real purchases, equipment effects, signing and physical-device tests remain pending.

## Progress overview — implemented

The header’s Progress control opens a read-only overview of current campaign position or recurring shift, local save status, the last three recorded notes and reached scene titles. Story progress derives from the current scene checkpoint; recurring mode shows the completed 23-scene campaign plus exact stop, load and career totals. Future scene titles are omitted. Resume and notebook navigation preserve the current scene/stop. There is no chapter skipping or save reset in this view.

Validation: 73 tests, all scene-group mappings and overview non-mutation, phone-sized hidden-future-title/exact-resume/save-status/route-load/career checks, notebook roundtrip and reading regression; platform bundles exported. Native signing, device tests, real checkout and paid effects remain pending.

## Offline browser package — implemented

`npm run build:web` exports the web app and adds a standalone manifest, local PNG icons, relative bundle URLs and a revisioned service worker. After successful installation, the app shows OFFLINE COPY READY. Only known same-origin web resources are cached; native bundles, user progress and external requests are not included in the service-worker cache. Local saved progress remains in AsyncStorage with the existing fallback. Navigation can load the cached entry page when disconnected. New workers wait for normal activation rather than forcing a mid-scene reload. Cache cleanup is limited to this app and deployment scope.

The separate web ZIP contains deployable static files and WEB-PLAY.md. It has not been published to a public host. Offline support needs an initial successful HTTPS/localhost load, a supporting browser and retained site storage. Home-screen install availability varies; this is not a signed native app. Browser data clearing or eviction can still remove saves and cached files.

Validation: 74 tests, deterministic/revision-sensitive web preparation, phone-sized cache installation, disconnected reload/gameplay/preferences/reload checks and progress regression. Android/iOS bundles also exported; native signing, physical devices, live checkout and paid effects remain unfinished.

## Portable progress backup — implemented

Progress overview links to manual export/import. Generate produces a snapshot of sanitized game state, including evidence, current route/load, career records and reading preferences. Players can select/copy the text or explicitly open the system share chooser. No automatic upload or cloud sync occurs. Imports accept a versioned envelope, a 64,000-character limit and an accidental-change checksum; this is not encryption, authentication or purchase proof. Payment entitlements are not represented.

Import preview shows the saved position and counts without applying it. Cancel and editing the input discard the pending preview. Only REPLACE WITH THIS BACKUP replaces current state; evidence is replaced rather than merged. Normal fallback-save rotation preserves the prior saved main state when storage writes succeed. Importing into memory can still encounter a local save failure, which uses the existing retry/status UI. Export a separate copy first if both runs are needed.

Validation: 77 tests, sanitized roundtrip/snapshot and malformed/altered/oversized/unsupported-envelope rejection; two separate phone-sized browser contexts exercised preview, cancellation, rejection, confirmation, fallback preservation and settings/route/career persistence. Offline regression and platform bundle exports passed. Native share behavior and physical devices remain untested. Store checkout, paid effects and signed releases remain pending.
