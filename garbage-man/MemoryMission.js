import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
const EXCERPTS=[
 {label:'01 · IDENTIFICATION',text:'“This is for the record. I am Adrian Vale.”',note:'Malcolm recognizes the damaged, hoarse voice as his own.'},
 {label:'02 · THE RECORDED REQUEST',text:'“If I wake without recall, that is preferable to waking with access.”',note:'The recording preserves a statement. It does not provide a full account of the circumstances around it.'},
 {label:'03 · KARS',text:'“I broke the line on purpose.”',note:'The voice says Kars was the lock, not the failure. Mara’s reaction is immediate.'},
 {label:'04 · THROUGH THE INTERFERENCE',text:'“Names in the static.”',note:'Fragments point beyond the ledger toward carrier traffic and dead channels. The recording does not supply the material itself.'},
];
function Recorder(){return <View style={{height:189,padding:19,marginVertical:22,borderRadius:6,backgroundColor:'#555c4a',borderWidth:6,borderColor:'#77806b'}}><Text style={{color:'#dedbc1',fontSize:8,letterSpacing:1.5}}>VALE, A. / SESSION 12</Text><View style={{height:77,marginTop:14,backgroundColor:'#25382c',borderWidth:3,borderColor:'#94977a',flexDirection:'row',alignItems:'center',justifyContent:'space-around'}}>{[0,1].map(i=><View key={i} style={{width:48,height:48,borderRadius:24,borderWidth:9,borderColor:'#b0af8d',backgroundColor:'#3b4d37'}}/>)}</View><Text style={{color:'#d8d7ba',fontSize:8,letterSpacing:1.5,marginTop:15}}>HISTORICAL RECORDING · TRANSCRIPT VIEW</Text></View>;}
function Clinic(){return <View style={{height:182,marginVertical:22,backgroundColor:'#3e4e41',overflow:'hidden',borderRadius:5}}><View style={{position:'absolute',left:0,right:0,bottom:0,height:58,backgroundColor:'#293e31'}}/>{[23,115,207].map(x=><View key={x} style={{position:'absolute',left:x,top:30,width:76,height:112,borderWidth:6,borderColor:'#737c66',backgroundColor:'#263b2d'}}><View style={{height:1,top:22,backgroundColor:'#939a7f'}}/><View style={{height:1,top:43,backgroundColor:'#939a7f'}}/></View>)}<View style={{position:'absolute',left:48,right:39,bottom:12,height:49,backgroundColor:'#77795b',borderTopWidth:6,borderTopColor:'#a4a083'}}/><View style={{position:'absolute',right:54,top:51,width:5,height:57,backgroundColor:'#a5a384'}}/><View style={{position:'absolute',right:44,top:45,width:25,height:14,backgroundColor:'#b2ad7e',borderRadius:7}}/><Text style={{position:'absolute',left:15,top:11,fontSize:8,color:'#d7d7bf',letterSpacing:1.6}}>NORTH CLINIC / BELOW THE WAITING ROOM</Text></View>;}
export default function MemoryMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const stand=state.stage==='memory_standoff',archive=state.stage==='memory_archive',hale=state.stage==='memory_hale',tape=state.stage==='memory_tape',escape=state.stage==='memory_escape',box=state.stage==='memory_case';
 const clue=(id,title)=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'Inspect '+title} onPress={()=>inspect(id)} style={s.clueButton}><Text style={{color:paper}}>{state.clues.includes(id)?'✓':'＋'}  {title}</Text><Text style={{color:gold}}>↗</Text></Pressable>;
 return <>
  <Label>SCENE 09 · {stand?'THE MEMORY TRAP':archive?'MEDCONTAINMENT':hale?'SOREN HALE':tape?'SESSION 12':escape?'THE CLINIC ESCAPE':box?'THE LOCKED COMPARTMENT':'CASE NOTE 009'}</Label><View style={{marginTop:12}}><Label>PLAY AS MALCOLM GRAVES</Label></View>
  <Text style={s.title}>{stand?'He wants you\nin his car.':archive?'A name hidden\nin the paperwork.':hale?'Someone survived.\nSomeone decided.':tape?'Your voice.\nBefore this life.':escape?'The clinic\nis not forgotten.':box?'A label is\nnot an explanation.':'Lena was seen.\nWhat did she know?'}</Text>
  {stand?<>
   <Text style={s.body}>Keane holds the road at gunpoint. He tells you to get in. Mara warns that you would disappear. Lena’s shoe lies between the cars. You ask for an answer before giving him anything.</Text>
   <View style={s.card}><Label>THE QUESTION YOU CAN ASK</Label><Text style={s.body}>Keane knows the name Adrian Vale. That does not mean his assurances can be trusted.</Text></View>
   <Button onPress={()=>send({type:'memory_question',id:'lena'})}>ASK WHETHER LENA WILL STAY ALIVE</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'memory_question',id:'purpose'})}>ASK WHY HE NEEDS YOU ALIVE</Button>
  </>:archive?<>
   <Text style={s.body}>{state.memoryFocus==='lena'?'Keane’s hesitation is no assurance of Lena’s safety.':'What he wants from you remains tied to what you cannot remember.'} The standoff breaks into violence. You and Mara escape in the damaged car. Later, stopped by a supply yard, she opens the drive again. Anger cannot tell you where the SUV went. Records might provide the next lead.</Text>
   <View style={s.card}><Label>BLACK HARBOR / MEDCONTAINMENT</Label><Text style={s.cardTitle}>Site 4 · North Clinic</Text><Text style={s.body}>An old order names HALE, S. An audio note describes a patient too unstable to transfer and instructions to keep the truth from him.</Text></View>
   {clue('med_order','the Site 4 order')}{clue('transfer_audio','the transfer recording transcript')}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('med_order')||!state.clues.includes('transfer_audio')} onPress={()=>send({type:'memory_clinic'})}>FOLLOW THE NORTH CLINIC LEAD →</Button>
  </>:hale?<>
   <Text style={s.body}>The clinic looks abandoned. Your reactions to its corridors say otherwise. In a lit basement, Soren Hale sees you and says you were not meant to return as yourself. Mara confronts him. You ask about Turkey.</Text><Clinic/>
   <View style={s.card}><Label>HALE’S FIRST ACCOUNT</Label><Text style={s.body}>He says you survived the bridge and were moved through prolonged care. He describes Malcolm Graves as a constructed identity. When you ask whether the loss came from injury or intervention, he says both.</Text></View>
   {clue('hale_injury','Hale’s survival account')}
   <View style={s.card}><Label>THE CLAIM THAT CHANGES THE ROOM</Label><Text style={s.dialogue}>“Yours.”</Text><Text style={s.body}>Asked whose choice the suppression was, Hale attributes it to you. He says Adrian feared being used for what he remembered. Mara challenges his account. He has a recording.</Text></View>
   {clue('hale_choice','Hale’s account of the decision')}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('hale_injury')||!state.clues.includes('hale_choice')} onPress={()=>send({type:'memory_recording'})}>EXAMINE SESSION 12 →</Button>
  </>:tape?<>
   <Text style={s.body}>The cassette is labeled PRE-SUPPRESSION CONSENT. You ask Hale to play it. The old voice is familiar, but the record cannot give back every condition under which it was made.</Text><Recorder/>
   {EXCERPTS.slice(0,state.memorySegments).map(part=><View key={part.label} style={s.card}><Label>{part.label}</Label><Text style={s.dialogue}>{part.text}</Text><Text style={s.body}>{part.note}</Text></View>)}
   {state.memorySegments<4?<Button onPress={()=>send({type:'memory_excerpt'})}>READ THE NEXT EXCERPT · {state.memorySegments+1}/4</Button>:<>
    <Text style={[s.body,{marginBottom:20}]}>There are other sessions. Mara moves to take the records. Above the basement, more than one vehicle arrives.</Text><Button onPress={()=>send({type:'memory_pursuit'})}>TAKE THE RECORDS AND MOVE →</Button>
   </>}
  </>:escape?<>
   <Text style={s.body}>Mara gathers the recording and remaining tapes into a hard case. Hale leads you into a service tunnel as men enter the clinic. At the loading-dock hatch, boots move above you. The first exit is covered.</Text>
   <View style={s.card}><Label>HALE’S OTHER BRANCH</Label><Text style={s.body}>He admits there is a flooded linen-return branch. It is a difficult alternative to opening the hatch beneath the footsteps.</Text></View>
   {state.memoryError==='dock'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Someone is standing on the hatch. This exit is covered. Ask Hale for the alternate branch.</Text>}
   <Button onPress={()=>send({type:'memory_route',id:'flooded'})}>TAKE THE ALTERNATE BRANCH</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'memory_route',id:'dock'})}>TRY THE LOADING-DOCK HATCH</Button>
  </>:box?<>
   <Text style={s.body}>You emerge beyond the annex. Hale admits his own failsafe may have exposed the clinic. Pressed further, he describes a person as a lock on the missing memory. You name Lena. He does not know whether her connection was arranged. Pursuit drives you beneath the bridge and into a stripped pump house.</Text>
   <View style={s.card}><Label>HALE’S HARD CASE</Label><Text style={s.body}>After another taunt from Keane, Hale points to session notes in the case. A smaller locked compartment holds index cards, a folded photograph and a microcassette.</Text></View>
   {clue('spousal_vector','the spousal-vector label')}
   <View style={s.card}><Label>THE FOLDED PHOTOGRAPH</Label><Text style={s.cardTitle}>INITIAL CONTACT VIABLE</Text><Text style={s.body}>Lena leaves an office, laughing at something outside the frame. Farther back, you are watching her. The caption continues: SUBJECT DISPLAYS UNSCRIPTED INTEREST.</Text></View>
   {clue('contact_photo','the contact photograph')}
   <View style={{height:20}}/><Label>WHAT DOES THIS ESTABLISH?</Label>
   {state.memoryError==='complicit'&&<Text accessibilityLiveRegion="polite" style={s.notice}>The photograph shows observation and an annotation. Hale admits uncertainty. Neither proves Lena knew about the operation. The cassette has not been played.</Text>}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('spousal_vector')||!state.clues.includes('contact_photo')} onPress={()=>send({type:'memory_inference',id:'observed'})}>OUR CONTACT WAS OBSERVED. HER KNOWLEDGE IS UNCLEAR.</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('spousal_vector')||!state.clues.includes('contact_photo')} onPress={()=>send({type:'memory_inference',id:'complicit'})}>LENA MUST HAVE KNOWN EVERYTHING</Button>
  </>:<>
   <Text style={s.body}>The pump-house door gives under the pursuit. Mara moves with the records. You carry the photograph and a question the caption cannot answer. Hale’s account has changed the shape of the past, but Lena is still out of reach.</Text>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>KEEP THE SOURCES DISTINCT</Label><Text style={s.cardTitle}>A voice. A claim. A photograph.</Text><Text style={s.body}>Session 12 is recorded. Hale’s explanation is testimony. The photograph documents observation. GRAVES / SPOUSAL VECTOR is a cassette label whose contents remain unheard.</Text></View>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>Names in the Static</Text><Text style={s.body}>The cassette needs a player. The pursuit has not given you a quiet room.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_static'})}>CONTINUE TO NAMES IN THE STATIC →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE CLINIC RECORDS</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY ALL NINE SCENES</Button>
  </>}
 </>;
}
