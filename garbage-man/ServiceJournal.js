import React from 'react';
import {Text,View} from 'react-native';
const {pickupLoad}=require('./routes');
const OUTCOMES={
 collect:{title:'Pickup completed',text:'The listed load is aboard. The bin is returned to the curb and the stop is marked resolved.'},
 recycle:{title:'Recycling collected',text:'The listed material is recorded for the recycling stream. The collection point is left clear.'},
 request:{title:'Service request recorded',text:'The unbooked item stays in place. A bulk-service request is noted; a collection date has not been promised.'},
 hold:{title:'Hold recorded',text:'The load is left untouched. The reason is noted for review; this stop is resolved for the current shift.'},
};
export function outcome(stop){
 if(stop.id==='blocked')return {title:'Access hold recorded',text:'The blocked collection point is left alone. The access issue is noted; the truck continues without forcing the pickup.'};
 if(stop.id==='unknown')return {title:'Unknown-container hold recorded',text:'The container remains closed and untouched. Its appearance does not establish contents or safety.'};
 return OUTCOMES[stop.answer];
}
export function ServiceReceipt({stop,index,Label,s,compact=false}){
 const result=outcome(stop);
 return <View style={compact?{marginTop:14}:s.card}><Label>{compact?'SERVICE OUTCOME':`LAST SERVICE · STOP ${index+1}`}</Label><Text style={[s.cardTitle,{fontSize:compact?20:24}]}>{result.title}</Text><Text style={s.body}>{result.text}</Text>{!compact&&<Text style={s.caption}>{stop.address} {stop.street} · {pickupLoad(stop.answer,stop)} units collected</Text>}</View>;
}
export default function ServiceJournal({route,current,Label,s}){
 const completed=route.stops.slice(0,current),counts={collect:0,recycle:0,request:0,hold:0};
 completed.forEach(stop=>counts[stop.answer]++);
 return <View style={s.card}><Label>SHIFT JOURNAL · {completed.length}/{route.stops.length} STOPS RESOLVED</Label><Text style={s.body}>Pickups: {counts.collect} · Recycling: {counts.recycle}.{ '\n'}Holds: {counts.hold} · Service requests: {counts.request}.</Text><Text style={s.caption}>Collected material still needs a depot visit. A recorded hold or request does not guarantee a future service date.</Text>{completed.length?completed.map((stop,index)=><View key={index} style={{borderBottomWidth:1,borderColor:'#344137',paddingVertical:16}}><Label>STOP {index+1} · {stop.address} {stop.street.toUpperCase()}</Label><Text style={[s.cardTitle,{fontSize:20}]}>{stop.title}</Text><ServiceReceipt stop={stop} index={index} Label={Label} s={s} compact/></View>):<Text style={s.body}>Resolve a stop to add its receipt here. Previewing the map or opening the sheet does not create a service record.</Text>}<Text style={s.caption}>Fictional shift records only. No service request is sent outside the game. The current journal resumes from saved stop progress and resets with the next shift.</Text></View>;
}
