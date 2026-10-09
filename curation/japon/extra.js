/* ---------- Coups de cœur ---------- */
const TAGS={nature:"Nature",temples:"Temples et sanctuaires",ville:"Ville et néons",food:"Cuisine",culture:"Culture",histoire:"Histoire",art:"Art",detente:"Détente"};
const EXP={
 fuji:["Le volcan sacré, vu d'une pagode ou d'un lac.",["nature"]],
 inari:["Des milliers de portiques vermillon qui montent dans la forêt.",["temples","nature"]],
 kinkaku:["Un pavillon couvert d'or qui se reflète dans un étang.",["temples","histoire"]],
 shibuya:["Le carrefour le plus fréquenté du monde, sous les néons.",["ville"]],
 nara:["Des cerfs en liberté qui saluent, devant un Bouddha géant.",["temples","nature"]],
 miyajima:["Un grand portique rouge qui semble flotter sur la mer.",["temples","nature"]],
 hiroshima:["Comprendre le 6 août 1945, et la ville qui s'est relevée.",["histoire"]],
 onsen:["Bain chaud en plein air, dîner en yukata, futon sur tatami.",["detente"]],
 bamboo:["Une forêt de bambous où la lumière devient verte.",["nature"]],
 gion:["Ruelles de bois et lanternes du quartier des geishas.",["culture","histoire"]],
 kiyomizu:["Une terrasse en bois suspendue au-dessus de Kyoto.",["temples"]],
 osakafood:["Takoyaki, okonomiyaki et néons au bord du canal.",["food","ville"]],
 himeji:["Le plus grand château d'origine, blanc comme un héron.",["histoire"]],
 shirakawa:["Un village de fermes aux toits de chaume, sous la neige.",["nature","histoire"]],
 nikko:["Un mausolée sculpté et doré, dans une forêt de cèdres.",["temples","histoire"]],
 koya:["Dormir dans un temple, marcher dans un cimetière millénaire.",["temples","detente"]],
 naoshima:["Une île entière transformée en musée face à la mer.",["art"]],
 kanazawa:["L'un des trois plus beaux jardins du pays, et des maisons de thé.",["culture"]],
 takayama:["Une vieille ville de bois, de saké et de bœuf de Hida.",["food","histoire"]],
 snowmonkeys:["Des singes sauvages qui prennent leur bain chaud dans la neige.",["nature"]],
 teamlab:["Un musée de lumière où l'on marche pieds nus dans l'eau.",["art"]],
 ghibli:["Le musée imaginé par Hayao Miyazaki.",["art","culture"]],
 akiba:["Mangas, jeux vidéo et salles d'arcade sur plusieurs étages.",["culture","ville"]],
 sumo:["Le sport rituel du Japon, en tournoi ou à l'entraînement.",["culture"]],
 kamakura:["Un Bouddha de bronze de 13 mètres, en plein air.",["temples","histoire"]],
 senso:["Le plus vieux temple de Tokyo et sa lanterne géante.",["temples"]],
 matsumoto:["Le château noir, surnommé le corbeau.",["histoire"]],
 fukuoka:["Des stands de rue où l'on mange un ramen au coude à coude.",["food"]],
 sapporo:["Neige, ramen au miso et culture aïnoue.",["nature","food"]],
 okinawa:["Plages turquoise et ancien royaume de Ryūkyū.",["nature","detente"]]
};

