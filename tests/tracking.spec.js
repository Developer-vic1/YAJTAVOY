(function(L){
  'use strict';
  L.verifyTracking=async function(){
    const DB=L.core.DatabaseService,T=L.services.TrackingService,G=L.core.ApiGateway,results=[],check=(name,v)=>{if(!v)throw Error(name);results.push({name,status:'PASS'});};
    const d=DB.getDrivers()[0],r=DB.getRestaurants()[0],seed=L.seed();
    const order={id:'MAP-QA',restaurantId:r.id,driverId:d.id,status:'DRIVER_ASSIGNED',lat:seed.customer.lat,lng:seed.customer.lng,customerId:'c1',correlationId:'map-qa',history:[],tracking:null};
    DB.change(s=>{s.orders.push(order);d.orderId=order.id;d.status='ASSIGNED';});
    const context={actor:'driver',driverId:d.id};T.start(order.id,'restaurant');T.pause(order.id);
    check('La ruta comienza con geometría vial y velocidades explícitas',order.tracking.routePlan.source==='osm-local-v1' && order.tracking.points.length>10 && order.tracking.speedKmh===24 && order.tracking.speedScale===10);
    await G.request('PATCH','/api/tracking/'+order.id,{speedScale:30},context);check('El repartidor asignado puede ajustar la reproducción por el gateway',order.tracking.speedScale===30 && !T.isRunning(order.id));
    let invalid=false;try{await G.request('PATCH','/api/tracking/'+order.id,{speedScale:99},context);}catch(e){invalid=e.status===422;}check('Ritmos inválidos se rechazan y conservan el valor previo',invalid && order.tracking.speedScale===30);
    let scoped=false;try{await G.request('PATCH','/api/tracking/'+order.id,{speedScale:1},{actor:'driver',driverId:'d2'});}catch(e){scoped=e.status===403;}check('Otro repartidor no modifica el ritmo de un pedido ajeno',scoped && order.tracking.speedScale===30);
    order.tracking.progress=.2;order.tracking.position=L.maps.Routes.at(order.tracking.points,.2);const before=order.tracking.position.slice();T.start(order.id,'restaurant');T.pause(order.id);
    check('Pausa y reanudación conservan progreso y posición',order.tracking.progress===.2 && order.tracking.position[0]===before[0]);
    delete order.tracking.routePlan;order.tracking.running=true;T.resume();T.pause(order.id);
    check('Una ruta antigua se migra desde su última posición sin borrar el pedido',order.tracking.routePlan.source==='osm-local-v1' && order.tracking.points[0][0]===before[0] && DB.getOrder(order.id)===order);
    order.status='PICKED_UP';order.lat=-18;const oldTrack=order.tracking;let failed=false;try{T.start(order.id,'customer');}catch(e){failed=e.status===422;}
    check('Un destino sin cobertura no cambia el pedido a En camino ni reemplaza el tramo',failed && order.status==='PICKED_UP' && order.tracking===oldTrack && !T.isRunning(order.id));
    DB.reset();return results;
  };
})(window.LlajtaVoy);
