/* Coups de cœur, recherche et suggestions A/B/C */
function keptWeb(){return WEB.filter(s=>!(S.dropWeb||[]).includes(s.id))}
function webFound(){return [...new Set(keptWeb().flatMap(s=>s.p))]}
function citedBy(pid){return keptWeb().filter(s=>s.p.includes(pid))}
function likedTags(){const c={};S.musts.forEach(id=>(EXP[id]||["",[]])[1].forEach(t=>c[t]=(c[t]||0)+1));return c}
function relevance(s){const lt=likedTags();const lp=new Set(S.musts.flatMap(id=>MUST[id]?MUST[id].p:[]));return s.t.reduce((a,t)=>a+(lt[t]||0),0)+s.p.filter(x=>lp.has(x)).length*4}

/* ---------- Écran coups de cœur ---------- */
function mustPlace(mid){return P(MUST[mid].p[0])}
/* Le paquet s'adapte : après chaque choix, les cartes les plus proches de tes goûts remontent */
function nopeTags(){const c={};(S.nope||[]).forEach(id=>(EXP[id]||["",[]])[1].forEach(t=>c[t]=(c[t]||0)+1));return c}
function affinity(mu){const lt=likedTags(),nt=nopeTags();const tg=(EXP[mu.id]||["",[]])[1];return tg.reduce((a,t)=>a+(lt[t]||0)*1.2-(nt[t]||0)*0.8,0)}
function deckLeft(){const base=MUSTS.filter(m=>!S.musts.includes(m.id)&&!(S.nope||[]).includes(m.id));if(!S.musts.length&&!(S.nope||[]).length)return base;return base.map((m,i)=>({m,s:affinity(m)-i*0.01})).sort((a,b)=>b.s-a.s).map(x=>x.m)}
function cardReason(mu){const lt=likedTags();const tg=(EXP[mu.id]||["",[]])[1].filter(t=>lt[t]);if(!tg.length)return "";return `Parce que tu aimes : ${tg.slice(0,2).map(t=>TAGS[t].toLowerCase()).join(", ")}`}
let PREVIEW=null;
function previewPlan(){try{PREVIEW=planOption({k:"A",n:"Ton voyage",cities:[AIR[S.arr].c]})}catch(e){PREVIEW=null}return PREVIEW}
function routeEffect(mu){const p=mustPlace(mu.id);const pl=PREVIEW;if(!pl)return "";
  if(pl.order.includes(p.c))return `<span class="eff on">Déjà sur ta route · ${esc(CITY[p.c].n)}</span>`;
  const near=pl.order.slice().sort((a,b)=>legH(a,p.c)-legH(b,p.c))[0];
  return `<span class="eff new">Nouvelle étape : ${esc(CITY[p.c].n)}, ${fmtH(legH(near,p.c))} depuis ${esc(CITY[near].n)}</span>`}
function fillGauge(pl){const R=RY[S.rythme];const cap=pl.list.reduce((s,d)=>s+d.cap+d.eve,0);const used=pl.list.reduce((s,d)=>s+d.used+d.eveUsed,0);return {cap,used,pct:cap?Math.min(1,used/cap):0,over:pl.over.length}}
function previewHTML(){const pl=previewPlan();if(!pl)return "";const g=fillGauge(pl);
  const msg=g.over?`C'est plein : ${g.over} lieu${g.over>1?"x":""} ne rentre${g.over>1?"nt":""} plus. Ajoute des jours ou change de rythme.`:g.pct>.85?"Presque plein : encore un ou deux coups de cœur.":`Il reste de la place : environ ${Math.max(1,Math.round((g.cap-g.used)/3))} demi-journées libres.`;
  return `<section class="preview"><div class="k">Ton voyage se dessine</div>${chainHTML(pl)}<div class="gauge ${g.over?"full":""}"><i style="width:${Math.round(g.pct*100)}%"></i></div><p class="small">${msg}</p><div id="deckMap" class="deckmap"></div></section>`}

