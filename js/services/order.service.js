(function (L) {
  'use strict';
  const DB = L.core.DatabaseService, B = L.core.EventBroker, SM = L.core.StateMachine;
  const eventFor = { ACCEPTED: 'order.accepted', PREPARING: 'order.preparing', READY_FOR_PICKUP: 'order.ready', RESTAURANT_REJECTED: 'order.rejected', CANCELLED: 'order.cancelled', PICKED_UP: 'delivery.picked_up', ON_ROUTE: 'delivery.on_route', ARRIVING: 'delivery.arriving', DELIVERED: 'delivery.delivered', DELIVERY_FAILED: 'delivery.failed' };
  L.services.OrderService = {
    create(data,context) {
      if (!data.items?.length || !data.address?.trim() || !data.customerName?.trim()) L.fail('Completa tu nombre, dirección y carrito',422);
      if (!['Efectivo','QR','Tarjeta'].includes(data.paymentMethod)) L.fail('Método de pago inválido',422);
      if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng) || data.lat < -17.45 || data.lat > -17.33 || data.lng < -66.23 || data.lng > -66.09) L.fail('Selecciona una ubicación dentro de Cochabamba',422);
      if (DB.state.unavailable.includes('PaymentService')) L.fail('PaymentService no disponible',503);
      const restaurant = L.services.CatalogService.restaurant(data.restaurantId); if (!restaurant.open) L.fail('El restaurante está cerrado',409);
      const items = data.items.map(item => { const p = DB.state.products.find(p => p.id === item.productId && p.restaurantId === restaurant.id && p.available); if (!p || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) L.fail('Producto o cantidad inválida',422); return { productId: p.id, name: p.name, quantity: item.quantity, price: p.price }; });
      L.maps.Routes.plan([restaurant.lat,restaurant.lng],[data.lat,data.lng]);
      const subtotal = items.reduce((n,i) => n+i.price*i.quantity,0);
      const order = { id: 'CB-'+(++DB.state.sequence), customerId: context.customerId, customerName: data.customerName.trim(), restaurantId: restaurant.id, restaurantName: restaurant.name, items, subtotal, delivery: restaurant.delivery, total: subtotal+restaurant.delivery, address: data.address.trim(), notes: (data.notes || '').slice(0,500), lat: data.lat, lng: data.lng, paymentMethod: data.paymentMethod, correlationId: L.id('corr-'), status: 'CREATED', driverId: null, offeredDriverId: null, rejectedDrivers: [], createdAt: L.now(), updatedAt: L.now(), history: [{ status: 'CREATED', timestamp: L.now() }], tracking: null };
      DB.saveOrder(order); SM.move(order,'PAYMENT_PENDING'); const p = L.services.PaymentService.process(order);
      if (p.status === 'REJECTED') { SM.move(order,'PAYMENT_REJECTED'); return order; }
      SM.move(order,'PAYMENT_APPROVED'); B.publish('order.created',{ orderId: order.id },'OrderService',order.correlationId); return order;
    },
    status(id,next) { const o = DB.getOrder(id);
      if (next === 'PICKED_UP' && (!o.tracking || o.tracking.leg !== 'restaurant' || !o.tracking.arrived)) L.fail('Debes llegar al restaurante antes de recoger');
      if (next === 'DELIVERED' && (!o.tracking || o.tracking.leg !== 'customer' || !o.tracking.arrived)) L.fail('Debes llegar al destino antes de confirmar');
      SM.move(o,next); if (['CANCELLED','RESTAURANT_REJECTED','DELIVERY_FAILED'].includes(next)) { L.services.PaymentService.refund(o); L.services.TrackingService.stop(id); if (o.tracking) DB.change(() => { o.tracking.running=false; }); L.services.DriverService.release(o); }
      if (next === 'DELIVERED') { DB.change(() => { o.deliveredAt = L.now(); }); L.services.DriverService.release(o,true); }
      if (eventFor[next]) B.publish(eventFor[next],{ orderId: id, status: next },'OrderService',o.correlationId); return o;
    }
  };
})(window.LlajtaVoy);
