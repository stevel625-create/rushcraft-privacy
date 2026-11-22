const {spawnSync}=require('node:child_process');
const {prepareOffline}=require('./offline-web');
const result=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['expo','export','--platform','web'],{cwd:require('node:path').resolve(__dirname,'..'),stdio:'inherit',env:process.env});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status||1);
prepareOffline();
