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
    tz:"Asia/Tokyo",speed:830,
    detour:[{lat:[34,72],lon:[-25,60],h:1.6,note:"la route contourne la Russie"}],
    direct:["Paris","Londres","Francfort","Munich","Amsterdam","Helsinki","Zurich","Vienne","Rome","Milan","Copenhague","Istanbul","Dubaï","Doha","Abou Dabi","Montréal","Toronto","Vancouver","New York","Los Angeles","San Francisco","Seattle","Chicago","Dallas","Houston","Boston","Honolulu","Singapour","Hong Kong","Séoul","Bangkok","Taipei","Shanghai","Pékin","Sydney","Melbourne","Manille","Kuala Lumpur","Hanoï","Hô Chi Minh-Ville","Jakarta","Delhi","Bombay"],
    hubs:["Paris","Francfort","Amsterdam","Londres","Helsinki","Istanbul","Doha","Dubaï","Séoul","Hong Kong","Singapour","Bangkok","Taipei","Shanghai","Pékin","Los Angeles","San Francisco","Seattle","Vancouver","Chicago","New York","Toronto","Montréal","Sydney","Honolulu","Delhi"],
    lagNote:"Prévoir une première journée légère."
  },
  airportTip:"Arriver à Tokyo et repartir d'Osaka évite de revenir sur ses pas : une demi-journée de train gagnée.",
  cities:raw.CITIES,airports:raw.AIRPORTS,homes:raw.HOMES,places,musts:raw.MUSTS,options:raw.OPTIONS,seasons:raw.SEASONS,
  guide:raw.GUIDE,words:raw.WORDS,ico:raw.ICO,
  tags:X.TAGS,exp:X.EXP,refs:X.REFS,web:X.WEB,gems:X.GEMS,kw:KW,
  addresses,routes,cityVideos:vids.cities||{},creators:vids.creators||[]
};
/* pourquoi chaque alternative */
const WHY={
  A:{pour:"Un premier voyage, sans stress : les grands noms, des trajets courts en Shinkansen.",gain:[{t:"Le moins de temps dans les transports"},{t:"Kyoto et Nara, les deux anciennes capitales",c:["kyoto","nara"]},{t:"Le Fuji et les onsen de Hakone",c:["hakone"]},{t:"Hiroshima et l'île de Miyajima",c:["hiroshima"]}],perte:[{t:"Plus de monde sur les sites"},{t:"Peu de campagne et de villages"}]},
  B:{pour:"Ceux qui veulent le Japon des montagnes et des villages, loin de la foule.",gain:[{t:"Les villages de chaume de Shirakawa-gō",c:["shirakawa"]},{t:"La vieille ville de Takayama",c:["takayama"]},{t:"Le château noir de Matsumoto, d'origine",c:["matsumoto"]},{t:"Les jardins et le quartier des geishas de Kanazawa",c:["kanazawa"]},{t:"Les sanctuaires dans la forêt de Nikkō",c:["nikko"]}],perte:[{t:"Plus de trains régionaux et de bus"}]},
  C:{pour:"Les curieux d'art et d'expériences rares : une nuit au temple, une île musée.",gain:[{t:"Une nuit dans un temple à Kōya-san",c:["koya"]},{t:"Naoshima, l'île d'art contemporain",c:["naoshima"]},{t:"Le Fuji au bord du lac Kawaguchi",c:["kawaguchiko"]}],perte:[{t:"Des trajets plus longs, avec ferry et funiculaire"}]}
};
const EXT={A:["kawaguchiko","himeji","kanazawa","nikko"],B:["hakone","nara","osaka"],C:["nara","himeji","hakone"]};
pack.options.forEach(o=>Object.assign(o,WHY[o.k]||{},{extend:EXT[o.k]||[]}));
const out=path.join(__dirname,'..','packs','japon','pack.json');
fs.writeFileSync(out,JSON.stringify(pack));
const n=k=>places.filter(p=>p.g&&p.g[k]&&(Array.isArray(p.g[k])?p.g[k].length:1)).length;
console.log('pack',(fs.statSync(out).size/1024).toFixed(0)+' Ko','lieux',places.length,'géo',places.filter(p=>p.lat).length,'photos',n('photos'),'hist',n('hist'),'person',n('person'),'folk',n('folk'),'adresses',Object.values(addresses).flat().length,'vidéos',places.filter(p=>p.v).length);
