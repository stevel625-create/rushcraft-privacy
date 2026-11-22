const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
function prepareOffline(root=path.resolve(__dirname,'..')){
 const dist=path.join(root,'dist'),index=path.join(dist,'index.html');
 if(!fs.existsSync(index))throw Error('Export the web app before preparing offline files.');
 for(const size of [192,512])fs.copyFileSync(path.join(root,'web-assets',`icon-${size}.png`),path.join(dist,`icon-${size}.png`));
 const manifest={name:'The Garbage Man',short_name:'Garbage Man',description:'A narrative thriller and recurring sanitation routes.',start_url:'./',scope:'./',display:'standalone',orientation:'portrait',background_color:'#101916',theme_color:'#101916',icons:[192,512].map(size=>({src:`icon-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any'}))};
 fs.writeFileSync(path.join(dist,'manifest.webmanifest'),JSON.stringify(manifest,null,2));
 fs.writeFileSync(path.join(dist,'offline-register.js'),`if ('serviceWorker' in navigator && window.isSecureContext) { window.addEventListener('load', () => { navigator.serviceWorker.register('./offline-worker.js', {scope:'./'}).catch(() => {}); }); }\n`);
 let html=fs.readFileSync(index,'utf8').replace(/src="\/_expo\//g,'src="./_expo/');
 if(!html.includes('manifest.webmanifest'))html=html.replace('</head>','<link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon-192.png"><meta name="theme-color" content="#101916"></head>');
 if(!html.includes('offline-register.js'))html=html.replace('</body>','<script src="./offline-register.js" defer></script></body>');
 fs.writeFileSync(index,html);
 function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.relative(dist,path.join(dir,item.name)).split(path.sep).join('/')]);}
 const resources=['index.html','manifest.webmanifest','offline-register.js','icon-192.png','icon-512.png',...walk(path.join(dist,'_expo','static','js','web')).filter(file=>file.endsWith('.js'))];
 const hash=crypto.createHash('sha256');for(const file of resources)hash.update(fs.readFileSync(path.join(dist,file)));const revision=hash.digest('hex').slice(0,16);
 const worker=`const PREFIX='garbage-man-offline:'+self.registration.scope+':';
const CACHE=PREFIX+${JSON.stringify(revision)};
const FILES=${JSON.stringify(resources)};
const urls=FILES.map(file=>new URL(file,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(event.request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(cache=>cache.match(urls[0])).then(cached=>cached||fetch(event.request)));return;}
 url.search='';url.hash='';if(!urls.includes(url.href))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(url.href)).then(cached=>cached||fetch(event.request)));
});\n`;
 fs.writeFileSync(path.join(dist,'offline-worker.js'),worker);
 console.log(`Prepared offline web copy: ${resources.length} local resources, revision ${revision}`);
 return {resources,revision};
}
if(require.main===module)prepareOffline();
module.exports={prepareOffline};
