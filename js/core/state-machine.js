(function (L) {
  'use strict';
  const transitions = {
    CREATED: ['PAYMENT_PENDING','CANCELLED'], PAYMENT_PENDING: ['PAYMENT_APPROVED','PAYMENT_REJECTED'], PAYMENT_APPROVED: ['SENT_TO_RESTAURANT','CANCELLED'], SENT_TO_RESTAURANT: ['ACCEPTED','RESTAURANT_REJECTED','CANCELLED'], ACCEPTED: ['PREPARING','CANCELLED'], PREPARING: ['READY_FOR_PICKUP','CANCELLED'], READY_FOR_PICKUP: ['DRIVER_SEARCHING','CANCELLED'], DRIVER_SEARCHING: ['DRIVER_ASSIGNED','CANCELLED'], DRIVER_ASSIGNED: ['PICKED_UP','DELIVERY_FAILED'], PICKED_UP: ['ON_ROUTE','DELIVERY_FAILED'], ON_ROUTE: ['ARRIVING','DELIVERY_FAILED'], ARRIVING: ['DELIVERED','DELIVERY_FAILED'], DELIVERED: [], PAYMENT_REJECTED: [], RESTAURANT_REJECTED: [], CANCELLED: [], DELIVERY_FAILED: []
  };
  const labels = { CREATED: 'Creado', PAYMENT_PENDING: 'Procesando pago', PAYMENT_APPROVED: 'Pago aprobado', SENT_TO_RESTAURANT: 'Enviado al restaurante', ACCEPTED: 'Aceptado', PREPARING: 'Preparando', READY_FOR_PICKUP: 'Listo para recoger', DRIVER_SEARCHING: 'Buscando repartidor', DRIVER_ASSIGNED: 'Repartidor asignado', PICKED_UP: 'Pedido recogido', ON_ROUTE: 'En camino', ARRIVING: 'Llegando', DELIVERED: 'Entregado', PAYMENT_REJECTED: 'Pago rechazado', RESTAURANT_REJECTED: 'Restaurante rechazó', CANCELLED: 'Cancelado', DELIVERY_FAILED: 'Entrega fallida' };
  L.core.StateMachine = { transitions, labels, terminal: ['DELIVERED','PAYMENT_REJECTED','RESTAURANT_REJECTED','CANCELLED','DELIVERY_FAILED'], label: status => labels[status] || status,
    move(order, next) { if (!(transitions[order.status] || []).includes(next)) L.fail('Transición no permitida: ' + order.status + ' → ' + next); L.core.DatabaseService.change(() => { order.status = next; order.updatedAt = L.now(); order.history.push({ status: next, timestamp: order.updatedAt }); }, 'order:updated'); return order; }
  };
})(window.LlajtaVoy);
