import React from 'react';
import {Pressable,Text,View} from 'react-native';
const C={paper:'#e5e2cd',muted:'#9ca699',gold:'#c9b77c',line:'#344137'};
function YardScene(){return <View style={{height:230,backgroundColor:'#737969',overflow:'hidden',borderRadius:5,marginVertical:20}}>
 <View style={{position:'absolute',left:25,right:25,top:40,height:129,backgroundColor:'#5c6254',borderTopWidth:18,borderTopColor:'#3d4b42'}}/>
 {[45,132,219].map(x=><View key={x} style={{position:'absolute',left:x,top:80,width:64,height:89,backgroundColor:'#283b34',borderWidth:4,borderColor:'#8b8c73'}}/>)}
 <View style={{position:'absolute',left:0,right:0,bottom:0,height:65,backgroundColor:'#414b42'}}/>
 <View style={{position:'absolute',left:0,right:0,top:133,height:5,backgroundColor:'#aaa48a'}}/>
 {[12,70,128,186,244,302].map(x=><View key={x} style={{position:'absolute',left:x,top:112,height:100,width:2,backgroundColor:'#a4ab92',opacity:0.7}}/>)}
 <View style={{position:'absolute',right:22,bottom:0,width:72,height:92,backgroundColor:'#687563',borderTopWidth:8,borderTopColor:'#34483a'}}><View style={{margin:9,height:30,backgroundColor:'#263a32'}}/></View>
 <View style={{position:'absolute',left:35,bottom:67,width:173,height:23,backgroundColor:'#c7bf9b',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:8,letterSpacing:1,fontWeight:'800',color:'#384334'}}>COUNTY SANITATION · DISPATCH</Text></View>
 <Text style={{position:'absolute',top:13,left:15,fontSize:8,letterSpacing:2,color:'#f0ead1'}}>INDUSTRIAL AVENUE / 11:06</Text>
 </View>;}
