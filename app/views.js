/* ---------- Écrans du voyage, version 2 ----------
   Jours : un jour à la fois, onglets de dates, visites numérotées, trajets entre visites (inspiré de Wanderlog).
   Carte : carte plein écran et panneau d'étapes qui glisse par-dessus (inspiré de Polarsteps). */
const dPill=new Intl.DateTimeFormat("fr-FR",{weekday:"short"}),dPill2=new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"short"});
const dHead=new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"});
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
function firstSentence(t,n){t=String(t||"");const m=t.match(/^.+?[.!?](\s|$)/);t=(m?m[0]:t).trim();return t.length>(n||130)?t.slice(0,(n||130)-1).replace(/\s+\S*$/,"")+"…":t}
function legInfo(a,b){if(!a.lat||!b.lat)return null;const k=km(a,b);const walk=k<1.3;const min=walk?Math.max(2,Math.round(k*14)):Math.round(12+k*3);return {k,walk,min}}
function fmtMin(m){return m<60?`${m} min`:fmtH(m/60)}
function curDay(pl){let i=S.dayIdx;if(i==null||i<0||i>=pl.total){const t=todayIdx(pl);i=t>=0?t:0}S.dayIdx=i;return i}
function renderJours(){
  const pl=plan(),o=pl.opt;const m=document.getElementById("main");const i=curDay(pl);const d=pl.list[i];const ti=todayIdx(pl);
  const pinOver=pl.over.filter(p=>pl.st(p)==="pin"),other=pl.over.filter(p=>pl.st(p)!=="pin");
  const nAdj=(pl.log.length?1:0)+(pl.dropped.length?1:0)+(pinOver.length?1:0)+(other.length?1:0);
  let h=`<div class="jx-head"><div style="min-width:0"><div class="q-eyebrow">Itinéraire ${o.k} · ${esc(o.n)}</div><h1 class="jx-title">${esc(CITY[pl.order[0]].n)} → ${esc(CITY[pl.order[pl.order.length-1]].n)}</h1><p class="jx-dates">${pl.total} jours · du ${longDate(0)} au ${longDate(pl.total-1)}</p></div>
   <div class="jx-acts"><button type="button" class="icb" data-act="share" aria-label="Partager ce voyage" title="Partager">${ICON.share}</button><button type="button" class="icb" data-act="offline" aria-label="Hors ligne" title="Hors ligne">${ICON.down}</button></div></div>`;
  h+=`<div class="jx-pills" id="jxPills" role="tablist" aria-label="Jours du voyage">${pl.list.map(x=>{const dt=dAt(x.idx);return `<button type="button" role="tab" class="jx-pill ${x.idx===i?"on":""} ${x.idx===ti?"today":""}" aria-selected="${x.idx===i}" data-act="jday" data-v="${x.idx}"><b>${dt?esc(dPill.format(dt).replace(".","")):"J"+(x.idx+1)}</b><span>${dt?esc(dPill2.format(dt)):""}</span></button>`}).join("")}</div>`;
  const rows=schedule(d,pl);const stops=rows.filter(r=>r.k==="stop");
  const hours=stops.reduce((s,r)=>s+r.p.d,0);
  let walkKm=0;stops.forEach((r,k)=>{const nx=stops[k+1];if(nx){const L2=legInfo(r.p,nx.p);if(L2&&L2.walk)walkKm+=L2.k}});
  const dt=dAt(i);
  h+=`<section class="jx-day" id="jxDay"><div class="jx-dh"><div style="min-width:0"><h2>${dt?esc(cap(dHead.format(dt))):"Jour "+(i+1)}</h2><div class="jx-sub">Jour ${i+1}${i===ti?' · <span class="today-badge">Aujourd\'hui</span>':""} · ${esc(d.city.n)} <span lang="ja">${d.city.jp}</span></div></div></div>
   ${(()=>{const ids=d.items.map(x=>x.id);const hp=P(ids.find(id=>pl.st(P(id))==="pin")||ids[0]);return hp&&hp.g?`<button type="button" class="jx-cover" data-act="open" data-id="${hp.id}" aria-label="Ouvrir la fiche : ${esc(hp.n)}">${postcard(hp)}<span class="jx-cover-t">${esc(hp.n)}</span></button>`:""})()}
   <div class="jx-sum">${stops.length?`${stops.length} visite${stops.length>1?"s":""} · ${fmtH(hours)} sur place${walkKm>=0.3?` · ${walkKm.toFixed(1).replace(".",",")} km à pied`:""}`:"Journée légère"}</div>`;
  h+=`<ol class="jx-list">`;
  if(d.first)h+=`<li class="jx-row hotel"><span class="jx-ic" aria-hidden="true">宿</span><div class="jx-rb"><label for="hotel-${d.city.id}">Ton hôtel à ${esc(d.city.n)}</label><input id="hotel-${d.city.id}" data-hotel="${d.city.id}" placeholder="Nom de l'hôtel, à remplir" value="${esc(S.hotels[d.city.id]||"")}"><span class="jx-hint">${esc(d.city.hotel)}</span></div></li>`;
  let n=0;
  rows.forEach((r,k)=>{
    if(r.k==="transit"){const fl=/vol/i.test(r.txt);h+=`<li class="jx-row transit"><span class="jx-ic" aria-hidden="true">${fl?"飛":"電"}</span><div class="jx-rb">${r.t!=null?`<span class="tchip">${hhmm(r.t)}</span>`:""}<span>${esc(r.txt)}</span></div></li>`;
      if(d.first&&d.prev&&k===0)routeTips(d.prev,d.city.id).forEach(x=>{h+=`<li class="jx-row tip"><span class="jx-ic" aria-hidden="true">得</span><div class="jx-rb"><b>${esc(x.n)}</b><span>${esc(x.why)}</span></div></li>`})}
    else if(r.k==="lunch")h+=`<li class="jx-lunch"><span class="tchip">${hhmm(r.t)}</span> Pause déjeuner : regarde « Autour, ce jour-là » plus bas</li>`;
    else if(r.k==="evesep")h+=`<li class="jx-eve">Le soir</li>`;
    else{
      n++;const p=r.p;const pin=pl.st(p)==="pin";
      h+=`<li class="jx-stop ${flashIds.has(p.id)?"moved":""}"><button type="button" data-act="open" data-id="${p.id}"><span class="jx-pin ${pin?"pin":""}">${n}</span><span class="jx-body"><b>${esc(p.n)}</b>${p.h?`<span class="jx-desc">${esc(firstSentence(p.h))}</span>`:""}<span class="jx-chips"><span class="tchip">${hhmm(r.t)}</span><span class="dchip">${fmtDur(p.d)}</span>${pin?'<span class="pchip">Incontournable</span>':""}</span></span><span class="jx-th">${postcard(p,"",330)}</span></button></li>`;
      const nx=rows.slice(k+1).find(x=>x.k==="stop");
      if(nx){const L2=legInfo(p,nx.p);if(L2)h+=`<li class="jx-leg"><span class="jx-ic sm" aria-hidden="true">${L2.walk?"歩":"電"}</span><span>${L2.walk?`${fmtMin(L2.min)} à pied`:`environ ${fmtMin(L2.min)} en transports`} · ${L2.k.toFixed(1).replace(".",",")} km</span><a href="${gdir(p,nx.p,L2.walk?"walking":"transit")}" target="_blank" rel="noopener">Itinéraire</a></li>`}
    }
  });
  if(!n)h+=`<li class="jx-empty">${d.last?"Temps libre avant le départ.":i===0?"Installation et repos après le vol.":"Journée libre : flâner, se reposer, ou ajouter un lieu depuis l'onglet Lieux."}</li>`;
  h+=`</ol>`;
  const near=[];const seen=new Set();d.items.forEach(x=>{const p=P(x.id);if(p)nearAddr(p,0.9).forEach(a=>{if(!seen.has(a.id)){seen.add(a.id);near.push(a)}})});
  if(near.length)h+=`<div class="around"><span class="around-k">Autour, ce jour-là</span><div class="around-l">${near.slice(0,6).map(a=>`<button type="button" class="achip" data-act="addr" data-v="${esc(a.id)}"><i aria-hidden="true">${(ADDR_KIND[a.k]||["","店"])[1]}</i>${esc(a.n)}</button>`).join("")}</div></div>`;
  h+=`<div class="jx-nav">${i>0?`<button type="button" class="btn quiet sm" data-act="jday" data-v="${i-1}">← Jour ${i}</button>`:"<span></span>"}${i<pl.total-1?`<button type="button" class="btn quiet sm" data-act="jday" data-v="${i+1}">Jour ${i+2} →</button>`:"<span></span>"}</div></section>`;
  h+=`<details class="jx-set"${nAdj&&(pinOver.length)?" open":""}><summary>Rythme, jours par ville et ajustements${nAdj?` <span class="jx-badge">${nAdj}</span>`:""}</summary>
   <div class="controls"><span class="ctrl-label">Rythme</span><div class="seg" role="group" aria-label="Rythme">${Object.entries(RY).map(([k,v])=>`<button type="button" data-act="rythme" data-v="${k}" aria-pressed="${S.rythme===k}">${v.label}</button>`).join("")}</div></div>
   <p class="small">Pour changer le nombre de jours par ville, ouvre l'onglet Carte.</p>`;
  if(pl.log.length)h+=`<div class="notice info"><strong>Jours redistribués automatiquement</strong><ul>${pl.log.map(l=>`<li>${esc(l)}</li>`).join("")}</ul></div>`;
  if(pl.dropped.length)h+=`<div class="notice warn"><strong>Étapes retirées faute de jours</strong><span>${pl.dropped.map(c=>esc(CITY[c].n)).join(", ")}. Ajoute des jours au voyage pour les retrouver.</span></div>`;
  if(pinOver.length)h+=`<div class="notice crit"><strong>Incontournable sans place</strong><span>${pinOver.map(p=>esc(p.n)).join(", ")} ne rentre pas. Passe en rythme soutenu ou ajoute un jour à ${esc(CITY[pinOver[0].c].n)}.</span></div>`;
  if(other.length)h+=`<div class="notice warn"><strong>Hors programme, faute de temps</strong><span>${other.map(p=>`<button type="button" class="chip" data-act="open" data-id="${p.id}">${esc(p.n)}</button>`).join(" ")}</span></div>`;
  h+=`</details><button type="button" class="fab" data-act="day" data-v="${i}" aria-label="Carte et itinéraire du jour">${ICON.map}<span>Carte du jour</span></button>`;
  m.innerHTML=h;
  document.documentElement.style.setProperty("--toph",document.getElementById("top").offsetHeight+"px");
  const pill=document.querySelector(".jx-pill.on");if(pill)pill.scrollIntoView({block:"nearest",inline:"center"});
  bindDaySwipe();
}
function bindDaySwipe(){
  const el=document.getElementById("jxDay");if(!el)return;let x0=null,y0=0;
  el.addEventListener("touchstart",e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY},{passive:true});
  el.addEventListener("touchend",e=>{if(x0==null)return;const t=e.changedTouches[0];const dx=t.clientX-x0,dy=t.clientY-y0;x0=null;if(Math.abs(dx)>70&&Math.abs(dy)<50){const pl=plan();const ni=S.dayIdx+(dx<0?1:-1);if(ni>=0&&ni<pl.total){S.dayIdx=ni;save();render(false);window.scrollTo({top:0})}}},{passive:true});
}
/* Carte plein écran et panneau d'étapes */
let SNAP=1;const SNAPS=[0.3,0.52,0.84];
function placeMapFrame(){
  const f=document.getElementById("pmap");if(!f)return;
  const top=document.getElementById("top").getBoundingClientRect().bottom;const nav=document.getElementById("nav");const nb=nav&&!nav.hidden?Math.max(0,window.innerHeight-nav.getBoundingClientRect().top):0;
  f.style.top=Math.max(0,top)+"px";f.style.bottom=nb+"px";
  const sh=document.getElementById("psheet");if(sh)sh.style.height=Math.round(f.clientHeight*SNAPS[SNAP])+"px";
}
function renderCarte(){
  const pl=plan();const m=document.getElementById("main");
  const span=c=>{const ds=pl.list.filter(d=>d.city.id===c);return [ds[0].idx,ds[ds.length-1].idx]};
  const cards=pl.order.map((c,k)=>{const C=CITY[c];const [a,b]=span(c);const ph=allPlaces().find(p=>p.c===c&&p.g);const n=pl.days[c];
    let leg="";if(k>0){const pc=pl.order[k-1];const fl=CITY[pc].flight||C.flight;const tips=routeTips(pc,c);leg=`<li class="ps-leg"><span class="jx-ic sm" aria-hidden="true">${fl?"飛":"電"}</span><span>${esc(legMode(pc,c))} · ${fmtH(legH(pc,c))}</span>${tips.length?`<span class="ps-tip">${tips.length} bon${tips.length>1?"s":""} plan${tips.length>1?"s":""}</span>`:""}</li>`}
    return leg+`<li class="ps-card"><button type="button" class="ps-open" data-act="city" data-v="${c}"><span class="ps-th">${ph?postcard(ph,"",330):""}<i>${k+1}</i></span><span class="ps-b"><b>${esc(C.n)} ›</b><span>${esc(dateOf(a))}${a!==b?" au "+esc(dateOf(b)):""}</span>${(ADDR[c]||[]).length?`<span class="ps-sub">${(ADDR[c]||[]).length} adresses stylées</span>`:""}</span></button><span class="ps-days"><button type="button" data-act="dminus" data-id="${c}" aria-label="Un jour de moins à ${esc(C.n)}">−</button><span><b>${n}</b>jour${n>1?"s":""}</span><button type="button" data-act="dplus" data-id="${c}" aria-label="Un jour de plus à ${esc(C.n)}">+</button></span></li>`}).join("");
  const used=pl.order.reduce((s,c)=>s+pl.days[c],0);
  m.innerHTML=`<div class="pmap" id="pmap"><div id="mapT" class="pmap-map"></div>
   <div class="pm-chips"><button type="button" class="pm-chip on" data-act="layer" data-v="places" aria-pressed="true">Lieux du programme</button><button type="button" class="pm-chip" data-act="layer" data-v="addr" aria-pressed="false">Adresses stylées</button></div>
   <section class="psheet" id="psheet" aria-label="Étapes du voyage"><button type="button" class="ps-grab" data-act="snap" aria-label="Agrandir ou réduire le panneau"><span></span></button>
    <div class="ps-in"><div class="ps-h"><span class="jx-ic" aria-hidden="true">始</span><div><b>Le voyage commence</b><span>${esc(longDate(0))}</span></div><span class="ps-ring" style="--p:${Math.round(Math.min(1,used/pl.total)*100)}"><b>${used}/${pl.total}</b><small>jours</small></span><button type="button" class="icb" data-act="share" aria-label="Partager ce voyage">${ICON.share}</button></div>
    <ol class="ps-list">${cards}<li class="ps-end"><span class="jx-ic sm" aria-hidden="true">終</span><span>Vol retour le ${esc(longDate(pl.total-1))}</span></li></ol>
    ${routeTipsHTML(pl)}</div></section></div>`;
  placeMapFrame();
  const sh=document.getElementById("psheet");
  const mp=tripMap(document.getElementById("mapT"),pl,{noCtl:true,padBottom:sh?sh.offsetHeight+20:30});
  window._tmap=mp;
}
function toggleLayer(btn){
  const mp=window._tmap;if(!mp||!mp._tabi)return;const L2=btn.dataset.v==="addr"?mp._tabi.addrL:mp._tabi.placesL;
  const on=!mp.hasLayer(L2);if(on)mp.addLayer(L2);else mp.removeLayer(L2);btn.classList.toggle("on",on);btn.setAttribute("aria-pressed",String(on));
}
function cycleSnap(){SNAP=(SNAP+1)%SNAPS.length;placeMapFrame();const mp=window._tmap;if(mp)setTimeout(()=>mp.invalidateSize(),260)}
window.addEventListener("resize",()=>{if(S.tab==="carte")placeMapFrame()},{passive:true});
const ICON={
  share:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  down:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  map:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14"/><path d="M15 6v14"/></svg>'
};
