const {finishShift,restoreCareer}=require('./career');
const {getRoute,ANSWERS,TRUCK_CAPACITY,pickupLoad}=require('./routes');
const CLUES = {
dawn_collection:{"title": "Collection only", "type": "STORY OBSERVATION", "text": "Adrian collects the carrier with the north-end auxiliary load. The governor indicator remains lit. Collection alone has not completed verification or disposal; the Hanover fallback has not yet been shown cleared."},
dawn_chain:{"title": "Load verified / chain closed", "type": "FICTIONAL KIOSK STATUS", "text": "The story kiosk reports LOAD VERIFIED, PROCEED TO BURN STAGING, CHAIN CLOSED after the collection is verified. This is a fictional state transition, not proof that every remote copy or threat is gone. No real system is accessed."},
dawn_disposal:{"title": "The carrier enters the furnace line", "type": "STORY OBSERVATION", "text": "The carrier goes into the municipal shred-and-burn stream. The control reports BURN SEQUENCE ACTIVE. The narrative ends with the last practical packet destined for ash. Hazardous handling and machinery operation are condensed, not simulated as instructions."},
mara_departure:{"title": "Get moving, Graves", "type": "STORY CONVERSATION", "text": "Mara leaves the softened court notice with Adrian and Lena, declines a ride and walks away. Her advice is to live ordinary lives rather than create fresh confirmation. Quill answering for his records is anticipated, not a depicted conviction."},
route_ending:{"title": "The next stop", "type": "MANUSCRIPT ENDING", "text": "Lena puts the court notice in the glove box. Asked what if something remains, Adrian says: Then it looks for us living. They return to Pearson and the route. The main manuscript ends here; the story does not claim every danger or copy everywhere has vanished."},

sarto_notice:{"title": "The funeral notice", "type": "POSTED NOTICE", "text": "A board notice lists Evelyn Sarto’s wake the previous night and burial that morning. It supports the report of her death, not a cause of death or proof that Keane knew when he wrote the note."},
quill_assignment:{"title": "Martin Quill’s substitution", "type": "ASSIGNMENT RECORDS", "text": "Sarto’s duties are divided; Fleet Support takes route reconciliation and special file closure under Martin Quill. The carbon and binder connect his authority with cemetery access and contamination tickets. An indented note reads Wake complete. Clear desk before branch audit."},
quill_trace:{"title": "A short employment trail", "type": "MARA’S FINDINGS", "text": "Mara reports fourteen months of payroll history, earlier East Civic Logistics support, inconsistent shell records and identity details linked to a dead custodian. Badge records point to Garland. Those records are leads, not complete independent identity verification."},
quill_offer:{"title": "A governor, he says", "type": "QUILL’S TESTIMONY", "text": "Quill calls the module a governor rather than the copy. He offers to freeze a practical packet and detach the family vector in exchange for it, while admitting the structure could shrink and survive. His proposed trade is not accepted as proof of disarmament."},
held_node:{"title": "Continuity held / packet active", "type": "FICTIONAL CONSOLE STATUS", "text": "In the story Adrian docks the module; its indicator lights. The console reports continuity held, deadman path staged, last practical packet active. A review opens after Quill’s inputs. No real device or system is connected."},
intervention_log:{"title": "D-74B in the intervention log", "type": "FICTIONAL RECORDS / INTERPRETATION", "text": "Entries attributed to Keane’s courier marker list withheld sightings, severed witness bridges and decoupled school and prescription trails, including Boy cut out. Leave no second sighting. They support interventions, not moral absolution or proof of present safety."},
physical_carrier:{"title": "The collection protocol", "type": "FICTIONAL CONSOLE / QUILL’S ACCOUNT", "text": "The review identifies a physical reserve carrier on Cedar Residential Aux, north-end blue container, collection window 04:10–04:32 and cab-side verification. It warns of six private holds on irregular extraction. These story conditions are not an actual operating procedure or a verified shutdown."},
hanover_secondary:{"title": "A secondary pickup", "type": "FICTIONAL CONSOLE WARNING", "text": "Adrian takes a presumed carrier key and route stub, then removes the governor. The console reports a sixteen-hour continuity hold with collection window unchanged. Lena finds: If cab-side verify fails, proceed secondary. Pickup before dawn at Hanover residence. The carrier remains uncollected."},

blue_cart:{"title": "The same cart, different blocks", "type": "ADRIAN’S OBSERVATIONS", "text": "A blue-lidded cart reappears with the same wheel scrape, hinge crack and partly wiped crescent mark. The sedan recurs nearby. The pattern supports deliberate placement, not identification of the driver or purpose."},
blue_addresses:{"title": "Four stops on a matchbook", "type": "ADRIAN’S ROUTE NOTES", "text": "Adrian records four placements: two on Cedar, one off Hanover and one on a street normally serviced Friday. The cart is not on the printed route list. Lena urges him not to give the recurring car more days."},
retrieval_tickets:{"title": "Special Handling tickets", "type": "MARA’S FINDINGS", "text": "Mara reports no cart registrations or replacement requests at the placements, but manual contamination-retrieval tickets under an old Public Works Special Handling program. The source address fields do not resolve properly."},
sarto_login:{"title": "Evelyn Sarto’s login", "type": "ACCESS RECORD / ATTRIBUTION UNCONFIRMED", "text": "Mara traces ticket entries to Parks and Streets on Garland under Evelyn Sarto’s login. A borrowed login or another user at her desk remains possible. This does not establish Sarto’s personal involvement or Keane’s survival."},
route_bundle:{"title": "A module and yellow page", "type": "RECOVERED STORY OBJECTS", "text": "During Mara’s staged work interruption, Adrian recovers a sealed bundle from the contractor bag. At the salt shed it contains a black module and a yellow handwritten note. No physical handling or hazard-identification instructions are simulated."},
blue_note:{"title": "If this reaches route, I did not", "type": "ATTRIBUTED NOTE / UNVERIFIED CLAIMS", "text": "Adrian recognizes Keane’s handwriting. The note describes a reserve-copy trigger dependent on visual domestic confirmation and names SARTO, EVELYN M. as the last custodian he could confirm. It urges checking who clears her route substitutions. Authorship, completeness and current status are not independently authenticated."},
dark_indicator:{"title": "The module stays closed", "type": "OBSERVATION / DECISION", "text": "The black case has recessed contacts, a lens and a dark indicator. Adrian declines to open it or connect it to a county machine. A dark indicator does not prove inactivity or safety. The object’s behavior remains untested."},
blue_departure:{"title": "Toward the trucks", "type": "STORY DECISION", "text": "Adrian wraps the unopened module in the note and turns toward the trucks instead of the road home. Lena needs to know; Toby is to receive age-appropriate practical guidance, not the full architecture. Keane’s fate remains unresolved."},

audit_intent:{"title": "Audit, not raw exposure", "type": "FICTIONAL CONSOLE / PLAN", "text": "Adrian enters the name Danner Keane in the story and selects AUDIT. The live map ties domestic identifiers to prosecutable records. Paul’s note says to strip bridges first and keep the chain."},
substitute_chain:{"title": "Proof without bait", "type": "FICTIONAL TRANSFORMATION", "text": "Lena brings the retained legal-pad crosswalk. The story console substitutes sealed witness references for family identifiers while retaining the legal custody hash, payment chains, validations, custodians and protector assignments. This is fictional output, not a general guarantee of anonymization."},
cleaned_marker:{"title": "A coded continuance marker", "type": "FICTIONAL RECORD / INTERPRETATION", "text": "A juvenile respiratory-claim reference remains as code and date, without name or address. Adrian reads it as support for Keane’s account of removing the child from the live chain. It is not a universal guarantee of safety."},
reserve_receipts:{"title": "Nine selected outputs in transit", "type": "SIMULATED RECEIPTS", "text": "Six evidence groups and three structural memos leave through staggered story channels. Channel nine is interrupted and rerouted. Receipts include accepted for review and pending authentication; these do not by themselves prove convictions. No real transmission occurs."},
local_node:{"title": "No generated purge", "type": "STORY ACTION", "text": "Adrian declines the generated local purge, then physically damages the monitor and tower in the narrative. This is not verified erasure. He takes Keane’s keys and cracked badge; Lena retains the legal-pad sheet."},
keane_absent:{"title": "No one found Keane", "type": "OBSERVATION / LATER REPORTS", "text": "Keane stays covering the hall as Adrian, Lena and Mara escape by the rear catwalk. Later there is blood and missing camera footage, but no confirmed body or located survivor. His death or escape is not established."},
family_shield:{"title": "The redaction order held", "type": "COURT AFTERMATH", "text": "Cross-jurisdiction evidence comparisons lead to warrants, filings and trials. Mara brings notice that a custodian pleaded and two protectors cooperated; the dependent-file redaction order held. This does not mean every threat or copy is gone."},
field_trip:{"title": "Before the route", "type": "DOMESTIC OBSERVATION", "text": "Lena shreds only leftover family details, retaining the legal-pad sheet and evidence copies. Later Adrian signs Toby’s aquarium field-trip form before work. A sedan pauses on Cedar, then turns away. Identity and intent remain unknown."},

keane_returns:{"title": "Keane in the trench", "type": "OBSERVATION / TESTIMONY", "text": "Keane joins them, helps open the outfall and leaves with the group. He denies killing Paul but admits pressuring him. He attributes the attack to reserve protectors; the SUV occupants remain unidentified."},
records_mirror:{"title": "A municipal records mirror", "type": "KEANE’S ACCOUNT", "text": "Keane describes an index bridge tying people to locations, cover bills, routes and domestic confirmations in county records. He says irregular extraction can trigger a custodial release. These are story-system claims, not an actual connected database."},
mirror_node:{"title": "The dead room above dispatch", "type": "DOCUMENT COMPARISON / LOCAL KNOWLEDGE", "text": "Lena’s disposal notation matches a backup schedule and county maintenance exception in Paul’s scans. Mara identifies Mirror Node C on the back-office side. Adrian recognizes the old mezzanine room Duffy calls the dead room."},
lena_sequence:{"title": "Lena’s copied order", "type": "PREPARED STORY DOCUMENT", "text": "Lena assembles Paul’s notes into a sequence: disposal duplicate, route corrections, witness. She tells Adrian to stop if he misses a step rather than guess. The rehearsed labels are not real credentials or a full extraction."},
disposal_challenge:{"title": "A missing overflow transfer", "type": "STORY PLAN", "text": "Lena finds Paul’s unfiled Delmore discrepancy. Mara will challenge its manifest at the front office while Graves follows his familiar paperwork route. Lena insists the yard’s workers must not become collateral. Keane watches the other approach; his allegiance remains conditional."},
black_file_index:{"title": "WT-BLK-RCV", "type": "FICTIONAL TERMINAL INDEX", "text": "After story duplicate-order acceptance, Adrian reviews disposal variation and route reconciliation. WT-BLK-RCV cross-links domestic records, witness bundles, custodians and protectors. Reserve Packet 1 is active; the story console offers a handshake. No packet has been extracted."},
courier_handshake:{"title": "A second authorization waits", "type": "FICTIONAL CONSOLE STATUS", "text": "During the breach Keane supplies courier validation. The console accepts it and requests a second authorization. Keane is wounded but still covering the door. The second name has not been entered, and no new release has been sent."},

jonas_machine:{"title": "Jonas’s stored computer", "type": "STORY OBSERVATION", "text": "Mara retrieves Jonas’s isolated computer from his warehouse cage. Paul’s drive is read there in the story. No uploaded drive, real device or network is opened by the game."},
paul_crosswalk:{"title": "A crosswalk, not one file", "type": "DRIVE CONTENTS", "text": "Scans connect utility accounts with school, court, prescription and branch records. Photographs show domestic verification points. Mara says it is enough to demonstrate the structure, not a complete copy of everything."},
paul_audio:{"title": "Paul’s recorded warning", "type": "RECORDED TESTIMONY", "text": "Paul says Keane sought one reserve packet, maybe two, under emergency authorization. He describes people packets. His account includes uncertainty and does not independently establish every motive or count."},
architect_claim:{"title": "Courier only / architect claim", "type": "RECOVERED SCANS / INTERPRETATION", "text": "One scan restricts the reserve route to a surviving line or designated suppression architect. Another reads D. Keane courier side only, no archive authority. Lena and Adrian interpret the architect designation as Adrian. These are recovered documents, not a completed access test."},
weigh_agreement:{"title": "The north weigh station", "type": "STORY CONVERSATION", "text": "Adrian chooses the municipal transfer lot for a meeting. Keane agrees to one hour. Lena insists on hearing the conversation herself. Story copies of the drive and the stored computer travel with them."},
keane_account:{"title": "Keane’s account of the child", "type": "KEANE’S TESTIMONY / PARTIAL RECOLLECTION", "text": "Keane says Adrian removed Toby from the active dependency chain while leaving record residue and identifying bridges in a reserve packet. Adrian has a partial recollection of substitution forms. Neither establishes present safety or resolves all earlier chronology."},
route_card:{"title": "Access route, not the packet", "type": "PHYSICAL STORY DOCUMENT", "text": "Keane offers a folded access card. He claims he sought to sever the branch before prosecutors or custodians took it. Adrian takes the card during the attack; the packet has not been retrieved and Keane’s intent is unverified."},
weigh_attack:{"title": "The canopy attack", "type": "OBSERVATION / ATTRIBUTION UNCONFIRMED", "text": "Gunfire comes from outside the transfer lot. Keane calls it a third team; the attackers are not independently identified. Mara and Lena reach the compactor-row gate. Keane turns toward an incoming SUV as Mara pulls Adrian into the trench; his fate is not yet shown."},

sedan_watch:{"title": "Two houses down", "type": "OBSERVATION / SUSPICION", "text": "A sedan waits without visible occupants. Mara suspects an earlier sighting but cannot prove it is the same car. Lena prepares Toby’s shoes and inhaler before they leave for Carol’s."},
clinic_claim:{"title": "The Ramsey refill", "type": "CAROL’S ACCOUNT / INFERENCE", "text": "Carol reports an urgent-care refill under the family card with the old Millbrook address, three weeks earlier. The timing matches the credential lead. A connection to the reserve branch is suspected, not independently established; seeking treatment was not a mistake."},
relay_tin:{"title": "Paul’s coffee tin", "type": "RECOVERED DOCUMENTS", "text": "At the relay shed, Paul’s brass key fits. A tin holds keys, claim forms and an adding-machine strip linking dead properties to a live Ramsey clinic code. The wall map marks the relay, storage office and two meter-route points."},
storage_call:{"title": "Hold the storage lock", "type": "OVERHEARD STORY TRANSMISSION", "text": "Two unidentified voices mention the relay being dark and holding the storage lock. A silver crossover returns and moves on. Neither the voices nor the vehicle occupants are identified. No real radio is accessed."},
survivability_sets:{"title": "The duplicate work sets", "type": "RECOVERED FILES / INTERPRETATION", "text": "Mislabeled storage boxes contain family relations, relocation notes, school and prescription records, reserve indexes and witness statuses. Mara judges them maintained after the harbor. Paul appears as a handling contact with an integrity-concern annotation."},
witness_sleeve:{"title": "Bundle pending hand transfer", "type": "RECOVERED DOCUMENTS", "text": "A witness-family sleeve has no completed destination. A separate drive is wrapped in a Ramsey prescription handout with Paul’s warning about a dependent pair. Paul’s note says Keane is trying to pull the same file. His motives remain uncertain; the drive is unread."},
storage_escape:{"title": "The loading-yard escape", "type": "OBSERVATION", "text": "Intruders enter; a silver crossover blocks part of the exit. Adrian, Lena and Mara escape in the truck under fire. Lena retains the witness sleeve, handout and drive. Their survival is not conditioned on equipment or payment."},
keane_warning:{"title": "Don’t bring it home", "type": "VOICE RECOGNITION / INTERPRETATION", "text": "At the closed farm-supply lot, a voice Adrian recognizes as Keane says: If you took it, don’t bring it home. Recognition is not independent authentication. Warning and steering remain possible; headlights slow beyond the bay."},

van_loop:{"title": "The van returns", "type": "ADRIAN’S OBSERVATION", "text": "A dark blue van appears again beyond Cedar and later on Laurel. The repeated sightings support concern about surveillance, but do not identify the occupants."},
delmore_permit:{"title": "Delmore Site Services", "type": "MARA’S FINDINGS", "text": "Mara reports ghosted plates and a permit renewed under a defunct program for dissolved Delmore Site Services, two shells under Marrow. Billing codes resemble its transfer-fee pattern. The renewal chain contains no named requester."},
domestic_fragment:{"title": "Reserve domestic — partial", "type": "DAMAGED RECORD / INTERPRETATION", "text": "Mara reports damaged escrow fragments repeating domestic address pending verification against field sighting and spousal vector. The van’s route crossed Hanover, Birch and Morton. The fragment has no name or full file; the family-targeting interpretation remains an inference."},
service_credential:{"title": "Service Road East", "type": "ACCESS-LOG LEAD", "text": "Mara says a dead Black Harbor line inspector’s credential was used three weeks earlier from an office on Service Road East. A credential log is not proof of the person using it."},
paul_box:{"title": "Paul Mendez’s envelopes", "type": "FAMILY DOCUMENTS", "text": "Lena identifies her brother as Paul Mendez and supplies a key. The closet box holds eight envelopes, utility papers, meter photographs, a notebook and a flash drive. Nothing on the drive is read here. This is separate from the folded B12 sheet."},
last_envelope:{"title": "Open last", "type": "PAUL’S DOCUMENT / WARNING", "text": "The latest envelope, postmarked eleven days before Paul died, contains a utility summary and a warning about old emergency authorizations. It names KEANE, D. and says Not dead paperwork. Live feed. The document is a lead, not an independently verified live connection."},
waiting_engine:{"title": "An engine outside", "type": "OBSERVATION", "text": "As Adrian and Lena review the Marrow-marked utility sheet, a car passes slowly, coasts and stops beyond the living-room window. Occupants and intent remain unknown."},

cradle_return:{"title": "Adrian reaches the cradle", "type": "OBSERVATION", "text": "After Jonas releases the brake, Adrian emerges from the duct wounded but alive. Lena helps him. The group has not yet escaped the platform."},
harbor_recovery:{"title": "Recovered alive", "type": "NEWS REPORT", "text": "After falling into the harbor, Rourke is recovered alive. Later reports describe armed guard, detention and multinational warrants. Keane leaves the landing; his whereabouts remain unresolved."},
public_aftermath:{"title": "Evidence enters public view", "type": "REPORTED AFTERMATH", "text": "Packets surface across jurisdictions, bridge footage airs and arrests follow. Later hearing material supplies authenticated signatures. Exposure does not dismantle every network or make every headline accurate."},
family_reunion:{"title": "Toby on the back step", "type": "MARA’S OBSERVATION", "text": "Three weeks after the harbor, Mara sees Toby alive with Lena outside Millbrook. The scene establishes his presence now; it does not reconcile every earlier statement or timeline."},
cedar_return:{"title": "Thursday on Cedar", "type": "OBSERVATION", "text": "Under a temporary sanitation contract, Adrian works the route as Graves. He remains injured and alert. Mara gives him a docket scrap: a local screening contact has requested both death certificates."},
continuing_cases:{"title": "Hearings, escrow and absences", "type": "ONGOING AFTERMATH", "text": "Deferred evidence continues surfacing; Rourke remains alive under proceedings. Jonas enters witness protection, Hale medical custody. Reports of Keane are unconfirmed. The local contact disappears; this is not proof of arrest or death."},
crooked_permit:{"title": "A permit at the wrong angle", "type": "OBSERVATION", "text": "A dark blue van slows on Cedar with a misaligned county permit. Its occupant claims utilities. Mara challenges the claim in public; the van leaves. Its occupants and purpose are not conclusively identified."},

  remote_lockdown:{"title": "Remote maintenance lockdown", "type": "CONSOLE STATUS", "text": "Selective and internal paths degrade; the legal tranche queues. Rourke has reached the system, but his control is not complete."},
  reserve_branch:{"title": "The reserve branch", "type": "OBSERVATION / CLAIM", "text": "Adrian finds a cross-coupled reserve branch. Rourke warns that uncontrolled exposure could endanger peripheral people and families. Keane corroborates the hazard; every adversary claim is not thereby verified."},
  toby_account:{"title": "A coat and an inhaler", "type": "ADRIAN’S RECOLLECTION", "text": "Adrian recalls domestic details and calls Toby their son. Lena recognizes the blue coat. These accounts do not establish Toby’s location, fate or a reconciled timeline."},
  curated_packets:{"title": "A divided release", "type": "RELEASE PLAN", "text": "Financial evidence goes to watchdogs, North Span footage to journalists and court liaison, corruption evidence to rival-agency review. Family and juvenile indices remain in restricted judicial escrow. This does not guarantee safety or erase the reserve branch."},
  initial_receipts:{"title": "The first acknowledgements", "type": "SIMULATED CONSOLE STATUS", "text": "After a failed link and reroute, the story console acknowledges initial packets. This is not the final export status."},
  copy_key:{"title": "Lena’s folded sheet", "type": "LENA’S DOCUMENT", "text": "Her brother’s copy key names a storage account, two people and a routing note toward a secondary Marrow holding. Lena retains the sheet. The lead is not resolved or sent as a raw packet."},
  cascade_accepted:{"title": "Relay cascade accepted", "type": "SIMULATED CONSOLE STATUS", "text": "The final prepared packet is accepted as Adrian covers the service duct. Hale, Jonas, Lena and Mara leave toward the lower tug cradle."},
  export_status:{"title": "Nineteen endpoints", "type": "SIMULATED CONSOLE STATUS", "text": "EXPORT COMPLETE TO 19 ENDPOINTS / DEFERRED ESCROW ARMED. The console does not prove public verification. Adrian remains wounded inside; Rourke is alive near the breach."},

  reflections:{title:'The reflected glance',type:'OBSERVATION',text:'He uses the front window to check the street behind him. A familiar habit, but not proof of identity.'},
  gait:{title:'The left leg',type:'OBSERVATION',text:'He favors his left leg when he lands. An old injury could explain it. Many people carry old injuries.'},
  neighbors:{title:'A life already here',type:'OBSERVATION',text:'Mrs. Galvez knows his name. Mr. Baines asks after his knee. These relationships did not begin this morning.'},
  conversation:{title:'Malcolm, on the route',type:'TESTIMONY',text:'He says this route has been his for six months. His answers are brief. Brevity alone proves nothing.'},
  photo:{title:'The Marseille photograph',type:'ARCHIVE',text:'The man in the old photograph is Adrian Vale. The worker resembles him in movement more than appearance.'},
  report:{title:'No identified remains',type:'ARCHIVE',text:'The bridge incident report did not positively identify Adrian’s remains. An unresolved death is not evidence of survival.'},
  route:{title:'Cedar / Ridge / Latham',type:'OBSERVATION',text:'The yard’s assignment board groups Cedar with Ridge and Latham. Match the route before attaching a surname to a face.'},
  surname:{title:'Ortiz / Graves',type:'MUNICIPAL RECORD',text:'The Cedar / Ridge / Latham assignment lists Ortiz and Graves. Combined with the neighbors’ first name, it gives Mara a lead: Malcolm Graves.'},
  registration:{title:'A name on Hanover Street',type:'PUBLIC RECORD',text:'The public-record entry lists Malcolm Graves on Hanover Street. A record confirms a local identity, not a connection to Adrian Vale.'},
  contact:{title:'Lena Graves',type:'PUBLIC RECORD',text:'Lena Graves appears as the emergency contact. The local identity has connections to other people; they are not just entries in an investigation.'},
  van_reflection:{title:'The van’s dark panel',type:'OBSERVATION',text:'Malcolm catches a reflection while waiting at the corner. His posture changes. Mara can no longer assume her interest has gone unnoticed.'},
  reflex:{title:'Before thought catches up',type:'OBSERVATION',text:'When threatened on Mercer, Malcolm reacts with practiced speed. His ability is observable; where he learned it is still unknown.'},
  confusion:{title:'His own hands',type:'TESTIMONY',text:'After the encounter, Malcolm seems shaken by his own reaction. He says he did not think. His apparent confusion deserves attention, not a diagnosis.'},
  scar:{title:'A crescent near the ear',type:'OBSERVATION',text:'Mara notices a scar near Malcolm’s left ear, where Adrian’s file describes an old injury. It strengthens a question; it does not establish an identity.'},
  fire_recall:{title:'Fire, fuel, concrete dust',type:'RECOLLECTION',text:'Malcolm describes fragments after hearing Adrian’s name. Mara allows him to find his own words. The fragments remain testimony, not a verified reconstruction.'},
  prompted_recall:{title:'A suggested voice',type:'PROMPTED RECOLLECTION',text:'Mara supplies a detail before Malcolm finishes. His later agreement cannot independently confirm that detail. Record the prompt alongside the account.'},
  passport:{title:'His face, another name',type:'RECOLLECTION',text:'The Marseille photograph prompts a fragment of a passport. Malcolm cannot settle its color or its name. Do not convert uncertainty into a precise memory.'},
  family_boundary:{title:'That is my life',type:'TESTIMONY',text:'Malcolm names Lena and his six years on Hanover as a boundary. He keeps the photograph but says he will not attend the diner meeting.'},
  feed_loss:{title:'The feeds disappear',type:'SYSTEM RECORD',text:'After Mara reviews the porch footage, several camera feeds disappear. Jonas warns that her interest has been noticed. The event supports active attention, not a proven identity for whoever is watching.'},
  maintenance:{title:'No scheduled maintenance',type:'MUNICIPAL RECORD',text:'The work-order summary lists no camera maintenance for Cedar that day. Paired with the sequence of lost feeds, this makes routine maintenance an inadequate explanation.'},
  activation:{title:'Two stages at Calder & Merrow',type:'BANK RECORD',text:'Mara’s activation card satisfies the paper stage. Ms. Bell says a separate physical confirmation is still required. Admission to the bank alone does not unlock the case.'},
  marker:{title:'The sealed physical marker',type:'BANK RECORD',text:'Ms. Bell compares the scar near Malcolm’s left ear with the sealed record and confirms access. This is a concrete link to the old contingency, beyond Mara’s resemblance theory.'},
  termination:{title:'Nathan Rourke’s signature',type:'DOCUMENT',text:'The case holds an authorization naming Adrian Vale as compromised and non-recoverable, signed Nathan Rourke. Mara identifies the signature as directorate authority. The document does not explain who currently controls the pursuit.'},
  anton:{title:'Anton Eberhardt',type:'DOCUMENT',text:'A dark-blue passport bears Malcolm’s younger face under the name Anton Eberhardt. It is a physical document, distinct from his earlier uncertain recollection of a passport.'},
  locker_key:{title:'The red tag: 247',type:'OBJECT',text:'The brass key has a red tag stamped 247. Mara recognizes the tag as belonging to Union Station’s old lockers. The destination is a lead supplied by her knowledge, not printed on the key.'},
  codebook:{title:'The oilskin notebook',type:'DOCUMENT',text:'Numbers, initials and dates fill the notebook. Mara calls it a codebook. At the bank, its contents have not yet been decoded; opening it does not automatically reveal its contacts or operations.'},
  bell_attack:{title:'Bell at the vault door',type:'WITNESSED EVENT',text:'Armed men enter the vault corridor. Bell refuses to move aside and is shot. The visit is no longer a private investigation; Malcolm and Mara must leave.'},
  keane_claim:{title:'What Keane says',type:'ADVERSARY TESTIMONY',text:'The man calling himself Keane recognizes Vale and claims Rourke wanted what Vale had. His claims may be calculated. They are not independent proof of Rourke’s purpose.'},
  mara_partner:{title:'Not all',type:'TESTIMONY',text:'On the train, Mara says Adrian was her partner, then acknowledges that was not all. She does not define the relationship further. Do not turn Keane’s taunt into a confirmed marriage.'},
  station_pattern:{title:'Page three, line seven',type:'PARTIAL DECODING',text:'Malcolm reorganizes one notebook entry. He and Mara connect its coordinates to Union Station, and Malcolm supplies locker 247. One entry is resolved; the rest of the notebook is not decoded.'},
  station_watchers:{title:'The severed phone cord',type:'OBSERVATION',text:'Near the public lockers, a man holds a receiver whose cord is severed. Another watches reflections. Their behavior supports Mara’s concern that the locker area is being watched.'},
  harbor_label:{title:'The BLACK HARBOR sleeve',type:'OBJECT',text:'Locker 247 contains a satchel with a phone, a wrapped pistol and a flash drive labeled BLACK HARBOR. Malcolm recognizes the label as his own handwriting. Recognition is recorded separately from the contents of the drive.'},
  phone_draft:{title:'The unsent warning',type:'STORED MESSAGE',text:'The old handset contains an unsent draft warning against Directorate channels and linking Black Harbor to Rourke. It also asks that Mara be told he was late. The draft is a warning written in the past, not a live message or a guarantee of present safety.'},
  read_first:{title:'READ FIRST',type:'ARCHIVED STATEMENT',text:'The drive’s introductory file describes Black Harbor as a sale channel for private buyers, off-book transfers and live identities. The author says the copy was made before Kars. The archive is incomplete.'},
  harbor_ledger:{title:'Names beside transfers',type:'ARCHIVE RECORD',text:'Ledger rows connect transfer dates, operational designators and real names. NR appears repeatedly as an authorization. This supports the archived account; it does not make every missing person or transaction fully explained.'},
  harbor_audio:{title:'Contained, not traded',type:'AUDIO RECORDING',text:'A recording discusses delivery schedules and a Kars operative to be contained rather than traded. Mara identifies the composed voice as Rourke’s. Her identification is part of the evidence, not automated voice authentication.'},
  harbor_accounts:{title:'The missing linked records',type:'ARCHIVE RECORD',text:'Scanned accounts and another handwritten note connect Black Harbor with Rourke’s channel. Mara notices missing dates and unlinked references. This is a partial archive, not the complete operation.'},
  hanover_watch:{title:'Hanover’s broken routine',type:'OBSERVATION',text:'A utility van, a motionless sedan occupant and a man posing as a contractor watch the house. Mara and Malcolm find the rear watched as well. The pattern makes the return home dangerous.'},
  lena_account:{title:'What Lena can handle',type:'TESTIMONY',text:'Lena refuses to leave without an explanation. Malcolm acknowledges the people from his missing past and the limits of his knowledge. She says he does not get to decide what she can handle.'},
  ultimatum:{title:'The unsigned utility notice',type:'PHYSICAL MESSAGE',text:'A card slid under the front door has no company seal. Its reverse threatens entry unless Malcolm talks. It is a threat, not a genuine utility appointment.'},
  false_stop:{title:'The apparent patrol stop',type:'OBSERVATION',text:'Malcolm and Mara notice inconsistencies in the vehicle following Lena and the coordinated SUV ahead. The familiar appearance of a patrol car is part of the deception in this encounter.'},
  lena_taken:{title:'Lena in the southbound SUV',type:'WITNESSED EVENT',text:'The attempted departure ends with Lena taken into an SUV. Malcolm and Mara try to reach her, but the vehicle escapes south under the overpass. Keane appears from the false patrol car.'},
  med_order:{title:'HALE, S. · Site 4',type:'ARCHIVED ORDER',text:'A MEDCONTAINMENT order names Hale and Site 4 / North Clinic. The surviving line forbids civilian admission. It gives a location and a name, not a complete medical history.'},
  transfer_audio:{title:'Nothing true',type:'AUDIO TRANSCRIPT',text:'An archived recording describes an injured patient judged unstable for transfer and instructions to conceal the truth. It supports investigating North Clinic, but does not itself settle everything Hale later claims.'},
  hale_injury:{title:'Hale’s account of survival',type:'WITNESS TESTIMONY',text:'Soren Hale says Adrian survived the bridge, was recovered downstream, and underwent prolonged care and transfers. He describes the Graves identity as constructed from records. He is an involved witness, not a neutral narrator.'},
  hale_choice:{title:'Who asked for suppression?',type:'WITNESS TESTIMONY',text:'Hale attributes the memory loss to severe injury and later deliberate intervention. He claims Adrian repeatedly requested suppression. That account and an old recording do not establish the clinical validity or freedom of consent.'},
  session12:{title:'Session 12 · the recorded voice',type:'AUDIO TRANSCRIPT',text:'The recording identifies its speaker as Adrian Vale and expresses a preference for waking without recall rather than with access. Malcolm recognizes the voice as his own. The tape is historical evidence, not a full account of treatment or a medical endorsement.'},
  carrier_phrase:{title:'Names in the static',type:'RECORDED LEAD',text:'Through static, the recorded voice points beyond the ledger to carrier traffic and dead channels, ending with “Names in the static.” The phrase is a lead; the carrier material has not yet been found or decoded.'},
  anchor_claim:{title:'Hale’s account of the lock',type:'WITNESS TESTIMONY',text:'After the clinic escape, Hale describes an instruction linking recovery to a person, whom Malcolm identifies as Lena. Hale admits uncertainty about whether her connection was arranged. The claim does not establish her knowledge or complicity.'},
  spousal_vector:{title:'GRAVES / SPOUSAL VECTOR',type:'RECOVERED RECORDING',text:'A locked compartment in Hale’s case contains index cards, a folded photograph and a microcassette carrying this label. At recovery, the label did not reveal its contents and the cassette was still unplayed.'},
  contact_photo:{title:'Unscripted interest',type:'SURVEILLANCE PHOTOGRAPH',text:'The photograph shows Lena leaving an office, with Malcolm watching farther back. Its caption reads INITIAL CONTACT VIABLE. SUBJECT DISPLAYS UNSCRIPTED INTEREST. It establishes observation and an annotation, not Lena’s awareness of either.'},
  frequency_groups:{title:'Bands, not dates',type:'PARTIAL INTERPRETATION',text:'Malcolm identifies notebook groups as radio frequencies and intervals, not calendar dates. The interpretation opens a way to compare the cards with the copied archive; it does not decode every entry.'},
  cleanup_chain:{title:'The archive behind the initials',type:'CROSS-REFERENCE',text:'B.N., I.C. and P.S. are matched to Branislav Novak, Idris Celik and Petra Salonen in the archive. The records connect official reassignments, transfers and reported deaths. The pattern suggests a concealed cleanup chain.'},
  spousal_content:{title:'The cassette after recovery',type:'AUDIO TRANSCRIPT',text:'Jonas recovers speech describing observation, attachment without formal reinforcement, and a segment Malcolm recognizes as his own voice. It names Lena and Toby and describes fear of leverage. The tape carries no reliable recording date; its statements do not establish Lena’s knowledge.'},
  toby_risk:{title:'Toby is a person, not a variable',type:'TESTIMONY AND RECORDED MENTION',text:'The cassette names Lena and her son Toby. Malcolm remembers ordinary moments with him and does not know his present location. Mention on the tape is not proof that he has been captured.'},
  ash_ledger:{title:'Ash ledger',type:'INTERPRETED LEAD',text:'Missing notebook pages, aligned index-card markings and surviving chain references point toward an original ledger. Malcolm has fragments of a storage location, not possession of the ledger itself.'},
  millbrook_lead:{title:'Carol Mendez · Millbrook',type:'REPORTED LEAD',text:'Jonas reports a likely address for Lena’s sister and an unexplained brief incoming call. There is no captured voice and no direct confirmation that Toby is there.'},
  loop_signal:{title:'ASH / UNION / WEST ANNEX',type:'SIGNAL TRANSCRIPT',text:'The receiver’s repeating fragments point to the old Union freight yard, west annex and Sub B. Malcolm connects them to a freight utility level and relay room. The loop does not establish that the site is safe or the ledger still untouched.'},
  dependent_demand:{title:'Proof of life for a dependent pair',type:'UNATTRIBUTED DEMAND',text:'A fresh processed voice asks for proof of life for a dependent pair in exchange for relay coordinates. Mara interprets the request as a bid rather than confirmation of joint custody. Neither speaker identity nor Lena’s and Toby’s exact whereabouts is verified.'},
  curved_estate:{title:'The house’s curved perimeter',type:'OBSERVATION',text:'The estate’s curved walls, moving lights and exposed approaches are designed around surveillance. Adrian studies the service side while Mara and Jonas watch from outside. Observation is limited to the scene, not a complete map of the site.'},
  rourke_arrival:{title:'Rourke enters the estate',type:'WITNESSED EVENT',text:'Rourke arrives and enters the house. His presence raises the stakes and supports searching the site for Lena. It does not by itself confirm her room or Toby’s whereabouts.'},
  holding_feed:{title:'Lena on the B-12 monitor',type:'OBSERVED MONITOR IMAGE',text:'An interior monitor shows Lena alive in B-12. The image establishes what Adrian sees at that moment, not that the rest of the house or her route out is clear.'},
  east_report:{title:'Still nothing east',type:'OVERHEARD ACCOUNT',text:'Staff say the sister’s house was cold and there is still nothing east about the boy. It is an overheard report, not direct confirmation of Toby’s safety or present location.'},
  lena_brother:{title:'The copies her brother sent',type:'LENA’S TESTIMONY',text:'Lena says her brother sent copies after noticing repeated company names and possible connections to Malcolm. His later death was reported as a crash. She kept his envelopes. Her knowledge comes from that history, not a demonstrated role in the memory operation.'},
  legal_pad:{title:'Lena’s reconstructed list',type:'HANDWRITTEN RECORD',text:'Lena has written company fragments and names on a legal-pad sheet from memory. She says it is not enough, and refuses to leave without concrete evidence. This is her reconstruction, not the original ledger.'},
  estate_ledger:{title:'The records-room ledger',type:'RECOVERED DOCUMENT',text:'Lena recognizes her brother’s handwriting in the physical book in the records room. They recover it under threat. Its relation to the complete Black Harbor archive is not settled merely by possessing it.'},
  marrow_memo:{title:'Marrow Holdings exception summary',type:'AUDIT MEMO',text:'A sleeve inside the ledger holds a preliminary exception summary naming Marrow Holdings. Lena recognizes the company her brother flagged. It is a specific audit document, distinct from her handwritten reconstruction.'},
  drive_retained:{title:'The drive survives the shutters',type:'WITNESSED EVENT',text:'Mara checks the satchel after the group clears the estate’s shutters. The recovered drive is still there. Lena and the physical ledger are with them; they are not yet beyond the grounds.'},
  van_impact:{title:'Jonas’s van is struck',type:'WITNESSED EVENT',text:'An SUV strikes the van near the estate’s outer wall. The radio falls silent. The impact is observed, but Jonas’s death is not established.'},
  jonas_returns:{title:'One working headlamp',type:'WITNESSED EVENT',text:'After the drainage escape, Jonas reappears in the damaged van and takes the group aboard. He is injured but alive. This resolves the earlier uncertainty about him, not the wider pursuit.'},
  routing_marks:{title:'Shipping terms over other transfers',type:'RECOVERED DOCUMENT',text:'The book contains quarter codes, consignor marks, transfer points and shipping language. A mark beside Marrow Holdings triggers Adrian’s recollection. The visible page and what it makes him remember are different sources.'},
  market_fragment:{title:'Not only agents',type:'RECOLLECTION',text:'Adrian recalls Black Harbor as a market for leverage over people who could affect policy and institutions, extending beyond agents. These returning fragments expand his account; they are not the complete authenticated archive.'},
  kars_return:{title:'The bridge transfer returns',type:'RECOLLECTION',text:'Adrian recalls trying to extract people and the archive at Kars, Keane appearing under recovery authority, and the detonation already being primed. The recollection is fuller than the earlier fire fragments but does not restore every missing year.'},
  split_access:{title:'Split access · body only',type:'RECOLLECTION',text:'Adrian remembers separating the paper routing shell from a protected archive requiring his presence. The memory describes his design; no archive has yet been reached or authenticated.'},
  offshore_lead:{title:'Behind the waste plant',type:'RECALLED LOCATION',text:'Adrian identifies an offshore transfer station behind the Black Harbor waste plant as the archive’s location. He admits he cannot prove the recollection on the spot. The group heads toward the harbor to test it.'},
  hale_platform:{title:'Hale at the platform',type:'WITNESSED EVENT AND CLAIM',text:'Hale meets the group at the offshore platform. He claims he was followed rather than leading the clinic pursuers. His presence is observed; his explanation remains his account.'},
  scar_variance:{title:'Primary authentication degraded',type:'ARCHIVE STATUS',text:'The archive rejects the primary match with a scar-map variance. Hale enables the contingent cognitive confirmation. The exception is part of the archive’s designed access path, not an independently discovered second entrance.'},
  cognitive_record:{title:'The contingent record',type:'ADRIAN’S STATEMENT',text:'Adrian names Black Harbor and the containment breach, describes the changed order and his refusal, and accepts restoration of record. His account provides the story’s contingent confirmation. It is not a complete medical recovery or a blanket absolution.'},
  integrity_check:{title:'Seventeen hours prior',type:'ARCHIVE STATUS',text:'The console reports a prior integrity check seventeen hours earlier. Jonas suspects another visitor; Hale says an automated check could explain it. The status alone does not establish which occurred.'},
  north_span:{title:'Mass Event / North Span',type:'ARCHIVE FOOTAGE REVIEW',text:'The reviewed footage places Rourke on the bridge with brokers, records the containment order and shows Adrian triggering the blast. It supplies recorded material alongside the returning memories. The story review is not an independent forensic certification of every archive file.'},
  release_recipients:{title:'The contingency release list',type:'ARCHIVE DIRECTORY',text:'The archive lists journalists, prosecutors, anti-corruption offices and relay destinations. It offers graded release paths as well as a full dump. Seeing the list does not execute any transfer.'},
  outer_room:{title:'Rourke in the outer module',type:'OBSERVED MONITOR IMAGE',text:'Before a release is completed, the file view is interrupted by the outer-room camera. Rourke enters with Keane and armed men and warns that he has insurance. The inner archive remains contested.'},
};
const STAGES=['title','street','conversation','office','assessment','complete','yard_gate','yard_board','yard_records','yard_complete','mercer_follow','mercer_encounter','mercer_aftermath','mercer_dialogue','mercer_complete','fire_return','fire_memory','fire_photo','fire_watch','fire_complete','dead_door','dead_bank','dead_box','dead_complete','escape_pack','escape_service','escape_keane','escape_train','escape_complete','station_arrival','station_locker','station_phone','station_files','station_complete','wife_arrival','wife_kitchen','wife_prepare','wife_road','wife_complete','memory_standoff','memory_archive','memory_hale','memory_tape','memory_escape','memory_case','memory_complete','static_arrival','static_cards','static_tape','static_axis','static_receiver','static_complete','house_perimeter','house_monitor','house_lena','house_records','house_confront','house_complete','rising_records','rising_drain','rising_ledger','rising_recall','rising_yard','rising_complete','archive_approach','archive_door','archive_record','archive_files','archive_release','archive_complete','cost_lockdown','cost_family','cost_plan','cost_queue','cost_copykey','cost_departure','cost_holdout','cost_complete','ashes_cradle','ashes_harbor','ashes_aftermath','ashes_family','ashes_cedar','ashes_pattern','ashes_van','ashes_complete','permit_route','permit_briefing','permit_domestic','permit_home','permit_box','permit_last','permit_complete','service_house','service_carol','service_relay','service_radio','service_storage','service_bundle','service_escape','service_warning','service_complete','notices_machine','notices_files','notices_call','notices_lena','notices_meeting','notices_card','notices_attack','notices_complete','truck_trench','truck_mirror','truck_records','truck_order','truck_plan','truck_yard','truck_index','truck_breach','truck_complete','collection_intent','collection_clean','collection_send','collection_node','collection_escape','collection_aftermath','collection_home','collection_complete','blue_sighting','blue_compare','blue_home','blue_tickets','blue_recovery','blue_note','blue_module','blue_complete','custodian_board','custodian_trace','custodian_office','custodian_offer','custodian_review','custodian_log','custodian_carrier','custodian_complete','dawn_route','dawn_collected','dawn_verified','dawn_disposed','dawn_farewell','dawn_complete','route_active','route_complete'];
const PACKET_PLAN={financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'};
const RELEASE_SCOPES=['selective','legal','brokers','internal','full'];
const NAME_MATCHES={BN:'Branislav Novak',IC:'Idris Celik',PS:'Petra Salonen'};
const LENA_ITEMS=['medication','keys','phone','keepsake'];
const CARRY_ITEMS=['locker_key','codebook','anton','cash','case'];
const PATTERN=['UNION','STATION','247'];
function initialState(){return {stage:'title',clues:[],suspicion:0,approach:null,answer:null,yardApproach:null,boardError:false,recordAnswer:null,mercerResponse:null,mercerTone:null,mercerAnswer:null,fireOpening:null,fireRecall:null,fireAnswer:null,deadChoice:null,deadLead:null,carried:[],escapeError:null,escapeQuestion:null,trainTone:null,pattern:[],stationError:null,phoneCode:'',phoneUnlocked:false,wifeTone:null,lenaItems:[],wifeError:null,roadAction:null,memoryFocus:null,memorySegments:0,memoryRoute:null,memoryError:null,staticApproach:null,nameMatches:{},staticSegments:0,staticError:null,houseError:null,houseFocus:null,risingMemory:0,risingError:null,archiveRecord:0,archiveError:null,releasePreview:null,releaseCommitted:false,costFocus:null,releasePlan:{},relayStep:0,copyKeyKept:false,executedRelease:null,costError:null,ashesFocus:null,ashesError:null,permitFocus:null,permitError:null,serviceFocus:null,serviceError:null,noticesFocus:null,noticesError:null,truckOrder:[],truckError:null,truckFocus:null,collectionError:null,collectionChannels:0,collectionRetried:false,blueMarks:[],blueFocus:null,blueError:null,custodianFocus:null,custodianError:null,dawnError:null,dawnFocus:null,routeVersion:2,routeNumber:1,routeStop:0,routeMistakes:0,routesCompleted:0,routeError:null,routeLoad:0,routeDepotVisits:0,routeLoadError:false,routeStreak:0,routeBestStreak:0,routeHistory:[],readerLarge:false,readerReduced:false};}
function act(state,action){
  const add=id=>({...state,clues:state.clues.includes(id)?state.clues:[...state.clues,id]});
  if(action.type==='reading_setting'&&['large','reduced'].includes(action.id)&&typeof action.value==='boolean')return {...state,[action.id==='large'?'readerLarge':'readerReduced']:action.value};
  if(action.type==='start'&&state.stage==='title')return {...state,stage:'street'};
  if(action.type==='inspect'&&state.stage==='street'&&['reflections','gait','neighbors'].includes(action.id))return add(action.id);
  if(action.type==='approach'&&state.stage==='street'&&state.clues.length){
    if(!['direct','wait'].includes(action.id))return state;
    return {...state,stage:'conversation',approach:action.id,suspicion:action.id==='direct'?1:0};
  }
  if(action.type==='office'&&state.stage==='conversation')return {...add('conversation'),stage:'office'};
  if(action.type==='inspect'&&state.stage==='office'&&['photo','report'].includes(action.id))return add(action.id);
  if(action.type==='assess'&&state.stage==='office'&&state.clues.includes('photo')&&state.clues.includes('report'))return {...state,stage:'assessment'};
  if(action.type==='conclude'&&state.stage==='assessment'){
    if(action.id==='investigate')return {...state,stage:'complete',answer:'investigate'};
    if(action.id==='certain')return {...state,answer:'uncertain'};
  }
  if(action.type==='start_yard'&&state.stage==='complete')return {...state,stage:'yard_gate'};
  if(action.type==='yard_entry'&&state.stage==='yard_gate'&&['reception','wait'].includes(action.id))return {...state,stage:'yard_board',yardApproach:action.id};
  if(action.type==='inspect'&&state.stage==='yard_board'&&action.id==='route')return add('route');
  if(action.type==='match_route'&&state.stage==='yard_board'&&state.clues.includes('route')){
    if(action.id==='cedar')return {...add('surname'),stage:'yard_records',boardError:false};
    if(['maple','briar'].includes(action.id))return {...state,boardError:true};
  }
  if(action.type==='inspect'&&state.stage==='yard_records'&&['registration','contact'].includes(action.id))return add(action.id);
  if(action.type==='record_conclusion'&&state.stage==='yard_records'&&state.clues.includes('registration')&&state.clues.includes('contact')){
    if(action.id==='local_identity')return {...state,stage:'yard_complete',recordAnswer:'local_identity'};
    if(action.id==='proof')return {...state,recordAnswer:'overreach'};
  }
  if(action.type==='start_mercer'&&state.stage==='yard_complete')return {...state,stage:'mercer_follow'};
  if(action.type==='inspect'&&state.stage==='mercer_follow'&&action.id==='van_reflection')return add('van_reflection');
  if(action.type==='follow_corner'&&state.stage==='mercer_follow'&&state.clues.includes('van_reflection'))return {...state,stage:'mercer_encounter'};
  if(action.type==='mercer_respond'&&state.stage==='mercer_encounter'&&['call','approach'].includes(action.id))return {...state,stage:'mercer_aftermath',mercerResponse:action.id};
  if(action.type==='inspect'&&state.stage==='mercer_aftermath'&&['reflex','confusion','scar'].includes(action.id))return add(action.id);
  if(action.type==='mercer_speak'&&state.stage==='mercer_aftermath'&&state.clues.includes('reflex')&&state.clues.includes('confusion')&&['listen','press'].includes(action.id))return {...state,stage:'mercer_dialogue',mercerTone:action.id};
  if(action.type==='mercer_conclude'&&state.stage==='mercer_dialogue'){
    if(action.id==='unexplained')return {...state,stage:'mercer_complete',mercerAnswer:'unexplained'};
    if(action.id==='identity')return {...state,mercerAnswer:'overreach'};
  }
  if(action.type==='start_fire'&&state.stage==='mercer_complete')return {...state,stage:'fire_return'};
  if(action.type==='fire_open'&&state.stage==='fire_return'&&['explain','name'].includes(action.id))return {...state,stage:'fire_memory',fireOpening:action.id};
  if(action.type==='fire_recall'&&state.stage==='fire_memory'&&['wait','supply'].includes(action.id))return {...add(action.id==='wait'?'fire_recall':'prompted_recall'),stage:'fire_photo',fireRecall:action.id};
  if(action.type==='inspect'&&state.stage==='fire_photo'&&['passport','family_boundary'].includes(action.id))return add(action.id);
  if(action.type==='fire_leave'&&state.stage==='fire_photo'&&state.clues.includes('passport')&&state.clues.includes('family_boundary'))return {...state,stage:'fire_watch'};
  if(action.type==='inspect'&&state.stage==='fire_watch'&&['feed_loss','maintenance'].includes(action.id))return add(action.id);
  if(action.type==='fire_conclude'&&state.stage==='fire_watch'&&state.clues.includes('feed_loss')&&state.clues.includes('maintenance')){
    if(action.id==='attention')return {...state,stage:'fire_complete',fireAnswer:'attention'};
    if(['routine','named_enemy'].includes(action.id))return {...state,fireAnswer:action.id};
  }
  if(action.type==='start_dead'&&state.stage==='fire_complete')return {...state,stage:'dead_door'};
  if(action.type==='dead_depart'&&state.stage==='dead_door'&&['one_hour','ask'].includes(action.id))return {...state,stage:'dead_bank',deadChoice:action.id};
  if(action.type==='inspect'&&state.stage==='dead_bank'&&['activation','marker'].includes(action.id)){
    if(action.id==='marker'&&!state.clues.includes('activation'))return state;
    return add(action.id);
  }
  if(action.type==='dead_open'&&state.stage==='dead_bank'&&state.clues.includes('activation')&&state.clues.includes('marker'))return {...state,stage:'dead_box'};
  if(action.type==='inspect'&&state.stage==='dead_box'&&['termination','anton','locker_key','codebook'].includes(action.id))return add(action.id);
  if(action.type==='dead_lead'&&state.stage==='dead_box'&&['termination','anton','locker_key','codebook'].every(id=>state.clues.includes(id))){
    if(action.id==='station')return {...state,stage:'dead_complete',deadLead:'station'};
    if(['decode','home'].includes(action.id))return {...state,deadLead:action.id};
  }
  if(action.type==='start_escape'&&state.stage==='dead_complete')return {...add('bell_attack'),stage:'escape_pack'};
  if(action.type==='toggle_carry'&&state.stage==='escape_pack'&&CARRY_ITEMS.includes(action.id)){
    if(state.carried.includes(action.id))return {...state,carried:state.carried.filter(id=>id!==action.id),escapeError:null};
    if(state.carried.length>=3)return {...state,escapeError:'capacity'};
    return {...state,carried:[...state.carried,action.id],escapeError:null};
  }
  if(action.type==='escape_leave'&&state.stage==='escape_pack'){
    if(!['locker_key','codebook','anton'].every(id=>state.carried.includes(id)))return {...state,escapeError:'essentials'};
    return {...state,stage:'escape_service',escapeError:null};
  }
  if(action.type==='escape_route'&&state.stage==='escape_service'){
    if(action.id==='airflow')return {...state,stage:'escape_keane',escapeError:null};
    if(action.id==='lift')return {...state,escapeError:'lift'};
  }
  if(action.type==='escape_question'&&state.stage==='escape_keane'&&['rourke','memory'].includes(action.id))return {...add('keane_claim'),escapeQuestion:action.id};
  if(action.type==='escape_to_train'&&state.stage==='escape_keane'&&state.escapeQuestion)return {...state,stage:'escape_train'};
  if(action.type==='train_tone'&&state.stage==='escape_train'&&['ask','space'].includes(action.id))return {...add('mara_partner'),trainTone:action.id};
  if(action.type==='pattern_pick'&&state.stage==='escape_train'&&state.trainTone&&PATTERN.includes(action.id)&&!state.pattern.includes(action.id)&&state.pattern.length<3)return {...state,pattern:[...state.pattern,action.id],escapeError:null};
  if(action.type==='pattern_reset'&&state.stage==='escape_train')return {...state,pattern:[],escapeError:null};
  if(action.type==='pattern_confirm'&&state.stage==='escape_train'&&state.trainTone&&state.pattern.length===3){
    if(state.pattern.join(' ')===PATTERN.join(' '))return {...add('station_pattern'),stage:'escape_complete',escapeError:null};
    return {...state,escapeError:'pattern'};
  }
  if(action.type==='start_station'&&state.stage==='escape_complete')return {...state,stage:'station_arrival'};
  if(action.type==='inspect'&&state.stage==='station_arrival'&&action.id==='station_watchers')return add(action.id);
  if(action.type==='station_route'&&state.stage==='station_arrival'&&state.clues.includes('station_watchers')){
    if(action.id==='employee')return {...state,stage:'station_locker',stationError:null};
    if(action.id==='public')return {...state,stationError:'public'};
  }
  if(action.type==='station_open'&&state.stage==='station_locker'){
    if(action.id!==247&&[243,249].includes(action.id))return {...state,stationError:'number'};
    if(action.id===247){
      if(!state.carried.includes('locker_key'))return {...state,stationError:'key'};
      return {...add('harbor_label'),stage:'station_phone',stationError:null};
    }
  }
  if(state.stage==='station_phone'&&!state.phoneUnlocked){
    if(action.type==='phone_digit'&&typeof action.id==='string'&&/^\d$/.test(action.id)&&state.phoneCode.length<4)return {...state,phoneCode:state.phoneCode+action.id,stationError:null};
    if(action.type==='phone_clear')return {...state,phoneCode:'',stationError:null};
    if(action.type==='phone_recall')return {...state,phoneCode:'2471',stationError:null};
    if(action.type==='phone_unlock'&&state.phoneCode.length===4){
      if(state.phoneCode==='2471')return {...add('phone_draft'),phoneUnlocked:true,stationError:null};
      return {...state,stationError:'phone'};
    }
  }
  if(action.type==='station_reach_room'&&state.stage==='station_phone'&&state.phoneUnlocked)return {...state,stage:'station_files'};
  if(action.type==='inspect'&&state.stage==='station_files'&&['read_first','harbor_ledger','harbor_audio','harbor_accounts'].includes(action.id)){
    if(action.id!=='read_first'&&!state.clues.includes('read_first'))return state;
    return add(action.id);
  }
  if(action.type==='station_priority'&&state.stage==='station_files'&&['read_first','harbor_ledger','harbor_audio','harbor_accounts'].every(id=>state.clues.includes(id))){
    if(action.id==='lena')return {...state,stage:'station_complete',stationError:null};
    if(action.id==='channels')return {...state,stationError:'channels'};
  }
  if(action.type==='start_wife'&&state.stage==='station_complete')return {...state,stage:'wife_arrival'};
  if(action.type==='inspect'&&state.stage==='wife_arrival'&&action.id==='hanover_watch')return add(action.id);
  if(action.type==='wife_enter'&&state.stage==='wife_arrival'&&state.clues.includes('hanover_watch'))return {...state,stage:'wife_kitchen'};
  if(action.type==='wife_talk'&&state.stage==='wife_kitchen'&&['explain','apologize'].includes(action.id))return {...add('lena_account'),stage:'wife_prepare',wifeTone:action.id};
  if(action.type==='inspect'&&state.stage==='wife_prepare'&&action.id==='ultimatum')return add(action.id);
  if(action.type==='lena_item'&&state.stage==='wife_prepare'&&LENA_ITEMS.includes(action.id))return {...state,lenaItems:state.lenaItems.includes(action.id)?state.lenaItems.filter(id=>id!==action.id):[...state.lenaItems,action.id],wifeError:null};
  if(action.type==='wife_depart'&&state.stage==='wife_prepare'){
    if(!['medication','keys','phone'].every(id=>state.lenaItems.includes(id))||!state.clues.includes('ultimatum'))return {...state,wifeError:'prepare'};
    return {...state,stage:'wife_road',wifeError:null};
  }
  if(action.type==='inspect'&&state.stage==='wife_road'&&action.id==='false_stop')return add(action.id);
  if(action.type==='wife_respond'&&state.stage==='wife_road'&&state.clues.includes('false_stop')&&['call','ask'].includes(action.id))return {...add('lena_taken'),stage:'wife_complete',roadAction:action.id};
  if(action.type==='start_memory'&&state.stage==='wife_complete')return {...state,stage:'memory_standoff'};
  if(action.type==='memory_question'&&state.stage==='memory_standoff'&&['lena','purpose'].includes(action.id))return {...state,stage:'memory_archive',memoryFocus:action.id};
  if(action.type==='inspect'&&state.stage==='memory_archive'&&['med_order','transfer_audio'].includes(action.id))return add(action.id);
  if(action.type==='memory_clinic'&&state.stage==='memory_archive'&&state.clues.includes('med_order')&&state.clues.includes('transfer_audio'))return {...state,stage:'memory_hale'};
  if(action.type==='inspect'&&state.stage==='memory_hale'&&['hale_injury','hale_choice'].includes(action.id))return add(action.id);
  if(action.type==='memory_recording'&&state.stage==='memory_hale'&&state.clues.includes('hale_injury')&&state.clues.includes('hale_choice'))return {...state,stage:'memory_tape'};
  if(action.type==='memory_excerpt'&&state.stage==='memory_tape'&&state.memorySegments<4){
    const next=state.memorySegments+1;
    return {...state,memorySegments:next,clues:next===4?[...new Set([...state.clues,'session12','carrier_phrase'])]:state.clues};
  }
  if(action.type==='memory_pursuit'&&state.stage==='memory_tape'&&state.memorySegments===4)return {...state,stage:'memory_escape'};
  if(action.type==='memory_route'&&state.stage==='memory_escape'){
    if(action.id==='flooded')return {...add('anchor_claim'),stage:'memory_case',memoryRoute:'flooded',memoryError:null};
    if(action.id==='dock')return {...state,memoryError:'dock'};
  }
  if(action.type==='inspect'&&state.stage==='memory_case'&&['spousal_vector','contact_photo'].includes(action.id))return add(action.id);
  if(action.type==='memory_inference'&&state.stage==='memory_case'&&state.clues.includes('spousal_vector')&&state.clues.includes('contact_photo')){
    if(action.id==='observed')return {...state,stage:'memory_complete',memoryError:null};
    if(action.id==='complicit')return {...state,memoryError:'complicit'};
  }
  if(action.type==='start_static'&&state.stage==='memory_complete')return {...state,stage:'static_arrival'};
  if(action.type==='static_hand_over'&&state.stage==='static_arrival'&&['entrust','limits'].includes(action.id))return {...state,stage:'static_cards',staticApproach:action.id};
  if(action.type==='static_interpret'&&state.stage==='static_cards'){
    if(action.id==='frequencies')return {...add('frequency_groups'),staticError:null};
    if(action.id==='dates')return {...state,staticError:'dates'};
  }
  if(action.type==='static_match'&&state.stage==='static_cards'&&state.clues.includes('frequency_groups')&&Object.hasOwn(NAME_MATCHES,action.initials)&&Object.values(NAME_MATCHES).includes(action.id)){
    if(NAME_MATCHES[action.initials]===action.id)return {...state,nameMatches:{...state.nameMatches,[action.initials]:action.id},staticError:null};
    return {...state,staticError:'match'};
  }
  if(action.type==='static_listen'&&state.stage==='static_cards'&&Object.entries(NAME_MATCHES).every(([key,name])=>state.nameMatches[key]===name))return {...add('cleanup_chain'),stage:'static_tape'};
  if(action.type==='static_excerpt'&&state.stage==='static_tape'&&state.staticSegments<4){
    const next=state.staticSegments+1;
    return {...state,staticSegments:next,clues:next===4?[...new Set([...state.clues,'spousal_content','toby_risk'])]:state.clues};
  }
  if(action.type==='static_axis'&&state.stage==='static_tape'&&state.staticSegments===4)return {...state,stage:'static_axis'};
  if(action.type==='inspect'&&state.stage==='static_axis'&&action.id==='ash_ledger')return add(action.id);
  if(action.type==='static_receiver'&&state.stage==='static_axis'&&state.clues.includes('ash_ledger'))return {...state,stage:'static_receiver'};
  if(action.type==='inspect'&&state.stage==='static_receiver'&&['millbrook_lead','loop_signal','dependent_demand'].includes(action.id)){
    if(action.id==='dependent_demand'&&(!state.clues.includes('millbrook_lead')||!state.clues.includes('loop_signal')))return state;
    return add(action.id);
  }
  if(action.type==='static_inference'&&state.stage==='static_receiver'&&['millbrook_lead','loop_signal','dependent_demand'].every(id=>state.clues.includes(id))){
    if(action.id==='unconfirmed')return {...state,stage:'static_complete',staticError:null};
    if(action.id==='both_captive')return {...state,staticError:'custody'};
  }
  if(action.type==='start_house'&&state.stage==='static_complete')return {...state,stage:'house_perimeter'};
  if(action.type==='inspect'&&state.stage==='house_perimeter'&&['curved_estate','rourke_arrival'].includes(action.id))return add(action.id);
  if(action.type==='house_enter'&&state.stage==='house_perimeter'&&state.clues.includes('curved_estate')&&state.clues.includes('rourke_arrival'))return {...state,stage:'house_monitor'};
  if(action.type==='inspect'&&state.stage==='house_monitor'&&['holding_feed','east_report'].includes(action.id))return add(action.id);
  if(action.type==='house_room'&&state.stage==='house_monitor'&&state.clues.includes('holding_feed')&&state.clues.includes('east_report')){
    if(action.id==='B-12')return {...state,stage:'house_lena',houseError:null};
    if(['B-10','RECORDS'].includes(action.id))return {...state,houseError:'room'};
  }
  if(action.type==='inspect'&&state.stage==='house_lena'&&['lena_brother','legal_pad'].includes(action.id))return add(action.id);
  if(action.type==='house_plan'&&state.stage==='house_lena'&&state.clues.includes('lena_brother')&&state.clues.includes('legal_pad')){
    if(action.id==='proof')return {...state,stage:'house_records',houseError:null};
    if(action.id==='leave')return {...state,houseError:'agency'};
  }
  if(action.type==='inspect'&&state.stage==='house_records'&&['estate_ledger','marrow_memo'].includes(action.id))return add(action.id);
  if(action.type==='house_review'&&state.stage==='house_records'&&state.clues.includes('estate_ledger')&&state.clues.includes('marrow_memo'))return {...state,stage:'house_confront'};
  if(action.type==='house_respond'&&state.stage==='house_confront'&&['protect','signature'].includes(action.id))return {...state,stage:'house_complete',houseFocus:action.id};
  if(action.type==='start_rising'&&state.stage==='house_complete')return {...state,stage:'rising_records'};
  if(action.type==='inspect'&&state.stage==='rising_records'&&action.id==='drive_retained')return add(action.id);
  if(action.type==='rising_exit'&&state.stage==='rising_records'&&state.clues.includes('drive_retained')){
    if(action.id==='east')return {...state,stage:'rising_drain',risingError:null};
    if(action.id==='rourke')return {...state,risingError:'pursue'};
  }
  if(action.type==='inspect'&&state.stage==='rising_drain'&&action.id==='van_impact')return add(action.id);
  if(action.type==='rising_outflow'&&state.stage==='rising_drain'&&state.clues.includes('van_impact')){
    if(action.id==='through')return {...add('jonas_returns'),stage:'rising_ledger',risingError:null};
    if(action.id==='up')return {...state,risingError:'road'};
  }
  if(action.type==='inspect'&&state.stage==='rising_ledger'&&['routing_marks','market_fragment'].includes(action.id))return add(action.id);
  if(action.type==='rising_interpret'&&state.stage==='rising_ledger'&&state.clues.includes('routing_marks')&&state.clues.includes('market_fragment')){
    if(action.id==='shell')return {...state,stage:'rising_recall',risingError:null};
    if(action.id==='whole')return {...state,risingError:'archive'};
  }
  if(action.type==='rising_fragment'&&state.stage==='rising_recall'&&state.risingMemory<3){
    const next=state.risingMemory+1;
    return {...state,risingMemory:next,clues:next===3?[...new Set([...state.clues,'kars_return','split_access'])]:state.clues};
  }
  if(action.type==='rising_to_yard'&&state.stage==='rising_recall'&&state.risingMemory===3)return {...state,stage:'rising_yard'};
  if(action.type==='inspect'&&state.stage==='rising_yard'&&action.id==='offshore_lead')return add(action.id);
  if(action.type==='rising_commit'&&state.stage==='rising_yard'&&state.clues.includes('offshore_lead')){
    if(action.id==='test')return {...state,stage:'rising_complete',risingError:null};
    if(action.id==='proven')return {...state,risingError:'certainty'};
  }
  if(action.type==='start_archive'&&state.stage==='rising_complete')return {...state,stage:'archive_approach'};
  if(action.type==='archive_travel'&&state.stage==='archive_approach'){
    if(action.id==='transfer')return {...state,stage:'archive_door',archiveError:null};
    if(action.id==='public')return {...state,archiveError:'gate'};
  }
  if(action.type==='inspect'&&state.stage==='archive_door'&&['hale_platform','scar_variance'].includes(action.id))return add(action.id);
  if(action.type==='archive_exception'&&state.stage==='archive_door'&&state.clues.includes('hale_platform')&&state.clues.includes('scar_variance'))return {...state,stage:'archive_record'};
  if(action.type==='archive_response'&&state.stage==='archive_record'&&state.archiveRecord<6){
    const next=state.archiveRecord+1;
    return {...state,archiveRecord:next,clues:next===6?[...new Set([...state.clues,'cognitive_record'])]:state.clues};
  }
  if(action.type==='archive_enter'&&state.stage==='archive_record'&&state.archiveRecord===6)return {...state,stage:'archive_files'};
  if(action.type==='inspect'&&state.stage==='archive_files'&&['integrity_check','north_span','release_recipients'].includes(action.id))return add(action.id);
  if(action.type==='archive_options'&&state.stage==='archive_files'&&['integrity_check','north_span','release_recipients'].every(id=>state.clues.includes(id)))return {...state,stage:'archive_release'};
  if(action.type==='archive_preview'&&state.stage==='archive_release'&&RELEASE_SCOPES.includes(action.id))return {...state,releasePreview:action.id};
  if(action.type==='archive_prepare'&&state.stage==='archive_release'&&RELEASE_SCOPES.includes(state.releasePreview))return {...add('outer_room'),stage:'archive_complete',releaseCommitted:false};

  if(action.type==='start_cost'&&state.stage==='archive_complete')return {...state,stage:'cost_lockdown'};
  if(action.type==='inspect'&&state.stage==='cost_lockdown'&&['remote_lockdown','reserve_branch'].includes(action.id))return add(action.id);
  if(action.type==='cost_explain'&&state.stage==='cost_lockdown'&&['remote_lockdown','reserve_branch'].every(id=>state.clues.includes(id)))return {...state,stage:'cost_family'};
  if(action.type==='cost_recall'&&state.stage==='cost_family'&&['inhaler','coat'].includes(action.id))return {...add('toby_account'),costFocus:action.id,stage:'cost_plan'};
  if(action.type==='cost_assign'&&state.stage==='cost_plan'&&Object.hasOwn(PACKET_PLAN,action.id)&&Object.values(PACKET_PLAN).includes(action.recipient)){
    if(PACKET_PLAN[action.id]!==action.recipient)return {...state,costError:'plan'};
    return {...state,releasePlan:{...state.releasePlan,[action.id]:action.recipient},costError:null};
  }
  if(action.type==='cost_start_queue'&&state.stage==='cost_plan'&&Object.entries(PACKET_PLAN).every(([k,v])=>state.releasePlan[k]===v))return {...add('curated_packets'),stage:'cost_queue',relayStep:1};
  if(action.type==='cost_retry'&&state.stage==='cost_queue'&&state.relayStep===1)return {...add('initial_receipts'),relayStep:2,releaseCommitted:true,executedRelease:'curated'};
  if(action.type==='cost_copy'&&state.stage==='cost_queue'&&state.relayStep===2)return {...state,stage:'cost_copykey'};
  if(action.type==='inspect'&&state.stage==='cost_copykey'&&action.id==='copy_key')return add(action.id);
  if(action.type==='cost_keep_key'&&state.stage==='cost_copykey'&&state.clues.includes('copy_key'))return {...state,stage:'cost_departure',copyKeyKept:true};
  if(action.type==='cost_cover'&&state.stage==='cost_departure'&&state.copyKeyKept)return {...add('cascade_accepted'),stage:'cost_holdout',relayStep:3};
  if(action.type==='cost_receipt'&&state.stage==='cost_holdout'&&state.relayStep===3)return {...add('export_status'),relayStep:4};
  if(action.type==='cost_finish'&&state.stage==='cost_holdout'&&state.relayStep===4)return {...state,stage:'cost_complete'};

  if(action.type==='start_ashes'&&state.stage==='cost_complete')return {...state,stage:'ashes_cradle'};
  if(action.type==='ashes_lower'&&state.stage==='ashes_cradle')return {...add('cradle_return'),stage:'ashes_harbor'};
  if(action.type==='inspect'&&state.stage==='ashes_harbor'&&action.id==='harbor_recovery')return add(action.id);
  if(action.type==='ashes_leave'&&state.stage==='ashes_harbor'&&state.clues.includes('harbor_recovery'))return {...state,stage:'ashes_aftermath'};
  if(action.type==='inspect'&&state.stage==='ashes_aftermath'&&action.id==='public_aftermath')return add(action.id);
  if(action.type==='ashes_visit'&&state.stage==='ashes_aftermath'&&state.clues.includes('public_aftermath'))return {...add('family_reunion'),stage:'ashes_family'};
  if(action.type==='ashes_respect'&&state.stage==='ashes_family'&&['listen','space'].includes(action.id))return {...state,ashesFocus:action.id,stage:'ashes_cedar'};
  if(action.type==='inspect'&&state.stage==='ashes_cedar'&&action.id==='cedar_return')return add(action.id);
  if(action.type==='ashes_docket'&&state.stage==='ashes_cedar'&&state.clues.includes('cedar_return'))return {...add('continuing_cases'),stage:'ashes_pattern'};
  if(action.type==='ashes_autumn'&&state.stage==='ashes_pattern')return {...state,stage:'ashes_van'};
  if(action.type==='inspect'&&state.stage==='ashes_van'&&action.id==='crooked_permit')return add(action.id);
  if(action.type==='ashes_assess'&&state.stage==='ashes_van'&&state.clues.includes('crooked_permit')){
    if(action.id==='temporary')return {...state,stage:'ashes_complete',ashesError:null};
    if(action.id==='safe')return {...state,ashesError:'certainty'};
  }

  if(action.type==='start_permit'&&state.stage==='ashes_complete')return {...state,stage:'permit_route'};
  if(action.type==='inspect'&&state.stage==='permit_route'&&action.id==='van_loop')return add(action.id);
  if(action.type==='permit_wait'&&state.stage==='permit_route'&&state.clues.includes('van_loop'))return {...state,stage:'permit_briefing'};
  if(action.type==='inspect'&&state.stage==='permit_briefing'&&['delmore_permit','service_credential'].includes(action.id))return add(action.id);
  if(action.type==='permit_compare'&&state.stage==='permit_briefing'&&['delmore_permit','service_credential'].every(id=>state.clues.includes(id)))return {...add('domestic_fragment'),stage:'permit_domestic'};
  if(action.type==='permit_infer'&&state.stage==='permit_domestic'){
    if(action.id==='lead')return {...state,stage:'permit_home',permitError:null};
    if(action.id==='identity')return {...state,permitError:'identity'};
  }
  if(action.type==='permit_talk'&&state.stage==='permit_home'&&['van','copies'].includes(action.id))return {...state,stage:'permit_box',permitFocus:action.id};
  if(action.type==='inspect'&&state.stage==='permit_box'&&action.id==='paul_box')return add(action.id);
  if(action.type==='permit_open_last'&&state.stage==='permit_box'&&state.clues.includes('paul_box'))return {...add('last_envelope'),stage:'permit_last'};
  if(action.type==='permit_listen'&&state.stage==='permit_last')return {...add('waiting_engine'),stage:'permit_complete'};

  if(action.type==='start_service'&&state.stage==='permit_complete')return {...state,stage:'service_house'};
  if(action.type==='inspect'&&state.stage==='service_house'&&action.id==='sedan_watch')return add(action.id);
  if(action.type==='service_carol'&&state.stage==='service_house'&&state.clues.includes('sedan_watch'))return {...state,stage:'service_carol'};
  if(action.type==='inspect'&&state.stage==='service_carol'&&action.id==='clinic_claim')return add(action.id);
  if(action.type==='service_depart'&&state.stage==='service_carol'&&state.clues.includes('clinic_claim')&&['timing','key'].includes(action.id))return {...state,stage:'service_relay',serviceFocus:action.id};
  if(action.type==='inspect'&&state.stage==='service_relay'&&action.id==='relay_tin')return add(action.id);
  if(action.type==='service_listen'&&state.stage==='service_relay'&&state.clues.includes('relay_tin'))return {...add('storage_call'),stage:'service_radio'};
  if(action.type==='service_storage'&&state.stage==='service_radio')return {...state,stage:'service_storage'};
  if(action.type==='inspect'&&state.stage==='service_storage'&&action.id==='survivability_sets')return add(action.id);
  if(action.type==='service_bundle'&&state.stage==='service_storage'&&state.clues.includes('survivability_sets'))return {...add('witness_sleeve'),stage:'service_bundle'};
  if(action.type==='service_leave'&&state.stage==='service_bundle')return {...state,stage:'service_escape'};
  if(action.type==='service_shelter'&&state.stage==='service_escape')return {...add('storage_escape'),stage:'service_warning'};
  if(action.type==='service_assess'&&state.stage==='service_warning'){
    if(action.id==='uncertain')return {...add('keane_warning'),stage:'service_complete',serviceError:null};
    if(action.id==='ally')return {...state,serviceError:'trust'};
  }

  if(action.type==='start_notices'&&state.stage==='service_complete')return {...state,stage:'notices_machine'};
  if(action.type==='notices_read'&&state.stage==='notices_machine')return {...add('jonas_machine'),stage:'notices_files'};
  if(action.type==='inspect'&&state.stage==='notices_files'&&['paul_crosswalk','paul_audio','architect_claim'].includes(action.id))return add(action.id);
  if(action.type==='notices_call'&&state.stage==='notices_files'&&['paul_crosswalk','paul_audio','architect_claim'].every(id=>state.clues.includes(id)))return {...state,stage:'notices_call'};
  if(action.type==='notices_arrange'&&state.stage==='notices_call')return {...state,stage:'notices_lena'};
  if(action.type==='notices_hear'&&state.stage==='notices_lena'&&['truth','agency'].includes(action.id))return {...add('weigh_agreement'),stage:'notices_meeting',noticesFocus:action.id};
  if(action.type==='inspect'&&state.stage==='notices_meeting'&&action.id==='keane_account')return add(action.id);
  if(action.type==='notices_assess'&&state.stage==='notices_meeting'&&state.clues.includes('keane_account')){
    if(action.id==='claim')return {...state,stage:'notices_card',noticesError:null};
    if(action.id==='safe')return {...state,noticesError:'safety'};
  }
  if(action.type==='notices_cover'&&state.stage==='notices_card')return {...add('route_card'),stage:'notices_attack'};
  if(action.type==='notices_trench'&&state.stage==='notices_attack')return {...add('weigh_attack'),stage:'notices_complete'};

  if(action.type==='start_truck'&&state.stage==='notices_complete')return {...state,stage:'truck_trench'};
  if(action.type==='truck_leave'&&state.stage==='truck_trench')return {...add('keane_returns'),stage:'truck_mirror'};
  if(action.type==='inspect'&&state.stage==='truck_mirror'&&action.id==='records_mirror')return add(action.id);
  if(action.type==='truck_compare'&&state.stage==='truck_mirror'&&state.clues.includes('records_mirror'))return {...state,stage:'truck_records'};
  if(action.type==='inspect'&&state.stage==='truck_records'&&action.id==='mirror_node')return add(action.id);
  if(action.type==='truck_rehearse'&&state.stage==='truck_records'&&state.clues.includes('mirror_node'))return {...state,stage:'truck_order'};
  if(action.type==='truck_order'&&state.stage==='truck_order'&&['disposal','route','witness'].includes(action.id)&&state.truckOrder.length<3){
    if(action.id!==['disposal','route','witness'][state.truckOrder.length])return {...state,truckError:'order'};
    return {...state,truckOrder:[...state.truckOrder,action.id],truckError:null};
  }
  if(action.type==='truck_plan'&&state.stage==='truck_order'&&state.truckOrder.length===3)return {...add('lena_sequence'),stage:'truck_plan'};
  if(action.type==='truck_shift'&&state.stage==='truck_plan'&&['workers','paper'].includes(action.id))return {...add('disposal_challenge'),stage:'truck_yard',truckFocus:action.id};
  if(action.type==='truck_login'&&state.stage==='truck_yard')return {...state,stage:'truck_index'};
  if(action.type==='inspect'&&state.stage==='truck_index'&&action.id==='black_file_index')return add(action.id);
  if(action.type==='truck_breach'&&state.stage==='truck_index'&&state.clues.includes('black_file_index'))return {...state,stage:'truck_breach'};
  if(action.type==='truck_handshake'&&state.stage==='truck_breach')return {...add('courier_handshake'),stage:'truck_complete'};

  if(action.type==='start_collection'&&state.stage==='truck_complete')return {...state,stage:'collection_intent'};
  if(action.type==='collection_intent'&&state.stage==='collection_intent'&&['audit','public','disposal'].includes(action.id)){
    if(action.id==='audit')return {...add('audit_intent'),stage:'collection_clean',collectionError:null};
    return {...state,collectionError:'intent'};
  }
  if(action.type==='collection_clean'&&state.stage==='collection_clean'&&['retain','drop'].includes(action.id)){
    if(action.id==='retain')return {...add('substitute_chain'),clues:[...new Set([...state.clues,'substitute_chain','cleaned_marker'])],stage:'collection_send',collectionError:null};
    return {...state,collectionError:'custody'};
  }
  if(action.type==='collection_channel'&&state.stage==='collection_send'&&state.collectionChannels<8)return {...state,collectionChannels:state.collectionChannels+1};
  if(action.type==='collection_retry'&&state.stage==='collection_send'&&state.collectionChannels===8&&!state.collectionRetried)return {...add('reserve_receipts'),collectionChannels:9,collectionRetried:true};
  if(action.type==='collection_node'&&state.stage==='collection_send'&&state.collectionChannels===9)return {...state,stage:'collection_node'};
  if(action.type==='collection_leave'&&state.stage==='collection_node')return {...add('local_node'),stage:'collection_escape'};
  if(action.type==='collection_aftermath'&&state.stage==='collection_escape')return {...add('keane_absent'),stage:'collection_aftermath'};
  if(action.type==='inspect'&&state.stage==='collection_aftermath'&&action.id==='family_shield')return add(action.id);
  if(action.type==='collection_home'&&state.stage==='collection_aftermath'&&state.clues.includes('family_shield'))return {...state,stage:'collection_home'};
  if(action.type==='collection_sign'&&state.stage==='collection_home')return {...add('field_trip'),stage:'collection_complete'};

  if(action.type==='start_blue'&&state.stage==='collection_complete')return {...state,stage:'blue_sighting'};
  if(action.type==='blue_compare'&&state.stage==='blue_sighting')return {...state,stage:'blue_compare'};
  if(action.type==='blue_mark'&&state.stage==='blue_compare'&&['wheel','hinge','crescent'].includes(action.id)&&!state.blueMarks.includes(action.id))return {...state,blueMarks:[...state.blueMarks,action.id]};
  if(action.type==='blue_home'&&state.stage==='blue_compare'&&state.blueMarks.length===3)return {...add('blue_cart'),stage:'blue_home'};
  if(action.type==='blue_mara'&&state.stage==='blue_home'&&['pattern','lena'].includes(action.id))return {...add('blue_addresses'),stage:'blue_tickets',blueFocus:action.id};
  if(action.type==='inspect'&&state.stage==='blue_tickets'&&['retrieval_tickets','sarto_login'].includes(action.id))return add(action.id);
  if(action.type==='blue_recovery'&&state.stage==='blue_tickets'&&['retrieval_tickets','sarto_login'].every(id=>state.clues.includes(id)))return {...state,stage:'blue_recovery'};
  if(action.type==='blue_note'&&state.stage==='blue_recovery')return {...add('route_bundle'),stage:'blue_note'};
  if(action.type==='inspect'&&state.stage==='blue_note'&&action.id==='blue_note')return add(action.id);
  if(action.type==='blue_module'&&state.stage==='blue_note'&&state.clues.includes('blue_note'))return {...add('dark_indicator'),stage:'blue_module'};
  if(action.type==='blue_assess'&&state.stage==='blue_module'){
    if(action.id==='untested')return {...add('blue_departure'),stage:'blue_complete',blueError:null};
    if(action.id==='safe')return {...state,blueError:'indicator'};
  }

  if(action.type==='start_custodian'&&state.stage==='blue_complete')return {...state,stage:'custodian_board'};
  if(action.type==='inspect'&&state.stage==='custodian_board'&&['sarto_notice','quill_assignment'].includes(action.id))return add(action.id);
  if(action.type==='custodian_trace'&&state.stage==='custodian_board'&&['sarto_notice','quill_assignment'].every(id=>state.clues.includes(id)))return {...add('quill_trace'),stage:'custodian_trace'};
  if(action.type==='custodian_garland'&&state.stage==='custodian_trace')return {...state,stage:'custodian_office'};
  if(action.type==='custodian_hear'&&state.stage==='custodian_office')return {...add('quill_offer'),stage:'custodian_offer'};
  if(action.type==='custodian_assess'&&state.stage==='custodian_offer'){
    if(action.id==='testimony')return {...state,stage:'custodian_review',custodianError:null};
    if(action.id==='disarmed')return {...state,custodianError:'trade'};
  }
  if(action.type==='custodian_review'&&state.stage==='custodian_review')return {...add('held_node'),stage:'custodian_log'};
  if(action.type==='custodian_log'&&state.stage==='custodian_log'&&['bridges','sightings'].includes(action.id))return {...add('intervention_log'),custodianFocus:action.id,stage:'custodian_carrier'};
  if(action.type==='inspect'&&state.stage==='custodian_carrier'&&action.id==='physical_carrier')return add(action.id);
  if(action.type==='custodian_depart'&&state.stage==='custodian_carrier'&&state.clues.includes('physical_carrier'))return {...add('hanover_secondary'),stage:'custodian_complete'};

  if(action.type==='start_dawn'&&state.stage==='custodian_complete')return {...state,stage:'dawn_route'};
  if(action.type==='dawn_collect'&&state.stage==='dawn_route')return {...add('dawn_collection'),stage:'dawn_collected'};
  if(action.type==='dawn_assess'&&state.stage==='dawn_collected'){
    if(action.id==='incomplete')return {...add('dawn_chain'),stage:'dawn_verified',dawnError:null};
    if(action.id==='finished')return {...state,dawnError:'collection'};
  }
  if(action.type==='dawn_dispose'&&state.stage==='dawn_verified')return {...add('dawn_disposal'),stage:'dawn_disposed'};
  if(action.type==='dawn_farewell'&&state.stage==='dawn_disposed')return {...add('mara_departure'),stage:'dawn_farewell'};
  if(action.type==='dawn_return'&&state.stage==='dawn_farewell'&&['notice','route'].includes(action.id))return {...add('route_ending'),stage:'dawn_complete',dawnFocus:action.id};

  if(action.type==='start_routes'&&state.stage==='dawn_complete')return {...state,stage:'route_active'};
  if(action.type==='route_decide'&&state.stage==='route_active'&&ANSWERS.some(([id])=>id===action.id)){
    const route=getRoute(state.routeNumber,state.routeVersion),stop=route.stops[state.routeStop];
    if(!stop)return state;
    if(action.id!==stop.answer)return {...state,routeError:stop.id,routeMistakes:state.routeError?state.routeMistakes:Math.min(999,state.routeMistakes+1)};
    const added=pickupLoad(action.id,stop);
    if(state.routeLoad+added>TRUCK_CAPACITY)return {...state,routeLoadError:true};
    const next=state.routeStop+1,routeLoad=state.routeLoad+added;
    const result={...state,routeStop:next,routeError:null,routeLoad,routeLoadError:false,stage:next===route.stops.length?'route_complete':'route_active'};
    return next===route.stops.length&&routeLoad===0?finishShift(result):result;
  }
  if(action.type==='route_unload'&&['route_active','route_complete'].includes(state.stage)&&state.routeLoad>0){
    const result={...state,routeLoad:0,routeLoadError:false,routeDepotVisits:Math.min(999,state.routeDepotVisits+1)};
    return state.stage==='route_complete'?finishShift(result):result;
  }
  if(action.type==='route_next'&&state.stage==='route_complete'&&state.routeLoad===0)return {...state,stage:'route_active',routeVersion:2,routeNumber:state.routeNumber===Number.MAX_SAFE_INTEGER?1:state.routeNumber+1,routeStop:0,routeMistakes:0,routeError:null,routeLoad:0,routeDepotVisits:0,routeLoadError:false};
  return state;
}
function restore(raw){
  const empty=initialState();
  if(!raw||!STAGES.includes(raw.stage))return empty;
  const releasePlan=Object.fromEntries(Object.entries(PACKET_PLAN).filter(([k,v])=>raw.releasePlan&&Object.hasOwn(raw.releasePlan,k)&&raw.releasePlan[k]===v));
  const relayStep=Number.isInteger(raw.relayStep)&&raw.relayStep>=0&&raw.relayStep<=4?raw.relayStep:0;
  const committed=(raw.stage.startsWith('cost_')||raw.stage.startsWith('ashes_')||raw.stage.startsWith('permit_')||raw.stage.startsWith('service_')||raw.stage.startsWith('notices_')||raw.stage.startsWith('truck_')||raw.stage.startsWith('collection_')||raw.stage.startsWith('blue_')||raw.stage.startsWith('custodian_')||raw.stage.startsWith('dawn_')||raw.stage.startsWith('route_'))&&Object.keys(releasePlan).length===4&&relayStep>=2&&Array.isArray(raw.clues)&&raw.clues.includes('initial_receipts');
  const truckOrder=[];
  for(const id of (Array.isArray(raw.truckOrder)?raw.truckOrder:[])){if(id!==['disposal','route','witness'][truckOrder.length]||truckOrder.length===3)break;truckOrder.push(id);}
  const collectionChannels=Number.isInteger(raw.collectionChannels)&&raw.collectionChannels>=0&&raw.collectionChannels<=9?raw.collectionChannels:0;
  const routeNumber=Number.isSafeInteger(raw.routeNumber)&&raw.routeNumber>0?raw.routeNumber:1;
  const routeVersion=raw.routeVersion===2?2:1;
  const routeLength=getRoute(routeNumber,routeVersion).stops.length;
  const routeStop=raw.stage==='route_complete'?routeLength:Number.isInteger(raw.routeStop)&&raw.routeStop>=0&&raw.routeStop<routeLength?raw.routeStop:0;
  const routeLoad=Number.isInteger(raw.routeLoad)&&raw.routeLoad>=0&&raw.routeLoad<=TRUCK_CAPACITY?raw.routeLoad:0;
  return {...empty,...restoreCareer(raw),readerLarge:raw.readerLarge===true,readerReduced:raw.readerReduced===true,stage:raw.stage,clues:[...new Set((Array.isArray(raw.clues)?raw.clues:[]).filter(id=>Object.hasOwn(CLUES,id)))],approach:['direct','wait'].includes(raw.approach)?raw.approach:null,suspicion:raw.approach==='direct'?1:0,answer:['investigate','uncertain'].includes(raw.answer)?raw.answer:null,yardApproach:['reception','wait'].includes(raw.yardApproach)?raw.yardApproach:null,boardError:raw.boardError===true,recordAnswer:['local_identity','overreach'].includes(raw.recordAnswer)?raw.recordAnswer:null,mercerResponse:['call','approach'].includes(raw.mercerResponse)?raw.mercerResponse:null,mercerTone:['listen','press'].includes(raw.mercerTone)?raw.mercerTone:null,mercerAnswer:['unexplained','overreach'].includes(raw.mercerAnswer)?raw.mercerAnswer:null,fireOpening:['explain','name'].includes(raw.fireOpening)?raw.fireOpening:null,fireRecall:['wait','supply'].includes(raw.fireRecall)?raw.fireRecall:null,fireAnswer:['attention','routine','named_enemy'].includes(raw.fireAnswer)?raw.fireAnswer:null,deadChoice:['one_hour','ask'].includes(raw.deadChoice)?raw.deadChoice:null,deadLead:['station','decode','home'].includes(raw.deadLead)?raw.deadLead:null,carried:[...new Set((Array.isArray(raw.carried)?raw.carried:[]).filter(id=>CARRY_ITEMS.includes(id)))].slice(0,3),escapeError:['capacity','essentials','lift','pattern'].includes(raw.escapeError)?raw.escapeError:null,escapeQuestion:['rourke','memory'].includes(raw.escapeQuestion)?raw.escapeQuestion:null,trainTone:['ask','space'].includes(raw.trainTone)?raw.trainTone:null,pattern:[...new Set((Array.isArray(raw.pattern)?raw.pattern:[]).filter(id=>PATTERN.includes(id)))].slice(0,3),stationError:['public','number','key','phone','channels'].includes(raw.stationError)?raw.stationError:null,phoneCode:typeof raw.phoneCode==='string'&&/^\d{0,4}$/.test(raw.phoneCode)?raw.phoneCode:'',phoneUnlocked:raw.phoneUnlocked===true&&Array.isArray(raw.clues)&&raw.clues.includes('phone_draft'),wifeTone:['explain','apologize'].includes(raw.wifeTone)?raw.wifeTone:null,lenaItems:[...new Set((Array.isArray(raw.lenaItems)?raw.lenaItems:[]).filter(id=>LENA_ITEMS.includes(id)))],wifeError:raw.wifeError==='prepare'?'prepare':null,roadAction:['call','ask'].includes(raw.roadAction)?raw.roadAction:null,memoryFocus:['lena','purpose'].includes(raw.memoryFocus)?raw.memoryFocus:null,memorySegments:Number.isInteger(raw.memorySegments)&&raw.memorySegments>=0&&raw.memorySegments<=4?raw.memorySegments:0,memoryRoute:raw.memoryRoute==='flooded'?'flooded':null,memoryError:['dock','complicit'].includes(raw.memoryError)?raw.memoryError:null,staticApproach:['entrust','limits'].includes(raw.staticApproach)?raw.staticApproach:null,nameMatches:Object.fromEntries(Object.entries(NAME_MATCHES).filter(([key,name])=>raw.nameMatches&&typeof raw.nameMatches==='object'&&Object.hasOwn(raw.nameMatches,key)&&raw.nameMatches[key]===name)),staticSegments:Number.isInteger(raw.staticSegments)&&raw.staticSegments>=0&&raw.staticSegments<=4?raw.staticSegments:0,staticError:['dates','match','custody'].includes(raw.staticError)?raw.staticError:null,houseError:['room','agency'].includes(raw.houseError)?raw.houseError:null,houseFocus:['protect','signature'].includes(raw.houseFocus)?raw.houseFocus:null,risingMemory:Number.isInteger(raw.risingMemory)&&raw.risingMemory>=0&&raw.risingMemory<=3?raw.risingMemory:0,risingError:['pursue','road','archive','certainty'].includes(raw.risingError)?raw.risingError:null,archiveRecord:Number.isInteger(raw.archiveRecord)&&raw.archiveRecord>=0&&raw.archiveRecord<=6?raw.archiveRecord:0,archiveError:raw.archiveError==='gate'?'gate':null,releasePreview:RELEASE_SCOPES.includes(raw.releasePreview)?raw.releasePreview:null,releaseCommitted:committed,releasePlan,relayStep,costFocus:['inhaler','coat'].includes(raw.costFocus)?raw.costFocus:null,copyKeyKept:raw.copyKeyKept===true&&Array.isArray(raw.clues)&&raw.clues.includes('copy_key'),executedRelease:committed?'curated':null,costError:raw.costError==='plan'?'plan':null,ashesFocus:['listen','space'].includes(raw.ashesFocus)?raw.ashesFocus:null,ashesError:raw.ashesError==='certainty'?'certainty':null,permitFocus:['van','copies'].includes(raw.permitFocus)?raw.permitFocus:null,permitError:raw.permitError==='identity'?'identity':null,serviceFocus:['timing','key'].includes(raw.serviceFocus)?raw.serviceFocus:null,serviceError:raw.serviceError==='trust'?'trust':null,noticesFocus:['truth','agency'].includes(raw.noticesFocus)?raw.noticesFocus:null,noticesError:raw.noticesError==='safety'?'safety':null,truckOrder,truckError:raw.truckError==='order'?'order':null,truckFocus:['workers','paper'].includes(raw.truckFocus)?raw.truckFocus:null,collectionChannels:collectionChannels===9&&!(raw.collectionRetried===true&&Array.isArray(raw.clues)&&raw.clues.includes('reserve_receipts'))?8:collectionChannels,collectionRetried:collectionChannels===9&&raw.collectionRetried===true&&Array.isArray(raw.clues)&&raw.clues.includes('reserve_receipts'),collectionError:['intent','custody'].includes(raw.collectionError)?raw.collectionError:null,blueMarks:[...new Set((Array.isArray(raw.blueMarks)?raw.blueMarks:[]).filter(id=>['wheel','hinge','crescent'].includes(id)))],blueFocus:['pattern','lena'].includes(raw.blueFocus)?raw.blueFocus:null,blueError:raw.blueError==='indicator'?'indicator':null,custodianFocus:['bridges','sightings'].includes(raw.custodianFocus)?raw.custodianFocus:null,custodianError:raw.custodianError==='trade'?'trade':null,dawnFocus:['notice','route'].includes(raw.dawnFocus)?raw.dawnFocus:null,dawnError:raw.dawnError==='collection'?'collection':null,routeVersion,routeNumber,routeStop,routeMistakes:Number.isInteger(raw.routeMistakes)&&raw.routeMistakes>=0&&raw.routeMistakes<=999?raw.routeMistakes:0,routesCompleted:Number.isSafeInteger(raw.routesCompleted)&&raw.routesCompleted>=0?raw.routesCompleted:0,routeError:raw.stage==='route_active'&&raw.routeError===getRoute(routeNumber,routeVersion).stops[routeStop]?.id?raw.routeError:null,routeLoad,routeDepotVisits:Number.isInteger(raw.routeDepotVisits)&&raw.routeDepotVisits>=0&&raw.routeDepotVisits<=999?raw.routeDepotVisits:0,routeLoadError:raw.stage==='route_active'&&raw.routeLoadError===true&&routeLoad+pickupLoad(getRoute(routeNumber,routeVersion).stops[routeStop]?.answer,getRoute(routeNumber,routeVersion).stops[routeStop])>TRUCK_CAPACITY};
}
module.exports={CLUES,initialState,act,restore};
