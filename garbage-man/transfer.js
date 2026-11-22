const {parseSave}=require('./saves');
const MAX_BACKUP_CHARS=64000;
function checksum(text){let value=2166136261;for(let i=0;i<text.length;i++){value^=text.charCodeAt(i);value=Math.imul(value,16777619);}return (value>>>0).toString(16).padStart(8,'0');}
function createBackup(state){
 const clean=parseSave(JSON.stringify(state));if(!clean)throw Error('Current progress cannot be exported.');
 const data=JSON.stringify(clean);const text=JSON.stringify({format:'garbage-man-progress',version:1,data,checksum:checksum(data)});
 if(text.length>MAX_BACKUP_CHARS)throw Error('This backup is too large.');return text;
}
function inspectBackup(text){
 if(typeof text!=='string'||text.length>MAX_BACKUP_CHARS)throw Error('Backup text is missing or too large.');
 let envelope;try{envelope=JSON.parse(text.trim());}catch{throw Error('Backup text is incomplete or not valid JSON.');}
 if(!envelope||envelope.format!=='garbage-man-progress'||envelope.version!==1)throw Error('This is not a supported Garbage Man progress backup.');
 if(typeof envelope.data!=='string'||typeof envelope.checksum!=='string'||checksum(envelope.data)!==envelope.checksum)throw Error('Backup check failed. Copy the complete text again.');
 const state=parseSave(envelope.data);if(!state)throw Error('The backup contains an unsupported game position.');
 return state;
}
module.exports={MAX_BACKUP_CHARS,createBackup,inspectBackup};