/* ---------- Ce que la recherche web a trouvé (8 octobre 2026) ---------- */
const REFS={
 jr:{n:"jrpass.com",u:"https://jrpass.com/blog/japan-travel-youtube-channels-to-follow-to-plan-your-trip"},
 gdi:{n:"gensdinternet.fr",u:"https://gensdinternet.fr/2023/06/06/envie-de-voyager-au-japon-regardez-les-vlogs-de-ces-youtubeurs/"},
 st:{n:"spoon-tamago.com",u:"https://spoon-tamago.com/our-favorite-japan-related-instagram-accounts-to-follow/"},
 jn:{n:"japannakama.co.uk",u:"https://www.japannakama.co.uk/?p=12623"},
 yt:{n:"recherche YouTube",u:"https://www.youtube.com/results?search_query=voyage+japon+itin%C3%A9raire"}
};
const WEB=[
 {id:"ig1",k:"ig",n:"@japanawaits",u:"https://www.instagram.com/japanawaits/",a:"Compte d'un voyagiste japonais : l'éventail des expériences possibles au Japon.",t:["culture","nature"],p:[],ref:"jn"},
 {id:"ig2",k:"ig",n:"@hirozzzz",u:"https://www.instagram.com/hirozzzz/",a:"Hiroaki Fukuda, photographe à Tokyo : lieux traditionnels, nature, monuments.",t:["temples","nature","ville"],p:[],ref:"jn"},
 {id:"ig3",k:"ig",n:"@10_ya",u:"https://www.instagram.com/10_ya/",a:"Tomoyasu Koyanagi : des paysages du Japon.",t:["nature"],p:[],ref:"st"},
 {id:"ig4",k:"ig",n:"@tatsu.photography",u:"https://www.instagram.com/tatsu.photography/",a:"Une vision plus sombre et urbaine du Japon, de nuit.",t:["ville"],p:[],ref:"jn"},
 {id:"ig5",k:"ig",n:"@tokyofashion",u:"https://www.instagram.com/tokyofashion/",a:"La mode de rue de Harajuku et de Shibuya.",t:["ville","culture"],p:["shibuya"],ref:"st"},
 {id:"ig6",k:"ig",n:"@tukanana",u:"https://www.instagram.com/tukanana/",a:"Cafés et pâtisseries, pour trouver les cafés cachés de Tokyo.",t:["food","ville"],p:[],ref:"st",note:"Cité par un lecteur dans les commentaires."},
 {id:"ig7",k:"ig",n:"@kagephoto",u:"https://www.instagram.com/kagephoto/",a:"Un photographe installé à Hokkaidō.",t:["nature"],p:["sapporoodori"],ref:"st",note:"Cité par un lecteur dans les commentaires."},
 {id:"ig8",k:"ig",n:"@yukomouton",u:"https://www.instagram.com/yukomouton/",a:"Des photos d'architecture japonaise.",t:["temples","art"],p:[],ref:"st",note:"Cité par un lecteur dans les commentaires."},
 {id:"yc1",k:"yc",n:"Only in Japan",by:"John Daub",u:"https://www.youtube.com/results?search_query=Only+in+Japan+John+Daub",a:"Street food, fêtes, technologie et culture pop, comme une émission de voyage.",v:["Japan's Night Train","Tokyo Capsule Hotel Experience"],t:["food","culture","ville"],p:[],ref:"jr"},
 {id:"yc2",k:"yc",n:"Abroad in Japan",by:"Chris Broad",u:"https://www.youtube.com/results?search_query=Abroad+in+Japan+Chris+Broad",a:"Sites, nourriture, curiosités culturelles et conseils de voyage.",v:["12 Things Not to Do in Japan","How Expensive is it to Travel Japan"],t:["culture","food"],p:[],ref:"jr"},
 {id:"yc3",k:"yc",n:"Internationally Me",by:"Angela",u:"https://www.youtube.com/results?search_query=Internationally+Me+Japan+Off+the+Beaten+Path",a:"Des lieux peu connus, avec une série « Japan Off the Beaten Path ».",v:["Tokyo Tourist Traps","8 Days in Japan"],t:["nature","culture"],p:[],ref:"jr"},
 {id:"yc4",k:"yc",n:"Rachel and Jun",by:"Rachel et Jun",u:"https://www.youtube.com/results?search_query=Rachel+and+Jun+Gujo+Hachiman",a:"Cuisine, visites et une série sur les artisans traditionnels.",v:["The Water City – Gujo Hachiman","Fox Village in Zao Japan"],t:["culture","nature","art"],p:[],gems:["gujo","zao"],ref:"jr"},
 {id:"yc5",k:"yc",n:"Life Where I'm From",by:"Greg Lam",u:"https://www.youtube.com/results?search_query=Life+Where+I%27m+From+Greg+Lam",a:"La vie d'une famille à Tokyo, utile pour voyager en famille.",v:["What Japanese Breakfast is Like","Japanese Family Sushi Restaurant"],t:["food","culture"],p:[],ref:"jr"},
 {id:"yc6",k:"yc",n:"Romy",by:"vlogueuse française",u:"https://www.youtube.com/results?search_query=Romy+vlog+Japon",a:"Dégustations, un match de sumo et la découverte du mont Fuji.",v:[],t:["food","culture","nature"],p:["sumo","chureito"],ref:"gdi"},
 {id:"yc7",k:"yc",n:"Djilsi et MarcelinZ",by:"vidéastes français",u:"https://www.youtube.com/results?search_query=Djilsi+Japon+train",a:"La traversée du Japon en train, en quatre épisodes.",v:[],t:["culture"],p:[],gems:["train"],ref:"gdi"},
 {id:"yc8",k:"yc",n:"Stelle Cautres",by:"vidéaste française",u:"https://www.youtube.com/results?search_query=Stelle+Cautres+Japon+matcha",a:"La rencontre des producteurs qui font son matcha.",v:[],t:["food"],p:[],gems:["matcha"],ref:"gdi"},
 {id:"yv1",k:"yv",n:"L'itinéraire parfait pour 15 jours au Japon (villes, activités, conseils)",u:"https://www.youtube.com/watch?v=U-uzDIzVq64",c:[],p:[],t:["culture"],ref:"yt",th:"chureito"},
 {id:"yv2",k:"yv",n:"Mon voyage au Japon (travel guide 2 semaines)",u:"https://www.youtube.com/watch?v=yFPmaxNFUH0",c:[],p:[],t:["culture"],ref:"yt",th:"inari"},
 {id:"yv3",k:"yv",n:"Road trip Japon, épisode 1 : de Tokyo à Kyoto",u:"https://www.youtube.com/watch?v=VAFGfv9yROk",c:["tokyo","kyoto"],p:[],t:["nature"],ref:"yt",th:"ashi"},
 {id:"yv4",k:"yv",n:"Vlog : notre voyage au Japon, épisode 2 (Kyoto, Osaka...)",u:"https://www.youtube.com/watch?v=mwb5dIgBvSU",c:["kyoto","osaka"],p:[],t:["food","temples"],ref:"yt",th:"dotonbori"},
 {id:"yv5",k:"yv",n:"Japan Vlog : a week through Kyoto, Kamakura & Tokyo",u:"https://www.youtube.com/watch?v=riyd-u57J54",c:["kyoto","tokyo"],p:["kamakura"],t:["temples","food"],ref:"yt",th:"kamakura"},
 {id:"yv6",k:"yv",n:"Japan Travel Vlog : Osaka, Nara & Kyoto",u:"https://www.youtube.com/watch?v=VsMXpqc_Pfc",c:["osaka","kyoto","nara"],p:["todaiji"],t:["temples","nature"],ref:"yt",th:"todaiji"}
];
const GEMS={
 gujo:{n:"Gujō Hachiman",a:"« La ville de l'eau », dans la préfecture de Gifu, filmée par Rachel and Jun.",sc:"wood"},
 zao:{n:"Village des renards de Zaō",a:"Dans la préfecture de Miyagi, au nord de Tokyo, filmé par Rachel and Jun.",sc:"forestShrine"},
 train:{n:"Traverser le pays en train",a:"Le défi filmé par Djilsi et MarcelinZ, en quatre épisodes.",sc:"hills"},
 matcha:{n:"Chez un producteur de matcha",a:"La visite filmée par Stelle Cautres.",sc:"garden"}
};
function keptWeb(){return WEB.filter(s=>!(S.dropWeb||[]).includes(s.id))}
function webFound(){return [...new Set(keptWeb().flatMap(s=>s.p))]}
function citedBy(pid){return keptWeb().filter(s=>s.p.includes(pid))}
function likedTags(){const c={};S.musts.forEach(id=>(EXP[id]||["",[]])[1].forEach(t=>c[t]=(c[t]||0)+1));return c}
function relevance(s){const lt=likedTags();const lp=new Set(S.musts.flatMap(id=>MUST[id]?MUST[id].p:[]));return s.t.reduce((a,t)=>a+(lt[t]||0),0)+s.p.filter(x=>lp.has(x)).length*4}

