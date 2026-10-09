/* Tabi : moteur d'itinéraire et interface. Ne contient aucune donnée de destination. */
/* ---------- Outils ---------- */
const ALLP=PLACES.concat(PLACES2);
const CITY=Object.fromEntries(CITIES.map(c=>[c.id,c]));
const AIR=Object.fromEntries(AIRPORTS.map(a=>[a.id,a]));
const MUST=Object.fromEntries(MUSTS.map(m=>[m.id,m]));
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[-'’_.,!?:;()«»"#@/]/g," ").replace(/\s+/g," ").trim()}
function fmtDur(d){const h=Math.floor(d);const m=Math.round((d-h)*60);return h?`${h} h${m?" "+m:""}`:`${m} min`}
function fmtH(h){const q=Math.round(h*4)/4;const H=Math.floor(q);const m=Math.round((q-H)*60);return `${H?H+" h":""}${m?(H?" ":"")+m+(H?"":" min"):""}`||"moins d'une heure"}
function hhmm(t){const h=Math.floor(t+1e-9);const m=Math.round((t-h)*60);return `${h}h${String(m).padStart(2,"0")}`}
function km(a,b){const R=6371,r=Math.PI/180;const dl=(b.lat-a.lat)*r,dn=(b.lon-a.lon)*r;const x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function trainH(a,b){const A=CITY[a],B=CITY[b];const d=km(A,B);let h;if(d<80)h=(A.rural||B.rural)?0.5+d/60:0.35+d/80;else h=0.4+d/230+(A.rural?0.9:0)+(B.rural?0.9:0);return h}
function legH(a,b){if(a===b)return 0;const A=CITY[a],B=CITY[b];let h;
  if(A.flight&&B.flight)h=4.5;
  else if(A.flight||B.flight){const o=A.flight?b:a;h=3+Math.min(...HUBS.map(x=>x===o?0:trainH(o,x)))}
  else h=trainH(a,b);
  return Math.round(h*4)/4}
function legMode(a,b){const A=CITY[a],B=CITY[b];if(A.flight||B.flight)return "Vol intérieur";const d=km(A,B);if(d<70)return "Train local";if(A.rural||B.rural)return "Train et bus";return "Shinkansen ou train express"}
const P=id=>ALLP.find(p=>p.id===id)||S.custom.find(p=>p.id===id);
function allPlaces(){return ALLP.concat(S.custom)}
function tile(p,cls){return `<div class="tile ${cls||''}">${postcard(p,"",cls==="big"?960:330)}</div>`}

/* Mots-clés pour reconnaître les lieux dans les textes collés */
function keywordsOf(p){const k=(KW[p.id]||[]).map(norm);if(!KW[p.id]||!KW[p.id].length){k.push(norm(p.n))}return k.filter(x=>x.length>=4)}

/* ---------- État ---------- */
const KEY="tabi-"+PACK.id+"-v3";
function defaults(){return {step:0,from:"Paris",start:"2027-04-05",len:14,rythme:"normal",arr:"HND",ret:"KIX",musts:[],nope:[],hist:[],mosaic:false,dropWeb:[],researchDone:false,sources:[],found:[],analysis:null,chosen:null,active:"A",sel:{},custom:[],delta:{},hotels:{},tab:"jours",filter:"all"}}
let S=defaults();
try{const raw=localStorage.getItem(KEY)||(PACK.id==="japon"?localStorage.getItem("tabi-modele-japon-v2"):null);if(raw)S=Object.assign(defaults(),JSON.parse(raw))}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- Moteur ---------- */
const RY={doux:{day:6,eve:2,arr:2,last:2,label:"Doux"},normal:{day:8,eve:3,arr:3,last:3,label:"Normal"},soutenu:{day:10,eve:4,arr:4,last:4,label:"Soutenu"}};
const MRANK={matin:0,journee:1,aprem:2,soir:3};

function orderCities(list,start,end,loop){
  const mid=list.filter(c=>c!==start&&c!==end);
  if(mid.length>9){ /* repli : plus proche voisin */
    const out=[start];let cur=start;const rest=mid.slice();
    while(rest.length){rest.sort((a,b)=>legH(cur,a)-legH(cur,b));cur=rest.shift();out.push(cur)}
    if(end!==start)out.push(end);return out;
  }
  let best=null,bestCost=1e9;
  const used=new Array(mid.length).fill(false),cur=[];
  function rec(prev,cost){
    if(cost>=bestCost)return;
    if(cur.length===mid.length){
      let c=cost+(end!==start?legH(prev,end):(loop?legH(prev,start)*0.6:0));
      if(c<bestCost){bestCost=c;best=cur.slice()}return;
    }
    for(let i=0;i<mid.length;i++){if(used[i])continue;used[i]=true;cur.push(mid[i]);rec(mid[i],cost+legH(prev,mid[i]));cur.pop();used[i]=false}
  }
  rec(start,0);
  const out=[start].concat(best||mid);if(end!==start)out.push(end);return out;
}

function planCity(cid,n,items,R,o){
  const days=[];
  for(let i=0;i<n;i++){
    let cap=R.day,eve=R.eve;
    if(i===0){cap=o.isFirst?R.arr:Math.max(0,R.day-o.pen);if(o.isFirst)eve=0}
    if(o.isLast&&i===n-1){cap=Math.max(0,Math.min(cap,R.last-o.retLeg));eve=0}
    days.push({cap,used:0,eve,eveUsed:0,areas:new Set(),items:[],first:i===0,arrival:o.isFirst&&i===0,last:o.isLast&&i===n-1});
  }
  const tot={};items.forEach(p=>tot[p.a]=(tot[p.a]||0)+p.d);
  const sorted=items.slice().sort((x,y)=>((o.st(y)==="pin")-(o.st(x)==="pin"))||(tot[y.a]-tot[x.a])||x.a.localeCompare(y.a)||(y.d-x.d));
  const over=[];
  for(const p of sorted){
    const put=slot=>{
      let best=null,bs=-1e9;
      days.forEach((d,i)=>{
        if(d.arrival&&slot==="day"&&p.m==="matin")return;
        const room=slot==="eve"?d.eve-d.eveUsed:d.cap-d.used;
        const cnt=d.items.filter(x=>x.slot===slot).length;
        const cost=p.d+(cnt?(d.areas.has(p.a)?0.25:0.5):0);
        if(cost<=room+1e-9){const sc=(d.areas.has(p.a)?100:0)+room-i*0.01;if(sc>bs){bs=sc;best={d,cost}}}
      });
      if(!best)return false;
      best.d.items.push({id:p.id,slot});best.d.areas.add(p.a);
      if(slot==="eve")best.d.eveUsed+=best.cost;else best.d.used+=best.cost;return true;
    };
    if(!(p.m==="soir"?(put("eve")||put("day")):(put("day")||put("eve"))))over.push(p);
  }
  return {days,over};
}

function planOption(opt){
  const R=RY[S.rythme],N=Math.max(3,S.len);
  const arrC=AIR[S.arr].c,retC=AIR[S.ret].c,loop=arrC===retC;
  const pinned=new Set(),forced=new Set([arrC,retC]),assign={};
  const tpl=opt.cities;
  S.musts.forEach(mid=>{
    const m=MUST[mid];if(!m)return;
    const pid=m.p.find(id=>tpl.includes(P(id).c)||forced.has(P(id).c))||m.p[0];
    assign[mid]=pid;pinned.add(pid);forced.add(P(pid).c);
  });
  allPlaces().forEach(p=>{if(S.sel[p.id]==="pin"){pinned.add(p.id);forced.add(p.c)}});
  const found=new Set(S.found.concat(webFound()));const pasted=new Set(S.found);
  const st=p=>S.sel[p.id]||(pinned.has(p.id)?"pin":found.has(p.id)?"in":p.base?"in":"out");
  const soft=new Set();pasted.forEach(id=>{const p=P(id);if(p&&!tpl.includes(p.c)&&!forced.has(p.c))soft.add(p.c)});
  let cities=[...new Set([...tpl,...forced,...soft])];
  const prio=c=>(c===arrC||c===retC)?4:forced.has(c)?3:soft.has(c)?2.5:2;
  const sel=c=>allPlaces().filter(p=>p.c===c&&(st(p)==="in"||st(p)==="pin"));
  const dropped=[];
  const mins=()=>cities.reduce((s,c)=>s+CITY[c].min,0);
  const maxC=Math.max(1,Math.floor(N*({doux:.55,normal:.65,soutenu:.8}[S.rythme])));
  const mustRank=c=>{const i=S.musts.findIndex(mid=>assign[mid]&&P(assign[mid]).c===c);return i<0?99:i};
  while(cities.length>1&&cities.length>Math.min(maxC,N)){
    const cand=cities.filter(c=>prio(c)<4).sort((a,b)=>prio(a)-prio(b)||(prio(a)===3?mustRank(b)-mustRank(a):0)||sel(a).length-sel(b).length||tpl.indexOf(b)-tpl.indexOf(a))[0];
    if(!cand)break;cities=cities.filter(c=>c!==cand);dropped.push(cand);
  }
  const order=orderCities(cities,arrC,retC,loop);
  const minOf=c=>(mins()>N?1:CITY[c].min);
  const days={};order.forEach(c=>days[c]=minOf(c));
  const demand=c=>sel(c).reduce((s,p)=>s+p.d,0)*1.12;
  let rem=N-Object.values(days).reduce((a,b)=>a+b,0);
  while(rem>0){
    let best=null,bs=-1e9;
    order.forEach(c=>{const gap=CITY[c].ideal-days[c];const sc=(gap>0?10*prio(c):0)+(demand(c)-days[c]*R.day)/R.day+(gap>0?gap:0);if(sc>bs){bs=sc;best=c}});
    days[best]++;rem--;
  }
  /* réglages manuels de jours par ville */
  const dl=(S.delta[opt.k]||{});const touched=new Set();
  Object.entries(dl).forEach(([c,v])=>{if(days[c]==null||!v)return;days[c]=Math.max(minOf(c),days[c]+v);touched.add(c)});
  const sum=()=>Object.values(days).reduce((a,b)=>a+b,0);
  let guard=0;
  while(sum()>N&&guard++<60){const c=order.filter(c=>!touched.has(c)&&days[c]>minOf(c)).sort((a,b)=>(days[b]*R.day-demand(b))-(days[a]*R.day-demand(a)))[0];if(!c)break;days[c]--}
  while(sum()<N&&guard++<120){const c=order.filter(c=>!touched.has(c)).sort((a,b)=>(demand(b)-days[b]*R.day)-(demand(a)-days[a]*R.day))[0]||order[0];days[c]++}
  const ctx=c=>{const i=order.indexOf(c);const isLast=i===order.length-1;return {isFirst:i===0,isLast,pen:i>0?legH(order[i-1],c)+0.5:0,retLeg:isLast&&loop&&c!==retC?legH(c,retC):0,st}};
  const run=(c,n)=>planCity(c,n,sel(c),R,ctx(c));
  const log=[];
  for(let it=0;it<30;it++){
    const res=order.map(c=>({c,r:run(c,days[c])}));
    const needy=res.filter(x=>x.r.over.length).sort((a,b)=>b.r.over.filter(p=>st(p)==="pin").length-a.r.over.filter(p=>st(p)==="pin").length||b.r.over.length-a.r.over.length)[0];
    if(!needy)break;
    let donor=null,bf=-1;
    res.forEach(x=>{if(x.c===needy.c||days[x.c]<=minOf(x.c)||touched.has(x.c))return;const t=run(x.c,days[x.c]-1);if(t.over.length)return;const free=t.days.reduce((s,d)=>s+d.cap-d.used,0);if(free>bf){bf=free;donor=x.c}});
    if(!donor)break;
    if(run(needy.c,days[needy.c]+1).over.length>=needy.r.over.length)break;
    days[donor]--;days[needy.c]++;log.push(`${CITY[needy.c].n} passe à ${days[needy.c]} jours, une journée reprise à ${CITY[donor].n}.`);
  }
  const list=[],over=[];let idx=0;
  order.forEach((c,i)=>{const r=run(c,days[c]);r.days.forEach(d=>list.push(Object.assign(d,{city:CITY[c],idx:idx++,prev:i>0?order[i-1]:null})));r.over.forEach(p=>over.push(p))});
  const placed=new Set();list.forEach(d=>d.items.forEach(x=>placed.add(x.id)));
  const cover=S.musts.filter(m=>MUST[m]).map(m=>({m:MUST[m],ok:placed.has(assign[m])}));
  const travel=order.slice(1).reduce((s,c,i)=>s+legH(order[i],c),0)+(loop&&order[order.length-1]!==retC?legH(order[order.length-1],retC):0);
  const foundOk=[...found].filter(id=>placed.has(id)).length;
  return {opt,order,days,list,over,dropped,cover,log,travel,st,loop,retC,arrC,foundOk,foundTot:found.size,total:idx};
}
let PLANS={};
function computePlans(){PLANS={};OPTIONS.forEach(o=>PLANS[o.k]=planOption(o))}

/* ---------- Horaires ---------- */
function schedule(d,plan){
  const rows=[];let t=9;
  if(d.first){
    if(d.idx===0){rows.push({k:"transit",t:null,txt:`Arrivée à ${AIR[S.arr].n}. Trajet jusqu'à l'hôtel, puis premiers pas.`});t=15}
    else{const lh=legH(d.prev,d.city.id);rows.push({k:"transit",t:9,txt:`${legMode(d.prev,d.city.id)} depuis ${CITY[d.prev].n}, ${fmtH(lh)} environ.`});t=9+lh+0.5}
  }
  const di=d.items.filter(x=>x.slot==="day").map(x=>P(x.id)).filter(Boolean).sort((a,b)=>MRANK[a.m]-MRANK[b.m]);
  const ev=d.items.filter(x=>x.slot==="eve").map(x=>P(x.id)).filter(Boolean);
  let lunch=false,prevA=null;
  di.forEach((p,i)=>{if(i>0)t+=(p.a===prevA?0.25:0.5);if(!lunch&&t>=12&&t<15&&i>0){rows.push({k:"lunch",t,txt:"Pause déjeuner"});t+=1;lunch=true}rows.push({k:"stop",t,p});t+=p.d;prevA=p.a});
  if(ev.length){let e=Math.max(t+0.5,18.5);rows.push({k:"evesep"});ev.forEach((p,i)=>{if(i>0)e+=0.25;rows.push({k:"stop",t:e,p});e+=p.d})}
  if(d.last){const back=plan.loop&&d.city.id!==plan.retC?`${legMode(d.city.id,plan.retC)} jusqu'à ${CITY[plan.retC].n}, ${fmtH(legH(d.city.id,plan.retC))} environ, puis vol`:`Vol`;rows.push({k:"transit",t:Math.max(t+0.5,12),txt:`Départ : ${back} depuis ${AIR[S.ret].n}.`})}
  return rows;
}
const dfmt=new Intl.DateTimeFormat("fr-FR",{weekday:"short",day:"numeric",month:"short"});
const dlong=new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric"});
function dAt(i){const d=new Date(S.start+"T12:00:00");if(isNaN(d))return null;d.setDate(d.getDate()+i);return d}
function dateOf(i){const d=dAt(i);return d?dfmt.format(d):""}
function longDate(i){const d=dAt(i);return d?dlong.format(d):""}

/* ---------- Carte ---------- */
const K=PACK.map.k,CS=Math.cos(PACK.map.latc*Math.PI/180);
const proj=c=>[(c.lon-PACK.map.lon0)*CS*K,(PACK.map.lat0-c.lat)*K];
const RC={A:"var(--rA)",B:"var(--rB)",C:"var(--rC)"};
function mapSVG(cfg){
  /* cfg: routes [{k,order}], active, labels {cid:text} */
  const routeCities=new Set();cfg.routes.forEach(r=>r.order.forEach(c=>routeCities.add(c)));
  let g=`<path class="land" d="${JAPAN_PATH}"/>`;
  cfg.routes.forEach((r,ri)=>{
    const off=(ri-1)*0.12;
    r.order.slice(1).forEach((c,i)=>{
      const a=proj(CITY[r.order[i]]),b=proj(CITY[c]);
      const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1];
      const cx=mx-dy*(0.18+off),cy=my+dx*(0.18+off);
      const fl=CITY[c].flight||CITY[r.order[i]].flight;
      g+=`<path class="route ${fl?'flight':''}" data-r="${r.k}" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="${RC[r.k]}" stroke-width="4" opacity="${!cfg.active||cfg.active===r.k?1:.18}"/>`;
    });
  });
  CITIES.forEach(c=>{
    const [x,y]=proj(c);const major=routeCities.has(c.id);
    const col=cfg.active&&cfg.routes.find(r=>r.k===cfg.active&&r.order.includes(c.id))?RC[cfg.active]:(major?"var(--ink)":"");
    g+=`<g data-city="${c.id}"><circle class="cdot ${major?'':'minor'}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" data-r0="${major?7:4.5}" r="7" ${major?`fill="${col}"`:""} stroke-width="2"/><text class="clabel ${major?'':'minor'}" x="${(x+10).toFixed(1)}" y="${(y+4).toFixed(1)}" data-fs="${major?13:11}">${esc(c.n)}</text>${cfg.labels&&cfg.labels[c.id]?`<text class="daylabel" x="${(x+10).toFixed(1)}" y="${(y+19).toFixed(1)}" data-fs="11">${esc(cfg.labels[c.id])}</text>`:""}</g>`;
  });
  return `<svg viewBox="0 0 900 900" role="img" aria-label="Carte du Japon et des itinéraires"><rect x="-2000" y="-2000" width="5000" height="5000" fill="transparent"/>${g}</svg>`;
}
function mountMap(el,cfg){
  el.innerHTML=`<div class="map">${mapSVG(cfg)}<div class="map-ctrl"><button type="button" data-z="in" aria-label="Zoomer">+</button><button type="button" data-z="out" aria-label="Dézoomer">−</button><button type="button" data-z="fit" aria-label="Recentrer">◎</button></div>${cfg.legend||""}</div>`;
  const svg=el.querySelector("svg");
  let vb={x:0,y:0,w:900,h:900};
  const apply=()=>{svg.setAttribute("viewBox",`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);const s=vb.w/svg.clientWidth;svg.querySelectorAll("circle[data-r0]").forEach(c=>c.setAttribute("r",(+c.dataset.r0*s).toFixed(2)));svg.querySelectorAll("text[data-fs]").forEach(t=>{t.setAttribute("font-size",(+t.dataset.fs*s).toFixed(2));t.setAttribute("stroke-width",(3*s).toFixed(2))});
    svg.querySelectorAll("g[data-city]").forEach(gg=>{const c=CITY[gg.dataset.city];const [x,y]=proj(c);const ts=gg.querySelectorAll("text");if(ts[0]){ts[0].setAttribute("x",x+10*s);ts[0].setAttribute("y",y+4*s)}if(ts[1]){ts[1].setAttribute("x",x+10*s);ts[1].setAttribute("y",y+19*s)}})};
  const aspect=()=>svg.clientHeight/Math.max(1,svg.clientWidth);
  const fit=ids=>{const pts=(ids&&ids.length?ids:CITIES.map(c=>c.id)).map(id=>proj(CITY[id]));let x0=Math.min(...pts.map(p=>p[0])),x1=Math.max(...pts.map(p=>p[0])),y0=Math.min(...pts.map(p=>p[1])),y1=Math.max(...pts.map(p=>p[1]));
    const pad=Math.max(60,(x1-x0)*0.18);x0-=pad;x1+=pad*1.6;y0-=pad;y1+=pad;let w=x1-x0,h=y1-y0;const a=aspect();if(h/w>a)w=h/a;else h=w*a;vb={x:(x0+x1)/2-w/2,y:(y0+y1)/2-h/2,w,h};apply()};
  const zoomAt=(px,py,f)=>{const nw=Math.min(2400,Math.max(30,vb.w*f));const k=nw/vb.w;vb={x:px-(px-vb.x)*k,y:py-(py-vb.y)*k,w:nw,h:vb.h*k};apply()};
  const toSvg=(cx,cy)=>{const r=svg.getBoundingClientRect();return [vb.x+(cx-r.left)/r.width*vb.w,vb.y+(cy-r.top)/r.height*vb.h]};
  svg.addEventListener("wheel",e=>{e.preventDefault();const [x,y]=toSvg(e.clientX,e.clientY);zoomAt(x,y,Math.exp(e.deltaY*0.0015))},{passive:false});
  const ptr=new Map();let moved=0,pinch0=null;
  svg.addEventListener("pointerdown",e=>{svg.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;if(ptr.size===2){const [a,b]=[...ptr.values()];pinch0={d:Math.hypot(a.x-b.x,a.y-b.y),w:vb.w}}});
  svg.addEventListener("pointermove",e=>{if(!ptr.has(e.pointerId))return;const p=ptr.get(e.pointerId);const r=svg.getBoundingClientRect();
    if(ptr.size===1){const dx=e.clientX-p.x,dy=e.clientY-p.y;moved+=Math.abs(dx)+Math.abs(dy);vb.x-=dx/r.width*vb.w;vb.y-=dy/r.height*vb.h;apply()}
    ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptr.size===2&&pinch0){moved+=10;const [a,b]=[...ptr.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const [mx,my]=toSvg((a.x+b.x)/2,(a.y+b.y)/2);zoomAt(mx,my,(pinch0.w*pinch0.d/d)/vb.w)}});
  const end=e=>{const was=ptr.has(e.pointerId);ptr.delete(e.pointerId);if(ptr.size<2)pinch0=null;if(was&&moved<6&&e.type==="pointerup"){const g=document.elementFromPoint(e.clientX,e.clientY);const gc=g&&g.closest&&g.closest("[data-city]");if(gc&&cfg.onCity)cfg.onCity(gc.dataset.city)}};
  svg.addEventListener("pointerup",end);svg.addEventListener("pointercancel",end);
  el.querySelector(".map-ctrl").addEventListener("click",e=>{const b=e.target.closest("[data-z]");if(!b)return;const cx=vb.x+vb.w/2,cy=vb.y+vb.h/2;if(b.dataset.z==="in")zoomAt(cx,cy,0.7);else if(b.dataset.z==="out")zoomAt(cx,cy,1.4);else fit(cfg.fit)});
  requestAnimationFrame(()=>fit(cfg.fit));
  window.addEventListener("resize",()=>fit(cfg.fit),{passive:true});
  return {fit};
}

/* ---------- Rendu : en-tête ---------- */
const STEPS=["Départ","Dates","Arrivée","Coups de cœur","Recherche","Suggestions"];
function renderTop(){
  const t=document.getElementById("top");
  const inTrip=S.step>=6;
  const sub=inTrip&&S.chosen?`${PLANS[S.chosen].total} jours · ${dateOf(0)}`:"Créer son voyage";
  let h=`<div class="top-row"><div class="brand"><div class="hanko" aria-hidden="true">${esc(PACK.hanko||"旅")}</div><div><div class="brand-name">${esc(PACK.brand)}</div><div class="brand-sub">${esc(sub)}</div></div></div>`;
  h+=inTrip?`<button class="btn-ghost" type="button" data-act="goto" data-v="5">Comparer A, B, C</button>`:(S.step>0?`<button class="btn-ghost" type="button" data-act="restart">Recommencer</button>`:`<button class="btn-ghost" type="button" data-act="example">Voir un exemple</button>`);
  h+=`</div>`;
  if(!inTrip){const pct=Math.min(S.step,5)/5*86;h+=`<ol class="line-prog" aria-label="Étapes"><span class="fill" style="width:${pct}%"></span>${STEPS.map((s,i)=>`<li class="lp ${i<S.step?'done':i===S.step?'cur':''}"><i></i><span>${s}</span></li>`).join("")}</ol>`}
  t.innerHTML=h;
  document.getElementById("nav").hidden=!inTrip;
}

/* ---------- Rendu : questionnaire ---------- */
function navRow(nextLabel,disabled){return `<div class="wz-nav">${S.step>0?`<button type="button" class="btn quiet" data-act="prev">Retour</button>`:"<span></span>"}<button type="button" class="btn" data-act="next" ${disabled?"disabled":""}>${nextLabel||"Continuer"}</button></div>`}
function flightInfo(){
  const F=PACK.flights||{};const f=S.from;const r=(F.rules||[]).find(x=>new RegExp(x.re,"i").test(f));
  const m=(dAt(0)||new Date()).getMonth()+1;const summer=m>=4&&m<=10;const L2=(r&&r.lag)||F.lag||[0,0];const lag=summer?L2[0]:L2[1];
  const fl=r?r.txt:String(F.default||"").replace("{from}",esc(f));
  return `<div class="infobox"><span class="k">Le trajet</span><span>${fl}</span>${lag?`<span>Décalage horaire : +${lag} h sur place. ${esc(F.lagNote||"")}</span>`:""}</div>`;
}

function renderStep(){
  const m=document.getElementById("main");
  if(S.step===0){
    m.innerHTML=`<section class="step"><div class="banner">${postcard(P(PACK.cover||"chureito")||PLACES[0])}</div><div class="q-eyebrow">Question 1 sur 4</div><h1 class="q-title">D'où partez-vous ?</h1>
     <div class="opts" role="group" aria-label="Ville de départ">${HOMES.map(h=>`<button type="button" class="pill" data-act="from" data-v="${esc(h)}" aria-pressed="${S.from===h}">${esc(h)}</button>`).join("")}</div>
     <label class="field" for="fromOther">Autre ville<input id="fromOther" value="${HOMES.includes(S.from)?"":esc(S.from)}" placeholder="Ta ville de départ"></label>
     ${flightInfo()}${navRow()}</section>`;
  }else if(S.step===1){
    const m0=(dAt(0)||new Date()).getMonth()+1;
    m.innerHTML=`<section class="step"><div class="q-eyebrow">Question 2 sur 4</div><h1 class="q-title">Quand partez-vous, et pour combien de temps ?</h1>
     <label class="field" for="startDate">Premier jour au Japon<input id="startDate" type="date" value="${esc(S.start)}"></label>
     <div class="big-step"><button type="button" class="round" data-act="len" data-v="-1" aria-label="Un jour de moins">−</button><span class="val">${S.len}<small>jours sur place</small></span><button type="button" class="round" data-act="len" data-v="1" aria-label="Un jour de plus">+</button></div>
     <div class="opts">${[7,10,14,21].map(n=>`<button type="button" class="pill" data-act="lenset" data-v="${n}" aria-pressed="${S.len===n}">${n} jours</button>`).join("")}</div>
     <div><div class="ctrl-label" style="margin-bottom:6px">Votre rythme</div><div class="seg" role="group" aria-label="Rythme">${Object.entries(RY).map(([k,v])=>`<button type="button" data-act="rythme" data-v="${k}" aria-pressed="${S.rythme===k}">${v.label}</button>`).join("")}</div><p class="small" style="margin-top:6px">${RY[S.rythme].day} h de visite par jour, ${RY[S.rythme].eve} h le soir.</p></div>
     <div class="infobox"><span class="k">À cette période</span><span>${SEASONS[m0]}</span><span class="small">Retour le ${longDate(S.len-1)}.</span></div>
     ${navRow()}</section>`;
  }else if(S.step===2){
    const port=(key,id)=>{const a=AIR[id];return `<button type="button" class="port" data-act="${key}" data-v="${id}" aria-pressed="${S[key]===id}"><b>${id}</b><span>${esc(a.n)}</span><small>${esc(CITY[a.c].n)}</small></button>`};
    m.innerHTML=`<section class="step"><div class="q-eyebrow">Question 3 sur 4</div><h1 class="q-title">Où arrivez-vous ?</h1>
     <div class="cards2">${AIRPORTS.map(a=>port("arr",a.id)).join("")}</div>
     <h2 style="font-size:22px">Et vous repartez d'où ?</h2>
     <div class="cards2">${AIRPORTS.map(a=>port("ret",a.id)).join("")}</div>
     <div class="infobox"><span class="k">Astuce</span><span>${esc(PACK.airportTip||"")}</span></div>
     ${navRow()}</section>`;
  }else if(S.step===3){renderDeck()}
  else if(S.step===4){renderResearch()}
  else if(S.step===5){renderChoice()}
}

/* ---------- Analyse ---------- */
function analyze(){
  const per=S.sources.map(s=>{const txt=norm(s.text||"");const words=txt?txt.split(" ").length:0;const ids=[];
    if(txt){const pad=" "+txt+" ";allPlaces().forEach(p=>{if(keywordsOf(p).some(k=>pad.includes(" "+k)))ids.push(p.id)})}
    return {type:s.type,url:s.url,words,ids}});
  const ids=[...new Set(per.flatMap(x=>x.ids))];
  return {per,ids};
}
/* ---------- Choix A/B/C ---------- */
function chainHTML(pl){return `<div class="chain">${pl.order.map((c,i)=>`${i?'<span class="ar">→</span>':''}<b>${esc(CITY[c].n)}</b><span class="nd">${pl.days[c]}j</span>`).join("")}</div>`}
function cityChoiceSheet(cid){
  const c=CITY[cid];
  const inOpt=OPTIONS.map(o=>{const pl=PLANS[o.k];return pl.order.includes(cid)?`<span class="stat" style="color:${RC[o.k]}">${o.k} : ${pl.days[cid]} jour${pl.days[cid]>1?"s":""}</span>`:""}).join("");
  const ps=allPlaces().filter(p=>p.c===cid);
  openSheet(`<h2 style="font-size:28px">${esc(c.n)} <span class="f-jp">${c.jp}</span></h2><div class="ostats" style="margin-top:8px">${inOpt||'<span class="stat">Dans aucun itinéraire pour l\'instant</span>'}</div>
   <section class="f-sec"><h4>Accès</h4><p>${esc(c.acc)}</p></section><section class="f-sec"><h4>Où dormir</h4><p>${esc(c.hotel)}</p></section>
   <h3 style="margin-top:18px;font-size:18px">À voir</h3><ul class="plist">${ps.map(p=>`<li><button type="button" data-act="open" data-id="${p.id}">${tile(p,"sm")}<span><b>${esc(p.n)}</b><br><span class="small">${esc(p.a)} · ${fmtDur(p.d)}</span></span><span class="small">›</span></button></li>`).join("")}</ul>${cityExtras(cid)}`);
  setTimeout(()=>{const el=document.getElementById("cm-"+cid);if(el)cityMap(el,cid)},80);
}

/* ---------- Voyage choisi ---------- */
let flashIds=new Set();
function plan(){return PLANS[S.chosen]}
function renderTrip(){
  computePlans();
  const tabs=["jours","carte","lieux","guide","mots"];
  if(!tabs.includes(S.tab))S.tab="jours";
  document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.tab===S.tab?"page":"false"));
  ({jours:renderJours,carte:renderCarte,lieux:renderLieux,guide:renderGuide,mots:renderMots})[S.tab]();
}
function stateLabel(v){return v==="pin"?"Incontournable":v==="in"?"Au programme":"Pas retenu"}
function renderJours(){
  const pl=plan(),o=pl.opt,R=RY[S.rythme];const m=document.getElementById("main");
  const pinOver=pl.over.filter(p=>pl.st(p)==="pin"),other=pl.over.filter(p=>pl.st(p)!=="pin");
  let h=`<div class="hero"><div class="q-eyebrow">Itinéraire ${o.k} · ${esc(o.n)}</div><h1>${pl.total} jours, de ${esc(CITY[pl.order[0]].n)} à ${esc(CITY[pl.order[pl.order.length-1]].n)}</h1><p>Du ${longDate(0)} au ${longDate(pl.total-1)}. Ajoute un lieu, change le rythme ou les jours par ville : tout se recalcule.</p><div class="hero-actions"><button type="button" class="btn sm" data-act="share">Partager ce voyage</button>${todayIdx(pl)>=0?`<button type="button" class="btn quiet sm" data-act="today">Aujourd'hui</button>`:""}<button type="button" class="btn quiet sm" data-act="offline">Hors ligne</button></div></div>
   ${chainHTML(pl)}
   <div class="controls"><span class="ctrl-label">Rythme</span><div class="seg" role="group" aria-label="Rythme">${Object.entries(RY).map(([k,v])=>`<button type="button" data-act="rythme" data-v="${k}" aria-pressed="${S.rythme===k}">${v.label}</button>`).join("")}</div></div>`;
  if(pl.log.length)h+=`<div class="notice info"><strong>Jours redistribués automatiquement</strong><ul>${pl.log.map(l=>`<li>${esc(l)}</li>`).join("")}</ul></div>`;
  if(pl.dropped.length)h+=`<div class="notice warn"><strong>Étapes retirées faute de jours</strong><span>${pl.dropped.map(c=>esc(CITY[c].n)).join(", ")}. Ajoute des jours au voyage pour les retrouver.</span></div>`;
  if(pinOver.length)h+=`<div class="notice crit"><strong>Incontournable sans place</strong><span>${pinOver.map(p=>esc(p.n)).join(", ")} ne rentre pas. Passe en rythme soutenu ou ajoute un jour à ${esc(CITY[pinOver[0].c].n)}.</span></div>`;
  if(other.length)h+=`<div class="notice warn"><strong>Hors programme, faute de temps</strong><span>${other.map(p=>`<button type="button" class="chip" data-act="open" data-id="${p.id}">${esc(p.n)}</button>`).join(" ")}</span></div>`;
  h+=`<div class="days">`;let cur=null;
  pl.list.forEach(d=>{
    if(d.city!==cur){cur=d.city;const n=pl.days[cur.id];
      h+=`<div class="city-head"><div><h2>${esc(cur.n)}</h2><span class="kjbig">${cur.jp}</span></div><div class="dstep"><button type="button" data-act="dminus" data-id="${cur.id}" aria-label="Un jour de moins à ${esc(cur.n)}">−</button><span>${n} jour${n>1?"s":""}</span><button type="button" data-act="dplus" data-id="${cur.id}" aria-label="Un jour de plus à ${esc(cur.n)}">+</button></div></div>
      <div class="hotel"><div><strong>Où dormir :</strong> ${esc(cur.hotel)}</div><div class="hotel-row"><label for="hotel-${cur.id}">Hôtel choisi</label><input id="hotel-${cur.id}" data-hotel="${cur.id}" placeholder="Nom de l'hôtel, à remplir" value="${esc(S.hotels[cur.id]||"")}"></div></div>`}
    const rows=schedule(d,pl);const load=d.cap?Math.min(1,d.used/d.cap):0;
    const heroP=(()=>{const ids=d.items.map(x=>x.id);const pin=ids.find(id=>pl.st(P(id))==="pin");return P(pin||ids[0])||{id:"city"+d.city.id,n:d.city.n,ico:"pin",c:d.city.id}})();
    h+=`<article class="day" id="day-${d.idx}"><div class="day-hero">${postcard(heroP)}<div class="day-over"><h3>Jour ${d.idx+1}</h3><span class="day-date">${dateOf(d.idx)} · ${esc(d.city.n)}</span></div></div><div class="day-load ${load>.92?'full':''}"><i style="width:${Math.round(load*100)}%"></i></div><ul class="stops">`;
    let has=false;
    rows.forEach(r=>{
      if(r.k==="transit"){h+=`<li class="sub-row transit"><span class="time">${r.t==null?"":hhmm(r.t)}</span><span class="txt">${esc(r.txt)}</span></li>`;if(d.first&&d.prev&&r===rows[0])routeTips(d.prev,d.city.id).forEach(x=>{h+=`<li class="sub-row tip"><span class="time">Astuce</span><span class="txt"><b>${esc(x.n)}</b> : ${esc(x.why)}</span></li>`})}
      else if(r.k==="lunch")h+=`<li class="sub-row lunch"><span class="time">${hhmm(r.t)}</span><span class="txt">${r.txt}</span></li>`;
      else if(r.k==="evesep")h+=`<li class="evening-sep">Le soir</li>`;
      else{has=true;const p=r.p;h+=`<li><button type="button" class="stop ${flashIds.has(p.id)?'moved':''}" data-act="open" data-id="${p.id}"><span class="time">${hhmm(r.t)}</span>${tile(p,"sm")}<span style="min-width:0"><span class="stop-name">${esc(p.n)}</span><br><span class="stop-meta">${esc(p.a)} · ${fmtDur(p.d)}</span></span>${pl.st(p)==="pin"?'<span class="pin-badge">Incontournable</span>':''}</button></li>`}
    });
    if(!has)h+=`<li class="empty-day">${d.last?"Temps libre avant le départ.":d.idx===0?"Installation et repos après le vol.":"Journée libre : flâner, se reposer, ou ajouter un lieu depuis l'onglet Lieux."}</li>`;
    h+=`</ul>`;
    const near=[];const seen=new Set();d.items.forEach(x=>{const p=P(x.id);if(p)nearAddr(p,0.9).forEach(a=>{if(!seen.has(a.id)){seen.add(a.id);near.push(a)}})});
    if(near.length)h+=`<div class="around"><span class="around-k">Autour, ce jour-là</span><div class="around-l">${near.slice(0,4).map(a=>`<button type="button" class="achip" data-act="addr" data-v="${esc(a.id)}"><i aria-hidden="true">${(ADDR_KIND[a.k]||["","店"])[1]}</i>${esc(a.n)}</button>`).join("")}</div></div>`;
    h+=`</article>`;
  });
  m.innerHTML=h+`</div>`;
}
function routeTips(a,b){return ROUTES.filter(r=>(r.from===a&&r.to===b)||(r.from===b&&r.to===a))}
function tripRouteTips(pl){const out=[];ROUTES.forEach(r=>{const i=pl.order.indexOf(r.from),j=pl.order.indexOf(r.to);if(i>=0&&j>=0)out.push(r)});return out}
function routeTipsHTML(pl){const items=tripRouteTips(pl);if(!items.length)return "";return `<section class="f-sec route-tips"><h4>Bons plans sur la route</h4><ul>${items.map(r=>`<li><b>${esc(CITY[r.from]?CITY[r.from].n:r.from)} et ${esc(CITY[r.to]?CITY[r.to].n:r.to)} : ${esc(r.n)}</b><br>${esc(r.why)}${(r.src||[]).slice(0,1).map(x=>` <a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.n)}</a>`).join("")}</li>`).join("")}</ul></section>`}
function renderCarte(){
  const pl=plan();const m=document.getElementById("main");
  const labels={};pl.list.forEach(d=>{const c=d.city.id;const a=labels[c];labels[c]=a?a.replace(/-?\d+$/,"")+"-"+(d.idx+1):"J"+(d.idx+1)});
  Object.keys(labels).forEach(c=>{labels[c]=labels[c].replace(/^J(\d+)-(\d+)$/,(x,a,b)=>a===b?"J"+a:`J${a} à ${b}`)});
  m.innerHTML=`<div class="hero"><div class="q-eyebrow">Carte du voyage</div><h1>${esc(pl.opt.n)}</h1><p>Les numéros ronds sont les étapes, les petits numéros les jours. Touche un lieu pour sa fiche. Coche « Adresses stylées » pour voir les bons coins autour.</p></div><div id="mapT" class="lmap"></div>
   ${routeTipsHTML(pl)}
   <div class="optlist">${pl.order.map((c,i)=>`<button type="button" class="ocard" style="text-align:left;--oc:${RC[pl.opt.k]}" data-act="city" data-v="${c}"><div class="ocard-head"><span class="oletter">${i+1}</span><div><h3>${esc(CITY[c].n)}</h3><p class="otag">${esc(labels[c]||"")} · ${pl.days[c]} jour${pl.days[c]>1?"s":""}${i>0?` · ${legMode(pl.order[i-1],c).toLowerCase()} depuis ${esc(CITY[pl.order[i-1]].n)}, ${fmtH(legH(pl.order[i-1],c))}`:""}${(ADDR[c]||[]).length?` · ${(ADDR[c]||[]).length} adresses`:""}</p></div></div></button>`).join("")}</div>`;
  tripMap(document.getElementById("mapT"),pl);
}
function cityExtras(cid){
  const ad=ADDR[cid]||[];const vids=CITYVID[cid]||[];let h="";
  h+=`<section class="art-sec"><div class="art-k"><span lang="ja">近所</span>Adresses stylées</div><div class="minimap tall" id="cm-${cid}"></div>${ad.length?`<ul class="addrs">${ad.map(a=>addrCard(a)).join("")}</ul>`:`<p class="small">Pas encore d'adresse curée pour cette ville.</p>`}</section>`;
  if(vids.length)h+=`<section class="art-sec"><div class="art-k"><span lang="ja">映像</span>Vivre comme un local, en vidéo</div>${videoBlock(vids)}</section>`;
  return h;
}
function cityTripSheet(cid){
  const pl=plan();const c=CITY[cid];const ps=allPlaces().filter(p=>p.c===cid);
  openSheet(`<h2 style="font-size:28px">${esc(c.n)} <span class="f-jp">${c.jp}</span></h2><div class="ostats" style="margin-top:8px">${pl.order.includes(cid)?`<span class="stat good">${pl.days[cid]} jour${pl.days[cid]>1?"s":""} dans ton voyage</span>`:`<span class="stat">Pas dans ton itinéraire</span>`}</div>
   <section class="f-sec"><h4>Accès</h4><p>${esc(c.acc)}</p></section><section class="f-sec"><h4>Où dormir</h4><p>${esc(c.hotel)}</p></section>
   <h3 style="margin-top:18px;font-size:18px">Lieux</h3><ul class="plist">${ps.map(p=>`<li><button type="button" data-act="open" data-id="${p.id}">${tile(p,"sm")}<span><b>${esc(p.n)}</b><br><span class="small">${stateLabel(pl.st(p))} · ${fmtDur(p.d)}</span></span><span class="small">›</span></button></li>`).join("")}</ul>${cityExtras(cid)}`);
  setTimeout(()=>{const el=document.getElementById("cm-"+cid);if(el)cityMap(el,cid)},80);
}
function addrById(id){for(const l of Object.values(ADDR)){const a=l.find(x=>x.id===id);if(a)return a}return null}
function addrSheet(id){const a=addrById(id);if(!a)return;openSheet(`<h2 style="font-size:24px">${esc(a.n)}</h2><ul class="addrs">${addrCard(a)}</ul>${a.lat?`<div class="minimap" id="am-x"></div>`:""}`);
  if(a.lat&&window.L)setTimeout(()=>{const el=document.getElementById("am-x");const m=newMap(el);if(m){addrMarker(a).addTo(m);m.setView([a.lat,a.lon],16)}},80)}
function renderLieux(){
  const pl=plan();const m=document.getElementById("main");
  const cities=pl.order;if(S.filter!=="all"&&!cities.includes(S.filter))S.filter="all";
  const mode=S.lmode==="adr"?"adr":"lieux";
  const chips=`<div class="chips" role="group" aria-label="Filtrer par ville"><button type="button" class="chip" data-act="filter" data-v="all" aria-pressed="${S.filter==="all"}">Toutes</button>${cities.map(c=>`<button type="button" class="chip" data-act="filter" data-v="${c}" aria-pressed="${S.filter===c}">${esc(CITY[c].n)}</button>`).join("")}</div>`;
  const seg=`<div class="seg" role="group" aria-label="Affichage" style="margin-top:12px"><button type="button" data-act="lmode" data-v="lieux" aria-pressed="${mode==="lieux"}">Lieux à visiter</button><button type="button" data-act="lmode" data-v="adr" aria-pressed="${mode==="adr"}">Adresses stylées</button></div>`;
  if(mode==="adr"){
    const cs=S.filter==="all"?cities:[S.filter];
    m.innerHTML=`<h2 class="section-title">Les adresses de ton voyage</h2><p class="lead">Cafés, petites tables, bains, boutiques et coins secrets, repérés par des voyageurs et des gens qui vivent sur place. Chaque adresse cite sa source.</p>${seg}${chips}
     ${cs.map(c=>(ADDR[c]||[]).length?`<h3 class="addr-city">${esc(CITY[c].n)} <span class="f-jp">${CITY[c].jp}</span></h3><ul class="addrs">${ADDR[c].map(a=>addrCard(a)).join("")}</ul>`:"").join("")}`;
    return;
  }
  const list=allPlaces().filter(p=>cities.includes(p.c)&&(S.filter==="all"||p.c===S.filter));
  m.innerHTML=`<h2 class="section-title">Les lieux de ton voyage</h2><p class="lead">Touche le bouton d'une carte pour changer son statut : pas retenu, au programme, incontournable. Le programme se recalcule.</p>${seg}${chips}
   <div class="grid">${list.map(p=>{const v=pl.st(p);return `<div class="card"><button type="button" class="card-open" data-act="open" data-id="${p.id}">${tile(p)}<div class="card-body"><span class="card-name">${esc(p.n)}</span><span class="card-meta">${esc(CITY[p.c].n)} · ${esc(p.a)} · ${fmtDur(p.d)}</span></div></button><div class="card-foot"><button type="button" class="state ${v}" data-act="cycle" data-id="${p.id}">${stateLabel(v)}</button></div></div>`}).join("")}</div>
   <button type="button" class="add-btn" data-act="addplace">+ Ajouter un lieu à voir absolument</button>`;
}
function renderGuide(){
  document.getElementById("main").innerHTML=`<h2 class="section-title">Guide pratique</h2><p class="lead">Ce qu'il faut savoir en arrivant de France, classé par situation.</p><div class="acc">${GUIDE.map((g,i)=>`<details class="g" ${i===0?"open":""}><summary><span class="g-kj">${g.k}</span>${esc(g.t)}<span class="g-count">${g.i.length}</span></summary><ul>${g.i.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></details>`).join("")}</div>`;
}
let wq="";
function renderMots(){
  const m=document.getElementById("main");
  m.innerHTML=`<h2 class="section-title">Glossaire</h2><p class="lead">Les mots à reconnaître sur place, et ceux à dire pour faire sourire.</p><input class="search" id="wordSearch" type="search" value="${esc(wq)}" placeholder="Chercher un mot, en français ou en japonais" aria-label="Chercher dans le glossaire"><ul class="words" id="wordList"></ul>`;
  fillWords();
}
function fillWords(){const q=norm(wq);const list=WORDS.filter(w=>!q||w.some(x=>norm(x).includes(q)));document.getElementById("wordList").innerHTML=list.length?list.map(w=>`<li class="word"><span class="jp">${w[0]}</span><span class="ro">${esc(w[1])}</span><span class="fr">${esc(w[2])}</span>${w[3]?`<span class="nt">${esc(w[3])}</span>`:""}</li>`).join(""):`<li class="small">Aucun mot ne correspond.</li>`}

/* ---------- Feuilles ---------- */
const sheet=document.getElementById("sheet"),sheetIn=document.getElementById("sheetIn");
function openSheet(html){sheetIn.classList.remove("art");sheetIn.innerHTML=`<div class="sheet-bar"><span class="grab" aria-hidden="true"></span><button type="button" class="btn-ghost" data-act="close">Fermer</button></div>`+html;sheet.hidden=false;sheetIn.scrollTop=0;document.body.style.overflow="hidden"}
function closeSheet(){sheet.hidden=true;document.body.style.overflow=""}
function placeSheet(id){
  const p=P(id);if(!p)return;
  const pl=S.chosen?plan():PLANS[S.active];const v=pl?pl.st(p):(p.base?"in":"out");
  const where=pl&&pl.list.find(d=>d.items.some(x=>x.id===id));
  const map="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p.n+" "+CITY[p.c].n+" Japon");
  if(p.g||p.lat){openSheet(artSheet(p,v,where,map));sheetIn.classList.add("art");if(p.lat)setTimeout(()=>{const el=document.getElementById("mm-"+p.id);if(el)miniMap(el,p)},80);return}
  let h=`${tile(p,"big")}<div class="f-title"><h2>${esc(p.n)}<span class="f-jp">${esc(p.jp||"")}</span></h2><div class="f-meta"><span class="tag">${esc(CITY[p.c].n)}</span><span class="tag">${esc(p.a)}</span><span class="tag">${fmtDur(p.d)}</span>${S.chosen?`<span class="tag">${where?"Jour "+(where.idx+1):"Pas au programme"}</span>`:""}</div></div>`;
  if(S.chosen)h+=`<div class="f-actions"><div class="seg" role="group" aria-label="Statut">${["out","in","pin"].map(k=>`<button type="button" data-act="state" data-id="${p.id}" data-v="${k}" aria-pressed="${v===k}">${k==="out"?"Non":k==="in"?"Oui":"Incontournable"}</button>`).join("")}</div><a class="btn quiet sm" href="${map}" target="_blank" rel="noopener" style="text-decoration:none">Ouvrir le plan</a></div>`;
  else h+=`<div class="f-actions"><a class="btn quiet sm" href="${map}" target="_blank" rel="noopener" style="text-decoration:none">Ouvrir le plan</a></div>`;
  const cb=citedBy(p.id);if(cb.length)h+=`<section class="f-sec cited"><h4>Vu dans tes sources</h4><ul>${cb.map(s=>`<li><a href="${s.u}" target="_blank" rel="noopener">${esc(s.n)}</a> : ${esc(s.a||"vidéo YouTube, titre seulement")}</li>`).join("")}</ul></section>`;
  if(p.h)h+=`<section class="f-sec"><h4>Histoire</h4><p>${esc(p.h)}</p></section>`;
  if(p.p)h+=`<section class="f-sec"><h4>Personnage marquant</h4><div class="who">${esc(p.p[0])}</div><p>${esc(p.p[1])}</p></section>`;
  if(p.f)h+=`<section class="f-sec folk"><h4>Folklore et légendes</h4><p>${esc(p.f)}</p></section>`;
  if(p.s)h+=`<section class="f-sec"><h4>Fait surprenant</h4><p>${esc(p.s)}</p></section>`;
  if(p.b&&p.b.length)h+=`<section class="f-sec"><h4>Bons plans</h4><ul>${p.b.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>`;
  if(p.t)h+=`<section class="f-sec treasure"><h4>Trésor caché</h4><p>${esc(p.t)}</p></section>`;
  if(p.custom)h+=`<p class="small" style="margin-top:14px">Lieu ajouté par toi. L'histoire et les bons plans viendront à l'étape d'enrichissement.</p><div style="margin-top:10px"><button type="button" class="btn danger sm" data-act="delcustom" data-id="${p.id}">Supprimer ce lieu</button></div>`;
  openSheet(h);
}
function addSheet(){
  const pl=plan();
  openSheet(`<h2 style="font-size:24px">Ajouter un lieu</h2><p class="small" style="margin-top:6px">Il entre dans le programme tout de suite, le moteur lui trouve une place.</p>
  <form class="form" data-form="add"><label for="addName">Nom du lieu<input id="addName" required placeholder="Ex. : Nakameguro, café de chats"></label>
   <div class="row2"><label for="addCity">Ville<select id="addCity">${pl.order.map(c=>`<option value="${c}">${esc(CITY[c].n)}</option>`).join("")}</select></label>
   <label for="addDur">Durée<select id="addDur"><option value="1">1 h</option><option value="1.5">1 h 30</option><option value="2" selected>2 h</option><option value="3">3 h</option><option value="4">4 h</option><option value="7">Journée entière</option></select></label></div>
   <div class="row2"><label for="addArea">Quartier<input id="addArea" placeholder="Si tu le connais"></label><label for="addMoment">Moment<select id="addMoment"><option value="matin">Matin</option><option value="journee" selected>Journée</option><option value="aprem">Après-midi</option><option value="soir">Soir</option></select></label></div>
   <label class="check" for="addPin"><input id="addPin" type="checkbox" checked> À voir absolument</label><button class="btn" type="submit">Ajouter et recalculer</button></form>`);
}
let tt;function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,4200)}

