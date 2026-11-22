const SCENES=[
 ['opening','The Man on Cedar Route'],['yard','The Sanitation Yard'],['mercer','Dusk on Mercer'],['fire','A Face from Fire'],['dead','What the Dead Leave'],['escape','The Bank Escape'],['station','Union Station Locker'],['wife','The Wife Who Buried Him'],['memory','The Memory Trap'],['static','Names in the Static'],['house','The House with No Corners'],['rising','Black Harbor Rising'],['archive','The Dead Man’s Archive'],['cost','The Cost of Returning'],['ashes','Ashes on the Curb'],['permit','Permit at the Wrong Angle'],['service','The Service Road Brother'],['notices','The Man Outside the Notices'],['truck','White Truck, Black File'],['collection','Collection Day'],['blue','The Blue Handle'],['custodian','The Last Custodian of Cedar'],['dawn','Pickup Before Dawn'],
];
function getProgress(stage){
 const recurring=typeof stage==='string'&&stage.startsWith('route_');
 const index=recurring?22:Math.max(0,SCENES.findIndex(([prefix])=>typeof stage==='string'&&stage.startsWith(prefix+'_')));
 const complete=recurring||stage==='complete'||(typeof stage==='string'&&stage.endsWith('_complete'));
 const completed=complete?index+1:index;
 return {scene:index+1,title:SCENES[index][1],recurring,complete,completed,total:SCENES.length,reached:SCENES.slice(0,index+1).map(([,title],i)=>({number:i+1,title,complete:i<completed}))};
}
module.exports={getProgress};
