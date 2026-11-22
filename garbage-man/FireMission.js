import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
function Photograph(){return <View style={{height:215,marginVertical:22,alignItems:'center',justifyContent:'center',backgroundColor:'#28362d',borderRadius:5}}><View style={{width:238,height:163,backgroundColor:'#d6cfaf',padding:12,transform:[{rotate:'-4deg'}]}}><View style={{flex:1,backgroundColor:'#9c9b83',overflow:'hidden'}}><View style={{position:'absolute',left:0,right:0,bottom:0,height:50,backgroundColor:'#596b66'}}/>{[25,148,182].map(x=><View key={x} style={{position:'absolute',left:x,top:15,width:3,height:95,backgroundColor:'#626b5b'}}/>)}<View style={{position:'absolute',left:10,top:15,width:90,height:5,backgroundColor:'#626b5b',transform:[{rotate:'-10deg'}]}}/><View style={{position:'absolute',left:77,top:20,width:45,height:45,borderRadius:20,backgroundColor:'#a48f6b',borderTopWidth:12,borderTopColor:'#4b5142'}}/><View style={{position:'absolute',left:67,top:62,width:66,height:78,backgroundColor:'#3b4c42',borderTopLeftRadius:17,borderTopRightRadius:17}}/><View style={{position:'absolute',left:77,top:38,width:45,height:8,backgroundColor:'#313f35'}}/></View><Text style={{fontSize:8,letterSpacing:2,color:'#605e49',marginTop:7}}>MARSEILLE · BEFORE THE BRIDGE</Text></View></View>;}
function FeedPanel(){return <View style={{padding:18,backgroundColor:'#16211c',borderWidth:1,borderColor:'#3d4b3d',borderRadius:5,marginVertical:22}}><Text style={{fontSize:9,color:gold,letterSpacing:2}}>CEDAR · REVIEW TIMELINE</Text>{[
 ['01','PORCH FOOTAGE','REVIEWED','#b5c497'],['02','JONAS CALLS','WARNING','#c9b77c'],['03','SCHOOL ZONE','UNAVAILABLE','#b99d87'],['04','PHARMACY','FILE NOT FOUND','#b99d87'],['05','UTILITY LOT','OFFLINE','#b99d87'],
 ].map(([n,label,status,color])=><View key={n} style={{flexDirection:'row',justifyContent:'space-between',gap:8,borderBottomWidth:1,borderBottomColor:'#303e32',paddingVertical:15}}><Text style={{fontSize:9,color:'#a9b29e',letterSpacing:0.8}}>{n} / {label}</Text><Text style={{fontSize:8,color,letterSpacing:0.8}}>{status}</Text></View>)}</View>;}
