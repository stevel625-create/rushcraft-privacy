# The Garbage Man — game adaptation draft

Based on Steven Long’s manuscript. This records the adaptation direction. The twenty-three-scene narrative prototype currently reaches the manuscript ending in “Pickup Before Dawn”; the full game is not implemented or released. Source review covers the opening and selected later sections of the 462-page PDF; a full continuity pass remains necessary before scripting the complete game. Later-story spoilers follow.

## Game concept

A story-driven stealth thriller in which sanitation worker Malcolm Graves discovers the dangerous history of Adrian Vale. His route, work clothes, neighbors and knowledge of municipal infrastructure become the means of protecting his present life. The central question is what he will do with the past—not merely whether he can remember it.

Develop a short mobile-friendly opening first. A polished 3D commercial version would require a separate production budget, art pipeline and device-performance targets. Do not reuse Rushcraft’s runner gameplay or floating-island setting.

## Player and viewpoint

Begin as Mara Kessler on Cedar Route, observing the worker whose movements recall Adrian Vale (PDF pp. 2–20). Shift to Malcolm for the main campaign, with short Mara sequences where her investigation supplies information he cannot have. Preserve Lena’s agency, including her role in demanding proof. Toby’s safety supplies emotional stakes; do not turn him into a purchasable rescue objective.

## Core gameplay

- Observe: inspect reflections, repeated vehicles, route assignments and inconsistencies in familiar places. Observation reveals evidence; purchases never provide the correct answer.
- Maintain cover: complete believable work tasks while investigating. Unexplained delays and conspicuous actions raise suspicion; ordinary work can reduce it. Give players readable warnings and fair recovery opportunities.
- Connect evidence: compare photographs, recorded voices, names and municipal records. Separate verified facts from Malcolm’s uncertain memory. Evidence conclusions need player judgment, not a paid hint.
- Choose an approach: use conversation, public access or a stealth route. Violence is consequential and brief. Injuries influence pacing without requiring payment to recover.
- Protect relationships: dialogue with Mara and Lena affects trust and available approaches. Core revelations remain accessible without purchases.

## Proposed campaign shape

1. **Cedar Route:** Mara observes Malcolm, investigates his name and witnesses the reflexes he cannot explain. Introduce reflections, evidence and uncertainty.
2. **What the Dead Leave Behind:** the bank sequence and Union Station locker escalate the investigation into pursuit. Malcolm becomes the primary player character.
3. **The Memory Trap:** Lena’s danger, the clinic and the recordings turn the mystery toward identity and manipulation. Evidence-board decisions should preserve ambiguity until supported by the manuscript.
4. **Black Harbor:** infiltration, the ledger and the archive turn evidence into difficult release decisions. Preserve the tension between exposing wrongdoing and endangering people named in the records.
5. **Collection Day:** municipal records, reserve packets and the final pre-dawn collection make sanitation knowledge central to the resolution. The concluding objective is protecting an ordinary life, rather than earning a larger weapon.

These are production groupings, not replacements for the book’s chapter titles. The book continues after “Ashes on the Curb”; do not mistakenly treat that earlier resolution as its final ending. The final campaign must account for “Permit at the Wrong Angle” through “Pickup Before Dawn” (PDF pp. 303–462).

## First playable mission: The Man on Cedar Route

Scope: one small Cedar Street scene, three observation targets, one conversation, and an evidence notebook. Target a 5–10 minute prototype before committing to a full campaign.

Player: Mara. Objective: determine whether her concern is supported by anything more than resemblance.

1. Watch the sanitation route from the porch. Establish the ordinary morning and the truck’s repeated stops.
2. Inspect Malcolm’s use of reflections, his left-leg stiffness and his familiar exchanges with neighbors. Present the latter as evidence that his local life is established, not proof that it is false.
3. Decide whether to approach him directly or observe another stop. A direct approach grants dialogue and increases his awareness; observation gives context without a confrontation.
4. Inspect the old photograph and incident report at Mara’s home. The key distinction is no positively identified remains versus proof that Adrian survived.
5. End with the notebook recording a hypothesis. The next scene leads toward the sanitation yard and the Malcolm Graves name.

Failure: conspicuous observation closes an optional observation opportunity and changes dialogue; it does not block the story or prompt a purchase. No store prompt appears during the opening scene.

## Individual paid upgrades

Business instruction: customers pay real money for individual permanent upgrades. No cash bundles, purchased currency, loot boxes, subscriptions, energy timers or paid retries.

| Upgrade | Proposed USD | Mechanical effect |
| --- | --- | --- |
| Quiet work boots | $0.99 | Reduce movement noise radius by 15% in stealth sections. |
| Expanded field kit | $1.99 | Carry one additional optional gadget; mission-critical evidence never uses gadget slots. |
| Reinforced work jacket | $1.99 | Withstand one additional nonfatal impact per mission; scripted outcomes remain unchanged. |

All prices are proposals, not configured store prices. Display the localized price returned by Apple or Google before checkout. These effects are proposed design rules, not implemented gameplay.

The full campaign, essential clues, mission-critical tools and canonical ending must remain achievable with the standard kit. Balance ordinary difficulty without requiring any paid upgrade. Accessibility controls remain available to everyone.

Shop location: between missions, under Equipment. Each card shows its exact effect, one-time price and permanent ownership. Owned items show “Owned” and cannot be purchased twice. Include Restore purchases. Purchases can be cancelled without losing progress.

## Implementation and release status

The twenty-three-scene narrative prototype is implemented. The later campaign, stealth systems and paid effects are not built. Its proposed store catalog is in `paid-upgrades.json`; it deliberately uses a separate product namespace from Rushcraft. Do not register these provisional IDs until the permanent app identifier has been selected.

Reuse the architecture of the existing Rushcraft purchase-verification backend, not its existing product catalog or entitlement fields. A separate game requires its own app registrations, allowed products, account-bound receipts, persistent entitlements and native sandbox tests. Native store checkout and server verification must succeed before any upgrade is unlocked. Refund reconciliation and ownership sync remain release requirements.

Next production task: complete a campaign continuity and playability pass, then deepen recurring missions and build native purchase integration.

## The Cost of Returning — implemented

Scene 14 adapts PDF pages 253–273: remote lockdown, Adrian’s domestic recollections, curated packet assignments, failed-link recovery, Lena retaining her brother’s copy key, the service-duct departure and Adrian’s holdout. Earlier scope previews remain history; the executed story plan is curated. All acknowledgements and the nineteen-endpoint export are local fictional state, with no network transmission. Family and juvenile indices remain in deferred escrow. Receipts do not prove public verification or safety. Toby’s location remains unknown; Adrian is wounded inside and Rourke remains alive.

Thirty-two automated story tests cover progression and save restoration, including release-plan validation and committed story receipts. Android/iOS JavaScript bundle exports and phone-sized browser checks are development validation, not signed native builds or physical-device tests. “Ashes on the Curb” is the next unbuilt chapter. Real-money checkout and upgrade effects remain unfinished; individual permanent upgrades are planned, without currency bundles.

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
