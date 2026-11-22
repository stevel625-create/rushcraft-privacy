import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
function DuskScene(){return <View style={{height:235,backgroundColor:'#343a40',borderRadius:5,overflow:'hidden',marginVertical:22}}>
 <View style={{position:'absolute',left:0,right:0,top:25,height:105,backgroundColor:'#555956'}}/>
 {[13,125,237].map(x=><View key={x} style={{position:'absolute',left:x,top:48,width:87,height:118,backgroundColor:'#454c47',borderTopWidth:12,borderTopColor:'#272f30'}}><View style={{left:16,top:20,width:25,height:33,backgroundColor:'#8d845e',borderWidth:3,borderColor:'#6b6d5b'}}/></View>)}
 <View style={{position:'absolute',left:0,right:0,bottom:0,height:80,backgroundColor:'#293632'}}/>
 <View style={{position:'absolute',left:26,bottom:48,width:139,height:52,backgroundColor:'#657070',borderTopLeftRadius:12,borderTopRightRadius:6,borderBottomWidth:8,borderBottomColor:'#414c4a'}}><View style={{position:'absolute',left:11,top:8,width:30,height:22,backgroundColor:'#26383a'}}/><View style={{position:'absolute',right:16,top:8,width:65,height:24,backgroundColor:'#49595a',borderWidth:1,borderColor:'#7e8680'}}/></View>
 {[46,129].map(x=><View key={x} style={{position:'absolute',left:x,bottom:36,width:24,height:24,borderRadius:12,backgroundColor:'#192521',borderWidth:5,borderColor:'#39463f'}}/>)}
 <View style={{position:'absolute',right:15,bottom:53,width:145,height:2,backgroundColor:'#7a8374'}}/>
 {[182,207,232,257,282,307].map(x=><View key={x} style={{position:'absolute',left:x,bottom:25,width:2,height:76,backgroundColor:'#707c6e'}}/>)}
 <View style={{position:'absolute',right:25,bottom:18,width:17,height:70}}><View style={{width:16,height:17,backgroundColor:'#b39e81',borderRadius:7}}/><View style={{height:29,backgroundColor:'#3a4541'}}/><View style={{height:24,width:7,backgroundColor:'#1c2b29'}}/></View>
 <View style={{position:'absolute',left:7,top:18}}><Text style={{fontSize:8,color:'#d3d3be',letterSpacing:2}}>MERCER / LAST LIGHT</Text></View>
 <View style={{position:'absolute',right:59,top:65,width:5,height:91,backgroundColor:'#2a3432'}}/><View style={{position:'absolute',right:53,top:59,width:17,height:10,backgroundColor:'#baaa79',borderRadius:3}}/>
 </View>;}
