(function(L){
  'use strict';L.verifyCommunication=async function(){
    const DB=L.core.DatabaseService,G=L.core.ApiGateway,S=L.services.CommunicationService,results=[];
    const check=(name,v)=>{if(!v)throw Error(name);results.push({name,status:'PASS'});},send=async(data,c)=>(await G.request('POST','/api/messages',data,c)).data,fail=async(fn,status)=>{try{await fn();return false;}catch(e){return e.status===status;}};
    DB.reset();const admin={actor:'admin'},driver={actor:'driver',driverId:'d1'},otherDriver={actor:'driver',driverId:'d2'},restaurant={actor:'restaurant',restaurantId:'r1'},client={actor:'client',customerId:'c1'};
    const announcement=await send({actor:'driver',recipient:'d1',text:'Aviso operativo local'},admin);
    check('Operaciones puede contactar a un repartidor libre',announcement.source==='local-demo' && S.list(driver).length===1);
    check('Otro repartidor no ve el mensaje',S.list(otherDriver).length===0);
    check('Remitente no marca leído por el destinatario',await fail(()=>G.request('PATCH','/api/messages/'+announcement.id+'/read',{},admin),403));
    await G.request('PATCH','/api/messages/'+announcement.id+'/read',{},driver);check('El destinatario marca leído y el remitente ve esa lectura',S.list(admin)[0].read);
    await send({actor:'admin',recipient:'admin',text:'Recibido'},driver);check('El repartidor responde a operaciones',S.list(admin).some(m=>m.from==='driver:d1' && m.to==='admin:admin'));
    check('Mensajes vacíos y largos se rechazan',await fail(()=>send({actor:'admin',recipient:'admin',text:' '},driver),422) && await fail(()=>send({actor:'admin',recipient:'admin',text:'a'.repeat(501)},driver),422));
    DB.state.orders.push({id:'CHAT-QA',restaurantId:'r1',driverId:'d1',customerId:'c1',status:'ON_ROUTE',customerName:'Andrea'});
    await send({actor:'driver',recipient:'d1',orderId:'CHAT-QA',text:'El pedido está listo'},restaurant);
    check('La cocina contacta al repartidor de su pedido activo',S.list(driver).some(m=>m.orderId==='CHAT-QA' && m.from==='restaurant:r1'));
    await send({actor:'driver',recipient:'d1',orderId:'CHAT-QA',text:'Por favor toca el timbre'},client);
    await send({actor:'client',recipient:'c1',orderId:'CHAT-QA',text:'Estoy llegando'},driver);
    check('Cliente y repartidor se comunican durante su entrega',S.list(client).length===2 && S.list(client).some(m=>m.from==='driver:d1'));
    check('No se permite contactar a otro repartidor de la ciudad',await fail(()=>send({actor:'driver',recipient:'d2',orderId:'CHAT-QA',text:'Hola'},client),403));
    check('Una cocina ajena no usa ese canal',await fail(()=>send({actor:'driver',recipient:'d1',orderId:'CHAT-QA',text:'Hola'},{actor:'restaurant',restaurantId:'r2'}),403));
    DB.state.orders[0].status='DELIVERED';check('El canal directo de la entrega se cierra al finalizar',await fail(()=>send({actor:'client',recipient:'c1',orderId:'CHAT-QA',text:'Hola'},driver),403));
    const saved=DB.state.communications.length;DB.init();check('Mensajes y lectura sobreviven la recarga de datos',DB.state.communications.length===saved && DB.state.communications[0].read);
    check('Proveedor de pagos no consulta mensajes personales',await fail(()=>G.request('GET','/api/messages',{}, {actor:'payment-provider',providerId:'local-payment-provider'}),403));
    DB.reset();check('Restablecer elimina mensajes operativos',DB.state.communications.length===0);return results;
  };
})(window.LlajtaVoy);