export default function FireMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const returning=state.stage==='fire_return',memory=state.stage==='fire_memory',photo=state.stage==='fire_photo',watch=state.stage==='fire_watch';
 const clue=(id,label)=><Pressable accessibilityRole="button" accessibilityLabel={'Inspect '+label} onPress={()=>inspect(id)} style={s.clueButton}><Text style={{color:paper}}>{state.clues.includes(id)?'✓':'＋'}  {label}</Text><Text style={{color:gold}}>↗</Text></Pressable>;
 return <>
  <Label>SCENE 04 · {returning?'A FACE FROM THE FIRE':memory?'THE WORDS HE FINDS':photo?'THE PHOTOGRAPH':watch?'SOMEONE IS WATCHING':'FIELD NOTE 004'}</Label>
  <Text style={s.title}>{returning?'An old name\non a familiar street.':memory?'Let the silence\nstay empty.':photo?'His face.\nNot his name.':watch?'Someone saw her\nseeing him.':'The question is\nno longer private.'}</Text>
  {returning?<>
   <Text style={s.body}>The next morning, Mara catches the truck halfway down Cedar. Malcolm has a shift to finish. She has a photograph she cannot put away. At her side gate, the ordinary conversation is about to end.</Text><Photograph/>
   <View style={s.card}><Label>THE CONVERSATION ON MERCER</Label><Text style={s.body}>{state.mercerTone==='listen'?'Yesterday you left him room to answer. That does not mean he owes you another conversation.':'Yesterday you pressed him. His objection to being followed is still between you.'}</Text></View>
   <Button onPress={()=>send({type:'fire_open',id:'explain'})}>EXPLAIN WHY YOU CAME BACK</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'fire_open',id:'name'})}>SAY THE NAME: ADRIAN VALE</Button>
  </>:memory?<>
   <Text style={s.body}>{state.fireOpening==='explain'?'Mara begins with the encounter on Mercer, then gives him the name she has been carrying.':'Mara says the name without a preface. Malcolm straightens too quickly.'} He says she has the wrong person. When she mentions the bridge, his attention seems to move somewhere the porch cannot reach.</Text>
   <View style={s.card}><Label>MALCOLM</Label><Text style={s.dialogue}>“There was fire.”</Text><Text style={s.body}>Fuel. Concrete dust. Then a pause. Mara remembers a woman’s voice from the bridge. She could supply the words. She could also let him find his own.</Text></View>
   <Text style={[s.body,{marginBottom:20}]}>Your choice changes how this recollection is recorded in the notebook.</Text>
   <Button onPress={()=>send({type:'fire_recall',id:'wait'})}>WAIT FOR HIS OWN WORDS</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'fire_recall',id:'supply'})}>SUGGEST THE VOICE YOU REMEMBER</Button>
  </>:photo?<>
   <View style={s.card}><Label>{state.fireRecall==='wait'?'UNPROMPTED WORDS':'A DETAIL YOU SUPPLIED'}</Label><Text style={s.body}>{state.fireRecall==='wait'?'He mentions a woman cutting through static. He cannot settle whether she said “move” or “go.” You have not given him the line.':'You mention the woman’s warning. His response can no longer independently establish that detail. Your notebook records your intervention alongside his account.'}</Text></View>
   <Text style={s.body}>Mara shows him the Marseille photograph. He studies it despite himself. The fragment it brings is not a name. It is a passport whose color he cannot settle.</Text><Photograph/>
   {clue('passport','the passport fragment')}
   <View style={s.card}><Label>THE LIFE HE CAN NAME</Label><Text style={s.body}>Malcolm says his wife is Lena and he has lived on Hanover for six years. Duffy comes up the walk. Mara proposes the diner on Mercer, seven tonight. Malcolm keeps the photograph, but says he is not coming.</Text></View>
   {clue('family_boundary','Malcolm’s boundary')}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('passport')||!state.clues.includes('family_boundary')} onPress={()=>send({type:'fire_leave'})}>LET HIM RETURN TO THE ROUTE →</Button>
  </>:watch?<>
   <Text style={s.body}>Back in her basement, Mara reviews the porch footage. Jonas Reeve calls with a warning: her interest has been noticed. As they speak, the feeds begin to disappear. She keeps the stills that survived.</Text><FeedPanel/>
   {clue('feed_loss','the missing-feed sequence')}
   <View style={s.card}><Label>COUNTY WORK-ORDER SUMMARY</Label><Text style={s.cardTitle}>Cedar camera maintenance</Text><Text style={s.body}>Scheduled today: none.</Text></View>
   {clue('maintenance','the maintenance summary')}
   <View style={{height:18}}/><Label>COMPARE THE TWO RECORDS</Label>
   {state.fireAnswer==='routine'&&<Text accessibilityLiveRegion="polite" style={s.notice}>There is no scheduled maintenance, and the feeds vanish after Mara’s review. Routine maintenance does not explain the sequence well.</Text>}
   {state.fireAnswer==='named_enemy'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Jonas’s warning gives Mara reason to worry. These records do not identify who removed the feeds.</Text>}
   <View style={{height:18}}/><Button disabled={!state.clues.includes('feed_loss')||!state.clues.includes('maintenance')} onPress={()=>send({type:'fire_conclude',id:'attention'})}>OUR INVESTIGATION HAS BEEN NOTICED</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('feed_loss')||!state.clues.includes('maintenance')} onPress={()=>send({type:'fire_conclude',id:'routine'})}>THIS IS ROUTINE MAINTENANCE</Button><View style={{height:12}}/><Button secondary disabled={!state.clues.includes('feed_loss')||!state.clues.includes('maintenance')} onPress={()=>send({type:'fire_conclude',id:'named_enemy'})}>THE RECORDS IDENTIFY WHO DID IT</Button>
  </>:<>
   <Text style={s.body}>Malcolm has gone back to work with the photograph in his pocket. Mara takes the surviving stills and her old file. Waiting until seven no longer feels like an option.</Text>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>CASE UPDATE</Label><Text style={s.cardTitle}>A memory is not a meeting.</Text><Text style={s.body}>He has not agreed to the diner. His fragments remain incomplete. Someone else appears to be watching the same street.</Text><Text style={[s.caption,{marginTop:12}]}>{state.fireRecall==='wait'?'RECOLLECTION RECORDED WITHOUT YOUR PROMPT.':'YOUR PROMPT IS PRESERVED IN THE EVIDENCE NOTE.'}</Text></View>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>What the Dead Leave Behind</Text><Text style={s.body}>Mara intercepts Malcolm before he goes home. Lena is no longer outside the danger.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_dead'})}>CONTINUE TO WHAT THE DEAD LEAVE BEHIND →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE UPDATED CASE</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY ALL FOUR SCENES</Button>
  </>}
 </>;
}
