/* Instrumentación de DOM y API Leaflet: no sustituye una prueba visual. */
(function () {
  'use strict';
  window.verifyLlajtaMaps=function(sources,streetSource,landmarkSource) {
    const results=[],elements=new Map(),instances=[],markers=[],lines=[];
    const check=(name,value) => { if (!value) throw Error(name); results.push({name,status:'PASS'}); };
    const node=() => ({children:[],attrs:{},style:{},classList:{set:new Set(),add(c){this.set.add(c);},remove(c){this.set.delete(c);},contains(c){return this.set.has(c);},toggle(c){if(this.set.has(c)){this.set.delete(c);return false;}this.set.add(c);return true;}},appendChild(c){this.children.push(c);},setAttribute(k,v){this.attrs[k]=v;},getBoundingClientRect:() => ({left:0,top:0,width:600,height:340}),setPointerCapture(){},querySelector(selector){if(selector==='.map-tools')return this.children.find(c=>c.className==='map-tools');if(selector==='svg'){this.svg ||= node();return this.svg;} if(selector.startsWith('[data-map-marker')) {this.marker ||= node();return this.marker;} return null;}});
    const document={createElement:node,getElementById(id){if(!elements.has(id))elements.set(id,node());return elements.get(id);},querySelectorAll:() => []};
    const window={location:{protocol:'file:'},LlajtaVoy:{maps:{},core:{},services:{},now:() => new Date().toISOString(),escape:String,ui:{icon:() => '<svg></svg>'},EventBus:{on(name,fn){this[name]=fn;},emit(){}}}};
    const LV=window.LlajtaVoy;
    eval(sources['js/maps/cochabamba.js']);eval(sources['js/seed-data.js']);eval(streetSource);eval(landmarkSource);
    LV.core.DatabaseService={state:LV.seed(),getOrder(id){return this.state.orders.find(o=>o.id===id);}};
    LV.core.StateMachine={terminal:['DELIVERED']};LV.services.CatalogService={restaurant:id=>LV.core.DatabaseService.state.restaurants.find(r=>r.id===id)};LV.services.DriverService={get:id=>LV.core.DatabaseService.state.drivers.find(d=>d.id===id)};
    window.L={
      map(el,options){const m={options,handlers:{},center:[0,0],zoom:14,attributionControl:{addAttribution(){}},setView(p,z){this.center=Array.isArray(p)?p:[p.lat,p.lng];this.zoom=z;return this;},fitBounds(){this.zoom=14;return this;},panTo(p){this.center=p;this.pans=(this.pans || 0)+1;return this;},getCenter(){return {lat:this.center[0],lng:this.center[1]};},getZoom(){return this.zoom;},getSize(){return {x:600,y:340};},latLngToContainerPoint(){return {x:300,y:180};},on(name,fn){this.handlers[name]=fn;return this;},invalidateSize(){this.resized=true;},remove(){this.removed=true;}};instances.push(m);return m;},
      layerGroup(){return {addTo(){return this;},clearLayers(){}};},control:{scale:()=>({addTo(){}})},DomEvent:{disableClickPropagation(){},disableScrollPropagation(){}},latLngBounds:p=>p,divIcon:o=>o,
      marker(p,o){const m={position:p,options:o,handlers:{},addTo(){return this;},bindTooltip(){return this;},on(name,fn){this.handlers[name]=fn;return this;},getLatLng(){return {lat:this.position[0],lng:this.position[1]};},setLatLng(p){this.position=p;return this;}};markers.push(m);return m;},
      polyline(p,o){const line={points:p,options:o,addTo(){return this;},setStyle(s){this.style=s;}};lines.push(line);return line;},polygon(p,o){return this.polyline(p,o);},rectangle(p,o){return this.polyline(p,o);},
      tileLayer(){throw Error('No deben solicitarse tiles');}
    };
    eval(sources['js/maps/map-manager.js']);const M=LV.maps.MapManager,config=M.overview();M.mount('home-map',config);
    check('file:// crea el mapa Leaflet con geometría local',instances.length===1 && lines.some(l=>Array.isArray(l.points[0]?.[0])));
    check('Arrastre, rueda, teclado y pellizco están habilitados',instances[0].options.dragging && instances[0].options.scrollWheelZoom && instances[0].options.keyboard && instances[0].options.touchZoom);
    check('Los nueve actores iniciales aparecen como marcadores',markers.filter(m=>m.options.icon.className.startsWith('pin')).length===9);
    check('Las calles se agrupan para evitar miles de capas',lines.length<400);
    instances[0].setView([-17.37,-66.17],17);M.destroy();M.mount('home-map',config);
    check('La actualización de la vista conserva centro y zoom',instances[1].zoom===17 && instances[1].center[0]===-17.37);
    let selection;const loc={markers:[{lat:-17.378,lng:-66.151,name:'Destino',customer:true}],onSelect:(a,b)=>{selection=[a,b];M.selectLocation(a,b);}};M.mount('location-map',loc);const map=instances.at(-1),pin=markers.findLast(m=>m.options.draggable);
    map.handlers.click({latlng:{lat:-17.38,lng:-66.155}});
    check('El clic mueve el destino sin reconstruir ni recentrar el mapa',selection[0]===-17.38 && pin.position[1]===-66.155 && !map.removed && !map.pans);
    pin.position=[-17.379,-66.15];pin.handlers.dragend();check('Arrastrar el pin actualiza las coordenadas del destino',selection[0]===-17.379);
    const t={position:[-17.385,-66.156],progress:.4,remainingKm:1.2,eta:3};LV.core.DatabaseService.state.orders.push({id:'test',driverId:'d1',tracking:t});M.mount('tracking-map',{...config,key:'test',orderId:'test',route:[[-17.3895,-66.1585],[-17.3936,-66.1567]]});const trackingMap=instances.at(-1);M.frame('test',t);
    check('Tracking mueve el repartidor sin desplazar la vista por defecto',markers.some(m=>m.options.icon.className==='pin driver' && m.position===t.position) && !trackingMap.pans);
    const tools=document.getElementById('tracking-map').querySelector('.map-tools'),follow=tools.children.find(b=>b.textContent==='Seguir');follow.onclick({stopPropagation(){}});M.frame('test',t);
    check('Seguir recentra y arrastrar el mapa desactiva el seguimiento',trackingMap.pans>0 && follow.attrs['aria-pressed']==='true');trackingMap.handlers.dragstart();check('Después de arrastrar se puede explorar sin seguimiento automático',follow.attrs['aria-pressed']==='false');
    tools.children.find(b=>b.textContent==='Ampliar').onclick({stopPropagation(){}});check('Ampliar ajusta el contenedor y recalcula su tamaño',document.getElementById('tracking-map').classList.contains('map-expanded') && trackingMap.resized);
    check('Mientras se arrastra el mapa, el shell detecta interacción activa',M.isInteracting());trackingMap.handlers.dragend();check('El final del gesto libera las actualizaciones pendientes',!M.isInteracting());
    M.destroy();elements.set('tracking-map',node());M.mount('tracking-map',{...config,key:'test',orderId:'test'});check('Actualizar la vista conserva el modo ampliado',document.getElementById('tracking-map').classList.contains('map-expanded'));
    M.destroy();window.L=undefined;M.mount('fallback',loc);const el=document.getElementById('fallback'),svg=el.querySelector('svg'),before=svg.attrs.viewBox;svg.onwheel({deltaY:-1,clientX:300,clientY:170,preventDefault(){}});check('Sin Leaflet el respaldo vectorial permite zoom',svg.attrs.viewBox!==before && el.innerHTML.includes('OpenStreetMap'));
    const zoomed=svg.attrs.viewBox;svg.onpointerdown({pointerId:1,clientX:200,clientY:150});svg.onpointermove({pointerId:1,clientX:260,clientY:150});svg.onpointerup({pointerId:1,clientX:260,clientY:150});check('El respaldo permite arrastrar y no confunde el gesto con seleccionar',svg.attrs.viewBox!==zoomed && selection[0]===-17.379);
    M.destroy();return results;
  };
})();
