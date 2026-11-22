const {getDefaultConfig}=require('expo/metro-config');
const {realpathSync}=require('node:fs');
const path=require('node:path');
const config=getDefaultConfig(__dirname);
// Also support a shared dependency directory in the development workspace.
const modules=realpathSync(path.join(__dirname,'node_modules'));
if(modules!==path.join(__dirname,'node_modules'))config.watchFolders=[...(config.watchFolders||[]),modules];
module.exports=config;
