const {initialState,restore}=require('./game');
const PRIMARY='garbage-man-story-v1',BACKUP='garbage-man-story-backup-v1';
function parseSave(text){
 if(typeof text!=='string')return null;
 try{const raw=JSON.parse(text);if(!raw||Array.isArray(raw)||typeof raw.stage!=='string')return null;const state=restore(raw);return state.stage===raw.stage?state:null;}catch{return null;}
}
async function loadProgress(storage){
 const results=await Promise.allSettled([storage.getItem(PRIMARY),storage.getItem(BACKUP)]);
 const primary=results[0].status==='fulfilled'?parseSave(results[0].value):null;
 if(primary)return {state:primary,recovered:false};
 const backup=results[1].status==='fulfilled'?parseSave(results[1].value):null;
 if(backup)return {state:backup,recovered:true};
 if(results.every(r=>r.status==='fulfilled'&&r.value===null))return {state:initialState(),recovered:false};
 throw new Error('No readable saved progress');
}
async function saveProgress(storage,state,{reset=false}={}){
 const text=JSON.stringify(state);
 if(reset){await storage.setItem(BACKUP,text);await storage.setItem(PRIMARY,text);return;}
 const previous=await storage.getItem(PRIMARY);
 if(previous===text)return;
 if(parseSave(previous))await storage.setItem(BACKUP,previous);
 else{
  const backup=await storage.getItem(BACKUP);
  if(!parseSave(backup))await storage.setItem(BACKUP,text);
 }
 await storage.setItem(PRIMARY,text);
}
module.exports={PRIMARY,BACKUP,parseSave,loadProgress,saveProgress};