function dcard(mu,top,i){const p=mustPlace(mu.id),e=EXP[mu.id];return `<article class="dcard ${top?"top":""}" data-id="${mu.id}" style="--i:${i}" ${top?"":'aria-hidden="true"'}><div class="dcard-img">${postcard(p)}</div><div class="dcard-body"><div class="dcard-city">${esc(CITY[p.c].n)} · ${CITY[p.c].jp} · ${fmtDur(p.d)}</div><h2>${esc(mu.n)}</h2>${top&&cardReason(mu)?`<div class="reason">${esc(cardReason(mu))}</div>`:""}<p>${esc(e[0])}</p><div class="dtags">${e[1].map(t=>`<span>${TAGS[t]}</span>`).join("")}</div>${top?routeEffect(mu):""}</div><span class="dstamp like">Coup de cœur</span><span class="dstamp nope">Pas pour moi</span></article>`}
function profileHTML(){const c=likedTags();const ent=Object.entries(c).sort((a,b)=>b[1]-a[1]);if(!ent.length)return "";const mx=ent[0][1];return `<div class="profile"><div class="k">Ton profil de voyageur</div>${ent.map(([t,n])=>`<div class="pbar"><span>${TAGS[t]}</span><i><b style="width:${Math.round(n/mx*100)}%"></b></i><em>${n}</em></div>`).join("")}</div>`}
function renderDeck(){
  const m=document.getElementById("main");previewPlan();const left=deckLeft();const seen=MUSTS.length-left.length;
  let h=`<section class="step"><div class="q-eyebrow">Question 4 sur 4</div><h1 class="q-title">Qu'est-ce qui te fait rêver ?</h1><p class="q-lead">Pas besoin de connaître le pays. Glisse à droite ce qui te plaît, à gauche ce qui ne te dit rien. Les cartes suivantes s'adaptent à tes goûts, et ton itinéraire se dessine en dessous à chaque choix.</p>
  <div class="deck-bar"><span class="count">${seen} / ${MUSTS.length} vus · ${S.musts.length} coup${S.musts.length>1?"s":""} de cœur</span><button type="button" class="linkbtn" data-act="mosaic">${S.mosaic?"Revenir aux cartes":"Tout voir d'un coup"}</button></div>`;
  if(S.mosaic){
    h+=`<div class="mosaic">${MUSTS.map(mu=>{const on=S.musts.includes(mu.id);return `<button type="button" class="mtile ${on?"on":""}" data-act="mtoggle" data-v="${mu.id}" aria-pressed="${on}"><span class="mimg">${postcard(mustPlace(mu.id),"",330)}</span><span class="mname">${esc(mu.n)}</span><span class="mheart" aria-hidden="true">♥</span></button>`}).join("")}</div>`;
  }else if(left.length){
    const show=left.slice(0,3).reverse();
    h+=`<div class="deck" id="deck">${show.map((mu,k)=>dcard(mu,k===show.length-1,show.length-1-k)).join("")}</div>
    <div class="deck-actions"><button type="button" class="dbtn nope" data-act="swipe" data-v="nope" aria-label="Pas pour moi">✕</button><button type="button" class="dbtn undo" data-act="undo" aria-label="Annuler le dernier choix" ${(S.hist||[]).length?"":"disabled"}>↶</button><button type="button" class="dbtn like" data-act="swipe" data-v="like" aria-label="Coup de cœur">♥</button></div>`;
  }else{
    h+=`<div class="infobox"><span class="k">C'est tout vu</span><span>${S.musts.length?`${S.musts.length} coups de cœur retenus.`:"Aucun coup de cœur : on partira sur les grands classiques."}</span></div>`;
  }
  if(S.musts.length&&!S.mosaic)h+=`<div class="likes">${S.musts.map(id=>`<button type="button" class="lchip" data-act="mtoggle" data-v="${id}" title="Retirer">${esc(MUST[id].n)} <span aria-hidden="true">×</span></button>`).join("")}</div>`;
  h+=previewHTML()+profileHTML();
  h+=navRow(S.musts.length?"Chercher en ligne pour mon voyage":"Passer et chercher en ligne")+`</section>`;
  m.innerHTML=h;
  bindDeck();
  const dm=document.getElementById("deckMap");if(dm&&PREVIEW)mountMap(dm,{routes:[{k:"A",order:PREVIEW.order}],active:"A",fit:PREVIEW.order,onCity:cityChoiceSheet});
}
function decide(id,v){S.hist=(S.hist||[]).concat([[id,v]]);if(v==="like"){if(!S.musts.includes(id))S.musts=S.musts.concat(id)}else S.nope=(S.nope||[]).concat(id);S.researchDone=false;save();renderTop();renderDeck()}
function flyOut(card,v){const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduce){decide(card.dataset.id,v);return}card.style.transition="transform .25s ease-in, opacity .25s";card.style.transform=`translateX(${v==="like"?520:-520}px) rotate(${v==="like"?24:-24}deg)`;card.style.opacity="0";setTimeout(()=>decide(card.dataset.id,v),220)}
function bindDeck(){
  const card=document.querySelector(".dcard.top");if(!card)return;
  let x0=null,dx=0,id=null;
  card.addEventListener("pointerdown",e=>{x0=e.clientX;dx=0;id=e.pointerId;card.setPointerCapture(id);card.style.transition="none"});
  card.addEventListener("pointermove",e=>{if(x0==null||e.pointerId!==id)return;dx=e.clientX-x0;card.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;card.classList.toggle("go-like",dx>40);card.classList.toggle("go-nope",dx<-40)});
  const end=()=>{if(x0==null)return;x0=null;if(Math.abs(dx)>90)flyOut(card,dx>0?"like":"nope");else{card.style.transition="transform .2s";card.style.transform="";card.classList.remove("go-like","go-nope")}};
  card.addEventListener("pointerup",end);card.addEventListener("pointercancel",end);
}

