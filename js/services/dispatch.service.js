(function (L) {
  const DB = L.core.DatabaseService, B = L.core.EventBroker, SM = L.core.StateMachine;
  L.services.DispatchService = {
    search(event) { const o = DB.getOrder(event.payload.orderId); if (o.status === 'READY_FOR_PICKUP') { SM.move(o,'DRIVER_SEARCHING'); B.publish('driver.search.started',{ orderId: o.id },'DispatchService',o.correlationId); } if (o.status === 'DRIVER_SEARCHING' && !o.offeredDriverId) this.offer(o); },
    offer(o) { const r = L.services.CatalogService.restaurant(o.restaurantId); const candidates = DB.getDrivers().filter(d => d.status === 'AVAILABLE' && !o.rejectedDrivers.includes(d.id)).map(d => { try { const profile=L.maps.StreetNetwork.profile(d.vehicle); const route=L.maps.Routes.plan([d.lat,d.lng],[r.lat,r.lng],profile); L.maps.Routes.plan([r.lat,r.lng],[o.lat,o.lng],profile); return {d,km:route.totalKm}; } catch (_) { return null; } }).filter(Boolean).sort((a,b) => a.km-b.km); const d=candidates[0]?.d; if (!d) return;
      DB.change(() => { o.offeredDriverId = d.id; d.status = 'OFFERED'; d.orderId = o.id; },'driver:updated'); B.publish('driver.offer.created',{ orderId: o.id, driverId: d.id },'DispatchService',o.correlationId);
      if (DB.consumeFlag('rejectOffer')) L.services.DriverService.reject(o.id,d.id);
    },
    scan() { for (const o of DB.getOrders()) if (o.status === 'DRIVER_SEARCHING' && !o.offeredDriverId) this.offer(o); }
  };
})(window.LlajtaVoy);
