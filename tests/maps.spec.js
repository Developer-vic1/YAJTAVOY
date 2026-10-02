/* Pruebas del gestor compartido con DOM y Leaflet instrumentados. */
(function () {
  'use strict';
  window.verifyLlajtaMaps = function (mapSource, cochabambaSource, seedSource) {
    const results = [], elements = new Map(), tileHandlers = new Map();
    let mapCalls = 0, tileCalls = 0, removals = 0, selected;
    const assert = (name,value) => { if (!value) throw new Error(name); results.push({name,status:'PASS'}); };
    const element = id => {
      if (!elements.has(id)) {
        const marker = { attrs:{},setAttribute(name,value) { this.attrs[name]=value; } };
        elements.set(id,{ id,innerHTML:'',classList:{add() { this.selected=true; }},marker,querySelector(selector) { return selector==='svg'?{getBoundingClientRect:() => ({left:0,top:0,width:320,height:220})}:this.innerHTML.includes('data-driver="d1"')?marker:null; } });
      }
      return elements.get(id);
    };
    const document = {getElementById:element,querySelectorAll:() => []};
    const window = {location:{protocol:'file:'},LlajtaVoy:{maps:{},core:{},services:{},now:() => '2026-10-02T12:00:00.000Z',escape:String,ui:{icon:() => '<svg></svg>'},EventBus:{on(name,fn) { this[name]=fn; }}}};
    const LV = window.LlajtaVoy;
    eval(cochabambaSource); eval(seedSource);
    LV.core.DatabaseService = {state:LV.seed(),getOrder(id) { return this.state.orders.find(o => o.id===id); }};
    LV.core.StateMachine = {terminal:['DELIVERED']};
    LV.services.CatalogService = {restaurant(id) { return LV.core.DatabaseService.state.restaurants.find(r => r.id===id); }};
    LV.services.DriverService = {get(id) { return LV.core.DatabaseService.state.drivers.find(d => d.id===id); }};
    window.L = {
      map() { mapCalls++; return {setView() {return this;},fitBounds() {return this;},on() {return this;},remove() {removals++;}}; },
      tileLayer() { tileCalls++; return {on(name,fn) {tileHandlers.set(name,fn);return this;},addTo() {return this;}}; },
      divIcon:options => options,
      marker() { return {addTo() {return this;},bindTooltip() {return this;},setLatLng(position) {this.position=position;}}; },
      polyline() { return {addTo() {return this;},getBounds() {return {pad:() => ({})};}}; }
    };
    eval(mapSource);
    const manager=LV.maps.MapManager, config=manager.overview();
    manager.mount('home-map',config);
    assert('file:// evita por completo crear mapas y tiles externos',mapCalls===0 && tileCalls===0);
    assert('El mapa local muestra barrios, seis restaurantes y tres repartidores',element('home-map').innerHTML.includes('RECOLETA') && (element('home-map').innerHTML.match(/<title>/g) || []).length===9);
    const tracking={markers:config.markers,route:[[-17.3895,-66.1585],[-17.3936,-66.1567]],onSelect:(lat,lng) => {selected=[lat,lng];}};
    manager.mount('tracking-map',tracking);
    assert('Las rutas se dibujan aunque Leaflet esté cargado en file://',element('tracking-map').innerHTML.includes('map-route') && tileCalls===0);
    element('tracking-map').onclick({clientX:160,clientY:110});
    assert('Seleccionar ubicación funciona sobre el SVG local',selected?.length===2 && selected[0]<-17.35 && selected[0]>-17.41 && selected[1]<-66.13 && selected[1]>-66.20);
    LV.core.DatabaseService.state.orders.push({id:'CB-test',driverId:'d1'});
    manager.frame('CB-test',{position:[-17.386,-66.157],progress:.4,remainingKm:1.2,eta:4});
    assert('El tracking actualiza el marcador del repartidor en el mapa local',element('tracking-map').marker.attrs.transform?.startsWith('translate('));
    window.location.protocol='https:'; manager.mount('connected-map',config);
    assert('HTTP/HTTPS conserva la opción de Leaflet y tiles',mapCalls===1 && tileCalls===1);
    tileHandlers.get('tileload')(); for (let i=0;i<3;i++) tileHandlers.get('tileerror')();
    assert('Tres errores activan respaldo incluso después de cargar algún tile',removals===1 && element('connected-map').innerHTML.includes('schematic'));
    LV.core.DatabaseService.state.mapMode='offline'; manager.mount('offline-map',config);
    assert('El modo sin conexión tampoco solicita tiles desde HTTPS',tileCalls===1 && element('offline-map').innerHTML.includes('schematic'));
    LV.core.DatabaseService.state.mapMode='auto'; window.L=undefined; manager.mount('without-leaflet',config);
    assert('Sin librería externa el mapa local continúa funcionando',element('without-leaflet').innerHTML.includes('schematic'));
    manager.destroy(); return results;
  };
})();
