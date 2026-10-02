(function (L) {
  const DB = L.core.DatabaseService, B = L.core.EventBroker;
  L.services.DriverService = {
    consumeOffer(event) { if (!DB.state.offerInbox.some(i => i.eventId===event.eventId)) DB.change(s => s.offerInbox.push({ eventId:event.eventId,driverId:event.payload.driverId,orderId:event.payload.orderId,timestamp:L.now() }),'driver:updated'); },
    get(id) { const d = DB.getDrivers().find(d => d.id === id); if (!d) L.fail('Repartidor no encontrado',404); return d; },
    availability(id,available) { const d = this.get(id); if (d.orderId) L.fail('Finaliza o rechaza la entrega actual'); DB.change(() => { d.status = available ? 'AVAILABLE' : 'OFFLINE'; },'driver:updated'); L.services.DispatchService.scan(); return d; },
    accept(orderId,id) { const o = DB.getOrder(orderId), d = this.get(id); if (o.offeredDriverId !== id || d.status !== 'OFFERED' || o.status !== 'DRIVER_SEARCHING') L.fail('La oferta ya no está disponible'); DB.change(() => { o.driverId = id; o.offeredDriverId = null; d.status = 'ACCEPTED'; },'driver:updated'); B.publish('driver.offer.accepted',{ orderId, driverId: id },'DriverService',o.correlationId); L.core.StateMachine.move(o,'DRIVER_ASSIGNED'); B.publish('driver.assigned',{ orderId, driverId: id },'DriverService',o.correlationId); return o; },
    reject(orderId,id) { const o = DB.getOrder(orderId), d = this.get(id); if (o.offeredDriverId !== id) L.fail('Esta oferta no está asignada a este repartidor',403); DB.change(() => { o.rejectedDrivers.push(id); o.offeredDriverId = null; d.status = 'AVAILABLE'; d.orderId = null; },'driver:updated'); B.publish('driver.offer.rejected',{ orderId, driverId: id },'DriverService',o.correlationId); L.services.DispatchService.offer(o); return o; },
    release(o,delivered) { const ids = [o.driverId,o.offeredDriverId].filter(Boolean); DB.change(() => { for (const id of ids) { const d = this.get(id); d.status = 'AVAILABLE'; d.orderId = null; if (delivered) d.deliveries++; } o.offeredDriverId = null; },'driver:updated'); L.services.DispatchService.scan(); }
  };
})(window.LlajtaVoy);
