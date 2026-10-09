/* Construit packs/japon/pack.json à partir des sources de curation.
   Usage : node tools/build-pack-japon.js <dossier sources>
   Le dossier contient : raw.json (lieux, villes, guide...), extra.js, japan.txt, gallery.json, addresses.json, places.json, videos.json (optionnel). */
const fs=require('fs'),path=require('path');
const SRC=process.argv[2]||path.join(__dirname,'..','curation','japon');
const rd=f=>fs.readFileSync(path.join(SRC,f),'utf8');
const raw=JSON.parse(rd('raw.json'));
const ex=rd('extra.js');const cut=ex.indexOf('function keptWeb');
const X=eval(ex.slice(0,cut)+';({TAGS,EXP,REFS,WEB,GEMS})');
const kwSrc=rd('kw.js');const KW=eval('('+kwSrc+')');
const gal=JSON.parse(rd('gallery.json'));
const adr=JSON.parse(rd('addresses.json'));
const geo=JSON.parse(rd('places.json'));const GEO=Object.fromEntries(geo.map(g=>[g.id,g.geo]));
let vids={};try{vids=JSON.parse(rd('videos.json'))}catch(e){}
const fix=JSON.parse(rd('geo_fix.json'));
const places=raw.PLACES.concat(raw.PLACES2).map(p=>{
  const g=fix[p.id]||GEO[p.id];
  const o=Object.assign({},p);
  if(g&&g.lat){o.lat=+(+g.lat).toFixed(5);o.lon=+(+g.lon).toFixed(5)}
  if(gal[p.id])o.g=gal[p.id];
  if(vids.places&&vids.places[p.id]&&vids.places[p.id].length)o.v=vids.places[p.id];
  return o});
const routes=adr._routes||[];delete adr._routes;
/* okinawa -> naha dans les villes */
const cityIds=new Set(raw.CITIES.map(c=>c.id));
const addresses={};Object.entries(adr).forEach(([c,l])=>{const id=cityIds.has(c)?c:(c==='okinawa'?'naha':c);addresses[id]=l});
const pack={
  v:1,id:"japon",name:"Japon",brand:"Tabi Japon",hanko:"旅",lang:"fr",currency:"JPY",
  built:new Date().toISOString().slice(0,10),
  map:{path:rd('japan.txt').trim(),lon0:122,lat0:46,k:40,latc:35,center:[36.2,138.2],zoom:5},
  hubs:["tokyo","osaka","fukuoka"],
  flights:{
    default:"Depuis {from} : une correspondance, souvent via Paris ou une grande ville européenne. Compter 16 à 20 h.",
    rules:[{re:"montr",txt:"Vol direct depuis Montréal : environ 13 h.",lag:[13,14]},{re:"paris",txt:"Vol direct depuis Paris : environ 14 h, la route contourne la Russie.",lag:[7,8]}],
    lag:[7,8],lagNote:"Prévoir une première journée légère."
  },
  airportTip:"Arriver à Tokyo et repartir d'Osaka évite de revenir sur ses pas : une demi-journée de train gagnée.",
  cities:raw.CITIES,airports:raw.AIRPORTS,homes:raw.HOMES,places,musts:raw.MUSTS,options:raw.OPTIONS,seasons:raw.SEASONS,
  guide:raw.GUIDE,words:raw.WORDS,ico:raw.ICO,
  tags:X.TAGS,exp:X.EXP,refs:X.REFS,web:X.WEB,gems:X.GEMS,kw:KW,
  addresses,routes,cityVideos:vids.cities||{},creators:vids.creators||[]
};
/* pourquoi chaque alternative */
const WHY={
  A:{pour:"Un premier voyage, sans stress : les grands noms, des trajets courts en Shinkansen.",gain:["Le moins de temps dans les transports","Les incontournables : Kyoto, Nara, Fuji depuis Hakone, Hiroshima"],perte:["Plus de monde sur les sites","Peu de campagne et de villages"]},
  B:{pour:"Ceux qui veulent le Japon des montagnes et des villages, loin de la foule.",gain:["Villages de chaume de Shirakawa-gō et vieille ville de Takayama","Deux châteaux d'origine et les jardins de Kanazawa"],perte:["Plus de trains régionaux et de bus","Pas d'Osaka, de Nara ni de Hiroshima"]},
  C:{pour:"Les curieux d'art et d'expériences rares : une nuit au temple, une île musée.",gain:["Nuit dans un temple à Kōya-san","Naoshima, l'île d'art contemporain","Le Fuji au bord du lac Kawaguchi"],perte:["Les trajets les plus longs, avec ferry et funiculaire","Moins de temps à Tokyo"]}
};
pack.options.forEach(o=>Object.assign(o,WHY[o.k]||{}));
const out=path.join(__dirname,'..','packs','japon','pack.json');
fs.writeFileSync(out,JSON.stringify(pack));
const n=k=>places.filter(p=>p.g&&p.g[k]&&(Array.isArray(p.g[k])?p.g[k].length:1)).length;
console.log('pack',(fs.statSync(out).size/1024).toFixed(0)+' Ko','lieux',places.length,'géo',places.filter(p=>p.lat).length,'photos',n('photos'),'hist',n('hist'),'person',n('person'),'folk',n('folk'),'adresses',Object.values(addresses).flat().length,'vidéos',places.filter(p=>p.v).length);
