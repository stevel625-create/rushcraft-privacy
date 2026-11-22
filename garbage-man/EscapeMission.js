import React from 'react';
import {Pressable,Text,View} from 'react-native';
const paper='#e5e2cd',gold='#c9b77c';
const CARRY=[['locker_key','Brass key · 247','Keep the next destination within reach.'],['codebook','Oilskin notebook','The entries have not yet yielded their meaning.'],['anton','Passport · Anton Eberhardt','A physical link to the life you cannot remember.'],['cash','Loose currency','Mara can carry this in her bag.'],['case','The black case','It holds too much to move easily through the passage.']];
function TrainScene(){return <View style={{height:213,marginVertical:22,borderRadius:5,overflow:'hidden',backgroundColor:'#5a6558'}}>
 <View style={{position:'absolute',left:0,right:0,top:14,height:9,backgroundColor:'#c3c2a0'}}/>
 {[17,133,249].map(x=><View key={x} style={{position:'absolute',left:x,top:44,width:97,height:85,backgroundColor:'#172b29',borderWidth:6,borderColor:'#77806b'}}><View style={{position:'absolute',left:5,right:5,top:22,height:2,backgroundColor:'#496057'}}/></View>)}
 <View style={{position:'absolute',left:0,right:0,bottom:0,height:59,backgroundColor:'#33483d'}}/>
 {[17,133,249].map(x=><View key={x} style={{position:'absolute',left:x,bottom:24,width:95,height:42,backgroundColor:'#7d8061',borderRadius:5,borderBottomWidth:10,borderBottomColor:'#555d46'}}/>)}
 <View style={{position:'absolute',left:121,top:31,bottom:0,width:5,backgroundColor:'#a5ad92'}}/><View style={{position:'absolute',right:6,top:31,bottom:0,width:5,backgroundColor:'#a5ad92'}}/>
 <Text style={{position:'absolute',top:27,left:17,color:'#dcdcc1',fontSize:8,letterSpacing:1.8}}>THREE STATIONS LATER</Text>
 </View>;}
