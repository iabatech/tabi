/* Données de la destination : tout vient du pack JSON (packs/<destination>/pack.json).
   Le moteur et l'interface ne connaissent aucune destination en dur. */
const PACK=window.PACK;
const CITIES=PACK.cities,AIRPORTS=PACK.airports,HOMES=PACK.homes,MUSTS=PACK.musts,OPTIONS=PACK.options,SEASONS=PACK.seasons;
const GUIDE=PACK.guide,WORDS=PACK.words,ICO=PACK.ico;
const PLACES=PACK.places,PLACES2=[];
const TAGS=PACK.tags||{},EXP=PACK.exp||{},REFS=PACK.refs||{},WEB=PACK.web||[],GEMS=PACK.gems||{},KW=PACK.kw||{};
const JAPAN_PATH=PACK.map.path,HUBS=PACK.hubs||[];
const ADDR=PACK.addresses||{},ROUTES=PACK.routes||[],CITYVID=PACK.cityVideos||{};
ICO.village=ICO.village||'<g fill="currentColor"><path d="M4 40 20 12l16 28z" fill-opacity=".9"/><rect x="9" y="40" width="22" height="16" fill-opacity=".55"/><path d="M30 44 44 20l14 24z" fill-opacity=".7"/><rect x="34" y="44" width="20" height="12" fill-opacity=".45"/></g>';
ICO.wave=ICO.wave||'<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 30c7-6 13-6 20 0s13 6 20 0 9-5 16-2"/><path d="M4 42c7-6 13-6 20 0s13 6 20 0 9-5 16-2" opacity=".7"/><path d="M4 54c7-6 13-6 20 0s13 6 20 0 9-5 16-2" opacity=".45"/></g><circle cx="46" cy="14" r="6" fill="currentColor"/>';
const ADDR_KIND={cafe:["Café","茶"],resto:["Restaurant","食"],ramen:["Ramen et nouilles","麺"],izakaya:["Izakaya","酒"],douceur:["Douceurs","菓"],bar:["Bar","杯"],bain:["Bain, onsen","湯"],boutique:["Boutique","店"],marche:["Marché","市"],vue:["Point de vue","景"],secret:["Coin secret","秘"]};