/* ---------- Écran recherche en ligne ---------- */
let rsTimer=null;
function avatar(s){const hue=[...s.n].reduce((a,c)=>a+c.charCodeAt(0),0)%360;const txt=s.n.replace(/^@/,"").slice(0,1).toUpperCase();return `<span class="ava" style="--h:${hue}">${esc(txt)}</span>`}
function srcCard(s){
  const kept=!(S.dropWeb||[]).includes(s.id);
  const talks=[...s.t.map(t=>TAGS[t]),...s.p.map(pid=>P(pid).n),...(s.c||[]).map(c=>CITY[c].n)];
  const ctl=`<button type="button" class="keep ${kept?"on":""}" data-act="keep" data-v="${s.id}" aria-pressed="${kept}">${kept?"Gardé":"Écarté"}</button>`;
  if(s.k==="yv")return `<article class="vcard ${kept?"":"off"}"><a class="vthumb" href="${s.u}" target="_blank" rel="noopener" aria-label="Ouvrir la vidéo sur YouTube">${postcard(P(s.th),"v")}<span class="play" aria-hidden="true"></span></a><div class="vbody"><b>${esc(s.n)}</b><span class="small">Vidéo YouTube</span><div class="talk">${talks.map(t=>`<span>${esc(t)}</span>`).join("")}</div><div class="srow"><span class="status warn">Titre lu · contenu non lu</span>${ctl}</div></div></article>`;
  return `<article class="scard ${kept?"":"off"}">${avatar(s)}<div class="sbody"><div class="shead"><a href="${s.u}" target="_blank" rel="noopener"><b>${esc(s.n)}</b></a>${s.by?`<span class="small">${esc(s.by)}</span>`:""}</div><p>${esc(s.a)}</p>${s.v&&s.v.length?`<p class="small">Vidéos citées : ${s.v.map(v=>`« ${esc(v)} »`).join(", ")}</p>`:""}<div class="talk">${talks.map(t=>`<span>${esc(t)}</span>`).join("")}</div><div class="srow"><span class="status">Profil décrit par ${esc(REFS[s.ref].n)}</span>${ctl}</div>${s.note?`<p class="small">${esc(s.note)}</p>`:""}</div></article>`;
}
function renderResearch(){
  clearTimeout(rsTimer);
  const m=document.getElementById("main");
  const by=k=>WEB.filter(s=>s.k===k).sort((a,b)=>relevance(b)-relevance(a));
  const ig=by("ig"),yc=by("yc"),yv=by("yv");
  const kept=keptWeb();const found=webFound();const gems=[...new Set(kept.flatMap(s=>s.gems||[]))];
  const liked=new Set(S.musts.flatMap(id=>MUST[id].p));
  const cities=[...new Set(kept.flatMap(s=>(s.c||[]).concat(s.p.map(pid=>P(pid).c))))];
  const A=analyze();S.found=A.ids;
  const phases=[
   {t:"Je cherche des comptes Instagram qui parlent du Japon",d:`${ig.length} comptes trouvés`,body:`<div class="slist">${ig.map(srcCard).join("")}</div>`},
   {t:"Je cherche des chaînes et des vidéos YouTube",d:`${yc.length} chaînes et ${yv.length} vidéos trouvées`,body:`<div class="vlist">${yv.map(srcCard).join("")}</div><div class="slist">${yc.map(srcCard).join("")}</div>`},
   {t:"Je récupère la donnée",d:`${kept.length} sources gardées sur ${WEB.length}`,body:`<div class="stats"><div><b>${kept.length}</b><span>sources gardées</span></div><div><b>${found.length+cities.length}</b><span>lieux et villes repérés</span></div><div><b>${gems.length}</b><span>pépites hors catalogue</span></div></div><div class="notice warn"><strong>Ce qui a vraiment été lu</strong><span>Profils et chaînes : leur description dans des articles qui les recommandent. Vidéos : le titre seulement, les pages YouTube ont refusé la lecture. Instagram : aucun post lu directement. La recherche a été faite le 8 octobre 2026 et ne se relance pas encore toute seule.</span></div>`},
   {t:"Je croise avec ton voyage",d:`${found.filter(x=>liked.has(x)).length} de tes coups de cœur cités par les sources`,body:`${found.length?`<div class="k2">Lieux cités par les sources gardées</div><div class="likes">${found.map(pid=>`<button type="button" class="lchip ${liked.has(pid)?"hot":""}" data-act="open" data-id="${pid}">${esc(P(pid).n)}${liked.has(pid)?' <span aria-hidden="true">♥</span>':""}</button>`).join("")}</div>`:""}${gems.length?`<div class="k2">Pépites repérées, pas encore dans le catalogue</div><div class="gems">${gems.map(g=>{const G=GEMS[g];return `<article class="gem"><div class="gimg">${postcard({id:"gem"+g,n:G.n,ico:"pin"},"",330)}</div><div><b>${esc(G.n)}</b><p class="small">${esc(G.a)}</p></div></article>`}).join("")}</div>`:""}`}
  ];
  const own=`<details class="own" ${S.sources.length?"open":""}><summary>Ajouter tes propres liens Instagram ou YouTube</summary>
   <div class="drop"><form class="src-form" data-form="src" data-type="Lien"><input type="text" placeholder="Colle un lien instagram.com ou youtube.com" aria-label="Lien à ajouter"><button class="btn sm" type="submit">Ajouter</button></form>
   ${S.sources.length?`<ul class="tags">${S.sources.map((s,i)=>`<li class="tagcard"><div class="tag-top"><span class="badge ${s.type==="Instagram"?"ig":s.type==="YouTube"?"yt":"lk"}">${s.type}</span><span class="tag-url">${esc(s.url)}</span><button type="button" class="x" data-act="src-del" data-i="${i}" aria-label="Retirer">×</button></div><textarea data-srctext="${i}" placeholder="Colle ici la légende du post ou la description de la vidéo : les lieux cités seront repérés.">${esc(s.text||"")}</textarea></li>`).join("")}</ul><button type="button" class="btn quiet sm" data-act="reanalyse">Lire mes textes</button>${A.ids.length?`<div class="likes">${A.ids.map(pid=>`<span class="lchip hot">${esc(P(pid).n)}</span>`).join("")}</div>`:""}`:""}
   <p class="small">Les liens seuls ne sont pas lus. La lecture automatique passera par ton n8n.</p></div></details>`;
  m.innerHTML=`<section class="step"><div class="q-eyebrow">Recherche en ligne</div><h1 class="q-title">Je fouille le web pour ton voyage</h1><p class="q-lead">Influenceurs, chaînes, vidéos : je les trie selon tes coups de cœur. Garde ou écarte chaque source, tu gardes la main.</p>
   <ol class="phases">${phases.map((ph,i)=>`<li class="phase" data-i="${i}"><div class="ph-head"><span class="st"></span><span><b>${ph.t}</b><br><span class="det">${ph.d}</span></span></div><div class="ph-body" hidden>${ph.body}</div></li>`).join("")}</ol>
   ${own}
   <p class="small refs">Trouvé via ${Object.values(REFS).map(r=>`<a href="${r.u}" target="_blank" rel="noopener">${r.n}</a>`).join(", ")}.</p>
   <div class="wz-nav"><button type="button" class="btn quiet" data-act="prev">Retour</button><button type="button" class="btn" id="seeBtn" data-act="next" ${S.researchDone?"":"disabled"}>Voir ce que je te suggère</button></div></section>`;
  const lis=[...m.querySelectorAll(".phase")];
  const show=i=>{lis[i].classList.add("on","ok");lis[i].querySelector(".ph-body").hidden=false};
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(S.researchDone||reduce){lis.forEach((_,i)=>show(i));S.researchDone=true;document.getElementById("seeBtn").disabled=false;computePlans();save();return}
  let i=0;const tick=()=>{if(!document.querySelector(".phases"))return;if(i<lis.length){lis[i].classList.add("on");const k=i;rsTimer=setTimeout(()=>{show(k);i++;tick()},1100)}else{S.researchDone=true;save();const b=document.getElementById("seeBtn");if(b)b.disabled=false;computePlans()}};tick();
}