/* ---------- Écran coups de cœur ---------- */
function mustPlace(mid){return P(MUST[mid].p[0])}
function deckLeft(){return MUSTS.filter(m=>!S.musts.includes(m.id)&&!(S.nope||[]).includes(m.id))}
function dcard(mu,top,i){const p=mustPlace(mu.id),e=EXP[mu.id];return `<article class="dcard ${top?"top":""}" data-id="${mu.id}" style="--i:${i}" ${top?"":'aria-hidden="true"'}><div class="dcard-img">${postcard(p)}</div><div class="dcard-body"><div class="dcard-city">${esc(CITY[p.c].n)} · ${CITY[p.c].jp}</div><h2>${esc(mu.n)}</h2><p>${esc(e[0])}</p><div class="dtags">${e[1].map(t=>`<span>${TAGS[t]}</span>`).join("")}</div></div><span class="dstamp like">Coup de cœur</span><span class="dstamp nope">Pas pour moi</span></article>`}
function profileHTML(){const c=likedTags();const ent=Object.entries(c).sort((a,b)=>b[1]-a[1]);if(!ent.length)return "";const mx=ent[0][1];return `<div class="profile"><div class="k">Ton profil de voyageur</div>${ent.map(([t,n])=>`<div class="pbar"><span>${TAGS[t]}</span><i><b style="width:${Math.round(n/mx*100)}%"></b></i><em>${n}</em></div>`).join("")}</div>`}
function renderDeck(){
  const m=document.getElementById("main");const left=deckLeft();const seen=MUSTS.length-left.length;
  let h=`<section class="step"><div class="q-eyebrow">Question 4 sur 4</div><h1 class="q-title">Qu'est-ce qui te fait rêver ?</h1><p class="q-lead">Pas besoin de connaître le Japon. Glisse à droite ce qui te plaît, à gauche ce qui ne te dit rien. Chaque coup de cœur sera placé dans ton voyage.</p>
  <div class="deck-bar"><span class="count">${seen} / ${MUSTS.length} vus · ${S.musts.length} coup${S.musts.length>1?"s":""} de cœur</span><button type="button" class="linkbtn" data-act="mosaic">${S.mosaic?"Revenir aux cartes":"Tout voir d'un coup"}</button></div>`;
  if(S.mosaic){
    h+=`<div class="mosaic">${MUSTS.map(mu=>{const on=S.musts.includes(mu.id);return `<button type="button" class="mtile ${on?"on":""}" data-act="mtoggle" data-v="${mu.id}" aria-pressed="${on}"><span class="mimg">${postcard(mustPlace(mu.id))}</span><span class="mname">${esc(mu.n)}</span><span class="mheart" aria-hidden="true">♥</span></button>`}).join("")}</div>`;
  }else if(left.length){
    const show=left.slice(0,3).reverse();
    h+=`<div class="deck" id="deck">${show.map((mu,k)=>dcard(mu,k===show.length-1,show.length-1-k)).join("")}</div>
    <div class="deck-actions"><button type="button" class="dbtn nope" data-act="swipe" data-v="nope" aria-label="Pas pour moi">✕</button><button type="button" class="dbtn undo" data-act="undo" aria-label="Annuler le dernier choix" ${(S.hist||[]).length?"":"disabled"}>↶</button><button type="button" class="dbtn like" data-act="swipe" data-v="like" aria-label="Coup de cœur">♥</button></div>`;
  }else{
    h+=`<div class="infobox"><span class="k">C'est tout vu</span><span>${S.musts.length?`${S.musts.length} coups de cœur retenus.`:"Aucun coup de cœur : on partira sur les grands classiques."}</span></div>`;
  }
  if(S.musts.length&&!S.mosaic)h+=`<div class="likes">${S.musts.map(id=>`<button type="button" class="lchip" data-act="mtoggle" data-v="${id}" title="Retirer">${esc(MUST[id].n)} <span aria-hidden="true">×</span></button>`).join("")}</div>`;
  h+=profileHTML();
  h+=navRow(S.musts.length?"Chercher en ligne pour mon voyage":"Passer et chercher en ligne")+`</section>`;
  m.innerHTML=h;
  bindDeck();
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
   {t:"Je croise avec ton voyage",d:`${found.filter(x=>liked.has(x)).length} de tes coups de cœur cités par les sources`,body:`${found.length?`<div class="k2">Lieux cités par les sources gardées</div><div class="likes">${found.map(pid=>`<button type="button" class="lchip ${liked.has(pid)?"hot":""}" data-act="open" data-id="${pid}">${esc(P(pid).n)}${liked.has(pid)?' <span aria-hidden="true">♥</span>':""}</button>`).join("")}</div>`:""}${gems.length?`<div class="k2">Pépites repérées, pas encore dans le catalogue</div><div class="gems">${gems.map(g=>{const G=GEMS[g];return `<article class="gem"><div class="gimg">${postcard({id:"gem"+g,n:G.n,ico:"pin"},"")}</div><div><b>${esc(G.n)}</b><p class="small">${esc(G.a)}</p></div></article>`}).join("")}</div>`:""}`}
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
function renderChoice(){
  computePlans();
  const m=document.getElementById("main");
  const best=OPTIONS.map(o=>o.k).sort((a,b)=>score(PLANS[b])-score(PLANS[a]))[0];
  const legend=`<div class="map-legend">${OPTIONS.map(o=>`<button type="button" class="leg" data-act="active" data-v="${o.k}" aria-pressed="${S.active===o.k}"><i style="background:${RC[o.k]}"></i>${o.k}</button>`).join("")}</div>`;
  m.innerHTML=`<section class="step" style="gap:10px"><div class="q-eyebrow">Mes suggestions</div><h1 class="q-title">Voici ce que je te suggère</h1>
   <p class="q-lead">D'après ton voyage (${S.len} jours, de ${esc(S.from)} à ${esc(AIR[S.arr].n)}, retour par ${esc(AIR[S.ret].n)}), tes ${S.musts.length} coups de cœur et les ${keptWeb().length} sources trouvées en ligne.</p>
   <div id="mapA"></div>
   <div class="optlist">${OPTIONS.map(o=>{const pl=PLANS[o.k];const hl=highlights(pl);
     return `<article class="ocard ${S.active===o.k?'active':''}" style="--oc:${RC[o.k]}" data-act="active" data-v="${o.k}"><div class="strip">${hl.map(pid=>`<div>${postcard(P(pid))}<span>${esc(P(pid).n)}</span></div>`).join("")}</div>
      <div class="ocard-head"><span class="oletter">${o.k}</span><div><h3>${esc(o.n)}${o.k===best?' <span class="best">Mon conseil</span>':""}</h3><p class="otag">${esc(o.tag)}</p></div></div>
      ${chainHTML(pl)}
      <div class="why"><div class="k2">Pourquoi cette route</div><ul>${reasons(pl).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
      ${pl.cover.some(x=>!x.ok)?`<p class="small">Manque : ${esc(pl.cover.filter(x=>!x.ok).map(x=>x.m.n).join(", "))}.</p>`:""}
      <div class="ocard-actions"><button type="button" class="btn sm" data-act="choose" data-v="${o.k}">Générer le jour par jour</button></div></article>`}).join("")}</div><div class="wz-nav"><button type="button" class="btn quiet" data-act="prev">Retour à la recherche</button><span></span></div></section>`;
  mountMap(document.getElementById("mapA"),{routes:OPTIONS.map(o=>({k:o.k,order:PLANS[o.k].order})),active:S.active,fit:[...new Set(OPTIONS.flatMap(o=>PLANS[o.k].order))],legend,onCity:cityChoiceSheet});
}
Object.assign(PSC,{gemgujo:["wood","day"],gemzao:["forestShrine","snow"],gemtrain:["hills","day"],gemmatcha:["garden","green"]});
