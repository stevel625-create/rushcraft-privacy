const {TRUCK_CAPACITY,pickupLoad}=require('./routes');
function minimumDepotVisits(loads){
 let aboard=0,visits=0;
 for(const load of loads){if(aboard+load>TRUCK_CAPACITY){visits++;aboard=0;}aboard+=load;}
 return visits+(aboard>0?1:0);
}
function getBriefing(route){
 const loads=route.stops.map(stop=>pickupLoad(stop.answer,stop));
 return {totalLoad:loads.reduce((sum,load)=>sum+load,0),pickupStops:loads.filter(load=>load>0).length,nonPickupStops:loads.filter(load=>load===0).length,depotTarget:minimumDepotVisits(loads)};
}
function getGoals(route,corrections,visits,complete){
 const {depotTarget}=getBriefing(route);
 return {depotTarget,clear:complete?corrections===0:null,planned:complete?visits<=depotTarget:null};
}
module.exports={minimumDepotVisits,getBriefing,getGoals};