export default function MercerMission({state,send,inspect,Button,Label,s,onNotebook,onReplay}){
 const follow=state.stage==='mercer_follow',encounter=state.stage==='mercer_encounter',aftermath=state.stage==='mercer_aftermath',dialogue=state.stage==='mercer_dialogue';
 const observed=state.clues.includes('reflex')&&state.clues.includes('confusion');
 const clue=(id,label)=><Pressable accessibilityRole="button" accessibilityLabel={'Inspect '+label} onPress={()=>inspect(id)} style={s.clueButton}><Text style={{color:paper}}>{state.clues.includes(id)?'✓':'＋'}  {label}</Text><Text style={{color:gold}}>↗</Text></Pressable>;
 return <>
  <Label>SCENE 03 · {follow?'DUSK ON MERCER':encounter?'THE INTERRUPTION':aftermath?'AFTER THE MOVEMENT':dialogue?'THE QUESTION':'FIELD NOTE 003'}</Label>
  <Text style={s.title}>{follow?'The street\nlooks back.':encounter?'Too little time\nto understand.':aftermath?'His hands know.\nHe does not.':dialogue?'Who are you?':'Something ordinary\nhas broken open.'}</Text>
  {follow?<>
   <Text style={s.body}>At dusk, Mara leaves the deli. Malcolm crosses from the laundromat with groceries. At a corner, a delivery van holds him up. He notices something in its dark panel.</Text><DuskScene/>
   {clue('van_reflection','the van reflection')}
   <Text style={[s.body,{marginVertical:18}]}>{state.approach==='direct'?'He has already had one conversation with you today. Recognition would be no surprise.':'A quiet approach on Cedar did not make you invisible. His posture changes before he moves on.'}</Text>
   <Button disabled={!state.clues.includes('van_reflection')} onPress={()=>send({type:'follow_corner'})}>CONTINUE TO THE CORNER →</Button>
  </>:encounter?<>
   <Text style={s.body}>A stranger blocks Malcolm’s path beside a green fence. The demand is brief. Then Mara sees a knife. She is too far away to reach him before the encounter changes.</Text><DuskScene/>
   <View style={s.card}><Label>MARA’S DECISION</Label><Text style={s.body}>Choose how Mara responds. The seconds ahead will leave her with a different question.</Text></View>
   <Button onPress={()=>send({type:'mercer_respond',id:'call'})}>CALL OUT TO THEM</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'mercer_respond',id:'approach'})}>MOVE TOWARD MALCOLM</Button>
  </>:aftermath?<>
   <Text style={s.body}>{state.mercerResponse==='call'?'Your warning reaches the street after Malcolm has already moved.':'Mara takes a few strides. Malcolm has already moved.'} The threat ends in seconds. The stranger is on the ground, injured. Malcolm lets go, steps back and stares at his own hands.</Text>
   <View style={s.card}><Label>OBSERVE THE CONTRADICTION</Label><Text style={s.dialogue}>Practiced movement. Unpracticed shock.</Text><Text style={s.body}>Mara has seen trained reactions before. What catches her is what follows: he seems unable to explain his own.</Text></View>
   {clue('reflex','the trained reaction')}{clue('confusion','his confusion')}{clue('scar','the scar near his ear')}
   <View style={{height:15}}/><Label>CHOOSE YOUR WORDS</Label><View style={{height:15}}/>
   <Button disabled={!observed} onPress={()=>send({type:'mercer_speak',id:'listen'})}>GIVE HIM ROOM TO ANSWER</Button><View style={{height:12}}/><Button secondary disabled={!observed} onPress={()=>send({type:'mercer_speak',id:'press'})}>ASK WHERE HE LEARNED THAT</Button>
  </>:dialogue?<>
   <View style={s.card}><Label>{state.mercerTone==='listen'?'MARA LEAVES A SILENCE':'MARA PRESSES THE QUESTION'}</Label><Text style={s.dialogue}>{state.mercerTone==='listen'?'“I didn’t think.”':'“What bothers me is a stranger tailing me through my neighborhood.”'}</Text><Text style={s.body}>{state.mercerTone==='listen'?'His attention returns to her. He asks how she followed him. She says she came from the deli. It does not settle the question.':'The objection is fair. Mara has a theory; Malcolm has a stranger following him. She can see why he would be wary.'}</Text></View>
   <Text style={s.body}>A siren begins in the distance. He looks at her and asks who she is. The past has not returned in a sudden explanation. It has become harder to ignore.</Text>
   {state.mercerAnswer==='overreach'&&<Text accessibilityLiveRegion="polite" style={s.notice}>You witnessed trained reflexes and apparent confusion. Even the scar cannot prove who he was. Keep the observation separate from the identity you suspect.</Text>}
   <View style={{height:22}}/><Button onPress={()=>send({type:'mercer_conclude',id:'unexplained'})}>HE HAS SKILLS HE CANNOT EXPLAIN</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'mercer_conclude',id:'identity'})}>HIS IDENTITY IS NOW CERTAIN</Button>
  </>:<>
   <Text style={s.body}>The name Malcolm Graves still belongs to a real life. Now Mara has witnessed something that life does not explain. Tomorrow’s conversation will be different.</Text>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>CASE UPDATE</Label><Text style={s.cardTitle}>The question has changed.</Text><Text style={s.body}>From “Does he look familiar?” to “Why can’t he explain what he knows?”</Text><Text style={[s.caption,{marginTop:12}]}>{state.mercerTone==='listen'?'YOU LEFT ROOM FOR AN ANSWER.':'YOUR QUESTION LEFT HIM GUARDED.'}</Text></View><DuskScene/>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>A Face from the Fire</Text><Text style={s.body}>The next morning on Cedar, Mara brings the past closer.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_fire'})}>CONTINUE TO A FACE FROM THE FIRE →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW ALL CASE NOTES</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY THE INVESTIGATION</Button>
  </>}
 </>;
}