/* ---------- Rendu général ---------- */
function render(scrollTop){
  renderTop();
  if(S.step>=6&&S.chosen)renderTrip();else{if(S.step>=6)S.step=5;renderStep()}
  if(scrollTop)window.scrollTo({top:0});
}
function positions(){const m={};if(!S.chosen)return m;plan().list.forEach(d=>d.items.forEach(x=>m[x.id]=d.idx));return m}
function recompute(reason){
  const before=positions();computePlans();const after=positions();flashIds=new Set();let moved=0;
  Object.keys(after).forEach(id=>{if(before[id]!==after[id]){moved++;flashIds.add(id)}});Object.keys(before).forEach(id=>{if(!(id in after))moved++});
  save();render(false);
  if(reason){const pl=S.chosen&&plan();const extra=pl&&pl.log.length?" "+pl.log[pl.log.length-1]:"";toast(`${reason} ${moved?moved+(moved>1?" changements":" changement")+" dans le programme.":"Le programme ne bouge pas."}${extra}`)}
}

/* ---------- Événements ---------- */
document.addEventListener("click",e=>{
  const tb=e.target.closest("[data-tab]");if(tb){S.tab=tb.dataset.tab;save();render(true);return}
  const b=e.target.closest("[data-act]");if(!b)return;
  const a=b.dataset.act,id=b.dataset.id,v=b.dataset.v;
  if(a==="next"){if(b.disabled)return;clearTimeout(rsTimer);S.step=Math.min(5,S.step+1);save();render(true)}
  else if(a==="prev"){clearTimeout(rsTimer);S.step=Math.max(0,S.step-1);save();render(true)}
  else if(a==="goto"){S.step=+v;save();render(true)}
  else if(a==="restart"){const keep={hotels:S.hotels,custom:S.custom};S=Object.assign(defaults(),keep);save();render(true)}
  else if(a==="example"){S=Object.assign(defaults(),{musts:["fuji","inari","nara","miyajima","onsen","shibuya","gion","kamakura","sumo"],step:5,researchDone:true});save();render(true);toast("Exemple chargé : 14 jours, de Tokyo Haneda à Osaka Kansai.")}
  else if(a==="from"){S.from=v;save();render(false)}
  else if(a==="len"){S.len=Math.max(4,Math.min(30,S.len+(+v)));save();render(false)}
  else if(a==="lenset"){S.len=+v;save();render(false)}
  else if(a==="rythme"){S.rythme=v;if(S.step>=7)recompute(`Rythme ${RY[v].label.toLowerCase()}.`);else{save();render(false)}}
  else if(a==="arr"||a==="ret"){S[a]=v;save();render(false)}
  else if(a==="mtoggle"){S.musts=S.musts.includes(v)?S.musts.filter(x=>x!==v):S.musts.concat(v);S.nope=(S.nope||[]).filter(x=>x!==v);S.researchDone=false;save();renderTop();renderDeck()}
  else if(a==="mosaic"){S.mosaic=!S.mosaic;save();renderDeck()}
  else if(a==="swipe"){const c=document.querySelector(".dcard.top");if(c)flyOut(c,v)}
  else if(a==="undo"){const h=(S.hist||[]).pop();if(h){S.musts=S.musts.filter(x=>x!==h[0]);S.nope=(S.nope||[]).filter(x=>x!==h[0]);save();renderTop();renderDeck()}}
  else if(a==="keep"){const d=S.dropWeb||[];S.dropWeb=d.includes(v)?d.filter(x=>x!==v):d.concat(v);save();const y=window.scrollY;renderResearch();window.scrollTo({top:y})}
  else if(a==="reanalyse"){save();const y=window.scrollY;renderResearch();window.scrollTo({top:y});toast(S.found.length?`${S.found.length} lieu${S.found.length>1?"x":""} repéré${S.found.length>1?"s":""} dans tes textes.`:"Aucun lieu reconnu dans tes textes.")}
  else if(a==="src-del"){S.sources.splice(+b.dataset.i,1);save();render(false)}
  else if(a==="active"){if(e.target.closest("[data-act='choose']"))return;S.active=v;save();render(false)}
  else if(a==="choose"){S.chosen=v;S.active=v;S.step=6;S.tab="jours";save();render(true);toast(`Itinéraire ${v} généré jour par jour.`)}
  else if(a==="city"){cityTripSheet(v)}
  else if(a==="open")placeSheet(id);
  else if(a==="lightbox")lightbox(b.dataset.k);
  else if(a==="addr")addrSheet(v);
  else if(a==="lmode"){S.lmode=v;save();render(false)}
  else if(a==="yt"){b.outerHTML=`<iframe class="yt" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}?autoplay=1&rel=0" title="Vidéo YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`}
  else if(a==="share")shareSheet();
  else if(a==="copylink")copyLink();
  else if(a==="nativeshare")nativeShare();
  else if(a==="today"){const i=todayIdx(plan());const el=document.getElementById("day-"+i);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}
  else if(a==="offline")offlineSheet();
  else if(a==="dloffline")downloadOffline(b);
  else if(a==="import")acceptImport();
  else if(a==="theme"){const r=document.documentElement;r.dataset.theme=isDark()?"light":"dark";try{localStorage.setItem("tabi-theme",r.dataset.theme)}catch(e){}render(false)}
  else if(a==="lbclose")document.getElementById("lb").hidden=true;
  else if(a==="close")closeSheet();
  else if(a==="filter"){S.filter=v;save();render(false)}
  else if(a==="cycle"){const cur=plan().st(P(id));S.sel[id]=cur==="out"?"in":cur==="in"?"pin":"out";recompute(`${P(id).n} : ${stateLabel(S.sel[id]).toLowerCase()}.`)}
  else if(a==="state"){S.sel[id]=v;recompute(`${P(id).n} : ${stateLabel(v).toLowerCase()}.`);placeSheet(id)}
  else if(a==="dplus"||a==="dminus"){const k=S.chosen;S.delta[k]=S.delta[k]||{};S.delta[k][id]=(S.delta[k][id]||0)+(a==="dplus"?1:-1);recompute(`${CITY[id].n} : ${a==="dplus"?"un jour de plus":"un jour de moins"}, pris ou rendu aux autres villes.`)}
  else if(a==="addplace")addSheet();
  else if(a==="delcustom"){S.custom=S.custom.filter(p=>p.id!==id);delete S.sel[id];closeSheet();recompute("Lieu supprimé.")}
});
document.addEventListener("submit",e=>{
  const f=e.target.closest("[data-form]");if(!f)return;e.preventDefault();
  if(f.dataset.form==="src"){const inp=f.querySelector("input");const url=inp.value.trim();if(!url)return;
    const type=/instagram\.com|^@/i.test(url)?"Instagram":/youtu\.?be/i.test(url)?"YouTube":f.dataset.type;
    S.sources.push({url,type,text:""});save();const y=window.scrollY;render(false);window.scrollTo({top:y});toast(`Lien ${type} ajouté.`)}
  if(f.dataset.form==="add"){const n=document.getElementById("addName").value.trim();if(!n)return;const c=document.getElementById("addCity").value;
    const p={id:"c"+Date.now(),n,jp:"",c,a:document.getElementById("addArea").value.trim()||"À préciser",d:+document.getElementById("addDur").value,m:document.getElementById("addMoment").value,ico:"pin",custom:true};
    S.custom.push(p);S.sel[p.id]=document.getElementById("addPin").checked?"pin":"in";closeSheet();S.tab="jours";recompute(`${n} ajouté à ${CITY[c].n}.`)}
});
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.id==="fromOther"&&t.value.trim()){S.from=t.value.trim();save();document.querySelectorAll('[data-act="from"]').forEach(x=>x.setAttribute("aria-pressed","false"))}
  if(t.dataset&&t.dataset.srctext!=null){S.sources[+t.dataset.srctext].text=t.value;save()}
  if(t.dataset&&t.dataset.hotel){S.hotels[t.dataset.hotel]=t.value;save()}
  if(t.id==="wordSearch"){wq=t.value;fillWords()}
});
document.addEventListener("change",e=>{if(e.target.id==="startDate"&&e.target.value){S.start=e.target.value;save();render(false)}if(e.target.id==="fromOther"){render(false)}});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;const lb=document.getElementById("lb");if(!lb.hidden){lb.hidden=true;return}if(!sheet.hidden)closeSheet()});

computePlans();
render(false);
checkImport();
registerSW();
