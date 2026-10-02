/* Prueba aislada de coordinación shell/router; no utiliza un navegador. */
(function () {
  'use strict';
  window.verifyLlajtaNavigation = function (appSource, routerSource) {
    const elements = new Map(), handlers = new Map(), results = [];
    const getElement = id => {
      if (id==='checkout-form') return null;
      if (!elements.has(id)) elements.set(id,{ id, open:false, innerHTML:'', textContent:'', contains(node) { return node?.inView===true; }, close() { this.open=false; this.closed=true; } });
      return elements.get(id);
    };
    const document = { activeElement:null,getElementById:getElement,querySelectorAll:() => [] };
    const location = { hash:'' };
    const counters = { maps:0,charts:0 };
    const LV = { core:{DatabaseService:{state:{unavailable:[]},persistent:true,getNotifications:() => []},ApiGateway:{}},ui:{button:() => '<button></button>',icon:() => '<svg></svg>',charts:{destroy() { counters.charts++; }}},maps:{MapManager:{destroy() { counters.maps++; }}},views:{},escape:String };
    for (const key of ['home','cliente','restaurante','repartidor','operaciones','middleware','arquitectura']) LV.views[key] = { title:key,subtitle:key,id:key,render:() => '<section>'+key+'</section>',mount:() => key };
    const window = { LlajtaVoy:LV,location,scrollTo(options) { this.scroll=options; },addEventListener(name,fn) { handlers.set(name,fn); } };
    const assert = (name,value) => { if (!value) throw new Error(name); results.push({name,status:'PASS'}); };
    eval(routerSource);
    // La inicialización del sistema completo se excluye: se ejercitan las
    // funciones reales de navegación/render con dependencias instrumentadas.
    eval(appSource.replace('app.init();',''));
    LV.core.Router.navigate('cliente');
    document.activeElement = { tagName:'INPUT',inView:true,blur() { document.activeElement=null; } };
    LV.core.Router.navigate('operaciones',false);
    assert('Cambiar de vista con un campo enfocado sincroniza actor y pantalla',LV.core.Router.current==='operaciones' && getElement('page-title').textContent==='operaciones');
    assert('Navegar retira el foco del campo de la vista anterior',document.activeElement===null);
    LV.core.Router.init(); location.hash='#cliente'; handlers.get('hashchange')();
    assert('Hashchange/Atrás vuelve a la vista correspondiente',LV.core.Router.current==='cliente' && getElement('page-title').textContent==='cliente');
    getElement('modal').open=true; LV.core.Router.navigate('restaurante',false);
    assert('Navegar cierra el modal antes de cambiar el contexto del actor',!getElement('modal').open && getElement('modal').closed && getElement('page-title').textContent==='restaurante');
    document.activeElement={tagName:'TEXTAREA',inView:true,blur() { document.activeElement=null; }};
    const renderedBefore=counters.maps; LV.app.render();
    assert('Las actualizaciones de fondo conservan la edición del formulario',counters.maps===renderedBefore && document.activeElement!==null);
    return results;
  };
})();
