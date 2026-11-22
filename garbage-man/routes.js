// Original repeatable gameplay, separate from the manuscript campaign.
const TASKS=[
 {id:'household',title:'Tied household bags',detail:'Two tied bags beside an ordinary household bin. The pickup is on today’s sheet.',rule:'Ordinary listed household waste goes on the regular pickup.',answer:'collect'},
 {id:'glass',title:'Loose broken glass',detail:'A torn bag has left visible glass beside the bin.',rule:'Loose glass needs a recorded hazard hold, not a regular pickup.',answer:'hold'},
 {id:'overflow',title:'Extra bulk item',detail:'A worn armchair stands beside a bin, without a bulk booking on the sheet.',rule:'Unbooked bulk items need a service request; continue the regular route.',answer:'request'},
 {id:'recycle',title:'Clean recycling',detail:'A registered blue-lidded cart holds flattened cardboard and rinsed cans.',rule:'Listed clean recycling goes to the recycling stream.',answer:'recycle'},
 {id:'blocked',title:'Blocked access',detail:'A parked vehicle blocks the collection point. There is no safe working clearance.',rule:'Record blocked access and continue; do not force the pickup.',answer:'hold'},
 {id:'unknown',title:'Unidentified container',detail:'An unlabelled sealed container sits outside the listed household waste.',rule:'Unknown containers need a hazard hold. Do not open or identify them by appearance.',answer:'hold'},
];
const EXTRA_TASKS=[
 {id:'booked_bulk',title:'Booked small bulk pickup',detail:'A boxed stool is listed on today’s approved small-bulk sheet.',rule:'A listed small-bulk item goes on the regular pickup.',answer:'collect'},
 {id:'cardboard',title:'Flattened cardboard bundle',detail:'A tied, dry bundle is listed for recycling beside the registered cart.',rule:'Listed clean cardboard goes to the recycling stream.',answer:'recycle'},
 {id:'missed_bin',title:'Approved missed-bin return',detail:'Dispatch has approved a return for one ordinary household bag.',rule:'An approved household return goes on the regular pickup.',answer:'collect'},
 {id:'paint',title:'Unlisted paint tins',detail:'Paint tins stand outside the approved household load, with no special booking.',rule:'Unlisted chemical waste needs a hazard hold, not a regular pickup.',answer:'hold'},
];
const ANSWERS=[['collect','REGULAR PICKUP'],['recycle','RECYCLING STREAM'],['request','BOOK A SERVICE REQUEST'],['hold','RECORD A HOLD']];
function getRoute(number,version=1){
 const n=Number.isSafeInteger(number)&&number>0?number:1;
 let seed=(n%4294967295)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const streets=['Cedar','Pearson','Birch','Ridge','Latham','Laurel','Morton','Maple'];
 const weather=['Cold clear dawn','Light rain','Low morning fog','Wind and fallen leaves'];
 const conditions=weather[random()%weather.length];
 const count=5+Math.min(3,Math.floor((n-1)/3));
 // Shuffle a fresh task deck; every route includes several different decisions.
 const deck=(version===2?[...TASKS,...EXTRA_TASKS]:TASKS).map(task=>({...task,load:['collect','recycle'].includes(task.answer)?version===2&&['household','cardboard','missed_bin'].includes(task.id)?1:2:0}));
 for(let i=deck.length-1;i>0;i--){const j=random()%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
 const stops=Array.from({length:count},(_,i)=>({...deck[i%deck.length],street:streets[random()%streets.length],address:10+random()%190}));
 return {number:n,conditions,stops};
}
const TRUCK_CAPACITY=3;
function pickupLoad(answer,stop){return ['collect','recycle'].includes(answer)?stop?.load??2:0;}
module.exports={getRoute,ANSWERS,TRUCK_CAPACITY,pickupLoad};
