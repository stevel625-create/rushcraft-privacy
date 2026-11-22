import React,{useEffect,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {ServiceReceipt} from './ServiceJournal';
const {pickupLoad}=require('./routes');
const paper='#e5e2cd',gold='#c9b77c',muted='#9ca699';
export default function RouteMap({route,current,Label,s}){
 const [width,setWidth]=useState(280),[selected,setSelected]=useState(Math.min(current,route.stops.length-1));
 useEffect(()=>setSelected(Math.min(current,route.stops.length-1)),[route.number,route.stops.length,current]);
 const rows=Math.ceil(route.stops.length/2),height=rows*80+65;
 const point=index=>{const row=Math.floor(index/2),column=row%2===0?index%2:1-index%2;return {x:width*(column===0?0.23:0.77),y:48+row*80};};
 const selectedStop=route.stops[Math.min(selected,route.stops.length-1)];
 const status=index=>index<current?'RESOLVED':index===current?'CURRENT':'UPCOMING';
 return <View style={[s.card,{padding:16}]}><Label>NEIGHBORHOOD ROUTE · SHIFT {route.number}</Label><Text style={s.body}>Tap a numbered stop to preview it. This diagram shows stop order, not geographic distances.</Text>
 <View onLayout={event=>setWidth(event.nativeEvent.layout.width)} style={{height,marginTop:14,backgroundColor:'#17251e',borderWidth:1,borderColor:'#344137',overflow:'hidden'}}>
  {Array.from({length:rows},(_,row)=><View key={'blocks'+row} style={{position:'absolute',left:'38%',top:20+row*80,width:'24%',height:22,backgroundColor:'#2c3a2f',borderWidth:1,borderColor:'#3c4b3a'}}/>)}
  {route.stops.slice(1).map((_,i)=>{const a=point(i),b=point(i+1),horizontal=a.y===b.y;return <View key={'road'+i} style={{position:'absolute',left:Math.min(a.x,b.x)-(horizontal?0:6),top:Math.min(a.y,b.y)-(horizontal?6:0),width:horizontal?Math.abs(b.x-a.x):12,height:horizontal?12:Math.abs(b.y-a.y),backgroundColor:i+1<current?'#7a805b':'#455348'}}/>;})}
  {route.stops.map((stop,index)=>{const p=point(index),active=index===current,finished=index<current;return <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Preview stop ${index+1} on neighborhood map`} accessibilityState={{selected:selected===index}} onPress={()=>setSelected(index)} style={({pressed})=>({position:'absolute',left:p.x-23,top:p.y-23,width:46,height:46,borderRadius:23,backgroundColor:active?gold:finished?'#445b43':'#1d3026',borderWidth:selected===index?3:1,borderColor:selected===index?paper:finished?'#809473':'#718275',alignItems:'center',justifyContent:'center',opacity:pressed?0.7:1})}><Text style={{fontSize:18,fontWeight:'700',color:active?'#142018':paper}}>{index+1}</Text>{finished&&<Text style={{fontSize:9,color:paper}}>✓</Text>}</Pressable>;})}
  <Text style={{position:'absolute',bottom:12,left:12,color:muted,fontSize:10,letterSpacing:1}}>NUMBERED STOPS · FIXED ROUTE ORDER</Text>
 </View>
 <Text style={[s.caption,{marginTop:12}]}>GOLD = CURRENT · CHECK = RESOLVED · RING = SELECTED</Text>
 <View style={{borderLeftWidth:3,borderLeftColor:gold,paddingLeft:14,marginTop:20}} accessibilityLiveRegion="polite"><Label>MAP PREVIEW · STOP {selected+1} · {status(selected)}</Label><Text style={[s.cardTitle,{fontSize:23}]}>{selectedStop.address} {selectedStop.street}</Text><Text style={s.body}>{selectedStop.title}</Text><Text style={s.caption}>{pickupLoad(selectedStop.answer,selectedStop)} LOAD UNITS</Text><Text style={s.body}>{selectedStop.detail}</Text>{selected<current&&<ServiceReceipt stop={selectedStop} index={selected} Label={Label} s={s} compact/>}<Text style={s.caption}>Previewing never advances a stop. Resolve the current pickup using the route handbook below.</Text></View>
 </View>;
}
