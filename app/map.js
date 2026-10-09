/* ---------- Cartes interactives (Leaflet + fond CARTO / OpenStreetMap) ---------- */
const MAPS=new Map();
function isDark(){const t=document.documentElement.dataset.theme;return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches}
function baseLayer(){
  const style=isDark()?"dark_all":"rastertiles/voyager";
  return L.tileLayer(`https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`,{subdomains:"abcd",maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'});
}
function newMap(el,opts){
  if(!window.L){el.innerHTML=`<p class="small map-off">La carte s'affiche quand le téléphone a du réseau.</p>`;return null}
  const old=MAPS.get(el.id);if(old){try{old.remove()}catch(e){}}
  const m=L.map(el,Object.assign({zoomControl:true,attributionControl:true,scrollWheelZoom:false,tap:true},opts||{}));
  baseLayer().addTo(m);MAPS.set(el.id,m);
  setTimeout(()=>m.invalidateSize(),60);
  return m;
}
const MKSZ={city:30,plc:24,"plc big":32,addr:24};
function dotIcon(cls,txt){const z=MKSZ[cls]||24;return L.divIcon({className:"mkw",html:`<span class="mk ${cls}">${txt||""}</span>`,iconSize:[z,z],iconAnchor:[z/2,z/2]})}
function addrMarker(a,from){
  const kd=ADDR_KIND[a.k]||["Adresse","店"];
  return L.marker([a.lat,a.lon],{icon:dotIcon("addr",kd[1]),title:a.n}).bindPopup(`<b>${esc(a.n)}</b><br><span>${esc(kd[0])}${a.q?" · "+esc(a.q):""}</span><br>${esc(a.why)}`,{maxWidth:260});
}
/* Carte du voyage choisi : villes, lieux par jour, adresses */
function tripMap(el,pl){
  const m=newMap(el,{scrollWheelZoom:true});if(!m)return;
  const pts=pl.order.map(c=>[CITY[c].lat,CITY[c].lon]);
  pl.order.slice(1).forEach((c,i)=>{const a=CITY[pl.order[i]],b=CITY[c];const fl=a.flight||b.flight;L.polyline([[a.lat,a.lon],[b.lat,b.lon]],{color:"#1F4FA8",weight:4,opacity:.75,dashArray:fl?"8 8":null}).addTo(m)});
  const placesL=L.layerGroup().addTo(m),addrL=L.layerGroup(),bounds=L.latLngBounds(pts);
  pl.list.forEach(d=>{d.items.forEach(x=>{const p=P(x.id);if(!p||!p.lat)return;
    L.marker([p.lat,p.lon],{icon:dotIcon("plc",String(d.idx+1)),title:p.n,zIndexOffset:500}).on("click",()=>placeSheet(p.id)).addTo(placesL);
    bounds.extend([p.lat,p.lon])})});
  pl.order.forEach((c,i)=>{const C=CITY[c];L.marker([C.lat,C.lon],{icon:dotIcon("city",`${i+1}`),title:C.n,zIndexOffset:1000}).on("click",()=>cityTripSheet(c)).addTo(m)});
  pl.order.forEach(c=>(ADDR[c]||[]).forEach(a=>{if(a.lat)addrMarker(a).addTo(addrL)}));
  L.control.layers(null,{"Lieux du programme":placesL,"Adresses stylées":addrL},{collapsed:false,position:"topright"}).addTo(m);
  m.fitBounds(bounds,{padding:[30,30]});
  return m;
}
/* Mini-carte d'un lieu et de ses adresses */
function miniMap(el,p){
  const m=newMap(el,{zoomControl:false});if(!m)return;
  const b=L.latLngBounds([[p.lat,p.lon]]);
  L.marker([p.lat,p.lon],{icon:dotIcon("plc big","★"),title:p.n,zIndexOffset:1000}).addTo(m);
  nearAddr(p).slice(0,8).forEach(a=>{if(a.lat){addrMarker(a).addTo(m);b.extend([a.lat,a.lon])}});
  if(b.getNorthEast().equals(b.getSouthWest()))m.setView([p.lat,p.lon],15);else m.fitBounds(b,{padding:[24,24],maxZoom:16});
  L.control.zoom({position:"bottomright"}).addTo(m);
}
/* Carte d'une ville : ses lieux et ses adresses */
function cityMap(el,cid){
  const m=newMap(el);if(!m)return;const C=CITY[cid];
  const b=L.latLngBounds([[C.lat,C.lon]]);let n=0;
  allPlaces().filter(p=>p.c===cid&&p.lat).forEach(p=>{L.marker([p.lat,p.lon],{icon:dotIcon("plc","★"),title:p.n,zIndexOffset:500}).on("click",()=>placeSheet(p.id)).addTo(m);b.extend([p.lat,p.lon]);n++});
  (ADDR[cid]||[]).forEach(a=>{if(a.lat){addrMarker(a).addTo(m);b.extend([a.lat,a.lon]);n++}});
  if(n)m.fitBounds(b,{padding:[24,24],maxZoom:15});else m.setView([C.lat,C.lon],12);
}
/* Parcours d'une journée : étapes numérotées reliées, et adresses autour */
function dayMap(el,stops,near){
  const m=newMap(el);if(!m)return;const pts=stops.filter(x=>x.p.lat).map(x=>[x.p.lat,x.p.lon]);
  if(!pts.length){const c=stops[0]&&CITY[stops[0].p.c];if(c)m.setView([c.lat,c.lon],12);return}
  if(pts.length>1)L.polyline(pts,{color:"#1F4FA8",weight:4,opacity:.8,dashArray:"2 8",lineCap:"round"}).addTo(m);
  const b=L.latLngBounds(pts);
  stops.forEach((x,i)=>{if(x.p.lat)L.marker([x.p.lat,x.p.lon],{icon:dotIcon("plc big",String(i+1)),title:x.p.n,zIndexOffset:1000}).on("click",()=>placeSheet(x.p.id)).addTo(m)});
  (near||[]).slice(0,6).forEach(a=>{if(a.lat){addrMarker(a).addTo(m);b.extend([a.lat,a.lon])}});
  if(pts.length===1&&!(near||[]).length)m.setView(pts[0],15);else m.fitBounds(b,{padding:[28,28],maxZoom:16});
}
