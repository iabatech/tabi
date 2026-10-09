/* ---------- Questions 1 et 2 : ville de départ (monde entier) et dates ---------- */
let WORLD=null;
function loadWorld(){
  if(WORLD)return Promise.resolve(WORLD);
  return fetch("data/world-cities.json?v=1").then(r=>r.json()).then(r=>WORLD=r.map(x=>({n:x[0],cc:x[1],lat:x[2],lon:x[3],tz:x[4],pop:x[5],k:norm(x[0])})));
}
const REGION_FR=(()=>{try{return new Intl.DisplayNames(["fr"],{type:"region"})}catch(e){return null}})();
function ccName(cc){try{return REGION_FR?REGION_FR.of(cc):cc}catch(e){return cc}}
function searchWorld(q){
  const k=norm(q);if(!k||!WORLD)return [];
  const st=[],inc=[];WORLD.forEach(c=>{if(c.k.startsWith(k))st.push(c);else if(k.length>2&&c.k.includes(k))inc.push(c)});
  return st.concat(inc).slice(0,8);
}
function cityRef(c){return {n:c.n,cc:c.cc,lat:c.lat,lon:c.lon,tz:c.tz}}
function findWorld(name){if(!WORLD)return null;const k=norm(name);return WORLD.find(c=>c.k===k)||null}
function tzOff(tz,d){
  try{const s=new Intl.DateTimeFormat("en-US",{timeZone:tz,timeZoneName:"shortOffset"}).formatToParts(d).find(p=>p.type==="timeZoneName").value;
    const m=s.match(/GMT([+-]\d+)(?::(\d+))?/);if(!m)return 0;const h=+m[1];return h+(m[2]?(h<0?-1:1)*(+m[2])/60:0)}catch(e){return null}
}
function inBox(c,b){return c.lat>=b.lat[0]&&c.lat<=b.lat[1]&&c.lon>=b.lon[0]&&c.lon<=b.lon[1]}
function flightEstimate(){
  const F=PACK.flights||{};const c=S.fromCity;if(!c)return null;
  const dest=CITY[AIR[S.arr].c];const sp=F.speed||830;const d=km(c,dest);
  const day=dAt(0)||new Date();const o1=F.tz&&c.tz?tzOff(F.tz,day):null,o2=c.tz?tzOff(c.tz,day):null;
  const lag=o1!=null&&o2!=null?Math.round((o1-o2)*2)/2:null;
  if(d<400)return {local:true,lag};
  const det=(F.detour||[]).find(b=>inBox(c,b));
  const dir=(F.direct||[]).some(n=>norm(n)===norm(c.n));
  let h=d/sp+0.6+(det?det.h:0),via=null;
  if(!dir&&WORLD){
    let best=null,bc=1e9;
    (F.hubs||F.direct||[]).forEach(n=>{const hub=findWorld(n);if(!hub)return;const cost=km(c,hub)+km(hub,dest);if(cost<bc){bc=cost;best=hub}});
    if(best){via=best;const dh=(F.detour||[]).find(b=>inBox(best,b));h=km(c,best)/sp+0.6+km(best,dest)/sp+0.6+(dh?dh.h:0)+2.5}
  }
  return {d,h,dir,via,det,lag};
}
function flightInfo(){
  const c=S.fromCity;
  if(!c)return `<div class="infobox"><span class="k">Le trajet</span><span>Choisis ta ville : j'estime la durée du vol et le décalage horaire.</span></div>`;
  const f=flightEstimate();const F=PACK.flights||{};
  let lines=[];
  if(f.local)lines.push(`Tu pars de ${esc(c.n)} : pas de vol long-courrier.`);
  else if(f.dir)lines.push(`Des vols directs partent souvent de ${esc(c.n)} : environ ${fmtH(f.h)} de vol${f.det?`, ${esc(f.det.note)}`:""}.`);
  else lines.push(`Depuis ${esc(c.n)} : en général une escale${f.via?`, par exemple via ${esc(f.via.n)}`:""}. Compter environ ${fmtH(f.h)} de voyage.`);
  if(f.lag!=null&&f.lag!==0)lines.push(`Décalage horaire : ${f.lag>0?"+":"−"}${String(Math.abs(f.lag)).replace(".",",")} h sur place.${Math.abs(f.lag)>=5?" "+esc(F.lagNote||""):""}`);
  if(!f.local&&f.lag!=null&&f.lag>=5)lines.push(`Pour être sur place le ${longDate(0)}, le départ se fait souvent la veille.`);
  return `<div class="infobox"><span class="k">Le trajet depuis ${esc(c.n)}, ${esc(ccName(c.cc))}</span>${lines.map(l=>`<span>${l}</span>`).join("")}<span class="small">Estimation pour t'orienter, à vérifier au moment de réserver.</span></div>`;
}
function renderFrom(){
  const m=document.getElementById("main");
  m.innerHTML=`<section class="step"><div class="banner">${postcard(P(PACK.cover||"chureito")||PLACES[0])}</div><div class="q-eyebrow">Question 1 sur 4</div><h1 class="q-title">D'où partez-vous ?</h1>
   <div class="citypick"><label class="field" for="fromQ">Ta ville de départ<input id="fromQ" autocomplete="off" spellcheck="false" placeholder="Tape une ville : Lyon, Montréal, Dakar…" value="${esc(S.fromCity?S.fromCity.n:"")}" role="combobox" aria-controls="fromList" aria-expanded="false"></label><ul class="citylist" id="fromList" role="listbox" hidden></ul></div>
   <div class="opts" role="group" aria-label="Villes fréquentes">${HOMES.map(h=>`<button type="button" class="pill" data-act="pickhome" data-v="${esc(h)}" aria-pressed="${!!S.fromCity&&norm(S.fromCity.n)===norm(h)}">${esc(h)}</button>`).join("")}</div>
   <div id="flightBox">${flightInfo()}</div>${navRow(null,!S.fromCity)}</section>`;
  loadWorld().then(()=>{if(!S.fromCity&&S.from){const c=findWorld(S.from);if(c){S.fromCity=cityRef(c);save();refreshFrom()}}}).catch(()=>{});
}
let fromHits=[];
function showFromList(q){
  const ul=document.getElementById("fromList");if(!ul)return;
  fromHits=searchWorld(q);
  ul.innerHTML=fromHits.map((c,i)=>`<li><button type="button" data-act="pickcity" data-v="${i}"><b>${esc(c.n)}</b><span>${esc(ccName(c.cc))}</span></button></li>`).join("")||(q.trim().length>1&&WORLD?`<li class="small" style="padding:10px">Aucune ville trouvée. Essaie la grande ville la plus proche.</li>`:"");
  ul.hidden=!ul.innerHTML;document.getElementById("fromQ").setAttribute("aria-expanded",String(!ul.hidden));
}
function setFrom(c){S.fromCity=cityRef(c);S.from=c.n;save();refreshFrom()}
function refreshFrom(){
  const q=document.getElementById("fromQ");if(!q)return;
  if(S.fromCity&&document.activeElement!==q)q.value=S.fromCity.n;
  const ul=document.getElementById("fromList");if(ul)ul.hidden=true;
  document.getElementById("flightBox").innerHTML=flightInfo();
  document.querySelectorAll('[data-act="pickhome"]').forEach(b=>b.setAttribute("aria-pressed",String(!!S.fromCity&&norm(S.fromCity.n)===norm(b.dataset.v))));
  const nx=document.querySelector('.wz-nav [data-act="next"]');if(nx)nx.disabled=!S.fromCity;
}
/* Dates : premier jour et vol retour ; la durée en découle */
const ISO=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function endDate(){const d=dAt(S.len-1);return d?ISO(d):""}
function validDay(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||""))return false;const y=+v.slice(0,4);return y>=2024&&y<=2040&&!isNaN(new Date(v+"T12:00:00"))}
function renderDates(){
  const m=document.getElementById("main");const today=ISO(new Date());
  m.innerHTML=`<section class="step"><div class="q-eyebrow">Question 2 sur 4</div><h1 class="q-title">Quand partez-vous ?</h1>
   <div class="dates2"><label class="field" for="startDate">Premier jour sur place<input id="startDate" type="date" value="${esc(S.start)}" min="${today}"></label>
   <label class="field" for="endDate">Jour du vol retour<input id="endDate" type="date" value="${esc(endDate())}" min="${esc(S.start)}"></label></div>
   <div class="big-step"><button type="button" class="round" data-act="len" data-v="-1" aria-label="Un jour de moins">−</button><span class="val" id="lenVal">${S.len}<small>jours sur place</small></span><button type="button" class="round" data-act="len" data-v="1" aria-label="Un jour de plus">+</button></div>
   <div class="opts">${[7,10,14,21].map(n=>`<button type="button" class="pill" data-act="lenset" data-v="${n}" aria-pressed="${S.len===n}">${n} jours</button>`).join("")}</div>
   <div><div class="ctrl-label" style="margin-bottom:6px">Votre rythme</div><div class="seg" role="group" aria-label="Rythme">${Object.entries(RY).map(([k,v])=>`<button type="button" data-act="rythme" data-v="${k}" aria-pressed="${S.rythme===k}">${v.label}</button>`).join("")}</div><p class="small" style="margin-top:6px">${RY[S.rythme].day} h de visite par jour, ${RY[S.rythme].eve} h le soir.</p></div>
   <div class="infobox" id="seasonBox">${seasonHTML()}</div>
   ${navRow()}</section>`;
}
function seasonHTML(){const m0=(dAt(0)||new Date()).getMonth()+1;return `<span class="k">À cette période</span><span>${SEASONS[m0]}</span><span class="small">Du ${longDate(0)} au ${longDate(S.len-1)}, vol retour compris.</span>`}
function updateDatesUI(){
  const lv=document.getElementById("lenVal");if(lv)lv.innerHTML=`${S.len}<small>jours sur place</small>`;
  const ed=document.getElementById("endDate");if(ed){ed.min=S.start;if(document.activeElement!==ed)ed.value=endDate()}
  const sb=document.getElementById("seasonBox");if(sb)sb.innerHTML=seasonHTML();
  document.querySelectorAll('[data-act="lenset"]').forEach(b=>b.setAttribute("aria-pressed",String(S.len===+b.dataset.v)));
  renderTop();
}
function onDateChange(t){
  if(!validDay(t.value))return;
  if(t.id==="startDate"){S.start=t.value}
  else{const a=new Date(S.start+"T12:00:00"),b=new Date(t.value+"T12:00:00");const n=Math.round((b-a)/864e5)+1;if(n<2){toast("Le vol retour doit être après le premier jour.");return}S.len=Math.min(60,n)}
  save();updateDatesUI();
}