export default function YardMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const gates=state.stage==='yard_gate',board=state.stage==='yard_board',records=state.stage==='yard_records';
 const rows=[{id:'maple',route:'MAPLE / BRIAR',crew:'Chen / Moreno'},{id:'cedar',route:'CEDAR / RIDGE / LATHAM',crew:'Ortiz / Graves'},{id:'briar',route:'INDUSTRIAL / SOUTH LOOP',crew:'Bell / Sykes'}];
 return <>
  <Label>SCENE 02 · {gates?'THE SANITATION YARD':board?'ROUTE ASSIGNMENTS':records?'THE LIBRARY ANNEX':'FIELD NOTE 002'}</Label>
  <Text style={s.title}>{gates?'Ordinary places.\nUnfinished questions.':board?'A surname\non a board.':records?'A life written\nin ordinary records.':'Malcolm Graves.\nA lead, not an answer.'}</Text>
  {gates?<>
   <Text style={s.body}>Diesel, hot rubber, wet concrete. Mara stops outside the county yard. Beyond the gate, workers move between bays. Somewhere in that routine is a name.</Text>
   <YardScene/>
   <View style={s.card}><Label>YOUR EARLIER CHOICE</Label><Text style={s.body}>{state.approach==='direct'?'Malcolm noticed your interest on Cedar. Asking about him by description could make that interest easier to remember.':'You left the conversation on Cedar unhurried. There is no reason to turn a quiet question into a spectacle now.'}</Text></View>
   <Text style={[s.body,{marginBottom:20}]}>Choose how to approach dispatch. Both approaches can move the investigation forward.</Text>
   <Button onPress={()=>send({type:'yard_entry',id:'reception'})}>ASK AT RECEPTION</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'yard_entry',id:'wait'})}>WAIT FOR THE MORNING CHANGEOVER</Button>
  </>:board?<>
   <Text style={s.body}>{state.yardApproach==='reception'?'The receptionist points to the assignments visible from the visitor counter. Routes first. People second.':'At changeover, a clerk steps to the visitor counter. Mara asks which routes cover Cedar. The board behind him is already the answer.'}</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Inspect the route grouping" onPress={()=>inspect('route')} style={s.clueButton}><Text style={{color:C.paper}}>{state.clues.includes('route')?'✓':'＋'}  Inspect Cedar’s route grouping</Text><Text style={{color:C.gold}}>↗</Text></Pressable>
   <View style={[s.card,{backgroundColor:'#2b342c',padding:16}]}><Label>DISPATCH · TODAY’S ASSIGNMENTS</Label>{rows.map(row=><View key={row.id} style={{paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#4b5544'}}><Text style={{color:'#bfc6aa',fontSize:9,letterSpacing:1.1}}>{row.route}</Text><Text style={{color:C.paper,fontFamily:'Georgia',fontSize:23,marginTop:7}}>{row.crew}</Text></View>)}</View>
   <Label>MATCH THE CEDAR ASSIGNMENT</Label><Text style={[s.body,{marginTop:10,marginBottom:15}]}>The neighbors supplied “Malcolm.” Which entry gives you the surname to check?</Text>
   {state.boardError&&<Text accessibilityLiveRegion="polite" style={s.notice}>That crew is assigned to a different route. Read the Cedar / Ridge / Latham line, then try again.</Text>}
   {rows.map(row=><View key={row.id} style={{marginBottom:10}}><Button secondary disabled={!state.clues.includes('route')} onPress={()=>send({type:'match_route',id:row.id})}>{row.crew.toUpperCase()}</Button></View>)}
  </>:records?<>
   <Text style={s.body}>At the library annex, Mara searches the name. The fluorescent room offers no dramatic revelation. Just entries, addresses, and a connection to someone else’s life.</Text>
   <View style={s.card}><Label>PUBLIC-RECORD SUMMARY</Label><Text style={s.dialogue}>Malcolm Graves</Text><Text style={s.body}>Address: Hanover Street{ '\n'}Emergency contact: Lena Graves</Text></View>
   {['registration','contact'].map((id,i)=><Pressable accessibilityRole="button" accessibilityLabel={i?'Inspect Lena’s entry':'Inspect the Hanover record'} key={id} onPress={()=>inspect(id)} style={s.clueButton}><Text style={{color:C.paper}}>{state.clues.includes(id)?'✓':'＋'}  {i?'Lena Graves':'The Hanover Street record'}</Text><Text style={{color:C.gold}}>↗</Text></Pressable>)}
   <View style={{height:15}}/><Label>WHAT DOES THIS ESTABLISH?</Label>
   {state.recordAnswer==='overreach'&&<Text accessibilityLiveRegion="polite" style={s.notice}>A local record supports Malcolm’s local identity. It does not prove an alias or explain the missing years.</Text>}
   <View style={{height:15}}/><Button disabled={!state.clues.includes('registration')||!state.clues.includes('contact')} onPress={()=>send({type:'record_conclusion',id:'local_identity'})}>A LOCAL IDENTITY WORTH CHECKING</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('registration')||!state.clues.includes('contact')} onPress={()=>send({type:'record_conclusion',id:'proof'})}>PROOF THAT ADRIAN CHANGED HIS NAME</Button>
  </>:<>
   <Text style={s.body}>Mara leaves the annex before curiosity becomes an excuse to cross another line. She has a surname and an address. What she does next will involve people who never asked to be part of an old file.</Text>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:C.gold}]}><Label>INVESTIGATION UPDATE</Label><Text style={s.cardTitle}>A name. An address. A connection.</Text><Text style={s.body}>Malcolm Graves. Hanover Street. Lena Graves. Four new evidence notes, with the earlier observations preserved.</Text></View>
   <YardScene/>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>Dusk on Mercer</Text><Text style={s.body}>A familiar reflection. An encounter that ordinary work cannot explain.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_mercer'})}>CONTINUE TO DUSK ON MERCER →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE CASE NOTES</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY ALL SCENES</Button>
  </>}
 </>;
}
