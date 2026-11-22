import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Platform,Animated,Pressable,SafeAreaView,ScrollView,StatusBar,StyleSheet,Text,View} from 'react-native';
import RouteMission from './RouteMission';
import SaveTransfer from './SaveTransfer';
import ProgressOverview from './ProgressOverview';
import CaseNotebook from './CaseNotebook';
import DawnMission from './DawnMission';
import CustodianMission from './CustodianMission';
import BlueMission from './BlueMission';
import CollectionMission from './CollectionMission';
import TruckMission from './TruckMission';
import NoticesMission from './NoticesMission';
import ServiceMission from './ServiceMission';
import PermitMission from './PermitMission';
import AshesMission from './AshesMission';
import CostMission from './CostMission';
import ArchiveMission from './ArchiveMission';
import RisingMission from './RisingMission';
import HouseMission from './HouseMission';
import StaticMission from './StaticMission';
import MemoryMission from './MemoryMission';
import WifeMission from './WifeMission';
import StationMission from './StationMission';
import EscapeMission from './EscapeMission';
import DeadMission from './DeadMission';
import FireMission from './FireMission';
import MercerMission from './MercerMission';
import YardMission from './YardMission';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CedarArt,{SCENE_WIDTH,SCENE_HEIGHT} from './CedarArt';
const {CLUES,initialState,act}=require('./game');
const {loadProgress,saveProgress}=require('./saves');
const catalog=require('./paid-upgrades.json');
const colors={bg:'#101916',panel:'#1a2620',line:'#344137',paper:'#e5e2cd',muted:'#9ca699',gold:'#c9b77c',green:'#c2ce99'};
const COPY={
 street:{label:'CEDAR STREET · 06:42',heading:'Something in\nthe way he looks.',body:'A truck grinds up Cedar. A man steps down, collects a bin, and checks the street in the dark glass of a window. You have seen that movement before.',task:'Observe the route. Separate a familiar habit from a fact.'},
 conversation:{label:'CEDAR STREET · THE CURB',heading:'A name you\ndon’t recognize.',body:'“Malcolm,” Mrs. Galvez calls. He takes her bag without complaint. When you step closer, the man waits with one gloved hand on a bin.',task:'Listen to what he says. Notice what you are assuming.'},
 office:{label:'MARA’S HOUSE · THE SPARE ROOM',heading:'The dead leave\nunfinished files.',body:'Behind the tax returns, an old leather folder waits. A photograph. An incident report. Twelve years of deciding not to look again.',task:'Inspect both archive documents before reaching a conclusion.'},
 assessment:{label:'FIELD NOTE · 001',heading:'Resemblance\nis not proof.',body:'The route worker’s movements are familiar. His neighbors know him. The file leaves a question open. What can you honestly conclude?',task:'Record a working hypothesis.'}
};
const ReadingContext=createContext({large:false,reduced:false});
function Button({children,onPress,disabled,secondary}){const reading=useContext(ReadingContext);return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>[s.button,secondary&&s.secondary,disabled&&{opacity:0.38},pressed&&{opacity:0.75}]}><Text style={[s.buttonText,reading.large&&{fontSize:14,lineHeight:20,letterSpacing:0.6},secondary&&{color:colors.paper}]}>{children}</Text></Pressable>;}
function Label({children}){const reading=useContext(ReadingContext);return <Text style={[s.label,reading.large&&{fontSize:11,lineHeight:17,letterSpacing:1}]}>{children}</Text>;}
const NATIVE_DRIVER=Platform.OS!=='web';
function Scene({office=false,interactive=false,clues=[],onInspect=()=>{}}){
 const reading=useContext(ReadingContext);
 const pulse=useRef(new Animated.Value(0.35)).current;
 useEffect(()=>{if(reading.reduced){pulse.setValue(1);return;}const animation=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1,duration:1500,useNativeDriver:NATIVE_DRIVER}),Animated.timing(pulse,{toValue:0.35,duration:1500,useNativeDriver:NATIVE_DRIVER})]));animation.start();return()=>animation.stop();},[reading.reduced,pulse]);
 const hotspot=(id,cx,cy,name)=>interactive&&<Pressable key={id} accessibilityRole="button" accessibilityLabel={'Inspect '+name} onPress={()=>onInspect(id)} style={[s.hotspot,{left:(cx/SCENE_WIDTH*100)+'%',top:(cy/SCENE_HEIGHT*100)+'%',marginLeft:-17.5,marginTop:-17.5},clues.includes(id)&&{borderColor:colors.green}]}><Animated.View style={{opacity:clues.includes(id)?1:pulse}}><Text style={{color:colors.paper,fontSize:17}}>{clues.includes(id)?'✓':'＋'}</Text></Animated.View></Pressable>;
 return <View style={s.scene}>
  <CedarArt office={office}/>
  {office?<>
   {hotspot('photo',98,198,'the photograph')}{hotspot('report',336,200,'the incident report')}
  </>:<>
   {hotspot('reflections',362,102,'the window reflection')}{hotspot('gait',204,184,'his left leg')}{hotspot('neighbors',44,150,'the neighbors')}
  </>}
  <View pointerEvents="none" style={s.sceneLabel}><Text style={s.sceneLabelText}>{office?'PRIVATE ARCHIVE':'CEDAR ROUTE / THURSDAY'}</Text></View>
 </View>;
}
export default function App(){
 const [offlineReady,setOfflineReady]=useState(false);
 useEffect(()=>{let live=true;if(Platform.OS==='web'&&typeof navigator!=='undefined'&&'serviceWorker' in navigator)navigator.serviceWorker.ready.then(registration=>{if(live&&registration.active?.scriptURL.endsWith('/offline-worker.js'))setOfflineReady(true);}).catch(()=>{});return()=>{live=false;};},[]);
 const [deviceReduced,setDeviceReduced]=useState(false);
 useEffect(()=>{let live=true;AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(live)setDeviceReduced(value);}).catch(()=>{});const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setDeviceReduced);return()=>{live=false;subscription.remove();};},[]);
 const [state,setState]=useState(initialState);const [ready,setReady]=useState(false);const [notice,setNotice]=useState(null);const [tab,setTab]=useState('story');const [selected,setSelected]=useState(null);const [resetConfirm,setResetConfirm]=useState(false);
 const reading={large:state.readerLarge,reduced:state.readerReduced||deviceReduced};
 const styles=reading.large?{...s,body:{...s.body,fontSize:18,lineHeight:29},caption:{...s.caption,fontSize:11,lineHeight:18},label:{...s.label,fontSize:11,lineHeight:17},notice:{...s.notice,fontSize:16,lineHeight:25},cardTitle:{...s.cardTitle,fontSize:26,lineHeight:33},dialogue:{...s.dialogue,fontSize:28,lineHeight:38}}:s;
 const scroll=useRef(null);const queue=useRef(Promise.resolve());const saveBlocked=useRef(false);const resetSave=useRef(false);
 const [saveStatus,setSaveStatus]=useState('loading');const [saveRetry,setSaveRetry]=useState(0);
 useEffect(()=>{let mounted=true;loadProgress(AsyncStorage).then(result=>{if(!mounted)return;setState(result.state);if(result.recovered)setNotice('Recovered your previous save. Your latest unsaved action may need repeating.');}).catch(()=>{if(!mounted)return;saveBlocked.current=true;setSaveStatus('error');setNotice('Saved progress could not be read. You can play in memory, but saving is paused. Retry saving when device storage is available.');}).finally(()=>{if(mounted)setReady(true);});return()=>{mounted=false;};},[]);
 useEffect(()=>{if(!ready||saveBlocked.current)return;const reset=resetSave.current;let current=true;setSaveStatus('saving');queue.current=queue.current.catch(()=>{}).then(()=>saveProgress(AsyncStorage,state,{reset})).then(()=>{if(reset)resetSave.current=false;if(current)setSaveStatus('saved');}).catch(()=>{if(current)setSaveStatus('error');});return()=>{current=false;};},[state,ready,saveRetry]);
 useEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});setSelected(null);},[state.stage,tab]);
 const send=action=>setState(old=>act(old,action));
 const inspect=id=>{send({type:'inspect',id});setSelected(id);};
 const notebook=tab==='notebook';const shop=tab==='shop';const between=['title','complete','yard_complete','mercer_complete','fire_complete','dead_complete','escape_complete','station_complete'].includes(state.stage);const copy=COPY[state.stage];
 return <ReadingContext.Provider value={reading}><SafeAreaView style={styles.safe}><StatusBar barStyle="light-content"/><View style={styles.frame}>
  <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="Return to story" onPress={()=>setTab('story')}><Text style={styles.brand}>THE GARBAGE MAN<Text style={{color:colors.gold}}> /</Text></Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open progress overview" onPress={()=>setTab('progress')} style={{minHeight:44,justifyContent:'center'}}><Text style={styles.edition}>PROGRESS / STEVEN LONG</Text></Pressable></View>
  <ScrollView keyboardShouldPersistTaps="handled" ref={scroll} contentContainerStyle={{padding:24,paddingBottom:32}}>
   {notice&&<View style={styles.card}><Text accessibilityLiveRegion="polite" style={styles.body}>{notice}</Text><Pressable accessibilityRole="button" onPress={()=>setNotice(null)} style={{paddingVertical:16}}><Text style={{color:colors.gold}}>DISMISS MESSAGE</Text></Pressable></View>}
   {saveStatus==='error'&&<View style={styles.card}><Text accessibilityLiveRegion="polite" style={styles.body}>Progress is in memory. It has not been saved to this device. Retrying writes your current progress.</Text><View style={{height:12}}/><Button secondary onPress={()=>{saveBlocked.current=false;setSaveRetry(value=>value+1);}}>RETRY SAVING CURRENT PROGRESS</Button></View>}
   {tab==='transfer'?<>
    <SaveTransfer state={state} ready={ready} Label={Label} Button={Button} s={styles} onReturn={()=>setTab('progress')} onImport={imported=>{resetSave.current=false;saveBlocked.current=false;setState(imported);setResetConfirm(false);setNotice('Backup imported into this session. Check the saved status before closing the game.');setTab('progress');}}/>
   </>:tab==='progress'?<>
    <ProgressOverview state={state} saveStatus={saveStatus} Label={Label} Button={Button} s={styles} onResume={()=>setTab('story')} onNotebook={()=>setTab('notebook')} onTransfer={()=>setTab('transfer')}/>
   </>:tab==='reading'?<>
    <Label>READING CONTROLS</Label><Text style={styles.title}>Make room to read.</Text><Text style={styles.body}>These preferences apply to story text, case notes, route handbooks and shared buttons. They are saved on this device with your progress and kept when you replay the campaign.</Text>
    <View style={styles.card}><Label>TEXT SIZE</Label><Text style={styles.cardTitle}>{state.readerLarge?'Larger reading text':'Standard reading text'}</Text><Text style={styles.body}>Choose more generous text and line spacing. Your device’s text scaling still applies.</Text><View style={{height:16}}/><Button secondary onPress={()=>send({type:'reading_setting',id:'large',value:!state.readerLarge})}>LARGER TEXT · {state.readerLarge?'ON':'OFF'}</Button></View>
    <View style={styles.card}><Label>MOTION</Label><Text style={styles.cardTitle}>{reading.reduced?'Reduced animation':'Device motion preference'}</Text><Text style={styles.body}>The Cedar scene’s pulsing markers stay still when reduced animation is active. The app also respects your device’s reduced-motion preference.</Text><View style={{height:16}}/><Button secondary onPress={()=>send({type:'reading_setting',id:'reduced',value:!state.readerReduced})}>REDUCE ANIMATION · {state.readerReduced?'ON':'OFF'}</Button><Text style={[styles.caption,{marginTop:14}]}>DEVICE REDUCED MOTION · {deviceReduced?'ON':'OFF'}</Text></View>
    <Button onPress={()=>setTab('story')}>RETURN TO THE GAME</Button>
   </>:notebook?<>
    <Label>SHARED CASE NOTES · MARA / MALCOLM</Label><Text style={styles.title}>What we know.</Text><Text style={styles.body}>A record of observations. Not a verdict.</Text>
    <CaseNotebook ids={state.clues} Label={Label} Button={Button} s={styles} onReturn={()=>setTab('story')}/>
    <Button secondary onPress={()=>setTab('story')}>RETURN TO THE SCENE</Button>
   </>:shop?<>
    <Label>BETWEEN MISSIONS · EQUIPMENT</Label><Text style={styles.title}>Small advantages.{'\n'}Permanent upgrades.</Text><Text style={styles.body}>Individual purchases. No subscriptions. The story can be completed with the standard kit.</Text>
    <View style={styles.notice}><Text style={{color:colors.paper,fontSize:12,lineHeight:20}}>Store setup pending. No payments are available in this prototype. Equipment effects belong to later stealth missions and are not active in this opening.</Text></View>
    {catalog.products.map((product,i)=><View key={product.id} style={styles.card}><View style={styles.row}><Text style={{fontSize:29,color:colors.gold}}>{['⌁','▧','◈'][i]}</Text><Label>PERMANENT</Label></View><Text style={styles.cardTitle}>{product.name}</Text><Text style={styles.body}>{product.description}</Text><Text style={[styles.caption,{marginVertical:12}]}>PROPOSED US PRICE · ${product.proposedUSD}</Text><Button disabled>STORE SETUP PENDING</Button></View>)}
    <Text style={styles.caption}>Final checkout will show the app store’s localized price and provide Restore purchases.</Text><View style={{height:20}}/><Button secondary onPress={()=>setTab('story')}>RETURN TO STORY</Button>
   </>:state.stage==='title'?<>
    <Label>AN INTERACTIVE THRILLER</Label><Text style={[styles.title,{fontSize:47,lineHeight:50,marginTop:15}]}>Some lives{'\n'}are built to{'\n'}be overlooked.</Text><Text style={[styles.body,{marginTop:14,marginBottom:24}]}>A familiar street. An ordinary worker.{'\n'}A movement you remember from another life.</Text>
    <Button onPress={()=>send({type:'start'})} disabled={!ready}>BEGIN THE MORNING →</Button><View style={{height:22}}/>
    <Scene/>
    <View style={[styles.row,{marginTop:24,marginBottom:12}]}><Label>CHAPTER 01</Label><Text style={styles.caption}>PLAY AS MARA KESSLER</Text></View><Text style={styles.cardTitle}>The Man on Cedar Route</Text><Text style={[styles.body,{marginBottom:24}]}>Observe. Question. Decide what counts as evidence.</Text>
    <Text style={[styles.caption,{textAlign:'center',marginTop:15}]}>ADAPTED FROM THE NOVEL BY STEVEN LONG</Text>
   </>:state.stage==='complete'?<>
    <Label>OPENING COMPLETE · FIELD NOTE 001</Label><Text style={styles.title}>A question worth{'\n'}following.</Text><Text style={styles.body}>You close the folder. Adrian’s death was never fully resolved. That does not make Malcolm Graves a ghost. It makes your next question matter.</Text>
    <View style={[styles.card,{borderLeftWidth:3,borderLeftColor:colors.gold}]}><Label>WORKING HYPOTHESIS</Label><Text style={styles.cardTitle}>Investigate. Do not assume.</Text><Text style={styles.body}>{state.clues.length} pieces of evidence recorded. {state.approach==='direct'?'Malcolm noticed your interest.':'You gave him room to remain ordinary.'}</Text></View>
    <Scene/>
    <View style={styles.card}><Label>NEXT IN THE STORY</Label><Text style={styles.cardTitle}>The sanitation yard</Text><Text style={styles.body}>A route board. A surname. A man whose life has become a question.</Text><Text style={[styles.caption,{marginTop:12}]}>READY TO CONTINUE.</Text></View>
    <Button onPress={()=>send({type:'start_yard'})}>CONTINUE TO THE SANITATION YARD →</Button><View style={{height:12}}/><Button secondary onPress={()=>setTab('notebook')}>REVIEW THE EVIDENCE</Button><View style={{height:12}}/><Button secondary onPress={()=>setResetConfirm(true)}>REPLAY THE OPENING</Button>

   </>:state.stage.startsWith('route_')?<>
    <RouteMission state={state} send={send} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('dawn_')?<>
    <DawnMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('custodian_')?<>
    <CustodianMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('blue_')?<>
    <BlueMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('collection_')?<>
    <CollectionMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('truck_')?<>
    <TruckMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('notices_')?<>
    <NoticesMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('service_')?<>
    <ServiceMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('permit_')?<>
    <PermitMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('ashes_')?<>
    <AshesMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('cost_')?<>
    <CostMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('archive_')?<>
    <ArchiveMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('rising_')?<>
    <RisingMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('house_')?<>
    <HouseMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('static_')?<>
    <StaticMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('memory_')?<>
    <MemoryMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('wife_')?<>
    <WifeMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('station_')?<>
    <StationMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('escape_')?<>
    <EscapeMission state={state} send={send} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
   </>:state.stage.startsWith('dead_')?<>
    <DeadMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('fire_')?<>
    <FireMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('mercer_')?<>
    <MercerMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:state.stage.startsWith('yard_')?<>
    <YardMission state={state} send={send} inspect={inspect} Button={Button} Label={Label} s={styles} onNotebook={()=>setTab('notebook')} onReplay={()=>setResetConfirm(true)}/>
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>:<>
    <View style={styles.row}><Label>{copy.label}</Label><Text style={styles.caption}>{state.clues.length} NOTES</Text></View><Text style={styles.title}>{copy.heading}</Text><Text style={[styles.body,{marginBottom:22}]}>{copy.body}</Text>
    {['street','office'].includes(state.stage)&&<Scene office={state.stage==='office'} interactive clues={state.clues} onInspect={inspect}/>}
    <View style={[styles.row,{marginTop:20,marginBottom:14}]}><Label>YOUR OBJECTIVE</Label><Text style={[styles.caption,{color:state.suspicion?colors.gold:colors.muted}]}>{state.suspicion?'INTEREST NOTICED':'LOW PROFILE'}</Text></View><Text style={[styles.body,{color:colors.paper,marginBottom:20}]}>{copy.task}</Text>
    {state.stage==='street'&&<>
     <View style={{gap:8}}>{['reflections','gait','neighbors'].map(id=><Pressable key={id} accessibilityRole="button" onPress={()=>inspect(id)} style={[styles.clueButton,state.clues.includes(id)&&{borderColor:'#65745a'}]}><Text style={{color:colors.paper,fontSize:14}}>{state.clues.includes(id)?'✓  ':'＋  '}{CLUES[id].title}</Text><Text style={{color:colors.gold}}>↗</Text></Pressable>)}</View>
     <Text style={[styles.caption,{marginVertical:18}]}>CHOOSE HOW TO MAKE CONTACT</Text><Button disabled={!state.clues.length} onPress={()=>send({type:'approach',id:'wait'})}>WATCH ANOTHER STOP</Button><View style={{height:10}}/><Button secondary disabled={!state.clues.length} onPress={()=>send({type:'approach',id:'direct'})}>APPROACH HIM DIRECTLY</Button>
    </>}
    {state.stage==='conversation'&&<>
     <View style={styles.card}><Label>{state.approach==='direct'?'YOU STEP INTO HIS PATH':'YOU WAIT UNTIL THE TRUCK STOPS'}</Label><Text style={styles.dialogue}>“Route’s been mine six months.”</Text><Text style={styles.body}>{state.approach==='direct'?'His attention stays on you longer than you intended. Behind him, the driver is losing patience.':'He answers without volunteering more. You let the pause remain a pause.'}</Text></View>
     <Text style={[styles.body,{marginBottom:20}]}>The answer is ordinary. Your reaction is not. Back at home, there is a file you have not opened in years.</Text><Button onPress={()=>send({type:'office'})}>RETURN TO THE OLD FILE →</Button>
    </>}
    {state.stage==='office'&&<>
     {['photo','report'].map(id=><Pressable key={id} accessibilityRole="button" onPress={()=>inspect(id)} style={styles.clueButton}><Text style={{color:colors.paper}}>{state.clues.includes(id)?'✓  ':'＋  '}{CLUES[id].title}</Text><Text style={{color:colors.gold}}>↗</Text></Pressable>)}<View style={{height:18}}/><Button disabled={!state.clues.includes('photo')||!state.clues.includes('report')} onPress={()=>send({type:'assess'})}>ASSESS THE EVIDENCE →</Button>
    </>}
    {state.stage==='assessment'&&<>
     <View style={styles.card}><Label>THE DISTINCTION THAT MATTERS</Label><Text style={styles.dialogue}>No remains positively attributable.</Text><Text style={styles.body}>The report leaves uncertainty. It does not resolve it in your favor.</Text></View>
     {state.answer==='uncertain'&&<Text accessibilityLiveRegion="polite" style={styles.notice}>That conclusion goes further than the evidence. Familiar habits and an unresolved death are reasons to investigate, not certainty.</Text>}
     <Button onPress={()=>send({type:'conclude',id:'investigate'})}>THERE IS REASON TO INVESTIGATE</Button><View style={{height:12}}/><Button secondary onPress={()=>send({type:'conclude',id:'certain'})}>MALCOLM MUST BE ADRIAN</Button>
    </>}
    {selected&&<View style={[styles.card,{borderColor:colors.gold}]} accessibilityLiveRegion="polite"><Label>RECORDED · {CLUES[selected].type}</Label><Text style={styles.cardTitle}>{CLUES[selected].title}</Text><Text style={styles.body}>{CLUES[selected].text}</Text></View>}
   </>}
    {resetConfirm&&tab==='story'&&<View style={styles.card}><Text style={styles.body}>Replace all saved scenes and their evidence?</Text><View style={{height:12}}/><Button onPress={()=>{resetSave.current=true;saveBlocked.current=false;setState(old=>({...initialState(),readerLarge:old.readerLarge,readerReduced:old.readerReduced}));setResetConfirm(false);}}>START A NEW INVESTIGATION</Button><Pressable onPress={()=>setResetConfirm(false)} style={{padding:16}}><Text style={{textAlign:'center',color:colors.muted}}>Keep my progress</Text></Pressable></View>}
   <View style={{height:20}}/><Text accessibilityLiveRegion="polite" style={[styles.caption,{textAlign:'center'}]}>{saveStatus==='saved'?'SAVED ON THIS DEVICE':saveStatus==='saving'?'SAVING PROGRESS…':saveStatus==='loading'?'LOADING SAVED PROGRESS…':'PROGRESS NOT SAVED'}</Text>{offlineReady&&<Text style={[styles.caption,{textAlign:'center'}]}>OFFLINE COPY READY · THIS BROWSER</Text>}<View style={{height:12}}/><Text style={styles.footer}>THE GARBAGE MAN · STORY PROTOTYPE</Text>
  </ScrollView>
  <View style={styles.nav}>{[{id:'story',text:'STORY',icon:'◧'},{id:'notebook',text:'EVIDENCE',icon:'▤'},{id:'reading',text:'READING',icon:'Aa'},...(between?[{id:'shop',text:'EQUIPMENT',icon:'◇'}]:[])].map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={'Open '+item.text.toLowerCase()} onPress={()=>setTab(item.id)} style={styles.navItem}><Text style={{color:tab===item.id?colors.gold:colors.muted,fontSize:20}}>{item.icon}</Text><Text style={[styles.caption,{fontSize:9,color:tab===item.id?colors.paper:colors.muted}]}>{item.text}{item.id==='notebook'?' · '+state.clues.length:''}</Text></Pressable>)}</View>
 </View></SafeAreaView></ReadingContext.Provider>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.bg},frame:{flex:1,width:'100%',maxWidth:520,alignSelf:'center'},top:{padding:21,borderBottomWidth:1,borderBottomColor:colors.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontSize:12,fontWeight:'800',letterSpacing:1.6,color:colors.paper},edition:{fontSize:8,letterSpacing:1.6,color:colors.muted},label:{fontSize:9,fontWeight:'800',letterSpacing:1.6,color:colors.gold},title:{fontFamily:'Georgia',fontSize:37,lineHeight:43,letterSpacing:-0.7,color:colors.paper,marginTop:14,marginBottom:17},body:{fontSize:14,lineHeight:24,color:colors.muted},caption:{fontSize:9,lineHeight:16,letterSpacing:1,color:colors.muted},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},scene:{width:'100%',aspectRatio:SCENE_WIDTH/SCENE_HEIGHT,backgroundColor:'#65705c',borderRadius:5,overflow:'hidden',borderWidth:1,borderColor:'#465344'},sceneLabel:{position:'absolute',left:10,top:10,paddingHorizontal:12,paddingVertical:6,borderRadius:12,backgroundColor:'#0c1512cc'},sceneLabelText:{color:'#ece8d0',fontSize:8,fontWeight:'700',letterSpacing:2},hotspot:{position:'absolute',width:35,height:35,borderRadius:19,borderWidth:1,borderColor:colors.gold,backgroundColor:'#15261edb',alignItems:'center',justifyContent:'center'},button:{backgroundColor:colors.green,paddingVertical:18,paddingHorizontal:16,borderRadius:4,alignItems:'center'},buttonText:{fontSize:11,fontWeight:'800',letterSpacing:1,color:'#1d2a20',textAlign:'center'},secondary:{backgroundColor:'transparent',borderWidth:1,borderColor:colors.line},card:{padding:20,borderWidth:1,borderColor:colors.line,backgroundColor:colors.panel,borderRadius:5,marginVertical:15},cardTitle:{fontFamily:'Georgia',fontSize:23,lineHeight:29,color:colors.paper,marginTop:10,marginBottom:10},clueButton:{padding:16,borderWidth:1,borderColor:colors.line,borderRadius:4,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:5},dialogue:{fontFamily:'Georgia',fontSize:25,lineHeight:34,color:colors.paper,marginVertical:16},notice:{padding:16,backgroundColor:'#333323',color:colors.paper,fontSize:12,lineHeight:21,borderLeftWidth:2,borderLeftColor:colors.gold,marginVertical:15},footer:{fontSize:8,letterSpacing:1.3,color:'#667367',textAlign:'center'},nav:{flexDirection:'row',borderTopWidth:1,borderTopColor:colors.line,paddingVertical:12,backgroundColor:colors.bg},navItem:{flex:1,alignItems:'center',gap:5,paddingVertical:3}});