export default function EscapeMission({state,send,Button,Label,s,onNotebook,onReplay}){
 const pack=state.stage==='escape_pack',service=state.stage==='escape_service',keane=state.stage==='escape_keane',train=state.stage==='escape_train';
 return <>
  <Label>SCENE 06 · {pack?'THE BANK INTERRUPTION':service?'THE SERVICE PASSAGE':keane?'KEANE':train?'THE TRAIN':'CASE NOTE 006'}</Label>
  <View style={{marginTop:12}}><Label>PLAY AS MALCOLM GRAVES</Label></View>
  <Text style={s.title}>{pack?'Not everything\ncan come with you.':service?'The room has\nanother way out.':keane?'A stranger\nknows your old name.':train?'Something in\nthe numbers.':'A destination.\nNot safety.'}</Text>
  {pack?<>
   <Text style={s.body}>Bell refuses to step aside in the vault corridor. One of the armed men shoots her. Mara pulls you back into the room. Your hands move before you have a plan. The black case is too bulky for the passage behind the cabinets.</Text>
   <View style={s.card}><Label>DIVIDE WHAT YOU CAN CARRY</Label><Text style={s.body}>Mara takes the authorization, memory card and an envelope. She can carry the loose cash. You need the key, a notebook and the passport. Leave the case.</Text></View>
   <View style={[s.row,{marginBottom:15}]}><Label>KEEP WITH MALCOLM</Label><Text style={s.caption}>{state.carried.length} / 3 OBJECTS</Text></View>
   {CARRY.map(([id,title,detail])=><Pressable accessibilityRole="button" accessibilityLabel={'Carry '+title} accessibilityState={{selected:state.carried.includes(id)}} key={id} onPress={()=>send({type:'toggle_carry',id})} style={[s.card,{marginVertical:5,borderColor:state.carried.includes(id)?gold:'#344137'}]}><View style={s.row}><Text style={{color:paper,fontSize:15,flex:1}}>{title}</Text><Text style={{color:gold}}>{state.carried.includes(id)?'✓':'＋'}</Text></View><Text style={[s.body,{fontSize:12,marginTop:6}]}>{detail}</Text></Pressable>)}
   {state.escapeError==='capacity'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Three objects are already selected. Tap one to leave it, then choose again.</Text>}
   {state.escapeError==='essentials'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Keep the brass key, oilskin notebook and passport with Malcolm. Mara has the cash; the case stays behind.</Text>}
   <View style={{height:18}}/><Button onPress={()=>send({type:'escape_leave'})}>CHECK YOUR LOAD AND LEAVE →</Button>
  </>:service?<>
   <Text style={s.body}>An armed man reaches the door. In the sudden struggle, your practiced reactions return before your memories do. Mara gets you into the service passage. Someone behind the steel calls you Vale.</Text>
   <View style={s.card}><Label>THE MECHANICAL ROOM</Label><Text style={s.body}>Tanks crowd the room. A paper tag moves in a draft. Street noise reaches you from one side. The freight lift is above you, its shaft rattling.</Text></View>
   <View style={{padding:20,backgroundColor:'#28382f',borderWidth:1,borderColor:'#52604a',marginBottom:22}}><Text style={{color:gold,fontSize:10,letterSpacing:1}}>OBSERVATIONS</Text><Text style={[s.body,{marginTop:12,color:paper}]}>→ Moving air beside the tanks{ '\n'}↑ Lift moving on another floor</Text></View>
   {state.escapeError==='lift'&&<Text accessibilityLiveRegion="polite" style={s.notice}>The lift is not waiting for you. The draft and street noise offer a route you can investigate now.</Text>}
   <Button onPress={()=>send({type:'escape_route',id:'airflow'})}>FOLLOW THE MOVING AIR</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'escape_route',id:'lift'})}>WAIT FOR THE FREIGHT LIFT</Button>
  </>:keane?<>
   <Text style={s.body}>The service route brings you back above the vault. The lobby is occupied. A violent scramble opens a way to the front, but a man in armor calls you Adrian. Mara recognizes the Section Nine pin. He gives his name as Keane.</Text>
   <View style={s.card}><Label>WHAT HE WANTS YOU TO HEAR</Label><Text style={s.dialogue}>“You were supposed to stay dead.”</Text><Text style={s.body}>He speaks as if your memory is overdue. The name Keane gives you nothing back. His taunt about Mara’s past closes her expression.</Text></View>
   <Button onPress={()=>send({type:'escape_question',id:'rourke'})}>ASK WHAT ROURKE WANTED</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'escape_question',id:'memory'})}>ASK WHY HE EXPECTS YOU TO REMEMBER</Button>
   {state.escapeQuestion&&<>
    <View style={s.card}><Label>ADVERSARY TESTIMONY</Label><Text style={s.body}>{state.escapeQuestion==='rourke'?'He says Rourke wanted what Vale had, not merely Vale gone. He does not tell you what that was.':'He treats your missing memory as evidence that someone changed you. That is his claim, not an explanation you can verify.'} The confrontation turns violent. Mara intervenes. Keane is injured, but his answers remain calculated.</Text></View>
    <Text style={[s.body,{marginBottom:20}]}>A chirp sounds from his clothing. New arrivals reach the bank. Mara gets you through a side stair, past a blocked alley and through a print shop. You leave with the notebook, passport and key, then reach a train.</Text>
    <Button onPress={()=>send({type:'escape_to_train'})}>CONTINUE ON THE TRAIN →</Button>
   </>}
  </>:train?<>
   <Text style={s.body}>For three stations neither of you speaks. The notebook rests on your knee. Keane’s words have followed you out of the bank, but you do not have to take them as truth.</Text><TrainScene/>
   {!state.trainTone?<>
    <Button onPress={()=>send({type:'train_tone',id:'ask'})}>ASK WHAT ADRIAN WAS TO HER</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'train_tone',id:'space'})}>GIVE HER TIME TO SPEAK</Button>
   </>:<>
    <View style={s.card}><Label>MARA’S ACCOUNT</Label><Text style={s.dialogue}>“He was my partner.”</Text><Text style={s.body}>{state.trainTone==='ask'?'You ask if that was all. She says no.':'She eventually adds that it was not all.'} She does not explain further. The notebook offers a different kind of question.</Text></View>
    <Label>PAGE THREE · LINE SEVEN</Label><Text style={[s.body,{marginVertical:15}]}>You reorganize one entry. Coordinates begin to make sense to Mara; a locker number comes to you. Put the recovered associations in destination order, then compare them with the key tag.</Text>
    <View style={{padding:22,borderWidth:1,borderColor:gold,backgroundColor:'#202f25',marginVertical:8}}><Text accessibilityLiveRegion="polite" style={{color:paper,fontSize:18,letterSpacing:2,textAlign:'center'}}>{state.pattern.length?state.pattern.join(' · '):'—  ·  —  ·  —'}</Text></View>
    <View style={{flexDirection:'row',gap:8,marginVertical:14}}>{['247','UNION','STATION'].map(piece=><View key={piece} style={{flex:1}}><Button secondary disabled={state.pattern.includes(piece)} onPress={()=>send({type:'pattern_pick',id:piece})}>{piece}</Button></View>)}</View>
    <Text style={[s.caption,{marginBottom:18}]}>KEY TAG · 247</Text>
    {state.escapeError==='pattern'&&<Text accessibilityLiveRegion="polite" style={s.notice}>Start with the place: UNION, then STATION. The locker number comes last. Clear the arrangement and try again.</Text>}
    <Button disabled={state.pattern.length!==3} onPress={()=>send({type:'pattern_confirm'})}>COMPARE WITH THE KEY →</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'pattern_reset'})}>CLEAR THE ARRANGEMENT</Button>
   </>}
  </>:<>
   <Text style={s.body}>One entry resolves. The rest of the notebook remains closed to you. Mara looks at you as the train begins to slow. Through the scratched window, two men scan the car from the platform.</Text><TrainScene/>
   <View style={[s.card,{borderLeftWidth:3,borderLeftColor:gold}]}><Label>CONFIRMED NEXT LEAD</Label><Text style={s.cardTitle}>Union Station · Locker 247</Text><Text style={s.body}>You kept the key, notebook and passport. Keane’s statements are recorded as claims. Mara’s relationship with Adrian is still hers to explain.</Text></View>
   <View style={s.card}><Label>NEXT IN THE MANUSCRIPT</Label><Text style={s.cardTitle}>Union Station Locker</Text><Text style={s.body}>The doors have not opened. Mara stands. The search is already on the platform.</Text><Text style={[s.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
   <Button onPress={()=>send({type:'start_station'})}>CONTINUE TO UNION STATION LOCKER →</Button><View style={{height:12}}/><Button secondary onPress={onNotebook}>REVIEW THE ESCAPE NOTES</Button><View style={{height:12}}/><Button secondary onPress={onReplay}>REPLAY ALL SIX SCENES</Button>
  </>}
 </>;
}
