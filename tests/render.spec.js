/* Generación de HTML con datos aislados. No evalúa CSS ni un navegador. */
(function(L){
  'use strict';
  L.verifyRoleViews=function(){
    const DB=L.core.DatabaseService,results=[],check=(name,v)=>{if(!v)throw Error(name);results.push({name,status:'PASS'});};
    DB.reset();L.app={context:()=>L.core.Router.current==='cliente'?{actor:'client',customerId:'c1'}:L.core.Router.current==='restaurante'?{actor:'restaurant',restaurantId:L.views.restaurante.id}:L.core.Router.current==='repartidor'?{actor:'driver',driverId:L.views.repartidor.id}:L.core.Router.current==='pagos'?{actor:'payment-provider',providerId:'local-payment-provider'}:{actor:'admin'},render(){}};L.core.Router={current:'home'};
    for(const [key,v]of Object.entries(L.views)){L.core.Router.current=key;const html=L.ui.roleIntro(key)+v.render()+L.ui.inbox();check('Vista inicial '+key,html.length>100 && !html.includes('NaN') && !html.includes('undefined'));}
    const seed=L.seed(),d=seed.drivers[0],r=seed.restaurants[0],plan=L.maps.Routes.plan([d.lat,d.lng],[r.lat,r.lng]);
    const o={id:'RENDER-QA',restaurantId:r.id,restaurantName:r.name,driverId:d.id,customerId:'c1',customerName:'Cliente propio QA',status:'PREPARING',lat:seed.customer.lat,lng:seed.customer.lng,address:'Dirección QA',items:[{name:'Plato',quantity:1,price:20}],paymentMethod:'QR',total:28,delivery:8,createdAt:L.now(),history:[],tracking:null};
    DB.state.orders.push(o);DB.getDrivers()[0].orderId=o.id;DB.getDrivers()[0].status='ACCEPTED';L.views.cliente.tab='Pedido';L.views.cliente.selectedOrder=o.id;L.views.operaciones.selectedOrder=o.id;L.views.restaurante.selectedOrder=o.id;
    check('Cocina animada corresponde a preparación',L.views.restaurante.render().includes('cooking'));
    for(const status of ['DRIVER_ASSIGNED','PICKED_UP','ON_ROUTE','ARRIVING','DELIVERED','CANCELLED']){o.status=status;o.tracking={source:'simulation',sessionId:'qa-'+status,leg:status==='DRIVER_ASSIGNED'?'restaurant':'customer',running:['ON_ROUTE','ARRIVING'].includes(status),arrived:status==='DELIVERED',progress:status==='DELIVERED'?1:.3,position:L.maps.Routes.at(plan.points,.3),routePlan:plan,points:plan.points,totalKm:plan.totalKm,remainingKm:plan.totalKm*.7,eta:2,speedKmh:24,speedScale:10,updatedAt:L.now()};
      const html=L.ui.tracking(o,true);check('Tracking y etapas '+status,html.includes('Posición simulada') && html.includes('Última posición') && !html.includes('NaN') && (html.includes('delivery-scene moving')===o.tracking.running));}
    const foreign={...o,id:'RENDER-AJENO',customerId:'c2',customerName:'Nombre ajeno QA',restaurantId:'r2',restaurantName:'Establecimiento ajeno QA'};DB.state.orders.push(foreign);
    L.core.Router.current='cliente';for(const tab of ['Inicio','Restaurantes','Buscar','Carrito','Pedido','Historial','Notificaciones']){L.views.cliente.tab=tab;const html=L.views.cliente.render();check('Cliente '+tab+' conserva ámbito',!html.includes('Nombre ajeno QA') && !html.includes('NaN'));}
    L.core.Router.current='restaurante';for(const tab of ['Pedidos','Historial','Menú','Estadísticas']){L.views.restaurante.tab=tab;const html=L.views.restaurante.render();check('Restaurante '+tab+' conserva ámbito',!html.includes('Establecimiento ajeno QA') && !html.includes('NaN'));}
    L.views.restaurante.id='r2';L.views.restaurante.tab='Menú';check('Cambiar establecimiento oculta seguimiento del anterior',!L.views.restaurante.follow().includes(o.id));
    L.core.Router.current='operaciones';L.views.operaciones.selectedOrder=o.id;check('Operaciones supervisa sin controles de repartidor',L.views.operaciones.render().includes('tracking-map') && !L.views.operaciones.render().includes('data-action="start-route"'));
    DB.reset();return results;
  };
})(window.LlajtaVoy);
