import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
const RESPONSES=[
 {prompt:'STATE OPERATION NAME.',response:'Black Harbor.',note:'The operation has a name. The archive still asks what happened.'},
 {prompt:'STATE FAILURE CONDITION.',response:'Containment breach.',note:'The bridge returns with orders, vehicles and people the paperwork treated as cargo.'},
 {prompt:'WHY WAS RECOVERY NOT COMPLETED?',response:'The order changed: kill everyone on the bridge.',note:'Adrian says the order came from his own side. The mission as written could not survive what he saw.'},
 {prompt:'STATE ACTION TAKEN.',response:'I broke the line to stop the sale.',note:'He describes triggering the demolition before the transfer completed. The statement is not a claim that every life was saved.'},
 {prompt:'WHY MEMORY SUPPRESSION?',response:'To make access unusable under coercion—and protect the people tied to it.',note:'Lena hears him address the life on Hanover as part of the choice, not something outside it.'},
 {prompt:'DO YOU ACCEPT RESTORATION OF RECORD?',response:'Yes.',note:'Adrian acknowledges refusal of the directive and his deliberate choice. Restoring record means owning the history, not instantly repairing every missing memory.'},
];
const SCOPES=[
 ['selective','Selective packet','A bounded selection of evidence; omissions need scrutiny.'],
 ['legal','Legal tranche','A legal-evidence path; the archive offers it separately from a full dump.'],
 ['brokers','Broker identities','Focus on broker identities, with consequences for people connected to them.'],
 ['internal','Internal corruption','Focus on Directorate corruption rather than every linked operation.'],
 ['full','Full dump','The broadest exposure, including names whose publication could endanger others.'],
];
function Terminal({children,label='ARCHIVE / STATUS'}){return <View style={{marginVertical:22,padding:21,backgroundColor:'#152a21',borderWidth:6,borderColor:'#5e7054',borderRadius:6}}><Text style={{fontSize:8,color:'#aebc91',letterSpacing:1.8,marginBottom:18}}>{label}</Text>{children}</View>;}
export default function ArchiveMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const approach=state.stage==='archive_approach',door=state.stage==='archive_door',record=state.stage==='archive_record',files=state.stage==='archive_files',release=state.stage==='archive_release';
 const clue=(id,title)=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'Inspect '+title} onPress={()=>inspect(id)} style={s.clueButton}><Text style={{color:paper}}>{state.clues.includes(id)?'✓':'＋'}  {title}</Text><Text style={{color:gold}}>↗</Text></Pressable>;
 return <>
  <Label>SCENE 13 · {approach?'THE DEAD MAN’S ARCHIVE':door?'THE INNER DOOR':record?'CONTINGENT CONFIRMATION':files?'NORTH SPAN':release?'RELEASE OPTIONS':'THE INTERRUPTED RELEASE'}</Label><View style={{marginTop:12}}><Label>PLAY AS ADRIAN VALE / MALCOLM GRAVES</Label></View>
  <Text style={s.title}>{approach?'Not the\npublic entrance.':door?'Healing has\nchanged the key.':record?'The record\nasks for the choice.':files?'The bridge\nis on the screen.':release?'Exposure has\nmore than one scope.':'Someone else\nhas insurance.'}</Text>
  {approach?<>
   <Text style={s.body}>The first cart will not start. The second carries the group out of the freight yard and into the waste district. Lena keeps the ledger. The official plant gate lies up one branch. The narrower transfer road leads toward the place you remember.</Text>
   <Terminal label="THE REMEMBERED LOCATION"><Text style={[s.dialogue,{fontSize:24,marginVertical:0}]}>Waste plant behind you.{ '\n'}Transfer platform offshore.</Text><Text style={[s.body,{marginTop:15}]}>The lead is the private transfer facility, not the public office.</Text></Terminal>
   {state.archiveError==='gate'&&<Text accessibilityLiveRegion="polite" style={s.notice}>The public gate is not the recalled archive entrance. Follow the transfer-facility lead.</Text>}
   <Button onPress={()=>send({type:'archive_travel',id:'transfer'})}>FOLLOW THE TRANSFER ROAD</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'archive_travel',id:'public'})}>TAKE THE PUBLIC PLANT ENTRANCE</Button>
  </>:door?<>
   <Text style={s.body}>A tug takes the group from a sheltered slip to the offshore platform. Hale waits there. He claims he was followed, not that he led the pursuit. Mara challenges him. Inside the transfer module, the old access path leads to a featureless black door.</Text>
   {clue('hale_platform','Hale at the platform')}
   <Terminal><Text style={{fontFamily:'monospace',fontSize:18,color:'#c6d8a8',lineHeight:28}}>REJECT.{ '\n'}SCAR MAP VARIANCE.</Text><Text style={[s.body,{marginTop:15}]}>The primary match fails. Hale activates the contingent confirmation designed into the system.</Text></Terminal>
   {clue('scar_variance','the degraded primary match')}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('hale_platform')||!state.clues.includes('scar_variance')} onPress={()=>send({type:'archive_exception'})}>CONTINUE TO THE CONTINGENT RECORD →</Button>
  </>:record?<>
   <Text style={s.body}>The screen asks for more than a name. Adrian answers through the bridge, the changed order, his refusal and the life that followed. Mara and Lena remain beside him as pursuit reaches the platform.</Text>
   {RESPONSES.slice(0,state.archiveRecord).map(part=><Terminal key={part.prompt} label={part.prompt}><Text style={[s.dialogue,{marginTop:0}]}>{part.response}</Text><Text style={s.body}>{part.note}</Text></Terminal>)}
   {state.archiveRecord<6?<Button onPress={()=>send({type:'archive_response'})}>READ ADRIAN’S RESPONSE · {state.archiveRecord+1}/6</Button>:<>
    <Text style={[s.body,{marginBottom:20}]}>The door unlocks. Adrian and Malcolm remain the same person, with a history neither name can make disappear.</Text><Button onPress={()=>send({type:'archive_enter'})}>ENTER THE ARCHIVE →</Button>
   </>}
  </>:files?<>
   <Text style={s.body}>The sealed room contains insulated cabinets, older storage racks and a central console. The record opens. It is time to compare the system’s status with what the files actually show.</Text>
   <Terminal><Text style={{fontFamily:'monospace',fontSize:14,color:'#c6d8a8',lineHeight:25}}>ARMED / DORMANT{ '\n'}LAST INTEGRITY CHECK: 17 HOURS PRIOR{ '\n'}RELEASE OPTIONS AVAILABLE</Text></Terminal>
   {clue('integrity_check','the prior integrity check')}
   <View style={s.card}><Label>MASS EVENT / NORTH SPAN · FOOTAGE REVIEW</Label><Text style={s.body}>Recorded frames place Rourke on the bridge with brokers. The sound includes the containment order. The sequence shows Adrian at the detonation lead and the blast. What was remembered now has recorded material beside it.</Text></View>
   {clue('north_span','the North Span footage review')}
   <View style={s.card}><Label>CONTINGENCY RELEASE LIST</Label><Text style={s.body}>Journalists, prosecutors, anti-corruption offices and relay destinations. The console offers more than one path. Looking at a list is not the same as sending it.</Text></View>
   {clue('release_recipients','the release directory')}
   <View style={{height:18}}/><Button disabled={!['integrity_check','north_span','release_recipients'].every(id=>state.clues.includes(id))} onPress={()=>send({type:'archive_options'})}>REVIEW RELEASE SCOPES →</Button>
  </>:release?<>
   <Text style={s.body}>The outer hatch takes repeated impacts. Keane’s voice warns about families named in the records. Lena refuses to let concern for Rourke become another reason to protect him. Review a scope before deciding what exposure would mean.</Text>
   <View style={s.notice}><Text style={{color:paper,fontSize:12,lineHeight:21}}>Preview only. No packet has been released. You can change the scope while reviewing.</Text></View>
   {SCOPES.map(([id,name,description])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'Preview '+name} accessibilityState={{selected:state.releasePreview===id}} onPress={()=>send({type:'archive_preview',id})} style={[s.card,{marginVertical:6,borderColor:state.releasePreview===id?gold:'#344137'}]}><View style={s.row}><Text style={{color:paper,fontFamily:'Georgia',fontSize:22,flex:1}}>{name}</Text><Text style={{color:gold}}>{state.releasePreview===id?'✓':'＋'}</Text></View><Text style={[s.body,{fontSize:12,marginTop:10}]}>{description}</Text></Pressable>)}
   <View style={{height:18}}/><Button disabled={!state.releasePreview} onPress={()=>send({type:'archive_prepare'})}>CONTINUE THE SCOPE REVIEW →</Button>
  </>:<>
   <Text style={s.body}>Before a release completes, the monitor forces an incoming view over the files. Men enter the outer module with Keane. Rourke stands at their center, removes his gloves and looks up at the camera.</Text>
   <Terminal label="OUTER MODULE / INCOMING VIEW"><Text style={s.dialogue}>“You’re not the only dead man with insurance.”</Text></Terminal>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>REVIEWED, NOT RELEASED</Label><Text style={s.cardTitle}>{SCOPES.find(([id])=>id===state.releasePreview)?.[1] || 'Release scope'}</Text><Text style={s.body}>Your preview is saved. The archive is open, but no release has completed. Rourke’s arrival interrupts the decision. Toby’s location remains unresolved.</Text></View>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>The Cost of Returning</Text><Text style={s.body}>The people outside the inner archive have a plan of their own.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_cost'})}>THE COST OF RETURNING →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE ARCHIVE EVIDENCE</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY THE INVESTIGATION</Button>
  </>}
 </>;
}
