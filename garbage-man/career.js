const {getRoute}=require('./routes');
const MILESTONES=[{count:1,title:'First shift'},{count:5,title:'Route regular'},{count:10,title:'Neighborhood hand'},{count:25,title:'Cedar veteran'}];
function rating(mistakes){return mistakes===0?'Clear shift':mistakes===1?'Steady shift':'Shift resolved';}
function finishShift(state){
 const streak=state.routeMistakes===0?Math.min(Number.MAX_SAFE_INTEGER,state.routeStreak+1):0;
 const record={number:state.routeNumber,version:state.routeVersion,stops:getRoute(state.routeNumber,state.routeVersion).stops.length,corrections:state.routeMistakes,depotVisits:state.routeDepotVisits};
 return {...state,routesCompleted:Math.min(Number.MAX_SAFE_INTEGER,state.routesCompleted+1),routeStreak:streak,routeBestStreak:Math.max(state.routeBestStreak,streak),routeHistory:[record,...state.routeHistory].slice(0,5)};
}
function restoreCareer(raw){
 const validInt=(value,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
 const routeStreak=validInt(raw.routeStreak)?raw.routeStreak:0;
 const routeBestStreak=validInt(raw.routeBestStreak)?Math.max(routeStreak,raw.routeBestStreak):routeStreak;
 const routeHistory=(Array.isArray(raw.routeHistory)?raw.routeHistory:[]).filter(r=>r&&validInt(r.number)&&r.number>0&&[1,2].includes(r.version)&&validInt(r.corrections,999)&&validInt(r.depotVisits,999)).slice(0,5).map(r=>({number:r.number,version:r.version,stops:getRoute(r.number,r.version).stops.length,corrections:r.corrections,depotVisits:r.depotVisits}));
 return {routeStreak,routeBestStreak,routeHistory};
}
module.exports={MILESTONES,rating,finishShift,restoreCareer};
