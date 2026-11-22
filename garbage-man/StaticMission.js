import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
const PEOPLE=[['BN','Branislav Novak','Belgrade · archived asset review'],['IC','Idris Celik','Izmir · archived incident reference'],['PS','Petra Salonen','Turku · archived consultant record']];
const PARTS=[
 {label:'01 · OBSERVATIONAL LANGUAGE',quote:'“Vector remains stable… no direct prompt… child presence increases retention.”',body:'The phrasing treats people as variables. It names no present location.'},
 {label:'02 · HALE’S VOICE',quote:'“Attachment responses without formal reinforcement.”',body:'The recording recommends observational distance. Mara reads this as evidence that the attachment was not entirely scripted.'},
 {label:'03 · THE SECOND SEGMENT',quote:'“I consented. I asked for the cut.”',body:'Malcolm recognizes his own voice. It refers to compartmentalization and a domestic scaffold. Jonas cannot supply a reliable recording date.'},
 {label:'04 · THE PEOPLE NAMED',quote:'“Lena and her son Toby.”',body:'The voice describes fear that they would become leverage. Malcolm remembers ordinary days with Toby. The tape does not tell him where the boy is now.'},
];
function Workshop(){return <View style={{height:190,backgroundColor:'#35483b',borderRadius:5,marginVertical:22,overflow:'hidden'}}><View style={{position:'absolute',left:17,top:28,width:117,height:99,backgroundColor:'#6c775d',borderWidth:7,borderColor:'#879077',borderRadius:8}}><View style={{height:63,backgroundColor:'#23372d',borderRadius:12}}/><View style={{height:3,width:47,backgroundColor:'#adb08d',marginTop:9}}/></View><View style={{position:'absolute',right:18,top:47,width:155,height:81,backgroundColor:'#5f6c51',borderWidth:5,borderColor:'#909479'}}><View style={{height:40,margin:8,backgroundColor:'#22372a',flexDirection:'row',alignItems:'center',justifyContent:'space-evenly'}}>{[0,1].map(i=><View key={i} style={{width:25,height:25,borderRadius:13,borderWidth:5,borderColor:'#acaf8b'}}/>)}</View></View><View style={{position:'absolute',bottom:0,left:0,right:0,height:49,backgroundColor:'#7c7e5e',borderTopWidth:8,borderTopColor:'#a8a183'}}/><Text style={{position:'absolute',left:16,top:10,fontSize:8,color:'#dedcc0',letterSpacing:1.4}}>APEX RADIO & TELEVISION SERVICE</Text></View>;}
export default function StaticMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const arrival=state.stage==='static_arrival',cards=state.stage==='static_cards',tape=state.stage==='static_tape',axis=state.stage==='static_axis',receiver=state.stage==='static_receiver';
 const target=PEOPLE.find(([key])=>!state.nameMatches[key]);
 const clue=(id,title,disabled=false)=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'Inspect '+title} disabled={disabled} onPress={()=>inspect(id)} style={[s.clueButton,disabled&&{opacity:0.35}]}><Text style={{color:paper}}>{state.clues.includes(id)?'✓':'＋'}  {title}</Text><Text style={{color:gold}}>↗</Text></Pressable>;
 return <>
  <Label>SCENE 10 · {arrival?'NAMES IN THE STATIC':cards?'THE INDEX CARDS':tape?'SPOUSAL VECTOR':axis?'THE ASH LEDGER':receiver?'TWO LEADS AND A DEMAND':'CASE NOTE 010'}</Label><View style={{marginTop:12}}><Label>PLAY AS MALCOLM GRAVES</Label></View>
  <Text style={s.title}>{arrival?'Someone can\nread the old tape.':cards?'Not every number\nis a date.':tape?'The people\ninside the terminology.':axis?'What is missing\nhas a shape.':receiver?'A loop. A lead.\nA voice that is new.':'The microphone\nwaits between you.'}</Text>
  {arrival?<>
   <Text style={s.body}>The flight from the pump house brings you to Apex Radio & Television Service. Jonas Reeve opens the door. He recognizes the microcassette and warns that a damaged tape can lose material on playback. You have held its label long enough. Its contents need careful recovery.</Text><Workshop/>
   <Button onPress={()=>send({type:'static_hand_over',id:'entrust'})}>GIVE JONAS THE CASSETTE</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'static_hand_over',id:'limits'})}>ASK WHAT HE CAN RECOVER</Button>
  </>:cards?<>
   <Text style={s.body}>{state.staticApproach==='limits'?'Jonas says he can try to read it, not promise that every sound will survive. You hand it over.':'Jonas takes the cassette to his bench.'} While he works, you spread the index cards and notebook beside the Black Harbor archive. Mara begins with dates. The number groups pull your attention elsewhere.</Text>
   <View style={s.card}><Label>NOTEBOOK GROUPS</Label><Text style={[s.dialogue,{fontFamily:'monospace',fontSize:20}]}>7.125 / 5{ '\n'}9.440 / 2{ '\n'}6.990 / 4</Text></View>
   {!state.clues.includes('frequency_groups')?<>
    {state.staticError==='dates'&&<Text accessibilityLiveRegion="polite" style={s.notice}>These groups do not resolve as calendar entries. Malcolm identifies bands and intervals: radio frequencies, not dates.</Text>}
    <Button onPress={()=>send({type:'static_interpret',id:'frequencies'})}>FREQUENCIES AND INTERVALS</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'static_interpret',id:'dates'})}>CALENDAR DATES</Button>
   </>:<>
    <View style={s.card}><Label>CROSS-REFERENCE THE COPIED ARCHIVE</Label>{PEOPLE.map(([key,name,detail])=><View key={key} style={{paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#344137'}}><Text style={{color:paper,fontSize:14}}>{name}</Text><Text style={s.caption}>{detail}</Text></View>)}</View>
    {target?<>
     <Label>CURRENT INDEX CARD · {target[0][0]}.{target[0][1]}.</Label><Text style={[s.body,{marginVertical:15}]}>Choose the matching archived name. Correct matches stay recorded.</Text>
     {state.staticError==='match'&&<Text accessibilityLiveRegion="polite" style={s.notice}>That name does not match this card’s initials. Compare the current card with the archived names and try again.</Text>}
     {PEOPLE.map(([key,name])=><View key={key} style={{marginBottom:10}}><Button secondary onPress={()=>send({type:'static_match',initials:target[0],id:name})}>{name.toUpperCase()}</Button></View>)}
    </>:<>
     <Text style={[s.body,{marginBottom:20}]}>The matched files connect reassignments, transfer records and reported deaths. The pattern is larger than one missing name. Jonas has recovered speech from the cassette.</Text><Button onPress={()=>send({type:'static_listen'})}>REVIEW THE RECOVERED TRANSCRIPT →</Button>
    </>}
   </>}
  </>:tape?<>
   <Text style={s.body}>Jonas recovers sections through the interference. Read the speakers separately. The technical language is about people you know; it does not get to replace them.</Text><Workshop/>
   {PARTS.slice(0,state.staticSegments).map(part=><View key={part.label} style={s.card}><Label>{part.label} · TRANSCRIPT</Label><Text style={s.dialogue}>{part.quote}</Text><Text style={s.body}>{part.body}</Text></View>)}
   {state.staticSegments<4?<Button onPress={()=>send({type:'static_excerpt'})}>READ THE RECOVERED SECTION · {state.staticSegments+1}/4</Button>:<>
    <Text style={[s.body,{marginBottom:20}]}>Mara distinguishes observation from complete fabrication. It is an interpretation of what survived, not proof of every choice Lena made or every part of the relationship. Toby’s present location remains unknown.</Text><Button onPress={()=>send({type:'static_axis'})}>RETURN TO THE MISSING PAGES →</Button>
   </>}
  </>:axis?<>
   <Text style={s.body}>The notebook has pages carefully removed near the spine. Marks on the index cards align into a different order. With the surviving archive, they connect storage contracts, transit tags and accounts—links closed after use.</Text>
   <View style={s.card}><Label>THE SURVIVING MARGIN NOTE</Label><Text style={s.dialogue}>Ash ledger.</Text><Text style={s.body}>Mara thinks this is the original Vale took. Your fragments offer soot, a freight office and a book. They do not yet give you a complete location.</Text></View>
   {clue('ash_ledger','the Ash ledger reference')}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('ash_ledger')} onPress={()=>send({type:'static_receiver'})}>COMPARE THE TWO LEADS →</Button>
  </>:receiver?<>
   <View style={s.card}><Label>THE FAMILY LEAD</Label><Text style={s.cardTitle}>Carol Mendez · Millbrook</Text><Text style={s.body}>Jonas reports a likely address for Lena’s sister and a short incoming call with no captured voice. It is a lead toward Toby, not confirmation he is there.</Text></View>
   {clue('millbrook_lead','the Millbrook lead')}
   <View style={s.card}><Label>THE REPEATING SIGNAL · TRANSCRIPT</Label><Text style={[s.dialogue,{fontSize:22}]}>ASH / UNION{ '\n'}Y D / WEST ANNEX / SUB B</Text><Text style={s.body}>Jonas identifies a loop. Malcolm connects the fragments to the old freight annex and a relay room below it. The loop cannot promise that the site is safe.</Text></View>
   {clue('loop_signal','the repeating annex signal')}
   <View style={s.card}><Label>A NEW PROCESSED VOICE · TRANSCRIPT</Label><Text style={s.body}>“Deliver proof of life for dependent pair and receive relay coordinates.”</Text><Text style={[s.body,{marginTop:12}]}>This is new, not merely the old loop. Mara interprets the request as a bid for leverage. Who is speaking, and who actually holds whom, remain unverified.</Text></View>
   {clue('dependent_demand','the new proof-of-life demand',!state.clues.includes('millbrook_lead')||!state.clues.includes('loop_signal'))}
   {state.staticError==='custody'&&<Text accessibilityLiveRegion="polite" style={s.notice}>The message asks for proof. It does not provide it. Neither the message nor the Millbrook lead confirms that Lena and Toby are held together.</Text>}
   <View style={{height:18}}/><Button disabled={!['millbrook_lead','loop_signal','dependent_demand'].every(id=>state.clues.includes(id))} onPress={()=>send({type:'static_inference',id:'unconfirmed'})}>THE DEMAND DOES NOT CONFIRM BOTH CAPTURES</Button><View style={{height:12}}/><Button secondary disabled={!['millbrook_lead','loop_signal','dependent_demand'].every(id=>state.clues.includes(id))} onPress={()=>send({type:'static_inference',id:'both_captive'})}>THEY HAVE DEFINITELY CAPTURED BOTH</Button>
  </>:<>
   <Text style={s.body}>You want the receiver to travel. Mara weighs the ledger against the people who might be used to reach it. Jonas places a microphone on the table. Before the decision becomes an answer, tires slow outside the service lane. Footsteps reach the loading bay.</Text>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>KEEP BOTH LEADS OPEN</Label><Text style={s.cardTitle}>Millbrook. The west annex.</Text><Text style={s.body}>The cassette has been reviewed. The Ash ledger is still a lead. The recording date, Toby’s present location, the new speaker’s identity and custody of the dependent pair remain unresolved.</Text></View>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>The House with No Corners</Text><Text style={s.body}>The next move takes Malcolm and Mara into a different kind of perimeter.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_house'})}>CONTINUE TO THE HOUSE WITH NO CORNERS →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE STATIC NOTES</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY ALL TEN SCENES</Button>
  </>}
 </>;
}