/* ---------- Écran suggestions ---------- */
function highlights(pl){const placed=new Set();pl.list.forEach(d=>d.items.forEach(x=>placed.add(x.id)));const out=[];pl.cover.filter(x=>x.ok).forEach(x=>{const pid=x.m.p.find(id=>placed.has(id));if(pid&&!out.includes(pid))out.push(pid)});pl.order.forEach(c=>{const p=allPlaces().find(p=>p.c===c&&placed.has(p.id)&&!out.includes(p.id));if(p)out.push(p.id)});return out.slice(0,3)}
function reasons(pl){const placed=new Set();pl.list.forEach(d=>d.items.forEach(x=>placed.add(x.id)));const out=[];const ok=pl.cover.filter(x=>x.ok);
  if(pl.cover.length)out.push(`${ok.length} de tes ${pl.cover.length} coups de cœur${ok.length?` : ${ok.slice(0,4).map(x=>x.m.n).join(", ")}${ok.length>4?", etc":""}`:""}.`);
  const cites=webFound().filter(pid=>placed.has(pid)).map(pid=>`${P(pid).n} (${citedBy(pid).map(s=>s.n.length>28?s.n.slice(0,26)+"…":s.n).join(", ")})`);
  if(cites.length)out.push(`Vu dans tes sources : ${cites.slice(0,3).join(" ; ")}.`);
  const vc=keptWeb().filter(s=>s.k==="yv"&&s.c.length&&s.c.every(c=>pl.order.includes(c)));
  if(vc.length)out.push(`${vc.length} vidéo${vc.length>1?"s":""} trouvée${vc.length>1?"s":""} sur le même trajet.`);
  out.push(`${fmtH(pl.travel)} de trajets pour ${pl.order.length} étapes.`);
  return out}
