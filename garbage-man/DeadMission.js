import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
function Vault({open=false,inspect=()=>{},clues=[]}){
 const items=[{id:'termination',name:'termination order',x:29,y:45,icon:'≡',color:'#c7b995'},{id:'anton',name:'the physical passport',x:124,y:45,icon:'▣',color:'#516571'},{id:'locker_key',name:'the key tagged 247',x:29,y:133,icon:'247',color:'#a56852'},{id:'codebook',name:'the oilskin notebook',x:124,y:133,icon:'▤',color:'#565c43'}];
 return <View style={{height:255,marginVertical:22,backgroundColor:'#364039',borderRadius:5,overflow:'hidden'}}>
  {open?<View style={{position:'absolute',left:29,right:29,top:15,bottom:15,backgroundColor:'#202a26',borderWidth:8,borderColor:'#5f5e49',borderRadius:6}}>{items.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={'Inspect '+item.name} onPress={()=>inspect(item.id)} style={{position:'absolute',left:item.x,top:item.y-28,width:74,height:72,alignItems:'center',justifyContent:'center',backgroundColor:item.color,borderRadius:3,borderWidth:clues.includes(item.id)?2:0,borderColor:gold}}><Text style={{fontSize:item.id==='locker_key'?16:27,color:paper}}>{clues.includes(item.id)?'✓':item.icon}</Text></Pressable>)}</View>:<>
   <View style={{position:'absolute',left:'15%',top:30,width:220,height:195,backgroundColor:'#718073',borderWidth:10,borderColor:'#454e43',borderRadius:95}}><View style={{position:'absolute',left:55,top:40,width:90,height:90,borderRadius:45,borderWidth:7,borderColor:'#39463d'}}><View style={{position:'absolute',left:31,top:8,width:7,height:62,backgroundColor:'#39463d'}}/><View style={{position:'absolute',top:35,left:8,width:61,height:7,backgroundColor:'#39463d'}}/></View></View>
   <Text style={{position:'absolute',top:13,left:13,fontSize:8,color:paper,letterSpacing:2}}>CALDER & MERROW / B2</Text>
  </>}
 </View>;
}
export default function DeadMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const door=state.stage==='dead_door',bank=state.stage==='dead_bank',box=state.stage==='dead_box';
 const items=[['termination','The authorization'],['anton','The physical passport'],['locker_key','The key tagged 247'],['codebook','The oilskin notebook']];
 const ready=items.every(([id])=>state.clues.includes(id));
 const clue=(id,title,disabled=false)=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'Read '+title} disabled={disabled} onPress={()=>inspect(id)} style={[s.clueButton,disabled&&{opacity:0.35}]}><Text style={{color:paper}}>{state.clues.includes(id)?'✓':'＋'}  {title}</Text><Text style={{color:gold}}>↗</Text></Pressable>;
 return <>
  <Label>SCENE 05 · {door?'HANOVER STREET':bank?'CALDER & MERROW':box?'THE CONTINGENCY CASE':'CASE NOTE 005'}</Label>
  <View style={{marginTop:12}}><Label>PLAY AS MALCOLM GRAVES</Label></View>
  <Text style={s.title}>{door?'The key is\nalready in the door.':bank?'A bank that\nremembers the dead.':box?'Someone packed\nfor this day.':'The past has\na paper trail.'}</Text>
  {door?<>
   <Text style={s.body}>You have groceries in one hand and your front-door key in the other. Lena moves inside the house. Mara steps out between parked cars and tells you not to go in. She says the feeds are gone and her interest has exposed yours.</Text>
   <View style={s.card}><Label>WHAT YOU CARRY FROM CEDAR</Label><Text style={s.body}>{state.fireRecall==='supply'?'Her earlier suggestions have made it harder to separate your fragments from her expectations. You need something outside either person’s memory.':'The fragments came in your own words, but they still do not tell you who you were. You need something outside your memory.'}</Text></View>
   <Text style={[s.body,{marginBottom:22}]}>She offers a different destination: a contingency Adrian Vale prepared. You leave the groceries where Lena will find them. Whatever this is, it does not get to swallow your whole life.</Text>
   <Button onPress={()=>send({type:'dead_depart',id:'one_hour'})}>ONE HOUR. THEN I GO HOME.</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'dead_depart',id:'ask'})}>ASK WHAT SHE EXPECTS TO FIND</Button>
  </>:bank?<>
   <Text style={s.body}>{state.deadChoice==='ask'?'Mara calls it a contingency, not an answer. You agree to one hour.':'Mara accepts your limit.'} At Calder & Merrow Private Trust, the name in the appointment is Daniel Foss. Ms. Bell recognizes Mara’s activation card. She says the vault requires a second confirmation.</Text><Vault/>
   {clue('activation','the paper activation')}
   <Text style={[s.body,{marginVertical:15}]}>After recording the paper stage, continue to Bell’s sealed-marker confirmation.</Text>
   {clue('marker','the sealed-marker confirmation',!state.clues.includes('activation'))}
   {state.clues.includes('marker')&&<View style={s.card}><Label>CONFIRMED BY BELL</Label><Text style={s.body}>She compares the scar beside your left ear with a sealed card. Then she brings a black case to a private room. Twenty minutes. A wall phone if you need longer.</Text></View>}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('activation')||!state.clues.includes('marker')} onPress={()=>send({type:'dead_open'})}>OPEN THE CONTINGENCY CASE →</Button>
  </>:box?<>
   <Text style={s.body}>The latches feel familiar under your thumbs. Inside: oilskin notebooks, old currencies, envelopes, a passport, a brass key, and a folded sheet with a red stamp. You reach for the paper before Mara can.</Text><Vault open inspect={inspect} clues={state.clues}/>
   <Label>EXAMINE THE FOUR LEADS</Label><View style={{height:15}}/>{items.map(([id,title])=>clue(id,title))}
   {state.clues.includes('termination')&&<View style={s.card}><Label>FIELD TERMINATION AUTHORIZATION</Label><Text style={s.cardTitle}>Subject: Adrian Vale</Text><Text style={s.body}>Compromised / non-recoverable.{ '\n'}Directorate-level clearance.{ '\n'}Signature: Nathan Rourke.</Text></View>}
   {state.clues.includes('anton')&&<View style={s.card}><Label>THE DOCUMENT, NOT THE FRAGMENT</Label><Text style={s.dialogue}>Anton Eberhardt</Text><Text style={s.body}>Your younger face. A dark-blue passport. A name you still cannot remember. Unlike the earlier fragment, this is something you can hold.</Text></View>}
   <View style={{height:20}}/><Label>WHICH LEAD HAS A DESTINATION?</Label><Text style={[s.body,{marginVertical:15}]}>The notebook needs decoding. Mara recognizes the key’s red tag as Union Station’s old locker system. Decide which lead can be followed next.</Text>
   {state.deadLead==='decode'&&<Text accessibilityLiveRegion="polite" style={s.notice}>You can keep the notebook, but its numbers do not yet provide an address. The red-tagged key offers a concrete next destination.</Text>}
   {state.deadLead==='home'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Home is the life you want to protect. It does not explain the case or the missing footage. Identify the lead before deciding how to reach it.</Text>}
   <Button disabled={!ready} onPress={()=>send({type:'dead_lead',id:'station'})}>THE KEY: UNION STATION, LOCKER 247</Button><View style={{height:12}}/><Button secondary disabled={!ready} onPress={()=>send({type:'dead_lead',id:'decode'})}>THE NOTEBOOK ALREADY GIVES AN ADDRESS</Button><View style={{height:12}}/><Button secondary disabled={!ready} onPress={()=>send({type:'dead_lead',id:'home'})}>THE CASE POINTS BACK TO HANOVER</Button>
  </>:<>
   <Text style={s.body}>You have a passport, an authorization, an undecoded notebook and a key. Mara’s theory has become a set of objects. None of them gives back the years you cannot remember.</Text>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>NEXT LEAD</Label><Text style={s.cardTitle}>Union Station · 247</Text><Text style={s.body}>A destination to investigate, once you can leave the bank.</Text></View>
   <View style={s.card}><Label>A SOUND IN THE CORRIDOR</Label><Text style={s.body}>Several sets of footsteps. Softer than Bell’s. They stop and start with intention. The wall phone stays silent. Mara hears it too.</Text><Text style={[s.caption,{marginTop:15}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_escape'})}>CONTINUE TO THE BANK ESCAPE →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE PHYSICAL EVIDENCE</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY ALL FIVE SCENES</Button>
  </>}
 </>;
}
