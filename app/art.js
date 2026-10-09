/* ---------- Fiches lieu illustrées : chaque bloc est une petite exposition ---------- */
const LB=[];
function imgKey(im){let i=LB.indexOf(im);if(i<0){LB.push(im);i=LB.length-1}return i}
function phImg(im,cls,w){if(!im)return "";const k=imgKey(im);return `<button type="button" class="ph ${cls||""}" data-act="lightbox" data-k="${k}" aria-label="Agrandir : ${esc(im.t)}"><img src="${thumb(im.src,w||960)}" data-full="${im.src}" alt="${esc(im.t)}" loading="lazy" decoding="async"></button>`}
function cartel(im){if(!im)return "";return `<div class="cartel"><span class="ct">${esc(im.t)}</span><span class="cm">${esc(im.a||"Auteur inconnu")}${im.d?", "+esc(im.d):""} · <a href="${esc(im.u)}" target="_blank" rel="noopener">${esc(im.l)}</a></span></div>`}
function figure(im,cls,w){return im?`<figure class="fig ${cls||""}">${phImg(im,"",w)}${cartel(im)}</figure>`:""}
function nearAddr(p,maxKm){
  const list=(ADDR[p.c]||[]).filter(a=>a.near===p.id||(p.lat&&a.lat&&km(p,a)<=(maxKm||1.2)));
  return list.sort((a,b)=>(a.near===p.id?0:1)-(b.near===p.id?0:1)||(p.lat&&a.lat&&b.lat?km(p,a)-km(p,b):0));
}
function addrCard(a,from){
  const kd=ADDR_KIND[a.k]||["Adresse","店"];
  const dist=from&&from.lat&&a.lat?Math.round(km(from,a)*1000):null;
  const gm="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent((a.jp||a.n)+" "+(a.q||""));
  return `<li class="addr"><span class="addr-k" aria-hidden="true">${kd[1]}</span><div class="addr-b"><div class="addr-h"><b>${esc(a.n)}</b>${a.jp?`<span class="addr-jp" lang="ja">${esc(a.jp)}</span>`:""}</div><div class="addr-m">${esc(kd[0])}${a.q?" · "+esc(a.q):""}${dist!=null?` · ${dist<1000?dist+" m":(dist/1000).toFixed(1).replace(".",",")+" km"}`:""}</div><p>${esc(a.why)}</p>${a.tip?`<p class="addr-tip">${esc(a.tip)}</p>`:""}<div class="addr-l"><a href="${gm}" target="_blank" rel="noopener">Y aller</a>${(a.src||[]).slice(0,2).map(s=>`<a href="${esc(s.u)}" target="_blank" rel="noopener">Source : ${esc(s.n)}</a>`).join("")}</div></div></li>`;
}
function videoBlock(list){
  if(!list||!list.length)return "";
  return `<div class="vrow">${list.map(v=>`<figure class="vid"><button type="button" class="vthumb2" data-act="yt" data-v="${esc(v.vid)}" aria-label="Lire la vidéo : ${esc(v.t)}"><img src="https://i.ytimg.com/vi/${esc(v.vid)}/hqdefault.jpg" alt="" loading="lazy"><span class="play"></span></button><figcaption><b>${esc(v.t)}</b><span>${esc(v.ch||"")}${v.y?" · "+esc(v.y):""}${v.dur?" · "+esc(v.dur):""}</span></figcaption></figure>`).join("")}</div>`;
}
function artSheet(p,v,where,map){
  const G=p.g||{};const ph=G.photos||[];const hero=ph[0];
  let h=`<div class="art-hero">${hero?phImg(hero,"hero-img"):`<div class="hero-img">${sceneSVG(p)}</div>`}<div class="art-over"><div class="art-jpb" lang="ja">${esc(p.jp||"")}</div><div class="art-eye">${esc(CITY[p.c].n)} · ${esc(p.a)} · ${fmtDur(p.d)}${where?` · Jour ${where.idx+1}`:""}</div><h2>${esc(p.n)}</h2></div>${hero?`<span class="art-credit">${esc(hero.a||"")}, <a href="${esc(hero.u)}" target="_blank" rel="noopener">${esc(hero.l)}</a></span>`:""}</div>`;
  h+=`<div class="f-actions">${S.chosen?`<div class="seg" role="group" aria-label="Statut">${["out","in","pin"].map(k=>`<button type="button" data-act="state" data-id="${p.id}" data-v="${k}" aria-pressed="${v===k}">${k==="out"?"Non":k==="in"?"Oui":"Incontournable"}</button>`).join("")}</div>`:""}<a class="btn quiet sm" href="${map}" target="_blank" rel="noopener" style="text-decoration:none">Ouvrir le plan</a></div>`;
  if(ph.length>1)h+=`<section class="art-sec"><div class="art-k"><span lang="ja">写真</span>La galerie</div><div class="gal-row">${ph.slice(1).map(im=>figure(im,"gal-item")).join("")}</div></section>`;
  if(p.v&&p.v.length)h+=`<section class="art-sec"><div class="art-k"><span lang="ja">映像</span>Avant d'y aller, en vidéo</div>${videoBlock(p.v)}</section>`;
  const cb=citedBy(p.id);if(cb.length)h+=`<section class="f-sec cited"><h4>Vu dans tes sources</h4><ul>${cb.map(s=>`<li><a href="${s.u}" target="_blank" rel="noopener">${esc(s.n)}</a> : ${esc(s.a||"vidéo YouTube, titre seulement")}</li>`).join("")}</ul></section>`;
  if(p.h){const hi=G.hist||[];h+=`<section class="art-sec"><div class="art-k"><span lang="ja">歴史</span>Histoire</div><p class="art-lead">${esc(p.h)}</p>${hi.length?`<div class="hist-grid">${figure(hi[0],"wide")}${hi.slice(1).map(im=>figure(im)).join("")}</div>`:""}</section>`}
  if(p.p)h+=`<section class="art-sec"><div class="art-k"><span lang="ja">人物</span>Personnage marquant</div><div class="person ${G.person?"":"noimg"}">${G.person?figure(G.person,"portrait"):""}<div class="person-txt"><div class="who-big">${esc(p.p[0])}</div>${G.personDates?`<div class="who-dates">${esc(G.personDates)}</div>`:""}<p>${esc(p.p[1])}</p></div></div></section>`;
  if(p.f)h+=`<section class="art-sec folk-art"><div class="art-k"><span lang="ja">伝説</span>Folklore et légendes</div>${G.folk?`<div class="mat">${phImg(G.folk)}</div>${cartel(G.folk)}`:""}<p class="art-lead">${esc(p.f)}</p></section>`;
  if(p.s)h+=`<section class="art-sec"><div class="art-k"><span lang="ja">驚き</span>Fait surprenant</div><p class="art-lead big">${esc(p.s)}</p></section>`;
  if(p.b&&p.b.length)h+=`<section class="art-sec"><div class="art-k"><span lang="ja">お得</span>Bons plans</div><ul class="art-list">${p.b.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>`;
  if(p.t)h+=`<section class="art-sec treasure-art"><div class="art-k"><span lang="ja">穴場</span>Trésor caché</div><p class="art-lead">${esc(p.t)}</p></section>`;
  const na=nearAddr(p);
  if(na.length||p.lat)h+=`<section class="art-sec"><div class="art-k"><span lang="ja">近所</span>Autour, comme un local</div>${p.lat?`<div class="minimap" id="mm-${p.id}"></div>`:""}${na.length?`<ul class="addrs">${na.slice(0,8).map(a=>addrCard(a,p)).join("")}</ul>`:`<p class="small">Pas encore d'adresse repérée tout près. Regarde la fiche de ${esc(CITY[p.c].n)} dans l'onglet Carte.</p>`}</section>`;
  h+=`<p class="small art-src">Images : Wikimedia Commons. Auteur et licence sous chaque image ; touche une image pour l'agrandir.</p>`;
  return h;
}
function lightbox(k){const im=LB[+k];if(!im)return;const lb=document.getElementById("lb");lb.innerHTML=`<button type="button" class="lb-close btn-ghost" data-act="lbclose">Fermer</button><img src="${im.src}" alt="${esc(im.t)}">${cartel(im)}`;lb.hidden=false}