function score(pl){return pl.cover.filter(x=>x.ok).length*10+pl.foundOk*2-pl.travel*.4-pl.over.filter(p=>pl.st(p)==="pin").length*8}
function altDiff(k,best){
  const out={gain:[],perte:[]};if(k===best)return out;const a=PLANS[k],b=PLANS[best];
  const plus=a.order.filter(c=>!b.order.includes(c)).map(c=>CITY[c].n),moins=b.order.filter(c=>!a.order.includes(c)).map(c=>CITY[c].n);
  if(plus.length)out.gain.push(`Par rapport à ${best} : ${plus.join(", ")} en plus`);
  if(moins.length)out.perte.push(`Par rapport à ${best} : sans ${moins.join(", ")}`);
  const dt=a.travel-b.travel;if(Math.abs(dt)>=0.75)(dt>0?out.perte:out.gain).push(`${fmtH(Math.abs(dt))} de trajet ${dt>0?"en plus":"en moins"} que ${best}`);
  return out}
function renderChoice(){
  computePlans();
  const m=document.getElementById("main");
  const best=OPTIONS.map(o=>o.k).sort((a,b)=>score(PLANS[b])-score(PLANS[a]))[0];
  const legend=`<div class="map-legend">${OPTIONS.map(o=>`<button type="button" class="leg" data-act="active" data-v="${o.k}" aria-pressed="${S.active===o.k}"><i style="background:${RC[o.k]}"></i>${o.k}</button>`).join("")}</div>`;
  m.innerHTML=`<section class="step" style="gap:10px"><div class="q-eyebrow">Mes suggestions</div><h1 class="q-title">Voici ce que je te suggère</h1>
   <p class="q-lead">D'après ton voyage (${S.len} jours, de ${esc(S.from)} à ${esc(AIR[S.arr].n)}, retour par ${esc(AIR[S.ret].n)}), tes ${S.musts.length} coups de cœur et les ${keptWeb().length} sources trouvées en ligne.</p>
   <div id="mapA"></div>
   <div class="optlist">${OPTIONS.map(o=>{const pl=PLANS[o.k];const hl=highlights(pl);
     return `<article class="ocard ${S.active===o.k?'active':''}" style="--oc:${RC[o.k]}" data-act="active" data-v="${o.k}"><div class="strip">${hl.map(pid=>`<div>${postcard(P(pid),"",330)}<span>${esc(P(pid).n)}</span></div>`).join("")}</div>
      <div class="ocard-head"><span class="oletter">${o.k}</span><div><h3>${esc(o.n)}${o.k===best?' <span class="best">Mon conseil</span>':""}</h3><p class="otag">${esc(o.tag)}</p></div></div>
      ${chainHTML(pl)}
      ${o.pour?`<p class="opour"><b>Pour qui :</b> ${esc(o.pour)}</p>`:""}
      <div class="why"><div class="k2">Pourquoi cette route</div><ul>${reasons(pl).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
      ${o.gain?`<div class="tradeoff"><div class="to-g"><div class="k2">Tu gagnes</div><ul>${o.gain.filter(x=>!x.c||x.c.every(c=>pl.order.includes(c))).map(x=>`<li>${esc(x.t)}</li>`).join("")}${altDiff(o.k,best).gain.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div><div class="to-p"><div class="k2">Tu laisses de côté</div><ul>${o.perte.filter(x=>!x.c||x.c.every(c=>pl.order.includes(c))).map(x=>`<li>${esc(x.t)}</li>`).join("")}${altDiff(o.k,best).perte.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>`:""}
      ${pl.cover.some(x=>!x.ok)?`<p class="small">Manque : ${esc(pl.cover.filter(x=>!x.ok).map(x=>x.m.n).join(", "))}.</p>`:""}
      <div class="ocard-actions"><button type="button" class="btn sm" data-act="choose" data-v="${o.k}">Générer le jour par jour</button></div></article>`}).join("")}</div><div class="wz-nav"><button type="button" class="btn quiet" data-act="prev">Retour à la recherche</button><span></span></div></section>`;
  mountMap(document.getElementById("mapA"),{routes:OPTIONS.map(o=>({k:o.k,order:PLANS[o.k].order})),active:S.active,fit:[...new Set(OPTIONS.flatMap(o=>PLANS[o.k].order))],legend,onCity:cityChoiceSheet});
}
Object.assign(PSC,{gemgujo:["wood","day"],gemzao:["forestShrine","snow"],gemtrain:["hills","day"],gemmatcha:["garden","green"]});
