(function(L){
  'use strict'; const E=L.escape,I=L.ui.icon;
  const roles={
    cliente:['shopping_cart','Tu pedido, de la cocina a tu puerta','Explora el menú, elige tu dirección, paga y sigue tus propios pedidos.','Tus pedidos · Tus direcciones · Tus comprobantes'],
    restaurante:['restaurant','Tu cocina y tus pedidos','Acepta o rechaza pedidos, prepara la comida y entrégala al repartidor. Administra el menú de tu establecimiento.','Establecimiento seleccionado · Pedidos asignados'],
    repartidor:['two_wheeler','Tu siguiente entrega','Conéctate, acepta una oferta, llega a la cocina, recoge el pedido y confirma la entrega al llegar.','Repartidor seleccionado · Entregas asignadas'],
    operaciones:['monitoring','Toda la operación, bajo supervisión','Supervisa entregas, gestiona altas e incidentes y revisa las acciones administrativas.','Pedidos, equipo y atención de incidentes'],
    middleware:['hub','Cada mensaje tiene un recorrido','','Vista técnica del administrador · Gateway y broker locales'],
    arquitectura:['account_tree','Entiende cómo se conecta el sistema','Explora los componentes, actores y límites de esta demostración ejecutada en el navegador.','Vista técnica del administrador · Diseño y contratos'],
    pagos:['payments','Pagos y sus notificaciones','El proveedor local procesa automáticamente las transacciones y publica su resultado. Revisa estados y comprobantes.','Cobros, estados y reembolsos']
  };
  L.ui.roleIntro=view=>{const r=roles[view];return r?'<section class="role-intro role-'+view+'"><div class="role-emblem" aria-hidden="true">'+I(r[0])+'</div><div><strong>'+r[1]+'</strong><p>'+r[2]+'</p><small>'+r[3]+' · Tu espacio de trabajo</small></div></section>':'';};
  L.ui.deliveryStage=o=>{
    const status=o.status,terminal=L.core.StateMachine.terminal.includes(status);
    const phase=status==='DELIVERED'?4:['ON_ROUTE','ARRIVING'].includes(status)?3:['DRIVER_ASSIGNED','PICKED_UP'].includes(status)?2:['PREPARING','READY_FOR_PICKUP','DRIVER_SEARCHING'].includes(status)?1:0;
    const phrases={PREPARING:'Tu comida se está preparando',DRIVER_SEARCHING:'Buscando un repartidor disponible',DRIVER_ASSIGNED:'El repartidor va a recoger el pedido',PICKED_UP:'Pedido recogido · falta iniciar el tramo al cliente',ON_ROUTE:'Tu pedido va en camino',ARRIVING:'El repartidor está llegando',DELIVERED:'Entrega completada'};
    const pickup=o.tracking?.leg==='restaurant' && status!=='PICKED_UP';
    const moving=!!o.tracking?.running && !terminal,progress=status==='PICKED_UP' && o.tracking?.leg==='restaurant'?0:o.tracking?.progress || 0;
    return '<div class="delivery-stage"><p class="delivery-state" role="status" aria-live="polite" aria-atomic="true">'+I(terminal?(status==='DELIVERED'?'check_circle':'warning'):moving?'two_wheeler':'restaurant')+'<strong>'+E(phrases[status] || L.core.StateMachine.label(status))+'</strong></p><div class="delivery-scene '+(moving?'moving':'')+' '+(status==='PREPARING'?'cooking':'')+'" data-track="'+o.id+'" data-metric="scene" style="--journey:'+progress+'" aria-hidden="true"><span class="scene-kitchen">'+I(pickup?'location_on':'restaurant')+'<i class="steam"></i></span><span class="scene-road"></span><span class="scene-rider">'+I('two_wheeler')+'<i class="delivery-box"></i></span><span class="scene-home">'+I(pickup?'restaurant':'home')+'</span></div><ol class="delivery-steps" aria-label="Etapas del pedido">'+[['Pedido','receipt_long'],['Cocina','restaurant'],['Recogida','two_wheeler'],['En camino','route'],['Entrega','check_circle']].map(([text,icon],n)=>'<li class="'+(n<phase?'done':n===phase?'current':'')+'" '+(n===phase?'aria-current="step"':'')+'>'+I(icon)+'<span>'+text+'</span></li>').join('')+'</ol></div>';
  };
})(window.LlajtaVoy);
