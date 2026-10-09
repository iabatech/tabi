/* ---------- Partage, aujourd'hui, hors ligne, repli des images ---------- */
const SHARE_KEYS=["from","start","len","rythme","arr","ret","musts","nope","chosen","active","sel","custom","delta","hotels","dropWeb","researchDone","step"];
function todayIdx(pl){const s=new Date(S.start+"T00:00:00");if(isNaN(s)||!pl)return -1;const n=new Date();n.setHours(0,0,0,0);const i=Math.round((n-s)/864e5);return i>=0&&i<pl.total?i:-1}
const b64u={enc:u8=>{let s="";u8.forEach(c=>s+=String.fromCharCode(c));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},dec:str=>{const s=atob(str.replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(s,c=>c.charCodeAt(0))}};
async function packState(){
  const o={};SHARE_KEYS.forEach(k=>o[k]=S[k]);o.d=PACK.id;const raw=new TextEncoder().encode(JSON.stringify(o));
  if(window.CompressionStream){try{const z=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();return "z"+b64u.enc(new Uint8Array(z))}catch(e){}}
  return "j"+b64u.enc(raw);
}
async function unpackState(code){
  const kind=code[0],bytes=b64u.dec(code.slice(1));let raw=bytes;
  if(kind==="z"){raw=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer())}
  return JSON.parse(new TextDecoder().decode(raw));
}
let shareUrl="";
async function shareSheet(){
  const code=await packState();
  shareUrl=location.origin+location.pathname+(PACK.id!=="japon"?"?d="+PACK.id:"")+"#v="+code;
  openSheet(`<h2 style="font-size:26px">Partager ce voyage</h2>
   <p class="lead" style="margin-top:6px">Envoie ce lien : la personne qui l'ouvre retrouve exactement ce programme, avec tes lieux, tes hôtels et tes réglages. Le voyage reste dans le lien, il n'est stocké sur aucun serveur.</p>
   <div class="share-box"><input id="shareUrl" readonly value="${esc(shareUrl)}" aria-label="Lien du voyage"></div>
   <div class="f-actions">${navigator.share?`<button type="button" class="btn" data-act="nativeshare">Envoyer…</button>`:""}<button type="button" class="btn ${navigator.share?"quiet":""}" data-act="copylink">Copier le lien</button></div>
   <p class="small" style="margin-top:14px">Si tu modifies le voyage ensuite, renvoie un nouveau lien : chacun garde sa copie sur son téléphone.</p>`);
}
async function copyLink(){try{await navigator.clipboard.writeText(shareUrl);toast("Lien copié.")}catch(e){const i=document.getElementById("shareUrl");if(i){i.select();document.execCommand&&document.execCommand("copy")}toast("Lien sélectionné, copie-le.")}}
async function nativeShare(){try{await navigator.share({title:`${PACK.brand} : notre voyage`,text:"Notre programme de voyage, jour par jour.",url:shareUrl})}catch(e){}}
let pendingImport=null;
async function checkImport(){
  const m=location.hash.match(/^#v=([zj][A-Za-z0-9_-]+)/);if(!m)return;
  try{pendingImport=await unpackState(m[1])}catch(e){toast("Ce lien de voyage est illisible.");return}
  if(pendingImport.d&&pendingImport.d!==PACK.id){toast("Ce lien concerne une autre destination.");return}
  if(!S.chosen||S.step<6){acceptImport();return}
  openSheet(`<h2 style="font-size:24px">Ouvrir le voyage reçu ?</h2><p class="lead" style="margin-top:6px">Il remplacera le programme enregistré sur ce téléphone.</p><div class="f-actions"><button type="button" class="btn" data-act="import">Ouvrir le voyage reçu</button><button type="button" class="btn quiet" data-act="close">Garder le mien</button></div>`);
}
function acceptImport(){
  if(!pendingImport)return;const o=pendingImport;pendingImport=null;
  SHARE_KEYS.forEach(k=>{if(o[k]!==undefined)S[k]=o[k]});if(S.chosen&&S.step<6)S.step=6;S.tab="jours";
  history.replaceState(null,"",location.pathname+location.search);
  closeSheet();save();computePlans();render(true);toast("Voyage ouvert. Il est maintenant enregistré sur ce téléphone.");
}
/* Hors ligne : on met en cache les images et les fiches des lieux du voyage */
function offlineUrls(){
  const pl=plan();const ids=new Set();pl.list.forEach(d=>d.items.forEach(x=>ids.add(x.id)));
  const urls=new Set();
  ids.forEach(id=>{const p=P(id);if(!p||!p.g)return;const G=p.g;
    (G.photos||[]).forEach((im,i)=>{urls.add(thumb(im.src,i===0?960:960));urls.add(thumb(im.src,330))});
    (G.hist||[]).forEach(im=>urls.add(im.src));[G.person,G.folk].forEach(im=>{if(im)urls.add(im.src)})});
  return [...urls];
}
function offlineSheet(){
  const n=offlineUrls().length;
  openSheet(`<h2 style="font-size:26px">Utiliser l'app sans réseau</h2>
   <ol class="howto"><li>Ajoute l'app à l'écran d'accueil : sur iPhone, bouton Partager puis « Sur l'écran d'accueil » ; sur Android, menu ⋮ puis « Installer l'application ».</li><li>Touche « Télécharger les images » ci-dessous, en wifi de préférence.</li><li>Ensuite, programme, fiches, guide et glossaire marchent sans réseau. Les cartes ont besoin du réseau, sauf les zones déjà affichées.</li></ol>
   <div class="f-actions"><button type="button" class="btn" data-act="dloffline">Télécharger les images (${n})</button></div><p class="small" id="dlState" style="margin-top:10px"></p>`);
}
async function downloadOffline(btn){
  if(!("caches" in window)){toast("Ce navigateur ne permet pas le mode hors ligne.");return}
  btn.disabled=true;const st=document.getElementById("dlState");const urls=offlineUrls();let ok=0,ko=0;
  const c=await caches.open("tabi-img-v1");
  const q=urls.slice();const worker=async()=>{while(q.length){const u=q.shift();try{if(await c.match(u)){ok++;continue}let r;try{r=await fetch(u,{mode:"cors"})}catch(e){r=await fetch(u,{mode:"no-cors"})}if(r&&(r.ok||r.type==="opaque")){await c.put(u,r);ok++}else ko++}catch(e){ko++}st.textContent=`${ok+ko} sur ${urls.length}${ko?`, ${ko} en échec`:""}`}};
  await Promise.all([worker(),worker(),worker(),worker()]);
  st.textContent=ko?`${ok} images prêtes, ${ko} en échec : relance plus tard.`:`C'est prêt : ${ok} images disponibles sans réseau.`;btn.disabled=false;
}
function registerSW(){if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(()=>{})}
/* Repli : vignette 330 px en échec, on tente la 960 px, puis le dessin */
document.addEventListener("error",e=>{const im=e.target;if(!(im instanceof HTMLImageElement))return;
  const full=im.dataset.full;if(full&&im.src!==full&&!im.dataset.tried){im.dataset.tried="1";im.src=full;return}
  if(im.classList.contains("pc")&&im.dataset.pid){const p=P(im.dataset.pid);if(p){im.outerHTML=sceneSVG(p)}}},true);
