(function (L) {
  'use strict';
  const maps = new Map(), C = L.maps.Cochabamba, esc = L.escape;
  const project = p => [(p[1]-C.bounds.west)/(C.bounds.east-C.bounds.west)*800,(C.bounds.north-p[0])/(C.bounds.north-C.bounds.south)*420];
  function schematic(el,config) {
    const roads = Array.from({ length: 14 },(_,i) => '<path d="M'+(i*63-120)+' 0 '+(i*63+110)+' 420"/>').join('')+Array.from({ length: 10 },(_,i) => '<path d="M0 '+i*49+' H800"/>').join('');
    const route = config.route?.length ? '<polyline class="map-route" points="'+config.route.map(p => project(p).join(',')).join(' ')+'"/>' : '';
    el.innerHTML = '<svg class="schematic" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa esquemático de Cochabamba"><rect width="800" height="420" fill="#F2E8DE"/><path d="M0 390Q160 305 270 350T610 345 800 220" stroke="#DBBBA5" stroke-width="35" fill="none"/><g stroke="#FFFAF5" stroke-width="8">'+roads+'</g><g fill="#75665B" font-size="15" font-family="Arial"><text x="340" y="300">CENTRO</text><text x="460" y="145">QUERU QUERU</text><text x="130" y="135">CALA CALA</text><text x="535" y="230">RECOLETA</text><text x="250" y="95" font-size="11">Av. América</text><text x="390" y="335" font-size="11">Av. Heroínas</text></g>'+route+'<g class="map-markers">'+config.markers.map(m => { const p = project([m.lat,m.lng]); return '<g '+(m.driver?'data-driver="'+esc(m.id)+'"':'')+' transform="translate('+p.join(',')+')"><circle r="12" fill="'+(m.driver?'#65785D':m.customer?'#916052':'#C48B82')+'" stroke="white" stroke-width="4"/><title>'+esc(m.name)+'</title></g>'; }).join('')+'</g></svg><span class="map-label">Cochabamba · Ruta esquemática</span>';
    if (config.onSelect) { el.onclick = event => { const svg = el.querySelector('svg'), rect = svg.getBoundingClientRect(); const scale = Math.max(rect.width/800,rect.height/420); const x = (event.clientX-rect.left+(800*scale-rect.width)/2)/scale; const y = (event.clientY-rect.top+(420*scale-rect.height)/2)/scale; config.onSelect(C.bounds.north-y/420*(C.bounds.north-C.bounds.south),C.bounds.west+x/800*(C.bounds.east-C.bounds.west)); }; el.classList.add('selectable'); }
  }
  L.maps.MapManager = {
    canUseTiles() { return ['http:','https:'].includes(window.location?.protocol); },
    destroy() { for (const entry of maps.values()) { entry.map?.remove(); clearTimeout(entry.timer); } maps.clear(); },
    mount(id,config) {
      const el = document.getElementById(id); if (!el) return; const prior = maps.get(id); prior?.map?.remove(); clearTimeout(prior?.timer); const entry = { el,config,map:null,driverMarkers: new Map() }; maps.set(id,entry);
      schematic(el,config);
      // Los archivos file:// no envían el Referer web requerido por OSM.
      // Algunos rechazos llegan como imágenes válidas de "Acceso bloqueado",
      // por lo que Leaflet emite tileload y no puede activar tileerror.
      if (!this.canUseTiles() || !window.L || L.core.DatabaseService.state.mapMode === 'offline') return;
      try { el.onclick = null; el.innerHTML = ''; const map = entry.map = window.L.map(el,{ scrollWheelZoom: false, zoomControl: true }).setView(config.center || C.center,13);
        let errors = 0; let tilesLoaded = false; const fallback = () => { if (!maps.has(id) || entry.map !== map) return; map.remove(); entry.map = null; schematic(el,config); };
        const tiles = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>', maxZoom: 18 }); tiles.on('tileerror',() => { if (++errors >= 3) fallback(); }); tiles.on('tileload',() => { tilesLoaded = true; clearTimeout(entry.timer); }); tiles.addTo(map); entry.timer = setTimeout(() => { if (!tilesLoaded) fallback(); },6000);
        for (const m of config.markers) { const marker = window.L.marker([m.lat,m.lng],{ icon: window.L.divIcon({ className: 'pin '+(m.driver?'driver':m.customer?'customer':''), html: L.ui.icon(m.driver?'two_wheeler':m.customer?'person':'restaurant'), iconSize: [32,32], iconAnchor: [16,16] }) }).addTo(map).bindTooltip(esc(m.name)); if (m.driver) entry.driverMarkers.set(m.id,marker); }
        if (config.route?.length) { const line = window.L.polyline(config.route,{ color: '#916052', weight: 5, dashArray: '8 8' }).addTo(map); map.fitBounds(line.getBounds().pad(.3)); }
        if (config.onSelect) map.on('click',e => config.onSelect(e.latlng.lat,e.latlng.lng));
      } catch (_) { entry.map?.remove(); entry.map = null; schematic(el,config); }
    },
    frame(orderId,t) { const o = L.core.DatabaseService.getOrder(orderId); for (const entry of maps.values()) { if (entry.map) entry.driverMarkers.get(o.driverId)?.setLatLng(t.position); else { const marker = entry.el.querySelector('[data-driver="'+o.driverId+'"]'); if (marker) marker.setAttribute('transform','translate('+project(t.position).join(',')+')'); } } document.querySelectorAll('[data-track="'+orderId+'"]').forEach(el => { const key = el.dataset.metric; if (key === 'progress') { el.style.width = t.progress*100+'%'; el.parentElement.setAttribute('aria-valuenow',Math.round(t.progress*100)); } else el.textContent = key === 'eta' ? t.eta+' min' : key === 'distance' ? t.remainingKm.toFixed(2)+' km' : Math.round(t.progress*100)+'%'; }); },
    overview() { const s = L.core.DatabaseService.state; return { markers: [...s.restaurants.map(r => ({ ...r })), ...s.drivers.map(d => ({ ...d,driver:true })), ...s.orders.filter(o => !L.core.StateMachine.terminal.includes(o.status)).map(o => ({ id:o.id,lat:o.lat,lng:o.lng,name:o.id,customer:true }))] }; },
    order(o) { const DB = L.core.DatabaseService, r = L.services.CatalogService.restaurant(o.restaurantId), d = o.driverId ? L.services.DriverService.get(o.driverId) : null; const markers = [{ ...r },{ lat:o.lat,lng:o.lng,name:o.customerName,customer:true }]; if (d) markers.push({ ...d,driver:true,lat:o.tracking?.position[0] || d.lat,lng:o.tracking?.position[1] || d.lng }); return { markers,route:o.tracking?.points || L.maps.Routes.create([r.lat,r.lng],[o.lat,o.lng]) }; }
  };
  L.EventBus.on('tracking:frame',e => L.maps.MapManager.frame(e.orderId,e.tracking));
})(window.LlajtaVoy);
