/* Navegación y acceso con DOM aislado; no automatiza un navegador. */
(function(){
  'use strict';
  window.verifyLlajtaNavigation=async function(appSource,routerSource,accessSource){
    const elements=new Map(),handlers=new Map(),results=[],calls=[];
    const getElement=id=>{if(id==='checkout-form')return null;if(!elements.has(id))elements.set(id,{id,style:{},open:false,innerHTML:'',textContent:'',contains:n=>n?.inView===true,close(){this.open=false;this.closed=true;}});return elements.get(id);};
    const bell={setAttribute(){}};
    const document={activeElement:null,getElementById:getElement,querySelectorAll:()=>[],querySelector:()=>bell};
    const location={hash:'#arquitectura'},counters={maps:0,charts:0};
    const state={activeSpace:null,customer:{name:'Andrea'},unavailable:[],payments:[],orders:[{id:'CONSERVADO',customerId:'c1'}],cart:[{productId:'p1',quantity:1}],communications:[{text:'Mensaje conservado'}]};
    const restaurants=[{id:'r1',name:'Cocina uno'},{id:'r2',name:'Cocina dos'}],drivers=[{id:'d1',name:'Repartidor uno'},{id:'d2',name:'Repartidor dos'}];
    const DB={state,persistent:true,change:fn=>fn(state),getNotifications:()=>[],getOrders:()=>state.orders,getDrivers:()=>drivers,getRestaurants:()=>restaurants};
    const LV={core:{DatabaseService:DB,ApiGateway:{async request(...args){calls.push(args);return {data:[]};}}},services:{CommunicationService:{},CatalogService:{restaurant:id=>find(restaurants,id)},DriverService:{get:id=>find(drivers,id)}},EventBus:{on(){}},ui:{inbox:()=>'<aside>INBOX</aside>',roleIntro:()=>'',button:(action,label,data)=>'<button data-action="'+action+'">'+label+JSON.stringify(data)+'</button>',icon:()=>'<svg></svg>',charts:{destroy(){counters.charts++;}},modal(title,html,submit,button){LV.lastModal={title,html,submit,button};}},maps:{MapManager:{destroy(){counters.maps++;}}},views:{},escape:String,fail(message,status){const e=Error(message);e.status=status;throw e;}};
    function find(rows,id){const row=rows.find(r=>r.id===id);if(!row)LV.fail('Perfil inválido',404);return row;}
    for(const key of ['home','roles','cliente','restaurante','repartidor','operaciones','pagos'])LV.views[key]={title:key,subtitle:key,id:key==='restaurante'?'r1':'d1',tab:key==='operaciones'?'Resumen':'Inicio',render:()=>'<section>'+key+'</section>',mount(){}};
    const window={LlajtaVoy:LV,location,history:{replaceState(a,b,hash){location.hash=hash;}},scrollTo(){},addEventListener:(name,fn)=>handlers.set(name,fn)};
    const check=(name,value)=>{if(!value)throw Error(name);results.push({name,status:'PASS'});};
    eval(accessSource);eval(routerSource);eval(appSource.replace('app.init();',''));
    const A=LV.core.Access,R=LV.core.Router;A.init();R.init();LV.app.render();
    check('Enlace antiguo de Arquitectura abre Roles',R.current==='roles' && location.hash==='#roles');
    R.navigate('middleware');check('Middleware carece de acceso público',R.current==='roles');
    check('Inicio y Roles no muestran bandejas privadas',!getElement('view').innerHTML.includes('INBOX') && bell.hidden && LV.app.context().actor==='client');
    check('Menú público solo presenta Inicio y Roles',A.menu('home').length===2 && !LV.app.navMarkup().includes('Middleware'));
    for(const role of Object.keys(A.roles)){
      LV.app.openAccess(role);const modal=LV.lastModal;
      check('Ventana de acceso sin credenciales: '+role,!/type="password"|name="email"|name="username"/.test(modal.html) && modal.button==='Entrar');
      await modal.submit({identity:role==='restaurant'?'r2':role==='driver'?'d2':undefined});
      const own=A.roles[role].view;
      check('Rol y pantalla sincronizados: '+role,R.current===own && getElement('page-title').textContent===own && A.current.role===role);
      const menu=LV.app.navMarkup();check('Menú funcional y sin herramientas técnicas: '+role,!/Middleware|Arquitectura|scenario|event-payload/.test(menu) && menu.includes('Roles'));
      const before=calls.length;await LV.app.action({dataset:{action:'navigate',view:role==='admin'?'cliente':'operaciones'}});
      check('Cambiar URL de rol requiere elegir acceso: '+role,R.current==='roles' && calls.length===before);
    }
    check('Pedidos, carrito y mensajes se conservan al cambiar roles',state.orders[0].id==='CONSERVADO' && state.cart.length===1 && state.communications[0].text==='Mensaje conservado');
    A.select('restaurant','r2');A.current=null;A.init();R.navigate('restaurante');
    check('La identidad elegida se recupera al recargar',A.current.id==='r2' && LV.views.restaurante.id==='r2' && A.profile()==='Cocina dos');
    let invalid=false;try{A.select('driver','ajeno');}catch(e){invalid=e.status===404;}
    check('Un perfil inexistente conserva el contexto anterior',invalid && A.current.role==='restaurant' && state.activeSpace.id==='r2');
    document.activeElement={tagName:'INPUT',inView:true,blur(){document.activeElement=null;}};getElement('modal').open=true;
    A.select('admin');R.navigate('operaciones',false);
    check('Cambiar espacio cierra modal y retira foco anterior',!getElement('modal').open && document.activeElement===null);
    location.hash='#roles';handlers.get('hashchange')();check('Atrás y hashchange mantienen la navegación pública',R.current==='roles' && getElement('page-title').textContent==='roles');
    R.navigate('operaciones');document.activeElement={tagName:'TEXTAREA',inView:true,blur(){document.activeElement=null;}};const before=counters.maps;LV.app.render();
    check('Actualizaciones de fondo conservan la edición',counters.maps===before && document.activeElement!==null);document.activeElement=null;
    await LV.app.action({dataset:{action:'admin-tab',tab:'Repartidores'}});await LV.app.action({dataset:{action:'driver-availability',id:'d2',available:'false'}});
    check('Administración opera el repartidor elegido',LV.views.operaciones.tab==='Repartidores' && calls.at(-1)[1]==='/api/drivers/d2' && calls.at(-1)[3].actor==='admin');
    A.select('payment-provider');R.navigate('pagos');check('Pagos utiliza el contexto de su proveedor',LV.app.context().actor==='payment-provider' && LV.app.context().providerId==='local-payment-provider');
    state.activeSpace={role:'driver',id:'inexistente'};A.init();check('Perfil persistido inválido regresa al selector',A.current===null && state.activeSpace===null);
    return results;
  };
})();
