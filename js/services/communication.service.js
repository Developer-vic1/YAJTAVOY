(function(L){
  'use strict';const DB=L.core.DatabaseService;
  const actors=['client','restaurant','driver','admin'],key=c=>c.actor+':'+(c.customerId || c.restaurantId || c.driverId || 'admin');
  const context=(actor,id)=>({actor,...(actor==='client'?{customerId:id}:actor==='restaurant'?{restaurantId:id}:actor==='driver'?{driverId:id}:{})});
  const name=c=>c.actor==='admin'?'Operaciones':c.actor==='restaurant'?L.services.CatalogService.restaurant(c.restaurantId).name:c.actor==='driver'?L.services.DriverService.get(c.driverId).name:c.customerId==='c1'?DB.state.customer.name:DB.getOrders().find(o=>o.customerId===c.customerId)?.customerName || 'Cliente';
  const service=L.services.CommunicationService={
    key,context,name,
    list(c){if(!actors.includes(c.actor))L.fail('Actor no autorizado para mensajes',403);return (DB.state.communications || []).filter(m=>m.from===key(c) || m.to===key(c));},
    send(data,c){
      if(!actors.includes(c.actor) || !actors.includes(data.actor))L.fail('Actor no autorizado para mensajes',403);
      if(typeof data.text!=='string' || !data.text.trim() || data.text.trim().length>500)L.fail('Escribe un mensaje entre 1 y 500 caracteres',422);
      const recipient=context(data.actor,data.recipient),to=key(recipient),from=key(c);if(to===from)L.fail('Elige otro destinatario',422);
      if(['driver','restaurant'].includes(recipient.actor))name(recipient);
      if(recipient.actor==='client' && recipient.customerId!=='c1' && !DB.getOrders().some(o=>o.customerId===recipient.customerId))L.fail('Cliente no encontrado',404);
      let order=data.orderId?DB.getOrder(data.orderId):null;
      const own=o=>c.actor==='admin' || (c.actor==='client' && o.customerId===c.customerId) || (c.actor==='restaurant' && o.restaurantId===c.restaurantId) || (c.actor==='driver' && o.driverId===c.driverId);
      if(order && !own(order))L.fail('Pedido de otro actor',403);
      const staff=c.actor==='admin' || recipient.actor==='admin';
      const linked=order && !L.core.StateMachine.terminal.includes(order.status) && order.driverId && ((c.actor==='restaurant' && recipient.actor==='driver' && order.restaurantId===c.restaurantId && order.driverId===recipient.driverId) || (c.actor==='driver' && recipient.actor==='restaurant' && order.driverId===c.driverId && order.restaurantId===recipient.restaurantId) || (c.actor==='client' && recipient.actor==='driver' && order.customerId===c.customerId && order.driverId===recipient.driverId) || (c.actor==='driver' && recipient.actor==='client' && order.driverId===c.driverId && order.customerId===recipient.customerId));
      if(!staff && !linked)L.fail('Solo puedes comunicarte con actores de tu entrega activa o con Operaciones',403);
      const message={id:L.id('chat-'),from,to,senderName:name(c),recipientName:name(recipient),orderId:order?.id || null,text:data.text.trim(),timestamp:L.now(),read:false,source:'local-demo'};
      DB.change(s=>{s.communications ||= [];s.communications.push(message);},'communication:updated');return message;
    },
    read(id,c){const m=(DB.state.communications || []).find(m=>m.id===id);if(!m)L.fail('Mensaje no encontrado',404);if(m.to!==key(c))L.fail('No eres el destinatario',403);DB.change(()=>{m.read=true;},'communication:updated');return m;}
  };
})(window.LlajtaVoy);
