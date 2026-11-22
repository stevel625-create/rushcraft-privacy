const {test}=require('node:test');const assert=require('node:assert/strict');
const {initialState,act,restore}=require('./game');
test('complete the mission through both approaches with standard equipment',()=>{
 for(const approach of ['wait','direct']){
  let s=act(initialState(),{type:'start'});
  s=act(s,{type:'inspect',id:'reflections'});s=act(s,{type:'approach',id:approach});
  assert.equal(s.stage,'conversation');assert.equal(s.suspicion,approach==='direct'?1:0);
  s=act(s,{type:'office'});s=act(s,{type:'inspect',id:'photo'});s=act(s,{type:'inspect',id:'report'});s=act(s,{type:'assess'});
  s=act(s,{type:'conclude',id:'certain'});assert.equal(s.stage,'assessment');assert.equal(s.answer,'uncertain');
  s=act(s,{type:'conclude',id:'investigate'});assert.equal(s.stage,'complete');
 }
});
test('clues cannot duplicate and archive evidence is required before concluding',()=>{
 let s=act(initialState(),{type:'start'});assert.equal(act(s,{type:'assess'}),s);
 s=act(s,{type:'inspect',id:'gait'});s=act(s,{type:'inspect',id:'gait'});assert.equal(s.clues.length,1);
 assert.equal(act(s,{type:'inspect',id:'report'}),s);
 s=act(s,{type:'approach',id:'wait'});s=act(s,{type:'office'});assert.equal(act(s,{type:'assess'}),s);
});
test('saved state restores with recognized, unique evidence',()=>{
 assert.deepEqual(restore({stage:'invalid'}),initialState());
 const s=restore({stage:'office',clues:['photo','photo','unknown'],approach:'direct'});
 assert.deepEqual(s.clues,['photo']);assert.equal(s.suspicion,1);
});
test('both yard approaches carry forward clues and finish with standard equipment',()=>{
 for(const entry of ['reception','wait']){
  let s=restore({stage:'complete',approach:'direct',clues:['photo','report','conversation']});
  s=act(s,{type:'start_yard'});assert.equal(s.stage,'yard_gate');assert.equal(s.suspicion,1);
  s=act(s,{type:'yard_entry',id:entry});assert.equal(s.stage,'yard_board');
  assert.equal(act(s,{type:'match_route',id:'cedar'}),s);
  s=act(s,{type:'inspect',id:'route'});s=act(s,{type:'match_route',id:'maple'});assert.equal(s.boardError,true);assert.equal(s.stage,'yard_board');
  s=act(s,{type:'match_route',id:'cedar'});assert.equal(s.stage,'yard_records');assert.ok(s.clues.includes('surname'));
  assert.equal(act(s,{type:'record_conclusion',id:'local_identity'}),s);
  s=act(s,{type:'inspect',id:'registration'});s=act(s,{type:'inspect',id:'contact'});
  s=act(s,{type:'record_conclusion',id:'proof'});assert.equal(s.recordAnswer,'overreach');assert.equal(s.stage,'yard_records');
  s=act(s,{type:'record_conclusion',id:'local_identity'});assert.equal(s.stage,'yard_complete');
  for(const id of ['photo','report','conversation','route','surname','registration','contact'])assert.ok(s.clues.includes(id));
  assert.deepEqual(restore(JSON.parse(JSON.stringify(s))),s);
 }
});
test('legacy completed saves can enter the new yard scene and malformed clue keys are filtered',()=>{
 const s=restore({stage:'complete',clues:['photo','report','constructor','__proto__']});
 assert.deepEqual(s.clues,['photo','report']);assert.equal(act(s,{type:'start_yard'}).stage,'yard_gate');
 const b=restore({stage:'yard_board',yardApproach:'wait',boardError:true,clues:['route']});
 assert.equal(act(b,{type:'match_route',id:'cedar'}).stage,'yard_records');
});
test('Mercer choices preserve evidence and finish without equipment or timed inputs',()=>{
 for(const response of ['call','approach'])for(const tone of ['listen','press']){
  let s=restore({stage:'yard_complete',approach:'direct',clues:['surname','registration','photo']});
  s=act(s,{type:'start_mercer'});assert.equal(s.stage,'mercer_follow');
  assert.equal(act(s,{type:'follow_corner'}),s);
  s=act(s,{type:'inspect',id:'van_reflection'});s=act(s,{type:'follow_corner'});
  s=act(s,{type:'mercer_respond',id:response});assert.equal(s.stage,'mercer_aftermath');
  assert.equal(act(s,{type:'mercer_speak',id:tone}),s);
  for(const id of ['reflex','confusion','scar'])s=act(s,{type:'inspect',id});
  const count=s.clues.length;s=act(s,{type:'inspect',id:'scar'});assert.equal(s.clues.length,count);
  s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.mercerResponse,response);
  s=act(s,{type:'mercer_speak',id:tone});assert.equal(s.stage,'mercer_dialogue');
  s=act(s,{type:'mercer_conclude',id:'identity'});assert.equal(s.mercerAnswer,'overreach');
  s=act(s,{type:'mercer_conclude',id:'unexplained'});assert.equal(s.stage,'mercer_complete');
  assert.ok(s.clues.includes('surname'));assert.equal(s.mercerTone,tone);assert.deepEqual(restore(s),s);
 }
});
test('older completed yard saves can continue to Mercer and invalid actions cannot skip scenes',()=>{
 const s=restore({stage:'yard_complete',clues:['surname','registration']});
 assert.equal(act(s,{type:'start_mercer'}).stage,'mercer_follow');
 assert.equal(act(initialState(),{type:'mercer_conclude',id:'unexplained'}).stage,'title');
 const invalid=restore({stage:'mercer_aftermath',mercerResponse:'invalid',mercerTone:{},clues:[]});
 assert.equal(invalid.mercerResponse,null);assert.equal(invalid.mercerTone,null);
});
test('Fire opening and recollection branches finish with accurately labeled evidence',()=>{
 for(const opening of ['explain','name'])for(const recall of ['wait','supply']){
  let s=restore({stage:'mercer_complete',mercerTone:'listen',clues:['photo','reflex','surname']});
  s=act(s,{type:'start_fire'});assert.equal(s.stage,'fire_return');
  s=act(s,{type:'fire_open',id:opening});assert.equal(s.stage,'fire_memory');
  s=act(s,{type:'fire_recall',id:recall});assert.equal(s.stage,'fire_photo');
  assert.ok(s.clues.includes(recall==='wait'?'fire_recall':'prompted_recall'));
  assert.ok(!s.clues.includes(recall==='wait'?'prompted_recall':'fire_recall'));
  assert.equal(act(s,{type:'fire_leave'}),s);
  s=act(s,{type:'inspect',id:'passport'});s=act(s,{type:'inspect',id:'family_boundary'});
  s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.fireRecall,recall);
  s=act(s,{type:'fire_leave'});assert.equal(s.stage,'fire_watch');
  assert.equal(act(s,{type:'fire_conclude',id:'attention'}),s);
  s=act(s,{type:'inspect',id:'feed_loss'});s=act(s,{type:'inspect',id:'maintenance'});
  for(const answer of ['routine','named_enemy']){s=act(s,{type:'fire_conclude',id:answer});assert.equal(s.stage,'fire_watch');assert.equal(s.fireAnswer,answer);}
  s=act(s,{type:'fire_conclude',id:'attention'});assert.equal(s.stage,'fire_complete');
  for(const clue of ['photo','reflex','surname','passport','family_boundary','feed_loss','maintenance'])assert.ok(s.clues.includes(clue));
  assert.deepEqual(restore(s),s);
 }
});
test('legacy Mercer saves start Fire and unsupported actions cannot skip its evidence',()=>{
 const legacy=restore({stage:'mercer_complete',clues:['photo'],mercerTone:'press'});
 assert.equal(act(legacy,{type:'start_fire'}).stage,'fire_return');
 assert.equal(act(initialState(),{type:'start_fire'}).stage,'title');
 const s=restore({stage:'fire_memory',fireRecall:'invalid',clues:[]});
 assert.equal(s.fireRecall,null);assert.equal(act(s,{type:'fire_recall',id:'invalid'}),s);
});
test('both doorstep choices unlock the bank in order and preserve earlier testimony',()=>{
 for(const choice of ['one_hour','ask']){
  let s=restore({stage:'fire_complete',fireRecall:'supply',clues:['photo','prompted_recall','feed_loss']});
  s=act(s,{type:'start_dead'});assert.equal(s.stage,'dead_door');
  s=act(s,{type:'dead_depart',id:choice});assert.equal(s.stage,'dead_bank');
  assert.equal(act(s,{type:'inspect',id:'marker'}),s);assert.equal(act(s,{type:'dead_open'}),s);
  s=act(s,{type:'inspect',id:'activation'});s=act(s,{type:'inspect',id:'marker'});
  s=act(s,{type:'dead_open'});assert.equal(s.stage,'dead_box');
  assert.equal(act(s,{type:'dead_lead',id:'station'}),s);
  for(const id of ['termination','anton','locker_key','codebook'])s=act(s,{type:'inspect',id});
  const n=s.clues.length;s=act(s,{type:'inspect',id:'anton'});assert.equal(s.clues.length,n);
  s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.deadChoice,choice);
  for(const lead of ['decode','home']){s=act(s,{type:'dead_lead',id:lead});assert.equal(s.stage,'dead_box');assert.equal(s.deadLead,lead);}
  s=act(s,{type:'dead_lead',id:'station'});assert.equal(s.stage,'dead_complete');
  assert.ok(s.clues.includes('prompted_recall'));assert.ok(!s.clues.includes('fire_recall'));
  assert.ok(s.clues.includes('feed_loss'));assert.deepEqual(restore(s),s);
 }
});
test('legacy Fire saves can enter the bank sequence and out-of-sequence actions fail',()=>{
 const s=restore({stage:'fire_complete',clues:['feed_loss','maintenance']});
 assert.equal(act(s,{type:'start_dead'}).stage,'dead_door');
 assert.equal(act(initialState(),{type:'start_dead'}).stage,'title');
 const invalid=restore({stage:'dead_box',deadChoice:'invalid',deadLead:{},clues:[]});
 assert.equal(invalid.deadChoice,null);assert.equal(invalid.deadLead,null);
 assert.equal(act(invalid,{type:'dead_lead',id:'invalid'}),invalid);
});
test('escape packing is reversible, limited, and cannot discard the essential leads',()=>{
 let s=act(restore({stage:'dead_complete',clues:['anton','locker_key','codebook']}),{type:'start_escape'});
 assert.equal(s.stage,'escape_pack');assert.ok(s.clues.includes('bell_attack'));
 s=act(s,{type:'escape_leave'});assert.equal(s.escapeError,'essentials');
 for(const id of ['cash','case','locker_key'])s=act(s,{type:'toggle_carry',id});
 s=act(s,{type:'toggle_carry',id:'anton'});assert.equal(s.escapeError,'capacity');assert.equal(s.carried.length,3);
 s=act(s,{type:'escape_leave'});assert.equal(s.stage,'escape_pack');
 for(const id of ['cash','case','codebook','anton'])s=act(s,{type:'toggle_carry',id});
 assert.deepEqual(restore(s),s);
 s=act(s,{type:'escape_leave'});assert.equal(s.stage,'escape_service');
 assert.deepEqual(s.carried,['locker_key','codebook','anton']);
});
test('Keane and train dialogue branches preserve source labels and resolve only one entry',()=>{
 for(const question of ['rourke','memory'])for(const tone of ['ask','space']){
  let s=restore({stage:'escape_service',clues:['codebook','prompted_recall'],carried:['locker_key','codebook','anton']});
  s=act(s,{type:'escape_route',id:'lift'});assert.equal(s.escapeError,'lift');assert.equal(s.stage,'escape_service');
  s=act(s,{type:'escape_route',id:'airflow'});assert.equal(s.stage,'escape_keane');
  assert.equal(act(s,{type:'escape_to_train'}),s);
  s=act(s,{type:'escape_question',id:question});s=act(s,{type:'escape_to_train'});
  assert.equal(s.stage,'escape_train');assert.equal(act(s,{type:'pattern_pick',id:'UNION'}),s);
  s=act(s,{type:'train_tone',id:tone});assert.ok(s.clues.includes('mara_partner'));
  for(const id of ['247','UNION','STATION'])s=act(s,{type:'pattern_pick',id});
  s=act(s,{type:'pattern_confirm'});assert.equal(s.escapeError,'pattern');assert.equal(s.stage,'escape_train');
  s=act(s,{type:'pattern_reset'});assert.deepEqual(s.pattern,[]);
  for(const id of ['UNION','STATION','247'])s=act(s,{type:'pattern_pick',id});
  s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.trainTone,tone);
  s=act(s,{type:'pattern_confirm'});assert.equal(s.stage,'escape_complete');
  for(const id of ['prompted_recall','keane_claim','mara_partner','station_pattern'])assert.ok(s.clues.includes(id));
  assert.deepEqual(s.carried,['locker_key','codebook','anton']);assert.deepEqual(restore(s),s);
 }
});
test('escape save restoration filters malformed carry lists and pattern fragments',()=>{
 const s=restore({stage:'escape_train',carried:['cash','cash','unknown','locker_key','codebook','anton'],pattern:['247','247','unknown','STATION'],trainTone:'invalid'});
 assert.deepEqual(s.carried,['cash','locker_key','codebook']);assert.deepEqual(s.pattern,['247','STATION']);assert.equal(s.trainTone,null);
 assert.equal(act(initialState(),{type:'start_escape'}).stage,'title');
 assert.equal(act(s,{type:'pattern_confirm'}),s);
});
test('station route and locker require the observations and carried key',()=>{
 let s=act(restore({stage:'escape_complete',carried:['locker_key','codebook','anton'],clues:['station_pattern']}),{type:'start_station'});
 assert.equal(act(s,{type:'station_route',id:'employee'}),s);
 s=act(s,{type:'inspect',id:'station_watchers'});s=act(s,{type:'station_route',id:'public'});assert.equal(s.stationError,'public');
 s=act(s,{type:'station_route',id:'employee'});assert.equal(s.stage,'station_locker');
 s=act(s,{type:'station_open',id:243});assert.equal(s.stationError,'number');
 const missing=act({...s,carried:[]},{type:'station_open',id:247});assert.equal(missing.stage,'station_locker');assert.equal(missing.stationError,'key');
 s=act(s,{type:'station_open',id:247});assert.equal(s.stage,'station_phone');assert.ok(s.clues.includes('harbor_label'));
 assert.deepEqual(s.carried,['locker_key','codebook','anton']);
});
test('manual and recalled handset paths recover the same draft without locking players out',()=>{
 for(const mode of ['manual','recall']){
  let s=restore({stage:'station_phone',clues:['harbor_label','prompted_recall'],carried:['locker_key','codebook','anton']});
  assert.equal(act(s,{type:'station_reach_room'}),s);
  for(const id of ['0','0','0','0'])s=act(s,{type:'phone_digit',id});
  assert.equal(act(s,{type:'phone_digit',id:'7'}),s);
  s=act(s,{type:'phone_unlock'});assert.equal(s.stationError,'phone');assert.equal(s.phoneUnlocked,false);
  s=act(s,{type:'phone_clear'});
  if(mode==='manual'){for(const id of ['2','4','7'])s=act(s,{type:'phone_digit',id});s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.phoneCode,'247');s=act(s,{type:'phone_digit',id:'1'});}
  else s=act(s,{type:'phone_recall'});
  s=act(s,{type:'phone_unlock'});assert.equal(s.phoneUnlocked,true);assert.ok(s.clues.includes('phone_draft'));
  assert.deepEqual(restore(s),s);s=act(s,{type:'station_reach_room'});assert.equal(s.stage,'station_files');
  assert.equal(act(s,{type:'inspect',id:'harbor_audio'}),s);
  s=act(s,{type:'inspect',id:'read_first'});
  assert.equal(act(s,{type:'station_priority',id:'lena'}),s);
  for(const id of ['harbor_ledger','harbor_audio','harbor_accounts'])s=act(s,{type:'inspect',id});
  s=act(s,{type:'station_priority',id:'channels'});assert.equal(s.stationError,'channels');assert.equal(s.stage,'station_files');
  s=act(s,{type:'station_priority',id:'lena'});assert.equal(s.stage,'station_complete');
  assert.ok(s.clues.includes('prompted_recall'));assert.deepEqual(restore(s),s);
 }
});
test('restoration rejects malformed handset values and unrecorded unlocks',()=>{
 const s=restore({stage:'station_phone',phoneCode:'24711',phoneUnlocked:true,clues:[]});
 assert.equal(s.phoneCode,'');assert.equal(s.phoneUnlocked,false);
 assert.equal(act(s,{type:'phone_digit',id:2}),s);assert.equal(act(s,{type:'phone_digit',id:'x'}),s);
 assert.equal(act(initialState(),{type:'station_open',id:247}).stage,'title');
});
test('one continuous standard-kit playthrough reaches the end of all thirteen scenes',()=>{
 let s=initialState();const go=(type,id)=>{s=act(s,{type,id});};
 go('start');go('inspect','reflections');go('approach','wait');go('office');go('inspect','photo');go('inspect','report');go('assess');go('conclude','investigate');
 go('start_yard');go('yard_entry','reception');go('inspect','route');go('match_route','cedar');go('inspect','registration');go('inspect','contact');go('record_conclusion','local_identity');
 go('start_mercer');go('inspect','van_reflection');go('follow_corner');go('mercer_respond','call');go('inspect','reflex');go('inspect','confusion');go('mercer_speak','listen');go('mercer_conclude','unexplained');
 go('start_fire');go('fire_open','explain');go('fire_recall','wait');go('inspect','passport');go('inspect','family_boundary');go('fire_leave');go('inspect','feed_loss');go('inspect','maintenance');go('fire_conclude','attention');
 go('start_dead');go('dead_depart','one_hour');go('inspect','activation');go('inspect','marker');go('dead_open');for(const id of ['termination','anton','locker_key','codebook'])go('inspect',id);go('dead_lead','station');
 go('start_escape');for(const id of ['locker_key','codebook','anton'])go('toggle_carry',id);go('escape_leave');go('escape_route','airflow');go('escape_question','rourke');go('escape_to_train');go('train_tone','space');for(const id of ['UNION','STATION','247'])go('pattern_pick',id);go('pattern_confirm');
 go('start_station');go('inspect','station_watchers');go('station_route','employee');go('station_open',247);go('phone_recall');go('phone_unlock');go('station_reach_room');for(const id of ['read_first','harbor_ledger','harbor_audio','harbor_accounts'])go('inspect',id);go('station_priority','lena');
 assert.equal(s.stage,'station_complete');
 go('start_wife');go('inspect','hanover_watch');go('wife_enter');go('wife_talk','explain');go('inspect','ultimatum');for(const id of ['medication','keys','phone'])go('lena_item',id);go('wife_depart');go('inspect','false_stop');go('wife_respond','call');
 assert.equal(s.stage,'wife_complete');
 go('start_memory');go('memory_question','lena');go('inspect','med_order');go('inspect','transfer_audio');go('memory_clinic');go('inspect','hale_injury');go('inspect','hale_choice');go('memory_recording');for(let i=0;i<4;i++)go('memory_excerpt');go('memory_pursuit');go('memory_route','flooded');go('inspect','spousal_vector');go('inspect','contact_photo');go('memory_inference','observed');
 assert.equal(s.stage,'memory_complete');
 go('start_static');go('static_hand_over','entrust');go('static_interpret','frequencies');
 for(const [initials,id] of [['BN','Branislav Novak'],['IC','Idris Celik'],['PS','Petra Salonen']])s=act(s,{type:'static_match',initials,id});
 go('static_listen');for(let i=0;i<4;i++)go('static_excerpt');go('static_axis');go('inspect','ash_ledger');go('static_receiver');for(const id of ['millbrook_lead','loop_signal','dependent_demand'])go('inspect',id);go('static_inference','unconfirmed');
 assert.equal(s.stage,'static_complete');
 go('start_house');for(const id of ['curved_estate','rourke_arrival'])go('inspect',id);go('house_enter');for(const id of ['holding_feed','east_report'])go('inspect',id);go('house_room','B-12');for(const id of ['lena_brother','legal_pad'])go('inspect',id);go('house_plan','proof');for(const id of ['estate_ledger','marrow_memo'])go('inspect',id);go('house_review');go('house_respond','protect');
 assert.equal(s.stage,'house_complete');
 go('start_rising');go('inspect','drive_retained');go('rising_exit','east');go('inspect','van_impact');go('rising_outflow','through');go('inspect','routing_marks');go('inspect','market_fragment');go('rising_interpret','shell');for(let i=0;i<3;i++)go('rising_fragment');go('rising_to_yard');go('inspect','offshore_lead');go('rising_commit','test');
 assert.equal(s.stage,'rising_complete');
 go('start_archive');go('archive_travel','transfer');go('inspect','hale_platform');go('inspect','scar_variance');go('archive_exception');for(let i=0;i<6;i++)go('archive_response');go('archive_enter');for(const id of ['integrity_check','north_span','release_recipients'])go('inspect',id);go('archive_options');go('archive_preview','legal');go('archive_prepare');
 assert.equal(s.stage,'archive_complete');assert.equal(s.releaseCommitted,false);assert.ok(s.clues.includes('photo'));assert.ok(s.clues.includes('harbor_accounts'));assert.ok(s.clues.includes('lena_account'));assert.deepEqual(restore(s),s);
});
test('Hanover dialogue and response branches preserve Lena’s account and the source outcome',()=>{
 for(const tone of ['explain','apologize'])for(const response of ['call','ask']){
  let s=restore({stage:'station_complete',clues:['phone_draft','harbor_accounts','prompted_recall'],phoneUnlocked:true,phoneCode:'2471',carried:['locker_key','codebook','anton']});
  s=act(s,{type:'start_wife'});assert.equal(s.stage,'wife_arrival');assert.equal(act(s,{type:'wife_enter'}),s);
  s=act(s,{type:'inspect',id:'hanover_watch'});s=act(s,{type:'wife_enter'});s=act(s,{type:'wife_talk',id:tone});assert.equal(s.stage,'wife_prepare');
  s=act(s,{type:'wife_depart'});assert.equal(s.wifeError,'prepare');assert.equal(s.stage,'wife_prepare');
  for(const id of ['medication','keys','phone','keepsake'])s=act(s,{type:'lena_item',id});
  s=act(s,{type:'wife_depart'});assert.equal(s.stage,'wife_prepare');
  s=act(s,{type:'lena_item',id:'keepsake'});assert.ok(!s.lenaItems.includes('keepsake'));
  s=act(s,{type:'inspect',id:'ultimatum'});s=restore(JSON.parse(JSON.stringify(s)));
  s=act(s,{type:'wife_depart'});assert.equal(s.stage,'wife_road');assert.equal(act(s,{type:'wife_respond',id:response}),s);
  s=act(s,{type:'inspect',id:'false_stop'});s=act(s,{type:'wife_respond',id:response});assert.equal(s.stage,'wife_complete');
  for(const id of ['phone_draft','harbor_accounts','prompted_recall','hanover_watch','lena_account','ultimatum','false_stop','lena_taken'])assert.ok(s.clues.includes(id));
  assert.deepEqual(s.carried,['locker_key','codebook','anton']);assert.equal(s.phoneCode,'2471');assert.equal(s.phoneUnlocked,true);assert.deepEqual(restore(s),s);
 }
});
test('Lena can retain an optional keepsake without a capacity fee and saves filter unknown items',()=>{
 let s=restore({stage:'wife_prepare',lenaItems:['unknown','phone','phone'],wifeTone:'invalid',roadAction:{},clues:['ultimatum']});
 assert.deepEqual(s.lenaItems,['phone']);assert.equal(s.wifeTone,null);assert.equal(s.roadAction,null);
 for(const id of ['medication','keys','keepsake'])s=act(s,{type:'lena_item',id});
 assert.equal(s.lenaItems.length,4);s=act(s,{type:'wife_depart'});assert.equal(s.stage,'wife_road');
 assert.equal(act(initialState(),{type:'start_wife'}).stage,'title');
});
test('Memory Trap requires its sources, restores a partial transcript, and preserves the unplayed cassette',()=>{
 for(const focus of ['lena','purpose']){
  let s=restore({stage:'wife_complete',clues:['prompted_recall','lena_account','lena_taken'],carried:['locker_key','codebook','anton'],lenaItems:['medication','keys','phone','keepsake']});
  s=act(s,{type:'start_memory'});s=act(s,{type:'memory_question',id:focus});assert.equal(s.stage,'memory_archive');
  assert.equal(act(s,{type:'memory_clinic'}),s);
  for(const id of ['med_order','transfer_audio'])s=act(s,{type:'inspect',id});s=act(s,{type:'memory_clinic'});assert.equal(s.stage,'memory_hale');
  assert.equal(act(s,{type:'memory_recording'}),s);
  for(const id of ['hale_injury','hale_choice'])s=act(s,{type:'inspect',id});s=act(s,{type:'memory_recording'});
  for(let i=0;i<2;i++)s=act(s,{type:'memory_excerpt'});
  s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.memorySegments,2);assert.equal(act(s,{type:'memory_pursuit'}),s);assert.ok(!s.clues.includes('session12'));
  for(let i=0;i<2;i++)s=act(s,{type:'memory_excerpt'});assert.ok(s.clues.includes('session12'));assert.ok(s.clues.includes('carrier_phrase'));assert.equal(act(s,{type:'memory_excerpt'}),s);
  s=act(s,{type:'memory_pursuit'});s=act(s,{type:'memory_route',id:'dock'});assert.equal(s.memoryError,'dock');assert.equal(s.stage,'memory_escape');
  s=act(s,{type:'memory_route',id:'flooded'});assert.equal(s.stage,'memory_case');assert.ok(s.clues.includes('anchor_claim'));
  assert.equal(act(s,{type:'memory_inference',id:'observed'}),s);
  for(const id of ['spousal_vector','contact_photo'])s=act(s,{type:'inspect',id});
  s=act(s,{type:'memory_inference',id:'complicit'});assert.equal(s.memoryError,'complicit');assert.equal(s.stage,'memory_case');
  s=act(s,{type:'memory_inference',id:'observed'});assert.equal(s.stage,'memory_complete');
  assert.ok(s.clues.includes('prompted_recall'));assert.equal(s.lenaItems.length,4);assert.equal(s.carried.length,3);assert.deepEqual(restore(s),s);
 }
});
test('Memory Trap save restoration validates transcript positions and prevents out-of-scene actions',()=>{
 for(const value of [-1,5,2.5,'4',null])assert.equal(restore({stage:'memory_tape',memorySegments:value}).memorySegments,0);
 const s=restore({stage:'wife_complete',memoryFocus:'invalid',memoryError:'invalid',memoryRoute:'invalid'});
 assert.equal(s.memoryFocus,null);assert.equal(s.memoryError,null);assert.equal(s.memoryRoute,null);
 assert.equal(act(s,{type:'memory_excerpt'}),s);assert.equal(act(initialState(),{type:'start_memory'}).stage,'title');
});
test('Static branches preserve partial matches and transcript without turning a demand into verified custody',()=>{
 for(const approach of ['entrust','limits']){
  let s=restore({stage:'memory_complete',clues:['spousal_vector','contact_photo','prompted_recall','lena_account'],carried:['locker_key','codebook','anton'],lenaItems:['medication','keys','phone']});
  s=act(s,{type:'start_static'});s=act(s,{type:'static_hand_over',id:approach});assert.equal(s.stage,'static_cards');
  assert.equal(act(s,{type:'static_listen'}),s);
  s=act(s,{type:'static_interpret',id:'dates'});assert.equal(s.staticError,'dates');
  s=act(s,{type:'static_interpret',id:'frequencies'});
  s=act(s,{type:'static_match',initials:'BN',id:'Idris Celik'});assert.equal(s.staticError,'match');assert.deepEqual(s.nameMatches,{});
  s=act(s,{type:'static_match',initials:'BN',id:'Branislav Novak'});s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.nameMatches.BN,'Branislav Novak');
  for(const [initials,id] of [['IC','Idris Celik'],['PS','Petra Salonen']])s=act(s,{type:'static_match',initials,id});
  s=act(s,{type:'static_listen'});assert.ok(s.clues.includes('cleanup_chain'));
  s=act(s,{type:'static_excerpt'});s=act(s,{type:'static_excerpt'});assert.ok(!s.clues.includes('spousal_content'));assert.equal(act(s,{type:'static_axis'}),s);
  s=restore(s);assert.equal(s.staticSegments,2);s=act(s,{type:'static_excerpt'});s=act(s,{type:'static_excerpt'});assert.ok(s.clues.includes('spousal_content'));assert.ok(s.clues.includes('toby_risk'));assert.equal(act(s,{type:'static_excerpt'}),s);
  s=act(s,{type:'static_axis'});assert.equal(act(s,{type:'static_receiver'}),s);s=act(s,{type:'inspect',id:'ash_ledger'});s=act(s,{type:'static_receiver'});
  assert.equal(act(s,{type:'inspect',id:'dependent_demand'}),s);
  for(const id of ['millbrook_lead','loop_signal','dependent_demand'])s=act(s,{type:'inspect',id});
  s=act(s,{type:'static_inference',id:'both_captive'});assert.equal(s.stage,'static_receiver');assert.equal(s.staticError,'custody');
  s=act(s,{type:'static_inference',id:'unconfirmed'});assert.equal(s.stage,'static_complete');
  for(const id of ['spousal_vector','prompted_recall','lena_account','spousal_content','ash_ledger','dependent_demand'])assert.ok(s.clues.includes(id));
  assert.equal(s.carried.length,3);assert.equal(s.lenaItems.length,3);assert.deepEqual(restore(s),s);
 }
});
test('Static saves retain only correct known card matches and valid transcript positions',()=>{
 const s=restore({stage:'static_cards',nameMatches:{BN:'Branislav Novak',IC:'Petra Salonen',UNKNOWN:'Idris Celik'},staticSegments:9,staticApproach:'invalid',staticError:'invalid'});
 assert.deepEqual(s.nameMatches,{BN:'Branislav Novak'});assert.equal(s.staticSegments,0);assert.equal(s.staticApproach,null);assert.equal(s.staticError,null);
 assert.equal(act(initialState(),{type:'start_static'}).stage,'title');
 assert.equal(act(s,{type:'static_match',initials:'__proto__',id:'Branislav Novak'}),s);
});
test('estate investigation gates room choice and proof while preserving earlier uncertainty',()=>{
 for(const focus of ['protect','signature']){
  let s=restore({stage:'static_complete',clues:['dependent_demand','spousal_content','lena_account'],carried:['locker_key','codebook','anton'],lenaItems:['medication','keys','phone','keepsake']});
  s=act(s,{type:'start_house'});assert.equal(act(s,{type:'house_enter'}),s);
  for(const id of ['curved_estate','rourke_arrival'])s=act(s,{type:'inspect',id});s=act(s,{type:'house_enter'});assert.equal(s.stage,'house_monitor');
  assert.equal(act(s,{type:'house_room',id:'B-12'}),s);
  for(const id of ['holding_feed','east_report'])s=act(s,{type:'inspect',id});
  s=act(s,{type:'house_room',id:'B-10'});assert.equal(s.houseError,'room');assert.equal(s.stage,'house_monitor');
  s=restore(JSON.parse(JSON.stringify(s)));s=act(s,{type:'house_room',id:'B-12'});assert.equal(s.stage,'house_lena');
  assert.equal(act(s,{type:'house_plan',id:'proof'}),s);
  for(const id of ['lena_brother','legal_pad'])s=act(s,{type:'inspect',id});
  s=act(s,{type:'house_plan',id:'leave'});assert.equal(s.houseError,'agency');assert.equal(s.stage,'house_lena');
  s=act(s,{type:'house_plan',id:'proof'});assert.equal(s.stage,'house_records');assert.equal(act(s,{type:'house_review'}),s);
  for(const id of ['estate_ledger','marrow_memo'])s=act(s,{type:'inspect',id});
  s=act(s,{type:'house_review'});s=act(s,{type:'house_respond',id:focus});assert.equal(s.stage,'house_complete');assert.equal(s.houseFocus,focus);
  for(const id of ['dependent_demand','spousal_content','lena_account','lena_brother','estate_ledger','marrow_memo'])assert.ok(s.clues.includes(id));
  assert.equal(s.carried.length,3);assert.equal(s.lenaItems.length,4);assert.deepEqual(restore(s),s);
 }
});
test('legacy static checkpoints enter the estate and malformed estate fields are dropped',()=>{
 const s=restore({stage:'static_complete',houseError:'invalid',houseFocus:42,clues:['dependent_demand']});
 assert.equal(s.houseError,null);assert.equal(s.houseFocus,null);assert.equal(act(s,{type:'start_house'}).stage,'house_perimeter');
 assert.equal(act(initialState(),{type:'start_house'}).stage,'title');assert.equal(act(s,{type:'house_respond',id:'protect'}),s);
});
test('Rising preserves the group’s sources and gates incomplete memories and certainty',()=>{
 let s=restore({stage:'house_complete',clues:['estate_ledger','marrow_memo','dependent_demand','prompted_recall'],carried:['locker_key','codebook','anton'],lenaItems:['medication','keys','phone','keepsake']});
 s=act(s,{type:'start_rising'});assert.equal(act(s,{type:'rising_exit',id:'east'}),s);
 s=act(s,{type:'inspect',id:'drive_retained'});s=act(s,{type:'rising_exit',id:'rourke'});assert.equal(s.risingError,'pursue');assert.equal(s.stage,'rising_records');
 s=act(s,{type:'rising_exit',id:'east'});assert.equal(act(s,{type:'rising_outflow',id:'through'}),s);
 s=act(s,{type:'inspect',id:'van_impact'});assert.ok(!s.clues.includes('jonas_returns'));
 s=act(s,{type:'rising_outflow',id:'up'});assert.equal(s.risingError,'road');assert.equal(s.stage,'rising_drain');
 s=act(s,{type:'rising_outflow',id:'through'});assert.ok(s.clues.includes('jonas_returns'));assert.equal(s.stage,'rising_ledger');
 assert.equal(act(s,{type:'rising_interpret',id:'shell'}),s);
 for(const id of ['routing_marks','market_fragment'])s=act(s,{type:'inspect',id});
 s=act(s,{type:'rising_interpret',id:'whole'});assert.equal(s.risingError,'archive');assert.equal(s.stage,'rising_ledger');
 s=act(s,{type:'rising_interpret',id:'shell'});s=act(s,{type:'rising_fragment'});s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.risingMemory,1);assert.equal(act(s,{type:'rising_to_yard'}),s);
 for(let i=0;i<2;i++)s=act(s,{type:'rising_fragment'});assert.equal(act(s,{type:'rising_fragment'}),s);
 s=act(s,{type:'rising_to_yard'});assert.equal(act(s,{type:'rising_commit',id:'test'}),s);
 s=act(s,{type:'inspect',id:'offshore_lead'});s=act(s,{type:'rising_commit',id:'proven'});assert.equal(s.risingError,'certainty');assert.equal(s.stage,'rising_yard');
 s=act(s,{type:'rising_commit',id:'test'});assert.equal(s.stage,'rising_complete');
 for(const id of ['estate_ledger','marrow_memo','dependent_demand','prompted_recall','kars_return','split_access','offshore_lead'])assert.ok(s.clues.includes(id));
 assert.equal(s.carried.length,3);assert.equal(s.lenaItems.length,4);assert.deepEqual(restore(s),s);
});
test('Rising checkpoints reject malformed fragment progress and out-of-order actions',()=>{
 for(const value of [-1,4,0.5,'3'])assert.equal(restore({stage:'rising_recall',risingMemory:value}).risingMemory,0);
 const s=restore({stage:'house_complete',risingError:'invalid'});assert.equal(s.risingError,null);assert.equal(act(s,{type:'start_rising'}).stage,'rising_records');
 assert.equal(act(initialState(),{type:'start_rising'}).stage,'title');assert.equal(act(s,{type:'rising_commit',id:'test'}),s);
});
test('all archive scope previews remain uncommitted through the canonical interruption',()=>{
 for(const scope of ['selective','legal','brokers','internal','full']){
  let s=restore({stage:'rising_complete',clues:['estate_ledger','marrow_memo','dependent_demand','prompted_recall'],carried:['locker_key','codebook','anton'],lenaItems:['medication','keys','phone']});
  s=act(s,{type:'start_archive'});s=act(s,{type:'archive_travel',id:'public'});assert.equal(s.archiveError,'gate');assert.equal(s.stage,'archive_approach');
  s=act(s,{type:'archive_travel',id:'transfer'});assert.equal(act(s,{type:'archive_exception'}),s);
  for(const id of ['hale_platform','scar_variance'])s=act(s,{type:'inspect',id});s=act(s,{type:'archive_exception'});
  for(let i=0;i<3;i++)s=act(s,{type:'archive_response'});s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.archiveRecord,3);assert.equal(act(s,{type:'archive_enter'}),s);
  for(let i=0;i<3;i++)s=act(s,{type:'archive_response'});assert.ok(s.clues.includes('cognitive_record'));assert.equal(act(s,{type:'archive_response'}),s);
  s=act(s,{type:'archive_enter'});assert.equal(s.stage,'archive_files');assert.equal(act(s,{type:'archive_options'}),s);
  for(const id of ['integrity_check','north_span','release_recipients'])s=act(s,{type:'inspect',id});s=act(s,{type:'archive_options'});assert.equal(act(s,{type:'archive_prepare'}),s);
  s=act(s,{type:'archive_preview',id:'selective'});s=act(s,{type:'archive_preview',id:scope});assert.equal(s.releasePreview,scope);assert.equal(s.releaseCommitted,false);
  s=restore(JSON.parse(JSON.stringify(s)));s=act(s,{type:'archive_prepare'});assert.equal(s.stage,'archive_complete');assert.equal(s.releasePreview,scope);assert.equal(s.releaseCommitted,false);assert.ok(s.clues.includes('outer_room'));
  for(const id of ['estate_ledger','marrow_memo','prompted_recall','dependent_demand'])assert.ok(s.clues.includes(id));assert.equal(s.carried.length,3);assert.equal(s.lenaItems.length,3);assert.deepEqual(restore(s),s);
 }
});
test('archive save restoration rejects invalid progress, unknown scopes and forged committed state',()=>{
 for(const value of [-1,7,1.5,'6'])assert.equal(restore({stage:'archive_record',archiveRecord:value}).archiveRecord,0);
 const s=restore({stage:'archive_release',archiveError:'invalid',releasePreview:'unknown',releaseCommitted:true});
 assert.equal(s.archiveError,null);assert.equal(s.releasePreview,null);assert.equal(s.releaseCommitted,false);
 assert.equal(act(s,{type:'archive_preview',id:'unknown'}),s);assert.equal(act(s,{type:'archive_prepare'}),s);assert.equal(act(initialState(),{type:'start_archive'}).stage,'title');
});
test('Cost release preserves previews, gates packets and saves fictional receipts',()=>{
 for(const focus of ['coat','inhaler']){
 let s=restore({stage:'archive_complete',releasePreview:'full'});
 s=act(s,{type:'start_cost'});assert.equal(act(s,{type:'cost_explain'}),s);
 for(const id of ['remote_lockdown','reserve_branch'])s=act(s,{type:'inspect',id});
 s=act(s,{type:'cost_explain'});s=act(s,{type:'cost_recall',id:focus});assert.equal(act(s,{type:'cost_start_queue'}),s);
 s=act(s,{type:'cost_assign',id:'families',recipient:'watchdogs'});assert.equal(s.costError,'plan');assert.deepEqual(s.releasePlan,{});
 for(const [id,recipient] of Object.entries({financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}))s=act(s,{type:'cost_assign',id,recipient});
 s=act(s,{type:'cost_start_queue'});assert.equal(s.releaseCommitted,false);assert.deepEqual(restore(s),s);
 s=act(s,{type:'cost_retry'});assert.equal(s.releaseCommitted,true);assert.equal(s.executedRelease,'curated');assert.equal(s.releasePreview,'full');assert.deepEqual(restore(s),s);
 s=act(s,{type:'cost_copy'});assert.equal(act(s,{type:'cost_keep_key'}),s);s=act(s,{type:'inspect',id:'copy_key'});s=act(s,{type:'cost_keep_key'});assert.equal(s.copyKeyKept,true);
 s=act(s,{type:'cost_cover'});assert.equal(act(s,{type:'cost_finish'}),s);s=act(s,{type:'cost_receipt'});s=act(s,{type:'cost_finish'});assert.equal(s.stage,'cost_complete');assert.ok(s.clues.includes('export_status'));assert.deepEqual(restore(s),s);
 }
});
test('Cost restoration rejects unknown plans, invalid progress and earlier-stage commitments',()=>{
 assert.equal(act(initialState(),{type:'start_cost'}).stage,'title');
 for(const relayStep of [-1,5,1.5,'2'])assert.equal(restore({stage:'cost_queue',relayStep}).relayStep,0);
 assert.deepEqual(restore({stage:'cost_plan',releasePlan:{families:'watchdogs',unknown:'escrow'}}).releasePlan,{});
 for(const stage of ['archive_complete','cost_queue'])assert.equal(restore({stage,releaseCommitted:true,relayStep:2,releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}}).releaseCommitted,false);
});
test('Ashes branches gate sources, preserve curated receipts and establish the family reunion',()=>{
 for(const focus of ['listen','space']){
 let s=restore({stage:'cost_complete',relayStep:4,clues:['initial_receipts','export_status','copy_key'],copyKeyKept:true,releasePreview:'full',releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_ashes'});s=act(s,{type:'ashes_lower'});assert.ok(s.clues.includes('cradle_return'));assert.equal(act(s,{type:'ashes_leave'}),s);
 s=act(s,{type:'inspect',id:'harbor_recovery'});s=act(s,{type:'ashes_leave'});assert.equal(act(s,{type:'ashes_visit'}),s);
 s=act(s,{type:'inspect',id:'public_aftermath'});s=act(s,{type:'ashes_visit'});assert.ok(s.clues.includes('family_reunion'));
 s=act(s,{type:'ashes_respect',id:focus});assert.equal(act(s,{type:'ashes_docket'}),s);s=act(s,{type:'inspect',id:'cedar_return'});s=act(s,{type:'ashes_docket'});
 s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.releaseCommitted,true);assert.equal(s.copyKeyKept,true);assert.equal(s.releasePreview,'full');assert.equal(s.ashesFocus,focus);
 s=act(s,{type:'ashes_autumn'});assert.equal(act(s,{type:'ashes_assess',id:'temporary'}),s);s=act(s,{type:'inspect',id:'crooked_permit'});s=act(s,{type:'ashes_assess',id:'safe'});assert.equal(s.ashesError,'certainty');assert.equal(s.stage,'ashes_van');
 s=act(s,{type:'ashes_assess',id:'temporary'});assert.equal(s.stage,'ashes_complete');assert.deepEqual(restore(s),s);
 }
});
test('Ashes rejects out-of-order actions and malformed saved choices',()=>{
 assert.equal(act(initialState(),{type:'start_ashes'}).stage,'title');
 const s=restore({stage:'ashes_family',ashesFocus:'invalid',ashesError:'invalid'});assert.equal(s.ashesFocus,null);assert.equal(s.ashesError,null);assert.equal(act(s,{type:'ashes_respect',id:'unknown'}),s);
});
test('Permit dialogue branches preserve source gates, prior receipts and the unresolved car',()=>{
 for(const focus of ['van','copies']){
 let s=restore({stage:'ashes_complete',relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['copy_key','initial_receipts','family_reunion'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_permit'});assert.equal(act(s,{type:'permit_wait'}),s);s=act(s,{type:'inspect',id:'van_loop'});s=act(s,{type:'permit_wait'});assert.equal(act(s,{type:'permit_compare'}),s);
 for(const id of ['delmore_permit','service_credential'])s=act(s,{type:'inspect',id});s=act(s,{type:'permit_compare'});
 s=act(s,{type:'permit_infer',id:'identity'});assert.equal(s.stage,'permit_domestic');assert.equal(s.permitError,'identity');s=act(s,{type:'permit_infer',id:'lead'});s=act(s,{type:'permit_talk',id:focus});assert.equal(act(s,{type:'permit_open_last'}),s);
 s=act(s,{type:'inspect',id:'paul_box'});s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.releaseCommitted,true);assert.equal(s.copyKeyKept,true);assert.equal(s.permitFocus,focus);
 s=act(s,{type:'permit_open_last'});assert.ok(s.clues.includes('last_envelope'));s=act(s,{type:'permit_listen'});assert.equal(s.stage,'permit_complete');assert.ok(s.clues.includes('waiting_engine'));assert.deepEqual(restore(s),s);
 }
});
test('Permit rejects unsupported choices and out-of-order progression',()=>{
 assert.equal(act(initialState(),{type:'start_permit'}).stage,'title');
 const s=restore({stage:'permit_home',permitFocus:'invalid',permitError:'invalid'});assert.equal(s.permitFocus,null);assert.equal(s.permitError,null);assert.equal(act(s,{type:'permit_talk',id:'unknown'}),s);assert.equal(act(s,{type:'permit_listen'}),s);
});
test('Service Road branches gate evidence and preserve prior release and family records',()=>{
 for(const focus of ['timing','key']){
 let s=restore({stage:'permit_complete',relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['copy_key','initial_receipts','family_reunion','last_envelope'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_service'});assert.equal(act(s,{type:'service_carol'}),s);s=act(s,{type:'inspect',id:'sedan_watch'});s=act(s,{type:'service_carol'});assert.equal(act(s,{type:'service_depart',id:focus}),s);
 s=act(s,{type:'inspect',id:'clinic_claim'});s=act(s,{type:'service_depart',id:focus});assert.equal(act(s,{type:'service_listen'}),s);s=act(s,{type:'inspect',id:'relay_tin'});s=act(s,{type:'service_listen'});s=act(s,{type:'service_storage'});assert.equal(act(s,{type:'service_bundle'}),s);
 s=act(s,{type:'inspect',id:'survivability_sets'});s=act(s,{type:'service_bundle'});s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.releaseCommitted,true);assert.equal(s.copyKeyKept,true);assert.equal(s.serviceFocus,focus);assert.ok(s.clues.includes('witness_sleeve'));
 s=act(s,{type:'service_leave'});s=act(s,{type:'service_shelter'});s=act(s,{type:'service_assess',id:'ally'});assert.equal(s.serviceError,'trust');assert.equal(s.stage,'service_warning');s=act(s,{type:'service_assess',id:'uncertain'});assert.equal(s.stage,'service_complete');assert.ok(s.clues.includes('keane_warning'));assert.deepEqual(restore(s),s);
 }
});
test('Service Road rejects unknown choices and out-of-order actions',()=>{
 assert.equal(act(initialState(),{type:'start_service'}).stage,'title');
 const s=restore({stage:'service_carol',serviceFocus:'invalid',serviceError:'invalid'});assert.equal(s.serviceFocus,null);assert.equal(s.serviceError,null);assert.equal(act(s,{type:'service_depart',id:'unknown'}),s);assert.equal(act(s,{type:'service_shelter'}),s);
});
test('Notices branches gate drive sources and preserve unresolved testimony and prior saves',()=>{
 for(const focus of ['truth','agency']){
 let s=restore({stage:'service_complete',relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['copy_key','initial_receipts','witness_sleeve'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_notices'});s=act(s,{type:'notices_read'});assert.equal(act(s,{type:'notices_call'}),s);
 for(const id of ['paul_crosswalk','paul_audio','architect_claim'])s=act(s,{type:'inspect',id});s=act(s,{type:'notices_call'});s=act(s,{type:'notices_arrange'});s=act(s,{type:'notices_hear',id:focus});assert.equal(act(s,{type:'notices_assess',id:'claim'}),s);
 s=act(s,{type:'inspect',id:'keane_account'});s=act(s,{type:'notices_assess',id:'safe'});assert.equal(s.noticesError,'safety');assert.equal(s.stage,'notices_meeting');s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.noticesFocus,focus);assert.equal(s.releaseCommitted,true);assert.equal(s.copyKeyKept,true);
 s=act(s,{type:'notices_assess',id:'claim'});s=act(s,{type:'notices_cover'});assert.ok(s.clues.includes('route_card'));s=act(s,{type:'notices_trench'});assert.equal(s.stage,'notices_complete');assert.ok(s.clues.includes('weigh_attack'));assert.deepEqual(restore(s),s);
 }
});
test('Notices rejects unsupported choices, malformed saved fields and early entry',()=>{
 assert.equal(act(initialState(),{type:'start_notices'}).stage,'title');const s=restore({stage:'notices_lena',noticesFocus:'unknown',noticesError:'unknown'});assert.equal(s.noticesFocus,null);assert.equal(s.noticesError,null);assert.equal(act(s,{type:'notices_hear',id:'unknown'}),s);assert.equal(act(s,{type:'notices_trench'}),s);
});
test('White Truck rehearsal is recoverable, ordered and retained through both plan emphases',()=>{
 for(const focus of ['workers','paper']){
 let s=restore({stage:'notices_complete',relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['copy_key','initial_receipts','route_card'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_truck'});s=act(s,{type:'truck_leave'});assert.equal(act(s,{type:'truck_compare'}),s);s=act(s,{type:'inspect',id:'records_mirror'});s=act(s,{type:'truck_compare'});assert.equal(act(s,{type:'truck_rehearse'}),s);s=act(s,{type:'inspect',id:'mirror_node'});s=act(s,{type:'truck_rehearse'});assert.equal(act(s,{type:'truck_plan'}),s);
 s=act(s,{type:'truck_order',id:'witness'});assert.equal(s.truckError,'order');assert.deepEqual(s.truckOrder,[]);s=act(s,{type:'truck_order',id:'disposal'});s=restore(JSON.parse(JSON.stringify(s)));assert.deepEqual(s.truckOrder,['disposal']);assert.equal(s.releaseCommitted,true);
 for(const id of ['route','witness'])s=act(s,{type:'truck_order',id});assert.equal(act(s,{type:'truck_order',id:'witness'}),s);s=act(s,{type:'truck_plan'});s=act(s,{type:'truck_shift',id:focus});s=act(s,{type:'truck_login'});assert.equal(act(s,{type:'truck_breach'}),s);s=act(s,{type:'inspect',id:'black_file_index'});s=act(s,{type:'truck_breach'});s=act(s,{type:'truck_handshake'});assert.equal(s.stage,'truck_complete');assert.ok(s.clues.includes('courier_handshake'));assert.equal(s.releasePreview,'full');assert.equal(s.copyKeyKept,true);assert.deepEqual(restore(s),s);
 }
});
test('White Truck restore keeps only an ordered prefix and rejects unknown choices',()=>{
 assert.deepEqual(restore({stage:'truck_order',truckOrder:['disposal','witness','route']}).truckOrder,['disposal']);assert.deepEqual(restore({stage:'truck_order',truckOrder:['witness']}).truckOrder,[]);
 assert.equal(act(initialState(),{type:'start_truck'}).stage,'title');const s=restore({stage:'truck_plan',truckFocus:'invalid',truckError:'invalid'});assert.equal(s.truckFocus,null);assert.equal(s.truckError,null);assert.equal(act(s,{type:'truck_shift',id:'invalid'}),s);assert.equal(act(s,{type:'truck_handshake'}),s);
});
test('Collection Day protects story identifiers, preserves custody and retries the ninth output',()=>{
 let s=restore({stage:'truck_complete',relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['copy_key','initial_receipts','courier_handshake'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_collection'});for(const id of ['public','disposal']){s=act(s,{type:'collection_intent',id});assert.equal(s.stage,'collection_intent');assert.equal(s.collectionError,'intent');}
 s=act(s,{type:'collection_intent',id:'audit'});s=act(s,{type:'collection_clean',id:'drop'});assert.equal(s.stage,'collection_clean');assert.equal(s.collectionError,'custody');s=act(s,{type:'collection_clean',id:'retain'});assert.ok(s.clues.includes('substitute_chain'));assert.equal(act(s,{type:'collection_retry'}),s);
 for(let i=0;i<4;i++)s=act(s,{type:'collection_channel'});s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.collectionChannels,4);assert.equal(s.releaseCommitted,true);for(let i=0;i<4;i++)s=act(s,{type:'collection_channel'});
 assert.equal(act(s,{type:'collection_node'}),s);assert.equal(act(s,{type:'collection_channel'}),s);s=act(s,{type:'collection_retry'});assert.equal(s.collectionChannels,9);assert.equal(s.collectionRetried,true);assert.deepEqual(restore(s),s);
 s=act(s,{type:'collection_node'});s=act(s,{type:'collection_leave'});s=act(s,{type:'collection_aftermath'});assert.equal(act(s,{type:'collection_home'}),s);s=act(s,{type:'inspect',id:'family_shield'});s=act(s,{type:'collection_home'});s=act(s,{type:'collection_sign'});assert.equal(s.stage,'collection_complete');assert.ok(s.clues.includes('keane_absent'));assert.ok(s.clues.includes('field_trip'));assert.equal(s.releasePreview,'full');assert.equal(s.copyKeyKept,true);assert.deepEqual(restore(s),s);
});
test('Collection restore validates channel progress and refuses unrecorded ninth-channel success',()=>{
 for(const value of [-1,10,2.5,'9'])assert.equal(restore({stage:'collection_send',collectionChannels:value}).collectionChannels,0);
 const s=restore({stage:'collection_send',collectionChannels:9,collectionRetried:true,collectionError:'invalid'});assert.equal(s.collectionChannels,8);assert.equal(s.collectionRetried,false);assert.equal(s.collectionError,null);assert.equal(act(initialState(),{type:'start_collection'}).stage,'title');assert.equal(act(s,{type:'collection_node'}),s);assert.equal(act(s,{type:'collection_intent',id:'audit'}),s);
});
test('Blue Handle comparison and dialogue paths preserve history without confirming the module or author',()=>{
 for(const focus of ['pattern','lena']){
 let s=restore({stage:'collection_complete',collectionChannels:9,collectionRetried:true,relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['reserve_receipts','copy_key','initial_receipts','family_shield'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_blue'});s=act(s,{type:'blue_compare'});assert.equal(act(s,{type:'blue_home'}),s);s=act(s,{type:'blue_mark',id:'hinge'});assert.equal(act(s,{type:'blue_mark',id:'hinge'}),s);s=restore(JSON.parse(JSON.stringify(s)));assert.deepEqual(s.blueMarks,['hinge']);
 for(const id of ['wheel','crescent'])s=act(s,{type:'blue_mark',id});s=act(s,{type:'blue_home'});s=act(s,{type:'blue_mara',id:focus});assert.equal(act(s,{type:'blue_recovery'}),s);for(const id of ['retrieval_tickets','sarto_login'])s=act(s,{type:'inspect',id});s=act(s,{type:'blue_recovery'});s=act(s,{type:'blue_note'});assert.equal(act(s,{type:'blue_module'}),s);s=act(s,{type:'inspect',id:'blue_note'});s=act(s,{type:'blue_module'});s=act(s,{type:'blue_assess',id:'safe'});assert.equal(s.stage,'blue_module');assert.equal(s.blueError,'indicator');s=act(s,{type:'blue_assess',id:'untested'});assert.equal(s.stage,'blue_complete');assert.equal(s.blueFocus,focus);assert.equal(s.collectionChannels,9);assert.equal(s.releaseCommitted,true);assert.equal(s.copyKeyKept,true);assert.deepEqual(restore(s),s);
 }
});
test('Blue Handle restore filters malformed marks and choices and prevents early entry',()=>{
 const s=restore({stage:'blue_compare',blueMarks:['wheel','wheel','unknown','hinge'],blueFocus:'unknown',blueError:'unknown'});assert.deepEqual(s.blueMarks,['wheel','hinge']);assert.equal(s.blueFocus,null);assert.equal(s.blueError,null);assert.equal(act(s,{type:'blue_mark',id:'unknown'}),s);assert.equal(act(s,{type:'blue_assess',id:'untested'}),s);assert.equal(act(initialState(),{type:'start_blue'}).stage,'title');
});
test('Custodian source gates and log branches preserve earlier receipts and unresolved carrier',()=>{
 for(const focus of ['bridges','sightings']){
 let s=restore({stage:'blue_complete',collectionChannels:9,collectionRetried:true,relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['reserve_receipts','copy_key','initial_receipts','blue_note','dark_indicator'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_custodian'});assert.equal(act(s,{type:'custodian_trace'}),s);for(const id of ['sarto_notice','quill_assignment'])s=act(s,{type:'inspect',id});s=act(s,{type:'custodian_trace'});s=act(s,{type:'custodian_garland'});s=act(s,{type:'custodian_hear'});s=act(s,{type:'custodian_assess',id:'disarmed'});assert.equal(s.stage,'custodian_offer');assert.equal(s.custodianError,'trade');s=act(s,{type:'custodian_assess',id:'testimony'});s=act(s,{type:'custodian_review'});s=restore(JSON.parse(JSON.stringify(s)));assert.ok(s.clues.includes('held_node'));assert.equal(s.collectionChannels,9);assert.equal(s.releaseCommitted,true);
 s=act(s,{type:'custodian_log',id:focus});assert.equal(act(s,{type:'custodian_depart'}),s);s=act(s,{type:'inspect',id:'physical_carrier'});s=act(s,{type:'custodian_depart'});assert.equal(s.stage,'custodian_complete');assert.ok(s.clues.includes('hanover_secondary'));assert.equal(s.custodianFocus,focus);assert.equal(s.copyKeyKept,true);assert.deepEqual(restore(s),s);
 }
});
test('Custodian rejects malformed saved choices and out-of-order actions',()=>{
 const s=restore({stage:'custodian_log',custodianFocus:'invalid',custodianError:'invalid'});assert.equal(s.custodianFocus,null);assert.equal(s.custodianError,null);assert.equal(act(s,{type:'custodian_log',id:'invalid'}),s);assert.equal(act(s,{type:'custodian_depart'}),s);assert.equal(act(initialState(),{type:'start_custodian'}).stage,'title');
});
test('Dawn closing branches require verification and preserve campaign history through the ending',()=>{
 for(const focus of ['notice','route']){
 let s=restore({stage:'custodian_complete',collectionChannels:9,collectionRetried:true,relayStep:4,releasePreview:'full',copyKeyKept:true,clues:['reserve_receipts','copy_key','initial_receipts','hanover_secondary'],releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_dawn'});assert.equal(act(s,{type:'dawn_dispose'}),s);s=act(s,{type:'dawn_collect'});s=act(s,{type:'dawn_assess',id:'finished'});assert.equal(s.stage,'dawn_collected');assert.equal(s.dawnError,'collection');s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.releaseCommitted,true);assert.equal(s.collectionChannels,9);
 s=act(s,{type:'dawn_assess',id:'incomplete'});assert.ok(s.clues.includes('dawn_chain'));s=act(s,{type:'dawn_dispose'});s=act(s,{type:'dawn_farewell'});s=act(s,{type:'dawn_return',id:focus});assert.equal(s.stage,'dawn_complete');assert.equal(s.dawnFocus,focus);assert.ok(s.clues.includes('route_ending'));assert.equal(s.copyKeyKept,true);assert.equal(s.releasePreview,'full');assert.deepEqual(restore(s),s);
 }
});
test('Dawn rejects unsupported choices and out-of-sequence ending actions',()=>{
 const s=restore({stage:'dawn_farewell',dawnError:'invalid',dawnFocus:'invalid'});assert.equal(s.dawnError,null);assert.equal(s.dawnFocus,null);assert.equal(act(s,{type:'dawn_return',id:'invalid'}),s);assert.equal(act(initialState(),{type:'start_dawn'}).stage,'title');assert.equal(act(initialState(),{type:'dawn_return',id:'route'}).stage,'title');
});
test('generated routes are deterministic, varied and contain only supported tasks and answers',()=>{
 const {getRoute,ANSWERS}=require('./routes');const seen=new Set();
 for(let n=1;n<=1000;n++){const route=getRoute(n);assert.deepEqual(route,getRoute(n));assert.ok(route.stops.length>=5&&route.stops.length<=8);assert.ok(new Set(route.stops.map(s=>s.id)).size>=5);for(const stop of route.stops)assert.ok(ANSWERS.some(([id])=>id===stop.answer));seen.add(JSON.stringify(route.stops));}
 assert.equal(seen.size,1000);assert.equal(getRoute(1).stops.length,5);assert.equal(getRoute(10).stops.length,8);
});
test('recurring shifts recover mistakes, resume saves and continue without losing campaign evidence',()=>{
 const {getRoute,ANSWERS}=require('./routes');let s=restore({stage:'dawn_complete',clues:['route_ending','copy_key','initial_receipts'],copyKeyKept:true,relayStep:4,releasePreview:'full',releasePlan:{financial:'watchdogs',north:'press_court',corruption:'rivals',families:'escrow'}});
 s=act(s,{type:'start_routes'});assert.equal(act(s,{type:'route_next'}),s);
 for(let shift=1;shift<=25;shift++){
 const route=getRoute(s.routeNumber,s.routeVersion),wrong=ANSWERS.find(([id])=>id!==route.stops[0].answer)[0];s=act(s,{type:'route_decide',id:wrong});assert.equal(s.routeMistakes,1);s=act(s,{type:'route_decide',id:wrong});assert.equal(s.routeMistakes,1);s=restore(JSON.parse(JSON.stringify(s)));
 for(const stop of route.stops){if(s.routeLoad+require('./routes').pickupLoad(stop.answer,stop)>require('./routes').TRUCK_CAPACITY)s=act(s,{type:'route_unload'});s=act(s,{type:'route_decide',id:stop.answer});s=restore(JSON.parse(JSON.stringify(s)));}if(s.routeLoad)s=act(s,{type:'route_unload'});
 assert.equal(s.stage,'route_complete');assert.equal(s.routesCompleted,shift);assert.equal(s.releaseCommitted,true);assert.equal(s.copyKeyKept,true);assert.ok(s.clues.includes('route_ending'));assert.equal(s.releasePreview,'full');assert.equal(act(s,{type:'route_decide',id:'collect'}),s);s=act(s,{type:'route_next'});assert.equal(s.routeNumber,shift+1);assert.equal(s.routeStop,0);assert.equal(s.routeMistakes,0);
 }
});
test('route restoration filters invalid counters and unavailable actions cannot skip work',()=>{
 const s=restore({stage:'route_active',routeNumber:-1,routeStop:100,routeMistakes:-1,routesCompleted:'2',routeError:'unknown'});assert.equal(s.routeNumber,1);assert.equal(s.routeStop,0);assert.equal(s.routeMistakes,0);assert.equal(s.routesCompleted,0);assert.equal(s.routeError,null);assert.equal(act(s,{type:'route_decide',id:'unknown'}),s);assert.equal(act(initialState(),{type:'start_routes'}).stage,'title');
});

test('truck capacity blocks overfilling without consuming a stop or recording a mistake',()=>{
 const {getRoute,pickupLoad,TRUCK_CAPACITY}=require('./routes');let s=restore({stage:'route_active',routeNumber:10});
 for(const stop of getRoute(10).stops){
 const before=s.routeStop,previousMistakes=s.routeMistakes;
 if(s.routeLoad+pickupLoad(stop.answer)>TRUCK_CAPACITY){
  s=act(s,{type:'route_decide',id:stop.answer});assert.equal(s.routeStop,before);assert.equal(s.routeMistakes,previousMistakes);assert.equal(s.routeLoadError,true);s=restore(JSON.parse(JSON.stringify(s)));assert.equal(s.routeLoadError,true);
  const visits=s.routeDepotVisits;s=act(s,{type:'route_unload'});assert.equal(s.routeStop,before);assert.equal(s.routeLoad,0);assert.equal(s.routeDepotVisits,visits+1);assert.equal(s.routeLoadError,false);
 }
 s=act(s,{type:'route_decide',id:stop.answer});assert.ok(s.routeLoad<=TRUCK_CAPACITY);
 }
 if(s.routeLoad){assert.equal(s.routesCompleted,0);assert.equal(act(s,{type:'route_next'}),s);s=act(s,{type:'route_unload'});}
 assert.equal(s.routesCompleted,1);assert.equal(act(s,{type:'route_unload'}),s);s=act(s,{type:'route_next'});assert.equal(s.routeLoad,0);assert.equal(s.routeDepotVisits,0);
});
test('depot visits preserve mistakes and route position and invalid load saves are filtered',()=>{
 for(const routeLoad of [-1,4,1.5,'2'])assert.equal(restore({stage:'route_active',routeLoad}).routeLoad,0);
 let s=restore({stage:'route_active',routeLoad:2,routeMistakes:1,routeStop:2,routeError:'invalid',routeDepotVisits:5});s=act(s,{type:'route_unload'});assert.equal(s.routeStop,2);assert.equal(s.routeMistakes,1);assert.equal(s.routeDepotVisits,6);assert.deepEqual(restore(s),s);
 assert.equal(restore({stage:'route_active',routeDepotVisits:-1}).routeDepotVisits,0);assert.equal(restore({stage:'route_active',routeLoad:0,routeLoadError:true}).routeLoadError,false);assert.equal(act(initialState(),{type:'route_unload'}).stage,'title');
});

test('expanded route version has ten task types and supports one-unit planning without changing legacy sheets',()=>{
 const {getRoute,pickupLoad}=require('./routes');const tasks=new Set();
 for(let n=1;n<=100;n++)for(const stop of getRoute(n,2).stops){tasks.add(stop.id);assert.ok([0,1,2].includes(stop.load));assert.equal(pickupLoad(stop.answer,stop),stop.load);}
 assert.equal(tasks.size,10);assert.equal(new Set(Array.from({length:100},(_,i)=>getRoute(i+1,1).stops).flat().map(s=>s.id)).size,6);
 let s=restore({stage:'route_active',routeNumber:10,routeVersion:2,routeLoad:2});const stops=getRoute(10,2).stops;const i=stops.findIndex(s=>s.load===1);assert.ok(i>=0);s=restore({...s,routeStop:i});s=act(s,{type:'route_decide',id:stops[i].answer});assert.equal(s.routeLoad,3);assert.equal(s.routeStop,i+1);assert.equal(s.routeMistakes,0);
});
test('old recurring saves keep their original route until the next shift upgrades the generator',()=>{
 const {getRoute}=require('./routes');let s=restore({stage:'route_active',routeNumber:4,routeStop:2});assert.equal(s.routeVersion,1);assert.deepEqual(getRoute(s.routeNumber,s.routeVersion),getRoute(4,1));
 s=restore({...s,stage:'route_complete',routeLoad:0});s=act(s,{type:'route_next'});assert.equal(s.routeVersion,2);assert.equal(s.routeNumber,5);assert.deepEqual(restore(s),s);assert.equal(initialState().routeVersion,2);
});
test('career ratings and streaks record once only after the shift is fully unloaded',()=>{
 const {getRoute}=require('./routes');let s=restore({stage:'route_active',routeNumber:1});
 function finish(mistakes){const length=getRoute(s.routeNumber,s.routeVersion).stops.length;s=restore({...s,stage:'route_complete',routeStop:length,routeLoad:2,routeMistakes:mistakes});const before=s.routesCompleted;assert.equal(act(s,{type:'route_next'}),s);s=act(s,{type:'route_unload'});assert.equal(s.routesCompleted,before+1);const saved=s;assert.equal(act(s,{type:'route_unload'}),saved);assert.deepEqual(restore(s),s);}
 finish(0);assert.equal(s.routeStreak,1);assert.equal(s.routeBestStreak,1);assert.equal(s.routeHistory.length,1);assert.equal(s.routeHistory[0].depotVisits,1);
 s=act(s,{type:'route_next'});finish(0);assert.equal(s.routeStreak,2);assert.equal(s.routeBestStreak,2);s=act(s,{type:'route_next'});finish(1);assert.equal(s.routeStreak,0);assert.equal(s.routeBestStreak,2);
 for(let i=0;i<5;i++){s=act(s,{type:'route_next'});finish(0);}assert.equal(s.routeHistory.length,5);assert.equal(s.routeStreak,5);assert.equal(s.routeBestStreak,5);assert.equal(s.routesCompleted,8);
});
test('career also records a final zero-load stop and preserves older completed totals without inventing results',()=>{
 const {getRoute}=require('./routes');let route,number;for(number=1;number<100;number++){route=getRoute(number,2);if(route.stops.at(-1).load===0)break;}
 let s=restore({stage:'route_active',routeVersion:2,routeNumber:number,routeStop:route.stops.length-1,routeLoad:0,routesCompleted:7});s=act(s,{type:'route_decide',id:route.stops.at(-1).answer});assert.equal(s.routesCompleted,8);assert.equal(s.routeStreak,1);assert.equal(s.routeHistory.length,1);assert.equal(s.routeHistory[0].depotVisits,0);
 const old=restore({stage:'route_complete',routesCompleted:25});assert.equal(old.routesCompleted,25);assert.equal(old.routeHistory.length,0);assert.equal(old.routeStreak,0);
});
test('career restore bounds history and counters and computes ratings from validated corrections',()=>{
 const {restoreCareer,rating}=require('./career');const record={number:1,version:2,corrections:1,depotVisits:2,stops:999};const c=restoreCareer({routeStreak:3,routeBestStreak:1,routeHistory:[null,{...record,number:-1},...Array(9).fill(record)]});assert.equal(c.routeHistory.length,5);assert.equal(c.routeHistory[0].stops,5);assert.equal(c.routeBestStreak,3);assert.equal(restoreCareer({routeStreak:-1,routeBestStreak:'5'}).routeStreak,0);assert.equal(rating(0),'Clear shift');assert.equal(rating(1),'Steady shift');assert.equal(rating(2),'Shift resolved');
});
test('dispatch depot target matches exhaustive optimal unloading for fixed-order load sequences',()=>{
 const {minimumDepotVisits}=require('./dispatch');
 function optimal(loads,index=0,aboard=0){if(index===loads.length)return aboard>0?1:0;const load=loads[index];let best=aboard+load<=3?optimal(loads,index+1,aboard+load):Infinity;if(aboard>0)best=Math.min(best,1+optimal(loads,index+1,load));return best;}
 for(let length=0;length<=6;length++)for(let code=0;code<3**length;code++){let n=code;const loads=Array.from({length},()=>{const v=n%3;n=Math.floor(n/3);return v;});assert.equal(minimumDepotVisits(loads),optimal(loads));}
});
test('dispatch goals remain pending until unload and never block a missed-target completion',()=>{
 const {getRoute,pickupLoad}=require('./routes');const {getBriefing,getGoals}=require('./dispatch');const route=getRoute(10,2),brief=getBriefing(route);assert.equal(brief.pickupStops+brief.nonPickupStops,route.stops.length);assert.ok(brief.depotTarget>0);assert.deepEqual(getGoals(route,0,0,false),{depotTarget:brief.depotTarget,clear:null,planned:null});assert.equal(getGoals(route,1,brief.depotTarget,true).clear,false);assert.equal(getGoals(route,0,brief.depotTarget+1,true).planned,false);
 let s=restore({stage:'route_active',routeNumber:10,routeVersion:2,routeDepotVisits:brief.depotTarget+1});for(const stop of route.stops){if(s.routeLoad+pickupLoad(stop.answer,stop)>3)s=act(s,{type:'route_unload'});s=act(s,{type:'route_decide',id:stop.answer});}if(s.routeLoad)s=act(s,{type:'route_unload'});assert.equal(s.routesCompleted,1);assert.equal(s.routeStreak,1);assert.equal(act(s,{type:'route_next'}).stage,'route_active');assert.deepEqual(restore(s),s);
});
function memoryStorage(entries={}){const data=new Map(Object.entries(entries));return {data,getItem:async key=>data.has(key)?data.get(key):null,setItem:async(key,value)=>{data.set(key,value);}};}
test('save loading accepts legacy progress and recovers a valid backup from corrupt or unknown primary',async()=>{
 const {PRIMARY,BACKUP,loadProgress}=require('./saves');const backup=JSON.stringify({stage:'route_active',routeNumber:10,routeVersion:2,routeStop:3,clues:['route_ending']});
 for(const invalid of ['broken json',JSON.stringify({stage:'unknown'})]){const result=await loadProgress(memoryStorage({[PRIMARY]:invalid,[BACKUP]:backup}));assert.equal(result.recovered,true);assert.equal(result.state.routeStop,3);}
 const main=await loadProgress(memoryStorage({[PRIMARY]:JSON.stringify({stage:'dawn_complete'}) ,[BACKUP]:backup}));assert.equal(main.state.stage,'dawn_complete');assert.equal(main.recovered,false);
});
test('save rotation keeps the previous valid snapshot and cannot replace it with corrupt text',async()=>{
 const {PRIMARY,BACKUP,saveProgress,loadProgress}=require('./saves');const storage=memoryStorage();const a=initialState(),b=act(a,{type:'start'});await saveProgress(storage,a);await saveProgress(storage,b);assert.equal(JSON.parse(storage.data.get(BACKUP)).stage,'title');await saveProgress(storage,b);assert.equal(JSON.parse(storage.data.get(BACKUP)).stage,'title');storage.data.set(PRIMARY,'corrupt');await saveProgress(storage,b);assert.equal(JSON.parse(storage.data.get(BACKUP)).stage,'title');assert.equal((await loadProgress(storage)).state.stage,'street');
});
test('a failed primary write leaves a recoverable snapshot and a failed backup write preserves primary',async()=>{
 const {PRIMARY,BACKUP,saveProgress,loadProgress}=require('./saves');const storage=memoryStorage({[PRIMARY]:JSON.stringify(initialState())});const write=storage.setItem;storage.setItem=async(key,value)=>{if(key===PRIMARY)throw Error('disk full');return write(key,value);};await assert.rejects(saveProgress(storage,act(initialState(),{type:'start'})));assert.equal((await loadProgress(storage)).state.stage,'title');assert.equal(JSON.parse(storage.data.get(BACKUP)).stage,'title');
 storage.setItem=async()=>{throw Error('disk full');};await assert.rejects(saveProgress(storage,act(initialState(),{type:'start'})));assert.equal(JSON.parse(storage.data.get(PRIMARY)).stage,'title');
});
test('confirmed reset replaces both save slots rather than reviving old campaign progress',async()=>{
 const {PRIMARY,BACKUP,saveProgress,loadProgress}=require('./saves');const old=JSON.stringify({stage:'dawn_complete'});const storage=memoryStorage({[PRIMARY]:old,[BACKUP]:old});await saveProgress(storage,initialState(),{reset:true});storage.data.set(PRIMARY,'broken');assert.equal((await loadProgress(storage)).state.stage,'title');
});
test('unreadable storage fails visibly while a new installation loads the opening',async()=>{
 const {PRIMARY,BACKUP,loadProgress,parseSave}=require('./saves');assert.equal((await loadProgress(memoryStorage())).state.stage,'title');await assert.rejects(loadProgress(memoryStorage({[PRIMARY]:'broken',[BACKUP]:'broken'})));await assert.rejects(loadProgress({getItem:async()=>{throw Error('unavailable');}}));for(const raw of ['null','[]','{}','42'])assert.equal(parseSave(raw),null);
});
test('reading settings apply without changing story, route, load or career progress and survive restoration',()=>{
 let s=restore({stage:'route_active',routeNumber:10,routeVersion:2,routeStop:3,routeLoad:2,routesCompleted:7,clues:['route_ending']});const before=s;s=act(s,{type:'reading_setting',id:'large',value:true});s=act(s,{type:'reading_setting',id:'reduced',value:true});assert.equal(s.readerLarge,true);assert.equal(s.readerReduced,true);assert.deepEqual({...s,readerLarge:false,readerReduced:false},before);assert.deepEqual(restore(s),s);assert.equal(act(s,{type:'reading_setting',id:'unknown',value:true}),s);assert.equal(act(s,{type:'reading_setting',id:'large',value:'true'}),s);
});
test('legacy and malformed reading preferences use standard text and device motion defaults',()=>{
 const s=restore({stage:'title',readerLarge:'true',readerReduced:1});assert.equal(s.readerLarge,false);assert.equal(s.readerReduced,false);let next=act(initialState(),{type:'reading_setting',id:'large',value:true});next=act(next,{type:'reading_setting',id:'large',value:false});assert.equal(next.readerLarge,false);
});
test('notebook search includes only recorded notes, handles source labels and leaves evidence order intact',()=>{
 const {findNotes}=require('./notebook');const ids=['reflections','keane_account','route_ending','reflections','unknown'];const copy=[...ids];assert.deepEqual(findNotes(ids).map(n=>n.id),['reflections','keane_account','route_ending']);assert.deepEqual(findNotes(ids,'',true).map(n=>n.id),['route_ending','keane_account','reflections']);assert.deepEqual(ids,copy);assert.equal(findNotes(ids,'Toby').some(n=>n.id==='keane_account'),true);assert.equal(findNotes(['reflections'],'Toby').length,0);assert.equal(findNotes(ids,'keane testimony')[0].id,'keane_account');
});
test('notebook search normalizes punctuation and accents and supports empty or unmatched queries',()=>{
 const {findNotes}=require('./notebook');const ids=['keane_account','route_ending'];assert.equal(findNotes(ids,"Kéane's").length,1);assert.equal(findNotes(ids,'KEANE’S').length,1);assert.equal(findNotes(ids,'  ').length,2);assert.equal(findNotes(ids,'not-present-zzzzz').length,0);assert.deepEqual(findNotes(null,'Toby'),[]);assert.equal(findNotes(ids,'Keane certainly solved every problem').length,0);
});
test('progress overview maps all 23 reached scene groups without showing future scene titles',()=>{
 const {getProgress}=require('./progress');const prefixes=['opening','yard','mercer','fire','dead','escape','station','wife','memory','static','house','rising','archive','cost','ashes','permit','service','notices','truck','collection','blue','custodian','dawn'];
 prefixes.forEach((prefix,index)=>{const state=prefix==='opening'?'street':prefix+'_arrival';const info=getProgress(state);assert.equal(info.scene,index+1);assert.equal(info.reached.length,index+1);assert.equal(info.completed,index);const finished=getProgress(prefix==='opening'?'complete':prefix+'_complete');assert.equal(finished.completed,index+1);assert.equal(finished.reached.at(-1).complete,true);});assert.equal(getProgress('title').completed,0);
});
test('recurring progress reports the completed campaign while overview derivation cannot mutate a save',()=>{
 const {getProgress}=require('./progress');const s=restore({stage:'route_active',routeNumber:10,routeStop:3,routeLoad:2});const before=JSON.stringify(s);const info=getProgress(s.stage);assert.equal(info.recurring,true);assert.equal(info.completed,23);assert.equal(info.reached.length,23);assert.equal(JSON.stringify(s),before);assert.equal(getProgress('unknown').scene,1);
});
test('offline web preparation caches only local web resources and uses relative deployment paths',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const {prepareOffline}=require('./scripts/offline-web');const root=fs.mkdtempSync(path.join(os.tmpdir(),'garbage-man-web-'));
 try{fs.mkdirSync(path.join(root,'dist','_expo','static','js','web'),{recursive:true});fs.mkdirSync(path.join(root,'web-assets'));fs.writeFileSync(path.join(root,'dist','index.html'),'<head></head><body><script src="/_expo/static/js/web/game.js"></script></body>');fs.writeFileSync(path.join(root,'dist','_expo','static','js','web','game.js'),'const game=1;');for(const size of [192,512])fs.writeFileSync(path.join(root,'web-assets',`icon-${size}.png`),'icon');const first=prepareOffline(root);const html=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.ok(html.includes('src="./_expo/'));assert.ok(first.resources.every(file=>!file.includes('android')&&!file.includes('ios')&&!file.startsWith('http')));const second=prepareOffline(root);assert.equal(first.revision,second.revision);fs.writeFileSync(path.join(root,'dist','_expo','static','js','web','game.js'),'const game=2;');assert.notEqual(prepareOffline(root).revision,first.revision);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('portable backup roundtrips validated route, evidence, career and reading preferences',()=>{
 const {createBackup,inspectBackup}=require('./transfer');const s=restore({stage:'route_active',routeNumber:10,routeVersion:2,routeStop:3,routeLoad:2,routesCompleted:7,routeStreak:2,routeBestStreak:4,readerLarge:true,readerReduced:true,clues:['route_ending','copy_key'],routeHistory:[{number:9,version:2,corrections:0,depotVisits:2}]});assert.deepEqual(inspectBackup(createBackup(s)),s);assert.deepEqual(inspectBackup('  '+createBackup(s)+'  '),s);
});
test('portable backup rejects incomplete, altered, oversized and unsupported envelopes without touching current state',()=>{
 const {createBackup,inspectBackup,MAX_BACKUP_CHARS}=require('./transfer');const s=initialState(),before=JSON.stringify(s),valid=createBackup(s),envelope=JSON.parse(valid);for(const text of ['partial',valid.slice(0,-4),JSON.stringify({...envelope,version:2}),JSON.stringify({...envelope,data:envelope.data+'x'}),'x'.repeat(MAX_BACKUP_CHARS+1)])assert.throws(()=>inspectBackup(text));assert.equal(JSON.stringify(s),before);assert.throws(()=>inspectBackup(JSON.stringify({stage:'title'})));
});
test('portable export contains only sanitized game state and is a stable snapshot',()=>{
 const {createBackup,inspectBackup}=require('./transfer');let s=initialState();const code=createBackup({...s,unexpected:'not exported',readerLarge:'true'});s=act(s,{type:'start'});const imported=inspectBackup(code);assert.equal(imported.stage,'title');assert.equal(imported.readerLarge,false);assert.equal(Object.hasOwn(imported,'unexpected'),false);assert.equal(s.stage,'street');
});
