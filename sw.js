/* Service worker : l'app marche sans réseau une fois ouverte.
   Coque de l'app : réseau d'abord, cache en secours (les mises à jour arrivent vite).
   Images (Wikimedia, YouTube) : cache d'abord. Fonds de carte : cache d'abord, limité. */
const V="tabi-v4";
const SHELL=["./","index.html","manifest.webmanifest","app/app.css","app/data.js","app/scenes.js","app/extra.js","app/art.js","app/map.js","app/share.js","app/app.js","vendor/leaflet/leaflet.js","vendor/leaflet/leaflet.css","packs/japon/pack.json","icons/icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("tabi-v")&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const isImg=u=>/(^|\.)wikimedia\.org$/.test(u.hostname)||u.hostname==="i.ytimg.com";
const isTile=u=>/basemaps\.cartocdn\.com$/.test(u.hostname);
const isFont=u=>u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com";
async function trim(name,max){const c=await caches.open(name);const ks=await c.keys();for(let i=0;i<ks.length-max;i++)await c.delete(ks[i])}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.origin===location.origin){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"))));
    return;
  }
  if(isImg(u)||isTile(u)||isFont(u)){
    const name=isImg(u)?"tabi-img-v1":isTile(u)?"tabi-tiles-v1":"tabi-fonts-v1";
    e.respondWith(caches.open(name).then(c=>c.match(r.url).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==="opaque"){c.put(r.url,res.clone());if(isTile(u))trim(name,800)}return res}))));
  }
});
