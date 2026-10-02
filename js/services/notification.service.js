(function (L) {
  const DB = L.core.DatabaseService, B = L.core.EventBroker;
  const texts = { 'order.created': 'Tu pedido fue confirmado', 'order.accepted': 'El restaurante aceptó tu pedido', 'order.preparing': 'Tu pedido está siendo preparado', 'order.ready': 'Tu pedido está listo', 'order.rejected': 'El restaurante rechazó el pedido; el pago fue revertido', 'order.cancelled': 'Tu pedido fue cancelado; el pago fue revertido', 'payment.rejected': 'El pago fue rechazado. Puedes crear un nuevo pedido', 'driver.assigned': 'Encontramos un repartidor', 'delivery.picked_up': 'Tu repartidor recogió el pedido', 'delivery.arriving': 'Tu pedido está cerca', 'delivery.delivered': 'Pedido entregado', 'delivery.failed': 'La entrega no pudo completarse; el pago fue revertido' };
  L.services.NotificationService = {
    patterns: Object.keys(texts),
    consume(event) { const orderId = event.payload.orderId; if (!orderId) return; let n = DB.state.notifications.find(n => n.sourceEventId === event.eventId); if (n?.status === 'SENT') return; if (!n) { n = { id: L.id('ntf-'), orderId, sourceEventId: event.eventId, customerId: DB.getOrder(orderId).customerId, text: texts[event.routingKey], status: 'CREATED', read: false, timestamp: L.now() }; DB.change(s => s.notifications.push(n)); B.publish('notification.created',{ notificationId: n.id, orderId },'NotificationService',event.correlationId); }
      if (DB.consumeFlag('failNotification')) { DB.change(() => { n.status = 'FAILED'; }); B.publish('notification.failed',{ notificationId: n.id, orderId },'NotificationService',event.correlationId); throw new Error('No fue posible enviar la notificación'); }
      DB.change(() => { n.status = 'SENT'; n.sentAt = L.now(); }); B.publish('notification.sent',{ notificationId: n.id, orderId },'NotificationService',event.correlationId);
    }, read(id,value) { const n = DB.state.notifications.find(n => n.id === id); if (!n) L.fail('Notificación no encontrada',404); DB.change(() => { n.read = value; }); }
  };
})(window.LlajtaVoy);
