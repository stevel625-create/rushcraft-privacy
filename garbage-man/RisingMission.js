import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
const FRAGMENTS=[
 {title:'THE BRIDGE',body:'The transfer was not simply cargo. Adrian recalls finding people inside a container and trying to take them out along with the archive.'},
 {title:'RECOVERY AUTHORITY',body:'Keane arrives in the returning memory as a friendly call sign. The offer is a false choice. The detonation has already been primed.'},
 {title:'SPLIT ACCESS',body:'A later recollection separates the paper shell from protected access. A harbor facility. A sealed archive. Adrian’s own presence required to open it. He has not tested that memory yet.'},
];
function Outflow(){return <View style={{height:193,marginVertical:22,backgroundColor:'#2b443a',borderRadius:5,overflow:'hidden'}}><View style={{position:'absolute',left:0,right:0,top:0,height:36,backgroundColor:'#7a836c'}}/><View style={{position:'absolute',left:21,top:48,width:299,height:156,backgroundColor:'#66745e',borderTopLeftRadius:100,borderTopRightRadius:100}}><View style={{position:'absolute',left:25,right:25,top:23,bottom:-15,backgroundColor:'#162f29',borderTopLeftRadius:85,borderTopRightRadius:85}}/></View><View style={{position:'absolute',left:0,right:0,bottom:0,height:43,backgroundColor:'#43665a',opacity:0.9}}/>{[15,95,180,264].map(x=><View key={x} style={{position:'absolute',left:x,bottom:19,width:43,height:2,backgroundColor:'#849f83'}}/>)}<Text style={{position:'absolute',top:13,left:16,color:'#dadbc1',fontSize:8,letterSpacing:1.5}}>PERIMETER ROAD / STORM CHAMBER</Text></View>;}
function Harbor(){return <View style={{height:219,marginVertical:22,backgroundColor:'#213c35',borderRadius:5,overflow:'hidden'}}><View style={{position:'absolute',left:0,right:0,bottom:0,height:75,backgroundColor:'#375b4d'}}/>{[38,172,279].map((x,i)=><View key={x} style={{position:'absolute',left:x,bottom:74,width:6,height:90+i*10,backgroundColor:'#8b9979'}}><View style={{position:'absolute',left:-13,top:0,width:79,height:5,backgroundColor:'#8b9979',transform:[{rotate:'-11deg'}]}}/><View style={{position:'absolute',left:48,top:0,width:2,height:52,backgroundColor:'#718a70'}}/></View>)}<View style={{position:'absolute',left:88,bottom:48,width:163,height:24,backgroundColor:'#182f29',borderBottomLeftRadius:22,borderBottomRightRadius:22}}/><View style={{position:'absolute',left:137,bottom:71,width:71,height:23,backgroundColor:'#73866c'}}/>{[48,145,244].map(x=><View key={x} style={{position:'absolute',left:x,bottom:24,width:42,height:2,backgroundColor:'#6e9177'}}/>)}<Text style={{position:'absolute',top:15,left:15,color:'#d7ddc3',fontSize:8,letterSpacing:1.5}}>BLACK HARBOR / AN UNTESTED LEAD</Text></View>;}
export default function RisingMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const records=state.stage==='rising_records',drain=state.stage==='rising_drain',ledger=state.stage==='rising_ledger',recall=state.stage==='rising_recall',yard=state.stage==='rising_yard';
 const clue=(id,title)=><Pressable key={id} accessibilityRole="button" accessibilityLabel={'Inspect '+title} onPress={()=>inspect(id)} style={s.clueButton}><Text style={{color:paper}}>{state.clues.includes(id)?'✓':'＋'}  {title}</Text><Text style={{color:gold}}>↗</Text></Pressable>;
 return <>
  <Label>SCENE 12 · {records?'BLACK HARBOR RISING':drain?'THE ESTATE OUTFLOW':ledger?'THE BOOK IN YOUR HANDS':recall?'KARS RETURNS':yard?'THE FREIGHT YARD':'CASE NOTE 012'}</Label><View style={{marginTop:12}}><Label>PLAY AS ADRIAN VALE / MALCOLM GRAVES</Label></View>
  <Text style={s.title}>{records?'Keep the people.\nKeep the proof.':drain?'There is no\nvan waiting now.':ledger?'A book is not\nthe whole machine.':recall?'More than fire.\nStill not every year.':yard?'The archive\nis somewhere else.':'Toward the harbor.\nNot yet inside it.'}</Text>
  {records?<>
   <Text style={s.body}>The records room is coming apart. Rourke retreats through the hidden door. Lena pushes the book into your reach and moves with you. Mara points toward the east service stair. You clear the descending shutter together; she checks the torn satchel.</Text>
   <View style={s.card}><Label>MARA’S CHECK</Label><Text style={s.dialogue}>“Still got the drive.”</Text><Text style={s.body}>Lena and the ledger are with you. The copied evidence has not been left behind. Jonas reports movement outside and the loss of the interior feed.</Text></View>
   {clue('drive_retained','the retained drive')}
   {state.risingError==='pursue'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Rourke is retreating deeper into his own house. Mara’s route is toward the service stair, with Lena and the proof.</Text>}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('drive_retained')} onPress={()=>send({type:'rising_exit',id:'east'})}>TAKE THE EAST SERVICE STAIR</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('drive_retained')} onPress={()=>send({type:'rising_exit',id:'rourke'})}>FOLLOW ROURKE’S RETREAT</Button>
  </>:drain?<>
   <Text style={s.body}>The kitchen route reaches a floodlit loading apron. An SUV strikes Jonas’s van near the wall. It rolls onto its side. Mara calls him; there is no answer. The impact does not tell you whether he survived. The group reaches the drainage swale with the book and satchel.</Text><Outflow/>
   {clue('van_impact','the van impact')}
   <View style={s.card}><Label>UP OR THROUGH?</Label><Text style={s.body}>After the first culvert, you reach a chamber under the perimeter road. Headlights sweep the grating above. Another outflow runs toward industrial ground beyond the estate.</Text></View>
   {state.risingError==='road'&&<Text accessibilityLiveRegion="polite" style={s.notice}>The light and movement are on the road above. The outflow offers the route away from that immediate pursuit.</Text>}
   <Button disabled={!state.clues.includes('van_impact')} onPress={()=>send({type:'rising_outflow',id:'through'})}>THROUGH THE OUTFLOW</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('van_impact')} onPress={()=>send({type:'rising_outflow',id:'up'})}>UP TO THE ROAD GRATING</Button>
  </>:ledger?<>
   <Text style={s.body}>Beyond the wall, headlights close from both sides. A horn sounds. Jonas returns in the damaged van—injured, alive, and still driving. Lena, Mara and you get aboard. As the pursuit follows, you open the book.</Text>
   <View style={s.card}><Label>WHAT IS ON THE PAGE</Label><Text style={s.body}>Quarter codes. Consignor marks. Shipping terms beside transfers. A notation next to Marrow Holdings catches your attention.</Text></View>
   {clue('routing_marks','the shipping and transfer marks')}
   <View style={s.card}><Label>WHAT IT BRINGS BACK</Label><Text style={s.body}>A freight office. A manifest. People discussed as leverage, far beyond the circle of agents. The memory expands Black Harbor’s meaning; it is not the same source as the printed page.</Text></View>
   {clue('market_fragment','the returning market fragment')}
   {state.risingError==='archive'&&<Text accessibilityLiveRegion="polite" style={s.notice}>The book points to transfers and paper trails. Adrian’s returning account describes a larger system. The book alone is not the complete archive.</Text>}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('routing_marks')||!state.clues.includes('market_fragment')} onPress={()=>send({type:'rising_interpret',id:'shell'})}>THE BOOK IS A ROUTING SHELL</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('routing_marks')||!state.clues.includes('market_fragment')} onPress={()=>send({type:'rising_interpret',id:'whole'})}>THE BOOK CONTAINS THE COMPLETE ARCHIVE</Button>
  </>:recall?<>
   <Text style={s.body}>A freight train blocks the road. The damaged van cannot take you farther. The group leaves it with the ledger and satchel. Near the tracks, the bridge returns in a fuller, painful sequence. This time there are people inside the memory, not only fire.</Text>
   {FRAGMENTS.slice(0,state.risingMemory).map(fragment=><View key={fragment.title} style={s.card}><Label>{fragment.title} · RECOLLECTION</Label><Text style={s.body}>{fragment.body}</Text></View>)}
   {state.risingMemory<3?<Button onPress={()=>send({type:'rising_fragment'})}>FOLLOW THE RETURNING FRAGMENT · {state.risingMemory+1}/3</Button>:<>
    <Text style={[s.body,{marginBottom:20}]}>You escape beneath the rail line and emerge in a freight yard. The group still has the book. The memories supply a new lead, not an opened archive.</Text><Button onPress={()=>send({type:'rising_to_yard'})}>CONTINUE INTO THE FREIGHT YARD →</Button>
   </>}
  </>:yard?<>
   <Text style={s.body}>Lena asks what her brother died for if the book is only a shell. You tell her he came close enough to frighten them. More access details return: a waste plant, an offshore transfer station, and a protected archive that you designed around your own presence.</Text><Harbor/>
   {clue('offshore_lead','the offshore location recollection')}
   <View style={s.card}><Label>MARA’S QUESTION</Label><Text style={s.body}>Can you prove this is not another fragment? You cannot prove it here. You can describe what you remember building. The location still has to be tested.</Text></View>
   {state.risingError==='certainty'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Confidence in the remembered design is not confirmation of the site’s current condition. The archive has not been reached or opened.</Text>}
   <Button disabled={!state.clues.includes('offshore_lead')} onPress={()=>send({type:'rising_commit',id:'test'})}>TAKE THE LEAD TO THE HARBOR</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('offshore_lead')} onPress={()=>send({type:'rising_commit',id:'proven'})}>THE ARCHIVE’S SAFETY IS ALREADY PROVEN</Button>
  </>:<>
   <Text style={s.body}>You find the next movement in the working yard: utility carts by a maintenance cage. Lena stays with the book. Mara and you move with them as Keane’s warning carries through the freight cars. Beyond the tracks, industrial lights sit low on the water.</Text><Harbor/>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>WHAT YOU HAVE / WHAT YOU DO NOT</Label><Text style={s.cardTitle}>The shell. The drive. A recalled door.</Text><Text style={s.body}>Lena and Jonas are alive with the group. The ledger and memo remain evidence. The full archive is not yet in hand, and Toby’s location is still unconfirmed.</Text></View>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>The Dead Man’s Archive</Text><Text style={s.body}>First, a cart that will run. Then the harbor and its final door.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_archive'})}>CONTINUE TO THE DEAD MAN’S ARCHIVE →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE HARBOR LEADS</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY ALL TWELVE SCENES</Button>
  </>}
 </>;
}
